import { useState } from 'react'
import Icon from './Icon'

export function PasswordInput({ className = '', type: _t, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={`${className} pr-12`} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide' : 'Show'} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500"><Icon name={show ? 'eyeoff' : 'eye'} size={20} /></button>
    </div>
  )
}
export function Avatar({ user, size = 56, className = '' }) {
  return user?.photo
    ? <img src={user.photo} alt="" style={{ width: size, height: size }} className={`rounded-full object-cover ${className}`} />
    : <span style={{ width: size, height: size, fontSize: size / 2.4 }} className={`rounded-full bg-bolt/15 text-bolt flex items-center justify-center font-bold ${className}`}>{(user?.name || '?')[0]}</span>
}
export function shrinkImage(file, max = 256, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL('image/jpeg', quality)) }
    img.onerror = () => reject(new Error('Could not read that picture'))
    img.src = URL.createObjectURL(file)
  })
}

const fmt = (iso) => new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
export const rentReceiptText = (p, t, user) => [
  'H-HOMES RENT RECEIPT', '------------------------------', `Receipt no: ${p.id}`, `Paid: ${fmt(p.createdAt)}`,
  `Home: ${t.home?.title || ''}${t.home?.area ? ', ' + t.home.area : ''}`, `Landlord: ${t.landlord?.name || ''}`, `Tenant: ${user?.name || t.tenantName || ''}`,
  `Amount: KES ${Number(p.amount).toLocaleString()}`, `Paid with: H-Pesa wallet`, `Status: ${p.status}`,
  '------------------------------', 'Pre-launch demo. Haraka Pesa is not yet a registered company.'].join('\n')
export const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); a.remove() }
export const share = async (title, text) => {
  if (navigator.share) { try { await navigator.share({ title, text }); return } catch { return } }
  try { await navigator.clipboard.writeText(text); alert('Copied') } catch { window.prompt('Copy', text) }
}
export function ReceiptSheet({ text, id, onClose }) {
  if (!text) return null
  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <p className="font-extrabold text-lg mb-2 flex items-center gap-2"><Icon name="receipt" size={22} className="text-bolt" />Receipt</p>
        <pre className="bg-gray-50 border rounded-2xl p-3 text-xs whitespace-pre-wrap">{text}</pre>
        <div className="flex gap-3 mt-4">
          <button onClick={() => share('H-Homes receipt', text)} className="flex-1 bg-bolt text-white rounded-2xl py-3 font-semibold">Share</button>
          <button onClick={() => download(`hhomes-receipt-${id}.txt`, text)} className="flex-1 border border-bolt text-bolt rounded-2xl py-3 font-semibold">Download</button>
        </div>
        <button onClick={onClose} className="w-full mt-3 text-gray-500 py-2">Close</button>
      </div>
    </div>
  )
}
// Balance is hidden by default; "Request balance" shows it for a few seconds
export function useReveal(ms = 8000) {
  const [on, setOn] = useState(false)
  const reveal = () => { setOn(true); setTimeout(() => setOn(false), ms) }
  return [on, reveal]
}
