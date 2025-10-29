-- Add missing fields to BuyerGroupMembers table for enhanced buyer group functionality

-- Add roleReasoning field (explanation for role assignment)
ALTER TABLE "BuyerGroupMembers" 
ADD COLUMN IF NOT EXISTS "roleReasoning" TEXT;

-- Add department field (for filtering and coverage analysis)
ALTER TABLE "BuyerGroupMembers" 
ADD COLUMN IF NOT EXISTS "department" VARCHAR(200);

-- Add connectionsCount field (network size metric)
ALTER TABLE "BuyerGroupMembers" 
ADD COLUMN IF NOT EXISTS "connectionsCount" INTEGER DEFAULT 0;

-- Add followersCount field (additional network metric)
ALTER TABLE "BuyerGroupMembers" 
ADD COLUMN IF NOT EXISTS "followersCount" INTEGER DEFAULT 0;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_buyer_group_members_department" ON "BuyerGroupMembers"("department");
CREATE INDEX IF NOT EXISTS "idx_buyer_group_members_connections" ON "BuyerGroupMembers"("connectionsCount");

-- Add comments for documentation
COMMENT ON COLUMN "BuyerGroupMembers"."roleReasoning" IS 'Explanation for why this person was assigned their specific role';
COMMENT ON COLUMN "BuyerGroupMembers"."department" IS 'Department for filtering and coverage analysis';
COMMENT ON COLUMN "BuyerGroupMembers"."connectionsCount" IS 'LinkedIn connections count for network analysis';
COMMENT ON COLUMN "BuyerGroupMembers"."followersCount" IS 'LinkedIn followers count for influence analysis';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'BuyerGroupMembers' 
AND column_name IN ('roleReasoning', 'department', 'connectionsCount', 'followersCount')
ORDER BY column_name;
