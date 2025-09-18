/**
 * Workspace Color Preferences Service
 * Manages client-specific color schemes for different workspaces
 */

export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  button: {
    background: string;
    text: string;
    border: string;
    hover: string;
  };
  pagination: {
    active: string;
    text: string;
    border: string;
  };
}

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  // Default blue scheme
  default: {
    name: 'Blue',
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#60a5fa',
    button: {
      background: 'bg-blue-600',
      text: 'text-white',
      border: 'border-blue-600',
      hover: 'hover:bg-blue-700'
    },
    pagination: {
      active: 'bg-blue-600',
      text: 'text-white',
      border: 'border-blue-600'
    }
  },
  
  // Navy scheme for TOP Engineers Plus
  navy: {
    name: 'Navy',
    primary: '#1B3758',
    secondary: '#0f1f2e',
    accent: '#2d4a6b',
    button: {
      background: 'bg-navy-50',
      text: 'text-navy-900',
      border: 'border-navy-200',
      hover: 'hover:bg-navy-100'
    },
    pagination: {
      active: 'bg-navy-50',
      text: 'text-navy-900',
      border: 'border-navy-200'
    }
  }
};

// Workspace-specific color scheme mappings
export const WORKSPACE_COLOR_MAPPINGS: Record<string, string> = {
  'TOP Engineering Plus': 'navy', // Correct name from database
  'TOP Engineers Plus': 'navy',   // Fallback for potential variations
  'Retail Product Solutions': 'default',
  'Notary Everyday': 'default',
  'adrata': 'default',
  'Adrata': 'default'
};

/**
 * Get color scheme for a workspace
 */
export function getWorkspaceColorScheme(workspaceName: string): ColorScheme {
  const schemeKey = WORKSPACE_COLOR_MAPPINGS[workspaceName] || 'default';
  return COLOR_SCHEMES[schemeKey];
}

/**
 * Get CSS classes for a button based on workspace
 */
export function getButtonClasses(workspaceName: string): string {
  const scheme = getWorkspaceColorScheme(workspaceName);
  return `${scheme.button.background} ${scheme.button.text} ${scheme.button.border} ${scheme.button.hover}`;
}

/**
 * Get CSS classes for pagination based on workspace
 */
export function getPaginationClasses(workspaceName: string): string {
  const scheme = getWorkspaceColorScheme(workspaceName);
  return `${scheme.pagination.active} ${scheme.pagination.text} ${scheme.pagination.border}`;
}

/**
 * Check if workspace uses navy color scheme
 */
export function isNavyWorkspace(workspaceName: string): boolean {
  return getWorkspaceColorScheme(workspaceName).name === 'Navy';
}
