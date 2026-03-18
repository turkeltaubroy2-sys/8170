// Apply schema via Supabase pg_meta internal API (using service role)
const https = require('https');

const PROJECT_REF = 'gcsixiixqebbkktarayc';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjc2l4aWl4cWViYmtrdGFyYXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg0MTUzMywiZXhwIjoyMDg5NDE3NTMzfQ.o2MknhyyoVkaAh5n3t8KJy0_LyOXJKTuL_bV1msFHZg';

// Updated: only מחלקה 1 and מחלקה 2 per user request
const SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO departments (name, icon, "order") VALUES
  ('מחלקה 1', '1', 1),
  ('מחלקה 2', '2', 2)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS soldiers (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name     TEXT NOT NULL,
  rank          TEXT DEFAULT 'טוראי',
  role          TEXT,
  phone         TEXT,
  bio           TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  photo_url     TEXT,
  unique_token  TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soldier_portals (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  soldier_id          UUID REFERENCES soldiers(id) ON DELETE CASCADE UNIQUE,
  status              TEXT DEFAULT 'בבית',
  health_declaration  TEXT DEFAULT 'תקין',
  equipment_notes     TEXT,
  personal_notes      TEXT,
  equipment_list      JSONB DEFAULT '[]',
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ,
  location    TEXT,
  all_day     BOOLEAN DEFAULT FALSE,
  color       TEXT DEFAULT '#4A6741',
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lists (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id     UUID REFERENCES lists(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  done        BOOLEAN DEFAULT FALSE,
  assigned_to TEXT,
  priority    TEXT DEFAULT 'רגיל',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT DEFAULT 'כללי',
  quantity    INTEGER DEFAULT 1,
  unit        TEXT DEFAULT 'יחידה',
  status      TEXT DEFAULT 'זמין',
  notes       TEXT,
  assigned_to TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         TEXT,
  description   TEXT,
  file_url      TEXT NOT NULL,
  file_type     TEXT DEFAULT 'image',
  uploader_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE departments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE soldiers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE soldier_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE media           ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "anon_all_departments" ON departments FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_soldiers" ON soldiers FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_soldier_portals" ON soldier_portals FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_schedules" ON schedules FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_lists" ON lists FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_list_items" ON list_items FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_logistics" ON logistics FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_media" ON media FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

function request(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE,
    'Authorization': `Bearer ${SERVICE_ROLE}`,
  };

  // Try the pg meta API endpoint that Supabase dashboard uses internally
  const endpoints = [
    { url: `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/query`, body: JSON.stringify({ query: SQL }) },
    { url: `https://${PROJECT_REF}.supabase.co/pg/query`,          body: JSON.stringify({ query: SQL }) },
    { url: `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec`,  body: JSON.stringify({ sql: SQL }) },
  ];

  for (const { url, body } of endpoints) {
    try {
      const urlObj = new URL(url);
      const res = await request(urlObj, {
        method: 'POST',
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
      }, body);
      console.log(`\n▶ ${url}`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Body: ${res.body.slice(0, 300)}`);
    } catch (e) {
      console.log(`\n▶ ${url}`);
      console.log(`  Error: ${e.message}`);
    }
  }
}

main();
