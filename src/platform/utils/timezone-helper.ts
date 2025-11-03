/**
 * Timezone helper utilities for timezone selection and formatting
 */

export interface TimezoneOption {
  value: string;
  label: string;
  group: string;
}

/**
 * Common IANA timezone options organized by region
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (ET)', group: 'North America' },
  { value: 'America/Chicago', label: 'Central Time (CT)', group: 'North America' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', group: 'North America' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MST)', group: 'North America' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', group: 'North America' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', group: 'North America' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', group: 'North America' },
  { value: 'America/Toronto', label: 'Eastern Time - Toronto', group: 'North America' },
  { value: 'America/Vancouver', label: 'Pacific Time - Vancouver', group: 'North America' },
  { value: 'America/Mexico_City', label: 'Central Time - Mexico City', group: 'North America' },
  
  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', group: 'Europe' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', group: 'Europe' },
  { value: 'Europe/Berlin', label: 'Central European Time - Berlin', group: 'Europe' },
  { value: 'Europe/Rome', label: 'Central European Time - Rome', group: 'Europe' },
  { value: 'Europe/Madrid', label: 'Central European Time - Madrid', group: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Central European Time - Amsterdam', group: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Central European Time - Stockholm', group: 'Europe' },
  { value: 'Europe/Dublin', label: 'Greenwich Mean Time - Dublin', group: 'Europe' },
  { value: 'Europe/Lisbon', label: 'Western European Time - Lisbon', group: 'Europe' },
  { value: 'Europe/Athens', label: 'Eastern European Time - Athens', group: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow Time (MSK)', group: 'Europe' },
  
  // Asia
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', group: 'Asia' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', group: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (HKT)', group: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)', group: 'Asia' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', group: 'Asia' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', group: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', group: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)', group: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Western Indonesia Time (WIB)', group: 'Asia' },
  { value: 'Asia/Manila', label: 'Philippine Time (PHT)', group: 'Asia' },
  
  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', group: 'Australia & Pacific' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time - Melbourne', group: 'Australia & Pacific' },
  { value: 'Australia/Brisbane', label: 'Australian Eastern Time - Brisbane', group: 'Australia & Pacific' },
  { value: 'Australia/Perth', label: 'Australian Western Time (AWST)', group: 'Australia & Pacific' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)', group: 'Australia & Pacific' },
  
  // South America
  { value: 'America/Sao_Paulo', label: 'Brasilia Time (BRT)', group: 'South America' },
  { value: 'America/Buenos_Aires', label: 'Argentina Time (ART)', group: 'South America' },
  { value: 'America/Lima', label: 'Peru Time (PET)', group: 'South America' },
  { value: 'America/Santiago', label: 'Chile Time (CLT)', group: 'South America' },
  
  // Africa & Middle East
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time (SAST)', group: 'Africa & Middle East' },
  { value: 'Africa/Cairo', label: 'Eastern European Time - Cairo', group: 'Africa & Middle East' },
  { value: 'Asia/Jerusalem', label: 'Israel Standard Time (IST)', group: 'Africa & Middle East' },
  { value: 'Asia/Riyadh', label: 'Arabia Standard Time (AST)', group: 'Africa & Middle East' },
];

/**
 * Get timezone options grouped by region
 */
export function getTimezoneOptionsGrouped(): Record<string, TimezoneOption[]> {
  const grouped: Record<string, TimezoneOption[]> = {};
  
  TIMEZONE_OPTIONS.forEach(option => {
    if (!grouped[option.group]) {
      grouped[option.group] = [];
    }
    grouped[option.group].push(option);
  });
  
  return grouped;
}

/**
 * Format date/time using a specific timezone
 */
export function formatDateTimeInTimezone(date: Date, timezone: string): {
  dayOfWeek: string;
  month: string;
  day: number;
  year: number;
  time: string;
  timezoneName: string;
  isoDateTime: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  const parts = formatter.formatToParts(date);
  
  const dayOfWeek = parts.find(p => p.type === 'weekday')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  const second = parts.find(p => p.type === 'second')?.value || '';
  const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || '';
  
  const time = `${hour}:${minute}:${second} ${timeZoneName}`;
  
  // Create ISO-like string in the specified timezone (YYYY-MM-DD HH:mm:ss)
  const yearStr = year.toString().padStart(4, '0');
  const monthStr = (['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month) + 1)
    .toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const [timePart] = time.split(' ');
  const isoString = `${yearStr}-${monthStr}-${dayStr} ${timePart}`;

  return {
    dayOfWeek,
    month,
    day,
    year,
    time,
    timezoneName: timezone,
    isoDateTime: isoString
  };
}

/**
 * Get default timezone (browser's timezone or America/New_York)
 */
export function getDefaultTimezone(): string {
  if (typeof window !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return 'America/New_York';
}

