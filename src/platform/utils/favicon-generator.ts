/**
 * Dynamic Favicon Generator
 * Creates circular favicons with app letters and color themes
 */

export interface AppTheme {
  letter: string;
  color: string;
  name: string;
}

export const APP_THEMES: Record<string, AppTheme> = {
  // AcquisitionOS (pipeline apps)
  'acquisition': {
    letter: 'A',
    color: '#dbeafe', // blue-100 (light blue background)
    name: 'AcquisitionOS'
  },
  // Atrium
  'atrium': {
    letter: 'A', 
    color: '#ede9fe', // violet-100 (light purple background)
    name: 'Atrium'
  },
  // Database
  'database': {
    letter: 'D',
    color: '#d1fae5', // emerald-100 (light green background)
    name: 'Database'
  },
  // Grand Central
  'grand-central': {
    letter: 'G',
    color: '#fed7aa', // orange-200 (light orange background)
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
  // Default fallback
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
    '#dbeafe': '#1e40af', // blue-100 -> blue-800
    '#ede9fe': '#5b21b6', // violet-100 -> violet-800
    '#d1fae5': '#065f46', // emerald-100 -> emerald-800
    '#fed7aa': '#c2410c', // orange-200 -> orange-800
    '#cffafe': '#155e75', // cyan-100 -> cyan-800
    '#fce7f3': '#be185d', // pink-100 -> rose-700
    '#e0e7ff': '#3730a3', // indigo-100 -> indigo-800
  };
  
  return colorMap[backgroundColor] || '#374151'; // fallback to gray-700
}

/**
 * Generate a squircle favicon with centered letter
 */
export function generateFavicon(letter: string, color: string, size: number = 32): string {
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

  // Draw darker letter in center with better positioning
  const textColor = getTextColorForBackground(color);
  ctx.fillStyle = textColor;
  
  // Adjust font size based on letter width - wider letters need smaller font
  const isWideLetter = ['G', 'O', 'Q', 'W', 'M'].includes(letter);
  const fontSize = isWideLetter ? Math.floor(size * 0.35) : Math.floor(size * 0.45);
  
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic'; // Use alphabetic baseline for better positioning
  
  // Adjust vertical position to account for font metrics
  const textY = size / 2 + (size * 0.15); // Move down slightly to center better
  ctx.fillText(letter, size / 2, textY);

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
  
  // Check for specific app routes
  if (cleanPath.includes('/atrium')) {
    return APP_THEMES.atrium;
  }
  
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
  
  // Check for pipeline apps (AcquisitionOS)
  const pipelineApps = [
    '/speedrun', '/opportunities', '/leads', '/prospects', 
    '/companies', '/people', '/clients', '/sellers', 
    '/chronicle', '/stacks', '/oasis'
  ];
  
  for (const app of pipelineApps) {
    if (cleanPath.includes(app)) {
      return APP_THEMES.acquisition;
    }
  }
  
  // Default fallback
  return APP_THEMES.default;
}
