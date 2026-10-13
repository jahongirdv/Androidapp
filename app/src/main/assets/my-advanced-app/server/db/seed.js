const { Client } = require('pg');
require('dotenv').config();

const SQL = `
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  editable BOOLEAN DEFAULT TRUE
);

INSERT INTO messages (name, text, editable) VALUES
('Mohammad', 'Love you too :)', FALSE),
('Mohammad', 'exposed via cloudflare tunnel ! self hosted on my personal server, proxmox, coolify', FALSE),
('Sarah', 'I love Dad', FALSE),
('Amina', 'I also love Dad.', FALSE),
('John', 'Hello everyone!', TRUE),
('Lina', 'How are you all doing?', TRUE),
('Omar', 'Nice to meet you!', TRUE);
`;


const client = new Client({
  connectionString: process.env.POSTGRES_DB_URL,
});

async function seed() {
  try {
    await client.connect();
    console.log(`connecting to ${process.env.POSTGRES_DB_URL}`);
    // Check if seed already ran
    const res = await client.query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE
      );
    `);

    const { rows } = await client.query(`SELECT * FROM seeds WHERE name = 'initial'`);
    if (rows.length > 0) {
      console.log('🔁 Already seeded.');
      return;
    }

    await client.query(SQL);


    // Mark as seeded
    await client.query(`INSERT INTO seeds (name) VALUES ('initial')`);

    console.log('✅ Database seeded.');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await client.end();
  }
}

seed();