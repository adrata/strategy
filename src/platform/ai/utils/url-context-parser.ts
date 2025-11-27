/**
 * 🔍 URL CONTEXT PARSER
 * 
 * Simple utility to understand what page/section the user is viewing.
 * Used when React context is unavailable to determine what data to fetch.
 */

export interface UrlContext {
  type: 'list' | 'detail' | 'unknown';
  section: string | null; // speedrun, leads, prospects, opportunities, companies, people, etc.
  recordId: string | null;
  workspaceSlug: string | null;
}

// Valid pipeline sections
export const VALID_SECTIONS = [
  'speedrun',
  'leads', 
  'prospects',
  'opportunities',
  'companies',
  'people',
  'clients',
  'partners',
  'sellers'
];

/**
 * Parse URL pathname to understand user's current view
 */
export function parseContextFromUrl(pathname: string): UrlContext {
  const result: UrlContext = {
    type: 'unknown',
    section: null,
    recordId: null,
    workspaceSlug: null
  };

  if (!pathname) return result;

  // Split path: /workspace/section/record-slug-ID
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  
  if (segments.length < 2) return result;

  result.workspaceSlug = segments[0];
  const section = segments[1]?.toLowerCase();
  
  if (VALID_SECTIONS.includes(section)) {
    result.section = section;

    // Check for record ID (ULID is 26 chars)
    if (segments[2]) {
      const ulidMatch = segments[2].match(/([A-Z0-9]{26})$/i);
      if (ulidMatch) {
        result.type = 'detail';
        result.recordId = ulidMatch[1].toUpperCase();
      } else {
        result.type = 'list';
      }
    } else {
      result.type = 'list';
    }
  }

  return result;
}

/**
 * Get database table for a section
 */
export function getSectionTable(section: string): 'people' | 'companies' | null {
  const peopleSections = ['speedrun', 'leads', 'prospects', 'people', 'clients', 'partners', 'sellers'];
  const companySections = ['companies', 'opportunities'];
  
  if (peopleSections.includes(section)) return 'people';
  if (companySections.includes(section)) return 'companies';
  return null;
}

/**
 * Get status filter for section (for people table)
 */
export function getSectionStatusFilter(section: string): string | null {
  const statusMap: Record<string, string> = {
    'leads': 'LEAD',
    'prospects': 'PROSPECT',
    'speedrun': 'PROSPECT',
    'clients': 'CLIENT',
    'partners': 'PARTNER',
    'sellers': 'SELLER'
  };
  return statusMap[section] || null;
}

/**
 * Get friendly section name for AI responses
 */
export function getSectionDisplayName(section: string): string {
  const displayNames: Record<string, string> = {
    'speedrun': 'Speedrun',
    'leads': 'Leads',
    'prospects': 'Prospects',
    'opportunities': 'Opportunities',
    'companies': 'Companies',
    'people': 'People',
    'clients': 'Clients',
    'partners': 'Partners',
    'sellers': 'Sellers'
  };
  return displayNames[section] || section;
}

