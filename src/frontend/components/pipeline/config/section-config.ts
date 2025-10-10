/**
 * Section Configuration
 * 
 * Replaces hardcoded switch statements with configuration-driven data mapping.
 * This makes the code more maintainable and easier to extend.
 */

export interface SectionConfig {
  id: string;
  name: string;
  dataKey: string;
  displayName: string;
  description?: string;
  icon?: string;
  category?: string;
  defaultColumns?: string[];
  availableFilters?: string[];
  sortOptions?: Array<{ value: string; label: string }>;
}

export interface SectionRegistry {
  [sectionId: string]: SectionConfig;
}

/**
 * Section Registry
 * 
 * Centralized configuration for all pipeline sections.
 * This replaces the hardcoded switch statements in PipelineFilters and other components.
 */
export const SECTION_REGISTRY: SectionRegistry = {
  'leads': {
    id: 'leads',
    name: 'Leads',
    dataKey: 'leads',
    displayName: 'Leads',
    description: 'Potential customers in early stages',
    icon: '🎯',
    category: 'prospects',
    defaultColumns: ['name', 'company', 'title', 'email', 'phone', 'status', 'source', 'createdAt'],
    availableFilters: ['status', 'source', 'vertical', 'priority', 'lastContacted'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'company', label: 'Company' },
      { value: 'createdAt', label: 'Created Date' },
      { value: 'lastContacted', label: 'Last Contacted' }
    ]
  },
  'prospects': {
    id: 'prospects',
    name: 'Prospects',
    dataKey: 'prospects',
    displayName: 'Prospects',
    description: 'Qualified potential customers',
    icon: '👥',
    category: 'prospects',
    defaultColumns: ['name', 'company', 'title', 'email', 'phone', 'status', 'stage', 'lastContacted'],
    availableFilters: ['status', 'stage', 'vertical', 'priority', 'lastContacted'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'company', label: 'Company' },
      { value: 'stage', label: 'Stage' },
      { value: 'lastContacted', label: 'Last Contacted' }
    ]
  },
  'opportunities': {
    id: 'opportunities',
    name: 'Opportunities',
    dataKey: 'opportunities',
    displayName: 'Opportunities',
    description: 'Active sales opportunities',
    icon: '💰',
    category: 'sales',
    defaultColumns: ['name', 'company', 'amount', 'stage', 'probability', 'closeDate', 'owner'],
    availableFilters: ['stage', 'amount', 'probability', 'closeDate', 'owner'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'amount', label: 'Amount' },
      { value: 'closeDate', label: 'Close Date' },
      { value: 'probability', label: 'Probability' }
    ]
  },
  'companies': {
    id: 'companies',
    name: 'Companies',
    dataKey: 'companies',
    displayName: 'Companies',
    description: 'Company records and accounts',
    icon: '🏢',
    category: 'accounts',
    defaultColumns: ['name', 'industry', 'size', 'location', 'website', 'phone', 'status'],
    availableFilters: ['industry', 'size', 'location', 'status', 'vertical'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'industry', label: 'Industry' },
      { value: 'size', label: 'Company Size' },
      { value: 'location', label: 'Location' }
    ]
  },
  'people': {
    id: 'people',
    name: 'People',
    dataKey: 'people',
    displayName: 'People',
    description: 'Individual contacts and stakeholders',
    icon: '👤',
    category: 'contacts',
    defaultColumns: ['name', 'title', 'company', 'email', 'phone', 'department', 'seniority'],
    availableFilters: ['department', 'seniority', 'company', 'location'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'title', label: 'Title' },
      { value: 'company', label: 'Company' },
      { value: 'department', label: 'Department' }
    ]
  },
  'clients': {
    id: 'clients',
    name: 'Clients',
    dataKey: 'clients',
    displayName: 'Clients',
    description: 'Existing customers and clients',
    icon: '🤝',
    category: 'customers',
    defaultColumns: ['name', 'company', 'status', 'revenue', 'startDate', 'renewalDate'],
    availableFilters: ['status', 'revenue', 'startDate', 'renewalDate'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'revenue', label: 'Revenue' },
      { value: 'startDate', label: 'Start Date' },
      { value: 'renewalDate', label: 'Renewal Date' }
    ]
  },
  'partners': {
    id: 'partners',
    name: 'Partners',
    dataKey: 'partnerships',
    displayName: 'Partners',
    description: 'Business partners and alliances',
    icon: '🤝',
    category: 'partnerships',
    defaultColumns: ['name', 'type', 'status', 'startDate', 'contact', 'revenue'],
    availableFilters: ['type', 'status', 'startDate'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'type', label: 'Type' },
      { value: 'startDate', label: 'Start Date' },
      { value: 'revenue', label: 'Revenue' }
    ]
  },
  'speedrun': {
    id: 'speedrun',
    name: 'Speedrun',
    dataKey: 'speedrunItems',
    displayName: 'Speedrun',
    description: 'Rapid sales execution items',
    icon: '⚡',
    category: 'sales',
    defaultColumns: ['name', 'company', 'priority', 'status', 'dueDate', 'owner'],
    availableFilters: ['priority', 'status', 'dueDate', 'owner'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'priority', label: 'Priority' },
      { value: 'dueDate', label: 'Due Date' },
      { value: 'status', label: 'Status' }
    ]
  },
  'metrics': {
    id: 'metrics',
    name: 'Metrics',
    dataKey: 'metrics',
    displayName: 'Metrics',
    description: 'Performance metrics and analytics',
    icon: '📊',
    category: 'analytics',
    defaultColumns: ['metric', 'value', 'trend', 'period'],
    availableFilters: ['period', 'metric'],
    sortOptions: [
      { value: 'metric', label: 'Metric' },
      { value: 'value', label: 'Value' },
      { value: 'trend', label: 'Trend' }
    ]
  },
  'dashboard': {
    id: 'dashboard',
    name: 'Dashboard',
    dataKey: 'dashboard',
    displayName: 'Dashboard',
    description: 'Overview and summary dashboard',
    icon: '📈',
    category: 'analytics',
    defaultColumns: [],
    availableFilters: [],
    sortOptions: []
  }
};

/**
 * Get section configuration by ID
 */
export function getSectionConfig(sectionId: string): SectionConfig | null {
  return SECTION_REGISTRY[sectionId] || null;
}

/**
 * Get section data key for API calls
 */
export function getSectionDataKey(sectionId: string): string {
  const config = getSectionConfig(sectionId);
  return config?.dataKey || sectionId;
}

/**
 * Get section display name
 */
export function getSectionDisplayName(sectionId: string): string {
  const config = getSectionConfig(sectionId);
  return config?.displayName || sectionId;
}

/**
 * Get default columns for a section
 */
export function getSectionDefaultColumns(sectionId: string): string[] {
  const config = getSectionConfig(sectionId);
  return config?.defaultColumns || [];
}

/**
 * Get available filters for a section
 */
export function getSectionAvailableFilters(sectionId: string): string[] {
  const config = getSectionConfig(sectionId);
  return config?.availableFilters || [];
}

/**
 * Get sort options for a section
 */
export function getSectionSortOptions(sectionId: string): Array<{ value: string; label: string }> {
  const config = getSectionConfig(sectionId);
  return config?.sortOptions || [];
}

/**
 * Get all sections by category
 */
export function getSectionsByCategory(category: string): SectionConfig[] {
  return Object.values(SECTION_REGISTRY).filter(section => section.category === category);
}

/**
 * Get all available sections
 */
export function getAllSections(): SectionConfig[] {
  return Object.values(SECTION_REGISTRY);
}

/**
 * Check if a section exists
 */
export function hasSection(sectionId: string): boolean {
  return sectionId in SECTION_REGISTRY;
}

/**
 * Map acquisition data to section data using configuration
 */
export function mapAcquisitionDataToSection(acquisitionData: any, sectionId: string): any[] {
  const dataKey = getSectionDataKey(sectionId);
  return acquisitionData?.[dataKey] || [];
}
