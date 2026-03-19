-- 1. Update soldiers table to use personal_number and password
ALTER TABLE soldiers ADD COLUMN IF NOT EXISTS personal_number TEXT UNIQUE;
ALTER TABLE soldiers ADD COLUMN IF NOT EXISTS password TEXT;

-- (Optional) If we want to drop username, we can, but we can just leave it for legacy
-- ALTER TABLE soldiers DROP COLUMN username;

-- 2. Create the messages table for broadcasts
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_department_id UUID REFERENCES departments(id) ON DELETE SET NULL, -- NULL means all departments
  created_by UUID REFERENCES soldiers(id) ON DELETE SET NULL, -- Admin who created it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now for the platform prototype
DROP POLICY IF EXISTS "Public messages actions" ON messages;
CREATE POLICY "Public messages actions" ON messages FOR ALL USING (TRUE) WITH CHECK (TRUE);
