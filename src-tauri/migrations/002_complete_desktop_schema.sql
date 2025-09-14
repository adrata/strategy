-- COMPLETE DESKTOP SCHEMA - 100% Feature Parity with Web App
-- Supports ALL CRM entities: Leads, Contacts, Accounts, Opportunities, People, etc.

-- User table (authentication and workspace info)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    workspace_id TEXT NOT NULL,
    workspace_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_sync_at TEXT
);

-- Leads table (prospects and potential customers)
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    source TEXT,
    notes TEXT,
    last_action_date TEXT,
    next_action_date TEXT,
    value TEXT,
    probability INTEGER,
    assigned_to TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    last_sync_at TEXT,
    cloud_updated_at TEXT,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Contacts table (converted leads and direct contacts)
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    department TEXT,
    location TEXT,
    notes TEXT,
    relationship TEXT,
    linkedin_url TEXT,
    account_id TEXT,
    assigned_to TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    last_sync_at TEXT,
    cloud_updated_at TEXT,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Accounts table (companies and organizations)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    size TEXT,
    revenue TEXT,
    employees INTEGER,
    description TEXT,
    headquarters TEXT,
    account_status TEXT NOT NULL DEFAULT 'Active',
    primary_contact_id TEXT,
    owner_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    last_sync_at TEXT,
    FOREIGN KEY (primary_contact_id) REFERENCES contacts(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Opportunities table (deals and sales opportunities)
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    amount REAL,
    expected_close_date TEXT,
    probability INTEGER NOT NULL DEFAULT 10,
    stage TEXT NOT NULL DEFAULT 'Discovery',
    primary_contact_id TEXT,
    account_id TEXT,
    owner_id TEXT,
    engagement_score REAL NOT NULL DEFAULT 0.0,
    risk_score REAL NOT NULL DEFAULT 0.5,
    next_best_action TEXT,
    action_priority TEXT NOT NULL DEFAULT 'Medium',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    last_sync_at TEXT,
    FOREIGN KEY (primary_contact_id) REFERENCES contacts(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- People table (enriched individual profiles)
CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    title TEXT,
    company TEXT,
    department TEXT,
    linkedin_url TEXT,
    phone TEXT,
    location TEXT,
    seniority TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    last_sync_at TEXT
);

-- Outbox Settings table (sales outreach configuration)
CREATE TABLE IF NOT EXISTS outbox_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    weekly_target INTEGER NOT NULL DEFAULT 15,
    strategy TEXT NOT NULL DEFAULT 'optimal',
    role TEXT NOT NULL DEFAULT 'AE',
    quota INTEGER,
    pipeline_health TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Enrichment Executions table (Monaco pipeline tracking)
CREATE TABLE IF NOT EXISTS enrichment_executions (
    id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL UNIQUE,
    trigger_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    current_step INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL DEFAULT 25,
    completed_companies INTEGER NOT NULL DEFAULT 0,
    total_companies INTEGER NOT NULL DEFAULT 0,
    start_time TEXT NOT NULL,
    end_time TEXT,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    results TEXT, -- JSON data
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- OpenAI API Results table (AI intelligence tracking)
CREATE TABLE IF NOT EXISTS openai_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL UNIQUE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    model_used TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- BrightData API Results table (enrichment data tracking)
CREATE TABLE IF NOT EXISTS brightdata_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL UNIQUE,
    query_type TEXT NOT NULL,
    query_params TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    data TEXT, -- JSON data
    cost REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sync metadata table (track sync status across all entities)
CREATE TABLE IF NOT EXISTS sync_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    last_sync_time TEXT NOT NULL,
    sync_direction TEXT NOT NULL CHECK (sync_direction IN ('pull', 'push')),
    record_count INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Enrichment Cache table (intelligent caching for cost optimization)
CREATE TABLE IF NOT EXISTS enrichment_cache (
    id TEXT PRIMARY KEY,
    cache_type TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    cache_data TEXT NOT NULL, -- JSON data
    access_count INTEGER NOT NULL DEFAULT 1,
    cost_savings REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT
);

-- PERFORMANCE INDEXES --
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);
CREATE INDEX IF NOT EXISTS idx_leads_sync ON leads(needs_sync);

CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_sync ON contacts(needs_sync);

CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_accounts_industry ON accounts(industry);
CREATE INDEX IF NOT EXISTS idx_accounts_sync ON accounts(needs_sync);

CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_account_id ON opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_sync ON opportunities(needs_sync);

CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_company ON people(company);
CREATE INDEX IF NOT EXISTS idx_people_verified ON people(is_verified);
CREATE INDEX IF NOT EXISTS idx_people_sync ON people(needs_sync);

CREATE INDEX IF NOT EXISTS idx_outbox_user_id ON outbox_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_enrichment_execution_id ON enrichment_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_status ON enrichment_executions(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_user_id ON enrichment_executions(user_id);

CREATE INDEX IF NOT EXISTS idx_openai_request_id ON openai_results(request_id);
CREATE INDEX IF NOT EXISTS idx_openai_model ON openai_results(model_used);

CREATE INDEX IF NOT EXISTS idx_brightdata_request_id ON brightdata_results(request_id);
CREATE INDEX IF NOT EXISTS idx_brightdata_type ON brightdata_results(query_type);

CREATE INDEX IF NOT EXISTS idx_sync_table ON sync_metadata(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_direction ON sync_metadata(sync_direction);

CREATE INDEX IF NOT EXISTS idx_cache_type_key ON enrichment_cache(cache_type, cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON enrichment_cache(expires_at);

-- Data integrity triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_leads_timestamp 
    AFTER UPDATE ON leads
    BEGIN
        UPDATE leads SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_contacts_timestamp 
    AFTER UPDATE ON contacts
    BEGIN
        UPDATE contacts SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_accounts_timestamp 
    AFTER UPDATE ON accounts
    BEGIN
        UPDATE accounts SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_opportunities_timestamp 
    AFTER UPDATE ON opportunities
    BEGIN
        UPDATE opportunities SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_people_timestamp 
    AFTER UPDATE ON people
    BEGIN
        UPDATE people SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_outbox_timestamp 
    AFTER UPDATE ON outbox_settings
    BEGIN
        UPDATE outbox_settings SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_enrichment_timestamp 
    AFTER UPDATE ON enrichment_executions
    BEGIN
        UPDATE enrichment_executions SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_cache_timestamp 
    AFTER UPDATE ON enrichment_cache
    BEGIN
        UPDATE enrichment_cache SET updated_at = datetime('now'), access_count = access_count + 1 WHERE id = NEW.id;
    END; 