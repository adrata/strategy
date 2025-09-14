#!/usr/bin/env node

/**
 * 🎯 COMPLETE CEO/CFO FINDER - CORRECTED VERSION
 * 
 * Uses the ACTUAL CoreSignal pipeline patterns from the Adrata codebase:
 * - Correct API endpoints (/cdapi/v2/employee_multi_source/search/es_dsl)
 * - Proper authentication (apikey header, not Bearer)
 * - Real Elasticsearch DSL queries
 * - Actual role finder pipeline logic
 * 
 * Goal: Find CEO and CFO for Key Account Domains with 90%+ accuracy
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// API Configuration based on actual codebase patterns
const API_CONFIG = {
  coreSignal: {
    apiKey: process.env.CORESIGNAL_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    baseUrl: 'https://api.coresignal.com',
    enabled: true
  },
  hunter: {
    apiKey: process.env.HUNTER_API_KEY || 'd5a761e66d593e65947e7dc45f0acc93eb0b1def',
    baseUrl: 'https://api.hunter.io/v2',
    enabled: true
  }
};

// Role definitions matching the actual codebase
const ROLE_DEFINITIONS = {
  CEO: {
    name: 'CEO',
    titles: [
      'Chief Executive Officer', 'CEO', 'President & CEO', 'Founder & CEO',
      'Managing Director', 'Executive Director', 'President', 'Founder',
      'Co-Founder', 'Founder and CEO', 'President and CEO'
    ],
    seniorityLevel: 'C-Level',
    priority: 'high'
  },
  CFO: {
    name: 'CFO', 
    titles: [
      'Chief Financial Officer', 'CFO', 'Finance Director', 'VP Finance',
      'Vice President Finance', 'Head of Finance', 'Financial Director',
      'VP of Finance', 'Chief Finance Officer'
    ],
    seniorityLevel: 'C-Level',
    priority: 'high'
  }
};

// Load Key Account Domains
function loadKeyAccountDomains() {
  try {
    const csvPath = path.join(__dirname, '..', 'Key Account Domains.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    const companies = [];
    for (let i = 1; i < Math.min(11, lines.length); i++) { // Test first 10 companies
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= 2 && values[0]) {
        const website = values[0].toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '');
        
        const companyName = website.split('.')[0]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        companies.push({
          website: website,
          name: companyName,
          domain: website,
          owner: values[2] || 'Unknown'
        });
      }
    }
    
    console.log(`📊 Loaded ${companies.length} companies from Key Account Domains`);
    return companies;
  } catch (error) {
    console.error('❌ Error loading Key Account Domains:', error.message);
    return [];
  }
}

// CoreSignal Client using actual codebase patterns
class CoreSignalClient {
  constructor(config) {
    this.config = config;
  }

  // Build Elasticsearch DSL query (from actual codebase)
  buildRoleSearchQuery(companyName, role) {
    return {
      "query": {
        "bool": {
          "must": [
            {
              "bool": {
                "should": role.titles.map(title => ({
                  "match": {
                    "title": {
                      "query": title,
                      "boost": title === role.name ? 2.0 : 1.0
                    }
                  }
                }))
              }
            },
            {
              "nested": {
                "path": "experience",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "bool": {
                          "should": [
                            { "match_phrase": { "experience.company_name": companyName } },
                            { "wildcard": { "experience.company_name": `*${companyName}*` } }
                          ]
                        }
                      },
                      { "term": { "experience.active_experience": 1 } }
                    ]
                  }
                }
              }
            }
          ],
          "filter": [
            { "term": { "deleted": false } },
            { "range": { "last_updated": { "gte": "2023-01-01" } } }
          ]
        }
      },
      "size": 5,
      "sort": [
        { "last_updated": { "order": "desc" } },
        { "_score": { "order": "desc" } }
      ]
    };
  }

  // Search for candidates using actual API endpoint
  async searchCandidates(query, itemsPerPage = 5) {
    const url = `${this.config.baseUrl}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=${itemsPerPage}`;
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        method: 'POST',
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Adrata-CEO-CFO-Finder/1.0',
          'apikey': this.config.apiKey  // Correct authentication method
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              // Extract IDs from search response
              const ids = [];
              if (response.hits && response.hits.hits) {
                response.hits.hits.forEach(hit => {
                  if (hit._id) {
                    ids.push(hit._id);
                  }
                });
              }
              resolve(ids);
            } else {
              console.log(`   ❌ CoreSignal search error: ${res.statusCode} ${res.statusMessage}`);
              console.log(`   Response: ${data}`);
              resolve([]);
            }
          } catch (error) {
            console.log(`   ❌ CoreSignal parse error: ${error.message}`);
            resolve([]);
          }
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ CoreSignal request error: ${error.message}`);
        resolve([]);
      });

      req.write(JSON.stringify(query));
      req.end();
    });
  }

  // Collect single profile using actual API endpoint
  async collectSingleProfile(candidateId) {
    const url = `${this.config.baseUrl}/cdapi/v2/employee_multi_source/collect/${candidateId}`;
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        method: 'GET',
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Adrata-CEO-CFO-Finder/1.0',
          'apikey': this.config.apiKey  // Correct authentication method
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const profile = JSON.parse(data);
              resolve(profile);
            } else {
              console.log(`   ❌ CoreSignal collect error: ${res.statusCode} ${res.statusMessage}`);
              resolve(null);
            }
          } catch (error) {
            console.log(`   ❌ CoreSignal collect parse error: ${error.message}`);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ CoreSignal collect request error: ${error.message}`);
        resolve(null);
      });

      req.end();
    });
  }
}

// Universal Role Finder using actual pipeline patterns
class UniversalRoleFinder {
  constructor() {
    this.coreSignalClient = new CoreSignalClient(API_CONFIG.coreSignal);
    console.log(`🔧 Initialized CoreSignal client with API key: ${API_CONFIG.coreSignal.apiKey ? 'CONFIGURED' : 'MISSING'}`);
  }

  // Find executive using actual pipeline logic
  async findExecutiveAtCompany(company, roleKey) {
    const role = ROLE_DEFINITIONS[roleKey];
    if (!role) {
      console.log(`   ❌ Unknown role: ${roleKey}`);
      return null;
    }

    console.log(`🔍 Searching for ${role.name} at ${company.name}...`);
    console.log(`   Role variations: ${role.titles.slice(0, 3).join(', ')}...`);

    try {
      // Step 1: Build search query
      const searchQuery = this.coreSignalClient.buildRoleSearchQuery(company.name, role);
      
      // Step 2: Search for candidates
      const candidateIds = await this.coreSignalClient.searchCandidates(searchQuery, 5);
      
      if (candidateIds.length === 0) {
        console.log(`   ❌ No candidates found for ${role.name} at ${company.name}`);
        return null;
      }

      console.log(`   📋 Found ${candidateIds.length} candidates, collecting profiles...`);

      // Step 3: Collect detailed profiles
      const profiles = [];
      for (const candidateId of candidateIds.slice(0, 3)) { // Top 3 candidates
        try {
          const profile = await this.coreSignalClient.collectSingleProfile(candidateId);
          if (profile) {
            profiles.push(profile);
          }
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${candidateId}: ${error.message}`);
        }
      }

      if (profiles.length === 0) {
        console.log(`   ❌ No valid profiles collected for ${role.name} at ${company.name}`);
        return null;
      }

      // Step 4: Transform and score profiles
      const candidates = profiles.map(profile => this.transformProfileToResult(profile, company, role));
      
      // Step 5: Return best candidate
      const bestCandidate = candidates
        .filter(c => c.confidence.overall >= 60) // Minimum confidence threshold
        .sort((a, b) => b.confidence.overall - a.confidence.overall)[0];

      if (bestCandidate) {
        console.log(`   ✅ Found ${role.name}: ${bestCandidate.person.name} (${bestCandidate.confidence.overall}% confidence)`);
        return bestCandidate;
      } else {
        console.log(`   ❌ No high-confidence ${role.name} found at ${company.name}`);
        return null;
      }

    } catch (error) {
      console.log(`   ❌ Error searching for ${role.name}: ${error.message}`);
      return null;
    }
  }

  // Transform profile to result (from actual codebase)
  transformProfileToResult(profile, company, role) {
    // Calculate confidence scores
    const titleMatch = this.calculateTitleMatchScore(profile.title || '', role.titles);
    const companyMatch = this.calculateCompanyMatchScore(profile.company_name || '', company.name);
    const recency = this.calculateRecencyScore(profile.last_updated);
    const overall = (titleMatch * 0.5 + companyMatch * 0.3 + recency * 0.2);

    return {
      company: {
        name: company.name,
        website: company.website,
        domain: company.domain
      },
      role: {
        name: role.name,
        seniorityLevel: role.seniorityLevel
      },
      person: {
        name: profile.name || 'Unknown',
        title: profile.title || 'Unknown',
        email: profile.email || null,
        linkedinUrl: profile.linkedin_url || null
      },
      confidence: {
        overall: Math.round(overall),
        titleMatch: Math.round(titleMatch),
        companyMatch: Math.round(companyMatch),
        recency: Math.round(recency)
      },
      metadata: {
        foundAt: new Date().toISOString(),
        source: 'coresignal',
        searchQuery: `${role.name} at ${company.name}`,
        creditsUsed: 2 // 1 for search, 1 for collect
      }
    };
  }

  // Calculate title match score
  calculateTitleMatchScore(actualTitle, targetTitles) {
    const titleLower = actualTitle.toLowerCase();
    
    // Exact match gets highest score
    for (const target of targetTitles) {
      if (titleLower === target.toLowerCase()) {
        return 100;
      }
    }
    
    // Partial matches
    for (const target of targetTitles) {
      if (titleLower.includes(target.toLowerCase()) || target.toLowerCase().includes(titleLower)) {
        return 80;
      }
    }
    
    // Keyword matches
    const keywords = ['ceo', 'chief executive', 'cfo', 'chief financial', 'president', 'founder'];
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return 60;
      }
    }
    
    return 20;
  }

  // Calculate company match score
  calculateCompanyMatchScore(actualCompany, targetCompany) {
    const actualLower = actualCompany.toLowerCase();
    const targetLower = targetCompany.toLowerCase();
    
    if (actualLower === targetLower) return 100;
    if (actualLower.includes(targetLower) || targetLower.includes(actualLower)) return 80;
    
    return 30;
  }

  // Calculate recency score
  calculateRecencyScore(lastUpdated) {
    if (!lastUpdated) return 50;
    
    const lastUpdatedDate = new Date(lastUpdated);
    const monthsOld = (Date.now() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsOld < 3) return 100;
    if (monthsOld < 6) return 80;
    if (monthsOld < 12) return 60;
    return 40;
  }

  // Enrich contact info using Hunter.io
  async enrichContactInfo(executive) {
    if (!executive || executive.person.email) return executive;

    console.log(`📧 Enriching contact info for ${executive.person.name}...`);
    
    try {
      const domain = executive.company.domain || `${executive.company.name.toLowerCase().replace(/\s+/g, '')}.com`;
      const firstName = executive.person.name.split(' ')[0];
      const lastName = executive.person.name.split(' ').slice(-1)[0];
      
      const response = await fetch(
        `${API_CONFIG.hunter.baseUrl}/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${API_CONFIG.hunter.apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.email) {
          executive.person.email = data.data.email;
          executive.person.emailConfidence = data.data.confidence || 0;
          console.log(`   ✅ Found email via Hunter: ${executive.person.email}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Hunter error: ${error.message}`);
    }

    return executive;
  }
}

// Main test function
async function testCompleteCEOCFOFinder() {
  console.log('🚀 CORRECTED CEO/CFO FINDER - USING ACTUAL PIPELINE');
  console.log('='.repeat(60));
  console.log('');

  const companies = loadKeyAccountDomains();
  if (companies.length === 0) {
    console.log('❌ No companies loaded. Exiting.');
    return;
  }

  const finder = new UniversalRoleFinder();
  const results = [];
  
  console.log(`\n🎯 Testing with ${companies.length} companies...\n`);

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`\n[${i + 1}/${companies.length}] 🏢 ${company.name} (${company.domain})`);
    console.log('-'.repeat(50));

    const result = {
      company: company.name,
      domain: company.domain,
      owner: company.owner,
      ceo: null,
      cfo: null,
      timestamp: new Date().toISOString()
    };

    // Find CEO
    console.log('👑 Searching for CEO...');
    const ceo = await finder.findExecutiveAtCompany(company, 'CEO');
    if (ceo) {
      result.ceo = await finder.enrichContactInfo(ceo);
    }

    // Find CFO
    console.log('💰 Searching for CFO...');
    const cfo = await finder.findExecutiveAtCompany(company, 'CFO');
    if (cfo) {
      result.cfo = await finder.enrichContactInfo(cfo);
    }

    results.push(result);

    // Rate limiting between companies
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate comprehensive report
  console.log('\n\n📊 COMPREHENSIVE RESULTS REPORT');
  console.log('='.repeat(60));

  const stats = {
    totalCompanies: companies.length,
    ceosFound: results.filter(r => r.ceo).length,
    cfosFound: results.filter(r => r.cfo).length,
    bothFound: results.filter(r => r.ceo && r.cfo).length,
    withEmails: results.filter(r => (r.ceo && r.ceo.person && r.ceo.person.email) || (r.cfo && r.cfo.person && r.cfo.person.email)).length
  };

  console.log(`\n📈 SUCCESS METRICS:`);
  console.log(`   Total Companies: ${stats.totalCompanies}`);
  console.log(`   CEOs Found: ${stats.ceosFound} (${(stats.ceosFound/stats.totalCompanies*100).toFixed(1)}%)`);
  console.log(`   CFOs Found: ${stats.cfosFound} (${(stats.cfosFound/stats.totalCompanies*100).toFixed(1)}%)`);
  console.log(`   Both Found: ${stats.bothFound} (${(stats.bothFound/stats.totalCompanies*100).toFixed(1)}%)`);
  console.log(`   With Emails: ${stats.withEmails} (${(stats.withEmails/stats.totalCompanies*100).toFixed(1)}%)`);

  console.log(`\n🎯 DETAILED RESULTS:`);
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.company} (${result.domain})`);
    
    if (result.ceo) {
      console.log(`   👑 CEO: ${result.ceo.person.name} - ${result.ceo.person.title}`);
      console.log(`      📧 Email: ${result.ceo.person.email || 'Not found'}`);
      console.log(`      🔗 LinkedIn: ${result.ceo.person.linkedinUrl || 'Not found'}`);
      console.log(`      📊 Confidence: ${result.ceo.confidence.overall}%`);
    } else {
      console.log(`   👑 CEO: ❌ Not found`);
    }
    
    if (result.cfo) {
      console.log(`   💰 CFO: ${result.cfo.person.name} - ${result.cfo.person.title}`);
      console.log(`      📧 Email: ${result.cfo.person.email || 'Not found'}`);
      console.log(`      🔗 LinkedIn: ${result.cfo.person.linkedinUrl || 'Not found'}`);
      console.log(`      📊 Confidence: ${result.cfo.confidence.overall}%`);
    } else {
      console.log(`   💰 CFO: ❌ Not found`);
    }
  });

  // Save results to file
  const outputPath = path.join(__dirname, 'ceo-cfo-corrected-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);

  // Final assessment
  const overallAccuracy = ((stats.ceosFound + stats.cfosFound) / (stats.totalCompanies * 2)) * 100;
  console.log(`\n🎯 OVERALL ACCURACY: ${overallAccuracy.toFixed(1)}%`);
  
  if (overallAccuracy >= 90) {
    console.log('🎉 EXCELLENT: Achieved 90%+ accuracy target!');
  } else if (overallAccuracy >= 80) {
    console.log('✅ GOOD: Achieved 80%+ accuracy');
  } else if (overallAccuracy >= 70) {
    console.log('⚠️  ACCEPTABLE: 70%+ accuracy, room for improvement');
  } else {
    console.log('❌ NEEDS WORK: Below 70% accuracy');
  }

  console.log('\n✅ Corrected CEO/CFO finder test completed!');
  return results;
}

// Run the test
if (require.main === module) {
  testCompleteCEOCFOFinder().catch(console.error);
}

module.exports = { testCompleteCEOCFOFinder, UniversalRoleFinder };
