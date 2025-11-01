import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Schema Diagnostics Endpoint
 * 
 * This endpoint helps diagnose database schema issues by:
 * 1. Checking which columns exist in the companies table
 * 2. Verifying migration status
 * 3. Comparing expected vs actual schema
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

    console.log('🔍 [SCHEMA DIAGNOSTICS] Starting schema check...');

    // Get the actual schema from the database
    const schemaInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    // Get migration history
    const migrationHistory = await prisma.$queryRaw`
      SELECT 
        migration_name,
        finished_at,
        applied_steps_count
      FROM _prisma_migrations 
      ORDER BY finished_at DESC
      LIMIT 20;
    `;

    // Check if specific columns exist that are expected in the streamlined schema
    const expectedColumns = [
      'id', 'workspaceId', 'name', 'legalName', 'tradingName', 'localName',
      'description', 'website', 'email', 'phone', 'fax', 'address', 'city',
      'state', 'country', 'postalCode', 'industry', 'sector', 'size',
      'revenue', 'currency', 'employeeCount', 'foundedYear', 'registrationNumber',
      'taxId', 'vatNumber', 'domain', 'logoUrl', 'status', 'priority',
      'tags', 'customFields', 'notes', 'lastAction', 'lastActionDate',
      'nextAction', 'nextActionDate', 'actionStatus', 'globalRank',
      'createdAt', 'updatedAt', 'entityId', 'deletedAt', 'mainSellerId',
      'actualCloseDate', 'expectedCloseDate', 'opportunityAmount',
      'opportunityProbability', 'opportunityStage', 'acquisitionDate',
      'activeJobPostings', 'businessChallenges', 'businessPriorities',
      'companyIntelligence', 'companyUpdates', 'competitiveAdvantages',
      'competitors', 'confidence', 'decisionTimeline', 'digitalMaturity',
      'facebookUrl', 'githubUrl', 'growthOpportunities', 'hqCity',
      'hqCountryIso2', 'hqCountryIso3', 'hqFullAddress', 'hqLocation',
      'hqRegion', 'hqState', 'hqStreet', 'hqZipcode', 'instagramUrl',
      'isPublic', 'keyInfluencers', 'lastFundingAmount', 'lastFundingDate',
      'lastVerified', 'linkedinFollowers', 'linkedinUrl', 'marketPosition',
      'marketThreats', 'naicsCodes', 'numTechnologiesUsed',
      'parentCompanyDomain', 'parentCompanyName', 'sicCodes', 'sources',
      'stockSymbol', 'strategicInitiatives', 'successMetrics', 'techStack',
      'technologiesUsed', 'twitterFollowers', 'twitterUrl', 'youtubeUrl'
    ];

    const actualColumns = (schemaInfo as any[]).map(row => row.column_name);
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
    const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

    // Test a simple company creation to see what specific error occurs
    let testResult = null;
    try {
      // Try to create a test company with minimal data
      const testCompany = await prisma.companies.create({
        data: {
          name: 'TEST_COMPANY_SCHEMA_CHECK',
          workspaceId: authContext.workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      // Clean up the test company
      await prisma.companies.delete({
        where: { id: testCompany.id }
      });
      
      testResult = { success: true, message: 'Test company creation successful' };
    } catch (error) {
      testResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
        prismaCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
        prismaMeta: error && typeof error === 'object' && 'meta' in error ? (error as any).meta : undefined
      };
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        totalColumns: actualColumns.length,
        actualColumns: actualColumns,
        expectedColumns: expectedColumns,
        missingColumns: missingColumns,
        extraColumns: extraColumns,
        schemaDrift: missingColumns.length > 0 || extraColumns.length > 0
      },
      migrations: {
        recentMigrations: migrationHistory,
        totalMigrations: (migrationHistory as any[]).length
      },
      testResult: testResult,
      recommendations: []
    };

    // Add recommendations based on findings
    if (missingColumns.length > 0) {
      diagnostics.recommendations.push({
        type: 'MISSING_COLUMNS',
        message: `Found ${missingColumns.length} missing columns: ${missingColumns.join(', ')}`,
        action: 'Run pending migrations to add missing columns'
      });
    }

    if (extraColumns.length > 0) {
      diagnostics.recommendations.push({
        type: 'EXTRA_COLUMNS',
        message: `Found ${extraColumns.length} extra columns: ${extraColumns.join(', ')}`,
        action: 'Review schema to ensure these columns are expected'
      });
    }

    if (!testResult.success) {
      diagnostics.recommendations.push({
        type: 'CREATION_FAILED',
        message: 'Test company creation failed',
        action: 'Check the specific error and apply appropriate fix'
      });
    }

    console.log('✅ [SCHEMA DIAGNOSTICS] Schema check completed:', {
      missingColumns: missingColumns.length,
      extraColumns: extraColumns.length,
      testSuccess: testResult.success
    });

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error) {
    console.error('❌ [SCHEMA DIAGNOSTICS] Error:', error);
    
    return NextResponse.json({
      error: 'Failed to run schema diagnostics',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
