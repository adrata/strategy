
// ADRATA DESKTOP BUILD CONFIGURATION
const isDesktop = process.env.TAURI_BUILD === 'true';

const nextConfig = {
  // Use regular build mode for web app
  // output: 'export', // Commented out for web app
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

export default nextConfig;
