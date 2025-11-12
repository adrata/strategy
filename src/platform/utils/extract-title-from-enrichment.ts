/**
 * Extract Title from Enrichment Data
 * 
 * Utility to extract job titles from existing enrichment data stored in customFields
 * This helps populate titles for leads that have been enriched but titles weren't saved to the main fields
 */

export interface EnrichmentData {
  coresignalData?: any;
  coresignal?: any;
  lusha?: any;
  enrichedData?: any;
  pdlData?: any;
  [key: string]: any;
}

/**
 * Extract title from CoreSignal data
 */
function extractFromCoreSignal(data: any): string | null {
  if (!data) return null;

  // Try active_experience_title first
  if (data.active_experience_title) {
    return data.active_experience_title;
  }

  // Try job_title
  if (data.job_title) {
    return data.job_title;
  }

  // Try experience array - find current role
  if (data.experience && Array.isArray(data.experience)) {
    const currentRole = data.experience.find((exp: any) => 
      exp.active_experience === 1 || exp.is_current === true || !exp.end_date
    );
    if (currentRole?.position_title || currentRole?.title) {
      return currentRole.position_title || currentRole.title;
    }

    // Fallback to most recent role
    if (data.experience.length > 0) {
      const mostRecent = data.experience[0];
      return mostRecent.position_title || mostRecent.title || null;
    }
  }

  return null;
}

/**
 * Extract title from Lusha data
 */
function extractFromLusha(data: any): string | null {
  if (!data) return null;

  // Try currentTitle
  if (data.currentTitle) {
    return data.currentTitle;
  }

  // Try jobTitle
  if (data.jobTitle) {
    return data.jobTitle;
  }

  // Try current_position
  if (data.current_position?.title) {
    return data.current_position.title;
  }

  return null;
}

/**
 * Extract title from PDL data
 */
function extractFromPDL(data: any): string | null {
  if (!data) return null;

  // Try job_title
  if (data.job_title) {
    return data.job_title;
  }

  // Try current_title
  if (data.current_title) {
    return data.current_title;
  }

  // Try experience array
  if (data.experience && Array.isArray(data.experience)) {
    const currentRole = data.experience.find((exp: any) => 
      exp.is_current === true || !exp.end_date
    );
    if (currentRole?.title) {
      return currentRole.title;
    }
  }

  return null;
}

/**
 * Extract title from enrichment data stored in customFields
 * 
 * Priority order:
 * 1. CoreSignal active_experience_title
 * 2. Lusha currentTitle
 * 3. PDL job_title
 * 4. CoreSignal experience array (current role)
 * 5. Other sources
 */
export function extractTitleFromEnrichment(customFields: EnrichmentData | null | undefined): string | null {
  if (!customFields) return null;

  // Try CoreSignal first (most reliable)
  if (customFields.coresignalData) {
    const title = extractFromCoreSignal(customFields.coresignalData);
    if (title) return title;
  }

  if (customFields.coresignal) {
    const title = extractFromCoreSignal(customFields.coresignal);
    if (title) return title;
  }

  // Try Lusha
  if (customFields.lusha) {
    const title = extractFromLusha(customFields.lusha);
    if (title) return title;
  }

  // Try enrichedData (could be Lusha or other)
  if (customFields.enrichedData) {
    const title = extractFromLusha(customFields.enrichedData) || extractFromCoreSignal(customFields.enrichedData);
    if (title) return title;
  }

  // Try PDL
  if (customFields.pdlData) {
    const title = extractFromPDL(customFields.pdlData);
    if (title) return title;
  }

  return null;
}

/**
 * Extract title with fallback chain:
 * 1. Existing title field
 * 2. Existing jobTitle field
 * 3. Enrichment data in customFields
 * 
 * This is the main function to use when you need a title and want to check all sources
 */
export function extractTitleWithFallback(
  title: string | null | undefined,
  jobTitle: string | null | undefined,
  customFields: EnrichmentData | null | undefined
): string | null {
  // First try existing fields
  if (title && title.trim() !== '') return title.trim();
  if (jobTitle && jobTitle.trim() !== '') return jobTitle.trim();

  // Then try enrichment data
  const enrichmentTitle = extractTitleFromEnrichment(customFields);
  if (enrichmentTitle && enrichmentTitle.trim() !== '') {
    return enrichmentTitle.trim();
  }

  return null;
}

