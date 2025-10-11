/**
 * COMMON ROLE DEFINITIONS
 * 
 * Pre-defined role variations for common roles
 * Used as fallback when AI unavailable or for instant responses
 */

import type { RoleVariations } from './generateRoleVariations';

// ============================================================================
// COMMON ROLES
// ============================================================================

export const COMMON_ROLE_DEFINITIONS: Record<string, RoleVariations> = {
  // Marketing Roles
  'VP Marketing': {
    baseRole: 'VP Marketing',
    variations: [
      // Tier 1: C-Level
      'Chief Marketing Officer', 'CMO', 'Chief Marketing Executive',
      // Tier 2: VP-Level
      'VP Marketing', 'Vice President Marketing', 'SVP Marketing',
      'Senior Vice President Marketing', 'EVP Marketing',
      'Executive Vice President Marketing', 'VP of Marketing',
      // Tier 3: Director-Level
      'Marketing Director', 'Director of Marketing', 'Head of Marketing',
      'Senior Marketing Director', 'Global Marketing Director',
      // Tier 4: Manager-Level
      'Marketing Manager', 'Senior Marketing Manager', 'Marketing Lead'
    ],
    tiers: {
      tier1: ['Chief Marketing Officer', 'CMO', 'Chief Marketing Executive'],
      tier2: ['VP Marketing', 'Vice President Marketing', 'SVP Marketing', 'Senior Vice President Marketing', 'EVP Marketing', 'Executive Vice President Marketing', 'VP of Marketing'],
      tier3: ['Marketing Director', 'Director of Marketing', 'Head of Marketing', 'Senior Marketing Director', 'Global Marketing Director'],
      tier4: ['Marketing Manager', 'Senior Marketing Manager', 'Marketing Lead']
    },
    totalVariations: 20,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  },
  
  // Product Roles
  'Product Manager': {
    baseRole: 'Product Manager',
    variations: [
      // Tier 1: C-Level
      'Chief Product Officer', 'CPO', 'Chief Product Executive',
      // Tier 2: VP-Level
      'VP Product', 'Vice President Product', 'SVP Product',
      'VP of Product', 'Head of Product',
      // Tier 3: Director-Level
      'Product Director', 'Director of Product', 'Senior Product Director',
      // Tier 4: Manager-Level
      'Product Manager', 'Senior Product Manager', 'Lead Product Manager',
      'Principal Product Manager', 'Group Product Manager'
    ],
    tiers: {
      tier1: ['Chief Product Officer', 'CPO', 'Chief Product Executive'],
      tier2: ['VP Product', 'Vice President Product', 'SVP Product', 'VP of Product', 'Head of Product'],
      tier3: ['Product Director', 'Director of Product', 'Senior Product Director'],
      tier4: ['Product Manager', 'Senior Product Manager', 'Lead Product Manager', 'Principal Product Manager', 'Group Product Manager']
    },
    totalVariations: 18,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  },
  
  // Engineering Roles
  'Engineering Manager': {
    baseRole: 'Engineering Manager',
    variations: [
      // Tier 1: C-Level
      'Chief Technology Officer', 'CTO', 'Chief Technical Officer',
      'Chief Engineering Officer',
      // Tier 2: VP-Level
      'VP Engineering', 'Vice President Engineering', 'SVP Engineering',
      'VP of Engineering', 'Head of Engineering',
      // Tier 3: Director-Level
      'Engineering Director', 'Director of Engineering', 'Senior Engineering Director',
      // Tier 4: Manager-Level
      'Engineering Manager', 'Senior Engineering Manager', 'Lead Engineer',
      'Principal Engineer', 'Staff Engineer'
    ],
    tiers: {
      tier1: ['Chief Technology Officer', 'CTO', 'Chief Technical Officer', 'Chief Engineering Officer'],
      tier2: ['VP Engineering', 'Vice President Engineering', 'SVP Engineering', 'VP of Engineering', 'Head of Engineering'],
      tier3: ['Engineering Director', 'Director of Engineering', 'Senior Engineering Director'],
      tier4: ['Engineering Manager', 'Senior Engineering Manager', 'Lead Engineer', 'Principal Engineer', 'Staff Engineer']
    },
    totalVariations: 19,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  },
  
  // Data Roles
  'Data Scientist': {
    baseRole: 'Data Scientist',
    variations: [
      // Tier 1: C-Level
      'Chief Data Officer', 'CDO', 'Chief Analytics Officer',
      // Tier 2: VP-Level
      'VP Data', 'Vice President Data', 'VP Analytics',
      'VP of Data Science', 'Head of Data',
      // Tier 3: Director-Level
      'Data Director', 'Director of Data Science', 'Analytics Director',
      // Tier 4: Manager-Level
      'Data Scientist', 'Senior Data Scientist', 'Lead Data Scientist',
      'Principal Data Scientist', 'Staff Data Scientist'
    ],
    tiers: {
      tier1: ['Chief Data Officer', 'CDO', 'Chief Analytics Officer'],
      tier2: ['VP Data', 'Vice President Data', 'VP Analytics', 'VP of Data Science', 'Head of Data'],
      tier3: ['Data Director', 'Director of Data Science', 'Analytics Director'],
      tier4: ['Data Scientist', 'Senior Data Scientist', 'Lead Data Scientist', 'Principal Data Scientist', 'Staff Data Scientist']
    },
    totalVariations: 18,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  },
  
  // Sales Roles
  'Sales Director': {
    baseRole: 'Sales Director',
    variations: [
      // Tier 1: C-Level
      'Chief Revenue Officer', 'CRO', 'Chief Sales Officer', 'CSO',
      // Tier 2: VP-Level
      'VP Sales', 'Vice President Sales', 'SVP Sales',
      'VP of Sales', 'Head of Sales',
      // Tier 3: Director-Level
      'Sales Director', 'Director of Sales', 'Senior Sales Director',
      'Regional Sales Director', 'National Sales Director',
      // Tier 4: Manager-Level
      'Sales Manager', 'Senior Sales Manager', 'Sales Lead'
    ],
    tiers: {
      tier1: ['Chief Revenue Officer', 'CRO', 'Chief Sales Officer', 'CSO'],
      tier2: ['VP Sales', 'Vice President Sales', 'SVP Sales', 'VP of Sales', 'Head of Sales'],
      tier3: ['Sales Director', 'Director of Sales', 'Senior Sales Director', 'Regional Sales Director', 'National Sales Director'],
      tier4: ['Sales Manager', 'Senior Sales Manager', 'Sales Lead']
    },
    totalVariations: 19,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  },
  
  // HR Roles
  'HR Director': {
    baseRole: 'HR Director',
    variations: [
      // Tier 1: C-Level
      'Chief Human Resources Officer', 'CHRO', 'Chief People Officer', 'CPO',
      // Tier 2: VP-Level
      'VP Human Resources', 'VP HR', 'Vice President HR',
      'VP of People', 'Head of HR',
      // Tier 3: Director-Level
      'HR Director', 'Director of HR', 'Human Resources Director',
      'People Director',
      // Tier 4: Manager-Level
      'HR Manager', 'Human Resources Manager', 'People Manager'
    ],
    tiers: {
      tier1: ['Chief Human Resources Officer', 'CHRO', 'Chief People Officer', 'CPO'],
      tier2: ['VP Human Resources', 'VP HR', 'Vice President HR', 'VP of People', 'Head of HR'],
      tier3: ['HR Director', 'Director of HR', 'Human Resources Director', 'People Director'],
      tier4: ['HR Manager', 'Human Resources Manager', 'People Manager']
    },
    totalVariations: 17,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  },
  
  // Operations Roles
  'Operations Manager': {
    baseRole: 'Operations Manager',
    variations: [
      // Tier 1: C-Level
      'Chief Operating Officer', 'COO', 'Chief Operations Executive',
      // Tier 2: VP-Level
      'VP Operations', 'Vice President Operations', 'SVP Operations',
      'VP of Operations', 'Head of Operations',
      // Tier 3: Director-Level
      'Operations Director', 'Director of Operations', 'Senior Operations Director',
      // Tier 4: Manager-Level
      'Operations Manager', 'Senior Operations Manager', 'Operations Lead'
    ],
    tiers: {
      tier1: ['Chief Operating Officer', 'COO', 'Chief Operations Executive'],
      tier2: ['VP Operations', 'Vice President Operations', 'SVP Operations', 'VP of Operations', 'Head of Operations'],
      tier3: ['Operations Director', 'Director of Operations', 'Senior Operations Director'],
      tier4: ['Operations Manager', 'Senior Operations Manager', 'Operations Lead']
    },
    totalVariations: 16,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get fallback variations for a role
 * Returns null if role not in common definitions
 */
export function getFallbackVariations(role: string): RoleVariations | null {
  const normalized = role.toLowerCase().trim();
  
  // Try exact match first
  for (const [key, variations] of Object.entries(COMMON_ROLE_DEFINITIONS)) {
    if (key.toLowerCase() === normalized) {
      return variations;
    }
  }
  
  // Try partial match
  for (const [key, variations] of Object.entries(COMMON_ROLE_DEFINITIONS)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return variations;
    }
  }
  
  return null;
}

/**
 * Get list of all common roles
 */
export function getCommonRoles(): string[] {
  return Object.keys(COMMON_ROLE_DEFINITIONS);
}

/**
 * Check if role is a common role
 */
export function isCommonRole(role: string): boolean {
  return getFallbackVariations(role) !== null;
}

