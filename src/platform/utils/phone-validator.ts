/**
 * 📞 PHONE VALIDATION UTILITY
 * 
 * Validates phone numbers and filters out fake/demo data
 * Returns null for invalid numbers to trigger dash display in UI
 */

export interface PhoneValidationResult {
  isValid: boolean;
  phone: string | null;
  reason?: string;
}

/**
 * Validates if a phone number is real (not fake/demo data)
 * @param phone - The phone number to validate
 * @returns PhoneValidationResult with validation status
 */
export function validatePhoneNumber(phone: string | null | undefined): PhoneValidationResult {
  // Return null for empty/undefined phones
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      phone: null,
      reason: 'Empty phone number'
    };
  }

  const cleanPhone = phone.trim();

  // Check for obvious fake/placeholder patterns
  const fakePatterns = [
    // 555 exchange numbers (fake)
    /555-\d{3}-\d{4}/,
    /\+1-555-\d{3}-\d{4}/,
    /555\d{7}/,
    /\+1555\d{7}/,
    
    // Sequential/repeating patterns
    /123-456-\d{4}/,
    /000-000-\d{4}/,
    /111-111-\d{4}/,
    /222-222-\d{4}/,
    /333-333-\d{4}/,
    /444-444-\d{4}/,
    /666-666-\d{4}/,
    /777-777-\d{4}/,
    /888-888-\d{4}/,
    /999-999-\d{4}/,
    
    // All zeros or ones
    /000-000-0000/,
    /111-111-1111/,
    /\+1-000-000-0000/,
    /\+1-111-111-1111/,
    
    // Test numbers
    /test/i,
    /demo/i,
    /fake/i,
    /placeholder/i
  ];

  // Check if phone matches any fake patterns
  for (const pattern of fakePatterns) {
    if (pattern.test(cleanPhone)) {
      return {
        isValid: false,
        phone: null,
        reason: `Fake phone pattern detected: ${cleanPhone}`
      };
    }
  }

  // Check for generic/toll-free numbers (these are often not useful for direct contact)
  const genericPatterns = [
    /\+1-800-/,
    /\+1-888-/,
    /\+1-877-/,
    /\+1-866-/,
    /\+1-855-/,
    /1-800-/,
    /1-888-/,
    /1-877-/,
    /1-866-/,
    /1-855-/,
    /800-/,
    /888-/,
    /877-/,
    /866-/,
    /855-/
  ];

  for (const pattern of genericPatterns) {
    if (pattern.test(cleanPhone)) {
      return {
        isValid: false,
        phone: null,
        reason: `Generic/toll-free number: ${cleanPhone}`
      };
    }
  }

  // Basic format validation - should have at least 10 digits
  const digitsOnly = cleanPhone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      phone: null,
      reason: `Too short: ${cleanPhone}`
    };
  }

  // If we get here, the phone appears to be valid
  return {
    isValid: true,
    phone: cleanPhone
  };
}

/**
 * Formats a valid phone number for display
 * @param phone - The phone number to format
 * @returns Formatted phone number or null if invalid
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string | null {
  const validation = validatePhoneNumber(phone);
  
  if (!validation.isValid) {
    return null;
  }

  const cleanPhone = validation.phone!;
  
  // If it already starts with +1, return as is
  if (cleanPhone.startsWith('+1')) {
    return cleanPhone;
  }
  
  // Add +1 prefix for US numbers
  if (cleanPhone.length === 10) {
    return `+1 ${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  }
  
  // For other formats, return as is
  return cleanPhone;
}

/**
 * Gets display value for phone field (returns dash for invalid phones)
 * @param phone - The phone number to process
 * @returns Display value: formatted phone or "-" for invalid/missing
 */
export function getPhoneDisplayValue(phone: string | null | undefined): string {
  const formatted = formatPhoneForDisplay(phone);
  return formatted || '-';
}
