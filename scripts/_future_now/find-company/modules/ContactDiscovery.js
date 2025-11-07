/**
 * Contact Discovery Module
 * 
 * Discovers key contacts at companies using Coresignal employee preview API
 * Focuses on C-level, VP, and Director-level contacts
 */

class ContactDiscovery {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Discover key contacts at a company
   * @param {object} companyProfileData - Coresignal company profile
   * @param {object} company - Database company record
   * @returns {Array} Array of key contacts (max 5)
   */
  async discoverKeyContacts(companyProfileData, company) {
    console.log(`   👥 Discovering key contacts...`);
    
    const companyLinkedInUrl = companyProfileData.linkedin_url || company.linkedinUrl;
    if (!companyLinkedInUrl) {
      console.log(`   ⚠️ No LinkedIn URL available for contact discovery`);
      return [];
    }
    
    try {
      // Search for C-level and VP-level contacts
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
                        }
                      ],
                      "should": [
                        { "match": { "experience.position_title": "CEO" } },
                        { "match": { "experience.position_title": "CFO" } },
                        { "match": { "experience.position_title": "CTO" } },
                        { "match": { "experience.position_title": "COO" } },
                        { "match": { "experience.position_title": "VP" } },
                        { "match": { "experience.position_title": "Vice President" } },
                        { "match": { "experience.position_title": "Director" } }
                      ],
                      "minimum_should_match": 1
                    }
                  }
                }
              }
            ]
          }
        }
      };
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview?items_per_page=10', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });
      
      if (!searchResponse.ok) {
        throw new Error(`Contact discovery failed: ${searchResponse.status}`);
      }
      
      const contacts = await searchResponse.json();
      const contactArray = Array.isArray(contacts) ? contacts : [];
      
      console.log(`   ✅ Found ${contactArray.length} key contacts`);
      
      return contactArray.slice(0, 5); // Limit to top 5 key contacts
      
    } catch (error) {
      console.error(`   ❌ Failed to discover contacts: ${error.message}`);
      return [];
    }
  }
}

module.exports = { ContactDiscovery };

