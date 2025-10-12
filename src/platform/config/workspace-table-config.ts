/**
 * Workspace-specific table configuration
 * Defines custom column layouts for specific workspaces
 */

export interface WorkspaceTableConfig {
  workspaceId: string;
  workspaceName: string;
  sections: {
    [section: string]: {
      columns: string[];
      columnOrder: string[];
      hiddenColumns?: string[];
    };
  };
}

// Default configuration for all workspaces
const DEFAULT_CONFIG: WorkspaceTableConfig = {
  workspaceId: 'default',
  workspaceName: 'Default',
  sections: {
    people: {
      columns: ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'name', 'company', 'title', 'lastAction', 'nextAction', 'actions']
    },
    companies: {
      columns: ['Rank', 'Company', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'lastAction', 'nextAction', 'actions']
    },
    speedrun: {
      columns: ['Rank', 'Company', 'Name', 'Status', 'MAIN-SELLER', 'CO-SELLERS', 'LAST ACTION', 'NEXT ACTION'],
      columnOrder: ['rank', 'company', 'name', 'status', 'mainSeller', 'coSellers', 'lastAction', 'nextAction']
    },
    prospects: {
      columns: ['Rank', 'Company', 'Name', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'name', 'title', 'lastAction', 'nextAction', 'actions']
    },
    leads: {
      columns: ['Company', 'Name', 'Title', 'Email', 'Last Action', 'Next Action'],
      columnOrder: ['company', 'name', 'title', 'email', 'lastAction', 'nextAction']
    },
    sellers: {
      columns: ['Rank', 'Name', 'Details', 'Status', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'name', 'details', 'status', 'lastAction', 'nextAction', 'actions']
    }
  }
};

/**
 * Get workspace-specific table configuration
 */
export function getWorkspaceTableConfig(workspaceId: string, workspaceName?: string): WorkspaceTableConfig {
  // All workspaces use the same default configuration
  return DEFAULT_CONFIG;
}

/**
 * Get column configuration for a specific section in a workspace
 */
export function getSectionColumns(workspaceId: string, section: string, workspaceName?: string) {
  const config = getWorkspaceTableConfig(workspaceId, workspaceName);
  return config.sections[section] || DEFAULT_CONFIG.sections[section] || {
    columns: ['Rank', 'Name', 'Details', 'Status', 'Last Action', 'Next Action', 'Actions'],
    columnOrder: ['rank', 'name', 'details', 'status', 'lastAction', 'nextAction', 'actions']
  };
}

/**
 * Check if a column should be hidden for a specific workspace and section
 */
export function isColumnHidden(workspaceId: string, section: string, column: string, workspaceName?: string): boolean {
  const config = getWorkspaceTableConfig(workspaceId, workspaceName);
  const sectionConfig = config.sections[section];
  return sectionConfig?.hiddenColumns?.includes(column) || false;
}
