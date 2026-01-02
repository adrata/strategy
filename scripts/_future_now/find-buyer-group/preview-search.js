/**
 * Preview Search Module
 *
 * Discovers employees using the working Coresignal approach
 * Uses single query to get all employees, then filters in JavaScript
 *
 * ENHANCED: Now supports intelligent multi-query to bypass 100 result limit
 * - Uses cursor-based pagination for reliable results
 * - Automatically splits queries when hitting API limits
 * - Cost-efficient: Preview uses search credits (2x more than collect credits)
 */

const { extractDomain, deduplicate, delay } = require('./utils');

class PreviewSearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';

    // Configuration for search optimization
    this.config = {
      itemsPerPage: 100,        // API supports up to 1000, but 100 is optimal for preview
      maxPagesPerQuery: 10,     // Max pages per single query (1000 results)
      maxTotalResults: 500,     // Default max results across all queries
      rateLimitDelay: 60,       // ms between requests (18 req/sec limit)
      requestTimeout: 30000     // 30 second timeout
    };
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
    let searchResult = await this.executeSearch(query, maxPages);

    // Extract metadata and employees array
    let allEmployeesRaw = searchResult.employees || [];
    let totalAvailable = searchResult.totalAvailable || allEmployeesRaw.length;
    let hitLimit = searchResult.hitLimit || false;

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

        searchResult = await this.executeSearch(parentQuery, maxPages);
        allEmployeesRaw = searchResult.employees || [];
        totalAvailable = searchResult.totalAvailable || allEmployeesRaw.length;
        hitLimit = searchResult.hitLimit || false;
        console.log(`✅ Parent domain search found ${allEmployeesRaw.length} total employees`);
      }
    }
    
    // Filter employees by email domain if company website is available
    // This prevents mixing employees from different companies with similar names
    // Example: underline.com vs underline.cz
    if (companyData.website && allEmployeesRaw.length > 0) {
      const companyDomain = this.extractDomain(companyData.website);
      const beforeDomainFilter = allEmployeesRaw.length;
      
      allEmployeesRaw = allEmployeesRaw.filter(emp => {
        const email = emp.email || emp.work_email;
        if (!email || !email.includes('@')) {
          // Keep employees without email data for now
          return true;
        }
        
        const emailDomain = email.split('@')[1].toLowerCase();
        return this.domainsMatchStrict(emailDomain, companyDomain);
      });
      
      const filteredOut = beforeDomainFilter - allEmployeesRaw.length;
      if (filteredOut > 0) {
        console.log(`🔒 Email domain filter: ${beforeDomainFilter} → ${allEmployeesRaw.length} employees (filtered out ${filteredOut} with non-matching domains)`);
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

    // Deduplicate and return with metadata
    const deduplicatedEmployees = deduplicate(relevantEmployees);

    return {
      employees: deduplicatedEmployees,
      totalAvailable: totalAvailable,
      hitLimit: hitLimit
    };
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
   * Strict domain matching for email validation
   * Ensures exact root domain match (including TLD)
   * @param {string} emailDomain - Email domain (e.g., 'underline.cz')
   * @param {string} companyDomain - Company domain (e.g., 'underline.com')
   * @returns {boolean} True if domains match exactly
   */
  domainsMatchStrict(emailDomain, companyDomain) {
    if (!emailDomain || !companyDomain) return false;
    
    const parts1 = emailDomain.split('.');
    const parts2 = companyDomain.split('.');
    
    // Need at least 2 parts for a valid domain (name.tld)
    if (parts1.length < 2 || parts2.length < 2) return false;
    
    // Get root domain (last 2 parts: domain.tld)
    const root1 = parts1.slice(-2).join('.');
    const root2 = parts2.slice(-2).join('.');
    
    // Must match exactly (including TLD)
    // This ensures underline.com !== underline.cz
    // But allows mail.underline.com === underline.com
    return root1 === root2;
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
   * ENHANCED: Uses larger page sizes and cursor-based pagination for more results
   *
   * @param {object} query - Elasticsearch query
   * @param {number} maxPages - Maximum pages to fetch
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} maxResults - Maximum total results to fetch (default from config)
   * @returns {object} { employees: Array, totalAvailable: number, hitLimit: boolean }
   */
  async executeSearch(query, maxPages = 10, maxRetries = 3, maxResults = null) {
    let allEmployees = [];
    let lastError;
    let totalAvailable = null;
    let hitLimit = false;
    let cursor = null; // For cursor-based pagination

    // Use config defaults if not specified
    const effectiveMaxResults = maxResults || this.config.maxTotalResults;
    const itemsPerPage = this.config.itemsPerPage;

    for (let page = 1; page <= maxPages; page++) {
      // Stop if we've hit our target
      if (allEmployees.length >= effectiveMaxResults) {
        console.log(`✅ Reached target of ${effectiveMaxResults} results, stopping pagination`);
        break;
      }

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔍 Coresignal API page ${page}/${maxPages}, attempt ${attempt}/${maxRetries}...`);

          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);

          // Build URL with cursor-based pagination if available
          let url = `${this.baseUrl}/employee_multi_source/search/es_dsl/preview?items_per_page=${itemsPerPage}`;
          if (cursor) {
            url += `&after=${encodeURIComponent(cursor)}`;
          } else {
            url += `&page=${page}`;
          }

          const response = await fetch(url, {
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

          // Read pagination headers
          const nextPageCursor = response.headers.get('x-next-page-after');
          const totalResults = parseInt(response.headers.get('x-total-results') || '0');
          const totalPages = parseInt(response.headers.get('x-total-pages') || '1');

          // CRITICAL: Read x-total-results header on first page
          if (page === 1) {
            totalAvailable = totalResults;
            // Calculate if we need multi-query based on available results vs what we can fetch
            const maxFetchable = Math.min(effectiveMaxResults, maxPages * itemsPerPage);
            hitLimit = totalAvailable > maxFetchable;

            if (totalAvailable > 0) {
              console.log(`📊 Total results available: ${totalAvailable} (fetching up to ${maxFetchable})`);
              if (hitLimit) {
                console.log(`⚠️  LIMIT HIT: ${totalAvailable - maxFetchable} results may need multi-query strategy`);
              }
            }
          }

          // Update cursor for next page
          cursor = nextPageCursor;

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
            return {
              employees: allEmployees,
              totalAvailable: totalAvailable || allEmployees.length,
              hitLimit: hitLimit
            };
          }

          allEmployees = allEmployees.concat(pageEmployees);
          console.log(`📊 Page ${page}: Found ${pageEmployees.length} employees (Total: ${allEmployees.length})`);

          // If we got fewer than requested, we've reached the end of results
          if (pageEmployees.length < itemsPerPage) {
            console.log(`📄 Less than ${itemsPerPage} employees on page ${page}, stopping pagination`);
            return {
              employees: allEmployees,
              totalAvailable: totalAvailable || allEmployees.length,
              hitLimit: hitLimit
            };
          }

          // If no cursor for next page, we've reached the end
          if (!cursor) {
            console.log(`📄 No cursor for next page, stopping pagination`);
            return {
              employees: allEmployees,
              totalAvailable: totalAvailable || allEmployees.length,
              hitLimit: hitLimit
            };
          }

          // Rate limiting between requests (18 req/sec limit)
          if (page < maxPages) {
            await delay(this.config.rateLimitDelay);
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
              return {
                employees: allEmployees,
                totalAvailable: totalAvailable || allEmployees.length,
                hitLimit: hitLimit
              };
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

    return {
      employees: allEmployees,
      totalAvailable: totalAvailable || allEmployees.length,
      hitLimit: hitLimit
    };
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
    const result = await this.executeSearch(query);
    return result.employees; // Extract employees array for backward compatibility
  }

  /**
   * 🧠 INTELLIGENT MULTI-QUERY SYSTEM
   * Automatically splits queries when hitting Coresignal preview API limits (100 results max)
   * Implements intelligent pagination by generating refined sub-queries
   *
   * @param {object} companyData - Company data for search
   * @param {object} customFiltering - Custom filtering configuration with departments/titles
   * @param {number} maxResults - Maximum total results to fetch (default 500)
   * @returns {Promise<Array>} Array of all employees from multiple queries (deduplicated)
   */
  async intelligentMultiQuery(companyData, customFiltering, maxResults = 500) {
    console.log(`🧠 INTELLIGENT MULTI-QUERY ACTIVATED`);
    console.log(`📊 Target: ${companyData.name || companyData.linkedinUrl}`);
    console.log(`🎯 Max results: ${maxResults}`);

    // Execute base query first
    const baseResult = await this.discoverAllStakeholders(
      companyData,
      5, // maxPages
      'strict',
      'custom',
      customFiltering,
      false // skipEnrichment
    );

    const allEmployees = Array.isArray(baseResult) ? baseResult : (baseResult.employees || []);
    const totalAvailable = baseResult.totalAvailable || allEmployees.length;
    const hitLimit = baseResult.hitLimit || false;

    console.log(`📊 Base query results: ${allEmployees.length}/${totalAvailable} (hitLimit: ${hitLimit})`);

    // If we didn't hit the limit or already have enough, done
    if (!hitLimit || allEmployees.length >= maxResults || totalAvailable <= 100) {
      console.log(`✅ No additional queries needed (sufficient data or no limit hit)`);
      return allEmployees;
    }

    // Calculate how many more results we want
    const remaining = Math.min(totalAvailable - allEmployees.length, maxResults - allEmployees.length);
    console.log(`🔍 ${remaining} results remaining - generating refined queries...`);

    // Select splitting strategy
    const strategy = this.selectSplittingStrategy(customFiltering, totalAvailable, allEmployees.length);
    console.log(`🎯 Strategy: ${strategy}`);

    // Generate refined queries
    const refinedQueries = this.generateRefinedQueries(companyData, customFiltering, strategy);
    console.log(`📋 Generated ${refinedQueries.length} refined queries`);

    // Execute refined queries and merge results
    for (let i = 0; i < refinedQueries.length; i++) {
      if (allEmployees.length >= maxResults) {
        console.log(`✅ Reached max results (${maxResults}), stopping`);
        break;
      }

      const refinedQuery = refinedQueries[i];
      console.log(`🔍 Query ${i + 1}/${refinedQueries.length}: ${refinedQuery._splitDescription}...`);

      try {
        const refinedResult = await this.discoverAllStakeholders(
          refinedQuery.companyData,
          5,
          'strict',
          'custom',
          refinedQuery.customFiltering,
          false
        );

        const refinedEmployees = Array.isArray(refinedResult) ? refinedResult : (refinedResult.employees || []);

        // Deduplicate by Coresignal ID
        const newEmployees = refinedEmployees.filter(e =>
          !allEmployees.some(existing => existing.id === e.id)
        );

        allEmployees.push(...newEmployees);
        console.log(`   ✅ +${newEmployees.length} new (${allEmployees.length} total, ${refinedEmployees.length} fetched)`);

        // Rate limiting: 100ms between queries
        if (i < refinedQueries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.log(`   ⚠️  Query failed: ${error.message}`);
        // Continue with next query
      }
    }

    console.log(`🎉 Intelligent multi-query complete: ${allEmployees.length} total employees`);
    return allEmployees;
  }

  /**
   * Select optimal splitting strategy based on query characteristics
   * @param {object} customFiltering - Custom filtering configuration
   * @param {number} totalResults - Total results available
   * @param {number} fetchedResults - Results already fetched
   * @returns {string} Strategy name: DEPARTMENT_SPLIT, TITLE_SPLIT, or SENIORITY_SPLIT
   */
  selectSplittingStrategy(customFiltering, totalResults, fetchedResults) {
    const remaining = totalResults - fetchedResults;

    // Check what's available in the configuration
    const primaryDepartments = customFiltering?.departments?.primary || [];
    const primaryTitles = customFiltering?.titles?.primary || [];
    const hasMultipleDepartments = primaryDepartments.length > 1;
    const hasMultipleTitles = primaryTitles.length > 5;

    // Decision tree for strategy selection
    if (hasMultipleDepartments && remaining > 500) {
      return 'DEPARTMENT_SPLIT'; // Best for large result sets with multiple departments
    } else if (hasMultipleTitles && remaining > 300) {
      return 'TITLE_SPLIT'; // Split by specific title groups
    } else {
      return 'SENIORITY_SPLIT'; // Default: split by seniority level
    }
  }

  /**
   * Generate refined queries based on splitting strategy
   * @param {object} companyData - Original company data
   * @param {object} customFiltering - Original custom filtering
   * @param {string} strategy - Splitting strategy
   * @returns {Array} Array of refined query objects
   */
  generateRefinedQueries(companyData, customFiltering, strategy) {
    switch (strategy) {
      case 'DEPARTMENT_SPLIT':
        return this.generateDepartmentQueries(companyData, customFiltering);
      case 'TITLE_SPLIT':
        return this.generateTitleQueries(companyData, customFiltering);
      case 'SENIORITY_SPLIT':
        return this.generateSeniorityQueries(companyData, customFiltering);
      default:
        return [];
    }
  }

  /**
   * Split query by individual departments
   * @param {object} companyData - Company data
   * @param {object} customFiltering - Custom filtering
   * @returns {Array} Array of department-specific queries
   */
  generateDepartmentQueries(companyData, customFiltering) {
    const primaryDepartments = customFiltering?.departments?.primary || [];

    // Create one query per department
    return primaryDepartments.map(dept => ({
      companyData: { ...companyData },
      customFiltering: {
        ...customFiltering,
        departments: {
          primary: [dept], // Single department
          secondary: customFiltering?.departments?.secondary || []
        }
      },
      _splitStrategy: 'department',
      _splitValue: dept,
      _splitDescription: `Department: ${dept}`
    }));
  }

  /**
   * Split query by title groups
   * @param {object} companyData - Company data
   * @param {object} customFiltering - Custom filtering
   * @returns {Array} Array of title-specific queries
   */
  generateTitleQueries(companyData, customFiltering) {
    const primaryTitles = customFiltering?.titles?.primary || [];

    // Group titles into sets of 3-5 each
    const titleGroups = [];
    for (let i = 0; i < primaryTitles.length; i += 3) {
      titleGroups.push(primaryTitles.slice(i, i + 3));
    }

    return titleGroups.map((titleGroup, index) => ({
      companyData: { ...companyData },
      customFiltering: {
        ...customFiltering,
        titles: {
          primary: titleGroup,
          secondary: []
        }
      },
      _splitStrategy: 'title',
      _splitValue: titleGroup.join(', '),
      _splitDescription: `Titles: ${titleGroup.slice(0, 2).join(', ')}...`
    }));
  }

  /**
   * Split query by seniority levels
   * @param {object} companyData - Company data
   * @param {object} customFiltering - Custom filtering
   * @returns {Array} Array of seniority-specific queries
   */
  generateSeniorityQueries(companyData, customFiltering) {
    const seniorityLevels = [
      {
        name: 'VP/SVP',
        keywords: ['vp', 'vice president', 'svp', 'senior vice president'],
        description: 'VP/SVP level'
      },
      {
        name: 'Director',
        keywords: ['director', 'senior director'],
        description: 'Director level'
      },
      {
        name: 'Manager',
        keywords: ['manager', 'senior manager', 'engineering manager', 'product manager'],
        description: 'Manager level'
      },
      {
        name: 'Lead/Principal',
        keywords: ['lead', 'principal', 'staff', 'senior engineer', 'senior analyst'],
        description: 'Lead/Principal level'
      }
    ];

    return seniorityLevels.map(level => ({
      companyData: { ...companyData },
      customFiltering: {
        ...customFiltering,
        titles: {
          primary: level.keywords,
          secondary: []
        }
      },
      _splitStrategy: 'seniority',
      _splitValue: level.name,
      _splitDescription: level.description
    }));
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