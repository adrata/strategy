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

// Notary Everyday workspace configuration
const NOTARY_EVERYDAY_CONFIG: WorkspaceTableConfig = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Updated to match Dan's workspace ID
  workspaceName: 'Notary Everyday',
  sections: {
    people: {
      columns: ['Rank', 'Company', 'Person', 'State', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'person', 'state', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['role'] // Hide role column
    },
    companies: {
      columns: ['Rank', 'Company', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'lastAction', 'nextAction', 'actions']
    },
    prospects: {
      columns: ['Rank', 'Company', 'Person', 'State', 'Title', 'Last Action', 'Next Action'],
      columnOrder: ['rank', 'company', 'person', 'state', 'title', 'lastAction', 'nextAction'],
      hiddenColumns: ['stage'] // Hide stage column
    },
    leads: {
      columns: ['Rank', 'Company', 'Person', 'State', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'person', 'state', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['stage'] // Hide stage column
    },
    speedrun: {
      columns: ['Rank', 'Person', 'Stage', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'person', 'stage', 'lastAction', 'nextAction', 'actions']
    }
  }
};

// Default configuration for all other workspaces
const DEFAULT_CONFIG: WorkspaceTableConfig = {
  workspaceId: 'default',
  workspaceName: 'Default',
  sections: {
    people: {
      columns: ['Rank', 'Company', 'Title', 'Role', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'title', 'role', 'lastAction', 'nextAction', 'actions']
    },
    companies: {
      columns: ['Rank', 'Company', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'lastAction', 'nextAction', 'actions']
    },
    speedrun: {
      columns: ['Rank', 'Person', 'Stage', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'person', 'stage', 'lastAction', 'nextAction', 'actions']
    }
  }
};

/**
 * Get workspace-specific table configuration
 */
export function getWorkspaceTableConfig(workspaceId: string, workspaceName?: string): WorkspaceTableConfig {
  // Check if this is the Notary Everyday workspace
  if (workspaceId === NOTARY_EVERYDAY_CONFIG.workspaceId || 
      workspaceName?.toLowerCase().includes('notary')) {
    return NOTARY_EVERYDAY_CONFIG;
  }
  
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
