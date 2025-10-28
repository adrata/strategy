/**
 * 🛡️ CONTEXT ISOLATOR
 * 
 * Implements context isolation to separate trusted data from untrusted user input
 * Prevents context pollution and reduces attack surface
 */

export interface ContextIsolationConfig {
  maxConversationHistory: number;
  maxContextLength: number;
  trustedDataSources: string[];
  untrustedDataSources: string[];
  enableContextPruning: boolean;
  enableDataSeparation: boolean;
}

export interface IsolatedContext {
  trustedContext: {
    workspaceData: any;
    systemData: any;
    configuration: any;
  };
  untrustedContext: {
    userMessages: Array<{ role: string; content: string; timestamp: Date }>;
    userFiles: any[];
    userPreferences: any;
  };
  metadata: {
    originalContextSize: number;
    isolatedContextSize: number;
    prunedItems: number;
    separationLevel: 'basic' | 'enhanced' | 'maximum';
  };
}

export class ContextIsolator {
  private static instance: ContextIsolator;
  private readonly DEFAULT_CONFIG: ContextIsolationConfig = {
    maxConversationHistory: 10,
    maxContextLength: 50000, // 50k characters
    trustedDataSources: ['workspace', 'system', 'configuration', 'database'],
    untrustedDataSources: ['user_input', 'user_files', 'user_preferences', 'conversation_history'],
    enableContextPruning: true,
    enableDataSeparation: true
  };

  public static getInstance(): ContextIsolator {
    if (!ContextIsolator.instance) {
      ContextIsolator.instance = new ContextIsolator();
    }
    return ContextIsolator.instance;
  }

  /**
   * Isolate context by separating trusted and untrusted data
   */
  public isolateContext(
    fullContext: any,
    config: Partial<ContextIsolationConfig> = {}
  ): IsolatedContext {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    // Separate trusted and untrusted data
    const { trustedContext, untrustedContext } = this.separateData(fullContext, finalConfig);
    
    // Prune context if enabled
    const prunedTrustedContext = finalConfig.enableContextPruning ? 
      this.pruneContext(trustedContext, finalConfig) : trustedContext;
    
    const prunedUntrustedContext = finalConfig.enableContextPruning ? 
      this.pruneContext(untrustedContext, finalConfig) : untrustedContext;

    // Calculate metadata
    const originalContextSize = JSON.stringify(fullContext).length;
    const isolatedContextSize = JSON.stringify(prunedTrustedContext).length + 
                               JSON.stringify(prunedUntrustedContext).length;
    
    const prunedItems = this.countPrunedItems(fullContext, prunedTrustedContext, prunedUntrustedContext);

    return {
      trustedContext: prunedTrustedContext,
      untrustedContext: prunedUntrustedContext,
      metadata: {
        originalContextSize,
        isolatedContextSize,
        prunedItems,
        separationLevel: finalConfig.enableDataSeparation ? 'enhanced' : 'basic'
      }
    };
  }

  /**
   * Separate data into trusted and untrusted categories
   */
  private separateData(
    context: any,
    config: ContextIsolationConfig
  ): { trustedContext: any; untrustedContext: any } {
    const trustedContext: any = {};
    const untrustedContext: any = {};

    // Categorize data based on source
    for (const [key, value] of Object.entries(context)) {
      const dataSource = this.categorizeDataSource(key, value);
      
      if (config.trustedDataSources.includes(dataSource)) {
        trustedContext[key] = value;
      } else if (config.untrustedDataSources.includes(dataSource)) {
        untrustedContext[key] = value;
      } else {
        // Default to untrusted for unknown sources
        untrustedContext[key] = value;
      }
    }

    return { trustedContext, untrustedContext };
  }

  /**
   * Categorize data source based on key and value
   */
  private categorizeDataSource(key: string, value: any): string {
    const keyLower = key.toLowerCase();
    
    // Trusted data sources
    if (keyLower.includes('workspace') || keyLower.includes('system') || 
        keyLower.includes('config') || keyLower.includes('database')) {
      return 'workspace';
    }
    
    if (keyLower.includes('user') || keyLower.includes('conversation') || 
        keyLower.includes('message') || keyLower.includes('input')) {
      return 'user_input';
    }
    
    if (keyLower.includes('file') || keyLower.includes('upload') || 
        keyLower.includes('attachment')) {
      return 'user_files';
    }
    
    if (keyLower.includes('preference') || keyLower.includes('setting')) {
      return 'user_preferences';
    }
    
    // Default categorization based on value type
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return 'user_input';
      }
      return 'workspace';
    }
    
    return 'user_input';
  }

  /**
   * Prune context to reduce size and remove sensitive data
   */
  private pruneContext(context: any, config: ContextIsolationConfig): any {
    const pruned = { ...context };
    
    // Prune conversation history
    if (pruned.conversationHistory && Array.isArray(pruned.conversationHistory)) {
      pruned.conversationHistory = pruned.conversationHistory
        .slice(-config.maxConversationHistory)
        .map((msg: any) => this.pruneMessage(msg));
    }
    
    // Prune large objects
    for (const [key, value] of Object.entries(pruned)) {
      if (typeof value === 'string' && value.length > 1000) {
        pruned[key] = value.substring(0, 1000) + '...';
      } else if (typeof value === 'object' && value !== null) {
        pruned[key] = this.pruneObject(value, config);
      }
    }
    
    // Ensure total context doesn't exceed max length
    const contextString = JSON.stringify(pruned);
    if (contextString.length > config.maxContextLength) {
      return this.truncateContext(pruned, config.maxContextLength);
    }
    
    return pruned;
  }

  /**
   * Prune individual message
   */
  private pruneMessage(message: any): any {
    if (!message || typeof message !== 'object') {
      return message;
    }
    
    const pruned = { ...message };
    
    // Truncate long content
    if (pruned.content && typeof pruned.content === 'string') {
      if (pruned.content.length > 500) {
        pruned.content = pruned.content.substring(0, 500) + '...';
      }
    }
    
    // Remove sensitive fields
    delete pruned.metadata;
    delete pruned.internalData;
    delete pruned.debugInfo;
    
    return pruned;
  }

  /**
   * Prune object recursively
   */
  private pruneObject(obj: any, config: ContextIsolationConfig, depth: number = 0): any {
    if (depth > 3) { // Prevent deep recursion
      return '[Object pruned - too deep]';
    }
    
    if (Array.isArray(obj)) {
      return obj.slice(0, 10).map(item => this.pruneObject(item, config, depth + 1));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const pruned: any = {};
      let count = 0;
      
      for (const [key, value] of Object.entries(obj)) {
        if (count >= 20) { // Limit object properties
          pruned['...'] = 'Additional properties pruned';
          break;
        }
        
        pruned[key] = this.pruneObject(value, config, depth + 1);
        count++;
      }
      
      return pruned;
    }
    
    if (typeof obj === 'string' && obj.length > 200) {
      return obj.substring(0, 200) + '...';
    }
    
    return obj;
  }

  /**
   * Truncate context to fit within max length
   */
  private truncateContext(context: any, maxLength: number): any {
    const contextString = JSON.stringify(context);
    
    if (contextString.length <= maxLength) {
      return context;
    }
    
    // Remove largest objects first
    const sortedKeys = Object.keys(context).sort((a, b) => {
      const sizeA = JSON.stringify(context[a]).length;
      const sizeB = JSON.stringify(context[b]).length;
      return sizeB - sizeA;
    });
    
    const truncated = { ...context };
    let currentLength = JSON.stringify(truncated).length;
    
    for (const key of sortedKeys) {
      if (currentLength <= maxLength) {
        break;
      }
      
      delete truncated[key];
      currentLength = JSON.stringify(truncated).length;
    }
    
    return truncated;
  }

  /**
   * Count pruned items for metadata
   */
  private countPrunedItems(original: any, trusted: any, untrusted: any): number {
    const originalKeys = this.getAllKeys(original);
    const isolatedKeys = this.getAllKeys(trusted).concat(this.getAllKeys(untrusted));
    
    return originalKeys.length - isolatedKeys.length;
  }

  /**
   * Get all keys from nested object
   */
  private getAllKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        
        if (typeof value === 'object' && value !== null) {
          keys.push(...this.getAllKeys(value, fullKey));
        }
      }
    }
    
    return keys;
  }

  /**
   * Create safe context for AI processing
   */
  public createSafeContext(
    isolatedContext: IsolatedContext,
    includeUntrusted: boolean = false
  ): any {
    const safeContext = {
      ...isolatedContext.trustedContext,
      // Add metadata about isolation
      _security: {
        isolated: true,
        separationLevel: isolatedContext.metadata.separationLevel,
        prunedItems: isolatedContext.metadata.prunedItems,
        originalSize: isolatedContext.metadata.originalContextSize,
        isolatedSize: isolatedContext.metadata.isolatedContextSize
      }
    };
    
    if (includeUntrusted) {
      // Add untrusted data with clear marking
      safeContext._untrusted = {
        ...isolatedContext.untrustedContext,
        _warning: 'This data comes from user input and should be treated as untrusted'
      };
    }
    
    return safeContext;
  }

  /**
   * Validate context isolation
   */
  public validateIsolation(isolatedContext: IsolatedContext): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check if trusted context contains user data
    const trustedString = JSON.stringify(isolatedContext.trustedContext);
    if (trustedString.includes('user_input') || trustedString.includes('conversation_history')) {
      issues.push('Trusted context contains user data');
      recommendations.push('Move user data to untrusted context');
    }
    
    // Check if untrusted context contains system data
    const untrustedString = JSON.stringify(isolatedContext.untrustedContext);
    if (untrustedString.includes('workspace') || untrustedString.includes('system')) {
      issues.push('Untrusted context contains system data');
      recommendations.push('Move system data to trusted context');
    }
    
    // Check context size
    if (isolatedContext.metadata.isolatedContextSize > 100000) {
      issues.push('Context size is too large');
      recommendations.push('Further prune context to reduce size');
    }
    
    // Check pruning effectiveness
    const pruningRatio = isolatedContext.metadata.prunedItems / 
                        (isolatedContext.metadata.originalContextSize / 1000);
    if (pruningRatio < 0.1) {
      issues.push('Insufficient context pruning');
      recommendations.push('Increase pruning aggressiveness');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Get isolation statistics
   */
  public getIsolationStats(isolatedContext: IsolatedContext): {
    trustedDataSize: number;
    untrustedDataSize: number;
    pruningRatio: number;
    separationEffectiveness: number;
  } {
    const trustedSize = JSON.stringify(isolatedContext.trustedContext).length;
    const untrustedSize = JSON.stringify(isolatedContext.untrustedContext).length;
    const totalSize = trustedSize + untrustedSize;
    
    const pruningRatio = isolatedContext.metadata.prunedItems / 
                        (isolatedContext.metadata.originalContextSize / 1000);
    
    const separationEffectiveness = trustedSize / totalSize;
    
    return {
      trustedDataSize: trustedSize,
      untrustedDataSize: untrustedSize,
      pruningRatio,
      separationEffectiveness
    };
  }
}

// Export singleton instance
export const contextIsolator = ContextIsolator.getInstance();
