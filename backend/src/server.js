require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const inquiryRoutes = require('./routes/inquiries');

const app = express();
app.set('trust proxy', 1); // behind Render/Vercel proxies

app.use(helmet());
const origins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json({ limit: '50kb' }));

// Light throttle on the public form to curb spam
app.use(
  '/api/inquiries',
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'POST',
  })
);

app.get('/', (_req, res) => res.json({ status: 'ok', service: 'crm-inquiry-api' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API listening on port ${port}`));
