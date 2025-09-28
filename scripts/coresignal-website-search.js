const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY,
  baseUrl: 'https://api.coresignal.com/cdapi/v2'
};

class CoreSignalWebsiteSearch {
  constructor() {
    this.config = CORESIGNAL_CONFIG;
  }

  async makeApiRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${parsedData.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async searchCompanyByWebsite(website) {
    console.log(`🔍 SEARCHING FOR COMPANY BY WEBSITE: ${website}`);
    console.log('===============================================\n');
    
    try {
      // Clean and normalize the website
      const normalizedWebsite = this.normalizeWebsite(website);
      console.log(`📊 Normalized website: ${normalizedWebsite}`);
      
      // Search for company by website/domain
      const searchQuery = {
        query: {
          bool: {
            should: [
              { match: { website: normalizedWebsite } },
              { match: { domain: normalizedWebsite } },
              { wildcard: { website: `*${normalizedWebsite}*` } },
              { wildcard: { domain: `*${normalizedWebsite}*` } }
            ],
            minimum_should_match: 1
          }
        }
      };
      
      console.log('🔍 Searching CoreSignal API...');
      const searchUrl = `${this.config.baseUrl}/company_multi_source/search/es_dsl`;
      const searchResults = await this.makeApiRequest(searchUrl, 'POST', searchQuery);
      
      if (!searchResults || searchResults.length === 0) {
        console.log('❌ No companies found for this website');
        return null;
      }
      
      console.log(`✅ Found ${searchResults.length} potential matches`);
      
      // Get detailed information for each result
      const companies = [];
      for (let i = 0; i < Math.min(searchResults.length, 5); i++) {
        const companyId = searchResults[i];
        console.log(`\n🔍 Getting details for company ${i + 1}/${Math.min(searchResults.length, 5)} (ID: ${companyId})...`);
        
        const companyDetails = await this.getCompanyDetails(companyId);
        if (companyDetails) {
          companies.push(companyDetails);
          console.log(`   📊 Company: ${companyDetails.company_name}`);
          console.log(`   📊 Website: ${companyDetails.website}`);
          console.log(`   📊 Domain: ${companyDetails.domain}`);
          console.log(`   📊 Industry: ${companyDetails.industry}`);
        }
      }
      
      return companies;
      
    } catch (error) {
      console.log(`❌ Website search failed: ${error.message}`);
      return null;
    }
  }

  async enrichCompanyByWebsite(website, workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP') {
    console.log(`🎯 ENRICHING COMPANY BY WEBSITE: ${website}`);
    console.log('===============================================\n');
    
    try {
      // Search for company
      const companies = await this.searchCompanyByWebsite(website);
      
      if (!companies || companies.length === 0) {
        console.log('❌ No companies found for this website');
        return null;
      }
      
      // Find the best match
      const bestMatch = this.findBestMatch(companies, website);
      console.log(`\n🎯 Best match: ${bestMatch.company_name}`);
      
      // Check if company already exists in database
      const existingCompany = await this.findExistingCompany(bestMatch, workspaceId);
      
      if (existingCompany) {
        console.log(`✅ Company already exists: ${existingCompany.name} (ID: ${existingCompany.id})`);
        console.log('🔄 Updating with enriched data...');
        return await this.updateCompanyWithEnrichedData(existingCompany.id, bestMatch);
      } else {
        console.log('🆕 Creating new company record...');
        return await this.createCompanyWithEnrichedData(bestMatch, workspaceId);
      }
      
    } catch (error) {
      console.log(`❌ Enrichment failed: ${error.message}`);
      return null;
    }
  }

  async getCompanyDetails(companyId) {
    try {
      const url = `${this.config.baseUrl}/company_multi_source/collect/${companyId}`;
      const response = await this.makeApiRequest(url, 'GET');
      return response;
    } catch (error) {
      console.log(`   ❌ Failed to get company details: ${error.message}`);
      return null;
    }
  }

  normalizeWebsite(website) {
    // Remove protocol
    let normalized = website.replace(/^https?:\/\//, '');
    
    // Remove www
    normalized = normalized.replace(/^www\./, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Remove path if present
    normalized = normalized.split('/')[0];
    
    return normalized;
  }

  findBestMatch(companies, website) {
    const normalizedWebsite = this.normalizeWebsite(website);
    
    // Score each company based on website match
    const scoredCompanies = companies.map(company => {
      let score = 0;
      
      // Exact website match
      if (company.website && this.normalizeWebsite(company.website) === normalizedWebsite) {
        score += 100;
      }
      
      // Exact domain match
      if (company.domain && company.domain === normalizedWebsite) {
        score += 100;
      }
      
      // Partial website match
      if (company.website && this.normalizeWebsite(company.website).includes(normalizedWebsite)) {
        score += 50;
      }
      
      // Partial domain match
      if (company.domain && company.domain.includes(normalizedWebsite)) {
        score += 50;
      }
      
      return { company, score };
    });
    
    // Sort by score and return best match
    scoredCompanies.sort((a, b) => b.score - a.score);
    return scoredCompanies[0].company;
  }

  async findExistingCompany(coresignalData, workspaceId) {
    const normalizedWebsite = this.normalizeWebsite(coresignalData.website || '');
    const normalizedDomain = coresignalData.domain || '';
    
    // Search by website
    let existingCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: workspaceId,
        website: {
          contains: normalizedWebsite,
          mode: 'insensitive'
        }
      }
    });
    
    // Search by domain if not found
    if (!existingCompany && normalizedDomain) {
      existingCompany = await prisma.companies.findFirst({
        where: {
          workspaceId: workspaceId,
          OR: [
            { website: { contains: normalizedDomain, mode: 'insensitive' } },
            { domain: { contains: normalizedDomain, mode: 'insensitive' } }
          ]
        }
      });
    }
    
    // Search by company name as fallback
    if (!existingCompany) {
      existingCompany = await prisma.companies.findFirst({
        where: {
          workspaceId: workspaceId,
          name: {
            contains: coresignalData.company_name,
            mode: 'insensitive'
          }
        }
      });
    }
    
    return existingCompany;
  }

  async updateCompanyWithEnrichedData(companyId, coresignalData) {
    try {
      const enrichedData = this.mapCoreSignalToDatabase(coresignalData);
      
      const updatedCompany = await prisma.companies.update({
        where: { id: companyId },
        data: {
          ...enrichedData,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Company successfully updated with enriched data!');
      this.displayEnrichmentSummary(updatedCompany);
      
      return updatedCompany;
      
    } catch (error) {
      console.log(`❌ Update failed: ${error.message}`);
      return null;
    }
  }

  async createCompanyWithEnrichedData(coresignalData, workspaceId) {
    try {
      const enrichedData = this.mapCoreSignalToDatabase(coresignalData);
      
      const newCompany = await prisma.companies.create({
        data: {
          ...enrichedData,
          workspaceId: workspaceId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Company successfully created with enriched data!');
      this.displayEnrichmentSummary(newCompany);
      
      return newCompany;
      
    } catch (error) {
      console.log(`❌ Creation failed: ${error.message}`);
      return null;
    }
  }

  mapCoreSignalToDatabase(coresignalData) {
    return {
      // Basic Information
      name: coresignalData.company_name || 'Unknown Company',
      legalName: coresignalData.legal_name,
      tradingName: coresignalData.trading_name,
      localName: coresignalData.local_name,
      website: coresignalData.website,
      email: coresignalData.email,
      phone: coresignalData.phone,
      fax: coresignalData.fax,
      
      // Location Information
      address: coresignalData.address,
      city: coresignalData.city,
      state: coresignalData.state,
      country: coresignalData.country,
      postalCode: coresignalData.postal_code,
      
      // Business Information
      industry: coresignalData.industry,
      sector: coresignalData.sector,
      size: coresignalData.size_range,
      employeeCount: coresignalData.employees_count ? parseInt(coresignalData.employees_count) : null,
      foundedYear: coresignalData.founded_year ? parseInt(coresignalData.founded_year) : null,
      currency: coresignalData.currency || 'USD',
      description: coresignalData.description,
      
      // Intelligence Fields - Overview
      linkedinUrl: coresignalData.linkedin_url,
      linkedinFollowers: coresignalData.linkedin_followers || coresignalData.followers_count_linkedin ? parseInt(coresignalData.linkedin_followers || coresignalData.followers_count_linkedin) : null,
      activeJobPostings: Array.isArray(coresignalData.active_job_postings) ? coresignalData.active_job_postings.length : (coresignalData.active_job_postings ? parseInt(coresignalData.active_job_postings) : null),
      
      // Intelligence Fields - Industry Classification
      naicsCodes: coresignalData.naics_codes || [],
      sicCodes: coresignalData.sic_codes || [],
      
      // Intelligence Fields - Social Media
      facebookUrl: Array.isArray(coresignalData.facebook_url) ? null : (coresignalData.facebook_url || null),
      twitterUrl: Array.isArray(coresignalData.twitter_url) ? null : (coresignalData.twitter_url || null),
      instagramUrl: Array.isArray(coresignalData.instagram_url) ? null : (coresignalData.instagram_url || null),
      youtubeUrl: Array.isArray(coresignalData.youtube_url) ? null : (coresignalData.youtube_url || null),
      githubUrl: Array.isArray(coresignalData.github_url) ? null : (coresignalData.github_url || null),
      
      // Intelligence Fields - Business Intelligence
      technologiesUsed: coresignalData.technologies_used || [],
      competitors: coresignalData.competitors || [],
      
      // Business Intelligence Tags
      tags: coresignalData.categories_and_keywords || [],
      
      // CoreSignal Enrichment Fields - Company Status
      isPublic: coresignalData.is_public,
      stockSymbol: coresignalData.stock_ticker?.[0]?.ticker,
      logoUrl: coresignalData.company_logo_url,
      
      // CoreSignal Enrichment Fields - Domain and Website
      domain: coresignalData.domain,
      
      // CoreSignal Enrichment Fields - Headquarters Location
      hqLocation: coresignalData.hq_location,
      hqFullAddress: coresignalData.hq_full_address,
      hqCity: coresignalData.hq_city,
      hqState: coresignalData.hq_state,
      hqStreet: coresignalData.hq_street,
      hqZipcode: coresignalData.hq_zipcode,
      
      // CoreSignal Enrichment Fields - Social Media Followers
      twitterFollowers: coresignalData.followers_count_twitter ? parseInt(coresignalData.followers_count_twitter) : null,
      owlerFollowers: coresignalData.followers_count_owler ? parseInt(coresignalData.followers_count_owler) : null,
      
      // CoreSignal Enrichment Fields - Company Updates and Activity
      companyUpdates: coresignalData.company_updates,
      numTechnologiesUsed: coresignalData.num_technologies_used ? parseInt(coresignalData.num_technologies_used) : (coresignalData.technologies_used?.length || 0),
      
      // CoreSignal Enrichment Fields - Enhanced Descriptions
      descriptionEnriched: coresignalData.description_enriched,
      descriptionMetadataRaw: coresignalData.description_metadata_raw,
      
      // CoreSignal Enrichment Fields - Regional Information
      hqRegion: coresignalData.hq_region || [],
      hqCountryIso2: coresignalData.hq_country_iso2,
      hqCountryIso3: coresignalData.hq_country_iso3
    };
  }

  displayEnrichmentSummary(company) {
    console.log('\n📊 ENRICHED DATA SUMMARY:');
    console.log('==========================');
    console.log(`📊 Company Name: ${company.name}`);
    console.log(`📊 Legal Name: ${company.legalName || 'N/A'}`);
    console.log(`📊 Website: ${company.website || 'N/A'}`);
    console.log(`📊 Domain: ${company.domain || 'N/A'}`);
    console.log(`📊 Industry: ${company.industry || 'N/A'}`);
    console.log(`📊 Sector: ${company.sector || 'N/A'}`);
    console.log(`📊 Size: ${company.size || 'N/A'}`);
    console.log(`📊 Employee Count: ${company.employeeCount || 'N/A'}`);
    console.log(`📊 Founded Year: ${company.foundedYear || 'N/A'}`);
    console.log(`📊 LinkedIn URL: ${company.linkedinUrl || 'N/A'}`);
    console.log(`📊 LinkedIn Followers: ${company.linkedinFollowers || 'N/A'}`);
    console.log(`📊 NAICS Codes: ${company.naicsCodes?.join(', ') || 'N/A'}`);
    console.log(`📊 SIC Codes: ${company.sicCodes?.join(', ') || 'N/A'}`);
    console.log(`📊 Technologies Used: ${company.technologiesUsed?.length || 0} technologies`);
    console.log(`📊 Tags: ${company.tags?.length || 0} tags`);
    console.log(`📊 Is Public: ${company.isPublic || false}`);
    console.log(`📊 Stock Symbol: ${company.stockSymbol || 'N/A'}`);
    console.log(`📊 Logo URL: ${company.logoUrl || 'N/A'}`);
    console.log(`📊 HQ Location: ${company.hqLocation || 'N/A'}`);
    console.log(`📊 Twitter Followers: ${company.twitterFollowers || 'N/A'}`);
    console.log(`📊 Owler Followers: ${company.owlerFollowers || 'N/A'}`);
    console.log(`📊 Company Updates: ${company.companyUpdates ? 'Available' : 'N/A'}`);
    console.log(`📊 Num Technologies: ${company.numTechnologiesUsed || 0}`);
    console.log(`📊 HQ Region: ${company.hqRegion?.join(', ') || 'N/A'}`);
    
    console.log('\n🎯 ENRICHMENT COMPLETE!');
    console.log('=======================');
    console.log('✅ Company data enriched with CoreSignal intelligence');
    console.log('✅ LinkedIn profile connected');
    console.log('✅ Industry classification updated');
    console.log('✅ Technology stack identified');
    console.log('✅ Business intelligence gathered');
    console.log('✅ Social media profiles linked');
    console.log('✅ Company description enhanced');
    console.log('✅ Business tags applied');
  }
}

// Example usage function
async function searchAndEnrichCompany(website) {
  const searchService = new CoreSignalWebsiteSearch();
  const result = await searchService.enrichCompanyByWebsite(website);
  await prisma.$disconnect();
  return result;
}

// Export for use in other scripts
module.exports = { CoreSignalWebsiteSearch, searchAndEnrichCompany };

// If running directly, use command line argument
if (require.main === module) {
  const website = process.argv[2];
  if (!website) {
    console.log('Usage: node coresignal-website-search.js <website>');
    console.log('Example: node coresignal-website-search.js https://www.microsoft.com');
    process.exit(1);
  }
  
  searchAndEnrichCompany(website);
}
