-- Remove TOP Engineering Plus companies and their people
-- This will keep workspace and user records intact

-- First, delete people from TOP Engineering Plus companies
DELETE FROM people 
WHERE company_id IN (
  SELECT id FROM companies 
  WHERE LOWER(name) LIKE '%top engineering%' 
     OR LOWER(name) LIKE '%top engineers%'
);

-- Then delete the TOP Engineering Plus companies
DELETE FROM companies 
WHERE LOWER(name) LIKE '%top engineering%' 
   OR LOWER(name) LIKE '%top engineers%';

-- Show what was deleted
SELECT 'Cleanup completed - TOP Engineering Plus data removed' as status;
