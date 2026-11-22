const express = require('express');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  res.json(await prisma.supportMessage.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 20 }));
});

router.post('/', auth, async (req, res) => {
  const subject = String(req.body?.subject || '').trim().slice(0, 80);
  const message = String(req.body?.message || '').trim().slice(0, 1000);
  if (subject.length < 3) return res.status(400).json({ error: 'Add a short subject' });
  if (message.length < 10) return res.status(400).json({ error: 'Tell us a bit more (at least 10 characters)' });
  const recent = await prisma.supportMessage.count({ where: { userId: req.userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
  if (recent >= 5) return res.status(429).json({ error: 'You have sent several messages already. We will reply soon.' });
  res.json(await prisma.supportMessage.create({ data: { userId: req.userId, userName: req.user.name, userPhone: req.user.phone, subject, message } }));
});

module.exports = router;
