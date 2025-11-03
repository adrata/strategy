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
  // API - API keys and integrations - Gray for technical/neutral
  'api': {
    letter: 'A',
    color: '#f3f4f6', // gray-100 (light gray background)
    name: 'API'
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
    '#f3f4f6': '#374151', // gray-100 -> gray-700 (API Area)
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

  // Enable anti-aliasing for smoother edges
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clip the drawing area first to ensure nothing goes outside canvas bounds
  ctx.beginPath();
  ctx.rect(0, 0, size, size);
  ctx.clip();
  
  // Draw squircle background (perfect superellipse)
  // A squircle is a superellipse with n=4: |x/a|^4 + |y/b|^4 = 1
  ctx.fillStyle = color;
  ctx.beginPath();
  
  // Calculate squircle points using parametric formula
  // For squircle: x = a * sign(cos(t)) * |cos(t)|^(2/n), y = b * sign(sin(t)) * |sin(t)|^(2/n)
  // With n=4, this simplifies to: x = a * sign(cos(t)) * sqrt(|cos(t)|), y = b * sign(sin(t)) * sqrt(|sin(t)|)
  const center = size / 2;
  // Add minimal padding (1.5 pixels) to prevent clipping while maximizing size
  // This accounts for anti-aliasing and sub-pixel rendering
  const padding = 1.5;
  const a = size / 2 - padding; // Half-width with minimal padding to prevent clipping
  const b = size / 2 - padding; // Half-height with minimal padding to prevent clipping
  const n = 4; // Squircle exponent
  
  // Draw squircle using parametric equation
  // Sample enough points for perfectly smooth curve (64 points is sufficient for 32x32 favicons)
  const numPoints = 64;
  
  // Helper function to calculate squircle point at angle t
  const getSquirclePoint = (t: number): [number, number] => {
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    
    // Squircle parametric equation (n=4)
    // x = a * sign(cos(t)) * |cos(t)|^(2/n), y = b * sign(sin(t)) * |sin(t)|^(2/n)
    const signX = cosT >= 0 ? 1 : -1;
    const signY = sinT >= 0 ? 1 : -1;
    const absCos = Math.abs(cosT);
    const absSin = Math.abs(sinT);
    
    const x = center + a * signX * Math.pow(absCos, 2 / n);
    const y = center + b * signY * Math.pow(absSin, 2 / n);
    
    return [x, y];
  };
  
  // Start at rightmost point (t=0)
  const [startX, startY] = getSquirclePoint(0);
  ctx.moveTo(startX, startY);
  
  // Draw smooth curve by connecting points
  // With 64 points, the line segments are small enough to appear perfectly smooth
  for (let i = 1; i <= numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    const [x, y] = getSquirclePoint(t);
    ctx.lineTo(x, y);
  }
  
  ctx.closePath();
  ctx.fill();

  // Draw text in center with better positioning
  const textColor = getTextColorForBackground(color);
  ctx.fillStyle = textColor;
  
  // Adjust font size based on text length and character width
  // Increased font sizes by ~15% to make letters bigger
  const isWideLetter = ['G', 'O', 'Q', 'W', 'M'].includes(text);
  const isTwoCharacters = text.length === 2;
  
  let fontSize: number;
  if (isTwoCharacters) {
    // Bigger font for 2 characters (increased from 0.35 to 0.40)
    fontSize = Math.floor(size * 0.40);
  } else if (isWideLetter) {
    // Bigger font for wide single characters (increased from 0.35 to 0.40)
    fontSize = Math.floor(size * 0.40);
  } else {
    // Bigger standard font size for single characters (increased from 0.45 to 0.52)
    fontSize = Math.floor(size * 0.52);
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
  
  if (cleanPath.includes('/api')) {
    return APP_THEMES.api;
  }
  
  // Default fallback
  return APP_THEMES.default;
}
