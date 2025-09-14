-- =====================================================
-- ENTITY TRACKING SYSTEM - UNIFIED IDENTIFICATION
-- =====================================================
-- This script adds entity_id columns to all core tables
-- for unified tracking across the platform
-- =====================================================

-- Add entity_id to companies table
ALTER TABLE company ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_company_entity_id ON company(entity_id);

-- Add entity_id to person table  
ALTER TABLE person ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_person_entity_id ON person(entity_id);

-- Add entity_id to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_leads_entity_id ON leads(entity_id);

-- Add entity_id to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_prospects_entity_id ON prospects(entity_id);

-- Add entity_id to opportunities table
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_opportunities_entity_id ON opportunities(entity_id);

-- Add entity_id to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_clients_entity_id ON clients(entity_id);

-- Add entity_id to accounts table (for migration purposes)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_accounts_entity_id ON accounts(entity_id);

-- Add entity_id to contacts table (for migration purposes)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_contacts_entity_id ON contacts(entity_id);

-- Add entity_id to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS entity_id VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_partners_entity_id ON partners(entity_id);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Entity tracking columns added successfully' as status;
