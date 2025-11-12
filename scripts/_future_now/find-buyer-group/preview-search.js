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
   * @param {boolean} usaOnly - Filter to USA-based employees only (optional)
   * @returns {Array} Array of employee previews
   */
  async discoverAllStakeholders(companyData, maxPages = 5, filteringLevel = 'moderate', productCategory = 'sales', customFiltering = null, usaOnly = false) {
    console.log(`🔍 Discovering stakeholders for: ${companyData.companyName || companyData.website}`);
    console.log(`📊 Filtering level: ${filteringLevel}, Product: ${productCategory}`);
    if (usaOnly) {
      console.log(`🇺🇸 Location filter: USA-only enabled`);
    }
    
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
    
    // Apply location filtering if USA-only is enabled
    if (usaOnly) {
      const beforeLocationFilter = relevantEmployees.length;
      relevantEmployees = relevantEmployees.filter(emp => this.isUSAEmployee(emp));
      console.log(`🇺🇸 Location filter: ${beforeLocationFilter} → ${relevantEmployees.length} employees (filtered out ${beforeLocationFilter - relevantEmployees.length} non-USA)`);
    }
    
    // Deduplicate and return
    return deduplicate(relevantEmployees);
  }

  /**
   * Normalize LinkedIn URL (remove -com, -inc suffixes)
   * @param {string} linkedinUrl - LinkedIn URL
   * @returns {string} Normalized URL
   */
  normalizeLinkedInUrl(linkedinUrl) {
    if (!linkedinUrl) return linkedinUrl;
    // Extract company/school ID from URL (support both /company/ and /school/)
    const match = linkedinUrl.match(/linkedin\.com\/(?:company|school)\/([^\/\?]+)/);
    if (match) {
      let companyId = match[1];
      const urlType = linkedinUrl.includes('/school/') ? 'school' : 'company';
      // Remove common suffixes
      companyId = companyId.replace(/-(com|inc|llc|ltd|corp)$/i, '');
      return `https://www.linkedin.com/${urlType}/${companyId}`;
    }
    return linkedinUrl;
  }

  /**
   * Build Coresignal query based on available company identifiers
   * @param {object} companyData - Company data with linkedinUrl, website, companyName
   * @returns {object} Coresignal Elasticsearch query
   */
  buildCoresignalQuery(companyData) {
    const { linkedinUrl, website, companyName } = companyData;
    
    // Priority 1: LinkedIn URL (most precise) - with normalization
    if (linkedinUrl) {
      // Normalize LinkedIn URL to handle variations
      const normalizedLinkedIn = this.normalizeLinkedInUrl(linkedinUrl);
      const originalLinkedIn = linkedinUrl;
      
      console.log(`🎯 Using LinkedIn URL for precise matching: ${normalizedLinkedIn}`);
      
      // Build a hybrid query that searches by BOTH LinkedIn URL AND company name
      // This ensures we get all employees even if LinkedIn URL matching is incomplete
      const linkedinQuery = {
        query: {
          bool: {
            must: [{
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      { term: { "experience.active_experience": 1 } }
                    ],
                    should: [
                      // LinkedIn URL matching (precise)
                      { match: { "experience.company_linkedin_url": normalizedLinkedIn } },
                      { match: { "experience.company_linkedin_url": originalLinkedIn } },
                      // Company name matching (broader coverage)
                      ...(companyName ? [
                        { match_phrase: { "experience.company_name": companyName } },
                        { match: { "experience.company_name": { query: companyName, fuzziness: "AUTO" } } }
                      ] : [])
                    ],
                    minimum_should_match: 1 // Must match at least one (LinkedIn URL OR company name)
                  }
                }
              }
            }]
          }
        }
      };
      
      return linkedinQuery;
    }
    
    // Priority 2: Website domain - with multiple domain variations
    if (website) {
      const domain = this.extractDomain(website);
      console.log(`🌐 Using website domain for matching: ${domain}`);
      
      const domainVariations = [domain];
      
      // Add www variant
      if (!domain.startsWith('www.')) {
        domainVariations.push(`www.${domain}`);
      } else {
        domainVariations.push(domain.replace(/^www\./, ''));
      }
      
      // Add parent domain if subdomain
      if (domain.split('.').length > 2) {
        const parentDomain = domain.split('.').slice(-2).join('.');
        domainVariations.push(parentDomain);
      }
      
      return {
        query: {
          bool: {
            must: [
              { term: { "experience.active_experience": 1 } }
            ],
            should: domainVariations.map(d => ({
              match: { "experience.company_website": d }
            })),
            minimum_should_match: 1
          }
        }
      };
    }
    
    // Fallback: Company name with enhanced matching
    console.log(`📝 Using company name for matching: ${companyName}`);
    
    // Generate company name variations for better matching
    const nameVariations = this.generateCompanyNameVariations(companyName);
    
    return {
      query: {
        bool: {
          must: [
            { term: { "experience.active_experience": 1 } }
          ],
          should: [
            // Exact match (highest priority)
            { match_phrase: { "experience.company_name": companyName } },
            // Fuzzy match
            { match: { "experience.company_name": { query: companyName, fuzziness: "AUTO" } } },
            // Try variations
            ...nameVariations.map(variation => ({
              match: { "experience.company_name": variation }
            })),
            // Try without common suffixes
            { match: { "experience.company_name": companyName.replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '') } }
          ],
          minimum_should_match: 1
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
    
    // Check for excluded titles first (highest priority)
    if (filterConfig.titles.exclude.some(exclude => title.includes(exclude))) {
      return false;
    }
    
    // Check for primary title match (high priority - can override department exclusions)
    const primaryTitleMatch = filterConfig.titles.primary.some(titleName => title.includes(titleName));
    if (primaryTitleMatch) {
      // Even if department is excluded, include if title is primary match
      // Exception: Don't include if it's clearly wrong (e.g., "AV Operations" title with "av operations" in exclude)
      const isExcludedDept = filterConfig.exclude.some(exclude => dept.includes(exclude));
      if (isExcludedDept) {
        // Check if this is a false positive (e.g., "AV Operations Technician" matching "operations" in title)
        const isFalsePositive = filterConfig.exclude.some(exclude => 
          title.includes(exclude) || (dept.includes(exclude) && !title.match(/academic|student|enrollment|retention/i))
        );
        if (isFalsePositive) {
          return false;
        }
      }
      return true;
    }
    
    // Check for excluded departments (but allow if title is secondary match)
    const isExcludedDept = filterConfig.exclude.some(exclude => dept.includes(exclude));
    if (isExcludedDept) {
      // Special case: Customer Success managing sales
      if (dept.includes('customer success') && 
          (title.includes('sales') || title.includes('revenue') || title.includes('business development'))) {
        return true; // Include if managing sales
      }
      // Allow if title is secondary match (e.g., "Academic Operations" in title overrides "Operations" department exclusion)
      const secondaryTitleMatch = filterConfig.titles.secondary.some(titleName => title.includes(titleName));
      if (!secondaryTitleMatch) {
        return false;
      }
    }
    
    // Check for primary relevance
    const primaryDeptMatch = filterConfig.primary.some(deptName => dept.includes(deptName));
    if (primaryDeptMatch) {
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
    // If it's a LinkedIn URL, extract company/school name
    if (identifier.includes('linkedin.com/company/') || identifier.includes('linkedin.com/school/')) {
      const match = identifier.match(/linkedin\.com\/(?:company|school)\/([^\/\?]+)/);
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
              // Location fields
              location: emp.location_full || emp.location || '',
              country: emp.location_country || emp.country || '',
              state: emp.location_state || emp.state || '',
              city: emp.location_city || emp.city || '',
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
                // Location fields
                location: source.location_full || source.location || '',
                country: source.location_country || source.country || '',
                state: source.location_state || source.state || '',
                city: source.location_city || source.city || '',
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
   * Check if employee is based in USA
   * @param {object} employee - Employee data object
   * @returns {boolean} True if employee is USA-based
   */
  isUSAEmployee(employee) {
    if (!employee) return false;
    
    // Check country field (most reliable)
    const country = (employee.country || '').toLowerCase().trim();
    if (country) {
      const usaVariations = ['united states', 'usa', 'us', 'united states of america', 'u.s.', 'u.s.a.'];
      if (usaVariations.some(variation => country.includes(variation))) {
        return true;
      }
      // If we have a country that's not USA, exclude it
      if (country && !country.includes('united states') && !country.includes('usa') && !country.includes('us ')) {
        return false;
      }
    }
    
    // Check location field (full location string)
    const location = (employee.location || '').toLowerCase().trim();
    if (location) {
      // Check for USA indicators
      const hasUSA = location.includes('united states') || 
                     location.includes(', usa') || 
                     location.includes(', us') ||
                     location.includes('usa') ||
                     (location.includes('new york') || location.includes('california') || location.includes('texas') || location.includes('florida') || location.includes('illinois') || location.includes('massachusetts') || location.includes('washington') || location.includes('georgia') || location.includes('north carolina') || location.includes('virginia'));
      
      // Check for non-USA indicators
      const nonUSAIndicators = ['india', 'tokyo', 'japan', 'netherlands', 'germany', 'uk', 'united kingdom', 'canada', 'australia', 'france', 'spain', 'italy', 'brazil', 'mexico', 'china', 'singapore', 'south korea'];
      const hasNonUSA = nonUSAIndicators.some(indicator => location.includes(indicator));
      
      if (hasNonUSA && !hasUSA) {
        return false;
      }
      if (hasUSA) {
        return true;
      }
    }
    
    // Check state field (USA states)
    const state = (employee.state || '').toLowerCase().trim();
    if (state) {
      const usaStates = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy',
                        'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming'];
      if (usaStates.some(usaState => state === usaState || state.includes(usaState))) {
        return true;
      }
      // If state exists but doesn't match USA states, likely not USA
      if (state && !usaStates.some(usaState => state.includes(usaState))) {
        return false;
      }
    }
    
    // If no location data available, include by default (to avoid false negatives)
    // This allows the system to still work if location data is missing
    if (!country && !location && !state) {
      return true; // Include if no location data (conservative approach)
    }
    
    // Default to exclude if we have some location data but it doesn't match USA
    return false;
  }

  /**
   * Generate company name variations for better matching
   * @param {string} companyName - Original company name
   * @returns {Array} Array of name variations
   */
  generateCompanyNameVariations(companyName) {
    if (!companyName) return [];
    
    const variations = [];
    const normalized = companyName.trim();
    
    // Remove common suffixes
    const withoutSuffix = normalized.replace(/\s+(inc|llc|ltd|corp|corporation|company|co|plc|gmbh)\.?$/i, '').trim();
    if (withoutSuffix && withoutSuffix !== normalized) {
      variations.push(withoutSuffix);
    }
    
    // Add common suffixes
    const suffixes = ['Inc', 'LLC', 'Ltd', 'Corp', 'Corporation', 'Company', 'Co'];
    suffixes.forEach(suffix => {
      if (!normalized.toLowerCase().includes(suffix.toLowerCase())) {
        variations.push(`${normalized} ${suffix}`);
      }
    });
    
    // Handle abbreviations (e.g., "TOP Engineers Plus" -> "TOP")
    const words = normalized.split(/\s+/);
    if (words.length > 2) {
      // Try first word only if it's an acronym (all caps)
      if (words[0].match(/^[A-Z]{2,}$/)) {
        variations.push(words[0]);
      }
      // Try first two words
      variations.push(words.slice(0, 2).join(' '));
    }
    
    // Remove duplicates and empty strings
    return [...new Set(variations.filter(v => v && v.length > 2))];
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