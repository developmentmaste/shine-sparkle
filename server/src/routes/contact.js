import { Router } from 'express';
import { query } from '../db.js';

export const contactRouter = Router();

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/contact
// body: { name, email, phone?, message }
contactRouter.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const result = await query(
      `INSERT INTO contacts (name, email, phone, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [name.trim(), email.trim(), phone ? phone.trim() : null, message.trim()]
    );

    res.status(201).json({
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('Failed to save contact message:', err.message);
    res.status(500).json({ error: 'Could not save your message. Please try again.' });
  }
});
