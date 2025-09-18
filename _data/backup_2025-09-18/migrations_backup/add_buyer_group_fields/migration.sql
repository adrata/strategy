-- Add buyer group specific fields to contacts table
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "buyerGroupRole" VARCHAR(50);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "seniorityScore" INTEGER DEFAULT 0;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "decisionMakingPower" VARCHAR(30);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "efficiencyFocus" VARCHAR(20);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "targetPriority" INTEGER DEFAULT 50;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "discoverySource" VARCHAR(50);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "coresignalEmployeeId" VARCHAR(50);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "coresignalCompanyId" VARCHAR(50);

-- Create index for efficient querying of high-priority targets
CREATE INDEX IF NOT EXISTS "idx_contacts_seniority_priority" ON "contacts"("seniorityScore" DESC, "targetPriority" DESC);
CREATE INDEX IF NOT EXISTS "idx_contacts_buyer_group_role" ON "contacts"("buyerGroupRole");
CREATE INDEX IF NOT EXISTS "idx_contacts_decision_power" ON "contacts"("decisionMakingPower");

-- Create a view for top buyer group prospects
CREATE OR REPLACE VIEW "top_buyer_group_prospects" AS
SELECT 
  id,
  "fullName",
  "jobTitle",
  "buyerGroupRole",
  "seniorityScore",
  "decisionMakingPower",
  "efficiencyFocus",
  "targetPriority",
  email,
  "linkedinUrl",
  "accountId"
FROM "contacts"
WHERE 
  "buyerGroupRole" IS NOT NULL 
  AND "seniorityScore" >= 60  -- Director level and above
  AND "efficiencyFocus" IN ('very_high', 'high', 'medium')
ORDER BY 
  "seniorityScore" DESC, 
  "targetPriority" DESC,
  "efficiencyFocus" DESC;
