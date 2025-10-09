import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/platform/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/operating-systems/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/products/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/upgrades/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/scripts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "monospace"],
      },
      letterSpacing: {
        'tighter': '-0.015em',
        'enterprise': '-0.025em',
      },
      colors: {
        // Custom navy color scheme based on #1B3758
        navy: {
          50: '#f0f4f8',   // Very light navy tint
          100: '#d9e2ec',  // Light navy tint
          200: '#bcccdc',  // Lighter navy
          300: '#9fb3c8',  // Light navy
          400: '#829ab1',  // Medium-light navy
          500: '#627d98',  // Medium navy
          600: '#486581',  // Medium-dark navy
          700: '#334e68',  // Dark navy
          800: '#243b53',  // Darker navy
          900: '#1B3758',  // Base navy color
          950: '#102a43',  // Darkest navy
        },
        // Category-specific color schemes
        category: {
          speedrun: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
            900: '#1E3A8A',
          },
          leads: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#064E3B',
            900: '#064E3B',
          },
          prospects: {
            50: '#FEF2F2',
            100: '#FEE2E2',
            200: '#FECACA',
            300: '#FCA5A5',
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
            700: '#B91C1C',
            800: '#991B1B',
            900: '#7F1D1D',
          },
          opportunities: {
            50: '#F5F3FF',
            100: '#EDE9FE',
            200: '#DDD6FE',
            300: '#C4B5FD',
            400: '#A78BFA',
            500: '#8B5CF6',
            600: '#7C3AED',
            700: '#6D28D9',
            800: '#5B21B6',
            900: '#4C1D95',
          },
          people: {
            50: '#FFF7ED',
            100: '#FED7AA',
            200: '#FDBA74',
            300: '#FB923C',
            400: '#F97316',
            500: '#EA580C',
            600: '#C2410C',
            700: '#9A3412',
            800: '#7C2D12',
            900: '#431407',
          },
          companies: {
            50: '#ECFEFF',
            100: '#A7F3D0',
            200: '#67E8F9',
            300: '#22D3EE',
            400: '#06B6D4',
            500: '#0891B2',
            600: '#0E7490',
            700: '#155E75',
            800: '#164E63',
            900: '#083344',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
