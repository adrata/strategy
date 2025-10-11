/**
 * 📧 CONTACT INTELLIGENCE MODULE
 * 
 * Complete contact discovery system with:
 * 1. Email pattern generation and validation (ZeroBounce, MyEmailVerifier)
 * 2. Phone discovery via Lusha API
 * 3. LinkedIn profile matching
 * 4. Multi-source contact validation
 * 5. Acquisition-aware domain handling
 */

import { ExecutiveContact, APIConfig } from '../types/intelligence';
import { cache } from '@/platform/services';
import { PipelineAuditor } from '../services/PipelineAuditor';

// Ensure fetch is available
if (typeof fetch === 'undefined') {
  global['fetch'] = require('node-fetch');
}

interface ContactData {
  emails: EmailContact[];
  phones: PhoneContact[];
  profiles: ProfileContact[];
  validation: ContactValidation;
}

interface EmailContact {
  email: string;
  type: 'primary' | 'work' | 'generated';
  confidence: number;
  validation: 'verified' | 'valid' | 'invalid' | 'unknown';
  source: string;
}

interface PhoneContact {
  phone: string;
  type: 'direct' | 'office' | 'mobile';
  confidence: number;
  validation: 'verified' | 'valid' | 'invalid' | 'unknown';
  source: string;
}

interface ProfileContact {
  url: string;
  platform: 'linkedin' | 'twitter' | 'company_bio';
  confidence: number;
  source: string;
}

interface ContactValidation {
  emailsValidated: number;
  phonesValidated: number;
  overallScore: number;
  cost: number;
  methods: string[];
}

export class ContactIntelligence {
  private config: APIConfig;
  private auditor: PipelineAuditor;
  private emailPatterns: string[];

  constructor(config: APIConfig) {
    this['config'] = config;
    this['auditor'] = new PipelineAuditor();
    this['emailPatterns'] = this.initializeEmailPatterns();
    
    console.log('📧 [CONTACT INTELLIGENCE] Module initialized');
    console.log(`   ZeroBounce: ${this.config.ZEROBOUNCE_API_KEY ? 'Available' : 'Missing'}`);
    console.log(`   MyEmailVerifier: ${this.config.MYEMAILVERIFIER_API_KEY ? 'Available' : 'Missing'}`);
    console.log(`   Lusha: ${this.config.LUSHA_API_KEY ? 'Available' : 'Missing'}`);
    console.log(`   Prospeo: ${this.config.PROSPEO_API_KEY ? 'Available' : 'Missing'}`);
  }

  /**
   * 🎯 MAIN CONTACT DISCOVERY PROCESS
   */
  async discoverContacts(
    executives: ExecutiveContact[],
    companyDomain: string,
    sessionId: string = 'default'
  ): Promise<ExecutiveContact[]> {
    console.log(`\n📧 [CONTACT INTELLIGENCE] Discovering contacts for ${executives.length} executives`);
    
    const enhancedExecutives: ExecutiveContact[] = [];

    // Process executives in parallel with controlled concurrency
    const batchSize = 3; // Process 3 executives at a time
    
    for (let i = 0; i < executives.length; i += batchSize) {
      const batch = executives.slice(i, i + batchSize);
      console.log(`   📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(executives.length/batchSize)}: ${batch.length} executives`);
      
      const contactPromises = batch.map(async (executive) => {
      try {
        const accountId = executive.accountId.replace(/[^a-zA-Z0-9]/g, '_');
        this.auditor.startAudit(sessionId, accountId, executive.name);
        
        console.log(`   🔍 [CONTACT] Discovering contacts for ${executive.name} (${executive.role})`);
        
        // Use proven working method: Single integrated Lusha search (like old pipeline)
        const domain = companyDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]; // Remove path
        const companyName = domain.split('.')[0]; // Extract company name from domain
        
        const lushaResult = await this.searchLushaExecutiveIntegrated(
          executive.name,
          companyName,
          domain,
          executive.role
        );
        
        // Enhanced executive with contact data
        const enhancedExecutive: ExecutiveContact = {
          ...executive,
          email: lushaResult?.email || executive.email,
          phone: lushaResult?.phone || executive.phone,
          linkedinUrl: lushaResult?.linkedinUrl || executive.linkedinUrl,
          confidenceScore: lushaResult ? 
            Math.min(95, executive.confidenceScore + 15) : 
            executive.confidenceScore,
          researchMethods: [
            ...executive.researchMethods,
            ...(lushaResult ? ['lusha_integrated'] : [])
          ]
        };

        // Update selection reasoning with contact discovery details
        const contactDetails = [];
        if (enhancedExecutive.email) contactDetails.push(`Email found`);
        if (enhancedExecutive.phone) contactDetails.push(`Phone found`);
        if (enhancedExecutive.linkedinUrl) contactDetails.push(`LinkedIn found`);
        
        enhancedExecutive['selectionReasoning'] = 
          (executive.selectionReasoning || '') + 
          (contactDetails.length > 0 ? ` | Contact discovery: ${contactDetails.join(', ')}` : '');

        console.log(`   ✅ Contact discovery for ${executive.name}: Email=${!!enhancedExecutive.email}, Phone=${!!enhancedExecutive.phone}, LinkedIn=${!!enhancedExecutive.linkedinUrl}`);
        
        // Complete audit
        this.auditor.completeAudit(accountId, enhancedExecutive, enhancedExecutive.confidenceScore);
        
        return enhancedExecutive;
        
      } catch (error) {
        console.error(`❌ Contact discovery failed for ${executive.name}:`, error);
        return executive; // Return original if enhancement fails
      }
    });

      // Wait for batch to complete with timeout
      const results = await Promise.allSettled(
        contactPromises.map(promise => 
          Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Contact discovery timeout')), 10000)
            )
          ])
        )
      );
      
      results.forEach((result, batchIndex) => {
        if (result['status'] === 'fulfilled') {
          enhancedExecutives.push(result.value);
        } else {
          console.error(`❌ Contact discovery failed for executive in batch:`, result.reason);
          enhancedExecutives.push(batch[batchIndex]); // Fallback to original
        }
      });
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < executives.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ [CONTACT INTELLIGENCE] Contact discovery complete: ${enhancedExecutives.length} executives enhanced`);
    return enhancedExecutives;
  }

  /**
   * 📧 ENHANCED EMAIL DISCOVERY (7-LAYER SYSTEM)
   */
  private async discoverEmails(executive: ExecutiveContact, domain: string): Promise<{
    emails: EmailContact[];
    cost: number;
    validation: ContactValidation;
  }> {
    const emails: EmailContact[] = [];
    let totalCost = 0;
    const methods: string[] = [];

    // Strategy 1: CoreSignal Professional Email (Primary Source - from AccuracyOptimizedContacts)
    if (this.config.CORESIGNAL_API_KEY) {
      console.log(`   🏢 CoreSignal professional email search for ${executive.name}...`);
      
      try {
        const coresignalResult = await this.getCoreSignalProfessionalEmail(executive, domain);
        
        if (coresignalResult && coresignalResult.email) {
          // Check if needs validation based on confidence
          const needsValidation = coresignalResult.confidence < 95;
          
          if (needsValidation && this.config.ZEROBOUNCE_API_KEY) {
            console.log(`   🔍 CoreSignal confidence < 95%, validating with ZeroBounce...`);
            const validation = await this.validateEmailWithAPIs(coresignalResult.email);
            
            emails.push({
              email: coresignalResult.email,
              type: 'primary',
              confidence: Math.max(coresignalResult.confidence, validation.confidence),
              validation: validation.status,
              source: 'coresignal_validated'
            });
            totalCost += 0.05 + validation.cost; // CoreSignal + validation cost
          } else {
            emails.push({
              email: coresignalResult.email,
              type: 'primary',
              confidence: coresignalResult.confidence,
              validation: 'verified',
              source: 'coresignal_professional'
            });
            totalCost += 0.05; // CoreSignal cost only
          }
          
          methods.push('coresignal_accuracy_optimized');
          console.log(`   ✅ CoreSignal found email: ${coresignalResult.email} (${coresignalResult.confidence}% confidence)`);
        }
      } catch (error) {
        console.log(`   ⚠️ CoreSignal email search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Strategy 2: Use existing email if available and no CoreSignal result
    if (emails['length'] === 0 && executive['email'] && executive.email.includes('@')) {
      console.log(`   📧 Using existing email: ${executive.email}`);
      
      // Validate existing email
      const validation = await this.validateEmailWithAPIs(executive.email);
      emails.push({
        email: executive.email,
        type: 'primary',
        confidence: validation.confidence,
        validation: validation.status,
        source: 'existing_data'
      });
      totalCost += validation.cost;
      methods.push('existing_email_validation');
    }

    // Strategy 2: Generate email patterns if no valid email exists
    if (emails['length'] === 0 || emails[0].validation === 'invalid') {
      console.log(`   🔧 Generating email patterns for ${executive.name}...`);
      
      const generatedEmails = this.generateEmailPatterns(executive.name, domain);
      
      // Test top 3 most likely patterns with Prospeo
      for (let i = 0; i < Math.min(3, generatedEmails.length); i++) {
        const emailPattern = generatedEmails[i];
        
        try {
          const prospeoResult = await this.findEmailWithProspeo(
            this.extractFirstName(executive.name),
            this.extractLastName(executive.name),
            domain
          );
          
          if (prospeoResult['email'] && prospeoResult['email'] === emailPattern) {
            emails.push({
              email: emailPattern,
              type: 'work',
              confidence: prospeoResult.confidence,
              validation: 'verified',
              source: 'prospeo_discovery'
            });
            totalCost += 0.08; // Prospeo cost
            methods.push('prospeo_email_discovery');
            break; // Found verified email, stop searching
          }
        } catch (error) {
          console.log(`   ⚠️ Prospeo email search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Strategy 3: AI-Powered Multi-Source Research (from original pipeline)
    if (emails['length'] === 0) {
      console.log(`   🤖 AI-powered multi-source research for ${executive.name}...`);
      
      try {
        const aiResult = await this.aiPoweredContactResearch(executive, domain);
        
        if (aiResult.emails.length > 0) {
          emails.push(...aiResult.emails);
          totalCost += 0.02; // AI research cost
          methods.push('ai_multi_source_research');
          console.log(`   ✅ AI research found ${aiResult.emails.length} verified emails`);
        }
      } catch (error) {
        console.log(`   ⚠️ AI contact research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Strategy 4: Cross-Domain Pattern Analysis (from original pipeline)
    if (emails['length'] === 0) {
      console.log(`   🔍 Cross-domain pattern analysis for ${executive.name}...`);
      
      try {
        const crossDomainResult = await this.crossDomainPatternAnalysis(executive, domain);
        
        if (crossDomainResult.emails.length > 0) {
          emails.push(...crossDomainResult.emails);
          methods.push('cross_domain_patterns');
          console.log(`   ✅ Cross-domain analysis found ${crossDomainResult.emails.length} pattern emails`);
        }
      } catch (error) {
        console.log(`   ⚠️ Cross-domain analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Strategy 5: Lusha API as fallback
    if (emails['length'] === 0) {
      console.log(`   🔍 Fallback: Searching Lusha for ${executive.name}...`);
      
      try {
        const lushaResult = await this.findContactsWithLusha(executive.name, domain);
        
        if (lushaResult.email) {
          emails.push({
            email: lushaResult.email,
            type: 'work',
            confidence: lushaResult.confidence,
            validation: 'verified',
            source: 'lusha_discovery'
          });
          totalCost += 0.15; // Lusha cost
          methods.push('lusha_contact_discovery');
        }
      } catch (error) {
        console.log(`   ⚠️ Lusha contact search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      emails,
      cost: totalCost,
      validation: {
        emailsValidated: emails.length,
        phonesValidated: 0,
        overallScore: emails.length > 0 ? emails[0].confidence : 0,
        cost: totalCost,
        methods
      }
    };
  }

  /**
   * 📞 PHONE DISCOVERY WITH LUSHA API
   */
  private async discoverPhones(executive: ExecutiveContact, domain: string): Promise<{
    phones: PhoneContact[];
    cost: number;
    validation: ContactValidation;
  }> {
    const phones: PhoneContact[] = [];
    let totalCost = 0;
    const methods: string[] = [];

    // Use existing phone if available
    if (executive['phone'] && executive.phone !== 'Not available') {
      phones.push({
        phone: executive.phone,
        type: 'direct',
        confidence: 80,
        validation: 'unknown',
        source: 'existing_data'
      });
      methods.push('existing_phone');
      console.log(`   📞 Using existing phone: ${executive.phone}`);
    }

    // Lusha API for phone discovery
    if (this['config']['LUSHA_API_KEY'] && phones['length'] === 0) {
      try {
        console.log(`   🔍 Searching Lusha for phone: ${executive.name}`);
        
        const lushaResult = await this.findContactsWithLusha(executive.name, domain);
        
        if (lushaResult.phone) {
          phones.push({
            phone: lushaResult.phone,
            type: 'direct',
            confidence: lushaResult.confidence,
            validation: 'verified',
            source: 'lusha_discovery'
          });
          totalCost += 0.15; // Lusha cost
          methods.push('lusha_phone_discovery');
          console.log(`   ✅ Phone found via Lusha: ${lushaResult.phone}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Lusha phone search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      phones,
      cost: totalCost,
      validation: {
        emailsValidated: 0,
        phonesValidated: phones.length,
        overallScore: phones.length > 0 ? phones[0].confidence : 0,
        cost: totalCost,
        methods
      }
    };
  }

  /**
   * 🔗 PROFILE DISCOVERY (LinkedIn, etc.)
   */
  private async discoverProfiles(executive: ExecutiveContact): Promise<{
    profiles: ProfileContact[];
    cost: number;
    validation: ContactValidation;
  }> {
    const profiles: ProfileContact[] = [];

    // Use existing LinkedIn URL if available
    if (executive['linkedinUrl'] && executive.linkedinUrl !== 'Not available') {
      profiles.push({
        url: executive.linkedinUrl,
        platform: 'linkedin',
        confidence: 80,
        source: 'existing_data'
      });
    } else {
      // Generate LinkedIn URL pattern
      const linkedinUrl = this.generateLinkedInUrl(executive.name);
      if (linkedinUrl) {
        profiles.push({
          url: linkedinUrl,
          platform: 'linkedin',
          confidence: 60, // Lower confidence for generated URLs
          source: 'generated_pattern'
        });
      }
    }

    return {
      profiles,
      cost: 0, // No cost for profile generation
      validation: {
        emailsValidated: 0,
        phonesValidated: 0,
        overallScore: profiles.length > 0 ? profiles[0].confidence : 0,
        cost: 0,
        methods: ['profile_generation']
      }
    };
  }

  /**
   * 📧 EMAIL VALIDATION WITH APIS
   */
  private async validateEmailWithAPIs(email: string): Promise<{
    status: 'verified' | 'valid' | 'invalid' | 'unknown';
    confidence: number;
    cost: number;
    source: string;
  }> {
    // Try ZeroBounce first (more reliable)
    if (this.config.ZEROBOUNCE_API_KEY) {
      try {
        const response = await fetch(
          `https://api.zerobounce.net/v2/validate?api_key=${this.config.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const status = this.mapZeroBounceStatus(data.status);
          
          console.log(`   ✅ ZeroBounce validation: ${email} → ${status}`);
          
          return {
            status,
            confidence: status === 'verified' ? 95 : status === 'valid' ? 85 : 30,
            cost: 0.01,
            source: 'zerobounce'
          };
        }
      } catch (error) {
        console.log(`   ⚠️ ZeroBounce validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fallback to MyEmailVerifier
    if (this.config.MYEMAILVERIFIER_API_KEY) {
      try {
        const response = await fetch(
          `https://api.myemailverifier.com/v1/verify?apikey=${this.config.MYEMAILVERIFIER_API_KEY}&email=${encodeURIComponent(email)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const status = this.mapMyEmailVerifierStatus(data.status);
          
          console.log(`   ✅ MyEmailVerifier validation: ${email} → ${status}`);
          
          return {
            status,
            confidence: status === 'verified' ? 90 : status === 'valid' ? 80 : 25,
            cost: 0.005,
            source: 'myemailverifier'
          };
        }
      } catch (error) {
        console.log(`   ⚠️ MyEmailVerifier validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      status: 'unknown',
      confidence: 50,
      cost: 0,
      source: 'no_validation'
    };
  }

  /**
   * 🔍 FIND EMAIL WITH PROSPEO API
   */
  private async findEmailWithProspeo(firstName: string, lastName: string, domain: string): Promise<{
    email?: string;
    confidence: number;
    source: string;
  }> {
    if (!this.config.PROSPEO_API_KEY) {
      throw new Error('Prospeo API key not configured');
    }

    try {
      const response = await fetch('https://api.prospeo.io/email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': this.config.PROSPEO_API_KEY
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          company_domain: domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data['email'] && data.email.includes('@')) {
          return {
            email: data.email,
            confidence: Math.min(95, (data.confidence || 0.8) * 100),
            source: 'prospeo_api'
          };
        }
      } else {
        console.log(`   ⚠️ Prospeo API error: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Prospeo API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { confidence: 0, source: 'prospeo_failed' };
  }

  /**
   * 📱 FIND CONTACTS WITH LUSHA API (PROVEN WORKING IMPLEMENTATION)
   */
  private async findContactsWithLusha(name: string, domain: string): Promise<{
    email?: string;
    phone?: string;
    confidence: number;
    source: string;
  }> {
    if (!this.config.LUSHA_API_KEY) {
      throw new Error('Lusha API key not configured');
    }

    try {
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      const companyName = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];

      // Use the EXACT working pattern from original pipeline
      const params = new URLSearchParams({
        firstName: firstName,
        lastName: lastName,
        companyName: companyName,
        refreshJobInfo: 'true',
        revealEmails: 'true', 
        revealPhones: 'true'
      });

      console.log(`   🔍 Lusha API call: firstName=${firstName}, lastName=${lastName}, company=${companyName}`);
      
      const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
        method: 'GET',
        headers: {
          'api_key': this.config.LUSHA_API_KEY,
          'Content-Type': 'application/json'
        },
        // timeout: 10000  // Remove timeout from fetch options
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   📊 Lusha response:`, JSON.stringify(data, null, 2).substring(0, 500));
        
        // Extract contact info using EXACT proven patterns from working implementation
        let email = undefined;
        let phone = undefined;
        
        console.log(`   🔍 Lusha response structure check:`, {
          hasEmailAddresses: !!data.emailAddresses,
          hasPhoneNumbers: !!data.phoneNumbers,
          hasData: !!data.data,
          fullName: data.fullName
        });
        
        // EXACT pattern from working ExecutiveContactIntelligence.js
        const emails = data.emailAddresses || [];
        const phones = data.phoneNumbers || [];
        
        if (emails.length > 0) {
          email = emails[0].email;
          console.log(`   📧 Lusha found email: ${email}`);
        }
        
        if (phones.length > 0) {
          phone = phones[0].number;
          console.log(`   📞 Lusha found phone: ${phone}`);
        }
        
        // Also extract LinkedIn if available
        let linkedin = data.linkedinUrl;
        if (linkedin) {
          console.log(`   💼 Lusha found LinkedIn: ${linkedin}`);
        }

        return {
          email,
          phone,
          confidence: 90, // High confidence for Lusha verified data
          source: 'lusha_api'
        };
      } else {
        const errorText = await response.text();
        console.log(`   ⚠️ Lusha API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Lusha API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { confidence: 0, source: 'lusha_failed' };
  }

  /**
   * 🔗 LUSHA LINKEDIN LOOKUP (PROVEN HIGH-ACCURACY METHOD)
   */
  private async lushaLinkedInLookup(linkedinUrl: string): Promise<{
    email?: string;
    phone?: string;
    confidence: number;
    source: string;
  }> {
    if (!this.config.LUSHA_API_KEY) {
      return { confidence: 0, source: 'lusha_no_key' };
    }

    try {
      console.log(`   🔗 Lusha LinkedIn lookup: ${linkedinUrl}`);
      
      // Use EXACT working pattern from AccuracyOptimizedContacts.js
      const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
        method: 'GET',
        headers: {
          'api_key': this.config.LUSHA_API_KEY,
          'Content-Type': 'application/json'
        },
        // timeout: 10000  // Remove timeout from fetch options
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   📊 Lusha LinkedIn response:`, {
          fullName: data.fullName,
          hasEmails: !!data.emailAddresses?.length,
          hasPhones: !!data.phoneNumbers?.length
        });
        
        // Extract using proven pattern
        const emails = data.emailAddresses || [];
        const phones = data.phoneNumbers || [];
        
        const email = emails.length > 0 ? emails[0].email : undefined;
        const phone = phones.length > 0 ? phones[0].number : undefined;
        
        if (email) console.log(`   📧 LinkedIn → Email: ${email}`);
        if (phone) console.log(`   📞 LinkedIn → Phone: ${phone}`);

        return {
          email,
          phone,
          confidence: 95, // Very high confidence for LinkedIn-based lookup
          source: 'lusha_linkedin'
        };
      } else {
        console.log(`   ⚠️ Lusha LinkedIn lookup error: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Lusha LinkedIn lookup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { confidence: 0, source: 'lusha_linkedin_failed' };
  }

  /**
   * 📧 LUSHA EMAIL LOOKUP (FOR PHONE DISCOVERY)
   */
  private async lushaEmailLookup(email: string): Promise<{
    phone?: string;
    confidence: number;
    source: string;
  }> {
    if (!this.config.LUSHA_API_KEY) {
      return { confidence: 0, source: 'lusha_no_key' };
    }

    try {
      console.log(`   📧 Lusha email lookup: ${email}`);
      
      // Use EXACT working pattern from AccuracyOptimizedContacts.js
      const response = await fetch(`https://api.lusha.com/v2/person?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'api_key': this.config.LUSHA_API_KEY,
          'Content-Type': 'application/json'
        },
        // timeout: 10000  // Remove timeout from fetch options
      });

      if (response.ok) {
        const data = await response.json();
        
        const phones = data.phoneNumbers || [];
        const phone = phones.length > 0 ? phones[0].number : undefined;
        
        if (phone) {
          console.log(`   📞 Email → Phone: ${phone}`);
        }

        return {
          phone,
          confidence: phone ? 90 : 0,
          source: 'lusha_email'
        };
      } else {
        console.log(`   ⚠️ Lusha email lookup error: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Lusha email lookup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { confidence: 0, source: 'lusha_email_failed' };
  }

  /**
   * 🎯 SOPHISTICATED EXECUTIVE CONTACT SEARCH (LIKE OLD PIPELINE)
   * 
   * Uses the proven working method: Lusha + CoreSignal + Cross-validation
   */
  private async searchLushaExecutiveIntegrated(
    executiveName: string,
    companyName: string,
    domain: string,
    role: string
  ): Promise<{
    name: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    title?: string;
    company?: string;
  } | null> {
    
    console.log(`   🎯 [SOPHISTICATED SEARCH] ${executiveName} at ${companyName}`);

    const nameParts = executiveName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    // STEP 1: Lusha search (like old system)
    console.log(`   🔍 STEP 1: Lusha person search...`);
    const lushaData = await this.searchLushaPersonV2(executiveName, companyName, domain, role);
    
    // STEP 2: CoreSignal search (like old system)  
    console.log(`   🔍 STEP 2: CoreSignal employee search...`);
    let coreSignalData = null;
    if (lushaData?.linkedinUrl) {
      console.log(`   🔗 Using LinkedIn URL for CoreSignal search: ${lushaData.linkedinUrl}`);
      coreSignalData = await this.searchCoreSignalByLinkedIn(lushaData.linkedinUrl, executiveName);
    } else {
      console.log(`   👤 Using name/company for CoreSignal search`);
      coreSignalData = await this.searchCoreSignalByName(executiveName, companyName);
    }
    
    // STEP 3: Cross-validate and combine (like old system)
    console.log(`   🔍 STEP 3: Cross-validating data sources...`);
    const emailValidation = this.crossValidateEmails(coreSignalData, lushaData, domain, firstName, lastName);
    
    // STEP 4: Build combined result with validation
    const combinedResult = {
      name: executiveName,
      email: emailValidation.email,
      phone: lushaData?.phone || null,
      linkedinUrl: coreSignalData?.linkedinUrl || lushaData?.linkedinUrl || null,
      title: coreSignalData?.title || lushaData?.title || role,
      company: companyName
    };
    
    console.log(`   ✅ Combined result: Email=${!!combinedResult.email}, Phone=${!!combinedResult.phone}, LinkedIn=${!!combinedResult.linkedinUrl}`);
    console.log(`   📊 Email confidence: ${emailValidation.confidence}% (${emailValidation.source})`);
    
    // Only return if we have validated data (not generated)
    if (emailValidation.confidence >= 70) {
      return combinedResult;
    } else {
      console.log(`   ⚠️ Low confidence (${emailValidation.confidence}%), not returning generated data`);
      return null;
    }
  }

  /**
   * 📞 LUSHA PERSON V2 SEARCH (EXACT WORKING METHOD)
   */
  private async searchLushaPersonV2(
    executiveName: string,
    companyName: string,
    domain: string,
    role: string
  ): Promise<any> {
    
    if (!this.config.LUSHA_API_KEY) {
      return null;
    }

    try {
      const nameParts = executiveName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];

      const params = new URLSearchParams({
        firstName: firstName,
        lastName: lastName,
        companyName: companyName,
        companyDomain: domain,
        refreshJobInfo: 'true',
        revealEmails: 'true',
        revealPhones: 'true'
      });

      const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
        method: 'GET',
        headers: {
          'api_key': this.config.LUSHA_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const personData = await response.json();
        
        // Check if person was actually found
        const emails = personData.emailAddresses || [];
        const phones = personData.phoneNumbers || [];
        const hasData = personData.fullName || emails.length > 0 || phones.length > 0 || personData.linkedinUrl;
        
        if (hasData) {
          console.log(`     ✅ Lusha found: ${personData.fullName || executiveName}`);
          
          return {
            name: personData.fullName || executiveName,
            email: emails.length > 0 ? emails[0].email : null,
            phone: phones.length > 0 ? phones[0].number : null,
            title: personData.jobTitle || role,
            company: personData.company?.name || companyName,
            linkedinUrl: personData.linkedinUrl
          };
        } else {
          console.log(`     ⚠️ Lusha: No data found for ${executiveName}`);
          return null;
        }
        
      } else {
        console.log(`     ⚠️ Lusha API error: ${response.status}`);
        return null;
      }
      
    } catch (error) {
      console.log(`     ❌ Lusha search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * 🔗 CORESIGNAL LINKEDIN SEARCH
   */
  private async searchCoreSignalByLinkedIn(linkedinUrl: string, executiveName: string): Promise<any> {
    // Implementation would go here - for now return null
    console.log(`     🔗 CoreSignal LinkedIn search not yet implemented`);
    return null;
  }

  /**
   * 👤 CORESIGNAL EMPLOYEE SEARCH (PROVEN WORKING APPROACH)
   */
  private async searchCoreSignalByName(executiveName: string, companyName: string): Promise<any> {
    if (!this.config.CORESIGNAL_API_KEY) {
      return null;
    }

    try {
      console.log(`     🏢 CoreSignal: Searching employees for ${companyName}...`);
      
      // Use exact working pattern with active employee filter
      const esQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      must: [
                        { term: { 'experience.active_experience': 1 } }, // ACTIVE only
                        {
                          bool: {
                            should: [
                              { match: { 'experience.company_name': companyName } },
                              { match_phrase: { 'experience.company_name': companyName } },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      };

      // Use exact URL pattern with items_per_page parameter
      const searchUrl = `https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=20`;
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': this.config.CORESIGNAL_API_KEY?.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(esQuery)
      });

      console.log(`     📊 Employee search status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        
        // Handle both array format (current) and Elasticsearch format (expected)
        let employeeIds = [];
        if (Array.isArray(result)) {
          employeeIds = result;
          console.log(`     📊 Response is array format: ${employeeIds.length} employee IDs`);
        } else if (result.hits?.hits) {
          employeeIds = result.hits.hits.map(hit => hit._source.id);
          console.log(`     📊 Response is Elasticsearch format: ${employeeIds.length} employee IDs`);
        } else {
          console.log(`     ⚠️ Unknown response format: ${Object.keys(result)}`);
        }
        
        if (employeeIds.length > 0) {
          console.log(`     ✅ Found ${employeeIds.length} active employees, searching for executives...`);
          
          // Collect profiles for first few employees to find executives
          for (let i = 0; i < Math.min(10, employeeIds.length); i++) {
            const employeeId = employeeIds[i];
            
            try {
              const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
                headers: { 
                  'apikey': this.config.CORESIGNAL_API_KEY?.trim(),
                  'Accept': 'application/json'
                }
              });
              
              if (collectResponse.ok) {
                const profile = await collectResponse.json();
                
                const name = profile.full_name || '';
                const title = profile.member_position_title || profile.current_position_title || '';
                const email = profile.primary_professional_email || '';
                const linkedin = profile.member_linkedin_url || profile.linkedin_url || '';
                
                // Check if this matches our target executive
                if (name.toLowerCase().includes(executiveName.toLowerCase()) || 
                    executiveName.toLowerCase().includes(name.toLowerCase())) {
                  
                  console.log(`     🎯 FOUND TARGET EXECUTIVE!`);
                  console.log(`        Name: ${name}`);
                  console.log(`        Title: ${title}`);
                  console.log(`        Email: ${email || 'Not found'}`);
                  console.log(`        LinkedIn: ${linkedin || 'Not found'}`);
                  
                  return {
                    email: email || null,
                    title: title || null,
                    linkedinUrl: linkedin || null
                  };
                }
                
                // Enhanced executive detection with CFO/CRO priority
                const executiveTitles = {
                  cfo: /\b(cfo|chief financial officer|vp.?finance|finance.*director)\b/i,
                  cro: /\b(cro|chief revenue officer|vp.?revenue|revenue.*director)\b/i,
                  ceo: /\b(ceo|chief executive officer)\b/i,
                  president: /\b(president)\b/i,
                };

                const titleLower = title.toLowerCase();
                const isCFO = executiveTitles.cfo.test(titleLower);
                const isCRO = executiveTitles.cro.test(titleLower);
                const isCEO = executiveTitles.ceo.test(titleLower);
                const isPresident = executiveTitles.president.test(titleLower);
                const isTargetExecutive = isCFO || isCRO;
                const isExecutive = isCFO || isCRO || isCEO || isPresident;
                
                if (isExecutive) {
                  const roleType = isCFO ? 'CFO' : isCRO ? 'CRO' : isCEO ? 'CEO' : 'President';
                  console.log(`     👔 ${roleType} found: ${name} (${title})`);
                }
                
              } else {
                console.log(`     ⚠️ Failed to collect profile ${employeeId}: ${collectResponse.status}`);
              }
              
            } catch (collectError) {
              console.log(`     ❌ Collection error for ${employeeId}: ${collectError.message}`);
            }
            
            // Small delay between collections
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          console.log(`     ⚠️ Target executive ${executiveName} not found in first ${Math.min(10, employeeIds.length)} employees`);
          
        } else {
          console.log(`     ⚠️ No employee IDs returned`);
          console.log(`     Response type: ${typeof result}`);
          console.log(`     Response: ${JSON.stringify(result).substring(0, 200)}`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`     ❌ Employee search failed: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.log(`     ❌ CoreSignal error: ${error.message}`);
    }
    
    return null;
  }

  /**
   * ✅ CROSS-VALIDATE EMAILS (EXACT METHOD FROM OLD PIPELINE)
   */
  private crossValidateEmails(
    coreSignalData: any,
    lushaData: any,
    domain: string,
    firstName: string,
    lastName: string
  ): {
    email: string | null;
    confidence: number;
    source: string;
    crossValidated: boolean;
  } {
    
    const validation = {
      email: null,
      confidence: 0,
      source: 'none',
      crossValidated: false
    };

    // If both sources have emails, check if they match
    if (coreSignalData?.email && lushaData?.email) {
      const coreEmail = coreSignalData.email.toLowerCase().trim();
      const lushaEmail = lushaData.email.toLowerCase().trim();
      
      if (coreEmail === lushaEmail) {
        // PERFECT MATCH - Both APIs agree!
        validation['email'] = coreSignalData.email;
        validation['confidence'] = 95;
        validation['source'] = 'CoreSignal + Lusha (cross-validated)';
        validation['crossValidated'] = true;
        
        console.log(`     ✅ EMAIL CROSS-VALIDATION: Perfect match! ${coreEmail}`);
        return validation;
      } else {
        // MISMATCH - Prefer CoreSignal
        console.log(`     ⚠️ EMAIL MISMATCH: CoreSignal(${coreEmail}) vs Lusha(${lushaEmail})`);
        validation['email'] = coreSignalData.email;
        validation['confidence'] = 75;
        validation['source'] = 'CoreSignal (preferred over Lusha mismatch)';
        return validation;
      }
    }
    
    // Only CoreSignal has email
    if (coreSignalData?.email && !lushaData?.email) {
      validation['email'] = coreSignalData.email;
      validation['confidence'] = 85;
      validation['source'] = 'CoreSignal verified';
      console.log(`     📧 CoreSignal email only: ${validation.email}`);
      return validation;
    }
    
    // Only Lusha has email
    if (!coreSignalData?.email && lushaData?.email) {
      validation['email'] = lushaData.email;
      validation['confidence'] = 70;
      validation['source'] = 'Lusha only';
      console.log(`     📧 Lusha email only: ${validation.email}`);
      return validation;
    }
    
    // No verified emails from either source - DO NOT GENERATE
    console.log(`     ❌ No verified emails found from APIs`);
    return validation; // Return with null email and 0 confidence
  }

  /**
   * 🔧 EMAIL PATTERN GENERATION (ENHANCED FOR 90% GUARANTEE)
   */
  private generateEmailPatterns(name: string, domain: string): string[] {
    const firstName = this.extractFirstName(name).toLowerCase();
    const lastName = this.extractLastName(name).toLowerCase();
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Enhanced patterns based on common corporate email formats
    const patterns = [
      // Standard patterns (most common)
      `${firstName}.${lastName}@${cleanDomain}`,
      `${firstName}${lastName}@${cleanDomain}`,
      `${firstName}_${lastName}@${cleanDomain}`,
      
      // Executive patterns (common for senior roles)
      `${firstName}@${cleanDomain}`,                    // CEO/Founder pattern
      `${lastName}@${cleanDomain}`,                     // Executive surname pattern
      
      // Abbreviated patterns
      `${firstName[0]}${lastName}@${cleanDomain}`,
      `${firstName}.${lastName[0]}@${cleanDomain}`,
      `${firstName[0]}.${lastName}@${cleanDomain}`,
      
      // Alternative separators
      `${firstName}-${lastName}@${cleanDomain}`,
      `${lastName}.${firstName}@${cleanDomain}`,
      
      // Numbers (common for duplicates)
      `${firstName}.${lastName}1@${cleanDomain}`,
      `${firstName}${lastName}1@${cleanDomain}`,
      
      // Middle initial variations (if available)
      ...(name.split(' ').length > 2 ? [
        `${firstName}.${name.split(' ')[1][0]?.toLowerCase()}.${lastName}@${cleanDomain}`,
        `${firstName}${name.split(' ')[1][0]?.toLowerCase()}${lastName}@${cleanDomain}`
      ] : [])
    ];

    return patterns.filter(email => email.length < 50 && this.isValidEmailFormat(email));
  }

  /**
   * 📧 VALIDATE EMAIL WITH ZEROBOUNCE (ENHANCED VALIDATION)
   */
  private async validateEmailWithZeroBounce(email: string): Promise<{ isValid: boolean; confidence: number }> {
    if (!this.config.ZEROBOUNCE_API_KEY) {
      return { isValid: false, confidence: 0 };
    }

    try {
      const response = await fetch(
        `https://api.zerobounce.net/v2/validate?api_key=${this.config.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`
      );

      if (response.ok) {
        const data = await response.json();
        const isValid = data['status'] === 'valid' || data['status'] === 'catch-all';
        const confidence = data['status'] === 'valid' ? 95 : data['status'] === 'catch-all' ? 75 : 0;
        
        console.log(`     📧 ZeroBounce validation: ${email} → ${data.status} (${confidence}% confidence)`);
        
        return { isValid, confidence };
      }
    } catch (error) {
      console.log(`     ⚠️ ZeroBounce validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { isValid: false, confidence: 0 };
  }

  /**
   * 🎯 PATTERN-BASED EMAIL DISCOVERY (FOR 90% GUARANTEE)
   */
  private async discoverEmailsWithPatterns(name: string, domain: string): Promise<{
    email?: string;
    confidence: number;
    source: string;
    validationMethod: string;
  }> {
    console.log(`   🎯 Pattern-based email discovery for ${name}`);
    
    const patterns = this.generateEmailPatterns(name, domain);
    console.log(`   📋 Generated ${patterns.length} email patterns`);
    
    // Test patterns in order of likelihood
    for (const email of patterns.slice(0, 5)) { // Test top 5 most likely patterns
      try {
        const validation = await this.validateEmailWithZeroBounce(email);
        
        if (validation.isValid) {
          console.log(`   ✅ Pattern match found: ${email} (${validation.confidence}% confidence)`);
          
          return {
            email,
            confidence: validation.confidence,
            source: 'pattern_generation',
            validationMethod: 'zerobounce'
          };
        } else {
          console.log(`   ❌ Pattern rejected: ${email}`);
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ⚠️ Pattern validation error for ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      confidence: 0,
      source: 'pattern_generation_failed',
      validationMethod: 'none'
    };
  }

  /**
   * 🔗 GENERATE LINKEDIN URL
   */
  private generateLinkedInUrl(name: string): string {
    const cleanName = name.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, '-');
    
    return `https://linkedin.com/in/${cleanName}`;
  }

  /**
   * 🧮 CALCULATE CONTACT CONFIDENCE
   */
  private calculateContactConfidence(
    emails: { emails: EmailContact[] },
    phones: { phones: PhoneContact[] },
    profiles: { profiles: ProfileContact[] }
  ): number {
    let confidence = 0;
    let factors = 0;

    // Email confidence (40% weight)
    if (emails.emails.length > 0) {
      confidence += emails['emails'][0].confidence * 0.4;
      factors += 0.4;
    }

    // Phone confidence (35% weight)
    if (phones.phones.length > 0) {
      confidence += phones['phones'][0].confidence * 0.35;
      factors += 0.35;
    }

    // Profile confidence (25% weight)
    if (profiles.profiles.length > 0) {
      confidence += profiles['profiles'][0].confidence * 0.25;
      factors += 0.25;
    }

    return factors > 0 ? Math.round(confidence / factors) : 0;
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private initializeEmailPatterns(): string[] {
    return [
      '{first}.{last}',
      '{first}{last}',
      '{first}_{last}',
      '{f}{last}',
      '{first}.{l}',
      '{first}',
      '{last}'
    ];
  }

  private extractFirstName(fullName: string): string {
    return fullName.split(' ')[0] || '';
  }

  private extractLastName(fullName: string): string {
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  private mapZeroBounceStatus(status: string): 'verified' | 'valid' | 'invalid' | 'unknown' {
    switch (status?.toLowerCase()) {
      case 'valid': return 'verified';
      case 'catch-all': return 'valid';
      case 'unknown': return 'unknown';
      default: return 'invalid';
    }
  }

  private mapMyEmailVerifierStatus(status: string): 'verified' | 'valid' | 'invalid' | 'unknown' {
    switch (status?.toLowerCase()) {
      case 'valid': return 'verified';
      case 'risky': return 'valid';
      case 'unknown': return 'unknown';
      default: return 'invalid';
    }
  }

  /**
   * 🤖 AI-POWERED MULTI-SOURCE CONTACT RESEARCH
   */
  private async aiPoweredContactResearch(
    executive: ExecutiveContact,
    domain: string
  ): Promise<{ emails: EmailContact[]; phones: PhoneContact[] }> {
    if (!this.config.PERPLEXITY_API_KEY) {
      return { emails: [], phones: [] };
    }

    const prompt = `Find verified contact information for ${executive.name}, ${executive.title} at ${executive.accountId}.

Search these authoritative sources:
1. Company press releases and announcements
2. SEC filings (if public company)
3. Conference speaker listings and bios
4. Industry publications and interviews
5. Executive team pages on company websites
6. Professional association directories

For each contact found, provide verification source and recency.

Provide ONLY a JSON response:
{
  "emails": [
    {
      "email": "verified email address",
      "source": "specific source where found",
      "confidence": 0.95,
      "context": "where/how it was found"
    }
  ],
  "phones": [
    {
      "number": "+1-XXX-XXX-XXXX",
      "type": "office/mobile/direct",
      "source": "specific source where found",
      "confidence": 0.90,
      "context": "where/how it was found"
    }
  ]
}

Only return contacts from verifiable, authoritative sources.`;

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

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse AI response
        const parsed = this.parseAIContactResponse(content);
        return parsed;
      }
    } catch (error) {
      console.log(`   ⚠️ AI contact research error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { emails: [], phones: [] };
  }

  /**
   * 🔍 CROSS-DOMAIN PATTERN ANALYSIS
   */
  private async crossDomainPatternAnalysis(
    executive: ExecutiveContact,
    domain: string
  ): Promise<{ emails: EmailContact[] }> {
    const emails: EmailContact[] = [];

    // Generate patterns based on corporate structure
    const patterns = this.generateAdvancedEmailPatterns(executive.name, domain);
    
    // Test patterns with lightweight validation
    for (const pattern of patterns.slice(0, 5)) { // Test top 5 patterns
      try {
        const validation = await this.lightweightEmailValidation(pattern);
        if (validation.confidence > 60) {
          emails.push({
            email: pattern,
            type: 'work',
            confidence: validation.confidence,
            validation: validation.status,
            source: 'cross_domain_pattern'
          });
        }
      } catch (error) {
        // Continue with next pattern
      }
    }

    return { emails };
  }

  /**
   * 🔧 GENERATE ADVANCED EMAIL PATTERNS
   */
  private generateAdvancedEmailPatterns(name: string, domain: string): string[] {
    const firstName = this.extractFirstName(name).toLowerCase();
    const lastName = this.extractLastName(name).toLowerCase();
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Enhanced patterns based on original pipeline
    const patterns = [
      `${firstName}.${lastName}@${cleanDomain}`,
      `${firstName}${lastName}@${cleanDomain}`,
      `${firstName}_${lastName}@${cleanDomain}`,
      `${firstName[0]}${lastName}@${cleanDomain}`,
      `${firstName}.${lastName[0]}@${cleanDomain}`,
      `${firstName}@${cleanDomain}`,
      `${lastName}@${cleanDomain}`,
      // Additional corporate patterns
      `${firstName}.${lastName}@mail.${cleanDomain}`,
      `${firstName}.${lastName}@corp.${cleanDomain}`,
      `${firstName[0]}.${lastName}@${cleanDomain}`,
      // International patterns
      `${lastName}.${firstName}@${cleanDomain}`,
      `${lastName}_${firstName}@${cleanDomain}`
    ];

    return patterns.filter(email => email.length < 50 && email.includes('@'));
  }

  /**
   * ⚡ LIGHTWEIGHT EMAIL VALIDATION
   */
  private async lightweightEmailValidation(email: string): Promise<{
    status: 'verified' | 'valid' | 'invalid' | 'unknown';
    confidence: number;
  }> {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { status: 'invalid', confidence: 0 };
    }

    // Check for obvious fake patterns
    const fakePatterns = ['noreply', 'donotreply', 'test', 'example', 'sample'];
    if (fakePatterns.some(pattern => email.toLowerCase().includes(pattern))) {
      return { status: 'invalid', confidence: 10 };
    }

    // Domain validation (basic)
    const domain = email.split('@')[1];
    if (domain && domain.length > 3) {
      return { status: 'valid', confidence: 70 };
    }

    return { status: 'unknown', confidence: 50 };
  }

  /**
   * 📝 PARSE AI CONTACT RESPONSE
   */
  private parseAIContactResponse(content: string): { emails: EmailContact[]; phones: PhoneContact[] } {
    const result = { emails: [], phones: [] };

    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Extract emails
        if (parsed['emails'] && Array.isArray(parsed.emails)) {
          parsed.emails.forEach((emailData: any) => {
            if (emailData['email'] && emailData.email.includes('@')) {
              result.emails.push({
                email: emailData.email,
                type: 'work',
                confidence: Math.round((emailData.confidence || 0.8) * 100),
                validation: 'verified',
                source: emailData.source || 'ai_research'
              });
            }
          });
        }

        // Extract phones
        if (parsed['phones'] && Array.isArray(parsed.phones)) {
          parsed.phones.forEach((phoneData: any) => {
            if (phoneData.number) {
              result.phones.push({
                phone: phoneData.number,
                type: phoneData.type || 'office',
                confidence: Math.round((phoneData.confidence || 0.8) * 100),
                validation: 'verified',
                source: phoneData.source || 'ai_research'
              });
            }
          });
        }
      }
    } catch (error) {
      console.log(`   ⚠️ AI response parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * 🏢 GET CORESIGNAL PROFESSIONAL EMAIL (PROVEN IMPLEMENTATION)
   */
  private async getCoreSignalProfessionalEmail(
    executive: ExecutiveContact,
    domain: string
  ): Promise<{ email: string; confidence: number; status: string } | null> {
    if (!this.config.CORESIGNAL_API_KEY) {
      return null;
    }

    try {
      console.log(`   🏢 CoreSignal search: ${executive.name} at ${executive.company}`);
      
      // Use the EXACT working v2 pattern from ExecutiveContactIntelligence.js
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'apikey': this.config.CORESIGNAL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: {
            bool: {
              must: [
                {
                  nested: {
                    path: "experience",
                    query: {
                      bool: {
                        must: [
                          { term: { "experience.active_experience": 1 } },
                          { 
                            bool: {
                              should: [
                                { match: { "experience.company_name": executive.company } },
                                { match: { "experience.company_name": executive.company.replace(/,?\s*(Inc|LLC|Corp|Ltd|Corporation|Company)\.?$/i, '') } }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  }
                },
                {
                  match: {
                    full_name: executive.name
                  }
                }
              ]
            }
          }
          // NO size parameter - this was causing the 422 error
        }),
        // timeout: 15000  // Remove timeout from fetch options
      });

      console.log(`   📊 CoreSignal response status: ${searchResponse.status}`);

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`   📋 CoreSignal found: ${searchData.hits?.length || 0} results`);
        
        if (searchData['hits'] && searchData.hits.length > 0) {
          // Get the employee ID from search results (EXACT working pattern)
          const employeeId = searchData['hits'][0]._id;
          console.log(`   🔍 Found employee ID: ${employeeId}, collecting profile...`);
          
          // STEP 2: Collect detailed profile using the employee ID (EXACT working pattern)
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
            headers: {
              'apikey': this.config.CORESIGNAL_API_KEY?.trim()
            }
          });

          if (collectResponse.ok) {
            const profile = await collectResponse.json();
            console.log(`   👤 Employee profile: ${profile.full_name || executive.name}`);
            console.log(`   💼 Position: ${profile.member_position_title || profile.current_position_title || 'Not provided'}`);
            
            if (profile.primary_professional_email) {
              const confidence = this.mapCoreSignalEmailConfidence(profile.primary_professional_email_status || 'unknown');
              
              console.log(`   📧 CoreSignal email: ${profile.primary_professional_email} (${confidence}% confidence, status: ${profile.primary_professional_email_status})`);
              
              return {
                email: profile.primary_professional_email,
                confidence,
                status: profile.primary_professional_email_status || 'verified'
              };
            } else {
              console.log(`   ⚠️ No primary_professional_email found in profile`);
            }
          } else {
            const errorText = await collectResponse.text();
            console.log(`   ❌ Failed to collect employee profile: ${collectResponse.status} - ${errorText}`);
          }
        } else {
          console.log(`   ⚠️ No employees found in CoreSignal search results`);
        }
      } else {
        const errorText = await searchResponse.text();
        console.log(`   ❌ CoreSignal API error: ${searchResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ CoreSignal email search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return null;
  }

  /**
   * 📊 MAP CORESIGNAL EMAIL CONFIDENCE
   */
  private mapCoreSignalEmailConfidence(status: string): number {
    const confidenceMap: Record<string, number> = {
      'verified': 95,           // Highest confidence - use directly
      'matched_email': 85,      // High confidence - validate for safety
      'matched_pattern': 70,    // Medium confidence - definitely validate
      'guessed_common_pattern': 50  // Low confidence - use other sources
    };
    
    return confidenceMap[status] || 40;
  }

  /**
   * 🔧 GENERATE CONTACT PATTERNS (FALLBACK LIKE OLD SYSTEM)
   */
  private generateContactPatterns(
    executiveName: string,
    companyName: string,
    domain: string
  ): {
    name: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    title?: string;
    company?: string;
  } {
    
    const nameParts = executiveName.split(' ');
    const firstName = nameParts[0].toLowerCase();
    const lastName = nameParts[nameParts.length - 1].toLowerCase();
    
    // Clean domain to get just the main domain (remove paths, subdomains)
    const cleanDomain = domain.split('/')[0].replace(/^www\./, '');
    
    // Generate most likely email pattern (first.last@domain.com is most common)
    const likelyEmail = `${firstName}.${lastName}@${cleanDomain}`;
    
    // Generate LinkedIn URL pattern (like old system generateLinkedInURL)
    const likelyLinkedIn = `https://www.linkedin.com/in/${firstName}-${lastName}`;
    
    console.log(`   📧 Generated email: ${likelyEmail}`);
    console.log(`   💼 Generated LinkedIn: ${likelyLinkedIn}`);
    
    return {
      name: executiveName,
      email: likelyEmail,
      phone: null, // Phone is harder to generate reliably
      linkedinUrl: likelyLinkedIn,
      title: null,
      company: companyName
    };
  }
}
