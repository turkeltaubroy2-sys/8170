-- Add equipment JSONB column to soldier_portals
ALTER TABLE soldier_portals 
ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '{}'::jsonb;
