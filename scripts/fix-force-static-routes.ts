#!/usr/bin/env tsx

/**
 * Fix script to change force-static to force-dynamic in all routes that use auth/database
 * 
 * Usage: npm run tsx scripts/fix-force-static-routes.ts
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

async function fixRoutes(): Promise<void> {
  console.log('🔧 Fixing API routes: changing force-static to force-dynamic...\n');

  // Find all API route files
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  if (!fs.existsSync(apiDir)) {
    console.error('❌ API directory not found:', apiDir);
    return;
  }

  const routeFiles = findRouteFiles(apiDir);
  const fixedFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const file of routeFiles) {
    try {
      let content = fs.readFileSync(file, 'utf-8');
      
      // Check if file has force-static
      const forceStaticMatch = content.match(/export\s+const\s+dynamic\s*=\s*['"]force-static['"]/);
      if (!forceStaticMatch) {
        continue; // Skip files without force-static
      }

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

      // Only fix files that use auth or database
      if (authMethodsFound.length > 0 || dbMethodsFound.length > 0) {
        // Replace force-static with force-dynamic
        // Handle different comment styles
        const patterns = [
          /export\s+const\s+dynamic\s*=\s*['"]force-static['"]/g,
          /\/\/\s*Required\s+for\s+static\s+export.*?\n\s*export\s+const\s+dynamic\s*=\s*['"]force-static['"]/g,
          /\/\/\s*Required\s+for\s+static\s+export\s*\(desktop\s+build\)\s*\n\s*export\s+const\s+dynamic\s*=\s*['"]force-static['"]/g,
        ];

        let updated = false;
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            content = content.replace(pattern, (match) => {
              // Check if there's a comment line before it
              if (match.includes('Required for static export')) {
                return '// Force dynamic rendering for API routes (required for authentication and database queries)\nexport const dynamic = \'force-dynamic\';';
              }
              return 'export const dynamic = \'force-dynamic\';';
            });
            updated = true;
            break;
          }
        }

        // Fallback: simple replacement if patterns didn't match
        if (!updated) {
          content = content.replace(
            /export\s+const\s+dynamic\s*=\s*['"]force-static['"]/g,
            'export const dynamic = \'force-dynamic\';'
          );
        }

        // Write the updated file
        fs.writeFileSync(file, content, 'utf-8');
        
        const relativePath = file.replace(/\\/g, '/').replace(process.cwd().replace(/\\/g, '/') + '/', '');
        fixedFiles.push(relativePath);
        console.log(`✅ Fixed: ${relativePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing file ${file}:`, error);
      skippedFiles.push(file);
    }
  }

  // Report summary
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Fixed: ${fixedFiles.length} routes`);
  if (skippedFiles.length > 0) {
    console.log(`   ⚠️  Skipped: ${skippedFiles.length} routes`);
  }
  console.log('\n✨ All routes have been updated to use force-dynamic!\n');
}

// Run the fix
fixRoutes().catch(console.error);

