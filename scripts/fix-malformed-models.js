#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix malformed model names with extra 's' characters
const malformedMappings = {
  'prisma.leadsssss': 'prisma.leads',
  'prisma.leadssss': 'prisma.leads',
  'prisma.leadsss': 'prisma.leads',
  'prisma.leadss': 'prisma.leads',
  'prisma.contactsssss': 'prisma.contacts',
  'prisma.contactssss': 'prisma.contacts',
  'prisma.contactsss': 'prisma.contacts',
  'prisma.contactss': 'prisma.contacts',
  'prisma.usersssss': 'prisma.users',
  'prisma.userssss': 'prisma.users',
  'prisma.usersss': 'prisma.users',
  'prisma.userss': 'prisma.users',
  'prisma.accountsssss': 'prisma.accounts',
  'prisma.accountssss': 'prisma.accounts',
  'prisma.accountsss': 'prisma.accounts',
  'prisma.accountss': 'prisma.accounts',
  'prisma.opportunitiesssss': 'prisma.opportunities',
  'prisma.opportunitiessss': 'prisma.opportunities',
  'prisma.opportunitiesss': 'prisma.opportunities',
  'prisma.opportunitiess': 'prisma.opportunities',
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
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Function to fix malformed model names in a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = 0;
    
    // Apply all malformed mappings
    for (const [malformed, correct] of Object.entries(malformedMappings)) {
      const regex = new RegExp(malformed.replace(/\./g, '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, correct);
        changes += matches.length;
      }
    }
    
    // Write back if changes were made
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${changes} malformed model references in ${filePath}`);
      return changes;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Main function
function main() {
  console.log('🔧 Fixing malformed Prisma model names...\n');
  
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
  console.log(`📊 Total fixes applied: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log('\n🔄 Running TypeScript check to verify fixes...');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      console.log('✅ TypeScript compilation successful!');
    } catch (error) {
      console.log('⚠️ TypeScript compilation still has errors - additional fixes may be needed');
    }
  }
}

if (require.main === module) {
  main();
}
