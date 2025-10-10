/**
 * Pipeline Content Configuration
 * 
 * Configuration-driven approach for pipeline content rendering.
 * This eliminates hardcoded logic and makes components more flexible.
 */

export interface PipelineContentConfig {
  section: string;
  title: string;
  description?: string;
  icon?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  showColumnSelector?: boolean;
  defaultPageSize?: number;
  enableSorting?: boolean;
  enablePagination?: boolean;
  customActions?: Array<{
    id: string;
    label: string;
    icon?: string;
    action: () => void;
  }>;
}

export interface PipelineContentRegistry {
  [sectionId: string]: PipelineContentConfig;
}

/**
 * Pipeline Content Registry
 * 
 * Centralized configuration for all pipeline sections.
 * This replaces hardcoded logic in PipelineContent component.
 */
export const PIPELINE_CONTENT_REGISTRY: PipelineContentRegistry = {
  'leads': {
    section: 'leads',
    title: 'Leads',
    description: 'Manage your lead pipeline and track potential customers',
    icon: '🎯',
    showAddButton: true,
    addButtonText: 'Add Lead',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'import',
        label: 'Import Leads',
        icon: '📥',
        action: () => console.log('Import leads')
      },
      {
        id: 'export',
        label: 'Export Leads',
        icon: '📤',
        action: () => console.log('Export leads')
      }
    ]
  },
  'prospects': {
    section: 'prospects',
    title: 'Prospects',
    description: 'Track qualified prospects and their engagement',
    icon: '👥',
    showAddButton: true,
    addButtonText: 'Add Prospect',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'qualify',
        label: 'Qualify Prospects',
        icon: '✅',
        action: () => console.log('Qualify prospects')
      }
    ]
  },
  'opportunities': {
    section: 'opportunities',
    title: 'Opportunities',
    description: 'Manage sales opportunities and track deal progress',
    icon: '💰',
    showAddButton: true,
    addButtonText: 'Add Opportunity',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'forecast',
        label: 'View Forecast',
        icon: '📊',
        action: () => console.log('View forecast')
      }
    ]
  },
  'companies': {
    section: 'companies',
    title: 'Companies',
    description: 'Manage company records and account information',
    icon: '🏢',
    showAddButton: true,
    addButtonText: 'Add Company',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'enrich',
        label: 'Enrich Data',
        icon: '🔍',
        action: () => console.log('Enrich company data')
      }
    ]
  },
  'people': {
    section: 'people',
    title: 'People',
    description: 'Manage individual contacts and stakeholders',
    icon: '👤',
    showAddButton: true,
    addButtonText: 'Add Person',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'enrich',
        label: 'Enrich Profile',
        icon: '🔍',
        action: () => console.log('Enrich person profile')
      }
    ]
  },
  'clients': {
    section: 'clients',
    title: 'Clients',
    description: 'Manage existing customers and client relationships',
    icon: '🤝',
    showAddButton: true,
    addButtonText: 'Add Client',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'renewal',
        label: 'View Renewals',
        icon: '🔄',
        action: () => console.log('View renewals')
      }
    ]
  },
  'partners': {
    section: 'partners',
    title: 'Partners',
    description: 'Manage business partners and alliances',
    icon: '🤝',
    showAddButton: true,
    addButtonText: 'Add Partner',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'collaborate',
        label: 'Collaborate',
        icon: '🤝',
        action: () => console.log('Collaborate with partner')
      }
    ]
  },
  'speedrun': {
    section: 'speedrun',
    title: 'Speedrun',
    description: 'Rapid sales execution and sprint management',
    icon: '⚡',
    showAddButton: true,
    addButtonText: 'Add Item',
    showFilters: true,
    showSearch: true,
    showColumnSelector: true,
    defaultPageSize: 25,
    enableSorting: true,
    enablePagination: true,
    customActions: [
      {
        id: 'sprint',
        label: 'Start Sprint',
        icon: '🏃',
        action: () => console.log('Start sprint')
      }
    ]
  },
  'metrics': {
    section: 'metrics',
    title: 'Metrics',
    description: 'View performance metrics and analytics',
    icon: '📊',
    showAddButton: false,
    showFilters: false,
    showSearch: false,
    showColumnSelector: false,
    defaultPageSize: 25,
    enableSorting: false,
    enablePagination: false,
    customActions: [
      {
        id: 'export',
        label: 'Export Report',
        icon: '📤',
        action: () => console.log('Export metrics report')
      }
    ]
  },
  'dashboard': {
    section: 'dashboard',
    title: 'Dashboard',
    description: 'Overview and summary dashboard',
    icon: '📈',
    showAddButton: false,
    showFilters: false,
    showSearch: false,
    showColumnSelector: false,
    defaultPageSize: 25,
    enableSorting: false,
    enablePagination: false,
    customActions: [
      {
        id: 'refresh',
        label: 'Refresh Data',
        icon: '🔄',
        action: () => console.log('Refresh dashboard data')
      }
    ]
  }
};

/**
 * Get pipeline content configuration by section ID
 */
export function getPipelineContentConfig(sectionId: string): PipelineContentConfig | null {
  return PIPELINE_CONTENT_REGISTRY[sectionId] || null;
}

/**
 * Get all pipeline content configurations
 */
export function getAllPipelineContentConfigs(): PipelineContentConfig[] {
  return Object.values(PIPELINE_CONTENT_REGISTRY);
}

/**
 * Check if a section has pipeline content configuration
 */
export function hasPipelineContentConfig(sectionId: string): boolean {
  return sectionId in PIPELINE_CONTENT_REGISTRY;
}
