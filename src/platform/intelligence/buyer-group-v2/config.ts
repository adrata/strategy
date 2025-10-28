/**
 * BUYER GROUP V2 CONFIGURATION
 * 
 * Configuration and validation for the buyer group v2 system
 */

export interface BuyerGroupV2Config {
  coresignalApiKey: string;
  anthropicApiKey: string;
  webhookSecret?: string;
  databaseUrl: string;
}

export class BuyerGroupV2ConfigManager {
  private static instance: BuyerGroupV2ConfigManager;
  private config: BuyerGroupV2Config | null = null;

  private constructor() {}

  static getInstance(): BuyerGroupV2ConfigManager {
    if (!BuyerGroupV2ConfigManager.instance) {
      BuyerGroupV2ConfigManager.instance = new BuyerGroupV2ConfigManager();
    }
    return BuyerGroupV2ConfigManager.instance;
  }

  /**
   * Initialize and validate configuration
   */
  initialize(): BuyerGroupV2Config {
    if (this.config) {
      return this.config;
    }

    const coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const webhookSecret = process.env.CORESIGNAL_WEBHOOK_SECRET;
    const databaseUrl = process.env.DATABASE_URL;

    // Validate required environment variables
    if (!coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required for buyer group v2');
    }

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for buyer group v2');
    }

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for buyer group v2');
    }

    this.config = {
      coresignalApiKey,
      anthropicApiKey,
      webhookSecret,
      databaseUrl
    };

    console.log('✅ [BUYER GROUP V2] Configuration initialized successfully');
    return this.config;
  }

  /**
   * Get current configuration
   */
  getConfig(): BuyerGroupV2Config {
    if (!this.config) {
      return this.initialize();
    }
    return this.config;
  }

  /**
   * Validate API keys are working
   */
  async validateApiKeys(): Promise<{
    coresignal: boolean;
    anthropic: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let coresignalValid = false;
    let anthropicValid = false;

    const config = this.getConfig();

    // Test Coresignal API
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/company/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          search_term: 'test',
          page_size: 1
        })
      });

      if (response.ok) {
        coresignalValid = true;
      } else {
        errors.push(`Coresignal API error: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      errors.push(`Coresignal API connection failed: ${error.message}`);
    }

    // Test Anthropic API
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      if (response.ok) {
        anthropicValid = true;
      } else {
        errors.push(`Anthropic API error: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      errors.push(`Anthropic API connection failed: ${error.message}`);
    }

    return {
      coresignal: coresignalValid,
      anthropic: anthropicValid,
      errors
    };
  }

  /**
   * Get feature flags
   */
  getFeatureFlags(): {
    enableBuyerGroupSampling: boolean;
    enableWebhooks: boolean;
    enableAIClassification: boolean;
    enableRealTimeUpdates: boolean;
  } {
    return {
      enableBuyerGroupSampling: process.env.BUYER_GROUP_SAMPLING !== 'false',
      enableWebhooks: !!process.env.CORESIGNAL_WEBHOOK_SECRET,
      enableAIClassification: !!process.env.ANTHROPIC_API_KEY,
      enableRealTimeUpdates: process.env.REAL_TIME_UPDATES !== 'false'
    };
  }

  /**
   * Get processing limits
   */
  getProcessingLimits(): {
    maxCompaniesPerRequest: number;
    maxEmployeesPerCompany: number;
    maxBuyerGroupSize: number;
    requestDelayMs: number;
    batchDelayMs: number;
  } {
    return {
      maxCompaniesPerRequest: parseInt(process.env.MAX_COMPANIES_PER_REQUEST || '50'),
      maxEmployeesPerCompany: parseInt(process.env.MAX_EMPLOYEES_PER_COMPANY || '200'),
      maxBuyerGroupSize: parseInt(process.env.MAX_BUYER_GROUP_SIZE || '18'),
      requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || '1000'),
      batchDelayMs: parseInt(process.env.BATCH_DELAY_MS || '3000')
    };
  }
}

// Export singleton instance
export const buyerGroupV2Config = BuyerGroupV2ConfigManager.getInstance();
