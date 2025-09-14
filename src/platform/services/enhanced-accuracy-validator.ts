/**
 * 🎯 ENHANCED ACCURACY VALIDATOR
 * 
 * Combines multiple validation methods for maximum accuracy:
 * - Perplexity API for real-time web validation
 * - CoreSignal accuracy validation
 * - Name similarity algorithms
 * - LinkedIn profile verification
 * - Company website validation
 */

import { PerplexityAccuracyValidator, PerplexityValidationRequest, PerplexityValidationResult } from './perplexity-accuracy-validator';
import { CoreSignalAccuracyValidator } from './coresignal-accuracy-validator';

export interface EnhancedValidationRequest {
  type: 'person' | 'company' | 'role' | 'contact';
  data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    company?: string;
    title?: string;
    email?: string;
    phone?: string;
    website?: string;
    linkedin?: string;
    location?: string;
    domain?: string;
  };
  context?: {
    expectedName?: string;
    expectedCompany?: string;
    expectedTitle?: string;
    expectedLocation?: string;
    expectedWebsite?: string;
    expectedLinkedin?: string;
    verificationLevel?: 'basic' | 'comprehensive' | 'deep';
    sources?: string[];
  };
  options?: {
    usePerplexity?: boolean;
    useCoreSignal?: boolean;
    useNameSimilarity?: boolean;
    useLinkedInValidation?: boolean;
    useWebsiteValidation?: boolean;
    minConfidenceThreshold?: number;
    maxCostPerValidation?: number;
  };
}

export interface EnhancedValidationResult {
  isValid: boolean;
  overallConfidence: number; // 0-100
  validationMethods: {
    perplexity?: PerplexityValidationResult;
    coreSignal?: any;
    nameSimilarity?: {
      score: number;
      algorithm: string;
      variations: string[];
    };
    linkedinValidation?: {
      profileExists: boolean;
      profileMatches: boolean;
      lastUpdated?: string;
      confidence: number;
    };
    websiteValidation?: {
      websiteExists: boolean;
      domainMatches: boolean;
      sslValid: boolean;
      confidence: number;
    };
  };
  consolidatedFindings: {
    mostLikelyName?: string;
    mostLikelyCompany?: string;
    mostLikelyTitle?: string;
    mostLikelyLocation?: string;
    currentEmployment?: {
      company: string;
      title: string;
      confidence: number;
    };
    contactInfo?: {
      email?: string;
      phone?: string;
      linkedin?: string;
      website?: string;
    };
    alternativeMatches?: Array<{
      name: string;
      company: string;
      title: string;
      confidence: number;
      source: string;
    }>;
  };
  qualityMetrics: {
    dataCompleteness: number; // 0-100
    sourceReliability: number; // 0-100
    recencyScore: number; // 0-100
    consistencyScore: number; // 0-100
  };
  recommendations: {
    actions: string[];
    alternativeSources: string[];
    confidenceImprovement: string[];
  };
  metadata: {
    totalCost: number;
    totalTime: number;
    methodsUsed: string[];
    timestamp: string;
    cacheHit?: boolean;
  };
}

export class EnhancedAccuracyValidator {
  private perplexityValidator: PerplexityAccuracyValidator;
  private cache: Map<string, EnhancedValidationResult> = new Map();
  private cacheTTL = 3600000; // 1 hour

  constructor(perplexityApiKey?: string) {
    this['perplexityValidator'] = new PerplexityAccuracyValidator(perplexityApiKey);
  }

  /**
   * Main validation method that combines all available validation techniques
   */
  async validate(request: EnhancedValidationRequest): Promise<EnhancedValidationResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, metadata: { ...cached.metadata, cacheHit: true } };
    }

    const options = {
      usePerplexity: true,
      useCoreSignal: true,
      useNameSimilarity: true,
      useLinkedInValidation: true,
      useWebsiteValidation: true,
      minConfidenceThreshold: 70,
      maxCostPerValidation: 0.10,
      ...request.options
    };

    const validationMethods: EnhancedValidationResult['validationMethods'] = {};
    const methodsUsed: string[] = [];
    let totalCost = 0;

    try {
      // 1. Perplexity validation (most comprehensive)
      if (options.usePerplexity) {
        try {
          const perplexityRequest: PerplexityValidationRequest = {
            type: request.type,
            data: request.data,
            context: request.context
          };
          
          validationMethods['perplexity'] = await this.perplexityValidator.validatePerson(perplexityRequest);
          totalCost += validationMethods.perplexity.metadata.cost;
          methodsUsed.push('Perplexity API');
        } catch (error) {
          console.warn('[Enhanced Validator] Perplexity validation failed:', error);
        }
      }

      // 2. CoreSignal validation
      if (options['useCoreSignal'] && request['type'] === 'person') {
        try {
          const coreSignalData = this.convertToCoreSignalFormat(request.data);
          const context = {
            expectedName: request.context?.expectedName || request.data.name,
            expectedCompany: request.context?.expectedCompany || request.data.company,
            expectedLocation: request.context?.expectedLocation || request.data.location
          };
          
          validationMethods['coreSignal'] = CoreSignalAccuracyValidator.validatePersonAccuracy(coreSignalData, context);
          methodsUsed.push('CoreSignal Validation');
        } catch (error) {
          console.warn('[Enhanced Validator] CoreSignal validation failed:', error);
        }
      }

      // 3. Name similarity validation
      if (options.useNameSimilarity) {
        try {
          validationMethods['nameSimilarity'] = this.validateNameSimilarity(request);
          methodsUsed.push('Name Similarity');
        } catch (error) {
          console.warn('[Enhanced Validator] Name similarity validation failed:', error);
        }
      }

      // 4. LinkedIn validation
      if (options['useLinkedInValidation'] && request.data.linkedin) {
        try {
          validationMethods['linkedinValidation'] = await this.validateLinkedInProfile(request);
          methodsUsed.push('LinkedIn Validation');
        } catch (error) {
          console.warn('[Enhanced Validator] LinkedIn validation failed:', error);
        }
      }

      // 5. Website validation
      if (options['useWebsiteValidation'] && (request.data.website || request.data.domain)) {
        try {
          validationMethods['websiteValidation'] = await this.validateWebsite(request);
          methodsUsed.push('Website Validation');
        } catch (error) {
          console.warn('[Enhanced Validator] Website validation failed:', error);
        }
      }

      // Consolidate results
      const result = this.consolidateResults(validationMethods, request, {
        totalCost,
        totalTime: Date.now() - startTime,
        methodsUsed,
        timestamp: new Date().toISOString()
      });

      // Cache the result
      this.setCache(cacheKey, result);

      return result;

    } catch (error) {
      console.error('[Enhanced Validator] Validation failed:', error);
      return this.createErrorResult(error, startTime, methodsUsed, totalCost);
    }
  }

  /**
   * Validate name similarity using advanced algorithms
   */
  private validateNameSimilarity(request: EnhancedValidationRequest) {
    const inputName = request.data.name || request.data.fullName || 
                     `${request.data.firstName || ''} ${request.data.lastName || ''}`.trim();
    const expectedName = request.context?.expectedName;

    if (!inputName || !expectedName) {
      return {
        score: 0,
        algorithm: 'none',
        variations: []
      };
    }

    // Use multiple similarity algorithms
    const levenshteinScore = this.calculateLevenshteinSimilarity(inputName, expectedName);
    const jaroWinklerScore = this.calculateJaroWinklerSimilarity(inputName, expectedName);
    const soundexScore = this.calculateSoundexSimilarity(inputName, expectedName);
    
    // Generate name variations
    const variations = this.generateNameVariations(inputName);
    
    // Calculate weighted average
    const finalScore = Math.round(
      (levenshteinScore * 0.4) + 
      (jaroWinklerScore * 0.4) + 
      (soundexScore * 0.2)
    );

    return {
      score: finalScore,
      algorithm: 'weighted_average',
      variations,
      details: {
        levenshtein: levenshteinScore,
        jaroWinkler: jaroWinklerScore,
        soundex: soundexScore
      }
    };
  }

  /**
   * Validate LinkedIn profile
   */
  private async validateLinkedInProfile(request: EnhancedValidationRequest) {
    const linkedinUrl = request.data.linkedin;
    
    if (!linkedinUrl) {
      return {
        profileExists: false,
        profileMatches: false,
        confidence: 0
      };
    }

    try {
      // Basic URL validation
      const isValidUrl = this.isValidLinkedInUrl(linkedinUrl);
      
      if (!isValidUrl) {
        return {
          profileExists: false,
          profileMatches: false,
          confidence: 0
        };
      }

      // Check if URL is accessible (basic check)
      const response = await fetch(linkedinUrl, { 
        method: 'HEAD',
        timeout: 5000 
      }).catch(() => null);

      const profileExists = response?.ok || false;
      
      // Extract profile name from URL for matching
      const profileName = this.extractLinkedInProfileName(linkedinUrl);
      const expectedName = request.data.name || request.data.fullName;
      
      let profileMatches = false;
      if (profileName && expectedName) {
        const similarity = this.calculateLevenshteinSimilarity(profileName, expectedName);
        profileMatches = similarity > 60;
      }

      const confidence = profileExists ? (profileMatches ? 85 : 60) : 0;

      return {
        profileExists,
        profileMatches,
        confidence,
        extractedName: profileName
      };

    } catch (error) {
      console.warn('[Enhanced Validator] LinkedIn validation error:', error);
      return {
        profileExists: false,
        profileMatches: false,
        confidence: 0
      };
    }
  }

  /**
   * Validate website/domain
   */
  private async validateWebsite(request: EnhancedValidationRequest) {
    const website = request.data.website || request.data.domain;
    
    if (!website) {
      return {
        websiteExists: false,
        domainMatches: false,
        sslValid: false,
        confidence: 0
      };
    }

    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(website);
      
      // Check if website exists
      const response = await fetch(normalizedUrl, { 
        method: 'HEAD',
        timeout: 10000 
      }).catch(() => null);

      const websiteExists = response?.ok || false;
      const sslValid = normalizedUrl.startsWith('https://');
      
      // Check domain matching
      const expectedWebsite = request.context?.expectedWebsite;
      let domainMatches = false;
      
      if (expectedWebsite) {
        const inputDomain = this.extractDomain(normalizedUrl);
        const expectedDomain = this.extractDomain(expectedWebsite);
        domainMatches = inputDomain === expectedDomain;
      }

      const confidence = websiteExists ? (domainMatches ? 90 : 70) : 0;

      return {
        websiteExists,
        domainMatches,
        sslValid,
        confidence,
        normalizedUrl,
        statusCode: response?.status
      };

    } catch (error) {
      console.warn('[Enhanced Validator] Website validation error:', error);
      return {
        websiteExists: false,
        domainMatches: false,
        sslValid: false,
        confidence: 0
      };
    }
  }

  /**
   * Consolidate results from all validation methods
   */
  private consolidateResults(
    validationMethods: EnhancedValidationResult['validationMethods'],
    request: EnhancedValidationRequest,
    metadata: any
  ): EnhancedValidationResult {
    
    // Calculate overall confidence
    const confidenceScores: number[] = [];
    
    if (validationMethods.perplexity) {
      confidenceScores.push(validationMethods.perplexity.confidence);
    }
    
    if (validationMethods.coreSignal) {
      confidenceScores.push(validationMethods.coreSignal.confidence || 0);
    }
    
    if (validationMethods.nameSimilarity) {
      confidenceScores.push(validationMethods.nameSimilarity.score);
    }
    
    if (validationMethods.linkedinValidation) {
      confidenceScores.push(validationMethods.linkedinValidation.confidence);
    }
    
    if (validationMethods.websiteValidation) {
      confidenceScores.push(validationMethods.websiteValidation.confidence);
    }

    const overallConfidence = confidenceScores.length > 0 
      ? Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length)
      : 0;

    // Consolidate findings
    const consolidatedFindings = this.consolidateFindings(validationMethods);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(validationMethods, request);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(overallConfidence, validationMethods, request);

    return {
      isValid: overallConfidence >= (request.options?.minConfidenceThreshold || 70),
      overallConfidence,
      validationMethods,
      consolidatedFindings,
      qualityMetrics,
      recommendations,
      metadata
    };
  }

  /**
   * Consolidate findings from different validation methods
   */
  private consolidateFindings(validationMethods: EnhancedValidationResult['validationMethods']) {
    const findings: EnhancedValidationResult['consolidatedFindings'] = {};

    // Get most reliable name
    if (validationMethods.perplexity?.findings.currentTitle) {
      findings['mostLikelyName'] = validationMethods.perplexity.findings.currentTitle;
    }

    // Get most reliable company
    if (validationMethods.perplexity?.findings.currentCompany) {
      findings['mostLikelyCompany'] = validationMethods.perplexity.findings.currentCompany;
    }

    // Get most reliable title
    if (validationMethods.perplexity?.findings.currentTitle) {
      findings['mostLikelyTitle'] = validationMethods.perplexity.findings.currentTitle;
    }

    // Consolidate contact info
    findings['contactInfo'] = {};
    
    if (validationMethods.perplexity?.findings.linkedinProfile) {
      findings['contactInfo']['linkedin'] = validationMethods.perplexity.findings.linkedinProfile;
    }
    
    if (validationMethods.websiteValidation?.normalizedUrl) {
      findings['contactInfo']['website'] = validationMethods.websiteValidation.normalizedUrl;
    }

    return findings;
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(
    validationMethods: EnhancedValidationResult['validationMethods'],
    request: EnhancedValidationRequest
  ) {
    // Data completeness
    const requiredFields = ['name', 'company', 'title'];
    const providedFields = requiredFields.filter(field => request['data'][field as keyof typeof request.data]);
    const dataCompleteness = Math.round((providedFields.length / requiredFields.length) * 100);

    // Source reliability (based on which methods succeeded)
    let sourceReliability = 0;
    if (validationMethods.perplexity?.confidence > 70) sourceReliability += 40;
    if (validationMethods.coreSignal?.confidence > 70) sourceReliability += 30;
    if (validationMethods.linkedinValidation?.confidence > 70) sourceReliability += 20;
    if (validationMethods.websiteValidation?.confidence > 70) sourceReliability += 10;

    // Recency score (based on last updated information)
    let recencyScore = 50; // Default
    if (validationMethods.perplexity?.findings.lastUpdated) {
      // Parse date and calculate recency
      recencyScore = 80; // Assume recent if Perplexity has data
    }

    // Consistency score (how well different methods agree)
    const consistencyScore = this.calculateConsistencyScore(validationMethods);

    return {
      dataCompleteness,
      sourceReliability: Math.min(sourceReliability, 100),
      recencyScore,
      consistencyScore
    };
  }

  /**
   * Calculate consistency score between different validation methods
   */
  private calculateConsistencyScore(validationMethods: EnhancedValidationResult['validationMethods']): number {
    const scores: number[] = [];
    
    // Compare confidence scores
    if (validationMethods['perplexity'] && validationMethods.coreSignal) {
      const diff = Math.abs(validationMethods.perplexity.confidence - (validationMethods.coreSignal.confidence || 0));
      scores.push(100 - diff);
    }
    
    // Compare name similarity with other methods
    if (validationMethods['nameSimilarity'] && validationMethods.perplexity) {
      const diff = Math.abs(validationMethods.nameSimilarity.score - validationMethods.perplexity.confidence);
      scores.push(100 - diff);
    }

    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 75;
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    overallConfidence: number,
    validationMethods: EnhancedValidationResult['validationMethods'],
    request: EnhancedValidationRequest
  ) {
    const actions: string[] = [];
    const alternativeSources: string[] = [];
    const confidenceImprovement: string[] = [];

    if (overallConfidence < 70) {
      actions.push('Verify information through additional sources before using');
    }

    if (overallConfidence < 50) {
      actions.push('Consider this data unreliable for outreach or business decisions');
    }

    if (!validationMethods.perplexity) {
      alternativeSources.push('Try Perplexity API validation for real-time verification');
    }

    if (!validationMethods['linkedinValidation'] && request.data.linkedin) {
      confidenceImprovement.push('Validate LinkedIn profile for better accuracy');
    }

    if (!request.data.linkedin) {
      confidenceImprovement.push('Find LinkedIn profile to improve validation confidence');
    }

    if (!request['data']['website'] && request['type'] === 'company') {
      confidenceImprovement.push('Add company website for better validation');
    }

    return {
      actions,
      alternativeSources,
      confidenceImprovement
    };
  }

  /**
   * Helper methods for similarity calculations
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return Math.round((1 - distance / maxLength) * 100);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateJaroWinklerSimilarity(str1: string, str2: string): number {
    // Simplified Jaro-Winkler implementation
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 100;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Jaro-Winkler prefix bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(len1, len2, 4); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
    
    return Math.round((jaro + 0.1 * prefix * (1 - jaro)) * 100);
  }

  private calculateSoundexSimilarity(str1: string, str2: string): number {
    const soundex1 = this.soundex(str1);
    const soundex2 = this.soundex(str2);
    return soundex1 === soundex2 ? 100 : 0;
  }

  private soundex(str: string): string {
    const code = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (code['length'] === 0) return '0000';
    
    let soundexCode = code[0];
    const mapping: { [key: string]: string } = {
      'BFPV': '1', 'CGJKQSXZ': '2', 'DT': '3',
      'L': '4', 'MN': '5', 'R': '6'
    };
    
    for (let i = 1; i < code.length; i++) {
      for (const [chars, digit] of Object.entries(mapping)) {
        if (chars.includes(code[i])) {
          if (soundexCode[soundexCode.length - 1] !== digit) {
            soundexCode += digit;
          }
          break;
        }
      }
      if (soundexCode['length'] === 4) break;
    }
    
    return soundexCode.padEnd(4, '0');
  }

  private generateNameVariations(name: string): string[] {
    const variations = [name];
    const parts = name.split(' ');
    
    if (parts.length >= 2) {
      // First Last -> Last, First
      variations.push(`${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`);
      
      // Add initials
      const initials = parts.map(part => part[0]).join('.');
      variations.push(initials);
      
      // First Initial Last
      if (parts.length >= 2) {
        variations.push(`${parts[0][0]}. ${parts.slice(1).join(' ')}`);
      }
    }
    
    return [...new Set(variations)];
  }

  /**
   * Helper methods for URL and data processing
   */
  private isValidLinkedInUrl(url: string): boolean {
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinPattern.test(url);
  }

  private extractLinkedInProfileName(url: string): string | null {
    const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
    if (match) {
      // Convert LinkedIn slug to readable name
      return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return null;
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  private convertToCoreSignalFormat(data: any) {
    return {
      full_name: data.name || data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      active_experience_company_name: data.company,
      professional_network_url: data.linkedin,
      location_country: data.location
    };
  }

  /**
   * Cache management
   */
  private generateCacheKey(request: EnhancedValidationRequest): string {
    const keyData = {
      type: request.type,
      data: request.data,
      context: request.context,
      options: request.options
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getFromCache(key: string): EnhancedValidationResult | null {
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - new Date(cached.metadata.timestamp).getTime();
      if (age < this.cacheTTL) {
        return cached;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  private setCache(key: string, result: EnhancedValidationResult): void {
    this.cache.set(key, result);
    
    // Clean up old cache entries
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private createErrorResult(error: any, startTime: number, methodsUsed: string[], totalCost: number): EnhancedValidationResult {
    return {
      isValid: false,
      overallConfidence: 0,
      validationMethods: {},
      consolidatedFindings: {},
      qualityMetrics: {
        dataCompleteness: 0,
        sourceReliability: 0,
        recencyScore: 0,
        consistencyScore: 0
      },
      recommendations: {
        actions: [`Validation failed: ${error.message}`],
        alternativeSources: ['Try again later or use alternative validation methods'],
        confidenceImprovement: []
      },
      metadata: {
        totalCost,
        totalTime: Date.now() - startTime,
        methodsUsed,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
export const enhancedValidator = new EnhancedAccuracyValidator();
