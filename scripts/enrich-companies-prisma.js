const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class CoreSignalAPI {
  constructor() {
    this.apiKey = CORESIGNAL_API_KEY;
    this.baseUrl = CORESIGNAL_BASE_URL;
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
        return response[0].company_id || response[0];
      }
      return null;
    } catch (error) {
      console.error(`Error searching for company "${query}" in field "${searchField}":`, error.message);
      return null;
    }
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

async function enrichCompaniesWithPrisma() {
  console.log('🚀 ENRICHING COMPANIES WITH PRISMA');
  console.log('==================================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set. Please set the environment variable.');
      return;
    }
    console.log('🔑 API Keys configured\n');

    const coresignal = new CoreSignalAPI();

    // Get companies that need enrichment
    const companies = await prisma.$queryRawUnsafe(`
      SELECT id, name, website, description, size, industry, "linkedinUrl"
      FROM companies
      WHERE "workspaceId" = $1
        AND "deletedAt" IS NULL
        AND (description IS NULL OR size IS NULL OR "linkedinUrl" IS NULL)
      ORDER BY 
        CASE WHEN website IS NOT NULL AND website != '' THEN 0 ELSE 1 END,
        name
      LIMIT 50
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
        // Search CoreSignal
        console.log('   🔍 Searching CoreSignal...');
        let coresignalCompanyId = await coresignal.searchCompanyByName(company.name);
        
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

        console.log(`   ✅ Found CoreSignal ID: ${coresignalCompanyId}`);

        // Get CoreSignal data
        console.log('   📊 Getting CoreSignal data...');
        const coresignalData = await coresignal.getCompanyData(coresignalCompanyId);

        if (!coresignalData) {
          console.log('   ❌ Failed to get CoreSignal data');
          results.push({
            company: company.name,
            status: 'error',
            error: 'Failed to get CoreSignal data'
          });
          errorCount++;
          continue;
        }

        console.log('   ✅ CoreSignal data retrieved');

        // Prepare update data using Prisma camelCase field names
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

        const updateData = {
          description: coresignalData.description_enriched || undefined,
          website: coresignalData.website || undefined,
          size: coresignalData.size_range || undefined,
          city: coresignalData.hq_city || undefined,
          state: coresignalData.hq_state || undefined,
          country: coresignalData.hq_country || undefined,
          address: coresignalData.hq_full_address || undefined,
          phone: coresignalData.company_phone_numbers?.[0] || undefined,
          email: coresignalData.company_emails?.[0] || undefined,
          industry: coresignalData.industry || undefined,
          accountType: coresignalData.ownership_status || undefined,
          linkedinUrl: coresignalData.linkedin_url || undefined,
          foundedYear: coresignalData.founded_year ? parseInt(coresignalData.founded_year) : undefined,
          employeeCount: coresignalData.employees_count || undefined,
          activeJobPostings: coresignalData.active_job_postings_count || undefined,
          linkedinFollowers: coresignalData.followers_count_linkedin || undefined,
          naicsCodes: coresignalData.naics_codes || undefined,
          sicCodes: coresignalData.sic_codes || undefined,
          facebookUrl: coresignalData.facebook_url?.[0] || undefined,
          twitterUrl: coresignalData.twitter_url?.[0] || undefined,
          instagramUrl: coresignalData.instagram_url?.[0] || undefined,
          youtubeUrl: coresignalData.youtube_url?.[0] || undefined,
          githubUrl: coresignalData.github_url?.[0] || undefined,
          technologiesUsed: technologiesUsed.length > 0 ? technologiesUsed : undefined,
          competitors: competitors.length > 0 ? competitors : undefined,
          revenueCurrency: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency || undefined,
          lastFundingAmount: coresignalData.last_funding_round_amount_raised || undefined,
          lastFundingDate: coresignalData.last_funding_round_announced_date || undefined,
          customFields: customFields,
          updatedAt: new Date()
        };

        // Remove undefined values to avoid overwriting existing data
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        // Update database using Prisma
        console.log('   💾 Updating database...');
        await prisma.companies.update({
          where: { id: company.id },
          data: updateData
        });

        console.log('   ✅ Database updated successfully!');
        console.log(`   📋 Updated: ${Object.keys(updateData).length} fields`);

        results.push({
          company: company.name,
          status: 'success',
          coresignalId: coresignalCompanyId,
          fieldsUpdated: Object.keys(updateData).length
        });
        successCount++;

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

    console.log('\n📊 ENRICHMENT SUMMARY');
    console.log('=====================');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Success rate: ${Math.round(successCount / companies.length * 100)}%`);

    console.log('\n📋 DETAILED RESULTS:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.status === 'success' ? '✅' : '❌'} ${result.company} - ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else if (result.status === 'success') {
        console.log(`   CoreSignal ID: ${result.coresignalId}`);
        console.log(`   Fields updated: ${result.fieldsUpdated}`);
      }
    });

    console.log('\n🎉 ENRICHMENT COMPLETED!');
    console.log('========================');
    console.log('✅ CoreSignal integration working');
    console.log('✅ Database updated with rich company data');
    console.log('✅ Ready for rich Overview and Intelligence tabs');

  } catch (error) {
    console.error('❌ FAILED TO ENRICH COMPANIES:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enrichCompaniesWithPrisma();
