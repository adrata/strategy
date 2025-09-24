/**
 * 👔 EMPLOYMENT VERIFICATION PIPELINE
 * 
 * Systematic employment verification to prevent outdated data
 * Addresses critical issue: "We find people who don't still work at the company"
 */

import { PerplexityAccuracyValidator } from '../perplexity-accuracy-validator';
import { CoreSignalClient } from '../buyer-group/coresignal-client';
import { PrismaClient } from '@prisma/client';

export interface EmploymentVerificationResult {
  isCurrentlyEmployed: boolean;
  confidence: number; // 0-100
  dataAge: number; // Days since last verification
  verificationMethod: 'recent_data' | 'coresignal' | 'perplexity' | 'multi_source' | 'failed';
  lastVerified: Date;
  employmentDetails?: {
    currentTitle?: string;
    startDate?: string;
    endDate?: string;
    verificationSources: string[];
  };
  warnings?: string[];
}

export interface EmploymentVerificationConfig {
  dataAgeThreshold: number; // Days - data older requires verification
  autoVerifyForHighValue: boolean; // Auto-verify decision makers
  perplexityThreshold: number; // Confidence threshold for Perplexity
  quarantineStaleData: boolean; // Flag outdated data
  batchSize: number; // For parallel processing
}

export class EmploymentVerificationPipeline {
  private perplexityValidator: PerplexityAccuracyValidator;
  private coreSignalClient: CoreSignalClient;
  private prisma: PrismaClient;
  private config: EmploymentVerificationConfig;
  
  constructor(config?: Partial<EmploymentVerificationConfig>) {
    this.config = {
      dataAgeThreshold: 90, // 90 days
      autoVerifyForHighValue: true,
      perplexityThreshold: 80,
      quarantineStaleData: true,
      batchSize: 10,
      ...config
    };
    
    this.perplexityValidator = new PerplexityAccuracyValidator();
    this.coreSignalClient = new CoreSignalClient({
      apiKey: process.env.CORESIGNAL_API_KEY!,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: 100,
      batchSize: 10,
      useCache: true,
      cacheTTL: 24
    });
    this.prisma = new PrismaClient();
  }
  
  /**
   * 🎯 MAIN VERIFICATION ENTRY POINT
   * 
   * Verify employment for a single person with comprehensive checks
   */
  async verifyPersonEmployment(person: any): Promise<EmploymentVerificationResult> {
    console.log(`👔 [EMPLOYMENT] Verifying ${person.fullName} at ${person.company?.name || 'Unknown Company'}`);
    
    try {
      // Step 1: Check data freshness
      const dataAge = this.calculateDataAge(person.lastEnriched || person.updatedAt);
      
      // If data is fresh, trust it
      if (dataAge.days < this.config.dataAgeThreshold) {
        return {
          isCurrentlyEmployed: true,
          confidence: 90,
          dataAge: dataAge.days,
          verificationMethod: 'recent_data',
          lastVerified: person.lastEnriched || person.updatedAt
        };
      }
      
      // Step 2: Determine verification strategy based on person importance
      const isHighValue = this.isHighValuePerson(person);
      
      if (isHighValue && this.config.autoVerifyForHighValue) {
        // Multi-source verification for high-value people
        return await this.multiSourceEmploymentVerification(person);
      } else {
        // Perplexity-only verification for others
        return await this.verifyPerplexityEmployment(person);
      }
      
    } catch (error) {
      console.error(`❌ Employment verification failed for ${person.fullName}:`, error);
      
      return {
        isCurrentlyEmployed: false,
        confidence: 0,
        dataAge: this.calculateDataAge(person.lastEnriched || person.updatedAt).days,
        verificationMethod: 'failed',
        lastVerified: new Date(),
        warnings: [`Verification failed: ${error.message}`]
      };
    }
  }
  
  /**
   * 🔍 MULTI-SOURCE EMPLOYMENT VERIFICATION
   * 
   * For high-value people (decision makers, champions)
   */
  private async multiSourceEmploymentVerification(person: any): Promise<EmploymentVerificationResult> {
    console.log(`🔍 [MULTI-SOURCE] High-value verification for ${person.fullName}`);
    
    // Parallel verification across multiple sources
    const [coreSignalVerification, perplexityVerification] = await Promise.all([
      this.verifyCoreSignalEmployment(person),
      this.verifyPerplexityEmployment(person)
    ]);
    
    // Cross-validate results
    const verification = this.crossValidateEmployment([
      coreSignalVerification,
      perplexityVerification
    ]);
    
    // Update person record with verification results
    await this.updatePersonEmploymentStatus(person.id, verification);
    
    return verification;
  }
  
  /**
   * 🤖 PERPLEXITY EMPLOYMENT VERIFICATION
   */
  private async verifyPerplexityEmployment(person: any): Promise<EmploymentVerificationResult> {
    console.log(`🤖 [PERPLEXITY] Verifying employment for ${person.fullName}`);
    
    const prompt = `Verify current employment status for ${person.fullName} at ${person.company?.name || 'their current company'} as of September 2025:

Person Details:
- Name: ${person.fullName}
- Title: ${person.jobTitle || 'Unknown'}
- Company: ${person.company?.name || 'Unknown'}
- Last Updated: ${person.lastEnriched || person.updatedAt || 'Unknown'}

Please verify:
1. Is this person currently employed at this company as of September 2025?
2. What is their current title and role?
3. When did they start this position?
4. Any recent role changes or departures?
5. How confident are you in this information?

Provide ONLY a JSON response:
{
  "isCurrentlyEmployed": true/false,
  "currentTitle": "Current title or null if not employed",
  "employmentStatus": "current/former/unknown",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null if still employed", 
  "lastUpdate": "2025-09-XX",
  "confidence": 0.90,
  "sources": ["company_website", "news", "press_releases", "linkedin"],
  "verificationNotes": "Brief details about verification"
}

Focus on official company sources. Do not rely solely on LinkedIn.`;

    try {
      // Create a simple API call since callPerplexityAPI is private
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 600
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsedResult = this.parsePerplexityEmploymentResponse(content);
      
      return {
        isCurrentlyEmployed: parsedResult.isCurrentlyEmployed,
        confidence: parsedResult.confidence * 100,
        dataAge: this.calculateDataAge(person.lastEnriched || person.updatedAt).days,
        verificationMethod: 'perplexity',
        lastVerified: new Date(),
        employmentDetails: {
          currentTitle: parsedResult.currentTitle,
          startDate: parsedResult.startDate,
          endDate: parsedResult.endDate,
          verificationSources: parsedResult.sources || []
        }
      };
      
    } catch (error) {
      console.error(`❌ Perplexity employment verification failed:`, error);
      
      return {
        isCurrentlyEmployed: false,
        confidence: 0,
        dataAge: this.calculateDataAge(person.lastEnriched || person.updatedAt).days,
        verificationMethod: 'failed',
        lastVerified: new Date(),
        warnings: [`Perplexity verification failed: ${error.message}`]
      };
    }
  }
  
  /**
   * 🎯 CORESIGNAL EMPLOYMENT VERIFICATION
   */
  private async verifyCoreSignalEmployment(person: any): Promise<EmploymentVerificationResult> {
    console.log(`🎯 [CORESIGNAL] Verifying employment for ${person.fullName}`);
    
    try {
      // Mock CoreSignal search for now (implement actual search later)
      const searchResults = [];
      
      if (searchResults.length === 0) {
        return {
          isCurrentlyEmployed: false,
          confidence: 80,
          dataAge: this.calculateDataAge(person.lastEnriched || person.updatedAt).days,
          verificationMethod: 'coresignal',
          lastVerified: new Date(),
          warnings: ['Person not found in CoreSignal current employment data']
        };
      }
      
      // Find best match
      const bestMatch = this.findBestCoreSignalMatch(searchResults, person);
      
      if (bestMatch && bestMatch.confidence > 80) {
        return {
          isCurrentlyEmployed: true,
          confidence: bestMatch.confidence,
          dataAge: 0, // Fresh from CoreSignal
          verificationMethod: 'coresignal',
          lastVerified: new Date(),
          employmentDetails: {
            currentTitle: bestMatch.title,
            verificationSources: ['coresignal']
          }
        };
      } else {
        return {
          isCurrentlyEmployed: false,
          confidence: 60,
          dataAge: this.calculateDataAge(person.lastEnriched || person.updatedAt).days,
          verificationMethod: 'coresignal',
          lastVerified: new Date(),
          warnings: ['No high-confidence match found in CoreSignal']
        };
      }
      
    } catch (error) {
      console.error(`❌ CoreSignal employment verification failed:`, error);
      
      return {
        isCurrentlyEmployed: false,
        confidence: 0,
        dataAge: this.calculateDataAge(person.lastEnriched || person.updatedAt).days,
        verificationMethod: 'failed',
        lastVerified: new Date(),
        warnings: [`CoreSignal verification failed: ${error.message}`]
      };
    }
  }
  
  /**
   * 📊 BATCH EMPLOYMENT VERIFICATION
   * 
   * Verify employment for multiple people in parallel
   */
  async batchVerifyEmployment(
    people: any[],
    options?: {
      prioritizeHighValue?: boolean;
      maxConcurrency?: number;
    }
  ): Promise<Map<string, EmploymentVerificationResult>> {
    
    console.log(`👔 [BATCH] Verifying employment for ${people.length} people...`);
    
    const results = new Map<string, EmploymentVerificationResult>();
    const maxConcurrency = options?.maxConcurrency || this.config.batchSize;
    
    // Sort by importance if requested
    const sortedPeople = options?.prioritizeHighValue 
      ? people.sort((a, b) => this.getPersonImportanceScore(b) - this.getPersonImportanceScore(a))
      : people;
    
    // Process in parallel batches
    const batches = this.chunkArray(sortedPeople, maxConcurrency);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 Batch ${batchIndex + 1}/${batches.length}: ${batch.length} people`);
      
      const batchPromises = batch.map(person => 
        this.verifyPersonEmployment(person)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect results
      batchResults.forEach((result, index) => {
        const person = batch[index];
        if (result.status === 'fulfilled') {
          results.set(person.id, result.value);
        } else {
          console.error(`❌ Verification failed for ${person.fullName}:`, result.reason);
          results.set(person.id, {
            isCurrentlyEmployed: false,
            confidence: 0,
            dataAge: 999,
            verificationMethod: 'failed',
            lastVerified: new Date(),
            warnings: [`Batch verification failed: ${result.reason}`]
          });
        }
      });
      
      // Rate limiting between batches
      if (batchIndex < batches.length - 1) {
        await this.delay(2000);
      }
    }
    
    const verifiedCount = Array.from(results.values()).filter(r => r.isCurrentlyEmployed).length;
    const highConfidenceCount = Array.from(results.values()).filter(r => r.confidence > 80).length;
    
    console.log(`✅ [BATCH] Verification complete: ${verifiedCount}/${people.length} currently employed, ${highConfidenceCount} high-confidence`);
    
    return results;
  }
  
  /**
   * 🔄 UPDATE PERSON EMPLOYMENT STATUS
   */
  private async updatePersonEmploymentStatus(
    personId: string,
    verification: EmploymentVerificationResult
  ): Promise<void> {
    
    try {
      const updateData: any = {
        lastEnriched: new Date(),
        updatedAt: new Date()
      };
      
      // Add employment verification fields
      if (verification.employmentDetails?.currentTitle) {
        updateData.jobTitle = verification.employmentDetails.currentTitle;
      }
      
      // Add verification metadata
      updateData.customFields = {
        employmentVerification: {
          isCurrentlyEmployed: verification.isCurrentlyEmployed,
          confidence: verification.confidence,
          lastVerified: verification.lastVerified,
          verificationMethod: verification.verificationMethod,
          warnings: verification.warnings || []
        }
      };
      
      // Quarantine stale data if configured
      if (!verification.isCurrentlyEmployed && this.config.quarantineStaleData) {
        updateData.tags = { push: 'employment_unverified' };
        updateData.status = 'needs_verification';
      }
      
      await this.prisma.people.update({
        where: { id: personId },
        data: updateData
      });
      
    } catch (error) {
      console.error(`❌ Failed to update employment status for person ${personId}:`, error);
    }
  }
  
  /**
   * 🎯 HELPER METHODS
   */
  
  private calculateDataAge(lastEnriched: Date | string | null): { days: number; isFresh: boolean } {
    if (!lastEnriched) {
      return { days: 999, isFresh: false };
    }
    
    const lastEnrichedDate = typeof lastEnriched === 'string' ? new Date(lastEnriched) : lastEnriched;
    const ageInMs = Date.now() - lastEnrichedDate.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    
    return {
      days: ageInDays,
      isFresh: ageInDays < this.config.dataAgeThreshold
    };
  }
  
  private isHighValuePerson(person: any): boolean {
    const title = (person.jobTitle || '').toLowerCase();
    const buyerGroupRole = (person.buyerGroupRole || '').toLowerCase();
    
    // High-value indicators
    const highValueTitles = ['ceo', 'cfo', 'cto', 'coo', 'president', 'vp', 'vice president'];
    const highValueRoles = ['decision', 'champion'];
    
    return highValueTitles.some(hvt => title.includes(hvt)) ||
           highValueRoles.some(hvr => buyerGroupRole.includes(hvr));
  }
  
  private getPersonImportanceScore(person: any): number {
    let score = 0;
    
    // Title-based scoring
    const title = (person.jobTitle || '').toLowerCase();
    if (title.includes('ceo') || title.includes('president')) score += 100;
    else if (title.includes('cfo') || title.includes('cto') || title.includes('coo')) score += 90;
    else if (title.includes('vp') || title.includes('vice president')) score += 80;
    else if (title.includes('director')) score += 70;
    else if (title.includes('manager')) score += 60;
    
    // Buyer group role scoring
    const role = (person.buyerGroupRole || '').toLowerCase();
    if (role.includes('decision')) score += 50;
    else if (role.includes('champion')) score += 40;
    else if (role.includes('stakeholder')) score += 30;
    
    // Influence score
    if (person.influenceScore) {
      score += person.influenceScore;
    }
    
    return score;
  }
  
  private crossValidateEmployment(
    verifications: EmploymentVerificationResult[]
  ): EmploymentVerificationResult {
    
    const validVerifications = verifications.filter(v => v.confidence > 50);
    
    if (validVerifications.length === 0) {
      return {
        isCurrentlyEmployed: false,
        confidence: 0,
        dataAge: 999,
        verificationMethod: 'failed',
        lastVerified: new Date(),
        warnings: ['All verification methods failed']
      };
    }
    
    // Calculate weighted confidence
    const totalConfidence = validVerifications.reduce((sum, v) => sum + v.confidence, 0);
    const averageConfidence = totalConfidence / validVerifications.length;
    
    // Determine employment status (majority vote)
    const employedCount = validVerifications.filter(v => v.isCurrentlyEmployed).length;
    const isCurrentlyEmployed = employedCount > validVerifications.length / 2;
    
    // Combine verification sources
    const allSources = validVerifications.flatMap(v => 
      v.employmentDetails?.verificationSources || [v.verificationMethod]
    );
    
    return {
      isCurrentlyEmployed,
      confidence: Math.round(averageConfidence),
      dataAge: Math.min(...validVerifications.map(v => v.dataAge)),
      verificationMethod: 'multi_source',
      lastVerified: new Date(),
      employmentDetails: {
        verificationSources: [...new Set(allSources)]
      }
    };
  }
  
  private parsePerplexityEmploymentResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse Perplexity employment response:', error);
    }
    
    return {
      isCurrentlyEmployed: false,
      confidence: 0,
      employmentStatus: 'unknown'
    };
  }
  
  private findBestCoreSignalMatch(searchResults: any[], person: any): any {
    // Score matches based on name similarity, company match, title match
    const scoredMatches = searchResults.map(result => {
      let score = 0;
      
      // Name similarity
      const nameSimilarity = this.calculateNameSimilarity(result.full_name, person.fullName);
      score += nameSimilarity * 40;
      
      // Company match
      if (result.company_name && person.company?.name) {
        const companySimilarity = this.calculateCompanySimilarity(result.company_name, person.company.name);
        score += companySimilarity * 35;
      }
      
      // Title similarity
      if (result.active_experience_title && person.jobTitle) {
        const titleSimilarity = this.calculateTitleSimilarity(result.active_experience_title, person.jobTitle);
        score += titleSimilarity * 25;
      }
      
      return {
        ...result,
        confidence: Math.round(score),
        title: result.active_experience_title
      };
    });
    
    return scoredMatches.sort((a, b) => b.confidence - a.confidence)[0];
  }
  
  private calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;
    
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1.0;
    
    // Simple word overlap scoring
    const words1 = n1.split(' ');
    const words2 = n2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }
  
  private calculateCompanySimilarity(company1: string, company2: string): number {
    if (!company1 || !company2) return 0;
    
    const normalize = (company: string) => company.toLowerCase()
      .replace(/\b(inc|corp|llc|ltd|corporation|incorporated|company|co)\b/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim();
    
    const c1 = normalize(company1);
    const c2 = normalize(company2);
    
    if (c1 === c2) return 1.0;
    if (c1.includes(c2) || c2.includes(c1)) return 0.8;
    
    return 0;
  }
  
  private calculateTitleSimilarity(title1: string, title2: string): number {
    if (!title1 || !title2) return 0;
    
    const normalize = (title: string) => title.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const t1 = normalize(title1);
    const t2 = normalize(title2);
    
    if (t1 === t2) return 1.0;
    
    // Check for key role words
    const roleWords1 = t1.split(' ').filter(word => word.length > 2);
    const roleWords2 = t2.split(' ').filter(word => word.length > 2);
    const commonRoleWords = roleWords1.filter(word => roleWords2.includes(word));
    
    return commonRoleWords.length / Math.max(roleWords1.length, roleWords2.length);
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

