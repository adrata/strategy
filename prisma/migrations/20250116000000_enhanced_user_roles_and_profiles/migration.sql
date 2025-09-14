-- Enhanced User Roles and Profiles Migration
-- Adds comprehensive sales role system and personalization fields

-- Add enhanced profile fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "title" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "department" VARCHAR(50);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "seniorityLevel" VARCHAR(20);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "territory" VARCHAR(100);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "quota" DECIMAL(15,2);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "manager" VARCHAR(30);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(20);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedinUrl" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePictureUrl" VARCHAR(255);

-- Add role-based personalization fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "communicationStyle" VARCHAR(30) DEFAULT 'consultative';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredDetailLevel" VARCHAR(20) DEFAULT 'detailed';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB DEFAULT '{"urgency": "medium", "frequency": "hourly", "channels": ["in_app"]}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dashboardConfig" JSONB DEFAULT '{"defaultView": "speedrun", "widgets": [], "kpis": []}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "intelligenceFocus" JSONB DEFAULT '{"buyingSignals": true, "competitorMentions": false, "stakeholderMapping": true}';

-- Add CoreSignal access tracking
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coreSignalCreditsUsed" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coreSignalCreditsLimit" INTEGER DEFAULT 500;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coreSignalLastReset" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Enhance Role table with sales-specific fields
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "level" INTEGER;
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "category" VARCHAR(30);
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "department" VARCHAR(50);
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "dataAccessConfig" JSONB;
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "aiPersonalizationConfig" JSONB;
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "defaultApps" TEXT[];
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "coreSignalAccess" JSONB;

-- Create UserProfile table for extended profile information
CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    
    -- Professional Information
    "title" VARCHAR(100),
    "department" VARCHAR(50),
    "seniorityLevel" VARCHAR(20),
    "territory" VARCHAR(100),
    "quota" DECIMAL(15,2),
    "startDate" TIMESTAMP,
    "managerId" TEXT,
    "directReports" TEXT[],
    
    -- Contact Information
    "phoneNumber" VARCHAR(20),
    "linkedinUrl" VARCHAR(255),
    "profilePictureUrl" VARCHAR(255),
    "workLocation" VARCHAR(100),
    "timeZone" VARCHAR(50),
    
    -- Performance Metrics
    "currentQuotaAttainment" DECIMAL(5,2),
    "ytdRevenue" DECIMAL(15,2),
    "avgDealSize" DECIMAL(15,2),
    "winRate" DECIMAL(5,2),
    "salesVelocity" INTEGER,
    
    -- Personalization Settings
    "communicationStyle" VARCHAR(30) DEFAULT 'consultative',
    "preferredDetailLevel" VARCHAR(20) DEFAULT 'detailed',
    "notificationPreferences" JSONB DEFAULT '{}',
    "dashboardConfig" JSONB DEFAULT '{}',
    "intelligenceFocus" JSONB DEFAULT '{}',
    
    -- AI Learning Data
    "communicationSamples" JSONB,
    "interactionHistory" JSONB,
    "preferenceHistory" JSONB,
    "lastPersonalizationUpdate" TIMESTAMP,
    
    -- System Fields
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE,
    CONSTRAINT "UserProfile_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create unique constraint for user profile per workspace
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_userId_workspaceId_key" ON "UserProfile"("userId", "workspaceId");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "UserProfile_userId_idx" ON "UserProfile"("userId");
CREATE INDEX IF NOT EXISTS "UserProfile_workspaceId_idx" ON "UserProfile"("workspaceId");
CREATE INDEX IF NOT EXISTS "UserProfile_managerId_idx" ON "UserProfile"("managerId");
CREATE INDEX IF NOT EXISTS "UserProfile_department_idx" ON "UserProfile"("department");
CREATE INDEX IF NOT EXISTS "UserProfile_seniorityLevel_idx" ON "UserProfile"("seniorityLevel");

-- Create RolePermission table for granular permissions
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "roleId" TEXT NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "actions" TEXT[] NOT NULL,
    "scope" VARCHAR(20) NOT NULL DEFAULT 'own',
    "conditions" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
);

-- Create unique constraint for role permissions
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_resource_key" ON "RolePermission"("roleId", "resource");

-- Create UserRoleHistory table to track role changes
CREATE TABLE IF NOT EXISTS "UserRoleHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "oldRoleId" TEXT,
    "newRoleId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "effectiveDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserRoleHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserRoleHistory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE,
    CONSTRAINT "UserRoleHistory_oldRoleId_fkey" FOREIGN KEY ("oldRoleId") REFERENCES "Role"("id") ON DELETE SET NULL,
    CONSTRAINT "UserRoleHistory_newRoleId_fkey" FOREIGN KEY ("newRoleId") REFERENCES "Role"("id") ON DELETE CASCADE,
    CONSTRAINT "UserRoleHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for role history
CREATE INDEX IF NOT EXISTS "UserRoleHistory_userId_idx" ON "UserRoleHistory"("userId");
CREATE INDEX IF NOT EXISTS "UserRoleHistory_workspaceId_idx" ON "UserRoleHistory"("workspaceId");
CREATE INDEX IF NOT EXISTS "UserRoleHistory_effectiveDate_idx" ON "UserRoleHistory"("effectiveDate");

-- Insert default sales roles for existing workspaces
INSERT INTO "Role" ("id", "name", "displayName", "description", "workspaceId", "isSystem", "permissions", "level", "category", "department", "dataAccessConfig", "aiPersonalizationConfig", "defaultApps", "coreSignalAccess")
SELECT 
    gen_random_uuid()::text,
    'cro',
    'Chief Revenue Officer',
    'Executive leadership role with full revenue responsibility',
    "id",
    true,
    ARRAY['*:create', '*:read', '*:update', '*:delete', '*:manage'],
    1,
    'executive',
    'sales',
    '{"accounts": {"scope": "all"}, "contacts": {"scope": "all"}, "opportunities": {"scope": "all", "forecastAccess": true}, "intelligence": {"buyerGroupAccess": true, "competitiveIntel": true, "marketResearch": true, "advancedAnalytics": true}}',
    '{"communicationStyle": "analytical", "contentPreferences": {"detailLevel": "comprehensive", "includeMetrics": true, "includeRecommendations": true, "includeNextSteps": true}, "intelligenceFocus": {"buyingSignals": true, "competitorMentions": true, "stakeholderMapping": true, "technographics": true, "financialHealth": true}, "notifications": {"urgency": "high", "frequency": "real_time", "channels": ["in_app", "email", "slack"]}}',
    ARRAY['analytics', 'pipeline', 'speedrun', 'monaco'],
    '{"enabled": true, "creditsPerMonth": 10000, "searchTypes": ["person", "company", "bulk"], "enrichmentLevel": "premium"}'
FROM "Workspace"
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" 
    WHERE "Role"."workspaceId" = "Workspace"."id" 
    AND "Role"."name" = 'cro'
);

INSERT INTO "Role" ("id", "name", "displayName", "description", "workspaceId", "isSystem", "permissions", "level", "category", "department", "dataAccessConfig", "aiPersonalizationConfig", "defaultApps", "coreSignalAccess")
SELECT 
    gen_random_uuid()::text,
    'vp_sales',
    'VP Sales',
    'Vice President of Sales with territory responsibility',
    "id",
    true,
    ARRAY['accounts:create', 'accounts:read', 'accounts:update', 'accounts:delete', 'opportunities:create', 'opportunities:read', 'opportunities:update', 'opportunities:delete', 'team_management:create', 'team_management:read', 'team_management:update', 'team_management:manage'],
    2,
    'executive',
    'sales',
    '{"accounts": {"scope": "territory", "dealSizeLimit": 5000000}, "contacts": {"scope": "territory", "seniorityLimit": "c_level"}, "opportunities": {"scope": "territory", "forecastAccess": true}, "intelligence": {"buyerGroupAccess": true, "competitiveIntel": true, "marketResearch": true, "advancedAnalytics": true}}',
    '{"communicationStyle": "consultative", "contentPreferences": {"detailLevel": "detailed", "includeMetrics": true, "includeRecommendations": true, "includeNextSteps": true}, "intelligenceFocus": {"buyingSignals": true, "competitorMentions": true, "stakeholderMapping": true, "technographics": true, "financialHealth": true}, "notifications": {"urgency": "high", "frequency": "real_time", "channels": ["in_app", "email"]}}',
    ARRAY['pipeline', 'speedrun', 'monaco', 'analytics'],
    '{"enabled": true, "creditsPerMonth": 5000, "searchTypes": ["person", "company", "bulk"], "enrichmentLevel": "premium"}'
FROM "Workspace"
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" 
    WHERE "Role"."workspaceId" = "Workspace"."id" 
    AND "Role"."name" = 'vp_sales'
);

INSERT INTO "Role" ("id", "name", "displayName", "description", "workspaceId", "isSystem", "permissions", "level", "category", "department", "dataAccessConfig", "aiPersonalizationConfig", "defaultApps", "coreSignalAccess")
SELECT 
    gen_random_uuid()::text,
    'enterprise_ae',
    'Enterprise AE',
    'Enterprise Account Executive focused on large deals',
    "id",
    true,
    ARRAY['accounts:read', 'accounts:update', 'opportunities:create', 'opportunities:read', 'opportunities:update', 'activities:create', 'activities:read', 'activities:update'],
    5,
    'individual_contributor',
    'sales',
    '{"accounts": {"scope": "assigned", "dealSizeLimit": 2000000}, "contacts": {"scope": "assigned", "seniorityLimit": "c_level"}, "opportunities": {"scope": "assigned", "forecastAccess": false}, "intelligence": {"buyerGroupAccess": true, "competitiveIntel": true, "marketResearch": false, "advancedAnalytics": false}}',
    '{"communicationStyle": "consultative", "contentPreferences": {"detailLevel": "detailed", "includeMetrics": false, "includeRecommendations": true, "includeNextSteps": true}, "intelligenceFocus": {"buyingSignals": true, "competitorMentions": true, "stakeholderMapping": true, "technographics": false, "financialHealth": false}, "notifications": {"urgency": "medium", "frequency": "real_time", "channels": ["in_app"]}}',
    ARRAY['speedrun', 'monaco', 'pipeline'],
    '{"enabled": true, "creditsPerMonth": 1000, "searchTypes": ["person", "company"], "enrichmentLevel": "standard"}'
FROM "Workspace"
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" 
    WHERE "Role"."workspaceId" = "Workspace"."id" 
    AND "Role"."name" = 'enterprise_ae'
);

INSERT INTO "Role" ("id", "name", "displayName", "description", "workspaceId", "isSystem", "permissions", "level", "category", "department", "dataAccessConfig", "aiPersonalizationConfig", "defaultApps", "coreSignalAccess")
SELECT 
    gen_random_uuid()::text,
    'sdr',
    'SDR',
    'Sales Development Representative focused on lead generation',
    "id",
    true,
    ARRAY['leads:create', 'leads:read', 'leads:update', 'activities:create', 'activities:read', 'activities:update', 'sequences:create', 'sequences:read', 'sequences:update'],
    5,
    'individual_contributor',
    'sales',
    '{"accounts": {"scope": "assigned", "dealSizeLimit": 100000}, "contacts": {"scope": "assigned", "seniorityLimit": "manager"}, "opportunities": {"scope": "assigned", "forecastAccess": false}, "intelligence": {"buyerGroupAccess": false, "competitiveIntel": false, "marketResearch": false, "advancedAnalytics": false}}',
    '{"communicationStyle": "direct", "contentPreferences": {"detailLevel": "summary", "includeMetrics": false, "includeRecommendations": true, "includeNextSteps": true}, "intelligenceFocus": {"buyingSignals": true, "competitorMentions": false, "stakeholderMapping": false, "technographics": false, "financialHealth": false}, "notifications": {"urgency": "low", "frequency": "daily", "channels": ["in_app"]}}',
    ARRAY['speedrun'],
    '{"enabled": true, "creditsPerMonth": 500, "searchTypes": ["person"], "enrichmentLevel": "basic"}'
FROM "Workspace"
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" 
    WHERE "Role"."workspaceId" = "Workspace"."id" 
    AND "Role"."name" = 'sdr'
);

-- Update existing WorkspaceMembership to use new role system
-- This will assign default roles based on existing role strings
UPDATE "WorkspaceMembership" 
SET "roleId" = (
    SELECT "Role"."id" 
    FROM "Role" 
    WHERE "Role"."workspaceId" = "WorkspaceMembership"."workspaceId" 
    AND "Role"."name" = CASE 
        WHEN "WorkspaceMembership"."role" ILIKE '%cro%' OR "WorkspaceMembership"."role" ILIKE '%chief revenue%' THEN 'cro'
        WHEN "WorkspaceMembership"."role" ILIKE '%vp%' AND "WorkspaceMembership"."role" ILIKE '%sales%' THEN 'vp_sales'
        WHEN "WorkspaceMembership"."role" ILIKE '%enterprise%' AND "WorkspaceMembership"."role" ILIKE '%ae%' THEN 'enterprise_ae'
        WHEN "WorkspaceMembership"."role" ILIKE '%sdr%' OR "WorkspaceMembership"."role" ILIKE '%sales development%' THEN 'sdr'
        ELSE 'enterprise_ae'
    END
    LIMIT 1
)
WHERE "roleId" IS NULL;

-- Create trigger to update UserProfile.updatedAt
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profile_updated_at
    BEFORE UPDATE ON "UserProfile"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profile_updated_at();

-- Create function to automatically create UserProfile when User is created
CREATE OR REPLACE FUNCTION create_user_profile_on_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "UserProfile" ("userId", "workspaceId")
    VALUES (NEW."userId", NEW."workspaceId")
    ON CONFLICT ("userId", "workspaceId") DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_profile_on_membership
    AFTER INSERT ON "WorkspaceMembership"
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile_on_membership();

-- Add comments for documentation
COMMENT ON TABLE "UserProfile" IS 'Extended user profile information with sales-specific fields and personalization settings';
COMMENT ON TABLE "RolePermission" IS 'Granular permissions for each role';
COMMENT ON TABLE "UserRoleHistory" IS 'Audit trail for role changes';

COMMENT ON COLUMN "UserProfile"."seniorityLevel" IS 'IC, Manager, Director, VP, C-Level';
COMMENT ON COLUMN "UserProfile"."communicationStyle" IS 'direct, consultative, analytical, relationship_focused';
COMMENT ON COLUMN "UserProfile"."preferredDetailLevel" IS 'summary, detailed, comprehensive';
COMMENT ON COLUMN "Role"."level" IS '1=CRO, 2=VP, 3=Director, 4=Manager, 5=IC';
COMMENT ON COLUMN "Role"."category" IS 'executive, management, individual_contributor';
