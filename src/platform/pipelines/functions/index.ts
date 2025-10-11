/**
 * PURE FUNCTION LIBRARY
 * 
 * All business logic extracted into pure, testable, composable functions
 * Following 2025 best practices: Functional Core, Imperative Shell
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export * from './validation/validateCompanyInput';
export * from './validation/validatePersonInput';
export * from './validation/validateRoleCriteria';
export * from './validation/validateCompanyDiscoveryCriteria';

// ============================================================================
// DISCOVERY FUNCTIONS
// ============================================================================

export * from './discovery/discoverPeople';
export * from './discovery/discoverCompanies';

// ============================================================================
// ENRICHMENT FUNCTIONS
// ============================================================================

export * from './enrichment/enrichContacts';

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

export * from './analysis/analyzePersonIntelligence';

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

export * from './scoring/calculateCompanyFitScore';

// ============================================================================
// TYPES
// ============================================================================

export * from './types/api-clients';
export * from './types/errors';

// ============================================================================
// ROLE FUNCTIONS (AI-POWERED)
// ============================================================================

export * from './roles/generateRoleVariations';
export * from './roles/roleIntelligence';
export * from './roles/roleVariationCache';
export * from './roles/commonRoleDefinitions';

// ============================================================================
// PROVIDER SERVICES
// ============================================================================

export * from './providers/pdl-service';
export * from './providers/coresignal-multisource';
export * from './providers/coresignal-jobs';

// ============================================================================
// INTELLIGENCE SERVICES
// ============================================================================

export * from './intelligence/ai-person-intelligence';
export * from './intelligence/competitive-intelligence';

// ============================================================================
// ANALYTICS SERVICES
// ============================================================================

export * from './analysis/employee-analytics';

