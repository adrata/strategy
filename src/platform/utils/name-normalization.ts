/**
 * 📝 NAME NORMALIZATION UTILITY
 * 
 * Ensures consistent name formatting across the system by:
 * - Trimming whitespace
 * - Normalizing multiple spaces to single spaces
 * - Handling null/undefined values
 * - Preserving empty strings for optional fields
 */

/**
 * Normalizes a name field by trimming whitespace and normalizing spaces
 * @param name - The name to normalize (can be string, null, or undefined)
 * @returns Normalized name string, or null if input was null/undefined/empty
 */
export function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;
  
  // Trim and normalize multiple spaces to single space
  const normalized = name.trim().replace(/\s+/g, ' ');
  
  // Return null for empty strings (to distinguish from actual values)
  return normalized === '' ? null : normalized;
}

/**
 * Normalizes firstName and lastName fields
 * @param firstName - First name to normalize
 * @param lastName - Last name to normalize
 * @returns Object with normalized firstName and lastName
 */
export function normalizePersonNames(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): { firstName: string | null; lastName: string | null } {
  return {
    firstName: normalizeName(firstName),
    lastName: normalizeName(lastName)
  };
}

/**
 * Generates a clean fullName from firstName and lastName
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Normalized full name string, or null if both names are empty
 */
export function generateFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null {
  const normalized = normalizePersonNames(firstName, lastName);
  
  if (!normalized.firstName && !normalized.lastName) {
    return null;
  }
  
  if (!normalized.firstName) {
    return normalized.lastName;
  }
  
  if (!normalized.lastName) {
    return normalized.firstName;
  }
  
  return `${normalized.firstName} ${normalized.lastName}`;
}

/**
 * Normalizes a fullName string (handles cases where fullName is provided directly)
 * @param fullName - Full name string to normalize
 * @returns Normalized full name string, or null if empty
 */
export function normalizeFullName(fullName: string | null | undefined): string | null {
  return normalizeName(fullName);
}

/**
 * Sanitizes a name by removing unwanted characters like bullet points and HTML entities
 * @param name - The name to sanitize (can be string, null, or undefined)
 * @returns Sanitized name string, or null if input was null/undefined/empty
 */
export function sanitizeName(name: string | null | undefined): string | null {
  if (!name) return null;
  
  // Remove bullet characters and HTML entities
  // • (U+2022), &bull;, &#8226;, &bullet;
  let sanitized = name
    .replace(/•/g, '') // Remove bullet character (U+2022)
    .replace(/&bull;/g, '') // Remove HTML entity &bull;
    .replace(/&#8226;/g, '') // Remove HTML numeric entity &#8226;
    .replace(/&bullet;/g, '') // Remove HTML entity &bullet;
    .trim();
  
  // Normalize multiple spaces to single space
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Return null for empty strings (to distinguish from actual values)
  return sanitized === '' ? null : sanitized;
}

