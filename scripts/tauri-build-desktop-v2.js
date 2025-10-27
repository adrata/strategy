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
  
  // Create backup directory for API routes
  const apiBackupDir = path.join(__dirname, '..', 'src', 'app', 'api-backup');
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  
  console.log('🔄 Temporarily moving API routes for static build...');
  
  // Move API routes to backup directory
  if (fs.existsSync(apiDir)) {
    if (fs.existsSync(apiBackupDir)) {
      fs.rmSync(apiBackupDir, { recursive: true });
    }
    fs.renameSync(apiDir, apiBackupDir);
    console.log('✅ API routes moved to backup directory');
  }
  
  // Create a minimal API directory with a placeholder
  fs.mkdirSync(apiDir, { recursive: true });
  
  // Create desktop API fallback
  const desktopApiFallback = `
export default function DesktopAPIFallback() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Desktop API Mode</h1>
      <p>API routes are handled by Tauri commands in desktop mode.</p>
    </div>
  );
}
`;
  
  fs.writeFileSync(path.join(apiDir, 'desktop-fallback.tsx'), desktopApiFallback);
  
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
  
  // Restore API routes
  console.log('🔄 Restoring API routes...');
  if (fs.existsSync(apiBackupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true });
    }
    fs.renameSync(apiBackupDir, apiDir);
    console.log('✅ API routes restored');
  }
  
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
  
  // Restore API routes on error
  const apiBackupDir = path.join(__dirname, '..', 'src', 'app', 'api-backup');
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  
  if (fs.existsSync(apiBackupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true });
    }
    fs.renameSync(apiBackupDir, apiDir);
    console.log('✅ API routes restored after error');
  }
  
  // Restore original config on error
  if (fs.existsSync('next.config.mjs.backup')) {
    fs.copyFileSync('next.config.mjs.backup', 'next.config.mjs');
    fs.unlinkSync('next.config.mjs.backup');
  }
  
  process.exit(1);
}
