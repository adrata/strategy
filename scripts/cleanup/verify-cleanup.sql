-- 🔍 VERIFICATION SCRIPT - AFTER UNUSED TABLE CLEANUP
-- 
-- This script verifies that the cleanup was successful and shows remaining tables
-- Run this AFTER executing remove-unused-tables.sql

-- ========================================
-- REMAINING TABLES ANALYSIS
-- ========================================

-- Show all remaining tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name NOT LIKE '%_backup'
ORDER BY table_name;

-- Count remaining tables
SELECT COUNT(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT LIKE '%_backup';

-- ========================================
-- CORE CRM TABLES VERIFICATION
-- ========================================

-- Verify core CRM tables still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as leads_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prospects') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as prospects_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as contacts_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as accounts_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as opportunities_status;

-- ========================================
-- USER MANAGEMENT TABLES VERIFICATION
-- ========================================

-- Verify user management tables still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as users_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as workspaces_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as activities_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as notes_status;

-- ========================================
-- SPECIALIZED FEATURE TABLES VERIFICATION
-- ========================================

-- Verify specialized feature tables still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as clients_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as partners_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'speedrun_action_logs') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as speedrun_action_logs_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'speedrun_daily_progress') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as speedrun_daily_progress_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'speedrun_lead_interactions') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as speedrun_lead_interactions_status;

-- ========================================
-- EMAIL SYSTEM TABLES VERIFICATION
-- ========================================

-- Verify email system tables still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_accounts') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as email_accounts_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_messages') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as email_messages_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_sequences') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as email_sequences_status;

-- ========================================
-- AI & INTELLIGENCE TABLES VERIFICATION
-- ========================================

-- Verify AI & intelligence tables still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_impact_predictions') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as business_impact_predictions_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_kpis') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as business_kpis_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strategic_insights') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as strategic_insights_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_ai_preferences') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as user_ai_preferences_status;

-- ========================================
-- SYSTEM & INFRASTRUCTURE TABLES VERIFICATION
-- ========================================

-- Verify system & infrastructure tables still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_cost_tracking') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as api_cost_tracking_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage_metrics') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as api_usage_metrics_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cache_metrics') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as cache_metrics_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_access_logs') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as data_access_logs_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_quality_metrics') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as data_quality_metrics_status;

-- ========================================
-- RECRUITING FEATURE TABLES VERIFICATION
-- ========================================

-- Verify recruiting feature tables still exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidates') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as candidates_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as jobs_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interviews') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as interviews_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as job_applications_status;

-- ========================================
-- BACKUP TABLES VERIFICATION
-- ========================================

-- Show backup tables created
SELECT 
    COUNT(*) as backup_tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%_backup';

-- ========================================
-- SUMMARY REPORT
-- ========================================

-- Generate summary report
SELECT 
    'CLEANUP SUMMARY' as report_section,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE '%_backup') as remaining_tables,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%_backup') as backup_tables,
    65 as expected_removed_tables;

-- ========================================
-- EXPECTED REMAINING TABLES
-- ========================================

/*
EXPECTED REMAINING TABLES (~30):

Core CRM (5):
- leads, prospects, contacts, accounts, opportunities

User Management (4):
- users, workspaces, activities, notes

Specialized Features (8):
- clients, partners, speedrun_action_logs, speedrun_daily_progress, speedrun_lead_interactions, email_accounts, email_messages, email_sequences

AI & Intelligence (4):
- business_impact_predictions, business_kpis, strategic_insights, user_ai_preferences

System & Infrastructure (5):
- api_cost_tracking, api_usage_metrics, cache_metrics, data_access_logs, data_quality_metrics

Recruiting Features (4):
- candidates, jobs, interviews, job_applications

Other Active Tables (~10):
- Various other actively used tables

TOTAL EXPECTED: ~30 tables
*/
