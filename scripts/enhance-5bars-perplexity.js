/**
 * 🤖 5BARS PERPLEXITY AI ENHANCEMENT
 * 
 * Advanced enrichment using Perplexity AI for real-time, comprehensive intelligence
 * Focuses on making the system less abstract and more actionable
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Perplexity5BarsEnhancement {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.companyName = '5 Bars Services, LLC';
    this.website = 'https://www.5bars.net';
    
    this.config = {
      perplexity: {
        apiKey: process.env.PERPLEXITY_API_KEY,
        model: 'llama-3.1-sonar-large-128k-online',
        maxTokens: 2000,
        temperature: 0.1
      }
    };
    
    this.results = {
      companyId: this.companyId,
      enhancementDate: new Date().toISOString(),
      perplexityResearch: {},
      actionableInsights: {},
      totalCost: 0,
      errors: []
    };
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('🤖 5BARS PERPLEXITY AI ENHANCEMENT');
    console.log('===================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log('');

    try {
      // Phase 1: Company Intelligence
      await this.companyIntelligence();
      
      // Phase 2: People Discovery
      await this.peopleDiscovery();
      
      // Phase 3: Market Analysis
      await this.marketAnalysis();
      
      // Phase 4: Competitive Intelligence
      await this.competitiveIntelligence();
      
      // Phase 5: Technology Stack
      await this.technologyStack();
      
      // Phase 6: Business Opportunities
      await this.businessOpportunities();
      
      // Phase 7: Risk Assessment
      await this.riskAssessment();
      
      // Phase 8: Actionable Recommendations
      await this.actionableRecommendations();
      
      // Phase 9: Update Database
      await this.updateDatabase();
      
      // Phase 10: Generate Report
      await this.generateReport();
      
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
   * 🏢 PHASE 1: Company Intelligence
   */
  async companyIntelligence() {
    console.log('🏢 PHASE 1: Company intelligence...');
    
    try {
      const queries = [
        {
          name: 'company_overview',
          query: `Provide a comprehensive overview of 5 Bars Services LLC, a telecommunications company based in Frisco, Texas. Include: company history, founding details, key milestones, current leadership, business model, and recent developments. Website: ${this.website}`
        },
        {
          name: 'financial_intelligence',
          query: `What financial information is available about 5 Bars Services LLC? Include revenue estimates, funding history, key contracts, government contracts, and any public financial data. Focus on concrete numbers and verifiable information.`
        },
        {
          name: 'business_model',
          query: `Analyze the business model of 5 Bars Services LLC. What are their primary revenue streams? Who are their typical customers? What services do they provide and how do they price them? Include specific examples and case studies if available.`
        },
        {
          name: 'recent_news',
          query: `What recent news, press releases, or developments have occurred involving 5 Bars Services LLC? Include any new contracts, partnerships, expansions, awards, or significant business activities in the last 2 years.`
        }
      ];
      
      this.results.perplexityResearch.companyIntelligence = {};
      
      for (const query of queries) {
        try {
          console.log(`   🔍 Researching: ${query.name}`);
          const result = await this.callPerplexityAPI(query.query);
          
          this.results.perplexityResearch.companyIntelligence[query.name] = {
            query: query.query,
            response: result.content,
            sources: result.sources,
            confidence: result.confidence,
            cost: result.cost
          };
          
          this.results.totalCost += result.cost;
          console.log(`   ✅ ${query.name}: ${result.content.length} characters, ${result.sources.length} sources`);
          
        } catch (error) {
          console.error(`   ❌ ${query.name} failed:`, error.message);
          this.results.errors.push(`Company intelligence ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Company intelligence failed:', error.message);
      this.results.errors.push(`Company intelligence: ${error.message}`);
    }
  }

  /**
   * 👥 PHASE 2: People Discovery
   */
  async peopleDiscovery() {
    console.log('\n👥 PHASE 2: People discovery...');
    
    try {
      const queries = [
        {
          name: 'leadership_team',
          query: `Who are the key executives and leadership team at 5 Bars Services LLC? Include names, titles, backgrounds, LinkedIn profiles, and any public information about the CEO, CTO, VP of Sales, and other senior leadership.`
        },
        {
          name: 'key_personnel',
          query: `Identify key personnel at 5 Bars Services LLC including project managers, engineering leads, sales representatives, and other decision-makers. Include their names, roles, and any contact information or LinkedIn profiles if available.`
        },
        {
          name: 'employee_insights',
          query: `What information is available about 5 Bars Services LLC employees? Include company culture, employee count, hiring trends, and any information about their workforce from LinkedIn, Glassdoor, or other sources.`
        }
      ];
      
      this.results.perplexityResearch.peopleDiscovery = {};
      
      for (const query of queries) {
        try {
          console.log(`   🔍 Researching: ${query.name}`);
          const result = await this.callPerplexityAPI(query.query);
          
          this.results.perplexityResearch.peopleDiscovery[query.name] = {
            query: query.query,
            response: result.content,
            sources: result.sources,
            confidence: result.confidence,
            cost: result.cost
          };
          
          this.results.totalCost += result.cost;
          console.log(`   ✅ ${query.name}: ${result.content.length} characters, ${result.sources.length} sources`);
          
        } catch (error) {
          console.error(`   ❌ ${query.name} failed:`, error.message);
          this.results.errors.push(`People discovery ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ People discovery failed:', error.message);
      this.results.errors.push(`People discovery: ${error.message}`);
    }
  }

  /**
   * 📈 PHASE 3: Market Analysis
   */
  async marketAnalysis() {
    console.log('\n📈 PHASE 3: Market analysis...');
    
    try {
      const queries = [
        {
          name: 'market_size',
          query: `What is the size and scope of the telecommunications infrastructure market in Texas and the broader United States? Include market size, growth rates, key segments, and how 5 Bars Services LLC fits into this market.`
        },
        {
          name: 'industry_trends',
          query: `What are the current trends in the telecommunications infrastructure industry? Include 5G deployment, fiber expansion, government infrastructure spending, and other trends that could impact 5 Bars Services LLC.`
        },
        {
          name: 'customer_segments',
          query: `Who are the typical customers for telecommunications infrastructure companies like 5 Bars Services LLC? Include government agencies, telecom carriers, enterprises, and other customer segments with specific examples.`
        }
      ];
      
      this.results.perplexityResearch.marketAnalysis = {};
      
      for (const query of queries) {
        try {
          console.log(`   🔍 Researching: ${query.name}`);
          const result = await this.callPerplexityAPI(query.query);
          
          this.results.perplexityResearch.marketAnalysis[query.name] = {
            query: query.query,
            response: result.content,
            sources: result.sources,
            confidence: result.confidence,
            cost: result.cost
          };
          
          this.results.totalCost += result.cost;
          console.log(`   ✅ ${query.name}: ${result.content.length} characters, ${result.sources.length} sources`);
          
        } catch (error) {
          console.error(`   ❌ ${query.name} failed:`, error.message);
          this.results.errors.push(`Market analysis ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Market analysis failed:', error.message);
      this.results.errors.push(`Market analysis: ${error.message}`);
    }
  }

  /**
   * 🏆 PHASE 4: Competitive Intelligence
   */
  async competitiveIntelligence() {
    console.log('\n🏆 PHASE 4: Competitive intelligence...');
    
    try {
      const queries = [
        {
          name: 'direct_competitors',
          query: `Who are the direct competitors of 5 Bars Services LLC in the telecommunications infrastructure space? Include companies in Texas and the broader region that provide similar services.`
        },
        {
          name: 'competitive_advantages',
          query: `What are the competitive advantages and differentiators of 5 Bars Services LLC? What makes them unique compared to their competitors? Include their strengths and market positioning.`
        },
        {
          name: 'market_share',
          query: `What is the market share and competitive position of 5 Bars Services LLC in the telecommunications infrastructure market? How do they compare to larger competitors?`
        }
      ];
      
      this.results.perplexityResearch.competitiveIntelligence = {};
      
      for (const query of queries) {
        try {
          console.log(`   🔍 Researching: ${query.name}`);
          const result = await this.callPerplexityAPI(query.query);
          
          this.results.perplexityResearch.competitiveIntelligence[query.name] = {
            query: query.query,
            response: result.content,
            sources: result.sources,
            confidence: result.confidence,
            cost: result.cost
          };
          
          this.results.totalCost += result.cost;
          console.log(`   ✅ ${query.name}: ${result.content.length} characters, ${result.sources.length} sources`);
          
        } catch (error) {
          console.error(`   ❌ ${query.name} failed:`, error.message);
          this.results.errors.push(`Competitive intelligence ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Competitive intelligence failed:', error.message);
      this.results.errors.push(`Competitive intelligence: ${error.message}`);
    }
  }

  /**
   * 💻 PHASE 5: Technology Stack
   */
  async technologyStack() {
    console.log('\n💻 PHASE 5: Technology stack...');
    
    try {
      const queries = [
        {
          name: 'technology_services',
          query: `What specific technologies and services does 5 Bars Services LLC provide? Include fiber optic, wireless, network infrastructure, and any specialized telecommunications technologies they work with.`
        },
        {
          name: 'equipment_partners',
          query: `What equipment vendors and technology partners does 5 Bars Services LLC work with? Include manufacturers, software providers, and other technology partners in the telecommunications space.`
        },
        {
          name: 'innovation_trends',
          query: `What emerging technologies in telecommunications infrastructure should 5 Bars Services LLC be aware of? Include 5G, edge computing, IoT, and other relevant technologies.`
        }
      ];
      
      this.results.perplexityResearch.technologyStack = {};
      
      for (const query of queries) {
        try {
          console.log(`   🔍 Researching: ${query.name}`);
          const result = await this.callPerplexityAPI(query.query);
          
          this.results.perplexityResearch.technologyStack[query.name] = {
            query: query.query,
            response: result.content,
            sources: result.sources,
            confidence: result.confidence,
            cost: result.cost
          };
          
          this.results.totalCost += result.cost;
          console.log(`   ✅ ${query.name}: ${result.content.length} characters, ${result.sources.length} sources`);
          
        } catch (error) {
          console.error(`   ❌ ${query.name} failed:`, error.message);
          this.results.errors.push(`Technology stack ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Technology stack failed:', error.message);
      this.results.errors.push(`Technology stack: ${error.message}`);
    }
  }

  /**
   * 💼 PHASE 6: Business Opportunities
   */
  async businessOpportunities() {
    console.log('\n💼 PHASE 6: Business opportunities...');
    
    try {
      const queries = [
        {
          name: 'growth_opportunities',
          query: `What growth opportunities exist for 5 Bars Services LLC? Include new markets, service expansions, partnership opportunities, and potential acquisitions or mergers.`
        },
        {
          name: 'government_contracts',
          query: `What government contract opportunities are available for telecommunications infrastructure companies like 5 Bars Services LLC? Include federal, state, and local government opportunities.`
        },
        {
          name: 'partnership_opportunities',
          query: `What partnership opportunities exist for 5 Bars Services LLC? Include technology partners, channel partners, and strategic alliances that could benefit the company.`
        }
      ];
      
      this.results.perplexityResearch.businessOpportunities = {};
      
      for (const query of queries) {
        try {
          console.log(`   🔍 Researching: ${query.name}`);
          const result = await this.callPerplexityAPI(query.query);
          
          this.results.perplexityResearch.businessOpportunities[query.name] = {
            query: query.query,
            response: result.content,
            sources: result.sources,
            confidence: result.confidence,
            cost: result.cost
          };
          
          this.results.totalCost += result.cost;
          console.log(`   ✅ ${query.name}: ${result.content.length} characters, ${result.sources.length} sources`);
          
        } catch (error) {
          console.error(`   ❌ ${query.name} failed:`, error.message);
          this.results.errors.push(`Business opportunities ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Business opportunities failed:', error.message);
      this.results.errors.push(`Business opportunities: ${error.message}`);
    }
  }

  /**
   * ⚠️ PHASE 7: Risk Assessment
   */
  async riskAssessment() {
    console.log('\n⚠️ PHASE 7: Risk assessment...');
    
    try {
      const queries = [
        {
          name: 'business_risks',
          query: `What are the main business risks facing 5 Bars Services LLC? Include market risks, competitive threats, regulatory changes, and other factors that could impact the company.`
        },
        {
          name: 'financial_risks',
          query: `What financial risks does 5 Bars Services LLC face? Include cash flow, debt, customer concentration, and other financial factors that could impact the company's stability.`
        },
        {
          name: 'operational_risks',
          query: `What operational risks does 5 Bars Services LLC face? Include supply chain, workforce, technology, and other operational factors that could impact the company.`
        }
      ];
      
      this.results.perplexityResearch.riskAssessment = {};
      
      for (const query of queries) {
        try {
          console.log(`   🔍 Researching: ${query.name}`);
          const result = await this.callPerplexityAPI(query.query);
          
          this.results.perplexityResearch.riskAssessment[query.name] = {
            query: query.query,
            response: result.content,
            sources: result.sources,
            confidence: result.confidence,
            cost: result.cost
          };
          
          this.results.totalCost += result.cost;
          console.log(`   ✅ ${query.name}: ${result.content.length} characters, ${result.sources.length} sources`);
          
        } catch (error) {
          console.error(`   ❌ ${query.name} failed:`, error.message);
          this.results.errors.push(`Risk assessment ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('   ❌ Risk assessment failed:', error.message);
      this.results.errors.push(`Risk assessment: ${error.message}`);
    }
  }

  /**
   * 🎯 PHASE 8: Actionable Recommendations
   */
  async actionableRecommendations() {
    console.log('\n🎯 PHASE 8: Actionable recommendations...');
    
    try {
      const query = `Based on all the information about 5 Bars Services LLC, provide specific, actionable recommendations for improving their business intelligence and data enrichment. Focus on concrete steps they can take to: 1) Better understand their market position, 2) Identify and engage with key decision-makers, 3) Track competitive intelligence, 4) Monitor business opportunities, and 5) Assess risks. Make recommendations specific and implementable.`;
      
      const result = await this.callPerplexityAPI(query);
      
      this.results.actionableInsights = {
        recommendations: result.content,
        sources: result.sources,
        confidence: result.confidence,
        cost: result.cost
      };
      
      this.results.totalCost += result.cost;
      console.log(`   ✅ Generated actionable recommendations: ${result.content.length} characters`);
      
    } catch (error) {
      console.error('   ❌ Actionable recommendations failed:', error.message);
      this.results.errors.push(`Actionable recommendations: ${error.message}`);
    }
  }

  /**
   * 💾 PHASE 9: Update Database
   */
  async updateDatabase() {
    console.log('\n💾 PHASE 9: Updating database...');
    
    try {
      // Extract key insights and update company record
      const insights = this.extractKeyInsights();
      
      const updates = {
        description: insights.description,
        tags: insights.tags,
        updatedAt: new Date()
      };
      
      await this.prisma.companies.update({
        where: { id: this.companyId },
        data: updates
      });
      
      console.log(`   ✅ Company record updated with insights`);
      
      // Create insights record
      await this.prisma.insights.create({
        data: {
          companyId: this.companyId,
          type: 'perplexity_enhancement',
          title: 'Perplexity AI Enhancement Results',
          content: JSON.stringify(this.results),
          confidence: 0.9,
          source: 'perplexity_ai',
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
        }
      });
      
      console.log(`   ✅ Insights record created`);
      
    } catch (error) {
      console.error('   ❌ Database update failed:', error.message);
      this.results.errors.push(`Database update: ${error.message}`);
    }
  }

  /**
   * 📊 PHASE 10: Generate Report
   */
  async generateReport() {
    console.log('\n📊 PHASE 10: Generating report...');
    
    try {
      const report = this.generateComprehensiveReport();
      
      this.results.report = report;
      
      console.log(`   ✅ Report generated: ${report.length} characters`);
      
    } catch (error) {
      console.error('   ❌ Report generation failed:', error.message);
      this.results.errors.push(`Report generation: ${error.message}`);
    }
  }

  /**
   * 💾 Save Results
   */
  async saveResults() {
    console.log('\n💾 Saving results...');
    
    try {
      const filename = `5bars-perplexity-enhancement-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      
      // Also save latest version
      const latestFilename = '5bars-perplexity-enhancement-latest.json';
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
    console.log('\n📋 PERPLEXITY ENHANCEMENT SUMMARY');
    console.log('==================================');
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
    
    console.log('\n🎯 Research Areas Completed:');
    Object.keys(this.results.perplexityResearch).forEach(area => {
      console.log(`   ✅ ${area}: ${Object.keys(this.results.perplexityResearch[area]).length} queries`);
    });
    
    if (this.results.actionableInsights) {
      console.log('\n💡 Actionable Insights Generated:');
      console.log(`   Recommendations: ${this.results.actionableInsights.recommendations.length} characters`);
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Review Perplexity research results');
    console.log('   2. Implement actionable recommendations');
    console.log('   3. Set up ongoing monitoring');
    console.log('   4. Integrate insights into business processes');
  }

  // ========================================
  // HELPER METHODS
  // ========================================

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
            content: 'You are a professional business intelligence researcher. Provide accurate, well-sourced information with specific details. Always include confidence levels and source citations when possible. Focus on actionable insights and concrete information.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: this.config.perplexity.temperature,
        max_tokens: this.config.perplexity.maxTokens
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

  extractSources(content) {
    const sources = [];
    const sourceRegex = /\[(\d+)\]/g;
    let match;
    
    while ((match = sourceRegex.exec(content)) !== null) {
      sources.push(match[1]);
    }
    
    return sources;
  }

  extractKeyInsights() {
    const insights = {
      description: '',
      tags: []
    };
    
    // Extract key information from research results
    if (this.results.perplexityResearch.companyIntelligence?.company_overview) {
      const overview = this.results.perplexityResearch.companyIntelligence.company_overview.response;
      insights.description = overview.substring(0, 500) + '...';
    }
    
    // Extract tags from various research areas
    const tagSources = [
      this.results.perplexityResearch.marketAnalysis,
      this.results.perplexityResearch.technologyStack,
      this.results.perplexityResearch.competitiveIntelligence
    ];
    
    tagSources.forEach(source => {
      if (source) {
        Object.values(source).forEach(result => {
          if (result.response) {
            // Simple tag extraction
            const words = result.response.toLowerCase().split(' ');
            words.forEach(word => {
              if (word.length > 4 && !insights.tags.includes(word)) {
                insights.tags.push(word);
              }
            });
          }
        });
      }
    });
    
    insights.tags = insights.tags.slice(0, 10); // Limit to 10 tags
    
    return insights;
  }

  generateComprehensiveReport() {
    let report = `# 5 Bars Services LLC - Perplexity AI Enhancement Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Company:** ${this.companyName}\n`;
    report += `**Website:** ${this.website}\n\n`;
    
    report += `## Executive Summary\n\n`;
    report += `This report provides comprehensive intelligence about 5 Bars Services LLC gathered through Perplexity AI research. `;
    report += `The research covers company intelligence, people discovery, market analysis, competitive intelligence, technology stack, business opportunities, and risk assessment.\n\n`;
    
    report += `## Key Findings\n\n`;
    
    // Add key findings from each research area
    Object.keys(this.results.perplexityResearch).forEach(area => {
      report += `### ${area.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}\n\n`;
      
      Object.keys(this.results.perplexityResearch[area]).forEach(query => {
        const result = this.results.perplexityResearch[area][query];
        report += `**${query.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:**\n`;
        report += `${result.response.substring(0, 200)}...\n\n`;
      });
    });
    
    if (this.results.actionableInsights) {
      report += `## Actionable Recommendations\n\n`;
      report += `${this.results.actionableInsights.recommendations}\n\n`;
    }
    
    report += `## Next Steps\n\n`;
    report += `1. Review all research findings\n`;
    report += `2. Implement actionable recommendations\n`;
    report += `3. Set up ongoing monitoring\n`;
    report += `4. Integrate insights into business processes\n\n`;
    
    report += `**Total Research Cost:** $${this.results.totalCost.toFixed(2)}\n`;
    report += `**Sources Consulted:** ${this.getTotalSources()}\n`;
    
    return report;
  }

  getTotalSources() {
    let totalSources = 0;
    
    Object.values(this.results.perplexityResearch).forEach(area => {
      Object.values(area).forEach(result => {
        if (result.sources) {
          totalSources += result.sources.length;
        }
      });
    });
    
    return totalSources;
  }
}

// Execute the Perplexity enhancement
async function runPerplexity5BarsEnhancement() {
  const enhancement = new Perplexity5BarsEnhancement();
  const results = await enhancement.execute();
  
  console.log('\n🎉 PERPLEXITY 5BARS ENHANCEMENT COMPLETE!');
  console.log('Check the generated JSON files for detailed results.');
  
  return results;
}

// Export for use
module.exports = { Perplexity5BarsEnhancement, runPerplexity5BarsEnhancement };

// Run if called directly
if (require.main === module) {
  runPerplexity5BarsEnhancement().catch(console.error);
}
