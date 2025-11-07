/**
 * Buyer Group Sampler Module
 * 
 * Samples employees from target departments at companies
 * Uses Coresignal Preview API for cost-effective sampling
 */

const fetch = require('node-fetch');

class BuyerGroupSampler {
  constructor(apiKey, sampleDepartments, employeeSampleSize = 25) {
    this.apiKey = apiKey;
    this.sampleDepartments = sampleDepartments;
    this.employeeSampleSize = employeeSampleSize;
  }

  /**
   * Sample employees from a company
   * @param {object} company - Company data
   * @returns {Array} Sampled employees
   */
  async sampleEmployees(company) {
    const allEmployees = [];
    
    for (const department of this.sampleDepartments) {
      try {
        const departmentEmployees = await this.searchEmployeesByDepartment(
          company.company_linkedin_url,
          department
        );
        allEmployees.push(...departmentEmployees);
      } catch (error) {
        console.error(`   ⚠️ Failed to search ${department}:`, error.message);
      }
    }
    
    // Remove duplicates and limit sample size
    const uniqueEmployees = this.removeDuplicates(allEmployees);
    return uniqueEmployees.slice(0, this.employeeSampleSize);
  }

  async searchEmployeesByDepartment(companyLinkedInUrl, department) {
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
                          "experience.active_experience_department": department
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
      throw new Error(`Preview search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    return Array.isArray(searchData) ? searchData : [];
  }

  removeDuplicates(employees) {
    const seen = new Set();
    return employees.filter(employee => {
      if (seen.has(employee.id)) {
        return false;
      }
      seen.add(employee.id);
      return true;
    });
  }
}

module.exports = { BuyerGroupSampler };

