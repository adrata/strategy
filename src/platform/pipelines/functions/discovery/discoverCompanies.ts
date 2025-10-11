/**
 * PURE DISCOVERY FUNCTION
 * Discovers companies matching criteria
 */

import type { CompanyDiscoveryCriteria } from '../validation/validateCompanyDiscoveryCriteria';

export interface Company {
  name: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  revenue?: number;
}

export interface CompanyDiscoveryResult {
  companies: Company[];
  totalFound: number;
}

/**
 * Discover companies matching firmographics
 * 
 * Pure function (given same criteria, returns same results)
 */
import type { APIClients } from '../types/api-clients';

export async function discoverCompanies(
  criteria: CompanyDiscoveryCriteria,
  apis: APIClients
): Promise<CompanyDiscoveryResult> {
  console.log(`🔍 [DISCOVER COMPANIES] Searching for companies...`);

  // TODO: Integrate with actual APIs (CoreSignal, People Data Labs)
  // const results = await apis.coreSignal.searchCompanies(criteria.firmographics);

  // Mock data for now
  const mockCompanies: Company[] = [
    { name: 'Salesforce', website: 'https://salesforce.com', industry: 'SaaS', employeeCount: 50000 },
    { name: 'HubSpot', website: 'https://hubspot.com', industry: 'SaaS', employeeCount: 5000 },
    { name: 'Dell', website: 'https://dell.com', industry: 'Technology', employeeCount: 130000 }
  ];

  return {
    companies: mockCompanies,
    totalFound: mockCompanies.length
  };
}

/**
 * Filter companies by criteria (pure function)
 */
export function filterCompanies(
  companies: Company[],
  criteria: CompanyDiscoveryCriteria
): Company[] {
  let filtered = [...companies];

  // Filter by employee range
  if (criteria.firmographics?.employeeRange) {
    const { min, max } = criteria.firmographics.employeeRange;
    filtered = filtered.filter(c => {
      if (!c.employeeCount) return true;
      if (min && c.employeeCount < min) return false;
      if (max && c.employeeCount > max) return false;
      return true;
    });
  }

  // Filter by industry
  if (criteria.firmographics?.industry) {
    filtered = filtered.filter(c =>
      c.industry && criteria.firmographics!.industry!.includes(c.industry)
    );
  }

  return filtered;
}

