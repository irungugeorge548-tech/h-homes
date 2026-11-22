import { useEffect, useState } from 'react'
import { get, post, getHpesaToken, setHpesaToken, HPESA_URL } from '../lib/api'
import SubScreen from '../components/SubScreen'
import ConnectHpesa from '../components/ConnectHpesa'
import { useReveal } from '../components/extras'

const topUpUrl = (phone) => {
  const t = getHpesaToken()
  if (t) return `${HPESA_URL}/#sso=${encodeURIComponent(t)}&next=/deposit`
  return `${HPESA_URL}/login${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`
}

export default function Wallet() {
  const [w, setW] = useState(undefined)
  const balance = w === undefined ? undefined : w === null || w.balance === undefined ? null : w.balance
  const [shown, reveal] = useReveal()
  const load = () => get('/api/wallet/balance').then(setW).catch(() => setW(null))
  useEffect(() => { load() }, [])
  return (
    <SubScreen title="Payment">
      {w && w.linked === false && <ConnectHpesa light onDone={() => { setW(undefined); load() }} />}
      {w && w.linked && w.reconnect && <ConnectHpesa light reconnect onDone={() => { setW(undefined); load() }} />}
      {!(w && (w.linked === false || w.reconnect)) && (
        <div className="rounded-3xl bg-bolt text-white p-6 shadow-lg">
          <p className="text-sm text-white/80">H-Pesa balance</p>
          <p className="text-4xl font-extrabold mt-1">{balance === undefined ? '…' : balance === null ? '—' : shown ? `KES ${Number(balance).toLocaleString()}` : 'KES ••••••'}</p>
          {balance !== undefined && balance !== null && !shown && <button onClick={reveal} className="mt-2 bg-white text-bolt font-semibold rounded-full px-4 py-1.5 text-sm">Request balance</button>}
          {balance === null && <p className="text-xs text-white/80 mt-2">Balance unavailable right now. H-Pesa could not be reached.</p>}
          {balance === null && <button onClick={() => { setW(undefined); load() }} className="mt-3 bg-white/20 rounded-full px-4 py-1.5 text-sm">Try again</button>}
          <p className="text-xs text-white/70 mt-4">Tenants pay rent from this wallet. Landlords receive rent into it.</p>
          <div className="flex gap-2 flex-wrap">
            {HPESA_URL && <a href={topUpUrl(w?.phone)} className="inline-block mt-3 bg-white text-bolt font-semibold rounded-full px-5 py-2 text-sm">Top up in H-Pesa</a>}
            {w?.linked && <button onClick={async () => { if (!window.confirm('Disconnect H-Pesa from H-Homes? Your H-Homes account stays.')) return; try { await post('/api/hpesa/unlink'); setHpesaToken(null); setW(undefined); load() } catch { /* ignore */ } }} className="mt-3 bg-white/20 rounded-full px-4 py-2 text-sm">Disconnect</button>}
          </div>
        </div>)}
    </SubScreen>
  )
}
