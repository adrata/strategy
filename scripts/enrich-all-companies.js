const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

class CoreSignalAPI {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.apiKey,
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
              reject(new Error(`CoreSignal API Error ${res.statusCode}: ${parsedData.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`CoreSignal JSON Parse Error: ${error.message}`));
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

  async searchCompany(query, searchField = "company_name") {
    const searchQuery = {
      query: {
        query_string: {
          query: query,
          default_field: searchField,
          default_operator: "and"
        }
      }
    };

    const url = `${this.baseUrl}/company_multi_source/search/es_dsl`;
    
    try {
      const response = await this.makeRequest(url, 'POST', searchQuery);
      
      if (Array.isArray(response) && response.length > 0) {
        // Return the first result's company_id
        return response[0].company_id || response[0];
      }
      return null;
    } catch (error) {
      console.error(`Error searching for company "${query}" in field "${searchField}":`, error.message);
      return null;
    }
  }

      async searchCompanyByDomain(domain) {
        // Try multiple search strategies for domain
        const searchStrategies = [
          { field: "website", query: domain },
          { field: "website", query: `*${domain}*` },
          { field: "company_name", query: domain },
          { field: "company_name", query: domain.split('.')[0] }, // Just the main part
        ];

        for (const strategy of searchStrategies) {
          const result = await this.searchCompany(strategy.query, strategy.field);
          if (result) {
            return result;
          }
        }

        return null;
      }

      async searchCompanyByName(companyName) {
        // Try multiple variations of company name
        const nameVariations = [
          companyName, // Full name
          companyName.replace(/,?\s+(LLC|Inc|Corp|Corporation|Ltd|Limited|Co|Company)$/i, ''), // Remove suffixes
          companyName.replace(/[.,]/g, ''), // Remove punctuation
          companyName.split(' ')[0], // First word only
          companyName.replace(/&/g, 'and'), // Replace & with and
          companyName.replace(/and/g, '&'), // Replace and with &
        ].filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

        for (const name of nameVariations) {
          if (name.trim().length > 2) { // Only search if name is meaningful
            const result = await this.searchCompany(name, "company_name");
            if (result) {
              return result;
            }
          }
        }

        return null;
      }

      async verifyCompanyMatch(companyId, expectedName, expectedWebsite) {
        try {
          const companyData = await this.getCompanyData(companyId);
          if (!companyData) return false;

          // Check if company name contains expected name (case insensitive)
          const nameMatch = companyData.company_name && 
            companyData.company_name.toLowerCase().includes(expectedName.toLowerCase());

          // Check if website matches (clean both domains)
          let websiteMatch = false;
          if (expectedWebsite && companyData.website) {
            const cleanExpected = expectedWebsite
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/.*$/, '')
              .toLowerCase();
            
            const cleanFound = companyData.website
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/.*$/, '')
              .toLowerCase();
            
            websiteMatch = cleanFound === cleanExpected;
          }

          return { nameMatch, websiteMatch, companyData };
        } catch (error) {
          return false;
        }
      }

  async getCompanyData(companyId) {
    const url = `${this.baseUrl}/company_multi_source/collect/${companyId}`;
    try {
      return await this.makeRequest(url);
    } catch (error) {
      console.error(`Error getting company data for ID ${companyId}:`, error.message);
      return null;
    }
  }
}

async function enrichAllCompanies() {
  console.log('🚀 ENRICHING ALL COMPANIES IN TOP WORKSPACE');
  console.log('===========================================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    if (!process.env.CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY not configured');
      return;
    }
    console.log('🔑 API Keys configured\n');

    const coresignal = new CoreSignalAPI();

    // Get all companies in TOP workspace that need enrichment
    // Prioritize companies with websites since they're more likely to be found in CoreSignal
    const companies = await prisma.$queryRawUnsafe(`
      SELECT id, name, website, description, size, industry
      FROM companies 
      WHERE "workspaceId" = $1 
        AND "deletedAt" IS NULL
        AND (description IS NULL OR size IS NULL OR "linkedinUrl" IS NULL)
      ORDER BY 
        CASE WHEN website IS NOT NULL AND website != '' THEN 0 ELSE 1 END,
        name
      LIMIT 3
    `, TOP_WORKSPACE_ID);

    console.log(`📊 Found ${companies.length} companies that need enrichment\n`);

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`\n🏢 [${i + 1}/${companies.length}] Processing: ${company.name}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   Current description: ${company.description ? 'Has description' : 'No description'}`);
      console.log(`   Current size: ${company.size || 'No size'}`);

      try {
        // Search CoreSignal using improved strategy
        console.log('   🔍 Searching CoreSignal...');
        let coresignalCompanyId = null;
        let searchMethod = '';
        
        // Strategy 1: Try company name search first (most reliable based on our tests)
        console.log('   🏢 Trying company name search...');
        coresignalCompanyId = await coresignal.searchCompanyByName(company.name);
        if (coresignalCompanyId) {
          searchMethod = 'company name';
          console.log(`   ✅ Found with company name search`);
        }
        
        // Strategy 2: Try domain search if name search fails
        if (!coresignalCompanyId && company.website) {
          console.log('   🌐 Trying domain search...');
          const cleanDomain = company.website
            .replace(/^https?:\/\//, '') // Remove protocol
            .replace(/^www\./, '') // Remove www
            .replace(/\/.*$/, '') // Remove path
            .toLowerCase();
          
          console.log(`   🌐 Searching for domain: "${cleanDomain}"`);
          coresignalCompanyId = await coresignal.searchCompanyByDomain(cleanDomain);
          if (coresignalCompanyId) {
            searchMethod = 'domain';
            console.log(`   ✅ Found with domain search`);
          }
        }
        
        // Strategy 3: Verify the match if we found something
        if (coresignalCompanyId) {
          console.log(`   🔍 Verifying match (found via ${searchMethod})...`);
          const verification = await coresignal.verifyCompanyMatch(coresignalCompanyId, company.name, company.website);
          
          if (verification && (verification.nameMatch || verification.websiteMatch)) {
            console.log(`   ✅ Match verified! Name match: ${verification.nameMatch}, Website match: ${verification.websiteMatch}`);
            console.log(`   📋 Found: ${verification.companyData.company_name}`);
            console.log(`   🌐 Website: ${verification.companyData.website}`);
          } else {
            console.log(`   ⚠️  Match verification failed, continuing anyway...`);
          }
        }

        if (!coresignalCompanyId) {
          console.log('   ❌ Not found in CoreSignal');
          results.push({
            company: company.name,
            status: 'not_found',
            error: 'Company not found in CoreSignal'
          });
          errorCount++;
          continue;
        }

        // Get CoreSignal data
        console.log('   📊 Getting CoreSignal data...');
        const coresignalData = await coresignal.getCompanyData(coresignalCompanyId);
        if (!coresignalData) {
          console.log('   ❌ Failed to retrieve CoreSignal data');
          results.push({
            company: company.name,
            status: 'api_error',
            error: 'Failed to retrieve CoreSignal data'
          });
          errorCount++;
          continue;
        }

        console.log('   ✅ CoreSignal data retrieved');

        // Update using raw SQL
        console.log('   💾 Updating database...');
        
        const updateQuery = `
          UPDATE companies 
          SET 
            description = COALESCE($1, description),
            website = COALESCE($2, website),
            size = COALESCE($3, size),
            city = COALESCE($4, city),
            state = COALESCE($5, state),
            country = COALESCE($6, country),
            address = COALESCE($7, address),
            phone = COALESCE($8, phone),
            email = COALESCE($9, email),
            industry = COALESCE($10, industry),
            account_type = COALESCE($11, account_type),
            linkedin_url = COALESCE($12, linkedin_url),
            founded_year = COALESCE($13, founded_year),
            employee_count = COALESCE($14, employee_count),
            active_job_postings = COALESCE($15, active_job_postings),
            linkedin_followers = COALESCE($16, linkedin_followers),
            naics_codes = COALESCE($17, naics_codes),
            sic_codes = COALESCE($18, sic_codes),
            facebook_url = COALESCE($19, facebook_url),
            twitter_url = COALESCE($20, twitter_url),
            instagram_url = COALESCE($21, instagram_url),
            youtube_url = COALESCE($22, youtube_url),
            github_url = COALESCE($23, github_url),
            technologies_used = COALESCE($24, technologies_used),
            competitors = COALESCE($25, competitors),
            revenue_currency = COALESCE($26, revenue_currency),
            last_funding_amount = COALESCE($27, last_funding_amount),
            last_funding_date = COALESCE($28, last_funding_date),
            custom_fields = COALESCE($29, custom_fields),
            updated_at = NOW()
          WHERE id = $30
        `;

        const technologiesUsed = coresignalData.technologies_used ? 
          coresignalData.technologies_used.map(t => t.technology || t) : [];
        const competitors = coresignalData.competitors ? 
          coresignalData.competitors.map(c => c.company_name || c) : [];

        const customFields = {
          coresignalData: coresignalData,
          enrichmentSource: 'CoreSignal',
          lastEnrichedAt: new Date().toISOString(),
          totalFields: Object.keys(coresignalData).length
        };

        await prisma.$executeRawUnsafe(updateQuery,
          coresignalData.description_enriched || null, // description
          coresignalData.website || null, // website
          coresignalData.size_range || null, // size
          coresignalData.hq_city || null, // city
          coresignalData.hq_state || null, // state
          coresignalData.hq_country || null, // country
          coresignalData.hq_full_address || null, // address
          coresignalData.company_phone_numbers?.[0] || null, // phone
          coresignalData.company_emails?.[0] || null, // email
          coresignalData.industry || null, // industry
          coresignalData.ownership_status || null, // account_type
          coresignalData.linkedin_url || null, // linkedin_url
          coresignalData.founded_year ? parseInt(coresignalData.founded_year) : null, // founded_year
          coresignalData.employees_count || null, // employee_count
          coresignalData.active_job_postings_count || null, // active_job_postings
          coresignalData.followers_count_linkedin || null, // linkedin_followers
          coresignalData.naics_codes || [], // naics_codes
          coresignalData.sic_codes || [], // sic_codes
          coresignalData.facebook_url?.[0] || null, // facebook_url
          coresignalData.twitter_url?.[0] || null, // twitter_url
          coresignalData.instagram_url?.[0] || null, // instagram_url
          coresignalData.youtube_url?.[0] || null, // youtube_url
          coresignalData.github_url?.[0] || null, // github_url
          technologiesUsed, // technologies_used
          competitors, // competitors
          coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency || null, // revenue_currency
          coresignalData.last_funding_round_amount_raised || null, // last_funding_amount
          coresignalData.last_funding_round_announced_date || null, // last_funding_date
          JSON.stringify(customFields), // custom_fields
          company.id // WHERE id
        );

        console.log('   ✅ Database updated successfully');
        
        results.push({
          company: company.name,
          status: 'success',
          coresignalId: coresignalCompanyId,
          fieldsUpdated: Object.keys(coresignalData).length
        });
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          company: company.name,
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 ENRICHMENT SUMMARY');
    console.log('=====================');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / companies.length) * 100).toFixed(1)}%`);

    console.log('\n📋 DETAILED RESULTS:');
    results.forEach((result, index) => {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.company} - ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.fieldsUpdated) {
        console.log(`   Fields updated: ${result.fieldsUpdated}`);
      }
    });

    console.log('\n🎉 ENRICHMENT COMPLETED!');
    console.log('========================');
    console.log('✅ CoreSignal integration working');
    console.log('✅ Database updated with rich company data');
    console.log('✅ Ready for rich Overview and Intelligence tabs');

  } catch (error) {
    console.error('❌ ENRICHMENT FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enrichAllCompanies();
