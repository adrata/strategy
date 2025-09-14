-- =====================================================
-- AUDIT LOGGING SYSTEM - COMPREHENSIVE TRACKING
-- =====================================================
-- This script creates the audit logging tables for
-- comprehensive change tracking and analytics
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(30) PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(30) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'view'
    field_changes JSONB,
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_entity ON audit_logs(workspace_id, entity_type, entity_id);

-- Create audit_analytics table
CREATE TABLE IF NOT EXISTS audit_analytics (
    id VARCHAR(30) PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30),
    entity_type VARCHAR(50),
    action VARCHAR(20),
    date DATE NOT NULL,
    hour INTEGER NOT NULL,
    count INTEGER DEFAULT 1,
    avg_response_time FLOAT,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_analytics
CREATE INDEX IF NOT EXISTS idx_audit_analytics_workspace_id ON audit_analytics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_analytics_user_id ON audit_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_analytics_entity_type ON audit_analytics(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_analytics_action ON audit_analytics(action);
CREATE INDEX IF NOT EXISTS idx_audit_analytics_date ON audit_analytics(date);
CREATE INDEX IF NOT EXISTS idx_audit_analytics_workspace_date ON audit_analytics(workspace_id, date);

-- Create audit_retention_policy table
CREATE TABLE IF NOT EXISTS audit_retention_policy (
    id VARCHAR(30) PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    entity_type VARCHAR(50),
    retention_days INTEGER NOT NULL DEFAULT 90,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_retention_policy
CREATE INDEX IF NOT EXISTS idx_audit_retention_workspace_id ON audit_retention_policy(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_retention_entity_type ON audit_retention_policy(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_retention_is_active ON audit_retention_policy(is_active);

-- Create audit_summary view
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    workspace_id,
    entity_type,
    action,
    DATE(created_at) as date,
    COUNT(*) as total_actions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_id) as unique_entities,
    AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY workspace_id, entity_type ORDER BY created_at)))) as avg_time_between_actions
FROM audit_logs
GROUP BY workspace_id, entity_type, action, DATE(created_at);

-- Create audit_user_activity view
CREATE OR REPLACE VIEW audit_user_activity AS
SELECT 
    workspace_id,
    user_id,
    DATE(created_at) as date,
    COUNT(*) as total_actions,
    COUNT(DISTINCT entity_type) as entity_types_accessed,
    COUNT(DISTINCT entity_id) as entities_accessed,
    COUNT(CASE WHEN action = 'create' THEN 1 END) as creates,
    COUNT(CASE WHEN action = 'update' THEN 1 END) as updates,
    COUNT(CASE WHEN action = 'delete' THEN 1 END) as deletes,
    COUNT(CASE WHEN action = 'view' THEN 1 END) as views
FROM audit_logs
GROUP BY workspace_id, user_id, DATE(created_at);

-- Create audit_entity_activity view
CREATE OR REPLACE VIEW audit_entity_activity AS
SELECT 
    workspace_id,
    entity_type,
    entity_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN action = 'create' THEN 1 END) as creates,
    COUNT(CASE WHEN action = 'update' THEN 1 END) as updates,
    COUNT(CASE WHEN action = 'delete' THEN 1 END) as deletes,
    COUNT(CASE WHEN action = 'view' THEN 1 END) as views,
    MIN(created_at) as first_action,
    MAX(created_at) as last_action
FROM audit_logs
GROUP BY workspace_id, entity_type, entity_id;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Audit logging system created successfully' as status;
