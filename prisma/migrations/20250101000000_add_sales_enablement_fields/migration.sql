-- Add Sales Enablement Fields Migration
-- This migration adds comprehensive personal intelligence, relationship tracking, and business intelligence fields

-- Create partners table
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "assignedUserId" VARCHAR(30),
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "linkedinUrl" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "country" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "partnershipType" VARCHAR(50) DEFAULT 'Strategic',
    "partnershipModel" VARCHAR(50) DEFAULT 'Channel Partner',
    "partnershipStartDate" TIMESTAMP(3),
    "partnershipValue" VARCHAR(20) DEFAULT 'High',
    "revenueShare" VARCHAR(10) DEFAULT '20%',
    "territory" VARCHAR(50) DEFAULT 'Regional',
    "exclusivity" VARCHAR(20) DEFAULT 'Non-exclusive',
    "performanceScore" DOUBLE PRECISION DEFAULT 85,
    "partnerRevenue" DOUBLE PRECISION DEFAULT 0,
    "revenueGrowth" DOUBLE PRECISION DEFAULT 0,
    "dealsClosed" INTEGER DEFAULT 0,
    "pipelineValue" DOUBLE PRECISION DEFAULT 0,
    "winRate" DOUBLE PRECISION DEFAULT 0,
    "avgDealSize" DOUBLE PRECISION DEFAULT 0,
    "certificationLevel" VARCHAR(30) DEFAULT 'Silver Partner',
    "salesCertified" BOOLEAN DEFAULT false,
    "techCertified" BOOLEAN DEFAULT false,
    "lastTrainingDate" TIMESTAMP(3),
    "nextTrainingDate" TIMESTAMP(3),
    "mdfAllocation" VARCHAR(20) DEFAULT '$25K',
    "coreCompetencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceOfferings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keyStrengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "growthOpportunities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- Add personal intelligence fields to people (contacts table doesn't exist)
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "personalGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "professionalGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "communicationStyle" VARCHAR(30) DEFAULT 'Professional';
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "decisionMakingStyle" VARCHAR(30) DEFAULT 'Analytical';
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "workAnniversary" TIMESTAMP(3);

-- Add personal intelligence fields to leads
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "personalGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "professionalGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "communicationStyle" VARCHAR(30) DEFAULT 'Professional';
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "decisionMakingStyle" VARCHAR(30) DEFAULT 'Analytical';
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "workAnniversary" TIMESTAMP(3);

-- Add personal intelligence fields to prospects (interests already exists)
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "personalGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "professionalGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "communicationStyle" VARCHAR(30) DEFAULT 'Professional';
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decisionMakingStyle" VARCHAR(30) DEFAULT 'Analytical';
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "workAnniversary" TIMESTAMP(3);

-- Add relationship intelligence fields to customers
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "relationshipStrength" VARCHAR(20) DEFAULT 'Good';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "satisfactionScore" DOUBLE PRECISION DEFAULT 8.0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "nps" INTEGER DEFAULT 8;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "referralsProvided" INTEGER DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "caseStudyParticipation" BOOLEAN DEFAULT false;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "trustLevel" VARCHAR(20) DEFAULT 'High';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "advocacyLevel" VARCHAR(20) DEFAULT 'Promoter';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "clientAnniversary" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "accountManager" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "successManager" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "executiveSponsor" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "meetingFrequency" VARCHAR(20) DEFAULT 'Monthly';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "roiAchieved" DOUBLE PRECISION DEFAULT 240;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "timeToValue" INTEGER DEFAULT 45;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "dailyActiveUsers" INTEGER DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "featureAdoption" DOUBLE PRECISION DEFAULT 0.78;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "supportTickets" VARCHAR(20) DEFAULT '3/month';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "costSavings" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "efficiencyGain" DOUBLE PRECISION DEFAULT 0.35;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "revenueImpact" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "timeSaved" VARCHAR(20) DEFAULT '20 hrs/week';
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "ninetyDayGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "annualObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "successRisks" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "renewalProbability" DOUBLE PRECISION DEFAULT 0.95;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "contractValue" DOUBLE PRECISION DEFAULT 0;

-- Add business intelligence fields to accounts
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "businessChallenges" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "businessPriorities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "strategicInitiatives" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "successMetrics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "competitiveAdvantages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "marketThreats" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "growthOpportunities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "budgetCycle" VARCHAR(20) DEFAULT 'Annual';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "approvalProcess" VARCHAR(30) DEFAULT 'Committee';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "decisionTimeline" VARCHAR(20) DEFAULT '3-6 months';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "keyInfluencers" VARCHAR(30) DEFAULT 'C-Level';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "marketPosition" VARCHAR(30) DEFAULT 'Established';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "relationshipStrength" VARCHAR(20) DEFAULT 'Good';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "growthPotential" VARCHAR(20) DEFAULT 'High';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "riskLevel" VARCHAR(20) DEFAULT 'Low';

-- Add missing engagement fields to leads
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "engagementLevel" VARCHAR(20) DEFAULT 'low';
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "responseRate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "touchPointsCount" INTEGER DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "avgResponseTime" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "buyingSignals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "painPoints" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "budget" DOUBLE PRECISION;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "authority" VARCHAR(30);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "needUrgency" VARCHAR(30);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "timeline" VARCHAR(30);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "competitorMentions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "marketingQualified" BOOLEAN DEFAULT false;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "salesQualified" BOOLEAN DEFAULT false;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lastContactDate" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "nextFollowUpDate" TIMESTAMP(3);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "partners_workspaceId_idx" ON "partners"("workspaceId");
CREATE INDEX IF NOT EXISTS "partners_assignedUserId_idx" ON "partners"("assignedUserId");
CREATE INDEX IF NOT EXISTS "partners_partnershipType_idx" ON "partners"("partnershipType");
CREATE INDEX IF NOT EXISTS "customers_relationshipStrength_idx" ON "customers"("relationshipStrength");
CREATE INDEX IF NOT EXISTS "accounts_relationshipStrength_idx" ON "accounts"("relationshipStrength");
