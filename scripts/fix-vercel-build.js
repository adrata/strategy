#!/usr/bin/env node

/**
 * Post-build script for Vercel deployment
 * This script runs after the Next.js build completes successfully
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 [POST-BUILD] Running Vercel build fixes...');

// Fix missing client reference manifest files
const serverAppDir = path.join(process.cwd(), '.next/server/app');
const websiteDir = path.join(serverAppDir, '(website)');

try {
  // Ensure the (website) directory exists
  if (fs.existsSync(websiteDir)) {
    const manifestFile = path.join(websiteDir, 'page_client-reference-manifest.js');
    
    // Create empty manifest file if it doesn't exist
    if (!fs.existsSync(manifestFile)) {
      console.log('🔧 [POST-BUILD] Creating missing client reference manifest...');
      fs.writeFileSync(manifestFile, '// Auto-generated client reference manifest\nmodule.exports = {};\n');
      console.log('✅ [POST-BUILD] Client reference manifest created');
    }
  }
} catch (error) {
  console.warn('⚠️ [POST-BUILD] Could not fix client reference manifest:', error.message);
  // Don't fail the build for this issue
}

console.log('✅ [POST-BUILD] Vercel build fixes completed successfully');

process.exit(0);
