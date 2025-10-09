/**
 * COMPANY RESOLVER MODULE
 * 
 * Handles the process of resolving company identity:
 * 1. URL resolution and redirect following
 * 2. Acquisition detection and parent company mapping  
 * 3. Domain canonicalization
 * 4. Company status determination (active/acquired/merged/defunct)
 * 
 * This is the FIRST and most critical step in the intelligence pipeline.
 */

import { CompanyIntelligence, APIConfig } from '../types/intelligence';
import { cache } from '@/platform/services';

interface URLResolution {
  canonical: string;
  final: string;
  redirects: string[];
  domains: string[];
}

interface AcquisitionInfo {
  isAcquired: boolean;
  parentCompany?: {
    name: string;
    domain?: string;
    confidence: number;
  };
  acquisitionDate?: string;
  acquisitionType?: 'merger' | 'acquisition' | 'subsidiary';
  confidence: number;
  source: string;
  executiveOverrides?: Record<string, any>;
}

interface CompanyResolution {
  originalUrl: string;
  canonicalUrl: string;
  finalUrl: string;
  redirectChain: string[];
  companyName: string;
  companyStatus: 'active' | 'acquired' | 'merged' | 'defunct' | 'subsidiary' | 'pe_owned' | 'unknown';
  isAcquired: boolean;
  isPEOwned: boolean;
  parentCompany?: any;
  peOwnership?: PEOwnershipInfo;
  acquisitionInfo?: AcquisitionInfo;
  domains: string[];
  confidence: number;
  resolutionMethod: string;
  timestamp: string;
  metadata: Record<string, any>;
  executiveOverrides?: Record<string, any>;
}

interface PEOwnershipInfo {
  isPEOwned: boolean;
  peFirm?: {
    name: string;
    confidence: number;
  };
  acquisitionDate?: string;
  ownershipType: 'majority' | 'minority' | 'full_acquisition';
  confidence: number;
  source: string;
}

export class CompanyResolver {
  private config: APIConfig;
  private acquisitionDatabase: Map<string, any>;

  constructor(config: APIConfig) {
    this['config'] = config;
    this['acquisitionDatabase'] = this.loadAcquisitionDatabase();
  }

  /**
   * 🔍 MAIN COMPANY RESOLUTION PROCESS
   */
  async resolveCompany(inputUrl: string): Promise<CompanyResolution> {
    console.log(`\n🏢 [RESOLVER] Resolving company: ${inputUrl}`);
    
    // Check cache first
    const cached = await cache.get(`company:${inputUrl}`, async () => null, {
      tags: ['company-resolver']
    });
    if (cached) {
      console.log('✅ [RESOLVER] Using cached resolution');
      return cached;
    }

    const resolution: CompanyResolution = {
      originalUrl: inputUrl,
      canonicalUrl: '',
      finalUrl: '',
      redirectChain: [],
      companyName: '',
      companyStatus: 'unknown',
      isAcquired: false,
      isPEOwned: false,
      parentCompany: null,
      acquisitionInfo: undefined,
      peOwnership: undefined,
      domains: [],
      confidence: 0,
      resolutionMethod: '',
      timestamp: new Date().toISOString(),
      metadata: {}
    };

    try {
      // STEP 1: URL Resolution and Redirect Following
      console.log('📍 [RESOLVER] Step 1: URL Resolution');
      const urlResolution = await this.resolveUrlWithRedirects(inputUrl);
      resolution['canonicalUrl'] = urlResolution.canonical;
      resolution['finalUrl'] = urlResolution.final;
      resolution['redirectChain'] = urlResolution.redirects;
      resolution['domains'] = urlResolution.domains;

      console.log(`   Original: ${inputUrl}`);
      console.log(`   Canonical: ${resolution.canonicalUrl}`);
      console.log(`   Final: ${resolution.finalUrl}`);

      // STEP 2: Acquisition Detection
      console.log('\n🔍 [RESOLVER] Step 2: Acquisition Detection');
      const acquisitionInfo = await this.detectAcquisition(resolution.canonicalUrl, resolution.finalUrl);
      
      resolution['acquisitionInfo'] = acquisitionInfo;
      
      if (acquisitionInfo.isAcquired) {
        resolution['isAcquired'] = true;
        resolution['parentCompany'] = acquisitionInfo.parentCompany;
        resolution['companyStatus'] = 'acquired';
        console.log(`   🚨 ACQUISITION DETECTED: ${acquisitionInfo.parentCompany?.name || 'Unknown Parent'}`);
      } else {
        console.log(`   ✅ Independent company confirmed`);
        resolution['companyStatus'] = 'active';
      }

      // Propagate executive overrides
      if (acquisitionInfo.executiveOverrides) {
        resolution['executiveOverrides'] = acquisitionInfo.executiveOverrides;
        console.log(`   🎯 Executive overrides: ${Object.keys(acquisitionInfo.executiveOverrides).join(', ')}`);
      }

      // STEP 3: PE Ownership Detection
      console.log('\n💼 [RESOLVER] Step 3: PE Ownership Detection');
      const peOwnership = await this.detectPEOwnership(resolution.companyName);
      resolution['peOwnership'] = peOwnership;
      
      if (peOwnership.isPEOwned) {
        resolution['isPEOwned'] = true;
        resolution['companyStatus'] = 'pe_owned';
        console.log(`   💼 PE OWNERSHIP DETECTED: ${peOwnership.peFirm?.name || 'Unknown PE Firm'}`);
      }

      // STEP 4: Company Name Extraction
      console.log('\n🏷️ [RESOLVER] Step 4: Company Name Extraction');
      resolution['companyName'] = await this.extractCompanyName(resolution.finalUrl);
      console.log(`   Company Name: ${resolution.companyName}`);

      // STEP 4: Calculate Confidence
      resolution['confidence'] = this.calculateResolutionConfidence(resolution);
      resolution['resolutionMethod'] = this.determineResolutionMethod(resolution);

      console.log(`\n✅ [RESOLVER] Resolution complete - ${resolution.confidence}% confidence`);

      // Cache the result
      await cache.set(`company:${inputUrl}`, resolution, {
        ttl: 7200000, // 2 hour cache
        tags: ['company-resolver'],
        priority: 'high'
      });

      return resolution;

    } catch (error) {
      console.error(`❌ [RESOLVER] Resolution failed:`, error);
      resolution['companyStatus'] = 'unknown';
      resolution['confidence'] = 0;
      resolution['resolutionMethod'] = 'failed';
      resolution['metadata']['error'] = error instanceof Error ? error.message : 'Unknown error';
      return resolution;
    }
  }

  /**
   * 🌐 RESOLVE URL WITH REDIRECTS
   */
  private async resolveUrlWithRedirects(inputUrl: string): Promise<URLResolution> {
    const redirects: string[] = [inputUrl];
    const domains: string[] = [];
    let currentUrl = this.normalizeUrl(inputUrl);
    let redirectCount = 0;
    const maxRedirects = this.config.MAX_PARALLEL_COMPANIES || 10; // Reuse config value

    while (redirectCount < maxRedirects) {
      try {
        // Add domain to list
        const domain = this.extractDomain(currentUrl);
        if (domain && !domains.includes(domain)) {
          domains.push(domain);
        }

        // Follow redirects manually to track the chain
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT_MS || 10000);
        
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            const nextUrl = this.resolveRelativeUrl(currentUrl, location);
            redirects.push(nextUrl);
            currentUrl = nextUrl;
            redirectCount++;
            continue;
          }
        }

        // No more redirects
        break;

      } catch (error) {
        console.log(`   ⚠️ Redirect following stopped: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }

    return {
      canonical: this.normalizeUrl(inputUrl),
      final: currentUrl,
      redirects,
      domains
    };
  }

  /**
   * 🔍 DETECT ACQUISITION
   */
  private async detectAcquisition(canonicalUrl: string, finalUrl: string): Promise<AcquisitionInfo> {
    // Check if domains are different (potential acquisition indicator)
    const originalDomain = this.extractDomain(canonicalUrl);
    const finalDomain = this.extractDomain(finalUrl);
    
    let acquisitionInfo: AcquisitionInfo = {
      isAcquired: false,
      confidence: 0,
      source: 'domain_analysis'
    };

    // Domain redirect analysis
    if (originalDomain !== finalDomain && originalDomain && finalDomain) {
      console.log(`   🔄 Domain redirect detected: ${originalDomain} → ${finalDomain}`);
      
      // Check known acquisition database
      const knownAcquisition = this.acquisitionDatabase.get(originalDomain);
      if (knownAcquisition) {
        acquisitionInfo = {
          isAcquired: true,
          parentCompany: {
            name: knownAcquisition.parentName,
            domain: finalDomain,
            confidence: 95
          },
          acquisitionDate: knownAcquisition.date,
          acquisitionType: knownAcquisition.type,
          confidence: 95,
          source: 'known_database',
          executiveOverrides: knownAcquisition.executiveOverrides
        };
      } else {
        // Use AI to research the acquisition
        if (this.config.PERPLEXITY_API_KEY) {
          try {
            const aiAnalysis = await this.aiAcquisitionResearch(originalDomain, finalDomain);
            if (aiAnalysis.isAcquired) {
              acquisitionInfo = aiAnalysis;
            }
          } catch (error) {
            console.log(`   ⚠️ AI acquisition research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    }

    return acquisitionInfo;
  }

  /**
   * 💼 DETECT PE OWNERSHIP
   */
  private async detectPEOwnership(companyName: string): Promise<PEOwnershipInfo> {
    const peInfo: PEOwnershipInfo = {
      isPEOwned: false,
      confidence: 0,
      source: 'ai_research',
      ownershipType: 'minority'
    };

    if (!this.config.PERPLEXITY_API_KEY || !companyName) {
      return peInfo;
    }

    const prompt = `You are a corporate intelligence analyst researching private equity and venture capital ownership. Analyze the ownership structure of ${companyName}.

RESEARCH TASK:
Determine if ${companyName} is owned by a private equity firm, venture capital firm, or other institutional investor.

RESEARCH FOCUS:
1. Current ownership structure of ${companyName}
2. Private equity/VC investment history
3. Investment rounds and funding
4. Board composition and investor representation
5. Operational control and management

REQUIRED OUTPUT FORMAT:
Please provide a structured analysis with the following information:

PE/VC OWNERSHIP: [YES/NO/UNCERTAIN]
INVESTOR FIRM: [Firm Name or "Independent"]
INVESTMENT DATE: [YYYY or "Unknown"]
OWNERSHIP TYPE: [majority/minority/full_acquisition/unknown]
INVESTMENT AMOUNT: [Amount if known or "Undisclosed"]
BOARD REPRESENTATION: [Number of board seats or "Unknown"]
CONFIDENCE LEVEL: [High/Medium/Low]
EVIDENCE SOURCES: [List key sources used]
CURRENT STATUS: [Active/Integrated/Subsidiary/Defunct]

RESEARCH GUIDELINES:
- Focus on current ownership (not historical)
- Distinguish between PE, VC, and other institutional investors
- Include investment amounts when publicly disclosed
- Note board representation and control
- Prioritize recent investments (2015-present)
- If uncertain, clearly state the confidence level

Be thorough but concise. Use specific dates, firm names, and investment details when available.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse PE ownership
        const isPEOwned = content.toLowerCase().includes('yes') && 
                         !content.toLowerCase().includes('no evidence') &&
                         !content.toLowerCase().includes('not owned');

        if (isPEOwned) {
          // Extract PE firm name
          const firmMatch = content.match(/(?:owned by|acquired by|backed by)\s+([^.\n]+)/i);
          const firmName = firmMatch?.[1]?.trim() || 'Unknown PE Firm';

          peInfo['isPEOwned'] = true;
          peInfo['peFirm'] = {
            name: firmName,
            confidence: 80
          };
          peInfo['confidence'] = 80;
          
          // Determine ownership type
          if (content.toLowerCase().includes('majority')) {
            peInfo['ownershipType'] = 'majority';
          } else if (content.toLowerCase().includes('full') || content.toLowerCase().includes('acquired')) {
            peInfo['ownershipType'] = 'full_acquisition';
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️ PE ownership research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return peInfo;
  }

  /**
   * 🤖 AI ACQUISITION RESEARCH (ENHANCED)
   */
  private async aiAcquisitionResearch(originalDomain: string, finalDomain: string): Promise<AcquisitionInfo> {
    if (!this.config.PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    const prompt = `You are a corporate intelligence analyst researching company acquisitions. Analyze the corporate structure and ownership of ${originalDomain}.

RESEARCH TASK:
Determine if ${originalDomain} has been acquired, merged, or is owned by another company.

RESEARCH FOCUS:
1. Corporate ownership structure of ${originalDomain}
2. Parent company relationships
3. Acquisition/merger history
4. Current operational status
5. Executive leadership changes

REQUIRED OUTPUT FORMAT:
Please provide a structured analysis with the following information:

ACQUISITION STATUS: [YES/NO/UNCERTAIN]
PARENT COMPANY: [Company Name or "Independent"]
ACQUISITION DATE: [YYYY or "Unknown"]
TRANSACTION TYPE: [acquisition/merger/subsidiary/joint_venture/unknown]
TRANSACTION VALUE: [Amount if known or "Undisclosed"]
CONFIDENCE LEVEL: [High/Medium/Low]
EVIDENCE SOURCES: [List key sources used]
EXECUTIVE CHANGES: [Any notable leadership changes]
CURRENT STATUS: [Active/Integrated/Subsidiary/Defunct]

RESEARCH GUIDELINES:
- Focus on factual, verifiable information
- Prioritize recent acquisitions (2015-present)
- Include transaction values when publicly disclosed
- Note any executive changes post-acquisition
- Distinguish between full acquisitions, mergers, and minority investments
- If uncertain, clearly state the confidence level

Be thorough but concise. Use specific dates, company names, and transaction details when available.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Enhanced parsing with structured response handling
      const parsedResponse = this.parseStructuredAIResponse(content);
      return parsedResponse;

    } catch (error) {
      console.log(`   ⚠️ AI research error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isAcquired: false,
      confidence: 70,
      source: 'ai_research'
    };
  }

  /**
   * 📊 PARSE STRUCTURED AI RESPONSE
   */
  private parseStructuredAIResponse(content: string): AcquisitionInfo {
    const lines = content.split('\n').map(line => line.trim());
    
    // Extract structured data
    const acquisitionStatus = this.extractFieldValue(lines, 'ACQUISITION STATUS:');
    const parentCompany = this.extractFieldValue(lines, 'PARENT COMPANY:');
    const acquisitionDate = this.extractFieldValue(lines, 'ACQUISITION DATE:');
    const transactionType = this.extractFieldValue(lines, 'TRANSACTION TYPE:');
    const confidenceLevel = this.extractFieldValue(lines, 'CONFIDENCE LEVEL:');
    const evidenceSources = this.extractFieldValue(lines, 'EVIDENCE SOURCES:');
    const executiveChanges = this.extractFieldValue(lines, 'EXECUTIVE CHANGES:');
    const currentStatus = this.extractFieldValue(lines, 'CURRENT STATUS:');

    // Determine if acquired
    const isAcquired = acquisitionStatus?.toLowerCase().includes('yes') && 
                      !acquisitionStatus?.toLowerCase().includes('no') &&
                      !acquisitionStatus?.toLowerCase().includes('uncertain');

    if (!isAcquired) {
      return {
        isAcquired: false,
        confidence: this.calculateConfidenceFromLevel(confidenceLevel),
        source: 'ai_research'
      };
    }

    // Calculate confidence based on multiple factors
    const confidence = this.calculateEnhancedConfidence({
      acquisitionStatus,
      parentCompany,
      acquisitionDate,
      confidenceLevel,
      evidenceSources,
      currentStatus
    });

    // Determine acquisition type
    const acquisitionType = this.mapTransactionType(transactionType);

    // Extract executive overrides if mentioned
    const executiveOverrides = this.extractExecutiveOverrides(executiveChanges);

    return {
      isAcquired: true,
      parentCompany: {
        name: parentCompany || 'Unknown Parent',
        domain: this.extractDomainFromCompanyName(parentCompany),
        confidence: confidence
      },
      acquisitionDate: acquisitionDate !== 'Unknown' ? acquisitionDate : undefined,
      acquisitionType,
      confidence,
      source: 'ai_research',
      executiveOverrides
    };
  }

  /**
   * 🔍 EXTRACT FIELD VALUE FROM STRUCTURED RESPONSE
   */
  private extractFieldValue(lines: string[], fieldName: string): string | undefined {
    const line = lines.find(l => l.startsWith(fieldName));
    if (!line) return undefined;
    
    return line.replace(fieldName, '').trim();
  }

  /**
   * 📈 CALCULATE ENHANCED CONFIDENCE
   */
  private calculateEnhancedConfidence(data: {
    acquisitionStatus?: string;
    parentCompany?: string;
    acquisitionDate?: string;
    confidenceLevel?: string;
    evidenceSources?: string;
    currentStatus?: string;
  }): number {
    let confidence = 50; // Base confidence

    // Confidence level from AI
    if (data.confidenceLevel?.toLowerCase().includes('high')) confidence += 25;
    else if (data.confidenceLevel?.toLowerCase().includes('medium')) confidence += 15;
    else if (data.confidenceLevel?.toLowerCase().includes('low')) confidence += 5;

    // Parent company specificity
    if (data.parentCompany && data.parentCompany !== 'Independent' && data.parentCompany !== 'Unknown') {
      confidence += 10;
    }

    // Date specificity
    if (data.acquisitionDate && data.acquisitionDate !== 'Unknown') {
      confidence += 10;
    }

    // Evidence sources
    if (data.evidenceSources && data.evidenceSources.length > 0) {
      confidence += 5;
    }

    // Current status clarity
    if (data.currentStatus && ['Active', 'Integrated', 'Subsidiary'].includes(data.currentStatus)) {
      confidence += 5;
    }

    return Math.min(confidence, 95);
  }

  /**
   * 🎯 CALCULATE CONFIDENCE FROM LEVEL
   */
  private calculateConfidenceFromLevel(level?: string): number {
    if (!level) return 50;
    
    switch (level.toLowerCase()) {
      case 'high': return 85;
      case 'medium': return 70;
      case 'low': return 55;
      default: return 50;
    }
  }

  /**
   * 🏷️ MAP TRANSACTION TYPE
   */
  private mapTransactionType(transactionType?: string): 'merger' | 'acquisition' | 'subsidiary' {
    if (!transactionType) return 'acquisition';
    
    const type = transactionType.toLowerCase();
    if (type.includes('merger')) return 'merger';
    if (type.includes('subsidiary')) return 'subsidiary';
    return 'acquisition';
  }

  /**
   * 👔 EXTRACT EXECUTIVE OVERRIDES
   */
  private extractExecutiveOverrides(executiveChanges?: string): Record<string, any> | undefined {
    if (!executiveChanges || executiveChanges === 'None' || executiveChanges === 'Unknown') {
      return undefined;
    }

    // Simple extraction - in production, use more sophisticated parsing
    const overrides: Record<string, any> = {};
    
    // Look for CEO mentions
    const ceoMatch = executiveChanges.match(/CEO[:\s]+([^,\n]+)/i);
    if (ceoMatch) {
      overrides['ceo'] = {
        name: ceoMatch[1].trim(),
        confidence: 80
      };
    }

    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }

  /**
   * 🌐 EXTRACT DOMAIN FROM COMPANY NAME
   */
  private extractDomainFromCompanyName(companyName?: string): string | undefined {
    if (!companyName) return undefined;
    
    // Simple mapping - in production, use a more comprehensive database
    const domainMap: Record<string, string> = {
      'Microsoft': 'microsoft.com',
      'Google': 'google.com',
      'Meta': 'meta.com',
      'Salesforce': 'salesforce.com',
      'Adobe': 'adobe.com',
      'Oracle': 'oracle.com',
      'IBM': 'ibm.com'
    };

    return domainMap[companyName] || undefined;
  }

  /**
   * 🏷️ EXTRACT COMPANY NAME
   */
  private async extractCompanyName(url: string): Promise<string> {
    const domain = this.extractDomain(url);
    if (!domain) return 'Unknown Company';

    // Try to get from cache first
    const cached = await cache.get(`company_name:${domain}`, async () => null, {
      tags: ['company-resolver']
    });
    if (cached) return cached;

    // Extract from domain (fallback)
    const domainParts = domain.split('.');
    const mainPart = domainParts[0];
    
    // Convert to title case
    const companyName = mainPart
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Cache the result
    await cache.set(`company_name:${domain}`, companyName, {
      ttl: 7200000, // 2 hour cache
      tags: ['company-resolver'],
      priority: 'medium'
    });

    return companyName;
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private normalizeUrl(url: string): string {
    if (!url) return '';
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Remove trailing slash
    return url.replace(/\/$/, '');
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  private resolveRelativeUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString();
    } catch {
      return relativeUrl;
    }
  }

  private calculateResolutionConfidence(resolution: CompanyResolution): number {
    let confidence = 50; // Base confidence

    // Successful URL resolution
    if (resolution.finalUrl) confidence += 20;
    
    // Company name extracted
    if (resolution['companyName'] && resolution.companyName !== 'Unknown Company') {
      confidence += 15;
    }

    // Acquisition info adds confidence
    if (resolution.acquisitionInfo) {
      confidence += resolution.acquisitionInfo.confidence * 0.15;
    }

    // Domain consistency
    if (resolution['domains']['length'] === 1) confidence += 10;
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  private determineResolutionMethod(resolution: CompanyResolution): string {
    const methods: string[] = [];
    
    if (resolution.redirectChain.length > 1) methods.push('redirect_following');
    if (resolution.acquisitionInfo?.isAcquired) methods.push('acquisition_detection');
    if (resolution.acquisitionInfo?.source === 'ai_research') methods.push('ai_research');
    
    return methods.join(', ') || 'basic_resolution';
  }

  /**
   * 📚 LOAD ACQUISITION DATABASE
   */
  private loadAcquisitionDatabase(): Map<string, any> {
    // In production, this would load from a real database
    // For now, return a few known examples
    const acquisitions = new Map();
    
    // Add some known acquisitions
    acquisitions.set('linkedin.com', {
      parentName: 'Microsoft',
      date: '2016',
      type: 'acquisition',
      executiveOverrides: {
        ceo: { name: 'Ryan Roslansky', confidence: 95 }
      }
    });
    
    acquisitions.set('github.com', {
      parentName: 'Microsoft', 
      date: '2018',
      type: 'acquisition'
    });

    return acquisitions;
  }

  /**
   * 🎯 CONVERT TO COMPANY INTELLIGENCE
   */
  toCompanyIntelligence(resolution: CompanyResolution): CompanyIntelligence {
    // Map company status to operational status
    const operationalStatusMap: Record<string, 'active' | 'acquired' | 'merged' | 'inactive'> = {
      'active': 'active',
      'acquired': 'acquired',
      'merged': 'merged',
      'defunct': 'inactive',
      'subsidiary': 'acquired',
      'pe_owned': 'active',
      'unknown': 'active'
    };

    return {
      name: resolution.companyName,
      domain: this.extractDomain(resolution.finalUrl),
      industry: undefined, // Will be filled by other modules
      operationalStatus: operationalStatusMap[resolution.companyStatus] || 'active',
      parentCompany: resolution.parentCompany?.name,
      acquisitionDate: resolution.acquisitionInfo?.acquisitionDate ? 
        new Date(resolution.acquisitionInfo.acquisitionDate) : undefined,
      confidence: resolution.confidence
    };
  }
}
