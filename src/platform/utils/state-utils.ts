/**
 * State Utility Functions
 * Standardizes state display (abbreviations vs full names)
 */

// State abbreviation to full name mapping
const STATE_MAPPING: Record<string, string> = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// Reverse mapping: full name to abbreviation
const STATE_ABBREVIATION_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_MAPPING).map(([abbr, full]) => [full, abbr])
);

// Case-insensitive lookup helpers
const getAbbreviation = (state: string): string | null => {
  if (!state) return null;
  const upper = state.toUpperCase().trim();
  // Check if it's already an abbreviation
  if (STATE_MAPPING[upper]) return upper;
  // Check if it's a full name (case-insensitive)
  const fullName = Object.keys(STATE_ABBREVIATION_MAPPING).find(
    name => name.toLowerCase() === state.toLowerCase()
  );
  return fullName ? STATE_ABBREVIATION_MAPPING[fullName] : null;
};

const getFullName = (state: string): string | null => {
  if (!state) return null;
  const upper = state.toUpperCase().trim();
  // Check if it's an abbreviation
  if (STATE_MAPPING[upper]) return STATE_MAPPING[upper];
  // Check if it's already a full name (case-insensitive)
  const fullName = Object.keys(STATE_ABBREVIATION_MAPPING).find(
    name => name.toLowerCase() === state.toLowerCase()
  );
  return fullName || null;
};

/**
 * Standardize state to abbreviation (e.g., "California" -> "CA")
 * Returns the original value if it can't be normalized
 */
export function standardizeStateToAbbreviation(state: string | null | undefined): string {
  if (!state || state === '-') return '-';
  const abbr = getAbbreviation(state);
  return abbr || state; // Return original if can't normalize
}

/**
 * Standardize state to full name (e.g., "CA" -> "California")
 * Returns the original value if it can't be normalized
 */
export function standardizeStateToFullName(state: string | null | undefined): string {
  if (!state || state === '-') return '-';
  const full = getFullName(state);
  return full || state; // Return original if can't normalize
}

/**
 * Standardize state - defaults to abbreviation for table display
 * Can be configured to use full names if preferred
 */
export function standardizeState(
  state: string | null | undefined,
  format: 'abbreviation' | 'full' = 'abbreviation'
): string {
  if (!state || state === '-') return '-';
  return format === 'abbreviation' 
    ? standardizeStateToAbbreviation(state)
    : standardizeStateToFullName(state);
}

/**
 * Get state display value with fallback chain
 * Checks hqState, state, company.hqState, company.state
 */
export function getStateValue(
  record: any,
  format: 'abbreviation' | 'full' = 'abbreviation'
): string {
  const state = record?.hqState || record?.state || record?.company?.hqState || record?.company?.state;
  return standardizeState(state, format);
}

