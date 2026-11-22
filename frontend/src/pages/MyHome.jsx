import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post, errMsg, money, getUser } from '../lib/api'
import TabBar from '../components/TabBar'
import ChatBot from '../components/ChatBot'
import ConnectHpesa from '../components/ConnectHpesa'
import HomeImage from '../components/HomeImage'
import Icon from '../components/Icon'
import { ReceiptSheet, rentReceiptText, PasswordInput } from '../components/extras'
import { field } from '../components/SubScreen'

const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const STATUS = { PENDING: 'Waiting', APPROVED: 'Approved', DECLINED: 'Declined', WITHDRAWN: 'Withdrawn' }

function PaySheet({ t, onClose, onPaid }) {
  const [mode, setMode] = useState('full') // full | part
  const [part, setPart] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needLink, setNeedLink] = useState(false)
  useEffect(() => { get('/api/hpesa/status').then(r => setNeedLink(!r.linked)).catch(() => {}) }, [])
  const amount = mode === 'full' ? t.balance : Number(part)
  const minPart = Math.min(100, t.balance)

  const pay = async (e) => {
    e.preventDefault(); setError('')
    if (!(amount >= minPart && amount <= t.balance)) return setError(`Enter between ${money(minPart)} and ${money(t.balance)}`)
    setBusy(true)
    try { onPaid(await post(`/api/tenancies/${t.id}/pay`, { amount, pin })) }
    catch (err) { if (err.response?.data?.code === 'NOT_LINKED') setNeedLink(true); setError(errMsg(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <p className="font-extrabold text-lg">Pay rent</p>
        <p className="text-sm text-gray-500 mb-3">{t.home?.title} · You owe {money(t.balance)}</p>
        {needLink ? <ConnectHpesa light onDone={() => setNeedLink(false)} /> : !t.landlord.canReceive ? (
          <div className="bg-amber-50 text-amber-800 rounded-2xl p-4 text-sm">Your landlord has not connected a wallet to receive rent yet. Please ask them to connect their H-Pesa in H-Homes.</div>
        ) : (
          <form onSubmit={pay} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode('full')} className={`rounded-2xl border-2 p-3 text-left ${mode === 'full' ? 'border-bolt bg-bolt/10' : ''}`}><span className="block font-bold">Pay in full</span><span className="text-xs text-gray-500">{money(t.balance)}</span></button>
              <button type="button" onClick={() => setMode('part')} className={`rounded-2xl border-2 p-3 text-left ${mode === 'part' ? 'border-bolt bg-bolt/10' : ''}`}><span className="block font-bold">Lipa Mdogo Mdogo</span><span className="text-xs text-gray-500">Pay a part now</span></button>
            </div>
            {mode === 'part' && <div><input className={field} type="number" inputMode="numeric" min={minPart} max={t.balance} placeholder={`Amount (min ${money(minPart)})`} value={part} onChange={e => setPart(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Pay any amount from {money(minPart)}. What is left stays on your balance.</p></div>}
            <PasswordInput className={field} inputMode="numeric" maxLength={4} placeholder="H-Pesa PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={busy || pin.length < 4} className="w-full bg-bolt disabled:opacity-60 text-white rounded-2xl py-3.5 font-semibold">{busy ? 'Paying…' : `Pay ${money(amount || 0)}`}</button>
            <p className="text-xs text-gray-500 text-center">Paid from your H-Pesa wallet straight to {t.landlord.name}.</p>
          </form>
        )}
        <button onClick={onClose} className="w-full text-gray-500 py-2 mt-2">Close</button>
      </div>
    </div>
  )
}

function Fix({ t, onClose, onDone }) {
  const [title, setTitle] = useState(''), [detail, setDetail] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const send = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await post(`/api/tenancies/${t.id}/maintenance`, { title, detail }); onDone() } catch (err) { setError(errMsg(err)) } finally { setBusy(false) } }
  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 flex items-end" onClick={onClose}>
      <form onSubmit={send} className="bg-white w-full rounded-t-3xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <p className="font-extrabold text-lg">Report a problem</p>
        <input className={field} placeholder="What needs fixing? e.g. Leaking tap" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} required />
        <textarea className={field} rows={3} placeholder="More details (optional)" value={detail} onChange={e => setDetail(e.target.value)} maxLength={500} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full bg-bolt disabled:opacity-60 text-white rounded-2xl py-3.5 font-semibold">{busy ? 'Sending…' : 'Send to landlord'}</button>
        <button type="button" onClick={onClose} className="w-full text-gray-500 py-2">Cancel</button>
      </form>
    </div>
  )
}

export default function MyHome() {
  const [list, setList] = useState(null)
  const [apps, setApps] = useState([])
  const [fixes, setFixes] = useState([])
  const [paying, setPaying] = useState(null)
  const [fixing, setFixing] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [note, setNote] = useState('')
  const user = getUser()
  const load = () => {
    get('/api/tenancies/my').then(setList).catch(() => setList([]))
    get('/api/applications/mine').then(setApps).catch(() => {})
    get('/api/tenancies/maintenance/list').then(setFixes).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const withdraw = async (a) => { try { await post(`/api/applications/${a.id}/withdraw`); load() } catch { /* ignore */ } }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto px-5 pt-6 space-y-5">
        <h1 className="text-3xl font-extrabold">My Home</h1>
        {note && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">{note}</div>}
        {list === null && <p className="text-center text-gray-500 py-8">Loading…</p>}
        {list?.length === 0 && (
          <div className="bg-white border rounded-3xl p-6 text-center">
            <Icon name="key" size={40} className="mx-auto text-bolt" />
            <p className="font-bold mt-2">No home yet</p>
            <p className="text-sm text-gray-500">When a landlord approves your application or adds you as a tenant, your home and rent show up here.</p>
            <Link to="/" className="inline-block mt-4 bg-bolt text-white rounded-2xl px-6 py-3 font-semibold">Explore homes</Link>
          </div>
        )}
        {list?.map(t => (
          <div key={t.id} className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <HomeImage cover={t.cover} type={t.home?.type} className="w-full h-36" />
            <div className="p-5">
              <p className="font-bold text-lg">{t.home?.title}</p>
              <p className="text-sm text-gray-500">{t.home?.area} · Landlord: {t.landlord.name}</p>
              <div className={`mt-4 rounded-2xl p-4 ${t.balance > 0 ? (t.late ? 'bg-red-50' : 'bg-bolt/10') : 'bg-green-50'}`}>
                {t.balance > 0 ? (<>
                  <p className="text-sm text-gray-600">{t.late ? 'Rent overdue' : 'Rent due'}</p>
                  <p className="text-3xl font-extrabold">{money(t.balance)}</p>
                  <p className="text-xs text-gray-500 mt-1">Monthly rent {money(t.rentAmount)} · due on day {t.dueDay} of each month</p>
                </>) : (<>
                  <p className="font-bold text-green-700 flex items-center gap-2"><Icon name="check" size={20} />You are all paid up</p>
                  <p className="text-xs text-gray-500 mt-1">Next rent {money(t.rentAmount)} due {day(t.nextDue)}{t.credit > 0 ? ` · credit ${money(t.credit)}` : ''}</p>
                </>)}
                {t.balance > 0 && <button onClick={() => setPaying(t)} className="w-full mt-3 bg-bolt text-white rounded-2xl py-3.5 font-semibold">Pay rent</button>}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setFixing(t)} className="flex-1 border rounded-2xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Icon name="tool" size={18} />Report a problem</button>
                {t.landlord.phone && <a href={`tel:${t.landlord.phone}`} className="flex-1 border rounded-2xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Icon name="phone" size={18} />Call landlord</a>}
              </div>
              <h3 className="font-bold mt-5 mb-1">Payments</h3>
              {t.payments.length === 0 && <p className="text-sm text-gray-500">No payments yet.</p>}
              {t.payments.slice(0, 8).map(p => (
                <button key={p.id} onClick={() => setReceipt({ text: rentReceiptText(p, t, user), id: p.id })} className="w-full flex items-center gap-3 py-3 border-b text-left">
                  <span className="w-10 h-10 rounded-full bg-bolt/15 text-bolt flex items-center justify-center"><Icon name="receipt" size={20} /></span>
                  <span className="flex-1"><span className="block font-semibold">{money(p.amount)}</span><span className="block text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                  <span className="text-xs text-bolt font-semibold">Receipt</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {fixes.length > 0 && <div><h2 className="font-bold mb-2">Your repair requests</h2><div className="bg-white border rounded-2xl divide-y">{fixes.map(m => <div key={m.id} className="p-3 flex items-center gap-3"><span className="flex-1"><span className="block font-medium">{m.title}</span><span className="block text-xs text-gray-500">{m.home}</span></span><span className={`text-xs rounded-full px-3 py-1 ${m.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{m.status === 'DONE' ? 'Done' : m.status === 'IN_PROGRESS' ? 'In progress' : 'Sent'}</span></div>)}</div></div>}

        {apps.length > 0 && <div><h2 className="font-bold mb-2">Your applications</h2><div className="bg-white border rounded-2xl divide-y">{apps.map(a => (
          <div key={a.id} className="p-3 flex items-center gap-3">
            <Link to={`/listing/${a.homeId}`} className="flex-1"><span className="block font-medium">{a.home?.title || 'Home'}</span><span className="block text-xs text-gray-500">{a.home?.area} · {money(a.home?.rent)}</span></Link>
            <span className={`text-xs rounded-full px-3 py-1 ${a.status === 'APPROVED' ? 'bg-green-100 text-green-700' : a.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{STATUS[a.status]}</span>
            {a.status === 'PENDING' && <button onClick={() => withdraw(a)} className="text-xs text-red-600">Withdraw</button>}
          </div>))}</div></div>}
        <div className="h-4" />
      </div>
      {paying && <PaySheet t={paying} onClose={() => setPaying(null)} onPaid={(p) => { const t = paying; setPaying(null); load(); setNote('Rent paid. Thank you!'); setReceipt({ text: rentReceiptText(p, t, user), id: p.id }) }} />}
      {fixing && <Fix t={fixing} onClose={() => setFixing(null)} onDone={() => { setFixing(null); load(); setNote('Sent to your landlord.') }} />}
      <ReceiptSheet text={receipt?.text} id={receipt?.id} onClose={() => setReceipt(null)} />
      <ChatBot name={user.name?.split(' ')[0]} />
      <TabBar />
    </div>
  )
}
