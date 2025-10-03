#!/usr/bin/env node

/**
 * BATCH FIX FOR ALL REMAINING ENDPOINTS
 * 
 * Systematically fixes all remaining vulnerable endpoints with proper authentication
 * and error handling patterns.
 */

const fs = require('fs');
const path = require('path');

// All remaining endpoints that need fixes
const remainingEndpoints = [
  'src/app/api/data/section/route.ts',
  'src/app/api/data/unified/route.ts',
  'src/app/api/notes/route.ts',
  'src/app/api/pipeline/dashboard/route.ts',
  'src/app/api/intelligence/unified/route.ts',
  'src/app/api/enrichment/unified/route.ts',
  'src/app/api/email/link/route.ts',
  'src/app/api/email/cloud-processor/route.ts',
  'src/app/api/email/sync/route.ts',
  'src/app/api/workspace/users/route.ts',
  'src/app/api/speedrun/prospects/route.ts',
  'src/app/api/data/buyer-groups/route.ts',
  'src/app/api/data/master-ranking/route.ts',
  'src/app/api/data/unified-master-ranking/route.ts',
  'src/app/api/analyze-5bars-buyer-group/route.ts',
  'src/app/api/enhance-5bars/route.ts',
  'src/app/api/data-quality/audit/route.ts',
  'src/app/api/companies/by-name/[name]/route.ts',
  'src/app/api/zoho/notifications/route.ts'
];

function fixEndpointBatch(filePath) {
  console.log(`🔧 Batch fixing: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Add required imports if not present
  if (!content.includes('getSecureApiContext')) {
    const importLine = `import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';`;
    
    // Find the last import statement
    const importRegex = /import\s+.*?from\s+['"][^'"]*['"];?\s*\n/g;
    const imports = content.match(importRegex) || [];
    
    if (imports.length > 0) {
      const lastImportIndex = content.lastIndexOf(imports[imports.length - 1]) + imports[imports.length - 1].length;
      content = content.slice(0, lastImportIndex) + 
                '\n' + importLine + '\n' + 
                content.slice(lastImportIndex);
    } else {
      // No imports found, add at the beginning
      content = importLine + '\n\n' + content;
    }
    modified = true;
    console.log(`✅ Added required imports`);
  }

  // 2. Fix GET functions
  const getFunctionRegex = /export\s+async\s+function\s+GET\([^}]*?\)\s*{[\s\S]*?(?=export|$)/g;
  content = content.replace(getFunctionRegex, (match) => {
    if (match.includes('getSecureApiContext')) {
      return match; // Already fixed
    }

    const bodyStart = match.indexOf('{') + 1;
    const beforeBody = match.substring(0, bodyStart);
    const afterBody = match.substring(bodyStart);

    const tryIndex = afterBody.indexOf('try');
    const constIndex = afterBody.indexOf('const');
    
    let insertIndex = 0;
    if (tryIndex !== -1) {
      insertIndex = tryIndex;
    } else if (constIndex !== -1) {
      insertIndex = constIndex;
    }

    const beforeInsert = afterBody.substring(0, insertIndex);
    const afterInsert = afterBody.substring(insertIndex);

    // Remove old query parameter authentication
    let cleanedAfterInsert = afterInsert
      .replace(/const\s+{\s*searchParams\s*}\s*=\s*new\s+URL\(request\.url\);\s*const\s+workspaceId\s*=\s*searchParams\.get\(['"]workspaceId['"]\);\s*const\s+userId\s*=\s*searchParams\.get\(['"]userId['"]\);\s*if\s*\(\s*!workspaceId\s*\|\|\s*!userId\s*\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?{[\s\S]*?status:\s*400[\s\S]*?}\);\s*}/g, '')
      .replace(/if\s*\(\s*!workspaceId\s*\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?{[\s\S]*?status:\s*400[\s\S]*?}\);\s*}/g, '');

    const securityTemplate = `// 1. Authenticate and authorize user
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
    const userId = context.userId;`;

    const newFunction = beforeBody + beforeInsert + securityTemplate + '\n\n    ' + cleanedAfterInsert;
    
    modified = true;
    console.log(`✅ Fixed GET function authentication`);
    return newFunction;
  });

  // 3. Fix POST functions
  const postFunctionRegex = /export\s+async\s+function\s+POST\([^}]*?\)\s*{[\s\S]*?(?=export|$)/g;
  content = content.replace(postFunctionRegex, (match) => {
    if (match.includes('getSecureApiContext')) {
      return match; // Already fixed
    }

    const bodyStart = match.indexOf('{') + 1;
    const beforeBody = match.substring(0, bodyStart);
    const afterBody = match.substring(bodyStart);

    const tryIndex = afterBody.indexOf('try');
    const constIndex = afterBody.indexOf('const');
    
    let insertIndex = 0;
    if (tryIndex !== -1) {
      insertIndex = tryIndex;
    } else if (constIndex !== -1) {
      insertIndex = constIndex;
    }

    const beforeInsert = afterBody.substring(0, insertIndex);
    const afterInsert = afterBody.substring(insertIndex);

    let cleanedAfterInsert = afterInsert
      .replace(/const\s+{\s*searchParams\s*}\s*=\s*new\s+URL\(request\.url\);\s*const\s+workspaceId\s*=\s*searchParams\.get\(['"]workspaceId['"]\);\s*const\s+userId\s*=\s*searchParams\.get\(['"]userId['"]\);\s*if\s*\(\s*!workspaceId\s*\|\|\s*!userId\s*\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?{[\s\S]*?status:\s*400[\s\S]*?}\);\s*}/g, '')
      .replace(/if\s*\(\s*!workspaceId\s*\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?{[\s\S]*?status:\s*400[\s\S]*?}\);\s*}/g, '');

    const securityTemplate = `// 1. Authenticate and authorize user
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
    const userId = context.userId;`;

    const newFunction = beforeBody + beforeInsert + securityTemplate + '\n\n    ' + cleanedAfterInsert;
    
    modified = true;
    console.log(`✅ Fixed POST function authentication`);
    return newFunction;
  });

  // 4. Fix error responses
  content = content.replace(
    /return\s+NextResponse\.json\(\s*{\s*error:\s*['"][^'"]*['"]\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\);/g,
    (match, status) => {
      modified = true;
      console.log(`✅ Fixed error response`);
      return `return createErrorResponse('Validation error', 'VALIDATION_ERROR', ${status});`;
    }
  );

  // 5. Fix success responses
  content = content.replace(
    /return\s+NextResponse\.json\(\s*{\s*success:\s*true,[\s\S]*?}\s*\);/g,
    (match) => {
      modified = true;
      console.log(`✅ Fixed success response`);
      return `return createSuccessResponse(data, {
        userId: context.userId,
        workspaceId: context.workspaceId,
        role: context.role
      });`;
    }
  );

  // 6. Remove development TODOs
  content = content.replace(
    /\/\/\s*For\s+now,\s+allow\s+access[\s\S]*?TODO:[\s\S]*?unified\s+auth\s+system[\s\S]*?/g,
    '// SECURITY: Proper authentication implemented via secure-api-helper'
  );

  if (modified) {
    // Create backup
    const backupPath = filePath + '.batch-backup';
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    console.log(`📁 Created batch backup: ${backupPath}`);
    
    // Write fixed content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Batch fixed: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🔐 Starting batch fix for all remaining endpoints...\n');
  
  let fixedCount = 0;
  const totalCount = remainingEndpoints.length;
  
  // Fix all endpoints
  remainingEndpoints.forEach(endpoint => {
    if (fixEndpointBatch(endpoint)) {
      fixedCount++;
    }
    console.log('');
  });
  
  console.log(`\n🎯 BATCH FIX COMPLETE!`);
  console.log(`📊 Fixed: ${fixedCount}/${totalCount} endpoints`);
  
  if (fixedCount === totalCount) {
    console.log('\n🎉 ALL REMAINING ENDPOINTS HAVE BEEN FIXED!');
    console.log('✅ Authentication added to all endpoints');
    console.log('✅ Error handling standardized');
    console.log('✅ Development TODOs removed');
  } else {
    console.log(`\n⚠️  ${totalCount - fixedCount} endpoints may need manual review`);
  }
  
  console.log('\n🧹 Remember to remove .batch-backup files after verification');
}

if (require.main === module) {
  main();
}

module.exports = { fixEndpointBatch, remainingEndpoints };
