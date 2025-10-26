#!/usr/bin/env node

/**
 * Zonar People Enrichment Script
 * 
 * This script checks if people in the Notary Everyday workspace are enriched
 * with Coresignal data and attempts to enrich unenriched people.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class ZonarPeopleEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 10;
    this.delayBetweenBatches = 2000; // 2 seconds
    
    this.results = {
      totalPeople: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
      creditsUsed: {
        search: 0,
        collect: 0
      }
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Zonar People Enrichment for Notary Everyday workspace...\n');
      
      // Get all people in Notary Everyday workspace
      const people = await this.getPeople();
      this.results.totalPeople = people.length;
      
      console.log(`📊 Found ${people.length} people in Notary Everyday workspace`);
      
      if (people.length === 0) {
        console.log('❌ No people found to process');
        return;
      }

      // Process people in batches
      await this.processPeopleInBatches(people);
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in people enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            linkedinUrl: true,
            website: true,
            domain: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async processPeopleInBatches(people) {
    const totalBatches = Math.ceil(people.length / this.batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, people.length);
      const batch = people.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          await this.processPerson(person);
        } catch (error) {
          console.error(`   ❌ Error processing ${person.fullName}:`, error.message);
          this.results.failedEnrichment++;
        }
      }
      
      // Delay between batches to respect rate limits
      if (batchIndex < totalBatches - 1) {
        console.log(`   ⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`);
        await this.delay(this.delayBetweenBatches);
      }
    }
  }

  async processPerson(person) {
    console.log(`   🔍 Processing: ${person.fullName} at ${person.company?.name || 'Unknown Company'}`);
    
    // Check if person is already enriched
    if (this.isPersonEnriched(person)) {
      console.log(`   ✅ Already enriched: ${person.fullName}`);
      this.results.alreadyEnriched++;
      return;
    }
    
    // Attempt to enrich person
    await this.enrichPerson(person);
  }

  isPersonEnriched(person) {
    // Check if person has Coresignal data in customFields
    if (person.customFields && typeof person.customFields === 'object') {
      const customFields = person.customFields;
      if (customFields.coresignalId || customFields.coresignalData || customFields.lastEnrichedAt) {
        return true;
      }
    }
    
    // Check if person has enriched data in specific fields
    if (person.bio && person.bio.length > 100) {
      return true; // Likely enriched if bio is substantial
    }
    
    return false;
  }

  async enrichPerson(person) {
    try {
      // Build search query for Coresignal
      const searchQuery = this.buildSearchQuery(person);
      
      // Search for person in Coresignal
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.results.creditsUsed.search++;

      if (!searchResponse.ok) {
        throw new Error(`Coresignal search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      
      // Handle different response formats
      let employeeIds = [];
      if (Array.isArray(searchData)) {
        employeeIds = searchData;
      } else if (searchData.hits?.hits) {
        employeeIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (searchData.hits) {
        employeeIds = searchData.hits;
      }

      if (employeeIds.length === 0) {
        console.log(`   ⚠️ No Coresignal data found for ${person.fullName}`);
        this.results.failedEnrichment++;
        return;
      }

      // Get profiles for all matches and calculate confidence scores
      let bestMatch = null;
      let bestConfidence = 0;
      
      for (const employeeId of employeeIds.slice(0, 3)) { // Check top 3 matches
        try {
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
            headers: { 
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          this.results.creditsUsed.collect++;

          if (!collectResponse.ok) {
            console.log(`   ⚠️ Failed to collect profile ${employeeId}: ${collectResponse.status}`);
            continue;
          }

          const profileData = await collectResponse.json();
          
          // Calculate match confidence
          const matchResult = this.calculatePersonMatchConfidence(person, profileData);
          
          console.log(`   🔍 Match confidence for ${employeeId}: ${matchResult.confidence}%`);
          console.log(`   📊 Match factors:`, matchResult.factors);
          
          if (matchResult.confidence > bestConfidence) {
            bestConfidence = matchResult.confidence;
            bestMatch = { employeeId, profileData, matchResult };
          }
          
        } catch (error) {
          console.log(`   ⚠️ Error collecting profile ${employeeId}:`, error.message);
          continue;
        }
      }

      // Only proceed if we have a high-confidence match
      if (!bestMatch || bestConfidence < 80) {
        console.log(`   ❌ No high-confidence match found for ${person.fullName} (best: ${bestConfidence}%)`);
        this.results.failedEnrichment++;
        return;
      }

      // Update person with Coresignal data including match confidence
      await this.updatePersonWithCoresignalData(person, bestMatch.employeeId, bestMatch.profileData, bestMatch.matchResult);
      
      console.log(`   ✅ Enriched: ${person.fullName} (Coresignal ID: ${bestMatch.employeeId}, Confidence: ${bestConfidence}%)`);
      this.results.successfullyEnriched++;

    } catch (error) {
      console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
      this.results.failedEnrichment++;
    }
  }

  buildSearchQuery(person) {
    const query = {
      query: {
        bool: {
          must: []
        }
      }
    };

    // Add company experience filter if company has LinkedIn URL
    if (person.company?.linkedinUrl) {
      query.query.bool.must.push({
        nested: {
          path: 'experience',
          query: {
            bool: {
              must: [
                {
                  match: {
                    'experience.company_linkedin_url': person.company.linkedinUrl
                  }
                },
                {
                  term: {
                    'experience.active_experience': 1
                  }
                }
              ]
            }
          }
        }
      });
    }

    // Add person name matching
    query.query.bool.must.push({
      bool: {
        should: [
          { match: { 'full_name': person.fullName } },
          { match_phrase: { 'full_name': person.fullName } },
          { match: { 'member_full_name': person.fullName } },
          { match_phrase: { 'member_full_name': person.fullName } }
        ]
      }
    });

    return query;
  }

  async updatePersonWithCoresignalData(person, coresignalId, profileData, matchResult) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal',
      matchConfidence: matchResult.confidence,
      matchFactors: matchResult.factors,
      matchReasoning: matchResult.reasoning
    };

    // Calculate data quality score
    const qualityScore = this.calculateDataQualityScore(person, profileData);

    await this.prisma.people.update({
      where: { id: person.id },
      data: {
        customFields: {
          ...(person.customFields || {}),
          ...enrichedData
        },
        // Update bio if available in Coresignal data
        bio: profileData.summary || person.bio,
        // Update LinkedIn URL if more complete
        linkedinUrl: profileData.linkedin_url || person.linkedinUrl,
        // Update quality metrics
        dataQualityScore: qualityScore,
        enrichmentSources: ['coresignal'],
        enrichmentVersion: '1.0',
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });
  }

  calculateDataQualityScore(person, profileData) {
    let score = 0;
    let maxScore = 0;

    // Core fields (40 points)
    maxScore += 40;
    if (person.fullName) score += 10;
    if (person.email) score += 10;
    if (person.phone) score += 10;
    if (person.linkedinUrl || profileData.linkedin_url) score += 10;

    // Coresignal data (40 points)
    maxScore += 40;
    if (profileData.summary) score += 10;
    if (profileData.skills && profileData.skills.length > 0) score += 10;
    if (profileData.experience && profileData.experience.length > 0) score += 10;
    if (profileData.education && profileData.education.length > 0) score += 10;

    // Professional data (20 points)
    maxScore += 20;
    if (person.jobTitle || person.title) score += 10;
    if (profileData.total_experience || person.totalExperience) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  calculatePersonMatchConfidence(person, coresignalProfile) {
    let score = 0;
    let factors = [];
    
    // Name match (40 points)
    const nameScore = this.calculateNameSimilarity(person.fullName, coresignalProfile.full_name);
    score += nameScore * 0.4;
    factors.push({ factor: 'name', score: nameScore, weight: 0.4 });
    
    // Company match (30 points)
    if (person.company?.linkedinUrl && coresignalProfile.current_company_linkedin_url) {
      const companyMatch = person.company.linkedinUrl === coresignalProfile.current_company_linkedin_url;
      score += companyMatch ? 30 : 0;
      factors.push({ factor: 'company', score: companyMatch ? 100 : 0, weight: 0.3 });
    }
    
    // LinkedIn match (20 points) - highest confidence
    if (person.linkedinUrl && coresignalProfile.linkedin_url) {
      const linkedinMatch = this.normalizeLinkedInUrl(person.linkedinUrl) === 
                            this.normalizeLinkedInUrl(coresignalProfile.linkedin_url);
      score += linkedinMatch ? 20 : 0;
      factors.push({ factor: 'linkedin', score: linkedinMatch ? 100 : 0, weight: 0.2 });
    }
    
    // Title similarity (10 points)
    if (person.jobTitle && coresignalProfile.title) {
      const titleScore = this.calculateTitleSimilarity(person.jobTitle, coresignalProfile.title);
      score += titleScore * 0.1;
      factors.push({ factor: 'title', score: titleScore, weight: 0.1 });
    }
    
    return { 
      confidence: Math.round(score), 
      factors, 
      reasoning: this.generateMatchReasoning(factors) 
    };
  }

  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalize = (name) => name.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 100;
    
    // Levenshtein distance
    const distance = this.levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    return Math.round(similarity);
  }

  calculateTitleSimilarity(title1, title2) {
    if (!title1 || !title2) return 0;
    
    const normalize = (title) => title.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const t1 = normalize(title1);
    const t2 = normalize(title2);
    
    if (t1 === t2) return 100;
    
    // Check for key role words
    const roleWords = ['manager', 'director', 'vp', 'vice president', 'ceo', 'cto', 'cfo', 'president', 'head', 'lead', 'senior', 'junior', 'associate'];
    const t1Words = t1.split(' ');
    const t2Words = t2.split(' ');
    
    let roleMatch = 0;
    for (const word of roleWords) {
      if (t1Words.includes(word) && t2Words.includes(word)) {
        roleMatch += 20;
      }
    }
    
    // Levenshtein distance for overall similarity
    const distance = this.levenshteinDistance(t1, t2);
    const maxLength = Math.max(t1.length, t2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    return Math.min(100, Math.round(similarity + roleMatch));
  }

  normalizeLinkedInUrl(url) {
    if (!url) return '';
    
    // Remove protocol and www
    let normalized = url.replace(/^https?:\/\/(www\.)?/, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  generateMatchReasoning(factors) {
    const reasoning = [];
    
    for (const factor of factors) {
      if (factor.score >= 80) {
        reasoning.push(`Strong ${factor.factor} match (${factor.score}%)`);
      } else if (factor.score >= 60) {
        reasoning.push(`Good ${factor.factor} match (${factor.score}%)`);
      } else if (factor.score >= 40) {
        reasoning.push(`Partial ${factor.factor} match (${factor.score}%)`);
      } else {
        reasoning.push(`Weak ${factor.factor} match (${factor.score}%)`);
      }
    }
    
    return reasoning.join(', ');
  }

  printResults() {
    console.log('\n📊 Zonar People Enrichment Results:');
    console.log('=====================================');
    console.log(`Total People: ${this.results.totalPeople}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`Credits Used - Search: ${this.results.creditsUsed.search}`);
    console.log(`Credits Used - Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Total Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the script
const enrichment = new ZonarPeopleEnrichment();
enrichment.run().catch(console.error);
