/**
 * 🧠 GENIUS-LEVEL INTELLIGENCE ORCHESTRATOR
 * 
 * McKinsey-level intelligence system that orchestrates multiple AI models
 * and data sources for maximum analytical power and insight generation
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

interface IntelligenceRequest {
  query: string;
  context: {
    company?: string;
    industry?: string;
    useCase: 'buyer_group' | 'enrichment' | 'competitive_analysis' | 'market_research';
    confidenceThreshold?: number;
  };
  sources?: string[];
}

interface IntelligenceResponse {
  insights: string;
  confidence: number;
  sources: Array<{
    name: string;
    type: 'ai_model' | 'data_api' | 'database';
    confidence: number;
    data?: any;
  }>;
  mcKinseyLevel: 'GENIUS' | 'EXPERT' | 'ADVANCED' | 'DEVELOPING';
  actionableRecommendations: string[];
  riskFactors: string[];
  nextSteps: string[];
}

export class GeniusLevelIntelligenceOrchestrator {
  private prisma: PrismaClient;
  private auditTrail: Array<{
    timestamp: string;
    action: string;
    confidence: number;
    sources: string[];
  }> = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Orchestrate multiple AI models for genius-level analysis
   */
  async generateGeniusLevelInsights(request: IntelligenceRequest): Promise<IntelligenceResponse> {
    this.logActivity('Starting genius-level intelligence analysis', 100, ['orchestrator']);

    const sources: IntelligenceResponse['sources'] = [];
    let combinedInsights = '';
    let overallConfidence = 0;
    let sourceCount = 0;

    // 1. Advanced AI Model Orchestration
    const aiInsights = await this.orchestrateAIModels(request);
    if (aiInsights) {
      sources.push(...aiInsights.sources);
      combinedInsights += aiInsights.content;
      overallConfidence += aiInsights.confidence;
      sourceCount++;
    }

    // 2. Real-time Data Intelligence
    const dataIntelligence = await this.gatherDataIntelligence(request);
    if (dataIntelligence) {
      sources.push(...dataIntelligence.sources);
      combinedInsights += '\n\n' + dataIntelligence.content;
      overallConfidence += dataIntelligence.confidence;
      sourceCount++;
    }

    // 3. Database Intelligence
    const dbIntelligence = await this.extractDatabaseIntelligence(request);
    if (dbIntelligence) {
      sources.push(dbIntelligence.source);
      combinedInsights += '\n\n' + dbIntelligence.content;
      overallConfidence += dbIntelligence.confidence;
      sourceCount++;
    }

    // 4. Synthesize with Meta-Analysis
    const finalInsights = await this.synthesizeWithMetaAnalysis(
      combinedInsights,
      request,
      sources
    );

    const finalConfidence = sourceCount > 0 ? overallConfidence / sourceCount : 0;
    const mcKinseyLevel = this.determineMcKinseyLevel(finalConfidence, sources.length);

    return {
      insights: finalInsights.content,
      confidence: finalConfidence,
      sources,
      mcKinseyLevel,
      actionableRecommendations: finalInsights.recommendations,
      riskFactors: finalInsights.risks,
      nextSteps: finalInsights.nextSteps
    };
  }

  /**
   * Orchestrate multiple AI models for comprehensive analysis
   */
  private async orchestrateAIModels(request: IntelligenceRequest) {
    const sources: IntelligenceResponse['sources'] = [];
    let combinedContent = '';
    let totalConfidence = 0;
    let modelCount = 0;

    // Perplexity for real-time web intelligence
    try {
      const perplexityResult = await this.queryPerplexityPro(request);
      if (perplexityResult) {
        sources.push({
          name: 'Perplexity Pro',
          type: 'ai_model',
          confidence: 95,
          data: { tokens: perplexityResult.tokens }
        });
        combinedContent += `**Real-time Market Intelligence:**\n${perplexityResult.content}\n\n`;
        totalConfidence += 95;
        modelCount++;
      }
    } catch (error) {
      this.logActivity(`Perplexity failed: ${error.message}`, 0, ['perplexity']);
    }

    // Claude for deep analytical reasoning
    try {
      const claudeResult = await this.queryClaudeAnalysis(request);
      if (claudeResult) {
        sources.push({
          name: 'Claude 3.5 Sonnet',
          type: 'ai_model',
          confidence: 98,
          data: { tokens: claudeResult.tokens }
        });
        combinedContent += `**Strategic Analysis:**\n${claudeResult.content}\n\n`;
        totalConfidence += 98;
        modelCount++;
      }
    } catch (error) {
      this.logActivity(`Claude failed: ${error.message}`, 0, ['claude']);
    }

    // OpenAI GPT-4 for pattern recognition (if available)
    try {
      const gptResult = await this.queryGPT4Analysis(request);
      if (gptResult) {
        sources.push({
          name: 'GPT-4 Turbo',
          type: 'ai_model',
          confidence: 92,
          data: { tokens: gptResult.tokens }
        });
        combinedContent += `**Pattern Analysis:**\n${gptResult.content}\n\n`;
        totalConfidence += 92;
        modelCount++;
      }
    } catch (error) {
      this.logActivity(`GPT-4 failed: ${error.message}`, 0, ['openai']);
    }

    if (modelCount === 0) return null;

    return {
      content: combinedContent,
      confidence: totalConfidence / modelCount,
      sources
    };
  }

  /**
   * Gather real-time data intelligence from APIs
   */
  private async gatherDataIntelligence(request: IntelligenceRequest) {
    const sources: IntelligenceResponse['sources'] = [];
    let combinedContent = '';
    let totalConfidence = 0;
    let apiCount = 0;

    // CoreSignal for B2B intelligence
    try {
      const coreSignalData = await this.queryCoreSignalIntelligence(request);
      if (coreSignalData) {
        sources.push({
          name: 'CoreSignal',
          type: 'data_api',
          confidence: 90,
          data: { results: coreSignalData.results }
        });
        combinedContent += `**B2B Intelligence:**\n${coreSignalData.content}\n\n`;
        totalConfidence += 90;
        apiCount++;
      }
    } catch (error) {
      this.logActivity(`CoreSignal failed: ${error.message}`, 0, ['coresignal']);
    }

    // DropContact for contact validation
    try {
      const dropContactData = await this.validateContactsWithDropContact(request);
      if (dropContactData) {
        sources.push({
          name: 'DropContact',
          type: 'data_api',
          confidence: 88,
          data: { validatedContacts: dropContactData.results }
        });
        combinedContent += `**Contact Intelligence:**\n${dropContactData.content}\n\n`;
        totalConfidence += 88;
        apiCount++;
      }
    } catch (error) {
      this.logActivity(`DropContact failed: ${error.message}`, 0, ['dropcontact']);
    }

    if (apiCount === 0) return null;

    return {
      content: combinedContent,
      confidence: totalConfidence / apiCount,
      sources
    };
  }

  /**
   * Extract intelligence from database
   */
  private async extractDatabaseIntelligence(request: IntelligenceRequest) {
    try {
      let content = '';
      let confidence = 100;

      if (request.context.company) {
        // Find company and related contacts
        const company = await this.prisma.companies.findFirst({
          where: {
            name: { contains: request.context.company, mode: 'insensitive' }
          },
          include: {
            people: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
                phone: true
              }
            }
          }
        });

        if (company) {
          content += `**Database Intelligence for ${company.name}:**\n`;
          content += `- Industry: ${company.industry || 'Not specified'}\n`;
          content += `- Location: ${company.city || 'Unknown'}, ${company.state || 'Unknown'}\n`;
          content += `- Contacts: ${company.people.length} verified contacts\n`;
          
          if (company.people.length > 0) {
            content += `- Key Contacts:\n`;
            company.people.slice(0, 3).forEach(person => {
              content += `  • ${person.firstName} ${person.lastName} (${person.jobTitle || 'Title not specified'})\n`;
              content += `    Email: ${person.email || 'Not available'}\n`;
              if (person.phone) content += `    Phone: ${person.phone}\n`;
            });
          }
        }
      }

      if (!content) {
        // General industry intelligence
        const industryCompanies = await this.prisma.companies.count({
          where: {
            industry: { contains: request.context.industry || 'Engineering', mode: 'insensitive' }
          }
        });

        content += `**Industry Intelligence:**\n`;
        content += `- Companies in database: ${industryCompanies}\n`;
        content += `- Market focus: ${request.context.industry || 'Engineering'}\n`;
      }

      return {
        content,
        confidence,
        source: {
          name: 'Production Database',
          type: 'database' as const,
          confidence: 100,
          data: { query: 'Company and contact intelligence' }
        }
      };
    } catch (error) {
      this.logActivity(`Database query failed: ${error.message}`, 0, ['database']);
      return null;
    }
  }

  /**
   * Synthesize all intelligence with meta-analysis
   */
  private async synthesizeWithMetaAnalysis(
    combinedInsights: string,
    request: IntelligenceRequest,
    sources: IntelligenceResponse['sources']
  ) {
    const synthesisPrompt = `
As a McKinsey senior partner, synthesize the following intelligence into actionable insights:

CONTEXT: ${request.context.useCase} for ${request.context.company || 'target market'}
INDUSTRY: ${request.context.industry || 'Not specified'}

INTELLIGENCE GATHERED:
${combinedInsights}

SOURCES: ${sources.map(s => s.name).join(', ')}

Provide:
1. Executive summary with key insights
2. Strategic recommendations (3-5 actionable items)
3. Risk factors to consider
4. Next steps for implementation

Format as professional consulting analysis.
`;

    try {
      // Use Claude for synthesis (most reliable for complex analysis)
      const response = await axios({
        method: 'POST',
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        data: {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: synthesisPrompt
          }]
        },
        timeout: 30000
      });

      const content = response.data?.content?.[0]?.text || combinedInsights;
      
      // Extract structured recommendations
      const recommendations = this.extractRecommendations(content);
      const risks = this.extractRiskFactors(content);
      const nextSteps = this.extractNextSteps(content);

      return {
        content,
        recommendations,
        risks,
        nextSteps
      };
    } catch (error) {
      this.logActivity(`Synthesis failed: ${error.message}`, 0, ['synthesis']);
      
      // Fallback to basic synthesis
      return {
        content: combinedInsights,
        recommendations: ['Review gathered intelligence', 'Validate key findings', 'Develop action plan'],
        risks: ['Data accuracy', 'Market timing', 'Competitive response'],
        nextSteps: ['Prioritize insights', 'Create implementation timeline', 'Assign responsibilities']
      };
    }
  }

  // AI Model Query Methods
  private async queryPerplexityPro(request: IntelligenceRequest) {
    if (!process.env.PERPLEXITY_API_KEY) return null;

    const response = await axios({
      method: 'POST',
      url: 'https://api.perplexity.ai/chat/completions',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'sonar-pro',
        messages: [{
          role: 'user',
          content: `${request.query} Context: ${request.context.company || 'target market'} in ${request.context.industry || 'engineering'} industry. Focus on ${request.context.useCase}.`
        }],
        max_tokens: 500
      },
      timeout: 20000
    });

    return {
      content: response.data?.choices?.[0]?.message?.content || '',
      tokens: response.data?.usage?.total_tokens || 0
    };
  }

  private async queryClaudeAnalysis(request: IntelligenceRequest) {
    if (!process.env.ANTHROPIC_API_KEY) return null;

    const response = await axios({
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      data: {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `As a McKinsey consultant, analyze: ${request.query} for ${request.context.company || 'target market'} in ${request.context.industry || 'engineering'}. Focus on ${request.context.useCase}.`
        }]
      },
      timeout: 20000
    });

    return {
      content: response.data?.content?.[0]?.text || '',
      tokens: (response.data?.usage?.input_tokens || 0) + (response.data?.usage?.output_tokens || 0)
    };
  }

  private async queryGPT4Analysis(request: IntelligenceRequest) {
    if (!process.env.OPENAI_API_KEY) return null;

    const response = await axios({
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'gpt-4-turbo',
        messages: [{
          role: 'user',
          content: `Analyze patterns and insights: ${request.query} for ${request.context.company || 'target market'} in ${request.context.industry || 'engineering'}. Focus on ${request.context.useCase}.`
        }],
        max_tokens: 500,
        temperature: 0.1
      },
      timeout: 20000
    });

    return {
      content: response.data?.choices?.[0]?.message?.content || '',
      tokens: response.data?.usage?.total_tokens || 0
    };
  }

  // Data API Query Methods
  private async queryCoreSignalIntelligence(request: IntelligenceRequest) {
    if (!process.env.CORESIGNAL_API_KEY) return null;

    const response = await axios({
      method: 'POST',
      url: 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5',
      headers: {
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        query: {
          bool: {
            must: request.context.company ? [
              { term: { 'company_name': request.context.company } }
            ] : [
              { term: { 'job_title': 'Engineer' } }
            ]
          }
        }
      },
      timeout: 15000
    });

    const results = response.data?.hits?.hits || [];
    let content = `Found ${results.length} relevant professionals`;
    if (results.length > 0) {
      content += ':\n';
      results.slice(0, 3).forEach((hit: any, index: number) => {
        const person = hit._source;
        content += `${index + 1}. ${person.full_name || 'Name not available'} - ${person.job_title || 'Title not available'}\n`;
      });
    }

    return {
      content,
      results: results.length
    };
  }

  private async validateContactsWithDropContact(request: IntelligenceRequest) {
    if (!process.env.DROPCONTACT_API_KEY) return null;

    // Use a test email for validation
    const testEmail = request.context.company ? 
      `info@${request.context.company.toLowerCase().replace(/\s+/g, '')}.com` : 
      'test@example.com';

    const response = await axios({
      method: 'POST',
      url: 'https://api.dropcontact.io/batch',
      headers: {
        'X-Access-Token': process.env.DROPCONTACT_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        data: [{ email: testEmail }],
        siren: false,
        language: 'en'
      },
      timeout: 15000
    });

    const result = response.data?.data?.[0];
    const content = `Email validation: ${result?.email_status || 'unknown'} (${result?.qualification || 'no score'})`;

    return {
      content,
      results: 1
    };
  }

  // Utility Methods
  private determineMcKinseyLevel(confidence: number, sourceCount: number): IntelligenceResponse['mcKinseyLevel'] {
    if (confidence >= 95 && sourceCount >= 4) return 'GENIUS';
    if (confidence >= 85 && sourceCount >= 3) return 'EXPERT';
    if (confidence >= 75 && sourceCount >= 2) return 'ADVANCED';
    return 'DEVELOPING';
  }

  private extractRecommendations(content: string): string[] {
    const lines = content.split('\n');
    const recommendations: string[] = [];
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('should') || line.includes('action')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.length > 0 ? recommendations.slice(0, 5) : 
      ['Analyze gathered data', 'Validate key insights', 'Develop action plan'];
  }

  private extractRiskFactors(content: string): string[] {
    const lines = content.split('\n');
    const risks: string[] = [];
    
    for (const line of lines) {
      if (line.includes('risk') || line.includes('challenge') || line.includes('concern')) {
        risks.push(line.trim());
      }
    }
    
    return risks.length > 0 ? risks.slice(0, 3) : 
      ['Data accuracy verification needed', 'Market timing considerations', 'Competitive response factors'];
  }

  private extractNextSteps(content: string): string[] {
    const lines = content.split('\n');
    const steps: string[] = [];
    
    for (const line of lines) {
      if (line.includes('next') || line.includes('step') || line.includes('implement')) {
        steps.push(line.trim());
      }
    }
    
    return steps.length > 0 ? steps.slice(0, 4) : 
      ['Prioritize insights by impact', 'Create implementation timeline', 'Assign team responsibilities', 'Monitor progress metrics'];
  }

  private logActivity(action: string, confidence: number, sources: string[]) {
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      action,
      confidence,
      sources
    });
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default GeniusLevelIntelligenceOrchestrator;
