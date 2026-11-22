import { useEffect } from 'react'
import Mascot from '../components/Mascot'

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="h-screen bg-bolt flex flex-col items-center justify-center px-6 overflow-hidden">
      <div style={{ animation: 'rise .7s ease-out both' }}><Mascot size={Math.min(320, window.innerWidth - 48)} ride /></div>
      <h1 className="text-5xl font-extrabold text-white tracking-tight mt-4">H-Homes</h1>
      <p className="text-white/85 mt-2 text-sm">Find a home. Pay rent your way.</p>
    </div>
  )
}
