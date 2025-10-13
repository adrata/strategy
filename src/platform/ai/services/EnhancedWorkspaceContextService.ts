/**
 * 🏢 ENHANCED WORKSPACE CONTEXT SERVICE
 * 
 * Service to build comprehensive workspace and company context for AI
 * Specifically enhanced for TOP Engineering Plus and other enriched workspaces
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WorkspaceContext {
  workspace: {
    id: string;
    name: string;
    description?: string;
    industry?: string;
    businessModel?: string;
    serviceOfferings?: string[];
    productPortfolio?: string[];
    valuePropositions?: string[];
    targetIndustries?: string[];
    targetCompanySize?: string[];
    idealCustomerProfile?: string;
    competitiveAdvantages?: string[];
    salesMethodology?: string;
  };
  company: {
    name: string;
    industry: string;
    description?: string;
    businessChallenges?: string[];
    businessPriorities?: string[];
    competitiveAdvantages?: string[];
    growthOpportunities?: string[];
    marketPosition?: string;
    strategicInitiatives?: string[];
    successMetrics?: string[];
    serviceOfferings?: string[];
    technicalCapabilities?: string[];
    expertiseAreas?: string[];
    targetSegments?: string[];
    industrySpecializations?: string[];
  };
  data: {
    totalPeople: number;
    totalCompanies: number;
    funnelDistribution: {
      prospects: number;
      leads: number;
      opportunities: number;
    };
    topCompanies: string[];
    geographicDistribution: string[];
  };
}

export class EnhancedWorkspaceContextService {
  
  /**
   * Build comprehensive workspace context for AI
   */
  static async buildWorkspaceContext(workspaceId: string): Promise<WorkspaceContext | null> {
    try {
      // Fetch workspace data with new business context fields
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
          description: true,
          businessModel: true,
          industry: true,
          serviceOfferings: true,
          productPortfolio: true,
          valuePropositions: true,
          targetIndustries: true,
          targetCompanySize: true,
          idealCustomerProfile: true,
          competitiveAdvantages: true,
          salesMethodology: true,
        }
      });

      if (!workspace) {
        return null;
      }

      // Fetch the main company record for this workspace (look for any company, not just TOP Engineers Plus)
      const company = await prisma.companies.findFirst({
        where: { 
          workspaceId: workspaceId
        },
        select: {
          name: true,
          industry: true,
          description: true,
          businessChallenges: true,
          businessPriorities: true,
          competitiveAdvantages: true,
          growthOpportunities: true,
          marketPosition: true,
          strategicInitiatives: true,
          successMetrics: true,
        }
      });

      // Fetch data statistics
      const [peopleCount, companiesCount, peopleData, companiesData] = await Promise.all([
        prisma.people.count({ where: { workspaceId } }),
        prisma.companies.count({ where: { workspaceId } }),
        prisma.people.findMany({
          where: { workspaceId },
          select: { 
            tags: true,
            city: true,
            state: true,
            country: true,
            company: {
              select: { name: true }
            }
          },
          take: 100
        }),
        prisma.companies.findMany({
          where: { workspaceId },
          select: { name: true },
          take: 20
        })
      ]);

      // Analyze funnel distribution from tags
      const funnelDistribution = this.analyzeFunnelDistribution(peopleData);
      
      // Get top companies
      const topCompanies = companiesData.map(c => c.name).slice(0, 10);
      
      // Get geographic distribution
      const geographicDistribution = this.analyzeGeographicDistribution(peopleData);

      return {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          industry: workspace.industry || company?.industry,
          businessModel: workspace.businessModel,
          serviceOfferings: workspace.serviceOfferings || [],
          productPortfolio: workspace.productPortfolio || [],
          valuePropositions: workspace.valuePropositions || [],
          targetIndustries: workspace.targetIndustries || [],
          targetCompanySize: workspace.targetCompanySize || [],
          idealCustomerProfile: workspace.idealCustomerProfile,
          competitiveAdvantages: workspace.competitiveAdvantages || [],
          salesMethodology: workspace.salesMethodology,
        },
        company: {
          name: company?.name || workspace.name,
          industry: company?.industry || workspace.industry || 'Unknown',
          description: company?.description,
          businessChallenges: company?.businessChallenges || [],
          businessPriorities: company?.businessPriorities || [],
          competitiveAdvantages: company?.competitiveAdvantages || workspace.competitiveAdvantages || [],
          growthOpportunities: company?.growthOpportunities || [],
          marketPosition: company?.marketPosition,
          strategicInitiatives: company?.strategicInitiatives || [],
          successMetrics: company?.successMetrics || [],
          serviceOfferings: workspace.serviceOfferings || [],
          technicalCapabilities: workspace.serviceOfferings || [], // Map service offerings to technical capabilities
          expertiseAreas: workspace.serviceOfferings || [], // Map service offerings to expertise areas
          targetSegments: workspace.targetIndustries || [], // Map target industries to target segments
          industrySpecializations: workspace.targetIndustries || [], // Map target industries to specializations
        },
        data: {
          totalPeople: peopleCount,
          totalCompanies: companiesCount,
          funnelDistribution,
          topCompanies,
          geographicDistribution,
        }
      };
    } catch (error) {
      console.error('Error building workspace context:', error);
      return null;
    }
  }

  /**
   * Analyze funnel distribution from people data
   */
  private static analyzeFunnelDistribution(peopleData: any[]): { prospects: number; leads: number; opportunities: number } {
    let prospects = 0;
    let leads = 0;
    let opportunities = 0;

    peopleData.forEach(person => {
      const tags = person.tags || [];
      const tagString = tags.join(' ').toLowerCase();
      
      if (tagString.includes('opportunity') || tagString.includes('utc') || tagString.includes('conference')) {
        opportunities++;
      } else if (tagString.includes('lead') || tagString.includes('engaged')) {
        leads++;
      } else {
        prospects++;
      }
    });

    return { prospects, leads, opportunities };
  }

  /**
   * Analyze geographic distribution
   */
  private static analyzeGeographicDistribution(peopleData: any[]): string[] {
    const states = new Set<string>();
    
    peopleData.forEach(person => {
      if (person.state) {
        states.add(person.state);
      }
    });

    return Array.from(states).slice(0, 10);
  }

  /**
   * Build AI context string from workspace context
   */
  static buildAIContextString(context: WorkspaceContext): string {
    const { workspace, company, data } = context;

    return `=== YOUR BUSINESS (WHO YOU ARE) ===
Company: ${workspace.name}
Industry: ${workspace.industry || company.industry}
Business Model: ${workspace.businessModel || 'Professional Services'}
What You Sell: ${workspace.productPortfolio?.join(', ') || workspace.serviceOfferings?.join(', ') || 'Professional Services'}
Your Value Props: ${workspace.valuePropositions?.join(', ') || 'Quality service delivery'}
Your Ideal Customers: ${workspace.idealCustomerProfile || 'Businesses and organizations needing professional services'}
Your Competitive Edge: ${workspace.competitiveAdvantages?.join(', ') || 'Professional expertise and service quality'}
Your Sales Approach: ${workspace.salesMethodology || 'Consultative approach focused on client needs'}

=== COMPANY PROFILE - ${company.name} ===
Description: ${company.description || 'Professional services company'}
Market Position: ${company.marketPosition || 'Established service provider'}
Business Challenges: ${company.businessChallenges?.join(', ') || 'Market competition and client acquisition'}
Business Priorities: ${company.businessPriorities?.join(', ') || 'Client satisfaction and growth'}
Growth Opportunities: ${company.growthOpportunities?.join(', ') || 'Market expansion and service diversification'}
Strategic Initiatives: ${company.strategicInitiatives?.join(', ') || 'Service excellence and client relationships'}
Success Metrics: ${company.successMetrics?.join(', ') || 'Client satisfaction and business growth'}

=== SERVICE CAPABILITIES ===
Service Offerings: ${workspace.serviceOfferings?.join(', ') || 'Professional services'}
Technical Capabilities: ${workspace.serviceOfferings?.join(', ') || 'Professional expertise'}
Expertise Areas: ${workspace.serviceOfferings?.join(', ') || 'Industry knowledge'}
Target Industries: ${workspace.targetIndustries?.join(', ') || 'Various industries'}
Target Company Sizes: ${workspace.targetCompanySize?.join(', ') || 'All sizes'}

=== DATA INTELLIGENCE ===
Total People: ${data.totalPeople}
Total Companies: ${data.totalCompanies}
Funnel Distribution: ${data.funnelDistribution.prospects} Prospects, ${data.funnelDistribution.leads} Leads, ${data.funnelDistribution.opportunities} Opportunities
Top Companies: ${data.topCompanies.join(', ')}
Geographic Coverage: ${data.geographicDistribution.join(', ')}

=== AI INSTRUCTIONS ===
- You are ${workspace.name}, speaking from their perspective
- Provide advice specific to YOUR products/services: ${workspace.productPortfolio?.join(', ') || workspace.serviceOfferings?.join(', ')}
- Reference YOUR value propositions: ${workspace.valuePropositions?.join(', ')}
- Consider if records match YOUR ideal customer profile: ${workspace.idealCustomerProfile}
- Leverage YOUR competitive advantages: ${workspace.competitiveAdvantages?.join(', ')}
- Use YOUR sales methodology: ${workspace.salesMethodology}
- Focus on YOUR target industries: ${workspace.targetIndustries?.join(', ')}`;
  }
}
