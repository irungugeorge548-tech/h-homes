import { Link } from 'react-router-dom'
import HomeImage, { bedLabel, TYPE_LABEL } from './HomeImage'
import Icon from './Icon'
import { money } from '../lib/api'

export default function HomeCard({ h, onSave, to }) {
  return (
    <Link to={to || `/listing/${h.id}`} className="block bg-white rounded-3xl border shadow-sm overflow-hidden active:opacity-90">
      <div className="relative">
        <HomeImage cover={h.cover} type={h.type} className="w-full h-44" />
        {onSave && <button type="button" aria-label={h.saved ? 'Unsave' : 'Save'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(h) }} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
          <Icon name="heart" size={22} fill={h.saved} className={h.saved ? 'text-red-500' : 'text-gray-600'} />
        </button>}
        {h.status && h.status !== 'AVAILABLE' && <span className="absolute top-3 left-3 text-xs font-semibold rounded-full px-3 py-1 bg-black/60 text-white">{h.status === 'OCCUPIED' ? 'Occupied' : 'Hidden'}</span>}
      </div>
      <div className="p-4">
        <p className="text-xl font-extrabold">{money(h.rent)}<span className="text-sm font-medium text-gray-500"> / month</span></p>
        <p className="font-semibold mt-0.5 truncate">{h.title}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Icon name="pin" size={15} />{h.area} · {bedLabel(h)} · {TYPE_LABEL[h.type] || h.type}</p>
      </div>
    </Link>
  )
}
