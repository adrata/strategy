#!/usr/bin/env node

/**
 * Database Credential Rotation Script
 * 
 * This script helps you rotate Neon database credentials securely:
 * 1. Guides you through creating a new user in Neon Console
 * 2. Tests the new credentials
 * 3. Updates all configuration files
 * 4. Verifies the application works
 * 5. Guides you to delete the old user
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Files that need to be updated (critical config files)
const CRITICAL_FILES = [
  'scripts/config/environments.js',
  'scripts/deploy-neon-optimizations-to-vercel.js',
  'scripts/set-vercel-env-vars.js',
];

// Pattern to find old credentials
const OLD_CREDENTIAL_PATTERNS = [
  /neondb_owner/g,
  /npg_DtnFYHvWj6m8/g,
  /ep-damp-math-a8ht5oj3\.eastus2\.azure\.neon\.tech/g,
];

async function testDatabaseConnection(databaseUrl) {
  console.log('\n🔍 Testing new database connection...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });

    await prisma.$connect();
    console.log('✅ Connection successful!');

    // Test basic queries
    const userCount = await prisma.users.count();
    console.log(`✅ Users table accessible: ${userCount} users found`);

    const workspaceCount = await prisma.workspaces.count();
    console.log(`✅ Workspaces table accessible: ${workspaceCount} workspaces found`);

    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

function constructDatabaseUrl(username, password, host, database) {
  return `postgresql://${username}:${password}@${host}/${database}?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000`;
}

function updateFile(filePath, oldPattern, newValue) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Update the specific pattern
    if (typeof oldPattern === 'string') {
      content = content.replace(new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newValue);
    } else {
      content = content.replace(oldPattern, newValue);
    }

    if (content !== originalContent) {
      // Create backup
      const backupPath = `${fullPath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, originalContent);
      console.log(`   📝 Backup created: ${backupPath}`);

      // Write updated content
      fs.writeFileSync(fullPath, content);
      console.log(`   ✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`   ⚠️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

async function updateEnvironmentFile(databaseUrl) {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');

  const filesToUpdate = [envPath, envLocalPath].filter(f => fs.existsSync(f));

  if (filesToUpdate.length === 0) {
    console.log('\n⚠️  No .env files found. Creating .env file...');
    fs.writeFileSync(envPath, `DATABASE_URL="${databaseUrl}"\n`);
    console.log(`✅ Created .env file with new DATABASE_URL`);
    return;
  }

  for (const filePath of filesToUpdate) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Update or add DATABASE_URL
    if (content.includes('DATABASE_URL=')) {
      content = content.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`);
    } else {
      content += `\nDATABASE_URL="${databaseUrl}"\n`;
    }

    if (content !== originalContent) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, originalContent);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${path.basename(filePath)}`);
    }
  }
}

async function main() {
  console.log('🔐 DATABASE CREDENTIAL ROTATION');
  console.log('================================\n');

  console.log('📋 STEP 1: Create New Database User in Neon Console');
  console.log('---------------------------------------------------');
  console.log('1. Go to https://console.neon.tech');
  console.log('2. Select your project');
  console.log('3. Navigate to "Users" or "Connection Details"');
  console.log('4. Create a new database user');
  console.log('5. Copy the new credentials\n');

  const proceed = await question('Have you created the new user in Neon Console? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes') {
    console.log('\n❌ Please create the new user first, then run this script again.');
    rl.close();
    process.exit(1);
  }

  console.log('\n📝 STEP 2: Enter New Credentials');
  console.log('---------------------------------');

  const username = (await question('New database username: ')).trim();
  const password = (await question('New database password: ')).trim();
  const hostInput = await question('Database host (e.g., ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech): ');
  const host = hostInput ? hostInput.trim() : 'ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech';
  const databaseInput = await question('Database name (default: neondb): ');
  const database = databaseInput ? databaseInput.trim() : 'neondb';
  
  // Validate inputs
  if (!username || !password || !host || !database) {
    console.error('\n❌ ERROR: All fields are required. Please try again.');
    rl.close();
    process.exit(1);
  }
  
  console.log(`\n📋 Credentials entered:`);
  console.log(`   Username: ${username}`);
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);
  console.log(`   Password: ${'*'.repeat(password.length)}`);

  const newDatabaseUrl = constructDatabaseUrl(username, password, host, database);

  console.log('\n🔍 STEP 3: Testing New Credentials');
  console.log('-----------------------------------');
  const testPassed = await testDatabaseConnection(newDatabaseUrl);

  if (!testPassed) {
    console.log('\n❌ Connection test failed. Please verify your credentials and try again.');
    rl.close();
    process.exit(1);
  }

  console.log('\n📝 STEP 4: Updating Configuration Files');
  console.log('--------------------------------------');

  // Update .env files
  await updateEnvironmentFile(newDatabaseUrl);

  // Update critical config files
  let updatedCount = 0;
  for (const filePath of CRITICAL_FILES) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;

      // Update PROD_DATABASE_URL fallback in environments.js
      if (filePath.includes('environments.js')) {
        content = content.replace(
          /process\.env\.PROD_DATABASE_URL \|\| "postgresql:\/\/[^"]+"/g,
          `process.env.PROD_DATABASE_URL || "${newDatabaseUrl}"`
        );
      }

      // Update DATABASE_URL in deployment scripts
      if (filePath.includes('deploy-neon-optimizations-to-vercel.js') || filePath.includes('set-vercel-env-vars.js')) {
        content = content.replace(
          /'DATABASE_URL':\s*'postgresql:\/\/[^']+'/g,
          `'DATABASE_URL': '${newDatabaseUrl}'`
        );
      }

      if (content !== originalContent) {
        const backupPath = `${fullPath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, originalContent);
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated: ${filePath}`);
        updatedCount++;
      } else {
        console.log(`⚠️  No changes needed: ${filePath}`);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  }

  console.log(`\n✅ Updated ${updatedCount} critical configuration files`);

  console.log('\n📋 STEP 5: Additional Updates Needed');
  console.log('--------------------------------------');
  console.log('⚠️  The following files contain hardcoded credentials and should be updated:');
  console.log('   - scripts/audit/*.js (multiple audit scripts)');
  console.log('   - scripts/migrate-*.js (migration scripts)');
  console.log('   - scripts/debug-*.js (debug scripts)');
  console.log('   - src-desktop/build.rs (desktop build config)');
  console.log('\n💡 These are typically one-time scripts. Update them as needed when you use them.');

  console.log('\n📋 STEP 6: Update Vercel Environment Variables');
  console.log('-----------------------------------------------');
  console.log('1. Go to your Vercel project settings');
  console.log('2. Navigate to "Environment Variables"');
  console.log('3. Update DATABASE_URL with the new connection string');
  console.log('4. Redeploy your application');
  console.log(`\n   New DATABASE_URL: ${newDatabaseUrl}`);

  console.log('\n📋 STEP 7: Test Your Application');
  console.log('-------------------------------');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Test critical features (login, data access)');
  console.log('3. Verify everything works correctly');

  console.log('\n📋 STEP 8: Delete Old User (After Verification)');
  console.log('-------------------------------------------------');
  console.log('⚠️  IMPORTANT: Only delete the old user after confirming everything works!');
  console.log('1. Go to Neon Console');
  console.log('2. Navigate to "Users"');
  console.log('3. Delete the old user (neondb_owner)');
  console.log('4. This step is irreversible, so verify everything first!');

  console.log('\n✅ Credential rotation process completed!');
  console.log('\n📝 Summary:');
  console.log(`   - New username: ${username}`);
  console.log(`   - New host: ${host}`);
  console.log(`   - Database: ${database}`);
  console.log(`   - Files updated: ${updatedCount + 1} (including .env)`);
  console.log('\n🔐 Remember to update Vercel and delete the old user after testing!');

  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error during rotation:', error);
  rl.close();
  process.exit(1);
});

