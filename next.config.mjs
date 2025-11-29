
// ADRATA DESKTOP BUILD CONFIGURATION
// NOTE: withBotId removed - it was causing 405 errors on API routes in production
// The Vercel BotID wrapper adds rewrites and potentially middleware that interferes
// with POST requests to API routes. If bot protection is needed, configure it
// at the Vercel dashboard level instead, or use checkBotId() selectively on specific routes.

const isDesktop = process.env.TAURI_BUILD === 'true';

const nextConfig = {
  // Enable static export for Tauri desktop builds
  output: isDesktop ? 'export' : undefined,
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
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    cssChunking: 'strict',
    // Tree-shake and optimize these packages for smaller bundles
    optimizePackageImports: [
      '@heroicons/react',
      '@radix-ui/react-progress',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'react-hook-form',
      'date-fns',
      'clsx',
      'swr',
      'framer-motion',
      'zod',
      '@tanstack/react-table',
    ],
    // Enable partial prerendering for better TTFB
    ppr: false, // Keep false until ready for experimental feature
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
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
    
    // Disable PostCSS for desktop builds to avoid autoprefixer issues
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('css')) {
        rule.use = rule.use?.map((use) => {
          if (typeof use === 'object' && use.loader && use.loader.includes('postcss')) {
            return {
              ...use,
              options: {
                ...use.options,
                postcssOptions: {
                  plugins: ['tailwindcss'], // Only use tailwindcss, skip autoprefixer
                },
              },
            };
          }
          return use;
        });
      }
    });
    
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
              test: /[\/]node_modules[\/]/,
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

// Export config directly - withBotId wrapper removed due to 405 errors on API routes
export default nextConfig;
