import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CompanyIntelligenceGenerator, CoreSignalCompanyData } from '@/platform/services/company-intelligence-generator';

const prisma = new PrismaClient();

async function generateOptimizedContent(prompt: string): Promise<string> {
  try {
    // Try to use Claude if API key is available
    if (process.env['ANTHROPIC_API_KEY']) {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env['ANTHROPIC_API_KEY'],
      });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5', // Latest Claude 4.5 Sonnet - best for business intelligence
        max_tokens: 1000, // Increased for more comprehensive analysis
        temperature: 0.3, // Lower temperature for more consistent, factual output
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
    }
  } catch (error) {
    console.log('Claude API not available for content optimization, using fallback');
  }

  // Fallback to template-based content
  return generateFallbackContent(prompt);
}

function generateFallbackContent(prompt: string): string {
  // Extract company name from prompt
  const nameMatch = prompt.match(/about (\w+)/);
  const companyName = nameMatch ? nameMatch[1] : 'the company';
  
  if (prompt.includes('strategic sales positioning')) {
    return `TOP Engineers Plus should position as a specialized communications engineering partner for ${companyName}'s critical infrastructure needs. Key positioning opportunities include leveraging TOP's expertise in fiber optic design, microwave engineering, and strategic planning for infrastructure projects. Use TOP's operational excellence and change management capabilities to streamline technology integrations. Provide strategic plan reviews and technology assessments to support digital transformation initiatives. Offer expertise in telecommunications standards and safety regulations for critical infrastructure. Emphasize TOP's unique connection between Technology, Operations, and People, and reference their decades of experience in the critical infrastructure sector. Target decision makers in IT, Operations, and Engineering departments.`;
  } else {
    return `${companyName} is a major company in the utilities sector with significant infrastructure and technology integration challenges. The company operates critical infrastructure and faces unique challenges in maintaining service reliability while modernizing aging systems. Key strategic considerations include regulatory compliance with environmental standards, infrastructure investment planning, and customer service modernization. Partnership opportunities exist in communications engineering, strategic planning, process optimization, and regulatory compliance automation.`;
  }
}

async function generateSophisticatedIntelligence(company: any, coresignalData: CoreSignalCompanyData) {
  // Analyze the company's actual data to generate TOP-specific intelligence
  const isUtility = company.industry?.toLowerCase().includes('utility') || 
                   company.industry?.toLowerCase().includes('utilities') ||
                   company.industry?.toLowerCase().includes('energy') ||
                   company.industry?.toLowerCase().includes('electric');
  
  console.log(`🔍 [INTELLIGENCE DEBUG] Company: ${company.name}, Industry: ${company.industry}, isUtility: ${isUtility}`);
  
  const isLargeCompany = (company.employeeCount || 0) > 1000;
  const isPublicCompany = company.isPublic;
  const hasComplexTech = (company.technologiesUsed?.length || 0) > 50;
  
          // Generate TOP-specific strategic wants with rationale
          const strategicWants = isUtility ? [
            `Smart grid communications infrastructure - ${company.name} needs fiber optic and microwave systems for grid modernization, creating opportunities for TOP's core expertise in utility communications engineering`,
            `Emergency response system integration - Critical for ${company.name} during storms/disasters, requiring TOP's experience in resilient communications infrastructure and 24/7 operational support`,
            `Regulatory compliance automation - ${company.name} faces strict FCC/FERC requirements, where TOP's telecommunications compliance expertise provides immediate value`,
            `Customer service digitization - ${company.name}'s customers expect digital engagement, requiring TOP's broadband deployment and customer experience optimization capabilities`
          ] : [
            `Digital transformation communications backbone - ${company.name} needs robust internal communications infrastructure, leveraging TOP's fiber optic design and microwave engineering expertise`,
            `Operational efficiency through technology integration - ${company.name} requires process optimization, where TOP's strategic planning and change management experience delivers results`,
            `Regulatory compliance for critical systems - ${company.name} needs telecommunications compliance, creating opportunities for TOP's regulatory expertise`,
            `Infrastructure modernization projects - ${company.name} needs scalable communications systems, requiring TOP's engineering and project management capabilities`
          ];

      // Generate TOP-specific critical needs with business justification
      const criticalNeeds = hasComplexTech ? [
        `Legacy system integration challenges - With ${company.technologiesUsed?.length || 0}+ existing technologies, ${company.name} needs expert guidance on integrating new communications systems with legacy infrastructure, where TOP's 20+ years of experience provides competitive advantage`,
        `Operational efficiency gaps - ${company.name}'s operations require streamlined processes, creating opportunities for TOP's operational excellence and process improvement methodologies`,
        `Technology change management - ${company.name}'s complex integrations require skilled change management, leveraging TOP's proven track record in managing technology transitions for critical infrastructure`,
        `Regulatory compliance complexity - ${company.name} faces increasing regulatory requirements, where TOP's telecommunications compliance expertise reduces risk and ensures operational continuity`
      ] : [
        `Technology modernization roadmap - ${company.name} needs strategic guidance on communications infrastructure, where TOP's engineering expertise provides clear competitive positioning`,
        `Operational process optimization - ${company.name} requires efficiency improvements, creating opportunities for TOP's process improvement and change management capabilities`,
        `Technology integration challenges - ${company.name}'s technology stack needs expert integration, where TOP's engineering experience provides immediate value`,
        `Compliance and safety requirements - ${company.name} needs telecommunications compliance, where TOP's regulatory expertise provides risk mitigation and operational assurance`
      ];

      // Generate business units based on the target company's actual CoreSignal data
      const businessUnits = [];
      
      // Only show business units if we have enough CoreSignal data
      if (company.technologiesUsed?.length > 10 || company.companyUpdates?.length > 20) {
        // Extract business units from company updates and technologies
        const detectedUnits = new Set();
        const unitFunctions = new Map();
        
        // Analyze company updates for business unit mentions
        if (company.companyUpdates && company.companyUpdates.length > 0) {
          company.companyUpdates.forEach(update => {
            const description = update.description || '';
            
            // Detect business units from content
            if (description.includes('Engineering') || description.includes('System Planning')) {
              detectedUnits.add('Engineering & System Planning');
              if (!unitFunctions.has('Engineering & System Planning')) {
                unitFunctions.set('Engineering & System Planning', new Set());
              }
              unitFunctions.get('Engineering & System Planning').add('System planning');
              unitFunctions.get('Engineering & System Planning').add('Infrastructure design');
            }
            
            if (description.includes('Grid') || description.includes('Power') || description.includes('Electricity')) {
              detectedUnits.add('Grid Operations');
              if (!unitFunctions.has('Grid Operations')) {
                unitFunctions.set('Grid Operations', new Set());
              }
              unitFunctions.get('Grid Operations').add('Grid management');
              unitFunctions.get('Grid Operations').add('Power distribution');
            }
            
            if (description.includes('Customer') || description.includes('Service')) {
              detectedUnits.add('Customer Operations');
              if (!unitFunctions.has('Customer Operations')) {
                unitFunctions.set('Customer Operations', new Set());
              }
              unitFunctions.get('Customer Operations').add('Customer service');
              unitFunctions.get('Customer Operations').add('Billing systems');
            }
            
            if (description.includes('Clean Energy') || description.includes('Renewable') || description.includes('Solar') || description.includes('Wind')) {
              detectedUnits.add('Clean Energy');
              if (!unitFunctions.has('Clean Energy')) {
                unitFunctions.set('Clean Energy', new Set());
              }
              unitFunctions.get('Clean Energy').add('Renewable energy');
              unitFunctions.get('Clean Energy').add('Clean energy programs');
            }
            
            if (description.includes('Technology') || description.includes('Innovation') || description.includes('Digital')) {
              detectedUnits.add('Technology & Innovation');
              if (!unitFunctions.has('Technology & Innovation')) {
                unitFunctions.set('Technology & Innovation', new Set());
              }
              unitFunctions.get('Technology & Innovation').add('Technology integration');
              unitFunctions.get('Technology & Innovation').add('Digital transformation');
            }
          });
        }
        
        // If we detected business units from company updates, use those
        if (detectedUnits.size > 0) {
          const colors = ['bg-blue-100 border-blue-200', 'bg-green-100 border-green-200', 'bg-purple-100 border-purple-200', 'bg-orange-100 border-orange-200', 'bg-red-100 border-red-200'];
          let colorIndex = 0;
          
          detectedUnits.forEach(unitName => {
            const functions = Array.from(unitFunctions.get(unitName) || []);
            businessUnits.push({
              name: unitName,
              functions: functions.length > 0 ? functions : ['Operations', 'Strategic planning'],
              color: colors[colorIndex % colors.length]
            });
            colorIndex++;
          });
        } else {
          // Fallback to industry-specific business units if no data detected
          if (isUtility) {
            businessUnits.push(
              {
                name: 'Power Generation',
                functions: ['Electricity production', 'Renewable energy', 'Nuclear operations', 'Grid management'],
                color: 'bg-blue-100 border-blue-200'
              },
              {
                name: 'Distribution & Transmission',
                functions: ['Power distribution', 'Grid infrastructure', 'Substation operations', 'Line maintenance'],
                color: 'bg-green-100 border-green-200'
              },
              {
                name: 'Customer Operations',
                functions: ['Customer service', 'Billing systems', 'Outage management', 'Energy efficiency programs'],
                color: 'bg-purple-100 border-purple-200'
              },
              {
                name: 'Engineering & Planning',
                functions: ['System planning', 'Infrastructure design', 'Technology integration', 'Regulatory compliance'],
                color: 'bg-orange-100 border-orange-200'
              }
            );
          } else {
            businessUnits.push(
              {
                name: 'Technology & IT',
                functions: ['Software development', 'IT infrastructure', 'Data management', 'Security systems'],
                color: 'bg-blue-100 border-blue-200'
              },
              {
                name: 'Operations',
                functions: ['Process management', 'Quality control', 'Performance monitoring', 'Operational excellence'],
                color: 'bg-green-100 border-green-200'
              },
              {
                name: 'Sales & Marketing',
                functions: ['Customer acquisition', 'Brand management', 'Market research', 'Lead generation'],
                color: 'bg-purple-100 border-purple-200'
              },
              {
                name: 'Finance & Administration',
                functions: ['Financial planning', 'Budget management', 'HR operations', 'Compliance'],
                color: 'bg-orange-100 border-orange-200'
              }
            );
          }
        }
      }

      // Generate sophisticated strategic intelligence with specific business context
      const companySize = company.employeeCount ? `${company.employeeCount.toLocaleString()}` : 'unknown number of';
      const companyType = isPublicCompany ? 'publicly traded' : 'privately held';
      const industryFocus = isUtility ? 'utility and energy' : company.industry?.toLowerCase() || 'technology';
      const techComplexity = company.technologiesUsed?.length || 0;
      
          const strategicIntelligence = `${company.name} represents a high-value opportunity as a ${companyType} ${industryFocus} company with ${companySize} employees. Their ${techComplexity}+ technology stack indicates complex integration challenges that require specialized communications engineering expertise. As a ${isUtility ? 'utility company' : 'large enterprise'}, they face unique challenges: ${isUtility ? 'grid modernization, emergency response systems, and regulatory compliance' : 'digital transformation, operational efficiency, and technology integration'}. The company's size and industry position create multiple entry points for TOP's services. Key opportunity areas include ${isUtility ? 'smart grid communications, emergency response infrastructure, and regulatory compliance automation' : 'communications backbone modernization, process optimization, and technology change management'}. ${company.name}'s focus on ${isUtility ? 'critical infrastructure and public service' : 'operational excellence and growth'} aligns perfectly with TOP's core competencies in communications engineering, strategic planning, and regulatory compliance.`;

      const adrataStrategy = `TOP Engineers Plus should approach ${company.name} as a specialized communications engineering partner with deep utility sector expertise. Primary positioning strategy: (1) Lead with Communications Engineering - Emphasize TOP's 20+ years in fiber optic design and microwave engineering for ${isUtility ? 'smart grid and emergency response systems' : 'enterprise communications infrastructure'}, specifically highlighting experience with ${isUtility ? 'utility emergency communications and grid resilience' : 'large-scale technology integration projects'}. (2) Leverage Process Optimization - Position TOP's operational excellence capabilities to address their ${techComplexity}+ technology integration challenges, emphasizing proven methodologies for ${isUtility ? 'utility operations optimization' : 'enterprise process improvement'}. (3) Highlight Regulatory Expertise - Lead with telecommunications compliance experience, particularly ${isUtility ? 'FCC/FERC requirements for utility communications' : 'enterprise telecommunications standards'}, reducing their compliance risk. (4) Target Key Decision Makers - Focus on ${isUtility ? 'IT Directors, Operations Managers, and Engineering Leadership' : 'CTO, IT Directors, and Operations Leadership'} who understand the complexity of ${techComplexity}+ technology integrations. Emphasize TOP's unique Technology-Operations-People approach and reference specific utility sector experience. Initial conversation should focus on their immediate ${isUtility ? 'grid modernization and emergency response' : 'digital transformation and efficiency'} challenges.`;

      return {
        strategicWants,
        criticalNeeds,
        businessUnits,
        strategicIntelligence,
        adrataStrategy
      };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`🧠 [COMPANY INTELLIGENCE API] Generating intelligence for company ID: ${id}`);

    await prisma.$connect();

        // Fetch company with basic data
        const company = await prisma.companies.findFirst({
          where: {
            id: id,
            deletedAt: null
          },
          select: {
            id: true,
            name: true,
            industry: true,
            sector: true,
            size: true,
            employeeCount: true,
            foundedYear: true,
            description: true,
            website: true,
            linkedinUrl: true,
            linkedinFollowers: true,
            technologiesUsed: true,
            competitors: true,
            customFields: true
          }
        });

    if (!company) {
      console.log(`❌ [COMPANY INTELLIGENCE API] Company not found: ${id}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Company not found',
          intelligence: null
        },
        { status: 404 }
      );
    }

    // Check if we already have cached intelligence
    const customFields = company.customFields as any;
    const cachedIntelligence = customFields?.intelligence;
    if (cachedIntelligence && cachedIntelligence.generatedAt) {
      const cacheAge = Date.now() - new Date(cachedIntelligence.generatedAt).getTime();
      const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge < cacheExpiry) {
        console.log(`✅ [COMPANY INTELLIGENCE API] Using cached intelligence for ${company.name}`);
        return NextResponse.json({
          success: true,
          intelligence: cachedIntelligence,
          cached: true
        });
      }
    }

    // Generate sophisticated intelligence using Claude with TOP's actual business context
    const coresignalData: CoreSignalCompanyData = {
      name: company.name,
      industry: company.industry || '',
      sector: company.industry || '',
      size: company.employeeCount ? `${company.employeeCount} employees` : 'Unknown',
      employeeCount: company.employeeCount || 0,
      foundedYear: company.foundedYear || 0,
      description: company.description || '',
      descriptionEnriched: (company as any).descriptionEnriched || '',
      website: company.website || '',
      linkedinUrl: company.linkedinUrl || '',
      linkedinFollowers: company.linkedinFollowers || 0,
      technologiesUsed: company.technologiesUsed || [],
      competitors: company.competitors || [],
      companyUpdates: (company as any).companyUpdates || [],
      hqLocation: (company as any).hqLocation || '',
      hqCity: (company as any).hqCity || '',
      hqState: (company as any).hqState || '',
      isPublic: (company as any).isPublic || false,
      stockSymbol: (company as any).stockSymbol || '',
      naicsCodes: (company as any).naicsCodes || [],
      sicCodes: (company as any).sicCodes || []
    };

    // Generate sophisticated intelligence using smart template-based approach
    const intelligence = await generateSophisticatedIntelligence(company, coresignalData);

    // Cache the intelligence in the database
    const updatedCustomFields = {
      ...customFields,
      intelligence: {
        ...intelligence,
        generatedAt: new Date().toISOString()
      }
    };

    await prisma.companies.update({
      where: { id: company.id },
      data: { customFields: updatedCustomFields }
    });

    console.log(`✅ [COMPANY INTELLIGENCE API] Generated intelligence for ${company.name}`);

    return NextResponse.json({
      success: true,
      intelligence: intelligence,
      cached: false
    });

  } catch (error) {
    console.error('❌ [COMPANY INTELLIGENCE API] Error generating intelligence:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate intelligence',
        intelligence: null
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { forceRegenerate } = await request.json();

    console.log(`🔄 [COMPANY INTELLIGENCE API] Force regenerating intelligence for company ID: ${id}`);

    await prisma.$connect();

    // Clear cached intelligence
    const company = await prisma.companies.findFirst({
      where: { id: id, deletedAt: null },
      select: { id: true, customFields: true }
    });

    if (company) {
      const customFields = company.customFields as any;
      const updatedCustomFields = { ...customFields };
      delete updatedCustomFields.intelligence;

      await prisma.companies.update({
        where: { id: company.id },
        data: { customFields: updatedCustomFields }
      });
    }

    // Regenerate intelligence
    return GET(request, { params });

  } catch (error) {
    console.error('❌ [COMPANY INTELLIGENCE API] Error force regenerating intelligence:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to force regenerate intelligence',
        intelligence: null
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}