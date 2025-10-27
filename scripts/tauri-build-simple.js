#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tauri Desktop Build Process...');

try {
  // Set environment variables for desktop build
  process.env.NEXT_PUBLIC_IS_DESKTOP = 'true';
  process.env.NEXT_PUBLIC_USE_STATIC_EXPORT = 'true';
  process.env.NODE_ENV = 'production';
  process.env.TAURI_BUILD = 'true';
  process.env.ADRATA_VERBOSE_CONFIG = 'true';

  console.log('📦 Building Next.js frontend for desktop (static export)...');
  
  // Build the Next.js app with static export
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Frontend build completed successfully!');
  console.log('🎯 Desktop build process completed!');
  
} catch (error) {
  console.error('❌ Desktop build failed:', error.message);
  process.exit(1);
}
