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
      },
    },
  },
  plugins: [],
};

export default config;
