/**
 * 🤖 AI-POWERED INTENT PARSER
 * 
 * Uses OpenAI to intelligently understand user intent for CSV processing:
 * - Natural language understanding of limits and priorities
 * - Context-aware company selection strategies
 * - Smart defaults based on CSV content analysis
 * - Confidence scoring and clarification suggestions
 */

import OpenAI from 'openai';

export interface AIProcessingIntent {
  action: 'enrich' | 'find' | 'analyze' | 'export';
  limit?: number;
  prioritization: {
    method: 'first' | 'last' | 'alphabetical' | 'largest' | 'smallest' | 'revenue' | 'employees' | 'random' | 'smart';
    direction?: 'asc' | 'desc';
    reasoning: string;
  };
  roles?: string[];
  filters?: {
    industries?: string[];
    regions?: string[];
    sizeRange?: { min?: number; max?: number };
  };
  confidence: number;
  reasoning: string;
  suggestedConfirmation?: string;
  alternatives?: AIProcessingIntent[];
}

export interface CSVAnalysisContext {
  headers: string[];
  sampleData: any[];
  totalRows: number;
  detectedCompanyNames?: string[];
  detectedIndustries?: string[];
  estimatedCompanySizes?: string[];
}

export class AIIntentParser {
  private openai: OpenAI;

  constructor() {
    this['openai'] = new OpenAI({
      apiKey: process['env']['OPENAI_API_KEY'],
    });
  }

  /**
   * Main method: Parse user intent with AI understanding
   */
  async parseIntent(
    userQuery: string, 
    csvContext: CSVAnalysisContext
  ): Promise<AIProcessingIntent> {
    
    console.log('🤖 AI Intent Parser: Analyzing user query with CSV context');
    
    try {
      const systemPrompt = this.buildSystemPrompt(csvContext);
      const userPrompt = this.buildUserPrompt(userQuery, csvContext);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent parsing
        response_format: { type: "json_object" }
      });

      const response = completion['choices'][0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(response) as AIProcessingIntent;
      
      // Validate and enhance the response
      const validated = this.validateAndEnhanceIntent(parsed, csvContext);
      
      console.log('🤖 AI Intent Parsed:', validated);
      return validated;

    } catch (error) {
      console.error('AI Intent Parser error:', error);
      
      // Fallback to rule-based parsing
      return this.fallbackParsing(userQuery, csvContext);
    }
  }

  /**
   * Build system prompt with CSV context awareness
   */
  private buildSystemPrompt(csvContext: CSVAnalysisContext): string {
    return `You are an expert at understanding user intent for CSV data processing. 

CONTEXT:
- CSV has ${csvContext.totalRows} rows
- Headers: ${csvContext.headers.join(', ')}
- Sample companies: ${csvContext.detectedCompanyNames?.slice(0, 5).join(', ') || 'Unknown'}
- Detected industries: ${csvContext.detectedIndustries?.slice(0, 3).join(', ') || 'Mixed'}

YOUR TASK:
Parse the user's natural language request into a structured processing intent.

PRIORITIZATION METHODS:
- "first": Use data as-is (row order)
- "alphabetical": Sort by company name A-Z
- "largest": Prioritize by company size/employees (requires size data)
- "smallest": Prioritize smallest companies first
- "revenue": Sort by revenue (if available)
- "random": Random sampling
- "smart": AI-determined best approach based on context

SMART DEFAULTS:
- If user says "first 10" without context → use "first" method
- If user says "top 10" → analyze if they mean largest/best companies
- If user mentions "Fortune 500", "enterprise", "biggest" → use "largest"
- If user mentions "startups", "small business" → use "smallest"
- If user mentions "alphabetically", "A-Z" → use "alphabetical"
- If unclear, use "smart" and explain reasoning

RESPONSE FORMAT (JSON):
{
  "action": "enrich|find|analyze|export",
  "limit": number or null,
  "prioritization": {
    "method": "first|alphabetical|largest|smallest|revenue|random|smart",
    "direction": "asc|desc",
    "reasoning": "Why this method was chosen"
  },
  "roles": ["CFO", "CEO"] or null,
  "confidence": 0.0-1.0,
  "reasoning": "Overall explanation of interpretation",
  "suggestedConfirmation": "Human-readable confirmation text",
  "alternatives": [alternative interpretations] or null
}`;
  }

  /**
   * Build user prompt with specific query and context
   */
  private buildUserPrompt(userQuery: string, csvContext: CSVAnalysisContext): string {
    return `User Query: "${userQuery}"

Additional Context:
- The CSV appears to contain ${this.analyzeCSVType(csvContext)}
- ${csvContext.totalRows} total records available
- User wants to process this data efficiently

Please parse this request and determine:
1. What action they want (enrich with contact data, find specific roles, etc.)
2. How many records to process (if specified)
3. How to prioritize/select which records to process
4. What roles they're looking for (if any)
5. Your confidence in this interpretation

Be smart about context clues. For example:
- "first 10" usually means the first 10 rows as-is
- "top 10" might mean largest/best companies if context suggests it
- "find CFOs at the first 10 companies" is clear: limit=10, method=first, roles=["CFO"]
- "get executives from the largest companies, limit to 20" means method=largest, limit=20

Respond with valid JSON only.`;
  }

  /**
   * Analyze CSV type from context
   */
  private analyzeCSVType(csvContext: CSVAnalysisContext): string {
    const headers = csvContext.headers.map(h => h.toLowerCase());
    
    if (headers.some(h => h.includes('company') || h.includes('organization'))) {
      return 'company data';
    }
    
    if (headers.some(h => h.includes('name') && (h.includes('first') || h.includes('last')))) {
      return 'contact/people data';
    }
    
    return 'business data';
  }

  /**
   * Validate and enhance AI response
   */
  private validateAndEnhanceIntent(
    intent: AIProcessingIntent, 
    csvContext: CSVAnalysisContext
  ): AIProcessingIntent {
    
    // Ensure confidence is reasonable
    if (intent.confidence > 1) intent['confidence'] = 1;
    if (intent.confidence < 0) intent['confidence'] = 0;
    
    // Validate limit against CSV size
    if (intent['limit'] && intent.limit > csvContext.totalRows) {
      intent['limit'] = csvContext.totalRows;
      intent.reasoning += ` (Adjusted limit to available ${csvContext.totalRows} records)`;
    }
    
    // Enhance prioritization reasoning
    if (intent['prioritization']['method'] === 'smart') {
      intent['prioritization'] = this.determineSmartPrioritization(csvContext);
    }
    
    // Generate confirmation text if not provided
    if (!intent.suggestedConfirmation) {
      intent['suggestedConfirmation'] = this.generateConfirmationText(intent, csvContext);
    }
    
    return intent;
  }

  /**
   * Determine smart prioritization based on CSV analysis
   */
  private determineSmartPrioritization(csvContext: CSVAnalysisContext): AIProcessingIntent['prioritization'] {
    const headers = csvContext.headers.map(h => h.toLowerCase());
    
    // If we have size/employee data, prioritize by largest
    if (headers.some(h => h.includes('employee') || h.includes('size') || h.includes('headcount'))) {
      return {
        method: 'largest',
        direction: 'desc',
        reasoning: 'Detected company size data - prioritizing largest companies for better executive availability'
      };
    }
    
    // If we have revenue data, use that
    if (headers.some(h => h.includes('revenue') || h.includes('sales'))) {
      return {
        method: 'revenue',
        direction: 'desc',
        reasoning: 'Detected revenue data - prioritizing highest revenue companies'
      };
    }
    
    // If company names look like they might be Fortune 500
    if (csvContext.detectedCompanyNames?.some(name => 
      ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Tesla'].some(big => 
        name.toLowerCase().includes(big.toLowerCase())
      )
    )) {
      return {
        method: 'alphabetical',
        direction: 'asc',
        reasoning: 'Detected major companies - using alphabetical order for consistent results'
      };
    }
    
    // Default to first
    return {
      method: 'first',
      direction: 'asc',
      reasoning: 'Using data as-is (row order) - no specific prioritization criteria detected'
    };
  }

  /**
   * Generate human-readable confirmation text
   */
  private generateConfirmationText(intent: AIProcessingIntent, csvContext: CSVAnalysisContext): string {
    let text = `I'll ${intent.action} `;
    
    if (intent.limit) {
      text += `${intent.limit} companies `;
    } else {
      text += `all ${csvContext.totalRows} companies `;
    }
    
    if (intent['roles'] && intent.roles.length > 0) {
      text += `to find ${intent.roles.join(' and ')} contacts `;
    }
    
    text += `using ${intent.prioritization.method} prioritization`;
    
    if (intent.prioritization.method !== 'first') {
      text += ` (${intent.prioritization.reasoning})`;
    }
    
    text += `. This will use approximately ${this.estimateCredits(intent, csvContext)} Adrata credits.`;
    
    return text;
  }

  /**
   * Estimate Adrata credits needed (with premium pricing)
   */
  private estimateCredits(intent: AIProcessingIntent, csvContext: CSVAnalysisContext): number {
    const recordsToProcess = intent.limit || csvContext.totalRows;
    const rolesMultiplier = intent.roles ? intent.roles.length : 1;
    
    // Base CoreSignal cost
    const coreSignalCredits = recordsToProcess * rolesMultiplier;
    
    // Apply Adrata premium pricing (2.5x markup)
    const adrataCredits = Math.ceil(coreSignalCredits * 2.5);
    
    return adrataCredits;
  }

  /**
   * Fallback parsing when AI fails
   */
  private fallbackParsing(userQuery: string, csvContext: CSVAnalysisContext): AIProcessingIntent {
    console.log('🔄 Using fallback rule-based parsing');
    
    const lowerQuery = userQuery.toLowerCase();
    
    // Extract limit
    const limitMatch = lowerQuery.match(/(?:first|top|limit.*?to|only.*?process)\s+(\d+)/);
    const limit = limitMatch ? parseInt(limitMatch[1]) : undefined;
    
    // Extract roles
    const roles: string[] = [];
    if (lowerQuery.includes('cfo')) roles.push('CFO');
    if (lowerQuery.includes('ceo')) roles.push('CEO');
    if (lowerQuery.includes('executive')) roles.push('Executive');
    
    // Determine prioritization
    let method: AIProcessingIntent['prioritization']['method'] = 'first';
    let reasoning = 'Default: using data as-is';
    
    if (lowerQuery.includes('largest') || lowerQuery.includes('biggest')) {
      method = 'largest';
      reasoning = 'User specified largest companies';
    } else if (lowerQuery.includes('alphabetical') || lowerQuery.includes('a-z')) {
      method = 'alphabetical';
      reasoning = 'User specified alphabetical order';
    } else if (lowerQuery.includes('random')) {
      method = 'random';
      reasoning = 'User specified random sampling';
    }
    
    return {
      action: 'enrich',
      limit,
      prioritization: {
        method,
        direction: 'asc',
        reasoning
      },
      roles: roles.length > 0 ? roles : undefined,
      confidence: 0.7, // Lower confidence for fallback
      reasoning: 'Fallback rule-based parsing - AI parsing failed',
      suggestedConfirmation: this.generateConfirmationText({
        action: 'enrich',
        limit,
        prioritization: { method, direction: 'asc', reasoning },
        roles: roles.length > 0 ? roles : undefined,
        confidence: 0.7,
        reasoning: ''
      }, csvContext)
    };
  }

  /**
   * Analyze CSV content to provide context for AI
   */
  static analyzeCSVContent(headers: string[], data: any[]): CSVAnalysisContext {
    const context: CSVAnalysisContext = {
      headers,
      sampleData: data.slice(0, 5),
      totalRows: data.length
    };
    
    // Extract company names
    const companyColumnIndex = headers.findIndex(h => 
      h.toLowerCase().includes('company') || 
      h.toLowerCase().includes('organization') ||
      h.toLowerCase().includes('business')
    );
    
    if (companyColumnIndex !== -1) {
      context['detectedCompanyNames'] = data
        .slice(0, 10)
        .map(row => row[companyColumnIndex])
        .filter(name => name && typeof name === 'string')
        .map(name => name.trim());
    }
    
    // Extract industries if available
    const industryColumnIndex = headers.findIndex(h => 
      h.toLowerCase().includes('industry') || 
      h.toLowerCase().includes('sector') ||
      h.toLowerCase().includes('vertical')
    );
    
    if (industryColumnIndex !== -1) {
      context['detectedIndustries'] = [...new Set(
        data
          .slice(0, 20)
          .map(row => row[industryColumnIndex])
          .filter(industry => industry && typeof industry === 'string')
          .map(industry => industry.trim())
      )];
    }
    
    return context;
  }
}
