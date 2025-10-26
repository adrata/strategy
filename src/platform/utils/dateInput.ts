/**
 * Date input utility functions for parsing, formatting, and validating manually typed dates
 */

/**
 * Auto-formats date input as user types, adding slashes automatically
 * Examples: "10242025" -> "10/24/2025", "1024" -> "10/24"
 */
export function formatDateInput(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  
  // Limit to 8 digits (MM/DD/YYYY)
  const limited = numbers.slice(0, 8);
  return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
}

/**
 * Parses various date formats and returns a Date object or null if invalid
 * Supports: MM/DD/YYYY, M/D/YYYY, MM/DD/YY, YYYY-MM-DD, etc.
 */
export function parseDateInput(value: string): Date | null {
  if (!value || value.trim() === '') return null;
  
  // Clean the input - remove extra spaces and normalize
  const cleanValue = value.trim().replace(/\s+/g, ' ');
  
  // Try different date formats
  const formats = [
    // MM/DD/YYYY or M/D/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // MM/DD/YY or M/D/YY (convert 2-digit year to 4-digit)
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // YYYY/MM/DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
  ];
  
  for (const format of formats) {
    const match = cleanValue.match(format);
    if (match) {
      let month: number, day: number, year: number;
      
      if (format.source.includes('(\\d{4})')) {
        // YYYY-MM-DD or YYYY/MM/DD format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      } else {
        // MM/DD/YYYY or MM/DD/YY format
        month = parseInt(match[1], 10);
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
        
        // Handle 2-digit years
        if (year < 100) {
          const currentYear = new Date().getFullYear();
          const currentCentury = Math.floor(currentYear / 100) * 100;
          year += currentCentury;
          
          // If the 2-digit year would be more than 50 years in the future, assume previous century
          if (year > currentYear + 50) {
            year -= 100;
          }
        }
      }
      
      // Validate the date
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        
        // Check if the date is valid (handles leap years, month boundaries, etc.)
        if (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        ) {
          return date;
        }
      }
    }
  }
  
  return null;
}

/**
 * Validates if a date string is in a valid format and represents a real date
 */
export function validateDateFormat(value: string): boolean {
  return parseDateInput(value) !== null;
}

/**
 * Gets the appropriate date format placeholder for the user's locale
 * Defaults to MM/DD/YYYY for US locale
 */
export function getDateFormatPlaceholder(): string {
  // For now, default to MM/DD/YYYY format
  // In the future, this could be enhanced to detect user locale
  return 'MM/DD/YYYY';
}

/**
 * Formats a Date object to a display string for the input field
 * Returns in MM/DD/YYYY format
 */
export function formatDateForInput(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

/**
 * Checks if a date string is a valid partial date (e.g., "10/24" is valid partial)
 */
export function isValidPartialDate(value: string): boolean {
  if (!value || value.trim() === '') return true;
  
  // Remove slashes and check if it's all numbers
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return true;
  
  // Check if it's a valid partial date
  if (numbers.length <= 2) {
    const month = parseInt(numbers, 10);
    return month >= 1 && month <= 12;
  }
  
  if (numbers.length <= 4) {
    const month = parseInt(numbers.slice(0, 2), 10);
    const day = parseInt(numbers.slice(2), 10);
    return month >= 1 && month <= 12 && day >= 1 && day <= 31;
  }
  
  // For longer inputs, use full validation
  return validateDateFormat(value);
}

/**
 * Validates if a Date object is valid
 */
export function isValidDate(date: Date | null | undefined): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Formats a date for display in the UI
 * Returns a user-friendly string or empty string for invalid dates
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(dateObj)) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Clears a date value - converts empty strings, dashes, and invalid dates to null
 */
export function clearDateValue(value: string | null | undefined): string | null {
  if (!value || value.trim() === '' || value === '-') return null;
  
  const date = new Date(value);
  if (!isValidDate(date)) return null;
  
  return value;
}