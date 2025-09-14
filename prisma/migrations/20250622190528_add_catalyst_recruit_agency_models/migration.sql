-- CreateTable
CREATE TABLE "ProviderToken" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "workspaceId" TEXT NOT NULL,
    "connectedProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedProvider" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT[],
    "cc" TEXT[],
    "bcc" TEXT[],
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "providerId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "participants" TEXT[],
    "emailId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "emailId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "size" TEXT,
    "website" TEXT,
    "description" TEXT,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerCompanyProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "size" TEXT,
    "website" TEXT,
    "description" TEXT,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerCompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "role" TEXT,
    "sellerProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bio" TEXT,
    "createdBy" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'manual',
    "department" TEXT,
    "doNotCall" BOOLEAN NOT NULL DEFAULT false,
    "emailOptOut" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gdprConsent" BOOLEAN NOT NULL DEFAULT false,
    "githubUsername" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastEnriched" TIMESTAMP(3),
    "lastName" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "location" TEXT,
    "mobile" TEXT,
    "personalEmail" TEXT,
    "personalWebsite" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "previousCompanies" TEXT[],
    "seniority" TEXT,
    "timezone" TEXT,
    "twitterHandle" TEXT,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionMaker" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionMaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineExecution" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "sellerProfileId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStep" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "executionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceReport" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "executionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "preferredLanguage" VARCHAR(10) NOT NULL DEFAULT 'en',
    "countryCode" VARCHAR(2),
    "timezone" VARCHAR(50),
    "locale" VARCHAR(10),
    "textDirection" VARCHAR(3) NOT NULL DEFAULT 'ltr',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" VARCHAR(20),
    "bio" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "defaultLanguage" VARCHAR(10) NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "description" TEXT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "dateFormat" VARCHAR(20) NOT NULL DEFAULT 'MM/dd/yyyy',
    "numberFormat" VARCHAR(20) NOT NULL DEFAULT '1,234.56',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "bundleId" TEXT,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3),
    "roleId" TEXT,

    CONSTRAINT "WorkspaceMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceApp" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleApp" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,

    CONSTRAINT "BundleApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paper" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "appId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "companyId" TEXT,
    "workspaceId" TEXT,
    "sharable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grid" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "appId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "companyId" TEXT,
    "workspaceId" TEXT,
    "sharable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pitch" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "appId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "companyId" TEXT,
    "workspaceId" TEXT,
    "sharable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentShare" (
    "id" TEXT NOT NULL,
    "paperId" TEXT,
    "gridId" TEXT,
    "pitchId" TEXT,
    "userId" TEXT,
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipApp" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMember" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityId" TEXT,
    "ssoUrl" TEXT,
    "certificate" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "issuer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoProvision" BOOLEAN NOT NULL DEFAULT true,
    "defaultRole" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SSOProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "workspaceId" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceType" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "platform" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCIMConnection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "bearerToken" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER NOT NULL DEFAULT 3600,
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "enableCreate" BOOLEAN NOT NULL DEFAULT true,
    "enableUpdate" BOOLEAN NOT NULL DEFAULT true,
    "enableDelete" BOOLEAN NOT NULL DEFAULT false,
    "enableGroups" BOOLEAN NOT NULL DEFAULT true,
    "userMapping" JSONB NOT NULL,
    "groupMapping" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SCIMConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCIMSyncOperation" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "usersProcessed" INTEGER NOT NULL DEFAULT 0,
    "usersCreated" INTEGER NOT NULL DEFAULT 0,
    "usersUpdated" INTEGER NOT NULL DEFAULT 0,
    "usersDeactivated" INTEGER NOT NULL DEFAULT 0,
    "groupsProcessed" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "summary" JSONB,

    CONSTRAINT "SCIMSyncOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "sourceIp" TEXT,
    "userAgent" TEXT,
    "platform" TEXT,
    "location" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "relatedEvents" TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityMetrics" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalLogins" INTEGER NOT NULL DEFAULT 0,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "ssoLogins" INTEGER NOT NULL DEFAULT 0,
    "passwordLogins" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "deactivatedUsers" INTEGER NOT NULL DEFAULT 0,
    "roleChanges" INTEGER NOT NULL DEFAULT 0,
    "permissionGrants" INTEGER NOT NULL DEFAULT 0,
    "permissionRevokes" INTEGER NOT NULL DEFAULT 0,
    "securityEvents" INTEGER NOT NULL DEFAULT 0,
    "highRiskEvents" INTEGER NOT NULL DEFAULT 0,
    "resolvedEvents" INTEGER NOT NULL DEFAULT 0,
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRegion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "regulations" TEXT[],
    "dataClassifications" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "backupRegions" TEXT[],
    "defaultRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "maxRetentionDays" INTEGER NOT NULL DEFAULT 2555,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceRegion" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,
    "dataTypes" TEXT[],
    "accessRules" JSONB NOT NULL,
    "auditRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "complianceFrameworks" TEXT[],
    "allowDataExport" BOOLEAN NOT NULL DEFAULT false,
    "exportApprovers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataTransferLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "transferType" TEXT NOT NULL,
    "sourceRegion" TEXT NOT NULL,
    "targetRegion" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "recordCount" INTEGER,
    "dataSize" INTEGER,
    "checksum" TEXT,
    "legalBasis" TEXT,
    "retentionPeriod" INTEGER,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataTransferLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "weeklyTarget" INTEGER NOT NULL DEFAULT 15,
    "strategy" TEXT NOT NULL DEFAULT 'optimal',
    "role" TEXT NOT NULL DEFAULT 'AE',
    "quota" INTEGER,
    "pipelineHealth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "assignedUserId" VARCHAR(30),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "workPhone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "preferredLanguage" VARCHAR(10),
    "timezone" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "accountId" VARCHAR(30),
    "assignedUserId" VARCHAR(30),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT,
    "salutation" TEXT,
    "suffix" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "seniority" VARCHAR(20),
    "email" TEXT,
    "secondaryEmail" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "workPhone" TEXT,
    "linkedinUrl" TEXT,
    "twitterHandle" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" VARCHAR(20),
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(20),
    "notes" TEXT,
    "bio" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "preferredLanguage" VARCHAR(10),
    "timezone" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "leadId" VARCHAR(30),
    "accountId" VARCHAR(30),
    "assignedUserId" VARCHAR(30),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "probability" DOUBLE PRECISION DEFAULT 0.5,
    "stage" VARCHAR(30) NOT NULL DEFAULT 'prospect',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source" TEXT,
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "notes" TEXT,
    "nextSteps" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityStakeholder" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "contactId" TEXT,
    "personId" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT NOT NULL,
    "influence" TEXT NOT NULL DEFAULT 'Medium',
    "engagementLevel" TEXT NOT NULL DEFAULT 'Initial',
    "lastContactDate" TIMESTAMP(3),
    "contactFrequency" TEXT NOT NULL DEFAULT 'Monthly',
    "preferredChannel" TEXT,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "buyingProcessRole" TEXT,
    "concerns" TEXT,
    "interests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityStakeholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityActivity" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "description" TEXT,
    "outcome" TEXT,
    "duration" INTEGER,
    "attendeeCount" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "nextSteps" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "participantIds" TEXT[],
    "hostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProductPortfolio" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "description" TEXT,
    "targetIndustries" TEXT[],
    "targetCompanySize" TEXT[],
    "primaryUseCases" TEXT[],
    "startingPrice" DECIMAL(10,2),
    "averageDealSize" DECIMAL(10,2),
    "maxDealSize" DECIMAL(10,2),
    "typicalSalesCycle" INTEGER,
    "keyValueProps" TEXT[],
    "commonObjections" TEXT[],
    "competitorLandscape" TEXT[],
    "idealCustomerProfile" TEXT,
    "buyingCommitteeRoles" TEXT[],
    "successMetrics" TEXT[],
    "winRateByIndustry" JSONB,
    "winRateByCompanySize" JSONB,
    "seasonalPatterns" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProductPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "assignedUserId" VARCHAR(30),
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "tradingName" TEXT,
    "localName" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" VARCHAR(20),
    "industry" TEXT,
    "sector" TEXT,
    "size" VARCHAR(20),
    "revenue" DOUBLE PRECISION,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "vatNumber" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "preferredLanguage" VARCHAR(10),
    "timezone" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentExecution" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggerData" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "completedCompanies" INTEGER NOT NULL DEFAULT 0,
    "totalCompanies" INTEGER NOT NULL DEFAULT 0,
    "estimatedTimeRemaining" INTEGER,
    "companiesEnriched" TEXT[],
    "peopleEnriched" TEXT[],
    "buyerGroupsCreated" TEXT[],
    "intelligence" JSONB,
    "errors" JSONB[],
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "triggerUserId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "costOptimized" BOOLEAN NOT NULL DEFAULT true,
    "cacheHitRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stepDurations" JSONB,
    "totalDuration" INTEGER,
    "dataVolume" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentStep" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "companyId" TEXT,
    "companyName" TEXT,
    "message" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeElapsed" INTEGER NOT NULL DEFAULT 0,
    "estimatedTimeRemaining" INTEGER,
    "error" TEXT,
    "errorDetails" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentAnalytics" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "avgStepDuration" DOUBLE PRECISION NOT NULL,
    "cacheHitRate" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "companiesProcessed" INTEGER NOT NULL DEFAULT 0,
    "peopleProcessed" INTEGER NOT NULL DEFAULT 0,
    "buyerGroupsCreated" INTEGER NOT NULL DEFAULT 0,
    "intelligenceGenerated" INTEGER NOT NULL DEFAULT 0,
    "apiCallsMade" INTEGER NOT NULL DEFAULT 0,
    "dataTransferred" INTEGER NOT NULL DEFAULT 0,
    "costOptimization" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dataAccuracy" DOUBLE PRECISION,
    "validationErrors" INTEGER NOT NULL DEFAULT 0,
    "dataCompleteness" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cacheType" TEXT NOT NULL,
    "cachedData" JSONB NOT NULL,
    "dataSize" INTEGER NOT NULL DEFAULT 0,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "completeness" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "sourceExecutionId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL,
    "contactName" TEXT,
    "contactTitle" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "relationshipStatus" TEXT NOT NULL DEFAULT 'Active',
    "relationshipStrength" TEXT NOT NULL DEFAULT 'Medium',
    "commissionStructure" TEXT,
    "notes" TEXT,
    "website" TEXT,
    "lastContactDate" TIMESTAMP(3),
    "nextContactDate" TIMESTAMP(3),
    "nextAction" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdBy" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipLead" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "referralDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referralValue" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'Referred',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_users" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "location" JSONB,
    "currentTitle" VARCHAR(255) NOT NULL,
    "currentCompany" VARCHAR(255) NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "expectedSalary" DECIMAL(10,2),
    "currentSalary" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "status" VARCHAR(50) NOT NULL DEFAULT 'sourced',
    "stage" VARCHAR(100),
    "appliedJobs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientCompanyId" VARCHAR(30),
    "recruiterAssigned" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "monacoIntelligence" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "level" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'full-time',
    "location" JSONB,
    "salaryMin" DECIMAL(10,2),
    "salaryMax" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" JSONB,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "urgency" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "clientCompanyId" VARCHAR(30),
    "clientCompanyName" VARCHAR(255),
    "recruiterAssigned" VARCHAR(30) NOT NULL,
    "hiringManager" VARCHAR(255),
    "workspaceId" VARCHAR(30) NOT NULL,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "interviewer" VARCHAR(255) NOT NULL,
    "feedback" TEXT,
    "rating" INTEGER,
    "recommendation" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    "duration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'applied',
    "source" VARCHAR(100),
    "coverLetter" TEXT,
    "resumeUrl" VARCHAR(500),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_touchpoints" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "outcome" VARCHAR(50),
    "nextAction" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_touchpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_workspaces" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "agencyOwnerId" VARCHAR(30) NOT NULL,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branding" JSONB,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "agencyWorkspaceId" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "monthlyFee" DECIMAL(10,2),
    "commissionRate" DECIMAL(5,2),
    "settings" JSONB,
    "branding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_users" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "agencyWorkspaceId" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'recruiter',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'hiring_manager',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "authorId" VARCHAR(30) NOT NULL,
    "leadId" VARCHAR(30),
    "opportunityId" VARCHAR(30),
    "accountId" VARCHAR(30),
    "contactId" VARCHAR(30),
    "title" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'general',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'normal',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "format" VARCHAR(20) NOT NULL DEFAULT 'text',
    "attachments" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "leadId" VARCHAR(30),
    "opportunityId" VARCHAR(30),
    "accountId" VARCHAR(30),
    "contactId" VARCHAR(30),
    "type" VARCHAR(30) NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "outcome" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'planned',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'normal',
    "attachments" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EmailToPipelineExecution" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EmailToPipelineExecution_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BuyerGroupToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BuyerGroupToPerson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContactToOpportunity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContactToOpportunity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderToken_workspaceId_provider_key" ON "ProviderToken"("workspaceId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedProvider_workspaceId_provider_email_key" ON "ConnectedProvider"("workspaceId", "provider", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Email_providerId_messageId_key" ON "Email"("providerId", "messageId");

-- CreateIndex
CREATE INDEX "Person_workspaceId_fullName_idx" ON "Person"("workspaceId", "fullName");

-- CreateIndex
CREATE INDEX "Person_workspaceId_email_idx" ON "Person"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "Person_dataSource_isVerified_idx" ON "Person"("dataSource", "isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_workspaceId_key" ON "Person"("email", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceReport_executionId_key" ON "IntelligenceReport"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_preferredLanguage_idx" ON "users"("preferredLanguage");

-- CreateIndex
CREATE INDEX "users_countryCode_idx" ON "users"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_slug_idx" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_defaultLanguage_idx" ON "workspaces"("defaultLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "App_slug_key" ON "App"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserApp_userId_appId_key" ON "UserApp"("userId", "appId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipApp_membershipId_appId_key" ON "MembershipApp"("membershipId", "appId");

-- CreateIndex
CREATE INDEX "Chat_type_idx" ON "Chat"("type");

-- CreateIndex
CREATE INDEX "Chat_workspaceId_idx" ON "Chat"("workspaceId");

-- CreateIndex
CREATE INDEX "ChatMember_userId_idx" ON "ChatMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_chatId_userId_key" ON "ChatMember"("chatId", "userId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_userId_idx" ON "MessageReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "SSOProvider_workspaceId_name_key" ON "SSOProvider"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_workspaceId_name_key" ON "Role"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_timestamp_idx" ON "AuditLog"("workspaceId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SCIMConnection_workspaceId_name_key" ON "SCIMConnection"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "SCIMSyncOperation_workspaceId_startedAt_idx" ON "SCIMSyncOperation"("workspaceId", "startedAt");

-- CreateIndex
CREATE INDEX "SCIMSyncOperation_connectionId_startedAt_idx" ON "SCIMSyncOperation"("connectionId", "startedAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_workspaceId_timestamp_idx" ON "SecurityEvent"("workspaceId", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_severity_idx" ON "SecurityEvent"("eventType", "severity");

-- CreateIndex
CREATE INDEX "SecurityEvent_isAnomaly_isResolved_idx" ON "SecurityEvent"("isAnomaly", "isResolved");

-- CreateIndex
CREATE INDEX "SecurityMetrics_workspaceId_periodStart_idx" ON "SecurityMetrics"("workspaceId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityMetrics_workspaceId_period_periodStart_key" ON "SecurityMetrics"("workspaceId", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "DataRegion_code_key" ON "DataRegion"("code");

-- CreateIndex
CREATE INDEX "DataRegion_country_idx" ON "DataRegion"("country");

-- CreateIndex
CREATE INDEX "DataRegion_isActive_idx" ON "DataRegion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceRegion_workspaceId_regionId_key" ON "WorkspaceRegion"("workspaceId", "regionId");

-- CreateIndex
CREATE INDEX "DataTransferLog_workspaceId_timestamp_idx" ON "DataTransferLog"("workspaceId", "timestamp");

-- CreateIndex
CREATE INDEX "DataTransferLog_sourceRegion_targetRegion_idx" ON "DataTransferLog"("sourceRegion", "targetRegion");

-- CreateIndex
CREATE INDEX "DataTransferLog_status_transferType_idx" ON "DataTransferLog"("status", "transferType");

-- CreateIndex
CREATE INDEX "OutboxSettings_userId_idx" ON "OutboxSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxSettings_userId_workspaceId_key" ON "OutboxSettings"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "leads_workspaceId_idx" ON "leads"("workspaceId");

-- CreateIndex
CREATE INDEX "leads_assignedUserId_idx" ON "leads"("assignedUserId");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_company_idx" ON "leads"("company");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_preferredLanguage_idx" ON "leads"("preferredLanguage");

-- CreateIndex
CREATE INDEX "leads_country_idx" ON "leads"("country");

-- CreateIndex
CREATE INDEX "contacts_workspaceId_idx" ON "contacts"("workspaceId");

-- CreateIndex
CREATE INDEX "contacts_accountId_idx" ON "contacts"("accountId");

-- CreateIndex
CREATE INDEX "contacts_assignedUserId_idx" ON "contacts"("assignedUserId");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_fullName_idx" ON "contacts"("fullName");

-- CreateIndex
CREATE INDEX "contacts_jobTitle_idx" ON "contacts"("jobTitle");

-- CreateIndex
CREATE INDEX "contacts_preferredLanguage_idx" ON "contacts"("preferredLanguage");

-- CreateIndex
CREATE INDEX "contacts_country_idx" ON "contacts"("country");

-- CreateIndex
CREATE INDEX "opportunities_workspaceId_idx" ON "opportunities"("workspaceId");

-- CreateIndex
CREATE INDEX "opportunities_leadId_idx" ON "opportunities"("leadId");

-- CreateIndex
CREATE INDEX "opportunities_accountId_idx" ON "opportunities"("accountId");

-- CreateIndex
CREATE INDEX "opportunities_assignedUserId_idx" ON "opportunities"("assignedUserId");

-- CreateIndex
CREATE INDEX "opportunities_stage_idx" ON "opportunities"("stage");

-- CreateIndex
CREATE INDEX "opportunities_currency_idx" ON "opportunities"("currency");

-- CreateIndex
CREATE INDEX "OpportunityStakeholder_opportunityId_role_idx" ON "OpportunityStakeholder"("opportunityId", "role");

-- CreateIndex
CREATE INDEX "OpportunityStakeholder_engagementLevel_influence_idx" ON "OpportunityStakeholder"("engagementLevel", "influence");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityStakeholder_opportunityId_contactId_key" ON "OpportunityStakeholder"("opportunityId", "contactId");

-- CreateIndex
CREATE INDEX "OpportunityActivity_opportunityId_type_idx" ON "OpportunityActivity"("opportunityId", "type");

-- CreateIndex
CREATE INDEX "OpportunityActivity_completedDate_idx" ON "OpportunityActivity"("completedDate");

-- CreateIndex
CREATE INDEX "OpportunityActivity_qualityScore_idx" ON "OpportunityActivity"("qualityScore");

-- CreateIndex
CREATE INDEX "SellerProductPortfolio_workspaceId_productCategory_idx" ON "SellerProductPortfolio"("workspaceId", "productCategory");

-- CreateIndex
CREATE INDEX "SellerProductPortfolio_sellerId_isActive_idx" ON "SellerProductPortfolio"("sellerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProductPortfolio_sellerId_productName_key" ON "SellerProductPortfolio"("sellerId", "productName");

-- CreateIndex
CREATE INDEX "accounts_workspaceId_idx" ON "accounts"("workspaceId");

-- CreateIndex
CREATE INDEX "accounts_assignedUserId_idx" ON "accounts"("assignedUserId");

-- CreateIndex
CREATE INDEX "accounts_name_idx" ON "accounts"("name");

-- CreateIndex
CREATE INDEX "accounts_industry_idx" ON "accounts"("industry");

-- CreateIndex
CREATE INDEX "accounts_country_idx" ON "accounts"("country");

-- CreateIndex
CREATE INDEX "accounts_preferredLanguage_idx" ON "accounts"("preferredLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentExecution_executionId_key" ON "EnrichmentExecution"("executionId");

-- CreateIndex
CREATE INDEX "EnrichmentExecution_workspaceId_status_idx" ON "EnrichmentExecution"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "EnrichmentExecution_type_status_idx" ON "EnrichmentExecution"("type", "status");

-- CreateIndex
CREATE INDEX "EnrichmentExecution_triggerUserId_idx" ON "EnrichmentExecution"("triggerUserId");

-- CreateIndex
CREATE INDEX "EnrichmentExecution_startTime_idx" ON "EnrichmentExecution"("startTime");

-- CreateIndex
CREATE INDEX "EnrichmentStep_executionId_stepId_idx" ON "EnrichmentStep"("executionId", "stepId");

-- CreateIndex
CREATE INDEX "EnrichmentStep_status_idx" ON "EnrichmentStep"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentAnalytics_executionId_key" ON "EnrichmentAnalytics"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentCache_cacheKey_key" ON "EnrichmentCache"("cacheKey");

-- CreateIndex
CREATE INDEX "EnrichmentCache_cacheType_workspaceId_idx" ON "EnrichmentCache"("cacheType", "workspaceId");

-- CreateIndex
CREATE INDEX "EnrichmentCache_expiresAt_idx" ON "EnrichmentCache"("expiresAt");

-- CreateIndex
CREATE INDEX "EnrichmentCache_lastAccessedAt_idx" ON "EnrichmentCache"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "Partnership_workspaceId_partnerType_idx" ON "Partnership"("workspaceId", "partnerType");

-- CreateIndex
CREATE INDEX "Partnership_workspaceId_relationshipStatus_idx" ON "Partnership"("workspaceId", "relationshipStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_name_workspaceId_key" ON "Partnership"("name", "workspaceId");

-- CreateIndex
CREATE INDEX "PartnershipLead_partnershipId_idx" ON "PartnershipLead"("partnershipId");

-- CreateIndex
CREATE INDEX "PartnershipLead_leadId_idx" ON "PartnershipLead"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipLead_partnershipId_leadId_key" ON "PartnershipLead"("partnershipId", "leadId");

-- CreateIndex
CREATE INDEX "workspace_users_workspaceId_idx" ON "workspace_users"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_users_userId_idx" ON "workspace_users"("userId");

-- CreateIndex
CREATE INDEX "workspace_users_role_idx" ON "workspace_users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_users_workspaceId_userId_key" ON "workspace_users"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "candidates_workspaceId_idx" ON "candidates"("workspaceId");

-- CreateIndex
CREATE INDEX "candidates_recruiterAssigned_idx" ON "candidates"("recruiterAssigned");

-- CreateIndex
CREATE INDEX "candidates_status_idx" ON "candidates"("status");

-- CreateIndex
CREATE INDEX "candidates_clientCompanyId_idx" ON "candidates"("clientCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_workspaceId_key" ON "candidates"("email", "workspaceId");

-- CreateIndex
CREATE INDEX "jobs_workspaceId_idx" ON "jobs"("workspaceId");

-- CreateIndex
CREATE INDEX "jobs_recruiterAssigned_idx" ON "jobs"("recruiterAssigned");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_clientCompanyId_idx" ON "jobs"("clientCompanyId");

-- CreateIndex
CREATE INDEX "interviews_candidateId_idx" ON "interviews"("candidateId");

-- CreateIndex
CREATE INDEX "interviews_jobId_idx" ON "interviews"("jobId");

-- CreateIndex
CREATE INDEX "interviews_scheduledDate_idx" ON "interviews"("scheduledDate");

-- CreateIndex
CREATE INDEX "interviews_status_idx" ON "interviews"("status");

-- CreateIndex
CREATE INDEX "job_applications_candidateId_idx" ON "job_applications"("candidateId");

-- CreateIndex
CREATE INDEX "job_applications_jobId_idx" ON "job_applications"("jobId");

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_candidateId_jobId_key" ON "job_applications"("candidateId", "jobId");

-- CreateIndex
CREATE INDEX "candidate_touchpoints_candidateId_idx" ON "candidate_touchpoints"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_touchpoints_type_idx" ON "candidate_touchpoints"("type");

-- CreateIndex
CREATE INDEX "candidate_touchpoints_date_idx" ON "candidate_touchpoints"("date");

-- CreateIndex
CREATE UNIQUE INDEX "agency_workspaces_slug_key" ON "agency_workspaces"("slug");

-- CreateIndex
CREATE INDEX "agency_workspaces_agencyOwnerId_idx" ON "agency_workspaces"("agencyOwnerId");

-- CreateIndex
CREATE INDEX "agency_workspaces_isActive_idx" ON "agency_workspaces"("isActive");

-- CreateIndex
CREATE INDEX "client_accounts_agencyWorkspaceId_idx" ON "client_accounts"("agencyWorkspaceId");

-- CreateIndex
CREATE INDEX "client_accounts_isActive_idx" ON "client_accounts"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_agencyWorkspaceId_workspaceId_key" ON "client_accounts"("agencyWorkspaceId", "workspaceId");

-- CreateIndex
CREATE INDEX "agency_users_agencyWorkspaceId_idx" ON "agency_users"("agencyWorkspaceId");

-- CreateIndex
CREATE INDEX "agency_users_role_idx" ON "agency_users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "agency_users_userId_agencyWorkspaceId_key" ON "agency_users"("userId", "agencyWorkspaceId");

-- CreateIndex
CREATE INDEX "client_users_clientAccountId_idx" ON "client_users"("clientAccountId");

-- CreateIndex
CREATE INDEX "client_users_role_idx" ON "client_users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_userId_clientAccountId_key" ON "client_users"("userId", "clientAccountId");

-- CreateIndex
CREATE INDEX "notes_workspaceId_idx" ON "notes"("workspaceId");

-- CreateIndex
CREATE INDEX "notes_authorId_idx" ON "notes"("authorId");

-- CreateIndex
CREATE INDEX "notes_leadId_idx" ON "notes"("leadId");

-- CreateIndex
CREATE INDEX "notes_opportunityId_idx" ON "notes"("opportunityId");

-- CreateIndex
CREATE INDEX "notes_accountId_idx" ON "notes"("accountId");

-- CreateIndex
CREATE INDEX "notes_contactId_idx" ON "notes"("contactId");

-- CreateIndex
CREATE INDEX "notes_type_idx" ON "notes"("type");

-- CreateIndex
CREATE INDEX "activities_workspaceId_idx" ON "activities"("workspaceId");

-- CreateIndex
CREATE INDEX "activities_userId_idx" ON "activities"("userId");

-- CreateIndex
CREATE INDEX "activities_leadId_idx" ON "activities"("leadId");

-- CreateIndex
CREATE INDEX "activities_opportunityId_idx" ON "activities"("opportunityId");

-- CreateIndex
CREATE INDEX "activities_accountId_idx" ON "activities"("accountId");

-- CreateIndex
CREATE INDEX "activities_contactId_idx" ON "activities"("contactId");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "activities_scheduledAt_idx" ON "activities"("scheduledAt");

-- CreateIndex
CREATE INDEX "_EmailToPipelineExecution_B_index" ON "_EmailToPipelineExecution"("B");

-- CreateIndex
CREATE INDEX "_BuyerGroupToPerson_B_index" ON "_BuyerGroupToPerson"("B");

-- CreateIndex
CREATE INDEX "_ContactToOpportunity_B_index" ON "_ContactToOpportunity"("B");

-- AddForeignKey
ALTER TABLE "ProviderToken" ADD CONSTRAINT "ProviderToken_connectedProviderId_fkey" FOREIGN KEY ("connectedProviderId") REFERENCES "ConnectedProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderToken" ADD CONSTRAINT "ProviderToken_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedProvider" ADD CONSTRAINT "ConnectedProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ConnectedProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerCompanyProfile" ADD CONSTRAINT "BuyerCompanyProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerCompanyProfile" ADD CONSTRAINT "BuyerCompanyProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerGroup" ADD CONSTRAINT "BuyerGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "BuyerCompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionMaker" ADD CONSTRAINT "DecisionMaker_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BuyerGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionMaker" ADD CONSTRAINT "DecisionMaker_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineExecution" ADD CONSTRAINT "PipelineExecution_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineExecution" ADD CONSTRAINT "PipelineExecution_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStep" ADD CONSTRAINT "PipelineStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "PipelineExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceReport" ADD CONSTRAINT "IntelligenceReport_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "PipelineExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceReport" ADD CONSTRAINT "IntelligenceReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceApp" ADD CONSTRAINT "WorkspaceApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceApp" ADD CONSTRAINT "WorkspaceApp_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleApp" ADD CONSTRAINT "BundleApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleApp" ADD CONSTRAINT "BundleApp_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paper" ADD CONSTRAINT "Paper_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grid" ADD CONSTRAINT "Grid_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grid" ADD CONSTRAINT "Grid_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grid" ADD CONSTRAINT "Grid_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grid" ADD CONSTRAINT "Grid_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_gridId_fkey" FOREIGN KEY ("gridId") REFERENCES "Grid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApp" ADD CONSTRAINT "UserApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApp" ADD CONSTRAINT "UserApp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApp" ADD CONSTRAINT "MembershipApp_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApp" ADD CONSTRAINT "MembershipApp_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "WorkspaceMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOProvider" ADD CONSTRAINT "SSOProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCIMConnection" ADD CONSTRAINT "SCIMConnection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCIMSyncOperation" ADD CONSTRAINT "SCIMSyncOperation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "SCIMConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCIMSyncOperation" ADD CONSTRAINT "SCIMSyncOperation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityMetrics" ADD CONSTRAINT "SecurityMetrics_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceRegion" ADD CONSTRAINT "WorkspaceRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "DataRegion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceRegion" ADD CONSTRAINT "WorkspaceRegion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataTransferLog" ADD CONSTRAINT "DataTransferLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataTransferLog" ADD CONSTRAINT "DataTransferLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxSettings" ADD CONSTRAINT "OutboxSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxSettings" ADD CONSTRAINT "OutboxSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStakeholder" ADD CONSTRAINT "OpportunityStakeholder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStakeholder" ADD CONSTRAINT "OpportunityStakeholder_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStakeholder" ADD CONSTRAINT "OpportunityStakeholder_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityActivity" ADD CONSTRAINT "OpportunityActivity_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityActivity" ADD CONSTRAINT "OpportunityActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProductPortfolio" ADD CONSTRAINT "SellerProductPortfolio_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProductPortfolio" ADD CONSTRAINT "SellerProductPortfolio_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentExecution" ADD CONSTRAINT "EnrichmentExecution_triggerUserId_fkey" FOREIGN KEY ("triggerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentExecution" ADD CONSTRAINT "EnrichmentExecution_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentStep" ADD CONSTRAINT "EnrichmentStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "EnrichmentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentAnalytics" ADD CONSTRAINT "EnrichmentAnalytics_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "EnrichmentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentCache" ADD CONSTRAINT "EnrichmentCache_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipLead" ADD CONSTRAINT "PartnershipLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipLead" ADD CONSTRAINT "PartnershipLead_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_users" ADD CONSTRAINT "workspace_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_recruiterAssigned_fkey" FOREIGN KEY ("recruiterAssigned") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_recruiterAssigned_fkey" FOREIGN KEY ("recruiterAssigned") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_touchpoints" ADD CONSTRAINT "candidate_touchpoints_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_workspaces" ADD CONSTRAINT "agency_workspaces_agencyOwnerId_fkey" FOREIGN KEY ("agencyOwnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_agencyWorkspaceId_fkey" FOREIGN KEY ("agencyWorkspaceId") REFERENCES "agency_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_users" ADD CONSTRAINT "agency_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_users" ADD CONSTRAINT "agency_users_agencyWorkspaceId_fkey" FOREIGN KEY ("agencyWorkspaceId") REFERENCES "agency_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmailToPipelineExecution" ADD CONSTRAINT "_EmailToPipelineExecution_A_fkey" FOREIGN KEY ("A") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmailToPipelineExecution" ADD CONSTRAINT "_EmailToPipelineExecution_B_fkey" FOREIGN KEY ("B") REFERENCES "PipelineExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BuyerGroupToPerson" ADD CONSTRAINT "_BuyerGroupToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "BuyerGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BuyerGroupToPerson" ADD CONSTRAINT "_BuyerGroupToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToOpportunity" ADD CONSTRAINT "_ContactToOpportunity_A_fkey" FOREIGN KEY ("A") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToOpportunity" ADD CONSTRAINT "_ContactToOpportunity_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
