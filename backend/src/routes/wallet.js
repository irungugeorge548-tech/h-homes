const express = require('express');
const auth = require('../middleware/auth');
const hpesa = require('../lib/hpesa');
const router = express.Router();

// The balance is read from H-Pesa with the user's own H-Pesa token (kept on their phone after connecting).
router.get('/balance', auth, async (req, res) => {
  if (!req.user.hpesaPhone) return res.json({ linked: false });
  const token = req.headers['x-hpesa-token'];
  if (!token) return res.json({ linked: true, reconnect: true, phone: req.user.hpesaPhone });
  try { res.json({ linked: true, phone: req.user.hpesaPhone, balance: (await hpesa.balance(token)).balance }); }
  catch (err) {
    if (err.status === 401) return res.json({ linked: true, reconnect: true, phone: req.user.hpesaPhone });
    res.status(503).json({ error: 'H-Pesa not available' });
  }
});

module.exports = router;
