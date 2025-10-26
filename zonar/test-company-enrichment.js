#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CompanyEnrichmentTester {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  }

  async testCompanyEnrichment() {
    try {
      console.log('🏢 Testing Company Enrichment for Notary Everyday workspace...\n');
      
      // Get a few companies to test
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
          linkedinUrl: true,
          industry: true
        },
        take: 3
      });

      console.log(`📊 Found ${companies.length} companies to test:`);
      companies.forEach((company, i) => {
        console.log(`   ${i + 1}. ${company.name} - ${company.website}`);
      });
      console.log('');

      for (const company of companies) {
        console.log(`🔍 Testing: ${company.name} (${company.website})`);
        
        try {
          // Build search query
          const searchQuery = this.buildSearchQuery(company);
          
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
            console.log(`   ❌ Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
            continue;
          }

          const searchData = await searchResponse.json();
          let companyIds = [];
          
          if (Array.isArray(searchData)) {
            companyIds = searchData;
          } else if (searchData.hits?.hits) {
            companyIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
          } else if (searchData.hits) {
            companyIds = searchData.hits;
          }

          console.log(`   📋 Found ${companyIds.length} potential matches`);

          if (companyIds.length === 0) {
            console.log(`   ⚠️ No matches found - likely not in Coresignal database`);
            continue;
          }

          // Test the first few matches
          let bestMatch = null;
          let bestConfidence = 0;

          for (let i = 0; i < Math.min(3, companyIds.length); i++) {
            const coresignalCompanyId = companyIds[i];
            console.log(`   🔍 Testing match ${i + 1}: ${coresignalCompanyId}`);

            try {
              const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${coresignalCompanyId}`, {
                headers: { 
                  'apikey': this.apiKey,
                  'Accept': 'application/json'
                }
              });

              if (!collectResponse.ok) {
                console.log(`     ❌ Collect failed: ${collectResponse.status}`);
                continue;
              }

              const profileData = await collectResponse.json();
              const matchResult = this.calculateCompanyMatchConfidence(company, profileData);
              
              console.log(`     📊 Match confidence: ${matchResult.confidence}%`);
              console.log(`     📊 Coresignal domain: ${this.extractDomain(profileData.website)}`);
              console.log(`     📊 Our domain: ${this.extractDomain(company.website)}`);

              if (matchResult.confidence > bestConfidence) {
                bestConfidence = matchResult.confidence;
                bestMatch = {
                  coresignalCompanyId,
                  profileData,
                  matchResult
                };
              }

            } catch (error) {
              console.log(`     ❌ Error collecting profile: ${error.message}`);
              continue;
            }
          }

          if (bestMatch && bestConfidence >= 90) {
            console.log(`   ✅ EXACT MATCH FOUND! Confidence: ${bestConfidence}%`);
            console.log(`   📊 Coresignal company: ${bestMatch.profileData.company_name || bestMatch.profileData.name}`);
            console.log(`   📊 Domain match: ${this.extractDomain(company.website)} = ${this.extractDomain(bestMatch.profileData.website)}`);
          } else {
            console.log(`   ⚠️ No exact match found (best: ${bestConfidence}%) - likely not in Coresignal database`);
          }

        } catch (error) {
          console.log(`   ❌ Error testing ${company.name}: ${error.message}`);
        }
        
        console.log('');
      }

    } catch (error) {
      console.error('❌ Error in company enrichment test:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  buildSearchQuery(company) {
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

    const query = {
      query: {
        bool: {
          must: mustClauses,
          minimum_should_match: 0
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
    
    // Website/Domain match (100 points) - EXACT match required for companies
    const companyDomain = this.extractDomain(company.website);
    const coresignalDomain = this.extractDomain(coresignalProfile.website);
    
    if (companyDomain && coresignalDomain) {
      const domainMatch = this.normalizeDomain(companyDomain) === this.normalizeDomain(coresignalDomain);
      score += domainMatch ? 100 : 0;
      factors.push({ factor: 'domain', score: domainMatch ? 100 : 0, weight: 1.0 });
    }
    
    // If no exact domain match, this is not the right company
    if (score === 0) {
      return { 
        confidence: 0, 
        factors, 
        reasoning: `No exact domain match: ${companyDomain} vs ${coresignalDomain}` 
      };
    }
    
    return { 
      confidence: Math.min(100, score), 
      factors, 
      reasoning: `Exact domain match: ${companyDomain} = ${coresignalDomain}` 
    };
  }

  normalizeDomain(domain) {
    if (!domain) return '';
    return domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
  }
}

// Run the test
const tester = new CompanyEnrichmentTester();
tester.testCompanyEnrichment().catch(console.error);
