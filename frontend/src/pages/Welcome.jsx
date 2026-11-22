import { Link } from 'react-router-dom'
import Mascot from '../components/Mascot'
import Icon from '../components/Icon'
import { setMode } from '../lib/api'

export default function Welcome() {
  const pick = (m) => setMode(m)
  return (
    <div className="min-h-screen bg-bolt flex flex-col">
      <div className="flex flex-col items-center pt-10 pb-4 text-white">
        <Mascot size={200} ride />
        <h1 className="text-3xl font-extrabold mt-1">H-Homes</h1>
        <p className="text-white/85 text-sm">Find a home. Pay rent your way.</p>
      </div>
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-8 flex-1 space-y-4">
        <h2 className="text-xl font-bold">What brings you here?</h2>
        <Link to="/login?mode=register" onClick={() => pick('tenant')} className="flex items-center gap-4 border-2 rounded-3xl p-5 active:bg-gray-50">
          <span className="w-12 h-12 rounded-full bg-bolt/15 text-bolt flex items-center justify-center"><Icon name="key" size={26} /></span>
          <span className="flex-1"><span className="block font-bold text-lg">I am looking for a home</span><span className="block text-sm text-gray-500">Browse homes, apply, pay rent in full or little by little</span></span>
          <Icon name="chev" className="text-gray-400" />
        </Link>
        <Link to="/login?mode=register" onClick={() => pick('landlord')} className="flex items-center gap-4 border-2 rounded-3xl p-5 active:bg-gray-50">
          <span className="w-12 h-12 rounded-full bg-bolt/15 text-bolt flex items-center justify-center"><Icon name="building" size={26} /></span>
          <span className="flex-1"><span className="block font-bold text-lg">I own property</span><span className="block text-sm text-gray-500">List homes, add tenants, receive rent straight to your wallet</span></span>
          <Icon name="chev" className="text-gray-400" />
        </Link>
        <p className="text-xs text-gray-500 text-center">One account can do both. You can switch any time in Account.</p>
        <p className="text-center text-sm pt-2">Already have an account? <Link to="/login" className="text-bolt font-semibold">Log in</Link></p>
      </div>
    </div>
  )
}
