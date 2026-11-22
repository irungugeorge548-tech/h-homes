// A tiny pretend H-Pesa, so the H-Homes tests run anywhere. It follows the real API's contract:
// login/register, sso verify + balance, merchant charge (idempotent by reference), refund, status.
const express = require('express');

function createStub({ key }) {
  const app = express();
  app.use(express.json());
  const users = new Map(); // phone -> { id, name, email, password, pin, balance }
  const charges = new Map(); // reference -> { phone, amount, refunded }
  const tokens = new Map();
  const state = { failCharges: false, hangCharges: false, log: [] };
  let n = 0;

  const issue = (u) => { const t = `tok_${++n}`; tokens.set(t, u.phone); return t; };
  const shape = (u) => ({ id: u.id, name: u.name, phone: u.phone, email: u.email });
  const needKey = (req, res, next) => (req.headers['x-api-key'] === key ? next() : res.status(401).json({ error: 'Invalid API key' }));

  app.post('/api/auth/register', (req, res) => {
    const { name, phone, email, password, pin } = req.body;
    if (!name || !phone || !email || !password || !pin) return res.status(400).json({ error: 'All fields required' });
    if (users.has(phone)) return res.status(400).json({ error: 'Phone or email already exists' });
    const u = { id: `u${++n}`, name, phone, email, password, pin, balance: 10000 };
    users.set(phone, u);
    res.json({ token: issue(u), user: shape(u), balance: u.balance });
  });
  app.post('/api/auth/login', (req, res) => {
    const u = users.get(req.body.phone);
    if (!u || u.password !== req.body.password) return res.status(400).json({ error: 'Invalid credentials' });
    res.json({ token: issue(u), user: shape(u), balance: u.balance });
  });
  app.post('/api/sso/verify', needKey, (req, res) => {
    const phone = tokens.get(req.body.token);
    res.json(phone ? { valid: true, user: shape(users.get(phone)) } : { valid: false });
  });
  app.post('/api/sso/balance', needKey, (req, res) => {
    const phone = tokens.get(req.body.token);
    if (!phone) return res.status(401).json({ error: 'Invalid token' });
    res.json({ balance: users.get(phone).balance });
  });
  app.get('/api/account/me', (req, res) => {
    const phone = tokens.get((req.headers.authorization || '').split(' ')[1]);
    if (!phone) return res.status(401).json({ error: 'Invalid token' });
    res.json(shape(users.get(phone)));
  });
  app.post('/api/merchant/charge', needKey, async (req, res) => {
    const { phone, pin, amount, reference, toPhone } = req.body;
    state.log.push(['charge', reference]);
    if (state.hangCharges) { charges.set(reference, { phone, amount, refunded: false, toPhone }); users.get(phone).balance -= amount; if (toPhone && users.get(toPhone)) users.get(toPhone).balance += amount; return res.destroy(); }
    if (state.failCharges) return res.status(500).json({ error: 'Server error' });
    if (charges.has(reference)) return res.json({ status: 'COMPLETED', duplicate: true });
    const u = users.get(phone);
    if (!u) return res.status(404).json({ error: 'Account not found' });
    if (u.pin !== pin) return res.status(400).json({ error: 'Invalid PIN' });
    if (u.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
    u.balance -= amount;
    if (toPhone && users.get(toPhone)) users.get(toPhone).balance += amount;
    charges.set(reference, { phone, amount, refunded: false, toPhone });
    res.json({ status: 'COMPLETED', reference, amount, balance: u.balance });
  });
  app.post('/api/merchant/refund', needKey, (req, res) => {
    const c = charges.get(req.body.reference);
    if (!c) return res.status(404).json({ error: 'Charge not found' });
    if (c.refunded) return res.json({ status: 'REFUNDED', duplicate: true });
    c.refunded = true; users.get(c.phone).balance += c.amount; if (c.toPhone && users.get(c.toPhone)) users.get(c.toPhone).balance -= c.amount;
    res.json({ status: 'REFUNDED' });
  });
  app.get('/api/merchant/status/:reference', needKey, (req, res) => {
    const c = charges.get(req.params.reference);
    res.json(!c ? { status: 'NOT_FOUND' } : { status: c.refunded ? 'REFUNDED' : 'COMPLETED' });
  });

  return { app, users, charges, state };
}

module.exports = { createStub };
