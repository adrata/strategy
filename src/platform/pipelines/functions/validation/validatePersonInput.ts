/**
 * PURE VALIDATION FUNCTION
 * Validates person input for research pipelines
 */

export interface PersonInput {
  name: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
}

export interface ValidatedPersonInput {
  name: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  validated: true;
}

/**
 * Validate person input for research
 * @throws Error if validation fails
 */
export function validatePersonInput(input: PersonInput): ValidatedPersonInput {
  // Validate name
  if (!input.name || typeof input.name !== 'string') {
    throw new Error('name is required and must be a string');
  }

  const trimmedName = input.name.trim();

  if (trimmedName.length < 2) {
    throw new Error('name must be at least 2 characters');
  }

  if (trimmedName.length > 200) {
    throw new Error('name must be less than 200 characters');
  }

  // Validate company if provided
  if (input.company && (typeof input.company !== 'string' || input.company.trim().length < 2)) {
    throw new Error('company, if provided, must be a string with at least 2 characters');
  }

  // Validate title if provided
  if (input.title && typeof input.title !== 'string') {
    throw new Error('title, if provided, must be a string');
  }

  // Validate LinkedIn URL if provided
  if (input.linkedinUrl && !isValidLinkedInUrl(input.linkedinUrl)) {
    throw new Error('linkedinUrl, if provided, must be a valid LinkedIn URL');
  }

  return {
    name: trimmedName,
    company: input.company?.trim(),
    title: input.title?.trim(),
    linkedinUrl: input.linkedinUrl?.trim(),
    validated: true
  };
}

/**
 * Validate LinkedIn URL format (pure function)
 */
export function isValidLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('linkedin.com') && parsed.pathname.includes('/in/');
  } catch {
    return false;
  }
}

