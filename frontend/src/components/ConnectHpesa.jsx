import { useState } from 'react'
import axios from 'axios'
import { setHpesaToken, errMsg, HPESA_URL } from '../lib/api'
import Icon from './Icon'
import { PasswordInput } from './extras'

const field = 'w-full px-4 py-3.5 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-bolt bg-white text-gray-900'

// Optional step: connect an H-Pesa wallet to this H-Homes account. Nothing is created in H-Pesa;
// the person just proves the wallet is theirs by logging in to it once.
export default function ConnectHpesa({ defaultPhone = '', reconnect = false, authToken, onDone, onSkip, light = false }) {
  const [phone, setPhone] = useState(defaultPhone)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const token = authToken || localStorage.getItem('hhomes_token')
      const r = await axios.post('/api/hpesa/link', { phone, password }, { headers: { Authorization: `Bearer ${token}` } })
      setHpesaToken(r.data.hpesaToken)
      try {
        const u = JSON.parse(localStorage.getItem('hhomes_user') || '{}')
        localStorage.setItem('hhomes_user', JSON.stringify({ ...u, hpesaLinked: true, hpesaPhone: r.data.phone }))
      } catch { /* ignore */ }
      onDone?.(r.data)
    } catch (err) { setError(errMsg(err, 'Could not connect H-Pesa')) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className={`rounded-3xl p-5 space-y-3 ${light ? 'bg-white border' : 'bg-gray-50 border'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-bolt/15 text-bolt flex items-center justify-center"><Icon name="wallet" size={20} /></div>
        <div>
          <p className="font-bold">{reconnect ? 'Reconnect your H-Pesa' : 'Connect your H-Pesa wallet'}</p>
          <p className="text-xs text-gray-500">{reconnect ? 'Enter your H-Pesa password to see your balance.' : 'Pay or receive rent with your H-Pesa wallet. You can connect later too.'}</p>
        </div>
      </div>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
      <input className={field} type="tel" placeholder="H-Pesa phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
      <PasswordInput className={field} placeholder="H-Pesa password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button disabled={busy} className="w-full bg-bolt disabled:opacity-60 text-white py-3.5 rounded-2xl font-semibold">{busy ? 'Connecting…' : 'Connect H-Pesa'}</button>
      {onSkip && <button type="button" onClick={onSkip} className="w-full text-gray-500 py-2 text-sm font-medium">Not now</button>}
      {HPESA_URL && <p className="text-center text-xs text-gray-500">No H-Pesa account yet? <a href={HPESA_URL} target="_blank" rel="noreferrer" className="text-bolt font-semibold">Create one</a></p>}
    </form>
  )
}
