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
   * @param {object} companyData - Company data object with linkedinUrl, website, companyName
   * @param {number} maxPages - Maximum pages to search
   * @param {string} filteringLevel - Filtering level: 'none', 'light', 'moderate', 'strict'
   * @param {string} productCategory - Product category for filtering
   * @param {object} customFiltering - Custom filtering configuration (optional)
   * @returns {Array} Array of employee previews
   */
  async discoverAllStakeholders(companyData, maxPages = 5, filteringLevel = 'moderate', productCategory = 'sales', customFiltering = null) {
    console.log(`🔍 Discovering stakeholders for: ${companyData.companyName || companyData.website}`);
    console.log(`📊 Filtering level: ${filteringLevel}, Product: ${productCategory}`);
    
    // Build query based on available identifiers
    const query = this.buildCoresignalQuery(companyData);
    
    console.log(`📋 Getting all employees...`);
    let allEmployeesRaw = await this.executeSearch(query, maxPages);
    console.log(`✅ Found ${allEmployeesRaw.length} total employees`);
    
    // Parent domain fallback for subdomains (e.g., sketchup.trimble.com -> trimble.com)
    if (allEmployeesRaw.length === 0 && companyData.website) {
      const domain = this.extractDomain(companyData.website);
      if (domain.split('.').length > 2) {
        const parentDomain = domain.split('.').slice(-2).join('.');
        console.log(`⚠️ Zero employees found for ${domain}, trying parent domain: ${parentDomain}`);
        
        const parentQuery = this.buildCoresignalQuery({
          ...companyData,
          website: `https://${parentDomain}`
        });
        
        allEmployeesRaw = await this.executeSearch(parentQuery, maxPages);
        console.log(`✅ Parent domain search found ${allEmployeesRaw.length} total employees`);
      }
    }
    
    // Apply filtering based on company size and product category
    let relevantEmployees;
    
    if (filteringLevel === 'none') {
      // No filtering - return all employees for small companies
      console.log(`📊 No filtering applied - analyzing all ${allEmployeesRaw.length} employees`);
      relevantEmployees = allEmployeesRaw;
    } else {
      // Use custom filtering if provided, otherwise use product-specific filtering
      let filterConfig;
      if (customFiltering && (customFiltering.departments || customFiltering.titles)) {
        console.log('📊 Using personalized filtering configuration');
        filterConfig = {
          primary: customFiltering.departments?.primary || [],
          secondary: customFiltering.departments?.secondary || [],
          exclude: customFiltering.departments?.exclude || [],
          titles: {
            primary: customFiltering.titles?.primary || [],
            secondary: customFiltering.titles?.secondary || [],
            exclude: customFiltering.titles?.exclude || []
          }
        };
      } else {
        filterConfig = this.getProductSpecificFiltering(productCategory, filteringLevel);
      }
      relevantEmployees = allEmployeesRaw.filter(emp => this.isRelevantEmployee(emp, filterConfig));
      console.log(`📊 Filtered to ${relevantEmployees.length} relevant employees (${customFiltering ? 'personalized' : filteringLevel} filtering)`);
    }
    
    // Deduplicate and return
    return deduplicate(relevantEmployees);
  }

  /**
   * Build Coresignal query based on available company identifiers
   * @param {object} companyData - Company data with linkedinUrl, website, companyName
   * @returns {object} Coresignal Elasticsearch query
   */
  buildCoresignalQuery(companyData) {
    const { linkedinUrl, website, companyName } = companyData;
    
    // Priority 1: LinkedIn URL (most precise)
    if (linkedinUrl) {
      console.log(`🎯 Using LinkedIn URL for precise matching: ${linkedinUrl}`);
      return {
        query: {
          bool: {
            must: [{
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      { term: { "experience.active_experience": 1 } },
                      { match: { "experience.company_linkedin_url": linkedinUrl } }
                    ]
                  }
                }
              }
            }]
          }
        }
      };
    }
    
    // Priority 2: Website domain
    if (website) {
      const domain = this.extractDomain(website);
      console.log(`🌐 Using website domain for matching: ${domain}`);
      return {
        query: {
          bool: {
            must: [{
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      { term: { "experience.active_experience": 1 } },
                      { match: { "experience.company_website": domain } }
                    ]
                  }
                }
              }
            }]
          }
        }
      };
    }
    
    // Fallback: Company name
    console.log(`📝 Using company name for matching: ${companyName}`);
    return {
      query: {
        bool: {
          must: [{
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
          }]
        }
      }
    };
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to extract domain from
   * @returns {string} Domain name
   */
  extractDomain(url) {
    if (!url) return '';
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
  }

  /**
   * Get product-specific filtering configuration
   * @param {string} productCategory - Product category
   * @param {string} filteringLevel - Filtering level
   * @returns {object} Filter configuration
   */
  getProductSpecificFiltering(productCategory, filteringLevel) {
    if (productCategory === 'sales') {
      return {
        primary: ['sales', 'revenue', 'operations', 'business development', 'sales enablement', 'revenue operations'],
        secondary: filteringLevel === 'light' ? ['marketing', 'product', 'it', 'technology'] : ['marketing'],
        exclude: ['customer success', 'customer service'], // Unless managing sales
        titles: {
          primary: ['vp', 'vice president', 'svp', 'senior vice president', 'chief', 'cfo', 'cro', 'cto'],
          secondary: ['director', 'senior director', 'head of', 'manager', 'senior manager'],
          exclude: filteringLevel === 'strict' ? ['customer success', 'customer service'] : []
        }
      };
    }
    
    // Default configuration for other products
    return {
      primary: ['operations', 'strategy', 'product'],
      secondary: ['marketing', 'it', 'technology', 'finance'],
      exclude: [],
      titles: {
        primary: ['vp', 'vice president', 'svp', 'senior vice president', 'chief'],
        secondary: ['director', 'senior director', 'head of', 'manager'],
        exclude: []
      }
    };
  }

  /**
   * Check if employee is relevant based on filter configuration
   * @param {object} employee - Employee data
   * @param {object} filterConfig - Filter configuration
   * @returns {boolean} True if relevant
   */
  isRelevantEmployee(employee, filterConfig) {
    const dept = employee.department?.toLowerCase() || '';
    const title = employee.title?.toLowerCase() || '';
    
    // Check for excluded departments
    if (filterConfig.exclude.some(exclude => dept.includes(exclude))) {
      // Special case: Customer Success managing sales
      if (dept.includes('customer success') && 
          (title.includes('sales') || title.includes('revenue') || title.includes('business development'))) {
        return true; // Include if managing sales
      }
      return false;
    }
    
    // Check for excluded titles
    if (filterConfig.titles.exclude.some(exclude => title.includes(exclude))) {
      return false;
    }
    
    // Check for primary relevance
    const primaryDeptMatch = filterConfig.primary.some(deptName => dept.includes(deptName));
    const primaryTitleMatch = filterConfig.titles.primary.some(titleName => title.includes(titleName));
    
    if (primaryDeptMatch || primaryTitleMatch) {
      return true;
    }
    
    // Check for secondary relevance
    const secondaryDeptMatch = filterConfig.secondary.some(deptName => dept.includes(deptName));
    const secondaryTitleMatch = filterConfig.titles.secondary.some(titleName => title.includes(titleName));
    
    return secondaryDeptMatch || secondaryTitleMatch;
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
   * Execute search query against Coresignal API with retry logic and pagination
   * @param {object} query - Elasticsearch query
   * @param {number} maxPages - Maximum pages to fetch
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Array} Array of employee data
   */
  async executeSearch(query, maxPages = 5, maxRetries = 3) {
    let allEmployees = [];
    let lastError;
    
    for (let page = 1; page <= maxPages; page++) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔍 Coresignal API page ${page}/${maxPages}, attempt ${attempt}/${maxRetries}...`);
          
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(`${this.baseUrl}/employee_multi_source/search/es_dsl/preview?page=${page}&items_per_page=50`, {
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
              throw new Error(`Gateway timeout (${response.status}) - page ${page}, attempt ${attempt}`);
            } else if (response.status === 429) {
              throw new Error(`Rate limited (${response.status}) - page ${page}, attempt ${attempt}`);
            } else {
              throw new Error(`Coresignal search failed: ${response.status} ${response.statusText}`);
            }
          }

          const data = await response.json();
          console.log(`✅ Coresignal API success on page ${page}, attempt ${attempt}`);
          
          // Handle array format (preview API returns array directly)
          let pageEmployees = [];
          if (Array.isArray(data)) {
            pageEmployees = data.map(emp => ({
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
          } else if (data.hits?.hits) {
            // Fallback for hits format
            pageEmployees = data.hits.hits.map(emp => {
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
          }
          
          // If no employees returned, we've reached the end
          if (pageEmployees.length === 0) {
            console.log(`📄 No more employees on page ${page}, stopping pagination`);
            return allEmployees;
          }
          
          allEmployees = allEmployees.concat(pageEmployees);
          console.log(`📊 Page ${page}: Found ${pageEmployees.length} employees (Total: ${allEmployees.length})`);
          
          // If we got fewer than 50 employees, we've likely reached the end
          if (pageEmployees.length < 50) {
            console.log(`📄 Less than 50 employees on page ${page}, stopping pagination`);
            return allEmployees;
          }
          
          // Success, move to next page
          break;
          
        } catch (error) {
          lastError = error;
          console.log(`❌ Coresignal API page ${page}, attempt ${attempt} failed: ${error.message}`);
          
          // Don't retry on non-retryable errors
          if (error.name === 'AbortError') {
            console.log(`⏰ Request timeout on page ${page}, attempt ${attempt}`);
          } else if (error.message.includes('401') || error.message.includes('403')) {
            console.log(`🔒 Authentication error - not retrying`);
            throw error;
          }
          
          // If this is the last attempt for this page, move to next page or return what we have
          if (attempt === maxRetries) {
            console.log(`💥 All ${maxRetries} attempts failed for page ${page}`);
            if (allEmployees.length > 0) {
              console.log(`⚠️ Returning ${allEmployees.length} employees found so far`);
              return allEmployees;
            }
            throw lastError;
          }
          
          // Wait before retrying with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      }
    }
    
    return allEmployees;
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