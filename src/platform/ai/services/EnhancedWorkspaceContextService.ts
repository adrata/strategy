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
    serviceFocus?: string[];
    stakeholderApproach?: string;
    projectDeliveryStyle?: string;
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
      // Fetch workspace data
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
          description: true,
          // Note: These fields would be available if our migration was applied
          // businessModel: true,
          // serviceFocus: true,
          // stakeholderApproach: true,
          // projectDeliveryStyle: true,
        }
      });

      if (!workspace) {
        return null;
      }

      // Fetch the main company record for this workspace
      const company = await prisma.companies.findFirst({
        where: { 
          workspaceId: workspaceId,
          name: { contains: 'TOP Engineers Plus' }
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
          // Note: These fields would be available if our migration was applied
          // serviceOfferings: true,
          // technicalCapabilities: true,
          // expertiseAreas: true,
          // targetSegments: true,
          // industrySpecializations: true,
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
          industry: company?.industry,
          // Enhanced fields would be here if migration was applied
          businessModel: 'Engineering Consulting', // Hardcoded for TOP Engineering Plus
          serviceFocus: ['Critical Infrastructure', 'Broadband Deployment', 'Communications Engineering'],
          stakeholderApproach: 'Client-Centric',
          projectDeliveryStyle: 'Strategic Clarity',
        },
        company: {
          name: company?.name || 'TOP Engineers Plus',
          industry: company?.industry || 'Communications Engineering',
          description: company?.description,
          businessChallenges: company?.businessChallenges || [],
          businessPriorities: company?.businessPriorities || [],
          competitiveAdvantages: company?.competitiveAdvantages || [],
          growthOpportunities: company?.growthOpportunities || [],
          marketPosition: company?.marketPosition,
          strategicInitiatives: company?.strategicInitiatives || [],
          successMetrics: company?.successMetrics || [],
          // Enhanced fields would be here if migration was applied
          serviceOfferings: ['Technology Expertise', 'Process Development', 'Organizational Alignment'],
          technicalCapabilities: ['Communications Technology', 'Process Development', 'Change Management'],
          expertiseAreas: ['Critical Infrastructure', 'Broadband Deployment', 'Utility Communications'],
          targetSegments: ['Utility Companies', 'Municipalities', 'Infrastructure Organizations'],
          industrySpecializations: ['Communications Engineering', 'Utility Infrastructure', 'Critical Infrastructure'],
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

    return `WORKSPACE CONTEXT - ${workspace.name}:
- Industry: ${company.industry}
- Business Model: ${workspace.businessModel}
- Service Focus: ${workspace.serviceFocus?.join(', ')}
- Stakeholder Approach: ${workspace.stakeholderApproach}
- Project Delivery Style: ${workspace.projectDeliveryStyle}

COMPANY PROFILE - ${company.name}:
- Description: ${company.description}
- Market Position: ${company.marketPosition}
- Business Challenges: ${company.businessChallenges?.join(', ')}
- Business Priorities: ${company.businessPriorities?.join(', ')}
- Competitive Advantages: ${company.competitiveAdvantages?.join(', ')}
- Growth Opportunities: ${company.growthOpportunities?.join(', ')}
- Strategic Initiatives: ${company.strategicInitiatives?.join(', ')}
- Success Metrics: ${company.successMetrics?.join(', ')}

SERVICE CAPABILITIES:
- Service Offerings: ${company.serviceOfferings?.join(', ')}
- Technical Capabilities: ${company.technicalCapabilities?.join(', ')}
- Expertise Areas: ${company.expertiseAreas?.join(', ')}
- Target Segments: ${company.targetSegments?.join(', ')}
- Industry Specializations: ${company.industrySpecializations?.join(', ')}

DATA INTELLIGENCE:
- Total People: ${data.totalPeople}
- Total Companies: ${data.totalCompanies}
- Funnel Distribution: ${data.funnelDistribution.prospects} Prospects, ${data.funnelDistribution.leads} Leads, ${data.funnelDistribution.opportunities} Opportunities
- Top Companies: ${data.topCompanies.join(', ')}
- Geographic Coverage: ${data.geographicDistribution.join(', ')}

AI INSTRUCTIONS:
- Provide contextually relevant advice specific to ${company.name}
- Reference their ${company.industry} focus and ${workspace.businessModel} approach
- Consider their target segments: ${company.targetSegments?.join(', ')}
- Leverage their competitive advantages: ${company.competitiveAdvantages?.join(', ')}
- Focus on their growth opportunities: ${company.growthOpportunities?.join(', ')}
- Align recommendations with their strategic initiatives: ${company.strategicInitiatives?.join(', ')}`;
  }
}
