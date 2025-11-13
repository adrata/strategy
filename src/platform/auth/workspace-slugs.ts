/**
 * Workspace Slug Management
 * Maps workspace names to URL-friendly slugs for routing
 */

export interface WorkspaceSlug {
  id: string;
  name: string;
  slug: string;
  displayName: string;
}

// Common workspace slug mappings
const WORKSPACE_SLUGS: Record<string, string> = {
  'Retail Product Solutions': 'rps',
  'Notary Everyday': 'ne',
  'notary-everyday': 'ne',
  'adrata': 'adrata',
  'Adrata': 'adrata',
  'TOP Engineering Plus': 'top', // Correct name from database
  'TOP Engineers Plus': 'top',   // Fallback for potential variations
  'Top Temp': 'top-temp',        // Top Temp workspace
  'Demo Workspace': 'demo',      // Demo workspace should use /demo/ URLs
  'Demo': 'demo',
  'CloudCaddie': 'cloudcaddie',
  'Pinpoint': 'pinpoint',
  'E&I Cooperative Services': 'ei-cooperative',
  // Add more mappings as needed
};

/**
 * Generate a slug from a workspace name
 */
export function generateWorkspaceSlug(workspaceName: string): string {
  // Check if we have a predefined mapping
  if (WORKSPACE_SLUGS[workspaceName]) {
    return WORKSPACE_SLUGS[workspaceName];
  }

  // Generate a slug from the workspace name
  return workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .substring(0, 10); // Limit length
}

/**
 * Get workspace slug info
 */
export function getWorkspaceSlugInfo(workspace: { id: string; name: string }): WorkspaceSlug {
  const slug = generateWorkspaceSlug(workspace.name);
  return {
    id: workspace.id,
    name: workspace.name,
    slug,
    displayName: workspace.name,
  };
}

/**
 * Get workspace by slug
 */
export function getWorkspaceBySlug(workspaces: Array<{ id: string; name: string }>, slug: string) {
  // First try exact slug match
  let workspace = workspaces.find(w => generateWorkspaceSlug(w.name) === slug);
  
  // If not found and slug is 'toptemp', also try 'top-temp'
  if (!workspace && slug === 'toptemp') {
    workspace = workspaces.find(w => generateWorkspaceSlug(w.name) === 'top-temp');
  }
  
  // If not found and slug is 'top-temp', also try 'toptemp'
  if (!workspace && slug === 'top-temp') {
    workspace = workspaces.find(w => {
      const generated = generateWorkspaceSlug(w.name);
      return generated === 'toptemp' || generated === 'top-temp';
    });
  }
  
  return workspace;
}

/**
 * Generate workspace URL
 */
export function getWorkspaceUrl(workspace: { id: string; name: string }, path: string = 'speedrun'): string {
  const slug = generateWorkspaceSlug(workspace.name);
  return `/${slug}/${path}`;
}

/**
 * Parse workspace from URL
 */
export function parseWorkspaceFromUrl(pathname: string): { slug: string; path: string } | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts['length'] === 0) return null;

  const slug = parts[0];
  const path = parts.slice(1).join('/') || 'dashboard';
  
  return { slug, path };
}
