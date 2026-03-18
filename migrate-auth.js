const { Client } = require('pg');
const crypto = require('crypto');

const connectionString = 'postgresql://postgres:T%D7%95%D7%A8%D7%9C%D7%A7%D7%98%D7%A9%D7%A7%D7%9A998!@db.gcsixiixqebbkktarayc.supabase.co:5432/postgres';

async function migrateAuth() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    // 1. Add username and password columns to soldiers table
    await client.query(`
      ALTER TABLE soldiers 
      ADD COLUMN IF NOT EXISTS username text,
      ADD COLUMN IF NOT EXISTS password text;
      
      -- Add a unique constraint on username
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'soldiers_username_key') THEN
          ALTER TABLE soldiers ADD CONSTRAINT soldiers_username_key UNIQUE (username);
        END IF;
      END
      $$;
    `);
    console.log('Added username and password columns to soldiers table.');

    // 2. Find "מחלקה 2" ID
    const depRes = await client.query(`SELECT id FROM departments WHERE name = $1`, ['מחלקה 2']);
    if (depRes.rows.length === 0) {
      console.log('Department "מחלקה 2" not found. Cannot seed soldier.');
      return;
    }
    const depId = depRes.rows[0].id;

    // 3. Insert specific soldier "רועי טורקלטאוב"
    const uniqueToken = crypto.randomUUID();
    
    // Check if he already exists to avoid duplicates
    const checkRes = await client.query(`SELECT id FROM soldiers WHERE username = 'roei'`);
    if (checkRes.rows.length === 0) {
      await client.query(`
        INSERT INTO soldiers (full_name, rank, role, department_id, unique_token, username, password)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['רועי טורקלטאוב', 'חייל', 'לוחם', depId, uniqueToken, 'roei', '1234']);
      console.log('Successfully added soldier: רועי טורקלטאוב (Username: roei, Password: 1234)');
    } else {
      console.log('Soldier "roei" already exists.');
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrateAuth();
