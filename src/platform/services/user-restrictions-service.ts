/**
 * User Restrictions Service
 * 
 * Handles user-specific restrictions that override workspace-level permissions.
 * Used to implement granular access control for specific users in specific workspaces.
 */

export interface UserRestriction {
  userId: string;
  email: string;
  workspaceRestrictions: {
    [workspaceSlug: string]: {
      allowedApps: string[];
      allowedSections: {
        [appId: string]: string[];
      };
      disabledFeatures: string[];
      sectionOrder?: string[]; // Optional custom section ordering
    };
  };
}

export interface UserRestrictionCheck {
  hasRestrictions: boolean;
  allowedApps: string[];
  allowedSections: { [appId: string]: string[] };
  disabledFeatures: string[];
  sectionOrder?: string[]; // Custom section ordering
}

// Dan's user restrictions for adrata workspace (matching TOP workspace restrictions)
const USER_RESTRICTIONS: UserRestriction[] = [
  {
    userId: '01K1VBYZMWTCT09FWEKBDMCXZM', // Dan's user ID
    email: 'dan@adrata.com',
    workspaceRestrictions: {
      'adrata': {
        allowedApps: ['Speedrun', 'pipeline', 'monaco'],
        allowedSections: {
          'pipeline': ['speedrun', 'leads', 'prospects', 'opportunities', 'companies', 'people'],
          'monaco': ['companies', 'people', 'sellers', 'sequences', 'analytics'],
          'Speedrun': ['inbox', 'prospects', 'leads', 'pipeline', 'analytics', 'settings']
        },
        disabledFeatures: ['OASIS', 'STACKS', 'WORKSHOP', 'METRICS', 'CHRONICLE']
      },
      'Adrata': {
        allowedApps: ['Speedrun', 'pipeline', 'monaco'],
        allowedSections: {
          'pipeline': ['speedrun', 'leads', 'prospects', 'opportunities', 'companies', 'people'],
          'monaco': ['companies', 'people', 'sellers', 'sequences', 'analytics'],
          'Speedrun': ['inbox', 'prospects', 'leads', 'pipeline', 'analytics', 'settings']
        },
        disabledFeatures: ['OASIS', 'STACKS', 'WORKSHOP', 'METRICS', 'CHRONICLE']
      }
    }
  },
  {
    userId: 'dano-user-id', // Dano's user ID (placeholder - will be updated with actual ID)
    email: 'dano@notaryeveryday.com',
    workspaceRestrictions: {
      'notary everyday': {
        allowedApps: ['pipeline', 'monaco'],
        allowedSections: {
          'pipeline': ['speedrun', 'leads', 'prospects', 'opportunities', 'clients', 'people', 'companies', 'partners', 'chronicle', 'metrics'],
          'monaco': ['companies', 'people', 'sellers', 'sequences', 'analytics']
        },
        disabledFeatures: ['OASIS', 'STACKS', 'WORKSHOP'],
        sectionOrder: ['speedrun', 'leads', 'prospects', 'opportunities', 'clients', 'people', 'companies', 'partners', 'chronicle', 'metrics'] // Custom section ordering with all sections in specified order
      },
      'Notary Everyday': {
        allowedApps: ['pipeline', 'monaco'],
        allowedSections: {
          'pipeline': ['speedrun', 'leads', 'prospects', 'opportunities', 'clients', 'people', 'companies', 'partners', 'chronicle', 'metrics'],
          'monaco': ['companies', 'people', 'sellers', 'sequences', 'analytics']
        },
        disabledFeatures: ['OASIS', 'STACKS', 'WORKSHOP'],
        sectionOrder: ['speedrun', 'leads', 'prospects', 'opportunities', 'clients', 'people', 'companies', 'partners', 'chronicle', 'metrics'] // Custom section ordering with all sections in specified order
      }
    }
  }
];

/**
 * Check if a user has restrictions in a specific workspace
 */
export function hasUserRestrictions(
  userId: string, 
  userEmail: string, 
  workspaceSlug: string
): boolean {
  const restriction = findUserRestriction(userId, userEmail, workspaceSlug);
  return restriction !== null;
}

/**
 * Get user restrictions for a specific workspace
 */
export function getUserRestrictions(
  userId: string, 
  userEmail: string, 
  workspaceSlug: string
): UserRestrictionCheck {
  const restriction = findUserRestriction(userId, userEmail, workspaceSlug);
  
  // Debug logging for Dan
  if (userEmail === 'dan@adrata.com') {
    console.log('🔒 UserRestrictions Debug:', {
      userId,
      userEmail,
      workspaceSlug,
      workspaceSlugLower: workspaceSlug.toLowerCase(),
      restrictionFound: !!restriction,
      restriction
    });
  }
  
  if (!restriction) {
    return {
      hasRestrictions: false,
      allowedApps: [],
      allowedSections: {},
      disabledFeatures: []
    };
  }

  const workspaceRestriction = restriction.workspaceRestrictions[workspaceSlug.toLowerCase()];
  
  // Debug logging for Dan
  if (userEmail === 'dan@adrata.com') {
    console.log('🔒 WorkspaceRestriction Debug:', {
      workspaceSlugLower: workspaceSlug.toLowerCase(),
      workspaceRestriction,
      hasRestrictions: true
    });
  }
  
  return {
    hasRestrictions: true,
    allowedApps: workspaceRestriction?.allowedApps || [],
    allowedSections: workspaceRestriction?.allowedSections || {},
    disabledFeatures: workspaceRestriction?.disabledFeatures || [],
    sectionOrder: workspaceRestriction?.sectionOrder
  };
}

/**
 * Check if a specific app is allowed for a user in a workspace
 */
export function isAppAllowedForUser(
  appId: string,
  userId: string,
  userEmail: string,
  workspaceSlug: string
): boolean {
  const restrictions = getUserRestrictions(userId, userEmail, workspaceSlug);
  
  if (!restrictions.hasRestrictions) {
    return true; // No restrictions, allow all apps
  }
  
  return restrictions.allowedApps.includes(appId);
}

/**
 * Check if a specific section is allowed for a user in a workspace and app
 */
export function isSectionAllowedForUser(
  sectionId: string,
  appId: string,
  userId: string,
  userEmail: string,
  workspaceSlug: string
): boolean {
  const restrictions = getUserRestrictions(userId, userEmail, workspaceSlug);
  
  if (!restrictions.hasRestrictions) {
    return true; // No restrictions, allow all sections
  }
  
  const allowedSections = restrictions.allowedSections[appId] || [];
  return allowedSections.includes(sectionId);
}

/**
 * Check if a specific feature is disabled for a user in a workspace
 */
export function isFeatureDisabledForUser(
  feature: string,
  userId: string,
  userEmail: string,
  workspaceSlug: string
): boolean {
  const restrictions = getUserRestrictions(userId, userEmail, workspaceSlug);
  
  if (!restrictions.hasRestrictions) {
    return false; // No restrictions, allow all features
  }
  
  return restrictions.disabledFeatures.includes(feature);
}

/**
 * Get filtered sections for a user in a workspace and app
 */
export function getFilteredSectionsForUser(
  appId: string,
  userId: string,
  userEmail: string,
  workspaceSlug: string
): string[] {
  const restrictions = getUserRestrictions(userId, userEmail, workspaceSlug);
  
  if (!restrictions.hasRestrictions) {
    return []; // No restrictions, return empty (will fall back to workspace defaults)
  }
  
  return restrictions.allowedSections[appId] || [];
}

/**
 * Get custom section order for a user in a workspace
 */
export function getCustomSectionOrder(
  userId: string,
  userEmail: string,
  workspaceSlug: string
): string[] | null {
  const restrictions = getUserRestrictions(userId, userEmail, workspaceSlug);
  
  if (!restrictions.hasRestrictions || !restrictions.sectionOrder) {
    return null; // No custom ordering
  }
  
  return restrictions.sectionOrder;
}

/**
 * Find user restriction by user ID or email and workspace
 */
function findUserRestriction(
  userId: string,
  userEmail: string,
  workspaceSlug: string
): UserRestriction | null {
  return USER_RESTRICTIONS.find(restriction => 
    (restriction.userId === userId || restriction.email === userEmail) &&
    restriction.workspaceRestrictions[workspaceSlug.toLowerCase()]
  ) || null;
}

/**
 * Add a new user restriction (for future extensibility)
 */
export function addUserRestriction(restriction: UserRestriction): void {
  // In a real implementation, this would be stored in a database
  // For now, we'll just add to the in-memory array
  const existingIndex = USER_RESTRICTIONS.findIndex(r => 
    r.userId === restriction.userId && r.email === restriction.email
  );
  
  if (existingIndex >= 0) {
    USER_RESTRICTIONS[existingIndex] = restriction;
  } else {
    USER_RESTRICTIONS.push(restriction);
  }
}

/**
 * Remove user restrictions (for future extensibility)
 */
export function removeUserRestriction(userId: string, userEmail: string): void {
  const index = USER_RESTRICTIONS.findIndex(r => 
    r.userId === userId || r.email === userEmail
  );
  
  if (index >= 0) {
    USER_RESTRICTIONS.splice(index, 1);
  }
}
