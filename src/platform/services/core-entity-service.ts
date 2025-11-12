import { prisma } from '@/platform/database/prisma-client';

/**
 * Core Entity Service
 * Manages global canonical entities (core_companies, core_people) 
 * and handles linking workspace entities to core entities
 */

export interface CoreCompanyResult {
  id: string;
  name: string;
  isNew: boolean;
}

export interface CorePersonResult {
  id: string;
  fullName: string;
  email?: string;
  isNew: boolean;
}

export interface MergedCompanyData {
  name: string;
  industry?: string;
  website?: string;
  [key: string]: any;
}

export interface MergedPersonData {
  fullName: string;
  email?: string;
  jobTitle?: string;
  [key: string]: any;
}

/**
 * Normalize string for comparison (lowercase, remove special chars, trim)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two strings (0-1) using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  
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
 * Find or create a core company
 * Searches globally across all workspaces for matching company
 */
export async function findOrCreateCoreCompany(
  companyName: string,
  additionalData?: {
    website?: string;
    domain?: string;
    industry?: string;
    employeeCount?: number;
    foundedYear?: number;
    country?: string;
    city?: string;
  }
): Promise<CoreCompanyResult> {
  if (!companyName || !companyName.trim()) {
    throw new Error('Company name is required');
  }

  const trimmedName = companyName.trim();
  const normalizedName = normalizeString(trimmedName);
  
  console.log(`🔍 [CORE_ENTITY] Looking for core company: "${trimmedName}"`);

  // First, try exact match by normalized name
  let coreCompany = await prisma.core_companies.findFirst({
    where: {
      normalizedName: normalizedName
    }
  });

  if (coreCompany) {
    console.log(`✅ [CORE_ENTITY] Found exact core company match: ${coreCompany.name} (${coreCompany.id})`);
    return {
      id: coreCompany.id,
      name: coreCompany.name,
      isNew: false
    };
  }

  // Try fuzzy matching with existing core companies
  const allCoreCompanies = await prisma.core_companies.findMany({
    select: { id: true, name: true, normalizedName: true }
  });

  let bestMatch = null;
  let bestSimilarity = 0;
  const SIMILARITY_THRESHOLD = 0.85;

  for (const existingCore of allCoreCompanies) {
    const similarity = calculateSimilarity(trimmedName, existingCore.name);
    if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
      bestMatch = existingCore;
      bestSimilarity = similarity;
    }
  }

  if (bestMatch) {
    console.log(`🔗 [CORE_ENTITY] Fuzzy matched "${trimmedName}" to existing core "${bestMatch.name}" (${(bestSimilarity * 100).toFixed(1)}%)`);
    return {
      id: bestMatch.id,
      name: bestMatch.name,
      isNew: false
    };
  }

  // Create new core company
  console.log(`🏢 [CORE_ENTITY] Creating new core company: "${trimmedName}"`);
  
  const domain = additionalData?.domain || (additionalData?.website ? new URL(additionalData.website).hostname.replace('www.', '') : null);
  
  const newCoreCompany = await prisma.core_companies.create({
    data: {
      name: trimmedName,
      normalizedName: normalizedName,
      ...(additionalData?.website && { website: additionalData.website }),
      ...(domain && { domain }),
      ...(additionalData?.industry && { industry: additionalData.industry }),
      ...(additionalData?.employeeCount && { employeeCount: additionalData.employeeCount }),
      ...(additionalData?.foundedYear && { foundedYear: additionalData.foundedYear }),
      ...(additionalData?.country && { country: additionalData.country }),
      ...(additionalData?.city && { city: additionalData.city }),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`✅ [CORE_ENTITY] Created new core company: ${newCoreCompany.name} (${newCoreCompany.id})`);
  
  return {
    id: newCoreCompany.id,
    name: newCoreCompany.name,
    isNew: true
  };
}

/**
 * Find or create a core person
 * Searches globally across all workspaces for matching person
 */
export async function findOrCreateCorePerson(
  firstName: string,
  lastName: string,
  additionalData?: {
    email?: string;
    workEmail?: string;
    personalEmail?: string;
    linkedinUrl?: string;
    jobTitle?: string;
    companyName?: string;
    phone?: string;
  }
): Promise<CorePersonResult> {
  if (!firstName || !lastName) {
    throw new Error('First name and last name are required');
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const normalizedFullName = normalizeString(fullName);
  
  console.log(`🔍 [CORE_ENTITY] Looking for core person: "${fullName}"`);

  // Try to find by email first (most reliable)
  let corePerson: any = null;
  if (additionalData?.email) {
    corePerson = await prisma.core_people.findFirst({
      where: {
        email: additionalData.email.toLowerCase().trim()
      }
    });
  } else if (additionalData?.workEmail) {
    corePerson = await prisma.core_people.findFirst({
      where: {
        workEmail: additionalData.workEmail.toLowerCase().trim()
      }
    });
  } else if (additionalData?.linkedinUrl) {
    corePerson = await prisma.core_people.findFirst({
      where: {
        linkedinUrl: additionalData.linkedinUrl.trim()
      }
    });
  }

  if (corePerson) {
    console.log(`✅ [CORE_ENTITY] Found core person by email/linkedin: ${corePerson.fullName} (${corePerson.id})`);
    return {
      id: corePerson.id,
      fullName: corePerson.fullName,
      email: corePerson.email,
      isNew: false
    };
  }

  // Try exact match by normalized full name
  corePerson = await prisma.core_people.findFirst({
    where: {
      normalizedFullName: normalizedFullName
    }
  });

  if (corePerson) {
    console.log(`✅ [CORE_ENTITY] Found exact core person match: ${corePerson.fullName} (${corePerson.id})`);
    return {
      id: corePerson.id,
      fullName: corePerson.fullName,
      email: corePerson.email,
      isNew: false
    };
  }

  // Try fuzzy matching with existing core people
  const allCorePeople = await prisma.core_people.findMany({
    select: { id: true, fullName: true, normalizedFullName: true, email: true }
  });

  let bestMatch = null;
  let bestSimilarity = 0;
  const SIMILARITY_THRESHOLD = 0.85;

  for (const existingCore of allCorePeople) {
    const similarity = calculateSimilarity(fullName, existingCore.fullName);
    if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
      bestMatch = existingCore;
      bestSimilarity = similarity;
    }
  }

  if (bestMatch) {
    console.log(`🔗 [CORE_ENTITY] Fuzzy matched "${fullName}" to existing core "${bestMatch.fullName}" (${(bestSimilarity * 100).toFixed(1)}%)`);
    return {
      id: bestMatch.id,
      fullName: bestMatch.fullName,
      email: bestMatch.email,
      isNew: false
    };
  }

  // Create new core person
  console.log(`👤 [CORE_ENTITY] Creating new core person: "${fullName}"`);
  
  const newCorePerson = await prisma.core_people.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: fullName,
      normalizedFullName: normalizedFullName,
      ...(additionalData?.email && { email: additionalData.email.toLowerCase().trim() }),
      ...(additionalData?.workEmail && { workEmail: additionalData.workEmail.toLowerCase().trim() }),
      ...(additionalData?.personalEmail && { personalEmail: additionalData.personalEmail.toLowerCase().trim() }),
      ...(additionalData?.linkedinUrl && { linkedinUrl: additionalData.linkedinUrl.trim() }),
      ...(additionalData?.jobTitle && { jobTitle: additionalData.jobTitle }),
      ...(additionalData?.companyName && { companyName: additionalData.companyName }),
      ...(additionalData?.phone && { phone: additionalData.phone }),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`✅ [CORE_ENTITY] Created new core person: ${newCorePerson.fullName} (${newCorePerson.id})`);
  
  return {
    id: newCorePerson.id,
    fullName: newCorePerson.fullName,
    email: newCorePerson.email,
    isNew: true
  };
}

/**
 * Link a workspace company to a core company
 */
export async function linkWorkspaceCompanyToCore(
  workspaceCompanyId: string,
  coreCompanyId: string,
  workspaceId: string
): Promise<void> {
  // Verify workspace company exists and belongs to workspace
  const workspaceCompany = await prisma.companies.findFirst({
    where: {
      id: workspaceCompanyId,
      workspaceId: workspaceId,
      deletedAt: null
    }
  });

  if (!workspaceCompany) {
    throw new Error(`Workspace company ${workspaceCompanyId} not found in workspace ${workspaceId}`);
  }

  // Verify core company exists
  const coreCompany = await prisma.core_companies.findUnique({
    where: { id: coreCompanyId }
  });

  if (!coreCompany) {
    throw new Error(`Core company ${coreCompanyId} not found`);
  }

  await prisma.companies.update({
    where: { id: workspaceCompanyId },
    data: { coreCompanyId: coreCompanyId }
  });

  console.log(`🔗 [CORE_ENTITY] Linked workspace company ${workspaceCompanyId} to core company ${coreCompanyId}`);
}

/**
 * Link a workspace person to a core person
 */
export async function linkWorkspacePersonToCore(
  workspacePersonId: string,
  corePersonId: string,
  workspaceId: string
): Promise<void> {
  // Verify workspace person exists and belongs to workspace
  const workspacePerson = await prisma.people.findFirst({
    where: {
      id: workspacePersonId,
      workspaceId: workspaceId,
      deletedAt: null
    }
  });

  if (!workspacePerson) {
    throw new Error(`Workspace person ${workspacePersonId} not found in workspace ${workspaceId}`);
  }

  // Verify core person exists
  const corePerson = await prisma.core_people.findUnique({
    where: { id: corePersonId }
  });

  if (!corePerson) {
    throw new Error(`Core person ${corePersonId} not found`);
  }

  await prisma.people.update({
    where: { id: workspacePersonId },
    data: { corePersonId: corePersonId }
  });

  console.log(`🔗 [CORE_ENTITY] Linked workspace person ${workspacePersonId} to core person ${corePersonId}`);
}

/**
 * Merge core company data with workspace company data
 * Workspace overrides take precedence
 */
export function mergeCoreCompanyWithWorkspace(
  workspaceCompany: any,
  coreCompany: any | null
): MergedCompanyData {
  // Extract coreCompany from workspaceCompany if it exists (from Prisma relation)
  const actualCoreCompany = coreCompany || workspaceCompany.coreCompany || null;
  
  if (!actualCoreCompany) {
    // No core entity, return workspace data as-is (without coreCompany relation)
    const { coreCompany: _, ...workspaceData } = workspaceCompany;
    return {
      ...workspaceData,
      name: workspaceCompany.name,
      industry: workspaceCompany.industry,
      website: workspaceCompany.website
    };
  }

  // Merge: workspace overrides > core data > workspace fallback
  const { coreCompany: __, ...workspaceData } = workspaceCompany;
  return {
    ...workspaceData,
    name: workspaceCompany.nameOverride || actualCoreCompany.name || workspaceCompany.name,
    industry: workspaceCompany.industryOverride || actualCoreCompany.industry || workspaceCompany.industry,
    website: workspaceCompany.websiteOverride || actualCoreCompany.website || workspaceCompany.website,
    // Include core entity for reference
    coreCompany: {
      id: actualCoreCompany.id,
      name: actualCoreCompany.name,
      industry: actualCoreCompany.industry,
      website: actualCoreCompany.website,
      lastVerified: actualCoreCompany.lastVerified,
      dataLastVerified: actualCoreCompany.dataLastVerified
    }
  };
}

/**
 * Merge core person data with workspace person data
 * Workspace overrides take precedence
 */
export function mergeCorePersonWithWorkspace(
  workspacePerson: any,
  corePerson: any | null
): MergedPersonData {
  // Extract corePerson from workspacePerson if it exists (from Prisma relation)
  const actualCorePerson = corePerson || workspacePerson.corePerson || null;
  
  // Helper function to extract title from enrichment data (synchronous)
  const extractTitleFromEnrichment = (customFields: any): string | null => {
    if (!customFields) return null;
    
    // Try CoreSignal
    const coresignal = customFields.coresignalData || customFields.coresignal;
    if (coresignal?.active_experience_title) return coresignal.active_experience_title;
    if (coresignal?.job_title) return coresignal.job_title;
    if (coresignal?.experience?.[0]?.position_title) return coresignal.experience[0].position_title;
    
    // Try Lusha
    const lusha = customFields.lusha || customFields.enrichedData;
    if (lusha?.currentTitle) return lusha.currentTitle;
    if (lusha?.jobTitle) return lusha.jobTitle;
    
    return null;
  };
  
  if (!actualCorePerson) {
    // No core entity, return workspace data as-is (without corePerson relation)
    const { corePerson: _, ...workspaceData } = workspacePerson;
    // 🎯 TITLE FALLBACK: Populate title from jobTitle if missing, then check enrichment data
    const enrichmentTitle = extractTitleFromEnrichment(workspacePerson.customFields);
    const finalTitle = workspacePerson.title || workspacePerson.jobTitle || enrichmentTitle || null;
    const finalJobTitle = workspacePerson.jobTitle || workspacePerson.title || enrichmentTitle || null;
    return {
      ...workspaceData,
      fullName: workspacePerson.fullName,
      email: workspacePerson.email || workspacePerson.workEmail,
      jobTitle: finalJobTitle,
      title: finalTitle
    };
  }

  // Merge: workspace overrides > core data > workspace fallback
  const { corePerson: __, ...workspaceData } = workspacePerson;
  // 🎯 TITLE FALLBACK: Populate title from jobTitle if missing, with core person fallback, then enrichment data
  const coreJobTitle = workspacePerson.jobTitleOverride || actualCorePerson.jobTitle || workspacePerson.jobTitle || null;
  const enrichmentTitle = extractTitleFromEnrichment(workspacePerson.customFields);
  const finalJobTitle = coreJobTitle || workspacePerson.jobTitle || enrichmentTitle || null;
  const finalTitle = workspacePerson.title || coreJobTitle || enrichmentTitle || null;
  return {
    ...workspaceData,
    fullName: workspacePerson.fullNameOverride || actualCorePerson.fullName || workspacePerson.fullName,
    email: workspacePerson.emailOverride || actualCorePerson.email || actualCorePerson.workEmail || workspacePerson.email || workspacePerson.workEmail,
    jobTitle: finalJobTitle,
    title: finalTitle,
    // Include core entity for reference
    corePerson: {
      id: actualCorePerson.id,
      fullName: actualCorePerson.fullName,
      email: actualCorePerson.email || actualCorePerson.workEmail,
      jobTitle: actualCorePerson.jobTitle,
      lastVerified: actualCorePerson.lastVerified,
      dataLastVerified: actualCorePerson.dataLastVerified
    }
  };
}
