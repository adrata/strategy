-- Neon.tech Performance Optimization Indexes
-- Created: 2025-01-17
-- Purpose: Add critical indexes for lightning-fast query performance

-- High-impact indexes for frequent queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_workspace_status" ON "Company" ("workspaceId", "status") WHERE "status" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_workspace_updated" ON "Company" ("workspaceId", "updatedAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_people_company_workspace" ON "Person" ("companyId", "workspaceId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_people_workspace_updated" ON "Person" ("workspaceId", "updatedAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pipeline_executions_workspace_status" ON "PipelineExecution" ("workspaceId", "status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pipeline_executions_company" ON "PipelineExecution" ("companyId", "workspaceId");

-- Vector embedding performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_vector_embeddings_entity_workspace" ON "VectorEmbedding" ("entityType", "workspaceId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_vector_embeddings_entity_id" ON "VectorEmbedding" ("entityId", "entityType");

-- Email and communication indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_emails_workspace_received" ON "Email" ("workspaceId", "receivedAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_emails_provider_thread" ON "Email" ("providerId", "threadId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_meetings_workspace_start" ON "Meeting" ("workspaceId", "startTime" DESC);

-- User and workspace performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_workspace_role" ON "User" ("workspaceId", "role");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_workspace_users_user_workspace" ON "WorkspaceUser" ("userId", "workspaceId");

-- Full-text search optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_name_search" ON "Company" USING gin(to_tsvector('english', "name")) WHERE "name" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_people_name_search" ON "Person" USING gin(to_tsvector('english', COALESCE("firstName", '') || ' ' || COALESCE("lastName", ''))) WHERE "firstName" IS NOT NULL OR "lastName" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_description_search" ON "Company" USING gin(to_tsvector('english', "description")) WHERE "description" IS NOT NULL;

-- Strategic memory and KPI indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_strategic_memories_workspace_type" ON "StrategicMemory" ("workspaceId", "memoryType", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_kpi_metrics_workspace_date" ON "KPIMetric" ("workspaceId", "date" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_kpi_metrics_type_workspace" ON "KPIMetric" ("metricType", "workspaceId", "date" DESC);

-- Lead and opportunity indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_leads_workspace_status" ON "Lead" ("workspaceId", "status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_opportunities_workspace_stage" ON "Opportunity" ("workspaceId", "stage", "updatedAt" DESC);

-- Activity and engagement indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_activities_workspace_date" ON "Activity" ("workspaceId", "date" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_activities_person_company" ON "Activity" ("personId", "companyId");

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_workspace_status_updated" ON "Company" ("workspaceId", "status", "updatedAt" DESC) WHERE "status" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_people_company_title_workspace" ON "Person" ("companyId", "title", "workspaceId") WHERE "title" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pipeline_executions_status_company_workspace" ON "PipelineExecution" ("status", "companyId", "workspaceId", "createdAt" DESC);

-- Performance monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_provider_tokens_workspace_provider" ON "ProviderToken" ("workspaceId", "provider");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_connected_providers_workspace_provider" ON "ConnectedProvider" ("workspaceId", "provider");

-- Comment: These indexes are created with CONCURRENTLY to avoid blocking operations
-- They will significantly improve query performance for:
-- 1. Workspace-scoped queries (most common pattern)
-- 2. Status-based filtering
-- 3. Time-based sorting and filtering
-- 4. Full-text search operations
-- 5. Complex joins between companies, people, and pipeline executions
