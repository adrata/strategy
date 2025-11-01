/**
 * 🏢 WORKSPACE ID MAPPING CONFIGURATION
 * Maps human-readable URL slugs to actual database workspace IDs
 * 
 * This solves the issue where:
 * - Frontend uses: /rps/opportunities (slug: 'rps')
 * - Backend expects: 01K1VBYV8ETM2RCQA4GNN9EG72 (actual ID)
 */

export interface WorkspaceMapping {
  slug: string;
  id: string;
  name: string;
  isActive: boolean;
}

export const WORKSPACE_MAPPINGS: WorkspaceMapping[] = [
  {
    slug: 'adrata',
    id: '01K7464TNANHQXPCZT1FYX205V',
    name: 'Adrata',
    isActive: true
  },
  {
    slug: 'rps',
    id: '01K1VBYV8ETM2RCQA4GNN9EG72',
    name: 'Retail Product Solutions',
    isActive: true
  },
  {
    slug: 'ne',
    id: '01K1VBYmf75hgmvmz06psnc9ug',
    name: 'Notary Everyday',
    isActive: true
  },
  {
    slug: 'pinpoint',
    id: '01K90EQWJCCN2JDMRQF12F49GN',
    name: 'Pinpoint',
    isActive: true
  },
  // Add more workspaces as needed
  // {
  //   slug: 'demo',
  //   id: 'demo-workspace-id',
  //   name: 'Demo Workspace',
  //   isActive: false
  // }
];

/**
 * Get workspace ID by slug
 */
export function getWorkspaceIdBySlug(slug: string): string | null {
  const mapping = WORKSPACE_MAPPINGS.find(w => w['slug'] === slug);
  return mapping?.id || null;
}

/**
 * Get workspace slug by ID
 */
export function getWorkspaceSlugById(id: string): string | null {
  const mapping = WORKSPACE_MAPPINGS.find(w => w['id'] === id);
  return mapping?.slug || null;
}

/**
 * Get full workspace mapping by slug
 */
export function getWorkspaceBySlug(slug: string): WorkspaceMapping | null {
  return WORKSPACE_MAPPINGS.find(w => w['slug'] === slug) || null;
}

/**
 * Get full workspace mapping by ID
 */
export function getWorkspaceById(id: string): WorkspaceMapping | null {
  return WORKSPACE_MAPPINGS.find(w => w['id'] === id) || null;
}

/**
 * Check if a slug is valid
 */
export function isValidWorkspaceSlug(slug: string): boolean {
  return WORKSPACE_MAPPINGS.some(w => w['slug'] === slug);
}

/**
 * Check if a workspace ID is valid
 */
export function isValidWorkspaceId(id: string): boolean {
  return WORKSPACE_MAPPINGS.some(w => w['id'] === id);
}

/**
 * Get all active workspaces
 */
export function getActiveWorkspaces(): WorkspaceMapping[] {
  return WORKSPACE_MAPPINGS.filter(w => w.isActive);
}

/**
 * Get all workspace slugs
 */
export function getAllWorkspaceSlugs(): string[] {
  return WORKSPACE_MAPPINGS.map(w => w.slug);
}

/**
 * Get all workspace IDs
 */
export function getAllWorkspaceIds(): string[] {
  return WORKSPACE_MAPPINGS.map(w => w.id);
}
