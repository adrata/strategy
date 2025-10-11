/**
 * PURE VALIDATION FUNCTION
 * Validates company input for discovery pipelines
 * 
 * Pure function: no side effects, deterministic, testable
 */

import { ValidationError, RequiredFieldError, InvalidFormatError } from '../types/errors';

export interface CompanyInput {
  companyName: string;
  website?: string;
  domain?: string;
}

export interface ValidatedCompanyInput {
  companyName: string;
  website?: string;
  domain?: string;
  validated: true;
}

/**
 * Validate company input
 * @throws Error if validation fails
 */
export function validateCompanyInput(input: CompanyInput): ValidatedCompanyInput {
  // Validate company name
  if (!input.companyName || typeof input.companyName !== 'string') {
    throw new RequiredFieldError('companyName');
  }

  const trimmedName = input.companyName.trim();

  if (trimmedName.length < 2) {
    throw new ValidationError('companyName must be at least 2 characters', 'companyName', input.companyName, { minLength: 2 });
  }

  if (trimmedName.length > 200) {
    throw new ValidationError('companyName must be less than 200 characters', 'companyName', input.companyName, { maxLength: 200 });
  }

  // Validate website if provided
  if (input.website) {
    const trimmedWebsite = input.website.trim();
    
    if (!isValidUrl(trimmedWebsite) && !trimmedWebsite.includes('.')) {
      throw new InvalidFormatError('website', trimmedWebsite, 'valid URL or domain', { example: 'https://example.com' });
    }

    return {
      companyName: trimmedName,
      website: trimmedWebsite,
      domain: input.domain?.trim(),
      validated: true
    };
  }

  return {
    companyName: trimmedName,
    domain: input.domain?.trim(),
    validated: true
  };
}

/**
 * Validate URL format (pure helper function)
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalize company name for comparison (pure function)
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

