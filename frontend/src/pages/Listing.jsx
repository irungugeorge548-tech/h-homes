import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { get, post, errMsg, money } from '../lib/api'
import Icon from '../components/Icon'
import HomeImage, { bedLabel, TYPE_LABEL } from '../components/HomeImage'
import { Msg } from '../components/SubScreen'

export default function Listing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [h, setH] = useState(null)
  const [error, setError] = useState('')
  const [apply, setApply] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState('')
  useEffect(() => { get(`/api/homes/${id}`).then(setH).catch(e => setError(errMsg(e, 'Home not found'))) }, [id])

  const save = async () => { setH({ ...h, saved: !h.saved }); try { await post(`/api/homes/${id}/save`) } catch { setH(h) } }
  const send = async () => {
    setBusy(true); setError('')
    try { await post('/api/applications', { homeId: id, message }); setH({ ...h, applied: true }); setApply(false); setOk('Application sent. The landlord will respond soon. Find it in My Home.') } catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }

  if (!h) return <div className="h-screen bg-white p-5"><button onClick={() => navigate(-1)} className="mb-4"><Icon name="back" /></button>{error ? <Msg error={error} /> : <p className="text-gray-500">Loading…</p>}</div>
  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          <div className="flex overflow-x-auto snap-x snap-mandatory">
            {h.photos.length === 0 ? <HomeImage type={h.type} className="w-full h-64 flex-shrink-0" /> : h.photos.map(p => <HomeImage key={p} photoId={p} className="w-full h-64 flex-shrink-0 snap-center" />)}
          </div>
          <button onClick={() => navigate(-1)} aria-label="Back" className="absolute top-4 left-4 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center"><Icon name="back" /></button>
          {!h.isOwner && <button onClick={save} aria-label="Save" className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center"><Icon name="heart" fill={h.saved} className={h.saved ? 'text-red-500' : 'text-gray-600'} /></button>}
          {h.photos.length > 1 && <span className="absolute bottom-3 right-3 text-xs bg-black/60 text-white rounded-full px-3 py-1">{h.photos.length} photos · swipe</span>}
        </div>
        <div className="p-5">
          <Msg ok={ok} error={error} />
          <p className="text-3xl font-extrabold">{money(h.rent)}<span className="text-base font-medium text-gray-500"> / month</span></p>
          <h1 className="text-xl font-bold mt-1">{h.title}</h1>
          <p className="text-gray-500 flex items-center gap-1 mt-1"><Icon name="pin" size={16} />{h.area}{h.address ? `, ${h.address}` : ''}</p>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="border rounded-2xl p-3"><Icon name="bed" className="mx-auto text-bolt" /><p className="text-xs text-gray-500 mt-1">{bedLabel(h)}</p></div>
            <div className="border rounded-2xl p-3"><Icon name="building" className="mx-auto text-bolt" /><p className="text-xs text-gray-500 mt-1">{TYPE_LABEL[h.type]}</p></div>
            <div className="border rounded-2xl p-3"><Icon name="money" className="mx-auto text-bolt" /><p className="text-xs text-gray-500 mt-1">Deposit {money(h.deposit)}</p></div>
          </div>
          {h.description && <><h2 className="font-bold mt-5 mb-1">About this home</h2><p className="text-gray-600 text-sm whitespace-pre-wrap">{h.description}</p></>}
          {h.amenities && <><h2 className="font-bold mt-5 mb-2">What it has</h2><div className="flex flex-wrap gap-2">{h.amenities.split(',').map(a => <span key={a} className="text-sm bg-bolt/10 text-bolt rounded-full px-3 py-1.5">{a}</span>)}</div></>}
          <div className="flex items-center gap-3 mt-6 border rounded-2xl p-4">
            <span className="w-11 h-11 rounded-full bg-bolt/15 text-bolt flex items-center justify-center font-bold">{h.owner.name[0]}</span>
            <div><p className="text-xs text-gray-500">Listed by</p><p className="font-semibold">{h.owner.name}</p></div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Once you move in, pay rent from H-Pesa in full or little by little with Lipa Mdogo Mdogo.</p>
        </div>
      </div>
      <div className="p-4 border-t bg-white">
        {h.isOwner ? <Link to={`/properties/${h.id}/edit`} className="block text-center bg-bolt text-white rounded-2xl py-4 font-semibold">Edit this listing</Link>
          : h.status !== 'AVAILABLE' ? <p className="text-center text-gray-500 py-3">This home is not available right now</p>
          : h.applied ? <p className="text-center text-bolt font-semibold py-3">Application sent</p>
          : <button onClick={() => setApply(true)} className="w-full bg-bolt text-white rounded-2xl py-4 font-semibold text-lg">Apply for this home</button>}
      </div>
      {apply && (
        <div className="fixed inset-0 z-[3000] bg-black/50 flex items-end" onClick={() => setApply(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <p className="font-extrabold text-lg">Apply for {h.title}</p>
            <p className="text-sm text-gray-500 mb-3">The landlord sees your name and phone. Add a short note if you like.</p>
            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500} rows={3} placeholder="e.g. I work nearby and can move in next month" className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-bolt" />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <button disabled={busy} onClick={send} className="w-full bg-bolt disabled:opacity-60 text-white rounded-2xl py-3.5 font-semibold mt-3">{busy ? 'Sending…' : 'Send application'}</button>
            <button onClick={() => setApply(false)} className="w-full text-gray-500 py-2 mt-1">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
