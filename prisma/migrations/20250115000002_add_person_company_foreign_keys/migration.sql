-- Add foreign key constraints for Person/Company relationships
-- This ensures data integrity between core entities and business entities

-- Add foreign key constraint for contacts -> Person
ALTER TABLE "contacts" ADD CONSTRAINT fk_contacts_person 
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL;

-- Add foreign key constraint for leads -> Person  
ALTER TABLE "leads" ADD CONSTRAINT fk_leads_person 
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL;

-- Add foreign key constraint for prospects -> Person
ALTER TABLE "prospects" ADD CONSTRAINT fk_prospects_person 
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL;

-- Add foreign key constraint for accounts -> Company
-- Note: This assumes accounts should reference Company table
-- If accounts are standalone business entities, this constraint should be removed
-- ALTER TABLE "accounts" ADD CONSTRAINT fk_accounts_company 
--   FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL;

-- Add uniqueness constraints to prevent duplicates
-- Note: PostgreSQL doesn't support WHERE clause in UNIQUE constraints
-- We'll create a partial unique index instead
CREATE UNIQUE INDEX uk_person_email_workspace 
  ON "Person" ("email", "workspaceId") 
  WHERE "email" IS NOT NULL;

ALTER TABLE "Company" ADD CONSTRAINT uk_company_name_workspace 
  UNIQUE ("name", "workspaceId");

-- Add indexes for performance
CREATE INDEX "idx_contacts_person_id" ON "contacts"("personId");
CREATE INDEX "idx_leads_person_id" ON "leads"("personId");
CREATE INDEX "idx_prospects_person_id" ON "prospects"("personId");
