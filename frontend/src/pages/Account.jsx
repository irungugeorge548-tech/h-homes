import { Link, useNavigate } from 'react-router-dom'
import { getUser, getMode, setMode } from '../lib/api'
import TabBar from '../components/TabBar'
import Icon from '../components/Icon'
import { Avatar } from '../components/extras'

const items = [
  { icon: 'user', title: 'Profile', sub: 'Personal information, photo', to: '/account/profile' },
  { icon: 'wallet', title: 'Payment', sub: 'H-Pesa wallet for rent', to: '/wallet' },
  { icon: 'chat', title: 'Support', sub: 'Help centre, chat with us', to: '/account/support' },
  { icon: 'gear', title: 'Settings', sub: 'Language, install the app', to: '/account/settings' },
]

export default function Account({ logout }) {
  const user = getUser()
  const mode = getMode()
  const navigate = useNavigate()
  const switchMode = () => { setMode(mode === 'landlord' ? 'tenant' : 'landlord'); navigate('/'); window.location.reload() }
  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Account</h1>
        <div className="flex items-center gap-4 mt-5">
          <Avatar user={user} size={80} />
          <div><p className="text-2xl font-extrabold">{user.name || 'Welcome'}</p><p className="text-sm text-gray-500">{user.phone}</p></div>
        </div>
        <button onClick={switchMode} className="w-full mt-5 bg-bolt/10 text-bolt rounded-2xl p-4 flex items-center gap-3 text-left">
          <Icon name={mode === 'landlord' ? 'key' : 'building'} size={24} />
          <span className="flex-1"><span className="block font-bold">{mode === 'landlord' ? 'Switch to renting a home' : 'Switch to managing property'}</span><span className="block text-xs">{mode === 'landlord' ? 'Find homes, pay your rent' : 'List homes, add tenants, collect rent'}</span></span>
          <Icon name="chev" size={18} />
        </button>
        <div className="mt-4 space-y-3">
          {items.map(i => (
            <Link key={i.title} to={i.to} className="flex items-center gap-4 border rounded-2xl p-4 shadow-sm active:bg-gray-50">
              <div className="w-11 h-11 rounded-full bg-bolt/10 text-bolt flex items-center justify-center"><Icon name={i.icon} size={22} /></div>
              <div className="flex-1"><p className="font-semibold">{i.title}</p><p className="text-xs text-gray-500">{i.sub}</p></div>
              <Icon name="chev" size={18} className="text-gray-400" />
            </Link>))}
        </div>
        <button onClick={logout} className="w-full mt-6 mb-6 border border-red-200 text-red-600 py-3 rounded-2xl font-semibold">Log out</button>
      </div>
      <TabBar />
    </div>
  )
}
