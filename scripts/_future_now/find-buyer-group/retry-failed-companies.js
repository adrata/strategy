#!/usr/bin/env node

/**
 * Retry Failed Companies - Enhanced Buyer Group Discovery
 * 
 * Finds companies that failed buyer group discovery and retries with enhanced methods
 * Continues improving until all companies have buyer groups
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');
const { TOPBuyerGroupRunner } = require('./run-top-buyer-group');
const { AdrataBuyerGroupRunner } = require('./run-adrata-buyer-group');

class RetryFailedCompanies {
  constructor(workspaceId, workspaceName) {
    this.prisma = new PrismaClient();
    this.workspaceId = workspaceId;
    this.workspaceName = workspaceName;
    this.maxRetries = 5; // Increased retries for better coverage
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  }

  async run() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄 Retrying Failed Companies - ${this.workspaceName}`);
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Get companies without buyer groups
      const failedCompanies = await this.getFailedCompanies();
      console.log(`📊 Found ${failedCompanies.length} companies without buyer groups\n`);

      if (failedCompanies.length === 0) {
        console.log('✅ All companies have buyer groups!');
        return { successful: 0, failed: 0, total: 0 };
      }

      let successful = 0;
      let failed = 0;
      const results = [];

      for (let i = 0; i < failedCompanies.length; i++) {
        const company = failedCompanies[i];
        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n📊 Retrying ${i + 1}/${failedCompanies.length}: ${company.name}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log(`   Industry: ${company.industry || 'N/A'}`);
        console.log('');

        let retrySuccess = false;
        let lastError = null;

        // Try multiple approaches
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
          console.log(`\n🔄 Attempt ${attempt}/${this.maxRetries}:`);
          
          try {
            const result = await this.tryBuyerGroupDiscovery(company, attempt);
            
            if (result && result.buyerGroup && result.buyerGroup.length > 0) {
              const realEmails = result.buyerGroup.filter(m => {
                const email = m.email || (m.fullProfile?.email) || '';
                return email && !email.includes('@coresignal.temp') && email.includes('@');
              });

              results.push({
                company: company.name,
                success: true,
                buyerGroupSize: result.buyerGroup.length,
                realEmails: realEmails.length,
                attempt: attempt
              });

              successful++;
              retrySuccess = true;
              console.log(`✅ Success on attempt ${attempt}: ${result.buyerGroup.length} members, ${realEmails.length} real emails`);
              break;
            }
          } catch (error) {
            lastError = error;
            console.log(`⚠️  Attempt ${attempt} failed: ${error.message}`);
            
            // Wait before retry
            if (attempt < this.maxRetries) {
              console.log(`⏳ Waiting ${attempt * 5} seconds before next attempt...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 5000));
            }
          }
        }

        if (!retrySuccess) {
          // Try Perplexity as final fallback
          if (this.perplexityApiKey) {
            console.log('\n🔍 Trying Perplexity research as final fallback...');
            const perplexityResult = await this.tryPerplexityResearch(company);
            if (perplexityResult && perplexityResult.buyerGroup && perplexityResult.buyerGroup.length > 0) {
              // ENHANCED: Save Perplexity results to database
              try {
                await this.savePerplexityBuyerGroup(company, perplexityResult);
                console.log(`✅ Saved Perplexity buyer group to database`);
              } catch (saveError) {
                console.error(`⚠️  Failed to save Perplexity results: ${saveError.message}`);
              }
              
              results.push({
                company: company.name,
                success: true,
                buyerGroupSize: perplexityResult.buyerGroup.length,
                realEmails: 0,
                attempt: 'perplexity'
              });
              successful++;
              retrySuccess = true;
            }
          }

          if (!retrySuccess) {
            results.push({
              company: company.name,
              success: false,
              error: lastError?.message || 'All attempts failed',
              attempts: this.maxRetries
            });
            failed++;
            console.log(`❌ All attempts failed for ${company.name}`);
          }
        }

        // Wait between companies
        if (i < failedCompanies.length - 1) {
          console.log('\n⏳ Waiting 10 seconds before next company...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      // Summary
      this.printSummary(successful, failed, results);

      return { successful, failed, total: failedCompanies.length };

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get companies without buyer groups
   */
  async getFailedCompanies() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ],
        people: {
          none: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        employeeCount: true,
        revenue: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Try buyer group discovery with different approaches
   */
  async tryBuyerGroupDiscovery(company, attempt) {
    try {
      // Use workspace-specific runner based on workspace
      if (this.workspaceId === '01K75ZD7DWHG1XF16HAF2YVKCK') {
        // TOP workspace
        const runner = new TOPBuyerGroupRunner();
        const identifier = company.website || company.linkedinUrl || company.name;
        const result = await runner.run(identifier, { skipDatabase: false });
        
        // Ensure result has buyerGroup array
        if (result && result.buyerGroup && Array.isArray(result.buyerGroup) && result.buyerGroup.length > 0) {
          return result;
        }
        return null;
      } else {
        // Adrata or other workspace
        const runner = new AdrataBuyerGroupRunner();
        const identifier = company.website || company.linkedinUrl || company.name;
        const result = await runner.runBuyerGroupDiscovery(company, identifier);
        
        // Ensure result has buyerGroup array
        if (result && result.buyerGroup && Array.isArray(result.buyerGroup) && result.buyerGroup.length > 0) {
          return result;
        }
        return null;
      }
    } catch (error) {
      console.error(`❌ Buyer group discovery error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Try Perplexity research as fallback
   */
  async tryPerplexityResearch(company) {
    if (!this.perplexityApiKey) return null;

    try {
      console.log('🔍 Researching company with Perplexity...');
      
      const query = `Find key decision makers and executives at "${company.name}" ${company.website ? `(${company.website})` : ''}. 
      Provide their names, titles, and LinkedIn profiles if available. 
      Focus on: CEO, CTO, VP Engineering, Director of Technology, Chief Information Officer, and other technology/engineering leadership roles.
      Format as JSON array with fields: name, title, linkedinUrl, email (if available).`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a professional business research assistant. Provide accurate, structured data in JSON format.'
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
      
      // Try to parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const executives = JSON.parse(jsonMatch[0]);
        console.log(`✅ Found ${executives.length} executives via Perplexity`);
        
        // Convert to buyer group format
        const buyerGroup = executives.map((exec, idx) => ({
          id: `perplexity_${Date.now()}_${idx}`,
          name: exec.name,
          title: exec.title,
          linkedinUrl: exec.linkedinUrl,
          email: exec.email,
          buyerGroupRole: idx === 0 ? 'decision' : 'stakeholder',
          source: 'perplexity',
          relevance: 0.7,
          scores: {
            seniority: 8,
            influence: 7,
            departmentFit: 6
          }
        }));

        return {
          buyerGroup,
          intelligence: {
            companyName: company.name,
            website: company.website,
            employeeCount: company.employeeCount || 100
          },
          report: null,
          cohesion: { score: 0 },
          coverage: null
        };
      }

      return null;

    } catch (error) {
      console.error(`❌ Perplexity research failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Save Perplexity buyer group to database
   */
  async savePerplexityBuyerGroup(company, result) {
    try {
      const { SmartBuyerGroupPipeline } = require('./index');
      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: this.workspaceId,
        dealSize: 50000, // Default
        productCategory: 'sales',
        prisma: this.prisma,
        skipDatabase: false
      });

      // Create intelligence object matching pipeline format
      const intelligence = {
        companyName: company.name,
        website: company.website,
        linkedinUrl: company.linkedinUrl,
        employeeCount: company.employeeCount || 100,
        industry: company.industry || 'Unknown',
        revenue: company.revenue || 0
      };

      // Create a simple report
      const report = result.report || {
        summary: `Buyer group discovered via Perplexity AI research for ${company.name}`,
        methodology: 'Perplexity AI web research',
        confidence: 'Medium - AI research results'
      };

      // Save buyer group using pipeline's save method
      await pipeline.saveBuyerGroupToDatabase(
        result.buyerGroup,
        report,
        intelligence
      );

      console.log(`✅ Saved ${result.buyerGroup.length} Perplexity buyer group members to database`);
    } catch (error) {
      console.error(`❌ Failed to save Perplexity buyer group: ${error.message}`);
      // Don't throw - allow process to continue
    }
  }

  /**
   * Print summary
   */
  printSummary(successful, failed, results) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📊 RETRY SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n✅ Successful: ${successful}`);
    const successfulResults = results.filter(r => r.success);
    successfulResults.slice(0, 10).forEach(r => {
      console.log(`   - ${r.company}: ${r.buyerGroupSize} members (attempt ${r.attempt})`);
    });
    if (successfulResults.length > 10) {
      console.log(`   ... and ${successfulResults.length - 10} more`);
    }

    if (failed > 0) {
      console.log(`\n❌ Still Failed: ${failed}`);
      const failedResults = results.filter(r => !r.success);
      failedResults.forEach(r => {
        console.log(`   - ${r.company}: ${r.error}`);
      });
    }

    console.log('\n✅ Retry process complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const workspaceId = process.argv[2];
  const workspaceName = process.argv[3] || 'Workspace';
  
  if (!workspaceId) {
    console.error('Usage: node retry-failed-companies.js <workspaceId> [workspaceName]');
    process.exit(1);
  }
  
  const retry = new RetryFailedCompanies(workspaceId, workspaceName);
  retry.run().catch(console.error);
}

module.exports = { RetryFailedCompanies };

