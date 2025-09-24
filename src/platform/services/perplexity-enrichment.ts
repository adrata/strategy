/**
 * 🧠 PERPLEXITY AI ENRICHMENT SERVICE
 * 
 * Provides intelligent enrichment for missing data in person and company records
 * Uses Perplexity AI to generate strategic intelligence, pain points, and insights
 */

interface PerplexityEnrichmentOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface PersonEnrichmentData {
  situationAnalysis?: string;
  complications?: string;
  strategicIntelligence?: string;
  painPoints?: string[];
  goals?: string[];
  decisionFactors?: string[];
  engagementStrategy?: string;
  nextSteps?: string[];
}

interface CompanyEnrichmentData {
  situationAnalysis?: string;
  complications?: string;
  strategicIntelligence?: string;
  marketPosition?: string;
  competitiveAdvantages?: string[];
  challenges?: string[];
  opportunities?: string[];
  strategicRecommendations?: string[];
}

export class PerplexityEnrichmentService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(options: PerplexityEnrichmentOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'llama-3.1-sonar-large-128k-online';
    this.maxTokens = options.maxTokens || 4000;
    this.temperature = options.temperature || 0.7;
  }

  /**
   * Enrich person data with strategic intelligence
   */
  async enrichPerson(person: any, company?: any): Promise<PersonEnrichmentData> {
    try {
      const prompt = this.buildPersonPrompt(person, company);
      const response = await this.callPerplexityAPI(prompt);
      return this.parsePersonResponse(response);
    } catch (error) {
      console.error('❌ [PERPLEXITY PERSON ENRICHMENT] Error:', error);
      return {};
    }
  }

  /**
   * Enrich company data with strategic intelligence
   */
  async enrichCompany(company: any): Promise<CompanyEnrichmentData> {
    try {
      const prompt = this.buildCompanyPrompt(company);
      const response = await this.callPerplexityAPI(prompt);
      return this.parseCompanyResponse(response);
    } catch (error) {
      console.error('❌ [PERPLEXITY COMPANY ENRICHMENT] Error:', error);
      return {};
    }
  }

  /**
   * Build person enrichment prompt
   */
  private buildPersonPrompt(person: any, company?: any): string {
    const personName = person.fullName || person.name || 'Unknown';
    const jobTitle = person.jobTitle || person.title || 'Unknown Title';
    const companyName = company?.name || person.company || 'Unknown Company';
    const industry = company?.industry || person.industry || 'Unknown Industry';
    const buyerGroupRole = person.customFields?.buyerGroupRole || 'Stakeholder';
    const influenceLevel = person.customFields?.influenceLevel || 'Medium';
    
    return `You are a strategic sales intelligence analyst. Analyze this person and provide actionable insights for sales engagement.

PERSON PROFILE:
- Name: ${personName}
- Job Title: ${jobTitle}
- Company: ${companyName}
- Industry: ${industry}
- Buyer Group Role: ${buyerGroupRole}
- Influence Level: ${influenceLevel}

${company ? `
COMPANY CONTEXT:
- Industry: ${company.industry || 'Unknown'}
- Size: ${company.size || 'Unknown'}
- Website: ${company.website || 'Not available'}
- Description: ${company.description || 'Not available'}
` : ''}

Please provide a comprehensive analysis in the following JSON format:
{
  "situationAnalysis": "Brief analysis of their current professional situation and role",
  "complications": "Key challenges or pain points they likely face in their role",
  "strategicIntelligence": "Strategic insights about their decision-making influence and priorities",
  "painPoints": ["Specific pain point 1", "Specific pain point 2", "Specific pain point 3"],
  "goals": ["Likely professional goal 1", "Likely professional goal 2", "Likely professional goal 3"],
  "decisionFactors": ["Factor 1 they consider", "Factor 2 they consider", "Factor 3 they consider"],
  "engagementStrategy": "Recommended approach for engaging this person",
  "nextSteps": ["Specific action 1", "Specific action 2", "Specific action 3"]
}

Focus on actionable, specific insights that would help a salesperson engage effectively with this person.`;
  }

  /**
   * Build company enrichment prompt
   */
  private buildCompanyPrompt(company: any): string {
    const companyName = company.name || 'Unknown Company';
    const industry = company.industry || 'Unknown Industry';
    const size = company.size || 'Unknown Size';
    const website = company.website || 'Not available';
    const description = company.description || 'Not available';
    
    return `You are a strategic business intelligence analyst. Analyze this company and provide comprehensive market insights.

COMPANY PROFILE:
- Name: ${companyName}
- Industry: ${industry}
- Size: ${size}
- Website: ${website}
- Description: ${description}

Please provide a comprehensive analysis in the following JSON format:
{
  "situationAnalysis": "Current market position and business situation",
  "complications": "Key business challenges and market pressures",
  "strategicIntelligence": "Strategic insights about their business priorities and direction",
  "marketPosition": "Their position in the market relative to competitors",
  "competitiveAdvantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "challenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "strategicRecommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Focus on actionable business intelligence that would help understand this company's strategic position and opportunities.`;
  }

  /**
   * Call Perplexity API
   */
  private async callPerplexityAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse person enrichment response
   */
  private parsePersonResponse(response: string): PersonEnrichmentData {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        situationAnalysis: parsed.situationAnalysis || undefined,
        complications: parsed.complications || undefined,
        strategicIntelligence: parsed.strategicIntelligence || undefined,
        painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : undefined,
        goals: Array.isArray(parsed.goals) ? parsed.goals : undefined,
        decisionFactors: Array.isArray(parsed.decisionFactors) ? parsed.decisionFactors : undefined,
        engagementStrategy: parsed.engagementStrategy || undefined,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : undefined,
      };
    } catch (error) {
      console.error('❌ [PERPLEXITY PARSE] Error parsing person response:', error);
      return {};
    }
  }

  /**
   * Parse company enrichment response
   */
  private parseCompanyResponse(response: string): CompanyEnrichmentData {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        situationAnalysis: parsed.situationAnalysis || undefined,
        complications: parsed.complications || undefined,
        strategicIntelligence: parsed.strategicIntelligence || undefined,
        marketPosition: parsed.marketPosition || undefined,
        competitiveAdvantages: Array.isArray(parsed.competitiveAdvantages) ? parsed.competitiveAdvantages : undefined,
        challenges: Array.isArray(parsed.challenges) ? parsed.challenges : undefined,
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : undefined,
        strategicRecommendations: Array.isArray(parsed.strategicRecommendations) ? parsed.strategicRecommendations : undefined,
      };
    } catch (error) {
      console.error('❌ [PERPLEXITY PARSE] Error parsing company response:', error);
      return {};
    }
  }

  /**
   * Check if person needs enrichment
   */
  static needsPersonEnrichment(person: any): boolean {
    const customFields = person.customFields || {};
    return !customFields.situationAnalysis && 
           !customFields.complications && 
           !customFields.strategicIntelligence;
  }

  /**
   * Check if company needs enrichment
   */
  static needsCompanyEnrichment(company: any): boolean {
    const customFields = company.customFields || {};
    return !customFields.situationAnalysis && 
           !customFields.complications && 
           !customFields.strategicIntelligence;
  }
}

// Export singleton instance
export const perplexityEnrichment = new PerplexityEnrichmentService({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  model: 'llama-3.1-sonar-large-128k-online',
  maxTokens: 4000,
  temperature: 0.7
});
