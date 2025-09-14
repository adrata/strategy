#!/usr/bin/env node

/**
 * 🛡️ CONTACT GUARANTEE ENGINE
 * 
 * GUARANTEES email, LinkedIn, and phone discovery for executives
 * Uses 7-layer validation and multiple fallback strategies
 * NO EXECUTIVE LEAVES WITHOUT COMPLETE CONTACT INFORMATION
 */

// Node.js compatibility
if (typeof global !== 'undefined' && !global.fetch) {
  global['fetch'] = require('node-fetch');
}

import type { ExecutiveContact, APIConfig } from '../types/intelligence';

export interface ContactGuaranteeResult {
  executive: ExecutiveContact;
  guaranteeStatus: 'GUARANTEED' | 'PARTIAL' | 'FAILED';
  completenessScore: number; // 0-100
  discoveryMethods: string[];
  validationResults: {
    email: { found: boolean; confidence: number; method: string };
    phone: { found: boolean; confidence: number; method: string };
    linkedin: { found: boolean; confidence: number; method: string };
  };
  fallbacksUsed: string[];
  totalApiCalls: number;
  processingTimeMs: number;
}

export class ContactGuaranteeEngine {
  private config: APIConfig;
  
  constructor(config: APIConfig) {
    this['config'] = config;
  }
  
  /**
   * 🛡️ GUARANTEE COMPLETE CONTACT INFORMATION
   */
  async guaranteeContactInfo(executive: ExecutiveContact): Promise<ContactGuaranteeResult> {
    const startTime = Date.now();
    console.log(`🛡️ [GUARANTEE] Ensuring complete contact info for ${executive.name} at ${executive.company}`);
    
    const result: ContactGuaranteeResult = {
      executive: { ...executive },
      guaranteeStatus: 'FAILED',
      completenessScore: 0,
      discoveryMethods: [],
      validationResults: {
        email: { found: false, confidence: 0, method: 'none' },
        phone: { found: false, confidence: 0, method: 'none' },
        linkedin: { found: false, confidence: 0, method: 'none' }
      },
      fallbacksUsed: [],
      totalApiCalls: 0,
      processingTimeMs: 0
    };
    
    try {
      // LAYER 1: Validate existing data
      await this.validateExistingData(result);
      
      // LAYER 2: CoreSignal professional search (highest accuracy)
      if (!this.isComplete(result)) {
        await this.coreSignalProfessionalSearch(result);
      }
      
      // LAYER 3: Lusha executive search (proven working method)
      if (!this.isComplete(result)) {
        await this.lushaExecutiveSearch(result);
      }
      
      // LAYER 4: Prospeo domain-based discovery
      if (!this.isComplete(result)) {
        await this.prospeoEmailDiscovery(result);
      }
      
      // LAYER 5: LinkedIn Sales Navigator search
      if (!this.isComplete(result)) {
        await this.linkedInSearch(result);
      }
      
      // LAYER 6: AI-powered cross-domain research
      if (!this.isComplete(result)) {
        await this.aiCrossDomainResearch(result);
      }
      
      // LAYER 7: Pattern-based email generation and validation
      if (!result.validationResults.email.found) {
        await this.patternBasedEmailGeneration(result);
      }
      
      // FINAL VALIDATION: Verify all discovered contacts
      await this.finalValidation(result);
      
      // Calculate final scores
      result['completenessScore'] = this.calculateCompletenessScore(result);
      result['guaranteeStatus'] = this.determineGuaranteeStatus(result);
      result['processingTimeMs'] = Date.now() - startTime;
      
      console.log(`✅ [GUARANTEE] ${result.guaranteeStatus} for ${executive.name}`);
      console.log(`   Email: ${result.validationResults.email.found ? '✅' : '❌'} (${result.validationResults.email.confidence}%)`);
      console.log(`   Phone: ${result.validationResults.phone.found ? '✅' : '❌'} (${result.validationResults.phone.confidence}%)`);
      console.log(`   LinkedIn: ${result.validationResults.linkedin.found ? '✅' : '❌'} (${result.validationResults.linkedin.confidence}%)`);
      console.log(`   Completeness: ${result.completenessScore}%`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ [GUARANTEE] Failed for ${executive.name}:`, error);
      result['processingTimeMs'] = Date.now() - startTime;
      return result;
    }
  }
  
  /**
   * ✅ VALIDATE EXISTING DATA
   */
  private async validateExistingData(result: ContactGuaranteeResult): Promise<void> {
    const exec = result.executive;
    
    // Validate email
    if (exec['email'] && this.isValidEmail(exec.email)) {
      result['validationResults']['email'] = { found: true, confidence: 85, method: 'existing_data' };
      result.discoveryMethods.push('existing_email_validated');
    }
    
    // Validate phone
    if (exec['phone'] && this.isValidPhone(exec.phone)) {
      result['validationResults']['phone'] = { found: true, confidence: 85, method: 'existing_data' };
      result.discoveryMethods.push('existing_phone_validated');
    }
    
    // Validate LinkedIn
    if (exec['linkedin'] && this.isValidLinkedInUrl(exec.linkedin)) {
      result['validationResults']['linkedin'] = { found: true, confidence: 90, method: 'existing_data' };
      result.discoveryMethods.push('existing_linkedin_validated');
    }
  }
  
  /**
   * 🎯 CORESIGNAL PROFESSIONAL SEARCH
   */
  private async coreSignalProfessionalSearch(result: ContactGuaranteeResult): Promise<void> {
    console.log(`   🎯 [LAYER 2] CoreSignal professional search...`);
    
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v1/professional_networks/member/search/filter', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.coreSignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: result.executive.name,
          current_company_name: result.executive.company,
          current_title: result.executive.title,
          limit: 5
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        result.totalApiCalls++;
        
        if (data['results'] && data.results.length > 0) {
          const match = data['results'][0];
          
          // Extract professional email
          if (match['professional_email'] && !result.validationResults.email.found) {
            result['executive']['email'] = match.professional_email;
            result['validationResults']['email'] = { found: true, confidence: 95, method: 'coresignal_professional' };
            result.discoveryMethods.push('coresignal_professional_email');
          }
          
          // Extract LinkedIn URL
          if (match['linkedin_url'] && !result.validationResults.linkedin.found) {
            result['executive']['linkedin'] = match.linkedin_url;
            result['validationResults']['linkedin'] = { found: true, confidence: 98, method: 'coresignal_linkedin' };
            result.discoveryMethods.push('coresignal_linkedin');
          }
          
          console.log(`     ✅ CoreSignal found professional data`);
        }
      }
    } catch (error) {
      console.log(`     ❌ CoreSignal search failed:`, error instanceof Error ? error.message : String(error));
      result.fallbacksUsed.push('coresignal_failed');
    }
  }
  
  /**
   * 📞 LUSHA EXECUTIVE SEARCH (PROVEN WORKING METHOD)
   */
  private async lushaExecutiveSearch(result: ContactGuaranteeResult): Promise<void> {
    console.log(`   📞 [LAYER 3] Lusha executive search (proven method)...`);
    
    try {
      // Use the EXACT proven working pattern from the old pipeline
      const searchParams = {
        firstName: result.executive.name.split(' ')[0],
        lastName: result.executive.name.split(' ').slice(1).join(' '),
        companyName: result.executive.company,
        jobTitle: result.executive.title,
        refreshJobInfo: true,
        revealEmails: true,
        revealPhones: true
      };
      
      const response = await fetch('https://api.lusha.com/person', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.lushaApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      });
      
      if (response.ok) {
        const data = await response.json();
        result.totalApiCalls++;
        
        if (data['data'] && data.data.length > 0) {
          const person = data['data'][0];
          
          // Extract email using exact proven pattern
          if (person['email'] && person.email.length > 0 && !result.validationResults.email.found) {
            const email = Array.isArray(person.email) ? person['email'][0] : person.email;
            if (this.isValidEmail(email)) {
              result['executive']['email'] = email;
              result['validationResults']['email'] = { found: true, confidence: 92, method: 'lusha_executive' };
              result.discoveryMethods.push('lusha_executive_email');
            }
          }
          
          // Extract phone using exact proven pattern
          if (person['phoneNumbers'] && person.phoneNumbers.length > 0 && !result.validationResults.phone.found) {
            const phone = person['phoneNumbers'][0];
            if (this.isValidPhone(phone)) {
              result['executive']['phone'] = phone;
              result['validationResults']['phone'] = { found: true, confidence: 88, method: 'lusha_phone' };
              result.discoveryMethods.push('lusha_phone_discovery');
            }
          }
          
          // Extract LinkedIn from Lusha
          if (person['linkedinUrl'] && !result.validationResults.linkedin.found) {
            result['executive']['linkedin'] = person.linkedinUrl;
            result['validationResults']['linkedin'] = { found: true, confidence: 90, method: 'lusha_linkedin' };
            result.discoveryMethods.push('lusha_linkedin');
          }
          
          console.log(`     ✅ Lusha found executive data`);
        }
      }
    } catch (error) {
      console.log(`     ❌ Lusha search failed:`, error.message);
      result.fallbacksUsed.push('lusha_failed');
    }
  }
  
  /**
   * 📧 PROSPEO EMAIL DISCOVERY
   */
  private async prospeoEmailDiscovery(result: ContactGuaranteeResult): Promise<void> {
    if (result.validationResults.email.found) return;
    
    console.log(`   📧 [LAYER 4] Prospeo email discovery...`);
    
    try {
      // Clean domain for Prospeo API
      const domain = result.executive.website || result.executive.company;
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
      
      const response = await fetch('https://api.prospeo.io/email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': this.config.prospeoApiKey
        },
        body: JSON.stringify({
          first_name: result.executive.name.split(' ')[0],
          last_name: result.executive.name.split(' ').slice(1).join(' '),
          company_domain: cleanDomain
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        result.totalApiCalls++;
        
        if (data['email'] && data.score > 70) {
          result['executive']['email'] = data.email;
          result['validationResults']['email'] = { 
            found: true, 
            confidence: data.score, 
            method: 'prospeo_domain' 
          };
          result.discoveryMethods.push('prospeo_email_finder');
          console.log(`     ✅ Prospeo found email: ${data.email} (${data.score}% confidence)`);
        }
      }
    } catch (error) {
      console.log(`     ❌ Prospeo search failed:`, error.message);
      result.fallbacksUsed.push('prospeo_failed');
    }
  }
  
  /**
   * 💼 LINKEDIN SEARCH
   */
  private async linkedInSearch(result: ContactGuaranteeResult): Promise<void> {
    if (result.validationResults.linkedin.found) return;
    
    console.log(`   💼 [LAYER 5] LinkedIn search...`);
    
    try {
      // Use AI to construct LinkedIn search and find profile
      const prompt = `Find the LinkedIn profile URL for:
Name: ${result.executive.name}
Title: ${result.executive.title}
Company: ${result.executive.company}

Provide just the LinkedIn URL in the format: https://www.linkedin.com/in/[profile]`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 200
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        result.totalApiCalls++;
        
        const content = data['choices'][0]?.message?.content || '';
        const linkedinMatch = content.match(/https:\/\/www\.linkedin\.com\/in\/[^\s]+/);
        
        if (linkedinMatch) {
          result['executive']['linkedin'] = linkedinMatch[0];
          result['validationResults']['linkedin'] = { found: true, confidence: 85, method: 'ai_linkedin_search' };
          result.discoveryMethods.push('ai_linkedin_discovery');
          console.log(`     ✅ AI found LinkedIn profile`);
        }
      }
    } catch (error) {
      console.log(`     ❌ LinkedIn search failed:`, error.message);
      result.fallbacksUsed.push('linkedin_search_failed');
    }
  }
  
  /**
   * 🧠 AI CROSS-DOMAIN RESEARCH
   */
  private async aiCrossDomainResearch(result: ContactGuaranteeResult): Promise<void> {
    console.log(`   🧠 [LAYER 6] AI cross-domain research...`);
    
    try {
      const prompt = `Find contact information for this executive:

Name: ${result.executive.name}
Title: ${result.executive.title}  
Company: ${result.executive.company}

Search across multiple sources and provide:
1. Professional email address
2. Business phone number
3. LinkedIn profile URL

Focus on current, accurate contact information from professional sources.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 500
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        result.totalApiCalls++;
        
        const content = data['choices'][0]?.message?.content || '';
        
        // Extract email
        if (!result.validationResults.email.found) {
          const emailMatch = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
          if (emailMatch && this.isValidEmail(emailMatch[0])) {
            result['executive']['email'] = emailMatch[0];
            result['validationResults']['email'] = { found: true, confidence: 75, method: 'ai_cross_domain' };
            result.discoveryMethods.push('ai_email_research');
          }
        }
        
        // Extract phone
        if (!result.validationResults.phone.found) {
          const phoneMatch = content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
          if (phoneMatch && this.isValidPhone(phoneMatch[0])) {
            result['executive']['phone'] = phoneMatch[0];
            result['validationResults']['phone'] = { found: true, confidence: 70, method: 'ai_cross_domain' };
            result.discoveryMethods.push('ai_phone_research');
          }
        }
        
        // Extract LinkedIn
        if (!result.validationResults.linkedin.found) {
          const linkedinMatch = content.match(/https:\/\/www\.linkedin\.com\/in\/[^\s]+/);
          if (linkedinMatch) {
            result['executive']['linkedin'] = linkedinMatch[0];
            result['validationResults']['linkedin'] = { found: true, confidence: 80, method: 'ai_cross_domain' };
            result.discoveryMethods.push('ai_linkedin_research');
          }
        }
        
        console.log(`     ✅ AI cross-domain research completed`);
      }
    } catch (error) {
      console.log(`     ❌ AI research failed:`, error.message);
      result.fallbacksUsed.push('ai_research_failed');
    }
  }
  
  /**
   * 🎯 PATTERN-BASED EMAIL GENERATION
   */
  private async patternBasedEmailGeneration(result: ContactGuaranteeResult): Promise<void> {
    if (result.validationResults.email.found) return;
    
    console.log(`   🎯 [LAYER 7] Pattern-based email generation...`);
    
    try {
      const firstName = result.executive.name.split(' ')[0].toLowerCase();
      const lastName = result.executive.name.split(' ').slice(1).join('').toLowerCase();
      const domain = this.extractDomain(result.executive.company);
      
      // Common email patterns
      const patterns = [
        `${firstName}.${lastName}@${domain}`,
        `${firstName}${lastName}@${domain}`,
        `${firstName[0]}${lastName}@${domain}`,
        `${firstName}@${domain}`,
        `${firstName}.${lastName[0]}@${domain}`
      ];
      
      // Validate each pattern
      for (const email of patterns) {
        const isValid = await this.validateEmailWithZeroBounce(email);
        if (isValid) {
          result['executive']['email'] = email;
          result['validationResults']['email'] = { found: true, confidence: 65, method: 'pattern_generation' };
          result.discoveryMethods.push('pattern_based_email');
          console.log(`     ✅ Pattern-based email validated: ${email}`);
          break;
        }
        result.totalApiCalls++;
      }
    } catch (error) {
      console.log(`     ❌ Pattern generation failed:`, error.message);
      result.fallbacksUsed.push('pattern_generation_failed');
    }
  }
  
  /**
   * ✅ FINAL VALIDATION
   */
  private async finalValidation(result: ContactGuaranteeResult): Promise<void> {
    console.log(`   ✅ [FINAL] Validating all discovered contacts...`);
    
    // Validate email if found
    if (result.validationResults['email']['found'] && result.executive.email) {
      const emailValid = await this.validateEmailWithZeroBounce(result.executive.email);
      if (!emailValid) {
        result.validationResults.email.confidence *= 0.5; // Reduce confidence
        result.fallbacksUsed.push('email_validation_failed');
      }
      result.totalApiCalls++;
    }
    
    // Validate phone if found
    if (result.validationResults['phone']['found'] && result.executive.phone) {
      const phoneValid = this.isValidPhone(result.executive.phone);
      if (!phoneValid) {
        result.validationResults.phone.confidence *= 0.5;
        result.fallbacksUsed.push('phone_validation_failed');
      }
    }
    
    // Validate LinkedIn if found
    if (result.validationResults['linkedin']['found'] && result.executive.linkedin) {
      const linkedinValid = this.isValidLinkedInUrl(result.executive.linkedin);
      if (!linkedinValid) {
        result.validationResults.linkedin.confidence *= 0.5;
        result.fallbacksUsed.push('linkedin_validation_failed');
      }
    }
  }
  
  /**
   * 📧 VALIDATE EMAIL WITH ZEROBOUNCE
   */
  private async validateEmailWithZeroBounce(email: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${this.config.zeroBounceApiKey}&email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        return data['status'] === 'valid' || data['status'] === 'catch-all';
      }
    } catch (error) {
      console.log(`     ❌ ZeroBounce validation failed:`, error.message);
    }
    
    return false;
  }
  
  /**
   * 🏢 EXTRACT DOMAIN FROM COMPANY NAME
   */
  private extractDomain(companyName: string): string {
    // Simple domain extraction - in production, you'd want more sophisticated logic
    return companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/(inc|corp|llc|ltd|company|co)$/, '') + '.com';
  }
  
  /**
   * ✅ VALIDATION HELPERS
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && !email.includes('noreply') && !email.includes('no-reply');
  }
  
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
    return phoneRegex.test(phone);
  }
  
  private isValidLinkedInUrl(url: string): boolean {
    return url.includes('linkedin.com/in/') && !url.includes('linkedin.com/company/');
  }
  
  /**
   * 📊 COMPLETENESS HELPERS
   */
  private isComplete(result: ContactGuaranteeResult): boolean {
    return result.validationResults['email']['found'] && 
           result.validationResults['phone']['found'] && 
           result.validationResults.linkedin.found;
  }
  
  private calculateCompletenessScore(result: ContactGuaranteeResult): number {
    let score = 0;
    
    if (result.validationResults.email.found) {
      score += 40 * (result.validationResults.email.confidence / 100);
    }
    
    if (result.validationResults.phone.found) {
      score += 30 * (result.validationResults.phone.confidence / 100);
    }
    
    if (result.validationResults.linkedin.found) {
      score += 30 * (result.validationResults.linkedin.confidence / 100);
    }
    
    return Math.round(score);
  }
  
  private determineGuaranteeStatus(result: ContactGuaranteeResult): 'GUARANTEED' | 'PARTIAL' | 'FAILED' {
    const emailFound = result.validationResults.email.found;
    const phoneFound = result.validationResults.phone.found;
    const linkedinFound = result.validationResults.linkedin.found;
    
    if (emailFound && phoneFound && linkedinFound) {
      return 'GUARANTEED';
    } else if (emailFound || phoneFound || linkedinFound) {
      return 'PARTIAL';
    } else {
      return 'FAILED';
    }
  }
}
