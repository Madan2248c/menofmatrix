import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import newsletterRoutes from './routes/newsletter.js';
import newsRoutes from './routes/news.js';
import cronRoutes from './routes/cron.js';

const app = express();

// Trust Vercel's proxy so req.protocol/ips are correct
app.set('trust proxy', true);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api', apiRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
