/**
 * Hybrid Entity Matcher (2025)
 * 
 * Combines traditional algorithms with LLM-powered matching for optimal cost and accuracy.
 * Uses a tiered approach:
 * 1. Fast traditional algorithms for clear cases
 * 2. LLM for ambiguous/complex cases
 * 3. Smart caching and cost optimization
 */

import { CoreSignalAccuracyValidator } from './coresignal-accuracy-validator';
import { LLMEntityMatcher, LLMMatchRequest, LLMMatchResult } from './llm-entity-matcher';
import { AdvancedPhoneticAlgorithms } from './advanced-phonetic-algorithms';

export interface HybridMatchRequest {
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
  options?: {
    useEmbeddings?: boolean;
    maxCost?: number;
    minConfidence?: number;
  };
}

export interface HybridMatchResult {
  isMatch: boolean;
  confidence: number;
  method: 'traditional' | 'llm' | 'hybrid';
  reasoning: string;
  cost: number;
  processingTime: number;
  details: {
    traditionalScore?: number;
    phoneticScore?: number;
    llmScore?: number;
    embeddingScore?: number;
  };
}

export class HybridEntityMatcher {
  private llmMatcher: LLMEntityMatcher;
  
  // Thresholds for decision making
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.90;
  private readonly LOW_CONFIDENCE_THRESHOLD = 0.30;
  private readonly AMBIGUOUS_RANGE = [0.30, 0.90];

  constructor() {
    this['llmMatcher'] = new LLMEntityMatcher();
  }

  /**
   * Match entities using hybrid approach
   */
  async matchEntities(request: HybridMatchRequest): Promise<HybridMatchResult> {
    const startTime = Date.now();
    let totalCost = 0;
    
    const { entity1, entity2, options = {} } = request;
    const { maxCost = 0.01, minConfidence = 0.7 } = options;

    // Step 1: Fast traditional algorithms
    const traditionalResult = this.performTraditionalMatching(entity1, entity2);
    
    // Step 2: Check if we have a clear decision
    if (traditionalResult.confidence >= this.HIGH_CONFIDENCE_THRESHOLD) {
      return {
        isMatch: true,
        confidence: traditionalResult.confidence,
        method: 'traditional',
        reasoning: `High confidence match using traditional algorithms (${Math.round(traditionalResult.confidence * 100)}%)`,
        cost: 0,
        processingTime: Date.now() - startTime,
        details: {
          traditionalScore: traditionalResult.confidence,
          phoneticScore: traditionalResult.phoneticScore
        }
      };
    }
    
    if (traditionalResult.confidence <= this.LOW_CONFIDENCE_THRESHOLD) {
      return {
        isMatch: false,
        confidence: traditionalResult.confidence,
        method: 'traditional',
        reasoning: `Low confidence - likely not a match using traditional algorithms (${Math.round(traditionalResult.confidence * 100)}%)`,
        cost: 0,
        processingTime: Date.now() - startTime,
        details: {
          traditionalScore: traditionalResult.confidence,
          phoneticScore: traditionalResult.phoneticScore
        }
      };
    }

    // Step 3: Ambiguous case - use LLM if budget allows
    if (totalCost < maxCost) {
      console.log(`Ambiguous case (${Math.round(traditionalResult.confidence * 100)}%) - using LLM`);
      
      const llmRequest: LLMMatchRequest = {
        entity1,
        entity2,
        confidence_threshold: minConfidence
      };
      
      const llmResult = await this.llmMatcher.matchEntities(llmRequest);
      totalCost += llmResult.cost;
      
      // Combine traditional and LLM results
      const hybridResult = this.combineResults(traditionalResult, llmResult);
      
      return {
        isMatch: hybridResult.isMatch,
        confidence: hybridResult.confidence,
        method: 'hybrid',
        reasoning: `Hybrid matching: Traditional (${Math.round(traditionalResult.confidence * 100)}%), LLM (${Math.round(llmResult.confidence * 100)}%). ${llmResult.reasoning}`,
        cost: totalCost,
        processingTime: Date.now() - startTime,
        details: {
          traditionalScore: traditionalResult.confidence,
          phoneticScore: traditionalResult.phoneticScore,
          llmScore: llmResult.confidence
        }
      };
    }

    // Step 4: Budget exceeded - return traditional result with warning
    return {
      isMatch: traditionalResult.confidence > 0.5,
      confidence: traditionalResult.confidence,
      method: 'traditional',
      reasoning: `Budget limit reached - using traditional algorithms only (${Math.round(traditionalResult.confidence * 100)}%)`,
      cost: 0,
      processingTime: Date.now() - startTime,
      details: {
        traditionalScore: traditionalResult.confidence,
        phoneticScore: traditionalResult.phoneticScore
      }
    };
  }

  /**
   * Perform traditional matching using existing algorithms
   */
  private performTraditionalMatching(entity1: any, entity2: any): {
    confidence: number;
    phoneticScore: number;
  } {
    if (entity1['type'] === 'person') {
      // Use enhanced name similarity
      const nameScore = CoreSignalAccuracyValidator.calculateNameSimilarity(entity1.name, entity2.name);
      
      // Add phonetic similarity
      const phoneticScore = AdvancedPhoneticAlgorithms.calculatePhoneticSimilarity(entity1.name, entity2.name);
      
      // Combine scores with weights
      const confidence = (nameScore * 0.7) + (phoneticScore * 0.3);
      
      return { confidence, phoneticScore };
    } else {
      // Use company similarity
      const companyScore = CoreSignalAccuracyValidator.calculateCompanySimilarity(entity1.name, entity2.name);
      
      // Add phonetic similarity for company names too
      const phoneticScore = AdvancedPhoneticAlgorithms.calculatePhoneticSimilarity(entity1.name, entity2.name);
      
      // Combine scores
      const confidence = (companyScore * 0.8) + (phoneticScore * 0.2);
      
      return { confidence, phoneticScore };
    }
  }

  /**
   * Combine traditional and LLM results intelligently
   */
  private combineResults(traditional: any, llm: LLMMatchResult): {
    isMatch: boolean;
    confidence: number;
  } {
    // If LLM is very confident, trust it more
    if (llm.confidence >= 0.9) {
      return {
        isMatch: llm.isMatch,
        confidence: (llm.confidence * 0.8) + (traditional.confidence * 0.2)
      };
    }
    
    // If traditional and LLM agree, boost confidence
    if ((traditional.confidence > 0.5) === llm.isMatch) {
      const boostedConfidence = Math.min(1.0, (traditional.confidence + llm.confidence) / 2 + 0.1);
      return {
        isMatch: llm.isMatch,
        confidence: boostedConfidence
      };
    }
    
    // If they disagree, be more conservative
    const averageConfidence = (traditional.confidence + llm.confidence) / 2;
    return {
      isMatch: averageConfidence > 0.6,
      confidence: averageConfidence * 0.9 // Reduce confidence when there's disagreement
    };
  }

  /**
   * Batch matching with cost optimization
   */
  async batchMatch(requests: HybridMatchRequest[]): Promise<HybridMatchResult[]> {
    const results: HybridMatchResult[] = [];
    let totalBudget = requests.reduce((sum, req) => sum + (req.options?.maxCost || 0.01), 0);
    let usedBudget = 0;
    
    // Sort by complexity - handle simple cases first
    const sortedRequests = requests.sort((a, b) => {
      const complexityA = this.calculateComplexity(a);
      const complexityB = this.calculateComplexity(b);
      return complexityA - complexityB;
    });
    
    for (const request of sortedRequests) {
      const remainingBudget = totalBudget - usedBudget;
      const adjustedRequest = {
        ...request,
        options: {
          ...request.options,
          maxCost: Math.min(request.options?.maxCost || 0.01, remainingBudget)
        }
      };
      
      const result = await this.matchEntities(adjustedRequest);
      results.push(result);
      usedBudget += result.cost;
      
      // If we're running low on budget, switch to traditional-only mode
      if (remainingBudget < 0.001) {
        console.log('Budget exhausted - switching to traditional-only mode');
        break;
      }
    }
    
    return results;
  }

  /**
   * Calculate complexity score for prioritization
   */
  private calculateComplexity(request: HybridMatchRequest): number {
    let complexity = 0;
    
    const name1 = request.entity1.name;
    const name2 = request.entity2.name;
    
    // Length difference
    const lengthRatio = Math.abs(name1.length - name2.length) / Math.max(name1.length, name2.length);
    complexity += lengthRatio * 10;
    
    // Special characters
    complexity += (name1.match(/[^a-zA-Z\s]/g) || []).length;
    complexity += (name2.match(/[^a-zA-Z\s]/g) || []).length;
    
    // Non-Latin characters
    complexity += /[^\x00-\x7F]/.test(name1) ? 5 : 0;
    complexity += /[^\x00-\x7F]/.test(name2) ? 5 : 0;
    
    // Word count
    complexity += name1.split(/\s+/).length;
    complexity += name2.split(/\s+/).length;
    
    return complexity;
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    cacheStats: any;
    totalMatches: number;
    avgProcessingTime: number;
    avgCost: number;
  } {
    return {
      cacheStats: this.llmMatcher.getCacheStats(),
      totalMatches: 0, // Would track in production
      avgProcessingTime: 0, // Would track in production
      avgCost: 0 // Would track in production
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.llmMatcher.clearCache();
  }
}
