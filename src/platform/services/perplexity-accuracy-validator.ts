/**
 * 🔍 PERPLEXITY-POWERED ACCURACY VALIDATOR
 * 
 * Uses Perplexity API for real-time validation of person, company, and role data
 * against current web information for maximum accuracy
 */

export interface PerplexityValidationRequest {
  type: 'person' | 'company' | 'role' | 'contact';
  data: {
    name?: string;
    company?: string;
    title?: string;
    email?: string;
    phone?: string;
    website?: string;
    linkedin?: string;
    location?: string;
  };
  context?: {
    expectedName?: string;
    expectedCompany?: string;
    expectedTitle?: string;
    expectedLocation?: string;
    verificationLevel?: 'basic' | 'comprehensive' | 'deep';
  };
}

export interface PerplexityValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  validationChecks: {
    nameMatch: boolean;
    companyMatch: boolean;
    titleMatch: boolean;
    locationMatch: boolean;
    linkedinMatch: boolean;
    websiteMatch: boolean;
    currentEmployment: boolean;
  };
  findings: {
    currentTitle?: string;
    currentCompany?: string;
    lastUpdated?: string;
    linkedinProfile?: string;
    companyWebsite?: string;
    alternativeNames?: string[];
    potentialMatches?: Array<{
      name: string;
      company: string;
      title: string;
      confidence: number;
    }>;
  };
  sources: string[];
  warnings: string[];
  recommendations: string[];
  metadata: {
    queryTime: number;
    tokensUsed: number;
    cost: number;
    timestamp: string;
  };
}

export class PerplexityAccuracyValidator {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  private model = 'sonar-pro'; // Best model for real-time web data

  constructor(apiKey?: string) {
    this['apiKey'] = apiKey || process['env']['PERPLEXITY_API_KEY'] || '';
    if (!this.apiKey) {
      throw new Error('Perplexity API key is required');
    }
  }

  /**
   * Validate person data against current web information
   */
  async validatePerson(request: PerplexityValidationRequest): Promise<PerplexityValidationResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildPersonValidationQuery(request);
      const response = await this.callPerplexityAPI(query);
      
      return this.parsePersonValidationResponse(response, request, startTime);
      
    } catch (error) {
      console.error('[Perplexity Validator] Person validation error:', error);
      return this.createErrorResult(error, startTime);
    }
  }

  /**
   * Validate company data against current web information
   */
  async validateCompany(request: PerplexityValidationRequest): Promise<PerplexityValidationResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildCompanyValidationQuery(request);
      const response = await this.callPerplexityAPI(query);
      
      return this.parseCompanyValidationResponse(response, request, startTime);
      
    } catch (error) {
      console.error('[Perplexity Validator] Company validation error:', error);
      return this.createErrorResult(error, startTime);
    }
  }

  /**
   * Validate role/title accuracy for a person at a company
   */
  async validateRole(request: PerplexityValidationRequest): Promise<PerplexityValidationResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildRoleValidationQuery(request);
      const response = await this.callPerplexityAPI(query);
      
      return this.parseRoleValidationResponse(response, request, startTime);
      
    } catch (error) {
      console.error('[Perplexity Validator] Role validation error:', error);
      return this.createErrorResult(error, startTime);
    }
  }

  /**
   * Validate contact information (email, phone, LinkedIn)
   */
  async validateContact(request: PerplexityValidationRequest): Promise<PerplexityValidationResult> {
    const startTime = Date.now();
    
    try {
      const query = this.buildContactValidationQuery(request);
      const response = await this.callPerplexityAPI(query);
      
      return this.parseContactValidationResponse(response, request, startTime);
      
    } catch (error) {
      console.error('[Perplexity Validator] Contact validation error:', error);
      return this.createErrorResult(error, startTime);
    }
  }

  /**
   * Build person validation query for Perplexity
   */
  private buildPersonValidationQuery(request: PerplexityValidationRequest): string {
    const { name, company, title, location } = request.data;
    const verificationLevel = request.context?.verificationLevel || 'comprehensive';
    
    let query = `Verify the current employment and role information for ${name}`;
    
    if (company) {
      query += ` at ${company}`;
    }
    
    if (title) {
      query += ` with the title "${title}"`;
    }
    
    if (location) {
      query += ` located in ${location}`;
    }
    
    query += '. Please provide:';
    query += '\n1. Current job title and company';
    query += '\n2. LinkedIn profile URL if available';
    query += '\n3. When this information was last updated';
    query += '\n4. Any recent job changes or promotions';
    
    if (verificationLevel === 'deep') {
      query += '\n5. Professional background and career history';
      query += '\n6. Education and certifications';
      query += '\n7. Recent professional activities or news mentions';
    }
    
    query += '\n\nFormat the response as structured data with confidence levels for each piece of information.';
    
    return query;
  }

  /**
   * Build company validation query for Perplexity
   */
  private buildCompanyValidationQuery(request: PerplexityValidationRequest): string {
    const { name, website, location } = request.data;
    
    let query = `Verify current information about the company "${name}"`;
    
    if (website) {
      query += ` with website ${website}`;
    }
    
    if (location) {
      query += ` located in ${location}`;
    }
    
    query += '. Please provide:';
    query += '\n1. Official company name and any name variations';
    query += '\n2. Current website URL';
    query += '\n3. HQ Location';
    query += '\n4. Industry and business description';
    query += '\n5. Approximate employee count';
    query += '\n6. Recent news or significant changes';
    query += '\n7. LinkedIn company page URL';
    
    query += '\n\nFormat the response as structured data with confidence levels.';
    
    return query;
  }

  /**
   * Build role validation query for Perplexity
   */
  private buildRoleValidationQuery(request: PerplexityValidationRequest): string {
    const { name, company, title } = request.data;
    
    let query = `Verify if ${name} currently holds the position of "${title}" at ${company}. Please check:`;
    query += '\n1. Current job title (exact wording)';
    query += '\n2. Start date in this role';
    query += '\n3. Previous roles at the same company';
    query += '\n4. Reporting structure if available';
    query += '\n5. Recent promotions or role changes';
    query += '\n6. LinkedIn profile confirmation';
    
    query += '\n\nProvide confidence level for the role verification and note any discrepancies.';
    
    return query;
  }

  /**
   * Build contact validation query for Perplexity
   */
  private buildContactValidationQuery(request: PerplexityValidationRequest): string {
    const { name, company, email, phone, linkedin } = request.data;
    
    let query = `Verify contact information for ${name}`;
    
    if (company) {
      query += ` at ${company}`;
    }
    
    query += '. Please check:';
    
    if (email) {
      query += `\n1. Email address ${email} - verify if it's current and valid`;
    }
    
    if (phone) {
      query += `\n2. Phone number ${phone} - verify if it's current`;
    }
    
    if (linkedin) {
      query += `\n3. LinkedIn profile ${linkedin} - verify if it matches the person`;
    }
    
    query += '\n4. Any publicly available contact information';
    query += '\n5. Professional social media profiles';
    query += '\n6. Company directory listings';
    
    query += '\n\nNote: Only provide information that is publicly available and respect privacy.';
    
    return query;
  }

  /**
   * Call Perplexity API with the constructed query
   */
  private async callPerplexityAPI(query: string): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional data verification assistant. Provide accurate, up-to-date information from reliable sources. Always include confidence levels and source citations. Respect privacy and only use publicly available information.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1, // Low temperature for factual accuracy
        max_tokens: 1000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data['choices'][0]) {
      throw new Error('Invalid response from Perplexity API');
    }

    return data;
  }

  /**
   * Parse person validation response from Perplexity
   */
  private parsePersonValidationResponse(
    response: any, 
    request: PerplexityValidationRequest, 
    startTime: number
  ): PerplexityValidationResult {
    const content = response['choices'][0].message.content;
    const usage = response.usage;
    
    // Extract structured information from the response
    // This is a simplified parser - in production, you'd want more sophisticated parsing
    const nameMatch = this.extractConfidence(content, 'name');
    const companyMatch = this.extractConfidence(content, 'company');
    const titleMatch = this.extractConfidence(content, 'title');
    const locationMatch = this.extractConfidence(content, 'location');
    
    const overallConfidence = Math.round((nameMatch + companyMatch + titleMatch) / 3);
    
    return {
      isValid: overallConfidence >= 70,
      confidence: overallConfidence,
      validationChecks: {
        nameMatch: nameMatch >= 70,
        companyMatch: companyMatch >= 70,
        titleMatch: titleMatch >= 70,
        locationMatch: locationMatch >= 70,
        linkedinMatch: content.toLowerCase().includes('linkedin'),
        websiteMatch: false, // Not applicable for person validation
        currentEmployment: companyMatch >= 70 && titleMatch >= 70
      },
      findings: {
        currentTitle: this.extractCurrentTitle(content),
        currentCompany: this.extractCurrentCompany(content),
        lastUpdated: this.extractLastUpdated(content),
        linkedinProfile: this.extractLinkedInProfile(content)
      },
      sources: this.extractSources(content),
      warnings: this.extractWarnings(content, overallConfidence),
      recommendations: this.generateRecommendations(overallConfidence, request),
      metadata: {
        queryTime: Date.now() - startTime,
        tokensUsed: usage?.total_tokens || 0,
        cost: this.calculateCost(usage?.total_tokens || 0),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Parse company validation response from Perplexity
   */
  private parseCompanyValidationResponse(
    response: any, 
    request: PerplexityValidationRequest, 
    startTime: number
  ): PerplexityValidationResult {
    const content = response['choices'][0].message.content;
    const usage = response.usage;
    
    const nameMatch = this.extractConfidence(content, 'company name');
    const websiteMatch = this.extractConfidence(content, 'website');
    const locationMatch = this.extractConfidence(content, 'location');
    
    const overallConfidence = Math.round((nameMatch + websiteMatch + locationMatch) / 3);
    
    return {
      isValid: overallConfidence >= 70,
      confidence: overallConfidence,
      validationChecks: {
        nameMatch: nameMatch >= 70,
        companyMatch: true, // Same as nameMatch for companies
        titleMatch: false, // Not applicable
        locationMatch: locationMatch >= 70,
        linkedinMatch: content.toLowerCase().includes('linkedin'),
        websiteMatch: websiteMatch >= 70,
        currentEmployment: false // Not applicable
      },
      findings: {
        companyWebsite: this.extractWebsite(content),
        alternativeNames: this.extractAlternativeNames(content),
        lastUpdated: this.extractLastUpdated(content)
      },
      sources: this.extractSources(content),
      warnings: this.extractWarnings(content, overallConfidence),
      recommendations: this.generateRecommendations(overallConfidence, request),
      metadata: {
        queryTime: Date.now() - startTime,
        tokensUsed: usage?.total_tokens || 0,
        cost: this.calculateCost(usage?.total_tokens || 0),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Parse role validation response from Perplexity
   */
  private parseRoleValidationResponse(
    response: any, 
    request: PerplexityValidationRequest, 
    startTime: number
  ): PerplexityValidationResult {
    const content = response['choices'][0].message.content;
    const usage = response.usage;
    
    const titleMatch = this.extractConfidence(content, 'title');
    const companyMatch = this.extractConfidence(content, 'company');
    const currentRole = this.extractConfidence(content, 'current');
    
    const overallConfidence = Math.round((titleMatch + companyMatch + currentRole) / 3);
    
    return {
      isValid: overallConfidence >= 70,
      confidence: overallConfidence,
      validationChecks: {
        nameMatch: true, // Assumed if we're validating role
        companyMatch: companyMatch >= 70,
        titleMatch: titleMatch >= 70,
        locationMatch: false, // Not primary focus
        linkedinMatch: content.toLowerCase().includes('linkedin'),
        websiteMatch: false, // Not applicable
        currentEmployment: currentRole >= 70
      },
      findings: {
        currentTitle: this.extractCurrentTitle(content),
        currentCompany: this.extractCurrentCompany(content),
        lastUpdated: this.extractLastUpdated(content)
      },
      sources: this.extractSources(content),
      warnings: this.extractWarnings(content, overallConfidence),
      recommendations: this.generateRecommendations(overallConfidence, request),
      metadata: {
        queryTime: Date.now() - startTime,
        tokensUsed: usage?.total_tokens || 0,
        cost: this.calculateCost(usage?.total_tokens || 0),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Parse contact validation response from Perplexity
   */
  private parseContactValidationResponse(
    response: any, 
    request: PerplexityValidationRequest, 
    startTime: number
  ): PerplexityValidationResult {
    const content = response['choices'][0].message.content;
    const usage = response.usage;
    
    const emailMatch = this.extractConfidence(content, 'email');
    const phoneMatch = this.extractConfidence(content, 'phone');
    const linkedinMatch = this.extractConfidence(content, 'linkedin');
    
    const overallConfidence = Math.round((emailMatch + phoneMatch + linkedinMatch) / 3);
    
    return {
      isValid: overallConfidence >= 70,
      confidence: overallConfidence,
      validationChecks: {
        nameMatch: true, // Assumed
        companyMatch: true, // Assumed
        titleMatch: false, // Not primary focus
        locationMatch: false, // Not primary focus
        linkedinMatch: linkedinMatch >= 70,
        websiteMatch: false, // Not applicable
        currentEmployment: false // Not primary focus
      },
      findings: {
        linkedinProfile: this.extractLinkedInProfile(content),
        lastUpdated: this.extractLastUpdated(content)
      },
      sources: this.extractSources(content),
      warnings: this.extractWarnings(content, overallConfidence),
      recommendations: this.generateRecommendations(overallConfidence, request),
      metadata: {
        queryTime: Date.now() - startTime,
        tokensUsed: usage?.total_tokens || 0,
        cost: this.calculateCost(usage?.total_tokens || 0),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Helper methods for parsing response content
   */
  private extractConfidence(content: string, field: string): number {
    // Simple pattern matching - in production, use more sophisticated NLP
    const patterns = [
      new RegExp(`${field}.*confidence.*?(\\d+)%`, 'i'),
      new RegExp(`${field}.*?(\\d+)%.*confidence`, 'i'),
      new RegExp(`(\\d+)%.*${field}`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // Default confidence based on content analysis
    if (content.toLowerCase().includes(field.toLowerCase())) {
      if (content.toLowerCase().includes('confirmed') || content.toLowerCase().includes('verified')) {
        return 85;
      } else if (content.toLowerCase().includes('likely') || content.toLowerCase().includes('appears')) {
        return 70;
      } else if (content.toLowerCase().includes('possible') || content.toLowerCase().includes('may')) {
        return 50;
      }
    }
    
    return 30; // Low confidence if no clear indicators
  }

  private extractCurrentTitle(content: string): string | undefined {
    const patterns = [
      /current title[:\s]+([^\n]+)/i,
      /currently[:\s]+([^\n]+)/i,
      /title[:\s]+([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  private extractCurrentCompany(content: string): string | undefined {
    const patterns = [
      /current company[:\s]+([^\n]+)/i,
      /works at[:\s]+([^\n]+)/i,
      /employed by[:\s]+([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  private extractLastUpdated(content: string): string | undefined {
    const patterns = [
      /last updated[:\s]+([^\n]+)/i,
      /updated[:\s]+([^\n]+)/i,
      /as of[:\s]+([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  private extractLinkedInProfile(content: string): string | undefined {
    const pattern = /linkedin\.com\/in\/[^\s\n]+/i;
    const match = content.match(pattern);
    return match ? match[0] : undefined;
  }

  private extractWebsite(content: string): string | undefined {
    const patterns = [
      /website[:\s]+(https?:\/\/[^\s\n]+)/i,
      /url[:\s]+(https?:\/\/[^\s\n]+)/i,
      /(https?:\/\/[^\s\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }

  private extractAlternativeNames(content: string): string[] {
    const patterns = [
      /also known as[:\s]+([^\n]+)/i,
      /alternative names?[:\s]+([^\n]+)/i,
      /variations?[:\s]+([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].split(',').map(name => name.trim());
      }
    }
    
    return [];
  }

  private extractSources(content: string): string[] {
    const sources = [];
    
    if (content.includes('LinkedIn')) sources.push('LinkedIn');
    if (content.includes('company website')) sources.push('Company Website');
    if (content.includes('news')) sources.push('News Articles');
    if (content.includes('press release')) sources.push('Press Releases');
    if (content.includes('directory')) sources.push('Business Directory');
    
    return sources.length > 0 ? sources : ['Web Search'];
  }

  private extractWarnings(content: string, confidence: number): string[] {
    const warnings = [];
    
    if (confidence < 50) {
      warnings.push('Low confidence in data accuracy');
    }
    
    if (content.toLowerCase().includes('outdated')) {
      warnings.push('Information may be outdated');
    }
    
    if (content.toLowerCase().includes('conflicting')) {
      warnings.push('Conflicting information found');
    }
    
    if (content.toLowerCase().includes('no longer')) {
      warnings.push('Person may no longer be in this role');
    }
    
    return warnings;
  }

  private generateRecommendations(confidence: number, request: PerplexityValidationRequest): string[] {
    const recommendations = [];
    
    if (confidence < 70) {
      recommendations.push('Verify information through additional sources');
    }
    
    if (confidence < 50) {
      recommendations.push('Consider this data unreliable for outreach');
    }
    
    if (request['type'] === 'person' && !request.data.linkedin) {
      recommendations.push('Search for LinkedIn profile for verification');
    }
    
    if (request['type'] === 'company' && !request.data.website) {
      recommendations.push('Verify company website for accuracy');
    }
    
    return recommendations;
  }

  private calculateCost(tokens: number): number {
    // Perplexity pricing: approximately $0.001 per 1K tokens for sonar-pro
    return (tokens / 1000) * 0.001;
  }

  private createErrorResult(error: any, startTime: number): PerplexityValidationResult {
    return {
      isValid: false,
      confidence: 0,
      validationChecks: {
        nameMatch: false,
        companyMatch: false,
        titleMatch: false,
        locationMatch: false,
        linkedinMatch: false,
        websiteMatch: false,
        currentEmployment: false
      },
      findings: {},
      sources: [],
      warnings: [`Validation failed: ${error.message}`],
      recommendations: ['Try again later or use alternative validation methods'],
      metadata: {
        queryTime: Date.now() - startTime,
        tokensUsed: 0,
        cost: 0,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
export const perplexityValidator = new PerplexityAccuracyValidator();


