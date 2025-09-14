-- =====================================================
-- UNIFIED ENTITY VIEWS - CROSS-DOMAIN ANALYTICS
-- =====================================================
-- This script creates unified views for cross-domain analytics
-- and entity relationship tracking
-- =====================================================

-- Create unified entities view
CREATE OR REPLACE VIEW unified_entities AS
SELECT 
    'company' as entity_type,
    id,
    entity_id,
    name as display_name,
    industry,
    size,
    'active' as status,
    created_at,
    updated_at,
    NULL as workspace_id,
    NULL as assigned_user_id
FROM company
WHERE entity_id IS NOT NULL

UNION ALL

SELECT 
    'person' as entity_type,
    id,
    entity_id,
    full_name as display_name,
    NULL as industry,
    NULL as size,
    CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status,
    created_at,
    updated_at,
    NULL as workspace_id,
    NULL as assigned_user_id
FROM person
WHERE entity_id IS NOT NULL

UNION ALL

SELECT 
    'lead' as entity_type,
    id,
    entity_id,
    full_name as display_name,
    industry,
    company_size as size,
    status,
    created_at,
    updated_at,
    workspace_id,
    assigned_user_id
FROM leads
WHERE entity_id IS NOT NULL

UNION ALL

SELECT 
    'prospect' as entity_type,
    id,
    entity_id,
    full_name as display_name,
    industry,
    company_size as size,
    status,
    created_at,
    updated_at,
    workspace_id,
    assigned_user_id
FROM prospects
WHERE entity_id IS NOT NULL

UNION ALL

SELECT 
    'opportunity' as entity_type,
    id,
    entity_id,
    name as display_name,
    NULL as industry,
    NULL as size,
    stage as status,
    created_at,
    updated_at,
    workspace_id,
    assigned_user_id
FROM opportunities
WHERE entity_id IS NOT NULL

UNION ALL

SELECT 
    'client' as entity_type,
    id,
    entity_id,
    'Client Record' as display_name,
    NULL as industry,
    NULL as size,
    customer_status as status,
    created_at,
    updated_at,
    workspace_id,
    assigned_user_id
FROM clients
WHERE entity_id IS NOT NULL

UNION ALL

SELECT 
    'partner' as entity_type,
    id,
    entity_id,
    name as display_name,
    industry,
    size,
    partnership_type as status,
    created_at,
    updated_at,
    workspace_id,
    assigned_user_id
FROM partners
WHERE entity_id IS NOT NULL;

-- Create entity analytics view
CREATE OR REPLACE VIEW entity_analytics AS
SELECT 
    entity_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as created_last_30_days,
    COUNT(CASE WHEN updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as updated_last_7_days,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    MAX(updated_at) as last_updated
FROM unified_entities
GROUP BY entity_type;

-- Create workspace entity summary view
CREATE OR REPLACE VIEW workspace_entity_summary AS
SELECT 
    workspace_id,
    entity_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN assigned_user_id IS NOT NULL THEN 1 END) as assigned_count,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as created_last_30_days,
    COUNT(CASE WHEN updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as updated_last_7_days
FROM unified_entities
WHERE workspace_id IS NOT NULL
GROUP BY workspace_id, entity_type;

-- Create entity relationship view
CREATE OR REPLACE VIEW entity_relationships AS
SELECT 
    'lead_to_company' as relationship_type,
    l.id as source_id,
    l.entity_id as source_entity_id,
    c.id as target_id,
    c.entity_id as target_entity_id,
    l.workspace_id
FROM leads l
JOIN company c ON l.company_id = c.id
WHERE l.entity_id IS NOT NULL AND c.entity_id IS NOT NULL

UNION ALL

SELECT 
    'prospect_to_company' as relationship_type,
    p.id as source_id,
    p.entity_id as source_entity_id,
    c.id as target_id,
    c.entity_id as target_entity_id,
    p.workspace_id
FROM prospects p
JOIN company c ON p.company_id = c.id
WHERE p.entity_id IS NOT NULL AND c.entity_id IS NOT NULL

UNION ALL

SELECT 
    'opportunity_to_company' as relationship_type,
    o.id as source_id,
    o.entity_id as source_entity_id,
    c.id as target_id,
    c.entity_id as target_entity_id,
    o.workspace_id
FROM opportunities o
JOIN company c ON o.company_id = c.id
WHERE o.entity_id IS NOT NULL AND c.entity_id IS NOT NULL

UNION ALL

SELECT 
    'lead_to_person' as relationship_type,
    l.id as source_id,
    l.entity_id as source_entity_id,
    p.id as target_id,
    p.entity_id as target_entity_id,
    l.workspace_id
FROM leads l
JOIN person p ON l.person_id = p.id
WHERE l.entity_id IS NOT NULL AND p.entity_id IS NOT NULL

UNION ALL

SELECT 
    'prospect_to_person' as relationship_type,
    p.id as source_id,
    p.entity_id as source_entity_id,
    per.id as target_id,
    per.entity_id as target_entity_id,
    p.workspace_id
FROM prospects p
JOIN person per ON p.person_id = per.id
WHERE p.entity_id IS NOT NULL AND per.entity_id IS NOT NULL

UNION ALL

SELECT 
    'opportunity_to_person' as relationship_type,
    o.id as source_id,
    o.entity_id as source_entity_id,
    p.id as target_id,
    p.entity_id as target_entity_id,
    o.workspace_id
FROM opportunities o
JOIN person p ON o.person_id = p.id
WHERE o.entity_id IS NOT NULL AND p.entity_id IS NOT NULL;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Unified entity views created successfully' as status;
