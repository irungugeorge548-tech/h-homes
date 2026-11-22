const express = require('express');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const S = require('../lib/security');
const router = express.Router();

const TYPES = ['BEDSITTER', 'STUDIO', 'APARTMENT', 'HOUSE', 'MAISONETTE'];
const clean = (v, n = 100) => String(v || '').trim().slice(0, n);
const PHOTO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTOS = 6;

async function withCovers(homes) {
  if (!homes.length) return [];
  const ids = homes.map((h) => h.id);
  const photos = await prisma.homePhoto.findMany({ where: { homeId: { in: ids } }, orderBy: { position: 'asc' } });
  return homes.map((h) => {
    const mine = photos.filter((p) => p.homeId === h.id);
    return { ...h, cover: mine[0]?.id || null, photoCount: mine.length };
  });
}

function fields(body) {
  const title = clean(body.title, 80), area = clean(body.area, 60);
  const rent = Number(body.rent), deposit = Number(body.deposit || 0), bedrooms = parseInt(body.bedrooms ?? 1, 10);
  if (title.length < 3) return { error: 'Give the home a short title' };
  if (area.length < 2) return { error: 'Enter the area, e.g. Kilimani' };
  if (!Number.isFinite(rent) || rent < 500 || rent > 5000000) return { error: 'Enter the monthly rent in KES' };
  if (!Number.isFinite(deposit) || deposit < 0 || deposit > 10000000) return { error: 'Enter a valid deposit (0 if none)' };
  if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 20) return { error: 'Enter the number of bedrooms (0 for a bedsitter)' };
  const type = TYPES.includes(body.type) ? body.type : 'APARTMENT';
  const amenities = (Array.isArray(body.amenities) ? body.amenities : String(body.amenities || '').split(',')).map((a) => clean(a, 30)).filter(Boolean).slice(0, 12).join(',');
  return { data: { title, area, address: clean(body.address, 120) || null, description: clean(body.description, 1500) || null, type, bedrooms, rent: Math.round(rent), deposit: Math.round(deposit), amenities } };
}

// Browse available homes. Filters are applied here because the list is small and this keeps queries simple.
router.get('/', auth, async (req, res) => {
  const { q, minRent, maxRent, bedrooms, type, sort } = req.query;
  let homes = await prisma.home.findMany({ where: { status: 'AVAILABLE' }, orderBy: { createdAt: 'desc' }, take: 300 });
  homes = homes.filter((h) => h.ownerId !== req.userId);
  if (q) { const t = String(q).toLowerCase(); homes = homes.filter((h) => `${h.title} ${h.area} ${h.address || ''}`.toLowerCase().includes(t)); }
  if (minRent) homes = homes.filter((h) => h.rent >= Number(minRent));
  if (maxRent) homes = homes.filter((h) => h.rent <= Number(maxRent));
  if (bedrooms !== undefined && bedrooms !== '') homes = homes.filter((h) => (Number(bedrooms) >= 4 ? h.bedrooms >= 4 : h.bedrooms === Number(bedrooms)));
  if (TYPES.includes(type)) homes = homes.filter((h) => h.type === type);
  if (sort === 'low') homes.sort((a, b) => a.rent - b.rent); else if (sort === 'high') homes.sort((a, b) => b.rent - a.rent);
  const favs = await prisma.favourite.findMany({ where: { userId: req.userId } });
  const saved = new Set(favs.map((f) => f.homeId));
  res.json((await withCovers(homes.slice(0, 60))).map((h) => ({ ...h, saved: saved.has(h.id) })));
});

router.get('/saved', auth, async (req, res) => {
  const favs = await prisma.favourite.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
  const homes = [];
  for (const f of favs) { const h = await prisma.home.findUnique({ where: { id: f.homeId } }); if (h && h.status !== 'HIDDEN') homes.push(h); }
  res.json((await withCovers(homes)).map((h) => ({ ...h, saved: true })));
});

router.get('/mine', auth, async (req, res) => {
  const homes = await prisma.home.findMany({ where: { ownerId: req.userId }, orderBy: { createdAt: 'desc' } });
  const out = await withCovers(homes);
  for (const h of out) {
    h.pendingApplications = await prisma.application.count({ where: { homeId: h.id, status: 'PENDING' } });
    const t = await prisma.tenancy.findFirst({ where: { homeId: h.id, status: 'ACTIVE' } });
    h.tenant = t ? { name: t.tenantName, phone: t.tenantPhone } : null;
  }
  res.json(out);
});

// A picture is public so it can be used in <img>; the id is random and unguessable.
router.get('/photo/:id', async (req, res) => {
  const p = await prisma.homePhoto.findUnique({ where: { id: req.params.id } });
  if (!p) return res.status(404).end();
  const m = /^data:(image\/\w+);base64,(.*)$/.exec(p.data);
  if (!m) return res.status(404).end();
  res.set('Content-Type', m[1]).set('Cache-Control', 'public, max-age=86400').send(Buffer.from(m[2], 'base64'));
});

router.get('/:id', auth, async (req, res) => {
  const h = await prisma.home.findUnique({ where: { id: req.params.id } });
  if (!h || (h.status === 'HIDDEN' && h.ownerId !== req.userId)) return res.status(404).json({ error: 'Home not found' });
  const photos = await prisma.homePhoto.findMany({ where: { homeId: h.id }, orderBy: { position: 'asc' } });
  const owner = await prisma.user.findUnique({ where: { id: h.ownerId } });
  const fav = await prisma.favourite.findFirst({ where: { userId: req.userId, homeId: h.id } });
  const app = await prisma.application.findFirst({ where: { homeId: h.id, applicantId: req.userId, status: 'PENDING' } });
  res.json({ ...h, photos: photos.map((p) => p.id), owner: { name: owner?.name || 'Landlord', photo: owner?.photo || null }, isOwner: h.ownerId === req.userId, saved: !!fav, applied: !!app });
});

router.post('/', auth, S.rateLimit({ windowMs: 60 * 60 * 1000, max: 40 }), async (req, res) => {
  const f = fields(req.body || {});
  if (f.error) return res.status(400).json({ error: f.error });
  res.json(await prisma.home.create({ data: { ...f.data, ownerId: req.userId } }));
});

async function mine(req, res) {
  const h = await prisma.home.findUnique({ where: { id: req.params.id } });
  if (!h || h.ownerId !== req.userId) { res.status(404).json({ error: 'Home not found' }); return null; }
  return h;
}

router.patch('/:id', auth, async (req, res) => {
  const h = await mine(req, res); if (!h) return;
  const f = fields({ ...h, ...req.body });
  if (f.error) return res.status(400).json({ error: f.error });
  const data = { ...f.data };
  if (['AVAILABLE', 'HIDDEN'].includes(req.body.status) && h.status !== 'OCCUPIED') data.status = req.body.status;
  res.json(await prisma.home.update({ where: { id: h.id }, data }));
});

router.post('/:id/photos', auth, async (req, res) => {
  const h = await mine(req, res); if (!h) return;
  const data = req.body?.data;
  if (typeof data !== 'string' || !PHOTO_RE.test(data) || data.length > 300000) return res.status(400).json({ error: 'Choose a smaller picture (PNG or JPG)' });
  const count = await prisma.homePhoto.count({ where: { homeId: h.id } });
  if (count >= MAX_PHOTOS) return res.status(400).json({ error: `You can add up to ${MAX_PHOTOS} photos per home` });
  const p = await prisma.homePhoto.create({ data: { homeId: h.id, data, position: count } });
  res.json({ id: p.id });
});

router.delete('/:id/photos/:photoId', auth, async (req, res) => {
  const h = await mine(req, res); if (!h) return;
  await prisma.homePhoto.deleteMany({ where: { id: req.params.photoId, homeId: h.id } });
  res.json({ ok: true });
});

router.post('/:id/save', auth, async (req, res) => {
  const h = await prisma.home.findUnique({ where: { id: req.params.id } });
  if (!h) return res.status(404).json({ error: 'Home not found' });
  const fav = await prisma.favourite.findFirst({ where: { userId: req.userId, homeId: h.id } });
  if (fav) { await prisma.favourite.deleteMany({ where: { userId: req.userId, homeId: h.id } }); return res.json({ saved: false }); }
  try { await prisma.favourite.create({ data: { userId: req.userId, homeId: h.id } }); } catch { /* saved twice at once */ }
  res.json({ saved: true });
});

module.exports = router;
