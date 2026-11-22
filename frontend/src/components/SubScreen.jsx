import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

export default function SubScreen({ title, children }) {
  const navigate = useNavigate()
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-bolt text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back"><Icon name="back" /></button>
        <h1 className="text-lg font-bold">{title}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
    </div>
  )
}
export const field = 'w-full px-4 py-3.5 border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-bolt'
export const Msg = ({ ok, error }) => (<>
  {ok && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-3">{ok}</div>}
  {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-3">{error}</div>}
</>)
