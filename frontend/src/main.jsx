import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import axios from 'axios'
import { startTranslator } from './lib/lang'

// In production, API calls go to the Render backend (VITE_API_URL). In dev, the Vite proxy handles /api.
axios.defaults.baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Register the service worker (needed for "Install app")
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

startTranslator()
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
)
