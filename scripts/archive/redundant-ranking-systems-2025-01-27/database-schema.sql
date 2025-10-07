-- =====================================================
-- RANKING EVENTS DATABASE SCHEMA
-- =====================================================
-- This script creates the database schema for the
-- unified event-driven ranking system
-- =====================================================

-- Create ranking_events table
CREATE TABLE IF NOT EXISTS ranking_events (
    id VARCHAR(30) PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(30) NOT NULL,
    event_data JSONB,
    impact_score INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 3,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for ranking_events
CREATE INDEX IF NOT EXISTS idx_ranking_events_workspace_id ON ranking_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ranking_events_user_id ON ranking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_events_event_type ON ranking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ranking_events_entity_type ON ranking_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_ranking_events_entity_id ON ranking_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_ranking_events_processed ON ranking_events(processed);
CREATE INDEX IF NOT EXISTS idx_ranking_events_priority ON ranking_events(priority);
CREATE INDEX IF NOT EXISTS idx_ranking_events_created_at ON ranking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ranking_events_workspace_processed ON ranking_events(workspace_id, processed);

-- Create ranking_scores table for persistent storage
CREATE TABLE IF NOT EXISTS ranking_scores (
    id VARCHAR(30) PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(30) NOT NULL,
    score INTEGER NOT NULL,
    rank_position INTEGER NOT NULL,
    factors JSONB,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, entity_type, entity_id)
);

-- Create indexes for ranking_scores
CREATE INDEX IF NOT EXISTS idx_ranking_scores_workspace_id ON ranking_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_entity_type ON ranking_scores(entity_type);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_entity_id ON ranking_scores(entity_id);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_score ON ranking_scores(score);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_rank_position ON ranking_scores(rank_position);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_workspace_entity ON ranking_scores(workspace_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_last_updated ON ranking_scores(last_updated);

-- Create ranking_metrics table for analytics
CREATE TABLE IF NOT EXISTS ranking_metrics (
    id VARCHAR(30) PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    total_events INTEGER DEFAULT 0,
    processed_events INTEGER DEFAULT 0,
    failed_events INTEGER DEFAULT 0,
    average_processing_time FLOAT DEFAULT 0,
    queue_size INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, date)
);

-- Create indexes for ranking_metrics
CREATE INDEX IF NOT EXISTS idx_ranking_metrics_workspace_id ON ranking_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ranking_metrics_date ON ranking_metrics(date);
CREATE INDEX IF NOT EXISTS idx_ranking_metrics_workspace_date ON ranking_metrics(workspace_id, date);

-- Create database triggers for automatic event generation
CREATE OR REPLACE FUNCTION trigger_ranking_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert ranking event into queue
    INSERT INTO ranking_events (
        id,
        workspace_id,
        user_id,
        event_type,
        entity_type,
        entity_id,
        event_data,
        impact_score,
        priority,
        created_at
    ) VALUES (
        gen_random_uuid()::text,
        COALESCE(NEW.workspace_id, OLD.workspace_id),
        COALESCE(NEW.user_id, OLD.user_id, 'system'),
        TG_OP || '_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        row_to_json(COALESCE(NEW, OLD)),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 5
            WHEN TG_OP = 'UPDATE' THEN 10
            WHEN TG_OP = 'DELETE' THEN 15
            ELSE 1
        END,
        CASE 
            WHEN TG_TABLE_NAME = 'opportunities' THEN 1
            WHEN TG_TABLE_NAME = 'leads' THEN 2
            WHEN TG_TABLE_NAME = 'contacts' THEN 3
            ELSE 4
        END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to key tables
DROP TRIGGER IF EXISTS contacts_ranking_trigger ON contacts;
CREATE TRIGGER contacts_ranking_trigger
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION trigger_ranking_event();

DROP TRIGGER IF EXISTS leads_ranking_trigger ON leads;
CREATE TRIGGER leads_ranking_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION trigger_ranking_event();

DROP TRIGGER IF EXISTS opportunities_ranking_trigger ON opportunities;
CREATE TRIGGER opportunities_ranking_trigger
    AFTER INSERT OR UPDATE OR DELETE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION trigger_ranking_event();

DROP TRIGGER IF EXISTS accounts_ranking_trigger ON accounts;
CREATE TRIGGER accounts_ranking_trigger
    AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW EXECUTE FUNCTION trigger_ranking_event();

-- Create function to process ranking events
CREATE OR REPLACE FUNCTION process_ranking_events(workspace_id_param VARCHAR(30))
RETURNS INTEGER AS $$
DECLARE
    processed_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Process high priority events first
    FOR event_record IN 
        SELECT * FROM ranking_events 
        WHERE workspace_id = workspace_id_param 
        AND processed = FALSE 
        AND priority <= 2
        ORDER BY priority ASC, created_at ASC
        LIMIT 50
    LOOP
        -- Mark as processed (actual ranking logic would go here)
        UPDATE ranking_events 
        SET processed = TRUE, processed_at = NOW()
        WHERE id = event_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old events
CREATE OR REPLACE FUNCTION cleanup_old_ranking_events(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ranking_events 
    WHERE processed = TRUE 
    AND processed_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
