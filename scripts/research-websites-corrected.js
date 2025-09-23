#!/usr/bin/env node

/**
 * 🔍 RESEARCH MISSING WEBSITES - CORRECTED VERSION
 * 
 * Uses the correct Perplexity API model and configuration
 */

const { PrismaClient } = require('@prisma/client');

class ResearchMissingWebsitesCorrected {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    // Use the correct model from web search: 'sonar' not 'sonar-pro'
    this.config = {
      perplexity: {
        apiKey: this.perplexityApiKey,
        model: 'sonar', // Correct model according to Perplexity docs
        maxTokens: 1000,
        temperature: 0.1
      }
    };
    
    if (!this.perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is required');
    }
    
    this.creditsUsed = 0;
    this.maxCompaniesPerRun = 5; // Small batch for testing
    this.results = {
      companiesProcessed: 0,
      websitesFound: 0,
      websitesUpdated: 0,
      companiesNotProcessed: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔍 RESEARCHING MISSING WEBSITES - CORRECTED VERSION');
    console.log('==================================================\n');

    try {
      const companies = await this.findCompaniesWithoutWebsites();
      await this.researchWebsites(companies);
      await this.generateReport();
    } catch (error) {
      console.error('❌ Research failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findCompaniesWithoutWebsites() {
    console.log('🔍 STEP 1: Finding companies without websites...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        OR: [
          { website: null },
          { website: '' }
        ]
      },
      select: { 
        id: true, 
        name: true, 
        industry: true,
        city: true,
        state: true,
        country: true
      },
      take: this.maxCompaniesPerRun
    });

    console.log(`📊 Found ${companies.length} companies without websites (processing first ${this.maxCompaniesPerRun})`);
    console.log('');

    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.industry || 'No industry'})`);
    });
    console.log('');

    return companies;
  }

  async researchWebsites(companies) {
    console.log('🔍 STEP 2: Researching websites with Perplexity...');
    
    for (const company of companies) {
      try {
        console.log(`\n🏢 Researching ${company.name}...`);
        
        const website = await this.researchCompanyWebsite(company);
        
        if (website) {
          this.results.websitesFound++;
          
          // Update the company with the found website
          await this.updateCompanyWebsite(company, website);
          this.results.websitesUpdated++;
          
          console.log(`   ✅ Found website: ${website}`);
        } else {
          console.log(`   ⚠️ No website found for ${company.name}`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'No website found via Perplexity research'
          });
        }
        
        this.results.companiesProcessed++;
        
        // Add delay to respect rate limits
        await this.delay(3000);
        
      } catch (error) {
        console.error(`   ❌ Failed to research ${company.name}:`, error.message);
        this.results.companiesNotProcessed.push({
          name: company.name,
          id: company.id,
          reason: `Research failed: ${error.message}`
        });
        this.results.errors.push(`Company ${company.name}: ${error.message}`);
      }
    }
  }

  async researchCompanyWebsite(company) {
    try {
      const query = `Find the official website for the company "${company.name}". 
      
Please provide:
1. The official company website URL
2. Brief company description

${company.industry ? `The company is in the ${company.industry} industry.` : ''}
${company.city || company.state || company.country ? `The company is located in ${[company.city, company.state, company.country].filter(Boolean).join(', ')}.` : ''}

Please be specific and provide the exact website URL. If no official website exists, please state that clearly.`;

      console.log(`   🔍 Calling Perplexity API with model: ${this.config.perplexity.model}`);

      // Use the correct API call format from web search
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.perplexity.model,
          messages: [
            {
              role: 'system',
              content: 'Be precise and concise.'
            },
            {
              role: 'user',
              content: query
            }
          ]
        })
      });

      console.log(`   📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Error response: ${errorText}`);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed++;
      
      console.log(`   📊 Response data keys: ${Object.keys(data).join(', ')}`);
      
      if (!data.choices || !data.choices[0]) {
        console.log(`   ❌ Invalid response structure:`, JSON.stringify(data, null, 2));
        throw new Error('Invalid response from Perplexity API');
      }
      
      const content = data.choices[0].message.content;
      console.log(`   🔍 Response content length: ${content.length} characters`);
      
      // Extract website URL from the response
      const website = this.extractWebsiteFromResponse(content);
      
      return website;
    } catch (error) {
      console.error(`   ❌ Perplexity research failed:`, error.message);
      return null;
    }
  }

  extractWebsiteFromResponse(content) {
    console.log(`   🔍 Extracting website from: ${content.substring(0, 200)}...`);
    
    // Look for website URLs in the response
    const websitePatterns = [
      /website[:\s]+(https?:\/\/[^\s\n]+)/i,
      /url[:\s]+(https?:\/\/[^\s\n]+)/i,
      /(https?:\/\/[^\s\n]+)/g
    ];
    
    for (const pattern of websitePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        let website = matches[1] || matches[0];
        
        // Clean up the website URL
        website = website.replace(/[.,;!?]+$/, ''); // Remove trailing punctuation
        website = website.replace(/\s+$/, ''); // Remove trailing whitespace
        
        // Validate it looks like a real website
        if (this.isValidWebsite(website)) {
          console.log(`   ✅ Extracted valid website: ${website}`);
          return website;
        }
      }
    }
    
    console.log(`   ⚠️ No valid website found in response`);
    return null;
  }

  isValidWebsite(website) {
    try {
      const url = new URL(website);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  async updateCompanyWebsite(company, website) {
    try {
      await this.prisma.companies.update({
        where: { id: company.id },
        data: { 
          website: website,
          customFields: {
            websiteFoundBy: 'Perplexity',
            websiteFoundAt: new Date().toISOString()
          }
        }
      });
      
      console.log(`   ✅ Updated company with website: ${website}`);
    } catch (error) {
      console.error(`   ❌ Failed to update company website:`, error.message);
      throw error;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateReport() {
    console.log('\n🎉 MISSING WEBSITES RESEARCH REPORT');
    console.log('===================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`🔍 Websites found: ${this.results.websitesFound}`);
    console.log(`✅ Websites updated: ${this.results.websitesUpdated}`);
    console.log(`💰 Perplexity credits used: ${this.creditsUsed}`);
    
    if (this.results.companiesNotProcessed.length > 0) {
      console.log('\n⚠️ Companies not processed:');
      this.results.companiesNotProcessed.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} - ${company.reason}`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Run additional batches to process remaining companies');
    console.log('   2. Check website coverage improvement');
    console.log('   3. Consider manual research for companies without websites');
    console.log('\n🚀 Missing websites research complete!');
  }
}

if (require.main === module) {
  const researcher = new ResearchMissingWebsitesCorrected();
  researcher.execute().catch(console.error);
}

module.exports = ResearchMissingWebsitesCorrected;
