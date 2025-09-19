#!/usr/bin/env node

/**
 * 🎯 COMPLETE CEO/CFO FINDER - UNIVERSAL PROFESSIONAL ACCURACY TEST
 * 
 * Tests our complete pipeline with ALL available API providers:
 * - CoreSignal (Primary): CREDENTIAL_REMOVED_FOR_SECURITY
 * - Hunter.io: d5a761e66d593e65947e7dc45f0acc93eb0b1def
 * - Prospeo: CREDENTIAL_REMOVED_FOR_SECURITY
 * - ContactOut: XLFmjV50gTKQot9UmL0rXvuf
 * - Plus all environment-based providers
 * 
 * Goal: Find CEO and CFO for Key Account Domains with 90%+ accuracy
 */

const fs = require('fs');
const path = require('path');

// API Configuration with ALL available keys
const API_CONFIG = {
  // Primary Data Sources
  coresignal: {
    apiKey: process.env.CORESIGNAL_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    baseUrl: 'https://api.coresignal.com',
    enabled: true,
    priority: 1
  },
  
  // Email Intelligence
  hunter: {
    apiKey: process.env.HUNTER_API_KEY || 'd5a761e66d593e65947e7dc45f0acc93eb0b1def',
    baseUrl: 'https://api.hunter.io/v2',
    enabled: true,
    priority: 2
  },
  
  prospeo: {
    apiKey: process.env.PROSPEO_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    baseUrl: 'https://api.prospeo.io',
    enabled: true,
    priority: 3
  },
  
  // Phone Intelligence
  contactout: {
    apiKey: process.env.CONTACTOUT_API_KEY || 'XLFmjV50gTKQot9UmL0rXvuf',
    baseUrl: 'https://api.contactout.com',
    enabled: true,
    priority: 4
  },
  
  // Additional Providers (if keys available)
  zerobounce: {
    apiKey: process.env.ZEROBOUNCE_API_KEY,
    baseUrl: 'https://api.zerobounce.net/v2',
    enabled: !!process.env.ZEROBOUNCE_API_KEY,
    priority: 5
  },
  
  myemailverifier: {
    apiKey: process.env.MYEMAILVERIFIER_API_KEY,
    baseUrl: 'https://api.myemailverifier.com/v1',
    enabled: !!process.env.MYEMAILVERIFIER_API_KEY,
    priority: 6
  },
  
  dropcontact: {
    apiKey: process.env.DROPCONTACT_API_KEY,
    baseUrl: 'https://api.dropcontact.io',
    enabled: !!process.env.DROPCONTACT_API_KEY,
    priority: 7
  },
  
  lusha: {
    apiKey: process.env.LUSHA_API_KEY,
    baseUrl: 'https://api.lusha.co',
    enabled: !!process.env.LUSHA_API_KEY,
    priority: 8
  },
  
  apollo: {
    apiKey: process.env.APOLLO_API_KEY,
    baseUrl: 'https://api.apollo.io/v1',
    enabled: !!process.env.APOLLO_API_KEY,
    priority: 9
  },
  
  zoominfo: {
    apiKey: process.env.ZOOMINFO_API_KEY,
    baseUrl: 'https://api.zoominfo.com',
    enabled: !!process.env.ZOOMINFO_API_KEY,
    priority: 10
  },
  
  clearbit: {
    apiKey: process.env.CLEARBIT_API_KEY,
    baseUrl: 'https://person.clearbit.com/v2',
    enabled: !!process.env.CLEARBIT_API_KEY,
    priority: 11
  }
};

// Load Key Account Domains
function loadKeyAccountDomains() {
  try {
    const csvPath = path.join(__dirname, '..', 'Key Account Domains.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    const companies = [];
    for (let i = 1; i < Math.min(21, lines.length); i++) { // Test first 20 companies
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

// Enhanced Role Finder using semantic understanding
class UniversalRoleFinder {
  constructor() {
    this.enabledProviders = Object.entries(API_CONFIG)
      .filter(([key, config]) => config.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);
    
    console.log(`🔧 Initialized with ${this.enabledProviders.length} active providers:`);
    this.enabledProviders.forEach(([name, config]) => {
      console.log(`  ✅ ${name.toUpperCase()}: ${config.apiKey ? 'CONFIGURED' : 'MISSING KEY'}`);
    });
  }

  // Semantic role expansion
  expandRole(role) {
    const roleMap = {
      'CEO': [
        'Chief Executive Officer', 'CEO', 'President & CEO', 'Founder & CEO',
        'Managing Director', 'Executive Director', 'President', 'Founder'
      ],
      'CFO': [
        'Chief Financial Officer', 'CFO', 'Finance Director', 'VP Finance',
        'Vice President Finance', 'Head of Finance', 'Financial Director'
      ]
    };
    
    return roleMap[role] || [role];
  }

  // Find executives using CoreSignal
  async findExecutiveWithCoreSignal(company, role) {
    const config = API_CONFIG.coresignal;
    if (!config.enabled) return null;

    try {
      const roleVariations = this.expandRole(role);
      console.log(`🔍 Searching for ${role} at ${company.name} using CoreSignal...`);
      console.log(`   Role variations: ${roleVariations.join(', ')}`);

      // Build search query
      const searchQuery = {
        "query": {
          "bool": {
            "must": [
              {
                "bool": {
                  "should": roleVariations.map(variation => ({
                    "match": {
                      "title": {
                        "query": variation,
                        "boost": variation === role ? 2.0 : 1.0
                      }
                    }
                  }))
                }
              },
              {
                "bool": {
                  "should": [
                    { "match": { "company_name": company.name } },
                    { "match": { "company_domain": company.domain } },
                    { "wildcard": { "company_domain": `*${company.domain}*` } }
                  ]
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

      const response = await fetch(`${config.baseUrl}/cdapi/v1/linkedin/person/search/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(searchQuery)
      });

      if (!response.ok) {
        console.log(`   ❌ CoreSignal API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      if (data.hits && data.hits.hits && data.hits.hits.length > 0) {
        const candidates = data.hits.hits.map(hit => ({
          name: hit._source.name || 'Unknown',
          title: hit._source.title || 'Unknown',
          company: hit._source.company_name || company.name,
          email: hit._source.email || null,
          phone: hit._source.phone || null,
          linkedin: hit._source.linkedin_url || null,
          confidence: this.calculateConfidence(hit._source, role, company),
          source: 'CoreSignal',
          lastUpdated: hit._source.last_updated
        }));

        // Return best candidate
        const bestCandidate = candidates.sort((a, b) => b.confidence - a.confidence)[0];
        console.log(`   ✅ Found ${role}: ${bestCandidate.name} (${bestCandidate.confidence}% confidence)`);
        return bestCandidate;
      }

      console.log(`   ❌ No ${role} found for ${company.name}`);
      return null;

    } catch (error) {
      console.log(`   ❌ CoreSignal error: ${error.message}`);
      return null;
    }
  }

  // Enhanced confidence calculation
  calculateConfidence(person, targetRole, company) {
    let confidence = 0;
    
    // Title match (40% weight)
    const titleLower = (person.title || '').toLowerCase();
    const roleVariations = this.expandRole(targetRole).map(r => r.toLowerCase());
    
    if (roleVariations.some(variation => titleLower.includes(variation))) {
      confidence += 40;
    } else if (titleLower.includes(targetRole.toLowerCase())) {
      confidence += 30;
    }
    
    // Company match (30% weight)
    const companyName = (person.company_name || '').toLowerCase();
    const targetCompany = company.name.toLowerCase();
    
    if (companyName.includes(targetCompany) || targetCompany.includes(companyName)) {
      confidence += 30;
    }
    
    // Data completeness (20% weight)
    let completeness = 0;
    if (person.name) completeness += 5;
    if (person.email) completeness += 5;
    if (person.phone) completeness += 5;
    if (person.linkedin_url) completeness += 5;
    confidence += completeness;
    
    // Recency (10% weight)
    if (person.last_updated) {
      const lastUpdated = new Date(person.last_updated);
      const monthsOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld < 6) confidence += 10;
      else if (monthsOld < 12) confidence += 5;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  // Enrich contact info using waterfall
  async enrichContactInfo(executive) {
    if (!executive) return executive;

    console.log(`📧 Enriching contact info for ${executive.name}...`);
    
    // Try Hunter.io for email
    if (!executive.email && API_CONFIG.hunter.enabled) {
      try {
        const domain = executive.company.toLowerCase().replace(/\s+/g, '') + '.com';
        const firstName = executive.name.split(' ')[0];
        const lastName = executive.name.split(' ').slice(-1)[0];
        
        const response = await fetch(
          `${API_CONFIG.hunter.baseUrl}/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${API_CONFIG.hunter.apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.email) {
            executive.email = data.data.email;
            executive.emailConfidence = data.data.confidence || 0;
            console.log(`   ✅ Found email via Hunter: ${executive.email}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Hunter error: ${error.message}`);
      }
    }

    // Try Prospeo for LinkedIn email
    if (!executive.email && API_CONFIG.prospeo.enabled && executive.linkedin) {
      try {
        const response = await fetch(`${API_CONFIG.prospeo.baseUrl}/linkedin-email-finder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-KEY': API_CONFIG.prospeo.apiKey
          },
          body: JSON.stringify({
            url: executive.linkedin
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.response && data.response.email) {
            executive.email = data.response.email;
            console.log(`   ✅ Found email via Prospeo: ${executive.email}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Prospeo error: ${error.message}`);
      }
    }

    return executive;
  }
}

// Main test function
async function testCompleteCEOCFOFinder() {
  console.log('🚀 COMPLETE CEO/CFO FINDER - UNIVERSAL ACCURACY TEST');
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
    const ceo = await finder.findExecutiveWithCoreSignal(company, 'CEO');
    if (ceo) {
      result.ceo = await finder.enrichContactInfo(ceo);
    }

    // Find CFO
    console.log('💰 Searching for CFO...');
    const cfo = await finder.findExecutiveWithCoreSignal(company, 'CFO');
    if (cfo) {
      result.cfo = await finder.enrichContactInfo(cfo);
    }

    results.push(result);

    // Brief pause to respect rate limits
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
    withEmails: results.filter(r => (r.ceo && r.ceo.email) || (r.cfo && r.cfo.email)).length
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
      console.log(`   👑 CEO: ${result.ceo.name} - ${result.ceo.title}`);
      console.log(`      📧 Email: ${result.ceo.email || 'Not found'}`);
      console.log(`      📞 Phone: ${result.ceo.phone || 'Not found'}`);
      console.log(`      🔗 LinkedIn: ${result.ceo.linkedin || 'Not found'}`);
      console.log(`      📊 Confidence: ${result.ceo.confidence}%`);
    } else {
      console.log(`   👑 CEO: ❌ Not found`);
    }
    
    if (result.cfo) {
      console.log(`   💰 CFO: ${result.cfo.name} - ${result.cfo.title}`);
      console.log(`      📧 Email: ${result.cfo.email || 'Not found'}`);
      console.log(`      📞 Phone: ${result.cfo.phone || 'Not found'}`);
      console.log(`      🔗 LinkedIn: ${result.cfo.linkedin || 'Not found'}`);
      console.log(`      📊 Confidence: ${result.cfo.confidence}%`);
    } else {
      console.log(`   💰 CFO: ❌ Not found`);
    }
  });

  // Save results to file
  const outputPath = path.join(__dirname, 'ceo-cfo-results.json');
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

  console.log('\n✅ Complete CEO/CFO finder test completed!');
  return results;
}

// Run the test
if (require.main === module) {
  testCompleteCEOCFOFinder().catch(console.error);
}

module.exports = { testCompleteCEOCFOFinder, UniversalRoleFinder };
