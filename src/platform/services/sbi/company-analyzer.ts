/**
 * 🏢 SBI COMPANY ANALYZER
 * 
 * Core service for analyzing individual companies through the 4-step pipeline:
 * 1. Company Resolution (acquisition detection)
 * 2. Role Detection (CFO/CRO identification) 
 * 3. Email Discovery (with verification)
 * 4. Phone Discovery (with verification)
 */

// Import existing services instead of creating new ones
import { CompanyResolver } from '@/platform/intelligence/modules/CompanyResolver';
import { ContactValidator } from '@/platform/pipelines/modules/core/ContactValidator';
import { RoleDetectionEngine } from '@/platform/intelligence/modules/RoleDetectionEngine';
import { enrichContactWithLushaPhones } from '@/platform/intelligence/services/LushaPhoneEnrichment';
import { ComprehensiveCompanyIntelligence } from '@/platform/services/comprehensive-company-intelligence';
import { RealTimeIntelligenceEngine } from '@/platform/ai/services/RealTimeIntelligenceEngine';
import { 
  CompanyInput, 
  ProcessingOptions, 
  CompanyAnalysisResult,
  CompanyResolution,
  RoleDetection,
  EmailDiscovery,
  PhoneDiscovery,
  ExecutiveContact,
  EmailContact,
  PhoneContact
} from './types';

export class CompanyAnalyzer {
  private companyResolver: CompanyResolver;
  private contactValidator: ContactValidator;
  private roleDetectionEngine: RoleDetectionEngine;
  private lushaApiKey: string;
  private comprehensiveIntelligence: ComprehensiveCompanyIntelligence;
  private realTimeIntelligence: RealTimeIntelligenceEngine;
  
  constructor() {
    // Initialize with existing services
    this.companyResolver = new CompanyResolver();
    this.contactValidator = new ContactValidator();
    this.roleDetectionEngine = new RoleDetectionEngine();
    this.lushaApiKey = process.env.LUSHA_API_KEY || '';
    this.comprehensiveIntelligence = new ComprehensiveCompanyIntelligence();
    this.realTimeIntelligence = new RealTimeIntelligenceEngine({
      coreSignalApiKey: process.env.CORESIGNAL_API_KEY || '',
      perplexityApiKey: process.env.PERPLEXITY_API_KEY || ''
    });
  }
  
  /**
   * 🚀 PROCESS SINGLE COMPANY
   * 
   * Main entry point for analyzing a single company through the 4-step pipeline
   */
  async processSingleCompany(
    company: CompanyInput,
    options: ProcessingOptions = {}
  ): Promise<CompanyAnalysisResult> {
    const startTime = Date.now();
    
    console.log(`\n🏢 ANALYZING COMPANY: ${company.name || company.domain}`);
    console.log('=' .repeat(50));
    
    try {
      // Step 1: Company Resolution
      console.log('📍 Step 1: Company Resolution');
      const companyResolution = await this.resolveCompany(company, options);
      console.log(`✅ Company resolved: ${companyResolution.name} (${companyResolution.confidence}% confidence)`);
      
      // Step 2: Role Detection
      console.log('👥 Step 2: Role Detection');
      const roleDetection = await this.detectRoles(companyResolution, options);
      console.log(`✅ Roles detected: CFO=${!!roleDetection.cfo}, CRO=${!!roleDetection.cro} (${roleDetection.confidence}% confidence)`);
      
      // Step 3: Email Discovery
      console.log('📧 Step 3: Email Discovery');
      const emailDiscovery = await this.discoverEmails(roleDetection, companyResolution, options);
      console.log(`✅ Emails discovered: ${emailDiscovery.emails.length} emails (${emailDiscovery.confidence}% confidence)`);
      
      // Step 4: Phone Discovery
      console.log('📞 Step 4: Phone Discovery');
      const phoneDiscovery = await this.discoverPhones(roleDetection, companyResolution, options);
      console.log(`✅ Phones discovered: ${phoneDiscovery.phones.length} phones (${phoneDiscovery.confidence}% confidence)`);
      
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence([
        companyResolution.confidence,
        roleDetection.confidence,
        emailDiscovery.confidence,
        phoneDiscovery.confidence
      ]);
      
      const processingTime = Date.now() - startTime;
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(overallConfidence, {
        company: companyResolution,
        roles: roleDetection,
        emails: emailDiscovery,
        phones: phoneDiscovery
      });
      
      console.log(`\n🎯 ANALYSIS COMPLETE: ${overallConfidence}% confidence (${processingTime}ms)`);
      
      return {
        company: companyResolution,
        roles: roleDetection,
        emails: emailDiscovery,
        phones: phoneDiscovery,
        overallConfidence,
        recommendations,
        warnings: this.generateWarnings(overallConfidence, recommendations),
        processingTime,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Error analyzing company ${company.name || company.domain}:`, error);
      throw error;
    }
  }
  
  /**
   * 📍 STEP 1: COMPANY RESOLUTION
   * 
   * Resolve company identity and detect acquisitions
   */
  private async resolveCompany(
    company: CompanyInput,
    options: ProcessingOptions
  ): Promise<CompanyResolution> {
    try {
      // Use your existing CompanyResolver
      const resolution = await this.companyResolver.resolveCompany({
        companyName: company.name || '',
        companyUrl: company.domain || company.website || ''
      });
      
      return {
        name: resolution.companyName,
        domain: this.extractDomain(resolution.finalUrl),
        website: resolution.finalUrl,
        industry: undefined, // Will be filled by other modules
        size: undefined,
        location: undefined,
        status: this.mapCompanyStatus(resolution.companyStatus),
        parentCompany: resolution.parentCompany ? {
          name: resolution.parentCompany.name,
          domain: this.extractDomain(resolution.parentCompany.domain || '')
        } : undefined,
        acquisitionDate: resolution.acquisitionInfo?.acquisitionDate ? 
          new Date(resolution.acquisitionInfo.acquisitionDate) : undefined,
        confidence: resolution.confidence,
        sources: ['company_resolver'],
        lastVerified: new Date()
      };
      
    } catch (error) {
      console.error('❌ Company resolution failed:', error);
      throw new Error(`Company resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * 👥 STEP 2: ROLE DETECTION
   * 
   * Detect CFO, CRO, and other executive roles
   */
  private async detectRoles(
    company: CompanyResolution,
    options: ProcessingOptions
  ): Promise<RoleDetection> {
    try {
      // Use your existing RoleDetectionEngine
      const roleDetection = await this.roleDetectionEngine.detectRoles({
        companyName: company.name,
        domain: company.domain,
        website: company.website
      });
      
      const executives: { [key: string]: ExecutiveContact } = {};
      
      // Map detected roles to our format
      if (roleDetection.cfo) {
        executives.cfo = {
          name: roleDetection.cfo.name,
          title: roleDetection.cfo.title,
          confidence: roleDetection.cfo.confidence,
          sources: roleDetection.cfo.sources || ['role_detection'],
          lastVerified: new Date()
        };
      }
      
      if (roleDetection.cro) {
        executives.cro = {
          name: roleDetection.cro.name,
          title: roleDetection.cro.title,
          confidence: roleDetection.cro.confidence,
          sources: roleDetection.cro.sources || ['role_detection'],
          lastVerified: new Date()
        };
      }
      
      if (roleDetection.ceo) {
        executives.ceo = {
          name: roleDetection.ceo.name,
          title: roleDetection.ceo.title,
          confidence: roleDetection.ceo.confidence,
          sources: roleDetection.ceo.sources || ['role_detection'],
          lastVerified: new Date()
        };
      }
      
      return {
        ...executives,
        confidence: roleDetection.overallConfidence || 0,
        sources: ['role_detection_engine'],
        lastVerified: new Date()
      };
      
    } catch (error) {
      console.error('❌ Role detection failed:', error);
      return {
        confidence: 0,
        sources: ['role_detection_engine'],
        lastVerified: new Date()
      };
    }
  }
  
  /**
   * 📧 STEP 3: EMAIL DISCOVERY
   * 
   * Discover and verify executive emails
   */
  private async discoverEmails(
    roles: RoleDetection,
    company: CompanyResolution,
    options: ProcessingOptions
  ): Promise<EmailDiscovery> {
    try {
      const emails: EmailContact[] = [];
      
      // Discover emails for each executive
      for (const [role, executive] of Object.entries(roles)) {
        if (executive && typeof executive === 'object' && 'name' in executive) {
          const email = await this.discoverExecutiveEmail(executive, company, options);
          if (email) {
            emails.push(email);
          }
        }
      }
      
      return {
        emails,
        confidence: this.calculateEmailConfidence(emails),
        sources: ['email_discovery'],
        lastVerified: new Date()
      };
      
    } catch (error) {
      console.error('❌ Email discovery failed:', error);
      return {
        emails: [],
        confidence: 0,
        sources: ['email_discovery'],
        lastVerified: new Date()
      };
    }
  }
  
  /**
   * 📞 STEP 4: PHONE DISCOVERY
   * 
   * Discover and verify executive phones
   */
  private async discoverPhones(
    roles: RoleDetection,
    company: CompanyResolution,
    options: ProcessingOptions
  ): Promise<PhoneDiscovery> {
    try {
      const phones: PhoneContact[] = [];
      
      // Discover phones for each executive
      for (const [role, executive] of Object.entries(roles)) {
        if (executive && typeof executive === 'object' && 'name' in executive) {
          const phone = await this.discoverExecutivePhone(executive, company, options);
          if (phone) {
            phones.push(phone);
          }
        }
      }
      
      return {
        phones,
        confidence: this.calculatePhoneConfidence(phones),
        sources: ['phone_discovery'],
        lastVerified: new Date()
      };
      
    } catch (error) {
      console.error('❌ Phone discovery failed:', error);
      return {
        phones: [],
        confidence: 0,
        sources: ['phone_discovery'],
        lastVerified: new Date()
      };
    }
  }
  
  /**
   * 📧 DISCOVER EXECUTIVE EMAIL
   */
  private async discoverExecutiveEmail(
    executive: ExecutiveContact,
    company: CompanyResolution,
    options: ProcessingOptions
  ): Promise<EmailContact | null> {
    try {
      // Use your existing ContactValidator for email discovery
      const emailResult = await this.contactValidator.generateAndValidateEmailsWithDomainIntelligence(
        executive.name,
        company.domain
      );
      
      if (emailResult && emailResult.email) {
        return {
          address: emailResult.email,
          type: 'professional',
          isValid: emailResult.isValid || false,
          isVerified: emailResult.isVerified || false,
          confidence: emailResult.confidence || 0,
          sources: ['contact_validator'],
          lastVerified: new Date()
        };
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Email discovery failed for ${executive.name}:`, error);
      return null;
    }
  }
  
  /**
   * 📞 DISCOVER EXECUTIVE PHONE
   */
  private async discoverExecutivePhone(
    executive: ExecutiveContact,
    company: CompanyResolution,
    options: ProcessingOptions
  ): Promise<PhoneContact | null> {
    try {
      // Use your existing LushaPhoneEnrichment
      const phoneResult = await enrichContactWithLushaPhones(
        company.domain,
        executive.title,
        this.lushaApiKey
      );
      
      if (phoneResult && phoneResult.phone1) {
        return {
          number: phoneResult.phone1,
          type: phoneResult.phone1Type || 'mobile',
          context: 'professional',
          isValid: true, // Lusha provides valid phone numbers
          isVerified: phoneResult.phone1Verified || false,
          confidence: phoneResult.phoneDataQuality || 0,
          sources: ['lusha_phone_enrichment'],
          lastVerified: new Date()
        };
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Phone discovery failed for ${executive.name}:`, error);
      return null;
    }
  }
  
  /**
   * 📊 CALCULATE OVERALL CONFIDENCE
   */
  private calculateOverallConfidence(confidences: number[]): number {
    if (confidences.length === 0) return 0;
    
    const validConfidences = confidences.filter(c => c > 0);
    if (validConfidences.length === 0) return 0;
    
    const average = validConfidences.reduce((sum, c) => sum + c, 0) / validConfidences.length;
    return Math.round(average);
  }
  
  /**
   * 📧 CALCULATE EMAIL CONFIDENCE
   */
  private calculateEmailConfidence(emails: EmailContact[]): number {
    if (emails.length === 0) return 0;
    
    const averageConfidence = emails.reduce((sum, email) => sum + email.confidence, 0) / emails.length;
    return Math.round(averageConfidence);
  }
  
  /**
   * 📞 CALCULATE PHONE CONFIDENCE
   */
  private calculatePhoneConfidence(phones: PhoneContact[]): number {
    if (phones.length === 0) return 0;
    
    const averageConfidence = phones.reduce((sum, phone) => sum + phone.confidence, 0) / phones.length;
    return Math.round(averageConfidence);
  }
  
  /**
   * 🎯 GENERATE RECOMMENDATIONS
   */
  private generateRecommendations(
    overallConfidence: number,
    data: {
      company: CompanyResolution;
      roles: RoleDetection;
      emails: EmailDiscovery;
      phones: PhoneDiscovery;
    }
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallConfidence < 70) {
      recommendations.push('Consider re-running analysis for better accuracy');
    }
    
    if (data.roles.confidence < 70) {
      recommendations.push('Role detection confidence is low - manual verification recommended');
    }
    
    if (data.emails.confidence < 70) {
      recommendations.push('Email discovery confidence is low - consider alternative email sources');
    }
    
    if (data.phones.confidence < 70) {
      recommendations.push('Phone discovery confidence is low - consider alternative phone sources');
    }
    
    if (data.company.status === 'acquired' && !data.company.parentCompany) {
      recommendations.push('Acquisition detected but parent company not identified - manual research needed');
    }
    
    return recommendations;
  }
  
  /**
   * ⚠️ GENERATE WARNINGS
   */
  private generateWarnings(overallConfidence: number, recommendations: string[]): string[] {
    const warnings: string[] = [];
    
    if (overallConfidence < 50) {
      warnings.push('Very low confidence - data may be unreliable');
    }
    
    if (recommendations.length > 3) {
      warnings.push('Multiple data quality issues detected');
    }
    
    return warnings;
  }
  
  /**
   * 🏢 MAP COMPANY STATUS
   */
  private mapCompanyStatus(status: string): 'active' | 'acquired' | 'merged' | 'inactive' {
    switch (status.toLowerCase()) {
      case 'active': return 'active';
      case 'acquired': return 'acquired';
      case 'merged': return 'merged';
      case 'defunct': return 'inactive';
      default: return 'active';
    }
  }
  
  /**
   * 🌐 EXTRACT DOMAIN
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
}
