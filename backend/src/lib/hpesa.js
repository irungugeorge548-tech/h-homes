const axios = require('axios');

const base = () => (process.env.HPESA_API || '').replace(/\/$/, '');
const key = () => process.env.HHOMES_API_KEY || '';

class HpesaDown extends Error {}

// Calls H-Pesa and turns every failure into { status, error }
async function call(method, path, { data, headers, timeout = 15000 } = {}) {
  if (!base()) throw new HpesaDown('H-Pesa address is not set (HPESA_API)');
  try {
    const r = await axios({ method, url: `${base()}${path}`, data, headers, timeout });
    return r.data;
  } catch (err) {
    if (err.response) {
      const e = new Error(err.response.data?.error || 'H-Pesa refused the request');
      e.status = err.response.status;
      throw e;
    }
    throw new HpesaDown('H-Pesa could not be reached');
  }
}

const partner = () => ({ 'x-api-key': key() });

// --- sign-in goes through H-Pesa: one account for all the apps ---
const login = (phone, password) => call('post', '/api/auth/login', { data: { phone, password } });
const register = (body) => call('post', '/api/auth/register', { data: body });
const verify = (token) => call('post', '/api/sso/verify', { data: { token }, headers: partner() });
const balance = (token) => call('post', '/api/sso/balance', { data: { token }, headers: partner() });
const account = (method, path, token, data) => call(method, `/api/account${path}`, { data, headers: { Authorization: `Bearer ${token}` } });

// --- payments: charges are safe to retry because the reference is only ever charged once ---
const charge = (body) => call('post', '/api/merchant/charge', { data: body, headers: partner(), timeout: 30000 });
const refund = (reference, reason) => call('post', '/api/merchant/refund', { data: { reference, reason }, headers: partner() });
const status = (reference) => call('get', `/api/merchant/status/${encodeURIComponent(reference)}`, { headers: partner() });
const reward = (body) => call('post', '/api/merchant/reward', { data: body, headers: partner() });

module.exports = { HpesaDown, login, register, verify, balance, account, charge, refund, status, reward };
