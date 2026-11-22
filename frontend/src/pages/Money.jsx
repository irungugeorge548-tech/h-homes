import { useEffect, useState } from 'react'
import { get, money } from '../lib/api'
import TabBar from '../components/TabBar'
import Icon from '../components/Icon'
import { ReceiptSheet, download } from '../components/extras'

const line = (p) => `${new Date(p.createdAt).toLocaleDateString('en-GB')},${p.tenantName},${p.home},${p.amount}`
const text = (p) => ['H-HOMES RENT RECEIVED', '------------------------------', `Receipt no: ${p.id}`, `Date: ${new Date(p.createdAt).toLocaleString('en-KE')}`, `Tenant: ${p.tenantName}`, `Home: ${p.home}`, `Amount: KES ${Number(p.amount).toLocaleString()}`, `Paid to: your H-Pesa wallet`, '------------------------------', 'Pre-launch demo.'].join('\n')

export default function Money() {
  const [d, setD] = useState(null)
  const [receipt, setReceipt] = useState(null)
  useEffect(() => { get('/api/tenancies/landlord').then(setD).catch(() => setD({ tenants: [], totals: {}, payments: [] })) }, [])
  const t = d?.totals || {}
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Money</h1>
        <div className="mt-5 rounded-3xl bg-bolt text-white p-6 shadow-lg">
          <p className="text-sm text-white/80">Received this month</p>
          <p className="text-4xl font-extrabold mt-1">{d ? money(t.receivedThisMonth) : '…'}</p>
          <p className="text-xs text-white/75 mt-3">Rent goes straight into your connected H-Pesa wallet.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white border rounded-2xl p-4"><p className="text-xs text-gray-500">Still owed to you</p><p className="text-xl font-bold mt-1">{money(t.outstanding)}</p></div>
          <div className="bg-white border rounded-2xl p-4"><p className="text-xs text-gray-500">Tenants late</p><p className={`text-xl font-bold mt-1 ${t.lateCount ? 'text-red-600' : ''}`}>{t.lateCount || 0}</p></div>
        </div>
        {d?.tenants.some(x => x.balance > 0) && <><h2 className="font-bold mt-6 mb-2">Who owes rent</h2><div className="bg-white border rounded-2xl divide-y">{d.tenants.filter(x => x.balance > 0).map(x => <div key={x.id} className="p-3 flex items-center gap-3"><span className="flex-1"><span className="block font-medium">{x.tenantName}</span><span className="block text-xs text-gray-500">{x.home?.title}</span></span><span className={`font-bold ${x.late ? 'text-red-600' : ''}`}>{money(x.balance)}</span></div>)}</div></>}
        <div className="flex items-center mt-6 mb-2"><h2 className="font-bold flex-1">Rent received</h2>
          {d?.payments.length > 0 && <button onClick={() => download('hhomes-statement.csv', 'Date,Tenant,Home,Amount\n' + d.payments.map(line).join('\n'))} className="text-sm text-bolt font-semibold flex items-center gap-1"><Icon name="download" size={16} />Statement</button>}</div>
        {d?.payments.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No payments yet.</p>}
        {d?.payments.map(p => (
          <button key={p.id} onClick={() => setReceipt(p)} className="w-full flex items-center gap-3 py-3 border-b text-left">
            <span className="w-10 h-10 rounded-full bg-bolt/15 text-bolt flex items-center justify-center"><Icon name="receipt" size={20} /></span>
            <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{p.tenantName}</span><span className="block text-xs text-gray-500 truncate">{p.home} · {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></span>
            <span className="font-bold text-green-700">+ {money(p.amount)}</span>
          </button>))}
        <div className="h-6" />
      </div>
      <ReceiptSheet text={receipt && text(receipt)} id={receipt?.id} onClose={() => setReceipt(null)} />
      <TabBar />
    </div>
  )
}
