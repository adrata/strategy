/**
 * Section filtering utility for workspace-based access control
 * Controls which app sections are visible based on workspace permissions
 */

export interface SectionFilterConfig {
  workspaceSlug: string;
  appId: string;
}

/**
 * Get filtered sections for a specific workspace and app
 * @param config - Configuration object with workspace slug and app ID
 * @returns Array of section IDs that should be visible
 */
export function getFilteredSectionsForWorkspace(config: SectionFilterConfig): string[] {
  const { workspaceSlug, appId } = config;
  
  // Normalize workspace slug for comparison
  const normalizedWorkspace = workspaceSlug.toLowerCase().replace(/\s+/g, '-');
  
  // Define privileged workspaces that get access to all sections
  const privilegedWorkspaces = [
    'adrata',
    'notary-everyday',
    'notary-everyday',
    'notaryeveryday'
  ];
  
  // Check if this workspace has privileged access
  const hasPrivilegedAccess = privilegedWorkspaces.includes(normalizedWorkspace);
  
  // Define section configurations for each app
  const sectionConfigs: Record<string, { all: string[], core: string[] }> = {
    'pipeline': {
      all: ['speedrun', 'chronicle', 'opportunities', 'leads', 'prospects', 'clients', 'partners', 'companies', 'people', 'metrics'],
      core: ['speedrun', 'leads', 'prospects', 'opportunities', 'companies', 'people', 'partners']
    },
    'monaco': {
      all: ['companies', 'people', 'sellers', 'sequences', 'analytics'],
      core: ['companies', 'people', 'sellers', 'sequences', 'analytics']
    },
    'Speedrun': {
      all: ['inbox', 'prospects', 'leads', 'pipeline', 'analytics', 'settings'],
      core: ['inbox', 'prospects', 'leads', 'pipeline', 'analytics', 'settings']
    }
  };
  
  // Get configuration for this app
  const appConfig = sectionConfigs[appId];
  if (!appConfig) {
    // If no specific configuration, return empty array
    console.warn(`No section configuration found for app: ${appId}`);
    return [];
  }
  
  // Return appropriate sections based on workspace privileges
  return hasPrivilegedAccess ? appConfig.all : appConfig.core;
}

/**
 * Check if a specific section is visible for a workspace and app
 * @param config - Configuration object with workspace slug and app ID
 * @param sectionId - The section ID to check
 * @returns True if the section should be visible
 */
export function isSectionVisibleForWorkspace(
  config: SectionFilterConfig, 
  sectionId: string
): boolean {
  const visibleSections = getFilteredSectionsForWorkspace(config);
  return visibleSections.includes(sectionId);
}

/**
 * Get the default section for a workspace and app
 * @param config - Configuration object with workspace slug and app ID
 * @returns The default section ID, or first available section if none specified
 */
export function getDefaultSectionForWorkspace(config: SectionFilterConfig): string {
  const visibleSections = getFilteredSectionsForWorkspace(config);
  
  if (visibleSections.length === 0) {
    console.warn(`No sections available for workspace: ${config.workspaceSlug}, app: ${config.appId}`);
    return '';
  }
  
  // Define default sections for each app
  const defaultSections: Record<string, string> = {
    'pipeline': 'opportunities',
    'monaco': 'companies',
    'Speedrun': 'inbox'
  };
  
  const preferredDefault = defaultSections[config.appId];
  
  // If preferred default is available, use it; otherwise use first available
  return visibleSections.includes(preferredDefault) 
    ? preferredDefault 
    : visibleSections[0];
}
