const { Client } = require('pg');

const PROJECT_REF = 'gcsixiixqebbkktarayc';
const DB_PASSWORD = 'Tורלקךטשקך998!';

const configs = [
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, database: 'postgres', user: 'postgres', password: DB_PASSWORD, ssl: { rejectUnauthorized: false } },
  { host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543, database: 'postgres', user: `postgres.${PROJECT_REF}`, password: DB_PASSWORD, ssl: { rejectUnauthorized: false } }
];

const sql = `
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS commander_id UUID REFERENCES soldiers(id) ON DELETE SET NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS guard_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  shift_duration INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guard_shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guard_event_id UUID REFERENCES guard_events(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  soldier_id UUID REFERENCES soldiers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guard_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON guard_events;
DROP POLICY IF EXISTS "Public write" ON guard_events;
CREATE POLICY "Public read" ON guard_events FOR SELECT USING (TRUE);
CREATE POLICY "Public write" ON guard_events FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "Public read" ON guard_shifts;
DROP POLICY IF EXISTS "Public write" ON guard_shifts;
CREATE POLICY "Public read" ON guard_shifts FOR SELECT USING (TRUE);
CREATE POLICY "Public write" ON guard_shifts FOR ALL USING (TRUE);
`;

async function run() {
  for (const c of configs) {
    const client = new Client(c);
    try {
      await client.connect();
      console.log('Connected to DB with', c.host, c.port, c.user);
      await client.query(sql);
      console.log('Successfully migrated phase 3 objects');
      await client.end();
      return;
    } catch(e) {
      console.error('Migration failed for config:', c.host, c.port, c.user, e.message);
    }
  }
}

run();
