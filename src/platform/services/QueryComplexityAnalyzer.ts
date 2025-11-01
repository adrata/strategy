/**
 * 🧠 QUERY COMPLEXITY ANALYZER
 * 
 * Intelligent query analysis to determine optimal AI model routing.
 * Analyzes query characteristics to select the most cost-effective
 * model while maintaining quality.
 */

export interface ComplexityAnalysis {
  score: number;
  category: 'simple' | 'standard' | 'complex' | 'research';
  factors: string[];
  confidence: number;
  estimatedTokens: number;
  recommendedModel: string;
  reasoning: string;
}

export interface QueryContext {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  currentRecord?: any;
  recordType?: string;
  appType?: string;
  workspaceId?: string;
  userId?: string;
  context?: any;
}

export class QueryComplexityAnalyzer {
  private static instance: QueryComplexityAnalyzer;
  
  // Query pattern definitions
  private patterns = {
    simple: [
      /^(yes|no|ok|thanks?|thank you|sure|alright)/i,
      /^(what is|what's|who is|who's|when is|when's|where is|where's)/i,
      /^(summarize|brief|quick|short)/i,
      /^(help|assist|support)/i,
      /^(status|progress|update)/i
    ],
    
    research: [
      /search/i,
      /find/i,
      /look up/i,
      /browse/i,
      /http/i,
      /www\./i,
      /latest/i,
      /current/i,
      /recent/i,
      /news/i,
      /trend/i,
      /market/i,
      /industry/i
    ],
    
    complex: [
      /analyze/i,
      /strategy/i,
      /recommend/i,
      /compare/i,
      /evaluate/i,
      /assess/i,
      /optimize/i,
      /improve/i,
      /enhance/i,
      /buyer group/i,
      /executive/i,
      /pipeline/i,
      /workflow/i,
      /process/i,
      /methodology/i
    ],
    
    multiStep: [
      /step/i,
      /process/i,
      /workflow/i,
      /how to/i,
      /guide/i,
      /tutorial/i,
      /walkthrough/i,
      /procedure/i,
      /sequence/i
    ],
    
    dataAnalysis: [
      /data/i,
      /enrich/i,
      /contact/i,
      /company/i,
      /lead/i,
      /prospect/i,
      /customer/i,
      /client/i,
      /database/i,
      /record/i,
      /field/i,
      /column/i,
      /table/i
    ],
    
    technical: [
      /api/i,
      /integration/i,
      /webhook/i,
      /endpoint/i,
      /database/i,
      /query/i,
      /sql/i,
      /json/i,
      /xml/i,
      /csv/i,
      /export/i,
      /import/i
    ]
  };

  // Model recommendations based on complexity
  private modelRecommendations = {
    simple: {
      primary: 'openai/gpt-4o-mini',
      secondary: 'anthropic/claude-haiku-4.0',
      reasoning: 'Simple queries benefit from fast, cost-effective models'
    },
    standard: {
      primary: 'anthropic/claude-sonnet-4.5',
      secondary: 'openai/gpt-4o',
      reasoning: 'Standard queries need balanced performance and cost'
    },
    complex: {
      primary: 'anthropic/claude-opus-4.0',
      secondary: 'openai/gpt-4.5-preview',
      reasoning: 'Complex queries require advanced reasoning capabilities'
    },
    research: {
      primary: 'perplexity/llama-3.1-sonar-large-128k-online',
      secondary: 'anthropic/claude-sonnet-4.5',
      reasoning: 'Research queries need real-time web access'
    }
  };

  public static getInstance(): QueryComplexityAnalyzer {
    if (!QueryComplexityAnalyzer.instance) {
      QueryComplexityAnalyzer.instance = new QueryComplexityAnalyzer();
    }
    return QueryComplexityAnalyzer.instance;
  }

  /**
   * Analyze query complexity and determine optimal routing
   */
  public analyzeQuery(context: QueryContext): ComplexityAnalysis {
    const { message, conversationHistory, currentRecord, recordType, appType } = context;
    
    let score = 0;
    const factors: string[] = [];
    let confidence = 0.8;

    // 1. Message length analysis
    const lengthAnalysis = this.analyzeMessageLength(message);
    score += lengthAnalysis.score;
    factors.push(...lengthAnalysis.factors);

    // 2. Pattern matching
    const patternAnalysis = this.analyzePatterns(message);
    score += patternAnalysis.score;
    factors.push(...patternAnalysis.factors);

    // 3. Context complexity
    const contextAnalysis = this.analyzeContext(context);
    score += contextAnalysis.score;
    factors.push(...contextAnalysis.factors);

    // 4. Conversation history
    const historyAnalysis = this.analyzeConversationHistory(conversationHistory);
    score += historyAnalysis.score;
    factors.push(...historyAnalysis.factors);

    // 5. App-specific complexity
    const appAnalysis = this.analyzeAppContext(appType, recordType);
    score += appAnalysis.score;
    factors.push(...appAnalysis.factors);

    // 6. Determine category
    const category = this.determineCategory(score, factors);
    
    // 7. Calculate confidence
    confidence = this.calculateConfidence(score, factors, category);

    // 8. Estimate tokens
    const estimatedTokens = this.estimateTokens(message, conversationHistory, category);

    // 9. Get model recommendation
    const recommendation = this.modelRecommendations[category];

    return {
      score: Math.min(100, Math.max(0, score)),
      category,
      factors: [...new Set(factors)], // Remove duplicates
      confidence,
      estimatedTokens,
      recommendedModel: recommendation.primary,
      reasoning: recommendation.reasoning
    };
  }

  /**
   * Analyze message length characteristics
   */
  private analyzeMessageLength(message: string): { score: number; factors: string[] } {
    const length = message.length;
    const wordCount = message.split(/\s+/).length;
    const factors: string[] = [];
    let score = 0;

    if (length < 20) {
      score += 5;
      factors.push('very-short');
    } else if (length < 50) {
      score += 15;
      factors.push('short');
    } else if (length < 200) {
      score += 30;
      factors.push('medium');
    } else if (length < 500) {
      score += 50;
      factors.push('long');
    } else {
      score += 70;
      factors.push('very-long');
    }

    // Word density analysis
    if (wordCount > 0) {
      const avgWordLength = length / wordCount;
      if (avgWordLength > 6) {
        score += 10;
        factors.push('complex-vocabulary');
      }
    }

    return { score, factors };
  }

  /**
   * Analyze query patterns
   */
  private analyzePatterns(message: string): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;
    const lowerMessage = message.toLowerCase();

    // Check each pattern category
    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          factors.push(category);
          
          switch (category) {
            case 'simple':
              score += 5;
              break;
            case 'research':
              score += 40;
              break;
            case 'complex':
              score += 35;
              break;
            case 'multiStep':
              score += 25;
              break;
            case 'dataAnalysis':
              score += 20;
              break;
            case 'technical':
              score += 30;
              break;
          }
          break; // Only count first match per category
        }
      }
    }

    // Special pattern combinations
    if (factors.includes('research') && factors.includes('complex')) {
      score += 15;
      factors.push('research-complex');
    }

    if (factors.includes('multiStep') && factors.includes('dataAnalysis')) {
      score += 20;
      factors.push('data-workflow');
    }

    return { score, factors };
  }

  /**
   * Analyze context complexity
   */
  private analyzeContext(context: QueryContext): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    if (context.currentRecord) {
      score += 15;
      factors.push('record-context');
      
      // Analyze record complexity
      const record = context.currentRecord;
      if (record.company && record.name) {
        score += 5;
        factors.push('full-record');
      }
      
      if (record.industry || record.size || record.revenue) {
        score += 10;
        factors.push('rich-record');
      }
    }

    if (context.workspaceId) {
      score += 5;
      factors.push('workspace-context');
    }

    if (context.userId) {
      score += 5;
      factors.push('user-context');
    }

    return { score, factors };
  }

  /**
   * Analyze conversation history
   */
  private analyzeConversationHistory(history?: Array<any>): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    if (!history || history.length === 0) {
      return { score, factors };
    }

    const historyLength = history.length;
    
    if (historyLength > 0) {
      score += 10;
      factors.push('has-history');
    }
    
    if (historyLength > 3) {
      score += 10;
      factors.push('long-history');
    }
    
    if (historyLength > 10) {
      score += 15;
      factors.push('very-long-history');
    }

    // Analyze history complexity
    const avgMessageLength = history.reduce((sum, msg) => sum + msg.content.length, 0) / historyLength;
    if (avgMessageLength > 200) {
      score += 10;
      factors.push('complex-history');
    }

    return { score, factors };
  }

  /**
   * Analyze app-specific context
   */
  private analyzeAppContext(appType?: string, recordType?: string): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    if (appType) {
      factors.push(`app-${appType}`);
      
      // App-specific complexity
      switch (appType.toLowerCase()) {
        case 'pipeline':
        case 'olympus':
          score += 20;
          factors.push('pipeline-context');
          break;
        case 'monaco':
          score += 15;
          factors.push('monaco-context');
          break;
        case 'grand-central':
          score += 25;
          factors.push('grand-central-context');
          break;
        case 'workshop':
          score += 10;
          factors.push('workshop-context');
          break;
      }
    }

    if (recordType) {
      factors.push(`record-${recordType}`);
      
      switch (recordType.toLowerCase()) {
        case 'company':
          score += 15;
          factors.push('company-analysis');
          break;
        case 'person':
        case 'contact':
          score += 10;
          factors.push('person-analysis');
          break;
        case 'lead':
          score += 12;
          factors.push('lead-analysis');
          break;
      }
    }

    return { score, factors };
  }

  /**
   * Determine complexity category
   */
  private determineCategory(score: number, factors: string[]): 'simple' | 'standard' | 'complex' | 'research' {
    // Research queries take priority
    if (factors.includes('research') || factors.includes('research-complex')) {
      return 'research';
    }
    
    // Complex queries
    if (score >= 70 || factors.includes('complex') || factors.includes('data-workflow')) {
      return 'complex';
    }
    
    // Standard queries
    if (score >= 30 || factors.includes('standard') || factors.includes('medium')) {
      return 'standard';
    }
    
    // Simple queries
    return 'simple';
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(score: number, factors: string[], category: string): number {
    let confidence = 0.8; // Base confidence
    
    // More factors = higher confidence
    if (factors.length > 5) confidence += 0.1;
    if (factors.length > 10) confidence += 0.1;
    
    // Clear category indicators
    if (factors.includes('research')) confidence += 0.1;
    if (factors.includes('complex')) confidence += 0.1;
    if (factors.includes('simple')) confidence += 0.1;
    
    // Score consistency
    if (score > 80 || score < 20) confidence += 0.1;
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }

  /**
   * Estimate token usage
   */
  private estimateTokens(message: string, history?: Array<any>, category?: string): number {
    let tokens = 0;
    
    // Base message tokens (rough estimate: 1 token ≈ 4 characters)
    tokens += Math.ceil(message.length / 4);
    
    // History tokens
    if (history) {
      tokens += history.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
    }
    
    // Category-based multiplier
    switch (category) {
      case 'simple':
        tokens *= 1.0;
        break;
      case 'standard':
        tokens *= 1.2;
        break;
      case 'complex':
        tokens *= 1.5;
        break;
      case 'research':
        tokens *= 1.3;
        break;
    }
    
    return Math.ceil(tokens);
  }

  /**
   * Get detailed analysis explanation
   */
  public getAnalysisExplanation(analysis: ComplexityAnalysis): string {
    const { score, category, factors, confidence, estimatedTokens, reasoning } = analysis;
    
    return `Query Analysis:
- Complexity Score: ${score}/100
- Category: ${category}
- Confidence: ${Math.round(confidence * 100)}%
- Estimated Tokens: ${estimatedTokens}
- Key Factors: ${factors.join(', ')}
- Reasoning: ${reasoning}`;
  }

  /**
   * Batch analyze multiple queries
   */
  public batchAnalyze(contexts: QueryContext[]): ComplexityAnalysis[] {
    return contexts.map(context => this.analyzeQuery(context));
  }

  /**
   * Get complexity statistics
   */
  public getComplexityStats(analyses: ComplexityAnalysis[]): {
    averageScore: number;
    categoryDistribution: Record<string, number>;
    averageConfidence: number;
    averageTokens: number;
  } {
    const total = analyses.length;
    if (total === 0) {
      return {
        averageScore: 0,
        categoryDistribution: {},
        averageConfidence: 0,
        averageTokens: 0
      };
    }

    const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / total;
    const averageConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / total;
    const averageTokens = analyses.reduce((sum, a) => sum + a.estimatedTokens, 0) / total;

    const categoryDistribution: Record<string, number> = {};
    analyses.forEach(analysis => {
      categoryDistribution[analysis.category] = (categoryDistribution[analysis.category] || 0) + 1;
    });

    return {
      averageScore,
      categoryDistribution,
      averageConfidence,
      averageTokens
    };
  }
}

// Export singleton instance
export const queryComplexityAnalyzer = QueryComplexityAnalyzer.getInstance();
