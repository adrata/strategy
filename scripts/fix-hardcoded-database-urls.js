#!/usr/bin/env node

/**
 * 🔧 Fix Hardcoded Database URLs
 * 
 * This script removes all hardcoded database URL fallbacks from the codebase
 * and replaces them with proper environment variable validation.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that contain hardcoded database URLs
const FILES_TO_FIX = [
  'src/app/api/chat-sessions/route.ts',
  'src/platform/ai/services/AIDataService.ts', 
  'src/app/api/chat/route-original.ts',
  'src/app/api/speedrun/action-log/route.ts',
  'src/platform/services/StrategicMemoryEngine.ts',
  'src/app/api/data/leads/route.ts',
  'src/app/api/data/accounts/route.ts',
  'src/app/api/data/companies/route.ts',
  'src/app/api/data/contacts/route.ts'
];

// The hardcoded database URL pattern to find and replace
const HARDCODED_DB_URL = 'postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require';

async function fixFile(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  
  try {
    console.log(`🔧 Fixing ${filePath}...`);
    
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Check if file contains the hardcoded URL
    if (!content.includes(HARDCODED_DB_URL)) {
      console.log(`   ✅ ${filePath} - No hardcoded URLs found`);
      return;
    }
    
    // Replace the hardcoded pattern with proper validation
    const updatedContent = content.replace(
      /process\.env\.DATABASE_URL \|\| "postgresql:\/\/neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3\.eastus2\.azure\.neon\.tech\/neondb\?sslmode=require"/g,
      'process.env.DATABASE_URL'
    );
    
    // Add validation if not already present
    let finalContent = updatedContent;
    if (!content.includes('if (!process.env.DATABASE_URL)') && 
        !content.includes('DATABASE_URL environment variable is required')) {
      
      // Find the import section and add validation after it
      const lines = finalContent.split('\n');
      let insertIndex = 0;
      
      // Find the last import line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].startsWith('const ') && lines[i].includes('require(')) {
          insertIndex = i + 1;
        }
      }
      
      // Insert validation
      const validation = [
        '',
        '// Validate required environment variables',
        'if (!process.env.DATABASE_URL) {',
        '  throw new Error("DATABASE_URL environment variable is required");',
        '}'
      ];
      
      lines.splice(insertIndex, 0, ...validation);
      finalContent = lines.join('\n');
    }
    
    await fs.writeFile(fullPath, finalContent);
    console.log(`   ✅ ${filePath} - Fixed hardcoded database URLs`);
    
  } catch (error) {
    console.error(`   ❌ ${filePath} - Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Fixing hardcoded database URLs...\n');
  
  for (const filePath of FILES_TO_FIX) {
    await fixFile(filePath);
  }
  
  console.log('\n✅ All files processed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Test all API endpoints to ensure they work with environment variables');
  console.log('   2. Update your .env files with the correct DATABASE_URL');
  console.log('   3. Remove any remaining hardcoded credentials from other files');
}

main().catch(console.error);
