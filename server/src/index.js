import 'dotenv/config';
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

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Shine & Sparkle API listening on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${allowedOrigins.join(', ')}`);
});
