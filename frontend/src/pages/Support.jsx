import { useEffect, useState } from 'react'
import SubScreen, { field, Msg } from '../components/SubScreen'
import Icon from '../components/Icon'
import { get, post, errMsg } from '../lib/api'
import { TOPICS, answer } from '../lib/bot'

const FAQ = [
  ['How do I pay rent?', 'Open My Home and tap Pay rent. Choose Pay in full or Lipa Mdogo Mdogo (any amount from KES 100), enter your H-Pesa PIN and confirm. The money goes from your wallet straight to your landlord.'],
  ['My payment failed. Was I charged?', 'If a payment fails you are not charged. If it cannot be recorded after you paid, it is refunded automatically. Check My Home to confirm.'],
  ['How do I apply for a home?', 'Open a listing and tap Apply for this home. The landlord sees your name and phone and can approve you. You can follow it in My Home.'],
  ['How do I list my property?', 'Switch to managing property in Account, then tap Add on the Properties tab. Add photos, rent and details, then publish.'],
  ['How do I get rent into my wallet?', 'Connect your H-Pesa wallet in Account > Payment. Tenants then pay straight into it.'],
  ['My landlord has not added me.', 'Ask them to add you with your H-Homes phone number, or apply for the home yourself in the app.'],
]

export default function Support() {
  const [open, setOpen] = useState(null)
  const [chat, setChat] = useState([{ from: 'bot', text: 'Habari! I am the Haraka guide. Pick a topic or type a question. I give written answers (I am not an AI). For anything else, message our team below.' }])
  const [q, setQ] = useState('')
  const ask = (a, b) => setChat(c => [...c, { from: 'me', text: a }, { from: 'bot', text: b }])
  const sendQ = (e) => { e.preventDefault(); if (!q.trim()) return; const t = answer(q); ask(q, t ? t.a : 'I do not have a written answer for that yet. Please message our team below.'); setQ('') }
  const [form, setForm] = useState({ subject: '', message: '' })
  const [s, setS] = useState({})
  const [sent, setSent] = useState([])
  const load = () => get('/api/support').then(setSent).catch(() => {})
  useEffect(() => { load() }, [])

  const send = async (e) => {
    e.preventDefault(); setS({})
    try { await post('/api/support', form); setForm({ subject: '', message: '' }); setS({ ok: 'Message sent. We will get back to you.' }); load() } catch (err) { setS({ error: errMsg(err) }) }
  }

  return (
    <SubScreen title="Support">
      <h2 className="font-bold mb-2">Haraka guide</h2>
      <div className="bg-white rounded-2xl border p-4 mb-5">
        <div className="space-y-2 max-h-64 overflow-y-auto">{chat.map((m, i) => <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : ''}`}><p className={`text-sm rounded-2xl px-3 py-2 max-w-[85%] ${m.from === 'me' ? 'bg-bolt text-white' : 'bg-gray-100'}`}>{m.text}</p></div>)}</div>
        <div className="flex flex-wrap gap-2 mt-3">{TOPICS.map(t => <button key={t.id} onClick={() => ask(t.q, t.a)} className="text-xs border border-bolt/50 text-bolt rounded-full px-3 py-1.5">{t.q}</button>)}</div>
        <form onSubmit={sendQ} className="flex gap-2 mt-3"><input className={field} placeholder="Type your question" value={q} onChange={e => setQ(e.target.value)} /><button className="bg-bolt text-white rounded-2xl px-4 font-semibold">Ask</button></form>
      </div>
      <h2 className="font-bold mb-2">Help centre</h2>
      <div className="bg-white rounded-2xl border divide-y mb-5">
        {FAQ.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-3 p-4 text-left"><span className="flex-1 font-medium">{q}</span><Icon name="chev" size={16} className={`text-gray-400 transition-transform ${open === i ? 'rotate-90' : ''}`} /></button>
            {open === i && <p className="px-4 pb-4 text-sm text-gray-600">{a}</p>}
          </div>))}
      </div>

      <form onSubmit={send} className="bg-white rounded-2xl border p-4 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Icon name="chat" size={18} />Contact us</h2>
        <Msg ok={s.ok} error={s.error} />
        <input className={field} placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} maxLength={80} required />
        <textarea className={`${field} h-28`} placeholder="Tell us what happened" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} maxLength={1000} required />
        <button className="w-full bg-bolt text-white py-3 rounded-2xl font-semibold">Send message</button>
      </form>

      {sent.length > 0 && (<>
        <h2 className="font-bold mt-5 mb-2">Your messages</h2>
        <div className="bg-white rounded-2xl border divide-y">
          {sent.map(m => (<div key={m.id} className="p-4"><p className="font-medium">{m.subject}</p><p className="text-xs text-gray-500 mt-0.5">{new Date(m.createdAt).toLocaleDateString('en-GB')} · {m.status === 'OPEN' ? 'Received' : m.status}</p></div>))}
        </div>
      </>)}
    </SubScreen>
  )
}
