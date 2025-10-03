#!/usr/bin/env node

/**
 * SECURITY FIX SCRIPT
 * 
 * Automatically fixes vulnerable API endpoints by adding proper authentication
 * and removing security through obscurity patterns.
 */

const fs = require('fs');
const path = require('path');

// List of vulnerable endpoints that need to be fixed
const vulnerableEndpoints = [
  'src/app/api/data/companies/route.ts',
  'src/app/api/data/opportunities/route.ts',
  'src/app/api/data/clients/route.ts',
  'src/app/api/data/counts/route.ts',
  'src/app/api/data/search/route.ts',
  'src/app/api/data/section/route.ts',
  'src/app/api/data/unified/route.ts',
  'src/app/api/notes/route.ts',
  'src/app/api/pipeline/dashboard/route.ts',
  'src/app/api/intelligence/unified/route.ts',
  'src/app/api/enrichment/unified/route.ts',
  'src/app/api/email/link/route.ts',
  'src/app/api/email/comprehensive-link/route.ts',
  'src/app/api/email/cloud-processor/route.ts',
  'src/app/api/email/sync/route.ts',
  'src/app/api/workspace/users/route.ts',
  'src/app/api/speedrun/check-signals/route.ts',
  'src/app/api/speedrun/prospects/route.ts',
  'src/app/api/data/buyer-groups/route.ts',
  'src/app/api/data/buyer-groups/fast/route.ts',
  'src/app/api/data/master-ranking/route.ts',
  'src/app/api/data/unified-master-ranking/route.ts',
  'src/app/api/analyze-5bars-buyer-group/route.ts',
  'src/app/api/enhance-5bars/route.ts',
  'src/app/api/data-quality/audit/route.ts',
  'src/app/api/companies/by-name/[name]/route.ts',
  'src/app/api/zoho/notifications/route.ts'
];

// Security patterns to replace
const securityPatterns = [
  {
    name: 'Query Parameter Authentication',
    pattern: /const\s+{\s*searchParams\s*}\s*=\s*new\s+URL\(request\.url\);\s*const\s+workspaceId\s*=\s*searchParams\.get\(['"]workspaceId['"]\);\s*const\s+userId\s*=\s*searchParams\.get\(['"]userId['"]\);\s*if\s*\(\s*!workspaceId\s*\|\|\s*!userId\s*\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?{[\s\S]*?status:\s*400[\s\S]*?}\);\s*}/g,
    replacement: `// 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;`
  },
  {
    name: 'Missing Authentication Check',
    pattern: /if\s*\(\s*!workspaceId\s*\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?{[\s\S]*?status:\s*400[\s\S]*?}\);\s*}/g,
    replacement: `// Authentication is handled by middleware and secure-api-helper`
  },
  {
    name: 'Development TODO Comments',
    pattern: /\/\/\s*For\s+now,\s+allow\s+access[\s\S]*?TODO:[\s\S]*?unified\s+auth\s+system[\s\S]*?/g,
    replacement: `// SECURITY: Proper authentication implemented via secure-api-helper`
  }
];

// Import statements to add
const requiredImports = `import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';`;

// Response patterns to replace
const responsePatterns = [
  {
    name: 'Basic Error Response',
    pattern: /return\s+NextResponse\.json\(\s*{\s*success:\s*false,\s*error:\s*['"][^'"]*['"]\s*}\s*,\s*{\s*status:\s*\d+\s*}\s*\);/g,
    replacement: `return createErrorResponse('$1', '$2', $3);`
  },
  {
    name: 'Basic Success Response',
    pattern: /return\s+NextResponse\.json\(\s*{\s*success:\s*true,[\s\S]*?}\s*\);/g,
    replacement: `return createSuccessResponse(data, meta);`
  }
];

function fixEndpoint(filePath) {
  console.log(`🔧 Fixing endpoint: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add required imports if not present
  if (!content.includes('getSecureApiContext')) {
    // Find the last import statement
    const importRegex = /import\s+.*?from\s+['"][^'"]*['"];?\s*\n/g;
    const imports = content.match(importRegex) || [];
    const lastImportIndex = content.lastIndexOf(imports[imports.length - 1]) + imports[imports.length - 1].length;
    
    content = content.slice(0, lastImportIndex) + 
              '\n' + requiredImports + '\n' + 
              content.slice(lastImportIndex);
    modified = true;
  }

  // Apply security pattern fixes
  securityPatterns.forEach(pattern => {
    if (pattern.pattern.test(content)) {
      content = content.replace(pattern.pattern, pattern.replacement);
      console.log(`✅ Applied fix: ${pattern.name}`);
      modified = true;
    }
  });

  // Apply response pattern fixes
  responsePatterns.forEach(pattern => {
    if (pattern.pattern.test(content)) {
      content = content.replace(pattern.pattern, pattern.replacement);
      console.log(`✅ Applied fix: ${pattern.name}`);
      modified = true;
    }
  });

  if (modified) {
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    console.log(`📁 Created backup: ${backupPath}`);
    
    // Write fixed content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🔐 Starting security fix process...\n');
  
  let fixedCount = 0;
  let totalCount = vulnerableEndpoints.length;
  
  vulnerableEndpoints.forEach(endpoint => {
    if (fixEndpoint(endpoint)) {
      fixedCount++;
    }
    console.log(''); // Add spacing
  });
  
  console.log(`\n🎯 Security fix complete!`);
  console.log(`📊 Fixed ${fixedCount} out of ${totalCount} endpoints`);
  
  if (fixedCount > 0) {
    console.log('\n⚠️  IMPORTANT: Review all changes before committing!');
    console.log('🔍 Run tests to ensure functionality is preserved.');
    console.log('🧹 Remove .backup files after verification.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixEndpoint, vulnerableEndpoints, securityPatterns };
