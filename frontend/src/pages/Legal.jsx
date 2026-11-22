import SubScreen from '../components/SubScreen'
const NOTE = 'DRAFT for the pre-launch demo. Haraka Pesa (H-Pesa, H-Fleet, H-Homes, H-Mart) is not yet a registered company. These texts are placeholders and must be reviewed by a Kenyan lawyer before a public launch.'
const TERMS = [['1. About the service', 'H-Homes connects people looking for homes with landlords, and helps tenants pay rent. At this stage it is a demonstration: listings may be samples and wallet money is demo money.'],
  ['2. Your account', 'Give true details and keep your password secret. You are responsible for activity on your account. One account can be both a tenant and a landlord.'],
  ['3. Listings and applications', 'Landlords must only list homes they are allowed to rent out, with honest photos and prices. Applying for a home does not guarantee it. The tenancy agreement is between the landlord and the tenant.'],
  ['4. Rent payments', 'Rent is paid from your H-Pesa wallet with your H-Pesa PIN, straight to the landlord. You may pay in full or in parts (Lipa Mdogo Mdogo). H-Homes records payments but is not a party to your tenancy.'],
  ['5. Conduct', 'Respect each other. Do not post false, illegal or misleading listings.'],
  ['6. Suspension and law', 'We may suspend accounts that break these terms. Kenyan law applies. We may update these terms and will tell you in the app.']]
const PRIVACY = [['What we collect', 'Name, phone, email, optional photo, listings and photos you upload, applications, tenancy and rent payment records, and repair requests.'],
  ['Why', 'To run listings and tenancies, take rent payments, give support and meet legal duties.'],
  ['Sharing', 'We do not sell your data. A landlord sees the name and phone of people who apply or rent from them; tenants see their landlord\'s name and phone. H-Pesa receives only the payment you approve.'],
  ['Security', 'Passwords are stored hashed. Logins are limited and locked after repeated failures.'],
  ['Your rights', 'Under the Kenya Data Protection Act you may ask to see, correct or delete your data. Contact support in the app.']]
export default function Legal({ kind }) {
  const items = kind === 'privacy' ? PRIVACY : TERMS
  return (
    <SubScreen title={kind === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}>
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-3 text-xs mb-4">{NOTE}</div>
      <div className="bg-white rounded-3xl border p-5 space-y-4">{items.map(([h, p]) => <div key={h}><p className="font-bold">{h}</p><p className="text-sm text-gray-600">{p}</p></div>)}</div>
    </SubScreen>
  )
}
