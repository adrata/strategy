-- Migration: Add User Goals Tracking System
-- Date: 2025-01-29
-- Description: Track user revenue goals, quarterly targets, and custom goals for Smart checklist generation

-- Create user_goals table
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
    
    -- Custom Goals (flexible JSONB for user-defined goals)
    "customGoals" JSONB DEFAULT '[]'::jsonb,
    
    -- Goal Period
    "goalPeriod" VARCHAR(20) DEFAULT 'quarterly', -- 'weekly', 'monthly', 'quarterly', 'yearly'
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

-- Create unique constraint for userId + workspaceId
CREATE UNIQUE INDEX IF NOT EXISTS "user_goals_userId_workspaceId_key" 
  ON "user_goals"("userId", "workspaceId");

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_user_goals_userId" ON "user_goals"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_goals_workspaceId" ON "user_goals"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_user_goals_goalPeriod" ON "user_goals"("goalPeriod");
CREATE INDEX IF NOT EXISTS "idx_user_goals_isOnTrack" ON "user_goals"("isOnTrack");

-- Add comments for documentation
COMMENT ON TABLE "user_goals" IS 'User revenue and activity goals for personalized AI recommendations and Smart checklist generation';
COMMENT ON COLUMN "user_goals"."quarterlyRevenueGoal" IS 'Target revenue for the quarter';
COMMENT ON COLUMN "user_goals"."customGoals" IS 'Array of custom user-defined goals: [{name: string, target: number, current: number, unit: string}]';
COMMENT ON COLUMN "user_goals"."progressPercentage" IS 'Overall progress toward goal (0-100)';
COMMENT ON COLUMN "user_goals"."isOnTrack" IS 'Boolean indicating if user is on pace to hit goal';

