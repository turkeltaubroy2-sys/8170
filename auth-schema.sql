-- 1. Add username and password to soldiers table
ALTER TABLE soldiers 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS password text;

-- 2. Insert specific soldier: "רועי טורקלטאוב" into "מחלקה 2"
-- We use a DO block to fetch the department ID dynamically
DO $$
DECLARE
  dep_id uuid;
  new_token uuid;
BEGIN
  -- Get department ID for מחלקה 2
  SELECT id INTO dep_id FROM departments WHERE name = 'מחלקה 2' LIMIT 1;
  
  -- Generate a random token for the unique_token field
  new_token := gen_random_uuid();
  
  -- Insert the user if the username 'roei' doesn't exist yet
  IF NOT EXISTS (SELECT 1 FROM soldiers WHERE username = 'roei') THEN
    INSERT INTO soldiers (full_name, rank, role, department_id, unique_token, username, password)
    VALUES ('רועי טורקלטאוב', 'חייל', 'לוחם', dep_id, new_token, 'roei', '1234');
  END IF;
END
$$;
