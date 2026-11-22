import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'
import ConnectHpesa from '../components/ConnectHpesa'
import { errMsg } from '../lib/api'
import { PasswordInput } from '../components/extras'

const field = 'w-full px-4 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-bolt'

export default function Login({ onLogin }) {
  // H-Pesa can send people here with their name, phone and email already filled in (never a password or PIN)
  const [q] = useSearchParams()
  const fromHpesa = q.get('register') === '1'
  const [mode, setMode] = useState(fromHpesa || q.get('mode') === 'register' ? 'register' : 'login') // login | register
  const [form, setForm] = useState({ name: q.get('name') || '', phone: q.get('phone') || '', email: q.get('email') || '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [pending, setPending] = useState(null) // a new account, waiting for the optional "connect H-Pesa" step
  const navigate = useNavigate()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const finish = (data) => { onLogin(data); navigate('/') }

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (mode === 'register' && !accepted) return setError('Please accept the Terms of Use and Privacy Policy to continue')
    setBusy(true)
    try {
      const res = await axios.post(`/api/auth/${mode}`, mode === 'login' ? { phone: form.phone, password: form.password } : { ...form, acceptTerms: true })
      if (mode === 'register') setPending(res.data); else finish(res.data)
    } catch (err) { setError(errMsg(err, 'Something went wrong')) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-bolt flex flex-col">
      <div className="flex flex-col items-center pt-8 pb-3 text-white">
        <Mascot size={180} ride />
        <h1 className="text-3xl font-extrabold mt-1">H-Homes</h1>
      </div>
      <div className="bg-white rounded-t-3xl px-6 pt-7 pb-8 flex-1">
        {pending ? (<>
          <h2 className="text-xl font-bold">Welcome, {pending.user.name.split(' ')[0]}!</h2>
          <p className="text-gray-500 text-sm mb-4">Your H-Homes account is ready. Connect your H-Pesa wallet now to pay or receive rent?</p>
          <ConnectHpesa defaultPhone={pending.user.phone} authToken={pending.token} onDone={(r) => finish({ ...pending, user: { ...pending.user, hpesaLinked: true, hpesaPhone: r?.phone } })} onSkip={() => finish(pending)} />
        </>) : (<>
          <h2 className="text-xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your H-Homes account'}</h2>
          <p className="text-gray-500 text-sm mb-4">
            {mode === 'login' ? 'Log in with your H-Homes password' : fromHpesa ? 'We filled in your details from H-Pesa. Choose a password for H-Homes.' : 'Rent or rent out homes. Connect H-Pesa after, or later.'}
          </p>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-3 text-sm">{error}</div>}
          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && <input className={field} placeholder="Full name" value={form.name} onChange={set('name')} required />}
            <input className={field} type="tel" placeholder="Phone number (07XX XXX XXX)" value={form.phone} onChange={set('phone')} required />
            {mode === 'register' && <input className={field} type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} />}
            <PasswordInput className={field} placeholder={mode === 'login' ? 'Password' : 'Choose a password (6+ characters)'} value={form.password} onChange={set('password')} minLength={mode === 'register' ? 6 : undefined} required />
            {mode === 'register' && <label className="flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1 w-5 h-5 accent-green-600" /><span>I accept the <Link to="/terms" className="text-bolt font-semibold underline">Terms of Use</Link> and <Link to="/privacy" className="text-bolt font-semibold underline">Privacy Policy</Link>.</span></label>}
            <button disabled={busy} className="w-full bg-bolt disabled:opacity-60 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2">
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}{!busy && <Icon name="arrow" size={20} />}
            </button>
          </form>
          <p className="text-center mt-5 text-sm">
            {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }} className="text-bolt font-semibold">{mode === 'login' ? 'Create account' : 'Log in'}</button>
          </p>
        </>)}
      </div>
    </div>
  )
}
