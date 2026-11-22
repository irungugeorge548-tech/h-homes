const express = require('express');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const hpesa = require('../lib/hpesa');
const { normalizePhone } = require('../lib/session');
const router = express.Router();

router.get('/status', auth, (req, res) => res.json({ linked: !!req.user.hpesaPhone, phone: req.user.hpesaPhone }));

// Connect an H-Pesa wallet: the user proves it is theirs by logging in to H-Pesa once.
// We keep only the wallet's phone number, never its password or PIN.
router.post('/link', auth, async (req, res) => {
  try {
    const d = await hpesa.login(normalizePhone(req.body?.phone), req.body?.password);
    await prisma.user.update({ where: { id: req.userId }, data: { hpesaPhone: d.user.phone } });
    res.json({ linked: true, phone: d.user.phone, hpesaToken: d.token, balance: d.balance });
  } catch (err) {
    res.status(err.status || 503).json({ error: err.status ? err.message : 'H-Pesa is not available right now. Please try again.' });
  }
});

router.post('/unlink', auth, async (req, res) => {
  await prisma.user.update({ where: { id: req.userId }, data: { hpesaPhone: null } });
  res.json({ linked: false });
});

module.exports = router;
