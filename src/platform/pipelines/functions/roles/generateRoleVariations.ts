/**
 * AI-POWERED ROLE VARIATION GENERATOR
 * 
 * Uses AI to dynamically generate role variations for ANY role
 * Works for VP Marketing, Data Scientist, Product Manager, or any role requested
 * 
 * Following 2025 best practices: Pure functions, type-safe, composable
 */

import type { APIClients } from '../types/api-clients';

// ============================================================================
// TYPES
// ============================================================================

export interface RoleVariations {
  baseRole: string;
  variations: string[];
  tiers: {
    tier1: string[];  // C-level (Chief X Officer, CXO)
    tier2: string[];  // VP-level (VP X, SVP X, EVP X)
    tier3: string[];  // Director-level (Director X, Head of X)
    tier4: string[];  // Manager-level (Manager X, Lead X)
  };
  totalVariations: number;
  generatedAt: string;
  generatedBy: 'ai' | 'fallback';
}

export interface RoleGenerationOptions {
  includeRegionalVariations?: boolean;
  includeIndustryVariations?: boolean;
  maxVariations?: number;
  minTierLevel?: 1 | 2 | 3 | 4;
}

// ============================================================================
// AI-POWERED GENERATION
// ============================================================================

/**
 * Generate role variations using AI (Perplexity)
 * 
 * @example
 * const variations = await generateRoleVariations('VP Marketing', apis);
 * // Returns 40-60 variations including:
 * // - VP Marketing, Vice President Marketing, SVP Marketing
 * // - Chief Marketing Officer, CMO
 * // - Head of Marketing, Marketing Director
 * // etc.
 */
export async function generateRoleVariations(
  baseRole: string,
  apis: APIClients,
  options: RoleGenerationOptions = {}
): Promise<RoleVariations> {
  console.log(`🤖 [AI ROLE GEN] Generating variations for: ${baseRole}`);

  // Try AI generation first
  if (apis.perplexity) {
    try {
      const aiVariations = await generateWithAI(baseRole, apis.perplexity, options);
      console.log(`   ✅ Generated ${aiVariations.totalVariations} variations using AI`);
      return aiVariations;
    } catch (error) {
      console.log(`   ⚠️ AI generation failed, falling back to patterns:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Fallback to pattern-based generation
  const patternVariations = generateWithPatterns(baseRole, options);
  console.log(`   ✅ Generated ${patternVariations.totalVariations} variations using patterns`);
  return patternVariations;
}

/**
 * Generate variations using AI (Perplexity)
 */
async function generateWithAI(
  baseRole: string,
  perplexity: any,
  options: RoleGenerationOptions
): Promise<RoleVariations> {
  const prompt = buildAIPrompt(baseRole, options);
  
  const response = await perplexity.query(prompt);
  
  // Parse AI response into structured format
  const variations = parseAIResponse(response.answer, baseRole);
  
  return {
    ...variations,
    generatedBy: 'ai',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Build AI prompt for role variation generation
 */
function buildAIPrompt(baseRole: string, options: RoleGenerationOptions): string {
  const maxVariations = options.maxVariations || 60;
  
  return `Generate comprehensive job title variations for the role: "${baseRole}"

Please provide ${maxVariations} variations organized by seniority level:

1. **C-Level (Tier 1)**: Chief X Officer, CXO variations
2. **VP-Level (Tier 2)**: VP, SVP, EVP variations
3. **Director-Level (Tier 3)**: Director, Head of variations
4. **Manager-Level (Tier 4)**: Manager, Lead variations

Include:
- Formal titles (Chief Marketing Officer)
- Abbreviated titles (CMO, VP Marketing)
- Department variations (Marketing, Digital Marketing, Brand Marketing)
${options.includeRegionalVariations ? '- Regional variations (US, UK, EU terminology)' : ''}
${options.includeIndustryVariations ? '- Industry-specific variations' : ''}

Format as JSON:
{
  "tier1": ["Chief X Officer", "CXO", ...],
  "tier2": ["VP X", "SVP X", ...],
  "tier3": ["Director X", "Head of X", ...],
  "tier4": ["Manager X", "Lead X", ...]
}

Return ONLY the JSON, no explanation.`;
}

/**
 * Parse AI response into RoleVariations
 */
function parseAIResponse(response: string, baseRole: string): Omit<RoleVariations, 'generatedBy' | 'generatedAt'> {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const tier1 = parsed.tier1 || [];
    const tier2 = parsed.tier2 || [];
    const tier3 = parsed.tier3 || [];
    const tier4 = parsed.tier4 || [];
    
    const allVariations = [...tier1, ...tier2, ...tier3, ...tier4];
    
    return {
      baseRole,
      variations: allVariations,
      tiers: {
        tier1,
        tier2,
        tier3,
        tier4
      },
      totalVariations: allVariations.length
    };
  } catch (error) {
    console.error('   ❌ Failed to parse AI response:', error);
    throw new Error('Failed to parse AI response');
  }
}

// ============================================================================
// PATTERN-BASED GENERATION (FALLBACK)
// ============================================================================

/**
 * Generate variations using pattern-based approach
 * Used as fallback when AI unavailable
 */
export function generateWithPatterns(
  baseRole: string,
  options: RoleGenerationOptions = {}
): RoleVariations {
  const { minTierLevel = 1, maxVariations = 60 } = options;
  
  const tier1 = minTierLevel <= 1 ? generateTier1Variations(baseRole) : [];
  const tier2 = minTierLevel <= 2 ? generateTier2Variations(baseRole) : [];
  const tier3 = minTierLevel <= 3 ? generateTier3Variations(baseRole) : [];
  const tier4 = minTierLevel <= 4 ? generateTier4Variations(baseRole) : [];
  
  const allVariations = [...tier1, ...tier2, ...tier3, ...tier4].slice(0, maxVariations);
  
  return {
    baseRole,
    variations: allVariations,
    tiers: { tier1, tier2, tier3, tier4 },
    totalVariations: allVariations.length,
    generatedAt: new Date().toISOString(),
    generatedBy: 'fallback'
  };
}

/**
 * Generate C-Level variations (Tier 1)
 */
function generateTier1Variations(baseRole: string): string[] {
  const department = extractDepartment(baseRole);
  const abbreviation = generateAbbreviation(department);
  
  return [
    `Chief ${department} Officer`,
    abbreviation,
    `Chief ${department} Executive`,
    `Chief ${department}`,
    `${abbreviation} (Chief ${department} Officer)`
  ].filter(Boolean);
}

/**
 * Generate VP-Level variations (Tier 2)
 */
function generateTier2Variations(baseRole: string): string[] {
  const department = extractDepartment(baseRole);
  
  return [
    `VP ${department}`,
    `Vice President ${department}`,
    `SVP ${department}`,
    `Senior Vice President ${department}`,
    `EVP ${department}`,
    `Executive Vice President ${department}`,
    `VP of ${department}`,
    `Vice President of ${department}`
  ];
}

/**
 * Generate Director-Level variations (Tier 3)
 */
function generateTier3Variations(baseRole: string): string[] {
  const department = extractDepartment(baseRole);
  
  return [
    `${department} Director`,
    `Director of ${department}`,
    `Head of ${department}`,
    `Director, ${department}`,
    `Senior ${department} Director`,
    `Global ${department} Director`,
    `${department} Lead`
  ];
}

/**
 * Generate Manager-Level variations (Tier 4)
 */
function generateTier4Variations(baseRole: string): string[] {
  const department = extractDepartment(baseRole);
  
  return [
    `${department} Manager`,
    `Manager, ${department}`,
    `Senior ${department} Manager`,
    `Lead ${department} Manager`,
    `${department} Team Lead`,
    `Principal ${department}`
  ];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract department from role title
 * 
 * @example
 * extractDepartment('VP Marketing') → 'Marketing'
 * extractDepartment('Chief Financial Officer') → 'Financial'
 * extractDepartment('Data Scientist') → 'Data Science'
 */
function extractDepartment(role: string): string {
  // Remove common prefixes
  let department = role
    .replace(/^(Chief|VP|Vice President|SVP|EVP|Director|Head of|Manager|Lead)\s+/i, '')
    .replace(/\s+Officer$/i, '')
    .trim();
  
  // Handle special cases
  if (department.toLowerCase().includes('market')) return 'Marketing';
  if (department.toLowerCase().includes('financ')) return 'Finance';
  if (department.toLowerCase().includes('sales') || department.toLowerCase().includes('revenue')) return 'Sales';
  if (department.toLowerCase().includes('product')) return 'Product';
  if (department.toLowerCase().includes('engineer')) return 'Engineering';
  if (department.toLowerCase().includes('data')) return 'Data';
  if (department.toLowerCase().includes('technolog')) return 'Technology';
  
  return department;
}

/**
 * Generate abbreviation for department
 * 
 * @example
 * generateAbbreviation('Marketing') → 'CMO'
 * generateAbbreviation('Finance') → 'CFO'
 * generateAbbreviation('Technology') → 'CTO'
 */
function generateAbbreviation(department: string): string {
  const abbrevMap: Record<string, string> = {
    'Marketing': 'CMO',
    'Finance': 'CFO',
    'Financial': 'CFO',
    'Technology': 'CTO',
    'Information': 'CIO',
    'Operations': 'COO',
    'Sales': 'CSO',
    'Revenue': 'CRO',
    'Product': 'CPO',
    'Human Resources': 'CHRO',
    'Data': 'CDO',
    'Security': 'CISO'
  };
  
  return abbrevMap[department] || `C${department.charAt(0).toUpperCase()}O`;
}

/**
 * Normalize role title for comparison
 */
export function normalizeRoleTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

