/**
 * Available fields/columns for each section
 * Used for list field selection
 */

export interface FieldOption {
  value: string;
  label: string;
  category?: string;
  description?: string;
}

export const SECTION_FIELDS: Record<string, FieldOption[]> = {
  companies: [
    { value: 'company', label: 'Company', category: 'Basic' },
    { value: 'industry', label: 'Industry', category: 'Basic' },
    { value: 'sector', label: 'Sector', category: 'Basic' },
    { value: 'size', label: 'Size', category: 'Basic' },
    { value: 'employeeCount', label: 'Employees', category: 'Basic' },
    { value: 'revenue', label: 'Revenue', category: 'Financial' },
    { value: 'website', label: 'Website', category: 'Contact' },
    { value: 'email', label: 'Email', category: 'Contact' },
    { value: 'phone', label: 'Phone', category: 'Contact' },
    { value: 'address', label: 'Address', category: 'Location' },
    { value: 'city', label: 'City', category: 'Location' },
    { value: 'state', label: 'State', category: 'Location' },
    { value: 'country', label: 'Country', category: 'Location' },
    { value: 'status', label: 'Status', category: 'Actions' },
    { value: 'priority', label: 'Priority', category: 'Actions' },
    { value: 'lastAction', label: 'Last Action', category: 'Actions' },
    { value: 'nextAction', label: 'Next Action', category: 'Actions' },
    { value: 'rank', label: 'Rank', category: 'Metadata' },
    { value: 'createdAt', label: 'Created Date', category: 'Metadata' },
  ],
  
  people: [
    { value: 'name', label: 'Name', category: 'Basic' },
    { value: 'company', label: 'Company', category: 'Basic' },
    { value: 'title', label: 'Title', category: 'Basic' },
    { value: 'department', label: 'Department', category: 'Basic' },
    { value: 'email', label: 'Email', category: 'Contact' },
    { value: 'phone', label: 'Phone', category: 'Contact' },
    { value: 'linkedinUrl', label: 'LinkedIn', category: 'Contact' },
    { value: 'location', label: 'Location', category: 'Location' },
    { value: 'status', label: 'Status', category: 'Actions' },
    { value: 'priority', label: 'Priority', category: 'Actions' },
    { value: 'lastAction', label: 'Last Action', category: 'Actions' },
    { value: 'nextAction', label: 'Next Action', category: 'Actions' },
    { value: 'rank', label: 'Rank', category: 'Metadata' },
    { value: 'createdAt', label: 'Created Date', category: 'Metadata' },
  ],
  
  leads: [
    { value: 'name', label: 'Name', category: 'Basic' },
    { value: 'company', label: 'Company', category: 'Basic' },
    { value: 'title', label: 'Title', category: 'Basic' },
    { value: 'email', label: 'Email', category: 'Contact' },
    { value: 'phone', label: 'Phone', category: 'Contact' },
    { value: 'state', label: 'State', category: 'Location' },
    { value: 'timezone', label: 'Timezone', category: 'Location' },
    { value: 'status', label: 'Status', category: 'Actions' },
    { value: 'priority', label: 'Priority', category: 'Actions' },
    { value: 'lastAction', label: 'Last Action', category: 'Actions' },
    { value: 'nextAction', label: 'Next Action', category: 'Actions' },
    { value: 'rank', label: 'Rank', category: 'Metadata' },
    { value: 'createdAt', label: 'Created Date', category: 'Metadata' },
  ],
  
  prospects: [
    { value: 'name', label: 'Name', category: 'Basic' },
    { value: 'company', label: 'Company', category: 'Basic' },
    { value: 'title', label: 'Title', category: 'Basic' },
    { value: 'email', label: 'Email', category: 'Contact' },
    { value: 'phone', label: 'Phone', category: 'Contact' },
    { value: 'status', label: 'Status', category: 'Actions' },
    { value: 'priority', label: 'Priority', category: 'Actions' },
    { value: 'lastAction', label: 'Last Action', category: 'Actions' },
    { value: 'nextAction', label: 'Next Action', category: 'Actions' },
    { value: 'rank', label: 'Rank', category: 'Metadata' },
    { value: 'createdAt', label: 'Created Date', category: 'Metadata' },
  ],
  
  opportunities: [
    { value: 'rank', label: 'Rank', category: 'Basic' },
    { value: 'name', label: 'Name', category: 'Basic' },
    { value: 'company', label: 'Account', category: 'Basic' },
    { value: 'amount', label: 'Amount', category: 'Financial' },
    { value: 'stage', label: 'Stage', category: 'Status' },
    { value: 'probability', label: 'Probability', category: 'Status' },
    { value: 'closeDate', label: 'Close Date', category: 'Status' },
    { value: 'status', label: 'Status', category: 'Actions' },
    { value: 'lastAction', label: 'Last Action', category: 'Actions' },
    { value: 'nextAction', label: 'Next Action', category: 'Actions' },
    { value: 'createdAt', label: 'Created Date', category: 'Metadata' },
  ],
  
  clients: [
    { value: 'rank', label: 'Rank', category: 'Basic' },
    { value: 'company', label: 'Company', category: 'Basic' },
    { value: 'industry', label: 'Industry', category: 'Basic' },
    { value: 'status', label: 'Status', category: 'Status' },
    { value: 'arr', label: 'ARR', category: 'Financial' },
    { value: 'healthScore', label: 'Health Score', category: 'Status' },
    { value: 'lastAction', label: 'Last Action', category: 'Actions' },
    { value: 'nextAction', label: 'Next Action', category: 'Actions' },
    { value: 'createdAt', label: 'Created Date', category: 'Metadata' },
  ],
};

/**
 * Get available fields for a section
 */
export function getAvailableFields(section: string): FieldOption[] {
  return SECTION_FIELDS[section] || [];
}

/**
 * Get default visible fields for a section
 */
export function getDefaultVisibleFields(section: string): string[] {
  const defaults: Record<string, string[]> = {
    companies: ['company', 'lastAction', 'nextAction'],
    people: ['name', 'company', 'title', 'lastAction', 'nextAction'],
    leads: ['name', 'company', 'state', 'title', 'email', 'lastAction', 'nextAction'],
    prospects: ['name', 'company', 'title', 'lastAction', 'nextAction'],
    opportunities: ['rank', 'name', 'company', 'amount', 'stage', 'probability', 'closeDate', 'lastAction'],
    clients: ['rank', 'company', 'industry', 'status', 'arr', 'healthScore', 'lastAction'],
  };
  
  return defaults[section] || [];
}

/**
 * Group fields by category
 */
export function groupFieldsByCategory(fields: FieldOption[]): Record<string, FieldOption[]> {
  const grouped: Record<string, FieldOption[]> = {};
  
  fields.forEach(field => {
    const category = field.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(field);
  });
  
  return grouped;
}

