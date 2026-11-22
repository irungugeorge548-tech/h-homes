import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { getMode } from '../lib/api'

const TENANT = [
  { to: '/', label: 'Explore', icon: 'search', end: true },
  { to: '/saved', label: 'Saved', icon: 'heart' },
  { to: '/my-home', label: 'My Home', icon: 'key' },
  { to: '/account', label: 'Account', icon: 'user' },
]
const LANDLORD = [
  { to: '/', label: 'Properties', icon: 'building', end: true },
  { to: '/tenants', label: 'Tenants', icon: 'people' },
  { to: '/money', label: 'Money', icon: 'money' },
  { to: '/account', label: 'Account', icon: 'user' },
]

export default function TabBar() {
  const tabs = getMode() === 'landlord' ? LANDLORD : TENANT
  return (
    <nav className="bg-white border-t flex justify-around pt-2 pb-3 z-[1200] relative">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.end}
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-xs w-20 ${isActive ? 'text-bolt font-semibold' : 'text-gray-500'}`}>
          <Icon name={t.icon} size={26} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
