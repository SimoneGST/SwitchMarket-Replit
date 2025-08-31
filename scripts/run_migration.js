import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

async function main() {
  const sql = fs.readFileSync('./migrations/0001_create_copilot_events.sql', 'utf8');
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: conn });
  await client.connect();
  try {
    console.log('Executing migration...');
    await client.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  } finally {
    await client.end();
  }
}

main();
