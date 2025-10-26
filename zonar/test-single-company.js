#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class SingleCompanyTester {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  }

  async testSingleCompany() {
    try {
      // Get a company with a more recognizable domain - try a few different ones
      const companies = await this.prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          website: { not: null }
        },
        select: {
          id: true,
          name: true,
          website: true,
          domain: true,
          linkedinUrl: true,
          industry: true
        },
        take: 5
      });
      
      console.log('Available companies to test:');
      companies.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name} - ${c.website}`);
      });
      
      const company = companies[0]; // Use the first one

      if (!company) {
        console.log('❌ No company with website found');
        return;
      }

      console.log(`🔍 Testing company: ${company.name}`);
      console.log(`   Website: ${company.website}`);
      console.log(`   Domain: ${company.domain}`);
      console.log(`   LinkedIn: ${company.linkedinUrl}`);
      console.log(`   Industry: ${company.industry}`);
      console.log('');

      // Build search query
      const searchQuery = this.buildSearchQuery(company);
      console.log('🔍 Search Query:');
      console.log(JSON.stringify(searchQuery, null, 2));
      console.log('');

      // Search for company in Coresignal
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Coresignal search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      console.log('📊 Search Response:');
      console.log(JSON.stringify(searchData, null, 2));
      console.log('');

      // Handle different response formats
      let companyIds = [];
      if (Array.isArray(searchData)) {
        companyIds = searchData;
      } else if (searchData.hits?.hits) {
        companyIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (searchData.hits) {
        companyIds = searchData.hits;
      }

      console.log(`📋 Found ${companyIds.length} potential matches`);

      if (companyIds.length === 0) {
        console.log('❌ No matches found');
        return;
      }

      // Test the first match
      const coresignalCompanyId = companyIds[0];
      console.log(`🔍 Testing first match: ${coresignalCompanyId}`);

      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${coresignalCompanyId}`, {
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!collectResponse.ok) {
        throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
      }

      const profileData = await collectResponse.json();
      console.log('📊 Profile Data:');
      console.log(`   Name: ${profileData.company_name || profileData.name}`);
      console.log(`   Domain: ${profileData.domain}`);
      console.log(`   Website: ${profileData.website}`);
      console.log(`   LinkedIn: ${profileData.linkedin_url}`);
      console.log(`   Industry: ${profileData.industry}`);
      console.log('');
      console.log('🔍 All available fields:');
      Object.keys(profileData).forEach(key => {
        console.log(`   ${key}: ${profileData[key]}`);
      });
      console.log('');

      // Calculate match confidence
      const matchResult = this.calculateCompanyMatchConfidence(company, profileData);
      console.log('🎯 Match Confidence:');
      console.log(`   Score: ${matchResult.confidence}%`);
      console.log(`   Factors:`, matchResult.factors);
      console.log(`   Reasoning: ${matchResult.reasoning}`);

    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  buildSearchQuery(company) {
    // For exact company matching, we should prioritize domain/website over name
    const mustClauses = [];
    
    // Website/Domain matching (REQUIRED for exact match)
    if (company.website) {
      const domain = this.extractDomain(company.website);
      if (domain) {
        mustClauses.push({
          bool: {
            should: [
              { term: { 'website': company.website } },
              { term: { 'website': `https://${company.website}` } },
              { term: { 'website': `https://www.${company.website}` } },
              { term: { 'website': `http://${company.website}` } },
              { term: { 'website': `http://www.${company.website}` } },
              { term: { 'domain': domain } },
              { term: { 'website': domain } }
            ]
          }
        });
      }
    }

    // If we have domain/website, we can be more flexible with name matching
    const shouldClauses = [];
    if (company.name) {
      shouldClauses.push(
        { match: { 'company_name': company.name } },
        { match_phrase: { 'company_name': company.name } },
        { match: { 'name': company.name } },
        { match_phrase: { 'name': company.name } }
      );
    }

    const query = {
      query: {
        bool: {
          must: mustClauses,
          should: shouldClauses,
          minimum_should_match: mustClauses.length > 0 ? 0 : 1 // If we have domain match, name is optional
        }
      }
    };

    return query;
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  calculateCompanyMatchConfidence(company, coresignalProfile) {
    let score = 0;
    let factors = [];
    
    // Website/Domain match (60 points) - highest confidence for companies
    const companyDomain = this.extractDomain(company.website);
    const coresignalDomain = this.extractDomain(coresignalProfile.website);
    
    if (companyDomain && coresignalDomain) {
      const domainMatch = this.normalizeDomain(companyDomain) === this.normalizeDomain(coresignalDomain);
      score += domainMatch ? 60 : 0;
      factors.push({ factor: 'domain', score: domainMatch ? 100 : 0, weight: 0.6 });
    }
    
    // Website URL match (40 points)
    if (company.website && coresignalProfile.website) {
      const websiteMatch = this.normalizeDomain(company.website) === this.normalizeDomain(coresignalProfile.website);
      score += websiteMatch ? 40 : 0;
      factors.push({ factor: 'website', score: websiteMatch ? 100 : 0, weight: 0.4 });
    }
    
    // Name similarity (15 points)
    const nameScore = this.calculateCompanyNameSimilarity(company.name, coresignalProfile.company_name || coresignalProfile.name);
    score += nameScore * 0.15;
    factors.push({ factor: 'name', score: nameScore, weight: 0.15 });
    
    return { 
      confidence: Math.round(score), 
      factors, 
      reasoning: `Company domain: ${companyDomain}, Coresignal domain: ${coresignalDomain}, Domain match: ${companyDomain === coresignalDomain}, Name similarity: ${nameScore}%`
    };
  }

  normalizeDomain(domain) {
    if (!domain) return '';
    return domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
  }

  calculateCompanyNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalize = (name) => name.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const norm1 = normalize(name1);
    const norm2 = normalize(name2);
    
    if (norm1 === norm2) return 100;
    
    // Simple similarity check
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    let matches = 0;
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches++;
          break;
        }
      }
    }
    
    return Math.round((matches / Math.max(words1.length, words2.length)) * 100);
  }
}

// Run the test
const tester = new SingleCompanyTester();
tester.testSingleCompany().catch(console.error);
