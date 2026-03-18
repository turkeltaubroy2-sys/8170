const { Client } = require('pg');
const DB_PASSWORD = 'Tורלקךטשקך998!';

// The IPv6 address for db.gcsixiixqebbkktarayc.supabase.co is 2406:da1a:6b0:f629:f5a0:999f:508d:5ba1
// pg client allows connecting to IPv6 literals if we enclose in brackets or just pass as host string

const client = new Client({
  host: '2406:da1a:6b0:f629:f5a0:999f:508d:5ba1',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function main() {
  try {
    console.log('Connecting via IPv6 literal...');
    await client.connect();
    console.log('✅ Connected successfully!');
    const res = await client.query('SELECT current_database(), current_user');
    console.log('✅ Query result:', res.rows[0]);
    await client.end();
  } catch(e) {
    console.log('❌ Error:', e.message);
  }
}
main();
