/**
 * Color Palette Configuration for Adrata Categories
 * 
 * This file defines the color schemes for each category in the Adrata platform.
 * Each category has a primary color with variations for different UI states.
 */

export interface CategoryColorScheme {
  primary: string;
  secondary: string;
  light: string;
  dark: string;
  bg: string;
  bgHover: string;
  border: string;
  text: string;
  textLight: string;
  icon: string;
  iconBg: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColorScheme> = {
  speedrun: {
    primary: '#059669', // Emerald-600 - Growth, success, forward momentum
    secondary: '#10B981', // Emerald-500
    light: '#D1FAE5', // Emerald-100
    dark: '#047857', // Emerald-700
    bg: '#ECFDF5', // Emerald-50
    bgHover: '#D1FAE5', // Emerald-100
    border: '#6EE7B7', // Emerald-300
    text: '#064E3B', // Emerald-800
    textLight: '#10B981', // Emerald-500
    icon: '#059669', // Emerald-600
    iconBg: '#D1FAE5', // Emerald-100
  },
  leads: {
    primary: '#EAB308', // Yellow-600 - Optimism, energy, potential
    secondary: '#FACC15', // Yellow-500
    light: '#FEF3C7', // Yellow-100
    dark: '#CA8A04', // Yellow-700
    bg: '#FEFCE8', // Yellow-50
    bgHover: '#FEF3C7', // Yellow-100
    border: '#FDE047', // Yellow-300
    text: '#713F12', // Yellow-800
    textLight: '#FACC15', // Yellow-500
    icon: '#EAB308', // Yellow-600
    iconBg: '#FEF3C7', // Yellow-100
  },
  prospects: {
    primary: '#EA580C', // Orange-600 - Enthusiasm, warmth, creativity
    secondary: '#F97316', // Orange-500
    light: '#FED7AA', // Orange-100
    dark: '#C2410C', // Orange-700
    bg: '#FFF7ED', // Orange-50
    bgHover: '#FED7AA', // Orange-100
    border: '#FDBA74', // Orange-300
    text: '#9A3412', // Orange-800
    textLight: '#F97316', // Orange-500
    icon: '#EA580C', // Orange-600
    iconBg: '#FED7AA', // Orange-100
  },
  opportunities: {
    primary: '#2563EB', // Blue-600 - Trust, professionalism, reliability
    secondary: '#3B82F6', // Blue-500
    light: '#DBEAFE', // Blue-100
    dark: '#1D4ED8', // Blue-700
    bg: '#EFF6FF', // Blue-50
    bgHover: '#DBEAFE', // Blue-100
    border: '#93C5FD', // Blue-300
    text: '#1E40AF', // Blue-800
    textLight: '#3B82F6', // Blue-500
    icon: '#2563EB', // Blue-600
    iconBg: '#DBEAFE', // Blue-100
  },
  people: {
    primary: '#7C3AED', // Violet-600 - Individuality, creativity, uniqueness
    secondary: '#8B5CF6', // Violet-500
    light: '#EDE9FE', // Violet-100
    dark: '#6D28D9', // Violet-700
    bg: '#F5F3FF', // Violet-50
    bgHover: '#EDE9FE', // Violet-100
    border: '#C4B5FD', // Violet-300
    text: '#5B21B6', // Violet-800
    textLight: '#8B5CF6', // Violet-500
    icon: '#7C3AED', // Violet-600
    iconBg: '#EDE9FE', // Violet-100
  },
  companies: {
    primary: '#6B7280', // Gray-500 - Stability, professionalism, balance
    secondary: '#9CA3AF', // Gray-400
    light: '#F3F4F6', // Gray-100
    dark: '#374151', // Gray-700
    bg: '#F9FAFB', // Gray-50
    bgHover: '#F3F4F6', // Gray-100
    border: '#D1D5DB', // Gray-300
    text: '#111827', // Gray-900
    textLight: '#6B7280', // Gray-500
    icon: '#6B7280', // Gray-500
    iconBg: '#F3F4F6', // Gray-100
  },
};

/**
 * Get the color scheme for a specific category
 */
export function getCategoryColors(category: string): CategoryColorScheme {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['speedrun'];
}

/**
 * Get Tailwind classes for a category's color scheme
 */
export function getCategoryTailwindClasses(category: string) {
  const colors = getCategoryColors(category);
  
  return {
    // Background classes
    bg: `bg-[${colors.bg}]`,
    bgHover: `hover:bg-[${colors.bgHover}]`,
    
    // Border classes
    border: `border-[${colors.border}]`,
    
    // Text classes
    text: `text-[${colors.text}]`,
    textLight: `text-[${colors.textLight}]`,
    
    // Icon classes
    icon: `text-[${colors.icon}]`,
    iconBg: `bg-[${colors.iconBg}]`,
    
    // Button classes
    buttonPrimary: `bg-[${colors.primary}] hover:bg-[${colors.dark}] text-white`,
    buttonSecondary: `bg-[${colors.light}] hover:bg-[${colors.bgHover}] text-[${colors.text}] border-[${colors.border}]`,
  };
}

/**
 * Category descriptions for reference
 */
export const CATEGORY_DESCRIPTIONS = {
  speedrun: "Drive revenue",
  leads: "Cold relationships", 
  prospects: "Warm relationships",
  opportunities: "Real Pipeline",
  people: "Individual entities",
  companies: "Business entities",
} as const;
