/**
 * Field formatter utilities for consistent display of empty/missing values
 */

/**
 * Helper to format field values with dash fallback
 * @param value - The value to format
 * @param fallback - The fallback value (default: '-')
 * @returns Formatted string value
 */
export const formatFieldValue = (value: any, fallback = '-'): string => {
  if (!value || value === '' || value === 'Unknown' || value === 'Unknown Company' || value === 'Unknown Title') {
    return fallback;
  }
  
  // Handle string values
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? fallback : trimmed;
  }
  
  // Handle arrays (like tags)
  if (Array.isArray(value)) {
    return value.length === 0 ? fallback : value.join(', ');
  }
  
  return String(value);
};

/**
 * Helper to get company name from various formats
 * @param company - Company data (string, object, or null)
 * @returns Formatted company name or dash
 */
export const getCompanyName = (company: any): string => {
  if (!company) return '-';
  
  if (typeof company === 'string') {
    return formatFieldValue(company);
  }
  
  if (typeof company === 'object') {
    const name = company.name || company.companyName;
    return formatFieldValue(name);
  }
  
  return '-';
};

/**
 * Helper to format date values
 * @param date - Date value (string, Date, or null)
 * @returns Formatted date string or dash
 */
export const formatDateValue = (date: any): string => {
  if (!date) return '-';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return '-';
  }
};

/**
 * Helper to format numeric values
 * @param value - Numeric value
 * @param fallback - Fallback value (default: '-')
 * @returns Formatted number or fallback
 */
export const formatNumericValue = (value: any, fallback = '-'): string => {
  if (value === null || value === undefined || value === '') return fallback;
  
  const num = Number(value);
  if (isNaN(num)) return fallback;
  
  return String(num);
};

/**
 * Helper to format array values (like tags, skills)
 * @param value - Array or comma-separated string
 * @param fallback - Fallback value (default: '-')
 * @returns Formatted string or fallback
 */
export const formatArrayValue = (value: any, fallback = '-'): string => {
  if (!value) return fallback;
  
  if (Array.isArray(value)) {
    return value.length === 0 ? fallback : value.join(', ');
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? fallback : trimmed;
  }
  
  return fallback;
};
