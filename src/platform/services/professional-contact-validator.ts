/**
 * 📞 PROFESSIONAL CONTACT VALIDATOR
 * 
 * Advanced contact validation system with professional/personal detection
 * Integrates DropContact, Twilio, and other validation services for maximum accuracy
 */

import axios from 'axios';

export interface ContactValidationResult {
  email?: EmailValidationResult;
  phone?: PhoneValidationResult;
  overallConfidence: number;
  professionalityScore: number;
  recommendations: string[];
  warnings: string[];
  sources: ValidationSource[];
}

export interface EmailValidationResult {
  address: string;
  isValid: boolean;
  confidence: number;
  deliverability: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  type: 'professional' | 'personal' | 'role_based' | 'disposable' | 'unknown';
  domain: DomainAnalysis;
  validation: {
    syntax: boolean;
    domain: boolean;
    mailbox: boolean;
    smtp: boolean;
  };
  riskFactors: EmailRiskFactor[];
  source: string;
  cost: number;
  lastValidated: Date;
}

export interface PhoneValidationResult {
  number: string;
  isValid: boolean;
  confidence: number;
  type: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown';
  context: 'professional' | 'personal' | 'unknown';
  carrier: CarrierInfo;
  location: PhoneLocation;
  riskFactors: PhoneRiskFactor[];
  reachability: 'reachable' | 'unreachable' | 'unknown';
  source: string;
  cost: number;
  lastValidated: Date;
}

export interface DomainAnalysis {
  domain: string;
  isBusinessDomain: boolean;
  companyName?: string;
  domainAge?: number;
  domainType: 'corporate' | 'generic' | 'educational' | 'government' | 'non_profit' | 'unknown';
  reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  riskScore: number; // 0-100
  technologies: string[];
  employees?: number;
}

export interface CarrierInfo {
  name: string;
  type: 'mobile' | 'landline' | 'voip';
  country: string;
}

export interface PhoneLocation {
  country: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export interface EmailRiskFactor {
  type: 'disposable' | 'temporary' | 'role_based' | 'catch_all' | 'spam_trap' | 'blacklisted';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface PhoneRiskFactor {
  type: 'disconnected' | 'ported' | 'voip' | 'spam_risk' | 'invalid_format';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface ValidationSource {
  name: string;
  type: 'primary' | 'secondary' | 'fallback';
  confidence: number;
  cost: number;
  responseTime: number;
}

export interface ValidationConfig {
  // API Keys
  DROPCONTACT_API_KEY?: string;
  ZEROBOUNCE_API_KEY?: string;
  MYEMAILVERIFIER_API_KEY?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  HUNTER_API_KEY?: string;
  PROSPEO_API_KEY?: string;
  
  // Validation preferences
  enableRealTimeValidation: boolean;
  enableProfessionalDetection: boolean;
  maxValidationCost: number;
  confidenceThreshold: number;
  
  // Professional detection settings
  professionalDomainThreshold: number;
  businessHoursValidation: boolean;
}

/**
 * 🔍 PROFESSIONAL CONTACT VALIDATOR
 * 
 * Multi-provider contact validation with professional/personal detection
 */
export class ProfessionalContactValidator {
  private config: ValidationConfig;
  private validationCache: Map<string, ContactValidationResult> = new Map();
  
  // Professional domain patterns
  private readonly GENERIC_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'tutanota.com', 'yandex.com',
    'mail.ru', 'qq.com', '163.com', 'sina.com'
  ]);
  
  private readonly DISPOSABLE_DOMAINS = new Set([
    '10minutemail.com', 'guerrillamail.com', 'tempmail.org',
    'mailinator.com', 'throwaway.email', 'temp-mail.org'
  ]);

  constructor(config: ValidationConfig) {
    this.config = {
      enableRealTimeValidation: true,
      enableProfessionalDetection: true,
      maxValidationCost: 0.10, // $0.10 per validation
      confidenceThreshold: 80,
      professionalDomainThreshold: 85,
      businessHoursValidation: false,
      ...config
    };
  }

  /**
   * 🎯 VALIDATE CONTACT INFORMATION
   * 
   * Comprehensive contact validation with professional detection
   */
  async validateContact(
    email?: string,
    phone?: string,
    companyName?: string,
    personName?: string
  ): Promise<ContactValidationResult> {
    
    console.log(`📞 [CONTACT VALIDATOR] Validating contact: ${email || 'no email'}, ${phone || 'no phone'}`);
    
    const cacheKey = `${email || ''}:${phone || ''}`;
    if (this.validationCache.has(cacheKey)) {
      console.log(`💾 [CACHE] Using cached result for ${cacheKey}`);
      return this.validationCache.get(cacheKey)!;
    }
    
    const startTime = Date.now();
    let totalCost = 0;
    const sources: ValidationSource[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Email validation
    let emailResult: EmailValidationResult | undefined;
    if (email) {
      emailResult = await this.validateEmailProfessional(email, companyName);
      totalCost += emailResult.cost;
      sources.push({
        name: emailResult.source,
        type: 'primary',
        confidence: emailResult.confidence,
        cost: emailResult.cost,
        responseTime: Date.now() - startTime
      });
    }
    
    // Phone validation
    let phoneResult: PhoneValidationResult | undefined;
    if (phone) {
      phoneResult = await this.validatePhoneProfessional(phone, companyName, personName);
      totalCost += phoneResult.cost;
      sources.push({
        name: phoneResult.source,
        type: 'primary',
        confidence: phoneResult.confidence,
        cost: phoneResult.cost,
        responseTime: Date.now() - startTime
      });
    }
    
    // Calculate overall metrics
    const overallConfidence = this.calculateOverallConfidence(emailResult, phoneResult);
    const professionalityScore = this.calculateProfessionalityScore(emailResult, phoneResult, companyName);
    
    // Generate recommendations and warnings
    this.generateRecommendations(emailResult, phoneResult, recommendations, warnings);
    
    const result: ContactValidationResult = {
      email: emailResult,
      phone: phoneResult,
      overallConfidence,
      professionalityScore,
      recommendations,
      warnings,
      sources
    };
    
    // Cache result
    this.validationCache.set(cacheKey, result);
    
    console.log(`✅ [CONTACT VALIDATOR] Validation complete: ${overallConfidence}% confidence, ${professionalityScore}% professional`);
    
    return result;
  }

  /**
   * 📧 VALIDATE EMAIL WITH PROFESSIONAL DETECTION
   * 
   * Multi-provider email validation with business/personal classification
   */
  private async validateEmailProfessional(
    email: string,
    companyName?: string
  ): Promise<EmailValidationResult> {
    
    console.log(`📧 [EMAIL] Validating ${email}`);
    
    // Step 1: Basic syntax and domain validation
    const basicValidation = this.validateEmailSyntax(email);
    if (!basicValidation.isValid) {
      return this.createFailedEmailResult(email, 'Invalid email syntax');
    }
    
    const domain = email.split('@')[1].toLowerCase();
    const domainAnalysis = await this.analyzeDomain(domain, companyName);
    
    // Step 2: Choose validation provider based on domain type and config
    let validationResult: EmailValidationResult;
    
    if (this.config.DROPCONTACT_API_KEY && domainAnalysis.isBusinessDomain) {
      // Use DropContact for business emails (best for B2B)
      validationResult = await this.validateWithDropContact(email, domainAnalysis);
    } else if (this.config.ZEROBOUNCE_API_KEY) {
      // Use ZeroBounce for general validation (DPA compliant)
      validationResult = await this.validateWithZeroBounce(email, domainAnalysis);
    } else if (this.config.MYEMAILVERIFIER_API_KEY) {
      // Fallback to MyEmailVerifier (cost-effective)
      validationResult = await this.validateWithMyEmailVerifier(email, domainAnalysis);
    } else {
      // Basic validation only
      validationResult = await this.performBasicEmailValidation(email, domainAnalysis);
    }
    
    // Step 3: Professional type classification
    validationResult.type = this.classifyEmailType(email, domainAnalysis, companyName);
    
    // Step 4: Risk factor analysis
    validationResult.riskFactors = this.analyzeEmailRiskFactors(email, domainAnalysis);
    
    return validationResult;
  }

  /**
   * 📱 VALIDATE PHONE WITH PROFESSIONAL DETECTION
   * 
   * Twilio-powered phone validation with business/personal context detection
   */
  private async validatePhoneProfessional(
    phone: string,
    companyName?: string,
    personName?: string
  ): Promise<PhoneValidationResult> {
    
    console.log(`📱 [PHONE] Validating ${phone}`);
    
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phone);
    
    if (this.config.TWILIO_ACCOUNT_SID && this.config.TWILIO_AUTH_TOKEN) {
      return await this.validateWithTwilio(normalizedPhone, companyName, personName);
    } else {
      // Basic phone validation
      return await this.performBasicPhoneValidation(normalizedPhone, companyName);
    }
  }

  /**
   * 🏢 VALIDATE WITH DROPCONTACT
   * 
   * DropContact API integration for business email validation
   */
  private async validateWithDropContact(
    email: string,
    domainAnalysis: DomainAnalysis
  ): Promise<EmailValidationResult> {
    
    try {
      const response = await axios.post('https://api.dropcontact.io/batch', {
        data: [{ email }],
        siren: false,
        language: 'en'
      }, {
        headers: {
          'X-Access-Token': this.config.DROPCONTACT_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.data && response.data.data[0]) {
        const result = response.data.data[0];
        
        return {
          address: email,
          isValid: result.email_status === 'valid',
          confidence: this.mapDropContactConfidence(result.email_status, result.qualification),
          deliverability: this.mapDropContactDeliverability(result.email_status),
          type: 'professional', // DropContact focuses on professional emails
          domain: domainAnalysis,
          validation: {
            syntax: result.email_status !== 'invalid_syntax',
            domain: result.email_status !== 'invalid_domain',
            mailbox: result.email_status === 'valid',
            smtp: result.email_status === 'valid'
          },
          riskFactors: [],
          source: 'dropcontact',
          cost: 0.02,
          lastValidated: new Date()
        };
      }
    } catch (error) {
      console.log(`⚠️ [DROPCONTACT] Validation failed: ${error}`);
    }
    
    return await this.performBasicEmailValidation(email, domainAnalysis);
  }

  /**
   * 📞 VALIDATE WITH TWILIO
   * 
   * Twilio Lookup API integration for phone validation
   */
  private async validateWithTwilio(
    phone: string,
    companyName?: string,
    personName?: string
  ): Promise<PhoneValidationResult> {
    
    try {
      const accountSid = this.config.TWILIO_ACCOUNT_SID;
      const authToken = this.config.TWILIO_AUTH_TOKEN;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const response = await axios.get(
        `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone)}?Fields=line_type_intelligence,caller_name`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          },
          timeout: 5000
        }
      );
      
      if (response.data) {
        const data = response.data;
        const lineType = data.line_type_intelligence?.type || 'unknown';
        const callerName = data.caller_name?.caller_name;
        
        return {
          number: data.phone_number,
          isValid: data.valid,
          confidence: data.valid ? 95 : 20,
          type: this.mapTwilioLineType(lineType),
          context: this.determinePhoneContext(lineType, callerName, companyName, personName),
          carrier: {
            name: data.line_type_intelligence?.carrier_name || 'Unknown',
            type: this.mapTwilioLineType(lineType),
            country: data.country_code || 'Unknown'
          },
          location: {
            country: data.country_code || 'Unknown',
            region: data.national_format ? this.extractRegionFromFormat(data.national_format) : undefined
          },
          riskFactors: this.analyzePhoneRiskFactors(data, lineType),
          reachability: data.valid ? 'reachable' : 'unreachable',
          source: 'twilio',
          cost: 0.008,
          lastValidated: new Date()
        };
      }
    } catch (error) {
      console.log(`⚠️ [TWILIO] Phone validation failed: ${error}`);
    }
    
    return await this.performBasicPhoneValidation(phone, companyName);
  }

  /**
   * 🏢 ANALYZE DOMAIN
   * 
   * Comprehensive domain analysis for professional detection
   */
  private async analyzeDomain(domain: string, companyName?: string): Promise<DomainAnalysis> {
    
    const isGeneric = this.GENERIC_DOMAINS.has(domain);
    const isDisposable = this.DISPOSABLE_DOMAINS.has(domain);
    
    // Basic business domain detection
    let isBusinessDomain = !isGeneric && !isDisposable;
    let domainType: DomainAnalysis['domainType'] = 'unknown';
    let reputation: DomainAnalysis['reputation'] = 'unknown';
    let riskScore = 0;
    
    if (isDisposable) {
      domainType = 'generic';
      reputation = 'poor';
      riskScore = 90;
      isBusinessDomain = false;
    } else if (isGeneric) {
      domainType = 'generic';
      reputation = 'fair';
      riskScore = 30;
      isBusinessDomain = false;
    } else {
      // Likely business domain
      domainType = 'corporate';
      reputation = 'good';
      riskScore = 10;
      isBusinessDomain = true;
      
      // Enhanced domain analysis
      if (domain.endsWith('.edu')) {
        domainType = 'educational';
        reputation = 'excellent';
        riskScore = 5;
      } else if (domain.endsWith('.gov') || domain.endsWith('.mil')) {
        domainType = 'government';
        reputation = 'excellent';
        riskScore = 5;
      } else if (domain.endsWith('.org')) {
        domainType = 'non_profit';
        reputation = 'good';
        riskScore = 15;
      }
    }
    
    // Company name matching
    let extractedCompanyName: string | undefined;
    if (companyName && !isGeneric) {
      const domainWords = domain.replace(/\.(com|org|net|edu|gov)$/, '').split(/[-._]/);
      const companyWords = companyName.toLowerCase().split(/\s+/);
      
      const matchScore = this.calculateDomainCompanyMatch(domainWords, companyWords);
      if (matchScore > 0.7) {
        extractedCompanyName = companyName;
        reputation = 'excellent';
        riskScore = Math.max(0, riskScore - 20);
      }
    }
    
    return {
      domain,
      isBusinessDomain,
      companyName: extractedCompanyName,
      domainType,
      reputation,
      riskScore,
      technologies: [], // Would be populated by domain intelligence APIs
    };
  }

  /**
   * 🎯 CLASSIFY EMAIL TYPE
   * 
   * Determine if email is professional, personal, role-based, etc.
   */
  private classifyEmailType(
    email: string,
    domainAnalysis: DomainAnalysis,
    companyName?: string
  ): EmailValidationResult['type'] {
    
    const localPart = email.split('@')[0].toLowerCase();
    
    // Check for disposable emails
    if (this.DISPOSABLE_DOMAINS.has(domainAnalysis.domain)) {
      return 'disposable';
    }
    
    // Check for role-based emails
    const roleKeywords = ['info', 'support', 'sales', 'admin', 'contact', 'hello', 'team', 'office', 'help'];
    if (roleKeywords.some(keyword => localPart.includes(keyword))) {
      return 'role_based';
    }
    
    // Business domain = likely professional
    if (domainAnalysis.isBusinessDomain) {
      return 'professional';
    }
    
    // Generic domain = likely personal
    if (this.GENERIC_DOMAINS.has(domainAnalysis.domain)) {
      return 'personal';
    }
    
    return 'unknown';
  }

  /**
   * 📊 CALCULATE PROFESSIONALITY SCORE
   * 
   * Overall score indicating how professional the contact information is
   */
  private calculateProfessionalityScore(
    emailResult?: EmailValidationResult,
    phoneResult?: PhoneValidationResult,
    companyName?: string
  ): number {
    
    let score = 0;
    let factors = 0;
    
    // Email professionality
    if (emailResult) {
      factors++;
      switch (emailResult.type) {
        case 'professional':
          score += 100;
          break;
        case 'role_based':
          score += 80;
          break;
        case 'personal':
          score += 30;
          break;
        case 'disposable':
          score += 0;
          break;
        default:
          score += 50;
      }
      
      // Business domain bonus
      if (emailResult.domain.isBusinessDomain) {
        score += 20;
        factors++;
      }
      
      // Company name match bonus
      if (emailResult.domain.companyName && companyName) {
        score += 30;
        factors++;
      }
    }
    
    // Phone professionality
    if (phoneResult) {
      factors++;
      switch (phoneResult.context) {
        case 'professional':
          score += 90;
          break;
        case 'personal':
          score += 40;
          break;
        default:
          score += 60;
      }
      
      // Landline bonus (more professional than mobile)
      if (phoneResult.type === 'landline') {
        score += 20;
        factors++;
      }
    }
    
    return factors > 0 ? Math.min(100, score / factors) : 50;
  }

  /**
   * 🔧 HELPER METHODS
   */
  private validateEmailSyntax(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      error: emailRegex.test(email) ? undefined : 'Invalid email format'
    };
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }

  private calculateDomainCompanyMatch(domainWords: string[], companyWords: string[]): number {
    let matches = 0;
    for (const companyWord of companyWords) {
      if (companyWord.length > 2 && domainWords.some(dw => dw.includes(companyWord) || companyWord.includes(dw))) {
        matches++;
      }
    }
    return matches / companyWords.length;
  }

  private mapTwilioLineType(lineType: string): PhoneValidationResult['type'] {
    switch (lineType?.toLowerCase()) {
      case 'mobile': return 'mobile';
      case 'landline': return 'landline';
      case 'voip': return 'voip';
      case 'toll_free': return 'toll_free';
      default: return 'unknown';
    }
  }

  private determinePhoneContext(
    lineType: string,
    callerName?: string,
    companyName?: string,
    personName?: string
  ): PhoneValidationResult['context'] {
    
    // Landlines are typically more professional
    if (lineType === 'landline') {
      return 'professional';
    }
    
    // If caller name matches company name, likely professional
    if (callerName && companyName && callerName.toLowerCase().includes(companyName.toLowerCase())) {
      return 'professional';
    }
    
    // If caller name matches person name, could be personal
    if (callerName && personName && callerName.toLowerCase().includes(personName.toLowerCase())) {
      return 'personal';
    }
    
    return 'unknown';
  }

  private calculateOverallConfidence(
    emailResult?: EmailValidationResult,
    phoneResult?: PhoneValidationResult
  ): number {
    const confidences: number[] = [];
    
    if (emailResult) confidences.push(emailResult.confidence);
    if (phoneResult) confidences.push(phoneResult.confidence);
    
    if (confidences.length === 0) return 0;
    
    // Weight average, giving slightly more weight to email
    if (confidences.length === 2) {
      return Math.round((confidences[0] * 0.6) + (confidences[1] * 0.4));
    } else {
      return confidences[0];
    }
  }

  private generateRecommendations(
    emailResult?: EmailValidationResult,
    phoneResult?: PhoneValidationResult,
    recommendations: string[] = [],
    warnings: string[] = []
  ): void {
    
    // Email recommendations
    if (emailResult) {
      if (emailResult.type === 'disposable') {
        warnings.push('Email appears to be disposable/temporary');
        recommendations.push('Request a professional email address');
      }
      
      if (emailResult.type === 'personal' && emailResult.confidence > 80) {
        recommendations.push('Consider requesting a business email for professional communication');
      }
      
      if (emailResult.confidence < 70) {
        warnings.push('Email validation confidence is low');
        recommendations.push('Verify email through alternative means');
      }
      
      if (emailResult.riskFactors.some(rf => rf.severity === 'high')) {
        warnings.push('High-risk email factors detected');
        recommendations.push('Use caution when sending to this email');
      }
    }
    
    // Phone recommendations
    if (phoneResult) {
      if (phoneResult.type === 'voip') {
        recommendations.push('Phone appears to be VoIP - may have different reachability patterns');
      }
      
      if (phoneResult.context === 'personal') {
        recommendations.push('Respect personal phone usage - consider business hours');
      }
      
      if (phoneResult.confidence < 70) {
        warnings.push('Phone validation confidence is low');
        recommendations.push('Verify phone number through alternative means');
      }
    }
  }

  // Placeholder methods for API integrations
  private async validateWithZeroBounce(email: string, domainAnalysis: DomainAnalysis): Promise<EmailValidationResult> {
    // ZeroBounce API integration
    return await this.performBasicEmailValidation(email, domainAnalysis);
  }

  private async validateWithMyEmailVerifier(email: string, domainAnalysis: DomainAnalysis): Promise<EmailValidationResult> {
    // MyEmailVerifier API integration
    return await this.performBasicEmailValidation(email, domainAnalysis);
  }

  private async performBasicEmailValidation(email: string, domainAnalysis: DomainAnalysis): Promise<EmailValidationResult> {
    const isValid = this.validateEmailSyntax(email).isValid;
    
    return {
      address: email,
      isValid,
      confidence: isValid ? 70 : 20,
      deliverability: isValid ? 'unknown' : 'undeliverable',
      type: 'unknown',
      domain: domainAnalysis,
      validation: {
        syntax: isValid,
        domain: isValid,
        mailbox: false,
        smtp: false
      },
      riskFactors: [],
      source: 'basic_validation',
      cost: 0,
      lastValidated: new Date()
    };
  }

  private async performBasicPhoneValidation(phone: string, companyName?: string): Promise<PhoneValidationResult> {
    const isValid = phone.length >= 10;
    
    return {
      number: phone,
      isValid,
      confidence: isValid ? 60 : 20,
      type: 'unknown',
      context: 'unknown',
      carrier: { name: 'Unknown', type: 'unknown', country: 'Unknown' },
      location: { country: 'Unknown' },
      riskFactors: [],
      reachability: isValid ? 'unknown' : 'unreachable',
      source: 'basic_validation',
      cost: 0,
      lastValidated: new Date()
    };
  }

  private createFailedEmailResult(email: string, reason: string): EmailValidationResult {
    return {
      address: email,
      isValid: false,
      confidence: 0,
      deliverability: 'undeliverable',
      type: 'unknown',
      domain: {
        domain: email.split('@')[1] || '',
        isBusinessDomain: false,
        domainType: 'unknown',
        reputation: 'unknown',
        riskScore: 100,
        technologies: []
      },
      validation: { syntax: false, domain: false, mailbox: false, smtp: false },
      riskFactors: [{ type: 'blacklisted', severity: 'high', description: reason }],
      source: 'syntax_validation',
      cost: 0,
      lastValidated: new Date()
    };
  }

  private mapDropContactConfidence(status: string, qualification?: string): number {
    switch (status) {
      case 'valid': return 95;
      case 'risky': return 70;
      case 'invalid': return 10;
      default: return 50;
    }
  }

  private mapDropContactDeliverability(status: string): EmailValidationResult['deliverability'] {
    switch (status) {
      case 'valid': return 'deliverable';
      case 'risky': return 'risky';
      case 'invalid': return 'undeliverable';
      default: return 'unknown';
    }
  }

  private analyzeEmailRiskFactors(email: string, domainAnalysis: DomainAnalysis): EmailRiskFactor[] {
    const riskFactors: EmailRiskFactor[] = [];
    
    if (this.DISPOSABLE_DOMAINS.has(domainAnalysis.domain)) {
      riskFactors.push({
        type: 'disposable',
        severity: 'high',
        description: 'Email uses disposable/temporary domain'
      });
    }
    
    return riskFactors;
  }

  private analyzePhoneRiskFactors(twilioData: any, lineType: string): PhoneRiskFactor[] {
    const riskFactors: PhoneRiskFactor[] = [];
    
    if (lineType === 'voip') {
      riskFactors.push({
        type: 'voip',
        severity: 'medium',
        description: 'Phone number is VoIP-based'
      });
    }
    
    return riskFactors;
  }

  private extractRegionFromFormat(nationalFormat: string): string | undefined {
    // Extract region from national phone format
    return undefined; // Placeholder
  }
}

export { ProfessionalContactValidator };
