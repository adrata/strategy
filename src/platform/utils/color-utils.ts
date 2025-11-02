/**
 * Unified Color Utility System
 * 
 * Provides consistent, type-safe access to colors throughout the application.
 * All colors flow from CSS variables set by the theme system.
 */

import { getCategoryColors, type CategoryColorScheme } from '@/platform/config/color-palette';

// ==================== TYPES ====================

export type ColorProperty = 'bg' | 'text' | 'border';
export type CategoryType = 'speedrun' | 'leads' | 'prospects' | 'opportunities' | 'people' | 'companies';

// ==================== CORE COLOR UTILITIES ====================

/**
 * Get Tailwind color class for a CSS variable property
 * 
 * @param property - CSS variable name (e.g., 'background', 'foreground')
 * @param variant - Optional variant (e.g., 'bg', 'text', 'border')
 * @returns Tailwind class string
 * 
 * @example
 * getTailwindColorClass('background', 'bg') // Returns 'bg-background'
 */
export function getTailwindColorClass(property: string, variant: ColorProperty = 'bg'): string {
  // Convert kebab-case to camelCase for Tailwind
  const tailwindName = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return `${variant}-${tailwindName}`;
}

/**
 * Get Tailwind class for a nested color property
 * 
 * @param base - Base color name (e.g., 'success', 'status-new')
 * @param property - Property name (e.g., 'bg', 'text', 'border')
 * @returns Tailwind class string
 * 
 * @example
 * getNestedColorClass('success', 'bg') // Returns 'bg-success-bg'
 */
export function getNestedColorClass(base: string, property: string): string {
  const tailwindName = base.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return `${property}-${tailwindName}-${property}`;
}

// ==================== CATEGORY COLOR UTILITIES ====================

/**
 * Get category color Tailwind classes
 * 
 * @param category - Category name
 * @param type - Color property type
 * @returns Tailwind class string for the category color
 * 
 * @example
 * getCategoryColorClass('speedrun', 'bg') // Returns 'bg-category-speedrun-50' (or appropriate shade)
 */
export function getCategoryColorClass(
  category: string,
  type: ColorProperty = 'bg'
): string {
  const colors = getCategoryColors(category);
  
  switch (type) {
    case 'bg':
      return `bg-[${colors.bg}]`;
    case 'text':
      return `text-[${colors.text}]`;
    case 'border':
      return `border-[${colors.border}]`;
    default:
      return `bg-[${colors.bg}]`;
  }
}

/**
 * Get full category color scheme as Tailwind classes
 * 
 * @param category - Category name
 * @returns Object with all category color Tailwind classes
 */
export function getCategoryTailwindClasses(category: string) {
  const colors = getCategoryColors(category);
  
  return {
    bg: `bg-[${colors.bg}]`,
    bgHover: `hover:bg-[${colors.bgHover}]`,
    border: `border-[${colors.border}]`,
    text: `text-[${colors.text}]`,
    textLight: `text-[${colors.textLight}]`,
    icon: `text-[${colors.icon}]`,
    iconBg: `bg-[${colors.iconBg}]`,
    buttonPrimary: `bg-[${colors.primary}] hover:bg-[${colors.dark}] text-white`,
    buttonSecondary: `bg-[${colors.light}] hover:bg-[${colors.bgHover}] text-[${colors.text}] border-[${colors.border}]`,
  };
}

/**
 * Get category color value (hex) for inline styles or dynamic usage
 * 
 * @param category - Category name
 * @param property - Color property from CategoryColorScheme
 * @returns Hex color value
 */
export function getCategoryColorValue(
  category: string,
  property: keyof CategoryColorScheme
): string {
  const colors = getCategoryColors(category);
  return colors[property];
}

// ==================== STATUS COLOR UTILITIES ====================

/**
 * Get status color Tailwind classes using theme variables
 * 
 * @param status - Status string
 * @returns Tailwind class string
 * 
 * @example
 * getStatusColorClass('new') // Returns 'bg-status-new-bg text-status-new-text'
 */
export function getStatusColorClass(status?: string): string {
  if (!status) return 'bg-hover text-foreground';
  
  const statusLower = status.toLowerCase();
  
  // Map statuses to theme semantic colors
  if (['new', 'new lead', 'discovery'].includes(statusLower)) {
    return 'bg-status-new-bg text-status-new-text';
  }
  if (['contacted', 'warm', 'prospect'].includes(statusLower)) {
    return 'bg-status-contacted-bg text-status-contacted-text';
  }
  if (['qualified', 'active', 'hot', 'won'].includes(statusLower)) {
    return 'bg-status-qualified-bg text-status-qualified-text';
  }
  if (['won', 'closed-won'].includes(statusLower)) {
    return 'bg-status-won-bg text-status-won-text';
  }
  if (['lost', 'closed-lost', 'cold', 'closed'].includes(statusLower)) {
    return 'bg-status-lost-bg text-status-lost-text';
  }
  
  // Default fallback
  return 'bg-hover text-foreground';
}

// ==================== PRIORITY COLOR UTILITIES ====================

/**
 * Get priority color Tailwind classes using theme variables
 * 
 * @param priority - Priority string (high, medium, low)
 * @returns Tailwind class string
 * 
 * @example
 * getPriorityColorClass('high') // Returns 'bg-priority-high-bg text-priority-high-text'
 */
export function getPriorityColorClass(priority?: string): string {
  if (!priority) return 'bg-hover text-foreground';
  
  const priorityLower = priority.toLowerCase();
  
  if (priorityLower === 'high') {
    return 'bg-priority-high-bg text-priority-high-text';
  }
  if (priorityLower === 'medium' || priorityLower === 'normal') {
    return 'bg-priority-medium-bg text-priority-medium-text';
  }
  if (priorityLower === 'low') {
    return 'bg-priority-low-bg text-priority-low-text';
  }
  
  // Default fallback
  return 'bg-hover text-foreground';
}

// ==================== STAGE COLOR UTILITIES ====================

/**
 * Get stage color Tailwind classes
 * Uses category colors where appropriate, falls back to status colors
 * 
 * @param stage - Stage string
 * @param category - Optional category for better color matching
 * @returns Tailwind class string
 */
export function getStageColorClass(stage?: string, category?: string): string {
  if (!stage) return 'bg-hover text-foreground';
  
  const stageLower = stage.toLowerCase().replace(/\s+/g, '-');
  
  // Use category colors if category is provided
  if (category) {
    const categoryColors = getCategoryColors(category);
    
    if (['lead', 'new'].includes(stageLower)) {
      return `bg-[${categoryColors.bg}] text-[${categoryColors.text}]`;
    }
    if (['prospect', 'contacted', 'qualified'].includes(stageLower)) {
      return `bg-[${categoryColors.bgHover}] text-[${categoryColors.text}]`;
    }
    if (['opportunity'].includes(stageLower)) {
      return `bg-[${categoryColors.light}] text-[${categoryColors.text}]`;
    }
  }
  
  // Fall back to status colors
  return getStatusColorClass(stage);
}

// ==================== COMPOSED UTILITIES ====================

/**
 * Get complete badge/pill styling classes
 * Combines background, text, and border colors
 * 
 * @param type - Type of badge (status, priority, category)
 * @param value - Value/identifier
 * @param options - Additional options
 * @returns Complete Tailwind class string
 */
export function getBadgeClasses(
  type: 'status' | 'priority' | 'category',
  value: string,
  options: {
    category?: string;
    withBorder?: boolean;
  } = {}
): string {
  let baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  
  let colorClasses = '';
  
  switch (type) {
    case 'status':
      colorClasses = getStatusColorClass(value);
      break;
    case 'priority':
      colorClasses = getPriorityColorClass(value);
      break;
    case 'category':
      if (options.category) {
        colorClasses = getCategoryColorClass(options.category, 'bg') + ' ' + 
                      getCategoryColorClass(options.category, 'text');
        if (options.withBorder) {
          colorClasses += ' ' + getCategoryColorClass(options.category, 'border');
        }
      }
      break;
  }
  
  if (options.withBorder && !colorClasses.includes('border')) {
    colorClasses += ' border border-border';
  }
  
  return `${baseClasses} ${colorClasses}`.trim();
}

// ==================== EXPORT ====================

export {
  type CategoryType,
  type ColorProperty,
};

