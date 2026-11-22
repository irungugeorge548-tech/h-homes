import { useEffect, useState } from 'react'
import SubScreen, { field, Msg } from '../components/SubScreen'
import { get, patch, post, errMsg } from '../lib/api'
import { Link } from 'react-router-dom'
import { PasswordInput, Avatar, shrinkImage } from '../components/extras'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
    const [s, setS] = useState({})
  const [sp, setSp] = useState({})

  useEffect(() => { get('/api/account/me').then(u => { setMe(u); setForm({ name: u.name, email: u.email }) }).catch(e => setS({ error: errMsg(e) })) }, [])

  const run = (setState, fn, done) => async (e) => {
    e.preventDefault(); setState({})
    try { const r = await fn(); setState({ ok: done(r) }) } catch (err) { setState({ error: errMsg(err) }) }
  }
  const saveProfile = run(setS, () => patch('/api/account/profile', form), (u) => {
    localStorage.setItem('hhomes_user', JSON.stringify(u)); setMe(u); return 'Saved'
  })

  const pick = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    try { const u = await patch('/api/account/photo', { photo: await shrinkImage(f) }); localStorage.setItem('hhomes_user', JSON.stringify(u)); setMe(u); setS({ ok: 'Saved' }) } catch (err) { setS({ error: errMsg(err) }) }
  }
  return (
    <SubScreen title="Profile">
      {!me ? <><Msg error={s.error} />{!s.error && <p className="text-gray-400">Loading…</p>}</> : (<>
        <div className="bg-white rounded-3xl border p-5 mb-4 flex flex-col items-center gap-2">
          <Avatar user={me} size={92} />
          <label className="text-bolt font-semibold text-sm cursor-pointer">Change photo<input type="file" accept="image/*" onChange={pick} className="hidden" /></label>
        </div>
        <form onSubmit={saveProfile} className="bg-white rounded-3xl border p-5 space-y-3 mb-4">
          <Msg ok={s.ok} error={s.error} />
          <label className="block text-sm text-gray-700">Full name</label>
          <input className={field} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <label className="block text-sm text-gray-700">Email</label>
          <input className={field} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label className="block text-sm text-gray-700">Phone (your H-Homes number)</label>
          <input className={`${field} bg-gray-50 text-gray-500`} value={me.phone} disabled />
          <button className="w-full bg-bolt text-white py-3.5 rounded-2xl font-semibold">Save</button>
        </form>
        <div className="bg-white rounded-3xl border p-5 mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold">H-Pesa wallet</h2>
            <p className="text-sm text-gray-500 truncate">{me.hpesaLinked ? `Connected: ${me.hpesaPhone}` : 'Not connected yet'}</p>
          </div>
          <Link to="/wallet" className="border border-bolt text-bolt rounded-2xl px-4 py-2.5 font-semibold text-sm whitespace-nowrap">{me.hpesaLinked ? 'Manage' : 'Connect'}</Link>
        </div>
        <form onSubmit={run(setSp, () => post('/api/account/change-password', pw), (r) => { setPw({ currentPassword: '', newPassword: '' }); return r.message })} className="bg-white rounded-3xl border p-5 space-y-3">
          <h2 className="font-bold">Change password</h2><Msg ok={sp.ok} error={sp.error} />
          <PasswordInput className={field} placeholder="Current password" value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} required />
          <PasswordInput className={field} placeholder="New password (6+ characters)" value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} required />
          <button className="w-full border border-bolt text-bolt py-3.5 rounded-2xl font-semibold">Change password</button>
        </form>
      </>)}
    </SubScreen>
  )
}
