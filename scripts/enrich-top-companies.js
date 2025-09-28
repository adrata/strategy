const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2/company_multi_source/enrich';

// Rate limiting configuration
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay between requests
const BATCH_SIZE = 10; // Process in batches of 10

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichCompanyWithCoreSignal(company) {
  try {
    console.log(`\n🔍 Enriching: ${company.name} (${company.website})`);
    
    const url = `${CORESIGNAL_BASE_URL}?website=${encodeURIComponent(company.website)}`;
    const headers = {
      "Content-Type": "application/json",
      "apikey": CORESIGNAL_API_KEY
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.company_name) {
      console.log(`❌ No data found for ${company.name}`);
      return { success: false, reason: 'No data found' };
    }

    // The /enrich endpoint returns a single object, not an array
    const companyData = data;
    
    console.log(`✅ Found data for ${company.name}: ${companyData.employees_count || 'Unknown'} employees`);
    
    // Map CoreSignal data to our database schema
    const mappedData = {
      // Basic company info
      name: companyData.company_name || company.name,
      industry: companyData.industry || company.industry,
      sector: companyData.sector || company.sector,
      size: companyData.size || company.size,
      employeeCount: companyData.employees_count ? parseInt(companyData.employees_count) : company.employeeCount,
      foundedYear: companyData.founded_year ? parseInt(companyData.founded_year) : company.foundedYear,
      description: companyData.description || company.description,
      descriptionEnriched: companyData.description || company.description,
      
      // Website and social
      website: companyData.website || company.website,
      linkedinUrl: companyData.linkedin_url || company.linkedinUrl,
      linkedinFollowers: companyData.followers_count_linkedin ? parseInt(companyData.followers_count_linkedin) : company.linkedinFollowers,
      
      // Location data
      hqLocation: companyData.hq_location || company.hqLocation,
      hqCity: companyData.hq_city || company.hqCity,
      hqState: companyData.hq_state || company.hqState,
      hqStreet: companyData.hq_street || company.hqStreet,
      hqZipcode: companyData.hq_zipcode || company.hqZipcode,
      hqRegion: companyData.hq_region || company.hqRegion,
      hqCountryIso2: companyData.hq_country_iso2 || company.hqCountryIso2,
      hqCountryIso3: companyData.hq_country_iso3 || company.hqCountryIso3,
      
      // Company status
      isPublic: companyData.is_public || company.isPublic,
      stockSymbol: companyData.stock_symbol || company.stockSymbol,
      
      // Social media
      twitterFollowers: companyData.followers_count_twitter ? parseInt(companyData.followers_count_twitter) : company.twitterFollowers,
      owlerFollowers: companyData.followers_count_owler ? parseInt(companyData.followers_count_owler) : company.owlerFollowers,
      
      // Technologies and competitors
      technologiesUsed: companyData.technologies_used ? 
        companyData.technologies_used.map(tech => 
          typeof tech === 'object' ? tech.technology : tech
        ) : company.technologiesUsed || [],
      competitors: companyData.competitors ? 
        companyData.competitors.map(comp => 
          typeof comp === 'object' ? comp.company_name : comp
        ) : company.competitors || [],
      
      // Company updates
      companyUpdates: companyData.company_updates || company.companyUpdates || [],
      numTechnologiesUsed: companyData.technologies_used ? companyData.technologies_used.length : company.numTechnologiesUsed,
      
      // Additional fields
      domain: companyData.domain || company.domain,
      logoUrl: companyData.logo_url || company.logoUrl,
      descriptionMetadataRaw: companyData.description_metadata_raw || company.descriptionMetadataRaw,
      
      // Job postings
      activeJobPostings: companyData.active_job_postings ? 
        (Array.isArray(companyData.active_job_postings) ? 
          companyData.active_job_postings.length : 
          parseInt(companyData.active_job_postings)) : company.activeJobPostings,
      
      // Social media URLs - handle arrays by taking first element or null
      facebookUrl: companyData.facebook_url && Array.isArray(companyData.facebook_url) && companyData.facebook_url.length > 0 ? companyData.facebook_url[0] : 
                   companyData.facebook_url && !Array.isArray(companyData.facebook_url) ? companyData.facebook_url : null,
      twitterUrl: companyData.twitter_url && Array.isArray(companyData.twitter_url) && companyData.twitter_url.length > 0 ? companyData.twitter_url[0] : 
                  companyData.twitter_url && !Array.isArray(companyData.twitter_url) ? companyData.twitter_url : null,
      youtubeUrl: companyData.youtube_url && Array.isArray(companyData.youtube_url) && companyData.youtube_url.length > 0 ? companyData.youtube_url[0] : 
                  companyData.youtube_url && !Array.isArray(companyData.youtube_url) ? companyData.youtube_url : null,
      instagramUrl: companyData.instagram_url && Array.isArray(companyData.instagram_url) && companyData.instagram_url.length > 0 ? companyData.instagram_url[0] : 
                    companyData.instagram_url && !Array.isArray(companyData.instagram_url) ? companyData.instagram_url : null,
      
      // NAICS and SIC codes
      naicsCodes: companyData.naics_codes || company.naicsCodes || [],
      sicCodes: companyData.sic_codes || company.sicCodes || []
    };

    // Update the company in the database
    await prisma.companies.update({
      where: { id: company.id },
      data: mappedData
    });

    console.log(`✅ Successfully enriched ${company.name}`);
    return { success: true, data: companyData };

  } catch (error) {
    console.error(`❌ Error enriching ${company.name}:`, error.message);
    return { success: false, reason: error.message };
  }
}

async function enrichTopCompanies() {
  try {
    console.log('🚀 Starting TOP Companies Enrichment with CoreSignal API');
    console.log('=' .repeat(60));
    
    // Get all companies in TOP workspace that have websites
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
        deletedAt: null,
        website: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        sector: true,
        size: true,
        employeeCount: true,
        foundedYear: true,
        description: true,
        descriptionEnriched: true,
        linkedinUrl: true,
        linkedinFollowers: true,
        hqLocation: true,
        hqCity: true,
        hqState: true,
        hqStreet: true,
        hqZipcode: true,
        hqRegion: true,
        hqCountryIso2: true,
        hqCountryIso3: true,
        isPublic: true,
        stockSymbol: true,
        twitterFollowers: true,
        owlerFollowers: true,
        technologiesUsed: true,
        competitors: true,
        companyUpdates: true,
        numTechnologiesUsed: true,
        domain: true,
        logoUrl: true,
        descriptionMetadataRaw: true,
        activeJobPostings: true,
        facebookUrl: true,
        twitterUrl: true,
        youtubeUrl: true,
        instagramUrl: true,
        naicsCodes: true,
        sicCodes: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${companies.length} companies with websites to enrich`);
    
    // Filter out companies that are already fully enriched
    const companiesToEnrich = companies.filter(company => {
      // Check if company is already fully enriched
      const hasEnrichedDescription = company.descriptionEnriched && company.descriptionEnriched.length > 100;
      const hasCompanyUpdates = company.companyUpdates && company.companyUpdates.length > 50;
      const hasTechnologies = company.technologiesUsed && company.technologiesUsed.length > 100;
      const hasCompetitors = company.competitors && company.competitors.length > 10;
      const hasHQLocation = company.hqLocation && company.hqLocation.trim() !== '';
      const hasPublicStatus = company.isPublic !== null;
      const hasHighLinkedInFollowers = company.linkedinFollowers && company.linkedinFollowers > 1000;
      
      // Company is considered fully enriched if it has most of these indicators
      const isFullyEnriched = hasEnrichedDescription && 
                              hasCompanyUpdates && 
                              hasTechnologies && 
                              hasCompetitors && 
                              hasHQLocation && 
                              hasPublicStatus;
      
      if (isFullyEnriched) {
        console.log(`⏭️  Skipping ${company.name} - already fully enriched`);
        return false;
      }
      
      return true;
    });

    console.log(`🎯 ${companiesToEnrich.length} companies need enrichment (${companies.length - companiesToEnrich.length} already enriched)`);
    
    if (companiesToEnrich.length === 0) {
      console.log('✅ All companies are already fully enriched!');
      return;
    }

    // Process companies in batches
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Process all companies that need enrichment
    console.log(`🚀 Processing all ${companiesToEnrich.length} companies that need enrichment`);
    
    for (let i = 0; i < companiesToEnrich.length; i += BATCH_SIZE) {
      const batch = companiesToEnrich.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(companiesToEnrich.length / BATCH_SIZE)}`);
      
      for (const company of batch) {
        const result = await enrichCompanyWithCoreSignal(company);
        
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            company: company.name,
            error: result.reason
          });
        }
        
        // Rate limiting - delay between requests
        await delay(DELAY_BETWEEN_REQUESTS);
      }
      
      // Longer delay between batches
      if (i + BATCH_SIZE < companiesToEnrich.length) {
        console.log(`⏳ Waiting 5 seconds before next batch...`);
        await delay(5000);
      }
    }

    // Final results
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENRICHMENT COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully enriched: ${results.successful} companies`);
    console.log(`❌ Failed to enrich: ${results.failed} companies`);
    console.log(`⏭️  Skipped (already enriched): ${companies.length - companiesToEnrich.length} companies`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(error => {
        console.log(`  - ${error.company}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 TOP Companies enrichment process completed!');

  } catch (error) {
    console.error('💥 Fatal error during enrichment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
enrichTopCompanies();
