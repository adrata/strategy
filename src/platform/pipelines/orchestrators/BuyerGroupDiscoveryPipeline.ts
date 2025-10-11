/**
 * BUYER GROUP DISCOVERY PIPELINE (Thin Orchestrator)
 * 
 * Coordinates buyer group discovery workflow using pure functions
 * No business logic - just orchestration
 */

import {
  validateCompanyInput,
  type CompanyInput
} from '../functions/validation/validateCompanyInput';
import type { EnrichmentLevel } from '../functions/validation/validateRoleCriteria';
import { detectSalesIntent } from '../functions/providers/coresignal-jobs';
import { createAIPersonIntelligence, type EnhancedPersonData, type CompanyContext } from '../functions/intelligence/ai-person-intelligence';
import { getMultiSourceEmployeeProfiles } from '../functions/providers/coresignal-multisource';

export interface BuyerGroupInput {
  companyName: string;
  website?: string;
  enrichmentLevel?: EnrichmentLevel;
}

export interface BuyerGroupMember {
  name: string;
  title: string;
  role: 'decision_maker' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
  confidence: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  influenceScore?: number;
  
  // AI Intelligence (NEW)
  aiIntelligence?: {
    wants: {
      careerAspirations: string[];
      professionalGoals: string[];
      motivations: string[];
      opportunitiesOfInterest: string[];
      confidence: number;
    };
    pains: {
      currentChallenges: string[];
      frustrations: string[];
      pressurePoints: string[];
      obstacles: string[];
      urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
      confidence: number;
    };
    outreach: {
      bestApproach: string;
      valuePropositions: string[];
      conversationStarters: string[];
      personalizedMessage: string;
    };
    overallInsight: string;
    confidence: number;
  };
}

export interface BuyerGroupResult {
  success: boolean;
  companyName?: string;
  members?: BuyerGroupMember[];
  
  // Sales Intent Analysis (NEW)
  salesIntent?: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'critical';
    signals: string[];
    hiringActivity: {
      totalJobs: number;
      salesRoles: number;
      engineeringRoles: number;
      leadershipRoles: number;
    };
    growthIndicators: string[];
  };
  
  metadata?: {
    totalMembers: number;
    averageConfidence: number;
    enrichmentLevel: EnrichmentLevel;
    executionTime: number;
    timestamp: string;
  };
  error?: string;
}

import type { APIClients } from '../functions/types/api-clients';

/**
 * THIN ORCHESTRATOR
 * Just coordinates - all logic in pure functions
 */
export class BuyerGroupDiscoveryPipeline {
  constructor(private apis: APIClients = {}) {}

  /**
   * Discover buyer group for a company
   * Pure orchestration - no business logic
   */
  async discover(input: BuyerGroupInput): Promise<BuyerGroupResult> {
    console.log(`\n👥 [BUYER GROUP DISCOVERY] Starting discovery...`);
    console.log(`   Company: ${input.companyName}`);
    console.log(`   Enrichment: ${input.enrichmentLevel || 'discover'}`);

    const startTime = Date.now();

    try {
      // Step 1: Validate (pure function)
      const validated = validateCompanyInput(input);

      // Step 2: Detect sales intent (NEW)
      console.log(`\n🎯 [SALES INTENT] Analyzing sales intent...`);
      const salesIntent = await detectSalesIntent(validated.companyName, this.apis);
      console.log(`   Sales Intent Score: ${salesIntent.score}/100 (${salesIntent.level})`);

      // Step 3: Discover buyer group members
      const members = await this.discoverMembers(
        validated.companyName,
        input.enrichmentLevel || 'discover'
      );

      // Step 4: Add AI intelligence to key members (NEW)
      if (input.enrichmentLevel === 'research' && members.length > 0) {
        console.log(`\n🤖 [AI INTELLIGENCE] Adding AI insights to key members...`);
        const enhancedMembers = await this.addAIIntelligence(members, validated.companyName, salesIntent);
        members.splice(0, members.length, ...enhancedMembers);
      }

      // Step 5: Calculate metadata (pure calculations)
      const totalMembers = members.length;
      const averageConfidence =
        totalMembers > 0
          ? Math.round(
              members.reduce((sum, m) => sum + m.confidence, 0) / totalMembers
            )
          : 0;

      const executionTime = Date.now() - startTime;

      console.log(`\n✅ [BUYER GROUP DISCOVERY] Complete (${executionTime}ms)`);
      console.log(`   Members found: ${totalMembers}`);
      console.log(`   Average confidence: ${averageConfidence}%`);
      console.log(`   Sales intent: ${salesIntent.score}/100 (${salesIntent.level})`);

      return {
        success: true,
        companyName: validated.companyName,
        members,
        salesIntent,
        metadata: {
          totalMembers,
          averageConfidence,
          enrichmentLevel: input.enrichmentLevel || 'discover',
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(`\n❌ [BUYER GROUP DISCOVERY] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          totalMembers: 0,
          averageConfidence: 0,
          enrichmentLevel: 'discover',
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Discover buyer group members
   * 
   * TODO: Extract this into pure functions in the functions library
   */
  private async discoverMembers(
    companyName: string,
    enrichmentLevel: EnrichmentLevel
  ): Promise<BuyerGroupMember[]> {
    console.log(`  👥 Discovering buyer group members...`);

    // TODO: Integrate with actual buyer group discovery logic
    // This should use the existing buyer group modules

    // Mock data for now
    const mockMembers: BuyerGroupMember[] = [
      {
        name: 'John Doe',
        title: 'CFO',
        role: 'decision_maker',
        confidence: 95,
        email: enrichmentLevel !== 'discover' ? 'john.doe@company.com' : undefined,
        phone: enrichmentLevel !== 'discover' ? '+1-555-0100' : undefined,
        linkedin: enrichmentLevel !== 'discover' ? 'https://linkedin.com/in/johndoe' : undefined,
        influenceScore: 85
      },
      {
        name: 'Jane Smith',
        title: 'VP Sales',
        role: 'champion',
        confidence: 88,
        email: enrichmentLevel !== 'discover' ? 'jane.smith@company.com' : undefined,
        phone: enrichmentLevel !== 'discover' ? '+1-555-0101' : undefined,
        linkedin: enrichmentLevel !== 'discover' ? 'https://linkedin.com/in/janesmith' : undefined,
        influenceScore: 75
      }
    ];

    return mockMembers;
  }

  /**
   * Add AI intelligence to buyer group members
   * 
   * NEW: Integrates Claude API for deep person insights
   */
  private async addAIIntelligence(
    members: BuyerGroupMember[],
    companyName: string,
    salesIntent: any
  ): Promise<BuyerGroupMember[]> {
    console.log(`  🤖 Adding AI intelligence to ${members.length} members...`);

    // Get company context for AI analysis
    const companyContext: CompanyContext = {
      industry: 'Technology', // TODO: Get from company data
      companyStage: 'Growth', // TODO: Determine from hiring patterns
      growthSignals: salesIntent.growthIndicators,
      salesIntentScore: salesIntent.score,
      hiringPatterns: salesIntent.hiringActivity
    };

    // Add AI intelligence to key members (decision makers and champions)
    const keyMembers = members.filter(m => 
      m.role === 'decision_maker' || m.role === 'champion'
    );

    const enhancedMembers = await Promise.all(
      members.map(async (member) => {
        if (keyMembers.includes(member)) {
          try {
            // Prepare person data for AI analysis
            const personData: EnhancedPersonData = {
              name: member.name,
              title: member.title,
              company: companyName,
              department: this.extractDepartment(member.title),
              seniorityLevel: this.determineSeniority(member.title),
              isDecisionMaker: member.role === 'decision_maker',
              // Add more data as available
            };

            // Get AI intelligence
            const aiIntelligence = await createAIPersonIntelligence(
              personData,
              companyContext,
              this.apis
            );

            return {
              ...member,
              aiIntelligence: {
                wants: aiIntelligence.wants,
                pains: aiIntelligence.pains,
                outreach: aiIntelligence.outreach,
                overallInsight: aiIntelligence.overallInsight,
                confidence: aiIntelligence.confidence
              }
            };
          } catch (error) {
            console.warn(`   ⚠️ AI intelligence failed for ${member.name}:`, error instanceof Error ? error.message : 'Unknown error');
            return member; // Return without AI intelligence
          }
        }
        return member; // Return unchanged for non-key members
      })
    );

    console.log(`   ✅ AI intelligence added to ${keyMembers.length} key members`);
    return enhancedMembers;
  }

  /**
   * Extract department from job title
   */
  private extractDepartment(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('sales') || titleLower.includes('revenue')) return 'Sales';
    if (titleLower.includes('marketing')) return 'Marketing';
    if (titleLower.includes('engineering') || titleLower.includes('tech')) return 'Engineering';
    if (titleLower.includes('finance') || titleLower.includes('cfo')) return 'Finance';
    if (titleLower.includes('hr') || titleLower.includes('people')) return 'Human Resources';
    if (titleLower.includes('operations') || titleLower.includes('ops')) return 'Operations';
    return 'General';
  }

  /**
   * Determine seniority level from job title
   */
  private determineSeniority(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('president')) return 'C-Level';
    if (titleLower.includes('cfo') || titleLower.includes('cto') || titleLower.includes('cmo')) return 'C-Level';
    if (titleLower.includes('vp') || titleLower.includes('vice president')) return 'VP';
    if (titleLower.includes('director')) return 'Director';
    if (titleLower.includes('manager')) return 'Manager';
    if (titleLower.includes('senior') || titleLower.includes('sr')) return 'Senior';
    return 'Individual Contributor';
  }
}

