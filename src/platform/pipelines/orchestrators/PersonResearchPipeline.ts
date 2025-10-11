/**
 * PERSON RESEARCH PIPELINE (Thin Orchestrator)
 * 
 * Coordinates person research workflow using pure functions
 * No business logic - just orchestration
 */

import {
  validatePersonInput,
  type PersonInput
} from '../functions/validation/validatePersonInput';
import { enrichPersonWithPDL } from '../functions/providers/pdl-service';
import {
  analyzePersonIntelligence,
  type PersonIntelligence,
  type AnalysisOptions
} from '../functions/analysis/analyzePersonIntelligence';
import type { EnrichedPerson } from '../functions/enrichment/enrichContacts';
import { createAIPersonIntelligence, type EnhancedPersonData, type CompanyContext } from '../functions/intelligence/ai-person-intelligence';
import { detectSalesIntent } from '../functions/providers/coresignal-jobs';

export interface PersonResearchRequest {
  name: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  analysisDepth?: AnalysisOptions;
}

export interface PersonResearchResult {
  success: boolean;
  data?: PersonIntelligence;
  
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
  
  metadata?: {
    analysisCompleted: string[];
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
export class PersonResearchPipeline {
  constructor(private apis: APIClients = {}) {}

  /**
   * Research a specific person
   * Pure orchestration - no business logic
   */
  async research(request: PersonResearchRequest): Promise<PersonResearchResult> {
    console.log(`\n🔍 [PERSON RESEARCH] Starting research...`);
    console.log(`   Person: ${request.name}`);
    console.log(`   Company: ${request.company || 'not specified'}`);

    const startTime = Date.now();

    try {
      // Step 1: Validate (pure function)
      const validated = validatePersonInput(request);

      // Step 2: Resolve person (fetch full profile)
      const person = await this.resolvePerson(validated);

      // Step 3: Analyze intelligence (pure function)
      const intelligence = await analyzePersonIntelligence(
        person,
        request.analysisDepth || {},
        this.apis
      );

      // Step 4: Add AI intelligence (NEW)
      let aiIntelligence;
      if (request.analysisDepth?.includeAI !== false) {
        console.log(`\n🤖 [AI INTELLIGENCE] Generating AI insights...`);
        try {
          aiIntelligence = await this.generateAIIntelligence(person, validated.company);
        } catch (error) {
          console.warn(`   ⚠️ AI intelligence failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      const executionTime = Date.now() - startTime;

      // Track which analyses were completed
      const analysisCompleted: string[] = [];
      if (intelligence.innovationProfile) analysisCompleted.push('innovationProfile');
      if (intelligence.painAwareness) analysisCompleted.push('painAwareness');
      if (intelligence.buyingAuthority) analysisCompleted.push('buyingAuthority');
      if (intelligence.influenceNetwork) analysisCompleted.push('influenceNetwork');
      if (intelligence.careerTrajectory) analysisCompleted.push('careerTrajectory');
      if (intelligence.riskProfile) analysisCompleted.push('riskProfile');
      if (aiIntelligence) analysisCompleted.push('aiIntelligence');

      console.log(`\n✅ [PERSON RESEARCH] Complete (${executionTime}ms)`);
      console.log(`   Analyses completed: ${analysisCompleted.length}/7`);
      if (aiIntelligence) {
        console.log(`   AI Intelligence confidence: ${aiIntelligence.confidence}%`);
      }

      return {
        success: true,
        data: intelligence,
        aiIntelligence,
        metadata: {
          analysisCompleted,
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(`\n❌ [PERSON RESEARCH] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          analysisCompleted: [],
          executionTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Resolve person (find full profile)
   * 
   * This orchestrates API calls to find the person
   * In production, would search CoreSignal, LinkedIn, etc.
   */
  private async resolvePerson(input: PersonInput): Promise<EnrichedPerson> {
    console.log(`  🔍 Resolving person profile...`);

    // Implement actual person resolution
    try {
      // 1. Try to enrich with PDL first
      const pdlResult = await enrichPersonWithPDL(input, this.apis);
      if (pdlResult && pdlResult.dataQuality > 50) {
        console.log(`   ✅ PDL enrichment successful (quality: ${pdlResult.dataQuality}%)`);
        return pdlResult;
      }
      
      // 2. Fallback to basic enrichment
      console.log(`   ⚠️ PDL enrichment failed, using basic profile`);
      return {
        name: input.name,
        title: input.title || 'Professional',
        company: input.company || 'Unknown Company',
        email: input.email,
        phone: input.phone,
        linkedIn: input.linkedinUrl,
        location: input.location || 'Unknown',
        industry: 'Unknown',
        seniorityLevel: 'Unknown',
        yearsAtCompany: 0,
        workHistory: [
          {
            company: input.company || 'Unknown Company',
            title: input.title || 'Professional',
            startDate: '2020-01-01',
            endDate: null,
            isCurrent: true,
            location: input.location || 'Unknown'
          }
        ],
        education: [],
        skills: [],
        certifications: [],
        socialProfiles: [],
        dataQuality: 25,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`   ❌ Person resolution error:`, error);
      throw new Error(`Failed to resolve person profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI intelligence for a person
   * 
   * NEW: Integrates Claude API for deep person insights
   */
  private async generateAIIntelligence(
    person: EnrichedPerson,
    companyName?: string
  ): Promise<any> {
    console.log(`  🤖 Generating AI intelligence for ${person.name}...`);

    // Get company context
    const companyContext: CompanyContext = {
      industry: 'Technology', // TODO: Get from company data
      companyStage: 'Growth', // TODO: Determine from hiring patterns
      salesIntentScore: 0 // TODO: Get from sales intent analysis
    };

    // Prepare person data for AI analysis
    const personData: EnhancedPersonData = {
      name: person.name,
      title: person.title,
      company: person.company,
      department: this.extractDepartment(person.title),
      seniorityLevel: this.determineSeniority(person.title),
      isDecisionMaker: this.isDecisionMaker(person.title),
      // Add more data as available from enrichment
    };

    // Get AI intelligence
    const aiIntelligence = await createAIPersonIntelligence(
      personData,
      companyContext,
      this.apis
    );

    console.log(`   ✅ AI intelligence generated (confidence: ${aiIntelligence.confidence}%)`);

    return {
      wants: aiIntelligence.wants,
      pains: aiIntelligence.pains,
      outreach: aiIntelligence.outreach,
      overallInsight: aiIntelligence.overallInsight,
      confidence: aiIntelligence.confidence
    };
  }

  /**
   * Extract department from job title
   * 
   * @param title - The job title to analyze
   * @returns The department name based on title keywords
   * 
   * @example
   * extractDepartment('Senior Software Engineer') // returns 'Engineering'
   * extractDepartment('VP of Sales') // returns 'Sales'
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
   * 
   * @param title - The job title to analyze
   * @returns The seniority level (C-Level, VP, Director, Manager, Individual Contributor)
   * 
   * @example
   * determineSeniority('CEO') // returns 'C-Level'
   * determineSeniority('Senior Software Engineer') // returns 'Individual Contributor'
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

  /**
   * Determine if person is likely a decision maker
   */
  private isDecisionMaker(title: string): boolean {
    const titleLower = title.toLowerCase();
    return titleLower.includes('ceo') || 
           titleLower.includes('president') ||
           titleLower.includes('cfo') || 
           titleLower.includes('cto') || 
           titleLower.includes('cmo') ||
           titleLower.includes('vp') ||
           titleLower.includes('director');
  }
}

