#!/usr/bin/env tsx

/**
 * Audit script to find API routes with force-static that use authentication or database queries
 * 
 * Routes that use force-static but require authentication or database access should use force-dynamic
 * 
 * Usage: npm run tsx scripts/audit-force-static-routes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteIssue {
  file: string;
  line: number;
  usesAuth: boolean;
  usesDatabase: boolean;
  authMethods: string[];
  dbMethods: string[];
}

const AUTH_METHODS = [
  'getSecureApiContext',
  'getUnifiedAuthUser',
  'getV1AuthUser',
  'getServerSession',
  'authOptions'
];

const DB_METHODS = [
  'prisma.',
  'prisma.people',
  'prisma.companies',
  'prisma.actions',
  'prisma.workspaces',
  'prisma.users',
  'await prisma',
  'prisma.findUnique',
  'prisma.findMany',
  'prisma.findFirst',
  'prisma.create',
  'prisma.update',
  'prisma.delete',
  'prisma.upsert',
  'prisma.count',
  'prisma.groupBy',
  'prisma.aggregate'
];

function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

async function auditRoutes(): Promise<void> {
  console.log('🔍 Auditing API routes for force-static issues...\n');

  // Find all API route files
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  if (!fs.existsSync(apiDir)) {
    console.error('❌ API directory not found:', apiDir);
    return;
  }

  const routeFiles = findRouteFiles(apiDir);

  const issues: RouteIssue[] = [];

  for (const file of routeFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check if file has force-static
      const forceStaticMatch = content.match(/export\s+const\s+dynamic\s*=\s*['"]force-static['"]/);
      if (!forceStaticMatch) {
        continue; // Skip files without force-static
      }

      const lineNumber = content.substring(0, forceStaticMatch.index || 0).split('\n').length;
      
      // Check for auth methods
      const authMethodsFound: string[] = [];
      for (const authMethod of AUTH_METHODS) {
        if (content.includes(authMethod)) {
          authMethodsFound.push(authMethod);
        }
      }

      // Check for database methods
      const dbMethodsFound: string[] = [];
      for (const dbMethod of DB_METHODS) {
        if (content.includes(dbMethod)) {
          dbMethodsFound.push(dbMethod);
        }
      }

      if (authMethodsFound.length > 0 || dbMethodsFound.length > 0) {
        issues.push({
          file: file.replace(/\\/g, '/'),
          line: lineNumber,
          usesAuth: authMethodsFound.length > 0,
          usesDatabase: dbMethodsFound.length > 0,
          authMethods: authMethodsFound,
          dbMethods: dbMethodsFound
        });
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  // Report findings
  if (issues.length === 0) {
    console.log('✅ No issues found! All routes with force-static are safe.\n');
    return;
  }

  console.log(`⚠️  Found ${issues.length} routes with force-static that use authentication or database:\n`);

  // Group by severity
  const critical = issues.filter(i => i.usesAuth && i.usesDatabase);
  const authOnly = issues.filter(i => i.usesAuth && !i.usesDatabase);
  const dbOnly = issues.filter(i => !i.usesAuth && i.usesDatabase);

  if (critical.length > 0) {
    console.log(`🔴 CRITICAL (${critical.length}): Uses both authentication AND database:`);
    critical.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`      Auth: ${issue.authMethods.join(', ')}`);
      console.log(`      DB: ${issue.dbMethods.slice(0, 3).join(', ')}${issue.dbMethods.length > 3 ? '...' : ''}`);
    });
    console.log('');
  }

  if (authOnly.length > 0) {
    console.log(`🟡 AUTH ONLY (${authOnly.length}): Uses authentication:`);
    authOnly.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`      Auth: ${issue.authMethods.join(', ')}`);
    });
    console.log('');
  }

  if (dbOnly.length > 0) {
    console.log(`🟡 DATABASE ONLY (${dbOnly.length}): Uses database queries:`);
    dbOnly.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`      DB: ${issue.dbMethods.slice(0, 3).join(', ')}${issue.dbMethods.length > 3 ? '...' : ''}`);
    });
    console.log('');
  }

  // Generate fix commands
  console.log('📝 Suggested fixes:\n');
  issues.forEach(issue => {
    const relativePath = issue.file.replace(/\\/g, '/');
    console.log(`   Change ${relativePath}:${issue.line} from 'force-static' to 'force-dynamic'`);
  });

  console.log('\n💡 Tip: Use search/replace to update all at once:');
  console.log('   Find: export const dynamic = \'force-static\';');
  console.log('   Replace: export const dynamic = \'force-dynamic\';');
  console.log('   (in files that match the patterns above)\n');
}

// Run the audit
auditRoutes().catch(console.error);

