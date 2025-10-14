import { prisma } from '@/platform/database/prisma-client';

/**
 * Company Linking Service
 * Handles finding existing companies or creating new ones when linking people to companies
 */

export interface CompanyLinkingResult {
  id: string;
  name: string;
  isNew: boolean;
}

/**
 * Normalize company name for comparison
 */
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeCompanyName(str1);
  const s2 = normalizeCompanyName(str2);
  
  if (s1 === s2) return 1;
  
  // Simple Levenshtein distance-based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find existing company by name or create a new one
 * @param companyName - The name of the company to find or create
 * @param workspaceId - The workspace ID for isolation
 * @param additionalData - Optional additional data for new companies
 * @returns Promise<CompanyLinkingResult>
 */
export async function findOrCreateCompany(
  companyName: string,
  workspaceId: string,
  additionalData?: { domain?: string; website?: string; industry?: string }
): Promise<CompanyLinkingResult> {
  if (!companyName || !companyName.trim()) {
    throw new Error('Company name is required');
  }

  const trimmedName = companyName.trim();
  console.log(`🔍 [COMPANY_LINKING] Looking for company: "${trimmedName}" in workspace: ${workspaceId}`);

  // First, try exact match (case-insensitive)
  let company = await prisma.companies.findFirst({
    where: {
      workspaceId,
      deletedAt: null,
      name: { equals: trimmedName, mode: 'insensitive' }
    }
  });

  if (company) {
    console.log(`✅ [COMPANY_LINKING] Found exact match: ${company.name} (${company.id})`);
    return {
      id: company.id,
      name: company.name,
      isNew: false
    };
  }

  // Try fuzzy matching with existing companies
  const allCompanies = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null
    },
    select: { id: true, name: true }
  });

  let bestMatch = null;
  let bestSimilarity = 0;
  const SIMILARITY_THRESHOLD = 0.85;

  for (const existingCompany of allCompanies) {
    const similarity = calculateSimilarity(trimmedName, existingCompany.name);
    if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
      bestMatch = existingCompany;
      bestSimilarity = similarity;
    }
  }

  if (bestMatch) {
    console.log(`🔗 [COMPANY_LINKING] Fuzzy matched "${trimmedName}" to existing "${bestMatch.name}" (${(bestSimilarity * 100).toFixed(1)}%)`);
    return {
      id: bestMatch.id,
      name: bestMatch.name,
      isNew: false
    };
  }

  // Create new company
  console.log(`🏢 [COMPANY_LINKING] Creating new company: "${trimmedName}"`);
  
  const newCompany = await prisma.companies.create({
    data: {
      workspaceId,
      name: trimmedName,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      industry: additionalData?.industry,
      domain: additionalData?.domain,
      website: additionalData?.website || (additionalData?.domain ? `https://${additionalData.domain}` : undefined),
      createdAt: new Date(),
      updatedAt: new Date(),
      customFields: {
        createdFrom: 'auto_linking',
        sourceData: 'lead_creation',
        createdAt: new Date().toISOString()
      }
    }
  });

  console.log(`✅ [COMPANY_LINKING] Created new company: ${newCompany.name} (${newCompany.id})`);
  
  return {
    id: newCompany.id,
    name: newCompany.name,
    isNew: true
  };
}

/**
 * Find company by ID (for validation)
 */
export async function findCompanyById(
  companyId: string,
  workspaceId: string
): Promise<CompanyLinkingResult | null> {
  const company = await prisma.companies.findFirst({
    where: {
      id: companyId,
      workspaceId,
      deletedAt: null
    }
  });

  if (!company) {
    return null;
  }

  return {
    id: company.id,
    name: company.name,
    isNew: false
  };
}
