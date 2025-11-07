#!/usr/bin/env node

/**
 * Enhanced TOP Buyer Group Discovery - Re-run ALL with Perplexity Fallback
 * 
 * Features:
 * - Skips companies that were successful in recent batch
 * - Uses Perplexity research when Coresignal fails
 * - Enhanced company matching and employee discovery
 * - Better handling of edge cases
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { TOPBuyerGroupRunner } = require('./run-top-buyer-group');
const fs = require('fs');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const LOG_FILE = '/tmp/top-buyer-group-full-run.log';

class EnhancedTOPBuyerGroupRunner {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
    this.recentlySuccessful = new Set();
    this.results = [];
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  }

  async run() {
    console.log('🚀 Enhanced TOP Buyer Group Discovery');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Load recently successful companies
      await this.loadRecentlySuccessful();
      console.log(`⏭️  Skipping ${this.recentlySuccessful.size} recently successful companies\n`);

      // Get all companies
      const companies = await this.getCompanies();
      console.log(`📊 Found ${companies.length} total companies`);

      // Filter out recently successful
      const companiesToProcess = companies.filter(c => 
        !this.recentlySuccessful.has(c.name)
      );
      console.log(`🎯 ${companiesToProcess.length} companies need processing\n`);

      if (companiesToProcess.length === 0) {
        console.log('✅ All companies already have buyer groups!');
        return;
      }

      // Process companies
      let processed = 0;
      let successful = 0;
      let failed = 0;
      let perplexityUsed = 0;

      for (const company of companiesToProcess) {
        processed++;
        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n📊 Processing ${processed}/${companiesToProcess.length}: ${company.name}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log('');

        try {
          const identifier = company.website || company.linkedinUrl || company.name;
          const runner = new TOPBuyerGroupRunner();
          
          let result = await runner.run(identifier, {
            skipDatabase: false
          });

          // If failed, try Perplexity research
          if ((!result || !result.buyerGroup || result.buyerGroup.length === 0) && this.perplexityApiKey) {
            console.log('⚠️  Coresignal failed, trying Perplexity research...');
            result = await this.tryPerplexityResearch(company, identifier);
            if (result && result.buyerGroup && result.buyerGroup.length > 0) {
              perplexityUsed++;
            }
          }

          if (result && result.buyerGroup && result.buyerGroup.length > 0) {
            const realEmails = result.buyerGroup.filter(m => {
              const email = m.email || (m.fullProfile?.email) || '';
              return email && !email.includes('@coresignal.temp') && email.includes('@');
            });

            const hasRealData = result.buyerGroup.some(m => 
              m.fullProfile || m.linkedinUrl || (m.email && !m.email.includes('@coresignal.temp'))
            );

            this.results.push({
              company: company.name,
              success: true,
              buyerGroupSize: result.buyerGroup.length,
              realEmails: realEmails.length,
              hasRealData: hasRealData,
              usedPerplexity: perplexityUsed > 0 && this.results.length > 0 && this.results[this.results.length - 1].usedPerplexity
            });

            successful++;
            console.log(`✅ Success: ${result.buyerGroup.length} members, ${realEmails.length} real emails`);

            if (!hasRealData) {
              console.log(`⚠️  WARNING: Buyer group may not have complete data`);
            }
          } else {
            this.results.push({
              company: company.name,
              success: false,
              error: 'No buyer group returned after all attempts'
            });
            failed++;
            console.log(`❌ Failed: No buyer group returned`);
          }

        } catch (error) {
          this.results.push({
            company: company.name,
            success: false,
            error: error.message
          });
          failed++;
          console.error(`❌ Error: ${error.message}`);
        }

        // Wait between companies
        if (processed < companiesToProcess.length) {
          console.log('\n⏳ Waiting 15 seconds before next company...');
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      // Summary
      this.printSummary(successful, failed, perplexityUsed);

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Load recently successful companies from log file
   */
  async loadRecentlySuccessful() {
    if (!fs.existsSync(LOG_FILE)) {
      return;
    }

    try {
      const log = fs.readFileSync(LOG_FILE, 'utf-8');
      const lines = log.split('\n');
      let currentCompany = null;

      for (const line of lines) {
        const match = line.match(/Processing [0-9]+\/[0-9]+: (.+)/);
        if (match) {
          currentCompany = match[1];
        }
        if (line.includes('✅ Success') && currentCompany) {
          this.recentlySuccessful.add(currentCompany);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not load recent successes: ${error.message}`);
    }
  }

  /**
   * Get all companies
   */
  async getCompanies() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null,
                isBuyerGroupMember: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Try Perplexity research as fallback
   */
  async tryPerplexityResearch(company, identifier) {
    if (!this.perplexityApiKey) {
      console.log('⚠️  Perplexity API key not configured, skipping research');
      return null;
    }

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
            employeeCount: 100 // Default estimate
          },
          report: null,
          cohesion: { score: 0 },
          coverage: null
        };
      }

      console.log('⚠️  Could not parse Perplexity response');
      return null;

    } catch (error) {
      console.error(`❌ Perplexity research failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Print summary
   */
  printSummary(successful, failed, perplexityUsed) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n✅ Successful: ${successful}`);
    const successfulResults = this.results.filter(r => r.success);
    successfulResults.forEach(r => {
      console.log(`   - ${r.company}: ${r.buyerGroupSize} members, ${r.realEmails} real emails${r.usedPerplexity ? ' (via Perplexity)' : ''}`);
    });

    if (failed > 0) {
      console.log(`\n❌ Failed: ${failed}`);
      const failedResults = this.results.filter(r => !r.success);
      failedResults.forEach(r => {
        console.log(`   - ${r.company}: ${r.error}`);
      });
    }

    if (perplexityUsed > 0) {
      console.log(`\n🔍 Perplexity used: ${perplexityUsed} companies`);
    }

    const totalRealEmails = successfulResults.reduce((sum, r) => sum + (r.realEmails || 0), 0);
    const totalMembers = successfulResults.reduce((sum, r) => sum + (r.buyerGroupSize || 0), 0);

    console.log(`\n📧 Total Statistics:`);
    console.log(`   - Total buyer group members: ${totalMembers}`);
    console.log(`   - Total real emails: ${totalRealEmails}`);
    console.log(`   - Average members per company: ${successful > 0 ? (totalMembers / successful).toFixed(1) : 0}`);

    console.log('\n✅ Processing complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new EnhancedTOPBuyerGroupRunner();
  runner.run().catch(console.error);
}

module.exports = { EnhancedTOPBuyerGroupRunner };

