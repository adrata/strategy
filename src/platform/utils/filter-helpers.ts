/**
 * Helper functions for generating dynamic filter options from real data
 */

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Extract unique values from an array of objects for a specific field
 */
export function getUniqueFilterValues(
  data: any[], 
  field: string, 
  limit: number = 10
): FilterOption[] {
  const valueMap = new Map<string, number>();
  
  data.forEach(item => {
    let value = item[field];
    if (Array.isArray(value)) {
      // Handle array fields (like tags)
      value.forEach((v: any) => {
        const normalizedValue = String(v || '').trim();
        if (normalizedValue) {
          valueMap.set(normalizedValue, (valueMap.get(normalizedValue) || 0) + 1);
        }
      });
    } else {
      // Handle single value fields
      const normalizedValue = String(value || '').trim();
      if (normalizedValue && normalizedValue.toLowerCase() !== 'unknown') {
        valueMap.set(normalizedValue, (valueMap.get(normalizedValue) || 0) + 1);
      }
    }
  });

  // Sort by count (descending) and take top N
  return Array.from(valueMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([value, count]) => ({
      value: value, // CRITICAL FIX: Keep original case for value field
      label: value, // Keep original case for display
      count
    }));
}

/**
 * Get filter options for leads
 */
export function getLeadFilterOptions(leads: any[]) {
  return {
    status: getUniqueFilterValues(leads, 'status', 8),
    source: getUniqueFilterValues(leads, 'source', 8),
    company: getUniqueFilterValues(leads, 'company', 12),
    industry: getUniqueFilterValues(leads, 'industry', 10),
    title: getUniqueFilterValues(leads, 'title', 10),
    // Add vertical filter for Dano's retail business
    vertical: getUniqueFilterValues(leads, 'vertical', 6)
  };
}

/**
 * Get filter options for prospects
 */
export function getProspectFilterOptions(prospects: any[]) {
  return {
    vertical: getUniqueFilterValues(prospects, 'vertical', 6),
    company: getUniqueFilterValues(prospects, 'company', 12),
    industry: getUniqueFilterValues(prospects, 'industry', 10),
    title: getUniqueFilterValues(prospects, 'title', 10)
  };
}

/**
 * Get filter options for opportunities
 */
export function getOpportunityFilterOptions(opportunities: any[]) {
  // Generate year options from opportunity creation and close dates
  const yearMap = new Map<string, number>();
  
  opportunities.forEach(opp => {
    const createdYear = new Date(opp.createdAt || Date.now()).getFullYear().toString();
    const closeYear = opp.expectedCloseDate ? new Date(opp.expectedCloseDate).getFullYear().toString() : null;
    
    yearMap.set(createdYear, (yearMap.get(createdYear) || 0) + 1);
    if (closeYear && closeYear !== createdYear) {
      yearMap.set(closeYear, (yearMap.get(closeYear) || 0) + 1);
    }
  });

  const yearOptions = Array.from(yearMap.entries())
    .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort by year descending
    .map(([year, count]) => ({
      value: year,
      label: year,
      count
    }));

  return {
    status: getUniqueFilterValues(opportunities, 'stage', 10),
    source: getUniqueFilterValues(opportunities, 'source', 8),
    company: getUniqueFilterValues(opportunities.map(o => ({
      company: o.account?.name || o.company || 'Unknown'
    })), 'company', 12),
    year: yearOptions,
    assignedUser: getUniqueFilterValues(opportunities.map(o => ({
      assignedUser: o.assignedUser?.name || 'Unassigned'
    })), 'assignedUser', 8)
  };
}

/**
 * Get filter options for contacts
 */
export function getContactFilterOptions(contacts: any[]) {
  return {
    company: getUniqueFilterValues(contacts.map(c => ({
      company: c.account?.name || c.company || 'Unknown'
    })), 'company', 12),
    title: getUniqueFilterValues(contacts, 'title', 12),
    department: getUniqueFilterValues(contacts, 'department', 8),
    location: getUniqueFilterValues(contacts, 'city', 10)
  };
}

/**
 * Get filter options for accounts
 */
export function getAccountFilterOptions(accounts: any[]) {
  return {
    industry: getUniqueFilterValues(accounts, 'industry', 12),
    size: getUniqueFilterValues(accounts, 'employeeCount', 8),
    location: getUniqueFilterValues(accounts, 'city', 12),
    type: getUniqueFilterValues(accounts, 'type', 6)
  };
}

/**
 * Get revenue filter options - standardized revenue ranges based on company size
 */
export function getRevenueFilterOptions(data: any[]) {
  // Define standard revenue ranges
  const revenueRanges = [
    { value: 'startup', label: 'Startup (<$1M)', min: 0, max: 1000000 },
    { value: 'small', label: 'Small ($1M-$10M)', min: 1000000, max: 10000000 },
    { value: 'mid_market', label: 'Mid-Market ($10M-$100M)', min: 10000000, max: 100000000 },
    { value: 'enterprise', label: 'Enterprise ($100M-$1B)', min: 100000000, max: 1000000000 },
    { value: 'large_enterprise', label: 'Large Enterprise ($1B+)', min: 1000000000, max: Infinity }
  ];

  // Count items in each revenue range
  const revenueOptions = revenueRanges.map(range => {
    const count = data.filter(item => {
      // Try different revenue field sources
      const revenue = item.revenue || 
                     item.account?.revenue || 
                     item.estimatedValue || 
                     item.companyRevenue ||
                     0;
      
      return revenue >= range['min'] && revenue < range.max;
    }).length;

    return {
      value: range.value,
      label: range.label,
      count: count
    };
  }).filter(option => option.count > 0); // Only show ranges that have data

  return revenueOptions;
}

/**
 * Get filter options for customers
 */
export function getCustomerFilterOptions(customers: any[]) {
  return {
    stage: [
      { value: 'active', label: 'Active' },
      { value: 'nurture', label: 'Nurture' },
      { value: 'expand', label: 'Expand' },
      { value: 'risk', label: 'At Risk' }
    ],
    revenue: getRevenueFilterOptions(customers),
    industry: getUniqueFilterValues(customers, 'industry', 10),
    lifetimeValue: [
      { value: 'high', label: 'High Value ($50K+)' },
      { value: 'medium', label: 'Medium Value ($10K-$50K)' },
      { value: 'low', label: 'Low Value (<$10K)' }
    ]
  };
}
