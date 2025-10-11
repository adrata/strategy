/**
 * 🌐 OPENROUTER CONFIGURATION
 * 
 * Configuration settings for OpenRouter integration including
 * model preferences, routing rules, and cost optimization settings.
 */

export interface OpenRouterConfig {
  // API Configuration
  apiKey: string;
  siteUrl: string;
  appName: string;
  
  // Model Routing Configuration
  routing: {
    enableIntelligentRouting: boolean;
    costOptimizationLevel: 'aggressive' | 'balanced' | 'quality';
    maxCostPerRequest: number;
    preferredProviders: string[];
    fallbackEnabled: boolean;
  };
  
  // Model Preferences
  models: {
    simple: string[];
    standard: string[];
    complex: string[];
    research: string[];
  };
  
  // Cost Management
  costManagement: {
    enableCostTracking: boolean;
    dailyBudgetLimit: number;
    alertThresholds: {
      budgetWarning: number; // percentage
      budgetExceeded: number; // percentage
      unusualSpike: number; // multiplier
    };
  };
  
  // Performance Settings
  performance: {
    cacheTimeout: number; // milliseconds
    maxRetries: number;
    requestTimeout: number; // milliseconds
    enableResponseCaching: boolean;
  };
  
  // Feature Flags
  features: {
    enableWebResearch: boolean;
    enableCostAnalytics: boolean;
    enableFailover: boolean;
    enableComplexityAnalysis: boolean;
  };
}

// Default configuration
export const defaultOpenRouterConfig: OpenRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  siteUrl: process.env.OPENROUTER_SITE_URL || 'https://adrata.com',
  appName: process.env.OPENROUTER_APP_NAME || 'Adrata AI Assistant',
  
  routing: {
    enableIntelligentRouting: true,
    costOptimizationLevel: 'balanced',
    maxCostPerRequest: 0.10, // $0.10 max per request
    preferredProviders: ['anthropic', 'openai', 'google', 'perplexity'],
    fallbackEnabled: true
  },
  
  models: {
    simple: [
      'openai/gpt-4o-mini',
      'anthropic/claude-haiku-4.0',
      'google/gemini-2.0-flash-exp'
    ],
    standard: [
      'anthropic/claude-sonnet-4.5',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-exp'
    ],
    complex: [
      'anthropic/claude-opus-4.0',
      'openai/gpt-4.5-preview',
      'anthropic/claude-sonnet-4.5'
    ],
    research: [
      'perplexity/llama-3.1-sonar-large-128k-online',
      'anthropic/claude-sonnet-4.5',
      'openai/gpt-4o'
    ]
  },
  
  costManagement: {
    enableCostTracking: true,
    dailyBudgetLimit: 50.0, // $50 per day default
    alertThresholds: {
      budgetWarning: 80, // 80% of budget
      budgetExceeded: 100, // 100% of budget
      unusualSpike: 3 // 3x normal usage
    }
  },
  
  performance: {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    requestTimeout: 30 * 1000, // 30 seconds
    enableResponseCaching: true
  },
  
  features: {
    enableWebResearch: true,
    enableCostAnalytics: true,
    enableFailover: true,
    enableComplexityAnalysis: true
  }
};

// Workspace-specific configuration overrides
export const getWorkspaceConfig = (workspaceId: string): Partial<OpenRouterConfig> => {
  // In a real implementation, this would fetch from database
  // For now, return default overrides based on workspace type
  
  const workspaceOverrides: Record<string, Partial<OpenRouterConfig>> = {
    'enterprise': {
      routing: {
        ...defaultOpenRouterConfig.routing,
        costOptimizationLevel: 'quality',
        maxCostPerRequest: 0.25
      },
      costManagement: {
        ...defaultOpenRouterConfig.costManagement,
        dailyBudgetLimit: 200.0
      }
    },
    'startup': {
      routing: {
        ...defaultOpenRouterConfig.routing,
        costOptimizationLevel: 'aggressive',
        maxCostPerRequest: 0.05
      },
      costManagement: {
        ...defaultOpenRouterConfig.costManagement,
        dailyBudgetLimit: 20.0
      }
    },
    'enterprise-sales': {
      routing: {
        ...defaultOpenRouterConfig.routing,
        costOptimizationLevel: 'balanced',
        maxCostPerRequest: 0.15
      },
      models: {
        ...defaultOpenRouterConfig.models,
        complex: [
          'anthropic/claude-opus-4.0',
          'openai/gpt-4.5-preview'
        ]
      }
    }
  };
  
  return workspaceOverrides[workspaceId] || {};
};

// Environment-specific configuration
export const getEnvironmentConfig = (): Partial<OpenRouterConfig> => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        routing: {
          ...defaultOpenRouterConfig.routing,
          costOptimizationLevel: 'aggressive',
          maxCostPerRequest: 0.02
        },
        costManagement: {
          ...defaultOpenRouterConfig.costManagement,
          dailyBudgetLimit: 10.0
        },
        performance: {
          ...defaultOpenRouterConfig.performance,
          cacheTimeout: 1 * 60 * 1000 // 1 minute in dev
        }
      };
      
    case 'test':
      return {
        routing: {
          ...defaultOpenRouterConfig.routing,
          maxCostPerRequest: 0.01
        },
        costManagement: {
          ...defaultOpenRouterConfig.costManagement,
          dailyBudgetLimit: 5.0
        },
        features: {
          ...defaultOpenRouterConfig.features,
          enableWebResearch: false,
          enableCostAnalytics: false
        }
      };
      
    case 'production':
      return {
        routing: {
          ...defaultOpenRouterConfig.routing,
          costOptimizationLevel: 'balanced'
        },
        performance: {
          ...defaultOpenRouterConfig.performance,
          cacheTimeout: 10 * 60 * 1000 // 10 minutes in production
        }
      };
      
    default:
      return {};
  }
};

// Get final configuration by merging defaults, environment, and workspace configs
export const getOpenRouterConfig = (workspaceId?: string): OpenRouterConfig => {
  const baseConfig = defaultOpenRouterConfig;
  const envConfig = getEnvironmentConfig();
  const workspaceConfig = workspaceId ? getWorkspaceConfig(workspaceId) : {};
  
  // Deep merge configurations
  return {
    ...baseConfig,
    ...envConfig,
    ...workspaceConfig,
    routing: {
      ...baseConfig.routing,
      ...envConfig.routing,
      ...workspaceConfig.routing
    },
    models: {
      ...baseConfig.models,
      ...envConfig.models,
      ...workspaceConfig.models
    },
    costManagement: {
      ...baseConfig.costManagement,
      ...envConfig.costManagement,
      ...workspaceConfig.costManagement
    },
    performance: {
      ...baseConfig.performance,
      ...envConfig.performance,
      ...workspaceConfig.performance
    },
    features: {
      ...baseConfig.features,
      ...envConfig.features,
      ...workspaceConfig.features
    }
  };
};

// Configuration validation
export const validateOpenRouterConfig = (config: OpenRouterConfig): string[] => {
  const errors: string[] = [];
  
  if (!config.apiKey) {
    errors.push('OpenRouter API key is required');
  }
  
  if (!config.siteUrl) {
    errors.push('Site URL is required');
  }
  
  if (!config.appName) {
    errors.push('App name is required');
  }
  
  if (config.routing.maxCostPerRequest <= 0) {
    errors.push('Max cost per request must be greater than 0');
  }
  
  if (config.costManagement.dailyBudgetLimit <= 0) {
    errors.push('Daily budget limit must be greater than 0');
  }
  
  if (config.performance.requestTimeout <= 0) {
    errors.push('Request timeout must be greater than 0');
  }
  
  if (config.performance.maxRetries < 0) {
    errors.push('Max retries cannot be negative');
  }
  
  return errors;
};

// Export the main configuration getter
export const openRouterConfig = getOpenRouterConfig();
