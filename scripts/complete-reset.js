#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧹 Starting complete development environment reset...');

try {
  // Step 1: Stop any running processes
  console.log('🛑 Stopping any running processes...');
  try {
    execSync('pkill -f "next dev"', { stdio: 'ignore' });
    execSync('pkill -f "npm run dev"', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors if no processes were running
  }

  // Step 2: Clear Next.js caches
  console.log('🗑️  Clearing Next.js caches...');
  const cacheDirs = [
    '.next',
    '.turbo',
    'node_modules/.cache',
    '.eslintcache'
  ];

  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`   Removing ${dir}...`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Step 3: Clear TypeScript build cache
  console.log('🗑️  Clearing TypeScript build cache...');
  const tsCacheFiles = [
    'tsconfig.tsbuildinfo',
    '*.tsbuildinfo'
  ];

  tsCacheFiles.forEach(pattern => {
    try {
      execSync(`find . -name "${pattern}" -delete`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors
    }
  });

  // Step 4: Clear npm cache
  console.log('🗑️  Clearing npm cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch (e) {
    console.log('   npm cache clear failed, continuing...');
  }

  // Step 5: Clear all temporary files
  console.log('🗑️  Clearing temporary files...');
  const tempPatterns = [
    '*.log',
    '*.tmp',
    '*.temp',
    '.DS_Store'
  ];

  tempPatterns.forEach(pattern => {
    try {
      execSync(`find . -name "${pattern}" -delete`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors
    }
  });

  // Step 6: Verify critical files are correct
  console.log('🔍 Verifying critical files...');
  
  // Check leads API route
  const leadsRoutePath = 'src/app/api/data/leads/[id]/route.ts';
  if (fs.existsSync(leadsRoutePath)) {
    const content = fs.readFileSync(leadsRoutePath, 'utf8');
    if (content.includes('const { id } = await params;')) {
      console.log('   ✅ Leads API route: CORRECT (await params)');
    } else {
      console.log('   ❌ Leads API route: STILL HAS OLD SYNTAX');
    }
  }

  // Check accounts API route
  const accountsRoutePath = 'src/app/api/data/accounts/[id]/route.ts';
  if (fs.existsSync(accountsRoutePath)) {
    const content = fs.readFileSync(accountsRoutePath, 'utf8');
    if (content.includes('const { id } = await params;')) {
      console.log('   ✅ Accounts API route: CORRECT (await params)');
    } else {
      console.log('   ❌ Accounts API route: STILL HAS OLD SYNTAX');
    }
  }

  // Check unified API route
  const unifiedRoutePath = 'src/app/api/data/unified/route.ts';
  if (fs.existsSync(unifiedRoutePath)) {
    const content = fs.readFileSync(unifiedRoutePath, 'utf8');
    if (content.includes('assignedUserId: \'dano\'')) {
      console.log('   ❌ Unified API route: STILL HAS OLD DANO REFERENCES');
    } else {
      console.log('   ✅ Unified API route: CLEAN (no old dano references)');
    }
  }

  // Step 7: Reinstall dependencies (optional but recommended)
  console.log('📦 Reinstalling dependencies...');
  try {
    execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
    execSync('npm install', { stdio: 'inherit' });
  } catch (e) {
    console.log('   Dependency reinstall failed, continuing...');
  }

  console.log('\n🎯 Complete reset finished!');
  console.log('\n📋 Next steps:');
  console.log('   1. Start development server: npm run dev');
  console.log('   2. Test lead page: /ne/pipeline/leads/[any-lead-id]');
  console.log('   3. Test contact page: /ne/pipeline/contacts/[any-contact-id]');
  console.log('   4. Verify left panel shows: Accounts: 150');
  
  console.log('\n🚀 Ready for clean development environment!');

} catch (error) {
  console.error('❌ Reset failed:', error);
  process.exit(1);
}
