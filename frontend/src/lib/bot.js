// The Haraka guide: written answers, not an AI. The best keyword match is shown.
export const TOPICS = [
  { id: 'start', q: 'How do I start?', k: ['start', 'begin', 'new', 'account', 'register', 'anza', 'fungua'],
    a: 'Create your H-Homes account with your name, phone and a password, and accept the Terms. Then choose: looking for a home, or I own property. One account can do both, and you can switch in Account.' },
  { id: 'find', q: 'How do I find a home?', k: ['find', 'search', 'browse', 'explore', 'filter', 'area', 'tafuta', 'nyumba'],
    a: 'On Explore, search by area (for example Kilimani) and use the filters for bedrooms, type and price. Tap the heart to save a home, or tap a home to see all its photos.' },
  { id: 'apply', q: 'How do I apply for a home?', k: ['apply', 'application', 'interested', 'omba'],
    a: 'Open the home and tap Apply for this home. Add a short note if you like. The landlord can approve you, and you can follow the status in My Home. A landlord can also add you directly with your phone number.' },
  { id: 'rent', q: 'How do I pay rent?', k: ['rent', 'pay', 'payment', 'pin', 'kodi', 'lipa'],
    a: 'Open My Home and tap Pay rent. Enter your H-Pesa PIN to confirm. The money goes from your wallet straight to your landlord, and you get a receipt.' },
  { id: 'mdogo', q: 'What is Lipa Mdogo Mdogo?', k: ['mdogo', 'instalment', 'installment', 'part', 'partial', 'little', 'split'],
    a: 'It lets you pay rent little by little. In Pay rent choose Lipa Mdogo Mdogo and pay any amount from KES 100. What is left stays on your balance until you clear it.' },
  { id: 'list', q: 'How do I list my property?', k: ['list', 'landlord', 'property', 'owner', 'add home', 'post', 'photos', 'photo'],
    a: 'Choose "I own property" (or switch in Account). On Properties tap Add, upload real photos, set the rent and publish. Renters can then find and apply for it.' },
  { id: 'tenant', q: 'How do I add or approve a tenant?', k: ['tenant', 'approve', 'assign', 'mpangaji'],
    a: 'In Tenants you will see applications. Tap Approve to make the applicant your tenant, or tap Add and enter a tenant\'s phone number (they need an H-Homes account first).' },
  { id: 'receive', q: 'How do I receive rent?', k: ['receive', 'collect', 'wallet', 'connect'],
    a: 'Connect your H-Pesa wallet in Account > Payment. Tenants then pay straight into it, and you see every payment in Money with a receipt.' },
  { id: 'balance', q: 'Why is my balance hidden?', k: ['balance', 'salio', 'hidden', 'hide'],
    a: 'For your privacy, tap Request balance and it shows for a few seconds, then hides.' },
  { id: 'repair', q: 'How do I report a repair?', k: ['repair', 'fix', 'broken', 'leak', 'maintenance', 'problem'],
    a: 'In My Home tap Report a problem and describe it. Your landlord sees it and updates the status.' },
  { id: 'receipt', q: 'Where are my receipts?', k: ['receipt', 'history', 'risiti', 'download', 'share', 'statement'],
    a: 'In My Home tap any payment to see its receipt, then share or download it. Landlords find receipts and a statement in Money.' },
  { id: 'fleet', q: 'What about H-Fleet and H-Mart?', k: ['fleet', 'mart', 'ride', 'food', 'pesa'],
    a: 'H-Fleet (rides and parcels) and H-Mart are part of the same Haraka family, and your H-Pesa wallet works across them.' },
  { id: 'lang', q: 'Can I use Kiswahili?', k: ['swahili', 'kiswahili', 'language', 'lugha'],
    a: 'Yes. Open Account > Settings and choose Kiswahili under Language.' },
]
const clean = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
export const answer = (text) => {
  const q = clean(text); let best = null, score = 0
  for (const t of TOPICS) { const n = t.k.reduce((a, k) => a + (q.includes(k) ? 1 : 0), 0); if (n > score) { best = t; score = n } }
  return best
}

const has = (q, words) => words.some(w => new RegExp(`(^|\\s)${w}`).test(q))
export const GREETING = (name) => `Habari${name ? ' ' + name : ''}! I am the Haraka assistant. Ask me anything about the app, or pick a topic below.`
export const SUGGESTIONS = ['How do I find a home?', 'How do I pay rent?', 'What is Lipa Mdogo Mdogo?', 'How do I list my property?']
// Returns { text, chips } for what the person typed
export function reply(input) {
  const q = clean(input).trim()
  if (!q) return { text: 'Type your question and I will help.', chips: SUGGESTIONS }
  if (has(q, ['hi', 'hello', 'hey', 'habari', 'mambo', 'sasa', 'jambo', 'good morning', 'good evening'])) return { text: 'Hello! How can I help you today?', chips: SUGGESTIONS }
  if (has(q, ['thank', 'asante', 'shukran', 'cheers'])) return { text: 'You are welcome! Is there anything else I can help with?', chips: [] }
  if (has(q, ['bye', 'kwaheri', 'goodbye'])) return { text: 'Kwaheri! I am here whenever you need me.', chips: [] }
  if (has(q, ['who are you', 'your name', 'are you a bot', 'are you human', 'are you real'])) return { text: 'I am the Haraka assistant, a help bot built into the app. I know how every Haraka app works. For anything else, our support team can help.', chips: ['Talk to support'] }
  if (has(q, ['human', 'agent', 'person', 'support', 'complain', 'talk to'])) return { text: 'Of course. Tap "Talk to support" and send us a message. Never include your PIN or password.', chips: ['Talk to support'] }
  const t = answer(input)
  if (t) return { text: t.a, chips: TOPICS.filter(x => x.id !== t.id).slice(0, 3).map(x => x.q) }
  return { text: 'Sorry, I do not have an answer for that yet. Try one of these, or talk to our support team.', chips: [...SUGGESTIONS.slice(0, 3), 'Talk to support'] }
}
// Exact topic question -> its answer (for the buttons)
export const byQuestion = (q) => TOPICS.find(t => t.q === q)
