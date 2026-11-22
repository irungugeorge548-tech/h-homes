import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get, getUser } from '../lib/api'
import TabBar from '../components/TabBar'
import ChatBot from '../components/ChatBot'
import HomeCard from '../components/HomeCard'
import Icon from '../components/Icon'

export default function Properties() {
  const [homes, setHomes] = useState(null)
  const [linked, setLinked] = useState(true)
  const user = getUser()
  useEffect(() => { get('/api/homes/mine').then(setHomes).catch(() => setHomes([])); get('/api/hpesa/status').then(s => setLinked(s.linked)).catch(() => {}) }, [])
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto px-5 pt-6 space-y-4">
        <div className="flex items-center"><h1 className="text-3xl font-extrabold flex-1">Properties</h1>
          <Link to="/properties/new" className="bg-bolt text-white rounded-full px-4 py-2.5 font-semibold flex items-center gap-1"><Icon name="plus" size={18} />Add</Link></div>
        {!linked && <Link to="/wallet" className="block bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm"><b>Connect your H-Pesa wallet</b> so tenants can pay rent straight to you. Tap here.</Link>}
        {homes === null && <p className="text-center text-gray-500 py-10">Loading…</p>}
        {homes?.length === 0 && <div className="text-center py-10 text-gray-500"><Icon name="building" size={40} className="mx-auto text-gray-300" /><p className="mt-3 font-semibold">No properties yet</p><p className="text-sm">Add your first home with photos and rent.</p></div>}
        {homes?.map(h => (
          <div key={h.id}>
            <HomeCard h={h} to={`/properties/${h.id}/edit`} />
            <div className="flex gap-2 mt-2 text-xs">
              {h.tenant && <span className="bg-bolt/10 text-bolt rounded-full px-3 py-1">Tenant: {h.tenant.name}</span>}
              {h.pendingApplications > 0 && <Link to="/tenants" className="bg-amber-100 text-amber-700 rounded-full px-3 py-1">{h.pendingApplications} application{h.pendingApplications > 1 ? 's' : ''}</Link>}
              {!h.photoCount && <span className="bg-gray-200 text-gray-600 rounded-full px-3 py-1">Add photos to get more interest</span>}
            </div>
          </div>))}
        <div className="h-4" />
      </div>
      <ChatBot name={user.name?.split(' ')[0]} />
      <TabBar />
    </div>
  )
}
