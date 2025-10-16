/**
 * 🧠 INTELLIGENCE VALIDATION UTILITY
 * 
 * Ensures all intelligence generation produces complete, grammatically correct text
 * by validating data and providing smart fallbacks for missing information.
 */

export interface PersonData {
  name?: string;
  title?: string;
  company?: string | { name?: string };
  industry?: string;
  department?: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasCompleteData: boolean;
  missingFields: string[];
  fallbackData: PersonData;
}

/**
 * Validates person data and provides smart fallbacks
 */
export function validatePersonData(data: PersonData): ValidationResult {
  const missingFields: string[] = [];
  const fallbackData: PersonData = { ...data };

  // Check for missing or empty critical fields
  if (!data.name || data.name.trim() === '') {
    missingFields.push('name');
    fallbackData.name = 'This professional';
  }

  if (!data.title || data.title.trim() === '') {
    missingFields.push('title');
    fallbackData.title = 'Professional';
  }

  // Normalize company field - handle both string and object formats
  const companyValue = typeof data.company === 'string' 
    ? data.company 
    : (data.company?.name || '');

  if (!companyValue || companyValue.trim() === '') {
    missingFields.push('company');
    fallbackData.company = 'their organization';
  } else {
    fallbackData.company = companyValue;
  }

  const isValid = missingFields.length === 0;
  const hasCompleteData = missingFields.length === 0;

  return {
    isValid,
    hasCompleteData,
    missingFields,
    fallbackData
  };
}

/**
 * Generates a complete, grammatically correct sentence about a person
 */
export function generatePersonSentence(data: PersonData): string {
  const validation = validatePersonData(data);
  const { name, title, company } = validation.fallbackData;

  // If we have complete data, use the standard format
  if (validation.hasCompleteData) {
    return `${name} is a ${title} at ${company}.`;
  }

  // If company is missing, avoid the "at ," pattern
  if (validation.missingFields.includes('company')) {
    return `${name} serves as a ${title}.`;
  }

  // If title is missing, use a more generic approach
  if (validation.missingFields.includes('title')) {
    return `${name} works at ${company}.`;
  }

  // If name is missing, use a more generic approach
  if (validation.missingFields.includes('name')) {
    return `This ${title} at ${company} is focused on professional growth.`;
  }

  // Fallback for multiple missing fields
  return 'This professional serves as a Professional.';
}

/**
 * Generates a complete wants/needs statement
 */
export function generateWantsStatement(data: PersonData, want: string): string {
  const validation = validatePersonData(data);
  const { name, title, company } = validation.fallbackData;

  // If we have complete data, use the full format
  if (validation.hasCompleteData) {
    return `As a ${title}, ${name} wants to ${want} and drive meaningful impact at ${company}.`;
  }

  // If company is missing, avoid the "at ," pattern
  if (validation.missingFields.includes('company')) {
    return `As a ${title}, ${name} wants to ${want} and drive meaningful impact in their role.`;
  }

  // If title is missing, use a simpler format
  if (validation.missingFields.includes('title')) {
    return `${name} wants to ${want} and drive meaningful impact at ${company}.`;
  }

  // If name is missing, use a more generic approach
  if (validation.missingFields.includes('name')) {
    return `This ${title} wants to ${want} and drive meaningful impact at ${company}.`;
  }

  // Fallback for multiple missing fields
  return `This professional wants to ${want} and drive meaningful impact.`;
}

/**
 * Generates a complete needs statement
 */
export function generateNeedsStatement(data: PersonData, need: string): string {
  const validation = validatePersonData(data);
  const { name, title, company } = validation.fallbackData;

  // If we have complete data, use the full format
  if (validation.hasCompleteData) {
    return `${name} needs ${need} to optimize operational efficiency at ${company}.`;
  }

  // If company is missing, avoid the "at ," pattern
  if (validation.missingFields.includes('company')) {
    return `${name} needs ${need} to optimize operational efficiency in their role.`;
  }

  // If title is missing, use a simpler format
  if (validation.missingFields.includes('title')) {
    return `${name} needs ${need} to optimize operational efficiency at ${company}.`;
  }

  // If name is missing, use a more generic approach
  if (validation.missingFields.includes('name')) {
    return `This ${title} needs ${need} to optimize operational efficiency at ${company}.`;
  }

  // Fallback for multiple missing fields
  return `This professional needs ${need} to optimize operational efficiency.`;
}

/**
 * Validates and cleans AI-generated text to ensure no incomplete sentences
 */
export function validateAIGeneratedText(text: string): string {
  if (!text) return '';

  // Remove incomplete sentences with trailing prepositions
  const incompletePatterns = [
    /at\s*,\s*/g,           // "at ,"
    /as\s+a\s+.*\s+at\s*,\s*/g,  // "As a VP of Operations at ,"
    /at\s+,\s*/g,           // "at ,"
    /,\s*$/g,               // trailing comma
    /\s+at\s*$/g,           // "at" at end of sentence
  ];

  let cleanedText = text;
  incompletePatterns.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });

  // Ensure sentence ends properly
  cleanedText = cleanedText.trim();
  if (cleanedText && !cleanedText.match(/[.!?]$/)) {
    cleanedText += '.';
  }

  return cleanedText;
}

/**
 * Checks if a string contains incomplete patterns that should be avoided
 */
export function hasIncompletePatterns(text: string): boolean {
  const incompletePatterns = [
    /at\s*,\s*/,           // "at ,"
    /as\s+a\s+.*\s+at\s*,\s*/,  // "As a VP of Operations at ,"
    /at\s+,\s*/,           // "at ,"
    /,\s*$/,               // trailing comma
    /\s+at\s*$/,           // "at" at end of sentence
  ];

  return incompletePatterns.some(pattern => pattern.test(text));
}

/**
 * Generates a safe fallback message when data is insufficient
 */
export function generateFallbackMessage(data: PersonData, type: 'wants' | 'needs' | 'summary'): string {
  const validation = validatePersonData(data);
  
  if (type === 'wants') {
    return `${validation.fallbackData.name} is focused on professional growth and career advancement.`;
  }
  
  if (type === 'needs') {
    return `${validation.fallbackData.name} requires solutions that support their professional objectives.`;
  }
  
  if (type === 'summary') {
    return `${validation.fallbackData.name} is a ${validation.fallbackData.title} focused on achieving professional success.`;
  }
  
  return 'This professional is focused on career advancement.';
}
