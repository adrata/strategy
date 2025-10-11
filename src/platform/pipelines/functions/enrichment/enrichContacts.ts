/**
 * PURE ENRICHMENT FUNCTION
 * Enriches people with contact information
 */

import type { Person } from '../discovery/discoverPeople';
import type { EnrichmentLevel } from '../validation/validateRoleCriteria';

export interface EnrichedPerson extends Person {
  email?: string;
  phone?: string;
  linkedIn?: string;
  enrichmentLevel: EnrichmentLevel;
}

/**
 * Enrich people with contact information based on enrichment level
 * 
 * Pure function: given same inputs, returns same outputs
 */
import type { APIClients } from '../types/api-clients';

export async function enrichContacts(
  people: Person[],
  enrichmentLevel: EnrichmentLevel,
  apis: APIClients
): Promise<EnrichedPerson[]> {
  // Skip enrichment for 'discover' level
  if (enrichmentLevel === 'discover') {
    console.log(`⏭️  [ENRICH] Skipping contact enrichment (discover level)`);
    return people.map(p => ({ ...p, enrichmentLevel: 'discover' }));
  }

  console.log(`📧 [ENRICH] Enriching ${people.length} contacts (level: ${enrichmentLevel})`);

  // TODO: Integrate with actual APIs
  // const enriched = await Promise.all(
  //   people.map(person => enrichSingleContact(person, apis))
  // );

  // Mock enrichment for now
  const enriched: EnrichedPerson[] = people.map(person => ({
    ...person,
    email: `${person.name.toLowerCase().replace(' ', '.')}@${person.company.toLowerCase()}.com`,
    phone: enrichmentLevel !== 'discover' ? '+1-555-0123' : undefined,
    linkedIn: enrichmentLevel !== 'discover'
      ? `https://linkedin.com/in/${person.name.toLowerCase().replace(' ', '')}`
      : undefined,
    enrichmentLevel
  }));

  return enriched;
}

/**
 * Enrich single contact (pure function)
 */
async function enrichSingleContact(
  person: Person,
  apis: APIClients
): Promise<EnrichedPerson> {
  // TODO: Implement actual enrichment
  // 1. Try Lusha
  // 2. Try People Data Labs
  // 3. Try ZeroBounce for email validation
  
  return {
    ...person,
    enrichmentLevel: 'enrich'
  };
}

/**
 * Validate email (pure function)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

