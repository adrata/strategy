const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Perplexity AI API configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

if (!PERPLEXITY_API_KEY) {
  console.error('❌ PERPLEXITY_API_KEY environment variable is required');
  process.exit(1);
}

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

async function enrichIndustryData(industryName) {
  console.log(`\n🔍 Researching ${industryName} industry...`);
  
  const prompt = `Research the ${industryName} industry and provide comprehensive information in JSON format:

{
  "industryName": "${industryName}",
  "description": "2-3 sentence industry description",
  "marketSize": "Total market size (e.g., '$50B')",
  "growthRate": "Annual growth rate (e.g., '8.5%')",
  "keyTrends": ["Trend 1", "Trend 2", "Trend 3"],
  "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
  "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "regulations": ["Regulation 1", "Regulation 2"],
  "technologyAdoption": "Technology adoption level",
  "seasonality": "Seasonal patterns if any",
  "buyingProcess": "Typical buying process description",
  "decisionMakers": ["Decision maker 1", "Decision maker 2"],
  "salesCycle": "Typical sales cycle length",
  "budgetTiming": "When budgets are typically allocated",
  "competitiveLandscape": "Overview of competitive landscape"
}

Focus on current market conditions and trends.`;

  try {
    const response = await callPerplexityAPI(prompt);
    if (!response) {
      console.log(`⚠️ No response from Perplexity for ${industryName}`);
      return null;
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`⚠️ No JSON found in response for ${industryName}`);
      return null;
    }

    const enrichedData = JSON.parse(jsonMatch[0]);
    console.log(`✅ Successfully researched ${industryName}`);
    return enrichedData;
  } catch (error) {
    console.error(`❌ Error researching ${industryName}:`, error);
    return null;
  }
}

async function enrichCompetitorData(competitorName, industry) {
  console.log(`\n🔍 Researching competitor ${competitorName}...`);
  
  const prompt = `Research ${competitorName}, a competitor in the ${industry} industry, and provide detailed information in JSON format:

{
  "name": "${competitorName}",
  "description": "2-3 sentence company description",
  "website": "Official website URL",
  "founded": "Year founded",
  "headquarters": "City, State/Country",
  "employees": "Number of employees",
  "revenue": "Annual revenue",
  "marketShare": "Market share percentage",
  "keyProducts": ["Product 1", "Product 2", "Product 3"],
  "targetMarkets": ["Market 1", "Market 2"],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "pricingModel": "Pricing model description",
  "competitiveAdvantage": "Main competitive advantage",
  "threatLevel": "high|medium|low",
  "recentNews": [
    {
      "title": "News headline",
      "date": "2024-01-15",
      "summary": "Brief summary"
    }
  ]
}

Focus on competitive intelligence and recent developments.`;

  try {
    const response = await callPerplexityAPI(prompt);
    if (!response) {
      console.log(`⚠️ No response from Perplexity for ${competitorName}`);
      return null;
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`⚠️ No JSON found in response for ${competitorName}`);
      return null;
    }

    const enrichedData = JSON.parse(jsonMatch[0]);
    console.log(`✅ Successfully researched ${competitorName}`);
    return enrichedData;
  } catch (error) {
    console.error(`❌ Error researching ${competitorName}:`, error);
    return null;
  }
}

async function updateIndustryInDatabase(industryName, enrichedData) {
  try {
    await prisma.industries.upsert({
      where: { name: industryName },
      update: {
        description: enrichedData.description,
        marketSize: enrichedData.marketSize,
        growthRate: enrichedData.growthRate,
        keyTrends: enrichedData.keyTrends || [],
        painPoints: enrichedData.painPoints || [],
        opportunities: enrichedData.opportunities || [],
        regulations: enrichedData.regulations || [],
        technologyAdoption: enrichedData.technologyAdoption,
        seasonality: enrichedData.seasonality,
        buyingProcess: enrichedData.buyingProcess,
        decisionMakers: enrichedData.decisionMakers || [],
        salesCycle: enrichedData.salesCycle,
        budgetTiming: enrichedData.budgetTiming,
        competitiveLandscape: enrichedData.competitiveLandscape,
        updatedAt: new Date()
      },
      create: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        name: industryName,
        code: industryName.toLowerCase().replace(/\s+/g, '_'),
        description: enrichedData.description,
        marketSize: enrichedData.marketSize,
        growthRate: enrichedData.growthRate,
        keyTrends: enrichedData.keyTrends || [],
        painPoints: enrichedData.painPoints || [],
        opportunities: enrichedData.opportunities || [],
        regulations: enrichedData.regulations || [],
        technologyAdoption: enrichedData.technologyAdoption,
        seasonality: enrichedData.seasonality,
        buyingProcess: enrichedData.buyingProcess,
        decisionMakers: enrichedData.decisionMakers || [],
        salesCycle: enrichedData.salesCycle,
        budgetTiming: enrichedData.budgetTiming,
        competitiveLandscape: enrichedData.competitiveLandscape
      }
    });

    console.log(`✅ Updated industry record for ${industryName}`);
  } catch (error) {
    console.error(`❌ Error updating industry ${industryName}:`, error);
  }
}

async function updateCompetitorInDatabase(competitorName, enrichedData) {
  try {
    await prisma.competitors.upsert({
      where: { name: competitorName },
      update: {
        description: enrichedData.description,
        website: enrichedData.website,
        founded: enrichedData.founded ? parseInt(enrichedData.founded) : null,
        headquarters: enrichedData.headquarters,
        employees: enrichedData.employees,
        revenue: enrichedData.revenue,
        marketShare: enrichedData.marketShare,
        keyProducts: enrichedData.keyProducts || [],
        targetMarkets: enrichedData.targetMarkets || [],
        strengths: enrichedData.strengths || [],
        weaknesses: enrichedData.weaknesses || [],
        pricingModel: enrichedData.pricingModel,
        competitiveAdvantage: enrichedData.competitiveAdvantage,
        threatLevel: enrichedData.threatLevel || 'medium',
        updatedAt: new Date()
      },
      create: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        name: competitorName,
        description: enrichedData.description,
        website: enrichedData.website,
        founded: enrichedData.founded ? parseInt(enrichedData.founded) : null,
        headquarters: enrichedData.headquarters,
        employees: enrichedData.employees,
        revenue: enrichedData.revenue,
        marketShare: enrichedData.marketShare,
        keyProducts: enrichedData.keyProducts || [],
        targetMarkets: enrichedData.targetMarkets || [],
        strengths: enrichedData.strengths || [],
        weaknesses: enrichedData.weaknesses || [],
        pricingModel: enrichedData.pricingModel,
        competitiveAdvantage: enrichedData.competitiveAdvantage,
        threatLevel: enrichedData.threatLevel || 'medium'
      }
    });

    console.log(`✅ Updated competitor record for ${competitorName}`);
  } catch (error) {
    console.error(`❌ Error updating competitor ${competitorName}:`, error);
  }
}

async function enrichIndustryAndCompetitors() {
  try {
    console.log('🚀 Starting industry and competitor enrichment with Perplexity AI...');
    
    // Get unique industries from companies
    const industries = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        deletedAt: null,
        industry: { not: null }
      },
      select: { industry: true },
      distinct: ['industry']
    });

    console.log(`📊 Found ${industries.length} unique industries to research`);

    // Research each industry
    for (let i = 0; i < industries.length; i++) {
      const industry = industries[i];
      console.log(`\n📈 Industry Progress: ${i + 1}/${industries.length}`);
      
      try {
        const enrichedData = await enrichIndustryData(industry.industry);
        
        if (enrichedData) {
          await updateIndustryInDatabase(industry.industry, enrichedData);
        }
        
        // Rate limiting
        if (i < industries.length - 1) {
          console.log('⏳ Waiting 2 seconds to avoid rate limits...');
          await delay(2000);
        }
      } catch (error) {
        console.error(`❌ Error processing industry ${industry.industry}:`, error);
      }
    }

    // Get competitors from existing data and research them
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        deletedAt: null,
        customFields: { not: null }
      },
      select: {
        name: true,
        industry: true,
        customFields: true
      },
      take: 10 // Start with 10 companies
    });

    const allCompetitors = new Set();
    
    // Extract competitors from company customFields
    companies.forEach(company => {
      if (company.customFields && company.customFields.competitors) {
        company.customFields.competitors.forEach(competitor => {
          allCompetitors.add(competitor);
        });
      }
    });

    console.log(`📊 Found ${allCompetitors.size} unique competitors to research`);

    // Research each competitor
    let competitorIndex = 0;
    for (const competitorName of allCompetitors) {
      competitorIndex++;
      console.log(`\n📈 Competitor Progress: ${competitorIndex}/${allCompetitors.size}`);
      
      try {
        // Find the industry for this competitor
        const companyWithCompetitor = companies.find(c => 
          c.customFields && 
          c.customFields.competitors && 
          c.customFields.competitors.includes(competitorName)
        );
        
        const industry = companyWithCompetitor?.industry || 'Technology';
        
        const enrichedData = await enrichCompetitorData(competitorName, industry);
        
        if (enrichedData) {
          await updateCompetitorInDatabase(competitorName, enrichedData);
        }
        
        // Rate limiting
        if (competitorIndex < allCompetitors.size) {
          console.log('⏳ Waiting 2 seconds to avoid rate limits...');
          await delay(2000);
        }
      } catch (error) {
        console.error(`❌ Error processing competitor ${competitorName}:`, error);
      }
    }

    console.log(`\n🎉 Industry and competitor enrichment complete!`);
    
  } catch (error) {
    console.error('❌ Error in enrichment process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
enrichIndustryAndCompetitors();
