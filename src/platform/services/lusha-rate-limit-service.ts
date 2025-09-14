/**
 * 🔍 LUSHA API SERVICE WITH RATE LIMIT MONITORING
 * 
 * Enhanced Lusha API integration that properly handles rate limits
 * based on official Lusha API documentation.
 * 
 * Rate Limits (from Lusha docs):
 * - General: 25 requests/second per endpoint
 * - Credit Usage API: 5 requests/minute
 * - Daily limits vary by billing plan
 * 
 * Headers monitored:
 * - x-rate-limit-daily: Total daily requests allowed
 * - x-daily-requests-left: Remaining daily requests
 * - x-daily-usage: Current daily usage
 * - x-rate-limit-hourly: Total hourly requests allowed
 * - x-hourly-requests-left: Remaining hourly requests
 * - x-hourly-usage: Current hourly usage
 * - x-rate-limit-minute: Total per-minute requests allowed
 * - x-minute-requests-left: Remaining minute requests
 * - x-minute-usage: Current minute usage
 */

interface LushaRateLimitInfo {
  daily: {
    limit: number | null;
    remaining: number | null;
    usage: number | null;
  };
  hourly: {
    limit: number | null;
    remaining: number | null;
    usage: number | null;
  };
  minute: {
    limit: number | null;
    remaining: number | null;
    usage: number | null;
  };
  lastChecked: string;
  retryAfter?: string | null;
}

interface LushaPersonRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  companyName?: string;
  companyDomain?: string;
  linkedinUrl?: string;
  refreshJobInfo?: boolean;
  revealEmails?: boolean;
  revealPhones?: boolean;
}

interface LushaPersonResponse {
  fullName?: string;
  emailAddresses?: Array<{ email: string; type?: string }>;
  phoneNumbers?: Array<{ number: string; type?: string }>;
  jobTitle?: string;
  company?: {
    name: string;
    domain: string;
  };
  linkedinUrl?: string;
}

interface LushaUsageResponse {
  creditsUsed?: number;
  creditsRemaining?: number;
  planType?: string;
  billingPeriod?: string;
}

export class LushaRateLimitService {
  private apiKey: string;
  private baseUrl = 'https://api.lusha.com';
  private rateLimitInfo: LushaRateLimitInfo = {
    daily: { limit: null, remaining: null, usage: null },
    hourly: { limit: null, remaining: null, usage: null },
    minute: { limit: null, remaining: null, usage: null },
    lastChecked: new Date().toISOString()
  };
  
  // Rate limiting configuration
  private readonly RATE_LIMITS = {
    REQUESTS_PER_SECOND: 25,
    USAGE_API_REQUESTS_PER_MINUTE: 5,
    MIN_DELAY_BETWEEN_REQUESTS: 40, // 40ms = 25 requests/second
    MAX_RETRIES: 3,
    EXPONENTIAL_BACKOFF_BASE: 1000 // 1 second base delay
  };

  constructor(apiKey?: string) {
    this['apiKey'] = apiKey || process['env']['LUSHA_API_KEY'] || '';
    if (!this.apiKey) {
      throw new Error('Lusha API key is required. Set LUSHA_API_KEY environment variable.');
    }
  }

  /**
   * 📊 GET ACCOUNT USAGE
   */
  async getAccountUsage(): Promise<LushaUsageResponse | null> {
    try {
      const response = await this.makeRequest('/account/usage', 'GET');
      
      if (response.ok) {
        const data = await response.json();
        this.extractRateLimitHeaders(response);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Lusha account usage:', error);
      return null;
    }
  }

  /**
   * 👤 PERSON ENRICHMENT
   */
  async enrichPerson(request: LushaPersonRequest): Promise<LushaPersonResponse | null> {
    // Check if we're approaching rate limits
    if (this.isNearRateLimit()) {
      console.warn('⚠️ Lusha: Near rate limit, skipping request');
      return null;
    }

    try {
      const params = new URLSearchParams();
      
      if (request.firstName) params['append']('firstName', request.firstName);
      if (request.lastName) params['append']('lastName', request.lastName);
      if (request.email) params['append']('email', request.email);
      if (request.companyName) params['append']('companyName', request.companyName);
      if (request.companyDomain) params['append']('companyDomain', request.companyDomain);
      if (request.linkedinUrl) params['append']('linkedinUrl', request.linkedinUrl);
      if (request.refreshJobInfo) params['append']('refreshJobInfo', 'true');
      if (request.revealEmails) params['append']('revealEmails', 'true');
      if (request.revealPhones) params['append']('revealPhones', 'true');

      const response = await this.makeRequest(`/v2/person?${params}`, 'GET');
      
      if (response.ok) {
        const data = await response.json();
        this.extractRateLimitHeaders(response);
        return data;
      }
      
      // Handle specific error cases
      if (response['status'] === 429) {
        console.warn('🚨 Lusha rate limit exceeded');
        this.extractRateLimitHeaders(response);
      }
      
      return null;
    } catch (error) {
      console.error('Error enriching person with Lusha:', error);
      return null;
    }
  }

  /**
   * 🏢 COMPANY ENRICHMENT
   */
  async enrichCompany(domain: string): Promise<any | null> {
    if (this.isNearRateLimit()) {
      console.warn('⚠️ Lusha: Near rate limit, skipping company request');
      return null;
    }

    try {
      const params = new URLSearchParams({ domain });
      const response = await this.makeRequest(`/v2/company?${params}`, 'GET');
      
      if (response.ok) {
        const data = await response.json();
        this.extractRateLimitHeaders(response);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error enriching company with Lusha:', error);
      return null;
    }
  }

  /**
   * 🌐 MAKE HTTP REQUEST WITH RATE LIMITING
   */
  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    body?: any,
    retryCount = 0
  ): Promise<Response> {
    
    // Respect rate limits
    await this.respectRateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'api_key': this.apiKey,
        'Content-Type': 'application/json'
      }
    };

    if (body && method === 'POST') {
      options['body'] = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      // Handle rate limiting with exponential backoff
      if (response['status'] === 429 && retryCount < this.RATE_LIMITS.MAX_RETRIES) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : this.RATE_LIMITS.EXPONENTIAL_BACKOFF_BASE * Math.pow(2, retryCount);
        
        console.log(`⏰ Lusha rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, method, body, retryCount + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (retryCount < this.RATE_LIMITS.MAX_RETRIES) {
        const delay = this.RATE_LIMITS.EXPONENTIAL_BACKOFF_BASE * Math.pow(2, retryCount);
        console.log(`🔄 Lusha network error, retrying in ${delay}ms (attempt ${retryCount + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, method, body, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * ⏰ RESPECT RATE LIMITS
   */
  private async respectRateLimit(): Promise<void> {
    // Always wait minimum delay between requests (25 requests/second = 40ms)
    await new Promise(resolve => 
      setTimeout(resolve, this.RATE_LIMITS.MIN_DELAY_BETWEEN_REQUESTS)
    );
  }

  /**
   * 📋 EXTRACT RATE LIMIT HEADERS
   */
  private extractRateLimitHeaders(response: Response): void {
    this['rateLimitInfo'] = {
      daily: {
        limit: this.parseHeader(response.headers.get('x-rate-limit-daily')),
        remaining: this.parseHeader(response.headers.get('x-daily-requests-left')),
        usage: this.parseHeader(response.headers.get('x-daily-usage'))
      },
      hourly: {
        limit: this.parseHeader(response.headers.get('x-rate-limit-hourly')),
        remaining: this.parseHeader(response.headers.get('x-hourly-requests-left')),
        usage: this.parseHeader(response.headers.get('x-hourly-usage'))
      },
      minute: {
        limit: this.parseHeader(response.headers.get('x-rate-limit-minute')),
        remaining: this.parseHeader(response.headers.get('x-minute-requests-left')),
        usage: this.parseHeader(response.headers.get('x-minute-usage'))
      },
      lastChecked: new Date().toISOString(),
      retryAfter: response.headers.get('Retry-After')
    };
  }

  /**
   * 🔢 PARSE HEADER VALUE
   */
  private parseHeader(value: string | null): number | null {
    return value ? parseInt(value) : null;
  }

  /**
   * ⚠️ CHECK IF NEAR RATE LIMIT
   */
  private isNearRateLimit(): boolean {
    const { daily, hourly, minute } = this.rateLimitInfo;
    
    // Check daily limit (most important)
    if (daily.remaining !== null && daily.remaining < 50) {
      return true;
    }
    
    // Check hourly limit
    if (hourly.remaining !== null && hourly.remaining < 10) {
      return true;
    }
    
    // Check minute limit
    if (minute.remaining !== null && minute.remaining < 2) {
      return true;
    }
    
    return false;
  }

  /**
   * 📊 GET CURRENT RATE LIMIT STATUS
   */
  getRateLimitStatus(): LushaRateLimitInfo & {
    isNearLimit: boolean;
    dailyUsagePercent: number | null;
  } {
    const dailyUsagePercent = this.rateLimitInfo['daily']['usage'] && this.rateLimitInfo.daily.limit
      ? (this.rateLimitInfo.daily.usage / this.rateLimitInfo.daily.limit) * 100
      : null;

    return {
      ...this.rateLimitInfo,
      isNearLimit: this.isNearRateLimit(),
      dailyUsagePercent
    };
  }

  /**
   * 🎯 GET USAGE SUMMARY FOR MONITORING
   */
  getUsageSummary(): {
    dailyRemaining: number | null;
    dailyUsagePercent: number | null;
    isNearLimit: boolean;
    lastChecked: string;
    recommendations: string[];
  } {
    const status = this.getRateLimitStatus();
    const recommendations: string[] = [];

    if (status['dailyUsagePercent'] && status.dailyUsagePercent > 90) {
      recommendations.push('Consider upgrading plan - using >90% of daily limit');
    }
    
    if (status['daily']['remaining'] && status.daily.remaining < 100) {
      recommendations.push('Low daily requests remaining - implement request prioritization');
    }
    
    if (status.isNearLimit) {
      recommendations.push('Near rate limit - reduce request frequency');
    }

    return {
      dailyRemaining: status.daily.remaining,
      dailyUsagePercent: status.dailyUsagePercent,
      isNearLimit: status.isNearLimit,
      lastChecked: status.lastChecked,
      recommendations
    };
  }

  /**
   * 🔄 REFRESH RATE LIMIT INFO
   */
  async refreshRateLimitInfo(): Promise<void> {
    try {
      // Make a lightweight request to get fresh rate limit headers
      const response = await this.makeRequest('/account/usage', 'GET');
      this.extractRateLimitHeaders(response);
    } catch (error) {
      console.error('Error refreshing Lusha rate limit info:', error);
    }
  }
}

// Export singleton instance
export const lushaService = new LushaRateLimitService();
