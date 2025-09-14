#!/usr/bin/env node

/**
 * CoreSignal Company Vertical Enrichment
 * 
 * Uses real CoreSignal API with NAICS codes for accurate vertical classification
 * Based on the CoreSignal API documentation provided
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com';

// NAICS to Vertical Mapping based on research
const NAICS_TO_VERTICAL = {
  // Convenience Stores (C Stores)
  '445131': 'C Stores', // Convenience Retailers
  '447110': 'C Stores', // Gasoline Stations with Convenience Stores
  '324110': 'C Stores', // Petroleum Refineries
  '454310': 'C Stores', // Fuel Dealers
  
  // Grocery Stores
  '445110': 'Grocery Stores', // Supermarkets and Other Grocery Retailers (except Convenience Retailers)
  '445210': 'Grocery Stores', // Meat Markets
  '445220': 'Grocery Stores', // Fish and Seafood Markets
  '445230': 'Grocery Stores', // Fruit and Vegetable Markets
  '445291': 'Grocery Stores', // Baked Goods Stores
  '445299': 'Grocery Stores', // All Other Specialty Food Stores
  
  // Corporate Retailers
  '452111': 'Corporate Retailers', // Department Stores (except Discount Department Stores)
  '452112': 'Corporate Retailers', // Discount Department Stores
  '453210': 'Corporate Retailers', // Office Supplies and Stationery Stores
  '444110': 'Corporate Retailers', // Home Centers
  '444120': 'Corporate Retailers', // Paint and Wallpaper Stores
  '444130': 'Corporate Retailers', // Hardware Stores
  '443142': 'Corporate Retailers', // Electronics Stores
  '448110': 'Corporate Retailers', // Men's Clothing Stores
  '448120': 'Corporate Retailers', // Women's Clothing Stores
  '448140': 'Corporate Retailers', // Family Clothing Stores
  '446110': 'Corporate Retailers', // Pharmacies and Drug Stores
};

// SIC to Vertical Mapping as fallback
const SIC_TO_VERTICAL = {
  // Convenience Stores
  '5411': 'C Stores', // Grocery Stores
  '5541': 'C Stores', // Gasoline Service Stations
  
  // Grocery Stores  
  '5411': 'Grocery Stores', // Grocery Stores
  '5421': 'Grocery Stores', // Meat and Fish Markets
  '5431': 'Grocery Stores', // Fruit and Vegetable Markets
  
  // Corporate Retailers
  '5311': 'Corporate Retailers', // Department Stores
  '5331': 'Corporate Retailers', // Variety Stores
  '5399': 'Corporate Retailers', // Miscellaneous General Merchandise Stores
  '5712': 'Corporate Retailers', // Furniture Stores
  '5943': 'Corporate Retailers', // Stationery Stores
};

// Industry keyword mapping for additional classification
const INDUSTRY_KEYWORDS_TO_VERTICAL = {
  'C Stores': [
    'convenience store', 'gas station', 'gasoline station', 'fuel station', 
    'petroleum retail', 'truck stop', 'travel center', 'c-store',
    'convenience retail', 'fuel retail', 'energy retail'
  ],
  'Grocery Stores': [
    'grocery', 'supermarket', 'food store', 'food retail', 'food chain',
    'grocery chain', 'superstore', 'food market', 'fresh food',
    'organic food', 'natural food', 'specialty food'
  ],
  'Corporate Retailers': [
    'department store', 'retail chain', 'discount store', 'warehouse club',
    'home improvement', 'electronics retail', 'pharmacy chain', 'drugstore',
    'auto parts', 'specialty retail', 'general merchandise', 'big box',
    'fashion retail', 'apparel retail', 'consumer goods'
  ]
};

/**
 * Make authenticated API request to CoreSignal
 */
async function makeApiRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      method,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Adrata-Enrichment-Service/1.0',
        'apikey': CORESIGNAL_API_KEY
      }
    };

    if (method === 'POST' && body) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    if (method === 'POST' && body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Enhanced vertical classification using comprehensive CoreSignal Multi-source API data
 */
function determineVerticalFromCoreSignalData(coreSignalData) {
  const { 
    company_name,
    industry, 
    sic_codes, 
    naics_codes, 
    description, 
    description_enriched,
    categories_and_keywords 
  } = coreSignalData;
  
  console.log(`    🔍 Analyzing: ${company_name || 'Unknown'}`);
  console.log(`    📊 SIC codes: ${sic_codes ? sic_codes.join(', ') : 'none'}`);
  console.log(`    📈 NAICS codes: ${naics_codes ? naics_codes.join(', ') : 'none'}`);
  console.log(`    🏭 Industry: ${industry || 'none'}`);
  
  // Priority 1: NAICS codes (most accurate for current classification)
  if (naics_codes && Array.isArray(naics_codes)) {
    for (const naicsCode of naics_codes) {
      const naicsStr = naicsCode.toString();
      if (NAICS_TO_VERTICAL[naicsStr]) {
        console.log(`    ✅ NAICS Match: ${naicsStr} → ${NAICS_TO_VERTICAL[naicsStr]}`);
        return {
          vertical: NAICS_TO_VERTICAL[naicsStr],
          reason: `NAICS code ${naicsStr}`,
          confidence: 'high',
          source: 'naics_exact'
        };
      }
      
      // Check partial NAICS matches (first 4 digits for broader industry classification)
      const naicsPrefix = naicsStr.substring(0, 4);
      const partialMatch = Object.keys(NAICS_TO_VERTICAL).find(key => key.startsWith(naicsPrefix));
      if (partialMatch) {
        console.log(`    ✅ NAICS Partial: ${naicsStr} (${naicsPrefix}) → ${NAICS_TO_VERTICAL[partialMatch]}`);
        return {
          vertical: NAICS_TO_VERTICAL[partialMatch],
          reason: `NAICS code ${naicsStr} (partial match ${naicsPrefix})`,
          confidence: 'high',
          source: 'naics_partial'
        };
      }
    }
  }

  // Priority 2: SIC codes
  if (sic_codes && Array.isArray(sic_codes)) {
    for (const sicCode of sic_codes) {
      const sicStr = sicCode.toString();
      if (SIC_TO_VERTICAL[sicStr]) {
        console.log(`    ✅ SIC Match: ${sicStr} → ${SIC_TO_VERTICAL[sicStr]}`);
        return {
          vertical: SIC_TO_VERTICAL[sicStr],
          reason: `SIC code ${sicStr}`,
          confidence: 'high',
          source: 'sic_exact'
        };
      }
      
      // Check partial SIC matches (first 3 digits)
      const sicPrefix = sicStr.substring(0, 3);
      const partialMatch = Object.keys(SIC_TO_VERTICAL).find(key => key.startsWith(sicPrefix));
      if (partialMatch) {
        console.log(`    ✅ SIC Partial: ${sicStr} (${sicPrefix}) → ${SIC_TO_VERTICAL[partialMatch]}`);
        return {
          vertical: SIC_TO_VERTICAL[partialMatch],
          reason: `SIC code ${sicStr} (partial match ${sicPrefix})`,
          confidence: 'medium',
          source: 'sic_partial'
        };
      }
    }
  }

  // Priority 3: Enhanced keyword analysis from multiple data sources
  const analysisTexts = [
    industry,
    description,
    description_enriched,
    ...(categories_and_keywords || [])
  ].filter(Boolean).map(text => text.toLowerCase());
  
  const combinedText = analysisTexts.join(' ');
  console.log(`    📝 Analysis text: ${combinedText.substring(0, 150)}...`);

  // Enhanced pattern matching with scoring
  const patterns = {
    'C Stores': [
      'convenience store', 'gas station', 'gasoline', 'fuel', 'petroleum', 'oil company',
      'travel center', 'truck stop', 'service station', 'fuel dispensing', 'c-store',
      '7-eleven', 'circle k', 'speedway', 'shell', 'bp', 'exxon', 'chevron', 'marathon',
      'wawa', 'sheetz', 'racetrac', 'casey', 'kwik trip', 'pilot', 'flying j'
    ],
    'Grocery Stores': [
      'grocery', 'supermarket', 'food market', 'grocery chain', 'food retailer',
      'fresh market', 'produce', 'food distribution', 'wholesale grocer', 'food store',
      'kroger', 'safeway', 'albertsons', 'publix', 'wegmans', 'harris teeter',
      'giant food', 'stop & shop', 'king soopers', 'fred meyer', 'qfc'
    ],
    'Corporate Retailers': [
      'department store', 'retail chain', 'big box', 'warehouse club', 'home improvement',
      'discount store', 'general merchandise', 'specialty retail', 'auto parts',
      'hardware store', 'sporting goods', 'electronics retail', 'pharmacy chain',
      'walmart', 'target', 'costco', 'home depot', 'lowes', "dick's sporting",
      'advance auto', 'autozone', 'ace hardware', 'menards', 'tractor supply'
    ]
  };

  // Calculate pattern scores
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [vertical, keywords] of Object.entries(patterns)) {
    const score = keywords.filter(keyword => combinedText.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = vertical;
    }
  }

  if (bestMatch && bestScore > 0) {
    console.log(`    ✅ Keyword Match: ${bestMatch} (score: ${bestScore})`);
    return {
      vertical: bestMatch,
      reason: `Keyword pattern analysis (${bestScore} matches)`,
      confidence: bestScore > 2 ? 'high' : 'medium',
      source: 'keyword_analysis'
    };
  }

  // Priority 4: Fallback industry keyword matching
  for (const [vertical, keywords] of Object.entries(INDUSTRY_KEYWORDS_TO_VERTICAL)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      console.log(`    ✅ Industry Match: ${vertical}`);
      return {
        vertical,
        reason: 'Industry keyword match',
        confidence: 'low',
        source: 'industry_fallback'
      };
    }
  }

  console.log(`    ❓ No clear match found`);
  return {
    vertical: 'Other',
    reason: 'No classification match found',
    confidence: 'low',
    source: 'default'
  };
}

/**
 * Intelligent fallback classification based on company name keywords
 */
function classifyByCompanyName(companyName) {
  const lowerName = companyName.toLowerCase();
  
  // C Stores patterns
  const cStoreKeywords = [
    'gas', 'fuel', 'petroleum', 'oil', 'convenience', 'travel center', 'truck stop',
    '7-eleven', 'circle k', 'speedway', 'shell', 'bp', 'exxon', 'chevron', 'marathon',
    'wawa', 'sheetz', 'racetrac', 'casey', 'kwik', 'pilot', 'flying j'
  ];
  
  // Grocery Store patterns  
  const groceryKeywords = [
    'grocery', 'market', 'food', 'supermarket', 'foods', 'fresh', 'produce',
    'kroger', 'safeway', 'albertsons', 'publix', 'wegmans', 'harris teeter',
    'giant', 'stop & shop', 'king soopers', 'fred meyer', 'qfc'
  ];
  
  // Corporate Retailers patterns
  const retailKeywords = [
    'retail', 'store', 'department', 'warehouse', 'supply', 'hardware', 'auto parts',
    'walmart', 'target', 'costco', 'home depot', 'lowes', "dick's", 'advance auto',
    'autozone', 'ace hardware', 'menards', 'tractor supply'
  ];
  
  // Check for C Stores
  if (cStoreKeywords.some(keyword => lowerName.includes(keyword))) {
    return {
      vertical: 'C Stores',
      reason: 'Company name keyword match',
      confidence: 'medium'
    };
  }
  
  // Check for Grocery Stores
  if (groceryKeywords.some(keyword => lowerName.includes(keyword))) {
    return {
      vertical: 'Grocery Stores',
      reason: 'Company name keyword match',
      confidence: 'medium'
    };
  }
  
  // Check for Corporate Retailers
  if (retailKeywords.some(keyword => lowerName.includes(keyword))) {
    return {
      vertical: 'Corporate Retailers',
      reason: 'Company name keyword match',
      confidence: 'medium'
    };
  }
  
  // Default to Other
  return {
    vertical: 'Other',
    reason: 'No keyword matches found',
    confidence: 'low'
  };
}

/**
 * Enrich company using CoreSignal Company Multi-Source API
 */
async function enrichCompanyWithCoreSignal(companyName, website) {
  try {
    let response;
    let foundData = false;
    
    // Strategy 1: Try website-based enrichment first (most accurate)
    if (website && website.includes('.')) {
      try {
        const cleanWebsite = website.replace(/^https?:\/\//, '').replace(/^www\./, '');
        const websiteUrl = `${CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/enrich?website=${encodeURIComponent(cleanWebsite)}`;
        console.log(`🔍 CoreSignal API: Website lookup for ${companyName}`);
        
        response = await makeApiRequest(websiteUrl);
        if (response && response.company) {
          foundData = true;
        }
      } catch (websiteError) {
        console.log(`  ⚠️ Website lookup failed, trying name search...`);
      }
    }
    
    // Strategy 2: Try exact company name search
    if (!foundData) {
      try {
        const nameUrl = `${CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/search?company_name=${encodeURIComponent(companyName)}&limit=1`;
        console.log(`🔍 CoreSignal API: Name search for ${companyName}`);
        
        response = await makeApiRequest(nameUrl);
        if (response && response.companies && response.companies.length > 0) {
          response.company = response.companies[0];
          foundData = true;
        }
      } catch (nameError) {
        console.log(`  ⚠️ Name search failed, trying simplified name...`);
      }
    }
    
    // Strategy 3: Try simplified company name (remove LLC, Inc, etc.)
    if (!foundData) {
      try {
        const simplifiedName = companyName
          .replace(/\b(LLC|Inc|Corporation|Corp|Ltd|Limited|Company|Co\.?)\b/gi, '')
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim();
        
        if (simplifiedName !== companyName && simplifiedName.length > 2) {
          const simplifiedUrl = `${CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/search?company_name=${encodeURIComponent(simplifiedName)}&limit=1`;
          console.log(`🔍 CoreSignal API: Simplified search for "${simplifiedName}"`);
          
          response = await makeApiRequest(simplifiedUrl);
          if (response && response.companies && response.companies.length > 0) {
            response.company = response.companies[0];
            foundData = true;
          }
        }
      } catch (simplifiedError) {
        console.log(`  ⚠️ Simplified search also failed`);
      }
    }
    
    if (foundData && response.company) {
      const companyData = response.company;
      const classification = determineVerticalFromCoreSignalData(companyData);
      
      console.log(`  ✅ Found: ${companyData.company_name || companyName} → ${classification.vertical} (${classification.confidence})`);
      
      return {
        success: true,
        data: {
          ...companyData,
          classification
        }
      };
    }

    // Fallback: Use intelligent classification based on company name
    const fallbackClassification = classifyByCompanyName(companyName);
    console.log(`  📝 Fallback classification: ${companyName} → ${fallbackClassification.vertical} (${fallbackClassification.confidence})`);
    
    return {
      success: true,
      data: {
        company_name: companyName,
        classification: fallbackClassification,
        source: 'fallback_classification'
      }
    };

  } catch (error) {
    console.error(`❌ CoreSignal API error for ${companyName}:`, error.message);
    
    // Even on error, provide fallback classification
    const fallbackClassification = classifyByCompanyName(companyName);
    return {
      success: true,
      data: {
        company_name: companyName,
        classification: fallbackClassification,
        source: 'error_fallback'
      }
    };
  }
}

/**
 * Main enrichment function
 */
async function enrichDanoCompanyVerticalsWithCoreSignal() {
  if (!CORESIGNAL_API_KEY) {
    console.log('❌ CORESIGNAL_API_KEY environment variable not set');
    console.log('📝 Set it with: export CORESIGNAL_API_KEY=your_api_key_here');
    return;
  }

  try {
    console.log('🏢 Enriching Dano\'s company verticals with CoreSignal API...\n');

    // Get all unique companies from accounts and prospects
    const accounts = await prisma.account.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: { id: true, name: true, industry: true, website: true }
    });
    
    const prospects = await prisma.prospect.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: { id: true, company: true, industry: true, vertical: true }
    });

    console.log(`📊 Found ${accounts.length} accounts and ${prospects.length} prospects to enrich`);
    
    // Create a map of unique companies
    const companies = new Map();
    
    // Add accounts
    accounts.forEach(account => {
      if (account.name && account.name !== 'Unknown Company') {
        companies.set(account.name, {
          type: 'account',
          ids: [account.id],
          name: account.name,
          industry: account.industry,
          website: account.website
        });
      }
    });
    
    // Add prospects (group by company)
    prospects.forEach(prospect => {
      if (prospect.company && prospect.company !== 'Unknown Company') {
        if (companies.has(prospect.company)) {
          const existing = companies.get(prospect.company);
          existing.prospectIds = existing.prospectIds || [];
          existing.prospectIds.push(prospect.id);
        } else {
          companies.set(prospect.company, {
            type: 'prospect',
            prospectIds: [prospect.id],
            name: prospect.company,
            industry: prospect.industry,
            currentVertical: prospect.vertical
          });
        }
      }
    });

    console.log(`🏭 Processing ${companies.size} unique companies with CoreSignal API...\n`);
    
    let enrichedCount = 0;
    let updatedAccounts = 0;
    let updatedProspects = 0;
    let apiCallCount = 0;
    
    const verticalCounts = {
      'C Stores': 0,
      'Grocery Stores': 0,
      'Corporate Retailers': 0,
      'Other': 0
    };

    const confidenceStats = {
      'high': 0,
      'medium': 0,
      'low': 0
    };
    
    for (const [companyName, companyData] of companies) {
      try {
        console.log(`🔍 Processing: ${companyName}`);
        
        // Enrich with CoreSignal API
        const enrichmentResult = await enrichCompanyWithCoreSignal(companyName, companyData.website);
        apiCallCount++;
        
        if (enrichmentResult.success) {
          const { classification } = enrichmentResult.data;
          const newVertical = classification.vertical;
          
          console.log(`  📍 ${classification.reason} → ${newVertical} (${classification.confidence} confidence)`);
          
          // Update accounts
          if (companyData.type === 'account' || companyData.ids) {
            const accountIds = companyData.ids || [];
            if (accountIds.length > 0) {
              await prisma.account.updateMany({
                where: { id: { in: accountIds } },
                data: { industry: newVertical }
              });
              updatedAccounts += accountIds.length;
            }
          }
          
          // Update prospects
          if (companyData.prospectIds) {
            await prisma.prospect.updateMany({
              where: { id: { in: companyData.prospectIds } },
              data: { 
                vertical: newVertical,
                industry: enrichmentResult.data.industry || newVertical
              }
            });
            updatedProspects += companyData.prospectIds.length;
          }
          
          verticalCounts[newVertical]++;
          confidenceStats[classification.confidence]++;
          enrichedCount++;
          
        } else {
          console.log(`  ❌ Enrichment failed: ${enrichmentResult.error}`);
        }
        
        // Rate limiting (CoreSignal allows 10 requests per second)
        await new Promise(resolve => setTimeout(resolve, 120));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${companyName}:`, error.message);
      }
    }
    
    console.log(`\n📊 CORESIGNAL ENRICHMENT SUMMARY:`);
    console.log(`   🔥 API calls made: ${apiCallCount}`);
    console.log(`   ✅ Companies enriched: ${enrichedCount}/${companies.size}`);
    console.log(`   📝 Accounts updated: ${updatedAccounts}`);
    console.log(`   👥 Prospects updated: ${updatedProspects}`);
    
    console.log(`\n📊 VERTICAL DISTRIBUTION:`);
    Object.entries(verticalCounts).forEach(([vertical, count]) => {
      console.log(`   ${vertical}: ${count} companies`);
    });

    console.log(`\n📊 CONFIDENCE BREAKDOWN:`);
    Object.entries(confidenceStats).forEach(([confidence, count]) => {
      console.log(`   ${confidence}: ${count} classifications`);
    });
    
    console.log(`\n✅ CoreSignal company vertical enrichment complete!`);
    
  } catch (error) {
    console.error('❌ Error enriching company verticals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enrichDanoCompanyVerticalsWithCoreSignal();
