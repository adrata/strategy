#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Tauri Desktop Build Process...');

try {
  // Set environment variables for desktop build
  process.env.NEXT_PUBLIC_IS_DESKTOP = 'true';
  process.env.NEXT_PUBLIC_USE_STATIC_EXPORT = 'true';
  process.env.NODE_ENV = 'production';
  process.env.TAURI_BUILD = 'true';
  process.env.ADRATA_VERBOSE_CONFIG = 'true';

  console.log('📦 Building Next.js frontend for desktop (static export)...');
  
  // Find all API route files that don't have dynamic configuration
  console.log('🔍 Scanning API routes for dynamic configuration...');
  
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const routeFiles = [];
  
  function findRouteFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findRouteFiles(fullPath);
      } else if (item === 'route.ts') {
        routeFiles.push(fullPath);
      }
    }
  }
  
  findRouteFiles(apiDir);
  
  // Check which files need dynamic configuration
  const filesNeedingConfig = [];
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('export const dynamic')) {
      filesNeedingConfig.push(file);
    }
  }
  
  console.log(`📊 Found ${routeFiles.length} API route files`);
  console.log(`⚠️  ${filesNeedingConfig.length} files need dynamic configuration`);
  
  // Create backup directory and temporarily add dynamic configs
  const backupDir = path.join(__dirname, '..', 'api-backups');
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true });
  }
  fs.mkdirSync(backupDir, { recursive: true });
  
  console.log('💾 Creating backups and adding dynamic configurations...');
  
  for (const file of filesNeedingConfig) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Create backup
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    const backupPath = path.join(backupDir, relativePath);
    const backupDirPath = path.dirname(backupPath);
    fs.mkdirSync(backupDirPath, { recursive: true });
    fs.writeFileSync(backupPath, content);
    
    // Add dynamic configuration
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the right place to insert (after imports)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('//') || lines[i].trim() === '') {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    
    // Insert dynamic configuration
    lines.splice(insertIndex, 0, '', '// Required for static export compatibility', 'export const dynamic = \'force-dynamic\';');
    
    fs.writeFileSync(file, lines.join('\n'));
  }
  
  console.log(`✅ Added dynamic configuration to ${filesNeedingConfig.length} files`);
  
  // Create desktop-optimized Next.js config
  const desktopConfig = `
// ADRATA DESKTOP BUILD CONFIGURATION
const isDesktop = process.env.TAURI_BUILD === 'true';

const nextConfig = {
  // Static export for Tauri
  output: 'export',
  trailingSlash: true,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Disable TypeScript and ESLint errors for desktop build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Asset prefix for desktop - must start with slash
  assetPrefix: isDesktop ? '/' : undefined,
  
  // Disable server-side features
  experimental: {
    optimizeCss: true,
    cssChunking: 'strict',
    optimizePackageImports: [
      '@heroicons/react',
      '@radix-ui/react-progress',
      'lucide-react',
      'react-hook-form',
      'date-fns',
      'clsx',
      'swr'
    ],
  },
  
  // Webpack configuration for desktop
  webpack: (config, { dev, isServer }) => {
    // Handle Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      "node:crypto": false,
      "node:fs": false,
      "node:path": false,
      "node:util": false,
      "node:stream": false,
      "node:events": false,
      "node:buffer": false,
      "node:url": false,
      "node:querystring": false,
    };
    
    // Desktop-specific optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              maxSize: 200000,
            },
          },
        },
        concatenateModules: true,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  }
};

export default nextConfig;
`;

  // Write temporary config
  fs.writeFileSync('next.config.desktop.mjs', desktopConfig);
  
  // Backup original config
  if (fs.existsSync('next.config.mjs')) {
    fs.copyFileSync('next.config.mjs', 'next.config.mjs.backup');
  }
  
  // Use desktop config
  fs.copyFileSync('next.config.desktop.mjs', 'next.config.mjs');
  
  console.log('🔧 Using desktop-optimized Next.js configuration...');
  
  // Build the Next.js app with static export
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Frontend build completed successfully!');
  
  // Restore original files
  console.log('🔄 Restoring original API route files...');
  for (const file of filesNeedingConfig) {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    const backupPath = path.join(backupDir, relativePath);
    fs.copyFileSync(backupPath, file);
  }
  
  // Clean up backups
  fs.rmSync(backupDir, { recursive: true });
  
  // Restore original config
  if (fs.existsSync('next.config.mjs.backup')) {
    fs.copyFileSync('next.config.mjs.backup', 'next.config.mjs');
    fs.unlinkSync('next.config.mjs.backup');
  }
  
  // Clean up temporary files
  if (fs.existsSync('next.config.desktop.mjs')) {
    fs.unlinkSync('next.config.desktop.mjs');
  }
  
  console.log('🎯 Desktop build process completed!');
  
} catch (error) {
  console.error('❌ Desktop build failed:', error.message);
  
  // Restore original files on error
  const backupDir = path.join(__dirname, '..', 'api-backups');
  if (fs.existsSync(backupDir)) {
    console.log('🔄 Restoring original files after error...');
    const filesNeedingConfig = [];
    
    function findRouteFiles(dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findRouteFiles(fullPath);
        } else if (item === 'route.ts') {
          filesNeedingConfig.push(fullPath);
        }
      }
    }
    
    findRouteFiles(path.join(__dirname, '..', 'src', 'app', 'api'));
    
    for (const file of filesNeedingConfig) {
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      const backupPath = path.join(backupDir, relativePath);
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, file);
      }
    }
    
    fs.rmSync(backupDir, { recursive: true });
  }
  
  // Restore original config on error
  if (fs.existsSync('next.config.mjs.backup')) {
    fs.copyFileSync('next.config.mjs.backup', 'next.config.mjs');
    fs.unlinkSync('next.config.mjs.backup');
  }
  
  process.exit(1);
}
