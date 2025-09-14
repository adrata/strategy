-- Add enterprise fields to User model
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isSSO" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scimSource" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ssoProviderId" TEXT;

-- Add enterprise fields to Workspace model
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "auditRetentionDays" INTEGER DEFAULT 90;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "primaryRegion" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "complianceFrameworks" JSONB;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "scimEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "ssoEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "allowedRegions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add missing fields to Lead model
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "title" TEXT;

-- Add missing fields to Opportunity model  
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "riskScore" DOUBLE PRECISION;

-- Add missing fields to Activity model
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "scheduledDate" TIMESTAMP(3);

-- Create indexes for performance on new fields
CREATE INDEX IF NOT EXISTS "idx_users_lastLoginAt" ON "users"("lastLoginAt") WHERE "lastLoginAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_users_externalId" ON "users"("externalId") WHERE "externalId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_users_isSSO_isActive" ON "users"("isSSO", "isActive");
CREATE INDEX IF NOT EXISTS "idx_workspaces_subscriptionTier" ON "workspaces"("subscriptionTier") WHERE "subscriptionTier" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_workspaces_scimEnabled" ON "workspaces"("scimEnabled") WHERE "scimEnabled" = true;
CREATE INDEX IF NOT EXISTS "idx_workspaces_ssoEnabled" ON "workspaces"("ssoEnabled") WHERE "ssoEnabled" = true;
CREATE INDEX IF NOT EXISTS "idx_leads_title" ON "leads"("title") WHERE "title" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_opportunities_riskScore" ON "opportunities"("riskScore") WHERE "riskScore" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_activities_scheduledDate" ON "activities"("scheduledDate") WHERE "scheduledDate" IS NOT NULL; 