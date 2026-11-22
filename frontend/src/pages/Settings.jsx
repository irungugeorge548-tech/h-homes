import { useEffect, useState } from 'react'
import SubScreen from '../components/SubScreen'
import Icon from '../components/Icon'
import { HPESA_URL } from '../lib/api'
import { getLang, setLang } from '../lib/lang'

export default function Settings() {
  const [note, setNote] = useState('')
  const [installEvt, setInstallEvt] = useState(null)
  const installed = window.matchMedia?.('(display-mode: standalone)').matches

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const Row = ({ icon, title, sub, onClick, href }) => {
    const inner = (<>
      <span className="w-10 h-10 rounded-full bg-bolt/10 text-bolt flex items-center justify-center flex-shrink-0"><Icon name={icon} size={20} /></span>
      <span className="flex-1 min-w-0 text-left"><span className="block font-medium">{title}</span>{sub && <span className="block text-xs text-gray-500 truncate">{sub}</span>}</span>
    </>)
    return href
      ? <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4">{inner}</a>
      : <button onClick={onClick} className="w-full flex items-center gap-3 p-4">{inner}</button>
  }

  return (
    <SubScreen title="Settings">
      {note && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-3">{note}</div>}
      <h2 className="font-bold mb-2">Language</h2>
      <div className="bg-white rounded-2xl border p-3 mb-5 flex rounded-full overflow-hidden gap-2">
        {[['en', 'English'], ['sw', 'Kiswahili']].map(([v, l]) => <button key={v} onClick={() => getLang() !== v && setLang(v)} className={`flex-1 py-2.5 rounded-xl font-medium ${getLang() === v ? 'bg-bolt text-white' : 'border text-gray-600'}`}>{l}</button>)}
      </div>
      <h2 className="font-bold mb-2">App</h2>
      <div className="bg-white rounded-2xl border divide-y mb-5">
        {!installed && installEvt && <Row icon="download" title="Install H-Homes" sub="Add it to your home screen" onClick={async () => { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null) }} />}
        {!installed && !installEvt && <Row icon="download" title="Install H-Homes" sub="Open your browser menu and choose Install app" onClick={() => setNote('In Chrome: open the menu and tap Install app.')} />}
        {installed && <Row icon="check" title="Installed" sub="H-Homes is on your home screen" onClick={() => {}} />}
        {HPESA_URL && <Row icon="wallet" title="Open H-Pesa" sub="Top up and manage your wallet" href={HPESA_URL} />}
      </div>
      <p className="text-center text-xs text-gray-400">H-Homes · Find a home. Pay rent your way.</p>
    </SubScreen>
  )
}
