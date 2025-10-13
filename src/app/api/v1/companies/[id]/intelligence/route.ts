import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getV1AuthUser } from '../../../auth';

/**
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

    // Get company from database
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
        industry: true,
        size: true,
        employeeCount: true,
        revenue: true,
        customFields: true,
        competitors: true, // Include competitors field
        workspaceId: true,
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
            status: true,
          },
          take: 10,
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
    if (cachedIntelligence?.intelligence) {
      console.log(`✅ [INTELLIGENCE API] Using cached intelligence data for company: ${company.name}`);
      return NextResponse.json({
        success: true,
        intelligence: cachedIntelligence.intelligence,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔄 [INTELLIGENCE API] Generating new intelligence for company: ${company.name}`);
    // Generate new intelligence
    const intelligence = await generateCompanyIntelligence(company);

    // Cache the intelligence in customFields
    try {
      await prisma.companies.update({
        where: { id },
        data: {
          customFields: {
            ...cachedIntelligence,
            intelligence: intelligence
          },
          updatedAt: new Date(),
        },
      });
      console.log(`✅ [INTELLIGENCE API] Cached intelligence for company: ${company.name}`);
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

    // Get company from database
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
        industry: true,
        size: true,
        employeeCount: true,
        revenue: true,
        customFields: true,
        competitors: true, // Include competitors field
        workspaceId: true,
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
            status: true,
          },
          take: 10,
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

    // Update the intelligence in customFields
    const currentCustomFields = company.customFields as any || {};
    await prisma.companies.update({
      where: { id },
      data: {
        customFields: {
          ...currentCustomFields,
          intelligence: intelligence
        },
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
 * Generate company intelligence using AI and company data
 */
async function generateCompanyIntelligence(company: any, forceRegenerate: boolean = false): Promise<CompanyIntelligence> {
  try {
    // For now, generate structured intelligence based on company data
    // This can be enhanced with actual AI integration later
    
    const industry = company.industry || 'Technology';
    const size = company.size || 'Medium';
    const employeeCount = company.employeeCount || 100;
    
    // Generate strategic wants based on industry and size
    const strategicWants = generateStrategicWants(industry, size, employeeCount);
    
    // Generate critical needs based on company data
    const criticalNeeds = generateCriticalNeeds(industry, size, company.people || []);
    
    // Generate business units based on industry
    const businessUnits = generateBusinessUnits(industry);
    
    // Generate strategic intelligence
    const strategicIntelligence = generateStrategicIntelligence(company, industry, size);
    
    // Generate Adrata strategy
    const adrataStrategy = generateAdrataStrategy(company, industry, strategicWants, criticalNeeds);

    return {
      companyName: company.name,
      industry: industry,
      description: company.description || `Leading ${industry.toLowerCase()} company with ${employeeCount} employees`,
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
function generateStrategicWants(industry: string, size: string, employeeCount: number): string[] {
  const baseWants = [
    'Digital transformation initiatives',
    'Operational efficiency improvements',
    'Cost reduction strategies'
  ];

  const industrySpecific = {
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

  return [
    ...baseWants,
    ...(industrySpecific[industry] || industrySpecific['Technology']),
    ...sizeSpecific
  ].slice(0, 8); // Limit to 8 items
}

/**
 * Generate critical needs based on company data
 */
function generateCriticalNeeds(industry: string, size: string, people: any[]): string[] {
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

  if (industry === 'Technology') {
    needs.push('Developer productivity tools');
    needs.push('Code quality management');
  }

  return needs.slice(0, 6); // Limit to 6 items
}

/**
 * Generate business units based on industry
 */
function generateBusinessUnits(industry: string): Array<{name: string; functions: string[]; color: string}> {
  const units = {
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

  return units[industry] || units['Technology'];
}

/**
 * Generate strategic intelligence
 */
function generateStrategicIntelligence(company: any, industry: string, size: string): string {
  const employeeCount = company.employeeCount || 100;
  const revenue = company.revenue || 0;
  
  return `${company.name} is a ${size.toLowerCase()} ${industry.toLowerCase()} company with approximately ${employeeCount} employees${revenue > 0 ? ` and estimated revenue of $${revenue.toLocaleString()}` : ''}. The company appears to be focused on ${industry.toLowerCase()} solutions and would benefit from strategic technology partnerships that can drive operational efficiency and growth. Based on the company's size and industry, they likely face challenges around scaling operations, maintaining competitive advantage, and optimizing resource allocation.`;
}

/**
 * Generate Adrata strategy
 */
function generateAdrataStrategy(company: any, industry: string, strategicWants: string[], criticalNeeds: string[]): string {
  return `For ${company.name}, Adrata should focus on positioning our solutions as strategic enablers for their ${industry.toLowerCase()} operations. Key approach: 1) Lead with ROI and efficiency gains that address their critical needs around ${criticalNeeds.slice(0, 2).join(' and ')}, 2) Demonstrate how our platform can support their strategic wants including ${strategicWants.slice(0, 2).join(' and ')}, 3) Engage with decision-makers through targeted outreach that emphasizes industry-specific value propositions, 4) Provide proof-of-concept opportunities that showcase immediate impact on their core business processes.`;
}
