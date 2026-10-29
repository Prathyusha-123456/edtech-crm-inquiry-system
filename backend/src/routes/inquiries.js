const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const USER_TYPES = ['Parent', 'Student', 'School'];
const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const STATUSES = ['New', 'In Progress', 'Resolved'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[0-9\s\-()]{7,20}$/;

function validateInquiry(body) {
  const errors = {};
  const data = {
    user_type: String(body.user_type || '').trim(),
    category: String(body.category || '').trim(),
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phone: String(body.phone || '').trim(),
    message: String(body.message || '').trim(),
  };

  if (!USER_TYPES.includes(data.user_type)) errors.user_type = 'Select a valid user type';
  if (!CATEGORIES.includes(data.category)) errors.category = 'Select a valid category';
  if (data.name.length < 2 || data.name.length > 120) errors.name = 'Name must be 2-120 characters';
  if (!EMAIL_RE.test(data.email) || data.email.length > 255) errors.email = 'Enter a valid email';
  if (!PHONE_RE.test(data.phone)) errors.phone = 'Enter a valid phone number';
  if (data.message.length < 5 || data.message.length > 2000) {
    errors.message = 'Message must be 5-2000 characters';
  }

  return { data, errors };
}

// POST /api/inquiries  (public)
router.post('/', async (req, res) => {
  const { data, errors } = validateInquiry(req.body || {});
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO inquiries (user_type, category, name, email, phone, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [data.user_type, data.category, data.name, data.email, data.phone, data.message]
    );
    return res.status(201).json({ message: 'Inquiry submitted successfully', inquiry: rows[0] });
  } catch (err) {
    console.error('Create inquiry error', err);
    return res.status(500).json({ error: 'Could not save inquiry' });
  }
});

// GET /api/inquiries?category=&user_type=&search=&status=&page=&limit=  (admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { category, user_type, status, search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const where = [];
    const params = [];

    if (category) {
      if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (user_type) {
      if (!USER_TYPES.includes(user_type)) return res.status(400).json({ error: 'Invalid user type' });
      params.push(user_type);
      where.push(`user_type = $${params.length}`);
    }
    if (status) {
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (search && String(search).trim()) {
      // Escape LIKE wildcards in user input, then parameterise.
      const term = String(search).trim().replace(/[\\%_]/g, '\\$&');
      params.push(`%${term}%`);
      where.push(`(name ILIKE $${params.length} OR phone ILIKE $${params.length})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM inquiries ${whereSql}`, params);
    const total = countResult.rows[0].total;

    const listParams = [...params, limit, (page - 1) * limit];
    const { rows } = await pool.query(
      `SELECT id, name, phone, email, user_type, category, message, status, created_at
       FROM inquiries
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    return res.json({
      inquiries: rows,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (err) {
    console.error('List inquiries error', err);
    return res.status(500).json({ error: 'Could not fetch inquiries' });
  }
});

// PATCH /api/inquiries/:id/status  (admin)
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(', ')}` });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Inquiry not found' });
    return res.json({ inquiry: rows[0] });
  } catch (err) {
    // 22P02 = invalid uuid text
    if (err.code === '22P02') return res.status(404).json({ error: 'Inquiry not found' });
    console.error('Update status error', err);
    return res.status(500).json({ error: 'Could not update status' });
  }
});

module.exports = router;
