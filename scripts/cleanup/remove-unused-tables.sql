-- 🗑️ REMOVE UNUSED TABLES - SAFE CLEANUP SCRIPT
-- 
-- This script removes tables that are defined in the schema but have NO code references
-- Based on comprehensive analysis of the entire codebase
--
-- ⚠️  CRITICAL: This script will permanently delete tables and their data
-- ⚠️  Make sure to backup your database before running this script
-- ⚠️  Test in staging environment first

-- Start transaction for safety
BEGIN;

-- Log the cleanup operation
INSERT INTO "AuditLog" ("workspaceId", "action", "resource", "resourceType", "details", "category", "severity")
VALUES ('system', 'database_cleanup', 'unused_tables', 'schema', '{"operation": "remove_unused_tables", "timestamp": "2025-01-15T00:00:00Z"}', 'system', 'info');

-- ========================================
-- PHASE 1: REMOVE UNUSED CORE TABLES
-- ========================================

-- Remove unused app management tables
DROP TABLE IF EXISTS "BundleApp" CASCADE;
DROP TABLE IF EXISTS "Bundle" CASCADE;
DROP TABLE IF EXISTS "App" CASCADE;

-- Remove unused buyer group tables
DROP TABLE IF EXISTS "BuyerGroupToPerson" CASCADE;
DROP TABLE IF EXISTS "BuyerGroup" CASCADE;
DROP TABLE IF EXISTS "BuyerCompanyProfile" CASCADE;

-- Remove unused change tracking
DROP TABLE IF EXISTS "ChangeLog" CASCADE;

-- Remove unused chat system
DROP TABLE IF EXISTS "MessageReaction" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "ChatMember" CASCADE;
DROP TABLE IF EXISTS "Chat" CASCADE;

-- Remove unused company management (legacy)
DROP TABLE IF EXISTS "Company" CASCADE;

-- Remove unused provider management
DROP TABLE IF EXISTS "ProviderToken" CASCADE;
DROP TABLE IF EXISTS "ConnectedProvider" CASCADE;

-- Remove unused credit system
DROP TABLE IF EXISTS "UserCreditBalance" CASCADE;
DROP TABLE IF EXISTS "CreditTransaction" CASCADE;

-- ========================================
-- PHASE 2: REMOVE UNUSED DATA GOVERNANCE
-- ========================================

-- Remove unused data region management
DROP TABLE IF EXISTS "WorkspaceRegion" CASCADE;
DROP TABLE IF EXISTS "DataTransferLog" CASCADE;
DROP TABLE IF EXISTS "DataRegion" CASCADE;

-- Remove unused decision maker tracking
DROP TABLE IF EXISTS "DecisionMaker" CASCADE;

-- Remove unused document sharing
DROP TABLE IF EXISTS "DocumentShare" CASCADE;

-- Remove unused email system (legacy)
DROP TABLE IF EXISTS "Email" CASCADE;

-- ========================================
-- PHASE 3: REMOVE UNUSED ENRICHMENT SYSTEM
-- ========================================

-- Remove unused enrichment tracking
DROP TABLE IF EXISTS "EnrichmentStep" CASCADE;
DROP TABLE IF EXISTS "EnrichmentExecution" CASCADE;
DROP TABLE IF EXISTS "EnrichmentCache" CASCADE;
DROP TABLE IF EXISTS "EnrichmentAnalytics" CASCADE;

-- ========================================
-- PHASE 4: REMOVE UNUSED CALENDAR SYSTEM
-- ========================================

-- Remove unused calendar integration
DROP TABLE IF EXISTS "Meeting" CASCADE;
DROP TABLE IF EXISTS "Event" CASCADE;

-- ========================================
-- PHASE 5: REMOVE UNUSED DOCUMENT SYSTEM
-- ========================================

-- Remove unused document management
DROP TABLE IF EXISTS "Pitch" CASCADE;
DROP TABLE IF EXISTS "Paper" CASCADE;
DROP TABLE IF EXISTS "Grid" CASCADE;

-- ========================================
-- PHASE 6: REMOVE UNUSED INTELLIGENCE SYSTEM
-- ========================================

-- Remove unused intelligence reporting
DROP TABLE IF EXISTS "IntelligenceReport" CASCADE;

-- ========================================
-- PHASE 7: REMOVE UNUSED APP MANAGEMENT
-- ========================================

-- Remove unused app membership
DROP TABLE IF EXISTS "UserApp" CASCADE;
DROP TABLE IF EXISTS "WorkspaceApp" CASCADE;
DROP TABLE IF EXISTS "MembershipApp" CASCADE;

-- ========================================
-- PHASE 8: REMOVE UNUSED OPPORTUNITY SYSTEM
-- ========================================

-- Remove unused opportunity tracking
DROP TABLE IF EXISTS "OpportunityStakeholder" CASCADE;
DROP TABLE IF EXISTS "OpportunityActivity" CASCADE;

-- ========================================
-- PHASE 9: REMOVE UNUSED EMAIL SETTINGS
-- ========================================

-- Remove unused email outbox
DROP TABLE IF EXISTS "OutboxSettings" CASCADE;

-- ========================================
-- PHASE 10: REMOVE UNUSED PARTNERSHIP SYSTEM
-- ========================================

-- Remove unused partnership management
DROP TABLE IF EXISTS "PartnershipLead" CASCADE;
DROP TABLE IF EXISTS "Partnership" CASCADE;

-- ========================================
-- PHASE 11: REMOVE UNUSED PERSON SYSTEM
-- ========================================

-- Remove unused person management (legacy)
DROP TABLE IF EXISTS "Person" CASCADE;

-- ========================================
-- PHASE 12: REMOVE UNUSED PIPELINE SYSTEM
-- ========================================

-- Remove unused pipeline execution
DROP TABLE IF EXISTS "PipelineStep" CASCADE;
DROP TABLE IF EXISTS "PipelineResult" CASCADE;
DROP TABLE IF EXISTS "PipelineExecution" CASCADE;

-- ========================================
-- PHASE 13: REMOVE UNUSED ROLE SYSTEM (CREATED BUT NOT USED)
-- ========================================

-- Remove unused role system (created in migration but never used)
DROP TABLE IF EXISTS "UserRoleHistory" CASCADE;
DROP TABLE IF EXISTS "RolePermission" CASCADE;
DROP TABLE IF EXISTS "UserProfile" CASCADE;
DROP TABLE IF EXISTS "Role" CASCADE;

-- ========================================
-- PHASE 14: REMOVE UNUSED ENTERPRISE FEATURES
-- ========================================

-- Remove unused SCIM integration
DROP TABLE IF EXISTS "SCIMSyncOperation" CASCADE;
DROP TABLE IF EXISTS "SCIMConnection" CASCADE;

-- Remove unused SSO provider
DROP TABLE IF EXISTS "SSOProvider" CASCADE;

-- ========================================
-- PHASE 15: REMOVE UNUSED SECURITY SYSTEM
-- ========================================

-- Remove unused security monitoring
DROP TABLE IF EXISTS "SecurityMetrics" CASCADE;
DROP TABLE IF EXISTS "SecurityEvent" CASCADE;

-- ========================================
-- PHASE 16: REMOVE UNUSED SELLER SYSTEM
-- ========================================

-- Remove unused seller management
DROP TABLE IF EXISTS "SellerProfile" CASCADE;
DROP TABLE IF EXISTS "SellerProductPortfolio" CASCADE;

-- ========================================
-- PHASE 17: REMOVE UNUSED CHAT SYSTEM
-- ========================================

-- Remove unused chat read state
DROP TABLE IF EXISTS "UserChatReadState" CASCADE;

-- ========================================
-- PHASE 18: REMOVE UNUSED VECTOR SYSTEM
-- ========================================

-- Remove unused vector embeddings
DROP TABLE IF EXISTS "VectorEmbedding" CASCADE;

-- ========================================
-- PHASE 19: REMOVE UNUSED WORKSPACE MEMBERSHIP
-- ========================================

-- Remove unused workspace membership (replaced by workspace_users)
DROP TABLE IF EXISTS "WorkspaceMembership" CASCADE;

-- ========================================
-- PHASE 20: REMOVE UNUSED RELATIONSHIP TABLES
-- ========================================

-- Remove unused relationship tables
DROP TABLE IF EXISTS "ProspectOpportunities" CASCADE;
DROP TABLE IF EXISTS "EmailToProspect" CASCADE;
DROP TABLE IF EXISTS "EmailToPipelineExecution" CASCADE;
DROP TABLE IF EXISTS "EmailToOpportunity" CASCADE;
DROP TABLE IF EXISTS "EmailToLead" CASCADE;
DROP TABLE IF EXISTS "EmailToContact" CASCADE;
DROP TABLE IF EXISTS "EmailToAccount" CASCADE;
DROP TABLE IF EXISTS "ContactToOpportunity" CASCADE;

-- ========================================
-- CLEANUP COMPLETE
-- ========================================

-- Log completion
INSERT INTO "AuditLog" ("workspaceId", "action", "resource", "resourceType", "details", "category", "severity")
VALUES ('system', 'database_cleanup_complete', 'unused_tables', 'schema', '{"operation": "remove_unused_tables_complete", "timestamp": "2025-01-15T00:00:00Z", "tables_removed": 65}', 'system', 'info');

-- Commit the transaction
COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Uncomment these to verify the cleanup worked:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT COUNT(*) as remaining_tables FROM information_schema.tables WHERE table_schema = 'public';

-- ========================================
-- SUMMARY
-- ========================================

/*
REMOVED TABLES (65 total):

Core System (3):
- App, Bundle, BundleApp

Buyer Groups (3):
- BuyerCompanyProfile, BuyerGroup, BuyerGroupToPerson

Change Tracking (1):
- ChangeLog

Chat System (4):
- Chat, ChatMember, Message, MessageReaction

Company Management (1):
- Company

Provider Management (2):
- ConnectedProvider, ProviderToken

Credit System (2):
- CreditTransaction, UserCreditBalance

Data Governance (3):
- DataRegion, DataTransferLog, WorkspaceRegion

Decision Making (1):
- DecisionMaker

Document Sharing (1):
- DocumentShare

Email System (1):
- Email (legacy)

Enrichment System (4):
- EnrichmentAnalytics, EnrichmentCache, EnrichmentExecution, EnrichmentStep

Calendar System (2):
- Event, Meeting

Document System (3):
- Grid, Paper, Pitch

Intelligence (1):
- IntelligenceReport

App Management (3):
- MembershipApp, UserApp, WorkspaceApp

Opportunity System (2):
- OpportunityActivity, OpportunityStakeholder

Email Settings (1):
- OutboxSettings

Partnership System (2):
- Partnership, PartnershipLead

Person System (1):
- Person

Pipeline System (3):
- PipelineExecution, PipelineResult, PipelineStep

Role System (4):
- Role, RolePermission, UserProfile, UserRoleHistory

Enterprise Features (3):
- SCIMConnection, SCIMSyncOperation, SSOProvider

Security System (2):
- SecurityEvent, SecurityMetrics

Seller System (2):
- SellerProductPortfolio, SellerProfile

Chat System (1):
- UserChatReadState

Vector System (1):
- VectorEmbedding

Workspace System (1):
- WorkspaceMembership

Relationship Tables (8):
- ContactToOpportunity, EmailToAccount, EmailToContact, EmailToLead, EmailToOpportunity, EmailToPipelineExecution, EmailToProspect, ProspectOpportunities

TOTAL: 65 unused tables removed
REMAINING: ~30 actively used tables
*/
