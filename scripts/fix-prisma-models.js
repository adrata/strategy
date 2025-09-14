#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Model name mappings (incorrect -> correct)
const modelMappings = {
  'prisma.User': 'prisma.users',
  'prisma.user': 'prisma.users',
  'prisma.Lead': 'prisma.leads',
  'prisma.lead': 'prisma.leads',
  'prisma.Contact': 'prisma.contacts',
  'prisma.contact': 'prisma.contacts',
  'prisma.Account': 'prisma.accounts',
  'prisma.account': 'prisma.accounts',
  'prisma.Opportunity': 'prisma.opportunities',
  'prisma.opportunity': 'prisma.opportunities',
  'prisma.Company': 'prisma.accounts', // Assuming Company maps to accounts
  'prisma.company': 'prisma.accounts',
};

// Function to recursively find TypeScript/JavaScript files
function findSourceFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Function to fix a single file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = 0;
    
    // Apply all model mappings
    for (const [incorrect, correct] of Object.entries(modelMappings)) {
      const regex = new RegExp(incorrect.replace('.', '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, correct);
        changes += matches.length;
      }
    }
    
    // Write back if changes were made
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${changes} model references in ${filePath}`);
      return changes;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Main execution
function main() {
  console.log('🔧 Starting Prisma model name fixes...\n');
  
  const sourceDir = path.join(__dirname, '..', 'src');
  const files = findSourceFiles(sourceDir);
  
  console.log(`📁 Found ${files.length} source files to process\n`);
  
  let totalChanges = 0;
  let filesChanged = 0;
  
  for (const file of files) {
    const changes = fixFile(file);
    if (changes > 0) {
      totalChanges += changes;
      filesChanged++;
    }
  }
  
  console.log(`\n🎉 Fix complete!`);
  console.log(`📊 Files modified: ${filesChanged}`);
  console.log(`📊 Total model references fixed: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log('\n🔄 Running TypeScript check to verify fixes...');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      console.log('✅ TypeScript compilation successful!');
    } catch (error) {
      console.log('⚠️  Some TypeScript errors remain - check the output above');
    }
  }
}

if (require.main === module) {
  main();
}

