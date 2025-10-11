/**
 * PURE VALIDATION FUNCTION
 * Validates role discovery criteria
 */

export type EnrichmentLevel = 'discover' | 'enrich' | 'research';

export interface RoleCriteria {
  roles: string[];
  companies: string[];
  enrichmentLevel?: EnrichmentLevel;
  filters?: Record<string, any>;
}

export interface ValidatedRoleCriteria {
  roles: string[];
  companies: string[];
  enrichmentLevel: EnrichmentLevel;
  filters: Record<string, any>;
  validated: true;
}

/**
 * Validate role discovery criteria
 * @throws Error if validation fails
 */
export function validateRoleCriteria(criteria: RoleCriteria): ValidatedRoleCriteria {
  // Validate roles
  if (!criteria.roles || !Array.isArray(criteria.roles) || criteria.roles.length === 0) {
    throw new Error('roles must be a non-empty array of role titles');
  }

  // Validate each role
  criteria.roles.forEach((role, index) => {
    if (typeof role !== 'string' || role.trim().length < 2) {
      throw new Error(`roles[${index}] must be a string with at least 2 characters`);
    }
  });

  // Validate companies
  if (!criteria.companies || !Array.isArray(criteria.companies) || criteria.companies.length === 0) {
    throw new Error('companies must be a non-empty array of company names');
  }

  // Validate each company
  criteria.companies.forEach((company, index) => {
    if (typeof company !== 'string' || company.trim().length < 2) {
      throw new Error(`companies[${index}] must be a string with at least 2 characters`);
    }
  });

  // Validate enrichment level
  const validLevels: EnrichmentLevel[] = ['discover', 'enrich', 'research'];
  const enrichmentLevel = criteria.enrichmentLevel || 'discover';
  
  if (!validLevels.includes(enrichmentLevel)) {
    throw new Error(`enrichmentLevel must be one of: ${validLevels.join(', ')}`);
  }

  return {
    roles: criteria.roles.map(r => r.trim()),
    companies: criteria.companies.map(c => c.trim()),
    enrichmentLevel,
    filters: criteria.filters || {},
    validated: true
  };
}

