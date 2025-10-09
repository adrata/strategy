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


// Font loading optimization
export const fontClassNames = `${inter.variable}`;
