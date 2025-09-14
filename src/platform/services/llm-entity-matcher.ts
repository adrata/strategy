/**
 * LLM-Powered Entity Matcher (2025)
 * 
 * Uses OpenAI GPT-4 for complex entity matching cases that traditional algorithms struggle with.
 * Implements cost-effective hybrid approach with smart caching and prompt engineering.
 */

import OpenAI from 'openai';

export interface LLMMatchRequest {
  entity1: {
    name: string;
    type: 'person' | 'company';
    context?: string;
  };
  entity2: {
    name: string;
    type: 'person' | 'company';
    context?: string;
  };
  confidence_threshold?: number;
}

export interface LLMMatchResult {
  isMatch: boolean;
  confidence: number;
  reasoning: string;
  cost: number;
  cached: boolean;
}

export class LLMEntityMatcher {
  private openai: OpenAI;
  private cache: Map<string, LLMMatchResult> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly DEFAULT_MODEL = 'gpt-4o-mini'; // Cost-effective model
  private readonly FALLBACK_MODEL = 'gpt-4o'; // For complex cases

  constructor() {
    this['openai'] = new OpenAI({
      apiKey: process['env']['OPENAI_API_KEY'],
    });
  }

  /**
   * Match entities using LLM with cost optimization
   */
  async matchEntities(request: LLMMatchRequest): Promise<LLMMatchResult> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      // Use cost-effective model first
      let result = await this.performLLMMatch(request, this.DEFAULT_MODEL);
      
      // If confidence is low and it's a complex case, try the more powerful model
      if (result.confidence < 0.7 && this.isComplexCase(request)) {
        console.log('Using fallback model for complex case');
        result = await this.performLLMMatch(request, this.FALLBACK_MODEL);
      }

      // Cache the result
      this.setCache(cacheKey, result);
      
      return { ...result, cached: false };
    } catch (error) {
      console.error('LLM matching error:', error);
      return {
        isMatch: false,
        confidence: 0,
        reasoning: 'Error occurred during LLM matching',
        cost: 0,
        cached: false
      };
    }
  }

  /**
   * Perform the actual LLM matching
   */
  private async performLLMMatch(request: LLMMatchRequest, model: string): Promise<LLMMatchResult> {
    const prompt = this.buildPrompt(request);
    
    const startTime = Date.now();
    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(request.entity1.type)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const result = JSON.parse(response['choices'][0].message.content || '{}');
    
    // Estimate cost (rough approximation)
    const inputTokens = prompt.length / 4; // Rough token estimation
    const outputTokens = (response['choices'][0].message.content?.length || 0) / 4;
    const cost = this.estimateCost(model, inputTokens, outputTokens);

    return {
      isMatch: result.is_match || false,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || 'No reasoning provided',
      cost,
      cached: false
    };
  }

  /**
   * Build optimized prompt for entity matching
   */
  private buildPrompt(request: LLMMatchRequest): string {
    const { entity1, entity2 } = request;
    
    if (entity1['type'] === 'person') {
      return `
Analyze if these two person names refer to the same individual:

Person 1: "${entity1.name}"
${entity1.context ? `Context: ${entity1.context}` : ''}

Person 2: "${entity2.name}"
${entity2.context ? `Context: ${entity2.context}` : ''}

Consider:
- Name variations (nicknames, abbreviations, different spellings)
- Cultural name conventions (order, transliterations)
- Professional vs personal names
- Typos and OCR errors
- Middle names, initials, suffixes

Respond in JSON format:
{
  "is_match": boolean,
  "confidence": number (0-1),
  "reasoning": "detailed explanation of your decision"
}`;
    } else {
      return `
Analyze if these two company names refer to the same organization:

Company 1: "${entity1.name}"
${entity1.context ? `Context: ${entity1.context}` : ''}

Company 2: "${entity2.name}"
${entity2.context ? `Context: ${entity2.context}` : ''}

Consider:
- Legal entity variations (Inc, Corp, LLC, Ltd, etc.)
- Abbreviations and acronyms
- Subsidiaries and parent companies
- Rebranding and name changes
- Typos and formatting differences
- International variations

Respond in JSON format:
{
  "is_match": boolean,
  "confidence": number (0-1),
  "reasoning": "detailed explanation of your decision"
}`;
    }
  }

  /**
   * Get system prompt based on entity type
   */
  private getSystemPrompt(entityType: 'person' | 'company'): string {
    if (entityType === 'person') {
      return `You are an expert in person name matching and entity resolution. You have deep knowledge of:
- Global naming conventions and cultural variations
- Common nicknames and name abbreviations
- Transliteration patterns between languages
- Professional name variations
- OCR and data entry errors

Your task is to determine if two person names refer to the same individual with high accuracy.
Be conservative - only match if you're confident they're the same person.
Provide confidence scores and detailed reasoning.`;
    } else {
      return `You are an expert in company name matching and business entity resolution. You have deep knowledge of:
- Corporate legal structures and naming conventions
- Business abbreviations and acronyms
- Subsidiary and parent company relationships
- Industry-specific naming patterns
- International business name variations

Your task is to determine if two company names refer to the same organization with high accuracy.
Be conservative - only match if you're confident they're the same company.
Provide confidence scores and detailed reasoning.`;
    }
  }

  /**
   * Determine if this is a complex case that might need the more powerful model
   */
  private isComplexCase(request: LLMMatchRequest): boolean {
    const { entity1, entity2 } = request;
    
    // Check for complexity indicators
    const name1 = entity1.name.toLowerCase();
    const name2 = entity2.name.toLowerCase();
    
    // Different languages/scripts
    const hasNonLatin1 = /[^\x00-\x7F]/.test(name1);
    const hasNonLatin2 = /[^\x00-\x7F]/.test(name2);
    if (hasNonLatin1 || hasNonLatin2) return true;
    
    // Very different lengths
    const lengthRatio = Math.max(name1.length, name2.length) / Math.min(name1.length, name2.length);
    if (lengthRatio > 2) return true;
    
    // Contains abbreviations or special characters
    if (/[&.,()\/\-]/.test(name1) || /[&.,()\/\-]/.test(name2)) return true;
    
    // Multiple words with potential reordering
    const words1 = name1.split(/\s+/).length;
    const words2 = name2.split(/\s+/).length;
    if (words1 > 2 || words2 > 2) return true;
    
    return false;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: LLMMatchRequest): string {
    const key = `${request.entity1.type}:${request.entity1.name}:${request.entity2.name}`;
    return Buffer.from(key).toString('base64');
  }

  /**
   * Get result from cache if not expired
   */
  private getFromCache(key: string): LLMMatchResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired (simplified - in production use proper cache with TTL)
    return cached;
  }

  /**
   * Set result in cache
   */
  private setCache(key: string, result: LLMMatchResult): void {
    this.cache.set(key, result);
    
    // Simple cache cleanup (in production, use proper LRU cache)
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Estimate API cost (rough approximation)
   */
  private estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Rough pricing as of 2025 (update with actual pricing)
    const pricing = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // per 1K tokens
      'gpt-4o': { input: 0.005, output: 0.015 }
    };
    
    const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-4o-mini'];
    
    return ((inputTokens / 1000) * modelPricing.input) + ((outputTokens / 1000) * modelPricing.output);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
