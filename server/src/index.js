import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { contactRouter } from './routes/contact.js';
import { quotesRouter } from './routes/quotes.js';

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.some(
          (pattern) => pattern.startsWith('*.') && origin.endsWith(pattern.slice(1))
        );
      callback(null, isAllowed);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'ok', db: 'disconnected', error: err.message });
  }
});

app.use('/api/contact', contactRouter);
app.use('/api/quotes', quotesRouter);

app.post('/api/telegram', (req, res) => {
  const { action, userId } = req.body || {};
  if (action === 'verify_admin' || action === 'check_admin') {
    const envAdminIds = (process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    let authorized = envAdminIds.includes(String(userId));
    try {
      const authFile = path.resolve(process.cwd(), 'server/data/authorized_admins.json');
      if (fs.existsSync(authFile)) {
        const admins = JSON.parse(fs.readFileSync(authFile, 'utf8'));
        if (Array.isArray(admins) && admins.includes(String(userId))) {
          authorized = true;
        }
      }
    } catch (e) {}

    return res.json({
      authorized,
      user: {
        id: userId,
        firstName: req.body.firstName || '',
        username: req.body.username || '',
      },
    });
  }
  res.json({ status: 'ok' });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Shine & Sparkle API listening on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${allowedOrigins.join(', ')}`);
});
