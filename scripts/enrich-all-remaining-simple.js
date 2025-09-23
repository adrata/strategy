const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CoreSignalAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v1';
  }

  async searchCompanyByName(companyName) {
    try {
      const response = await fetch(`${this.baseUrl}/company_multi_source/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          query: companyName,
          size: 1
        })
      });

      if (!response.ok) {
        throw new Error(`CoreSignal API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ CoreSignal search error:', error.message);
      return null;
    }
  }

  async searchCompanyByDomain(domain) {
    try {
      const response = await fetch(`${this.baseUrl}/company_multi_source/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          query: domain,
          size: 1
        })
      });

      if (!response.ok) {
        throw new Error(`CoreSignal API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ CoreSignal domain search error:', error.message);
      return null;
    }
  }

  async getCompanyData(companyId) {
    try {
      const response = await fetch(`${this.baseUrl}/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`CoreSignal API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ CoreSignal data retrieval error:', error.message);
      return null;
    }
  }

  async searchCompany(companyName, website) {
    // Try company name search first
    let searchResults = await this.searchCompanyByName(companyName);
    
    if (searchResults && searchResults.length > 0) {
      return searchResults[0].company_id || searchResults[0];
    }

    // Fallback to domain search if website exists
    if (website) {
      const cleanDomain = this.cleanDomain(website);
      searchResults = await this.searchCompanyByDomain(cleanDomain);
      
      if (searchResults && searchResults.length > 0) {
        return searchResults[0].company_id || searchResults[0];
      }
    }

    return null;
  }

  cleanDomain(website) {
    if (!website) return null;
    
    // Remove protocol
    let domain = website.replace(/^https?:\/\//, '');
    
    // Remove www
    domain = domain.replace(/^www\./, '');
    
    // Remove trailing slash and paths
    domain = domain.split('/')[0];
    
    return domain;
  }
}

async function enrichAllRemaining() {
  console.log('🚀 ENRICHING ALL REMAINING COMPANIES');
  console.log('=====================================');

  const apiKey = process.env.CORESIGNAL_API_KEY;
  if (!apiKey) {
    console.error('❌ CORESIGNAL_API_KEY not found');
    return;
  }

  const coresignalAPI = new CoreSignalAPI(apiKey);

  try {
    // Get ALL companies that need enrichment (no custom fields)
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: null
      },
      select: {
        id: true,
        name: true,
        website: true
      }
    });

    console.log(`📊 Found ${companies.length} companies that need enrichment\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      try {
        console.log(`${i + 1}. 🔍 Processing: ${company.name}`);
        
        // Search for company in CoreSignal
        const companyId = await coresignalAPI.searchCompany(company.name, company.website);
        
        if (!companyId) {
          console.log(`   ❌ Not found in CoreSignal`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found CoreSignal ID: ${companyId}`);

        // Get company data from CoreSignal
        const coresignalData = await coresignalAPI.getCompanyData(companyId);
        
        if (!coresignalData) {
          console.log(`   ❌ Failed to get CoreSignal data`);
          errorCount++;
          continue;
        }

        // Map CoreSignal data to database fields
        const updateData = {
          customFields: {
            coresignalData: coresignalData,
            enrichmentSource: "CoreSignal",
            lastEnrichedAt: new Date().toISOString(),
            totalFields: Object.keys(coresignalData).length
          }
        };

        // Update the company record
        await prisma.companies.update({
          where: { id: company.id },
          data: updateData
        });

        console.log(`   ✅ Success - Fields updated: ${Object.keys(coresignalData).length}`);
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n🎉 ENRICHMENT COMPLETED!');
    console.log('========================');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${companies.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

enrichAllRemaining();
