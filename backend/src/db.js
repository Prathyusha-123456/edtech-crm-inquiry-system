require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// Supabase requires SSL. rejectUnauthorized:false keeps setup simple for the
// pooler certificate chain on most hosts.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => console.error('Unexpected PG pool error', err));

module.exports = pool;
