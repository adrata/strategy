#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for Adrata Missing Companies with Enhanced Intelligence
 * 
 * Uses multiple AI sources (Claude, OpenRouter, Perplexity) when Coresignal fails
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');
const { EnhancedIntelligenceResearch } = require('./enhanced-intelligence-research');

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

class AdrataIntelligenceRunner {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = ADRATA_WORKSPACE_ID;
    this.intelligence = new EnhancedIntelligenceResearch();
  }

  async run() {
    console.log('🧠 Adrata Workspace - Enhanced Intelligence Buyer Group Discovery');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}`);
    console.log(`User: Dan Mirolli (${DAN_USER_ID})\n`);

    try {
      // Get companies without buyer groups
      const companies = await this.getCompaniesNeedingBuyerGroups();
      console.log(`📊 Found ${companies.length} companies without buyer groups\n`);

      if (companies.length === 0) {
        console.log('✅ All companies already have buyer groups!');
        return;
      }

      let successful = 0;
      let failed = 0;
      const results = [];

      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n📊 Processing ${i + 1}/${companies.length}: ${company.name}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log(`   Industry: ${company.industry || 'N/A'}`);
        console.log(`   Employees: ${company.employeeCount || 'N/A'}\n`);

        try {
          // Try standard pipeline first
          const identifier = company.website || company.linkedinUrl || company.name;
          const pipeline = new SmartBuyerGroupPipeline({
            workspaceId: this.workspaceId,
            mainSellerId: DAN_USER_ID, // 🏆 FIX: Pass userId as mainSellerId so people appear in counts
            dealSize: 50000,
            productCategory: 'sales',
            usaOnly: false
          });

          let result = await pipeline.run(identifier, {
            companyData: {
              id: company.id,
              name: company.name,
              industry: company.industry,
              employeeCount: company.employeeCount,
              revenue: company.revenue
            }
          });

          // If failed, use enhanced intelligence research
          if (!result || !result.buyerGroup || result.buyerGroup.length === 0) {
            console.log('\n⚠️  Standard pipeline failed, using Enhanced Intelligence Research...');
            
            const intelligenceResult = await this.intelligence.researchCompany(
              company.name,
              company.website,
              company.linkedinUrl,
              company.industry,
              company.employeeCount
            );

            if (intelligenceResult.executives && intelligenceResult.executives.length > 0) {
              console.log(`\n✅ Found ${intelligenceResult.executives.length} executives via AI research`);
              
              // Convert to buyer group format
              result = {
                buyerGroup: intelligenceResult.executives.map(e => ({
                  fullName: e.name,
                  title: e.title,
                  linkedinUrl: e.linkedinUrl,
                  email: e.email,
                  source: e.source || 'ai-research',
                  role: this.inferRole(e.title)
                })),
                intelligence: {
                  companyName: company.name,
                  sources: intelligenceResult.sources
                }
              };

              // Save to database
              await this.saveBuyerGroup(company, result);
              
              successful++;
              results.push({
                company: company.name,
                success: true,
                buyerGroupSize: result.buyerGroup.length,
                sources: intelligenceResult.sources.join(', ')
              });
              
              console.log(`✅ Success: ${result.buyerGroup.length} members via ${intelligenceResult.sources.join(', ')}`);
            } else {
              failed++;
              results.push({
                company: company.name,
                success: false,
                error: 'No executives found via any method'
              });
              console.log(`❌ Failed: No executives found`);
            }
          } else {
            successful++;
            results.push({
              company: company.name,
              success: true,
              buyerGroupSize: result.buyerGroup.length,
              sources: 'coresignal'
            });
            console.log(`✅ Success: ${result.buyerGroup.length} members via Coresignal`);
          }

        } catch (error) {
          failed++;
          results.push({
            company: company.name,
            success: false,
            error: error.message
          });
          console.error(`❌ Error: ${error.message}`);
        }

        // Wait between companies
        if (i < companies.length - 1) {
          console.log('\n⏳ Waiting 10 seconds before next company...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      // Summary
      this.printSummary(successful, failed, results);

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getCompaniesNeedingBuyerGroups() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [{ website: { not: null } }, { linkedinUrl: { not: null } }],
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

  inferRole(title) {
    if (!title) return 'Stakeholder';
    const lower = title.toLowerCase();
    if (lower.includes('ceo') || lower.includes('president') || lower.includes('founder')) return 'Decision Maker';
    if (lower.includes('cto') || lower.includes('chief technology')) return 'Decision Maker';
    if (lower.includes('cfo') || lower.includes('chief financial')) return 'Decision Maker';
    if (lower.includes('vp') || lower.includes('vice president')) return 'Champion';
    if (lower.includes('director')) return 'Stakeholder';
    return 'Stakeholder';
  }

  async saveBuyerGroup(company, result) {
    // Create buyer group record
    const buyerGroup = await this.prisma.buyerGroups.create({
      data: {
        workspaceId: this.workspaceId,
        companyId: company.id,
        totalMembers: result.buyerGroup.length,
        summary: `Buyer group discovered via Enhanced Intelligence Research for ${company.name}`,
        methodology: result.intelligence?.sources?.join(', ') || 'ai-research'
      }
    });

    // Create people records
    for (const member of result.buyerGroup) {
      // Find or create person
      let person = await this.prisma.people.findFirst({
        where: {
          workspaceId: this.workspaceId,
          companyId: company.id,
          OR: [
            { fullName: member.fullName },
            { linkedinUrl: member.linkedinUrl }
          ].filter(Boolean)
        }
      });

      if (!person) {
        person = await this.prisma.people.create({
          data: {
            workspaceId: this.workspaceId,
            companyId: company.id,
            fullName: member.fullName,
            jobTitle: member.title,
            linkedinUrl: member.linkedinUrl,
            email: member.email,
            isBuyerGroupMember: true,
            buyerGroupRole: member.role
          }
        });
      } else {
        await this.prisma.people.update({
          where: { id: person.id },
          data: {
            isBuyerGroupMember: true,
            buyerGroupRole: member.role
          }
        });
      }

      // Create buyer group member record
      await this.prisma.buyerGroupMembers.create({
        data: {
          buyerGroupId: buyerGroup.id,
          personId: person.id,
          role: member.role,
          memberRecords: {
            fullName: member.fullName,
            title: member.title,
            linkedinUrl: member.linkedinUrl,
            email: member.email,
            source: member.source
          }
        }
      });
    }
  }

  printSummary(successful, failed, results) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n✅ Successful: ${successful}`);
    const successfulResults = results.filter(r => r.success);
    successfulResults.forEach(r => {
      console.log(`   - ${r.company}: ${r.buyerGroupSize} members (${r.sources})`);
    });

    if (failed > 0) {
      console.log(`\n❌ Failed: ${failed}`);
      const failedResults = results.filter(r => !r.success);
      failedResults.forEach(r => {
        console.log(`   - ${r.company}: ${r.error}`);
      });
    }

    console.log('\n✅ Processing complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new AdrataIntelligenceRunner();
  runner.run().catch(console.error);
}

module.exports = { AdrataIntelligenceRunner };

