-- Add media_urls column to soldier_portals to store array of uploaded media
ALTER TABLE soldier_portals ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]';

-- Update RLS if needed (usually already covered by "Public soldier_portals actions")
