/**
 * 🌊 ADAPTIVE WATERFALL ENRICHMENT SYSTEM
 * 
 * Modular, scalable, and intelligent data enrichment pipeline
 * Built on CoreSignal foundation with adaptive provider selection
 * 
 * Key Features:
 * - Smart provider routing based on data type and quality
 * - Cost optimization with success-based billing
 * - Real-time accuracy monitoring and adaptation
 * - Modular provider architecture for easy scaling
 * - ML-driven quality prediction and provider selection
 */

import { CoreSignalClient } from './buyer-group/coresignal-client';

// Base interfaces for modular architecture
export interface EnrichmentProvider {
  id: string;
  name: string;
  type: 'email_verification' | 'email_finding' | 'phone_lookup' | 'technographics' | 'signals' | 'company_data';
  priority: number; // Lower = higher priority
  costPerCall: number;
  successRate: number; // Historical success rate 0-1
  avgResponseTime: number; // milliseconds
  rateLimit: {
    requestsPerSecond: number;
    requestsPerDay: number;
  };
  dataQualityScore: number; // 0-100, ML-calculated
  isActive: boolean;
  config: Record<string, any>;
}

export interface EnrichmentRequest {
  id: string;
  type: 'email_verification' | 'email_finding' | 'phone_lookup' | 'technographics' | 'signals' | 'company_data';
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    domain?: string;
    phone?: string;
    linkedinUrl?: string;
    [key: string]: any;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maxCost?: number; // Maximum cost willing to spend
  requiredConfidence?: number; // Minimum confidence score required
  userId: string;
  workspaceId: string;
  metadata: {
    source: string;
    timestamp: string;
    retryCount: number;
  };
}

export interface EnrichmentResult {
  requestId: string;
  success: boolean;
  provider: string;
  data: Record<string, any>;
  confidence: number; // 0-100
  cost: number;
  responseTime: number;
  qualityScore: number; // ML-calculated data quality
  metadata: {
    timestamp: string;
    apiVersion: string;
    creditsUsed: number;
  };
  errors?: string[];
}

export interface WaterfallConfig {
  maxProviders: number; // Maximum providers to try
  timeoutMs: number; // Overall timeout
  costThreshold: number; // Stop if cost exceeds this
  confidenceThreshold: number; // Stop if confidence exceeds this
  enableMLOptimization: boolean; // Use ML for provider selection
  enableCaching: boolean; // Cache results
  cacheTTL: number; // Cache time-to-live in seconds
}

export interface DataQualityMetrics {
  accuracy: number; // 0-100
  completeness: number; // 0-100
  freshness: number; // 0-100 (how recent is the data)
  consistency: number; // 0-100 (consistency across providers)
  reliability: number; // 0-100 (provider reliability)
  overallScore: number; // Weighted average
}

export class AdaptiveWaterfallEnrichment {
  private providers: Map<string, EnrichmentProvider> = new Map();
  private config: WaterfallConfig;
  private coreSignalClient: CoreSignalClient;
  private mlModel: MLProviderSelector;
  private perplexityApiKey: string;
  private qualityMonitor: DataQualityMonitor;
  private costOptimizer: CostOptimizer;

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
    this['mlModel'] = new MLProviderSelector();
    this['qualityMonitor'] = new DataQualityMonitor();
    this['costOptimizer'] = new CostOptimizer();
    this['perplexityApiKey'] = process['env']['PERPLEXITY_API_KEY'] || '';
    
    this.initializeProviders();
  }

  /**
   * 🎯 MAIN ENRICHMENT ENTRY POINT
   * Smart, adaptive enrichment with optimal provider selection
   * Implements intelligent waterfall based on data type and quality
   */
  async enrich(request: EnrichmentRequest): Promise<EnrichmentResult> {
    console.log(`🌊 Starting intelligent waterfall enrichment for ${request.type}:`, request.id);
    
    const startTime = Date.now();
    let totalCost = 0;
    let bestResult: EnrichmentResult | null = null;
    
    // 🧠 INTELLIGENT PROVIDER SELECTION
    // Implement optimal waterfall sequence based on data type and existing data
    const providerSequence = await this.getOptimalProviderSequence(request);
    console.log(`🎯 Optimal provider sequence:`, providerSequence.map((p: EnrichmentProvider) => p.name));
    const attemptedProviders: string[] = [];

    try {
      // 🌊 INTELLIGENT WATERFALL EXECUTION
      const allResults: EnrichmentResult[] = [];
      
      for (const provider of providerSequence) {
        if (totalCost >= (request.maxCost || this.config.costThreshold)) {
          console.log(`💰 Cost threshold reached: ${totalCost}`);
          break;
        }

        if (Date.now() - startTime >= this.config.timeoutMs) {
          console.log(`⏰ Timeout reached: ${Date.now() - startTime}ms`);
          break;
        }

        try {
          console.log(`🔄 Trying provider: ${provider.name}`);
          
          const result = await this.callProvider(provider, request);
          attemptedProviders.push(provider.id);
          totalCost += result.cost;

          // Update provider performance metrics
          await this.updateProviderMetrics(provider.id, result);

          console.log(`✅ ${provider.name} result:`, {
            success: result.success,
            confidence: result.confidence,
            cost: result.cost,
            responseTime: result.responseTime,
            qualityScore: result.qualityScore
          });

          if (result.success) {
            allResults.push(result);
            
            // 🎯 INTELLIGENT STOPPING CRITERIA
            // Stop if we have excellent result, but continue if we might get better data
            if (result.confidence >= 90 && result.qualityScore >= 85) {
              console.log(`🏆 Excellent result found, stopping waterfall`);
              break;
            }
          }

        } catch (error) {
          console.error(`❌ Provider ${provider.name} failed:`, error);
          await this.updateProviderMetrics(provider.id, {
            success: false,
            responseTime: Date.now() - startTime,
            cost: provider.costPerCall
          } as EnrichmentResult);
          
          // 🤖 PERPLEXITY FALLBACK for complex queries
          if (provider['name'] === 'Lusha API' && request['type'] === 'phone_lookup') {
            console.log(`🤖 Trying Perplexity API fallback for complex phone lookup`);
            const perplexityResult = await this.queryPerplexityAPI(
              `Find phone number for ${request.data.firstName} ${request.data.lastName} at ${request.data.company}`,
              request.data
            );
            if (perplexityResult) {
              console.log(`🤖 Perplexity provided additional context:`, perplexityResult.substring(0, 100));
            }
          }
        }

        // Rate limiting delay
        await this.delay(100);
      }

      // 🧠 INTELLIGENT RESULT SELECTION
      // Choose the best result based on freshness, confidence, and quality
      if (allResults.length > 0) {
        bestResult = this.selectBestResult(allResults);
        console.log(`🏆 Selected best result from ${allResults.length} options: ${bestResult.provider}`);
      }

      // Return best result or failure
      if (bestResult) {
        // Cache successful result
        if (this.config.enableCaching) {
          await this.cacheResult(request, bestResult);
        }

        // Update ML model with successful pattern
        await this.mlModel.updateWithSuccess(request, bestResult, attemptedProviders);

        return bestResult;
      } else {
        throw new Error(`No providers succeeded for ${request.type}`);
      }

    } catch (error) {
      console.error(`🌊 Waterfall enrichment failed:`, error);
      
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
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * 🏆 SELECT BEST RESULT
   * Choose the best result based on confidence, quality, and freshness
   */
  private selectBestResult(results: EnrichmentResult[]): EnrichmentResult {
    return results.reduce((best, current) => {
      // Calculate composite score: confidence (40%) + quality (40%) + recency (20%)
      const bestScore = (best.confidence * 0.4) + (best.qualityScore * 0.4) + 
                       (this.getRecencyScore(best) * 0.2);
      const currentScore = (current.confidence * 0.4) + (current.qualityScore * 0.4) + 
                          (this.getRecencyScore(current) * 0.2);
      
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 📅 GET RECENCY SCORE
   * Calculate recency score based on timestamp (newer = higher score)
   */
  private getRecencyScore(result: EnrichmentResult): number {
    const now = Date.now();
    const resultTime = new Date(result.metadata.timestamp).getTime();
    const ageMinutes = (now - resultTime) / (1000 * 60);
    
    // Score decreases with age: 100 for fresh, 50 for 1 hour old, 0 for 24+ hours
    return Math.max(0, 100 - (ageMinutes / 14.4)); // 14.4 minutes per point
  }

  /**
   * 🧠 ML-POWERED PROVIDER SELECTION
   * Uses machine learning to select optimal provider sequence
   */
  private async getOptimalProviderSequence(request: EnrichmentRequest): Promise<EnrichmentProvider[]> {
    const allProviders = Array.from(this.providers.values());
    console.log(`🔍 Debug: Looking for providers with type '${request.type}'`);
    
    allProviders.forEach(p => {
      if (p['type'] === request.type) {
        console.log(`🔍 Provider ${p.name}: type=${p.type}, isActive=${p.isActive}, hasApiKey=${!!p.config.apiKey}`);
      }
    });
    
    const availableProviders = allProviders
      .filter(p => p['type'] === request['type'] && p.isActive)
      .sort((a, b) => a.priority - b.priority);
      
    console.log(`🔍 Filtered providers for ${request.type}:`, availableProviders.map(p => p.name));

    if (!this.config.enableMLOptimization) {
      return availableProviders;
    }

    // Use ML model to predict best providers for this request
    const mlPredictions = await this.mlModel.predictProviderSuccess(request, availableProviders);
    
    // Combine ML predictions with cost optimization
    const optimizedSequence = this.costOptimizer.optimizeSequence(
      availableProviders,
      mlPredictions,
      request.maxCost || this.config.costThreshold
    );

    return optimizedSequence;
  }

  /**
   * 📞 MODULAR PROVIDER CALLING
   * Unified interface for all provider types
   */
  private async callProvider(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<EnrichmentResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (provider.id) {
        case 'zerobounce':
          result = await this.callZeroBounce(provider, request);
          break;
        case 'myemailverifier':
          result = await this.callMyEmailVerifier(provider, request);
          break;
        case 'prospeo':
          result = await this.callProspeo(provider, request);
          break;
        case 'dropcontact':
          result = await this.callDropcontact(provider, request);
          break;
        case 'twilio':
          result = await this.callTwilio(provider, request);
          break;
        case 'lusha':
          result = await this.callLusha(provider, request);
          break;
        case 'wappalyzer':
          result = await this.callWappalyzer(provider, request);
          break;
        case 'crustdata':
          result = await this.callCrustdata(provider, request);
          break;
        case 'coresignal':
          result = await this.callCoreSignal(provider, request);
          break;
        default:
          throw new Error(`Unknown provider: ${provider.id}`);
      }

      const responseTime = Date.now() - startTime;
      const qualityScore = await this.qualityMonitor.calculateQualityScore(result, request);

      return {
        requestId: request.id,
        success: true,
        provider: provider.id,
        data: result.data || {},
        confidence: result.confidence || 75,
        cost: provider.costPerCall,
        responseTime,
        qualityScore,
        metadata: {
          timestamp: new Date().toISOString(),
          apiVersion: result.apiVersion || '1.0.0',
          creditsUsed: result.creditsUsed || 1
        }
      };

    } catch (error) {
      throw new Error(`Provider ${provider.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📊 INITIALIZE MODULAR PROVIDERS
   * Scalable provider configuration
   */
  private initializeProviders(): void {
    // Email Verification Providers
    this.providers.set('zerobounce', {
      id: 'zerobounce',
      name: 'ZeroBounce',
      type: 'email_verification',
      priority: 1, // Highest priority for verification
      costPerCall: 0.002,
      successRate: 0.98,
      avgResponseTime: 500,
      rateLimit: { requestsPerSecond: 10, requestsPerDay: 100000 },
      dataQualityScore: 95,
      isActive: !!process['env']['ZEROBOUNCE_API_KEY'],
      config: {
        apiKey: process['env']['ZEROBOUNCE_API_KEY'],
        endpoint: 'https://api.zerobounce.net/v2/validate'
      }
    });

    this.providers.set('myemailverifier', {
      id: 'myemailverifier',
      name: 'MyEmailVerifier',
      type: 'email_verification',
      priority: 2,
      costPerCall: 0.0039,
      successRate: 0.98,
      avgResponseTime: 600,
      rateLimit: { requestsPerSecond: 5, requestsPerDay: 50000 },
      dataQualityScore: 98, // Highest accuracy according to research
      isActive: !!process['env']['MYEMAILVERIFIER_API_KEY'],
      config: {
        apiKey: process['env']['MYEMAILVERIFIER_API_KEY'],
        endpoint: 'https://api.myemailverifier.com/v1/verify'
      }
    });

    // Email Finding Providers
    this.providers.set('prospeo', {
      id: 'prospeo',
      name: 'Prospeo',
      type: 'email_finding',
      priority: 1,
      costPerCall: 0.0198,
      successRate: 0.85,
      avgResponseTime: 1200,
      rateLimit: { requestsPerSecond: 2, requestsPerDay: 10000 },
      dataQualityScore: 88,
      isActive: !!process['env']['PROSPEO_API_KEY'],
      config: {
        apiKey: process['env']['PROSPEO_API_KEY'],
        endpoint: 'https://api.prospeo.io/email-finder'
      }
    });

    this.providers.set('dropcontact', {
      id: 'dropcontact',
      name: 'Dropcontact',
      type: 'email_finding',
      priority: 2,
      costPerCall: 0.02,
      successRate: 0.82,
      avgResponseTime: 1500,
      rateLimit: { requestsPerSecond: 1, requestsPerDay: 20000 },
      dataQualityScore: 85,
      isActive: !!process['env']['DROPCONTACT_API_KEY'],
      config: {
        apiKey: process['env']['DROPCONTACT_API_KEY'],
        endpoint: 'https://api.dropcontact.io/batch'
      }
    });

    // Phone Lookup Providers
    this.providers.set('twilio', {
      id: 'twilio',
      name: 'Twilio Lookup',
      type: 'phone_lookup',
      priority: 1,
      costPerCall: 0.008,
      successRate: 0.95,
      avgResponseTime: 300,
      rateLimit: { requestsPerSecond: 20, requestsPerDay: 1000000 },
      dataQualityScore: 92,
      isActive: !!(process['env']['TWILIO_ACCOUNT_SID'] && process['env']['TWILIO_AUTH_TOKEN']),
      config: {
        accountSid: process['env']['TWILIO_ACCOUNT_SID'],
        authToken: process['env']['TWILIO_AUTH_TOKEN'],
        endpoint: 'https://lookups.twilio.com/v1/PhoneNumbers'
      }
    });

    this.providers.set('lusha', {
      id: 'lusha',
      name: 'Lusha API',
      type: 'phone_lookup',
      priority: 2,
      costPerCall: 0.08,
      successRate: 0.78,
      avgResponseTime: 800,
      rateLimit: { requestsPerSecond: 5, requestsPerDay: 10800 },
      dataQualityScore: 80,
      isActive: !!process['env']['LUSHA_API_KEY'],
      config: {
        apiKey: process['env']['LUSHA_API_KEY'],
        endpoint: 'https://api.lusha.co/person'
      }
    });

    // Technographics Provider
    this.providers.set('wappalyzer', {
      id: 'wappalyzer',
      name: 'Wappalyzer',
      type: 'technographics',
      priority: 1,
      costPerCall: 0.0225,
      successRate: 0.90,
      avgResponseTime: 1000,
      rateLimit: { requestsPerSecond: 3, requestsPerDay: 50000 },
      dataQualityScore: 87,
      isActive: !!process['env']['WAPPALYZER_API_KEY'],
      config: {
        apiKey: process['env']['WAPPALYZER_API_KEY'],
        endpoint: 'https://api.wappalyzer.com/lookup/v2'
      }
    });

    // Signals Provider
    this.providers.set('crustdata', {
      id: 'crustdata',
      name: 'Crustdata Watcher',
      type: 'signals',
      priority: 1,
      costPerCall: 0.05, // Quote-based, estimated
      successRate: 0.85,
      avgResponseTime: 2000,
      rateLimit: { requestsPerSecond: 1, requestsPerDay: 1000 },
      dataQualityScore: 90,
      isActive: !!process['env']['CRUSTDATA_API_KEY'],
      config: {
        apiKey: process['env']['CRUSTDATA_API_KEY'],
        endpoint: 'https://api.crustdata.com/watcher'
      }
    });

    // Company Data Provider
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
      isActive: !!process['env']['CORESIGNAL_API_KEY'],
      config: {
        apiKey: process['env']['CORESIGNAL_API_KEY'],
        endpoint: 'https://api.coresignal.com/v1/company/search'
      }
    });
  }

  // Provider-specific implementations (modular and scalable)
  private async callZeroBounce(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(`${provider['config']['endpoint']}?api_key=${provider['config']['apiKey']}&email=${request.data.email}`);
    const data = await response.json();
    
    return {
      data: {
        email: request.data.email,
        status: data.status,
        subStatus: data.sub_status,
        freeEmail: data.free_email,
        didYouMean: data.did_you_mean,
        account: data.account,
        domain: data.domain,
        domainAgeDays: data.domain_age_days,
        smtpProvider: data.smtp_provider
      },
      confidence: this.mapZeroBounceConfidence(data.status),
      creditsUsed: 1
    };
  }

  private async callMyEmailVerifier(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(provider['config']['endpoint'], {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider['config']['apiKey']}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: request.data.email })
    });
    const data = await response.json();
    
    return {
      data: {
        email: request.data.email,
        status: data.status,
        reason: data.reason,
        disposable: data.disposable,
        roleAccount: data.role_account
      },
      confidence: this.mapMyEmailVerifierConfidence(data.status),
      creditsUsed: 1
    };
  }

  private async callProspeo(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(provider['config']['endpoint'], {
      method: 'POST',
      headers: {
        'X-KEY': provider['config']['apiKey'],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: request.data.firstName,
        last_name: request.data.lastName,
        company: request.data.company
      })
    });
    const data = await response.json();
    
    return {
      data: {
        email: data.email,
        verified: data.verified,
        sources: data.sources
      },
      confidence: data.verified ? 90 : 60,
      creditsUsed: 1
    };
  }

  private async callDropcontact(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(provider['config']['endpoint'], {
      method: 'POST',
      headers: {
        'X-Access-Token': provider['config']['apiKey'],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [{
          first_name: request.data.firstName,
          last_name: request.data.lastName,
          company: request.data.company,
          website: request.data.domain
        }]
      })
    });
    const data = await response.json();
    
    return {
      data: data['data'][0] || {},
      confidence: data['data'][0]?.email ? 85 : 0,
      creditsUsed: 1
    };
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

  private async callLusha(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(provider['config']['endpoint'], {
      method: 'POST',
      headers: {
        'api_key': provider['config']['apiKey'],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: request.data.firstName,
        lastName: request.data.lastName,
        company: request.data.company
      })
    });
    const data = await response.json();
    
    return {
      data: {
        phoneNumbers: data.phoneNumbers || [],
        emails: data.emails || []
      },
      confidence: (data.phoneNumbers?.length || 0) > 0 ? 80 : 0,
      creditsUsed: 1
    };
  }

  private async callWappalyzer(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(`${provider['config']['endpoint']}/?urls=${request.data.domain}`, {
      headers: {
        'x-api-key': provider['config']['apiKey']
      }
    });
    const data = await response.json();
    
    return {
      data: {
        technologies: data[0]?.technologies || [],
        categories: data[0]?.categories || []
      },
      confidence: (data[0]?.technologies?.length || 0) > 0 ? 88 : 0,
      creditsUsed: 1
    };
  }

  private async callCrustdata(provider: EnrichmentProvider, request: EnrichmentRequest): Promise<any> {
    const response = await fetch(provider['config']['endpoint'], {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider['config']['apiKey']}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: request.data.company,
        domain: request.data.domain
      })
    });
    const data = await response.json();
    
    return {
      data: {
        signals: data.signals || [],
        events: data.events || []
      },
      confidence: (data.signals?.length || 0) > 0 ? 85 : 0,
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

  // Helper methods
  private mapZeroBounceConfidence(status: string): number {
    const confidenceMap: Record<string, number> = {
      'valid': 95,
      'invalid': 5,
      'catch-all': 70,
      'unknown': 50,
      'spamtrap': 0,
      'abuse': 0,
      'do_not_mail': 0
    };
    return confidenceMap[status] || 50;
  }

  private mapMyEmailVerifierConfidence(status: string): number {
    const confidenceMap: Record<string, number> = {
      'valid': 98,
      'invalid': 2,
      'unknown': 50,
      'disposable': 10,
      'role': 60
    };
    return confidenceMap[status] || 50;
  }

  private async updateProviderMetrics(providerId: string, result: Partial<EnrichmentResult>): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    // Update success rate with exponential moving average
    const alpha = 0.1; // Learning rate
    provider['successRate'] = provider.successRate * (1 - alpha) + (result.success ? 1 : 0) * alpha;
    
    // Update average response time
    if (result.responseTime) {
      provider['avgResponseTime'] = provider.avgResponseTime * (1 - alpha) + result.responseTime * alpha;
    }

    // Update data quality score
    if (result.qualityScore) {
      provider['dataQualityScore'] = provider.dataQualityScore * (1 - alpha) + result.qualityScore * alpha;
    }
  }

  private async cacheResult(request: EnrichmentRequest, result: EnrichmentResult): Promise<void> {
    // Implementation would cache to Redis or similar
    console.log(`💾 Caching result for ${request.id}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📊 GET SYSTEM ANALYTICS
   */
  getAnalytics(): {
    providers: Array<{
      id: string;
      name: string;
      successRate: number;
      avgResponseTime: number;
      dataQualityScore: number;
      costPerCall: number;
    }>;
    totalRequests: number;
    totalCost: number;
    avgQualityScore: number;
  } {
    const providers = Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      successRate: Math.round(p.successRate * 100),
      avgResponseTime: Math.round(p.avgResponseTime),
      dataQualityScore: Math.round(p.dataQualityScore),
      costPerCall: p.costPerCall
    }));

    return {
      providers,
      totalRequests: 0, // Would track in production
      totalCost: 0, // Would track in production
      avgQualityScore: providers.reduce((sum, p) => sum + p.dataQualityScore, 0) / providers.length
    };
  }
}

/**
 * 🧠 ML PROVIDER SELECTOR
 * Machine learning for optimal provider selection
 */
class MLProviderSelector {
  async predictProviderSuccess(
    request: EnrichmentRequest, 
    providers: EnrichmentProvider[]
  ): Promise<Array<{ providerId: string; successProbability: number }>> {
    // Simplified ML prediction - in production would use trained model
    return providers.map(provider => ({
      providerId: provider.id,
      successProbability: provider.successRate * provider.dataQualityScore / 100
    })).sort((a, b) => b.successProbability - a.successProbability);
  }

  async updateWithSuccess(
    request: EnrichmentRequest, 
    result: EnrichmentResult, 
    attemptedProviders: string[]
  ): Promise<void> {
    // Update ML model with successful pattern
    console.log(`🧠 ML: Updating model with success pattern for ${request.type}`);
  }
}

/**
 * 📊 DATA QUALITY MONITOR
 * Real-time data quality assessment
 */
class DataQualityMonitor {
  async calculateQualityScore(result: any, request: EnrichmentRequest): Promise<number> {
    let score = 0;
    let factors = 0;

    // Completeness check
    const dataKeys = Object.keys(result.data || {});
    if (dataKeys.length > 0) {
      score += 25;
      factors++;
    }

    // Freshness check (simplified)
    score += 25;
    factors++;

    // Consistency check (would compare across providers)
    score += 25;
    factors++;

    // Format validation
    if (request['type'] === 'email_verification' && result.data?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(result.data.email)) {
        score += 25;
      }
    } else {
      score += 20; // Default for other types
    }
    factors++;

    return Math.round(score / factors);
  }
}

/**
 * 💰 COST OPTIMIZER
 * Intelligent cost optimization for provider selection
 */
class CostOptimizer {
  optimizeSequence(
    providers: EnrichmentProvider[],
    mlPredictions: Array<{ providerId: string; successProbability: number }>,
    maxCost: number
  ): EnrichmentProvider[] {
    // Calculate cost-effectiveness score
    const scoredProviders = providers.map(provider => {
      const prediction = mlPredictions.find(p => p['providerId'] === provider.id);
      const successProb = prediction?.successProbability || provider.successRate;
      const costEffectiveness = successProb / provider.costPerCall;
      
      return {
        provider,
        score: costEffectiveness,
        expectedCost: provider.costPerCall / successProb
      };
    });

    // Sort by cost-effectiveness and filter by budget
    return scoredProviders
      .sort((a, b) => b.score - a.score)
      .filter(item => item.expectedCost <= maxCost)
      .map(item => item.provider);
  }

  /**
   * Get all providers for health checks and monitoring
   */
  getProviders(): Map<string, EnrichmentProvider> {
    return new Map(this.providers);
  }

  /**
   * 🧠 INTELLIGENT PROVIDER SEQUENCE DETERMINATION
   * Implements optimal waterfall based on document specifications
   */
  private async determineOptimalProviderSequence(request: EnrichmentRequest): Promise<EnrichmentProvider[]> {
    const providers: EnrichmentProvider[] = [];
    
    switch (request.type) {
      case 'email_verification':
        // If email present → Verify with ZeroBounce (preferred) or MyEmailVerifier
        if (request.data.email) {
          const zerobounce = this.providers.get('zerobounce');
          const myemailverifier = this.providers.get('myemailverifier');
          
          // ZeroBounce preferred for security/compliance + cheaper at lower volumes
          if (zerobounce?.isActive) providers.push(zerobounce);
          if (myemailverifier?.isActive) providers.push(myemailverifier);
        }
        break;
        
      case 'email_finding':
        // If email missing → Prospeo → else Dropcontact
        const prospeo = this.providers.get('prospeo');
        const dropcontact = this.providers.get('dropcontact');
        
        if (prospeo?.isActive) providers.push(prospeo);
        if (dropcontact?.isActive) providers.push(dropcontact);
        break;
        
      case 'phone_lookup':
        // Phones → Twilio Lookup first → For mobiles (if not on Twilio), hit Lusha API
        const twilio = this.providers.get('twilio');
        const lusha = this.providers.get('lusha');
        
        if (twilio?.isActive) providers.push(twilio);
        if (lusha?.isActive) providers.push(lusha); // For buyer group only
        break;
        
      case 'technographics':
        // Wappalyzer for engaged buyer groups only (cost effective)
        const wappalyzer = this.providers.get('wappalyzer');
        if (wappalyzer?.isActive) providers.push(wappalyzer);
        break;
        
      case 'signals':
        // Crustdata Watcher for tracked buyer group
        const crustdata = this.providers.get('crustdata');
        if (crustdata?.isActive) providers.push(crustdata);
        break;
        
      default:
        // Fallback to all active providers of the requested type
        for (const provider of this.providers.values()) {
          if (provider['type'] === request['type'] && provider.isActive) {
            providers.push(provider);
          }
        }
    }
    
    // Sort by priority and data quality score
    return providers.sort((a, b) => {
      // First by priority (lower = higher priority)
      if (a.priority !== b.priority) return a.priority - b.priority;
      // Then by data quality score (higher = better)
      return b.dataQualityScore - a.dataQualityScore;
    });
  }

  /**
   * 🎯 INTELLIGENT DATA FRESHNESS VALIDATION
   * Ensures most recent data wins with timestamp validation
   */
  private async validateDataFreshness(results: EnrichmentResult[]): Promise<EnrichmentResult> {
    if (results['length'] === 0) {
      throw new Error('No results to validate');
    }
    
    if (results['length'] === 1) {
      return results[0];
    }
    
    console.log(`🕐 Validating data freshness across ${results.length} results`);
    
    // Score each result based on multiple factors
    const scoredResults = results.map(result => {
      let score = 0;
      
      // 1. Confidence score (40% weight)
      score += result.confidence * 0.4;
      
      // 2. Data quality score (30% weight)
      score += result.qualityScore * 0.3;
      
      // 3. Freshness score (20% weight) - newer is better
      const ageHours = (Date.now() - new Date(result.metadata.timestamp).getTime()) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 100 - (ageHours / 24) * 10); // Decay over days
      score += freshnessScore * 0.2;
      
      // 4. Provider reliability (10% weight)
      const provider = this.providers.get(result.provider);
      const reliabilityScore = provider ? provider.successRate * 100 : 50;
      score += reliabilityScore * 0.1;
      
      return { result, score, freshnessScore, reliabilityScore };
    });
    
    // Sort by total score (highest first)
    scoredResults.sort((a, b) => b.score - a.score);
    
    const winner = scoredResults[0];
    console.log(`🏆 Best result: ${winner.result.provider} (score: ${winner.score.toFixed(1)})`);
    
    return winner.result;
  }

  /**
   * 🤖 PERPLEXITY API FALLBACK
   * For complex queries that need additional context
   */
  private async queryPerplexityAPI(query: string, context: any): Promise<any> {
    if (!this.perplexityApiKey) {
      console.log('⚠️ Perplexity API key not configured');
      return null;
    }
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a data enrichment assistant. Provide accurate, up-to-date information about people and companies.'
            },
            {
              role: 'user',
              content: `${query}\n\nContext: ${JSON.stringify(context, null, 2)}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data['choices'][0]?.message?.content;
      } else {
        console.error('Perplexity API error:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Perplexity API request failed:', error);
      return null;
    }
  }
}
