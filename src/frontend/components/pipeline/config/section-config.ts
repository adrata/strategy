/**
 * SECTION CONFIGURATION - Configuration-driven section management
 * 
 * This file replaces switch statements in PipelineFilters and other components
 * with a data-driven approach. It maintains exact same functionality while
 * improving code maintainability.
 */

// Section configuration interface
export interface SectionConfig {
  id: string;
  label: string;
  dataSource: string;
  defaultColumns: string[];
  availableFilters: string[];
  sortOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  priorityOptions?: Array<{ value: string; label: string }>;
  revenueOptions?: Array<{ value: string; label: string }>;
  timezoneOptions?: Array<{ value: string; label: string }>;
  companySizeOptions?: Array<{ value: string; label: string }>;
  locationOptions?: Array<{ value: string; label: string }>;
  technologyOptions?: Array<{ value: string; label: string }>;
}

// Section configurations
export const SECTION_CONFIGURATIONS: Record<string, SectionConfig> = {
  leads: {
    id: 'leads',
    label: 'Leads',
    dataSource: 'leads',
    defaultColumns: ['name', 'company', 'state', 'title', 'email', 'phone', 'status', 'priority', 'lastActionDate', 'timezone'],
    availableFilters: ['search', 'vertical', 'status', 'priority', 'revenue', 'lastActionDate', 'timezone', 'state'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'company', label: 'Company' },
      { value: 'lastActionDate', label: 'Last Action Date' },
      { value: 'createdAt', label: 'Created Date' },
      { value: 'priority', label: 'Priority' }
    ],
    statusOptions: [
      { value: 'all', label: 'All Leads' },
      { value: 'new', label: 'New' },
      { value: 'active', label: 'Active' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'cold', label: 'Cold' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'follow-up', label: 'Follow-up' },
      { value: 'demo-scheduled', label: 'Demo Scheduled' }
    ],
    priorityOptions: [
      { value: 'all', label: 'All Priorities' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
      { value: 'none', label: 'No Priority' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    timezoneOptions: [
      { value: 'all', label: 'All Timezones' },
      { value: 'PST', label: 'Pacific (PST)' },
      { value: 'MST', label: 'Mountain (MST)' },
      { value: 'CST', label: 'Central (CST)' },
      { value: 'EST', label: 'Eastern (EST)' },
      { value: 'GMT', label: 'GMT' },
      { value: 'CET', label: 'Central European (CET)' },
      { value: 'JST', label: 'Japan Standard (JST)' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  },
  
  prospects: {
    id: 'prospects',
    label: 'Prospects',
    dataSource: 'prospects',
    defaultColumns: ['name', 'company', 'title', 'email', 'phone', 'status', 'priority', 'lastActionDate', 'timezone'],
    availableFilters: ['search', 'vertical', 'status', 'priority', 'revenue', 'lastActionDate', 'timezone'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'company', label: 'Company' },
      { value: 'lastActionDate', label: 'Last Action Date' },
      { value: 'createdAt', label: 'Created Date' },
      { value: 'priority', label: 'Priority' }
    ],
    statusOptions: [
      { value: 'all', label: 'All Prospects' },
      { value: 'new', label: 'New' },
      { value: 'active', label: 'Active' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'cold', label: 'Cold' }
    ],
    priorityOptions: [
      { value: 'all', label: 'All Priorities' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
      { value: 'none', label: 'No Priority' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    timezoneOptions: [
      { value: 'all', label: 'All Timezones' },
      { value: 'PST', label: 'Pacific (PST)' },
      { value: 'MST', label: 'Mountain (MST)' },
      { value: 'CST', label: 'Central (CST)' },
      { value: 'EST', label: 'Eastern (EST)' },
      { value: 'GMT', label: 'GMT' },
      { value: 'CET', label: 'Central European (CET)' },
      { value: 'JST', label: 'Japan Standard (JST)' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  },
  
  opportunities: {
    id: 'opportunities',
    label: 'Opportunities',
    dataSource: 'opportunities',
    defaultColumns: ['name', 'stage', 'amount', 'company', 'mainSeller', 'closeDate', 'probability', 'status'],
    availableFilters: ['search', 'vertical', 'status', 'revenue', 'lastActionDate'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'amount', label: 'Amount' },
      { value: 'closeDate', label: 'Close Date' },
      { value: 'probability', label: 'Probability' },
      { value: 'createdAt', label: 'Created Date' }
    ],
    statusOptions: [
      { value: 'all', label: 'All Opportunities' },
      { value: 'prospecting', label: 'Prospecting' },
      { value: 'qualification', label: 'Qualification' },
      { value: 'proposal', label: 'Proposal' },
      { value: 'negotiation', label: 'Negotiation' },
      { value: 'closed-won', label: 'Closed Won' },
      { value: 'closed-lost', label: 'Closed Lost' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  },
  
  companies: {
    id: 'companies',
    label: 'Companies',
    dataSource: 'companies',
    defaultColumns: ['name', 'industry', 'size', 'address', 'website', 'revenue', 'employeeCount', 'status'],
    availableFilters: ['search', 'vertical', 'status', 'revenue', 'companySize', 'location', 'technology'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'industry', label: 'Industry' },
      { value: 'size', label: 'Size' },
      { value: 'revenue', label: 'Revenue' },
      { value: 'employeeCount', label: 'Total Employees' },
      { value: 'createdAt', label: 'Created Date' }
    ],
    statusOptions: [
      { value: 'all', label: 'All Companies' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'customer', label: 'Customer' },
      { value: 'partner', label: 'Partner' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    companySizeOptions: [
      { value: 'all', label: 'All Sizes' },
      { value: 'startup', label: 'Startup (1-10)' },
      { value: 'small', label: 'Small (11-50)' },
      { value: 'medium', label: 'Medium (51-200)' },
      { value: 'large', label: 'Large (201-1000)' },
      { value: 'enterprise', label: 'Enterprise (1000+)' }
    ],
    locationOptions: [
      { value: 'all', label: 'All Locations' },
      { value: 'US', label: 'United States' },
      { value: 'CA', label: 'Canada' },
      { value: 'UK', label: 'United Kingdom' },
      { value: 'DE', label: 'Germany' },
      { value: 'FR', label: 'France' },
      { value: 'JP', label: 'Japan' },
      { value: 'AU', label: 'Australia' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  },
  
  people: {
    id: 'people',
    label: 'People',
    dataSource: 'people',
    defaultColumns: ['name', 'company', 'title', 'email', 'phone', 'department', 'location', 'status'],
    availableFilters: ['search', 'vertical', 'status', 'revenue', 'lastContacted'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'title', label: 'Title' },
      { value: 'company', label: 'Company' },
      { value: 'department', label: 'Department' },
      { value: 'createdAt', label: 'Created Date' }
    ],
    statusOptions: [
      { value: 'all', label: 'All People' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'contact', label: 'Contact' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  },
  
  speedrun: {
    id: 'speedrun',
    label: 'Speedrun',
    dataSource: 'speedrunItems',
    defaultColumns: ['rank', 'name', 'company', 'state', 'stage', 'actions', 'last action', 'next action'],
    availableFilters: ['search', 'vertical', 'priority', 'revenue', 'lastActionDate', 'timezone', 'state'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'company', label: 'Company' },
      { value: 'lastActionDate', label: 'Last Action Date' },
      { value: 'createdAt', label: 'Created Date' },
      { value: 'priority', label: 'Priority' }
    ],
    statusOptions: [
      { value: 'all', label: 'All Speedrun Items' },
      { value: 'new', label: 'New' },
      { value: 'active', label: 'Active' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'cold', label: 'Cold' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'follow-up', label: 'Follow-up' },
      { value: 'demo-scheduled', label: 'Demo Scheduled' }
    ],
    priorityOptions: [
      { value: 'all', label: 'All Priorities' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
      { value: 'none', label: 'No Priority' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    timezoneOptions: [
      { value: 'all', label: 'All Timezones' },
      { value: 'PST', label: 'Pacific (PST)' },
      { value: 'MST', label: 'Mountain (MST)' },
      { value: 'CST', label: 'Central (CST)' },
      { value: 'EST', label: 'Eastern (EST)' },
      { value: 'GMT', label: 'GMT' },
      { value: 'CET', label: 'Central European (CET)' },
      { value: 'JST', label: 'Japan Standard (JST)' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  },
  
  clients: {
    id: 'clients',
    label: 'Clients',
    dataSource: 'clients',
    defaultColumns: ['name', 'company', 'email', 'phone', 'status', 'totalValue', 'lastContacted'],
    availableFilters: ['search', 'vertical', 'status', 'revenue', 'lastContacted'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'company', label: 'Company' },
      { value: 'totalValue', label: 'Total Value' },
      { value: 'lastActionDate', label: 'Last Action Date' },
      { value: 'createdAt', label: 'Created Date' }
    ],
    statusOptions: [
      { value: 'all', label: 'All Clients' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'at-risk', label: 'At Risk' },
      { value: 'churned', label: 'Churned' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  },
  
  partners: {
    id: 'partners',
    label: 'Partners',
    dataSource: 'partnerships',
    defaultColumns: ['name', 'company', 'email', 'phone', 'type', 'status', 'lastContacted'],
    availableFilters: ['search', 'vertical', 'status', 'revenue', 'lastContacted'],
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'company', label: 'Company' },
      { value: 'type', label: 'Type' },
      { value: 'lastActionDate', label: 'Last Action Date' },
      { value: 'createdAt', label: 'Created Date' }
    ],
    statusOptions: [
      { value: 'all', label: 'All Partners' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'strategic', label: 'Strategic' }
    ],
    revenueOptions: [
      { value: 'all', label: 'All Revenue' },
      { value: 'enterprise', label: 'Enterprise ($1B+)' },
      { value: 'large', label: 'Large ($100M-$1B)' },
      { value: 'medium', label: 'Medium ($10M-$100M)' },
      { value: 'small', label: 'Small ($1M-$10M)' },
      { value: 'startup', label: 'Startup (<$1M)' }
    ],
    technologyOptions: [
      { value: 'all', label: 'All Technologies' },
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'google', label: 'Google' },
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' }
    ]
  }
};

// Helper functions
export function getSectionConfig(section: string): SectionConfig {
  return SECTION_CONFIGURATIONS[section] || SECTION_CONFIGURATIONS['leads'];
}

export function getSectionDefaultColumns(section: string): string[] {
  return getSectionConfig(section).defaultColumns;
}

export function getSectionAvailableFilters(section: string): string[] {
  return getSectionConfig(section).availableFilters;
}

export function getSectionSortOptions(section: string): Array<{ value: string; label: string }> {
  return getSectionConfig(section).sortOptions;
}

export function getSectionStatusOptions(section: string): Array<{ value: string; label: string }> {
  return getSectionConfig(section).statusOptions;
}

export function getSectionPriorityOptions(section: string): Array<{ value: string; label: string }> | undefined {
  return getSectionConfig(section).priorityOptions;
}

export function getSectionRevenueOptions(section: string): Array<{ value: string; label: string }> | undefined {
  return getSectionConfig(section).revenueOptions;
}

export function getSectionTimezoneOptions(section: string): Array<{ value: string; label: string }> | undefined {
  return getSectionConfig(section).timezoneOptions;
}

export function getSectionCompanySizeOptions(section: string): Array<{ value: string; label: string }> | undefined {
  return getSectionConfig(section).companySizeOptions;
}

export function getSectionLocationOptions(section: string): Array<{ value: string; label: string }> | undefined {
  return getSectionConfig(section).locationOptions;
}

export function getSectionTechnologyOptions(section: string): Array<{ value: string; label: string }> | undefined {
  return getSectionConfig(section).technologyOptions;
}

// Data source mapping function
export function mapAcquisitionDataToSection(section: string, acquisitionData: any): any[] {
  const sectionConfig = getSectionConfig(section);
  const dataSource = sectionConfig.dataSource;
  
  // Map acquisition data to section data
  const acquireData = acquisitionData?.acquireData || {};
  
  switch (dataSource) {
    case 'leads':
      return acquireData.leads || [];
    case 'prospects':
      return acquireData.prospects || [];
    case 'opportunities':
      return acquireData.opportunities || [];
    case 'companies':
      return acquireData.companies || [];
    case 'people':
      return acquireData.people || [];
    case 'clients':
      return acquireData.clients || [];
    case 'partnerships':
      return acquireData.partnerships || [];
    case 'speedrunItems':
      return acquireData.speedrunItems || [];
    default:
      return [];
  }
}