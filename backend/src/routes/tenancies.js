const express = require('express');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const hpesa = require('../lib/hpesa');
const rent = require('../lib/rent');
const { normalizePhone, validPhone } = require('../lib/session');
const S = require('../lib/security');
const router = express.Router();

const homeCard = (h) => h && { id: h.id, title: h.title, area: h.area, address: h.address, rent: h.rent, bedrooms: h.bedrooms, type: h.type };

async function shape(t) {
  const [home, payments, owner] = await Promise.all([
    prisma.home.findUnique({ where: { id: t.homeId } }),
    prisma.rentPayment.findMany({ where: { tenancyId: t.id }, orderBy: { createdAt: 'desc' } }),
    prisma.user.findUnique({ where: { id: t.ownerId } }),
  ]);
  const cover = home ? (await prisma.homePhoto.findFirst({ where: { homeId: home.id }, orderBy: { position: 'asc' } }))?.id || null : null;
  return {
    ...t, home: homeCard(home), cover,
    landlord: { name: owner?.name || 'Landlord', phone: owner?.phone || '', canReceive: !!owner?.hpesaPhone },
    ...rent.summary(t, payments),
    payments: payments.filter((p) => p.status === 'COMPLETED').slice(0, 24),
  };
}

// The tenant's homes (usually one)
router.get('/my', auth, async (req, res) => {
  const list = await prisma.tenancy.findMany({ where: { tenantId: req.userId, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
  res.json(await Promise.all(list.map(shape)));
});

// The landlord's tenants with what each owes, and the month's money
router.get('/landlord', auth, async (req, res) => {
  const list = await prisma.tenancy.findMany({ where: { ownerId: req.userId, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
  const tenants = await Promise.all(list.map(shape));
  const all = await prisma.rentPayment.findMany({ where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } });
  const ids = new Set((await prisma.tenancy.findMany({ where: { ownerId: req.userId } })).map((t) => t.id));
  const mineP = all.filter((p) => ids.has(p.tenancyId));
  const m = new Date(); const monthStart = new Date(m.getFullYear(), m.getMonth(), 1);
  const names = new Map((await prisma.tenancy.findMany({ where: { ownerId: req.userId } })).map((t) => [t.id, t]));
  res.json({
    tenants,
    totals: {
      receivedThisMonth: mineP.filter((p) => new Date(p.createdAt) >= monthStart).reduce((a, p) => a + p.amount, 0),
      outstanding: tenants.reduce((a, t) => a + t.balance, 0),
      lateCount: tenants.filter((t) => t.late).length,
    },
    payments: mineP.slice(0, 50).map((p) => ({ ...p, tenantName: names.get(p.tenancyId)?.tenantName, home: tenants.find((t) => t.id === p.tenancyId)?.home?.title || '' })),
  });
});

// A landlord adds a tenant directly (the tenant needs an H-Homes account).
router.post('/', auth, async (req, res) => {
  const home = await prisma.home.findUnique({ where: { id: String(req.body?.homeId || '') } });
  if (!home || home.ownerId !== req.userId) return res.status(404).json({ error: 'Home not found' });
  if (home.status === 'OCCUPIED') return res.status(400).json({ error: 'This home already has a tenant' });
  const phone = normalizePhone(req.body?.phone);
  if (!validPhone(phone)) return res.status(400).json({ error: 'Enter the tenant\'s phone number' });
  const tenant = await prisma.user.findUnique({ where: { phone } });
  if (!tenant) return res.status(404).json({ error: 'No H-Homes account for that number. Ask them to sign up first, then add them.' });
  if (tenant.id === req.userId) return res.status(400).json({ error: 'You cannot be your own tenant' });
  const dueDay = Math.min(28, Math.max(1, parseInt(req.body?.dueDay || 5, 10) || 5));
  try {
    const t = await prisma.$transaction(async (tx) => {
      const claim = await tx.home.updateMany({ where: { id: home.id, status: { in: ['AVAILABLE', 'HIDDEN'] } }, data: { status: 'OCCUPIED' } });
      if (claim.count !== 1) throw new Error('TAKEN');
      await tx.application.updateMany({ where: { homeId: home.id, status: 'PENDING' }, data: { status: 'DECLINED' } });
      return tx.tenancy.create({ data: { homeId: home.id, ownerId: req.userId, tenantId: tenant.id, tenantName: tenant.name, tenantPhone: tenant.phone, dueDay, rentAmount: home.rent } });
    });
    res.json(t);
  } catch { res.status(400).json({ error: 'This home already has a tenant' }); }
});

router.post('/:id/end', auth, async (req, res) => {
  const t = await prisma.tenancy.findUnique({ where: { id: req.params.id } });
  if (!t || t.ownerId !== req.userId || t.status !== 'ACTIVE') return res.status(404).json({ error: 'Tenancy not found' });
  await prisma.tenancy.update({ where: { id: t.id }, data: { status: 'ENDED' } });
  await prisma.home.update({ where: { id: t.homeId }, data: { status: 'AVAILABLE' } });
  res.json({ ok: true });
});

// Pay rent from the tenant's H-Pesa wallet straight into the landlord's wallet.
// amount = full balance, or any smaller amount (Lipa Mdogo Mdogo) of at least KES 100.
router.post('/:id/pay', auth, S.rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }), async (req, res) => {
  const t = await prisma.tenancy.findUnique({ where: { id: req.params.id } });
  if (!t || t.tenantId !== req.userId || t.status !== 'ACTIVE') return res.status(404).json({ error: 'Tenancy not found' });
  if (!req.user.hpesaPhone) return res.status(403).json({ error: 'Connect your H-Pesa wallet to pay rent', code: 'NOT_LINKED' });
  const owner = await prisma.user.findUnique({ where: { id: t.ownerId } });
  if (!owner?.hpesaPhone) return res.status(400).json({ error: 'Your landlord has not connected a wallet to receive rent yet. Please ask them to.', code: 'LANDLORD_NO_WALLET' });
  const pin = String(req.body?.pin || '');
  if (!pin) return res.status(400).json({ error: 'Enter your H-Pesa PIN' });

  const open = await prisma.rentPayment.findFirst({ where: { tenancyId: t.id, status: 'PENDING' } });
  if (open) return res.status(409).json({ error: 'A payment is still being processed. Wait a moment and try again.' });

  const existing = await prisma.rentPayment.findMany({ where: { tenancyId: t.id } });
  const sum = rent.summary(t, existing);
  if (sum.balance <= 0) return res.status(400).json({ error: 'You are all paid up. Nothing is due.' });
  const amount = Math.round(Number(req.body?.amount));
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Enter an amount' });
  if (amount > sum.balance) return res.status(400).json({ error: `You only owe KES ${sum.balance}` });
  if (amount < Math.min(rent.MIN_PART, sum.balance)) return res.status(400).json({ error: `The smallest instalment is KES ${rent.MIN_PART}` });

  const home = await prisma.home.findUnique({ where: { id: t.homeId } });
  const p = await prisma.rentPayment.create({ data: { tenancyId: t.id, payerId: req.userId, amount, reference: `rent:${cuidLike()}` } });
  const reference = p.reference;
  const fail = (reason) => prisma.rentPayment.update({ where: { id: p.id }, data: { status: 'FAILED', failReason: String(reason).slice(0, 200) } });
  const done = async () => {
    try { return res.json(await prisma.rentPayment.update({ where: { id: p.id }, data: { status: 'COMPLETED' } })); }
    catch { try { await hpesa.refund(reference, 'Rent could not be recorded'); } catch { /* reconciled via /status */ } return res.status(500).json({ error: 'We could not record your payment. Any money taken has been refunded.' }); }
  };
  try {
    await hpesa.charge({ phone: req.user.hpesaPhone, pin, amount, reference, toPhone: owner.hpesaPhone, description: `Rent: ${home?.title || 'home'}${amount < sum.balance ? ' (instalment)' : ''}` });
  } catch (err) {
    if (!err.status) {
      try { if ((await hpesa.status(reference)).status === 'COMPLETED') return done(); } catch { /* unknown: treat as failed; a reference is only ever charged once */ }
    }
    await fail(err.message);
    return res.status(err.status && err.status < 500 ? err.status : 503).json({ error: err.message });
  }
  return done();
});

function cuidLike() { return require('crypto').randomBytes(12).toString('hex'); }

// Maintenance requests
router.post('/:id/maintenance', auth, async (req, res) => {
  const t = await prisma.tenancy.findUnique({ where: { id: req.params.id } });
  if (!t || t.tenantId !== req.userId || t.status !== 'ACTIVE') return res.status(404).json({ error: 'Tenancy not found' });
  const title = String(req.body?.title || '').trim().slice(0, 80);
  if (title.length < 3) return res.status(400).json({ error: 'Say what needs fixing' });
  res.json(await prisma.maintenance.create({ data: { tenancyId: t.id, homeId: t.homeId, ownerId: t.ownerId, tenantId: t.tenantId, title, detail: String(req.body?.detail || '').trim().slice(0, 500) || null } }));
});

router.get('/maintenance/list', auth, async (req, res) => {
  const role = req.query.as === 'landlord' ? { ownerId: req.userId } : { tenantId: req.userId };
  const list = await prisma.maintenance.findMany({ where: role, orderBy: { createdAt: 'desc' }, take: 50 });
  const out = [];
  for (const m of list) { const h = await prisma.home.findUnique({ where: { id: m.homeId } }); const t = await prisma.tenancy.findUnique({ where: { id: m.tenancyId } }); out.push({ ...m, home: h?.title || '', tenantName: t?.tenantName || '' }); }
  res.json(out);
});

router.post('/maintenance/:mid/status', auth, async (req, res) => {
  const status = ['OPEN', 'IN_PROGRESS', 'DONE'].includes(req.body?.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ error: 'Invalid status' });
  const r = await prisma.maintenance.updateMany({ where: { id: req.params.mid, ownerId: req.userId }, data: { status } });
  if (!r.count) return res.status(404).json({ error: 'Request not found' });
  res.json({ ok: true });
});

module.exports = router;
