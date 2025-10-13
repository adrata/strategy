-- Add next action metadata fields to people table
ALTER TABLE "people" 
  ADD COLUMN IF NOT EXISTS "nextActionReasoning" TEXT,
  ADD COLUMN IF NOT EXISTS "nextActionPriority" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "nextActionType" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "nextActionUpdatedAt" TIMESTAMP(3);

-- Add next action metadata fields to companies table
ALTER TABLE "companies" 
  ADD COLUMN IF NOT EXISTS "nextActionReasoning" TEXT,
  ADD COLUMN IF NOT EXISTS "nextActionPriority" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "nextActionType" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "nextActionUpdatedAt" TIMESTAMP(3);

-- Add indexes for next action queries
CREATE INDEX IF NOT EXISTS "idx_people_next_action_date" ON "people"("nextActionDate") WHERE "nextActionDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_people_next_action_priority" ON "people"("nextActionPriority") WHERE "nextActionPriority" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_companies_next_action_date" ON "companies"("nextActionDate") WHERE "nextActionDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_companies_next_action_priority" ON "companies"("nextActionPriority") WHERE "nextActionPriority" IS NOT NULL;

