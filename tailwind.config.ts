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
    },
  },
  plugins: [],
};

export default config;
