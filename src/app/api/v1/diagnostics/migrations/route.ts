import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Migration Diagnostics Endpoint
 * 
 * This endpoint helps verify which migrations have been applied to the database
 * and identifies any missing migrations that might be causing schema drift.
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const { context: authContext, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!authContext) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('🔍 [MIGRATION DIAGNOSTICS] Starting migration check...');

    // Get all applied migrations
    const appliedMigrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        finished_at,
        applied_steps_count,
        checksum,
        logs,
        rolled_back_at,
        started_at
      FROM _prisma_migrations 
      ORDER BY finished_at DESC;
    `;

    // Expected migrations based on the migration files we found
    const expectedMigrations = [
      '20251009004916_baseline_streamlined_schema',
      '20251010000000_add_buyer_group_models',
      '20251010000001_add_buyer_group_roles_streamlined',
      '20251010000002_add_webhook_models',
      '20251012140945_rename_to_main_seller',
      '20250101000000_add_sales_enablement_fields',
      '20250101000000_add_sbi_fields_to_companies',
      '20250101000001_add_email_messages_table',
      '20250101000001_rename_customers_to_clients',
      '20250103000000_add_intelligence_tables',
      '20250110000000_add_global_rank_indexes',
      '20250114000000_add_next_action_metadata_fields',
      '20250115000000_add_user_ai_preferences',
      '20250115000001_add_workspace_id_to_company',
      '20250115000002_add_person_company_foreign_keys',
      '20250115000003_add_user_workspace_foreign_keys',
      '20250115120000_add_writing_style_and_memory',
      '20250116000000_enhanced_user_roles_and_profiles',
      '20250117000000_add_top_engineers_plus_context_fields',
      '20250117000000_neon_performance_indexes',
      '20250117000001_performance_indexes',
      '20250117000002_performance_indexes_immediate',
      '20250117000003_performance_indexes_simple',
      '20250117000004_critical_performance_indexes',
      '20250117000005_simplified_performance_indexes',
      '20250117000006_final_performance_indexes',
      '20250117000007_speedrun_performance_indexes',
      '20250117000008_fix_speedrun_indexes',
      '20250117120000_add_action_performed_by',
      '20250118000000_add_username_field_to_users',
      '20250120000000_rename_clients_to_customers',
      '20250120000001_rename_customers_to_clients',
      '20250127000000_add_coresignal_enrichment_fields',
      '20250128000000_add_stage_to_companies',
      '20250130000000_add_ui_fields_and_opportunity_tracking'
    ];

    const appliedMigrationNames = (appliedMigrations as any[]).map(m => m.migration_name);
    const missingMigrations = expectedMigrations.filter(migration => !appliedMigrationNames.includes(migration));
    const extraMigrations = appliedMigrationNames.filter(migration => !expectedMigrations.includes(migration));

    // Check for critical migrations that affect company creation
    const criticalMigrations = [
      '20251009004916_baseline_streamlined_schema', // Baseline schema
      '20251012140945_rename_to_main_seller', // Renames assignedUserId to mainSellerId
      '20250130000000_add_ui_fields_and_opportunity_tracking' // Adds opportunity fields
    ];

    const missingCriticalMigrations = criticalMigrations.filter(migration => 
      !appliedMigrationNames.includes(migration)
    );

    // Get database version info
    const dbVersion = await prisma.$queryRaw`SELECT version();`;
    const dbName = await prisma.$queryRaw`SELECT current_database();`;

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        version: (dbVersion as any[])[0]?.version,
        name: (dbName as any[])[0]?.current_database,
        totalAppliedMigrations: appliedMigrationNames.length,
        appliedMigrations: appliedMigrationNames,
        missingMigrations: missingMigrations,
        extraMigrations: extraMigrations,
        missingCriticalMigrations: missingCriticalMigrations,
        hasSchemaDrift: missingMigrations.length > 0 || missingCriticalMigrations.length > 0
      },
      migrationDetails: appliedMigrations,
      recommendations: []
    };

    // Add recommendations based on findings
    if (missingCriticalMigrations.length > 0) {
      diagnostics.recommendations.push({
        type: 'CRITICAL_MISSING',
        message: `Missing critical migrations: ${missingCriticalMigrations.join(', ')}`,
        action: 'Apply these migrations immediately as they affect core functionality',
        priority: 'HIGH'
      });
    }

    if (missingMigrations.length > 0) {
      diagnostics.recommendations.push({
        type: 'MISSING_MIGRATIONS',
        message: `Missing ${missingMigrations.length} migrations: ${missingMigrations.join(', ')}`,
        action: 'Run `prisma migrate deploy` to apply missing migrations',
        priority: 'MEDIUM'
      });
    }

    if (extraMigrations.length > 0) {
      diagnostics.recommendations.push({
        type: 'EXTRA_MIGRATIONS',
        message: `Found ${extraMigrations.length} unexpected migrations: ${extraMigrations.join(', ')}`,
        action: 'Review these migrations to ensure they are expected',
        priority: 'LOW'
      });
    }

    if (missingMigrations.length === 0 && missingCriticalMigrations.length === 0) {
      diagnostics.recommendations.push({
        type: 'UP_TO_DATE',
        message: 'All expected migrations are applied',
        action: 'Schema should be up to date',
        priority: 'INFO'
      });
    }

    console.log('✅ [MIGRATION DIAGNOSTICS] Migration check completed:', {
      totalApplied: appliedMigrationNames.length,
      missing: missingMigrations.length,
      missingCritical: missingCriticalMigrations.length
    });

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error) {
    console.error('❌ [MIGRATION DIAGNOSTICS] Error:', error);
    
    return NextResponse.json({
      error: 'Failed to run migration diagnostics',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
