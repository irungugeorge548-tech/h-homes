require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5176,https://h-homes.vercel.app')
  .split(',').map(o => o.trim().replace(/\/$/, ''));
app.set('trust proxy', 1);
app.use(require('./lib/security').securityHeaders);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '400kb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/homes', require('./routes/homes'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/tenancies', require('./routes/tenancies'));
app.use('/api/hpesa', require('./routes/hpesa'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/account', require('./routes/account'));
app.use('/api/support', require('./routes/support'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'H-Homes', hpesa: !!process.env.HPESA_API, key: !!process.env.HHOMES_API_KEY }));

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5003;
  app.listen(PORT, () => console.log(`H-Homes backend on http://localhost:${PORT}`));
}
