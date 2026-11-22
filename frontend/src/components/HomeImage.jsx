import { photoUrl } from '../lib/api'
import Icon from './Icon'

const TONES = { BEDSITTER: ['#7cc9a4', '#2f9e6b'], STUDIO: ['#9ad1c4', '#3a9d8c'], APARTMENT: ['#8fd0a8', '#32BB78'], HOUSE: ['#b3d98a', '#5aa83a'], MAISONETTE: ['#8ec5d6', '#3b8fae'] }

// The listing's real photo when the landlord uploaded one, otherwise a clean placeholder.
export default function HomeImage({ cover, type = 'APARTMENT', className = '', photoId }) {
  const id = photoId || cover
  if (id) return <img src={photoUrl(id)} alt="" loading="lazy" className={`object-cover ${className}`} />
  const [a, b] = TONES[type] || TONES.APARTMENT
  return (
    <div className={`flex flex-col items-center justify-center text-white/90 ${className}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      <Icon name="building" size={34} />
      <span className="text-[11px] mt-1 font-medium">No photo yet</span>
    </div>
  )
}

export const TYPE_LABEL = { BEDSITTER: 'Bedsitter', STUDIO: 'Studio', APARTMENT: 'Apartment', HOUSE: 'House', MAISONETTE: 'Maisonette' }
export const bedLabel = (h) => (h.bedrooms === 0 ? 'Bedsitter' : `${h.bedrooms} bedroom${h.bedrooms === 1 ? '' : 's'}`)
