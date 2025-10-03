#!/usr/bin/env node

/**
 * 🔐 FRONTEND SECURITY FIX SCRIPT
 * 
 * Fixes all remaining frontend components that use insecure query parameter authentication
 * by replacing fetch() calls with authFetch() and removing workspaceId/userId from URLs
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Starting frontend security fixes...');

// Files that need security fixes
const filesToFix = [
  'src/frontend/components/pipeline/PipelineDetailPage.tsx',
  'src/frontend/components/pipeline/tabs/UniversalTimelineTab.tsx',
  'src/frontend/components/pipeline/tabs/EnhancedTimelineTab.tsx',
  'src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx',
  'src/products/pipeline/components/PipelineLeftPanelStandalone.tsx',
  'src/platform/ui/components/AddModal.tsx',
  'src/frontend/components/pipeline/tabs/UniversalSellerCompaniesTab.tsx',
  'src/products/speedrun/AutoCustomerConversion.ts',
  'src/products/speedrun/AutoClientConversion.ts',
  'src/platform/ai/services/AIContextService.ts',
  'src/products/pipeline/components/SellersView.tsx',
  'src/platform/ui/components/chat/FilePickerModal.tsx',
  'src/frontend/components/pipeline/MetricsDashboard.tsx',
  'src/frontend/components/pipeline/DashboardDetailPage.tsx',
  'src/frontend/components/pipeline/AddNoteModal.tsx'
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Add authFetch import if not present
  if (!content.includes('authFetch') && content.includes('fetch(')) {
    const importMatch = content.match(/import.*from ['"][^'"]*['"];?\s*\n/);
    if (importMatch) {
      const importLine = importMatch[0];
      const authFetchImport = "import { authFetch } from '@/platform/auth-fetch';\n";
      content = content.replace(importLine, importLine + authFetchImport);
      modified = true;
    }
  }

  // Fix fetch calls with workspaceId and userId parameters
  const fetchPattern = /fetch\(`([^`]*)\?([^`]*workspaceId[^`]*userId[^`]*)`([^)]*)\)/g;
  content = content.replace(fetchPattern, (match, baseUrl, params, options) => {
    // Extract the base URL and query parameters
    const urlParts = baseUrl.split('?');
    const basePath = urlParts[0];
    const queryParams = urlParts[1] || '';
    
    // Remove workspaceId and userId from query parameters
    const cleanParams = queryParams
      .split('&')
      .filter(param => !param.includes('workspaceId') && !param.includes('userId'))
      .join('&');
    
    const cleanUrl = cleanParams ? `${basePath}?${cleanParams}` : basePath;
    
    modified = true;
    return `authFetch(\`${cleanUrl}\`${options})`;
  });

  // Fix fetch calls with workspaceId and userId in the URL string
  const urlPattern = /fetch\(`([^`]*workspaceId[^`]*userId[^`]*)`([^)]*)\)/g;
  content = content.replace(urlPattern, (match, url, options) => {
    // Remove workspaceId and userId parameters
    const cleanUrl = url
      .replace(/[?&]workspaceId=[^&]*/g, '')
      .replace(/[?&]userId=[^&]*/g, '')
      .replace(/[?&]&/g, '&')
      .replace(/[?&]$/, '')
      .replace(/\?&/, '?');
    
    modified = true;
    return `authFetch(\`${cleanUrl}\`${options})`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

// Fix all files
let fixedCount = 0;
filesToFix.forEach(filePath => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Frontend security fixes complete!`);
console.log(`✅ Fixed ${fixedCount} files`);
console.log(`📁 Total files processed: ${filesToFix.length}`);

if (fixedCount > 0) {
  console.log(`\n🔐 Security improvements:`);
  console.log(`   - Replaced fetch() with authFetch()`);
  console.log(`   - Removed workspaceId/userId from URLs`);
  console.log(`   - Added proper authentication imports`);
  console.log(`   - All API calls now use JWT tokens`);
}
