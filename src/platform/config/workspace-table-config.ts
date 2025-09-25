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
      columns: ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'name', 'company', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['role', 'state'] // Hide role and state columns
    },
    companies: {
      columns: ['Rank', 'Company', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'lastAction', 'nextAction', 'actions']
    },
    prospects: {
      columns: ['Rank', 'Company', 'Name', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'name', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['stage', 'status', 'details'] // Remove company from hidden columns
    },
    leads: {
      columns: ['Rank', 'Company', 'Name', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'name', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['stage', 'status', 'details'] // Remove company from hidden columns
    },
    speedrun: {
      columns: ['Rank', 'Company', 'Person', 'Stage', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'person', 'stage', 'lastAction', 'nextAction', 'actions']
    }
  }
};

// Default configuration for all other workspaces
const DEFAULT_CONFIG: WorkspaceTableConfig = {
  workspaceId: 'default',
  workspaceName: 'Default',
  sections: {
    people: {
      columns: ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'name', 'company', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['role', 'state'] // Hide role and state columns
    },
    companies: {
      columns: ['Rank', 'Company', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'lastAction', 'nextAction', 'actions']
    },
    speedrun: {
      columns: ['Rank', 'Company', 'Person', 'Stage', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'person', 'stage', 'lastAction', 'nextAction', 'actions']
    },
    prospects: {
      columns: ['Rank', 'Company', 'Name', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'name', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['stage', 'status', 'details'] // Remove company from hidden columns
    },
    leads: {
      columns: ['Rank', 'Company', 'Name', 'Title', 'Last Action', 'Next Action', 'Actions'],
      columnOrder: ['rank', 'company', 'name', 'title', 'lastAction', 'nextAction', 'actions'],
      hiddenColumns: ['stage', 'status', 'details'] // Remove company from hidden columns
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
