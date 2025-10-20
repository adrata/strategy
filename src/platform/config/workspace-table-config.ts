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
      columns: ['Name', 'Company', 'Title', 'Actions', 'Last Action', 'Next Action'],
      columnOrder: ['name', 'company', 'title', 'actions', 'lastAction', 'nextAction']
    },
    companies: {
      columns: ['Company', 'Actions', 'Last Action', 'Next Action'],
      columnOrder: ['company', 'actions', 'lastAction', 'nextAction']
    },
    speedrun: {
      columns: ['Rank', 'Name', 'Company', 'Status', 'Actions', 'MAIN-SELLER', 'CO-SELLERS', 'LAST ACTION', 'NEXT ACTION'],
      columnOrder: ['rank', 'name', 'company', 'status', 'actions', 'mainSeller', 'coSellers', 'lastAction', 'nextAction']
    },
    prospects: {
      columns: ['Name', 'Company', 'Title', 'Actions', 'Last Action', 'Next Action'],
      columnOrder: ['name', 'company', 'title', 'actions', 'lastAction', 'nextAction']
    },
    leads: {
      columns: ['Name', 'Company', 'Title', 'Email', 'Actions', 'Last Action', 'Next Action'],
      columnOrder: ['name', 'company', 'title', 'email', 'actions', 'lastAction', 'nextAction']
    },
    opportunities: {
      columns: ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action'],
      columnOrder: ['rank', 'name', 'company', 'amount', 'stage', 'probability', 'closeDate', 'lastAction']
    },
    sellers: {
      columns: ['Rank', 'Name', 'Details', 'Status', 'Last Action', 'Next Action'],
      columnOrder: ['rank', 'name', 'details', 'status', 'lastAction', 'nextAction']
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
    columns: ['Rank', 'Name', 'Details', 'Status', 'Last Action', 'Next Action'],
    columnOrder: ['rank', 'name', 'details', 'status', 'lastAction', 'nextAction']
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
