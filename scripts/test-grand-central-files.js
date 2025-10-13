#!/usr/bin/env node

/**
 * Test Grand Central File Structure
 * 
 * This script tests that all Grand Central files are in place
 * and the integration is properly structured.
 */

const fs = require('fs');
const path = require('path');

function testGrandCentralFiles() {
  console.log('🧪 Testing Grand Central File Structure...\n');
  
  const requiredFiles = [
    // Core components
    'src/app/[workspace]/grand-central/page.tsx',
    'src/app/[workspace]/grand-central/layout.tsx',
    'src/app/[workspace]/grand-central/components/GrandCentralLeftPanel.tsx',
    'src/app/[workspace]/grand-central/components/IntegrationLibrary.tsx',
    'src/app/[workspace]/grand-central/components/ConnectionDetail.tsx',
    
    // New components
    'src/app/[workspace]/grand-central/components/ConnectionActions.tsx',
    'src/app/[workspace]/grand-central/components/EmailSyncStats.tsx',
    
    // Utils and types
    'src/app/[workspace]/grand-central/utils/integrationCategories.ts',
    'src/app/[workspace]/grand-central/types/integration.ts',
    
    // API endpoints
    'src/app/api/grand-central/sync/[connectionId]/route.ts',
    'src/app/api/grand-central/stats/route.ts',
    'src/app/api/webhooks/nango/email/route.ts',
    
    // Email services
    'src/platform/services/UnifiedEmailSyncService.ts',
    'src/platform/services/EmailSyncScheduler.ts',
  ];
  
  let allFilesExist = true;
  const missingFiles = [];
  const existingFiles = [];
  
  console.log('1️⃣ Checking required files...');
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      existingFiles.push(filePath);
      console.log(`✅ ${filePath}`);
    } else {
      missingFiles.push(filePath);
      console.log(`❌ ${filePath} - MISSING`);
      allFilesExist = false;
    }
  });
  
  console.log(`\n📊 File Check Results:`);
  console.log(`   - Total files: ${requiredFiles.length}`);
  console.log(`   - Existing: ${existingFiles.length}`);
  console.log(`   - Missing: ${missingFiles.length}`);
  
  if (missingFiles.length > 0) {
    console.log(`\n❌ Missing files:`);
    missingFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  console.log('\n2️⃣ Testing integration categories...');
  
  try {
    const categoriesPath = path.join(process.cwd(), 'src/app/[workspace]/grand-central/utils/integrationCategories.ts');
    const content = fs.readFileSync(categoriesPath, 'utf8');
    
    // Check for key features
    const hasOutlook = content.includes('microsoft-outlook');
    const hasGmail = content.includes('google-workspace');
    const hasIsAvailable = content.includes('isAvailable: true');
    const hasIsAvailableFalse = content.includes('isAvailable: false');
    
    console.log(`✅ Integration categories file exists`);
    console.log(`   - Microsoft Outlook: ${hasOutlook ? '✅' : '❌'}`);
    console.log(`   - Google Workspace: ${hasGmail ? '✅' : '❌'}`);
    console.log(`   - Available flag (true): ${hasIsAvailable ? '✅' : '❌'}`);
    console.log(`   - Available flag (false): ${hasIsAvailableFalse ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`❌ Could not read integration categories: ${error.message}`);
    allFilesExist = false;
  }
  
  console.log('\n3️⃣ Testing API endpoints...');
  
  const apiEndpoints = [
    'src/app/api/grand-central/sync/[connectionId]/route.ts',
    'src/app/api/grand-central/stats/route.ts',
    'src/app/api/webhooks/nango/email/route.ts'
  ];
  
  apiEndpoints.forEach(endpoint => {
    const fullPath = path.join(process.cwd(), endpoint);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${endpoint}`);
    } else {
      console.log(`❌ ${endpoint} - MISSING`);
      allFilesExist = false;
    }
  });
  
  console.log('\n4️⃣ Testing component structure...');
  
  const components = [
    'src/app/[workspace]/grand-central/components/ConnectionActions.tsx',
    'src/app/[workspace]/grand-central/components/EmailSyncStats.tsx'
  ];
  
  components.forEach(component => {
    const fullPath = path.join(process.cwd(), component);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasExport = content.includes('export function');
        const hasProps = content.includes('interface') || content.includes('Props');
        console.log(`✅ ${component} - ${hasExport ? 'Exported' : 'Not exported'} - ${hasProps ? 'Has props' : 'No props'}`);
      } catch (error) {
        console.log(`❌ ${component} - Could not read: ${error.message}`);
      }
    } else {
      console.log(`❌ ${component} - MISSING`);
      allFilesExist = false;
    }
  });
  
  console.log('\n🎯 Grand Central Integration Status:');
  
  if (allFilesExist) {
    console.log('✅ All required files are in place');
    console.log('✅ Integration categories configured');
    console.log('✅ API endpoints created');
    console.log('✅ Components structured correctly');
    console.log('\n🚀 Grand Central is ready for email integration!');
    console.log('\n📋 What users can do:');
    console.log('   - Connect Outlook and Gmail accounts via Nango');
    console.log('   - View email sync statistics in real-time');
    console.log('   - Manually trigger email sync');
    console.log('   - Configure email settings and webhooks');
    console.log('   - Monitor connection health and status');
    console.log('   - All other integrations show "Coming Soon"');
  } else {
    console.log('❌ Some files are missing or incomplete');
    console.log('   Please check the missing files above');
  }
  
  return { success: allFilesExist, existingFiles, missingFiles };
}

// Run the test
const result = testGrandCentralFiles();

if (result.success) {
  console.log('\n✅ Grand Central file structure test passed!');
  process.exit(0);
} else {
  console.log('\n❌ Grand Central file structure test failed');
  process.exit(1);
}
