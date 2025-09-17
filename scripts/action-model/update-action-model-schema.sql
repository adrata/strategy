-- Data Model Update: Standardize lastAction and lastActionDate fields
-- This migration adds missing fields to ensure consistency across all entities

-- Add lastAction field to prospects table (currently only has lastActionDate)
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lastAction VARCHAR(50);

-- Add lastActionDate field to leads table (currently only has lastAction)  
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lastActionDate TIMESTAMP(6);

-- Add lastAction field to opportunities table (currently only has lastActionDate)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lastAction VARCHAR(50);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospects_last_action ON prospects(lastAction);
CREATE INDEX IF NOT EXISTS idx_prospects_last_action_date ON prospects(lastActionDate);
CREATE INDEX IF NOT EXISTS idx_leads_last_action_date ON leads(lastActionDate);
CREATE INDEX IF NOT EXISTS idx_opportunities_last_action ON opportunities(lastAction);

-- Add comments for documentation
COMMENT ON COLUMN prospects.lastAction IS 'Type of the most recent action taken with this prospect';
COMMENT ON COLUMN leads.lastActionDate IS 'Date of the most recent action taken with this lead';
COMMENT ON COLUMN opportunities.lastAction IS 'Type of the most recent action taken with this opportunity';
