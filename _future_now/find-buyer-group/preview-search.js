/**
 * Preview Search Module
 * 
 * Discovers employees using the working Coresignal approach
 * Uses single query to get all employees, then filters in JavaScript
 */

const { extractDomain, deduplicate, delay } = require('./utils');

class PreviewSearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  /**
   * Discover all stakeholders using the working approach
   * @param {string} companyIdentifier - Company LinkedIn URL
   * @param {number} maxPages - Maximum pages to search
   * @returns {Array} Array of employee previews
   */
  async discoverAllStakeholders(companyIdentifier, maxPages = 5) {
    console.log(`🔍 Discovering stakeholders for: ${companyIdentifier}`);
    
    // Extract company name from LinkedIn URL or use as-is if it's already a company name
    const companyName = this.extractCompanyName(companyIdentifier);
    console.log(`🏢 Searching for employees at: ${companyName}`);
    
    const allEmployees = [];
    
    // Use the working Elasticsearch query structure
    const query = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      { term: { "experience.active_experience": 1 } },
                      {
                        bool: {
                          should: [
                            { match: { "experience.company_name": companyName } },
                            { match_phrase: { "experience.company_name": companyName } }
                          ]
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
    
    console.log(`📋 Getting all employees...`);
    const allEmployeesRaw = await this.executeSearch(query);
    console.log(`✅ Found ${allEmployeesRaw.length} total employees`);
    
    // Filter to relevant employees in JavaScript
    const relevantDepartments = [
      'Sales', 'Marketing', 'Business Development', 'Revenue Operations',
      'IT', 'Technology', 'Engineering', 'Information Technology',
      'Security', 'Legal', 'Compliance', 'Risk Management',
      'Finance', 'Procurement', 'Purchasing', 'Accounting',
      'Operations', 'Product', 'Analytics', 'Data Science',
      'Executive', 'C-Suite', 'Leadership', 'Strategy',
      'Real Estate', 'Administrative', 'Customer Service'
    ];
    
    const relevantTitles = [
      'VP', 'Vice President', 'SVP', 'Senior Vice President',
      'Director', 'Senior Director', 'Chief', 'Head of',
      'Manager', 'Senior Manager', 'Lead', 'Principal'
    ];
    
    const relevantEmployees = allEmployeesRaw.filter(emp => {
      // Check department
      const deptMatch = relevantDepartments.some(dept => 
        emp.department && emp.department.toLowerCase().includes(dept.toLowerCase())
      );
      
      // Check title
      const titleMatch = relevantTitles.some(title => 
        emp.title && emp.title.toLowerCase().includes(title.toLowerCase())
      );
      
      return deptMatch || titleMatch;
    });
    
    console.log(`📊 Filtered to ${relevantEmployees.length} relevant employees`);
    
    // Deduplicate and return
    return deduplicate(relevantEmployees);
  }

  /**
   * Extract company name from LinkedIn URL or return as-is
   * @param {string} identifier - LinkedIn URL or company name
   * @returns {string} Company name
   */
  extractCompanyName(identifier) {
    // If it's a LinkedIn URL, extract company name
    if (identifier.includes('linkedin.com/company/')) {
      const match = identifier.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        // Convert URL slug to readable company name
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    // Return as-is if it's already a company name
    return identifier;
  }

  /**
   * Execute search query against Coresignal API with retry logic
   * @param {object} query - Elasticsearch query
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Array} Array of employee data
   */
  async executeSearch(query, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Coresignal API attempt ${attempt}/${maxRetries}...`);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`${this.baseUrl}/employee_multi_source/search/es_dsl/preview?page=1&items_per_page=50`, {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(query),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 524 || response.status === 504) {
            throw new Error(`Gateway timeout (${response.status}) - attempt ${attempt}`);
          } else if (response.status === 429) {
            throw new Error(`Rate limited (${response.status}) - attempt ${attempt}`);
          } else {
            throw new Error(`Coresignal search failed: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        console.log(`✅ Coresignal API success on attempt ${attempt}`);
        
        // Handle array format (preview API returns array directly)
        if (Array.isArray(data)) {
          return data.map(emp => ({
            id: emp.id,
            name: emp.full_name || '',
            title: emp.active_experience_title || '',
            department: emp.active_experience_department || '',
            company: emp.company_name || '',
            managementLevel: emp.active_experience_management_level || '',
            connectionsCount: emp.connections_count || 0,
            followersCount: emp.followers_count || 0,
            email: emp.email || '',
            phone: emp.phone || '',
            linkedinUrl: emp.linkedin_url || '',
            source: 'coresignal_preview'
          }));
        }
        
        // Fallback for hits format (shouldn't happen with preview API)
        if (!data.hits?.hits) {
          return [];
        }

        return data.hits.hits.map(emp => {
          const source = emp._source;
          const experience = source.experience?.[0] || {};
          
          return {
            id: emp._id,
            name: source.name || '',
            title: experience.active_experience_title || '',
            department: experience.active_experience_department || '',
            company: experience.active_experience_company || '',
            managementLevel: experience.active_experience_management_level || '',
            connectionsCount: source.connections_count || 0,
            followersCount: source.followers_count || 0,
            email: source.email || '',
            phone: source.phone || '',
            linkedinUrl: source.linkedin_url || '',
            source: 'coresignal_preview'
          };
        });

      } catch (error) {
        lastError = error;
        console.log(`❌ Coresignal API attempt ${attempt} failed: ${error.message}`);
        
        // Don't retry on non-retryable errors
        if (error.name === 'AbortError') {
          console.log(`⏰ Request timeout on attempt ${attempt}`);
        } else if (error.message.includes('401') || error.message.includes('403')) {
          console.log(`🔒 Authentication error - not retrying`);
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          console.log(`💥 All ${maxRetries} attempts failed`);
          throw lastError;
        }
        
        // Wait before retrying with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
      }
    }
    
    throw lastError;
  }

  /**
   * Search employees by department (legacy method - kept for compatibility)
   * @param {string} linkedinUrl - Company LinkedIn URL
   * @param {string} department - Department name
   * @returns {Array} Array of employees
   */
  async searchByDepartment(linkedinUrl, department) {
    const query = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      { match: { "experience.company_linkedin_url": linkedinUrl } },
                      { term: { "experience.active_experience": 1 } },
                      { match: { "experience.active_experience_department": department } }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
    return await this.executeSearch(query);
  }

  /**
   * Search employees by title pattern (legacy method - kept for compatibility)
   * @param {string} linkedinUrl - Company LinkedIn URL
   * @param {string} titlePattern - Title pattern to search
   * @returns {Array} Array of employees
   */
  async searchByTitle(linkedinUrl, titlePattern) {
    const query = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      { match: { "experience.company_linkedin_url": linkedinUrl } },
                      { term: { "experience.active_experience": 1 } },
                      { match: { "experience.active_experience_title": titlePattern } }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
    return await this.executeSearch(query);
  }
}

module.exports = { PreviewSearch };