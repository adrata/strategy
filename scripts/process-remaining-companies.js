const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v1/linkedin/company';

async function enrichCompanyWithCoreSignal(company) {
  try {
    console.log(`🔍 Enriching: ${company.name}`);
    
    // Extract domain from website
    let domain = null;
    if (company.website) {
      try {
        const url = new URL(company.website);
        domain = url.hostname.replace('www.', '');
      } catch (e) {
        // If URL parsing fails, try to extract domain manually
        const match = company.website.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
        if (match) {
          domain = match[1];
        }
      }
    }

    if (!domain) {
      console.log(`❌ No domain found for ${company.name}`);
      return {
        success: false,
        error: 'No domain found'
      };
    }

    console.log(`🌐 Using domain: ${domain}`);

    // Search for company in CoreSignal
    const searchResponse = await axios.get(`${CORESIGNAL_BASE_URL}/search`, {
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: company.name,
        limit: 5
      }
    });

    if (!searchResponse.data || !searchResponse.data.length) {
      console.log(`❌ No CoreSignal results for ${company.name}`);
      return {
        success: false,
        error: 'No CoreSignal results found'
      };
    }

    // Find best match
    let bestMatch = null;
    let bestScore = 0;

    for (const result of searchResponse.data) {
      const resultDomain = result.domain?.toLowerCase();
      const resultName = result.name?.toLowerCase();
      const companyName = company.name.toLowerCase();
      
      let score = 0;
      
      // Exact domain match gets highest score
      if (resultDomain === domain.toLowerCase()) {
        score += 100;
      }
      
      // Name similarity
      if (resultName && companyName) {
        const nameWords = companyName.split(/\s+/);
        const resultWords = resultName.split(/\s+/);
        const commonWords = nameWords.filter(word => 
          resultWords.some(rWord => rWord.includes(word) || word.includes(rWord))
        );
        score += (commonWords.length / nameWords.length) * 50;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }
    }

    if (!bestMatch || bestScore < 30) {
      console.log(`❌ No good match found for ${company.name} (best score: ${bestScore})`);
      return {
        success: false,
        error: `No good match found (score: ${bestScore})`
      };
    }

    console.log(`✅ Found match: ${bestMatch.name} (score: ${bestScore})`);

    // Get detailed company data
    const detailResponse = await axios.get(`${CORESIGNAL_BASE_URL}/${bestMatch.id}`, {
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const coresignalData = detailResponse.data;

    // Update company with CoreSignal data
    const updateData = {
      customFields: {
        coresignalData: coresignalData,
        lastEnrichedAt: new Date().toISOString(),
        enrichmentSource: 'coresignal',
        enrichmentScore: bestScore
      }
    };

    // Add LinkedIn URL if available
    if (coresignalData.linkedin_url) {
      updateData.linkedinUrl = coresignalData.linkedin_url;
    }

    // Add description if available
    if (coresignalData.description) {
      updateData.description = coresignalData.description;
    }

    await prisma.companies.update({
      where: { id: company.id },
      data: updateData
    });

    console.log(`✅ Successfully enriched ${company.name}`);
    return {
      success: true,
      data: coresignalData
    };

  } catch (error) {
    console.error(`❌ Error enriching ${company.name}:`, error.message);
    
    // Store error in customFields
    await prisma.companies.update({
      where: { id: company.id },
      data: {
        customFields: {
          enrichmentError: error.message,
          lastEnrichedAt: new Date().toISOString(),
          enrichmentSource: 'coresignal'
        }
      }
    });

    return {
      success: false,
      error: error.message
    };
  }
}

async function processRemainingCompanies() {
  try {
    console.log('🚀 PROCESSING REMAINING COMPANIES');
    console.log('==================================');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get all companies and filter for those without customFields
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId
      },
      select: {
        id: true,
        name: true,
        website: true,
        customFields: true
      }
    });

    // Filter for companies without customFields or with empty customFields
    const remainingCompanies = allCompanies.filter(company => 
      !company.customFields || 
      Object.keys(company.customFields).length === 0 ||
      !company.customFields.coresignalData
    );

    console.log(`📊 Found ${remainingCompanies.length} companies without customFields`);
    
    if (remainingCompanies.length === 0) {
      console.log('✅ All companies already have customFields!');
      return;
    }

    // Process in batches of 50
    const batchSize = 50;
    const totalBatches = Math.ceil(remainingCompanies.length / batchSize);
    
    console.log(`📦 Processing ${totalBatches} batches of ${batchSize} companies each`);
    
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
      const startIdx = (batchNum - 1) * batchSize;
      const endIdx = Math.min(startIdx + batchSize, remainingCompanies.length);
      const batch = remainingCompanies.slice(startIdx, endIdx);
      
      console.log(`\n🔄 BATCH ${batchNum}/${totalBatches} (${batch.length} companies)`);
      console.log('='.repeat(50));
      
      let batchSuccess = 0;
      let batchErrors = 0;
      
      for (let i = 0; i < batch.length; i++) {
        const company = batch[i];
        console.log(`\n[${batchNum}.${i+1}/${batch.length}] Processing: ${company.name}`);
        
        const result = await enrichCompanyWithCoreSignal(company);
        
        if (result.success) {
          batchSuccess++;
          totalSuccess++;
        } else {
          batchErrors++;
          totalErrors++;
        }
        
        totalProcessed++;
        
        // Add delay between requests to avoid rate limiting
        if (i < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`\n📊 BATCH ${batchNum} COMPLETE:`);
      console.log(`   ✅ Success: ${batchSuccess}`);
      console.log(`   ❌ Errors: ${batchErrors}`);
      console.log(`   📈 Progress: ${totalProcessed}/${remainingCompanies.length} (${Math.round((totalProcessed/remainingCompanies.length)*100)}%)`);
      
      // Add delay between batches
      if (batchNum < totalBatches) {
        console.log(`\n⏳ Waiting 5 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`\n🎉 ALL BATCHES COMPLETE!`);
    console.log(`📊 FINAL STATISTICS:`);
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   ✅ Successful: ${totalSuccess}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log(`   📈 Success rate: ${Math.round((totalSuccess/totalProcessed)*100)}%`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

processRemainingCompanies();
