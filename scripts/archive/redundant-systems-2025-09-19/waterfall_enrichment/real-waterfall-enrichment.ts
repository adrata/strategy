/**
 * 🌊 REAL WATERFALL ENRICHMENT SYSTEM
 * Only includes providers we actually have API keys for
 */

import { CoreSignalClient } from './buyer-group/coresignal-client';

// Base interfaces
export interface EnrichmentProvider {
  id: string;
  name: string;
  type: 'phone_lookup' | 'company_data';
  priority: number;
  costPerCall: number;
  successRate: number;
  avgResponseTime: number;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerDay: number;
  };
  dataQualityScore: number;
  isActive: boolean;
  config: Record<string, any>;
}

export interface EnrichmentRequest {
  id: string;
  type: 'phone_lookup' | 'company_data';
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    domain?: string;
    phone?: string;
    [key: string]: any;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maxCost?: number;
  requiredConfidence?: number;
  userId: string;
  workspaceId: string;
  metadata?: Record<string, any>;
}

export interface EnrichmentResult {
  requestId: string;
  success: boolean;
  provider: string;
  data: Record<string, any>;
  confidence: number;
  cost: number;
  responseTime: number;
  qualityScore: number;
  metadata: {
    timestamp: string;
    apiVersion: string;
    creditsUsed: number;
  };
  errors?: string[];
}

export interface WaterfallConfig {
  maxProviders?: number;
  timeoutMs: number;
  costThreshold: number;
  confidenceThreshold?: number;
  enableMLOptimization?: boolean;
  enableCaching?: boolean;
  cacheTTL?: number;
  qualityThreshold?: number;
}

export class RealWaterfallEnrichment {
  private providers: Map<string, EnrichmentProvider> = new Map();
  private config: WaterfallConfig;
  private coreSignalClient: CoreSignalClient;

  constructor(config: WaterfallConfig) {
    this['config'] = config;
    this['coreSignalClient'] = new CoreSignalClient({
      apiKey: process['env']['CORESIGNAL_API_KEY']!,
      baseUrl: process['env']['CORESIGNAL_BASE_URL'] || 'https://api.coresignal.com',
      maxCollects: 100,
      batchSize: 10,
      useCache: true,
      cacheTTL: 24
    });
    
    this.initializeRealProviders();
  }

  /**
   * Main enrichment entry point
   */
  async enrich(request: EnrichmentRequest): Promise<EnrichmentResult> {
    console.log(`🌊 Starting real waterfall enrichment for ${request.type}:`, request.id);
    
    const startTime = Date.now();
    let totalCost = 0;

    // Get providers for this request type
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p['type'] === request['type'] && p.isActive)
      .sort((a, b) => a.priority - b.priority);

    console.log(`🎯 Available providers for ${request.type}:`, availableProviders.map(p => p.name));

    if (availableProviders['length'] === 0) {
      return {
        requestId: request.id,
        success: false,
        provider: 'none',
        data: {},
        confidence: 0,
        cost: 0,
        responseTime: Date.now() - startTime,
        qualityScore: 0,
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: '1.0.0',
          creditsUsed: 0
        },
        errors: [`No providers available for ${request.type}`]
      };
    }

    // Try each provider
    for (const provider of availableProviders) {
      if (totalCost >= (request.maxCost || this.config.costThreshold)) {
        console.log(`💰 Cost threshold reached: ${totalCost}`);
        break;
      }

      try {
        console.log(`🔄 Trying provider: ${provider.name}`);
        
        const result = await this.callProvider(provider, request);
        totalCost += result.cost;

        console.log(`✅ ${provider.name} result:`, {
          success: result.success,
          confidence: result.confidence,
          cost: result.cost,
          responseTime: result.responseTime
        });

        if (result.success) {
          return result;
        }

      } catch (error) {
        console.error(`❌ Provider ${provider.name} failed:`, error);
      }
    }

    // No providers succeeded
    return {
      requestId: request.id,
      success: false,
      provider: 'none',
      data: {},
      confidence: 0,
      cost: totalCost,
      responseTime: Date.now() - startTime,
      qualityScore: 0,
      metadata: {
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0',
        creditsUsed: 0
      },
      errors: [`No providers succeeded for ${request.type}`]
    };
  }

  /**
   * Initialize only providers we actually have API keys for
   */
  private initializeRealProviders(): void {
    console.log('🔧 Initializing REAL providers only...');

    // Phone Lookup Provider - WE HAVE THIS
    if (process['env']['TWILIO_ACCOUNT_SID'] && process['env']['TWILIO_AUTH_TOKEN']) {
      this.providers.set('twilio', {
        id: 'twilio',
        name: 'Twilio Lookup',
        type: 'phone_lookup',
        priority: 1,
        costPerCall: 0.008,
        successRate: 0.95,
        avgResponseTime: 300,
        rateLimit: { requestsPerSecond: 10, requestsPerDay: 100000 },
        dataQualityScore: 92,
        isActive: true,
        config: {
          accountSid: process['env']['TWILIO_ACCOUNT_SID'],
          authToken: process['env']['TWILIO_AUTH_TOKEN'],
          endpoint: 'https://lookups.twilio.com/v2/PhoneNumbers'
        }
      });
      console.log('✅ Twilio Lookup provider initialized');
    }

    // Company Data Provider - WE HAVE THIS
    if (process['env']['CORESIGNAL_API_KEY']) {
      this.providers.set('coresignal', {
        id: 'coresignal',
        name: 'CoreSignal',
        type: 'company_data',
        priority: 1,
        costPerCall: 0.02,
        successRate: 0.88,
        avgResponseTime: 1500,
        rateLimit: { requestsPerSecond: 2, requestsPerDay: 10000 },
        dataQualityScore: 88,
        isActive: true,
        config: {
          apiKey: process['env']['CORESIGNAL_API_KEY'],
          endpoint: 'https://api.coresignal.com/v1/company/search'
        }
      });
      console.log('✅ CoreSignal provider initialized');
    }

    // Log what we actually have
    const activeProviders = Array.from(this.providers.values()).filter(p => p.isActive);
    console.log(`🎯 Total REAL active providers: ${activeProviders.length}`);
    activeProviders.forEach(p => {
      console.log(`   - ${p.name} (${p.type})`);
    });
  }

  /**
   * Call specific provider
   */
  private async callProvider(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<EnrichmentResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (provider.id) {
        case 'twilio':
          result = await this.callTwilio(provider, request);
          break;
        case 'coresignal':
          result = await this.callCoreSignal(provider, request);
          break;
        default:
          throw new Error(`Unknown provider: ${provider.id}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        requestId: request.id,
        success: true,
        provider: provider.id,
        data: result.data || {},
        confidence: result.confidence || 75,
        cost: provider.costPerCall,
        responseTime,
        qualityScore: result.qualityScore || 80,
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: '1.0.0',
          creditsUsed: result.creditsUsed || 1
        }
      };

    } catch (error) {
      throw new Error(`Provider ${provider.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callTwilio(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const auth = Buffer.from(`${provider['config']['accountSid']}:${provider['config']['authToken']}`).toString('base64');
    const response = await fetch(`${provider['config']['endpoint']}/${request.data.phone}?Type=carrier&Type=caller-name`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    const data = await response.json();
    
    return {
      data: {
        phoneNumber: data.phone_number,
        countryCode: data.country_code,
        carrier: data.carrier,
        callerName: data.caller_name,
        lineType: data.line_type_intelligence
      },
      confidence: data.phone_number ? 95 : 0,
      creditsUsed: 1
    };
  }

  private async callCoreSignal(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(provider['config']['endpoint'], {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider['config']['apiKey']}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: request.data.company || request.data.name,
        website: request.data.domain,
        limit: 5
      })
    });
    
    if (!response.ok) {
      throw new Error(`CoreSignal API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      data: {
        companies: data.companies || [],
        totalResults: data.total || 0,
        searchQuery: request.data.company
      },
      confidence: (data.companies?.length || 0) > 0 ? 88 : 0,
      creditsUsed: 1
    };
  }

  /**
   * Get provider analytics
   */
  getProviderAnalytics() {
    const providers = Array.from(this.providers.values());
    return {
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        successRate: p.successRate,
        avgResponseTime: p.avgResponseTime,
        dataQualityScore: p.dataQualityScore,
        costPerCall: p.costPerCall
      })),
      totalRequests: 0,
      totalCost: 0,
      avgQualityScore: providers.reduce((sum, p) => sum + p.dataQualityScore, 0) / providers.length
    };
  }
}
