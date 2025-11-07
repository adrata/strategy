/**
 * Coresignal API Module
 * 
 * Handles all Coresignal API interactions
 * Search and collect operations with error handling
 */

const fetch = require('node-fetch');

class CoresignalAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Search companies using Elasticsearch query
   * @param {object} searchQuery - ES query object
   * @returns {Array} Array of company IDs
   */
  async searchCompanies(searchQuery) {
    const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=100', {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });

    if (!searchResponse.ok) {
      throw new Error(`Coresignal search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    // Handle different response formats
    let companyIds = [];
    if (Array.isArray(searchData)) {
      companyIds = searchData;
    } else if (searchData.hits?.hits) {
      companyIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
    } else if (searchData.hits) {
      companyIds = searchData.hits;
    }

    return companyIds;
  }

  /**
   * Collect company profiles in batches
   * @param {Array} companyIds - Array of company IDs
   * @param {number} batchSize - Batch size for collection
   * @param {number} delayMs - Delay between batches
   * @returns {Array} Array of company profiles
   */
  async collectCompanyProfiles(companyIds, batchSize = 10, delayMs = 3000) {
    const companies = [];
    const totalBatches = Math.ceil(companyIds.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, companyIds.length);
      const batch = companyIds.slice(startIndex, endIndex);
      
      console.log(`📦 Collecting batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)`);
      
      const batchPromises = batch.map(companyId => this.collectSingleProfile(companyId));
      const batchResults = await Promise.all(batchPromises);
      companies.push(...batchResults.filter(company => company !== null));
      
      if (batchIndex < totalBatches - 1) {
        await this.delay(delayMs);
      }
    }
    
    return companies;
  }

  async collectSingleProfile(companyId) {
    try {
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!collectResponse.ok) {
        throw new Error(`Collect failed: ${collectResponse.status}`);
      }

      return await collectResponse.json();

    } catch (error) {
      console.error(`❌ Failed to collect ${companyId}:`, error.message);
      return null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { CoresignalAPI };

