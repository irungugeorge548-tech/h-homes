const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const { publicUser } = require('../lib/session');
const router = express.Router();

router.get('/me', auth, (req, res) => res.json(publicUser(req.dbUser)));

router.patch('/profile', auth, async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 60);
  const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 100);
  if (name.length < 2) return res.status(400).json({ error: 'Enter your full name' });
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken && taken.id !== req.userId) return res.status(400).json({ error: 'That email is already used by another account' });
  }
  res.json(publicUser(await prisma.user.update({ where: { id: req.userId }, data: { name, email: email || null } })));
});

router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!(await bcrypt.compare(String(currentPassword || ''), req.dbUser.password))) return res.status(400).json({ error: 'Your current password is wrong' });
  if (String(newPassword || '').length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  await prisma.user.update({ where: { id: req.userId }, data: { password: await bcrypt.hash(String(newPassword), 10) } });
  res.json({ message: 'Password changed' });
});

router.patch('/photo', auth, async (req, res) => {
  const { photo } = req.body || {};
  if (photo !== null && !(typeof photo === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo) && photo.length <= 100000)) {
    return res.status(400).json({ error: 'Choose a smaller picture (PNG or JPG)' });
  }
  res.json(publicUser(await prisma.user.update({ where: { id: req.userId }, data: { photo } })));
});

module.exports = router;
