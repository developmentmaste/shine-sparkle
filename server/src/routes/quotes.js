import { Router } from 'express';
import { query } from '../db.js';

export const quotesRouter = Router();

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/quotes
// body: { serviceName, ratePerSqm, areaSqm, estimatedPrice, name?, email?, phone? }
quotesRouter.post('/', async (req, res) => {
  const {
    serviceName,
    ratePerSqm,
    areaSqm,
    estimatedPrice,
    name,
    email,
    phone,
  } = req.body || {};

  if (!serviceName || !serviceName.trim()) {
    return res.status(400).json({ error: 'serviceName is required.' });
  }
  if (typeof ratePerSqm !== 'number' || ratePerSqm <= 0) {
    return res.status(400).json({ error: 'ratePerSqm must be a positive number.' });
  }
  if (typeof areaSqm !== 'number' || areaSqm <= 0) {
    return res.status(400).json({ error: 'areaSqm must be a positive number.' });
  }
  if (typeof estimatedPrice !== 'number' || estimatedPrice <= 0) {
    return res.status(400).json({ error: 'estimatedPrice must be a positive number.' });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'email is not valid.' });
  }

  try {
    const result = await query(
      `INSERT INTO quotes (service_name, rate_per_sqm, area_sqm, estimated_price, name, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        serviceName.trim(),
        ratePerSqm,
        areaSqm,
        estimatedPrice,
        name ? name.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
      ]
    );

    res.status(201).json({
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('Failed to save quote request:', err.message);
    res.status(500).json({ error: 'Could not save your quote request. Please try again.' });
  }
});

// GET /api/quotes — protected listing for administrative dashboard.
quotesRouter.get('/', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey || !adminKey || adminKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Valid x-admin-key header required.' });
  }

  try {
    const result = await query(
      `SELECT id, service_name, rate_per_sqm, area_sqm, estimated_price,
              name, email, phone, status, created_at
       FROM quotes
       ORDER BY created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to list quotes:', err.message);
    res.status(500).json({ error: 'Could not load quotes.' });
  }
});
