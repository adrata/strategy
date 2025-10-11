/**
 * PEOPLE DATA LABS (PDL) SERVICE
 * 
 * Professional data enrichment using People Data Labs API
 * Following 2025 best practices: Pure functions, type-safe, composable
 * 
 * PDL provides comprehensive professional profiles with:
 * - Work history and employment details
 * - Education background
 * - Skills and expertise
 * - Contact information
 * - Social profiles
 */

import type { APIClients } from '../types/api-clients';
import { DATA_QUALITY_THRESHOLDS, API_RATE_LIMITS } from '@/platform/config/constants';
import { createLogger } from '@/platform/utils/logger';

const pdlLogger = createLogger('PDL-Service');

// ============================================================================
// TYPES
// ============================================================================

export interface PDLPersonInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  email?: string;
  linkedIn?: string;
  location?: string;
}

export interface PDLWorkExperience {
  company: string;
  companyId?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  location?: string;
  summary?: string;
}

export interface PDLEducation {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface PDLSkill {
  name: string;
  endorsements?: number;
  category?: string;
}

export interface PDLCertification {
  name: string;
  authority?: string;
  startDate?: string;
  endDate?: string;
  credentialId?: string;
}

export interface PDLSocialProfile {
  network: string;
  url: string;
  username?: string;
}

// PDL API Response Interfaces
export interface PDLAPIExperience {
  company?: { name: string; id?: string };
  company_name?: string;
  title?: { name: string };
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  location?: { name: string };
  summary?: string;
}

export interface PDLAPIEducation {
  school?: { name: string };
  school?: string;
  degrees?: string[];
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
}

export interface PDLAPISkill {
  name: string;
  type?: string;
}

export interface PDLAPICertification {
  name: string;
  authority?: string;
  start_date?: string;
  end_date?: string;
}

export interface PDLAPISocialProfile {
  platform: string;
  url: string;
  username?: string;
}

export interface PDLAPIPerson {
  id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  job_title?: string;
  job_company_name?: string;
  job_company_id?: string;
  job_company_website?: string;
  job_company_industry?: string;
  job_company_size?: string;
  job_company_founded?: number;
  job_company_location?: {
    name?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
  job_company_linkedin_url?: string;
  job_company_facebook_url?: string;
  job_company_twitter_url?: string;
  job_company_logo_url?: string;
  job_summary?: string;
  job_start_date?: string;
  job_title_role?: string;
  job_title_sub_role?: string;
  job_title_levels?: string[];
  job_last_updated?: string;
  experience?: PDLAPIExperience[];
  education?: PDLAPIEducation[];
  skills?: PDLAPISkill[];
  certifications?: PDLAPICertification[];
  profiles?: PDLAPISocialProfile[];
  phone_numbers?: string[];
  emails?: string[];
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  github_url?: string;
  personal_emails?: string[];
  mobile_phone?: string;
  phone?: string;
  industry?: string;
  summary?: string;
  headline?: string;
  sub_title?: string;
  avatar_url?: string;
  cover_image_url?: string;
  birth_year?: number;
  birth_date?: string;
  gender?: string;
  location_name?: string;
  location_locality?: string;
  location_metro?: string;
  location_region?: string;
  location_country?: string;
  location_continent?: string;
  location_street_address?: string;
  location_address_line_2?: string;
  location_postal_code?: string;
  location_geo?: string;
  location_last_updated?: string;
  country?: string;
  region?: string;
  city?: string;
  street_address?: string;
  postal_code?: string;
  last_updated?: string;
  created?: string;
  interests?: string[];
}

export interface PDLEnrichedPerson {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  currentTitle?: string;
  currentCompany?: string;
  
  // Work history
  workHistory: PDLWorkExperience[];
  totalWorkExperience?: number;
  
  // Education
  education: PDLEducation[];
  highestDegree?: string;
  
  // Skills
  skills: PDLSkill[];
  topSkills?: string[];
  
  // Certifications
  certifications: PDLCertification[];
  
  // Contact
  emails: string[];
  phoneNumbers: string[];
  
  // Social
  socialProfiles: PDLSocialProfile[];
  linkedInUrl?: string;
  
  // Location
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // Metadata
  dataQuality: number; // 0-100
  lastUpdated?: string;
  sources: string[];
}

export interface PDLSearchCriteria {
  roles?: string[];
  companies?: string[];
  locations?: string[];
  industries?: string[];
  seniorityLevels?: string[];
  minExperience?: number;
  maxExperience?: number;
  requiredSkills?: string[];
  limit?: number;
}

export interface PDLSearchResult {
  people: PDLEnrichedPerson[];
  totalResults: number;
  page: number;
  hasMore: boolean;
}

// ============================================================================
// PDL API FUNCTIONS
// ============================================================================

/**
 * Enrich a person with comprehensive PDL data
 * 
 * @example
 * const enriched = await enrichPersonWithPDL({
 *   name: 'John Doe',
 *   company: 'Salesforce',
 *   title: 'VP Marketing'
 * }, apis);
 */
export async function enrichPersonWithPDL(
  input: PDLPersonInput,
  apis: APIClients
): Promise<PDLEnrichedPerson | null> {
  console.log(`🔍 [PDL] Enriching person: ${input.name || `${input.firstName} ${input.lastName}`}`);
  
  if (!apis.pdl) {
    console.warn('   ⚠️ PDL API not configured');
    return null;
  }
  
  try {
    const response = await apis.pdl.enrichPerson(input);
    
    if (!response || !response.data) {
      console.log('   ❌ No data found');
      return null;
    }
    
    const data = response.data;
    
    // Transform PDL response to our format
    const enriched: PDLEnrichedPerson = {
      id: data.id || generateId(input),
      fullName: data.full_name || `${input.firstName} ${input.lastName}`,
      firstName: data.first_name || input.firstName,
      lastName: data.last_name || input.lastName,
      currentTitle: data.job_title || input.title,
      currentCompany: data.job_company_name || input.company,
      
      workHistory: parseWorkHistory(data.experience || []),
      totalWorkExperience: data.experience_years || 0,
      
      education: parseEducation(data.education || []),
      highestDegree: data.highest_education_level,
      
      skills: parseSkills(data.skills || []),
      topSkills: data.skills?.slice(0, 10).map((s: PDLAPISkill) => s.name) || [],
      
      certifications: parseCertifications(data.certifications || []),
      
      emails: data.emails || [],
      phoneNumbers: data.phone_numbers || [],
      
      socialProfiles: parseSocialProfiles(data.profiles || []),
      linkedInUrl: data.linkedin_url || input.linkedIn,
      
      location: data.location_name,
      city: data.location_locality,
      state: data.location_region,
      country: data.location_country,
      
      dataQuality: calculateDataQuality(data),
      lastUpdated: data.last_updated,
      sources: ['pdl']
    };
    
    pdlLogger.processingComplete('person enrichment', Date.now() - startTime, undefined, {
      workHistoryCount: enriched.workHistory.length,
      educationCount: enriched.education.length,
      skillsCount: enriched.skills.length,
      dataQuality: enriched.dataQuality
    });
    
    return enriched;
  } catch (error) {
    pdlLogger.processingError('person enrichment', error instanceof Error ? error : new Error('Unknown error'));
    return null;
  }
}

/**
 * Search for people by role/title
 * 
 * @example
 * const results = await searchPeopleByRole({
 *   roles: ['VP Marketing', 'CMO'],
 *   companies: ['Salesforce'],
 *   locations: ['United States']
 * }, apis);
 */
export async function searchPeopleByRole(
  criteria: PDLSearchCriteria,
  apis: APIClients
): Promise<PDLSearchResult> {
  console.log(`🔍 [PDL] Searching for people by role...`);
  
  if (!apis.pdl) {
    console.warn('   ⚠️ PDL API not configured');
    return { people: [], totalResults: 0, page: 1, hasMore: false };
  }
  
  try {
    const query = buildPDLSearchQuery(criteria);
    const response = await apis.pdl.search(query);
    
    if (!response || !response.data) {
      console.log('   ❌ No results found');
      return { people: [], totalResults: 0, page: 1, hasMore: false };
    }
    
    const people = response.data.map((person: PDLAPIPerson) => transformPDLPerson(person));
    
    console.log(`   ✅ Found ${people.length} people`);
    
    return {
      people,
      totalResults: response.total || people.length,
      page: response.page || 1,
      hasMore: response.has_more || false
    };
  } catch (error) {
    console.error('   ❌ PDL search error:', error instanceof Error ? error.message : 'Unknown error');
    return { people: [], totalResults: 0, page: 1, hasMore: false };
  }
}

/**
 * Get complete work history for a person
 */
export async function getWorkHistory(
  input: PDLPersonInput,
  apis: APIClients
): Promise<PDLWorkExperience[]> {
  const enriched = await enrichPersonWithPDL(input, apis);
  return enriched?.workHistory || [];
}

/**
 * Get education background
 */
export async function getEducationBackground(
  input: PDLPersonInput,
  apis: APIClients
): Promise<PDLEducation[]> {
  const enriched = await enrichPersonWithPDL(input, apis);
  return enriched?.education || [];
}

/**
 * Get skills and expertise
 */
export async function getSkillsAndExpertise(
  input: PDLPersonInput,
  apis: APIClients
): Promise<PDLSkill[]> {
  const enriched = await enrichPersonWithPDL(input, apis);
  return enriched?.skills || [];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse work history from PDL format
 */
function parseWorkHistory(experience: PDLAPIExperience[]): PDLWorkExperience[] {
  return experience.map(exp => ({
    company: exp.company?.name || exp.company_name || '',
    companyId: exp.company?.id,
    title: exp.title?.name || exp.title || '',
    startDate: exp.start_date,
    endDate: exp.end_date,
    isCurrent: !exp.end_date || exp.is_current || false,
    location: exp.location?.name,
    summary: exp.summary
  }));
}

/**
 * Parse education from PDL format
 */
function parseEducation(education: PDLAPIEducation[]): PDLEducation[] {
  return education.map(edu => ({
    school: edu.school?.name || edu.school || '',
    degree: edu.degrees?.[0] || edu.degree,
    fieldOfStudy: edu.majors?.[0] || edu.field_of_study,
    startDate: edu.start_date,
    endDate: edu.end_date,
    gpa: edu.gpa
  }));
}

/**
 * Parse skills from PDL format
 */
function parseSkills(skills: PDLAPISkill[]): PDLSkill[] {
  return skills.map(skill => ({
    name: typeof skill === 'string' ? skill : skill.name,
    endorsements: skill.endorsements,
    category: skill.category
  }));
}

/**
 * Parse certifications from PDL format
 */
function parseCertifications(certifications: PDLAPICertification[]): PDLCertification[] {
  return certifications.map(cert => ({
    name: cert.name || '',
    authority: cert.authority,
    startDate: cert.start_date,
    endDate: cert.end_date,
    credentialId: cert.credential_id
  }));
}

/**
 * Parse social profiles from PDL format
 */
function parseSocialProfiles(profiles: PDLAPISocialProfile[]): PDLSocialProfile[] {
  return profiles.map(profile => ({
    network: profile.network || '',
    url: profile.url || '',
    username: profile.username
  }));
}

/**
 * Build PDL search query from criteria
 */
function buildPDLSearchQuery(criteria: PDLSearchCriteria): Record<string, any> {
  const query: any = {
    size: criteria.limit || 100
  };
  
  // Role/title filters
  if (criteria.roles && criteria.roles.length > 0) {
    query.job_title = criteria.roles;
  }
  
  // Company filters
  if (criteria.companies && criteria.companies.length > 0) {
    query.job_company_name = criteria.companies;
  }
  
  // Location filters
  if (criteria.locations && criteria.locations.length > 0) {
    query.location_name = criteria.locations;
  }
  
  // Industry filters
  if (criteria.industries && criteria.industries.length > 0) {
    query.industry = criteria.industries;
  }
  
  // Seniority filters
  if (criteria.seniorityLevels && criteria.seniorityLevels.length > 0) {
    query.job_title_levels = criteria.seniorityLevels;
  }
  
  // Experience filters
  if (criteria.minExperience !== undefined) {
    query.min_experience = criteria.minExperience;
  }
  if (criteria.maxExperience !== undefined) {
    query.max_experience = criteria.maxExperience;
  }
  
  // Skills filters
  if (criteria.requiredSkills && criteria.requiredSkills.length > 0) {
    query.skills = criteria.requiredSkills;
  }
  
  return query;
}

/**
 * Transform PDL person data to our format
 */
function transformPDLPerson(data: PDLAPIPerson): PDLEnrichedPerson {
  return {
    id: data.id || generateId(data),
    fullName: data.full_name || '',
    firstName: data.first_name,
    lastName: data.last_name,
    currentTitle: data.job_title,
    currentCompany: data.job_company_name,
    
    workHistory: parseWorkHistory(data.experience || []),
    totalWorkExperience: data.experience_years || 0,
    
    education: parseEducation(data.education || []),
    highestDegree: data.highest_education_level,
    
    skills: parseSkills(data.skills || []),
    topSkills: data.skills?.slice(0, 10).map((s: PDLAPISkill) => typeof s === 'string' ? s : s.name) || [],
    
    certifications: parseCertifications(data.certifications || []),
    
    emails: data.emails || [],
    phoneNumbers: data.phone_numbers || [],
    
    socialProfiles: parseSocialProfiles(data.profiles || []),
    linkedInUrl: data.linkedin_url,
    
    location: data.location_name,
    city: data.location_locality,
    state: data.location_region,
    country: data.location_country,
    
    dataQuality: calculateDataQuality(data),
    lastUpdated: data.last_updated,
    sources: ['pdl']
  };
}

/**
 * Calculate data quality score (0-100)
 */
function calculateDataQuality(data: PDLAPIPerson): number {
  let score = 0;
  let maxScore = 0;
  
  // Name (required - 20 points)
  maxScore += 20;
  if (data.full_name) score += 20;
  
  // Current job (20 points)
  maxScore += 20;
  if (data.job_title) score += 10;
  if (data.job_company_name) score += 10;
  
  // Work history (20 points)
  maxScore += 20;
  if (data.experience && data.experience.length > 0) {
    score += Math.min(20, data.experience.length * 4);
  }
  
  // Education (15 points)
  maxScore += 15;
  if (data.education && data.education.length > 0) {
    score += Math.min(15, data.education.length * 7.5);
  }
  
  // Contact info (15 points)
  maxScore += 15;
  if (data.emails && data.emails.length > 0) score += 10;
  if (data.phone_numbers && data.phone_numbers.length > 0) score += 5;
  
  // Skills (10 points)
  maxScore += 10;
  if (data.skills && data.skills.length > 0) {
    score += Math.min(10, data.skills.length * 1);
  }
  
  const qualityScore = Math.round((score / maxScore) * 100);
  
  // Ensure minimum quality threshold
  return Math.max(qualityScore, DATA_QUALITY_THRESHOLDS.MINIMUM_ACCEPTABLE);
}

/**
 * Generate unique ID from input
 */
function generateId(input: PDLPersonInput): string {
  const parts = [
    input.name || '',
    input.first_name || input.firstName || '',
    input.last_name || input.lastName || '',
    input.company || input.job_company_name || '',
    Date.now()
  ];
  
  return parts.filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-');
}

