const { Client } = require('pg');

const DB_PASSWORD = 'Tורלקךטשקך998!';

// Using the config from migrate-phase2.js which worked
const config = {
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.gcsixiixqebbkktarayc',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

const sql = `
-- Check if columns exist before adding them to avoid errors if they do
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='department_id') THEN
        ALTER TABLE schedules ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='commander_id') THEN
        ALTER TABLE schedules ADD COLUMN commander_id UUID REFERENCES soldiers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='status') THEN
        ALTER TABLE schedules ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;
`;

async function run() {
  const client = new Client(config);
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    await client.query(sql);
    console.log('Successfully applied schedules table columns');
  } catch(e) {
    console.error('Migration failed:', e.message);
  } finally {
    await client.end();
  }
}

run();
