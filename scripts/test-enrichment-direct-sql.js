const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

class CoreSignalAPI {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'api.coresignal.com';
  }

  async makeRequest(path, method = 'GET', data = null) {
    const options = {
      hostname: this.baseUrl,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          } else {
            reject(new Error(`CoreSignal API error: ${res.statusCode} - ${responseData}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async searchCompany(query) {
    const path = `/commercial/search/company?query=${encodeURIComponent(query)}`;
    try {
      const response = await this.makeRequest(path);
      if (response.data && response.data.hits && response.data.hits.hits.length > 0) {
        return response.data.hits.hits[0]._source.id;
      }
      return null;
    } catch (error) {
      console.error(`Error searching for company "${query}":`, error.message);
      return null;
    }
  }

  async getCompanyData(companyId) {
    const path = `/commercial/company/${companyId}`;
    try {
      return await this.makeRequest(path);
    } catch (error) {
      console.error(`Error getting company data for ID ${companyId}:`, error.message);
      return null;
    }
  }
}

async function testDirectSQLEnrichment() {
  console.log('🧪 TESTING DIRECT SQL ENRICHMENT WITH LOCKARD & WHITE, INC.');
  console.log('==========================================================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    if (!process.env.CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY not configured');
      return;
    }
    console.log('🔑 API Keys configured\n');

    const coresignal = new CoreSignalAPI();

    // Find the company
    let company = await prisma.companies.findFirst({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { name: { equals: 'Lockard & White, Inc.', mode: 'insensitive' } },
          { website: { contains: 'landw.com', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        description: true,
        size: true
      }
    });

    if (!company) {
      console.log('❌ Company not found in database');
      return;
    }

    console.log(`🏢 Found company: ${company.name}`);
    console.log(`   Website: ${company.website}`);
    console.log(`   Current description: ${company.description || 'None'}`);
    console.log(`   Current size: ${company.size || 'None'}\n`);

    // Search CoreSignal
    console.log('🔍 Searching CoreSignal...');
    let coresignalCompanyId = await coresignal.searchCompany(company.name);
    if (!coresignalCompanyId) {
      coresignalCompanyId = await coresignal.searchCompany('Lockard White');
    }
    if (!coresignalCompanyId) {
      console.log('❌ Company not found in CoreSignal');
      return;
    }

    console.log(`✅ Found CoreSignal ID: ${coresignalCompanyId}`);

    // Get CoreSignal data
    console.log('📊 Getting CoreSignal data...');
    const coresignalData = await coresignal.getCompanyData(coresignalCompanyId);
    if (!coresignalData) {
      console.log('❌ Failed to retrieve CoreSignal data');
      return;
    }

    console.log('✅ CoreSignal data retrieved successfully\n');

    // Update using raw SQL to bypass Prisma client issues
    console.log('💾 Updating database with raw SQL...');
    
    const updateQuery = `
      UPDATE companies 
      SET 
        description = $1,
        website = $2,
        size = $3,
        city = $4,
        state = $5,
        country = $6,
        address = $7,
        phone = $8,
        email = $9,
        industry = $10,
        account_type = $11,
        linkedin_url = $12,
        founded_year = $13,
        employee_count = $14,
        active_job_postings = $15,
        linkedin_followers = $16,
        naics_codes = $17,
        sic_codes = $18,
        facebook_url = $19,
        twitter_url = $20,
        instagram_url = $21,
        youtube_url = $22,
        github_url = $23,
        technologies_used = $24,
        competitors = $25,
        revenue_currency = $26,
        last_funding_amount = $27,
        last_funding_date = $28,
        custom_fields = $29,
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

    console.log('✅ Database updated successfully with raw SQL!');

    // Verify the update
    console.log('\n🔍 Verifying the update...');
    const updatedCompany = await prisma.$queryRawUnsafe(`
      SELECT 
        name, website, description, size, industry, account_type,
        linkedin_url, founded_year, employee_count, active_job_postings, linkedin_followers,
        naics_codes, sic_codes, facebook_url, twitter_url, instagram_url, youtube_url, github_url,
        technologies_used, competitors, revenue_currency, last_funding_amount, last_funding_date,
        custom_fields
      FROM companies 
      WHERE id = $1
    `, company.id);

    if (updatedCompany.length > 0) {
      const company = updatedCompany[0];
      console.log('📊 FINAL RESULTS:');
      console.log('=================');
      console.log(`Company: ${company.name}`);
      console.log(`Website: ${company.website}`);
      console.log(`Description: ${company.description ? '✅ Updated' : '❌ Not updated'}`);
      console.log(`Size: ${company.size || 'N/A'}`);
      console.log(`Industry: ${company.industry || 'N/A'}`);
      console.log(`Account Type: ${company.account_type || 'N/A'}`);
      console.log(`LinkedIn: ${company.linkedin_url || 'N/A'}`);
      console.log(`Founded Year: ${company.founded_year || 'N/A'}`);
      console.log(`Employee Count: ${company.employee_count || 'N/A'}`);
      console.log(`Active Job Postings: ${company.active_job_postings || 'N/A'}`);
      console.log(`LinkedIn Followers: ${company.linkedin_followers || 'N/A'}`);
      console.log(`NAICS Codes: ${company.naics_codes?.length || 0} codes`);
      console.log(`SIC Codes: ${company.sic_codes?.length || 0} codes`);
      console.log(`Technologies Used: ${company.technologies_used?.length || 0} technologies`);
      console.log(`Competitors: ${company.competitors?.length || 0} competitors`);
      console.log(`Custom Fields: ${company.custom_fields ? '✅ Stored' : '❌ Not stored'}`);

      console.log('\n🎉 DIRECT SQL ENRICHMENT SUCCESSFUL!');
      console.log('====================================');
      console.log('✅ CoreSignal integration working');
      console.log('✅ Database updated with all new fields');
      console.log('✅ Raw SQL approach bypassed Prisma client issues');
    }

  } catch (error) {
    console.error('❌ DIRECT SQL ENRICHMENT FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectSQLEnrichment();
