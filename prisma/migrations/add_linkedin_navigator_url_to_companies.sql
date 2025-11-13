-- Migration: Add linkedinNavigatorUrl to companies table
-- This adds the linkedinNavigatorUrl column to the companies table if it doesn't already exist
-- This is key data for LinkedIn Sales Navigator integration

-- Add the column to companies table (will skip if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'linkedinNavigatorUrl'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN "linkedinNavigatorUrl" VARCHAR(500);
        
        RAISE NOTICE 'Added linkedinNavigatorUrl column to companies table';
    ELSE
        RAISE NOTICE 'linkedinNavigatorUrl column already exists in companies table';
    END IF;
END $$;

-- Note: The people table should already have this column from previous migrations
-- Verify people table has it (it should already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'people' 
        AND column_name = 'linkedinNavigatorUrl'
    ) THEN
        RAISE EXCEPTION 'linkedinNavigatorUrl column missing from people table - this should not happen!';
    ELSE
        RAISE NOTICE 'Confirmed: linkedinNavigatorUrl exists in people table';
    END IF;
END $$;

