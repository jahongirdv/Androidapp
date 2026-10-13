import pool from './pools.js';

export async function getAllmessages() {
  const { rows } = await pool.query(
    'SELECT * FROM messages ORDER BY messages.editable ASC,  messages.added DESC'
  );
  return rows;
}
export async function getMessages(id) {
  const { rows } = await pool.query(
    'SELECT * FROM messages WHERE id = $1', [id]
  );
  return rows[0];
}

export async function insertmessagename(message) {
  const res = await pool.query(
    'INSERT INTO messages (name, text)  VALUES ($1,$2) RETURNING *',
    [message.name, message.text]
  );
  return res.rows[0];
}

export async function deletMessage(id) {
  const messageDB = await getMessages(id);
  console.log(`deleting ${messageDB}`);
  if(messageDB.editable)
    await pool.query('DELETE FROM messages WHERE id = $1', [id]);
  else
    throw new Error(`Trying to delete protected message: ${id}`);
}

export async function updateMessage(message) {
  await pool.query(
    'UPDATE messages SET name = $1, text = $2 WHERE id = $3 RETURNING *',
    [message.name, message.text, message.id]
  );
}

