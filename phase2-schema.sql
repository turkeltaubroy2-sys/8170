-- 1. Add pakalim to soldiers
ALTER TABLE soldiers ADD COLUMN IF NOT EXISTS pakalim JSONB DEFAULT '[]';

-- 2. Create requests table (פניות)
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  soldier_id UUID REFERENCES soldiers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'כללי', -- ציוד, רפואי, כללי
  status TEXT DEFAULT 'פתוח', -- פתוח, בטיפול, סגור
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create forms table (שאלונים / דוח 1)
CREATE TABLE IF NOT EXISTS forms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]', -- Array of questions
  created_by TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create form_responses table (תשובות חייל לשאלון)
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  soldier_id UUID REFERENCES soldiers(id) ON DELETE CASCADE,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_id, soldier_id) -- Soldier can answer a specific form once
);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Public RLS Policies
DO $$ BEGIN CREATE POLICY "anon_all_requests" ON requests FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_forms" ON forms FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_all_form_responses" ON form_responses FOR ALL TO anon USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
