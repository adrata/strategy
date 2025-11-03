/**
 * Diagnostic script to check Stacks API error root causes
 * 
 * Run with: npx tsx scripts/diagnose-stacks-errors.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DiagnosticResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

async function diagnoseStacksErrors() {
  const results: DiagnosticResult[] = [];

  console.log('🔍 Starting Stacks API Error Diagnostics...\n');

  // 1. Check Prisma client sync
  console.log('1. Checking Prisma client sync...');
  try {
    // Try to access the StacksEpoch model (schema uses StacksEpoch, not StacksEpic)
    const testQuery = await prisma.stacksEpoch.findMany({ take: 0 });
    results.push({
      check: 'Prisma Client Sync',
      status: 'PASS',
      message: 'Prisma client is synced (stacksEpoch model accessible)'
    });
  } catch (error: any) {
    if (error.message?.includes('stacksEpoch') || error.message?.includes('stacksEpic')) {
      results.push({
        check: 'Prisma Client Sync',
        status: 'FAIL',
        message: 'Prisma client model name mismatch - regenerate with: npx prisma generate',
        details: error.message
      });
    } else {
      results.push({
        check: 'Prisma Client Sync',
        status: 'WARNING',
        message: 'Could not verify Prisma client sync',
        details: error.message
      });
    }
  }

  // 2. Check database connection
  console.log('2. Checking database connection...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({
      check: 'Database Connection',
      status: 'PASS',
      message: 'Database connection successful'
    });
  } catch (error: any) {
    results.push({
      check: 'Database Connection',
      status: 'FAIL',
      message: 'Database connection failed - check DATABASE_URL',
      details: error.message
    });
  }

  // 3. Check workspace_users table structure
  console.log('3. Checking workspace_users table structure...');
  try {
    const sample = await prisma.workspace_users.findFirst({
      select: {
        id: true,
        userId: true,
        workspaceId: true,
        role: true,
        isActive: true
      }
    });
    results.push({
      check: 'workspace_users Table Structure',
      status: 'PASS',
      message: 'workspace_users table accessible with correct columns'
    });
  } catch (error: any) {
    if (error.code === 'P2022') {
      results.push({
        check: 'workspace_users Table Structure',
        status: 'FAIL',
        message: 'Schema mismatch - run migrations: npx prisma migrate deploy',
        details: error.message
      });
    } else {
      results.push({
        check: 'workspace_users Table Structure',
        status: 'FAIL',
        message: 'Error accessing workspace_users table',
        details: error.message
      });
    }
  }

  // 4. Check Stacks tables structure
  console.log('4. Checking Stacks tables structure...');
  const stacksTables = ['stacksProject', 'stacksEpoch', 'stacksStory'];
  
  for (const table of stacksTables) {
    try {
      // @ts-ignore - Dynamic table access
      await prisma[table].findMany({ take: 0 });
      results.push({
        check: `${table} Table Structure`,
        status: 'PASS',
        message: `${table} table accessible`
      });
    } catch (error: any) {
      if (error.code === 'P2022') {
        results.push({
          check: `${table} Table Structure`,
          status: 'FAIL',
          message: `Schema mismatch in ${table} - run migrations`,
          details: error.message
        });
      } else {
        results.push({
          check: `${table} Table Structure`,
          status: 'WARNING',
          message: `Could not verify ${table} table`,
          details: error.message
        });
      }
    }
  }

  // 5. Check for users without workspace_users records
  console.log('5. Checking for users without workspace_users records...');
  try {
    const usersWithoutMemberships = await prisma.$queryRaw<Array<{ id: string; email: string; activeWorkspaceId: string | null }>>`
      SELECT u.id, u.email, u."activeWorkspaceId"
      FROM users u
      WHERE u."activeWorkspaceId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM workspace_users wu
        WHERE wu."userId" = u.id
        AND wu."workspaceId" = u."activeWorkspaceId"
        AND wu."isActive" = true
      )
      LIMIT 10
    `;

    if (usersWithoutMemberships.length > 0) {
      results.push({
        check: 'Users Without Workspace Memberships',
        status: 'FAIL',
        message: `Found ${usersWithoutMemberships.length} users without workspace_users records`,
        details: usersWithoutMemberships.map(u => ({
          userId: u.id,
          email: u.email,
          activeWorkspaceId: u.activeWorkspaceId
        }))
      });
    } else {
      results.push({
        check: 'Users Without Workspace Memberships',
        status: 'PASS',
        message: 'All users with active workspaces have workspace_users records'
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Users Without Workspace Memberships',
      status: 'WARNING',
      message: 'Could not check workspace_users records',
      details: error.message
    });
  }

  // 6. Check for orphaned workspace_users records
  console.log('6. Checking for orphaned workspace_users records...');
  try {
    const orphanedRecords = await prisma.$queryRaw<Array<{ id: string; userId: string; workspaceId: string }>>`
      SELECT wu.id, wu."userId", wu."workspaceId"
      FROM workspace_users wu
      WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = wu."userId"
      )
      OR NOT EXISTS (
        SELECT 1 FROM workspaces w WHERE w.id = wu."workspaceId"
      )
      LIMIT 10
    `;

    if (orphanedRecords.length > 0) {
      results.push({
        check: 'Orphaned workspace_users Records',
        status: 'WARNING',
        message: `Found ${orphanedRecords.length} orphaned workspace_users records`,
        details: orphanedRecords
      });
    } else {
      results.push({
        check: 'Orphaned workspace_users Records',
        status: 'PASS',
        message: 'No orphaned workspace_users records found'
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Orphaned workspace_users Records',
      status: 'WARNING',
      message: 'Could not check for orphaned records',
      details: error.message
    });
  }

  // Print results
  console.log('\n📊 Diagnostic Results:\n');
  console.log('='.repeat(80));
  
  const fails = results.filter(r => r.status === 'FAIL');
  const warnings = results.filter(r => r.status === 'WARNING');
  const passes = results.filter(r => r.status === 'PASS');

  if (fails.length > 0) {
    console.log('\n❌ FAILURES:\n');
    fails.forEach(result => {
      console.log(`  ${result.check}:`);
      console.log(`    ${result.message}`);
      if (result.details) {
        console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach(result => {
      console.log(`  ${result.check}:`);
      console.log(`    ${result.message}`);
      if (result.details) {
        console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
    });
  }

  if (passes.length > 0) {
    console.log('\n✅ PASSES:\n');
    passes.forEach(result => {
      console.log(`  ${result.check}: ${result.message}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\nSummary: ${passes.length} passed, ${warnings.length} warnings, ${fails.length} failures\n`);

  // Recommendations
  if (fails.length > 0) {
    console.log('🔧 Recommended Actions:\n');
    
    if (results.some(r => r.check.includes('Prisma Client') && r.status === 'FAIL')) {
      console.log('  1. Run: npx prisma generate');
    }
    
    if (results.some(r => r.check.includes('Schema') && r.status === 'FAIL')) {
      console.log('  2. Run: npx prisma migrate deploy');
    }
    
    if (results.some(r => r.check.includes('Database Connection') && r.status === 'FAIL')) {
      console.log('  3. Check DATABASE_URL environment variable');
    }
    
    if (results.some(r => r.check.includes('Without Workspace Memberships') && r.status === 'FAIL')) {
      console.log('  4. Create missing workspace_users records for users');
    }
  }

  await prisma.$disconnect();
  
  return {
    passed: passes.length,
    warnings: warnings.length,
    failures: fails.length,
    results
  };
}

// Run diagnostics
diagnoseStacksErrors()
  .then((summary) => {
    process.exit(summary.failures > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Diagnostic script error:', error);
    process.exit(1);
  });

