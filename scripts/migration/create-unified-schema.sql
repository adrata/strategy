-- Create unified schema for complete data isolation migration
-- This creates temporary tables that will be renamed after migration

-- Create PersonUnified table (temporary name)
CREATE TABLE "PersonUnified" (
  id              VARCHAR(30) PRIMARY KEY,
  workspaceId     VARCHAR(30) NOT NULL,
  
  -- Core Identity
  firstName       VARCHAR(100) NOT NULL,
  lastName        VARCHAR(100) NOT NULL,
  fullName        VARCHAR(200) NOT NULL,
  email           VARCHAR(300),
  phone           VARCHAR(50),
  mobile          VARCHAR(50),
  
  -- Professional Info
  jobTitle        VARCHAR(300),
  title           VARCHAR(300),
  department      VARCHAR(200),
  seniority       VARCHAR(50),
  company         VARCHAR(200),
  companyDomain   VARCHAR(200),
  industry        VARCHAR(100),
  
  -- Business Context
  entityType      VARCHAR(20) DEFAULT 'contact', -- 'contact', 'lead', 'prospect'
  status          VARCHAR(50) DEFAULT 'active',
  priority        VARCHAR(30) DEFAULT 'medium',
  source          VARCHAR(100),
  
  -- Sales Pipeline (for leads/prospects)
  currentStage    VARCHAR(50),
  relationship    VARCHAR(50),
  buyerGroupRole  VARCHAR(100),
  estimatedValue  FLOAT,
  currency        VARCHAR(3) DEFAULT 'USD',
  
  -- Contact & Engagement
  lastContactDate TIMESTAMP,
  nextFollowUpDate TIMESTAMP,
  lastActionDate  TIMESTAMP,
  nextActionDate  TIMESTAMP,
  nextAction      VARCHAR(200),
  
  -- Business Intelligence
  engagementLevel VARCHAR(50),
  buyingSignals   TEXT[],
  painPoints      TEXT[],
  interests       TEXT[],
  budget          VARCHAR(100),
  authority       VARCHAR(100),
  needUrgency     VARCHAR(100),
  timeline        VARCHAR(100),
  
  -- Qualification
  marketingQualified BOOLEAN DEFAULT false,
  salesQualified     BOOLEAN DEFAULT false,
  
  -- Account Relationship
  accountId       VARCHAR(30),
  
  -- Contact Information
  workEmail       VARCHAR(300),
  personalEmail   VARCHAR(300),
  secondaryEmail  VARCHAR(300),
  mobilePhone     VARCHAR(50),
  workPhone       VARCHAR(50),
  linkedinUrl     VARCHAR(500),
  twitterHandle   VARCHAR(100),
  personalWebsite VARCHAR(500),
  photoUrl        VARCHAR(500),
  
  -- Location
  address         VARCHAR(500),
  city            VARCHAR(100),
  state           VARCHAR(100),
  country         VARCHAR(100),
  postalCode      VARCHAR(20),
  location        VARCHAR(200),
  timezone        VARCHAR(50),
  
  -- Personal Details
  bio             TEXT,
  notes           TEXT,
  tags            TEXT[],
  customFields    JSONB,
  
  -- System Fields
  assignedUserId  VARCHAR(30),
  createdBy       VARCHAR(30),
  dataSource      VARCHAR(50) DEFAULT 'manual',
  isActive        BOOLEAN DEFAULT true,
  isVerified      BOOLEAN DEFAULT false,
  isDemoData      BOOLEAN DEFAULT false,
  externalId      VARCHAR(100),
  zohoId          VARCHAR(100),
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP,
  deletedAt       TIMESTAMP
);

-- Create CompanyUnified table (temporary name)
CREATE TABLE "CompanyUnified" (
  id              VARCHAR(30) PRIMARY KEY,
  workspaceId     VARCHAR(30) NOT NULL,
  
  -- Core Company Identity
  name            VARCHAR(200) NOT NULL,
  website         VARCHAR(500),
  industry        VARCHAR(100),
  size            VARCHAR(50),
  vertical        VARCHAR(100),
  
  -- Contact Information
  email           VARCHAR(300),
  phone           VARCHAR(50),
  address         VARCHAR(500),
  city            VARCHAR(100),
  state           VARCHAR(100),
  country         VARCHAR(100),
  postalCode      VARCHAR(20),
  
  -- Business Context
  entityType      VARCHAR(20) DEFAULT 'account', -- 'account', 'prospect', 'client'
  status          VARCHAR(50) DEFAULT 'active',
  tier            VARCHAR(20), -- 'gold', 'silver', 'bronze'
  accountType     VARCHAR(50) DEFAULT 'Prospect',
  
  -- Financial
  revenue         FLOAT,
  contractValue   FLOAT,
  currency        VARCHAR(3) DEFAULT 'USD',
  
  -- Business Intelligence
  lastContactDate TIMESTAMP,
  nextFollowUpDate TIMESTAMP,
  engagementLevel VARCHAR(50),
  buyingSignals   TEXT[],
  painPoints      TEXT[],
  interests       TEXT[],
  
  -- Company Details
  description     TEXT,
  notes           TEXT,
  tags            TEXT[],
  customFields    JSONB,
  
  -- System Fields
  assignedUserId  VARCHAR(30),
  createdBy       VARCHAR(30),
  dataSource      VARCHAR(50) DEFAULT 'manual',
  isActive        BOOLEAN DEFAULT true,
  isDemoData      BOOLEAN DEFAULT false,
  externalId      VARCHAR(100),
  zohoId          VARCHAR(100),
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP,
  deletedAt       TIMESTAMP
);

-- Create indexes for PersonUnified
CREATE INDEX "idx_person_unified_workspace" ON "PersonUnified"("workspaceId");
CREATE INDEX "idx_person_unified_entity_type" ON "PersonUnified"("workspaceId", "entityType");
CREATE INDEX "idx_person_unified_status" ON "PersonUnified"("workspaceId", "status");
CREATE INDEX "idx_person_unified_email" ON "PersonUnified"("workspaceId", "email");
CREATE INDEX "idx_person_unified_company" ON "PersonUnified"("workspaceId", "company");
CREATE INDEX "idx_person_unified_account" ON "PersonUnified"("workspaceId", "accountId");
CREATE INDEX "idx_person_unified_assigned_user" ON "PersonUnified"("workspaceId", "assignedUserId");

-- Create indexes for CompanyUnified
CREATE INDEX "idx_company_unified_workspace" ON "CompanyUnified"("workspaceId");
CREATE INDEX "idx_company_unified_entity_type" ON "CompanyUnified"("workspaceId", "entityType");
CREATE INDEX "idx_company_unified_status" ON "CompanyUnified"("workspaceId", "status");
CREATE INDEX "idx_company_unified_name" ON "CompanyUnified"("workspaceId", "name");
CREATE INDEX "idx_company_unified_assigned_user" ON "CompanyUnified"("workspaceId", "assignedUserId");

-- Add unique constraints
CREATE UNIQUE INDEX "uk_person_unified_email_workspace" 
  ON "PersonUnified" ("email", "workspaceId") 
  WHERE "email" IS NOT NULL;

ALTER TABLE "CompanyUnified" ADD CONSTRAINT "uk_company_unified_name_workspace" 
  UNIQUE ("name", "workspaceId");
