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
   * @param {string} companyIdentifier - LinkedIn URL, website, or domain
   * @returns {object} Company intelligence data
   */
  async research(companyIdentifier) {
    console.log(`🔍 Researching company: ${companyIdentifier}`);
    
    // 1. Check database first (free)
    const dbCompany = await this.queryDatabase(companyIdentifier);
    
    // 2. Use cached if fresh (<30 days)
    if (dbCompany && isDataFresh(dbCompany, 30)) {
      console.log('✅ Using cached company data from database');
      return this.extractIntelligence(dbCompany.customFields?.coresignalData);
    }
    
    // 3. Fetch from Coresignal (balanced approach)
    console.log('🌐 Fetching fresh data from Coresignal API');
    const coresignalData = await this.fetchFromCoresignal(companyIdentifier);
    
    // 4. Cache in database for future use
    if (dbCompany?.id) {
      await this.cacheInDatabase(dbCompany.id, coresignalData);
    }
    
    return this.extractIntelligence(coresignalData);
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
          companyIntelligence: true,
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
   * @returns {object} Structured intelligence data
   */
  extractIntelligence(coresignalData) {
    if (!coresignalData) {
      return {
        employeeCount: 100,
        revenue: 0,
        industry: 'Unknown',
        growthRate: 0,
        activeHiring: 0,
        fundingStage: 'unknown',
        dataSource: 'default'
      };
    }

    return {
      employeeCount: coresignalData.employees_count || 100,
      revenue: coresignalData.revenue_annual?.annual_revenue || 0,
      industry: coresignalData.industry || 'Unknown',
      growthRate: coresignalData.employees_count_change?.change_yearly_percentage || 0,
      activeHiring: coresignalData.active_job_postings_count || 0,
      fundingStage: coresignalData.funding_rounds?.length > 0 ? 'funded' : 'bootstrapped',
      dataSource: 'coresignal',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate optimal search parameters based on company size and deal size
   * @param {object} intelligence - Company intelligence data
   * @param {number} dealSize - Deal size in USD
   * @returns {object} Optimal parameters for search
   */
  calculateOptimalParameters(intelligence, dealSize) {
    // Company-size-aware search sizing
    let searchSize;
    if (intelligence.employeeCount <= 50) {
      searchSize = 20;
    } else if (intelligence.employeeCount <= 500) {
      searchSize = 40;
    } else if (intelligence.employeeCount <= 5000) {
      searchSize = 60;
    } else {
      searchSize = 100;
    }
    
    // Company tier-based buyer group sizing
    const companyTier = determineCompanySizeTier(intelligence.revenue, intelligence.employeeCount);
    const buyerGroupSize = getBuyerGroupSizeForTier(companyTier);
    
    // Add tier information to intelligence
    intelligence.tier = companyTier;
    
    const maxPreviewPages = Math.ceil(searchSize / 10);
    
    console.log(`📊 Optimal parameters:`, {
      companySize: intelligence.employeeCount,
      dealSize: dealSize,
      searchSize: searchSize,
      maxPreviewPages: maxPreviewPages,
      buyerGroupSize: buyerGroupSize
    });
    
    return { 
      searchSize, 
      maxPreviewPages, 
      buyerGroupSize,
      companySize: intelligence.employeeCount,
      industry: intelligence.industry
    };
  }

  /**
   * Fetch company data from Coresignal API
   * @param {string} companyIdentifier - Company identifier
   * @returns {object} Coresignal company data
   */
  async fetchFromCoresignal(companyIdentifier) {
    const apiKey = process.env.CORESIGNAL_API_KEY;
    if (!apiKey) {
      throw new Error('CORESIGNAL_API_KEY not found in environment variables');
    }

    const domain = extractDomain(companyIdentifier);
    const baseUrl = 'https://api.coresignal.com/cdapi/v2';
    
    try {
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
   * Determine if company is actively hiring
   * @param {object} intelligence - Company intelligence
   * @returns {boolean} True if actively hiring
   */
  isActivelyHiring(intelligence) {
    return intelligence.activeHiring > 0 || intelligence.growthRate > 10;
  }
}

module.exports = { CompanyIntelligence };
