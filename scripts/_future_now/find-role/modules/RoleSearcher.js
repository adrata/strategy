/**
 * Role Searcher Module
 * 
 * Searches for people with specific roles at a company
 * Uses hierarchical search approach (primary → secondary → tertiary)
 */

const fetch = require('node-fetch');

class RoleSearcher {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.delayMs = options.delayMs || 1000;
  }

  /**
   * Search for role matches using hierarchical approach
   * @param {string} companyLinkedInUrl - Company LinkedIn URL
   * @param {object} roleVariations - Hierarchical role variations
   * @param {number} maxResults - Maximum results to return
   * @returns {Array} Array of role matches
   */
  async searchRoleMatches(companyLinkedInUrl, roleVariations, maxResults = 1) {
    const allMatches = [];
    
    // Try primary variations first
    console.log('🔍 Searching primary role variations...');
    for (const roleTitle of roleVariations.primary) {
      const matches = await this.searchForRole(companyLinkedInUrl, roleTitle, 'primary');
      allMatches.push(...matches);
      
      if (allMatches.length >= maxResults) break;
      await this.delay(this.delayMs);
    }
    
    // Try secondary if needed
    if (allMatches.length < maxResults) {
      console.log('🔍 Searching secondary role variations...');
      for (const roleTitle of roleVariations.secondary) {
        const matches = await this.searchForRole(companyLinkedInUrl, roleTitle, 'secondary');
        allMatches.push(...matches);
        
        if (allMatches.length >= maxResults) break;
        await this.delay(this.delayMs);
      }
    }
    
    // Try tertiary if still needed
    if (allMatches.length < maxResults) {
      console.log('🔍 Searching tertiary role variations...');
      for (const roleTitle of roleVariations.tertiary) {
        const matches = await this.searchForRole(companyLinkedInUrl, roleTitle, 'tertiary');
        allMatches.push(...matches);
        
        if (allMatches.length >= maxResults) break;
        await this.delay(this.delayMs);
      }
    }
    
    return allMatches.slice(0, maxResults);
  }

  async searchForRole(companyLinkedInUrl, roleTitle, matchLevel) {
    try {
      const searchQuery = {
        "query": {
          "bool": {
            "must": [
              {
                "nested": {
                  "path": "experience",
                  "query": {
                    "bool": {
                      "must": [
                        {
                          "match": {
                            "experience.company_linkedin_url": companyLinkedInUrl
                          }
                        },
                        {
                          "term": {
                            "experience.active_experience": 1
                          }
                        },
                        {
                          "match": {
                            "experience.position_title": roleTitle
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=3', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();

      if (!searchData.results || searchData.results.length === 0) {
        return [];
      }

      return searchData.results.map(person => ({
        id: person.id,
        matchedRole: roleTitle,
        matchLevel,
        creditsUsed: 1
      }));

    } catch (error) {
      console.error(`   ⚠️ Search failed for "${roleTitle}":`, error.message);
      return [];
    }
  }

  async collectPersonProfile(personId) {
    const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${personId}`, {
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
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { RoleSearcher };

