-- Migration: Add Directional Intelligence and User Goals
-- Date: 2025-01-29
-- Description: Adds directionalIntelligence field to people and companies, creates user_goals table

-- Add directionalIntelligence to people table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people' AND column_name = 'directionalIntelligence') THEN
    ALTER TABLE "people" ADD COLUMN "directionalIntelligence" TEXT;
    CREATE INDEX IF NOT EXISTS "idx_people_directional_intelligence" ON "people"("directionalIntelligence") WHERE "directionalIntelligence" IS NOT NULL;
  END IF;
END $$;

-- Add directionalIntelligence to companies table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'directionalIntelligence') THEN
    ALTER TABLE "companies" ADD COLUMN "directionalIntelligence" TEXT;
    CREATE INDEX IF NOT EXISTS "idx_companies_directional_intelligence" ON "companies"("directionalIntelligence") WHERE "directionalIntelligence" IS NOT NULL;
  END IF;
END $$;

-- Create user_goals table (if not exists)
CREATE TABLE IF NOT EXISTS "user_goals" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    
    -- Revenue & Sales Goals
    "quarterlyRevenueGoal" DECIMAL(15,2),
    "yearlyRevenueGoal" DECIMAL(15,2),
    "quarterlyDealCount" INTEGER,
    "monthlyActivityGoal" INTEGER,
    "currentQuarterRevenue" DECIMAL(15,2) DEFAULT 0,
    "currentYearRevenue" DECIMAL(15,2) DEFAULT 0,
    
    -- Pipeline Goals
    "pipelineValueGoal" DECIMAL(15,2),
    "currentPipelineValue" DECIMAL(15,2) DEFAULT 0,
    "avgDealSizeGoal" DECIMAL(15,2),
    "winRateGoal" DECIMAL(5,2),
    
    -- Activity Goals
    "weeklyOutreachGoal" INTEGER,
    "weeklyMeetingsGoal" INTEGER,
    "weeklyCallsGoal" INTEGER,
    "weeklyEmailsGoal" INTEGER,
    
    -- Custom Goals
    "customGoals" JSONB DEFAULT '[]'::jsonb,
    
    -- Goal Period
    "goalPeriod" VARCHAR(20) DEFAULT 'quarterly',
    "goalStartDate" TIMESTAMP(3),
    "goalEndDate" TIMESTAMP(3),
    
    -- Progress Tracking
    "lastCalculated" TIMESTAMP(3),
    "progressPercentage" DECIMAL(5,2) DEFAULT 0,
    "isOnTrack" BOOLEAN DEFAULT true,
    "daysRemaining" INTEGER,
    
    -- System Fields
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "user_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "user_goals_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "user_goals_userId_workspaceId_key" ON "user_goals"("userId", "workspaceId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_user_goals_userId" ON "user_goals"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_goals_workspaceId" ON "user_goals"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_user_goals_goalPeriod" ON "user_goals"("goalPeriod");
CREATE INDEX IF NOT EXISTS "idx_user_goals_isOnTrack" ON "user_goals"("isOnTrack");

