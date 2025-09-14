#!/usr/bin/env node

/**
 * 🌟 ENRICH ALL ACCOUNTS - SIMPLE RUNNER
 * 
 * Enriches every single account in the database with CoreSignal data
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

// You'll need to set your CoreSignal API key here
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY || '';

if (!CORESIGNAL_API_KEY) {
  console.log('❌ Please set your CoreSignal API key:');
  console.log('export CORESIGNAL_API_KEY="your-api-key-here"');
  console.log('Or contact the team for the API key');
  process.exit(1);
}

const prisma = new PrismaClient();
let creditsUsed = 0;
let enrichmentStats = {
  processed: 0,
  successful: 0,
  failed: 0,
  revenueAdded: 0,
  sizeAdded: 0
};

function log(message, color = 'reset') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeApiRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      method,
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Adrata-Account-Enrichment/1.0',
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${data}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    
    if (method === 'POST' && body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function enrichByWebsite(website) {
  if (!website) return null;
  
  try {
    const cleanUrl = website.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    
    const url = `https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${encodeURIComponent(cleanUrl)}`;
    const response = await makeApiRequest(url);
    creditsUsed += 2;
    return response;
  } catch (error) {
    console.warn(`Website enrichment failed for ${website}:`, error.message);
    return null;
  }
}

async function enrichByName(companyName) {
  if (!companyName) return null;
  
  try {
    // Search for company
    const searchUrl = 'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5';
    const searchQuery = {
      query: {
        query_string: {
          query: `"${companyName}"`,
          default_field: "company_name",
          default_operator: "and"
        }
      }
    };
    
    const searchResults = await makeApiRequest(searchUrl, 'POST', searchQuery);
    creditsUsed += 2;
    
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return null;
    }
    
    // Get the first company
    const companyId = searchResults[0];
    const collectUrl = `https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`;
    const companyData = await makeApiRequest(collectUrl);
    creditsUsed += 2;
    
    return companyData;
  } catch (error) {
    console.warn(`Name enrichment failed for ${companyName}:`, error.message);
    return null;
  }
}

function validateDataQuality(account, data) {
  if (!data || !data.company_name) return false;
  
  // Basic name similarity check
  const accountName = account.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const dataName = data.company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check if names are similar (at least 50% overlap)
  const similarity = accountName.includes(dataName.slice(0, Math.min(5, dataName.length))) ||
                    dataName.includes(accountName.slice(0, Math.min(5, accountName.length))) ||
                    accountName === dataName;
  
  return similarity;
}

function formatEmployeeCount(count) {
  if (count <= 10) return '1-10 employees';
  if (count <= 50) return '11-50 employees';
  if (count <= 200) return '51-200 employees';
  if (count <= 500) return '201-500 employees';
  if (count <= 1000) return '501-1000 employees';
  if (count <= 5000) return '1001-5000 employees';
  return '5000+ employees';
}

async function enrichAccount(account) {
  log(`🔍 Enriching: ${account.name}`, 'cyan');
  enrichmentStats.processed++;
  
  try {
    // Try website first (most accurate)
    let data = null;
    if (account.website) {
      data = await enrichByWebsite(account.website);
    }
    
    // Fallback to name search
    if (!data) {
      data = await enrichByName(account.name);
    }
    
    if (!data) {
      log(`❌ No data found for ${account.name}`, 'red');
      enrichmentStats.failed++;
      return false;
    }
    
    // Validate data quality
    if (!validateDataQuality(account, data)) {
      log(`🚫 Data quality check failed for ${account.name}`, 'yellow');
      enrichmentStats.failed++;
      return false;
    }
    
    // Prepare update data
    const updateData = {};
    let hasUpdates = false;
    
    // Industry
    if (data.industry && !account.industry) {
      updateData.industry = data.industry;
      hasUpdates = true;
    }
    
    // Employee count and size
    if (data.employees_count && !account.size) {
      updateData.size = formatEmployeeCount(data.employees_count);
      enrichmentStats.sizeAdded++;
      hasUpdates = true;
    }
    
    // Revenue (this is what we really want!)
    if (data.revenue_annual_range?.annual_revenue_range_from && !account.revenue) {
      const revenueFrom = data.revenue_annual_range.annual_revenue_range_from;
      const revenueTo = data.revenue_annual_range.annual_revenue_range_to;
      
      // Use average if we have a range, otherwise use minimum
      const estimatedRevenue = revenueTo ? (revenueFrom + revenueTo) / 2 : revenueFrom;
      updateData.revenue = estimatedRevenue;
      enrichmentStats.revenueAdded++;
      hasUpdates = true;
      
      log(`💰 Revenue found: $${estimatedRevenue.toLocaleString()}`, 'green');
    }
    
    // Country
    if (data.hq_country && !account.country) {
      updateData.country = data.hq_country;
      hasUpdates = true;
    }
    
    // Build enrichment notes
    const notes = [];
    if (data.employees_count) notes.push(`Employees: ${data.employees_count.toLocaleString()}`);
    if (data.revenue_annual_range?.annual_revenue_range_from) {
      const from = data.revenue_annual_range.annual_revenue_range_from;
      const to = data.revenue_annual_range.annual_revenue_range_to;
      const currency = data.revenue_annual_range.annual_revenue_range_currency || 'USD';
      if (to) {
        notes.push(`Revenue: ${currency} ${from.toLocaleString()} - ${to.toLocaleString()}`);
      } else {
        notes.push(`Revenue: ${currency} ${from.toLocaleString()}+`);
      }
    }
    if (data.founded_year) notes.push(`Founded: ${data.founded_year}`);
    notes.push(`CoreSignal enriched: ${new Date().toISOString().split('T')[0]}`);
    
    updateData.notes = notes.join(' | ');
    updateData.updatedAt = new Date();
    
    // Apply updates if we have any
    if (hasUpdates) {
      await prisma.account.update({
        where: { id: account.id },
        data: updateData
      });
      
      log(`✅ Updated ${account.name}`, 'green');
      enrichmentStats.successful++;
      return true;
    } else {
      log(`ℹ️ No new data for ${account.name}`, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error enriching ${account.name}: ${error.message}`, 'red');
    enrichmentStats.failed++;
    return false;
  }
}

async function main() {
  log('🌟 ENRICHING ALL ACCOUNTS WITH CORESIGNAL DATA', 'cyan');
  log('===============================================', 'cyan');
  
  try {
    // Get all accounts
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        size: true,
        revenue: true,
        country: true
      },
      orderBy: { name: 'asc' }
    });
    
    log(`📊 Found ${accounts.length} accounts to enrich`, 'blue');
    
    if (accounts.length === 0) {
      log('❌ No accounts found!', 'red');
      return;
    }
    
    const startTime = Date.now();
    
    // Process accounts in small batches to respect rate limits
    const batchSize = 3;
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(accounts.length / batchSize);
      
      log(`\\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} accounts)`, 'blue');
      
      // Process batch sequentially to avoid overwhelming the API
      for (const account of batch) {
        await enrichAccount(account);
        // Small delay between accounts
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Longer delay between batches
      if (i + batchSize < accounts.length) {
        log(`⏳ Waiting 2 seconds before next batch...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Progress update
      const processed = Math.min(i + batchSize, accounts.length);
      const progressPct = Math.round((processed / accounts.length) * 100);
      log(`📈 Progress: ${processed}/${accounts.length} (${progressPct}%) - ${enrichmentStats.successful} enriched`, 'cyan');
    }
    
    const duration = (Date.now() - startTime) / 1000;
    
    log('\\n✅ ENRICHMENT COMPLETE!', 'green');
    log('========================', 'green');
    log(`⏱️ Duration: ${duration.toFixed(1)}s`);
    log(`📊 Processed: ${enrichmentStats.processed}`);
    log(`✅ Successful: ${enrichmentStats.successful}`);
    log(`❌ Failed: ${enrichmentStats.failed}`);
    log(`💰 Revenue data added: ${enrichmentStats.revenueAdded}`);
    log(`👥 Size data added: ${enrichmentStats.sizeAdded}`);
    log(`💳 Credits used: ${creditsUsed}`, 'cyan');
    log(`💵 Estimated cost: $${(creditsUsed * 0.02).toFixed(2)}`, 'cyan');
    
    const successRate = enrichmentStats.processed > 0 ? 
      (enrichmentStats.successful / enrichmentStats.processed * 100).toFixed(1) : 0;
    log(`📈 Success rate: ${successRate}%`, 'green');
    
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { enrichAccount };
