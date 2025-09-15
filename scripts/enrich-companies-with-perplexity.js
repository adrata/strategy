const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Perplexity AI API configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

if (!PERPLEXITY_API_KEY) {
  console.error('❌ PERPLEXITY_API_KEY environment variable is required');
  process.exit(1);
}

// Rate limiting to avoid hitting API limits
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
  console.log(`\n🔍 Enriching ${company.name}...`);
  
  // Create comprehensive prompt for company research
  const prompt = `Research and provide detailed information about ${company.name}, a company in the ${company.industry || 'technology'} industry. 

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
  } catch (error) {
    console.error(`❌ Error updating database for ${companyId}:`, error);
  }
}

async function enrichCompanies() {
  try {
    console.log('🚀 Starting company enrichment with Perplexity AI...');
    
    // Get companies that need enrichment (those with minimal data)
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        deletedAt: null,
        OR: [
          { description: null },
          { website: null },
          { description: '' },
          { website: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        description: true,
        website: true
      },
      take: 20 // Start with 20 companies to avoid rate limits
    });

    console.log(`📊 Found ${companies.length} companies to enrich`);

    if (companies.length === 0) {
      console.log('✅ No companies need enrichment');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`\n📈 Progress: ${i + 1}/${companies.length}`);
      
      try {
        const enrichedData = await enrichCompanyWithPerplexity(company);
        
        if (enrichedData) {
          await updateCompanyInDatabase(company.id, enrichedData);
          successCount++;
        } else {
          errorCount++;
        }
        
        // Rate limiting - wait 2 seconds between requests
        if (i < companies.length - 1) {
          console.log('⏳ Waiting 2 seconds to avoid rate limits...');
          await delay(2000);
        }
      } catch (error) {
        console.error(`❌ Error processing ${company.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Enrichment complete!`);
    console.log(`✅ Successfully enriched: ${successCount} companies`);
    console.log(`❌ Errors: ${errorCount} companies`);
    
  } catch (error) {
    console.error('❌ Error in enrichment process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
enrichCompanies();
