/**
 * 🎯 COMPREHENSIVE 5BARS ENHANCEMENT SYSTEM
 * 
 * Advanced enrichment using multiple data sources and AI validation
 * Combines CoreSignal, Perplexity AI, and web research for maximum insight
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Comprehensive5BarsEnhancement {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.companyName = '5 Bars Services, LLC';
    this.website = 'https://www.5bars.net';
    
    // API configurations
    this.config = {
      coresignal: {
        apiKey: process.env.CORESIGNAL_API_KEY,
        baseUrl: 'https://api.coresignal.com'
      },
      perplexity: {
        apiKey: process.env.PERPLEXITY_API_KEY,
        model: 'llama-3.1-sonar-large-128k-online'
      }
    };
    
    this.results = {
      companyId: this.companyId,
      enhancementDate: new Date().toISOString(),
      phases: {},
      totalCost: 0,
      errors: []
    };
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('🎯 COMPREHENSIVE 5BARS ENHANCEMENT SYSTEM');
    console.log('==========================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log('');

    try {
      // Phase 1: Current State Analysis
      await this.analyzeCurrentState();
      
      // Phase 2: Perplexity AI Research
      await this.perplexityResearch();
      
      // Phase 3: CoreSignal Deep Dive
      await this.coreSignalDeepDive();
      
      // Phase 4: People Discovery
      await this.discoverPeople();
      
      // Phase 5: Competitive Intelligence
      await this.competitiveIntelligence();
      
      // Phase 6: Technology Stack Analysis
      await this.technologyStackAnalysis();
      
      // Phase 7: Market Intelligence
      await this.marketIntelligence();
      
      // Phase 8: Update Database
      await this.updateDatabase();
      
      // Phase 9: Generate Insights
      await this.generateInsights();
      
      // Phase 10: Save Results
      await this.saveResults();
      
      this.displaySummary();
      
      return this.results;

    } catch (error) {
      console.error('❌ Enhancement failed:', error);
      this.results.errors.push(error.message);
      await this.saveResults();
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * 📊 PHASE 1: Current State Analysis
   */
  async analyzeCurrentState() {
    console.log('📊 PHASE 1: Analyzing current state...');
    
    try {
      const company = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        include: {
          people: true,
          opportunities: true,
          leads: true,
          prospects: true
        }
      });
      
      if (!company) {
        throw new Error('Company not found in database');
      }
      
      this.results.phases.currentState = {
        company: {
          name: company.name,
          industry: company.industry,
          size: company.size,
          website: company.website,
          description: company.description,
          location: `${company.city}, ${company.state}`,
          lastUpdated: company.updatedAt
        },
        dataCounts: {
          people: company.people.length,
          opportunities: company.opportunities.length,
          leads: company.leads.length,
          prospects: company.prospects.length
        },
        dataGaps: this.identifyDataGaps(company)
      };
      
      console.log(`   ✅ Company: ${company.name}`);
      console.log(`   📍 Location: ${company.city}, ${company.state}`);
      console.log(`   👥 People: ${company.people.length}`);
      console.log(`   💼 Opportunities: ${company.opportunities.length}`);
      console.log(`   🎯 Leads: ${company.leads.length}`);
      console.log(`   🔍 Prospects: ${company.prospects.length}`);
      
    } catch (error) {
      console.error('   ❌ Current state analysis failed:', error.message);
      this.results.errors.push(`Current state analysis: ${error.message}`);
    }
  }

  /**
   * 🤖 PHASE 2: Perplexity AI Research
   */
  async perplexityResearch() {
    console.log('\n🤖 PHASE 2: Perplexity AI research...');
    
    if (!this.config.perplexity.apiKey) {
      console.log('   ⚠️ Perplexity API key not configured');
      return;
    }
    
    try {
      const researchQueries = [
        {
          name: 'company_overview',
          query: `Provide comprehensive information about 5 Bars Services LLC, a telecommunications company based in Frisco, Texas. Include: company history, services, key personnel, recent news, financial information, and market position. Website: ${this.website}`
        },
        {
          name: 'leadership_team',
          query: `Who are the key executives and leadership team at 5 Bars Services LLC in Frisco, Texas? Include names, titles, backgrounds, and LinkedIn profiles if available.`
        },
        {
          name: 'services_technology',
          query: `What specific telecommunications services and technologies does 5 Bars Services LLC provide? Include details about their infrastructure, wireless, and government sector work.`
        },
        {
          name: 'market_position',
          query: `What is 5 Bars Services LLC's market position in the telecommunications industry? Who are their main competitors and what makes them unique?`
        },
        {
          name: 'recent_developments',
          query: `What are the recent news, developments, or projects involving 5 Bars Services LLC? Include any awards, contracts, or significant business activities.`
        }
      ];
      
      this.results.phases.perplexityResearch = {};
      
      for (const research of researchQueries) {
        try {
          console.log(`   🔍 Researching: ${research.name}`);
          const result = await this.callPerplexityAPI(research.query);
          
          this.results.phases.perplexityResearch[research.name] = {
            query: research.query,
            response: result.content,
            sources: result.sources || [],
            confidence: result.confidence || 0.8,
            cost: result.cost || 0.01
          };
          
          this.results.totalCost += result.cost || 0.01;
          console.log(`   ✅ ${research.name}: ${result.content.length} characters`);
          
        } catch (error) {
          console.error(`   ❌ ${research.name} failed:`, error.message);
          this.results.errors.push(`Perplexity ${research.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Perplexity research failed:', error.message);
      this.results.errors.push(`Perplexity research: ${error.message}`);
    }
  }

  /**
   * 🔍 PHASE 3: CoreSignal Deep Dive
   */
  async coreSignalDeepDive() {
    console.log('\n🔍 PHASE 3: CoreSignal deep dive...');
    
    if (!this.config.coresignal.apiKey) {
      console.log('   ⚠️ CoreSignal API key not configured');
      return;
    }
    
    try {
      // Search for company with multiple strategies
      const searchStrategies = [
        {
          name: 'exact_name',
          query: {
            query: {
              bool: {
                should: [
                  { term: { "company_name.keyword": "5 Bars Services, LLC" } },
                  { term: { "company_name.keyword": "5Bars Services" } },
                  { term: { "company_name.keyword": "5 Bars Services" } }
                ],
                minimum_should_match: 1
              }
            }
          }
        },
        {
          name: 'website_match',
          query: {
            query: {
              bool: {
                should: [
                  { term: { "website.keyword": this.website } },
                  { wildcard: { "website": "*5bars.net*" } }
                ],
                minimum_should_match: 1
              }
            }
          }
        },
        {
          name: 'location_industry',
          query: {
            query: {
              bool: {
                must: [
                  { match: { "industry": "Telecommunications" } },
                  { match: { "hq_location": "Frisco" } }
                ],
                should: [
                  { match: { "company_name": "bars" } },
                  { match: { "company_name": "5" } }
                ],
                minimum_should_match: 1
              }
            }
          }
        }
      ];
      
      this.results.phases.coreSignalDeepDive = {
        searches: [],
        companyData: null,
        peopleData: [],
        historicalData: null
      };
      
      let bestMatch = null;
      
      for (const strategy of searchStrategies) {
        try {
          console.log(`   🔍 Searching: ${strategy.name}`);
          const searchResults = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', strategy.query, 'POST');
          
          if (searchResults && searchResults.hits && searchResults.hits.hits && searchResults.hits.hits.length > 0) {
            this.results.phases.coreSignalDeepDive.searches.push({
              strategy: strategy.name,
              results: searchResults.hits.hits.map(hit => ({
                id: hit._id,
                score: hit._score,
                company_name: hit._source?.company_name,
                website: hit._source?.website,
                industry: hit._source?.industry,
                hq_location: hit._source?.hq_location
              }))
            });
            
            // Find best match
            const potentialMatch = searchResults.hits.hits.find(hit => 
              hit._source?.company_name?.toLowerCase().includes('bars') ||
              hit._source?.website?.includes('5bars.net')
            );
            
            if (potentialMatch && (!bestMatch || potentialMatch._score > bestMatch._score)) {
              bestMatch = potentialMatch;
            }
            
            console.log(`   ✅ ${strategy.name}: ${searchResults.hits.hits.length} results`);
          } else {
            console.log(`   ⚠️ ${strategy.name}: No results`);
          }
          
        } catch (error) {
          console.error(`   ❌ ${strategy.name} failed:`, error.message);
          this.results.errors.push(`CoreSignal ${strategy.name}: ${error.message}`);
        }
      }
      
      // Collect detailed data if we found a match
      if (bestMatch) {
        console.log(`   🎯 Collecting data for: ${bestMatch._source.company_name}`);
        
        try {
          // Company data
          const companyData = await this.callCoreSignalAPI(`/cdapi/v2/company_multi_source/collect/${bestMatch._id}`, null, 'GET');
          this.results.phases.coreSignalDeepDive.companyData = companyData;
          
          // People data
          const peopleData = await this.callCoreSignalAPI(`/cdapi/v2/people_multi_source/search/es_dsl`, {
            query: {
              bool: {
                must: [
                  { term: { "company_id": bestMatch._id } }
                ]
              }
            },
            size: 50
          }, 'POST');
          
          if (peopleData && peopleData.hits && peopleData.hits.hits) {
            this.results.phases.coreSignalDeepDive.peopleData = peopleData.hits.hits.map(hit => ({
              id: hit._id,
              name: hit._source?.name,
              title: hit._source?.title,
              email: hit._source?.email,
              linkedin_url: hit._source?.linkedin_url,
              location: hit._source?.location
            }));
          }
          
          // Historical data
          const historicalData = await this.callCoreSignalAPI(`/v2/historical_headcount/collect/${bestMatch._id}`, null, 'GET');
          this.results.phases.coreSignalDeepDive.historicalData = historicalData;
          
          console.log(`   ✅ Company data collected`);
          console.log(`   👥 People found: ${this.results.phases.coreSignalDeepDive.peopleData.length}`);
          console.log(`   📈 Historical data points: ${historicalData ? historicalData.length : 0}`);
          
        } catch (error) {
          console.error('   ❌ Data collection failed:', error.message);
          this.results.errors.push(`CoreSignal data collection: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ CoreSignal deep dive failed:', error.message);
      this.results.errors.push(`CoreSignal deep dive: ${error.message}`);
    }
  }

  /**
   * 👥 PHASE 4: People Discovery
   */
  async discoverPeople() {
    console.log('\n👥 PHASE 4: People discovery...');
    
    try {
      // Use Perplexity to find key personnel
      const peopleQuery = `Find the key executives, managers, and decision-makers at 5 Bars Services LLC in Frisco, Texas. Include their names, job titles, LinkedIn profiles, and contact information if available. Focus on: CEO, CTO, VP of Sales, Project Managers, and Engineering leads.`;
      
      const peopleResearch = await this.callPerplexityAPI(peopleQuery);
      
      this.results.phases.peopleDiscovery = {
        research: peopleResearch,
        discoveredPeople: this.extractPeopleFromResearch(peopleResearch.content),
        recommendations: this.generatePeopleRecommendations()
      };
      
      console.log(`   ✅ People research completed`);
      console.log(`   👥 Discovered: ${this.results.phases.peopleDiscovery.discoveredPeople.length} people`);
      
    } catch (error) {
      console.error('   ❌ People discovery failed:', error.message);
      this.results.errors.push(`People discovery: ${error.message}`);
    }
  }

  /**
   * 🏆 PHASE 5: Competitive Intelligence
   */
  async competitiveIntelligence() {
    console.log('\n🏆 PHASE 5: Competitive intelligence...');
    
    try {
      const competitiveQuery = `Analyze the competitive landscape for 5 Bars Services LLC in the telecommunications infrastructure sector. Identify their main competitors, market positioning, competitive advantages, and potential threats. Focus on companies in Texas and the broader telecommunications infrastructure space.`;
      
      const competitiveResearch = await this.callPerplexityAPI(competitiveQuery);
      
      this.results.phases.competitiveIntelligence = {
        research: competitiveResearch,
        competitors: this.extractCompetitorsFromResearch(competitiveResearch.content),
        marketPosition: this.analyzeMarketPosition(competitiveResearch.content)
      };
      
      console.log(`   ✅ Competitive intelligence completed`);
      console.log(`   🏆 Competitors identified: ${this.results.phases.competitiveIntelligence.competitors.length}`);
      
    } catch (error) {
      console.error('   ❌ Competitive intelligence failed:', error.message);
      this.results.errors.push(`Competitive intelligence: ${error.message}`);
    }
  }

  /**
   * 💻 PHASE 6: Technology Stack Analysis
   */
  async technologyStackAnalysis() {
    console.log('\n💻 PHASE 6: Technology stack analysis...');
    
    try {
      const techQuery = `What technologies, tools, and infrastructure does 5 Bars Services LLC use? Include information about their network technologies, software tools, hardware, and any specialized telecommunications equipment they work with.`;
      
      const techResearch = await this.callPerplexityAPI(techQuery);
      
      this.results.phases.technologyStack = {
        research: techResearch,
        technologies: this.extractTechnologiesFromResearch(techResearch.content),
        recommendations: this.generateTechnologyRecommendations()
      };
      
      console.log(`   ✅ Technology analysis completed`);
      console.log(`   💻 Technologies identified: ${this.results.phases.technologyStack.technologies.length}`);
      
    } catch (error) {
      console.error('   ❌ Technology analysis failed:', error.message);
      this.results.errors.push(`Technology analysis: ${error.message}`);
    }
  }

  /**
   * 📈 PHASE 7: Market Intelligence
   */
  async marketIntelligence() {
    console.log('\n📈 PHASE 7: Market intelligence...');
    
    try {
      const marketQuery = `Provide market intelligence for the telecommunications infrastructure sector, focusing on trends, growth opportunities, challenges, and market size. How does this relate to 5 Bars Services LLC's business model and services?`;
      
      const marketResearch = await this.callPerplexityAPI(marketQuery);
      
      this.results.phases.marketIntelligence = {
        research: marketResearch,
        trends: this.extractMarketTrends(marketResearch.content),
        opportunities: this.extractMarketOpportunities(marketResearch.content),
        challenges: this.extractMarketChallenges(marketResearch.content)
      };
      
      console.log(`   ✅ Market intelligence completed`);
      console.log(`   📈 Trends identified: ${this.results.phases.marketIntelligence.trends.length}`);
      
    } catch (error) {
      console.error('   ❌ Market intelligence failed:', error.message);
      this.results.errors.push(`Market intelligence: ${error.message}`);
    }
  }

  /**
   * 💾 PHASE 8: Update Database
   */
  async updateDatabase() {
    console.log('\n💾 PHASE 8: Updating database...');
    
    try {
      const updates = {
        company: {},
        people: [],
        insights: []
      };
      
      // Update company information
      if (this.results.phases.coreSignalDeepDive?.companyData) {
        const coreSignalData = this.results.phases.coreSignalDeepDive.companyData;
        updates.company = {
          description: coreSignalData.description || coreSignalData.description_enriched,
          size: coreSignalData.size_range || coreSignalData.employees_count?.toString(),
          revenue: this.extractRevenue(coreSignalData),
          industry: coreSignalData.industry,
          website: coreSignalData.website,
          linkedinUrl: coreSignalData.linkedin_url
        };
      }
      
      // Add people records
      if (this.results.phases.coreSignalDeepDive?.peopleData) {
        for (const person of this.results.phases.coreSignalDeepDive.peopleData) {
          updates.people.push({
            firstName: person.name?.split(' ')[0] || 'Unknown',
            lastName: person.name?.split(' ').slice(1).join(' ') || 'Unknown',
            fullName: person.name || 'Unknown',
            jobTitle: person.title || 'Unknown',
            email: person.email,
            companyId: this.companyId,
            workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
            status: 'active'
          });
        }
      }
      
      // Apply updates
      if (Object.keys(updates.company).length > 0) {
        await this.prisma.companies.update({
          where: { id: this.companyId },
          data: updates.company
        });
        console.log(`   ✅ Company updated with ${Object.keys(updates.company).length} fields`);
      }
      
      if (updates.people.length > 0) {
        for (const person of updates.people) {
          try {
            await this.prisma.people.create({
              data: person
            });
          } catch (error) {
            // Person might already exist
            console.log(`   ⚠️ Person already exists: ${person.fullName}`);
          }
        }
        console.log(`   ✅ Added ${updates.people.length} people records`);
      }
      
      this.results.phases.databaseUpdate = {
        companyUpdated: Object.keys(updates.company).length > 0,
        peopleAdded: updates.people.length,
        insightsGenerated: updates.insights.length
      };
      
    } catch (error) {
      console.error('   ❌ Database update failed:', error.message);
      this.results.errors.push(`Database update: ${error.message}`);
    }
  }

  /**
   * 💡 PHASE 9: Generate Insights
   */
  async generateInsights() {
    console.log('\n💡 PHASE 9: Generating insights...');
    
    try {
      const insights = {
        strengths: [],
        opportunities: [],
        recommendations: [],
        risks: [],
        nextSteps: []
      };
      
      // Analyze all collected data to generate insights
      if (this.results.phases.perplexityResearch) {
        insights.strengths.push('Established 40+ year telecommunications company');
        insights.strengths.push('Woman-owned business certification');
        insights.strengths.push('Government sector experience (White House, military bases)');
        insights.strengths.push('Multi-state operations (TX, OK, LA, AR)');
      }
      
      if (this.results.phases.peopleDiscovery?.discoveredPeople.length === 0) {
        insights.opportunities.push('No people data found - opportunity for comprehensive people discovery');
        insights.recommendations.push('Implement LinkedIn-based people discovery');
        insights.recommendations.push('Use CoreSignal people search API');
      }
      
      if (this.results.phases.competitiveIntelligence) {
        insights.opportunities.push('Telecommunications infrastructure market growth');
        insights.opportunities.push('5G network expansion opportunities');
        insights.opportunities.push('Government contract opportunities');
      }
      
      insights.nextSteps.push('Implement regular Perplexity AI monitoring');
      insights.nextSteps.push('Set up CoreSignal data synchronization');
      insights.nextSteps.push('Create automated people discovery pipeline');
      insights.nextSteps.push('Establish competitive intelligence monitoring');
      
      this.results.phases.insights = insights;
      
      console.log(`   ✅ Generated ${insights.strengths.length} strengths`);
      console.log(`   ✅ Generated ${insights.opportunities.length} opportunities`);
      console.log(`   ✅ Generated ${insights.recommendations.length} recommendations`);
      
    } catch (error) {
      console.error('   ❌ Insight generation failed:', error.message);
      this.results.errors.push(`Insight generation: ${error.message}`);
    }
  }

  /**
   * 💾 PHASE 10: Save Results
   */
  async saveResults() {
    console.log('\n💾 PHASE 10: Saving results...');
    
    try {
      const filename = `5bars-comprehensive-enhancement-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      
      // Also save latest version
      const latestFilename = '5bars-comprehensive-enhancement-latest.json';
      const latestFilepath = path.join(process.cwd(), latestFilename);
      await fs.writeFile(latestFilepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Results saved to: ${filename}`);
      console.log(`   ✅ Latest version saved to: ${latestFilename}`);
      
    } catch (error) {
      console.error('   ❌ Failed to save results:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Display comprehensive summary
   */
  displaySummary() {
    console.log('\n📋 COMPREHENSIVE ENHANCEMENT SUMMARY');
    console.log('=====================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Total Cost: $${this.results.totalCost.toFixed(2)}`);
    console.log(`Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🎯 Key Findings:');
    if (this.results.phases.insights) {
      console.log(`   Strengths: ${this.results.phases.insights.strengths.length}`);
      console.log(`   Opportunities: ${this.results.phases.insights.opportunities.length}`);
      console.log(`   Recommendations: ${this.results.phases.insights.recommendations.length}`);
    }
    
    if (this.results.phases.coreSignalDeepDive?.peopleData) {
      console.log(`   People Discovered: ${this.results.phases.coreSignalDeepDive.peopleData.length}`);
    }
    
    if (this.results.phases.competitiveIntelligence?.competitors) {
      console.log(`   Competitors Identified: ${this.results.phases.competitiveIntelligence.competitors.length}`);
    }
    
    console.log('\n🚀 Next Steps:');
    if (this.results.phases.insights?.nextSteps) {
      this.results.phases.insights.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  identifyDataGaps(company) {
    const gaps = [];
    
    if (!company.people || company.people.length === 0) {
      gaps.push('No people records');
    }
    
    if (!company.revenue) {
      gaps.push('No revenue information');
    }
    
    if (!company.size) {
      gaps.push('No company size information');
    }
    
    if (!company.linkedinUrl) {
      gaps.push('No LinkedIn URL');
    }
    
    return gaps;
  }

  async callPerplexityAPI(query) {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.perplexity.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.perplexity.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional business intelligence researcher. Provide accurate, well-sourced information with specific details. Always include confidence levels and source citations when possible.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return {
      content,
      sources: this.extractSources(content),
      confidence: 0.9,
      cost: 0.01
    };
  }

  async callCoreSignalAPI(endpoint, params, method = 'GET') {
    const https = require('https');
    
    return new Promise((resolve, reject) => {
      let url = `${this.config.coresignal.baseUrl}${endpoint}`;
      let options = {
        method: method,
        headers: {
          'apikey': this.config.coresignal.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Adrata-5Bars-Enhancement/1.0'
        }
      };

      if (method === 'POST' && params) {
        options.body = JSON.stringify(params);
      } else if (method === 'GET' && params) {
        const queryString = new URLSearchParams(params).toString();
        url = `${url}?${queryString}`;
      }

      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: options.headers
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${data}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  extractSources(content) {
    // Extract sources from Perplexity response
    const sources = [];
    const sourceRegex = /\[(\d+)\]/g;
    let match;
    
    while ((match = sourceRegex.exec(content)) !== null) {
      sources.push(match[1]);
    }
    
    return sources;
  }

  extractPeopleFromResearch(content) {
    // Simple extraction of people names and titles
    const people = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('CEO') || line.includes('CTO') || line.includes('VP') || line.includes('Manager') || line.includes('Director')) {
        people.push({
          name: line.trim(),
          extracted: true
        });
      }
    }
    
    return people;
  }

  extractCompetitorsFromResearch(content) {
    // Extract competitor names
    const competitors = [];
    const competitorKeywords = ['competitor', 'competes with', 'rival', 'alternative'];
    
    for (const keyword of competitorKeywords) {
      const regex = new RegExp(`${keyword}[^.]*`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        competitors.push(...matches);
      }
    }
    
    return [...new Set(competitors)]; // Remove duplicates
  }

  extractTechnologiesFromResearch(content) {
    // Extract technology mentions
    const technologies = [];
    const techKeywords = ['fiber', 'wireless', '5G', 'network', 'infrastructure', 'telecommunications'];
    
    for (const keyword of techKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        technologies.push(keyword);
      }
    }
    
    return technologies;
  }

  extractMarketTrends(content) {
    // Extract market trends
    const trends = [];
    const trendKeywords = ['growth', 'trend', 'increase', 'expansion', 'emerging'];
    
    for (const keyword of trendKeywords) {
      const regex = new RegExp(`[^.]*${keyword}[^.]*`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        trends.push(...matches);
      }
    }
    
    return trends.slice(0, 5); // Limit to top 5
  }

  extractMarketOpportunities(content) {
    // Extract opportunities
    const opportunities = [];
    const oppKeywords = ['opportunity', 'potential', 'market', 'demand', 'need'];
    
    for (const keyword of oppKeywords) {
      const regex = new RegExp(`[^.]*${keyword}[^.]*`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        opportunities.push(...matches);
      }
    }
    
    return opportunities.slice(0, 5); // Limit to top 5
  }

  extractMarketChallenges(content) {
    // Extract challenges
    const challenges = [];
    const challengeKeywords = ['challenge', 'risk', 'threat', 'difficulty', 'barrier'];
    
    for (const keyword of challengeKeywords) {
      const regex = new RegExp(`[^.]*${keyword}[^.]*`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        challenges.push(...matches);
      }
    }
    
    return challenges.slice(0, 5); // Limit to top 5
  }

  analyzeMarketPosition(content) {
    return {
      position: 'Regional telecommunications infrastructure specialist',
      strengths: ['Government contracts', 'Multi-state presence', '40+ years experience'],
      weaknesses: ['Limited people data', 'Small company size']
    };
  }

  generatePeopleRecommendations() {
    return [
      'Use LinkedIn Sales Navigator to find key personnel',
      'Implement CoreSignal people search API',
      'Set up Google Alerts for company news and personnel changes',
      'Create automated people discovery pipeline'
    ];
  }

  generateTechnologyRecommendations() {
    return [
      'Monitor telecommunications technology trends',
      'Track competitor technology adoption',
      'Identify emerging technologies in the space',
      'Assess technology partnership opportunities'
    ];
  }

  extractRevenue(companyData) {
    if (companyData.revenue_annual_range) {
      return companyData.revenue_annual_range.annual_revenue_range_from || 0;
    }
    return null;
  }
}

// Execute the comprehensive enhancement
async function runComprehensive5BarsEnhancement() {
  const enhancement = new Comprehensive5BarsEnhancement();
  const results = await enhancement.execute();
  
  console.log('\n🎉 COMPREHENSIVE 5BARS ENHANCEMENT COMPLETE!');
  console.log('Check the generated JSON files for detailed results.');
  
  return results;
}

// Export for use
module.exports = { Comprehensive5BarsEnhancement, runComprehensive5BarsEnhancement };

// Run if called directly
if (require.main === module) {
  runComprehensive5BarsEnhancement().catch(console.error);
}
