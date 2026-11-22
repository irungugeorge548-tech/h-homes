import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Splash from './pages/Splash'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Explore from './pages/Explore'
import Listing from './pages/Listing'
import Saved from './pages/Saved'
import MyHome from './pages/MyHome'
import Properties from './pages/Properties'
import PropertyForm from './pages/PropertyForm'
import Tenants from './pages/Tenants'
import Money from './pages/Money'
import Account from './pages/Account'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import Support from './pages/Support'
import Settings from './pages/Settings'
import Legal from './pages/Legal'
import { getMode } from './lib/api'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hhomes_token'))
  // the splash plays when the app is opened, not on every page change or refresh
  const [showSplash, setShowSplash] = useState(() => { try { return !sessionStorage.getItem('hhomes_splash') } catch { return true } })
  const login = (data) => {
    localStorage.setItem('hhomes_token', data.token)
    localStorage.setItem('hhomes_user', JSON.stringify(data.user))
    setToken(data.token)
  }
  const logout = () => { localStorage.removeItem('hhomes_token'); localStorage.removeItem('hhomes_user'); localStorage.removeItem('hhomes_hpesa_token'); setToken(null) }

  if (showSplash) return <Splash onDone={() => { try { sessionStorage.setItem('hhomes_splash', '1') } catch { /* ignore */ } setShowSplash(false) }} />

  const guard = (el) => (token ? el : <Navigate to="/welcome" />)
  const landlord = getMode() === 'landlord'
  return (
    <Routes>
      <Route path="/welcome" element={!token ? <Welcome /> : <Navigate to="/" />} />
      <Route path="/login" element={!token ? <Login onLogin={login} /> : <Navigate to="/" />} />
      <Route path="/" element={guard(landlord ? <Properties /> : <Explore />)} />
      <Route path="/listing/:id" element={guard(<Listing />)} />
      <Route path="/saved" element={guard(<Saved />)} />
      <Route path="/my-home" element={guard(<MyHome />)} />
      <Route path="/properties/new" element={guard(<PropertyForm />)} />
      <Route path="/properties/:id/edit" element={guard(<PropertyForm />)} />
      <Route path="/tenants" element={guard(<Tenants />)} />
      <Route path="/money" element={guard(<Money />)} />
      <Route path="/wallet" element={guard(<Wallet />)} />
      <Route path="/account" element={guard(<Account logout={logout} />)} />
      <Route path="/account/profile" element={guard(<Profile />)} />
      <Route path="/account/support" element={guard(<Support />)} />
      <Route path="/account/settings" element={guard(<Settings />)} />
      <Route path="/terms" element={<Legal kind="terms" />} />
      <Route path="/privacy" element={<Legal kind="privacy" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
