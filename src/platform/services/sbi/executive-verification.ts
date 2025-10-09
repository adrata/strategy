/**
 * 🎯 EXECUTIVE VERIFICATION SERVICE
 * 
 * Multi-source verification system to ensure we have the RIGHT executive
 * Cross-references multiple data sources to verify executive identity
 */

import { ExecutiveContact, VerificationResult, VerificationSource } from './types';

export class ExecutiveVerification {
  
  /**
   * 🔍 VERIFY EXECUTIVE IDENTITY
   * 
   * Multi-source verification to ensure we have the correct executive
   */
  async verifyExecutiveIdentity(
    executive: ExecutiveContact,
    company: any
  ): Promise<VerificationResult> {
    
    console.log(`🔍 Verifying executive identity: ${executive.name} at ${company.name}`);
    
    const verificationSources: VerificationSource[] = [];
    let totalConfidence = 0;
    let sourceCount = 0;
    
    // 1. LinkedIn Verification (Highest Priority)
    const linkedinResult = await this.verifyLinkedInProfile(executive, company);
    if (linkedinResult.confidence > 0) {
      verificationSources.push(linkedinResult);
      totalConfidence += linkedinResult.confidence;
      sourceCount++;
    }
    
    // 2. Company Website Verification
    const websiteResult = await this.verifyCompanyWebsite(executive, company);
    if (websiteResult.confidence > 0) {
      verificationSources.push(websiteResult);
      totalConfidence += websiteResult.confidence;
      sourceCount++;
    }
    
    // 3. News/PR Verification
    const newsResult = await this.verifyNewsSources(executive, company);
    if (newsResult.confidence > 0) {
      verificationSources.push(newsResult);
      totalConfidence += newsResult.confidence;
      sourceCount++;
    }
    
    // 4. SEC Filings Verification (for public companies)
    const secResult = await this.verifySECFilings(executive, company);
    if (secResult.confidence > 0) {
      verificationSources.push(secResult);
      totalConfidence += secResult.confidence;
      sourceCount++;
    }
    
    // 5. Professional Networks Verification
    const networkResult = await this.verifyProfessionalNetworks(executive, company);
    if (networkResult.confidence > 0) {
      verificationSources.push(networkResult);
      totalConfidence += networkResult.confidence;
      sourceCount++;
    }
    
    const averageConfidence = sourceCount > 0 ? totalConfidence / sourceCount : 0;
    const verificationScore = this.calculateVerificationScore(verificationSources);
    
    return {
      executive,
      company,
      verified: verificationScore >= 70,
      confidence: Math.round(averageConfidence),
      verificationScore,
      sources: verificationSources,
      recommendations: this.generateVerificationRecommendations(verificationScore, verificationSources),
      timestamp: new Date()
    };
  }
  
  /**
   * 💼 LINKEDIN VERIFICATION
   * 
   * Verify executive through LinkedIn profile analysis
   */
  private async verifyLinkedInProfile(
    executive: ExecutiveContact,
    company: any
  ): Promise<VerificationSource> {
    try {
      // Use your existing LinkedIn integration
      const linkedinData = await this.fetchLinkedInProfile(executive.name, company.name);
      
      if (!linkedinData) {
        return {
          source: 'linkedin',
          confidence: 0,
          verified: false,
          details: 'No LinkedIn profile found',
          url: null
        };
      }
      
      // Verify name match
      const nameMatch = this.calculateNameMatch(executive.name, linkedinData.name);
      
      // Verify company match
      const companyMatch = this.calculateCompanyMatch(company.name, linkedinData.currentCompany);
      
      // Verify title match
      const titleMatch = this.calculateTitleMatch(executive.title, linkedinData.title);
      
      // Calculate overall confidence
      const confidence = Math.round((nameMatch + companyMatch + titleMatch) / 3);
      
      return {
        source: 'linkedin',
        confidence,
        verified: confidence >= 80,
        details: `Name: ${nameMatch}%, Company: ${companyMatch}%, Title: ${titleMatch}%`,
        url: linkedinData.profileUrl
      };
      
    } catch (error) {
      console.error('❌ LinkedIn verification failed:', error);
      return {
        source: 'linkedin',
        confidence: 0,
        verified: false,
        details: 'LinkedIn verification failed',
        url: null
      };
    }
  }
  
  /**
   * 🌐 COMPANY WEBSITE VERIFICATION
   * 
   * Verify executive through company website leadership page
   */
  private async verifyCompanyWebsite(
    executive: ExecutiveContact,
    company: any
  ): Promise<VerificationSource> {
    try {
      // Scrape company leadership page
      const leadershipData = await this.scrapeLeadershipPage(company.website);
      
      if (!leadershipData) {
        return {
          source: 'company_website',
          confidence: 0,
          verified: false,
          details: 'No leadership page found',
          url: null
        };
      }
      
      // Find executive in leadership data
      const executiveMatch = leadershipData.find(leader => 
        this.calculateNameMatch(executive.name, leader.name) >= 80
      );
      
      if (!executiveMatch) {
        return {
          source: 'company_website',
          confidence: 0,
          verified: false,
          details: 'Executive not found on leadership page',
          url: company.website
        };
      }
      
      // Verify title match
      const titleMatch = this.calculateTitleMatch(executive.title, executiveMatch.title);
      
      return {
        source: 'company_website',
        confidence: titleMatch,
        verified: titleMatch >= 80,
        details: `Title match: ${titleMatch}%`,
        url: company.website
      };
      
    } catch (error) {
      console.error('❌ Company website verification failed:', error);
      return {
        source: 'company_website',
        confidence: 0,
        verified: false,
        details: 'Website verification failed',
        url: null
      };
    }
  }
  
  /**
   * 📰 NEWS/PR VERIFICATION
   * 
   * Verify executive through news articles and press releases
   */
  private async verifyNewsSources(
    executive: ExecutiveContact,
    company: any
  ): Promise<VerificationSource> {
    try {
      // Search for news articles mentioning the executive
      const newsResults = await this.searchNewsArticles(executive.name, company.name);
      
      if (newsResults.length === 0) {
        return {
          source: 'news_articles',
          confidence: 0,
          verified: false,
          details: 'No news articles found',
          url: null
        };
      }
      
      // Analyze news articles for verification
      let totalConfidence = 0;
      let verifiedArticles = 0;
      
      for (const article of newsResults) {
        const articleConfidence = this.analyzeNewsArticle(article, executive, company);
        if (articleConfidence > 0) {
          totalConfidence += articleConfidence;
          verifiedArticles++;
        }
      }
      
      const averageConfidence = verifiedArticles > 0 ? totalConfidence / verifiedArticles : 0;
      
      return {
        source: 'news_articles',
        confidence: Math.round(averageConfidence),
        verified: averageConfidence >= 70,
        details: `${verifiedArticles} verified articles`,
        url: newsResults[0]?.url || null
      };
      
    } catch (error) {
      console.error('❌ News verification failed:', error);
      return {
        source: 'news_articles',
        confidence: 0,
        verified: false,
        details: 'News verification failed',
        url: null
      };
    }
  }
  
  /**
   * 📊 SEC FILINGS VERIFICATION
   * 
   * Verify executive through SEC filings (public companies only)
   */
  private async verifySECFilings(
    executive: ExecutiveContact,
    company: any
  ): Promise<VerificationSource> {
    try {
      // Check if company is public
      if (!company.isPublic) {
        return {
          source: 'sec_filings',
          confidence: 0,
          verified: false,
          details: 'Company is not public',
          url: null
        };
      }
      
      // Search SEC filings for executive
      const secResults = await this.searchSECFilings(executive.name, company.name);
      
      if (secResults.length === 0) {
        return {
          source: 'sec_filings',
          confidence: 0,
          verified: false,
          details: 'No SEC filings found',
          url: null
        };
      }
      
      // Analyze SEC filings
      const filingConfidence = this.analyzeSECFilings(secResults, executive, company);
      
      return {
        source: 'sec_filings',
        confidence: filingConfidence,
        verified: filingConfidence >= 90,
        details: `${secResults.length} SEC filings found`,
        url: secResults[0]?.url || null
      };
      
    } catch (error) {
      console.error('❌ SEC verification failed:', error);
      return {
        source: 'sec_filings',
        confidence: 0,
        verified: false,
        details: 'SEC verification failed',
        url: null
      };
    }
  }
  
  /**
   * 🌐 PROFESSIONAL NETWORKS VERIFICATION
   * 
   * Verify executive through professional networks and associations
   */
  private async verifyProfessionalNetworks(
    executive: ExecutiveContact,
    company: any
  ): Promise<VerificationSource> {
    try {
      // Search professional networks
      const networkResults = await this.searchProfessionalNetworks(executive.name, company.name);
      
      if (networkResults.length === 0) {
        return {
          source: 'professional_networks',
          confidence: 0,
          verified: false,
          details: 'No professional network profiles found',
          url: null
        };
      }
      
      // Analyze network profiles
      const networkConfidence = this.analyzeProfessionalNetworks(networkResults, executive, company);
      
      return {
        source: 'professional_networks',
        confidence: networkConfidence,
        verified: networkConfidence >= 70,
        details: `${networkResults.length} network profiles found`,
        url: networkResults[0]?.url || null
      };
      
    } catch (error) {
      console.error('❌ Professional network verification failed:', error);
      return {
        source: 'professional_networks',
        confidence: 0,
        verified: false,
        details: 'Professional network verification failed',
        url: null
      };
    }
  }
  
  /**
   * 📊 CALCULATE VERIFICATION SCORE
   * 
   * Calculate overall verification score based on multiple sources
   */
  private calculateVerificationScore(sources: VerificationSource[]): number {
    if (sources.length === 0) return 0;
    
    // Weight different sources differently
    const weights = {
      linkedin: 0.3,
      company_website: 0.25,
      sec_filings: 0.2,
      news_articles: 0.15,
      professional_networks: 0.1
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const source of sources) {
      const weight = weights[source.source as keyof typeof weights] || 0.1;
      weightedScore += source.confidence * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }
  
  /**
   * 🎯 CALCULATE NAME MATCH
   * 
   * Calculate name similarity between detected and verified names
   */
  private calculateNameMatch(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;
    
    const name1Lower = name1.toLowerCase().trim();
    const name2Lower = name2.toLowerCase().trim();
    
    // Exact match
    if (name1Lower === name2Lower) return 100;
    
    // Split names into parts
    const name1Parts = name1Lower.split(/\s+/);
    const name2Parts = name2Lower.split(/\s+/);
    
    // Check for partial matches
    let matches = 0;
    for (const part1 of name1Parts) {
      for (const part2 of name2Parts) {
        if (part1 === part2) {
          matches++;
          break;
        }
      }
    }
    
    return Math.round((matches / Math.max(name1Parts.length, name2Parts.length)) * 100);
  }
  
  /**
   * 🏢 CALCULATE COMPANY MATCH
   * 
   * Calculate company similarity
   */
  private calculateCompanyMatch(company1: string, company2: string): number {
    if (!company1 || !company2) return 0;
    
    const company1Lower = company1.toLowerCase().trim();
    const company2Lower = company2.toLowerCase().trim();
    
    // Exact match
    if (company1Lower === company2Lower) return 100;
    
    // Check for partial matches
    if (company1Lower.includes(company2Lower) || company2Lower.includes(company1Lower)) {
      return 90;
    }
    
    // Check for common words
    const words1 = company1Lower.split(/\s+/);
    const words2 = company2Lower.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 && word1.length > 2) {
          commonWords++;
          break;
        }
      }
    }
    
    return Math.round((commonWords / Math.max(words1.length, words2.length)) * 100);
  }
  
  /**
   * 💼 CALCULATE TITLE MATCH
   * 
   * Calculate title similarity
   */
  private calculateTitleMatch(title1: string, title2: string): number {
    if (!title1 || !title2) return 0;
    
    const title1Lower = title1.toLowerCase().trim();
    const title2Lower = title2.toLowerCase().trim();
    
    // Exact match
    if (title1Lower === title2Lower) return 100;
    
    // Check for key role indicators
    const roleIndicators = {
      cfo: ['chief financial officer', 'cfo', 'c.f.o.', 'chief accounting officer'],
      cro: ['chief revenue officer', 'cro', 'c.r.o.', 'chief sales officer'],
      ceo: ['chief executive officer', 'ceo', 'c.e.o.', 'president', 'founder']
    };
    
    for (const [role, indicators] of Object.entries(roleIndicators)) {
      const title1HasRole = indicators.some(indicator => title1Lower.includes(indicator));
      const title2HasRole = indicators.some(indicator => title2Lower.includes(indicator));
      
      if (title1HasRole && title2HasRole) {
        return 95; // High confidence for role match
      }
    }
    
    // Check for partial matches
    if (title1Lower.includes(title2Lower) || title2Lower.includes(title1Lower)) {
      return 85;
    }
    
    return 50; // Default partial match
  }
  
  /**
   * 📋 GENERATE VERIFICATION RECOMMENDATIONS
   * 
   * Generate recommendations based on verification results
   */
  private generateVerificationRecommendations(
    verificationScore: number,
    sources: VerificationSource[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (verificationScore < 70) {
      recommendations.push('Low verification confidence - manual verification recommended');
    }
    
    if (sources.length < 2) {
      recommendations.push('Limited verification sources - consider additional research');
    }
    
    const linkedinSource = sources.find(s => s.source === 'linkedin');
    if (!linkedinSource || linkedinSource.confidence < 80) {
      recommendations.push('LinkedIn verification missing or low - check LinkedIn profile');
    }
    
    const websiteSource = sources.find(s => s.source === 'company_website');
    if (!websiteSource || websiteSource.confidence < 80) {
      recommendations.push('Company website verification missing - check leadership page');
    }
    
    return recommendations;
  }
  
  // Placeholder methods for external integrations
  private async fetchLinkedInProfile(name: string, company: string): Promise<any> { return null; }
  private async scrapeLeadershipPage(website: string): Promise<any[]> { return []; }
  private async searchNewsArticles(name: string, company: string): Promise<any[]> { return []; }
  private async searchSECFilings(name: string, company: string): Promise<any[]> { return []; }
  private async searchProfessionalNetworks(name: string, company: string): Promise<any[]> { return []; }
  private analyzeNewsArticle(article: any, executive: ExecutiveContact, company: any): number { return 0; }
  private analyzeSECFilings(filings: any[], executive: ExecutiveContact, company: any): number { return 0; }
  private analyzeProfessionalNetworks(networks: any[], executive: ExecutiveContact, company: any): number { return 0; }
}
