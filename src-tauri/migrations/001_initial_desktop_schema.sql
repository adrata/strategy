-- Initial desktop schema for Adrata CRM
-- Simplified schema focused on essential CRM data for offline/online sync

-- User table (minimal user info for desktop)
CREATE TABLE users (
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

-- Leads table (core CRM entity)
CREATE TABLE leads (
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
CREATE TABLE contacts (
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
    assigned_to TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    last_sync_at TEXT,
    cloud_updated_at TEXT,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Opportunities table (deals)
CREATE TABLE opportunities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    amount REAL,
    expected_close_date TEXT,
    probability INTEGER NOT NULL DEFAULT 10,
    stage TEXT NOT NULL DEFAULT 'Discovery',
    primary_contact_id TEXT,
    stakeholder_count INTEGER NOT NULL DEFAULT 1,
    engagement_score REAL NOT NULL DEFAULT 0.0,
    risk_score REAL NOT NULL DEFAULT 0.5,
    next_best_action TEXT,
    owner_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- Sync tracking
    needs_sync BOOLEAN NOT NULL DEFAULT 0,
    last_sync_at TEXT,
    cloud_updated_at TEXT,
    FOREIGN KEY (primary_contact_id) REFERENCES contacts(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Sync metadata table (track sync status)
CREATE TABLE sync_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    last_sync_time TEXT NOT NULL,
    sync_direction TEXT NOT NULL CHECK (sync_direction IN ('pull', 'push')),
    record_count INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Outbox settings (for the specific errors mentioned)
CREATE TABLE outbox_settings (
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
    last_sync_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_needs_sync ON leads(needs_sync);

CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_needs_sync ON contacts(needs_sync);

CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_owner_id ON opportunities(owner_id);
CREATE INDEX idx_opportunities_needs_sync ON opportunities(needs_sync);

CREATE INDEX idx_sync_metadata_table_name ON sync_metadata(table_name);
CREATE INDEX idx_sync_metadata_created_at ON sync_metadata(created_at);

-- Triggers to automatically set updated_at and needs_sync
CREATE TRIGGER update_leads_timestamp 
    AFTER UPDATE ON leads
    BEGIN
        UPDATE leads SET 
            updated_at = datetime('now'),
            needs_sync = 1
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_contacts_timestamp 
    AFTER UPDATE ON contacts
    BEGIN
        UPDATE contacts SET 
            updated_at = datetime('now'),
            needs_sync = 1
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_opportunities_timestamp 
    AFTER UPDATE ON opportunities
    BEGIN
        UPDATE opportunities SET 
            updated_at = datetime('now'),
            needs_sync = 1
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_outbox_settings_timestamp 
    AFTER UPDATE ON outbox_settings
    BEGIN
        UPDATE outbox_settings SET 
            updated_at = datetime('now'),
            needs_sync = 1
        WHERE id = NEW.id;
    END; 