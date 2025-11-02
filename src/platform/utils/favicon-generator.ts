/**
 * Dynamic Favicon Generator
 * Creates circular favicons with app letters, client initials, and color themes
 */

export interface AppTheme {
  letter: string;
  color: string;
  name: string;
}

export const APP_THEMES: Record<string, AppTheme> = {
  // Revenue-OS (revenue-os grouping: speedrun, leads, partners, companies, etc.)
  // Professional sales/revenue platform - Blue for trust and business
  'revenue-os': {
    letter: 'R',
    color: '#dbeafe', // blue-100 (light blue background)
    name: 'Revenue-OS'
  },
  // Stacks - Development backlog and issue management - Orange for technical tools
  'stacks': {
    letter: 'S',
    color: '#fed7aa', // orange-200 (light orange background)
    name: 'Stacks'
  },
  // Oasis - Communication/collaboration hub - Cyan/Teal for communication
  'oasis': {
    letter: 'O',
    color: '#cffafe', // cyan-100 (light cyan background)
    name: 'Oasis'
  },
  // Workbench (workshop) - Document management and creative work - Purple for creativity
  'workbench': {
    letter: 'W',
    color: '#ede9fe', // violet-100 (light purple background)
    name: 'Workbench'
  },
  // Legacy: RevenueOS (pipeline apps) - keeping for backwards compatibility
  'acquisition': {
    letter: 'A',
    color: '#dbeafe', // blue-100 (light blue background)
    name: 'RevenueOS'
  },
  // Workshop - keeping for backwards compatibility, but workbench takes precedence
  'workshop': {
    letter: 'W', 
    color: '#ede9fe', // violet-100 (light purple background)
    name: 'Workshop'
  },
  // Database
  'database': {
    letter: 'D',
    color: '#d1fae5', // emerald-100 (light green background)
    name: 'Database'
  },
  // Grand Central - Integration hub and workflow builder - Amber for connectivity and energy
  'grand-central': {
    letter: 'G',
    color: '#fef3c7', // amber-100 (light amber background)
    name: 'Grand Central'
  },
  // Olympus
  'olympus': {
    letter: 'O',
    color: '#cffafe', // cyan-100 (light cyan background)
    name: 'Olympus'
  },
  // Tower
  'tower': {
    letter: 'T',
    color: '#fce7f3', // pink-100 (light pink background)
    name: 'Tower'
  },
  // Adrata - Main platform dashboard - Indigo for premium/main platform
  'default': {
    letter: 'A',
    color: '#e0e7ff', // indigo-100 (light indigo background)
    name: 'Adrata'
  }
};

/**
 * Get the appropriate text color for a given background color
 */
function getTextColorForBackground(backgroundColor: string): string {
  const colorMap: Record<string, string> = {
    '#dbeafe': '#1e40af', // blue-100 -> blue-800 (Revenue-OS)
    '#fed7aa': '#c2410c', // orange-200 -> orange-800 (Stacks)
    '#cffafe': '#155e75', // cyan-100 -> cyan-800 (Oasis)
    '#ede9fe': '#5b21b6', // violet-100 -> violet-800 (Workbench)
    '#fef3c7': '#92400e', // amber-100 -> amber-800 (Grand Central)
    '#e0e7ff': '#3730a3', // indigo-100 -> indigo-800 (Adrata)
    '#bfdbfe': '#1e3a8a', // blue-200 -> blue-900 (legacy)
    '#93c5fd': '#1e3a8a', // blue-300 -> blue-900 (legacy)
    '#60a5fa': '#1e3a8a', // blue-400 -> blue-900 (legacy)
    '#d1fae5': '#065f46', // emerald-100 -> emerald-800
    '#fce7f3': '#be185d', // pink-100 -> rose-700
  };
  
  return colorMap[backgroundColor] || '#374151'; // fallback to gray-700
}

/**
 * Generate initials from workspace name
 * Extracts first letter of each word (e.g., "ZeroPoint" → "ZP", "Acme Corp" → "AC")
 */
export function generateInitials(workspaceName: string): string {
  if (!workspaceName || typeof workspaceName !== 'string') {
    return '';
  }
  
  // Clean the workspace name and split by spaces
  const words = workspaceName.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return '';
  }
  
  // Extract first letter of each word, up to 2 characters
  const initials = words
    .slice(0, 2) // Take first 2 words max
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials;
}

/**
 * Generate a squircle favicon with centered text (letter or initials)
 */
export function generateFavicon(text: string, color: string, size: number = 32): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = size;
  canvas.height = size;

  // Draw squircle background (rounded square)
  ctx.fillStyle = color;
  ctx.beginPath();
  
  // Create a squircle using rounded rectangle with high corner radius
  const cornerRadius = size * 0.25; // 25% of size for nice squircle effect
  const x = 0;
  const y = 0;
  const width = size;
  const height = size;
  
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + width - cornerRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  ctx.lineTo(x + width, y + height - cornerRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  ctx.lineTo(x + cornerRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();
  ctx.fill();

  // Draw text in center with better positioning
  const textColor = getTextColorForBackground(color);
  ctx.fillStyle = textColor;
  
  // Adjust font size based on text length and character width
  const isWideLetter = ['G', 'O', 'Q', 'W', 'M'].includes(text);
  const isTwoCharacters = text.length === 2;
  
  let fontSize: number;
  if (isTwoCharacters) {
    // Smaller font for 2 characters to fit better
    fontSize = Math.floor(size * 0.35);
  } else if (isWideLetter) {
    // Smaller font for wide single characters
    fontSize = Math.floor(size * 0.35);
  } else {
    // Standard font size for single characters
    fontSize = Math.floor(size * 0.45);
  }
  
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic'; // Use alphabetic baseline for better positioning
  
  // Adjust vertical position to account for font metrics
  const textY = size / 2 + (size * 0.15); // Move down slightly to center better
  ctx.fillText(text, size / 2, textY);

  return canvas.toDataURL('image/png');
}

/**
 * Update the favicon in the document head
 */
export function updateFavicon(dataUrl: string): void {
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  existingLinks.forEach(link => link.remove());

  // Create new favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = dataUrl;
  
  document.head.appendChild(link);
}

/**
 * Get app theme based on pathname
 */
export function getAppThemeFromPath(pathname: string): AppTheme {
  // Remove workspace slug from pathname
  const cleanPath = pathname.replace(/^\/[^\/]+/, '') || '/';
  
  // Check for Stacks (must check before revenue-os since stacks is in the grouping)
  if (cleanPath.includes('/stacks')) {
    return APP_THEMES.stacks;
  }
  
  // Check for Oasis (must check before revenue-os since oasis is in the grouping)
  if (cleanPath.includes('/oasis')) {
    return APP_THEMES.oasis;
  }
  
  // Check for Workbench/Workshop
  if (cleanPath.includes('/workshop')) {
    return APP_THEMES.workbench;
  }
  
  // Check for revenue-os grouping (speedrun, leads, partners, companies, etc.)
  const revenueOsRoutes = [
    '/speedrun', '/opportunities', '/leads', '/prospects', 
    '/companies', '/people', '/clients', '/sellers', '/partners',
    '/chronicle', '/metrics', '/dashboard'
  ];
  
  for (const route of revenueOsRoutes) {
    if (cleanPath.includes(route)) {
      return APP_THEMES['revenue-os'];
    }
  }
  
  // Check for other specific app routes
  if (cleanPath.includes('/database')) {
    return APP_THEMES.database;
  }
  
  if (cleanPath.includes('/grand-central')) {
    return APP_THEMES['grand-central'];
  }
  
  if (cleanPath.includes('/olympus')) {
    return APP_THEMES.olympus;
  }
  
  if (cleanPath.includes('/tower')) {
    return APP_THEMES.tower;
  }
  
  // Default fallback
  return APP_THEMES.default;
}
