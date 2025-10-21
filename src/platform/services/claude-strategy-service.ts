/**
 * Claude AI Strategy Service
 * Handles AI-powered strategy generation using Claude AI via OpenRouter
 */

export interface ClaudeStrategyRequest {
  companyName: string;
  companyIndustry: string;
  targetIndustry: string;
  companySize: number;
  companyRevenue: number;
  companyAge: number;
  growthStage: string;
  marketPosition: string;
  archetypeName: string;
  archetypeDescription: string;
  // Additional real company data for better intelligence
  website?: string;
  headquarters?: string;
  foundedYear?: number;
  isPublic?: boolean;
  sector?: string;
  description?: string;
  linkedinFollowers?: number;
  globalRank?: number;
  competitors?: string[];
  lastAction?: string;
  nextAction?: string;
  opportunityStage?: string;
  opportunityAmount?: number;
}

export interface ClaudeStrategyResponse {
  strategySummary: string;
  situation: string;
  complication: string;
  futureState: string;
  strategicRecommendations: string[];
  competitivePositioning: string;
  successMetrics: string[];
}

export interface ClaudeApiResponse {
  success: boolean;
  data?: ClaudeStrategyResponse;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ClaudeStrategyService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.CLAUDE_API_KEY || '';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = process.env.CLAUDE_MODEL || 'anthropic/claude-3-sonnet';
    
    if (!this.apiKey) {
      console.warn('⚠️ [CLAUDE SERVICE] No API key found. Claude AI features will be disabled.');
    }
  }

  async generateCompanyStrategy(request: ClaudeStrategyRequest): Promise<ClaudeApiResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Claude AI API key not configured'
      };
    }

    try {
      const prompt = this.buildStrategyPrompt(request);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Adrata Strategy Generation'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response from Claude API');
      }

      const content = data.choices[0].message.content;
      const parsedStrategy = this.parseStrategyResponse(content);
      
      return {
        success: true,
        data: parsedStrategy,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      console.error('❌ [CLAUDE SERVICE] Error generating strategy:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate strategy'
      };
    }
  }

  private buildStrategyPrompt(request: ClaudeStrategyRequest): string {
    // Build comprehensive company profile using real data
    const companyProfile = [
      `COMPANY PROFILE:`,
      `- Name: ${request.companyName}`,
      `- Industry: ${request.companyIndustry}`,
      `- Target Industry: ${request.targetIndustry} (the industry they serve/sell to)`,
      `- Size: ${request.companySize} employees`,
      `- Revenue: $${request.companyRevenue.toLocaleString()}`,
      `- Founded: ${request.companyAge} years ago (${request.foundedYear || 'Unknown year'})`,
      `- Growth Stage: ${request.growthStage}`,
      `- Market Position: ${request.marketPosition}`,
      request.website ? `- Website: ${request.website}` : '',
      request.headquarters ? `- Headquarters: ${request.headquarters}` : '',
      request.isPublic !== undefined ? `- Company Type: ${request.isPublic ? 'Public' : 'Private'}` : '',
      request.sector ? `- Sector: ${request.sector}` : '',
      request.globalRank ? `- Global Rank: #${request.globalRank}` : '',
      request.linkedinFollowers ? `- LinkedIn Followers: ${request.linkedinFollowers.toLocaleString()}` : '',
      request.competitors && request.competitors.length > 0 ? `- Key Competitors: ${request.competitors.join(', ')}` : '',
      request.opportunityStage ? `- Opportunity Stage: ${request.opportunityStage}` : '',
      request.opportunityAmount ? `- Opportunity Value: $${request.opportunityAmount.toLocaleString()}` : '',
      request.lastAction ? `- Last Action: ${request.lastAction}` : '',
      request.nextAction ? `- Next Action: ${request.nextAction}` : '',
      request.description ? `- Company Description: ${request.description}` : ''
    ].filter(line => line.trim()).join('\n');

    return `You are a strategic business advisor with deep expertise in ${request.targetIndustry}. Generate a comprehensive strategy summary for a company with the following profile:

${companyProfile}

COMPANY ARCHETYPE: ${request.archetypeName}
Archetype Description: ${request.archetypeDescription}

TASK: Generate a strategic analysis using the Situation-Complication-Future State framework, specifically personalized for a company serving ${request.targetIndustry}. Use the real company data above to inform your analysis.

REQUIREMENTS:
1. SITUATION: Describe their current business position, strengths, and market context. Personalize for their target industry (${request.targetIndustry}). Use their actual company data (size, revenue, age, market position) to paint an accurate picture. Include specific industry terminology, challenges, and opportunities.

2. COMPLICATION: Identify key challenges, pain points, and strategic obstacles they face. Consider both internal challenges and external market dynamics specific to serving ${request.targetIndustry}. Be specific about industry regulations, competitive pressures, and market trends. Reference their actual company characteristics (size, growth stage, market position) to identify realistic complications.

3. FUTURE STATE: Paint a vision of success if they overcome complications. Describe tangible outcomes and competitive advantages specific to the ${request.targetIndustry} market. Include specific metrics, market positions, and strategic outcomes. Make it realistic based on their current company profile.

4. STRATEGIC RECOMMENDATIONS: Provide 3-5 actionable strategic recommendations tailored to their archetype, target industry, and actual company characteristics.

5. COMPETITIVE POSITIONING: Describe how they should position themselves in the ${request.targetIndustry} market based on their real company profile.

6. SUCCESS METRICS: List 3-5 key performance indicators they should track, relevant to their company size and target industry.

FORMAT YOUR RESPONSE AS JSON:
{
  "strategySummary": "2-3 paragraph executive summary of their strategic position based on real company data",
  "situation": "2-3 paragraphs describing current situation using actual company characteristics, personalized for ${request.targetIndustry}",
  "complication": "2-3 paragraphs describing key challenges specific to their company profile and serving ${request.targetIndustry}",
  "futureState": "2-3 paragraphs describing vision of success in ${request.targetIndustry} based on their real capabilities",
  "strategicRecommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "competitivePositioning": "1-2 paragraphs on competitive positioning in ${request.targetIndustry}",
  "successMetrics": ["Metric 1", "Metric 2", "Metric 3"]
}

Be specific, actionable, and deeply personalized for a company serving ${request.targetIndustry}. Use their actual company data to make the analysis realistic and relevant. Reference real market dynamics and industry-specific terminology.`;
  }

  private parseStrategyResponse(content: string): ClaudeStrategyResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // Validate required fields
        if (parsed.strategySummary && parsed.situation && parsed.complication && parsed.futureState) {
          return {
            strategySummary: parsed.strategySummary,
            situation: parsed.situation,
            complication: parsed.complication,
            futureState: parsed.futureState,
            strategicRecommendations: parsed.strategicRecommendations || [],
            competitivePositioning: parsed.competitivePositioning || '',
            successMetrics: parsed.successMetrics || []
          };
        }
      }
      
      // Fallback: parse from structured text
      return this.parseStructuredText(content);
      
    } catch (error) {
      console.error('❌ [CLAUDE SERVICE] Error parsing strategy response:', error);
      return this.parseStructuredText(content);
    }
  }

  private parseStructuredText(content: string): ClaudeStrategyResponse {
    // Fallback parser for non-JSON responses
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const strategySummary = this.extractSection(content, 'strategySummary', 'Strategy Summary');
    const situation = this.extractSection(content, 'situation', 'Situation');
    const complication = this.extractSection(content, 'complication', 'Complication');
    const futureState = this.extractSection(content, 'futureState', 'Future State');
    
    return {
      strategySummary: strategySummary || 'Strategic analysis generated successfully.',
      situation: situation || 'Current business position analysis.',
      complication: complication || 'Key challenges and obstacles identified.',
      futureState: futureState || 'Vision of future success outlined.',
      strategicRecommendations: this.extractList(content, 'recommendations', 'Recommendations'),
      competitivePositioning: this.extractSection(content, 'positioning', 'Competitive Positioning') || '',
      successMetrics: this.extractList(content, 'metrics', 'Success Metrics')
    };
  }

  private extractSection(content: string, key: string, title: string): string {
    const patterns = [
      new RegExp(`"${key}":\\s*"([^"]*)"`, 'i'),
      new RegExp(`${title}:\\s*([^\\n]+(?:\\n(?!\\n)[^\\n]+)*)`, 'i'),
      new RegExp(`${title}\\s*([^\\n]+(?:\\n(?!\\n)[^\\n]+)*)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private extractList(content: string, key: string, title: string): string[] {
    const patterns = [
      new RegExp(`"${key}":\\s*\\[([^\\]]*)\\]`, 'i'),
      new RegExp(`${title}:\\s*([^\\n]+(?:\\n[^\\n]+)*)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const listStr = match[1];
        // Try to parse as JSON array first
        try {
          const parsed = JSON.parse(`[${listStr}]`);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => typeof item === 'string');
          }
        } catch {
          // Fallback to text parsing
          return listStr.split(/[,\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
      }
    }
    
    return [];
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ [CLAUDE SERVICE] Connection test failed:', error);
      return false;
    }
  }
}

export const claudeStrategyService = new ClaudeStrategyService();
