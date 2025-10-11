/**
 * PURE VALIDATION FUNCTION
 * Validates company discovery criteria
 */

export type InnovationSegment = 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards';

export interface CompanyDiscoveryCriteria {
  firmographics?: {
    industry?: string[];
    employeeRange?: { min?: number; max?: number };
    revenueRange?: { min?: number; max?: number };
  };
  innovationProfile?: {
    segment?: InnovationSegment;
  };
  painSignals?: string[];
  minCompanyFitScore?: number;
  limit?: number;
}

export interface ValidatedCompanyDiscoveryCriteria extends CompanyDiscoveryCriteria {
  validated: true;
}

/**
 * Validate company discovery criteria
 * @throws Error if validation fails
 */
export function validateCompanyDiscoveryCriteria(
  criteria: CompanyDiscoveryCriteria
): ValidatedCompanyDiscoveryCriteria {
  if (!criteria) {
    throw new Error('Discovery criteria are required');
  }

  // At least one search criterion must be provided
  if (!criteria.firmographics && !criteria.innovationProfile && !criteria.painSignals) {
    throw new Error(
      'At least one search criterion must be provided (firmographics, innovationProfile, or painSignals)'
    );
  }

  // Validate innovation profile segment if provided
  if (criteria.innovationProfile?.segment) {
    const validSegments: InnovationSegment[] = [
      'innovators',
      'early_adopters',
      'early_majority',
      'late_majority',
      'laggards'
    ];
    
    if (!validSegments.includes(criteria.innovationProfile.segment)) {
      throw new Error(
        `Invalid innovation segment. Must be one of: ${validSegments.join(', ')}`
      );
    }
  }

  // Validate min score if provided
  if (criteria.minCompanyFitScore !== undefined) {
    if (
      typeof criteria.minCompanyFitScore !== 'number' ||
      criteria.minCompanyFitScore < 0 ||
      criteria.minCompanyFitScore > 100
    ) {
      throw new Error('minCompanyFitScore must be a number between 0 and 100');
    }
  }

  // Validate employee range if provided
  if (criteria.firmographics?.employeeRange) {
    const { min, max } = criteria.firmographics.employeeRange;
    if (min !== undefined && (typeof min !== 'number' || min < 0)) {
      throw new Error('employeeRange.min must be a non-negative number');
    }
    if (max !== undefined && (typeof max !== 'number' || max < 0)) {
      throw new Error('employeeRange.max must be a non-negative number');
    }
    if (min !== undefined && max !== undefined && min > max) {
      throw new Error('employeeRange.min cannot be greater than employeeRange.max');
    }
  }

  // Validate limit if provided
  if (criteria.limit !== undefined) {
    if (typeof criteria.limit !== 'number' || criteria.limit < 1 || criteria.limit > 1000) {
      throw new Error('limit must be a number between 1 and 1000');
    }
  }

  return {
    ...criteria,
    validated: true
  };
}

