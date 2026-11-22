import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { get, post, patch, del, errMsg } from '../lib/api'
import SubScreen, { field, Msg } from '../components/SubScreen'
import HomeImage, { TYPE_LABEL } from '../components/HomeImage'
import Icon from '../components/Icon'
import { shrinkImage } from '../components/extras'

const AMENITIES = ['Water', 'Electricity', 'Parking', 'Security', 'WiFi', 'Balcony', 'Gym', 'Lift', 'Backup generator', 'Pets allowed']
const blank = { title: '', area: '', address: '', description: '', type: 'APARTMENT', bedrooms: 1, rent: '', deposit: '', amenities: [] }

export default function PropertyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const file = useRef()
  const [f, setF] = useState(blank)
  const [status, setStatus] = useState('AVAILABLE')
  const [photos, setPhotos] = useState([]) // saved: { id }, waiting (new listing): { data }
  const [s, setS] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!id) return
    get(`/api/homes/${id}`).then(h => { setF({ ...h, amenities: h.amenities ? h.amenities.split(',') : [], description: h.description || '', address: h.address || '' }); setStatus(h.status); setPhotos(h.photos.map(p => ({ id: p }))) }).catch(e => setS({ error: errMsg(e) }))
  }, [id])

  const addPhotos = async (e) => {
    const files = [...e.target.files]; e.target.value = ''
    for (const file of files) {
      if (photos.length >= 6) { setS({ error: 'You can add up to 6 photos' }); break }
      try {
        const data = await shrinkImage(file, 1000, 0.7)
        if (id) { const r = await post(`/api/homes/${id}/photos`, { data }); setPhotos(p => [...p, { id: r.id }]) } else setPhotos(p => [...p, { data }])
      } catch (err) { setS({ error: errMsg(err, 'Could not add that picture') }) }
    }
  }
  const removePhoto = async (p, i) => { if (p.id) { try { await del(`/api/homes/${id}/photos/${p.id}`) } catch { return } } setPhotos(list => list.filter((_, j) => j !== i)) }

  const save = async (e) => {
    e.preventDefault(); setS({}); setBusy(true)
    try {
      const body = { ...f, amenities: f.amenities.join(',') }
      if (id) { await patch(`/api/homes/${id}`, { ...body, status: status === 'HIDDEN' ? 'HIDDEN' : 'AVAILABLE' }); setS({ ok: 'Saved' }) }
      else {
        const h = await post('/api/homes', body)
        for (const p of photos) { try { await post(`/api/homes/${h.id}/photos`, { data: p.data }) } catch { /* the rest still saved */ } }
        navigate('/', { replace: true })
      }
    } catch (err) { setS({ error: errMsg(err) }) } finally { setBusy(false) }
  }
  const toggle = (a) => setF({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] })

  return (
    <SubScreen title={id ? 'Edit property' : 'Add a property'}>
      <form onSubmit={save} className="space-y-4 pb-6">
        <Msg ok={s.ok} error={s.error} />
        <div>
          <p className="font-semibold mb-2">Photos <span className="text-xs font-normal text-gray-500">(up to 6, real photos work best)</span></p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <div key={p.id || i} className="relative flex-shrink-0">
                {p.id ? <HomeImage photoId={p.id} className="w-28 h-24 rounded-2xl" /> : <img src={p.data} alt="" className="w-28 h-24 rounded-2xl object-cover" />}
                <button type="button" onClick={() => removePhoto(p, i)} aria-label="Remove photo" className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center"><Icon name="close" size={14} /></button>
              </div>))}
            {photos.length < 6 && <button type="button" onClick={() => file.current.click()} className="flex-shrink-0 w-28 h-24 rounded-2xl border-2 border-dashed border-bolt text-bolt flex flex-col items-center justify-center text-xs font-semibold"><Icon name="camera" size={24} />Add photo</button>}
          </div>
          <input ref={file} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
          {photos.length === 0 && <p className="text-xs text-gray-500 mt-1">Until you add photos, renters see a plain placeholder.</p>}
        </div>
        <input className={field} placeholder="Title, e.g. Sunny 2 bedroom in Kilimani" value={f.title} onChange={set('title')} maxLength={80} required />
        <div className="grid grid-cols-2 gap-3">
          <input className={field} placeholder="Area, e.g. Kilimani" value={f.area} onChange={set('area')} maxLength={60} required />
          <input className={field} placeholder="Street / building (optional)" value={f.address} onChange={set('address')} maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select className={field} value={f.type} onChange={set('type')} aria-label="Type">{Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select className={field} value={f.bedrooms} onChange={set('bedrooms')} aria-label="Bedrooms">{[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n === 0 ? 'Bedsitter (0 beds)' : `${n} bedroom${n > 1 ? 's' : ''}`}</option>)}</select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={field} type="number" inputMode="numeric" placeholder="Monthly rent (KES)" value={f.rent} onChange={set('rent')} required />
          <input className={field} type="number" inputMode="numeric" placeholder="Deposit (KES)" value={f.deposit} onChange={set('deposit')} />
        </div>
        <textarea className={field} rows={4} placeholder="Describe the home" value={f.description} onChange={set('description')} maxLength={1500} />
        <div><p className="font-semibold mb-2">What it has</p><div className="flex flex-wrap gap-2">{AMENITIES.map(a => <button type="button" key={a} onClick={() => toggle(a)} className={`rounded-full px-3 py-2 text-sm border ${f.amenities.includes(a) ? 'bg-bolt text-white border-bolt' : 'bg-white text-gray-700'}`}>{a}</button>)}</div></div>
        {id && status !== 'OCCUPIED' && <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="w-5 h-5 accent-green-600" checked={status === 'HIDDEN'} onChange={e => setStatus(e.target.checked ? 'HIDDEN' : 'AVAILABLE')} />Hide this listing from renters</label>}
        {id && status === 'OCCUPIED' && <p className="text-sm text-gray-500">This home is occupied. End the tenancy in Tenants to list it again.</p>}
        <button disabled={busy} className="w-full bg-bolt disabled:opacity-60 text-white py-4 rounded-2xl font-semibold text-lg">{busy ? 'Saving…' : id ? 'Save changes' : 'Publish listing'}</button>
      </form>
    </SubScreen>
  )
}
