// Creates (or updates the password of) the admin defined in .env
// Usage: npm run seed
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

(async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || password.length < 8) {
    console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in .env');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email, hash]
    );
    console.log(`Admin ready: ${email}`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
