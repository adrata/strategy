/**
 * Coresignal Searcher Module
 * 
 * Handles company search using multiple Coresignal API strategies
 * Tries website.exact → website → website.domain_only
 */

const fetch = require('node-fetch');

class CoresignalSearcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.searchApproaches = [
      {
        name: 'website.exact',
        buildQuery: (domain) => ({
          "query": {
            "term": {
              "website.exact": domain
            }
          }
        })
      },
      {
        name: 'website',
        buildQuery: (domain) => ({
          "query": {
            "term": {
              "website": domain
            }
          }
        })
      },
      {
        name: 'website.domain_only',
        buildQuery: (domain) => ({
          "query": {
            "term": {
              "website.domain_only": domain
            }
          }
        })
      }
    ];
  }

  /**
   * Search for company using multiple strategies
   * @param {string} domain - Company domain
   * @returns {object} Search result with company ID and approach used
   */
  async searchCompany(domain) {
    console.log(`   🔍 Searching for domain: ${domain}`);
    
    for (const approach of this.searchApproaches) {
      console.log(`   🔍 Trying ${approach.name} field...`);
      
      const query = approach.buildQuery(domain);
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!searchResponse.ok) {
        console.log(`   ⚠️ ${approach.name} search failed: ${searchResponse.status} ${searchResponse.statusText}`);
        continue;
      }

      const data = await searchResponse.json();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   ✅ Found ${data.length} results using ${approach.name} field`);
        return {
          companyId: data[0],
          approach: approach.name,
          creditsUsed: 1
        };
      } else {
        console.log(`   ⚠️ No results with ${approach.name} field`);
      }
    }
    
    return null;
  }

  /**
   * Collect full company profile
   * @param {string} companyId - Coresignal company ID
   * @returns {object} Company profile data
   */
  async collectCompanyProfile(companyId) {
    const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
      method: 'GET',
      headers: {
        'apikey': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!collectResponse.ok) {
      throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
    }

    return await collectResponse.json();
  }

  /**
   * Extract domain from website URL
   * @param {string} website - Website URL
   * @returns {string|null} Clean domain
   */
  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }
}

module.exports = { CoresignalSearcher };

