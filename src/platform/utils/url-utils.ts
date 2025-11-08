/**
 * 🚀 URL UTILITIES
 * 
 * Utilities for creating human-readable URLs with database IDs
 * Pattern: name-id (e.g., "john-doe-abc123")
 */

/**
 * Generate a URL slug from a name and ID
 * @param name - The human-readable name
 * @param id - The database ID
 * @returns A URL-safe slug in format "name-id" for better readability
 */
export function generateSlug(name: string, id: string): string {
  if (!name || !id) {
    return id || 'unknown';
  }

  // Clean the name: lowercase, replace spaces and special chars with hyphens
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Limit name length to keep URLs reasonable
  const truncatedName = cleanName.substring(0, 50);
  
  // Format: name-id (human-readable name first, then unique ID)
  // Use the full ID to ensure uniqueness even with similar names
  return `${truncatedName}-${id}`;
}

/**
 * Extract the ID from a slug
 * @param slug - The URL slug in format "name-id"
 * @returns The extracted ID
 */
export function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  
  // Handle demo IDs that contain hyphens (e.g., "zp-kirk-harbaugh-2025")
  // Look for patterns that start with "zp-" or are ULIDs (26 chars starting with 0)
  const parts = slug.split('-');
  
  // Check if this is a demo ID pattern - look for "zp" in the slug
  const zpIndex = parts.findIndex(part => part === 'zp');
  if (zpIndex !== -1) {
    // For demo IDs like "kirk-harbaugh-zp-kirk-harbaugh-2025"
    // Reconstruct the demo ID from the "zp" part onwards
    return parts.slice(zpIndex).join('-');
  }
  
  // 🆕 FIX: Handle demo data IDs (cybersecurity-company-*, cybersecurity-person-*, etc.)
  // Look for patterns like "cybersecurity-company-123" or "cybersecurity-person-456"
  const demoPatterns = ['cybersecurity-company', 'cybersecurity-person', 'cybersecurity-seller', 'cybersecurity-speedrun'];
  for (const pattern of demoPatterns) {
    if (slug.includes(pattern)) {
      // Find the pattern in the slug and extract everything from that point
      const patternIndex = slug.indexOf(pattern);
      if (patternIndex !== -1) {
        return slug.substring(patternIndex);
      }
    }
  }
  
  // ULIDs are 26 characters using Crockford's Base32 alphabet: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
  // ULID pattern: exactly 26 characters, starts with timestamp (0-9) or legacy 'c' prefix
  // CUIDs are 25 characters and start with 'c' (legacy support)
  // CUIDs use lowercase alphanumeric characters: c + 24 lowercase letters/numbers
  
  const lastPart = parts[parts.length - 1];
  
  // Check for Zoho IDs first (they have specific prefixes)
  if (lastPart && (lastPart.startsWith('zcrm_') || lastPart.startsWith('zoho_'))) {
    return lastPart;
  }
  
  // ULID: exactly 26 characters, valid Base32 characters (uppercase)
  // ULIDs start with timestamp (0-9) or can start with 'c' for legacy compatibility
  const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
  if (lastPart && ulidPattern.test(lastPart.toUpperCase())) {
    return lastPart;
  }
  
  // CUID: 25 characters starting with 'c' followed by 24 lowercase alphanumeric characters
  // CUIDs use lowercase letters and numbers: c[a-z0-9]{24}
  const cuidPattern = /^c[a-z0-9]{24}$/;
  if (lastPart && cuidPattern.test(lastPart)) {
    return lastPart;
  }
  
  // Try to find ULID at the end of the slug (after last hyphen)
  const ulidMatch = slug.match(/([0-9A-HJKMNP-TV-Z]{26})$/i);
  if (ulidMatch) {
    return ulidMatch[1];
  }
  
  // Try to find CUID at the end (legacy support) - lowercase alphanumeric
  const cuidMatch = slug.match(/(c[a-z0-9]{24})$/);
  if (cuidMatch) {
    return cuidMatch[1];
  }
  
  // Fallback: try to find any ULID/CUID pattern in the slug
  const anyUlidMatch = slug.match(/([0-9A-HJKMNP-TV-Z]{26})/i);
  if (anyUlidMatch) {
    return anyUlidMatch[1];
  }
  
  const anyCuidMatch = slug.match(/(c[a-z0-9]{24})/);
  if (anyCuidMatch) {
    return anyCuidMatch[1];
  }
  
  // Try to find Zoho ID patterns
  const zohoMatch = slug.match(/(zcrm_|zoho_)[a-z0-9_]+/);
  if (zohoMatch) {
    return zohoMatch[0];
  }
  
  // Fallback: return the last part (original behavior)
  return parts[parts.length - 1] || '';
}

/**
 * Generate a pipeline record URL
 * @param section - Pipeline section (leads, prospects, etc.)
 * @param record - The record object with name and id
 * @returns Complete URL path
 */
export function generatePipelineRecordUrl(
  section: string, 
  record: { id: string; name?: string; fullName?: string; firstName?: string; lastName?: string }
): string {
  // Get the best available name
  const name = record.fullName || 
               record.name || 
               (record['firstName'] && record.lastName ? `${record.firstName} ${record.lastName}` : '') ||
               'record';
  
  const slug = generateSlug(name, record.id);
  return `/${section}/${slug}`;
}

/**
 * Validate if a slug matches a record
 * @param slug - The URL slug
 * @param record - The record to validate against
 * @returns True if the slug matches the record
 */
export function validateSlug(
  slug: string, 
  record: { id: string; name?: string; fullName?: string; firstName?: string; lastName?: string }
): boolean {
  const extractedId = extractIdFromSlug(slug);
  return extractedId === record.id;
}

/**
 * Generate a more robust slug that prevents conflicts
 * @param name - The human-readable name
 * @param id - The database ID
 * @returns A URL-safe slug with conflict prevention
 */
export function generateRobustSlug(name: string, id: string): string {
  if (!name || !id) {
    return id || 'unknown';
  }

  // Clean the name more aggressively to prevent conflicts
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Limit name length to keep URLs reasonable
  const truncatedName = cleanName.substring(0, 40);
  
  // Add a hash of the ID to prevent conflicts with similar names
  const idHash = id.substring(0, 8); // Use first 8 characters of ID for uniqueness
  
  // Format: name-idhash-fullid for maximum uniqueness
  return `${truncatedName}-${idHash}-${id}`;
}

/**
 * Generate breadcrumb-friendly name from slug
 * @param slug - The URL slug
 * @returns Human-readable name for breadcrumbs
 */
export function getNameFromSlug(slug: string): string {
  if (!slug) return 'Unknown';
  
  const parts = slug.split('-');
  // Remove the last part (ID) and rejoin
  const nameParts = parts.slice(0, -1);
  
  if (nameParts['length'] === 0) return 'Record';
  
  // Convert back to readable format
  return nameParts
    .join(' ')
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
}
