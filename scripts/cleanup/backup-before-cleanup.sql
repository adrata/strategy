-- 🛡️ BACKUP SCRIPT - BEFORE UNUSED TABLE CLEANUP
-- 
-- This script creates a backup of all unused tables before removal
-- Run this BEFORE executing remove-unused-tables.sql
--
-- ⚠️  This will create backup tables with '_backup' suffix
-- ⚠️  Make sure you have enough disk space

-- Start transaction
BEGIN;

-- ========================================
-- BACKUP UNUSED TABLES
-- ========================================

-- Core System
CREATE TABLE IF NOT EXISTS "App_backup" AS SELECT * FROM "App";
CREATE TABLE IF NOT EXISTS "Bundle_backup" AS SELECT * FROM "Bundle";
CREATE TABLE IF NOT EXISTS "BundleApp_backup" AS SELECT * FROM "BundleApp";

-- Buyer Groups
CREATE TABLE IF NOT EXISTS "BuyerCompanyProfile_backup" AS SELECT * FROM "BuyerCompanyProfile";
CREATE TABLE IF NOT EXISTS "BuyerGroup_backup" AS SELECT * FROM "BuyerGroup";
CREATE TABLE IF NOT EXISTS "BuyerGroupToPerson_backup" AS SELECT * FROM "BuyerGroupToPerson";

-- Change Tracking
CREATE TABLE IF NOT EXISTS "ChangeLog_backup" AS SELECT * FROM "ChangeLog";

-- Chat System
CREATE TABLE IF NOT EXISTS "Chat_backup" AS SELECT * FROM "Chat";
CREATE TABLE IF NOT EXISTS "ChatMember_backup" AS SELECT * FROM "ChatMember";
CREATE TABLE IF NOT EXISTS "Message_backup" AS SELECT * FROM "Message";
CREATE TABLE IF NOT EXISTS "MessageReaction_backup" AS SELECT * FROM "MessageReaction";

-- Company Management
CREATE TABLE IF NOT EXISTS "Company_backup" AS SELECT * FROM "Company";

-- Provider Management
CREATE TABLE IF NOT EXISTS "ConnectedProvider_backup" AS SELECT * FROM "ConnectedProvider";
CREATE TABLE IF NOT EXISTS "ProviderToken_backup" AS SELECT * FROM "ProviderToken";

-- Credit System
CREATE TABLE IF NOT EXISTS "CreditTransaction_backup" AS SELECT * FROM "CreditTransaction";
CREATE TABLE IF NOT EXISTS "UserCreditBalance_backup" AS SELECT * FROM "UserCreditBalance";

-- Data Governance
CREATE TABLE IF NOT EXISTS "DataRegion_backup" AS SELECT * FROM "DataRegion";
CREATE TABLE IF NOT EXISTS "DataTransferLog_backup" AS SELECT * FROM "DataTransferLog";
CREATE TABLE IF NOT EXISTS "WorkspaceRegion_backup" AS SELECT * FROM "WorkspaceRegion";

-- Decision Making
CREATE TABLE IF NOT EXISTS "DecisionMaker_backup" AS SELECT * FROM "DecisionMaker";

-- Document Sharing
CREATE TABLE IF NOT EXISTS "DocumentShare_backup" AS SELECT * FROM "DocumentShare";

-- Email System
CREATE TABLE IF NOT EXISTS "Email_backup" AS SELECT * FROM "Email";

-- Enrichment System
CREATE TABLE IF NOT EXISTS "EnrichmentAnalytics_backup" AS SELECT * FROM "EnrichmentAnalytics";
CREATE TABLE IF NOT EXISTS "EnrichmentCache_backup" AS SELECT * FROM "EnrichmentCache";
CREATE TABLE IF NOT EXISTS "EnrichmentExecution_backup" AS SELECT * FROM "EnrichmentExecution";
CREATE TABLE IF NOT EXISTS "EnrichmentStep_backup" AS SELECT * FROM "EnrichmentStep";

-- Calendar System
CREATE TABLE IF NOT EXISTS "Event_backup" AS SELECT * FROM "Event";
CREATE TABLE IF NOT EXISTS "Meeting_backup" AS SELECT * FROM "Meeting";

-- Document System
CREATE TABLE IF NOT EXISTS "Grid_backup" AS SELECT * FROM "Grid";
CREATE TABLE IF NOT EXISTS "Paper_backup" AS SELECT * FROM "Paper";
CREATE TABLE IF NOT EXISTS "Pitch_backup" AS SELECT * FROM "Pitch";

-- Intelligence
CREATE TABLE IF NOT EXISTS "IntelligenceReport_backup" AS SELECT * FROM "IntelligenceReport";

-- App Management
CREATE TABLE IF NOT EXISTS "MembershipApp_backup" AS SELECT * FROM "MembershipApp";
CREATE TABLE IF NOT EXISTS "UserApp_backup" AS SELECT * FROM "UserApp";
CREATE TABLE IF NOT EXISTS "WorkspaceApp_backup" AS SELECT * FROM "WorkspaceApp";

-- Opportunity System
CREATE TABLE IF NOT EXISTS "OpportunityActivity_backup" AS SELECT * FROM "OpportunityActivity";
CREATE TABLE IF NOT EXISTS "OpportunityStakeholder_backup" AS SELECT * FROM "OpportunityStakeholder";

-- Email Settings
CREATE TABLE IF NOT EXISTS "OutboxSettings_backup" AS SELECT * FROM "OutboxSettings";

-- Partnership System
CREATE TABLE IF NOT EXISTS "Partnership_backup" AS SELECT * FROM "Partnership";
CREATE TABLE IF NOT EXISTS "PartnershipLead_backup" AS SELECT * FROM "PartnershipLead";

-- Person System
CREATE TABLE IF NOT EXISTS "Person_backup" AS SELECT * FROM "Person";

-- Pipeline System
CREATE TABLE IF NOT EXISTS "PipelineExecution_backup" AS SELECT * FROM "PipelineExecution";
CREATE TABLE IF NOT EXISTS "PipelineResult_backup" AS SELECT * FROM "PipelineResult";
CREATE TABLE IF NOT EXISTS "PipelineStep_backup" AS SELECT * FROM "PipelineStep";

-- Role System
CREATE TABLE IF NOT EXISTS "Role_backup" AS SELECT * FROM "Role";
CREATE TABLE IF NOT EXISTS "RolePermission_backup" AS SELECT * FROM "RolePermission";
CREATE TABLE IF NOT EXISTS "UserProfile_backup" AS SELECT * FROM "UserProfile";
CREATE TABLE IF NOT EXISTS "UserRoleHistory_backup" AS SELECT * FROM "UserRoleHistory";

-- Enterprise Features
CREATE TABLE IF NOT EXISTS "SCIMConnection_backup" AS SELECT * FROM "SCIMConnection";
CREATE TABLE IF NOT EXISTS "SCIMSyncOperation_backup" AS SELECT * FROM "SCIMSyncOperation";
CREATE TABLE IF NOT EXISTS "SSOProvider_backup" AS SELECT * FROM "SSOProvider";

-- Security System
CREATE TABLE IF NOT EXISTS "SecurityEvent_backup" AS SELECT * FROM "SecurityEvent";
CREATE TABLE IF NOT EXISTS "SecurityMetrics_backup" AS SELECT * FROM "SecurityMetrics";

-- Seller System
CREATE TABLE IF NOT EXISTS "SellerProductPortfolio_backup" AS SELECT * FROM "SellerProductPortfolio";
CREATE TABLE IF NOT EXISTS "SellerProfile_backup" AS SELECT * FROM "SellerProfile";

-- Chat System
CREATE TABLE IF NOT EXISTS "UserChatReadState_backup" AS SELECT * FROM "UserChatReadState";

-- Vector System
CREATE TABLE IF NOT EXISTS "VectorEmbedding_backup" AS SELECT * FROM "VectorEmbedding";

-- Workspace System
CREATE TABLE IF NOT EXISTS "WorkspaceMembership_backup" AS SELECT * FROM "WorkspaceMembership";

-- Relationship Tables
CREATE TABLE IF NOT EXISTS "ContactToOpportunity_backup" AS SELECT * FROM "ContactToOpportunity";
CREATE TABLE IF NOT EXISTS "EmailToAccount_backup" AS SELECT * FROM "EmailToAccount";
CREATE TABLE IF NOT EXISTS "EmailToContact_backup" AS SELECT * FROM "EmailToContact";
CREATE TABLE IF NOT EXISTS "EmailToLead_backup" AS SELECT * FROM "EmailToLead";
CREATE TABLE IF NOT EXISTS "EmailToOpportunity_backup" AS SELECT * FROM "EmailToOpportunity";
CREATE TABLE IF NOT EXISTS "EmailToPipelineExecution_backup" AS SELECT * FROM "EmailToPipelineExecution";
CREATE TABLE IF NOT EXISTS "EmailToProspect_backup" AS SELECT * FROM "EmailToProspect";
CREATE TABLE IF NOT EXISTS "ProspectOpportunities_backup" AS SELECT * FROM "ProspectOpportunities";

-- Log backup completion
INSERT INTO "AuditLog" ("workspaceId", "action", "resource", "resourceType", "details", "category", "severity")
VALUES ('system', 'database_backup', 'unused_tables', 'schema', '{"operation": "backup_unused_tables", "timestamp": "2025-01-15T00:00:00Z", "tables_backed_up": 65}', 'system', 'info');

-- Commit the transaction
COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show backup tables created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE '%_backup'
ORDER BY table_name;

-- Show total backup tables
SELECT COUNT(*) as backup_tables_created 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%_backup';
