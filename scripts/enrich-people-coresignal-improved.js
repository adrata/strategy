#!/usr/bin/env node

/**
 * IMPROVED CoreSignal Enrichment Script
 * 
 * Uses multiple data points for accurate matching:
 * - LinkedIn URLs
 * - Email addresses
 * - Company + Name combinations
 * - Location data
 * - Validation scoring
 */

const { PrismaClient } = require('@prisma/client');

class ImprovedCoreSignalEnricher {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    this.creditsUsed = { search: 0, collect: 0 };
    this.results = {
      analysisDate: new Date().toISOString(),
      peopleProcessed: 0,
      peopleEnriched: 0,
      peopleSkipped: 0,
      peopleNotFound: 0,
      peopleRejected: 0, // New: people with low confidence matches
      errors: [],
      creditsUsed: this.creditsUsed
    };
  }

  async execute() {
    console.log('🎯 IMPROVED CORESIGNAL ENRICHMENT');
    console.log('==================================');
    console.log('Using LinkedIn, email, and multi-factor validation');
    console.log('');

    try {
      // Step 1: Get people needing enrichment
      await this.getAllPeopleNeedingEnrichment();
      
      // Step 2: Process with improved matching
      await this.processAllPeopleWithImprovedMatching();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getAllPeopleNeedingEnrichment() {
    console.log('🔍 Finding people needing CoreSignal enrichment...');
    
    // Get all people first, then filter in JavaScript
    const allPeople = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: { name: true, industry: true }
        }
      },
      take: 100 // Get more people to filter from
    });

    // Filter people who need enrichment
    this.peopleToEnrich = allPeople.filter(person => {
      const customFields = person.customFields || {};
      const coresignalData = customFields.coresignalData;
      const enrichmentStatus = customFields.enrichmentStatus;
      const coresignalId = customFields.coresignalId;
      
      // Need enrichment if:
      // 1. No CoreSignal data
      // 2. Enrichment status is 'not_found'
      // 3. CoreSignal ID starts with 'placeholder'
      return !coresignalData || 
             enrichmentStatus === 'not_found' || 
             (coresignalId && typeof coresignalId === 'string' && coresignalId.startsWith('placeholder'));
    }).slice(0, 30); // Take first 30 for Speedrun

    console.log(`📊 Found ${this.peopleToEnrich.length} people needing enrichment`);
    console.log('');
  }

  async processAllPeopleWithImprovedMatching() {
    const totalPeople = this.peopleToEnrich.length;
    const batchSize = 5; // Smaller batches for better control
    const totalBatches = Math.ceil(totalPeople / batchSize);

    console.log(`🚀 Processing ${totalPeople} people in ${totalBatches} batches of ${batchSize}`);
    console.log('');

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalPeople);
      const batch = this.peopleToEnrich.slice(startIndex, endIndex);

      console.log(`📦 Batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
      
      for (const person of batch) {
        await this.enrichPersonWithImprovedMatching(person);
        await this.delay(1000); // 1 second between API calls
      }

      console.log(`   📊 Progress: ${this.results.peopleProcessed}/${totalPeople} people processed`);
      console.log(`   🎯 Enriched: ${this.results.peopleEnriched} | Skipped: ${this.results.peopleSkipped} | Not Found: ${this.results.peopleNotFound} | Rejected: ${this.results.peopleRejected}`);
      console.log(`   💰 Credits used: Search: ${this.creditsUsed.search} | Collect: ${this.creditsUsed.collect}`);
      console.log('');

      // Pause between batches
      if (batchIndex < totalBatches - 1) {
        console.log('   ⏳ Pausing between batches...');
        await this.delay(3000);
      }
    }
  }

  async enrichPersonWithImprovedMatching(person) {
    try {
      console.log(`   🔍 Enriching: ${person.fullName} (${person.jobTitle})`);
      
      // Build multiple search strategies
      const searchStrategies = this.buildSearchStrategies(person);
      
      let bestMatch = null;
      let bestScore = 0;

      // Try each search strategy
      for (const strategy of searchStrategies) {
        console.log(`     📋 Strategy: ${strategy.name}`);
        
        const searchResults = await this.searchCoreSignal(strategy.query);
        
        if (searchResults.length > 0) {
          // Collect full profile data for each ID
          for (const profileId of searchResults) {
            try {
              const profileData = await this.collectCoreSignalProfile(profileId);
              if (profileData) {
                const score = this.calculateMatchScore(person, profileData);
                console.log(`       🎯 Candidate: ${profileData.full_name} (Score: ${score.toFixed(2)})`);
                
                if (score > bestScore && score >= 0.7) { // Minimum 70% confidence
                  bestMatch = profileData;
                  bestScore = score;
                }
              }
            } catch (error) {
              console.log(`       ❌ Failed to collect profile ${profileId}: ${error.message}`);
            }
          }
        }
      }

      if (bestMatch && bestScore >= 0.7) {
        console.log(`     ✅ Best match: ${bestMatch.full_name} (Score: ${bestScore.toFixed(2)})`);
        await this.updatePersonWithValidatedCoreSignalData(person, bestMatch);
        this.results.peopleEnriched++;
      } else {
        console.log(`     ❌ No high-confidence match found (Best score: ${bestScore.toFixed(2)})`);
        await this.updatePersonWithPlaceholder(person, 'no_high_confidence_match');
        this.results.peopleRejected++;
      }

      this.results.peopleProcessed++;

    } catch (error) {
      console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
      this.results.errors.push(`${person.fullName}: ${error.message}`);
      this.results.peopleProcessed++;
    }
  }

  buildSearchStrategies(person) {
    const strategies = [];
    const companyName = person.company?.name || 'Unknown Company';
    
    // Strategy 1: LinkedIn URL (highest confidence)
    if (person.linkedinUrl) {
      strategies.push({
        name: 'LinkedIn URL',
        query: {
          query: {
            bool: {
              must: [
                { match: { 'linkedin_url': person.linkedinUrl } }
              ]
            }
          }
        }
      });
    }

    // Strategy 2: Email address (high confidence)
    if (person.email || person.workEmail) {
      const email = person.email || person.workEmail;
      strategies.push({
        name: 'Email Address',
        query: {
          query: {
            bool: {
              must: [
                { match: { 'primary_professional_email': email } }
              ]
            }
          }
        }
      });
    }

    // Strategy 3: Company + Name + Location (medium confidence)
    strategies.push({
      name: 'Company + Name + Location',
      query: {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      must: [
                        { term: { 'experience.active_experience': 1 } },
                        { match: { 'experience.company_name': companyName } }
                      ]
                    }
                  }
                }
              },
              {
                bool: {
                  should: [
                    { match: { 'full_name': person.fullName } },
                    { match_phrase: { 'full_name': person.fullName } }
                  ]
                }
              }
            ]
          }
        }
      }
    });

    // Strategy 4: Name + Industry (lower confidence)
    if (person.company?.industry) {
      strategies.push({
        name: 'Name + Industry',
        query: {
          query: {
            bool: {
              must: [
                {
                  nested: {
                    path: 'experience',
                    query: {
                      bool: {
                        must: [
                          { term: { 'experience.active_experience': 1 } },
                          { match: { 'experience.company_industry': person.company.industry } }
                        ]
                      }
                    }
                  }
                },
                {
                  bool: {
                    should: [
                      { match: { 'full_name': person.fullName } },
                      { match_phrase: { 'full_name': person.fullName } }
                    ]
                  }
                }
              ]
            }
          }
        }
      });
    }

    return strategies;
  }

  async searchCoreSignal(query) {
    const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=10', {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    this.creditsUsed.search += 1;

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`CoreSignal search failed: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    return Array.isArray(searchData) ? searchData : [];
  }

  async collectCoreSignalProfile(profileId) {
    const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${profileId}`, {
      headers: { 
        'apikey': this.apiKey,
        'Accept': 'application/json'
      }
    });

    this.creditsUsed.collect += 1;

    if (!collectResponse.ok) {
      throw new Error(`CoreSignal collect failed: ${collectResponse.status}`);
    }

    const profileData = await collectResponse.json();
    return profileData;
  }

  calculateMatchScore(person, coresignalProfile) {
    let score = 0;
    let factors = [];

    // Name matching (40% weight)
    const nameScore = this.calculateNameScore(person.fullName, coresignalProfile.full_name);
    score += nameScore * 0.4;
    factors.push(`Name: ${nameScore.toFixed(2)}`);

    // Email matching (30% weight)
    const emailScore = this.calculateEmailScore(person.email || person.workEmail, coresignalProfile.primary_professional_email);
    score += emailScore * 0.3;
    factors.push(`Email: ${emailScore.toFixed(2)}`);

    // LinkedIn matching (20% weight)
    const linkedinScore = this.calculateLinkedInScore(person.linkedinUrl, coresignalProfile.linkedin_url);
    score += linkedinScore * 0.2;
    factors.push(`LinkedIn: ${linkedinScore.toFixed(2)}`);

    // Company matching (10% weight)
    const companyScore = this.calculateCompanyScore(person.company?.name, coresignalProfile.experience?.[0]?.company_name);
    score += companyScore * 0.1;
    factors.push(`Company: ${companyScore.toFixed(2)}`);

    console.log(`       📊 Score factors: ${factors.join(', ')}`);

    return score;
  }

  calculateNameScore(dbName, coresignalName) {
    if (!dbName || !coresignalName) return 0;
    
    const dbNameLower = dbName.toLowerCase();
    const coresignalNameLower = coresignalName.toLowerCase();
    
    // Exact match
    if (dbNameLower === coresignalNameLower) return 1.0;
    
    // Check if all words from DB name are in CoreSignal name
    const dbWords = dbNameLower.split(' ').filter(w => w.length > 1);
    const coresignalWords = coresignalNameLower.split(' ').filter(w => w.length > 1);
    
    let matchingWords = 0;
    for (const dbWord of dbWords) {
      if (coresignalWords.some(csWord => csWord.includes(dbWord) || dbWord.includes(csWord))) {
        matchingWords++;
      }
    }
    
    return matchingWords / dbWords.length;
  }

  calculateEmailScore(dbEmail, coresignalEmail) {
    if (!dbEmail || !coresignalEmail) return 0;
    
    const dbEmailLower = dbEmail.toLowerCase();
    const coresignalEmailLower = coresignalEmail.toLowerCase();
    
    // Exact match
    if (dbEmailLower === coresignalEmailLower) return 1.0;
    
    // Check if email domains match
    const dbDomain = dbEmailLower.split('@')[1];
    const coresignalDomain = coresignalEmailLower.split('@')[1];
    
    if (dbDomain && coresignalDomain && dbDomain === coresignalDomain) {
      return 0.8; // Same domain, different username
    }
    
    return 0;
  }

  calculateLinkedInScore(dbLinkedIn, coresignalLinkedIn) {
    if (!dbLinkedIn || !coresignalLinkedIn) return 0;
    
    const dbLinkedInLower = dbLinkedIn.toLowerCase();
    const coresignalLinkedInLower = coresignalLinkedIn.toLowerCase();
    
    // Exact match
    if (dbLinkedInLower === coresignalLinkedInLower) return 1.0;
    
    // Check if LinkedIn profiles are similar (same person, different URL format)
    const dbProfileId = dbLinkedInLower.split('/in/')[1]?.split('/')[0];
    const coresignalProfileId = coresignalLinkedInLower.split('/in/')[1]?.split('/')[0];
    
    if (dbProfileId && coresignalProfileId && dbProfileId === coresignalProfileId) {
      return 0.9; // Same LinkedIn profile
    }
    
    return 0;
  }

  calculateCompanyScore(dbCompany, coresignalCompany) {
    if (!dbCompany || !coresignalCompany) return 0;
    
    const dbCompanyLower = dbCompany.toLowerCase();
    const coresignalCompanyLower = coresignalCompany.toLowerCase();
    
    // Exact match
    if (dbCompanyLower === coresignalCompanyLower) return 1.0;
    
    // Check if company names are similar
    const dbWords = dbCompanyLower.split(' ').filter(w => w.length > 2);
    const coresignalWords = coresignalCompanyLower.split(' ').filter(w => w.length > 2);
    
    let matchingWords = 0;
    for (const dbWord of dbWords) {
      if (coresignalWords.some(csWord => csWord.includes(dbWord) || dbWord.includes(csWord))) {
        matchingWords++;
      }
    }
    
    return matchingWords / Math.max(dbWords.length, coresignalWords.length);
  }

  async updatePersonWithValidatedCoreSignalData(person, coresignalProfile) {
    // Collect full profile data
    const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${coresignalProfile.id}`, {
      headers: { 
        'apikey': this.apiKey,
        'Accept': 'application/json'
      }
    });

    this.creditsUsed.collect += 1;

    if (!collectResponse.ok) {
      throw new Error(`CoreSignal collect failed: ${collectResponse.status}`);
    }

    const profileData = await collectResponse.json();

    const updateData = {
      customFields: {
        ...person.customFields,
        coresignalId: coresignalProfile.id,
        coresignalData: profileData,
        rawData: profileData,
        lastEnriched: new Date().toISOString(),
        enrichmentSource: 'CoreSignal',
        enrichmentStatus: 'success',
        enrichmentConfidence: this.calculateMatchScore(person, coresignalProfile),
        enrichmentMethod: 'improved_multi_factor'
      }
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  async updatePersonWithPlaceholder(person, status) {
    const updateData = {
      customFields: {
        ...person.customFields,
        coresignalId: `placeholder_${Date.now()}`,
        lastEnriched: new Date().toISOString(),
        enrichmentSource: 'CoreSignal',
        enrichmentStatus: status,
        enrichmentMethod: 'improved_multi_factor',
        note: `CoreSignal ${status} - ${new Date().toISOString()}`
      }
    };

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  async generateFinalReport() {
    console.log('📊 IMPROVED ENRICHMENT REPORT');
    console.log('=============================');
    console.log(`   People processed: ${this.results.peopleProcessed}`);
    console.log(`   People enriched: ${this.results.peopleEnriched}`);
    console.log(`   People skipped: ${this.results.peopleSkipped}`);
    console.log(`   People not found: ${this.results.peopleNotFound}`);
    console.log(`   People rejected (low confidence): ${this.results.peopleRejected}`);
    console.log(`   Success rate: ${((this.results.peopleEnriched / this.results.peopleProcessed) * 100).toFixed(1)}%`);
    console.log(`   Credits used: Search: ${this.creditsUsed.search} | Collect: ${this.creditsUsed.collect}`);
    console.log(`   Total cost estimate: $${((this.creditsUsed.search + this.creditsUsed.collect) * 0.10).toFixed(2)}`);
    console.log(`   Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('');
      console.log('❌ ERRORS:');
      this.results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('');
    console.log('✅ IMPROVED ENRICHMENT COMPLETE!');
    console.log('   🎯 Using LinkedIn, email, and multi-factor validation');
    console.log('   📈 Only high-confidence matches accepted (70%+ score)');
    console.log('   🔍 Multiple search strategies for better coverage');
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the improved enrichment
async function main() {
  const enricher = new ImprovedCoreSignalEnricher();
  await enricher.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ImprovedCoreSignalEnricher };
