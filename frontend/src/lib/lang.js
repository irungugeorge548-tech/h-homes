// Kiswahili for the whole app. The app is written in English; when Kiswahili is chosen, every piece of text
// on screen (and every placeholder) is swapped using this dictionary. Anything not listed stays in English.
export const getLang = () => { try { return localStorage.getItem('hhomes_lang') || 'en' } catch { return 'en' } }
export const setLang = (l) => { try { localStorage.setItem('hhomes_lang', l) } catch { /* ignore */ } window.location.reload() }

const SW = {
  'Account': 'Akaunti', 'Explore': 'Tafuta', 'Saved': 'Zilizohifadhiwa', 'My Home': 'Nyumba Yangu', 'Properties': 'Mali', 'Tenants': 'Wapangaji', 'Money': 'Pesa',
  'Back': 'Rudi', 'Cancel': 'Ghairi', 'Close': 'Funga', 'Save': 'Hifadhi', 'Share': 'Shiriki', 'Download': 'Pakua', 'Receipt': 'Risiti', 'Loading…': 'Inapakia…', 'Please wait…': 'Tafadhali subiri…',
  'Log in': 'Ingia', 'Log out': 'Toka', 'Create account': 'Fungua akaunti', 'Already have an account?': 'Tayari una akaunti?', 'New here?': 'Mgeni?', 'Password': 'Nenosiri', 'Full name': 'Jina kamili',
  'Phone number (07XX XXX XXX)': 'Nambari ya simu (07XX XXX XXX)', 'Email (optional)': 'Barua pepe (si lazima)', 'Choose a password (6+ characters)': 'Chagua nenosiri (herufi 6+)', 'I accept the': 'Nakubali',
  'Welcome back': 'Karibu tena', 'Create your H-Homes account': 'Fungua akaunti yako ya H-Homes', 'Log in with your H-Homes password': 'Ingia kwa nenosiri lako la H-Homes',
  'Find a home. Pay rent your way.': 'Tafuta nyumba. Lipa kodi kwa njia yako.', 'What brings you here?': 'Umekuja kwa ajili ya nini?', 'I am looking for a home': 'Natafuta nyumba', 'I own property': 'Nina mali',
  'Browse homes, apply, pay rent in full or little by little': 'Tazama nyumba, omba, lipa kodi yote au kidogo kidogo', 'List homes, add tenants, receive rent straight to your wallet': 'Weka nyumba, ongeza wapangaji, pokea kodi moja kwa moja kwa wallet yako',
  'One account can do both. You can switch any time in Account.': 'Akaunti moja inaweza kufanya yote mawili. Unaweza kubadilisha wakati wowote kwenye Akaunti.',
  'Find your next home': 'Tafuta nyumba yako ijayo', 'Search by area, e.g. Kilimani': 'Tafuta kwa eneo, mf. Kilimani', 'Bedrooms': 'Vyumba vya kulala', 'Type': 'Aina', 'Any price': 'Bei yoyote', 'Newest': 'Mpya zaidi',
  'Price: low to high': 'Bei: chini hadi juu', 'Price: high to low': 'Bei: juu hadi chini', 'No homes match yet': 'Hakuna nyumba inayolingana bado', 'Try another area or clear a filter. New homes are added often.': 'Jaribu eneo lingine au ondoa kichujio. Nyumba mpya huongezwa mara kwa mara.',
  'Nothing saved yet': 'Hakuna kilichohifadhiwa bado', 'Tap the heart on a home to keep it here.': 'Gusa moyo kwenye nyumba ili ihifadhiwe hapa.', 'Explore homes': 'Tafuta nyumba',
  'Apply for this home': 'Omba nyumba hii', 'Application sent': 'Ombi limetumwa', 'Send application': 'Tuma ombi', 'About this home': 'Kuhusu nyumba hii', 'What it has': 'Ina nini', 'Listed by': 'Imewekwa na', 'Edit this listing': 'Hariri tangazo hili',
  'This home is not available right now': 'Nyumba hii haipatikani sasa', 'No photo yet': 'Bado hakuna picha', '/ month': '/ mwezi',
  'No home yet': 'Huna nyumba bado', 'Rent due': 'Kodi inadaiwa', 'Rent overdue': 'Kodi imechelewa', 'You are all paid up': 'Umelipa yote', 'Pay rent': 'Lipa kodi', 'Pay in full': 'Lipa yote', 'Lipa Mdogo Mdogo': 'Lipa Mdogo Mdogo',
  'Pay a part now': 'Lipa sehemu sasa', 'H-Pesa PIN': 'PIN ya H-Pesa', 'Payments': 'Malipo', 'No payments yet.': 'Hakuna malipo bado.', 'Report a problem': 'Ripoti tatizo', 'Call landlord': 'Piga simu kwa mwenye nyumba',
  'Send to landlord': 'Tuma kwa mwenye nyumba', 'Your repair requests': 'Maombi yako ya matengenezo', 'Your applications': 'Maombi yako', 'Withdraw': 'Ondoa ombi', 'Waiting': 'Inasubiri', 'Approved': 'Imekubaliwa', 'Declined': 'Imekataliwa',
  'Done': 'Imekamilika', 'In progress': 'Inaendelea', 'Sent': 'Imetumwa', 'Paid up': 'Amelipa', 'Late': 'Amechelewa', 'Owes': 'Anadaiwa', 'Add': 'Ongeza', 'Approve': 'Kubali', 'Decline': 'Kataa', 'Call': 'Piga simu',
  'Add a tenant': 'Ongeza mpangaji', 'Add tenant': 'Ongeza mpangaji', 'Choose a home': 'Chagua nyumba', 'Your tenants': 'Wapangaji wako', 'End tenancy': 'Maliza upangaji', 'Repair requests': 'Maombi ya matengenezo', 'Applications': 'Maombi',
  'Add a property': 'Ongeza mali', 'Edit property': 'Hariri mali', 'Publish listing': 'Chapisha tangazo', 'Save changes': 'Hifadhi mabadiliko', 'Add photo': 'Ongeza picha', 'Photos': 'Picha', 'Add photos to get more interest': 'Ongeza picha upate wateja zaidi',
  'No properties yet': 'Hakuna mali bado', 'Monthly rent (KES)': 'Kodi ya mwezi (KES)', 'Deposit (KES)': 'Amana (KES)', 'Describe the home': 'Elezea nyumba', 'Hide this listing from renters': 'Ficha tangazo hili kwa wapangaji',
  'Received this month': 'Iliyopokelewa mwezi huu', 'Still owed to you': 'Unadaiwa bado', 'Tenants late': 'Wapangaji waliochelewa', 'Who owes rent': 'Nani anadaiwa kodi', 'Rent received': 'Kodi iliyopokelewa', 'Statement': 'Taarifa',
  'Switch to renting a home': 'Badilisha kuwa kutafuta nyumba', 'Switch to managing property': 'Badilisha kuwa kusimamia mali', 'Profile': 'Wasifu', 'Payment': 'Malipo', 'Support': 'Msaada', 'Settings': 'Mipangilio',
  'Personal information, photo': 'Taarifa binafsi, picha', 'H-Pesa wallet for rent': 'Wallet ya H-Pesa kwa kodi', 'Help centre, chat with us': 'Kituo cha msaada, ongea nasi', 'Language, install the app': 'Lugha, sakinisha programu',
  'Connect H-Pesa': 'Unganisha H-Pesa', 'Connect your H-Pesa wallet': 'Unganisha wallet yako ya H-Pesa', 'Connecting…': 'Inaunganisha…', 'Not now': 'Sio sasa', 'Disconnect': 'Tenganisha', 'H-Pesa balance': 'Salio la H-Pesa',
  'Request balance': 'Omba salio', 'Top up in H-Pesa': 'Weka pesa kwenye H-Pesa', 'H-Pesa password': 'Nenosiri la H-Pesa', 'H-Pesa phone number': 'Nambari ya simu ya H-Pesa', 'Language': 'Lugha', 'App': 'Programu',
  'Install H-Homes': 'Sakinisha H-Homes', 'Installed': 'Imesakinishwa', 'Open H-Pesa': 'Fungua H-Pesa', 'Contact us': 'Wasiliana nasi', 'Send message': 'Tuma ujumbe', 'Subject': 'Mada', 'Help centre': 'Kituo cha msaada',
  'Message sent. We will get back to you.': 'Ujumbe umetumwa. Tutakujibu.', 'Copied': 'Imenakiliwa', 'Rent paid. Thank you!': 'Kodi imelipwa. Asante!', 'Sent to your landlord.': 'Imetumwa kwa mwenye nyumba.',
  'Haraka assistant': 'Msaidizi wa Haraka', 'Type a message': 'Andika ujumbe', 'Send': 'Tuma', 'Online': 'Mtandaoni', 'Talk to support': 'Ongea na msaada',
  'Pre-launch demo': 'Onyesho la awali', 'Terms of Use': 'Masharti ya Matumizi', 'Privacy Policy': 'Sera ya Faragha',
}
const RULES = [
  [/^Welcome, (.+)!$/, (m) => `Karibu, ${m[1]}!`],
  [/^Habari, (.+)$/, (m) => `Habari, ${m[1]}`],
  [/^Pay KES (.+)$/, (m) => `Lipa KES ${m[1]}`],
  [/^You owe KES (.+)$/, (m) => `Unadaiwa KES ${m[1]}`],
  [/^Applications \((\d+)\)$/, (m) => `Maombi (${m[1]})`],
  [/^(\d+) bedrooms?$/, (m) => `vyumba ${m[1]} vya kulala`],
  [/^Deposit KES (.+)$/, (m) => `Amana KES ${m[1]}`],
  [/^Tenant: (.+)$/, (m) => `Mpangaji: ${m[1]}`],
  [/^Connected: (.+)$/, (m) => `Imeunganishwa: ${m[1]}`],
  [/^Connected$/, () => 'Imeunganishwa'],
]
const tr = (raw) => {
  const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0], t = raw.trim()
  if (!t) return raw
  let r = SW[t]
  if (!r) for (const [re, f] of RULES) { const m = t.match(re); if (m) { r = f(m); break } }
  return r ? lead + r + trail : raw
}
const ATTRS = ['placeholder', 'aria-label', 'title']
function walk(node) {
  if (node.nodeType === 3) { const v = tr(node.nodeValue); if (v !== node.nodeValue) node.nodeValue = v; return }
  if (node.nodeType !== 1 || ['SCRIPT', 'STYLE', 'PRE', 'TEXTAREA'].includes(node.tagName)) return
  for (const a of ATTRS) { const v = node.getAttribute?.(a); if (v) { const x = tr(v); if (x !== v) node.setAttribute(a, x) } }
  node.childNodes.forEach(walk)
}
export function startTranslator() {
  if (getLang() !== 'sw') return
  document.documentElement.lang = 'sw'
  walk(document.body)
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') walk(m.target)
      else if (m.type === 'attributes') walk(m.target)
      else m.addedNodes.forEach(walk)
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS })
}
