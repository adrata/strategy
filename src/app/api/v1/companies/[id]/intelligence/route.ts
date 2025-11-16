import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getV1AuthUser } from '../../../auth';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * Company Intelligence API v1
 * GET /api/v1/companies/[id]/intelligence - Get company intelligence
 * POST /api/v1/companies/[id]/intelligence - Force regenerate intelligence
 */

// Interface for company intelligence data
interface CompanyIntelligence {
  companyName: string;
  industry: string;
  description: string;
  strategicWants: string[];
  criticalNeeds: string[];
  businessUnits: Array<{
    name: string;
    functions: string[];
    color: string;
  }>;
  strategicIntelligence: string;
  adrataStrategy: string;
  generatedAt?: string;
  model?: string;
}

// GET /api/v1/companies/[id]/intelligence - Get company intelligence
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      console.log('❌ [INTELLIGENCE API] Authentication required');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log(`📊 [INTELLIGENCE API] Fetching intelligence for company ID: ${id}`);

    // Get company from database with all available data sources
    const company = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null // Only show non-deleted records
      },
      select: {
        // Base company fields
        id: true,
        name: true,
        description: true,
        descriptionEnriched: true, // Enriched description field
        industry: true,
        industryOverride: true, // Manual override
        sector: true, // Separate from industry
        size: true,
        employeeCount: true,
        revenue: true,
        website: true,
        websiteOverride: true, // Manual override
        domain: true, // Separate domain field
        customFields: true,
        competitors: true,
        workspaceId: true,
        coreCompanyId: true, // Link to core company
        // Core company relation (global canonical data - most reliable)
        coreCompany: {
          select: {
            id: true,
            name: true,
            industry: true,
            sector: true,
            employeeCount: true,
            description: true,
            website: true,
            domain: true,
            dataQualityScore: true,
            dataSources: true,
            lastVerified: true,
          }
        },
        // Relations
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            workEmail: true, // Work email might be more reliable
            status: true,
          },
          take: 50, // Get more people for better domain consensus
        },
        actions: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            priority: true,
            scheduledAt: true,
            completedAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      console.log(`❌ [INTELLIGENCE API] Company not found with ID: ${id}`);
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [INTELLIGENCE API] Found company: ${company.name}`);

    // Check for cached intelligence first
    const cachedIntelligence = company.customFields as any;
    const INTELLIGENCE_VERSION = 'v2.0'; // Version for new data source prioritization logic
    
    // Only use cached intelligence if it's the current version
    if (cachedIntelligence?.intelligence && cachedIntelligence?.intelligenceVersion === INTELLIGENCE_VERSION) {
      console.log(`✅ [INTELLIGENCE API] Using cached intelligence data (v${INTELLIGENCE_VERSION}) for company: ${company.name}`);
      return NextResponse.json({
        success: true,
        intelligence: cachedIntelligence.intelligence,
        cached: true,
        timestamp: new Date().toISOString()
      });
    } else if (cachedIntelligence?.intelligence) {
      // Old version cached - regenerate with new logic
      console.log(`🔄 [INTELLIGENCE API] Cached intelligence is outdated (v${cachedIntelligence?.intelligenceVersion || 'unknown'}), regenerating with new logic for company: ${company.name}`);
    }

    console.log(`🔄 [INTELLIGENCE API] Generating new intelligence for company: ${company.name}`);
    // Generate new intelligence
    const intelligence = await generateCompanyIntelligence(company);

    // Generate company summary for descriptionEnriched field
    const companySummary = await generateCompanySummary(company, intelligence);

    // Cache the intelligence in customFields and update descriptionEnriched
    try {
      await prisma.companies.update({
        where: { id },
        data: {
          customFields: {
            ...cachedIntelligence,
            intelligence: intelligence,
            intelligenceVersion: INTELLIGENCE_VERSION, // Store version for cache validation
            intelligenceGeneratedAt: new Date().toISOString()
          },
          descriptionEnriched: companySummary,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ [INTELLIGENCE API] Cached intelligence (v${INTELLIGENCE_VERSION}) and company summary for company: ${company.name}`);
    } catch (cacheError) {
      console.error('⚠️ [INTELLIGENCE API] Failed to cache intelligence:', cacheError);
      // Continue without failing the request
    }

    console.log(`✅ [INTELLIGENCE API] Successfully generated intelligence for company: ${company.name}`);
    return NextResponse.json({
      success: true,
      intelligence: intelligence,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [INTELLIGENCE API] Error fetching company intelligence:', error);
    console.error('❌ [INTELLIGENCE API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company intelligence', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/companies/[id]/intelligence - Force regenerate intelligence
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const forceRegenerate = body.forceRegenerate || false;

    // Get company from database with all available data sources
    const company = await prisma.companies.findUnique({
      where: { 
        id,
        deletedAt: null // Only show non-deleted records
      },
      select: {
        // Base company fields
        id: true,
        name: true,
        description: true,
        descriptionEnriched: true, // Enriched description field
        industry: true,
        industryOverride: true, // Manual override
        sector: true, // Separate from industry
        size: true,
        employeeCount: true,
        revenue: true,
        website: true,
        websiteOverride: true, // Manual override
        domain: true, // Separate domain field
        customFields: true,
        competitors: true,
        workspaceId: true,
        coreCompanyId: true, // Link to core company
        // Core company relation (global canonical data - most reliable)
        coreCompany: {
          select: {
            id: true,
            name: true,
            industry: true,
            sector: true,
            employeeCount: true,
            description: true,
            website: true,
            domain: true,
            dataQualityScore: true,
            dataSources: true,
            lastVerified: true,
          }
        },
        // Relations
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            workEmail: true, // Work email might be more reliable
            status: true,
          },
          take: 50, // Get more people for better domain consensus
        },
        actions: {
          where: { deletedAt: null },
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            priority: true,
            scheduledAt: true,
            completedAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Generate new intelligence (force regenerate)
    const intelligence = await generateCompanyIntelligence(company, true);

    // Generate company summary for descriptionEnriched field
    const companySummary = await generateCompanySummary(company, intelligence);

    // Update the intelligence in customFields and descriptionEnriched
    const currentCustomFields = company.customFields as any || {};
    const INTELLIGENCE_VERSION = 'v2.0'; // Version for new data source prioritization logic
    await prisma.companies.update({
      where: { id },
      data: {
        customFields: {
          ...currentCustomFields,
          intelligence: intelligence,
          intelligenceVersion: INTELLIGENCE_VERSION, // Store version for cache validation
          intelligenceGeneratedAt: new Date().toISOString()
        },
        descriptionEnriched: companySummary,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Regenerated and cached intelligence for company:', company.name);

    return NextResponse.json({
      success: true,
      intelligence: intelligence,
      regenerated: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error regenerating company intelligence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate company intelligence' },
      { status: 500 }
    );
  }
}

/**
 * Smart industry inference with multiple fallback sources
 */
function inferIndustry(company: any): string | null {
  // Priority 1: Manual override (highest priority - user explicitly set this)
  if (company.industryOverride && company.industryOverride.trim() !== '') {
    return company.industryOverride.trim();
  }
  
  // Priority 2: Core company data (global canonical - very reliable)
  if (company.coreCompany?.industry && company.coreCompany.industry.trim() !== '') {
    return company.coreCompany.industry.trim();
  }
  
  // Priority 3: Company record industry field
  if (company.industry && company.industry.trim() !== '') {
    return company.industry.trim();
  }
  
  // Priority 4: CoreSignal data from customFields
  const customFields = company.customFields as any;
  if (customFields?.coresignalData?.industry && customFields.coresignalData.industry.trim() !== '') {
    return customFields.coresignalData.industry.trim();
  }
  
  // Priority 5: Sector as fallback
  if (company.sector && company.sector.trim() !== '') {
    return company.sector.trim();
  }
  
  // Priority 6: Core company sector
  if (company.coreCompany?.sector && company.coreCompany.sector.trim() !== '') {
    return company.coreCompany.sector.trim();
  }
  
  // No industry data available
  return null;
}

/**
 * Intelligently determine the best available company data from multiple sources
 * Priority: Contact email domains > CoreSignal data > Company record fields
 */
function determineBestCompanyData(company: any): {
  industry: string | null;
  employeeCount: number | null;
  description: string | null;
  website: string | null;
  domain: string | null;
  dataSource: string;
} {
  const people = company.people || [];
  const customFields = company.customFields as any || {};
  const coresignalData = customFields.coresignalData || {};
  const coreCompany = company.coreCompany;
  
  // STEP 1: Determine correct company domain from contact email addresses (MOST RELIABLE)
  let inferredDomain: string | null = null;
  
  // Common personal email domains to exclude
  const personalEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'yandex.com', 'zoho.com',
    'gmx.com', 'live.com', 'msn.com', 'me.com', 'mac.com'
  ];
  
  if (people.length > 0) {
    // Collect all email addresses (both email and workEmail)
    const contactDomains = people
      .map((person: any) => {
        // Prefer workEmail over email
        const emailAddr = person.workEmail || person.email;
        if (!emailAddr) return null;
        const domain = emailAddr.split('@')[1]?.toLowerCase();
        // Filter out personal email domains
        if (domain && personalEmailDomains.includes(domain)) {
          return null;
        }
        return domain;
      })
      .filter(Boolean) as string[];
    
    if (contactDomains.length > 0) {
      // Find the most common contact domain (this is the actual company domain)
      const domainCounts = contactDomains.reduce((acc: Record<string, number>, domain: string) => {
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
      }, {});
      
      const mostCommonDomain = Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      
      // Use contact domain if we have strong consensus (at least 50% of contacts)
      // AND we have at least 2 contacts with this domain (to avoid single contact errors)
      const domainCount = domainCounts[mostCommonDomain];
      const domainPercentage = (domainCount / contactDomains.length) * 100;
      if (domainPercentage >= 50 && domainCount >= 2) {
        inferredDomain = mostCommonDomain;
      }
    }
  }
  
  // STEP 2: Extract domain from company website/domain field (Priority: Override > Core Company > Company record)
  let companyDomain: string | null = null;
  let companyWebsite: string | null = null;
  
  // Priority 1: Website override
  if (company.websiteOverride) {
    companyWebsite = company.websiteOverride;
  }
  // Priority 2: Core company website (global canonical)
  else if (coreCompany?.website) {
    companyWebsite = coreCompany.website;
  }
  // Priority 3: Company record website
  else if (company.website) {
    companyWebsite = company.website;
  }
  // Priority 4: Company record domain field
  else if (company.domain) {
    companyWebsite = company.domain;
  }
  // Priority 5: Core company domain
  else if (coreCompany?.domain) {
    companyWebsite = coreCompany.domain;
  }
  
  // Extract domain from website
  if (companyWebsite) {
    try {
      let normalizedUrl = companyWebsite.trim();
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      const url = new URL(normalizedUrl);
      companyDomain = url.hostname.replace(/^www\./, '').toLowerCase();
    } catch (error) {
      const domainMatch = companyWebsite.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i);
      if (domainMatch) {
        companyDomain = domainMatch[1].toLowerCase();
      }
    }
  }
  
  // Use inferred domain from contacts if it differs from company record (contacts are more reliable)
  const finalDomain = inferredDomain || companyDomain;
  const finalWebsite = inferredDomain && inferredDomain !== companyDomain 
    ? `https://${inferredDomain}` 
    : (companyWebsite || (companyDomain ? `https://${companyDomain}` : null));
  
  // STEP 3: Determine industry (using inferIndustry which checks all sources)
  const industry = inferIndustry(company);
  
  // STEP 4: Determine employee count (Priority: Core Company > CoreSignal > Company record, validate reasonableness)
  let employeeCount: number | null = null;
  
  // Priority 1: Core company (global canonical - most reliable)
  if (coreCompany?.employeeCount && coreCompany.employeeCount > 0) {
    employeeCount = coreCompany.employeeCount;
  }
  // Priority 2: CoreSignal data
  else if (coresignalData.employees_count && coresignalData.employees_count > 0) {
    employeeCount = coresignalData.employees_count;
  }
  // Priority 3: Company record
  else if (company.employeeCount && company.employeeCount > 0) {
    employeeCount = company.employeeCount;
  }
  
  // Validate employee count reasonableness based on industry
  if (employeeCount && industry) {
    const industryLower = industry.toLowerCase();
    // Major utilities/energy companies should have substantial employee counts
    if ((industryLower.includes('utilities') || industryLower.includes('energy') || industryLower.includes('electric')) && employeeCount < 100) {
      // Employee count seems too low - might be incorrect data, use null to avoid misleading info
      employeeCount = null;
    }
    // Very small employee count with major company name suggests data issue
    if (employeeCount !== null && employeeCount < 10 && company.name && company.name.length > 10) {
      employeeCount = null;
    }
  }
  
  // STEP 5: Determine description (Priority: descriptionEnriched > CoreSignal > Core Company > Company record, filter out mismatches)
  let description: string | null = null;
  
  // Priority 1: Enriched description field (validate before using)
  if (company.descriptionEnriched && company.descriptionEnriched.trim() !== '') {
    const descLower = company.descriptionEnriched.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches (e.g., Israeli resort description with Utilities industry)
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    
    // Also check for other mismatches: transportation/utilities industry with resort content
    const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
    const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
    
    if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
      // Description doesn't match industry - skip it and use next source
      console.log(`⚠️ [INTELLIGENCE] Skipping descriptionEnriched due to industry mismatch for ${company.name}`);
    } else {
      description = company.descriptionEnriched.trim();
    }
  }
  // Priority 2: CoreSignal enriched description (validate before using)
  else if (coresignalData.description_enriched && coresignalData.description_enriched.trim() !== '') {
    const descLower = coresignalData.description_enriched.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
    const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
    
    if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
      console.log(`⚠️ [INTELLIGENCE] Skipping CoreSignal description_enriched due to industry mismatch for ${company.name}`);
    } else {
      description = coresignalData.description_enriched.trim();
    }
  }
  // Priority 3: CoreSignal description (validate before using)
  else if (coresignalData.description && coresignalData.description.trim() !== '') {
    const descLower = coresignalData.description.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    const hasResortContent = descLower.includes('resort') || descLower.includes('luxury');
    const isUtilitiesOrTransport = industryLower.includes('utilities') || industryLower.includes('transportation') || industryLower.includes('electric');
    
    if ((hasIsraeliContent || hasResortContent) && isUtilitiesOrTransport && !industryLower.includes('hospitality') && !industryLower.includes('tourism')) {
      console.log(`⚠️ [INTELLIGENCE] Skipping CoreSignal description due to industry mismatch for ${company.name}`);
    } else {
      description = coresignalData.description.trim();
    }
  }
  // Priority 4: Core company description
  else if (coreCompany?.description && coreCompany.description.trim() !== '') {
    description = coreCompany.description.trim();
  }
  // Priority 5: Company record description (validate before using)
  else if (company.description && company.description.trim() !== '') {
    // Validate description matches industry before using
    const descLower = company.description.toLowerCase();
    const industryLower = industry?.toLowerCase() || '';
    
    // Filter out obvious mismatches (e.g., Israeli resort description with Transportation industry)
    const israeliKeywords = ['ישראל', 'israel', 'resort', 'כפר נופש', 'luxury resort'];
    const hasIsraeliContent = israeliKeywords.some(keyword => descLower.includes(keyword.toLowerCase()));
    
    if (hasIsraeliContent && !industryLower.includes('hospitality') && !industryLower.includes('tourism') && !industryLower.includes('resort')) {
      // Description doesn't match industry - don't use it
      description = null;
    } else {
      description = company.description.trim();
    }
  }
  
  // Determine data source for logging
  let dataSource = 'company_record';
  if (coreCompany && (coreCompany.industry || coreCompany.employeeCount || coreCompany.description)) {
    dataSource = 'core_company';
  } else if (coresignalData.industry || coresignalData.employees_count || coresignalData.description_enriched) {
    dataSource = 'coresignal';
  }
  if (inferredDomain && inferredDomain !== companyDomain) {
    dataSource = 'contact_domains';
  }
  
  return {
    industry,
    employeeCount,
    description,
    website: finalWebsite,
    domain: finalDomain,
    dataSource
  };
}

/**
 * Generate company intelligence using AI and company data
 * Intelligently uses the best available data sources without showing warnings
 */
async function generateCompanyIntelligence(company: any, forceRegenerate: boolean = false): Promise<CompanyIntelligence> {
  try {
    // Determine best available data from all sources
    const bestData = determineBestCompanyData(company);
    
    // Use the best available data
    const industry = bestData.industry;
    const size = company.size || 'Medium';
    const employeeCount = bestData.employeeCount ?? 100; // Use nullish coalescing, default to 100
    
    // Generate strategic wants based on industry and size
    const strategicWants = generateStrategicWants(industry, size, employeeCount);
    
    // Generate critical needs based on company data
    const criticalNeeds = generateCriticalNeeds(industry, size, company.people || []);
    
    // Generate business units based on industry
    const businessUnits = generateBusinessUnits(industry);
    
    // Generate strategic intelligence (use best available employee count)
    const strategicIntelligence = generateStrategicIntelligence(company, industry, size, employeeCount);
    
    // Generate Adrata strategy
    const adrataStrategy = generateAdrataStrategy(company, industry, strategicWants, criticalNeeds);
    
    // Build description using best available data
    let description = bestData.description;
    
    if (!description) {
      // Generate default description if none exists
      if (industry && employeeCount) {
        description = `Leading ${industry.toLowerCase()} company with ${employeeCount.toLocaleString()} employees`;
      } else if (industry) {
        description = `Leading ${industry.toLowerCase()} company`;
      } else if (employeeCount) {
        description = `Organization with ${employeeCount.toLocaleString()} employees`;
      } else {
        description = `Company operating in competitive markets`;
      }
    }

    return {
      companyName: company.name,
      industry: industry || 'Unknown',
      description: description,
      strategicWants,
      criticalNeeds,
      businessUnits,
      strategicIntelligence,
      adrataStrategy,
      generatedAt: new Date().toISOString(),
      model: 'adrata-intelligence-v1'
    };

  } catch (error) {
    console.error('❌ [INTELLIGENCE API] Error generating company intelligence:', error);
    
    // Return fallback intelligence
    return {
      companyName: company.name,
      industry: company.industry || 'Unknown',
      description: company.description || 'No description available',
      strategicWants: ['AI intelligence generation unavailable'],
      criticalNeeds: ['Please try again or contact support'],
      businessUnits: [
        { name: 'General', functions: ['Unable to determine business functions'], color: 'bg-gray-50 border-gray-200' }
      ],
      strategicIntelligence: 'Intelligence generation failed',
      adrataStrategy: 'Unable to generate strategy at this time',
      generatedAt: new Date().toISOString(),
      model: 'fallback'
    };
  }
}

/**
 * Generate strategic wants based on company characteristics
 */
function generateStrategicWants(industry: string | null, size: string, employeeCount: number): string[] {
  const baseWants = [
    'Digital transformation initiatives',
    'Operational efficiency improvements',
    'Cost reduction strategies'
  ];

  const industrySpecific: Record<string, string[]> = {
    'Technology': [
      'Cloud migration and optimization',
      'AI and machine learning adoption',
      'Cybersecurity enhancements',
      'DevOps automation'
    ],
    'Healthcare': [
      'Patient data management systems',
      'Telemedicine platform integration',
      'Compliance and security solutions',
      'Workflow automation'
    ],
    'Finance': [
      'Risk management systems',
      'Regulatory compliance tools',
      'Customer experience platforms',
      'Fraud detection systems'
    ],
    'Manufacturing': [
      'Supply chain optimization',
      'IoT and smart manufacturing',
      'Quality control automation',
      'Predictive maintenance'
    ]
  };

  const sizeSpecific = employeeCount > 1000 ? [
    'Enterprise-scale solutions',
    'Multi-location coordination',
    'Advanced analytics and reporting'
  ] : [
    'Scalable growth solutions',
    'Cost-effective implementations',
    'Quick deployment options'
  ];

  // Use industry-specific wants only if industry is known
  const industryWants = industry ? (industrySpecific[industry] || []) : [];

  return [
    ...baseWants,
    ...industryWants,
    ...sizeSpecific
  ].slice(0, 8); // Limit to 8 items
}

/**
 * Generate critical needs based on company data
 */
function generateCriticalNeeds(industry: string | null, size: string, people: any[]): string[] {
  const baseNeeds = [
    'Improved data visibility',
    'Streamlined processes',
    'Better decision-making tools'
  ];

  const peopleCount = people.length;
  const hasExecutives = people.some(p => 
    p.jobTitle && (
      p.jobTitle.toLowerCase().includes('ceo') ||
      p.jobTitle.toLowerCase().includes('cto') ||
      p.jobTitle.toLowerCase().includes('cfo')
    )
  );

  const needs = [...baseNeeds];

  if (peopleCount > 50) {
    needs.push('Team collaboration tools');
    needs.push('Performance tracking systems');
  }

  if (hasExecutives) {
    needs.push('Executive reporting dashboards');
    needs.push('Strategic planning tools');
  }

  // Only add industry-specific needs if industry is known
  if (industry === 'Technology') {
    needs.push('Developer productivity tools');
    needs.push('Code quality management');
  }

  return needs.slice(0, 6); // Limit to 6 items
}

/**
 * Generate business units based on industry
 */
function generateBusinessUnits(industry: string | null): Array<{name: string; functions: string[]; color: string}> {
  const units: Record<string, Array<{name: string; functions: string[]; color: string}>> = {
    'Technology': [
      { name: 'Engineering', functions: ['Software Development', 'Infrastructure', 'Quality Assurance'], color: 'bg-blue-50 border-blue-200' },
      { name: 'Product Management', functions: ['Product Strategy', 'Roadmap Planning', 'Feature Prioritization'], color: 'bg-purple-50 border-purple-200' },
      { name: 'Sales & Marketing', functions: ['Lead Generation', 'Customer Acquisition', 'Brand Management'], color: 'bg-green-50 border-green-200' },
      { name: 'Customer Success', functions: ['Onboarding', 'Support', 'Account Management'], color: 'bg-orange-50 border-orange-200' },
      { name: 'Operations', functions: ['Business Operations', 'Finance', 'HR'], color: 'bg-gray-50 border-gray-200' }
    ],
    'Healthcare': [
      { name: 'Clinical Operations', functions: ['Patient Care', 'Medical Services', 'Treatment Planning'], color: 'bg-blue-50 border-blue-200' },
      { name: 'Patient Services', functions: ['Admissions', 'Scheduling', 'Patient Relations'], color: 'bg-purple-50 border-purple-200' },
      { name: 'Administration', functions: ['Management', 'Finance', 'HR'], color: 'bg-green-50 border-green-200' },
      { name: 'IT & Security', functions: ['Systems Management', 'Data Security', 'Infrastructure'], color: 'bg-orange-50 border-orange-200' },
      { name: 'Compliance', functions: ['Regulatory Compliance', 'Quality Assurance', 'Risk Management'], color: 'bg-red-50 border-red-200' }
    ],
    'Finance': [
      { name: 'Risk Management', functions: ['Risk Assessment', 'Compliance', 'Audit'], color: 'bg-blue-50 border-blue-200' },
      { name: 'Customer Relations', functions: ['Client Services', 'Account Management', 'Support'], color: 'bg-purple-50 border-purple-200' },
      { name: 'Operations', functions: ['Trading', 'Settlement', 'Back Office'], color: 'bg-green-50 border-green-200' },
      { name: 'Compliance', functions: ['Regulatory Compliance', 'Legal', 'Reporting'], color: 'bg-orange-50 border-orange-200' },
      { name: 'Technology', functions: ['Systems Development', 'Infrastructure', 'Security'], color: 'bg-gray-50 border-gray-200' }
    ],
    'Manufacturing': [
      { name: 'Production', functions: ['Manufacturing', 'Assembly', 'Quality Control'], color: 'bg-blue-50 border-blue-200' },
      { name: 'Quality Control', functions: ['Testing', 'Inspection', 'Certification'], color: 'bg-purple-50 border-purple-200' },
      { name: 'Supply Chain', functions: ['Procurement', 'Logistics', 'Inventory'], color: 'bg-green-50 border-green-200' },
      { name: 'Engineering', functions: ['Design', 'R&D', 'Process Engineering'], color: 'bg-orange-50 border-orange-200' },
      { name: 'Sales & Marketing', functions: ['Sales', 'Marketing', 'Distribution'], color: 'bg-gray-50 border-gray-200' }
    ]
  };

  // Generic business units for when industry is unknown
  const genericUnits = [
    { name: 'Operations', functions: ['Business Operations', 'Management', 'Administration'], color: 'bg-blue-50 border-blue-200' },
    { name: 'Sales & Marketing', functions: ['Sales', 'Marketing', 'Customer Relations'], color: 'bg-green-50 border-green-200' },
    { name: 'Finance', functions: ['Accounting', 'Financial Planning', 'Budgeting'], color: 'bg-purple-50 border-purple-200' },
    { name: 'Human Resources', functions: ['Recruiting', 'Training', 'Employee Relations'], color: 'bg-orange-50 border-orange-200' },
    { name: 'Support Services', functions: ['IT Support', 'Facilities', 'Administrative Support'], color: 'bg-gray-50 border-gray-200' }
  ];

  if (!industry) {
    return genericUnits;
  }

  return units[industry] || genericUnits;
}

/**
 * Generate strategic intelligence
 */
function generateStrategicIntelligence(company: any, industry: string | null, size: string, employeeCount: number = 100): string {
  const revenue = company.revenue || 0;
  
  if (industry) {
    return `${company.name} is a ${size.toLowerCase()} ${industry.toLowerCase()} company with approximately ${employeeCount} employees${revenue > 0 ? ` and estimated revenue of $${revenue.toLocaleString()}` : ''}. The company appears to be focused on ${industry.toLowerCase()} solutions and would benefit from strategic technology partnerships that can drive operational efficiency and growth. Based on the company's size and industry, they likely face challenges around scaling operations, maintaining competitive advantage, and optimizing resource allocation.`;
  } else {
    return `${company.name} is a ${size.toLowerCase()}-sized organization with approximately ${employeeCount} employees${revenue > 0 ? ` and estimated revenue of $${revenue.toLocaleString()}` : ''}. The company would benefit from strategic partnerships that can drive operational efficiency and growth. Based on the company's size, they likely face challenges around scaling operations, maintaining competitive advantage, and optimizing resource allocation.`;
  }
}

/**
 * Generate Adrata strategy
 */
function generateAdrataStrategy(company: any, industry: string | null, strategicWants: string[], criticalNeeds: string[]): string {
  const industryContext = industry ? ` for their ${industry.toLowerCase()} operations` : '';
  return `For ${company.name}, Adrata should focus on positioning our solutions as strategic enablers${industryContext}. Key approach: 1) Lead with ROI and efficiency gains that address their critical needs around ${criticalNeeds.slice(0, 2).join(' and ')}, 2) Demonstrate how our platform can support their strategic wants including ${strategicWants.slice(0, 2).join(' and ')}, 3) Engage with decision-makers through targeted outreach that emphasizes value propositions aligned with their business goals, 4) Provide proof-of-concept opportunities that showcase immediate impact on their core business processes.`;
}

/**
 * Generate comprehensive company summary for descriptionEnriched field
 * Uses best available data sources intelligently
 */
async function generateCompanySummary(company: any, intelligence: any): Promise<string> {
  // Use the same intelligent data determination logic
  const bestData = determineBestCompanyData(company);
  
  const industry = bestData.industry;
  const size = company.size || 'Medium';
  const employeeCount = bestData.employeeCount || 100;
  const revenue = company.revenue || 0;
  const location = company.city && company.state ? `${company.city}, ${company.state}` : company.country || 'Unknown';
  const foundedYear = company.foundedYear || 'Unknown';
  const website = bestData.website || company.website || company.domain || 'N/A';
  
  // Build comprehensive company summary
  // Handle missing industry gracefully - only mention it if available
  let summary = company.name;
  
  if (industry) {
    summary += ` is a ${size.toLowerCase()} ${industry.toLowerCase()} company`;
  } else {
    summary += ` is a ${size.toLowerCase()}-sized organization`;
  }
  
  // Add employee count
  if (employeeCount) {
    summary += ` with approximately ${employeeCount.toLocaleString()} employees`;
  }
  
  // Add revenue if available
  if (revenue > 0) {
    summary += ` and estimated revenue of $${revenue.toLocaleString()}`;
  }
  
  // Add location
  summary += `, headquartered in ${location}`;
  
  // Add founding year
  if (foundedYear !== 'Unknown') {
    summary += `, founded in ${foundedYear}`;
  }
  
  // Add website
  if (website !== 'N/A') {
    summary += `. Website: ${website}`;
  }
  
  summary += '.';
  
  // Add industry context only if industry is known
  if (industry) {
    summary += `\n\nAs a ${industry.toLowerCase()} company, ${company.name} operates in a competitive market`;
  } else {
    summary += `\n\n${company.name} operates in a competitive market`;
  }
  
  // Add strategic context from intelligence
  if (intelligence && intelligence.strategicWants && intelligence.strategicWants.length > 0) {
    summary += ` with strategic focus on ${intelligence.strategicWants.slice(0, 2).join(' and ')}`;
  }
  
  if (intelligence && intelligence.criticalNeeds && intelligence.criticalNeeds.length > 0) {
    summary += `. Key challenges include ${intelligence.criticalNeeds.slice(0, 2).join(' and ')}`;
  }
  
  summary += '.';
  
  // Add business intelligence context
  if (intelligence && intelligence.strategicIntelligence) {
    summary += `\n\n${intelligence.strategicIntelligence}`;
  }
  
  // Add engagement context
  if (company.people && company.people.length > 0) {
    summary += `\n\nThe company has ${company.people.length} known contacts in our database`;
    
    // Add buyer group context if available
    const buyerGroup = company.people.filter((p: any) => p.buyerGroupRole);
    if (buyerGroup.length > 0) {
      summary += `, including ${buyerGroup.length} identified buyer group members`;
    }
    
    summary += '.';
  }
  
  // Add recent activity context - use computed lastAction for accuracy
  // Checks both company-level and person-level actions
  const { computeCompanyLastAction } = await import('@/platform/utils/company-last-action');
  const lastActionResult = await computeCompanyLastAction(
    company.id,
    company.lastAction,
    company.lastActionDate
  );
  
  if (lastActionResult.lastAction && 
      lastActionResult.lastAction !== 'No action taken' && 
      lastActionResult.lastAction !== 'Record created' && 
      lastActionResult.lastAction !== 'Company record created') {
    summary += `\n\nRecent activity: ${lastActionResult.lastAction}`;
    if (lastActionResult.lastActionDate) {
      const actionDate = new Date(lastActionResult.lastActionDate).toLocaleDateString();
      summary += ` (${actionDate})`;
    }
    summary += '.';
  }
  
  // Add next action context
  if (company.nextAction) {
    summary += `\n\nNext planned action: ${company.nextAction}`;
    if (company.nextActionDate) {
      const nextActionDate = new Date(company.nextActionDate).toLocaleDateString();
      summary += ` (scheduled for ${nextActionDate})`;
    }
    summary += '.';
  }
  
  return summary;
}
