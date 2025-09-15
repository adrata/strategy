/**
 * Batch Company Enrichment Script for Dano
 * 
 * This script enriches ALL companies in the Notary Everyday workspace 
 * using Perplexity AI.
 * 
 * Target: ALL companies in Notary Everyday workspace (thousands)
 * Workspace: Notary Everyday (01K1VBYXHD0J895XAN0HGFBKJP)
 * Limit: First 1000 companies per run (to manage API rate limits)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Perplexity AI API configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

if (!PERPLEXITY_API_KEY) {
  console.error('❌ PERPLEXITY_API_KEY environment variable is required');
  process.exit(1);
}

// Notary Everyday workspace ID (where Dano's companies are)
const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
// Dano's user ID
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

// Batch processing configuration for large datasets
const BATCH_SIZE = 3; // Process 3 companies in parallel (reduced for stability)
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches (increased for rate limiting)
const MAX_COMPANIES = 1000; // Limit to first 1000 companies to start

// Rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callPerplexityAPI(prompt) {
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Perplexity API call failed:', error);
    return null;
  }
}

async function enrichCompanyWithPerplexity(company) {
  console.log(`🔍 Enriching ${company.name}...`);
  
  const prompt = `Research and provide detailed information about ${company.name}, a company in the ${company.industry || 'business services'} industry. 

Please provide the following information in JSON format:

{
  "companyName": "Exact company name",
  "industry": "Primary industry",
  "description": "2-3 sentence company description",
  "website": "Official website URL",
  "headquarters": "City, State/Country",
  "founded": "Year founded",
  "ceo": "Current CEO name",
  "employeeCount": "Number of employees (e.g., '1,000-5,000')",
  "revenue": "Annual revenue (e.g., '$100M', '$1.2B')",
  "marketCap": "Market capitalization if public",
  "businessModel": "Primary business model",
  "keyProducts": ["Product 1", "Product 2", "Product 3"],
  "targetMarkets": ["Market 1", "Market 2"],
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "recentNews": [
    {
      "title": "News headline",
      "date": "2024-01-15",
      "summary": "Brief summary"
    }
  ],
  "financials": {
    "revenue": "Annual revenue",
    "growth": "Year-over-year growth rate",
    "profitMargin": "Profit margin percentage",
    "funding": "Total funding raised if private"
  },
  "technology": {
    "cloudAdoption": "Cloud adoption level",
    "aiUsage": "AI/ML usage level",
    "securityRating": "Security rating",
    "compliance": ["SOC 2", "ISO 27001", "GDPR"]
  },
  "painPoints": ["Pain point 1", "Pain point 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"]
}

Focus on recent, accurate information. If any information is not available, use "Unknown" or empty arrays as appropriate.`;

  try {
    const response = await callPerplexityAPI(prompt);
    if (!response) {
      console.log(`⚠️ No response from Perplexity for ${company.name}`);
      return null;
    }

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`⚠️ No JSON found in response for ${company.name}`);
      return null;
    }

    const enrichedData = JSON.parse(jsonMatch[0]);
    console.log(`✅ Successfully enriched ${company.name}`);
    return enrichedData;
  } catch (error) {
    console.error(`❌ Error enriching ${company.name}:`, error);
    return null;
  }
}

async function updateCompanyInDatabase(companyId, enrichedData) {
  try {
    // First verify the company is in the correct workspace before updating
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, workspaceId: true }
    });
    
    if (!company) {
      console.error(`❌ Company ${companyId} not found in database`);
      return false;
    }
    
    if (company.workspaceId !== NOTARY_WORKSPACE_ID) {
      console.error(`❌ Company ${company.name} is in wrong workspace: ${company.workspaceId} (expected: ${NOTARY_WORKSPACE_ID})`);
      return false;
    }
    
    const updateData = {
      name: enrichedData.companyName || undefined,
      industry: enrichedData.industry || undefined,
      description: enrichedData.description || undefined,
      website: enrichedData.website || undefined,
      city: enrichedData.headquarters ? enrichedData.headquarters.split(',')[0]?.trim() : undefined,
      state: enrichedData.headquarters ? enrichedData.headquarters.split(',')[1]?.trim() : undefined,
      size: enrichedData.employeeCount || undefined,
      revenue: enrichedData.revenue ? parseFloat(enrichedData.revenue.replace(/[^\d.]/g, '')) : undefined,
      // Store additional data in customFields JSON
      customFields: {
        founded: enrichedData.founded,
        ceo: enrichedData.ceo,
        marketCap: enrichedData.marketCap,
        businessModel: enrichedData.businessModel,
        keyProducts: enrichedData.keyProducts || [],
        targetMarkets: enrichedData.targetMarkets || [],
        competitors: enrichedData.competitors || [],
        recentNews: enrichedData.recentNews || [],
        financials: enrichedData.financials || {},
        technology: enrichedData.technology || {},
        painPoints: enrichedData.painPoints || [],
        opportunities: enrichedData.opportunities || []
      },
      updatedAt: new Date()
    };

    await prisma.companies.update({
      where: { id: companyId },
      data: updateData
    });

    console.log(`✅ Updated database record for ${enrichedData.companyName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating database for ${companyId}:`, error);
    return false;
  }
}

async function processBatch(companies) {
  console.log(`\n🚀 Processing batch of ${companies.length} companies...`);
  
  // Process all companies in the batch in parallel
  const promises = companies.map(async (company) => {
    try {
      const enrichedData = await enrichCompanyWithPerplexity(company);
      
      if (enrichedData) {
        const success = await updateCompanyInDatabase(company.id, enrichedData);
        return { company: company.name, success, enriched: true };
      } else {
        return { company: company.name, success: false, enriched: false };
      }
    } catch (error) {
      console.error(`❌ Error processing ${company.name}:`, error);
      return { company: company.name, success: false, enriched: false, error: error.message };
    }
  });

  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.success).length;
  const enriched = results.filter(r => r.enriched).length;
  
  console.log(`📊 Batch complete: ${successful}/${companies.length} successful, ${enriched}/${companies.length} enriched`);
  
  return results;
}

async function enrichAllCompanies() {
  try {
    console.log('🚀 Starting BATCH enrichment of ALL companies in Notary Everyday workspace...');
    console.log(`📋 Workspace ID: ${NOTARY_WORKSPACE_ID}`);
    
    // First, verify the workspace exists and get its details
    const workspace = await prisma.workspaces.findUnique({
      where: { id: NOTARY_WORKSPACE_ID },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      console.error(`❌ Workspace ${NOTARY_WORKSPACE_ID} not found!`);
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    
    // Get companies ONLY from Notary Everyday workspace (limited for initial run)
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID, // Explicitly filter by workspace ID
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        industry: true,
        description: true,
        website: true,
        workspaceId: true
      },
      orderBy: { updatedAt: 'asc' }, // Start with oldest updated companies
      take: MAX_COMPANIES // Limit to prevent overwhelming the API
    });

    console.log(`📊 Found ${companies.length} companies in Notary Everyday workspace to enrich`);
    console.log(`⚠️  Limited to first ${MAX_COMPANIES} companies for this run`);
    
    // Double-check: Verify all companies are from the correct workspace
    const wrongWorkspaceCompanies = companies.filter(c => c.workspaceId !== NOTARY_WORKSPACE_ID);
    if (wrongWorkspaceCompanies.length > 0) {
      console.error(`❌ ERROR: Found ${wrongWorkspaceCompanies.length} companies from wrong workspace!`);
      console.error(`   Expected workspace: ${NOTARY_WORKSPACE_ID}`);
      console.error(`   Wrong companies:`, wrongWorkspaceCompanies.map(c => `${c.name} (${c.workspaceId})`));
      return;
    }
    
    // Show sample of companies to be processed
    console.log(`\n📋 Sample companies to be enriched (first 5):`);
    companies.slice(0, 5).forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.industry || 'No industry'})`);
    });

    if (companies.length === 0) {
      console.log('✅ No companies found in Notary Everyday workspace to enrich');
      return;
    }

    let totalSuccess = 0;
    let totalEnriched = 0;
    let totalErrors = 0;

    // Process companies in batches
    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(companies.length / BATCH_SIZE);
      
      console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (Companies ${i + 1}-${Math.min(i + BATCH_SIZE, companies.length)})`);
      
      const batchResults = await processBatch(batch);
      
      // Update totals
      batchResults.forEach(result => {
        if (result.success) totalSuccess++;
        if (result.enriched) totalEnriched++;
        if (!result.success) totalErrors++;
      });
      
      // Delay between batches (except for the last batch)
      if (i + BATCH_SIZE < companies.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    console.log(`\n🎉 BATCH ENRICHMENT COMPLETE!`);
    console.log(`📊 Final Results:`);
    console.log(`   ✅ Successfully updated: ${totalSuccess}/${companies.length} companies`);
    console.log(`   🔍 Successfully enriched: ${totalEnriched}/${companies.length} companies`);
    console.log(`   ❌ Errors: ${totalErrors}/${companies.length} companies`);
    console.log(`   📈 Success rate: ${((totalSuccess/companies.length)*100).toFixed(1)}%`);
    console.log(`\n💡 Note: This run processed the first ${companies.length} companies.`);
    console.log(`   To process more companies, run the script again.`);
    
  } catch (error) {
    console.error('❌ Error in batch enrichment process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the batch enrichment
enrichAllCompanies();
