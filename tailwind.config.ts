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
      height: {
        'table-row': '64px',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      colors: {
        // CSS Variable Mappings - Core Theme Colors
        // These map to CSS variables set by the theme system
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        muted: {
          DEFAULT: "var(--muted)",
          light: "var(--muted-light)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        hover: "var(--hover)",
        "loading-bg": "var(--loading-bg)",
        "panel-background": "var(--panel-background)",
        "scrollbar-thumb": "var(--scrollbar-thumb)",
        
        // Shadcn Semantic Tokens (mapped to CSS variables)
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "var(--button-text)",
        },
        secondary: {
          DEFAULT: "var(--hover)",
          foreground: "var(--foreground)",
        },
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "var(--error-text)",
        },
        popover: {
          DEFAULT: "var(--background)",
          foreground: "var(--foreground)",
        },
        card: {
          DEFAULT: "var(--background)",
          foreground: "var(--foreground)",
        },
        input: "var(--border)",
        ring: "var(--focus-ring)",
        
        // Status Colors
        success: {
          DEFAULT: "var(--success)",
          bg: "var(--success-bg)",
          text: "var(--success-text)",
          border: "var(--success-border)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          bg: "var(--warning-bg)",
          text: "var(--warning-text)",
          border: "var(--warning-border)",
        },
        error: {
          DEFAULT: "var(--error)",
          bg: "var(--error-bg)",
          text: "var(--error-text)",
          border: "var(--error-border)",
        },
        info: {
          DEFAULT: "var(--info)",
          bg: "var(--info-bg)",
          text: "var(--info-text)",
          border: "var(--info-border)",
        },
        
        // Badge/Status Semantic Colors
        "status-new": {
          bg: "var(--status-new-bg)",
          text: "var(--status-new-text)",
        },
        "status-contacted": {
          bg: "var(--status-contacted-bg)",
          text: "var(--status-contacted-text)",
        },
        "status-qualified": {
          bg: "var(--status-qualified-bg)",
          text: "var(--status-qualified-text)",
        },
        "status-won": {
          bg: "var(--status-won-bg)",
          text: "var(--status-won-text)",
        },
        "status-lost": {
          bg: "var(--status-lost-bg)",
          text: "var(--status-lost-text)",
        },
        
        // Priority Colors
        "priority-high": {
          bg: "var(--priority-high-bg)",
          text: "var(--priority-high-text)",
        },
        "priority-medium": {
          bg: "var(--priority-medium-bg)",
          text: "var(--priority-medium-text)",
        },
        "priority-low": {
          bg: "var(--priority-low-bg)",
          text: "var(--priority-low-text)",
        },
        
        // Button Colors
        "button-text": "var(--button-text)",
        "button-background": "var(--button-background)",
        "button-hover": "var(--button-hover)",
        "button-active": "var(--button-active)",
        
        // Special Elements
        "active-app-border": "var(--active-app-border)",
        "overlay-bg": "var(--overlay-bg)",
        
        // High Contrast Colors
        "high-contrast": {
          bg: "var(--high-contrast-bg)",
          fg: "var(--high-contrast-fg)",
          border: "var(--high-contrast-border)",
          accent: "var(--high-contrast-accent)",
        },
        
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
        // Category-specific color schemes (kept for direct access, but prefer category utilities)
        category: {
          speedrun: {
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
          leads: {
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
          prospects: {
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
          opportunities: {
            50: '#EEF2FF',
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#6366F1',
            600: '#4F46E5',
            700: '#4338CA',
            800: '#3730A3',
            900: '#312E81',
          },
          people: {
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
          companies: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
