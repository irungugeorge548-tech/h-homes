import { useEffect, useState } from 'react'
import { get, post, getUser } from '../lib/api'
import TabBar from '../components/TabBar'
import ChatBot from '../components/ChatBot'
import HomeCard from '../components/HomeCard'
import Icon from '../components/Icon'
import { TYPE_LABEL } from '../components/HomeImage'

const BEDS = [['', 'Any'], ['0', 'Bedsitter'], ['1', '1 bed'], ['2', '2 beds'], ['3', '3 beds'], ['4', '4+']]
const PRICES = [['', 'Any price'], ['10000', 'Up to 10k'], ['20000', 'Up to 20k'], ['40000', 'Up to 40k'], ['80000', 'Up to 80k']]

export default function Explore() {
  const [q, setQ] = useState('')
  const [f, setF] = useState({ bedrooms: '', type: '', maxRent: '', sort: '' })
  const [homes, setHomes] = useState(null)
  const [error, setError] = useState('')
  const user = getUser()

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ ...(q ? { q } : {}), ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')) })
      get(`/api/homes?${p}`).then(h => { setHomes(h); setError('') }).catch(() => setError('Could not load homes. Check your connection.'))
    }, 250)
    return () => clearTimeout(t)
  }, [q, f])

  const save = async (h) => {
    setHomes(list => list.map(x => x.id === h.id ? { ...x, saved: !x.saved } : x))
    try { await post(`/api/homes/${h.id}/save`) } catch { setHomes(list => list.map(x => x.id === h.id ? { ...x, saved: h.saved } : x)) }
  }
  const sel = 'flex-shrink-0 border rounded-full px-3 py-2 text-sm bg-white'

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-bolt text-white px-5 pt-6 pb-4">
        <p className="text-sm text-white/85">Habari{user.name ? ', ' + user.name.split(' ')[0] : ''}</p>
        <h1 className="text-2xl font-extrabold">Find your next home</h1>
        <div className="mt-3 relative">
          <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by area, e.g. Kilimani" className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-gray-900 focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-5 py-3 bg-white border-b">
        <select aria-label="Bedrooms" value={f.bedrooms} onChange={e => setF({ ...f, bedrooms: e.target.value })} className={sel}>{BEDS.map(([v, l]) => <option key={v} value={v}>{v === '' ? 'Bedrooms' : l}</option>)}</select>
        <select aria-label="Type" value={f.type} onChange={e => setF({ ...f, type: e.target.value })} className={sel}><option value="">Type</option>{Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select aria-label="Price" value={f.maxRent} onChange={e => setF({ ...f, maxRent: e.target.value })} className={sel}>{PRICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select aria-label="Sort" value={f.sort} onChange={e => setF({ ...f, sort: e.target.value })} className={sel}><option value="">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
        {homes === null && !error && <p className="text-center text-gray-500 py-10">Loading…</p>}
        {homes?.length === 0 && <div className="text-center py-12 text-gray-500"><Icon name="building" size={40} className="mx-auto text-gray-300" /><p className="mt-3 font-semibold">No homes match yet</p><p className="text-sm">Try another area or clear a filter. New homes are added often.</p></div>}
        {homes?.map(h => <HomeCard key={h.id} h={h} onSave={save} />)}
      </div>
      <ChatBot name={user.name?.split(' ')[0]} />
      <TabBar />
    </div>
  )
}
