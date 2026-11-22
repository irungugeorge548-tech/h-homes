const express = require('express');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const router = express.Router();

// A tenant applies for a home.
router.post('/', auth, async (req, res) => {
  const home = await prisma.home.findUnique({ where: { id: String(req.body?.homeId || '') } });
  if (!home || home.status !== 'AVAILABLE') return res.status(400).json({ error: 'This home is no longer available' });
  if (home.ownerId === req.userId) return res.status(400).json({ error: 'This is your own listing' });
  if (await prisma.application.findFirst({ where: { homeId: home.id, applicantId: req.userId, status: 'PENDING' } })) return res.status(400).json({ error: 'You have already applied for this home' });
  const a = await prisma.application.create({ data: { homeId: home.id, applicantId: req.userId, applicantName: req.user.name, applicantPhone: req.user.phone, message: String(req.body?.message || '').trim().slice(0, 500) || null } });
  res.json(a);
});

// The tenant's own applications
router.get('/mine', auth, async (req, res) => {
  const apps = await prisma.application.findMany({ where: { applicantId: req.userId }, orderBy: { createdAt: 'desc' } });
  const out = [];
  for (const a of apps) { const h = await prisma.home.findUnique({ where: { id: a.homeId } }); out.push({ ...a, home: h ? { id: h.id, title: h.title, area: h.area, rent: h.rent } : null }); }
  res.json(out);
});

router.post('/:id/withdraw', auth, async (req, res) => {
  const r = await prisma.application.updateMany({ where: { id: req.params.id, applicantId: req.userId, status: 'PENDING' }, data: { status: 'WITHDRAWN' } });
  if (!r.count) return res.status(400).json({ error: 'This application can no longer be withdrawn' });
  res.json({ ok: true });
});

// The landlord's inbox: applications waiting on their homes
router.get('/received', auth, async (req, res) => {
  const homes = await prisma.home.findMany({ where: { ownerId: req.userId } });
  const out = [];
  for (const h of homes) {
    const apps = await prisma.application.findMany({ where: { homeId: h.id, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
    for (const a of apps) out.push({ ...a, home: { id: h.id, title: h.title, area: h.area, rent: h.rent } });
  }
  res.json(out);
});

async function theirs(req, res) {
  const a = await prisma.application.findUnique({ where: { id: req.params.id } });
  const h = a && await prisma.home.findUnique({ where: { id: a.homeId } });
  if (!a || !h || h.ownerId !== req.userId) { res.status(404).json({ error: 'Application not found' }); return {}; }
  if (a.status !== 'PENDING') { res.status(400).json({ error: 'This application has already been answered' }); return {}; }
  return { a, h };
}

router.post('/:id/decline', auth, async (req, res) => {
  const { a } = await theirs(req, res); if (!a) return;
  await prisma.application.updateMany({ where: { id: a.id, status: 'PENDING' }, data: { status: 'DECLINED' } });
  res.json({ ok: true });
});

// Approving makes the applicant the tenant: the home becomes occupied and rent starts.
router.post('/:id/approve', auth, async (req, res) => {
  const { a, h } = await theirs(req, res); if (!a) return;
  if (h.status !== 'AVAILABLE') return res.status(400).json({ error: 'This home is not available any more' });
  const dueDay = Math.min(28, Math.max(1, parseInt(req.body?.dueDay || 5, 10) || 5));
  try {
    const t = await prisma.$transaction(async (tx) => {
      const claim = await tx.home.updateMany({ where: { id: h.id, status: 'AVAILABLE' }, data: { status: 'OCCUPIED' } });
      if (claim.count !== 1) throw new Error('TAKEN');
      await tx.application.update({ where: { id: a.id }, data: { status: 'APPROVED' } });
      await tx.application.updateMany({ where: { homeId: h.id, status: 'PENDING' }, data: { status: 'DECLINED' } });
      return tx.tenancy.create({ data: { homeId: h.id, ownerId: h.ownerId, tenantId: a.applicantId, tenantName: a.applicantName, tenantPhone: a.applicantPhone, dueDay, rentAmount: h.rent } });
    });
    res.json(t);
  } catch (err) {
    res.status(err.message === 'TAKEN' ? 400 : 500).json({ error: err.message === 'TAKEN' ? 'This home is not available any more' : 'Could not approve. Please try again.' });
  }
});

module.exports = router;
