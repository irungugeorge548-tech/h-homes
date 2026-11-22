import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, post } from '../lib/api'
import TabBar from '../components/TabBar'
import HomeCard from '../components/HomeCard'
import Icon from '../components/Icon'

export default function Saved() {
  const [homes, setHomes] = useState(null)
  useEffect(() => { get('/api/homes/saved').then(setHomes).catch(() => setHomes([])) }, [])
  const unsave = async (h) => { setHomes(l => l.filter(x => x.id !== h.id)); try { await post(`/api/homes/${h.id}/save`) } catch { /* ignore */ } }
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto px-5 pt-6 space-y-4">
        <h1 className="text-3xl font-extrabold">Saved</h1>
        {homes === null && <p className="text-center text-gray-500 py-10">Loading…</p>}
        {homes?.length === 0 && <div className="text-center py-12 text-gray-500"><Icon name="heart" size={40} className="mx-auto text-gray-300" /><p className="mt-3 font-semibold">Nothing saved yet</p><p className="text-sm">Tap the heart on a home to keep it here.</p><Link to="/" className="inline-block mt-4 bg-bolt text-white rounded-2xl px-6 py-3 font-semibold">Explore homes</Link></div>}
        {homes?.map(h => <HomeCard key={h.id} h={h} onSave={unsave} />)}
        <div className="h-4" />
      </div>
      <TabBar />
    </div>
  )
}
