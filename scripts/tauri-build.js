#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Tauri build process...');

try {
  // Set environment variables for desktop build
  process.env.NEXT_PUBLIC_IS_DESKTOP = 'true';
  process.env.NEXT_PUBLIC_USE_STATIC_EXPORT = 'true';
  process.env.NODE_ENV = 'production';
  process.env.TAURI_BUILD = 'true';
  process.env.ADRATA_VERBOSE_CONFIG = 'true';

  console.log('📦 Building Next.js frontend for desktop...');
  
  // Build the Next.js app
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Frontend build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
