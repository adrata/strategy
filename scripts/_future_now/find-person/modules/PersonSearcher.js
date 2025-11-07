/**
 * Person Searcher Module
 * 
 * Handles person search using multiple Coresignal API strategies:
 * 1. Direct email matching
 * 2. LinkedIn URL matching
 * 3. Company experience matching
 */

const fetch = require('node-fetch');

class PersonSearcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Search for person using multiple strategies
   * @param {object} person - Database person record
   * @returns {object} Search result with person ID and approach used
   */
  async searchPerson(person) {
    const searchApproaches = [
      {
        name: 'email_direct',
        query: this.buildEmailQuery(person.email),
        condition: person.email
      },
      {
        name: 'linkedin_direct',
        query: this.buildLinkedInQuery(person.linkedinUrl),
        condition: person.linkedinUrl
      },
      {
        name: 'company_experience',
        query: this.buildCompanyExperienceQuery(person),
        condition: person.companyId
      }
    ];

    for (const approach of searchApproaches) {
      if (!approach.condition) {
        console.log(`   ⚠️ Skipping ${approach.name} - no required data`);
        continue;
      }

      console.log(`   🔍 Trying ${approach.name}...`);
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(approach.query)
      });

      if (!searchResponse.ok) {
        console.log(`   ⚠️ ${approach.name} search failed: ${searchResponse.status} ${searchResponse.statusText}`);
        continue;
      }

      const data = await searchResponse.json();
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   ✅ Found ${data.length} results using ${approach.name}`);
        return {
          personId: data[0],
          approach: approach.name,
          creditsUsed: 1
        };
      } else {
        console.log(`   ⚠️ No results with ${approach.name}`);
      }
    }
    
    return null;
  }

  /**
   * Collect full person profile
   * @param {string} personId - Coresignal person ID
   * @returns {object} Person profile data
   */
  async collectPersonProfile(personId) {
    const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${personId}`, {
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

  buildEmailQuery(email) {
    return {
      "query": {
        "term": {
          "email": email.toLowerCase().trim()
        }
      }
    };
  }

  buildLinkedInQuery(linkedinUrl) {
    return {
      "query": {
        "term": {
          "linkedin_url": linkedinUrl.trim()
        }
      }
    };
  }

  buildCompanyExperienceQuery(person) {
    return {
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
                        "term": {
                          "experience.active_experience": 1
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
  }
}

module.exports = { PersonSearcher };

