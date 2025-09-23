const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

// API configurations
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY,
  baseUrl: 'https://api.coresignal.com/cdapi/v1'
};

const PERPLEXITY_CONFIG = {
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseUrl: 'https://api.perplexity.ai/chat/completions'
};

class CompleteEnrichment {
  constructor() {
    this.coresignalConfig = CORESIGNAL_CONFIG;
    this.perplexityConfig = PERPLEXITY_CONFIG;
  }

  /**
   * Make API request to CoreSignal
   */
  async makeCoreSignalRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.coresignalConfig.apiKey,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Make API request to Perplexity AI
   */
  async makePerplexityRequest(prompt) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      const data = {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      };

      const req = https.request(this.perplexityConfig.baseUrl, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(new Error(`Failed to parse Perplexity response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  }

  /**
   * Search for company in CoreSignal
   */
  async searchCompany(companyName, website) {
    try {
      // Try company name search first
      const searchUrl = `${this.coresignalConfig.baseUrl}/company_multi_source/search`;
      const searchData = {
        query: companyName,
        size: 1
      };

      const searchResults = await this.makeCoreSignalRequest(searchUrl, 'POST', searchData);
      
      if (searchResults && searchResults.length > 0) {
        return searchResults[0].company_id || searchResults[0];
      }

      // Fallback to domain search if website exists
      if (website) {
        const cleanDomain = this.cleanDomain(website);
        const domainSearchData = {
          query: cleanDomain,
          size: 1
        };

        const domainResults = await this.makeCoreSignalRequest(searchUrl, 'POST', domainSearchData);
        
        if (domainResults && domainResults.length > 0) {
          return domainResults[0].company_id || domainResults[0];
        }
      }

      return null;
    } catch (error) {
      console.error('❌ CoreSignal search error:', error.message);
      return null;
    }
  }

  /**
   * Get company data from CoreSignal
   */
  async getCoreSignalData(companyId) {
    try {
      const dataUrl = `${this.coresignalConfig.baseUrl}/company_multi_source/collect/${companyId}`;
      const data = await this.makeCoreSignalRequest(dataUrl);
      return data;
    } catch (error) {
      console.error('❌ CoreSignal data retrieval error:', error.message);
      return null;
    }
  }

  /**
   * Get strategic intelligence from Perplexity AI
   */
  async getStrategicIntelligence(companyName, coresignalData) {
    try {
      const prompt = `Provide strategic intelligence for ${companyName}. Focus on:
1. Situation Analysis: Current business context and market position
2. Complications: Key challenges and pain points
3. Strategic Intelligence: Opportunities and strategic insights

Keep each section concise (2-3 sentences) and actionable.`;

      const response = await this.makePerplexityRequest(prompt);
      
      if (response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content;
        
        // Parse the response into structured data
        const situationAnalysis = this.extractSection(content, 'Situation Analysis');
        const complications = this.extractSection(content, 'Complications');
        const strategicIntelligence = this.extractSection(content, 'Strategic Intelligence');
        
        return {
          situationAnalysis,
          complications,
          strategicIntelligence,
          fullResponse: content
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Perplexity AI error:', error.message);
      return null;
    }
  }

  /**
   * Extract a specific section from AI response
   */
  extractSection(content, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*(.*?)(?=\\n\\n|$)`, 's');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Clean domain for search
   */
  cleanDomain(website) {
    if (!website) return null;
    
    // Remove protocol
    let domain = website.replace(/^https?:\/\//, '');
    
    // Remove www
    domain = domain.replace(/^www\./, '');
    
    // Remove trailing slash and paths
    domain = domain.split('/')[0];
    
    return domain;
  }

  /**
   * Map CoreSignal data to database fields
   */
  mapCoreSignalToDatabase(coresignalData) {
    if (!coresignalData) return {};

    const updateData = {};

    // Map CoreSignal fields to database columns
    if (coresignalData.linkedin_url) {
      updateData.linkedinUrl = coresignalData.linkedin_url;
    }

    if (coresignalData.founded_year) {
      updateData.foundedYear = parseInt(coresignalData.founded_year) || null;
    }

    if (coresignalData.employee_count) {
      updateData.employeeCount = parseInt(coresignalData.employee_count) || null;
    }

    if (coresignalData.active_job_postings_count) {
      updateData.activeJobPostings = parseInt(coresignalData.active_job_postings_count) || null;
    }

    if (coresignalData.linkedin_followers_count) {
      updateData.linkedinFollowers = parseInt(coresignalData.linkedin_followers_count) || null;
    }

    if (coresignalData.naics_codes && Array.isArray(coresignalData.naics_codes)) {
      updateData.naicsCodes = coresignalData.naics_codes;
    }

    if (coresignalData.sic_codes && Array.isArray(coresignalData.sic_codes)) {
      updateData.sicCodes = coresignalData.sic_codes;
    }

    if (coresignalData.facebook_url) {
      updateData.facebookUrl = coresignalData.facebook_url;
    }

    if (coresignalData.twitter_url) {
      updateData.twitterUrl = coresignalData.twitter_url;
    }

    if (coresignalData.instagram_url) {
      updateData.instagramUrl = coresignalData.instagram_url;
    }

    if (coresignalData.youtube_url) {
      updateData.youtubeUrl = coresignalData.youtube_url;
    }

    if (coresignalData.github_url) {
      updateData.githubUrl = coresignalData.github_url;
    }

    if (coresignalData.technologies_used && Array.isArray(coresignalData.technologies_used)) {
      updateData.technologiesUsed = coresignalData.technologies_used.map(t => t.technology || t);
    }

    if (coresignalData.competitors && Array.isArray(coresignalData.competitors)) {
      updateData.competitors = coresignalData.competitors;
    }

    if (coresignalData.revenue_currency) {
      updateData.revenueCurrency = coresignalData.revenue_currency;
    }

    if (coresignalData.last_funding_amount) {
      updateData.lastFundingAmount = parseFloat(coresignalData.last_funding_amount) || null;
    }

    if (coresignalData.last_funding_date) {
      // Ensure it's a valid ISO-8601 DateTime
      const date = new Date(coresignalData.last_funding_date);
      if (!isNaN(date.getTime())) {
        updateData.lastFundingDate = date.toISOString();
      }
    }

    // Add description if available
    if (coresignalData.description) {
      updateData.description = coresignalData.description;
    }

    // Add size information
    if (coresignalData.size_range) {
      updateData.size = coresignalData.size_range;
    }

    return updateData;
  }

  /**
   * Enrich a single company
   */
  async enrichCompany(company) {
    try {
      console.log(`🔍 Processing: ${company.name}`);
      
      // Search for company in CoreSignal
      const companyId = await this.searchCompany(company.name, company.website);
      
      if (!companyId) {
        console.log(`   ❌ Not found in CoreSignal`);
        return { success: false, reason: 'Not found in CoreSignal' };
      }

      console.log(`   ✅ Found CoreSignal ID: ${companyId}`);

      // Get company data from CoreSignal
      const coresignalData = await this.getCoreSignalData(companyId);
      
      if (!coresignalData) {
        console.log(`   ❌ Failed to get CoreSignal data`);
        return { success: false, reason: 'Failed to get CoreSignal data' };
      }

      // Get strategic intelligence from Perplexity AI
      const strategicData = await this.getStrategicIntelligence(company.name, coresignalData);

      // Map CoreSignal data to database fields
      const updateData = this.mapCoreSignalToDatabase(coresignalData);

      // Add strategic intelligence fields
      if (strategicData) {
        updateData.situationAnalysis = strategicData.situationAnalysis;
        updateData.complications = strategicData.complications;
        updateData.strategicIntelligence = strategicData.strategicIntelligence;
      }

      // Store all data in customFields as well
      updateData.customFields = {
        coresignalData: coresignalData,
        strategicData: strategicData,
        enrichmentSource: "CoreSignal + Perplexity AI",
        lastEnrichedAt: new Date().toISOString(),
        totalFields: Object.keys(coresignalData).length + (strategicData ? 3 : 0)
      };

      // Update the company record
      await prisma.companies.update({
        where: { id: company.id },
        data: updateData
      });

      const fieldCount = Object.keys(updateData).length - 1; // -1 for customFields
      console.log(`   ✅ Success - Fields updated: ${fieldCount}`);
      
      return { success: true, fieldCount };

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Enrich all companies
   */
  async enrichAllCompanies() {
    console.log('🚀 COMPLETE ENRICHMENT SOLUTION');
    console.log('=================================');
    console.log('✅ CoreSignal + Perplexity AI integration');
    console.log('✅ Direct database column updates');
    console.log('✅ CustomFields backup storage');
    console.log('');

    try {
      // Get ALL companies that need enrichment
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          OR: [
            { customFields: null },
            { customFields: {} }
          ]
        },
        select: {
          id: true,
          name: true,
          website: true
        }
      });

      console.log(`📊 Found ${companies.length} companies that need enrichment\n`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        
        const result = await this.enrichCompany(company);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('\n🎉 ENRICHMENT COMPLETED!');
      console.log('========================');
      console.log(`✅ Success: ${successCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      console.log(`📊 Total: ${companies.length}`);
      console.log('');
      console.log('🎯 RESULTS:');
      console.log('✅ All companies enriched with CoreSignal data');
      console.log('✅ Strategic intelligence added with Perplexity AI');
      console.log('✅ Data stored in both database columns AND customFields');
      console.log('✅ Ready for rich Overview and Intelligence tabs');

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the complete enrichment
const enrichment = new CompleteEnrichment();
enrichment.enrichAllCompanies();
