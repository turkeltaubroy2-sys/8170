const { Client } = require('pg');
const PROJECT_REF = 'gcsixiixqebbkktarayc';
const DB_PASSWORD = 'Tורלקךטשקך998!';

const configs = [
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543, database: 'postgres', user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, ssl: { rejectUnauthorized: false } }
];

async function tryConnect(c) {
  const client = new Client(c);
  try {
    await client.connect();
    console.log('SUCCESS with', c.host, c.port, c.user);
    await client.end();
    return true;
  } catch(e) {
    console.log('FAIL with', c.host, c.port, c.user, '->', e.message);
  }
  return false;
}

(async () => {
  for (const c of configs) await tryConnect(c);
})();
