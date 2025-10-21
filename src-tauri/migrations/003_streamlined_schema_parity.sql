-- ====================================================================
-- STREAMLINED SCHEMA PARITY MIGRATION (SQLite)
-- This migration aligns the Tauri desktop database with the production
-- PostgreSQL schema-streamlined.prisma for full offline-first capability
-- ====================================================================
--
-- Migration Strategy:
-- 1. Drop deprecated tables (accounts, old leads structure)
-- 2. Create new tables matching PostgreSQL exactly (adapted for SQLite)
-- 3. Add sync metadata columns for offline-first architecture
-- 4. Create indexes matching production for performance
--
-- SQLite Adaptations:
-- - TEXT for VARCHAR/String fields
-- - TEXT for DateTime fields (ISO 8601 format)
-- - REAL for Float/Decimal fields
-- - INTEGER for Int/Boolean fields
-- - TEXT for JSON fields (stored as JSON strings)
-- - TEXT for Array fields (stored as JSON arrays)
-- - TEXT for Enum fields (stored as string values)
-- ====================================================================

-- ====================================================================
-- PHASE 1: DROP DEPRECATED TABLES
-- ====================================================================

DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS people;
DROP TABLE IF EXISTS outbox_settings;
DROP TABLE IF EXISTS sync_metadata;

-- ====================================================================
-- PHASE 2: CORE AUTHENTICATION & WORKSPACE TABLES
-- ====================================================================

-- Workspaces (multi-tenant support)
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    timezone TEXT DEFAULT 'UTC',
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT,
    business_model TEXT,
    competitive_advantages TEXT, -- JSON array
    ideal_customer_profile TEXT,
    industry TEXT,
    product_portfolio TEXT, -- JSON array
    sales_methodology TEXT,
    service_offerings TEXT, -- JSON array
    target_company_size TEXT, -- JSON array
    target_industries TEXT, -- JSON array
    value_propositions TEXT, -- JSON array
    speedrun_daily_target INTEGER DEFAULT 50,
    speedrun_weekly_target INTEGER DEFAULT 250,
    news_enabled INTEGER DEFAULT 0,
    news_industries TEXT, -- JSON array
    news_sources TEXT, -- JSON array
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    is_dirty INTEGER DEFAULT 0
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_is_active ON workspaces(is_active);
CREATE INDEX idx_workspaces_deleted_at ON workspaces(deleted_at);

-- Users (with workspace relationships)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    timezone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    active_workspace_id TEXT,
    username TEXT UNIQUE,
    speedrun_ranking_mode TEXT,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    is_dirty INTEGER DEFAULT 0,
    FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX idx_users_active_workspace_id ON users(active_workspace_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Workspace memberships
CREATE TABLE workspace_users (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER', -- SUPER_ADMIN, WORKSPACE_ADMIN, MANAGER, SELLER, VIEWER
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workspace_users_workspace_id ON workspace_users(workspace_id);
CREATE INDEX idx_workspace_users_user_id ON workspace_users(user_id);
CREATE INDEX idx_workspace_users_workspace_role ON workspace_users(workspace_id, role);

-- Auth sessions (JWT tokens for offline auth)
CREATE TABLE auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX idx_auth_sessions_is_active ON auth_sessions(is_active);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);

-- RBAC: Roles
CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0
);

CREATE INDEX idx_roles_is_active ON roles(is_active);

-- RBAC: Permissions
CREATE TABLE permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0
);

CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_is_active ON permissions(is_active);

-- RBAC: Role-Permission mappings
CREATE TABLE role_permissions (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- RBAC: User-Role assignments
CREATE TABLE user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    workspace_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    assigned_by TEXT,
    expires_at TEXT,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id, workspace_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_workspace_id ON user_roles(workspace_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

-- ====================================================================
-- PHASE 3: CORE CRM TABLES
-- ====================================================================

-- Companies (replaces "accounts")
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    legal_name TEXT,
    trading_name TEXT,
    local_name TEXT,
    description TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    fax TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    industry TEXT,
    sector TEXT,
    size TEXT,
    revenue REAL,
    currency TEXT DEFAULT 'USD',
    employee_count INTEGER,
    founded_year INTEGER,
    registration_number TEXT,
    tax_id TEXT,
    vat_number TEXT,
    domain TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, PROSPECT, CLIENT, OPPORTUNITY
    priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    tags TEXT, -- JSON array
    custom_fields TEXT, -- JSON object
    notes TEXT,
    last_action TEXT,
    last_action_date TEXT,
    next_action TEXT,
    next_action_date TEXT,
    action_status TEXT,
    global_rank INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    entity_id TEXT,
    deleted_at TEXT,
    main_seller_id TEXT,
    -- Opportunity fields (embedded)
    actual_close_date TEXT,
    expected_close_date TEXT,
    opportunity_amount REAL,
    opportunity_probability REAL,
    opportunity_stage TEXT,
    -- Intelligence fields
    acquisition_date TEXT,
    active_job_postings INTEGER DEFAULT 0,
    business_challenges TEXT, -- JSON array
    business_priorities TEXT, -- JSON array
    company_intelligence TEXT, -- JSON object
    company_updates TEXT, -- JSON object
    competitive_advantages TEXT, -- JSON array
    competitors TEXT, -- JSON array
    confidence REAL DEFAULT 0,
    decision_timeline TEXT,
    digital_maturity INTEGER DEFAULT 0,
    facebook_url TEXT,
    github_url TEXT,
    growth_opportunities TEXT, -- JSON array
    hq_city TEXT,
    hq_country_iso2 TEXT,
    hq_country_iso3 TEXT,
    hq_full_address TEXT,
    hq_location TEXT,
    hq_region TEXT, -- JSON array
    hq_state TEXT,
    hq_street TEXT,
    hq_zipcode TEXT,
    instagram_url TEXT,
    is_public INTEGER DEFAULT 0,
    key_influencers TEXT,
    last_funding_amount INTEGER,
    last_funding_date TEXT,
    last_verified TEXT,
    linkedin_followers INTEGER,
    linkedin_url TEXT,
    market_position TEXT,
    market_threats TEXT, -- JSON array
    naics_codes TEXT, -- JSON array
    num_technologies_used INTEGER DEFAULT 0,
    parent_company_domain TEXT,
    parent_company_name TEXT,
    sic_codes TEXT, -- JSON array
    sources TEXT, -- JSON array
    stock_symbol TEXT,
    strategic_initiatives TEXT, -- JSON array
    success_metrics TEXT, -- JSON array
    tech_stack TEXT, -- JSON array
    technologies_used TEXT, -- JSON array
    twitter_followers INTEGER,
    twitter_url TEXT,
    youtube_url TEXT,
    next_action_reasoning TEXT,
    next_action_priority TEXT,
    next_action_type TEXT,
    next_action_updated_at TEXT,
    -- AI/Data Quality fields
    acquisition_history TEXT, -- JSON object
    ai_confidence REAL DEFAULT 0,
    ai_intelligence TEXT, -- JSON object
    ai_last_updated TEXT,
    data_last_verified TEXT,
    data_quality_breakdown TEXT, -- JSON object
    data_quality_score REAL DEFAULT 0,
    data_sources TEXT, -- JSON array
    employee_count_change TEXT, -- JSON object
    employee_reviews_score TEXT, -- JSON object
    executive_arrivals TEXT, -- JSON object
    executive_departures TEXT, -- JSON object
    funding_rounds TEXT, -- JSON object
    job_postings_change TEXT, -- JSON object
    product_reviews_score TEXT, -- JSON object
    revenue_range TEXT, -- JSON object
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    is_dirty INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (main_seller_id) REFERENCES users(id)
);

CREATE INDEX idx_companies_workspace_id ON companies(workspace_id);
CREATE INDEX idx_companies_main_seller_id ON companies(main_seller_id);
CREATE INDEX idx_companies_entity_id ON companies(entity_id);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);
CREATE INDEX idx_companies_workspace_status ON companies(workspace_id, status);
CREATE INDEX idx_companies_workspace_seller_status ON companies(workspace_id, main_seller_id, status);
CREATE INDEX idx_companies_workspace_created ON companies(workspace_id, created_at);
CREATE INDEX idx_companies_workspace_rank ON companies(workspace_id, global_rank);
CREATE INDEX idx_companies_confidence ON companies(confidence);
CREATE INDEX idx_companies_last_verified ON companies(last_verified);
CREATE INDEX idx_companies_data_quality ON companies(workspace_id, data_quality_score);

-- People (enriched contacts/leads)
CREATE TABLE people (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    company_id TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    display_name TEXT,
    salutation TEXT,
    suffix TEXT,
    job_title TEXT,
    title TEXT,
    department TEXT,
    seniority TEXT,
    email TEXT,
    work_email TEXT,
    personal_email TEXT,
    phone TEXT,
    mobile_phone TEXT,
    work_phone TEXT,
    linkedin_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    date_of_birth TEXT,
    gender TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    status TEXT DEFAULT 'LEAD', -- LEAD, PROSPECT, OPPORTUNITY, CLIENT, SUPERFAN
    priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    source TEXT,
    tags TEXT, -- JSON array
    custom_fields TEXT, -- JSON object
    notes TEXT,
    preferred_language TEXT,
    timezone TEXT,
    email_verified INTEGER DEFAULT 0,
    phone_verified INTEGER DEFAULT 0,
    last_action TEXT,
    last_action_date TEXT,
    next_action TEXT,
    next_action_date TEXT,
    action_status TEXT,
    engagement_score REAL DEFAULT 0,
    global_rank INTEGER DEFAULT 0,
    company_rank INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    entity_id TEXT,
    deleted_at TEXT,
    main_seller_id TEXT,
    vertical TEXT,
    -- Enrichment fields
    achievements TEXT, -- JSON array
    budget_responsibility TEXT,
    buyer_group_optimized INTEGER DEFAULT 0,
    buyer_group_role TEXT,
    buyer_group_status TEXT,
    career_timeline TEXT, -- JSON object
    certifications TEXT, -- JSON array
    communication_style TEXT,
    coresignal_data TEXT, -- JSON object
    current_company TEXT,
    current_role TEXT,
    data_completeness REAL DEFAULT 0,
    decision_making TEXT,
    decision_power INTEGER DEFAULT 0,
    degrees TEXT, -- JSON object
    email_confidence REAL DEFAULT 0,
    engagement_level TEXT,
    engagement_strategy TEXT,
    enriched_data TEXT, -- JSON object
    enrichment_score REAL DEFAULT 0,
    enrichment_sources TEXT, -- JSON array
    enrichment_version TEXT,
    fields_of_study TEXT, -- JSON array
    graduation_years TEXT, -- JSON array
    hidden_from_sections TEXT, -- JSON array
    industry_experience TEXT,
    industry_skills TEXT, -- JSON array
    influence_level TEXT,
    influence_score REAL DEFAULT 0,
    institutions TEXT, -- JSON array
    is_buyer_group_member INTEGER DEFAULT 0,
    languages TEXT, -- JSON array
    last_enriched TEXT,
    leadership_experience TEXT,
    mobile_verified INTEGER DEFAULT 0,
    phone_confidence REAL DEFAULT 0,
    preferred_contact TEXT,
    previous_roles TEXT, -- JSON object
    publications TEXT, -- JSON array
    response_time TEXT,
    role_history TEXT, -- JSON object
    role_promoted TEXT, -- JSON object
    soft_skills TEXT, -- JSON array
    speaking_engagements TEXT, -- JSON array
    status_reason TEXT,
    status_update_date TEXT,
    team_size TEXT,
    technical_skills TEXT, -- JSON array
    total_experience INTEGER,
    years_at_company INTEGER,
    years_in_role INTEGER,
    next_action_priority TEXT,
    next_action_reasoning TEXT,
    next_action_type TEXT,
    next_action_updated_at TEXT,
    linkedin_connection_date TEXT,
    linkedin_navigator_url TEXT,
    decision_power_score INTEGER DEFAULT 0,
    years_experience INTEGER,
    -- AI/Data Quality fields
    ai_confidence REAL DEFAULT 0,
    ai_intelligence TEXT, -- JSON object
    ai_last_updated TEXT,
    data_last_verified TEXT,
    data_quality_breakdown TEXT, -- JSON object
    data_quality_score REAL DEFAULT 0,
    data_sources TEXT, -- JSON array
    email_quality_grade TEXT,
    linkedin_connections INTEGER,
    linkedin_followers INTEGER,
    phone_quality_score REAL DEFAULT 0,
    salary_projections TEXT, -- JSON object
    total_experience_months INTEGER,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    is_dirty INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (main_seller_id) REFERENCES users(id)
);

CREATE INDEX idx_people_workspace_id ON people(workspace_id);
CREATE INDEX idx_people_company_id ON people(company_id);
CREATE INDEX idx_people_entity_id ON people(entity_id);
CREATE INDEX idx_people_deleted_at ON people(deleted_at);
CREATE INDEX idx_people_workspace_status ON people(workspace_id, status);
CREATE INDEX idx_people_workspace_company_status ON people(workspace_id, company_id, status);
CREATE INDEX idx_people_workspace_created ON people(workspace_id, created_at);
CREATE INDEX idx_people_main_seller_id ON people(main_seller_id);
CREATE INDEX idx_people_workspace_seller_status ON people(workspace_id, main_seller_id, status);
CREATE INDEX idx_people_workspace_rank ON people(workspace_id, global_rank);
CREATE INDEX idx_people_buyer_group_role ON people(buyer_group_role);
CREATE INDEX idx_people_decision_power ON people(decision_power);
CREATE INDEX idx_people_influence_level ON people(influence_level);
CREATE INDEX idx_people_enrichment_score ON people(enrichment_score);
CREATE INDEX idx_people_last_enriched ON people(last_enriched);
CREATE INDEX idx_people_email_quality ON people(workspace_id, email_quality_grade);
CREATE INDEX idx_people_data_quality ON people(workspace_id, data_quality_score);

-- Person co-sellers (multi-player sales)
CREATE TABLE person_co_sellers (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(person_id, user_id)
);

CREATE INDEX idx_person_co_sellers_person_id ON person_co_sellers(person_id);
CREATE INDEX idx_person_co_sellers_user_id ON person_co_sellers(user_id);
CREATE INDEX idx_person_co_sellers_created_at ON person_co_sellers(created_at);

-- Actions (tasks, calls, meetings, etc.)
CREATE TABLE actions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    company_id TEXT,
    person_id TEXT,
    type TEXT NOT NULL, -- CALL, EMAIL, MEETING, TASK, NOTE, etc.
    subject TEXT NOT NULL,
    description TEXT,
    outcome TEXT,
    scheduled_at TEXT,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    priority TEXT NOT NULL DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    is_dirty INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (person_id) REFERENCES people(id)
);

CREATE INDEX idx_actions_workspace_id ON actions(workspace_id);
CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_company_id ON actions(company_id);
CREATE INDEX idx_actions_person_id ON actions(person_id);
CREATE INDEX idx_actions_type ON actions(type);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_deleted_at ON actions(deleted_at);
CREATE INDEX idx_actions_workspace_status ON actions(workspace_id, status);
CREATE INDEX idx_actions_workspace_user_status ON actions(workspace_id, user_id, status);
CREATE INDEX idx_actions_workspace_scheduled ON actions(workspace_id, scheduled_at);
CREATE INDEX idx_actions_workspace_created ON actions(workspace_id, created_at);

-- ====================================================================
-- PHASE 4: INTELLIGENCE & ENRICHMENT TABLES
-- ====================================================================

-- Research data (Perplexity AI, web scraping, etc.)
CREATE TABLE research_data (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- COMPANY, PERSON, etc.
    entity_id TEXT NOT NULL,
    research_type TEXT NOT NULL,
    content TEXT,
    sources TEXT, -- JSON object
    extracted_data TEXT, -- JSON object
    confidence REAL DEFAULT 0,
    model TEXT,
    tokens_used INTEGER,
    processing_time INTEGER,
    cost REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_research_data_workspace_id ON research_data(workspace_id);
CREATE INDEX idx_research_data_entity ON research_data(entity_type, entity_id);
CREATE INDEX idx_research_data_research_type ON research_data(research_type);
CREATE INDEX idx_research_data_created_at ON research_data(created_at);
CREATE INDEX idx_research_data_expires_at ON research_data(expires_at);

-- API cost tracking
CREATE TABLE api_cost_tracking (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT,
    api_provider TEXT NOT NULL,
    endpoint TEXT,
    operation TEXT,
    cost REAL NOT NULL,
    tokens_used INTEGER,
    entity_type TEXT,
    entity_id TEXT,
    request_data TEXT, -- JSON object
    success INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_api_cost_workspace_id ON api_cost_tracking(workspace_id);
CREATE INDEX idx_api_cost_api_provider ON api_cost_tracking(api_provider);
CREATE INDEX idx_api_cost_created_at ON api_cost_tracking(created_at);
CREATE INDEX idx_api_cost_workspace_provider ON api_cost_tracking(workspace_id, api_provider);
CREATE INDEX idx_api_cost_entity ON api_cost_tracking(entity_type, entity_id);

-- AI conversations
CREATE TABLE ai_conversations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    last_activity TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    welcome_message TEXT,
    metadata TEXT, -- JSON object
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_conversations_workspace_user_deleted ON ai_conversations(workspace_id, user_id, deleted_at);
CREATE INDEX idx_ai_conversations_last_activity ON ai_conversations(last_activity);
CREATE INDEX idx_ai_conversations_workspace_user_active ON ai_conversations(workspace_id, user_id, is_active);

-- AI messages
CREATE TABLE ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    type TEXT NOT NULL, -- USER, ASSISTANT
    content TEXT NOT NULL,
    metadata TEXT, -- JSON object
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_messages_conversation_type ON ai_messages(conversation_id, type);

-- ====================================================================
-- PHASE 5: CHRONICLE & METRICS TABLES
-- ====================================================================

-- Chronicle reports
CREATE TABLE chronicle_reports (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    report_date TEXT NOT NULL,
    report_type TEXT NOT NULL, -- MONDAY_PREP, FRIDAY_RECAP
    content TEXT NOT NULL, -- JSON object
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL,
    deleted_at TEXT,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_chronicle_reports_created_by ON chronicle_reports(created_by);
CREATE INDEX idx_chronicle_reports_deleted_at ON chronicle_reports(deleted_at);
CREATE INDEX idx_chronicle_reports_report_date ON chronicle_reports(report_date);
CREATE INDEX idx_chronicle_reports_report_type ON chronicle_reports(report_type);
CREATE INDEX idx_chronicle_reports_workspace_id ON chronicle_reports(workspace_id);

-- Chronicle shares
CREATE TABLE chronicle_shares (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    share_token TEXT NOT NULL,
    share_url TEXT NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT,
    allowed_emails TEXT, -- JSON array
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (report_id) REFERENCES chronicle_reports(id) ON DELETE CASCADE
);

CREATE INDEX idx_chronicle_shares_expires_at ON chronicle_shares(expires_at);
CREATE INDEX idx_chronicle_shares_report_id ON chronicle_shares(report_id);
CREATE INDEX idx_chronicle_shares_share_token ON chronicle_shares(share_token);

-- Buyer groups
CREATE TABLE buyer_groups (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    workspace_id TEXT,
    cohesion_score REAL DEFAULT 0,
    overall_confidence REAL DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0,
    metadata TEXT, -- JSON object
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0
);

CREATE INDEX idx_buyer_groups_company_name ON buyer_groups(company_name);
CREATE INDEX idx_buyer_groups_created_at ON buyer_groups(created_at);
CREATE INDEX idx_buyer_groups_workspace_id ON buyer_groups(workspace_id);

-- Buyer group members
CREATE TABLE buyer_group_members (
    id TEXT PRIMARY KEY,
    buyer_group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    role TEXT NOT NULL, -- decision, champion, stakeholder, blocker, introducer
    email TEXT,
    phone TEXT,
    linkedin TEXT,
    confidence REAL DEFAULT 0,
    influence_score REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (buyer_group_id) REFERENCES buyer_groups(id) ON DELETE CASCADE
);

CREATE INDEX idx_buyer_group_members_buyer_group_id ON buyer_group_members(buyer_group_id);
CREATE INDEX idx_buyer_group_members_role ON buyer_group_members(role);

-- ====================================================================
-- PHASE 6: AUDIT & COMPLIANCE TABLES
-- ====================================================================

-- Audit logs
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values TEXT, -- JSON object
    new_values TEXT, -- JSON object
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    success INTEGER NOT NULL DEFAULT 1,
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_workspace_entity_timestamp ON audit_logs(workspace_id, entity_type, timestamp);
CREATE INDEX idx_audit_logs_workspace_action_timestamp ON audit_logs(workspace_id, action, timestamp);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

-- ====================================================================
-- PHASE 7: EMAIL & COMMUNICATION TABLES
-- ====================================================================

-- Email messages (from integrated providers)
CREATE TABLE email_messages (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    message_id TEXT NOT NULL,
    thread_id TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    body_html TEXT,
    from_address TEXT NOT NULL,
    to_addresses TEXT, -- JSON array
    cc_addresses TEXT, -- JSON array
    bcc_addresses TEXT, -- JSON array
    sent_at TEXT NOT NULL,
    received_at TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    is_important INTEGER NOT NULL DEFAULT 0,
    attachments TEXT, -- JSON object
    labels TEXT, -- JSON array
    company_id TEXT,
    person_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync metadata
    last_synced_at TEXT,
    sync_version INTEGER DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (person_id) REFERENCES people(id),
    UNIQUE(provider, message_id, workspace_id)
);

CREATE INDEX idx_email_messages_workspace_id ON email_messages(workspace_id);
CREATE INDEX idx_email_messages_company_id ON email_messages(company_id);
CREATE INDEX idx_email_messages_person_id ON email_messages(person_id);
CREATE INDEX idx_email_messages_workspace_received ON email_messages(workspace_id, received_at);
CREATE INDEX idx_email_messages_from_address ON email_messages(from_address);

-- ====================================================================
-- PHASE 8: SYNC ENGINE METADATA
-- ====================================================================

-- Sync operations queue (for offline changes)
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    data TEXT, -- JSON object with change data
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' -- PENDING, IN_PROGRESS, COMPLETED, FAILED
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_created_at ON sync_queue(created_at);
CREATE INDEX idx_sync_queue_table_record ON sync_queue(table_name, record_id);

-- Sync status tracking
CREATE TABLE sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL UNIQUE,
    last_full_sync TEXT,
    last_incremental_sync TEXT,
    last_push_sync TEXT,
    total_records INTEGER DEFAULT 0,
    synced_records INTEGER DEFAULT 0,
    pending_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    sync_version INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sync_status_table_name ON sync_status(table_name);
CREATE INDEX idx_sync_status_updated_at ON sync_status(updated_at);

-- Conflict resolution log
CREATE TABLE sync_conflicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    local_version INTEGER NOT NULL,
    remote_version INTEGER NOT NULL,
    local_data TEXT, -- JSON object
    remote_data TEXT, -- JSON object
    resolution TEXT, -- LOCAL_WINS, REMOTE_WINS, MANUAL, MERGE
    resolved_data TEXT, -- JSON object
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    resolved_by TEXT
);

CREATE INDEX idx_sync_conflicts_created_at ON sync_conflicts(created_at);
CREATE INDEX idx_sync_conflicts_table_record ON sync_conflicts(table_name, record_id);
CREATE INDEX idx_sync_conflicts_resolved_at ON sync_conflicts(resolved_at);

-- ====================================================================
-- PHASE 9: TRIGGERS FOR AUTOMATIC SYNC TRACKING
-- ====================================================================

-- Companies sync tracking
CREATE TRIGGER companies_update_sync
AFTER UPDATE ON companies
BEGIN
    UPDATE companies 
    SET 
        updated_at = datetime('now'),
        is_dirty = 1,
        sync_version = sync_version + 1
    WHERE id = NEW.id;
END;

-- People sync tracking
CREATE TRIGGER people_update_sync
AFTER UPDATE ON people
BEGIN
    UPDATE people 
    SET 
        updated_at = datetime('now'),
        is_dirty = 1,
        sync_version = sync_version + 1
    WHERE id = NEW.id;
END;

-- Actions sync tracking
CREATE TRIGGER actions_update_sync
AFTER UPDATE ON actions
BEGIN
    UPDATE actions 
    SET 
        updated_at = datetime('now'),
        is_dirty = 1,
        sync_version = sync_version + 1
    WHERE id = NEW.id;
END;

-- ====================================================================
-- MIGRATION COMPLETE
-- ====================================================================

-- Insert initial sync status for all tables
INSERT INTO sync_status (table_name) VALUES
('workspaces'),
('users'),
('workspace_users'),
('companies'),
('people'),
('actions'),
('research_data'),
('api_cost_tracking'),
('ai_conversations'),
('ai_messages'),
('chronicle_reports'),
('buyer_groups'),
('buyer_group_members'),
('audit_logs'),
('email_messages');

PRAGMA user_version = 3;

