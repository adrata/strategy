// 2025 Font Optimization with next/font
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

// Primary font - Inter with optimal loading
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevents layout shift
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
  // Optimize for performance
  adjustFontFallback: true,
});

// Monospace font for code - Temporarily disabled to fix initialization issues
// export const jetbrainsMono = JetBrains_Mono({
//   subsets: ['latin'],
//   display: 'swap',
//   preload: false,
//   variable: '--font-mono',
//   fallback: ['Consolas', 'Monaco', 'monospace'],
//   weight: ['400', '500', '600', '700'],
// });

// Custom local font if needed
export const customFont = localFont({
  src: [
    {
      path: '../public/fonts/custom-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/custom-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-custom',
  fallback: ['system-ui', 'arial'],
});

// Font loading optimization
export const fontClassNames = `${inter.variable}`;
