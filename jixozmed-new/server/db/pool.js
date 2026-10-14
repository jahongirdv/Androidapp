const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL подключён:', process.env.DB_NAME))
  .catch((err) => console.error('❌ Ошибка подключения к PostgreSQL:', err.message));

module.exports = pool;
