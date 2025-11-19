/**
 * 🏢 ENHANCED WORKSPACE CONTEXT SERVICE
 * 
 * Service to build comprehensive workspace and company context for AI
 * Specifically enhanced for TOP Engineering Plus and other enriched workspaces
 */

import { getPrismaClient } from '@/platform/database/connection-pool';

// Cache for workspace context (5 minute TTL)
interface CachedContext {
  context: WorkspaceContext;
  timestamp: number;
}

const workspaceContextCache = new Map<string, CachedContext>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
   * Uses caching to avoid repeated database queries (5 minute TTL)
   */
  static async buildWorkspaceContext(workspaceId: string): Promise<WorkspaceContext | null> {
    // Check cache first
    const cached = workspaceContextCache.get(workspaceId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [EnhancedWorkspaceContextService] Using cached workspace context');
      }
      return cached.context;
    }

    try {
      const prisma = getPrismaClient();
      
      // 🏆 FIX: Add individual timeouts to prevent any single query from hanging
      // OPTIMIZATION: Parallelize workspace and company queries (they're independent) with timeout protection
      const queryTimeout = 10000; // 10 seconds max per query
      
      const createTimeoutPromise = (ms: number) => 
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms));
      
      const [workspace, company] = await Promise.all([
        Promise.race([
          prisma.workspaces.findUnique({
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
          }),
          createTimeoutPromise(queryTimeout)
        ]).catch(() => null), // Fallback to null on timeout
        Promise.race([
          prisma.companies.findFirst({
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
          }),
          createTimeoutPromise(queryTimeout)
        ]).catch(() => null) // Fallback to null on timeout
      ]);

      if (!workspace) {
        return null;
      }

      // 🏆 FIX: Add individual timeouts to prevent any single query from hanging
      // OPTIMIZATION: Parallelize all data statistics queries with timeout protection
      const queryTimeout = 10000; // 10 seconds max per query
      
      const createTimeoutPromise = (ms: number) => 
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms));
      
      const [peopleCount, companiesCount, peopleData, companiesData] = await Promise.all([
        Promise.race([
          prisma.people.count({ where: { workspaceId } }),
          createTimeoutPromise(queryTimeout)
        ]).catch(() => 0), // Fallback to 0 on timeout
        Promise.race([
          prisma.companies.count({ where: { workspaceId } }),
          createTimeoutPromise(queryTimeout)
        ]).catch(() => 0), // Fallback to 0 on timeout
        Promise.race([
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
          createTimeoutPromise(queryTimeout)
        ]).catch(() => []), // Fallback to empty array on timeout
        Promise.race([
          prisma.companies.findMany({
            where: { workspaceId },
            select: { name: true },
            take: 20
          }),
          createTimeoutPromise(queryTimeout)
        ]).catch(() => []) // Fallback to empty array on timeout
      ]);

      // Analyze funnel distribution from tags
      const funnelDistribution = this.analyzeFunnelDistribution(peopleData);
      
      // Get top companies
      const topCompanies = companiesData.map(c => c.name).slice(0, 10);
      
      // Get geographic distribution
      const geographicDistribution = this.analyzeGeographicDistribution(peopleData);

      // Parse JSON arrays if they're stored as strings (handle both formats)
      const parseArrayField = (field: any): string[] => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            // If not JSON, treat as single value
            return [field];
          }
        }
        return [];
      };

      const context: WorkspaceContext = {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          industry: workspace.industry || company?.industry,
          businessModel: workspace.businessModel,
          serviceOfferings: parseArrayField(workspace.serviceOfferings),
          productPortfolio: parseArrayField(workspace.productPortfolio),
          valuePropositions: parseArrayField(workspace.valuePropositions),
          targetIndustries: parseArrayField(workspace.targetIndustries),
          targetCompanySize: parseArrayField(workspace.targetCompanySize),
          idealCustomerProfile: workspace.idealCustomerProfile,
          competitiveAdvantages: parseArrayField(workspace.competitiveAdvantages),
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

      // Cache the context for 5 minutes
      workspaceContextCache.set(workspaceId, {
        context,
        timestamp: Date.now()
      });

      return context;
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

    // Build comprehensive seller/company profile
    const productsServices = workspace.productPortfolio?.join(', ') || workspace.serviceOfferings?.join(', ') || 'Professional Services';
    const valueProps = workspace.valuePropositions?.join(', ') || 'Quality service delivery';
    const targetIndustries = workspace.targetIndustries?.join(', ') || 'Various industries';
    const targetSizes = workspace.targetCompanySize?.join(', ') || 'All sizes';
    const competitiveAdvantages = workspace.competitiveAdvantages?.join(', ') || 'Professional expertise and service quality';
    const salesMethodology = workspace.salesMethodology || 'Consultative approach focused on client needs';
    const idealCustomer = workspace.idealCustomerProfile || 'Businesses and organizations needing professional services';

    // Build comprehensive seller profile - ensure all critical info is included
    const companyName = workspace.name || 'The Company';
    const companyIndustry = workspace.industry || company.industry || 'Professional Services';
    const companyDescription = company.description || workspace.description || `${companyName} is a ${companyIndustry} company`;
    
    return `=== SELLER/COMPANY PROFILE (WHO YOU ARE HELPING) ===
Company Name: ${companyName}
Industry: ${companyIndustry}
Business Model: ${workspace.businessModel || 'Professional Services'}
Company Description: ${companyDescription}

WHAT THEY SELL:
${productsServices}

VALUE PROPOSITIONS:
${valueProps}

IDEAL CUSTOMER PROFILE:
${idealCustomer}

TARGET MARKET:
- Industries: ${targetIndustries}
- Company Sizes: ${targetSizes}

COMPETITIVE ADVANTAGES:
${competitiveAdvantages}

SALES METHODOLOGY:
${salesMethodology}

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

=== CRITICAL AI INSTRUCTIONS ===
- You are helping ${workspace.name} sell their products/services: ${productsServices}
- Frame all advice from ${workspace.name}'s perspective as the seller
- Reference their value propositions (${valueProps}) when crafting messages
- Assess if prospects match their ideal customer profile: ${idealCustomer}
- Leverage their competitive advantages: ${competitiveAdvantages}
- Use their sales methodology: ${salesMethodology}
- Focus on their target industries: ${targetIndustries}
- When recommending outreach, tailor it to what ${workspace.name} is selling
- When analyzing prospects, consider fit with ${workspace.name}'s target market
- Always keep in mind: ${workspace.name} sells ${productsServices} to ${idealCustomer}`;
  }
}
