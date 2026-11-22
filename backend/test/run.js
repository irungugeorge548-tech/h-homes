// Offline test of the H-Homes backend against an in-memory database and a pretend H-Pesa.
// To test against a real H-Pesa instead:  HPESA_API=http://localhost:5000 HHOMES_API_KEY=... node test/run.js
const Module = require('module');
const { createFakePrisma } = require('./fakePrisma');
const { createStub } = require('./stubHpesa');

process.env.REQUIRE_TERMS = '0';
process.env.DISABLE_RATE_LIMIT = '1';
const KEY = process.env.HHOMES_API_KEY || 'hpk_test_key';
const fake = createFakePrisma();
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '@prisma/client') return { PrismaClient: function PrismaClient() { return fake; } };
  return realLoad.call(this, request, ...rest);
};

let passed = 0, failed = 0;
const check = (name, cond, extra) => {
  if (cond) { passed++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name}${extra !== undefined ? ' -> ' + JSON.stringify(extra) : ''}`); }
};

async function main() {
  let stub = null, stubServer = null;
  if (!process.env.HPESA_API) {
    stub = createStub({ key: KEY });
    stubServer = await new Promise((r) => { const s = stub.app.listen(0, () => r(s)); });
    process.env.HPESA_API = `http://127.0.0.1:${stubServer.address().port}`;
  }
  process.env.HHOMES_API_KEY = KEY;

  const app = require('../src/index.js');
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, { token, body, hp } = {}) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(hp ? { 'x-hpesa-token': hp } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let data = null; try { data = await res.json(); } catch { /* empty */ }
    return { status: res.status, data };
  };

  const stamp = String(Date.now()).slice(-6);
  const reg = async (name, ph) => { const x = await call('POST', '/api/auth/register', { body: { name, phone: ph, email: `${ph}@t.app`, password: 'password123' } }); return x.data; };
  const L = await reg('Lena Landlord', `0711${stamp}`), T = await reg('Tom Tenant', `0722${stamp}`), X = await reg('Xena Other', `0733${stamp}`);
  check('accounts created without H-Pesa', !!L.token && L.user.hpesaLinked === false);
  let r = await call('POST', '/api/auth/register', { body: { name: 'Dup', phone: `0711${stamp}`, email: 'd@t.app', password: 'password123' } });
  check('same phone cannot register twice', r.status === 400);

  // H-Pesa wallets: tenant and landlord
  stub.users.set(`0711${stamp}`, { id: 'hl', name: 'Lena', phone: `0711${stamp}`, email: 'l@t', password: 'pw', pin: '1111', balance: 0 });
  stub.users.set(`0722${stamp}`, { id: 'ht', name: 'Tom', phone: `0722${stamp}`, email: 't@t', password: 'pw', pin: '2222', balance: 10000 });
  stub.users.set(`0733${stamp}`, { id: 'hx', name: 'Xena', phone: `0733${stamp}`, email: 'x@t', password: 'pw', pin: '3333', balance: 10000 });

  console.log('Listings');
  r = await call('POST', '/api/homes', { token: L.token, body: { title: 'Sunny 2BR', area: 'Kilimani', rent: 30000, deposit: 30000, bedrooms: 2, type: 'APARTMENT', amenities: ['Parking', 'Water'] } });
  check('landlord creates a listing', r.status === 200 && r.data.rent === 30000, r);
  const home = r.data;
  r = await call('POST', '/api/homes', { token: L.token, body: { title: 'x', area: 'K', rent: 10 } });
  check('bad listing refused', r.status === 400);
  const PIC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  r = await call('POST', `/api/homes/${home.id}/photos`, { token: L.token, body: { data: PIC } });
  check('landlord uploads a photo', r.status === 200 && !!r.data.id, r);
  const photoId = r.data.id;
  r = await call('POST', `/api/homes/${home.id}/photos`, { token: T.token, body: { data: PIC } });
  check('only the owner can upload photos', r.status === 404);
  r = await call('POST', `/api/homes/${home.id}/photos`, { token: L.token, body: { data: 'javascript:1' } });
  check('a non-image upload is refused', r.status === 400);
  const img = await fetch(`${base}/api/homes/photo/${photoId}`);
  check('photo is served as an image', img.status === 200 && /image\/png/.test(img.headers.get('content-type')));
  r = await call('GET', '/api/homes?q=kilimani&maxRent=40000&bedrooms=2', { token: T.token });
  check('tenant finds it by area and filters', r.status === 200 && r.data.length === 1 && r.data[0].cover === photoId, r);
  r = await call('GET', '/api/homes?q=nowhere', { token: T.token });
  check('search with no match is empty', r.data.length === 0);
  r = await call('GET', '/api/homes', { token: L.token });
  check('owner does not see own listing in Explore', r.data.length === 0);
  r = await call('POST', `/api/homes/${home.id}/save`, { token: T.token });
  check('save a home', r.data.saved === true);
  r = await call('GET', '/api/homes/saved', { token: T.token });
  check('saved list has it', r.data.length === 1);
  r = await call('POST', `/api/homes/${home.id}/save`, { token: T.token });
  check('saving again un-saves', r.data.saved === false);

  console.log('Applications');
  r = await call('POST', '/api/applications', { token: L.token, body: { homeId: home.id } });
  check('cannot apply to own home', r.status === 400);
  r = await call('POST', '/api/applications', { token: T.token, body: { homeId: home.id, message: 'Hello' } });
  check('tenant applies', r.status === 200);
  const app1 = r.data;
  r = await call('POST', '/api/applications', { token: T.token, body: { homeId: home.id } });
  check('cannot apply twice', r.status === 400);
  await call('POST', '/api/applications', { token: X.token, body: { homeId: home.id } });
  r = await call('GET', '/api/applications/received', { token: L.token });
  check('landlord sees 2 applications', r.data.length === 2);
  r = await call('POST', `/api/applications/${app1.id}/approve`, { token: X.token, body: {} });
  check('only the landlord can approve', r.status === 404);
  r = await call('POST', `/api/applications/${app1.id}/approve`, { token: L.token, body: { dueDay: 5 } });
  check('landlord approves: tenancy created', r.status === 200 && r.data.tenantId === T.user.id, r);
  const tenancy = r.data;
  r = await call('GET', '/api/applications/mine', { token: X.token });
  check('other applicant was declined', r.data[0].status === 'DECLINED');
  r = await call('GET', '/api/homes/mine', { token: L.token });
  check('home is now occupied with tenant', r.data[0].status === 'OCCUPIED' && r.data[0].tenant.name === 'Tom Tenant');
  r = await call('POST', '/api/tenancies', { token: L.token, body: { homeId: home.id, phone: `0733${stamp}` } });
  check('cannot add a second tenant to an occupied home', r.status === 400);

  console.log('Rent');
  r = await call('GET', '/api/tenancies/my', { token: T.token });
  check('tenant sees rent due = 30000', r.status === 200 && r.data[0].balance === 30000 && r.data[0].landlord.canReceive === false, r.data);
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 30000, pin: '2222' } });
  check('paying before connecting H-Pesa is refused', r.status === 403 && r.data.code === 'NOT_LINKED');
  for (const [u, ph, pw] of [[T, `0722${stamp}`], [L, `0711${stamp}`]]) await call('POST', '/api/hpesa/link', { token: u.token, body: { phone: ph, password: 'pw' } });
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 10000, pin: '2222' } });
  check('Lipa Mdogo Mdogo instalment of 10000 accepted', r.status === 200 && r.data.status === 'COMPLETED', r);
  check('money reached the landlord wallet and left the tenant', stub.users.get(`0711${stamp}`).balance === 10000 && stub.users.get(`0722${stamp}`).balance === 0);
  r = await call('GET', '/api/tenancies/my', { token: T.token });
  check('balance is now 20000', r.data[0].balance === 20000 && r.data[0].payments.length === 1);
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 50, pin: '2222' } });
  check('instalment under KES 100 refused', r.status === 400);
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 99999, pin: '2222' } });
  check('cannot pay more than owed', r.status === 400);
  stub.users.get(`0722${stamp}`).balance = 5000;
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 20000, pin: '2222' } });
  check('insufficient balance refused and nothing recorded', r.status === 400 && /nsufficient/.test(r.data.error));
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 1000, pin: '0000' } });
  check('wrong PIN refused', r.status === 400);
  r = await call('GET', '/api/tenancies/my', { token: T.token });
  check('failed attempts did not change the balance', r.data[0].balance === 20000);
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: X.token, body: { amount: 1000, pin: '3333' } });
  check('a stranger cannot pay someone else\'s tenancy', r.status === 404);
  stub.state.hangCharges = true;
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 1000, pin: '2222' } });
  stub.state.hangCharges = false;
  check('network drop after charge is recovered via status check', r.status === 200 && r.data.status === 'COMPLETED', r);
  stub.users.get(`0722${stamp}`).balance = 50000;
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 19000, pin: '2222' } });
  check('paying the rest', r.status === 200);
  r = await call('GET', '/api/tenancies/my', { token: T.token });
  check('fully paid: balance 0', r.data[0].balance === 0 && r.data[0].payments.length === 3);
  r = await call('POST', `/api/tenancies/${tenancy.id}/pay`, { token: T.token, body: { amount: 100, pin: '2222' } });
  check('nothing due once paid up', r.status === 400);
  r = await call('GET', '/api/tenancies/landlord', { token: L.token });
  check('landlord money view', r.data.totals.receivedThisMonth === 30000 && r.data.totals.outstanding === 0 && r.data.payments.length === 3, r.data.totals);
  const rentLib = require('../src/lib/rent');
  const old = { rentAmount: 10000, startDate: new Date(Date.now() - 70 * 86400000), dueDay: 1 };
  const sm = rentLib.summary(old, [{ status: 'COMPLETED', amount: 10000 }]);
  check('months of arrears are counted (3 months owed, 1 paid)', sm.balance === 20000 && sm.late === true, sm);

  console.log('Maintenance + support + tenant management');
  r = await call('POST', `/api/tenancies/${tenancy.id}/maintenance`, { token: T.token, body: { title: 'Leaking tap', detail: 'Kitchen' } });
  check('tenant reports a problem', r.status === 200);
  r = await call('GET', '/api/tenancies/maintenance/list?as=landlord', { token: L.token });
  check('landlord sees it', r.data.length === 1 && r.data[0].tenantName === 'Tom Tenant');
  r = await call('POST', `/api/tenancies/maintenance/${r.data[0].id}/status`, { token: L.token, body: { status: 'DONE' } });
  check('landlord marks it done', r.status === 200);
  r = await call('POST', '/api/support', { token: T.token, body: { subject: 'Hello there', message: 'I need some help please' } });
  check('support message sent', r.status === 200);
  r = await call('POST', `/api/tenancies/${tenancy.id}/end`, { token: L.token });
  check('landlord ends tenancy', r.status === 200);
  r = await call('GET', '/api/homes', { token: X.token });
  check('home is available again', r.data.length === 1);
  r = await call('POST', '/api/tenancies', { token: L.token, body: { homeId: home.id, phone: `0744${stamp}` } });
  check('adding an unregistered tenant gives a clear message', r.status === 404 && /sign up/.test(r.data.error));
  r = await call('POST', '/api/tenancies', { token: L.token, body: { homeId: home.id, phone: `0733${stamp}`, dueDay: 10 } });
  check('landlord adds a registered tenant directly', r.status === 200 && r.data.dueDay === 10);

  server.close(); if (stubServer) stubServer.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
