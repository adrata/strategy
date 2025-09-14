/**
 * Shared name correction utilities for fixing names extracted from emails
 * Used across Monaco and Pipeline standalone apps
 */

export interface PersonWithEmail {
  name?: string;
  fullName?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Enhanced name extraction from email prefix
 */
export function extractNameFromEmail(emailPrefix: string): string {
  let parts: string[] = [];
  
  // Split by common separators
  if (emailPrefix.includes('.')) {
    parts = emailPrefix.split('.');
  } else if (emailPrefix.includes('_')) {
    parts = emailPrefix.split('_');
  } else if (emailPrefix.includes('-')) {
    parts = emailPrefix.split('-');
  } else {
    // For unseparated names, just return as is
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  }

  // Clean and capitalize parts
  parts = parts
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  return parts.length > 1 ? parts.join(' ') : parts[0] || 'Unknown';
}

/**
 * Check if a name looks incorrect and needs correction
 */
export function nameNeedsCorrection(name: string): boolean {
  if (!name) return false;
  
  return (
    name.match(/^[A-Z] [A-Z]$/) ||        // Pattern like "U U"
    name.length <= 3 ||                   // Very short names
    name === 'Unknown Contact' ||
    name === 'Unknown' ||
    name.includes('undefined') ||
    name.match(/^[A-Z]{1,2}$/)           // Single or double letters
  );
}

/**
 * Correct person name from email if needed
 */
export function correctPersonNameFromEmail<T extends PersonWithEmail>(person: T): T {
  // Use name or fullName, whichever is available
  const currentName = person.name || person.fullName;
  
  // Check if name looks incorrect and we have an email
  if (person['email'] && currentName && nameNeedsCorrection(currentName)) {
    const emailPrefix = person.email.split('@')[0];
    const extractedName = extractNameFromEmail(emailPrefix);
    
    if (extractedName && extractedName !== currentName) {
      console.log(`🔧 Auto-correcting person name from "${currentName}" to "${extractedName}" based on email ${person.email}`);
      
      // Update both name and fullName fields
      return {
        ...person,
        name: extractedName,
        fullName: extractedName
      };
    }
  }
  
  return person;
}

/**
 * Correct names for an array of people
 */
export function correctPeopleNamesFromEmails<T extends PersonWithEmail>(people: T[]): T[] {
  return people.map(person => correctPersonNameFromEmail(person));
}

/**
 * Advanced name extraction with business logic
 */
export function extractNameFromEmailAdvanced(email: string): { firstName: string; lastName: string; fullName: string } {
  const emailPrefix = email.split('@')[0];
  let parts: string[] = [];
  
  // Split by common separators
  if (emailPrefix.includes('.')) {
    parts = emailPrefix.split('.');
  } else if (emailPrefix.includes('_')) {
    parts = emailPrefix.split('_');
  } else if (emailPrefix.includes('-')) {
    parts = emailPrefix.split('-');
  } else {
    // For unseparated names like "jdoe", try to detect pattern
    // This is tricky - for now, just treat as first name
    parts = [emailPrefix];
  }

  // Clean and capitalize parts
  parts = parts
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  const firstName = parts[0] || 'Unknown';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Contact';
  const fullName = parts.length > 1 ? parts.join(' ') : firstName;

  return { firstName, lastName, fullName };
}
