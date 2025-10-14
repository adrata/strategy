#!/usr/bin/env node

/**
 * Production Schema Diagnostic Script
 * 
 * This script helps diagnose database schema issues in production by:
 * 1. Checking the actual database schema
 * 2. Verifying migration status
 * 3. Testing company creation
 * 4. Providing specific recommendations
 * 
 * Usage: node scripts/diagnose-production-schema.js
 */

const { PrismaClient } = require('@prisma/client');

async function diagnoseProductionSchema() {
  console.log('🔍 Starting Production Schema Diagnostics...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // 1. Check database connection
    console.log('1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful\n');

    // 2. Get actual companies table schema
    console.log('2. Checking companies table schema...');
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

    const actualColumns = schemaInfo.map(row => row.column_name);
    console.log(`✅ Found ${actualColumns.length} columns in companies table\n`);

    // 3. Check for expected columns from streamlined schema
    console.log('3. Checking for expected columns...');
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

    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
    const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`❌ Missing ${missingColumns.length} expected columns:`);
      missingColumns.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('✅ All expected columns are present');
    }

    if (extraColumns.length > 0) {
      console.log(`⚠️  Found ${extraColumns.length} extra columns:`);
      extraColumns.forEach(col => console.log(`   - ${col}`));
    }

    console.log('');

    // 4. Check migration status
    console.log('4. Checking migration status...');
    const migrationHistory = await prisma.$queryRaw`
      SELECT 
        migration_name,
        finished_at,
        applied_steps_count
      FROM _prisma_migrations 
      ORDER BY finished_at DESC
      LIMIT 10;
    `;

    console.log('Recent migrations:');
    migrationHistory.forEach(migration => {
      console.log(`   - ${migration.migration_name} (${migration.finished_at})`);
    });
    console.log('');

    // 5. Test company creation with minimal data
    console.log('5. Testing company creation...');
    try {
      // Get a workspace ID for testing
      const workspace = await prisma.workspaces.findFirst();
      if (!workspace) {
        console.log('❌ No workspaces found - cannot test company creation');
        return;
      }

      const testCompany = await prisma.companies.create({
        data: {
          name: 'TEST_COMPANY_DIAGNOSTIC',
          workspaceId: workspace.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Clean up
      await prisma.companies.delete({
        where: { id: testCompany.id }
      });

      console.log('✅ Test company creation successful');
    } catch (error) {
      console.log('❌ Test company creation failed:');
      console.log(`   Error: ${error.message}`);
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
      if (error.meta) {
        console.log(`   Meta: ${JSON.stringify(error.meta, null, 2)}`);
      }
    }

    console.log('');

    // 6. Test company creation with all fields (like the API does)
    console.log('6. Testing company creation with all fields...');
    try {
      const workspace = await prisma.workspaces.findFirst();
      if (!workspace) {
        console.log('❌ No workspaces found - cannot test full company creation');
        return;
      }

      const fullTestCompany = await prisma.companies.create({
        data: {
          name: 'TEST_FULL_COMPANY_DIAGNOSTIC',
          legalName: 'Test Legal Name',
          email: 'test@example.com',
          website: 'https://test.com',
          phone: '555-1234',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          industry: 'Technology',
          status: 'ACTIVE',
          priority: 'MEDIUM',
          workspaceId: workspace.id,
          mainSellerId: null,
          notes: 'Test notes',
          opportunityStage: 'PROSPECT',
          opportunityAmount: 100000,
          opportunityProbability: 0.5,
          expectedCloseDate: new Date('2024-12-31'),
          actualCloseDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Clean up
      await prisma.companies.delete({
        where: { id: fullTestCompany.id }
      });

      console.log('✅ Full test company creation successful');
    } catch (error) {
      console.log('❌ Full test company creation failed:');
      console.log(`   Error: ${error.message}`);
      if (error.code) {
        console.log(`   Code: ${error.code}`);
        if (error.code === 'P2022') {
          console.log('   This is a P2022 error - column does not exist');
          if (error.meta?.column_name) {
            console.log(`   Missing column: ${error.meta.column_name}`);
          }
        }
      }
      if (error.meta) {
        console.log(`   Meta: ${JSON.stringify(error.meta, null, 2)}`);
      }
    }

    console.log('');

    // 7. Generate recommendations
    console.log('7. Recommendations:');
    if (missingColumns.length > 0) {
      console.log('❌ CRITICAL: Missing columns detected');
      console.log('   Action: Run pending migrations to add missing columns');
      console.log('   Command: npx prisma migrate deploy');
    }

    if (migrationHistory.length === 0) {
      console.log('❌ CRITICAL: No migrations found in database');
      console.log('   Action: Initialize migrations or check database connection');
    }

    const hasRecentMigrations = migrationHistory.some(m => 
      m.migration_name.includes('20250130') || 
      m.migration_name.includes('20251012')
    );

    if (!hasRecentMigrations) {
      console.log('⚠️  WARNING: Recent migrations may not be applied');
      console.log('   Action: Check if migrations need to be deployed');
    }

    console.log('\n✅ Schema diagnostics completed');

  } catch (error) {
    console.error('❌ Diagnostic script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostics
diagnoseProductionSchema().catch(console.error);
