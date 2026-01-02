/**
 * Company Intelligence Module
 * 
 * Fetches company data with database-first approach and calculates optimal parameters
 */

const { extractDomain, extractLinkedInId, isDataFresh, sanitizeString } = require('./utils');
const { determineCompanySizeTier, getBuyerGroupSizeForTier } = require('./company-size-config');

class CompanyIntelligence {
  constructor(prisma, workspaceId) {
    this.prisma = prisma;
    this.workspaceId = workspaceId;
  }

  /**
   * Research company data with database-first approach
   * Uses workspace-specific company data as primary context
   * @param {string} companyIdentifier - LinkedIn URL, website, or domain
   * @returns {object} Company intelligence data
   */
  async research(companyIdentifier) {
    console.log(`🔍 Researching company: ${companyIdentifier}`);
    console.log(`   Workspace: ${this.workspaceId}`);
    
    // For simple domain identifiers (like "wgu.edu"), be extra careful about sub-entities
    // If the database company name suggests it's a sub-entity (contains "school", "college", etc.)
    // and we're searching for a simple domain, force fresh lookup to get the main company
    const isSimpleDomain = companyIdentifier && 
                           !companyIdentifier.includes('/') && 
                           !companyIdentifier.includes('http') && 
                           companyIdentifier.includes('.');
    
    // 1. Check database first (free) - uses workspace-specific data
    const dbCompany = await this.queryDatabase(companyIdentifier);
    let isLikelySubEntity = false;
    
    if (dbCompany) {
      console.log(`   ✅ Found workspace-specific company: ${dbCompany.name}`);
      console.log(`   📊 Using workspace company data as context`);
      
      // 2. Use cached Coresignal data if fresh (<30 days) AND it matches the identifier
      // Check if cached data matches the identifier we're searching for
      const cachedData = dbCompany.customFields?.coresignalData;
      
      if (isSimpleDomain) {
        const dbCompanyName = (dbCompany.name || '').toLowerCase();
        isLikelySubEntity = dbCompanyName.includes('school') || 
                           dbCompanyName.includes('college') ||
                           dbCompanyName.includes('department') ||
                           dbCompanyName.includes('division');
        
        if (isLikelySubEntity) {
          console.log(`   ⚠️  Database company (${dbCompany.name}) appears to be a sub-entity - forcing fresh lookup for main company`);
        }
      }
      
      if (!isLikelySubEntity && isDataFresh(dbCompany, 30) && cachedData) {
        // For simple domains, check if cached company website matches the domain
        // If searching for "wgu.edu", cached company should have website containing "wgu.edu"
        let identifierMatches = true;
        if (isSimpleDomain) {
          const cachedWebsite = cachedData?.website || dbCompany.website || '';
          const domainMatch = cachedWebsite.toLowerCase().includes(companyIdentifier.toLowerCase());
          if (!domainMatch) {
            identifierMatches = false;
            console.log(`   ⚠️  Cached company website (${cachedWebsite}) doesn't match identifier (${companyIdentifier})`);
          }
        }
        
        if (identifierMatches) {
          console.log('✅ Using cached company data from database');
          const intelligence = this.extractIntelligence(cachedData, dbCompany);
          // ENHANCED: Merge workspace-specific data (industry, size, etc.) with Coresignal data
          if (dbCompany.industry) intelligence.industry = dbCompany.industry;
          if (dbCompany.employeeCount) intelligence.employeeCount = dbCompany.employeeCount;
          if (dbCompany.revenue) intelligence.revenue = dbCompany.revenue;
          return intelligence;
        } else {
          console.log('⚠️  Cached data exists but doesn\'t match identifier - forcing fresh lookup');
        }
      }
    }
    
    // 3. Fetch from Coresignal (balanced approach)
    console.log('🌐 Fetching fresh data from Coresignal API');
    const coresignalData = await this.fetchFromCoresignal(companyIdentifier);
    
    // 4. Cache in database for future use
    if (dbCompany?.id) {
      await this.cacheInDatabase(dbCompany.id, coresignalData);
    }
    
    // ENHANCED: Always prioritize Coresignal data over database company
    // When we force a fresh lookup (e.g., for sub-entities), use Coresignal data exclusively
    const intelligence = this.extractIntelligence(coresignalData, dbCompany);
    
    // Debug: Log what we extracted
    if (coresignalData) {
      console.log(`   📊 Extracted from Coresignal: name=${intelligence.companyName}, linkedin=${intelligence.linkedinUrl}, website=${intelligence.website}`);
    }
    
    // Only merge workspace-specific fields if they don't conflict with Coresignal data
    // Don't overwrite company name, LinkedIn URL, or website from Coresignal
    if (dbCompany && !isLikelySubEntity) {
      if (dbCompany.industry && !intelligence.industry) intelligence.industry = dbCompany.industry;
      if (dbCompany.employeeCount && !intelligence.employeeCount) intelligence.employeeCount = dbCompany.employeeCount;
      if (dbCompany.revenue && !intelligence.revenue) intelligence.revenue = dbCompany.revenue;
      if (dbCompany.size) intelligence.size = dbCompany.size;
      console.log(`   📊 Merged workspace-specific data: industry=${intelligence.industry}, employees=${intelligence.employeeCount}`);
    }
    
    return intelligence;
  }

  /**
   * Query database for existing company data
   * @param {string} identifier - Company identifier
   * @returns {object|null} Company data from database
   */
  async queryDatabase(identifier) {
    const domain = extractDomain(identifier);
    const linkedinId = extractLinkedInId(identifier);
    
    try {
      return await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          OR: [
            linkedinId ? { linkedinUrl: { contains: linkedinId } } : undefined,
            { website: { contains: domain } },
            { domain: domain }
          ].filter(Boolean)
        },
        select: {
          id: true,
          name: true,
          website: true,
          linkedinUrl: true,
          employeeCount: true,
          revenue: true,
          industry: true,
          size: true,
          customFields: true, // Contains coresignalData
          // companyIntelligence: true, // Optional field - removed to avoid schema sync issues
          updatedAt: true
        }
      });
    } catch (error) {
      console.error('❌ Database query failed:', error.message);
      return null;
    }
  }

  /**
   * Extract intelligence from Coresignal data
   * @param {object} coresignalData - Raw Coresignal company data
   * @param {object} dbCompany - Database company record
   * @returns {object} Structured intelligence data
   */
  extractIntelligence(coresignalData, dbCompany = null) {
    const baseIntelligence = {
      employeeCount: coresignalData?.employees_count || 100,
      revenue: coresignalData?.revenue_annual?.annual_revenue || 0,
      industry: coresignalData?.industry || 'Unknown',
      growthRate: coresignalData?.employees_count_change?.change_yearly_percentage || 0,
      activeHiring: coresignalData?.active_job_postings_count || 0,
      fundingStage: coresignalData?.funding_rounds?.length > 0 ? 'funded' : 'bootstrapped',
      dataSource: coresignalData ? 'coresignal' : 'default',
      lastUpdated: new Date().toISOString()
    };

    // Add company identifiers - prioritize Coresignal data when available
    // This ensures we use the correct company data even if database has a different company
    if (coresignalData) {
      // Extract from Coresignal data first (most accurate)
      baseIntelligence.companyName = coresignalData.name || coresignalData.company_name;
      baseIntelligence.linkedinUrl = coresignalData.linkedin_url;
      baseIntelligence.website = coresignalData.website;
    }
    
    // Only use database company data as fallback if Coresignal data is missing
    if (dbCompany && !coresignalData) {
      baseIntelligence.companyName = dbCompany.name;
      baseIntelligence.linkedinUrl = dbCompany.linkedinUrl;
      baseIntelligence.website = dbCompany.website;
    }

    return baseIntelligence;
  }

  /**
   * Calculate optimal search parameters based on company size and deal size
   * @param {object} intelligence - Company intelligence data
   * @param {number} dealSize - Deal size in USD
   * @returns {object} Optimal parameters for search
   */
  calculateOptimalParameters(intelligence, dealSize) {
    const employeeCount = intelligence.employeeCount || 100;
    
    // Company-size-aware search strategy
    // IMPORTANT: Preview API maximum = 5 pages (100 results) per Coresignal documentation
    let searchStrategy, searchSize, maxPreviewPages, filteringLevel;

    if (employeeCount <= 100) {
      // Small companies: Get ALL employees for comprehensive understanding
      // Preview is cheap ($0.10), so we can afford to get everyone
      searchStrategy = 'comprehensive';
      searchSize = Math.min(100, employeeCount); // Preview API max = 100 results
      maxPreviewPages = Math.min(5, Math.max(3, Math.ceil(employeeCount / 20))); // Preview API max = 5 pages (20 per page)
      filteringLevel = 'none'; // No filtering - analyze everyone
    } else if (employeeCount <= 500) {
      // Medium companies: Get at least 100 people for good coverage
      searchStrategy = 'representative';
      searchSize = 100; // Preview API max = 100 results (5 pages × 20 per page)
      maxPreviewPages = 5; // Preview API maximum = 5 pages per Coresignal docs
      filteringLevel = 'light'; // Light filtering - keep more roles
    } else if (employeeCount <= 2000) {
      // Large companies: Sample 100 people (preview API limit)
      searchStrategy = 'sampling';
      searchSize = 100; // Preview API max = 100 results
      maxPreviewPages = 5; // Preview API maximum = 5 pages per Coresignal docs
      filteringLevel = 'moderate'; // Moderate filtering
    } else {
      // Enterprise: Sample 100 people with strict filtering
      searchStrategy = 'focused';
      searchSize = 100; // Preview API max = 100 results
      maxPreviewPages = 5; // Preview API maximum = 5 pages (100 results) per Coresignal docs
      filteringLevel = 'strict'; // Strict filtering - only relevant roles
    }
    
    // Company tier-based buyer group sizing
    const companyTier = determineCompanySizeTier(intelligence.revenue, intelligence.employeeCount);
    const buyerGroupSize = getBuyerGroupSizeForTier(companyTier, employeeCount);
    
    // Add tier information to intelligence
    intelligence.tier = companyTier;
    intelligence.searchStrategy = searchStrategy;
    intelligence.filteringLevel = filteringLevel;
    
    console.log(`📊 Optimal parameters:`, {
      companySize: employeeCount,
      searchStrategy: searchStrategy,
      searchSize: searchSize,
      maxPreviewPages: maxPreviewPages,
      filteringLevel: filteringLevel,
      dealSize: dealSize,
      buyerGroupSize: buyerGroupSize
    });
    
    return { 
      searchSize, 
      maxPreviewPages, 
      buyerGroupSize,
      companySize: employeeCount,
      industry: intelligence.industry,
      searchStrategy,
      filteringLevel
    };
  }

  /**
   * Fetch company data from Coresignal API
   * @param {string} companyIdentifier - Company identifier
   * @returns {object} Coresignal company data
   */
  async fetchFromCoresignal(companyIdentifier) {
    // Clean API key - remove newlines and trim whitespace
    const apiKey = (process.env.CORESIGNAL_API_KEY || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    if (!apiKey) {
      throw new Error('CORESIGNAL_API_KEY not found in environment variables');
    }

    const baseUrl = 'https://api.coresignal.com/cdapi/v2';
    
    // CRITICAL FIX: Don't extract domain from LinkedIn URLs
    // If identifier is a LinkedIn URL, search by LinkedIn instead
    // Support both /company/ and /school/ URLs
    const isLinkedInUrl = companyIdentifier && (
      companyIdentifier.includes('linkedin.com/company/') || 
      companyIdentifier.includes('linkedin.com/school/')
    );
    const isThirdPartyPlatform = this.isThirdPartyPlatform(companyIdentifier);
    
    // Only extract domain if it's actually a website URL (not LinkedIn, not third-party)
    let domain = null;
    if (!isLinkedInUrl && !isThirdPartyPlatform && companyIdentifier) {
      domain = extractDomain(companyIdentifier);
      // Reject if domain is clearly wrong (linkedin.com, booksy.com, etc.)
      if (this.isInvalidDomain(domain)) {
        console.log(`   ⚠️ Rejected invalid domain: ${domain}`);
        domain = null;
      }
    }
    
    try {
      // Priority 1: Search by LinkedIn URL if we have one
      if (isLinkedInUrl) {
        console.log('   🔍 Searching by LinkedIn URL (not domain)...');
        // Support both /company/ and /school/ URLs
        const linkedinMatch = companyIdentifier.match(/linkedin\.com\/(?:company|school)\/([^\/\?]+)/);
        const linkedinId = linkedinMatch?.[1];
        if (linkedinId) {
          const linkedinResult = await this.searchByLinkedInUrl(linkedinId);
          if (linkedinResult) {
            // Validate the match
            const isValid = this.validateCompanyMatch(linkedinResult, companyIdentifier, null);
            if (isValid) {
              console.log('✅ Found company via LinkedIn URL');
              return linkedinResult;
            } else {
              console.log('⚠️ LinkedIn URL match failed validation');
            }
          }
        }
      }
      
      // Priority 2: Try enrich endpoint first (simpler and more reliable for domains)
      if (domain) {
        console.log(`   🔍 Trying enrich endpoint with domain: ${domain}...`);
        try {
          const enrichUrl = `${baseUrl}/company_multi_source/enrich?website=${encodeURIComponent(domain)}`;
          const enrichResponse = await fetch(enrichUrl, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (enrichResponse.ok) {
            const enrichData = await enrichResponse.json();
            // Enrich endpoint can return data in two formats:
            // 1. { type: 'Success', data: { id, company_name, ... } }
            // 2. { id, company_name, type: 'Nonprofit', ... } (direct data)
            let companyId = null;
            let companyName = null;
            
            if (enrichData?.type === 'Success' && enrichData.data) {
              // Format 1: nested data
              companyId = enrichData.data.id;
              companyName = enrichData.data.company_name;
            } else if (enrichData?.id) {
              // Format 2: direct data (e.g., type: 'Nonprofit')
              companyId = enrichData.id;
              companyName = enrichData.company_name;
            }
            
            if (companyId) {
              console.log(`   ✅ Found company via enrich endpoint (ID: ${companyId}, Name: ${companyName})`);
              
              // Get full company data using collect endpoint
              const companyResponse = await fetch(`${baseUrl}/company_multi_source/collect/${companyId}`, {
                method: 'GET',
                headers: {
                  'apikey': apiKey,
                  'Accept': 'application/json'
                }
              });

              if (companyResponse.ok) {
                const companyData = await companyResponse.json();
                const isValidMatch = this.validateCompanyMatch(companyData, companyIdentifier, domain);
                if (isValidMatch) {
                  console.log(`✅ Found company via enrich endpoint: ${companyData.name || companyData.company_name}`);
                  return companyData;
                } else {
                  console.log(`⚠️ Enrich endpoint match failed validation for: ${companyData.name || companyData.company_name}`);
                }
              } else {
                console.log(`   ⚠️ Collect endpoint failed: ${companyResponse.status}`);
                // CRITICAL FIX: Use enrich data directly when collect endpoint fails
                // The enrich endpoint already has all the key data we need
                console.log(`   ✅ Using enrich endpoint data directly (collect failed)`);
                return {
                  id: enrichData.id || enrichData.data?.id,
                  name: enrichData.company_name || enrichData.data?.company_name,
                  company_name: enrichData.company_name || enrichData.data?.company_name,
                  linkedin_url: enrichData.linkedin_url || enrichData.data?.linkedin_url,
                  website: enrichData.website || enrichData.data?.website,
                  employees_count: enrichData.employees_count || enrichData.data?.employees_count,
                  industry: enrichData.industry || enrichData.data?.industry,
                  type: enrichData.type || enrichData.data?.type
                };
              }
            } else {
              console.log(`   ⚠️ Enrich endpoint response missing company ID`);
            }
          } else {
            const errorText = await enrichResponse.text().catch(() => '');
            console.log(`   ⚠️ Enrich endpoint returned status: ${enrichResponse.status}, error: ${errorText.substring(0, 100)}`);
          }
        } catch (enrichError) {
          console.log(`   ⚠️ Enrich endpoint failed: ${enrichError.message}`);
        }
      } else {
        console.log('   ⚠️ No valid domain available, skipping domain search');
      }
      
      // Priority 3: Search for company by domain using Elasticsearch queries (fallback)
      if (domain) {
        console.log(`   🔍 Trying Elasticsearch queries with domain: ${domain}...`);
      }
      
      // Search for company by domain using multiple approaches
      const searchApproaches = [
        {
          name: 'website.exact',
          query: {
            "query": {
              "term": {
                "website.exact": domain
              }
            }
          }
        },
        {
          name: 'website',
          query: {
            "query": {
              "term": {
                "website": domain
              }
            }
          }
        },
        {
          name: 'website.domain_only',
          query: {
            "query": {
              "term": {
                "website.domain_only": domain
              }
            }
          }
        }
      ];

      let searchData = null;
      let usedApproach = null;

      // Try each approach until we find results
      for (const approach of searchApproaches) {
        console.log(`   🔍 Trying ${approach.name} field...`);
        
        const searchResponse = await fetch(`${baseUrl}/company_multi_source/search/es_dsl?items_per_page=1`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(approach.query)
        });

        if (!searchResponse.ok) {
          console.log(`   ⚠️ ${approach.name} search failed: ${searchResponse.status}`);
          continue;
        }

        const data = await searchResponse.json();
        
        if (Array.isArray(data) && data.length > 0) {
          searchData = data;
          usedApproach = approach.name;
          console.log(`   ✅ Found ${data.length} results using ${approach.name} field`);
          break;
        } else {
          console.log(`   ⚠️ No results with ${approach.name} field`);
        }
      }

      if (!searchData || searchData.length === 0) {
        console.log('⚠️ No company found in Coresignal, using defaults');
        return null;
      }

      const companyId = searchData[0];
      
      // Get full company data using GET method
      const companyResponse = await fetch(`${baseUrl}/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Accept': 'application/json'
        }
      });

      if (!companyResponse.ok) {
        throw new Error(`Coresignal company fetch failed: ${companyResponse.status}`);
      }

      const companyData = await companyResponse.json();
      
      // CRITICAL: Validate company match - REJECT if invalid
      const isValidMatch = this.validateCompanyMatch(companyData, companyIdentifier, domain);
      if (!isValidMatch) {
        console.log('❌ Company match validation FAILED - rejecting wrong company');
        console.log(`   Expected domain: ${domain || 'N/A'}`);
        console.log(`   Found company: ${companyData.name || 'Unknown'}`);
        console.log(`   Found website: ${companyData.website || 'Unknown'}`);
        console.log(`   This company will be skipped to prevent wrong data`);
        // REJECT wrong matches - return null instead of wrong data
        return null;
      } else {
        console.log('✅ Company match validated successfully');
      }
      
      console.log('✅ Successfully fetched company data from Coresignal');
      
      return companyData;
      
    } catch (error) {
      console.error('❌ Coresignal API error:', error.message);
      return null;
    }
  }

  /**
   * Cache Coresignal data in database
   * @param {string} companyId - Database company ID
   * @param {object} coresignalData - Coresignal data to cache
   */
  async cacheInDatabase(companyId, coresignalData) {
    if (!coresignalData) return;

    try {
      await this.prisma.companies.update({
        where: { id: companyId },
        data: {
          customFields: {
            coresignalData: coresignalData,
            lastCoresignalUpdate: new Date().toISOString()
          },
          employeeCount: coresignalData.employees_count || null,
          industry: coresignalData.industry || null,
          updatedAt: new Date()
        }
      });
      
      console.log('💾 Cached Coresignal data in database');
    } catch (error) {
      console.error('❌ Failed to cache data:', error.message);
    }
  }

  /**
   * Check if domain is a third-party platform (not actual company website)
   * @param {string} identifier - Company identifier
   * @returns {boolean} True if third-party platform
   */
  isThirdPartyPlatform(identifier) {
    if (!identifier) return false;
    const thirdPartyPlatforms = [
      'booksy.com',
      'yelp.com',
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'linkedin.com', // LinkedIn is not a company website
      'google.com',
      'apple.com'
    ];
    return thirdPartyPlatforms.some(platform => identifier.toLowerCase().includes(platform));
  }

  /**
   * Check if domain is invalid for company search
   * @param {string} domain - Domain to check
   * @returns {boolean} True if invalid
   */
  isInvalidDomain(domain) {
    if (!domain) return true;
    const invalidDomains = [
      'linkedin.com',
      'booksy.com',
      'yelp.com',
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'google.com',
      'apple.com',
      'microsoft.com'
    ];
    return invalidDomains.some(invalid => domain.toLowerCase().includes(invalid));
  }

  /**
   * Search for company by LinkedIn URL
   * @param {string} linkedinId - LinkedIn company ID
   * @returns {object|null} Company data
   */
  async searchByLinkedInUrl(linkedinId) {
    // Clean API key - remove newlines and trim whitespace
    const apiKey = (process.env.CORESIGNAL_API_KEY || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    if (!apiKey) return null;

    const baseUrl = 'https://api.coresignal.com/cdapi/v2';
    
    try {
      // Normalize LinkedIn ID (remove -com, -inc, etc.)
      const normalizedId = this.normalizeLinkedInId(linkedinId);
      
      const query = {
        query: {
          bool: {
            should: [
              { match: { linkedin_url: normalizedId } },
              { match: { linkedin_url: linkedinId } }, // Also try original
              { match_phrase: { linkedin_url: normalizedId } }
            ],
            minimum_should_match: 1
          }
        }
      };

      const response = await fetch(`${baseUrl}/company_multi_source/search/es_dsl?items_per_page=1`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const companyId = data[0];
        const companyResponse = await fetch(`${baseUrl}/company_multi_source/collect/${companyId}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Accept': 'application/json'
          }
        });

        if (companyResponse.ok) {
          return await companyResponse.json();
        }
      }
    } catch (error) {
      console.error('LinkedIn URL search error:', error.message);
    }
    
    return null;
  }

  /**
   * Normalize LinkedIn company ID (remove common suffixes)
   * @param {string} linkedinId - LinkedIn ID
   * @returns {string} Normalized ID
   */
  normalizeLinkedInId(linkedinId) {
    if (!linkedinId) return '';
    // Remove common suffixes like -com, -inc, -llc
    return linkedinId.replace(/-(com|inc|llc|ltd|corp)$/i, '');
  }

  /**
   * Validate that the matched company is actually the one we're looking for
   * ENHANCED: Stricter validation to prevent wrong matches
   * @param {object} companyData - Coresignal company data
   * @param {string} originalIdentifier - Original identifier used for search
   * @param {string} expectedDomain - Expected domain
   * @returns {boolean} True if match is valid
   */
  validateCompanyMatch(companyData, originalIdentifier, expectedDomain) {
    if (!companyData) return false;
    
    const companyName = (companyData.name || '').toLowerCase();
    const companyWebsite = (companyData.website || '').toLowerCase();
    const companyLinkedIn = (companyData.linkedin_url || '').toLowerCase();
    
    // Normalize domain for comparison
    const normalizeDomain = (url) => {
      if (!url) return '';
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    };
    
    const normalizedExpectedDomain = expectedDomain ? normalizeDomain(expectedDomain) : null;
    const normalizedCompanyWebsite = normalizeDomain(companyWebsite);
    
    // CRITICAL: Reject if company website is a third-party platform
    if (this.isThirdPartyPlatform(companyWebsite)) {
      console.log(`   ❌ Rejected: Company website is third-party platform: ${companyWebsite}`);
      return false;
    }
    
    // CRITICAL: Reject if expected domain is invalid but company has valid domain
    if (normalizedExpectedDomain && this.isInvalidDomain(normalizedExpectedDomain)) {
      // If we searched with invalid domain, only accept if LinkedIn matches
      if (originalIdentifier && originalIdentifier.includes('linkedin.com')) {
        const linkedinId = originalIdentifier.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
        if (linkedinId && companyLinkedIn.includes(this.normalizeLinkedInId(linkedinId))) {
          return true; // LinkedIn match is valid even if domain was invalid
        }
      }
      return false; // Reject if domain was invalid and no LinkedIn match
    }
    
    // Check 1: Domain match (strongest signal)
    if (normalizedExpectedDomain && normalizedCompanyWebsite) {
      if (normalizedCompanyWebsite === normalizedExpectedDomain) {
        return true; // Perfect domain match
      }
      // Check parent domain match (e.g., sketchup.trimble.com matches trimble.com)
      const expectedParts = normalizedExpectedDomain.split('.');
      const companyParts = normalizedCompanyWebsite.split('.');
      if (expectedParts.length >= 2 && companyParts.length >= 2) {
        const expectedRoot = expectedParts.slice(-2).join('.');
        const companyRoot = companyParts.slice(-2).join('.');
        if (expectedRoot === companyRoot) {
          return true; // Parent domain match
        }
      }
      // If domains don't match at all, reject
      if (normalizedExpectedDomain !== normalizedCompanyWebsite) {
        console.log(`   ❌ Domain mismatch: expected ${normalizedExpectedDomain}, got ${normalizedCompanyWebsite}`);
        return false;
      }
    }
    
    // Check 2: LinkedIn URL match (strong signal)
    if (originalIdentifier && originalIdentifier.includes('linkedin.com')) {
      const linkedinId = originalIdentifier.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
      if (linkedinId) {
        const normalizedId = this.normalizeLinkedInId(linkedinId);
        if (companyLinkedIn.includes(normalizedId) || companyLinkedIn.includes(linkedinId)) {
          return true; // LinkedIn match
        }
      }
    }
    
    // Check 3: Company name similarity (weaker signal - only if no domain/LinkedIn)
    if (!normalizedExpectedDomain && originalIdentifier && !originalIdentifier.includes('http')) {
      const identifierName = originalIdentifier.toLowerCase();
      const nameSimilarity = this.calculateNameSimilarity(identifierName, companyName);
      if (nameSimilarity > 0.8) { // Higher threshold for name-only matches
        return true;
      }
    }
    
    // If we have an expected domain but company website doesn't match, reject
    if (normalizedExpectedDomain && normalizedCompanyWebsite && normalizedCompanyWebsite !== normalizedExpectedDomain) {
      console.log(`   ❌ Domain mismatch: expected ${normalizedExpectedDomain}, got ${normalizedCompanyWebsite}`);
      return false;
    }
    
    // If we searched by LinkedIn but LinkedIn doesn't match, reject
    if (originalIdentifier && originalIdentifier.includes('linkedin.com') && companyLinkedIn) {
      const linkedinId = originalIdentifier.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
      if (linkedinId && !companyLinkedIn.includes(this.normalizeLinkedInId(linkedinId))) {
        console.log(`   ❌ LinkedIn mismatch: expected ${linkedinId}, got ${companyLinkedIn}`);
        return false;
      }
    }
    
    // Default: Reject if we can't verify match (safer to reject than accept wrong match)
    console.log(`   ⚠️ Cannot verify company match - rejecting for safety`);
    return false;
  }

  /**
   * Calculate similarity between two company names
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {number} Similarity score (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    // Remove common suffixes and normalize
    const normalize = (name) => {
      return name
        .toLowerCase()
        .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    
    const norm1 = normalize(name1);
    const norm2 = normalize(name2);
    
    if (norm1 === norm2) return 1.0;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    // Simple Levenshtein-like check
    const longer = norm1.length > norm2.length ? norm1 : norm2;
    const shorter = norm1.length > norm2.length ? norm2 : norm1;
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return 1 - (distance / longer.length);
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
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
   * Get company size category
   * @param {number} employeeCount - Number of employees
   * @returns {string} Size category
   */
  getCompanySizeCategory(employeeCount) {
    if (employeeCount <= 10) return 'startup';
    if (employeeCount <= 50) return 'small';
    if (employeeCount <= 500) return 'medium';
    if (employeeCount <= 5000) return 'large';
    return 'enterprise';
  }

  /**
   * Search for company by name in Coresignal with enhanced matching
   * @param {string} companyName - Company name to search
   * @returns {object|null} Company data with LinkedIn URL
   */
  async searchCompanyByName(companyName) {
    // Clean API key - remove newlines and trim whitespace
    const apiKey = (process.env.CORESIGNAL_API_KEY || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    if (!apiKey) {
      return null;
    }

    const baseUrl = 'https://api.coresignal.com/cdapi/v2';
    
    try {
      // Generate name variations for better matching
      const nameVariations = this.generateCompanyNameVariations(companyName);
      
      // Search by company name with multiple strategies
      const query = {
        query: {
          bool: {
            should: [
              // Exact phrase match (highest priority)
              { match_phrase: { name: companyName } },
              { match_phrase: { company_name: companyName } },
              // Fuzzy match
              { match: { name: { query: companyName, fuzziness: "AUTO" } } },
              { match: { company_name: { query: companyName, fuzziness: "AUTO" } } },
              // Try variations
              ...nameVariations.map(variation => ({
                match: { name: variation }
              })),
              ...nameVariations.map(variation => ({
                match: { company_name: variation }
              })),
              // Try without common suffixes
              { match: { name: companyName.replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '') } }
            ],
            minimum_should_match: 1
          }
        }
      };

      const response = await fetch(`${baseUrl}/company_multi_source/search/es_dsl?items_per_page=5`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // CRITICAL FIX: Use preview endpoint to get full data without separate collect call
        // This avoids credit exhaustion and gives us data to validate
        const previewResponse = await fetch(`${baseUrl}/company_multi_source/search/es_dsl/preview?items_per_page=5`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(query)
        });

        if (previewResponse.ok) {
          const companies = await previewResponse.json();
          
          if (Array.isArray(companies) && companies.length > 0) {
            // Validate each result and pick the best match
            let bestMatch = null;
            let bestScore = 0;
            
            for (const company of companies) {
              const foundCompanyName = company.company_name || company.name || '';
              const score = this.calculateNameSimilarity(companyName, foundCompanyName);
              
              // Require minimum 70% similarity to prevent wrong matches
              if (score >= 0.7 && score > bestScore) {
                bestMatch = company;
                bestScore = score;
              }
            }
            
            if (bestMatch) {
              console.log(`✅ Found valid company match: ${bestMatch.company_name || bestMatch.name} (similarity: ${(bestScore * 100).toFixed(1)}%)`);
              return bestMatch;
            } else {
              console.log(`⚠️  No valid company match found (all results below 70% similarity threshold)`);
              return null;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Company name search error:', error.message);
      return null;
    }
  }

  /**
   * Determine if company is actively hiring
   * @param {object} intelligence - Company intelligence
   * @returns {boolean} True if actively hiring
   */
  isActivelyHiring(intelligence) {
    return intelligence.activeHiring > 0 || intelligence.growthRate > 10;
  }
}

module.exports = { CompanyIntelligence };
