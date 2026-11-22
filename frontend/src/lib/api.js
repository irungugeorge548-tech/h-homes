import axios from 'axios'

export const getToken = () => localStorage.getItem('hhomes_token')
export const getHpesaToken = () => { try { return localStorage.getItem('hhomes_hpesa_token') } catch { return null } }
export const setHpesaToken = (t) => { try { t ? localStorage.setItem('hhomes_hpesa_token', t) : localStorage.removeItem('hhomes_hpesa_token') } catch { /* ignore */ } }
const headers = () => ({ Authorization: `Bearer ${getToken()}`, ...(getHpesaToken() ? { 'x-hpesa-token': getHpesaToken() } : {}) })
export const get = (url) => axios.get(url, { headers: headers() }).then(r => r.data)
export const post = (url, body) => axios.post(url, body, { headers: headers() }).then(r => r.data)
export const patch = (url, body) => axios.patch(url, body, { headers: headers() }).then(r => r.data)
export const del = (url) => axios.delete(url, { headers: headers() }).then(r => r.data)
export const errMsg = (e, fallback = 'Something went wrong. Please try again.') => e?.response?.data?.error || (e?.request ? 'Could not reach the server. Check your connection.' : fallback)
export const getUser = () => { try { return JSON.parse(localStorage.getItem('hhomes_user')) || {} } catch { return {} } }
export const photoUrl = (id) => `${(axios.defaults.baseURL || '')}/api/homes/photo/${id}`
export const money = (n) => `KES ${Number(n || 0).toLocaleString()}`

// Which side of the app the person is using: looking for a home (tenant) or managing property (landlord)
export const getMode = () => { try { return localStorage.getItem('hhomes_mode') === 'landlord' ? 'landlord' : 'tenant' } catch { return 'tenant' } }
export const setMode = (m) => { try { localStorage.setItem('hhomes_mode', m) } catch { /* ignore */ } }

export const HPESA_URL = (import.meta.env.VITE_HPESA_URL || '').replace(/\/$/, '')
