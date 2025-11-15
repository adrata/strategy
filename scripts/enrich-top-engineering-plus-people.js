#!/usr/bin/env node

/**
 * 🔍 ENRICH TOP ENGINEERING PLUS PEOPLE (NOT VIA BUYER GROUP PIPELINE)
 * 
 * This script enriches all people in TOP Engineering Plus that were NOT enriched
 * via the buyer group pipeline.
 * 
 * Criteria for enrichment:
 * - In TOP Engineering Plus workspace
 * - NOT enriched via buyer group pipeline (no buyerGroupRole, isBuyerGroupMember: false/null)
 * - Have email address for searching
 * - Missing CoreSignal data
 * 
 * Process:
 * 1. Search CoreSignal API using email with .exact field
 * 2. Collect full profile data using employee ID
 * 3. Save enriched data to database
 * 
 * Usage:
 *   node scripts/enrich-top-engineering-plus-people.js          # Test mode (3 people)
 *   node scripts/enrich-top-engineering-plus-people.js --all    # Run for all people
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class EnrichTOPEngineeringPlusPeople {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY?.trim().replace(/\\n/g, '');
    this.testMode = !options.all; // Default to test mode (3 people)
    this.limit = this.testMode ? 3 : null;
    
    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    this.stats = {
      totalFound: 0,
      processed: 0,
      enriched: 0,
      notFound: 0,
      errors: 0,
      skipped: 0,
      creditsUsed: {
        search: 0,
        collect: 0
      }
    };
  }

  async execute() {
    console.log('🚀 ENRICHING TOP ENGINEERING PLUS PEOPLE');
    console.log('========================================');
    console.log(`📊 Workspace ID: ${this.workspaceId}`);
    console.log(`🧪 Test Mode: ${this.testMode ? 'YES (3 people)' : 'NO (all people)'}`);
    console.log(`🔑 CoreSignal API Key: ${this.coresignalApiKey ? 'Configured' : 'Missing'}`);
    console.log('');

    try {
      // Step 1: Find people needing enrichment
      const peopleToEnrich = await this.findPeopleNeedingEnrichment();
      this.stats.totalFound = peopleToEnrich.length;

      if (peopleToEnrich.length === 0) {
        console.log('✅ No people need enrichment. All set!');
        return;
      }

      console.log(`📋 Found ${peopleToEnrich.length} people needing enrichment`);
      console.log('');

      // Step 2: Process people
      await this.processPeople(peopleToEnrich);

      // Step 3: Generate final report
      this.generateFinalReport();

    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Find people who need enrichment
   * Criteria:
   * - In TOP Engineering Plus workspace
   * - NOT enriched via buyer group pipeline (no buyerGroupRole, isBuyerGroupMember: false/null)
   * - Have email address
   * - Missing CoreSignal data
   */
  async findPeopleNeedingEnrichment() {
    console.log('🔍 Finding people needing enrichment...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        // Must have email for searching
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ],
        // NOT enriched via buyer group pipeline
        AND: [
          {
            OR: [
              { buyerGroupRole: null },
              { isBuyerGroupMember: false },
              { isBuyerGroupMember: null }
            ]
          }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    // Filter out people who already have CoreSignal data
    const peopleNeedingEnrichment = people.filter(person => {
      // Check if they have CoreSignal data in coresignalData field
      const hasCoresignalData = person.coresignalData && 
        typeof person.coresignalData === 'object' &&
        Object.keys(person.coresignalData).length > 0 &&
        person.coresignalData.id; // CoreSignal profiles have an 'id' field
      
      // Check if they have CoreSignal employeeId in customFields
      const hasCoresignalInCustomFields = person.customFields?.coresignal?.employeeId ||
        person.customFields?.coresignalId;

      // Need enrichment if missing both
      return !hasCoresignalData && !hasCoresignalInCustomFields;
    });

    console.log(`   Found ${peopleNeedingEnrichment.length} people needing enrichment`);
    console.log('');

    return peopleNeedingEnrichment;
  }

  /**
   * Process people in batches
   */
  async processPeople(people) {
    console.log('🔄 Processing people...');
    console.log('');

    const peopleToProcess = this.limit ? people.slice(0, this.limit) : people;

    for (let i = 0; i < peopleToProcess.length; i++) {
      const person = peopleToProcess[i];
      console.log(`[${i + 1}/${peopleToProcess.length}] Processing: ${person.fullName}`);
      console.log(`   Email: ${person.email || person.workEmail || person.personalEmail || 'N/A'}`);
      console.log(`   Company: ${person.company?.name || 'N/A'}`);

      try {
        await this.enrichPerson(person);
        this.stats.processed++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        this.stats.errors++;
      }

      // Rate limiting - 1 second between requests
      if (i < peopleToProcess.length - 1) {
        await this.delay(1000);
      }
      console.log('');
    }
  }

  /**
   * Enrich a single person using Search + Collect API
   */
  async enrichPerson(person) {
    const email = person.email || person.workEmail || person.personalEmail;
    
    if (!email) {
      console.log('   ⚠️  No email address - skipping');
      this.stats.skipped++;
      return;
    }

    try {
      // Step 1: Search for employee using email
      console.log(`   🔍 Searching CoreSignal for email: ${email}`);
      const employeeId = await this.searchByEmail(email);

      if (!employeeId) {
        console.log('   ⚠️  No CoreSignal match found');
        this.stats.notFound++;
        return;
      }

      console.log(`   ✅ Found employee ID: ${employeeId}`);

      // Step 2: Collect full profile data
      console.log(`   📥 Collecting full profile data...`);
      const profileData = await this.collectEmployeeProfile(employeeId);

      if (!profileData) {
        console.log('   ⚠️  No profile data returned');
        this.stats.skipped++;
        return;
      }

      // Step 3: Validate match
      const isValid = this.validateMatch(person, profileData, email);
      if (!isValid) {
        console.log('   ⚠️  Validation failed - skipping to prevent wrong data');
        this.stats.skipped++;
        return;
      }

      // Step 4: Save enriched data
      await this.saveEnrichedData(person, employeeId, profileData);
      console.log('   ✅ Successfully enriched');
      this.stats.enriched++;

    } catch (error) {
      console.error(`   ❌ Enrichment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search CoreSignal API by email using .exact field
   * Uses the exact query format provided by the user
   */
  async searchByEmail(email) {
    try {
      const searchQuery = {
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
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.coresignalApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.stats.creditsUsed.search += 1;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CoreSignal search failed: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const searchData = await response.json();

      // CoreSignal API returns array of employee IDs or objects with 'id' field
      if (Array.isArray(searchData) && searchData.length > 0) {
        // If first element is a number, it's an array of IDs
        if (typeof searchData[0] === 'number') {
          return searchData[0];
        }
        // Otherwise it's an array of objects
        return searchData[0].id || searchData[0];
      }

      // Fallback: Handle wrapped response structure
      if (searchData.hits?.hits?.length > 0) {
        const firstHit = searchData.hits.hits[0];
        return firstHit._source?.id || firstHit.id || firstHit._id;
      }

      // Fallback: Direct object with id field
      if (searchData.id) {
        return searchData.id;
      }

      return null;
    } catch (error) {
      console.error(`   ⚠️  Search error: ${error.message}`);
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CoreSignal collect failed: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`   ⚠️  Collect error: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate that the profile matches the person
   */
  validateMatch(person, profileData, searchedEmail) {
    // Check if the searched email appears in the profile
    const primaryEmail = profileData.primary_professional_email;
    const emailCollection = profileData.professional_emails_collection || [];
    
    let emailMatches = false;
    if (primaryEmail && primaryEmail.toLowerCase() === searchedEmail.toLowerCase()) {
      emailMatches = true;
    } else {
      // Check email collection
      for (const emailObj of emailCollection) {
        const collEmail = typeof emailObj === 'string' ? emailObj : (emailObj.professional_email || emailObj.email);
        if (collEmail && collEmail.toLowerCase() === searchedEmail.toLowerCase()) {
          emailMatches = true;
          break;
        }
      }
    }

    if (!emailMatches) {
      console.log('   ⚠️  Email mismatch - searched email not found in profile');
      return false;
    }

    // Check name similarity (should be high)
    if (person.fullName && profileData.full_name) {
      const nameSimilarity = this.calculateNameSimilarity(person.fullName, profileData.full_name);
      if (nameSimilarity < 0.7) {
        console.log(`   ⚠️  Name similarity too low: ${Math.round(nameSimilarity * 100)}%`);
        return false;
      }
    }

    return true;
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
   * Save enriched data to database
   * Follows the same pattern as buyer group pipeline
   */
  async saveEnrichedData(person, employeeId, profileData) {
    try {
      const updateData = {
        // Store CoreSignal data
        coresignalData: profileData,
        
        // Update custom fields with CoreSignal metadata
        customFields: {
          ...(person.customFields || {}),
          coresignal: {
            employeeId: employeeId,
            enrichedAt: new Date().toISOString(),
            enrichmentSource: 'email_search',
            enrichmentMethod: 'search_collect',
            skills: profileData.inferred_skills || [],
            experience: profileData.experience || [],
            education: profileData.education || [],
            connectionsCount: profileData.connections_count,
            followersCount: profileData.followers_count,
            isDecisionMaker: profileData.is_decision_maker,
            totalExperienceMonths: profileData.total_experience_duration_months
          }
        },
        
        // Update enrichment metadata
        lastEnriched: new Date(),
        dataLastVerified: new Date(),
        
        // Update email if we have better data
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
        bio: person.bio || profileData.summary || null
      };

      await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });

    } catch (error) {
      console.error(`   ❌ Database update error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate final report
   */
  generateFinalReport() {
    console.log('');
    console.log('='.repeat(70));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(70));
    console.log(`   Total people found: ${this.stats.totalFound}`);
    console.log(`   People processed: ${this.stats.processed}`);
    console.log(`   Successfully enriched: ${this.stats.enriched}`);
    console.log(`   Not found in CoreSignal: ${this.stats.notFound}`);
    console.log(`   Skipped (validation failed): ${this.stats.skipped}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log('');
    console.log('💰 CORESIGNAL CREDITS USED:');
    console.log(`   Search: ${this.stats.creditsUsed.search}`);
    console.log(`   Collect: ${this.stats.creditsUsed.collect}`);
    console.log(`   Total: ${this.stats.creditsUsed.search + this.stats.creditsUsed.collect}`);
    console.log('');
    
    if (this.testMode) {
      console.log('🧪 TEST MODE COMPLETE');
      console.log('   Run with --all flag to process all people');
    } else {
      console.log('✅ ENRICHMENT COMPLETE');
    }
    console.log('='.repeat(70));
  }

  /**
   * Delay function for rate limiting
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const allFlag = args.includes('--all');
  
  const enricher = new EnrichTOPEngineeringPlusPeople({ all: allFlag });
  await enricher.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichTOPEngineeringPlusPeople;

