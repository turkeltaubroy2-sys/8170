const { Client } = require('pg');

const PROJECT_REF = 'gcsixiixqebbkktarayc';
const DB_PASSWORD = 'Tורלקךטשקך998!';

const SQL_MIGRATION = `
ALTER TABLE guard_events ADD COLUMN IF NOT EXISTS target_status TEXT DEFAULT 'all';
ALTER TABLE guard_shifts ADD COLUMN IF NOT EXISTS requested_by_id UUID REFERENCES soldiers(id);
`;

const configs = [
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543, database: 'postgres', user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, ssl: { rejectUnauthorized: false } }
];

async function main() {
  for (const c of configs) {
    const client = new Client(c);
    try {
      console.log(`Trying ${c.host}:${c.port} with user ${c.user}...`);
      await client.connect();
      await client.query(SQL_MIGRATION);
      console.log('✅ Migration applied successfully.');
      await client.end();
      return;
    } catch(e) {
      console.log('❌ Failed:', e.message);
    }
  }
}

main();
