/**
 * ✅ VALIDATION ENGINE MODULE
 * 
 * Comprehensive validation system for executive data:
 * 1. Multi-source cross-validation
 * 2. Data freshness verification  
 * 3. Executive change detection
 * 4. Confidence scoring and risk assessment
 * 5. Quality assurance and accuracy metrics
 */

import { ExecutiveContact, APIConfig, ValidationResult } from '../types/intelligence';
import { TransitionDetector } from './TransitionDetector';

// Ensure fetch is available
if (typeof fetch === 'undefined') {
  global['fetch'] = require('node-fetch');
}

interface ValidationReport {
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  executiveValidations: ExecutiveValidation[];
  qualityMetrics: QualityMetrics;
  recommendations: string[];
  warnings: string[];
  timestamp: string;
}

interface ExecutiveValidation {
  executiveId: string;
  name: string;
  role: string;
  validationScore: number;
  riskFactors: string[];
  dataFreshness: number;
  sourceReliability: number;
  contactAccuracy: number;
  recommendations: string[];
}

interface QualityMetrics {
  dataFreshness: number;
  sourceReliability: number;
  crossValidation: number;
  contactAccuracy: number;
  overallQuality: number;
}

export class ValidationEngine {
  private config: APIConfig;
  private validationCache: Map<string, any> = new Map();
  private riskFactors: string[];
  private transitionDetector: TransitionDetector;

  constructor(config: APIConfig) {
    this['config'] = config;
    this['riskFactors'] = this.initializeRiskFactors();
    this['transitionDetector'] = new TransitionDetector();
    
    console.log('✅ [VALIDATION ENGINE] Module initialized');
    console.log(`   Perplexity AI: ${this.config.PERPLEXITY_API_KEY ? 'Available' : 'Missing'}`);
  }

  /**
   * ✅ MAIN VALIDATION PROCESS
   */
  async validateExecutiveData(
    executives: ExecutiveContact[],
    companyName: string
  ): Promise<ValidationReport> {
    console.log(`\n✅ [VALIDATION] Validating ${executives.length} executives for ${companyName}`);
    
    const validation: ValidationReport = {
      overallScore: 0,
      riskLevel: 'LOW',
      executiveValidations: [],
      qualityMetrics: {
        dataFreshness: 0,
        sourceReliability: 0,
        crossValidation: 0,
        contactAccuracy: 0,
        overallQuality: 0
      },
      recommendations: [],
      warnings: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Validate each executive
      for (const executive of executives) {
        console.log(`   🔍 Validating ${executive.name} (${executive.role})`);
        
        const execValidation = await this.validateExecutive(executive, companyName);
        validation.executiveValidations.push(execValidation);
        
        console.log(`   📊 ${executive.name}: ${execValidation.validationScore}% validation score`);
      }

      // Calculate overall metrics
      validation['qualityMetrics'] = this.calculateQualityMetrics(validation.executiveValidations);
      validation['overallScore'] = validation.qualityMetrics.overallQuality;
      validation['riskLevel'] = this.assessRiskLevel(validation.overallScore);
      
      // Generate recommendations
      validation['recommendations'] = this.generateRecommendations(validation);
      validation['warnings'] = this.generateWarnings(validation);

      console.log(`✅ [VALIDATION] Complete: ${validation.overallScore}% overall score, ${validation.riskLevel} risk`);
      
      return validation;

    } catch (error) {
      console.error(`❌ [VALIDATION] Failed:`, error);
      validation['overallScore'] = 0;
      validation['riskLevel'] = 'CRITICAL';
      validation.warnings.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return validation;
    }
  }

  /**
   * 🔍 VALIDATE INDIVIDUAL EXECUTIVE
   */
  private async validateExecutive(
    executive: ExecutiveContact,
    companyName: string
  ): Promise<ExecutiveValidation> {
    const validation: ExecutiveValidation = {
      executiveId: executive.id,
      name: executive.name,
      role: executive.role,
      validationScore: 0,
      riskFactors: [],
      dataFreshness: 0,
      sourceReliability: 0,
      contactAccuracy: 0,
      recommendations: []
    };

    // 1. Transition Detection Check (Critical)
    const transitionCheck = this.transitionDetector.checkTransitionIndicators(executive);
    if (transitionCheck.isOutdated) {
      validation.riskFactors.push('Executive marked as former or departed');
      validation.recommendations.push('Find current replacement in role');
      validation.validationScore -= 30;
    }
    if (transitionCheck.isInterim) {
      validation.riskFactors.push('Executive in interim/temporary role');
      validation.recommendations.push('Verify permanent appointment status');
      validation.validationScore -= 15;
    }

    // 2. Data Freshness Check
    validation['dataFreshness'] = this.checkDataFreshness(executive);
    if (validation.dataFreshness < 70) {
      validation.riskFactors.push('Potentially outdated information');
      validation.recommendations.push('Verify current employment status');
    }

    // 2. Source Reliability Check
    validation['sourceReliability'] = this.checkSourceReliability(executive);
    if (validation.sourceReliability < 80) {
      validation.riskFactors.push('Low source reliability');
      validation.recommendations.push('Cross-validate with additional sources');
    }

    // 3. Contact Accuracy Check
    validation['contactAccuracy'] = await this.checkContactAccuracy(executive);
    if (validation.contactAccuracy < 70) {
      validation.riskFactors.push('Contact information may be inaccurate');
      validation.recommendations.push('Verify email and phone before outreach');
    }

    // 4. Role Consistency Check
    const roleConsistency = this.checkRoleConsistency(executive);
    if (roleConsistency < 80) {
      validation.riskFactors.push('Role-title mismatch detected');
      validation.recommendations.push('Verify actual responsibilities and authority');
    }

    // 5. AI-Powered Current Status Validation (if API available)
    if (this.config.PERPLEXITY_API_KEY) {
      try {
        const currentStatus = await this.validateCurrentStatus(executive, companyName);
        if (!currentStatus.isCurrent) {
          validation.riskFactors.push('Executive may no longer be with company');
          validation.recommendations.push('Find current replacement in role');
        }
      } catch (error) {
        console.log(`   ⚠️ Current status validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Calculate overall validation score
    validation['validationScore'] = Math.round(
      (validation.dataFreshness * 0.3) +
      (validation.sourceReliability * 0.3) + 
      (validation.contactAccuracy * 0.2) +
      (roleConsistency * 0.2)
    );

    return validation;
  }

  /**
   * 📅 CHECK DATA FRESHNESS
   */
  private checkDataFreshness(executive: ExecutiveContact): number {
    const lastVerified = executive.lastVerified || new Date();
    const daysSinceVerification = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresher data gets higher score
    if (daysSinceVerification < 7) return 95;
    if (daysSinceVerification < 30) return 85;
    if (daysSinceVerification < 90) return 70;
    if (daysSinceVerification < 180) return 50;
    return 30;
  }

  /**
   * 🔍 CHECK SOURCE RELIABILITY
   */
  private checkSourceReliability(executive: ExecutiveContact): number {
    const methods = executive.researchMethods || [];
    let reliability = 50; // Base score

    // High reliability sources
    if (methods.includes('company_website')) reliability += 20;
    if (methods.includes('sec_filing')) reliability += 25;
    if (methods.includes('press_release')) reliability += 20;
    if (methods.includes('linkedin_verified')) reliability += 15;

    // Medium reliability sources  
    if (methods.includes('ai_research')) reliability += 10;
    if (methods.includes('lusha')) reliability += 10;
    if (methods.includes('coresignal')) reliability += 10;

    // Low reliability sources
    if (methods.includes('generated_pattern')) reliability -= 10;
    if (methods.includes('fallback_logic')) reliability -= 15;

    return Math.min(reliability, 95);
  }

  /**
   * 📧 CHECK CONTACT ACCURACY
   */
  private async checkContactAccuracy(executive: ExecutiveContact): Promise<number> {
    let accuracy = 50; // Base score

    // Email accuracy
    if (executive.email) {
      if (executive.email.includes('@') && !this.isGenericEmail(executive.email)) {
        accuracy += 20;
      } else {
        accuracy -= 10;
      }
    }

    // Phone accuracy
    if (executive.phone) {
      if (!this.isGenericPhone(executive.phone)) {
        accuracy += 15;
      } else {
        accuracy -= 10;
      }
    }

    // LinkedIn profile accuracy
    if (executive.linkedinUrl) {
      if (executive.linkedinUrl.includes('linkedin.com/in/')) {
        accuracy += 10;
      }
    }

    return Math.min(accuracy, 95);
  }

  /**
   * 🎯 VALIDATE CURRENT STATUS WITH AI
   */
  private async validateCurrentStatus(
    executive: ExecutiveContact,
    companyName: string
  ): Promise<{ isCurrent: boolean; confidence: number; source: string }> {
    if (!this.config.PERPLEXITY_API_KEY) {
      return { isCurrent: true, confidence: 50, source: 'no_validation' };
    }

    const prompt = `Verify if ${executive.name} is currently the ${executive.role} at ${companyName}.

Please check:
1. Is ${executive.name} still employed at ${companyName}?
2. Is their current title still ${executive.title}?
3. When did they start in this role?
4. Any recent changes or transitions?

Respond with just: CURRENT or NOT_CURRENT, followed by confidence level (0.0-1.0)`;

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
          max_tokens: 200,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        const isCurrent = content.toUpperCase().includes('CURRENT') && 
                         !content.toUpperCase().includes('NOT_CURRENT');
        
        // Extract confidence from response
        const confidenceMatch = content.match(/(\d\.\d+|\d+%)/);
        const confidence = confidenceMatch ? 
          parseFloat(confidenceMatch[1].replace('%', '')) : 80;

        return {
          isCurrent,
          confidence: confidence > 1 ? confidence : confidence * 100,
          source: 'ai_validation'
        };
      }
    } catch (error) {
      console.log(`   ⚠️ AI status validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { isCurrent: true, confidence: 60, source: 'validation_failed' };
  }

  /**
   * 🧮 CALCULATE QUALITY METRICS
   */
  private calculateQualityMetrics(validations: ExecutiveValidation[]): QualityMetrics {
    if (validations['length'] === 0) {
      return {
        dataFreshness: 0,
        sourceReliability: 0,
        crossValidation: 0,
        contactAccuracy: 0,
        overallQuality: 0
      };
    }

    const metrics = {
      dataFreshness: validations.reduce((sum, v) => sum + v.dataFreshness, 0) / validations.length,
      sourceReliability: validations.reduce((sum, v) => sum + v.sourceReliability, 0) / validations.length,
      crossValidation: validations.reduce((sum, v) => sum + v.validationScore, 0) / validations.length,
      contactAccuracy: validations.reduce((sum, v) => sum + v.contactAccuracy, 0) / validations.length,
      overallQuality: 0
    };

    // Calculate weighted overall quality
    metrics['overallQuality'] = Math.round(
      (metrics.dataFreshness * 0.25) +
      (metrics.sourceReliability * 0.25) +
      (metrics.crossValidation * 0.25) +
      (metrics.contactAccuracy * 0.25)
    );

    return metrics;
  }

  /**
   * 🚨 ASSESS RISK LEVEL
   */
  private assessRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 85) return 'LOW';
    if (score >= 70) return 'MEDIUM';
    if (score >= 50) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * 💡 GENERATE RECOMMENDATIONS
   */
  private generateRecommendations(validation: ValidationReport): string[] {
    const recommendations: string[] = [];

    if (validation.overallScore < 70) {
      recommendations.push('Overall data quality below threshold - recommend additional validation');
    }

    if (validation.qualityMetrics.dataFreshness < 70) {
      recommendations.push('Data freshness concerns - verify current employment status');
    }

    if (validation.qualityMetrics.contactAccuracy < 70) {
      recommendations.push('Contact accuracy concerns - validate emails and phones before outreach');
    }

    const highRiskExecs = validation.executiveValidations.filter(v => v.validationScore < 60);
    if (highRiskExecs.length > 0) {
      recommendations.push(`High risk executives detected: ${highRiskExecs.map(e => e.name).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * ⚠️ GENERATE WARNINGS
   */
  private generateWarnings(validation: ValidationReport): string[] {
    const warnings: string[] = [];

    const criticalExecs = validation.executiveValidations.filter(v => v.validationScore < 40);
    if (criticalExecs.length > 0) {
      warnings.push(`Critical data quality issues: ${criticalExecs.map(e => e.name).join(', ')}`);
    }

    if (validation.qualityMetrics.dataFreshness < 50) {
      warnings.push('Severely outdated data detected - high risk of incorrect contacts');
    }

    return warnings;
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private checkRoleConsistency(executive: ExecutiveContact): number {
    const title = executive.title?.toLowerCase() || '';
    const role = executive.role;

    // Define expected keywords for each role
    const roleKeywords: Record<string, string[]> = {
      'CFO': ['financial', 'cfo', 'finance'],
      'CRO': ['revenue', 'cro', 'sales', 'commercial'],
      'CEO': ['executive', 'ceo', 'president', 'founder'],
      'CTO': ['technology', 'cto', 'technical', 'engineering']
    };

    const expectedKeywords = roleKeywords[role] || [];
    const hasExpectedKeywords = expectedKeywords.some(keyword => title.includes(keyword));

    return hasExpectedKeywords ? 90 : 60;
  }

  private isGenericEmail(email: string): boolean {
    const genericPatterns = [
      'info@', 'contact@', 'support@', 'sales@', 'marketing@',
      'admin@', 'office@', 'hello@', 'team@', 'pr@'
    ];
    
    return genericPatterns.some(pattern => email.toLowerCase().startsWith(pattern));
  }

  private isGenericPhone(phone: string): boolean {
    const genericPatterns = [
      '+1-800-', '+1-888-', '+1-877-', '+1-866-', '+1-855-',
      '1-800-', '1-888-', '1-877-', '1-866-', '1-855-'
    ];
    
    return genericPatterns.some(pattern => phone.startsWith(pattern));
  }

  private initializeRiskFactors(): string[] {
    return [
      'outdated_information',
      'low_source_reliability', 
      'generic_contact_data',
      'role_title_mismatch',
      'missing_contact_info',
      'unverified_employment',
      'acquisition_transition',
      'executive_transition'
    ];
  }
}
