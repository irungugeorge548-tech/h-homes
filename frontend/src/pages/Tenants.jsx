import { useEffect, useState } from 'react'
import { get, post, errMsg, money, getUser } from '../lib/api'
import TabBar from '../components/TabBar'
import ChatBot from '../components/ChatBot'
import Icon from '../components/Icon'
import { field } from '../components/SubScreen'

export default function Tenants() {
  const [data, setData] = useState(null)
  const [apps, setApps] = useState([])
  const [fixes, setFixes] = useState([])
  const [homes, setHomes] = useState([])
  const [add, setAdd] = useState(false)
  const [form, setForm] = useState({ homeId: '', phone: '', dueDay: 5 })
  const [s, setS] = useState({})
  const user = getUser()
  const load = () => {
    get('/api/tenancies/landlord').then(setData).catch(() => setData({ tenants: [], totals: {}, payments: [] }))
    get('/api/applications/received').then(setApps).catch(() => {})
    get('/api/tenancies/maintenance/list?as=landlord').then(setFixes).catch(() => {})
    get('/api/homes/mine').then(h => setHomes(h.filter(x => x.status !== 'OCCUPIED'))).catch(() => {})
  }
  useEffect(() => { load() }, [])
  const run = async (fn, okMsg) => { setS({}); try { await fn(); setS({ ok: okMsg }); load() } catch (e) { setS({ error: errMsg(e) }) } }

  const approve = (a) => { const d = window.prompt('Rent is due on which day of the month? (1-28)', '5'); if (d === null) return; run(() => post(`/api/applications/${a.id}/approve`, { dueDay: Number(d) || 5 }), `${a.applicantName} is now your tenant.`) }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto px-5 pt-6 space-y-5">
        <div className="flex items-center"><h1 className="text-3xl font-extrabold flex-1">Tenants</h1>
          <button onClick={() => setAdd(!add)} className="bg-bolt text-white rounded-full px-4 py-2.5 font-semibold flex items-center gap-1"><Icon name="plus" size={18} />Add</button></div>
        {s.ok && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">{s.ok}</div>}
        {s.error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{s.error}</div>}

        {add && (
          <form className="bg-white border rounded-3xl p-4 space-y-3" onSubmit={e => { e.preventDefault(); run(async () => { await post('/api/tenancies', form); setAdd(false); setForm({ homeId: '', phone: '', dueDay: 5 }) }, 'Tenant added.') }}>
            <p className="font-bold">Add a tenant</p>
            <select className={field} value={form.homeId} onChange={e => setForm({ ...form, homeId: e.target.value })} required><option value="">Choose a home</option>{homes.map(h => <option key={h.id} value={h.id}>{h.title} · {money(h.rent)}</option>)}</select>
            <input className={field} type="tel" placeholder="Tenant's phone (their H-Homes number)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            <input className={field} type="number" min="1" max="28" placeholder="Rent due day (1-28)" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} />
            <p className="text-xs text-gray-500">They need an H-Homes account first. Rent starts from this month.</p>
            <button className="w-full bg-bolt text-white rounded-2xl py-3 font-semibold">Add tenant</button>
          </form>)}

        {apps.length > 0 && <div><h2 className="font-bold mb-2">Applications ({apps.length})</h2><div className="space-y-3">{apps.map(a => (
          <div key={a.id} className="bg-white border rounded-2xl p-4">
            <p className="font-semibold">{a.applicantName}</p>
            <p className="text-xs text-gray-500">{a.applicantPhone} · for {a.home.title}</p>
            {a.message && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-xl p-2">“{a.message}”</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => approve(a)} className="flex-1 bg-bolt text-white rounded-xl py-2.5 font-semibold">Approve</button>
              <button onClick={() => run(() => post(`/api/applications/${a.id}/decline`), 'Declined.')} className="flex-1 border rounded-xl py-2.5 font-semibold">Decline</button>
              <a href={`tel:${a.applicantPhone}`} aria-label="Call" className="w-12 border rounded-xl flex items-center justify-center"><Icon name="phone" size={20} /></a>
            </div></div>))}</div></div>}

        <div>
          <h2 className="font-bold mb-2">Your tenants</h2>
          {data === null && <p className="text-center text-gray-500 py-6">Loading…</p>}
          {data?.tenants.length === 0 && <p className="text-sm text-gray-500 bg-white border rounded-2xl p-4">No tenants yet. Approve an application or add a tenant above.</p>}
          <div className="space-y-3">{data?.tenants.map(t => (
            <div key={t.id} className="bg-white border rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1"><p className="font-semibold">{t.tenantName}</p><p className="text-xs text-gray-500">{t.home?.title} · {money(t.rentAmount)}/month · due day {t.dueDay}</p></div>
                <span className={`text-xs font-semibold rounded-full px-3 py-1 ${t.balance === 0 ? 'bg-green-100 text-green-700' : t.late ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{t.balance === 0 ? 'Paid up' : t.late ? 'Late' : 'Owes'}</span>
              </div>
              {t.balance > 0 && <p className="text-sm mt-2">Owes <b>{money(t.balance)}</b> · paid {money(t.paid)} so far</p>}
              <div className="flex gap-2 mt-3">
                <a href={`tel:${t.tenantPhone}`} className="flex-1 border rounded-xl py-2 text-sm font-semibold text-center">Call</a>
                <button onClick={() => window.confirm(`End ${t.tenantName}'s tenancy? The home will be listed as available again.`) && run(() => post(`/api/tenancies/${t.id}/end`), 'Tenancy ended.')} className="flex-1 border border-red-200 text-red-600 rounded-xl py-2 text-sm font-semibold">End tenancy</button>
              </div></div>))}</div>
        </div>

        {fixes.length > 0 && <div><h2 className="font-bold mb-2">Repair requests</h2><div className="space-y-3">{fixes.map(m => (
          <div key={m.id} className="bg-white border rounded-2xl p-4">
            <p className="font-semibold">{m.title}</p><p className="text-xs text-gray-500">{m.tenantName} · {m.home}</p>
            {m.detail && <p className="text-sm text-gray-600 mt-1">{m.detail}</p>}
            <select aria-label="Status" value={m.status} onChange={e => run(() => post(`/api/tenancies/maintenance/${m.id}/status`, { status: e.target.value }), 'Updated.')} className="mt-2 border rounded-xl px-3 py-2 text-sm bg-white"><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select>
          </div>))}</div></div>}
        <div className="h-4" />
      </div>
      <ChatBot name={user.name?.split(' ')[0]} />
      <TabBar />
    </div>
  )
}
