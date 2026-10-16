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

import crypto from 'crypto';

function verifyTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');
    const items = [];
    for (const [key, value] of params.entries()) {
      items.push(`${key}=${value}`);
    }
    items.sort();
    const dataCheckString = items.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const signature = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (signature.toLowerCase() === hash.toLowerCase()) {
      const userStr = params.get('user');
      if (userStr) return JSON.parse(userStr);
    }
  } catch (err) {
    console.error('Error verifying Telegram initData in server:', err);
  }
  return null;
}

app.post('/api/telegram', (req, res) => {
  const { action, initData } = req.body || {};
  if (action === 'verify_admin' || action === 'check_admin') {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    let verifiedUser = null;

    if (botToken) {
      if (!initData) {
        return res.status(401).json({ authorized: false, error: 'initData is required for verification' });
      }
      verifiedUser = verifyTelegramWebAppData(initData, botToken);
      if (!verifiedUser || !verifiedUser.id) {
        return res.status(401).json({ authorized: false, error: 'Invalid Telegram WebApp signature' });
      }
    }

    const targetUserId = verifiedUser ? verifiedUser.id : req.body.userId;
    if (!targetUserId) {
      return res.status(400).json({ authorized: false, error: 'User ID is missing' });
    }

    const envAdminIds = (process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    let authorized = envAdminIds.includes(String(targetUserId));
    try {
      const authFile = path.resolve(process.cwd(), 'server/data/authorized_admins.json');
      if (fs.existsSync(authFile)) {
        const admins = JSON.parse(fs.readFileSync(authFile, 'utf8'));
        if (Array.isArray(admins) && admins.includes(String(targetUserId))) {
          authorized = true;
        }
      }
    } catch (e) {}

    return res.status(authorized ? 200 : 403).json({
      authorized,
      user: {
        id: targetUserId,
        firstName: verifiedUser?.first_name || req.body.firstName || '',
        username: verifiedUser?.username || req.body.username || '',
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
