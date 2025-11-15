#!/usr/bin/env node

/**
 * 🔍 ENRICH TOP ENGINEERING PLUS ORIGINAL PEOPLE WITH CORESIGNAL
 * 
 * This script enriches people in TOP Engineering Plus workspace who were
 * originally updated but NOT enriched via the buyer group pipeline.
 * 
 * Problem:
 * - People found via buyer group pipeline → got enriched ✅
 * - People who were originally updated (before buyer group) → NOT enriched ❌
 * 
 * Solution:
 * - Find people with email/LinkedIn who are missing CoreSignal data
 * - Exclude people already enriched via buyer group (have buyerGroupRole/isBuyerGroupMember)
 * - Use CoreSignal search + collect for 1:1 matching
 * - Strict validation to ensure exact person match (never bring in wrong data)
 * - Only enrich when confirmation is certain
 * - Preserves existing good data
 * 
 * Features:
 * - Finds people who need enrichment (missing CoreSignal data, not in buyer group)
 * - Uses email and/or LinkedIn for 1:1 matching
 * - Strict validation: name, email, LinkedIn, company must match
 * - Only enriches when confidence is high
 * - Preserves existing good data
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EnrichTOPOriginalPeopleCoreSignal {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY?.trim().replace(/\\n/g, '');
    this.workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus workspace
    this.enrichedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.validationFailedCount = 0;
    this.notFoundCount = 0;
    this.rateLimitDelay = 200; // 200ms between requests to respect rate limits
    this.limit = options.limit || null; // Optional limit for testing
    this.stats = {
      creditsUsed: {
        search: 0,
        collect: 0
      }
    };
  }

  async enrichOriginalPeople() {
    try {
      console.log('🚀 ENRICHING TOP ENGINEERING PLUS ORIGINAL PEOPLE');
      console.log('==================================================');
      console.log(`📊 Workspace ID: ${this.workspaceId}`);
      console.log(`🔑 CoreSignal API Key: ${this.coresignalApiKey ? 'Configured' : 'Missing'}`);
      console.log('');

      if (!this.coresignalApiKey) {
        throw new Error('CORESIGNAL_API_KEY not found in environment variables');
      }

      // Find people who need enrichment
      // Criteria: People who have email or LinkedIn but missing CoreSignal data
      let peopleNeedingEnrichment = await this.findPeopleNeedingEnrichment();

      // Apply limit if set (for testing)
      if (this.limit) {
        console.log(`🧪 TEST MODE: Limiting to ${this.limit} people`);
        peopleNeedingEnrichment = peopleNeedingEnrichment.slice(0, this.limit);
      }

      console.log(`📋 Found ${peopleNeedingEnrichment.length} people needing enrichment`);
      console.log('');

      if (peopleNeedingEnrichment.length === 0) {
        console.log('✅ No people need enrichment. All set!');
        console.log('');
        console.log('This means:');
        console.log('  - All people either have CoreSignal data, OR');
        console.log('  - Were already enriched via buyer group pipeline, OR');
        console.log('  - Don\'t have email/LinkedIn for matching');
        return;
      }

      // Show diagnostic info
      const emailCount = peopleNeedingEnrichment.filter(p => p.email || p.workEmail || p.personalEmail).length;
      const linkedInCount = peopleNeedingEnrichment.filter(p => p.linkedinUrl).length;
      const bothCount = peopleNeedingEnrichment.filter(p => 
        p.linkedinUrl && (p.email || p.workEmail || p.personalEmail)
      ).length;
      
      console.log('📊 DIAGNOSTIC INFO:');
      console.log(`   Total needing enrichment: ${peopleNeedingEnrichment.length}`);
      console.log(`   Have email: ${emailCount}`);
      console.log(`   Have LinkedIn: ${linkedInCount}`);
      console.log(`   Have both: ${bothCount}`);
      console.log('');

      // Categorize by available data
      // Priority: LinkedIn first (most reliable), then email
      const withLinkedIn = peopleNeedingEnrichment.filter(p => p.linkedinUrl);
      const withEmail = peopleNeedingEnrichment.filter(p => 
        (p.email || p.workEmail || p.personalEmail) && !p.linkedinUrl
      );
      const withBoth = peopleNeedingEnrichment.filter(p => 
        p.linkedinUrl && (p.email || p.workEmail || p.personalEmail)
      );

      console.log('\n🎯 SEARCH STRATEGY (Exact Person Matching):');
      console.log('   Priority 1: LinkedIn URL (exact 1:1 match)');
      console.log('   Priority 2: LinkedIn + Email combined (both must match)');
      console.log('   Priority 3: Email only (exact email match)');
      console.log('   All searches use exact term queries for maximum accuracy');
      console.log('');

      console.log('📊 ENRICHMENT STRATEGY BREAKDOWN:');
      console.log('=================================');
      console.log(`   LinkedIn Only: ${withLinkedIn.length} people`);
      console.log(`   Email Only: ${withEmail.length} people`);
      console.log(`   Both LinkedIn & Email: ${withBoth.length} people`);
      console.log('');

      // Start enrichment - prioritize LinkedIn (most reliable)
      console.log('🔄 STARTING ENRICHMENT PROCESS...');
      console.log('');

      // Strategy 1: Enrich people with LinkedIn URLs (highest accuracy)
      if (withLinkedIn.length > 0) {
        console.log(`🔗 ENRICHING ${withLinkedIn.length} PEOPLE WITH LINKEDIN URLs`);
        console.log('================================================================');
        await this.enrichPeopleWithLinkedIn(withLinkedIn);
        console.log('');
      }

      // Strategy 2: Enrich people with both email and LinkedIn (comprehensive)
      if (withBoth.length > 0) {
        console.log(`📧🔗 ENRICHING ${withBoth.length} PEOPLE WITH BOTH EMAIL AND LINKEDIN`);
        console.log('=====================================================================');
        await this.enrichPeopleWithBoth(withBoth);
        console.log('');
      }

      // Strategy 3: Enrich people with email only (name + company validation)
      if (withEmail.length > 0) {
        console.log(`📧 ENRICHING ${withEmail.length} PEOPLE WITH EMAIL ONLY`);
        console.log('=====================================================');
        await this.enrichPeopleWithEmail(withEmail);
        console.log('');
      }

      // Final summary
      console.log('🎉 ENRICHMENT COMPLETE!');
      console.log('========================');
      console.log(`✅ Successfully enriched: ${this.enrichedCount} people`);
      console.log(`❌ Validation failed: ${this.validationFailedCount} people`);
      console.log(`🔍 Not found in CoreSignal: ${this.notFoundCount} people`);
      console.log(`⏭️  Skipped: ${this.skippedCount} people`);
      console.log(`❌ Errors encountered: ${this.errorCount} people`);
      console.log(`📊 Total processed: ${this.enrichedCount + this.validationFailedCount + this.notFoundCount + this.skippedCount + this.errorCount} people`);
      console.log('');
      console.log('💰 CORESIGNAL CREDITS USED:');
      console.log(`   Search: ${this.stats.creditsUsed.search}`);
      console.log(`   Collect: ${this.stats.creditsUsed.collect}`);
      console.log(`   Total: ${this.stats.creditsUsed.search + this.stats.creditsUsed.collect}`);

    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Find people who need enrichment
   * Specifically: People who were originally updated but NOT enriched via buyer group pipeline
   * 
   * Criteria:
   * - Have email or LinkedIn (for 1:1 matching)
   * - Missing CoreSignal enrichment data
   * - NOT part of buyer group enrichment (no buyerGroupRole, not isBuyerGroupMember)
   */
  async findPeopleNeedingEnrichment() {
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        // Must have at least email or LinkedIn for matching
        AND: [
          {
            OR: [
              { email: { not: null } },
              { workEmail: { not: null } },
              { personalEmail: { not: null } },
              { linkedinUrl: { not: null } }
            ]
          },
          // NOT enriched via buyer group pipeline
          {
            OR: [
              { buyerGroupRole: null },
              { isBuyerGroupMember: false },
              { isBuyerGroupMember: null }
            ]
          },
          // Missing CoreSignal data - we'll filter this in code since JSON fields can be tricky
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            linkedinUrl: true
          }
        }
      },
      orderBy: [
        // Prioritize people with LinkedIn URLs (most reliable for matching)
        { linkedinUrl: { sort: 'desc', nulls: 'last' } },
        { fullName: 'asc' }
      ]
    });

    // Additional filtering: Exclude people who already have good CoreSignal data
    return people.filter(person => {
      // Check if they have CoreSignal data in coresignalData field
      const hasCoresignalData = person.coresignalData && 
        typeof person.coresignalData === 'object' &&
        Object.keys(person.coresignalData).length > 0 &&
        person.coresignalData.id; // CoreSignal profiles have an 'id' field
      
      // Check if they have CoreSignal employeeId in customFields
      const hasCoresignalInCustomFields = person.customFields?.coresignal?.employeeId;

      // Need enrichment if missing both
      const needsEnrichment = !hasCoresignalData && !hasCoresignalInCustomFields;

      // Also check: if they have buyerGroupRole, they were enriched via buyer group - skip them
      if (person.buyerGroupRole && person.isBuyerGroupMember) {
        return false; // Already enriched via buyer group
      }

      return needsEnrichment;
    });
  }

  /**
   * Enrich people with LinkedIn URLs only
   */
  async enrichPeopleWithLinkedIn(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName} (${person.company?.name || 'No Company'})`);
      
      try {
        // Search by LinkedIn URL (most reliable)
        console.log(`      🔍 Searching by LinkedIn URL: ${person.linkedinUrl}`);
        const employeeId = await this.searchByLinkedInUrl(person.linkedinUrl);
        
        if (!employeeId) {
          console.log(`      ⚠️  No CoreSignal match found for LinkedIn: ${person.linkedinUrl}`);
          this.notFoundCount++;
          continue;
        }

        // Collect detailed profile
        const profileData = await this.collectEmployeeProfile(employeeId);
        
        if (!profileData) {
          console.log(`      ⚠️  Found employee ID but no profile data`);
          this.skippedCount++;
          continue;
        }

        // DEBUG: Validate LinkedIn URL matches
        console.log(`      🔍 DEBUG: Searched for LinkedIn: "${person.linkedinUrl}"`);
        console.log(`      🔍 DEBUG: Profile LinkedIn: "${profileData.linkedin_url || 'N/A'}"`);
        
        // CRITICAL: If we searched for a LinkedIn URL, it MUST match the returned profile
        if (profileData.linkedin_url && profileData.linkedin_url !== person.linkedinUrl) {
          console.log(`      ⚠️  CRITICAL: LinkedIn URL mismatch!`);
          console.log(`      ⚠️  Searched: "${person.linkedinUrl}"`);
          console.log(`      ⚠️  Returned: "${profileData.linkedin_url}"`);
          console.log(`      ⚠️  This is NOT a valid match - rejecting.`);
          this.validationFailedCount++;
          continue;
        }
        
        if (!profileData.linkedin_url) {
          console.log(`      ⚠️  WARNING: Profile has no LinkedIn URL, but we searched by LinkedIn`);
          console.log(`      ⚠️  This is suspicious - rejecting to be safe.`);
          this.validationFailedCount++;
          continue;
        }

        // Validate match before updating
        const validation = this.validateExactMatch(person, profileData, 'linkedin');
        
        if (!validation.isValid) {
          console.log(`      ❌ VALIDATION FAILED: ${validation.reason}`);
          console.log(`      🚫 Skipping enrichment to prevent wrong data`);
          this.validationFailedCount++;
          continue;
        }

        // Update person record with enriched data
        await this.updatePersonWithCoreSignalData(person, employeeId, profileData, validation);
        this.enrichedCount++;
        console.log(`      ✅ Enriched with CoreSignal data (ID: ${employeeId})`);
        
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
   * Enrich people with both email and LinkedIn
   * Uses BOTH LinkedIn and email together for maximum accuracy
   */
  async enrichPeopleWithBoth(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName} (${person.company?.name || 'No Company'})`);
      
      try {
        const email = person.email || person.workEmail || person.personalEmail;
        
        // Strategy 1: Search by LinkedIn URL (most reliable 1:1 match)
        console.log(`      🔍 Strategy 1: LinkedIn URL (exact match)`);
        let employeeId = await this.searchByLinkedInUrl(person.linkedinUrl);
        let matchMethod = 'linkedin';
        
        // Strategy 2: If LinkedIn didn't find exact match, try LinkedIn + Email combined search
        if (!employeeId && email) {
          console.log(`      🔍 Strategy 2: LinkedIn + Email (both must match)`);
          employeeId = await this.searchByLinkedInAndEmail(person.linkedinUrl, email, person.company);
          matchMethod = 'linkedin+email';
        }
        
        // Strategy 3: If still no match, try Email only (exact match)
        if (!employeeId && email) {
          console.log(`      🔍 Strategy 3: Email only (exact match)`);
          employeeId = await this.searchByEmailAndName(email, person.fullName, person.company);
          matchMethod = 'email';
        }
        
        if (!employeeId) {
          console.log(`      ⚠️  No CoreSignal match found`);
          this.notFoundCount++;
          continue;
        }

        // Collect detailed profile
        const profileData = await this.collectEmployeeProfile(employeeId);
        
        if (!profileData) {
          console.log(`      ⚠️  Found employee ID but no profile data`);
          this.skippedCount++;
          continue;
        }

        // DEBUG: Validate LinkedIn URL if we searched by LinkedIn
        if (person.linkedinUrl) {
          console.log(`      🔍 DEBUG: Searched for LinkedIn: "${person.linkedinUrl}"`);
          console.log(`      🔍 DEBUG: Profile LinkedIn: "${profileData.linkedin_url || 'N/A'}"`);
          
          // CRITICAL: If we searched for a LinkedIn URL, it MUST match the returned profile
          if (profileData.linkedin_url && profileData.linkedin_url !== person.linkedinUrl) {
            console.log(`      ⚠️  CRITICAL: LinkedIn URL mismatch!`);
            console.log(`      ⚠️  Searched: "${person.linkedinUrl}"`);
            console.log(`      ⚠️  Returned: "${profileData.linkedin_url}"`);
            console.log(`      ⚠️  This is NOT a valid match - rejecting.`);
            this.validationFailedCount++;
            continue;
          }
        }

        // CRITICAL: Validate exact match before updating
        const validation = this.validateExactMatch(person, profileData, matchMethod);
        
        if (!validation.isValid) {
          console.log(`      ❌ VALIDATION FAILED: ${validation.reason}`);
          console.log(`      🚫 Skipping enrichment to prevent wrong data`);
          this.validationFailedCount++;
          continue;
        }

        // Update person record
        await this.updatePersonWithCoreSignalData(person, employeeId, profileData, validation);
        this.enrichedCount++;
        console.log(`      ✅ Enriched with CoreSignal data (ID: ${employeeId}, method: ${matchMethod})`);
        console.log(`      ✅ Validation: ${validation.matchedFields.join(', ')} matched`);
        
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
   * Enrich people with email only
   */
  async enrichPeopleWithEmail(people) {
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`   ${i + 1}/${people.length} - ${person.fullName} (${person.company?.name || 'No Company'})`);
      
      try {
        const email = person.email || person.workEmail || person.personalEmail;
        console.log(`      🔍 Searching by Email: ${email} (Company: ${person.company?.name || 'N/A'})`);
        const searchResult = await this.searchByEmailAndName(email, person.fullName, person.company);
        
        if (!searchResult || !searchResult.employeeId) {
          console.log(`      ⚠️  No CoreSignal match found for email: ${email}`);
          this.notFoundCount++;
          continue;
        }

        const { employeeId, matchMethod } = searchResult;

        // Collect detailed profile
        const profileData = await this.collectEmployeeProfile(employeeId);
        
        if (!profileData) {
          console.log(`      ⚠️  Found employee ID but no profile data`);
          this.skippedCount++;
          continue;
        }

        // DEBUG: Check if the searched email appears in the returned profile
        console.log(`      🔍 DEBUG: Searched for email: "${email}"`);
        console.log(`      🔍 DEBUG: Found via: ${matchMethod}`);
        console.log(`      🔍 DEBUG: Profile primary email: "${profileData.primary_professional_email || 'N/A'}"`);
        
        const emailCollection = profileData.professional_emails_collection || [];
        if (Array.isArray(emailCollection) && emailCollection.length > 0) {
          const emails = emailCollection.map(e => {
            if (typeof e === 'string') return e;
            return e.professional_email || e.email || JSON.stringify(e);
          });
          console.log(`      🔍 DEBUG: Profile email collection (${emailCollection.length}): ${emails.join(', ')}`);
        } else {
          console.log(`      🔍 DEBUG: Profile has no email collection`);
        }
        
        // CRITICAL: If we searched by email (not company+name), email MUST match
        // If we found via company+name, different email is OK (will validate name/company)
        if (matchMethod === 'email' || matchMethod === 'email (.exact)') {
          const primaryMatches = profileData.primary_professional_email && 
            profileData.primary_professional_email.toLowerCase() === email.toLowerCase();
          const inCollection = emailCollection.some(e => {
            const collEmail = typeof e === 'string' ? e : (e.professional_email || e.email);
            return collEmail && collEmail.toLowerCase() === email.toLowerCase();
          });
          
          if (!primaryMatches && !inCollection) {
            console.log(`      ⚠️  CRITICAL: Searched by email but email not in profile!`);
            console.log(`      ⚠️  This is NOT a valid match - rejecting.`);
            this.validationFailedCount++;
            continue;
          }
        } else if (matchMethod === 'company + name') {
          console.log(`      ℹ️  Found via company+name - email may differ (will validate name/company match)`);
        }

        // Strict validation (name and company must match strongly)
        const validation = this.validateExactMatch(person, profileData, matchMethod);
        
        if (!validation.isValid) {
          console.log(`      ❌ VALIDATION FAILED: ${validation.reason}`);
          console.log(`      🚫 Skipping enrichment to prevent wrong data`);
          this.validationFailedCount++;
          continue;
        }

        // Update person record
        await this.updatePersonWithCoreSignalData(person, employeeId, profileData, validation);
        this.enrichedCount++;
        console.log(`      ✅ Enriched with CoreSignal data (ID: ${employeeId})`);
        
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
   * Search CoreSignal by LinkedIn URL AND Email together (both must match - exact person)
   */
  async searchByLinkedInAndEmail(linkedinUrl, email, company) {
    try {
      if (!linkedinUrl || !email) return null;

      console.log(`      🔍 Searching: LinkedIn + Email (both must match)`);

      const searchQuery = {
        query: {
          bool: {
            must: [
              // LinkedIn URL must match exactly
              {
                term: {
                  "linkedin_url.keyword": linkedinUrl
                }
              },
              // Email must match exactly (primary or collection)
              {
                bool: {
                  should: [
                    {
                      term: {
                        "primary_professional_email.exact": email
                      }
                    },
                    {
                      term: {
                        "primary_professional_email.keyword": email
                      }
                    },
                    {
                      match: {
                        "primary_professional_email": email
                      }
                    },
                    {
                      nested: {
                        path: "professional_emails_collection",
                        query: {
                          term: {
                            "professional_emails_collection.professional_email.exact": email
                          }
                        }
                      }
                    },
                    {
                      nested: {
                        path: "professional_emails_collection",
                        query: {
                          term: {
                            "professional_emails_collection.professional_email.keyword": email
                          }
                        }
                      }
                    }
                  ],
                  minimum_should_match: 1
                }
              }
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.coresignalApiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.stats.creditsUsed.search += 1;

      if (response.ok) {
        const data = await response.json();
        
        // CoreSignal API returns array of objects with 'id' field
        if (Array.isArray(data) && data.length > 0) {
          return data[0].id || data[0];
        }
        
        // Fallback: Handle wrapped response structure
        if (data.hits?.hits?.length > 0) {
          const firstHit = data.hits.hits[0];
          return firstHit._source?.id || firstHit.id || firstHit._id;
        }
        
        if (data.id) {
          return data.id;
        }
      } else if (response.status !== 404) {
        const errorText = await response.text();
        console.log(`      ⚠️  API Error (${response.status}) for LinkedIn+Email: ${errorText.substring(0, 200)}`);
      }
      
      return null;
    } catch (error) {
      console.log(`      ⚠️  LinkedIn+Email search error: ${error.message}`);
      return null;
    }
  }

  /**
   * Search CoreSignal by LinkedIn URL (exact match)
   * BEST PRACTICE: Use exact term query on keyword field for 1:1 matching
   */
  async searchByLinkedInUrl(linkedinUrl) {
    try {
      if (!linkedinUrl) return null;
      
      // Normalize LinkedIn URL for consistent matching
      const normalizedUrl = linkedinUrl.trim().toLowerCase();
      
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                term: {
                  "linkedin_url.keyword": normalizedUrl
                }
              }
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.coresignalApiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.stats.creditsUsed.search += 1;

      if (response.ok) {
        const data = await response.json();
        
        // CoreSignal API returns array of objects with 'id' field
        // Format: [{ id: 123, full_name: "...", ... }, { id: 456, ... }]
        if (Array.isArray(data) && data.length > 0) {
          // Return the ID from the first result
          return data[0].id || data[0];
        }
        
        // Fallback: Handle wrapped response structure (if API changes)
        if (data.hits?.hits?.length > 0) {
          const firstHit = data.hits.hits[0];
          return firstHit._source?.id || firstHit.id || firstHit._id;
        }
        
        // Fallback: Direct object with id field
        if (data.id) {
          return data.id;
        }
      } else {
        const errorText = await response.text();
        console.log(`      ⚠️  API Error (${response.status}): ${errorText.substring(0, 200)}`);
      }
      
      return null;
    } catch (error) {
      console.log(`      ⚠️  LinkedIn search error: ${error.message}`);
      return null;
    }
  }

  /**
   * Search CoreSignal by email with name and company validation
   * BEST PRACTICE: Combine multiple fields for maximum accuracy
   */
  async searchByEmailAndName(email, fullName, company) {
    try {
      if (!email) return null;

      console.log(`      🔍 Searching by email: ${email}`);
      if (fullName) console.log(`      📝 With name: ${fullName}`);
      if (company?.name) console.log(`      🏢 With company: ${company.name}`);

      // Strategy 1: Email search - try .exact first, then match (some emails need match)
      console.log(`      🎯 Strategy 1a: Email search (.exact field)`);
      const emailExactQuery = {
        query: {
          bool: {
            should: [
              {
                term: {
                  "primary_professional_email.exact": email
                }
              },
              {
                nested: {
                  path: "professional_emails_collection",
                  query: {
                    term: {
                      "professional_emails_collection.professional_email.exact": email
                    }
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        }
      };

      let employeeId = await this.executeEmailSearch(emailExactQuery, 'email (.exact)');
      if (employeeId) {
        console.log(`      ✅ Found via: Email (.exact)`);
        return { employeeId, matchMethod: 'email (.exact)' };
      }

      // Strategy 1b: Search by Company + Name (if email not found, person might exist with different email)
      // This is more reliable than fuzzy email matching
      if (fullName && company?.name) {
        console.log(`      🎯 Strategy 1b: Company + Name (person might have different email)`);
        const companyNameQuery = {
          query: {
            bool: {
              must: [
                {
                  nested: {
                    path: "experience",
                    query: {
                      bool: {
                        must: [
                          {
                            term: {
                              "experience.active_experience": 1
                            }
                          },
                          {
                            bool: {
                              should: [
                                {
                                  match: {
                                    "experience.company_name": company.name
                                  }
                                },
                                {
                                  match_phrase: {
                                    "experience.company_name": company.name
                                  }
                                }
                              ],
                              minimum_should_match: 1
                            }
                          }
                        ]
                      }
                    }
                  }
                },
                {
                  bool: {
                    should: [
                      {
                        match_phrase: {
                          "full_name": fullName
                        }
                      },
                      {
                        match: {
                          "full_name": fullName
                        }
                      }
                    ],
                    minimum_should_match: 1
                  }
                }
              ]
            }
          }
        };

        employeeId = await this.executeEmailSearch(companyNameQuery, 'company + name');
        if (employeeId) {
          console.log(`      ✅ Found via: Company + Name (will validate email)`);
          return { employeeId, matchMethod: 'company + name' };
        }
      }

      // Strategy 2: Email + Name (if name available)
      if (fullName) {
        console.log(`      🎯 Strategy 2: Email + Name`);
        const emailNameQuery = {
          query: {
            bool: {
              must: [
                {
                  bool: {
                    should: [
                      {
                        term: {
                          "primary_professional_email.exact": email
                        }
                      },
                      {
                        nested: {
                          path: "professional_emails_collection",
                          query: {
                            term: {
                              "professional_emails_collection.professional_email.exact": email
                            }
                          }
                        }
                      }
                    ],
                    minimum_should_match: 1
                  }
                },
                {
                  bool: {
                    should: [
                      {
                        match_phrase: {
                          "full_name": fullName
                        }
                      },
                      {
                        match: {
                          "full_name": fullName
                        }
                      }
                    ],
                    minimum_should_match: 1
                  }
                }
              ]
            }
          }
        };

        employeeId = await this.executeEmailSearch(emailNameQuery, 'email + name');
        if (employeeId) {
          console.log(`      ✅ Found via: Email + Name`);
          return { employeeId, matchMethod: 'email + name' };
        }
      }

      // Strategy 3: Professional emails collection (nested field - exact match)
      // NOTE: This nested query may return false positives, so we validate the email is in the profile
      const collectionEmailQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: "professional_emails_collection",
                  query: {
                    term: {
                      "professional_emails_collection.professional_email.exact": email
                    }
                  }
                }
              }
            ]
          }
        }
      };

      employeeId = await this.executeEmailSearch(collectionEmailQuery, 'email collection');
      if (employeeId) {
        console.log(`      ⚠️  Found via: Email collection - will validate email is in profile`);
        return { employeeId, matchMethod: 'email collection' };
      }

      return null;

    } catch (error) {
      console.log(`      ⚠️  Email search error: ${error.message}`);
      return null;
    }
  }

  /**
   * Execute email search query and extract employee ID
   */
  async executeEmailSearch(query, strategy) {
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.coresignalApiKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });

      this.stats.creditsUsed.search += 1;

      if (response.ok) {
        const data = await response.json();
        
      // Only log if we get results or errors (reduce noise)
      if (Array.isArray(data) && data.length > 0) {
        console.log(`      📊 Found ${data.length} result(s)`);
      } else if (!response.ok) {
        const errorText = await response.text();
        console.log(`      ⚠️  API Error (${response.status}): ${errorText.substring(0, 200)}`);
      }
        
        // CoreSignal API returns array of employee IDs (numbers) or array of objects with 'id' field
        // Format: [150070946, 262854176, ...] OR [{ id: 123, full_name: "...", ... }, ...]
        if (Array.isArray(data) && data.length > 0) {
          // If first element is a number, it's an array of IDs
          if (typeof data[0] === 'number') {
            const employeeId = data[0];
            console.log(`      ✅ Extracted employee ID (number array): ${employeeId}`);
            return employeeId;
          }
          // Otherwise it's an array of objects
          const employeeId = data[0].id || data[0];
          console.log(`      ✅ Extracted employee ID (object array): ${employeeId}`);
          return employeeId;
        }
        
        // Fallback: Handle wrapped response structure (if API changes)
        if (data.hits?.hits?.length > 0) {
          const firstHit = data.hits.hits[0];
          const employeeId = firstHit._source?.id || firstHit.id || firstHit._id;
          console.log(`      ✅ Extracted employee ID (hits format): ${employeeId}`);
          return employeeId;
        }
        
        // Fallback: Direct object with id field
        if (data.id) {
          console.log(`      ✅ Extracted employee ID (direct): ${data.id}`);
          return data.id;
        }
        
        console.log(`      ⚠️  No employee ID found in response structure`);
      } else {
        // Log all non-200 responses to see what's happening
        const errorText = await response.text();
        console.log(`      ⚠️  API Error (${response.status}) for ${strategy}: ${errorText.substring(0, 500)}`);
      }
      
      return null;
    } catch (error) {
      console.log(`      ⚠️  ${strategy} search error: ${error.message}`);
      return null;
    }
  }

  /**
   * Collect employee profile from CoreSignal
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

      this.stats.creditsUsed.collect += 1;

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
   * Validate exact match before updating
   * CRITICAL: Only enrich if we're certain it's the exact person
   * Requires: LinkedIn OR Email match, plus Name match, plus Company match
   */
  validateExactMatch(person, profileData, matchMethod) {
    const validation = {
      isValid: true,
      reason: null,
      confidence: 'high',
      matchedFields: []
    };

    const personEmail = person.email || person.workEmail || person.personalEmail;

    // 1. LinkedIn URL validation (CRITICAL - must match if person has LinkedIn)
    if (person.linkedinUrl) {
      if (!profileData.linkedin_url) {
        validation.isValid = false;
        validation.reason = `Person has LinkedIn but CoreSignal profile missing linkedin_url`;
        return validation;
      }
      if (person.linkedinUrl === profileData.linkedin_url) {
        validation.matchedFields.push('linkedin_url');
      } else {
        validation.isValid = false;
        validation.reason = `LinkedIn URL mismatch: Person="${person.linkedinUrl}" vs CoreSignal="${profileData.linkedin_url}"`;
        return validation;
      }
    }

    // 2. Email validation (CRITICAL - must match if person has email AND we searched by email)
    // BUT: If we found via company+name, email may differ (that's OK - we'll validate name/company)
    if (personEmail && matchMethod !== 'company + name') {
      const coresignalEmail = profileData.primary_professional_email;
      const coresignalEmails = profileData.professional_emails_collection || [];
      
      // Check primary email
      let emailMatches = false;
      if (coresignalEmail && personEmail.toLowerCase() === coresignalEmail.toLowerCase()) {
        emailMatches = true;
        validation.matchedFields.push('email');
      }
      
      // Check email collection
      if (!emailMatches && coresignalEmails.length > 0) {
        for (const emailObj of coresignalEmails) {
          if (emailObj.professional_email && 
              personEmail.toLowerCase() === emailObj.professional_email.toLowerCase()) {
            emailMatches = true;
            validation.matchedFields.push('email');
            break;
          }
        }
      }
      
      // If person has email but CoreSignal doesn't match, reject (unless found via company+name)
      if (!emailMatches) {
        validation.isValid = false;
        validation.reason = `Email mismatch: Person="${personEmail}" vs CoreSignal="${coresignalEmail || 'no email found'}"`;
        return validation;
      }
    } else if (personEmail && matchMethod === 'company + name') {
      // Found via company+name - email may differ, but check if it matches anyway (bonus)
      const coresignalEmail = profileData.primary_professional_email;
      const coresignalEmails = profileData.professional_emails_collection || [];
      
      if (coresignalEmail && personEmail.toLowerCase() === coresignalEmail.toLowerCase()) {
        validation.matchedFields.push('email');
      } else if (coresignalEmails.length > 0) {
        for (const emailObj of coresignalEmails) {
          if (emailObj.professional_email && 
              personEmail.toLowerCase() === emailObj.professional_email.toLowerCase()) {
            validation.matchedFields.push('email');
            break;
          }
        }
      }
      // Don't reject if email doesn't match - we found via company+name, so name/company validation is what matters
    }

    // 3. Name validation (MUST match - high similarity required)
    if (!profileData.full_name) {
      validation.isValid = false;
      validation.reason = `CoreSignal profile missing full_name`;
      return validation;
    }
    
    if (person.fullName) {
      const nameSimilarity = this.calculateNameSimilarity(profileData.full_name, person.fullName);
      if (nameSimilarity >= 0.85) {
        validation.matchedFields.push('name');
      } else {
        validation.isValid = false;
        validation.reason = `Name mismatch: Person="${person.fullName}" vs CoreSignal="${profileData.full_name}" (similarity: ${Math.round(nameSimilarity * 100)}%)`;
        return validation;
      }
    }

    // 4. Company validation (if we have company context - check active experience)
    if (person.company?.name || person.company?.linkedinUrl) {
      const activeExperience = profileData.experience?.find(exp => exp.active_experience === 1);
      
      if (activeExperience) {
        let companyMatches = false;
        
        // Check company LinkedIn URL match (most reliable)
        if (person.company?.linkedinUrl && activeExperience.company_linkedin_url) {
          if (person.company.linkedinUrl === activeExperience.company_linkedin_url) {
            companyMatches = true;
            validation.matchedFields.push('company');
          }
        }
        
        // Check company name match
        if (!companyMatches && person.company?.name && activeExperience.company_name) {
          const companySimilarity = this.calculateCompanySimilarity(
            activeExperience.company_name,
            person.company.name
          );
          if (companySimilarity >= 0.7) {
            companyMatches = true;
            validation.matchedFields.push('company');
          }
        }
        
        // If we have company info but it doesn't match, this is suspicious
        if (!companyMatches) {
          console.log(`      ⚠️  Company mismatch: Person="${person.company?.name || person.company?.linkedinUrl}" vs CoreSignal="${activeExperience.company_name || activeExperience.company_linkedin_url}"`);
          // Don't reject if LinkedIn and Email both matched - might be old company data
          if (!validation.matchedFields.includes('linkedin_url') || !validation.matchedFields.includes('email')) {
            validation.isValid = false;
            validation.reason = `Company mismatch and insufficient other matches`;
            return validation;
          }
        }
      } else {
        console.log(`      ⚠️  No active experience found in CoreSignal profile`);
      }
    }

    // 5. Final validation: Must have LinkedIn OR Email match (at least one)
    if (!validation.matchedFields.includes('linkedin_url') && !validation.matchedFields.includes('email')) {
      validation.isValid = false;
      validation.reason = `No LinkedIn or Email match - cannot confirm exact person`;
      return validation;
    }

    // 6. Confidence scoring
    const requiredMatches = ['name'];
    const hasAllRequired = requiredMatches.every(field => validation.matchedFields.includes(field));
    
    if (!hasAllRequired) {
      validation.isValid = false;
      validation.reason = `Missing required match: name`;
      return validation;
    }

    validation.confidence = validation.matchedFields.length >= 4 ? 'very_high' :
                           validation.matchedFields.length >= 3 ? 'high' : 
                           validation.matchedFields.length >= 2 ? 'medium' : 'low';

    return validation;
  }

  /**
   * Calculate name similarity
   */
  calculateNameSimilarity(name1, name2) {
    const normalize = (name) => name.toLowerCase().trim().replace(/[^a-z\s]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1.0;
    
    // Split into words
    const words1 = n1.split(/\s+/).filter(w => w.length > 0);
    const words2 = n2.split(/\s+/).filter(w => w.length > 0);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Count matching words
    let matches = 0;
    const used = new Set();
    
    for (const word1 of words1) {
      for (let i = 0; i < words2.length; i++) {
        if (!used.has(i) && (word1 === words2[i] || word1.includes(words2[i]) || words2[i].includes(word1))) {
          matches++;
          used.add(i);
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Calculate company similarity
   */
  calculateCompanySimilarity(company1, company2) {
    const normalize = (name) => name.toLowerCase().trim().replace(/[^a-z\s]/g, '');
    const c1 = normalize(company1);
    const c2 = normalize(company2);
    
    if (c1 === c2) return 1.0;
    
    // Check if one contains the other
    if (c1.includes(c2) || c2.includes(c1)) return 0.9;
    
    // Split into words
    const words1 = c1.split(/\s+/).filter(w => w.length > 1);
    const words2 = c2.split(/\s+/).filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Count matching words
    let matches = 0;
    const used = new Set();
    
    for (const word1 of words1) {
      for (let i = 0; i < words2.length; i++) {
        if (!used.has(i) && word1 === words2[i]) {
          matches++;
          used.add(i);
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Update person record with CoreSignal data
   * Preserves existing good data
   */
  async updatePersonWithCoreSignalData(person, employeeId, profileData, validation) {
    try {
      // Extract key data from CoreSignal profile
      const updateData = {
        // Preserve existing data, only update if missing
        email: person.email || profileData.primary_professional_email || null,
        workEmail: person.workEmail || profileData.primary_professional_email || null,
        
        // Update job title if we have better data
        jobTitle: profileData.active_experience_title || person.jobTitle,
        title: profileData.active_experience_title || person.title,
        
        // Update LinkedIn if missing
        linkedinUrl: person.linkedinUrl || profileData.linkedin_url || null,
        
        // Update location if missing
        address: person.address || profileData.location_full || null,
        
        // Update bio if missing
        bio: person.bio || profileData.summary || null,
        
        // Store CoreSignal data
        coresignalData: profileData,
        
        // Update custom fields
        customFields: {
          ...(person.customFields || {}),
          coresignal: {
            employeeId: employeeId,
            enrichedAt: new Date().toISOString(),
            matchMethod: validation.matchedFields.join(','),
            confidence: validation.confidence,
            skills: profileData.inferred_skills || [],
            experience: profileData.experience || [],
            education: profileData.education || [],
            connectionsCount: profileData.connections_count,
            followersCount: profileData.followers_count,
            isDecisionMaker: profileData.is_decision_maker,
            totalExperienceMonths: profileData.total_experience_duration_months
          }
        },
        
        // Mark as enriched
        lastEnriched: new Date(),
        dataLastVerified: new Date()
      };

      // Update the person record
      await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
    } catch (error) {
      console.log(`      ❌ Database update error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delay function for rate limiting
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the enrichment process
async function main() {
  // Check for limit argument (for testing)
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
  
  const enricher = new EnrichTOPOriginalPeopleCoreSignal({ limit });
  await enricher.enrichOriginalPeople();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichTOPOriginalPeopleCoreSignal;

