#!/usr/bin/env node

/**
 * 🔍 ENRICH TOP ENGINEERING PLUS WORKSPACE WITH CORESIGNAL DATA
 * 
 * This script enriches all people in the TOP Engineering Plus workspace
 * with comprehensive CoreSignal data including:
 * - Professional emails
 * - Enhanced job titles and descriptions
 * - Skills and expertise
 * - Work history
 * - Company intelligence
 * - Contact validation
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EnrichTOPWorkspaceCoreSignal {
  constructor() {
    this.prisma = new PrismaClient();
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    this.enrichedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.rateLimitDelay = 100; // 100ms between requests to respect rate limits
  }

  async enrichWorkspace() {
    try {
      console.log('🚀 STARTING TOP ENGINEERING PLUS CORESIGNAL ENRICHMENT');
      console.log('=====================================================');
      console.log(`📊 Workspace ID: ${this.workspaceId}`);
      console.log(`🔑 CoreSignal API Key: ${this.coresignalApiKey ? 'Configured' : 'Missing'}`);
      console.log('');

      if (!this.coresignalApiKey) {
        throw new Error('CORESIGNAL_API_KEY not found in environment variables');
      }

      // Get all people in the workspace
      const people = await this.prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId
        },
        include: {
          company: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          fullName: 'asc'
        }
      });

      console.log(`📋 Found ${people.length} people to enrich`);
      console.log('');

      // Categorize people by enrichment strategy
      const linkedinOnly = people.filter(p => p.linkedinUrl && !(p.email || p.workEmail || p.personalEmail));
      const emailOnly = people.filter(p => (p.email || p.workEmail || p.personalEmail) && !p.linkedinUrl);
      const bothData = people.filter(p => (p.email || p.workEmail || p.personalEmail) && p.linkedinUrl);
      const neither = people.filter(p => !(p.email || p.workEmail || p.personalEmail) && !p.linkedinUrl);

      console.log('📊 ENRICHMENT STRATEGY BREAKDOWN:');
      console.log('=================================');
      console.log(`   LinkedIn Only: ${linkedinOnly.length} people`);
      console.log(`   Email Only: ${emailOnly.length} people`);
      console.log(`   Both Data: ${bothData.length} people`);
      console.log(`   Neither: ${neither.length} people`);
      console.log('');

      // Start enrichment process
      console.log('🔄 STARTING ENRICHMENT PROCESS...');
      console.log('');

      // Strategy 1: Enrich people with LinkedIn URLs (highest success rate)
      if (linkedinOnly.length > 0) {
        console.log(`🔗 ENRICHING ${linkedinOnly.length} PEOPLE WITH LINKEDIN URLs`);
        console.log('================================================================');
        await this.enrichLinkedInOnly(linkedinOnly);
        console.log('');
      }

      // Strategy 2: Enrich people with both email and LinkedIn (comprehensive)
      if (bothData.length > 0) {
        console.log(`📧🔗 ENRICHING ${bothData.length} PEOPLE WITH BOTH EMAIL AND LINKEDIN`);
        console.log('=====================================================================');
        await this.enrichBothData(bothData);
        console.log('');
      }

      // Strategy 3: Enrich people with email only (name + company search)
      if (emailOnly.length > 0) {
        console.log(`📧 ENRICHING ${emailOnly.length} PEOPLE WITH EMAIL ONLY`);
        console.log('=====================================================');
        await this.enrichEmailOnly(emailOnly);
        console.log('');
      }

      // Strategy 4: Try to enrich people with neither (name + company search)
      if (neither.length > 0) {
        console.log(`❓ ATTEMPTING TO ENRICH ${neither.length} PEOPLE WITH NO CONTACT DATA`);
        console.log('==================================================================');
        await this.enrichNeither(neither);
        console.log('');
      }

      // Final summary
      console.log('🎉 ENRICHMENT COMPLETE!');
      console.log('========================');
      console.log(`✅ Successfully enriched: ${this.enrichedCount} people`);
      console.log(`❌ Errors encountered: ${this.errorCount} people`);
      console.log(`⏭️  Skipped: ${this.skippedCount} people`);
      console.log(`📊 Total processed: ${this.enrichedCount + this.errorCount + this.skippedCount} people`);

    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * 🔗 ENRICH PEOPLE WITH LINKEDIN URLs
   * Uses LinkedIn URL to search and collect CoreSignal data
   */
  async enrichLinkedInOnly(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName}`);
      
      try {
        // Search by LinkedIn URL
        const employeeId = await this.searchByLinkedInUrl(person.linkedinUrl);
        
        if (employeeId) {
          // Collect detailed profile
          const profileData = await this.collectEmployeeProfile(employeeId);
          
          if (profileData) {
            // Update person record with enriched data
            await this.updatePersonWithCoreSignalData(person, employeeId, profileData);
            this.enrichedCount++;
            console.log(`      ✅ Enriched with CoreSignal data`);
          } else {
            console.log(`      ⚠️  Found employee ID but no profile data`);
            this.skippedCount++;
          }
        } else {
          console.log(`      ⚠️  No CoreSignal match found`);
          this.skippedCount++;
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        this.errorCount++;
      }
      
      // Rate limiting
      if (i < people.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }
  }

  /**
   * 📧🔗 ENRICH PEOPLE WITH BOTH EMAIL AND LINKEDIN
   * Uses both data sources for maximum enrichment
   */
  async enrichBothData(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName}`);
      
      try {
        // Try LinkedIn first (more reliable)
        let employeeId = await this.searchByLinkedInUrl(person.linkedinUrl);
        
        // If LinkedIn fails, try email + name search
        if (!employeeId) {
          const email = person.email || person.workEmail || person.personalEmail;
          employeeId = await this.searchByEmailAndName(email, person.fullName, person.company?.name);
        }
        
        if (employeeId) {
          const profileData = await this.collectEmployeeProfile(employeeId);
          
          if (profileData) {
            await this.updatePersonWithCoreSignalData(person, employeeId, profileData);
            this.enrichedCount++;
            console.log(`      ✅ Enriched with CoreSignal data`);
          } else {
            console.log(`      ⚠️  Found employee ID but no profile data`);
            this.skippedCount++;
          }
        } else {
          console.log(`      ⚠️  No CoreSignal match found`);
          this.skippedCount++;
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        this.errorCount++;
      }
      
      // Rate limiting
      if (i < people.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }
  }

  /**
   * 📧 ENRICH PEOPLE WITH EMAIL ONLY
   * Uses email + name + company to search CoreSignal
   */
  async enrichEmailOnly(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName}`);
      
      try {
        const email = person.email || person.workEmail || person.personalEmail;
        const employeeId = await this.searchByEmailAndName(email, person.fullName, person.company?.name);
        
        if (employeeId) {
          const profileData = await this.collectEmployeeProfile(employeeId);
          
          if (profileData) {
            await this.updatePersonWithCoreSignalData(person, employeeId, profileData);
            this.enrichedCount++;
            console.log(`      ✅ Enriched with CoreSignal data`);
          } else {
            console.log(`      ⚠️  Found employee ID but no profile data`);
            this.skippedCount++;
          }
        } else {
          console.log(`      ⚠️  No CoreSignal match found`);
          this.skippedCount++;
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        this.errorCount++;
      }
      
      // Rate limiting
      if (i < people.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }
  }

  /**
   * ❓ ENRICH PEOPLE WITH NO CONTACT DATA
   * Uses name + company to search CoreSignal
   */
  async enrichNeither(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName}`);
      
      try {
        const employeeId = await this.searchByNameAndCompany(person.fullName, person.company?.name);
        
        if (employeeId) {
          const profileData = await this.collectEmployeeProfile(employeeId);
          
          if (profileData) {
            await this.updatePersonWithCoreSignalData(person, employeeId, profileData);
            this.enrichedCount++;
            console.log(`      ✅ Enriched with CoreSignal data`);
          } else {
            console.log(`      ⚠️  Found employee ID but no profile data`);
            this.skippedCount++;
          }
        } else {
          console.log(`      ⚠️  No CoreSignal match found`);
          this.skippedCount++;
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        this.errorCount++;
      }
      
      // Rate limiting
      if (i < people.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }
  }

  /**
   * 🔍 SEARCH CORESIGNAL BY LINKEDIN URL
   */
  async searchByLinkedInUrl(linkedinUrl) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  linkedin_url: linkedinUrl
                }
              }
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.coresignalApiKey
        },
        body: JSON.stringify(searchQuery)
      });

      if (response.ok) {
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      }
      
      return null;
    } catch (error) {
      console.log(`      ⚠️  LinkedIn search error: ${error.message}`);
      return null;
    }
  }

  /**
   * 🔍 SEARCH CORESIGNAL BY EMAIL AND NAME
   */
  async searchByEmailAndName(email, fullName, companyName) {
    try {
      // Try multiple search strategies
      const strategies = [
        // Strategy 1: Exact email match (most reliable)
        {
          query: {
            bool: {
              must: [
                {
                  term: {
                    "primary_professional_email.exact": email
                  }
                }
              ]
            }
          }
        },
        // Strategy 2: Email match with name
        {
          query: {
            bool: {
              must: [
                { match: { primary_professional_email: email } },
                { match: { full_name: fullName } }
              ]
            }
          }
        },
        // Strategy 3: Company + name (if company available)
        ...(companyName ? [{
          query: {
            bool: {
              must: [
                {
                  nested: {
                    path: 'experience',
                    query: {
                      bool: {
                        must: [
                          { match: { 'experience.company_name': companyName } },
                          { match: { 'experience.active_experience': 1 } }
                        ]
                      }
                    }
                  }
                },
                { match: { full_name: fullName } }
              ]
            }
          }
        }] : [])
      ];

      for (const strategy of strategies) {
        const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.coresignalApiKey
          },
          body: JSON.stringify(strategy)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            return data[0];
          }
        }
      }
      
      return null;
    } catch (error) {
      console.log(`      ⚠️  Email/name search error: ${error.message}`);
      return null;
    }
  }

  /**
   * 🔍 SEARCH CORESIGNAL BY NAME AND COMPANY
   */
  async searchByNameAndCompany(fullName, companyName) {
    try {
      if (!companyName) return null;

      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      must: [
                        { match: { 'experience.company_name': companyName } },
                        { match: { 'experience.active_experience': 1 } }
                      ]
                    }
                  }
                }
              },
              { match: { full_name: fullName } }
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.coresignalApiKey
        },
        body: JSON.stringify(searchQuery)
      });

      if (response.ok) {
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      }
      
      return null;
    } catch (error) {
      console.log(`      ⚠️  Name/company search error: ${error.message}`);
      return null;
    }
  }

  /**
   * 📥 COLLECT EMPLOYEE PROFILE FROM CORESIGNAL
   */
  async collectEmployeeProfile(employeeId) {
    try {
      const response = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        method: 'GET',
        headers: {
          'apikey': this.coresignalApiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.log(`      ⚠️  Profile collection error: ${error.message}`);
      return null;
    }
  }

  /**
   * 💾 UPDATE PERSON RECORD WITH CORESIGNAL DATA
   */
  async updatePersonWithCoreSignalData(person, employeeId, profileData) {
    try {
      // VALIDATE CORESIGNAL DATA BEFORE UPDATING
      const validationResult = this.validateCoresignalData(person, profileData);
      if (!validationResult.isValid) {
        console.log(`      ❌ VALIDATION FAILED: ${validationResult.reason}`);
        console.log(`      🚫 Skipping enrichment for ${person.fullName}`);
        return false;
      }
      
      console.log(`      ✅ Validation passed for ${person.fullName}`);
      
      // Extract key data from CoreSignal profile
      const enrichedData = {
        // Enhanced contact information
        workEmail: profileData.primary_professional_email || person.workEmail,
        email: profileData.primary_professional_email || person.email,
        
        // Enhanced professional data
        jobTitle: profileData.active_experience_title || person.jobTitle,
        department: profileData.active_experience_department || person.department,
        
        // LinkedIn URL (if not already present)
        linkedinUrl: profileData.linkedin_url || person.linkedinUrl,
        
        // Enhanced location data
        address: profileData.location_full || person.address,
        
        // Skills and expertise
        bio: profileData.summary || person.bio,
        
        // CoreSignal metadata
        customFields: {
          ...person.customFields,
          coresignal: {
            employeeId: employeeId,
            enrichedAt: new Date().toISOString(),
            skills: profileData.inferred_skills || [],
            experience: profileData.experience || [],
            education: profileData.education || [],
            connectionsCount: profileData.connections_count,
            followersCount: profileData.followers_count,
            isDecisionMaker: profileData.is_decision_maker,
            totalExperienceMonths: profileData.total_experience_duration_months
          }
        }
      };

      // Update the person record
      await this.prisma.people.update({
        where: { id: person.id },
        data: enrichedData
      });

      console.log(`      💾 Updated person record with CoreSignal data`);
      
    } catch (error) {
      console.log(`      ❌ Database update error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 VALIDATE CORESIGNAL DATA BEFORE UPDATING
   */
  validateCoresignalData(person, profileData) {
    const validation = {
      isValid: true,
      reason: null
    };
    
    // 1. LinkedIn URL validation - must match person name
    if (profileData.linkedin_url && person.linkedinUrl) {
      if (profileData.linkedin_url !== person.linkedinUrl) {
        // Check if the LinkedIn URL name matches the person name
        const urlName = this.extractNameFromLinkedInUrl(profileData.linkedin_url);
        const personName = person.fullName;
        
        if (urlName && personName) {
          const similarity = this.calculateNameSimilarity(urlName, personName);
          if (similarity < 0.6) {
            validation.isValid = false;
            validation.reason = `LinkedIn URL name mismatch: URL="${urlName}" vs Person="${personName}" (similarity: ${Math.round(similarity * 100)}%)`;
            return validation;
          }
        }
      }
    }
    
    // 2. Name validation - CoreSignal name must match person name
    if (profileData.full_name && person.fullName) {
      const similarity = this.calculateNameSimilarity(profileData.full_name, person.fullName);
      if (similarity < 0.7) {
        validation.isValid = false;
        validation.reason = `Name mismatch: CoreSignal="${profileData.full_name}" vs Person="${person.fullName}" (similarity: ${Math.round(similarity * 100)}%)`;
        return validation;
      }
    }
    
    // 3. Company validation - if we have company context
    if (profileData.active_experience_company && person.company) {
      const coresignalCompany = profileData.active_experience_company;
      const personCompany = typeof person.company === 'string' ? person.company : person.company.name;
      
      if (personCompany && coresignalCompany) {
        const similarity = this.calculateCompanySimilarity(coresignalCompany, personCompany);
        if (similarity < 0.5) {
          validation.isValid = false;
          validation.reason = `Company mismatch: CoreSignal="${coresignalCompany}" vs Person="${personCompany}" (similarity: ${Math.round(similarity * 100)}%)`;
          return validation;
        }
      }
    }
    
    return validation;
  }
  
  /**
   * Extract name from LinkedIn URL
   */
  extractNameFromLinkedInUrl(url) {
    try {
      const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }
  
  /**
   * Calculate name similarity
   */
  calculateNameSimilarity(name1, name2) {
    const normalize = (name) => name.toLowerCase().replace(/[^a-z\s]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Simple similarity based on common words
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }
  
  /**
   * Calculate company similarity
   */
  calculateCompanySimilarity(company1, company2) {
    const normalize = (name) => name.toLowerCase().replace(/[^a-z\s]/g, '');
    const c1 = normalize(company1);
    const c2 = normalize(company2);
    
    // Simple similarity based on common words
    const words1 = c1.split(/\s+/);
    const words2 = c2.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  /**
   * ⏱️ DELAY FUNCTION FOR RATE LIMITING
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the enrichment process
async function main() {
  const enricher = new EnrichTOPWorkspaceCoreSignal();
  await enricher.enrichWorkspace();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichTOPWorkspaceCoreSignal;
