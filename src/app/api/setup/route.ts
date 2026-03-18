import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_PASSWORD = 'Tורלקךטשקך998!';
const PROJECT_REF = 'gcsixiixqebbkktarayc';

// Updated: only מחלקה 1 and מחלקה 2 per user request (פלוגה ב)
const SETUP_SQL = `
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

export async function GET() {
  // Try to connect via Supabase session pooler using service role JWT as password
  const connectionConfigs = [
    // Session pooler (IPv4) - primary
    {
      host: 'aws-0-eu-central-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      user: `postgres.${PROJECT_REF}`,
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    // Transaction pooler
    {
      host: 'aws-0-eu-central-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: `postgres.${PROJECT_REF}`,
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    // Direct connection
    {
      host: `db.${PROJECT_REF}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
  ];

  const errors: string[] = [];

  for (const config of connectionConfigs) {
    const client = new Client(config);
    try {
      await client.connect();
      await client.query(SETUP_SQL);
      
      // Verify tables
      const result = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `);
      
      await client.end();
      
      return NextResponse.json({
        success: true,
        message: 'Database schema applied successfully!',
        tables: result.rows.map((r: any) => r.tablename),
        connectionUsed: `${config.host}:${config.port}`,
      });
    } catch (err: any) {
      errors.push(`${config.host}:${config.port} — ${err.message}`);
      try { await client.end(); } catch {}
    }
  }

  return NextResponse.json({
    success: false,
    message: 'All connection attempts failed. Please run the SQL manually in Supabase SQL Editor.',
    errors,
    sqlEditorUrl: `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`,
  }, { status: 500 });
}
