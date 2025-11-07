#!/usr/bin/env node

/**
 * Complete Buyer Group Discovery with Full Enrichment
 * 
 * Runs continuously until all companies have buyer groups
 * AND enriches all people with accurate emails
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');
const { EnhancedIntelligenceResearch } = require('./enhanced-intelligence-research');
// Use the email verifier from the pipeline

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

class CompleteBuyerGroupWithEnrichment {
  constructor(workspaceId, workspaceName, userId) {
    this.prisma = new PrismaClient();
    this.workspaceId = workspaceId;
    this.workspaceName = workspaceName;
    this.userId = userId;
    this.intelligence = new EnhancedIntelligenceResearch();
    // Email verifier will be created from pipeline
    this.maxIterations = 10; // Max 10 iterations to avoid infinite loops
  }

  async run() {
    console.log(`🚀 Complete Buyer Group Discovery + Enrichment`);
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceName} (${this.workspaceId})`);
    console.log(`User: ${this.userId}\n`);

    let iteration = 0;
    let allComplete = false;

    while (!allComplete && iteration < this.maxIterations) {
      iteration++;
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🔄 ITERATION ${iteration}/${this.maxIterations}`);
      console.log('='.repeat(70));

      // Step 1: Get companies without buyer groups
      const companiesNeedingBuyerGroups = await this.getCompaniesNeedingBuyerGroups();
      console.log(`\n📊 Companies needing buyer groups: ${companiesNeedingBuyerGroups.length}`);

      if (companiesNeedingBuyerGroups.length > 0) {
        // Step 2: Run buyer group discovery for missing companies
        await this.runBuyerGroupDiscovery(companiesNeedingBuyerGroups);
      } else {
        console.log('✅ All companies have buyer groups!');
      }

      // Step 3: ALWAYS enrich all people with accurate emails (regardless of buyer group status)
      console.log(`\n📧 Enriching all people with accurate emails...`);
      await this.enrichAllPeople();

      // Step 4: Check if we're done
      const remaining = await this.getCompaniesNeedingBuyerGroups();
      if (remaining.length === 0) {
        allComplete = true;
        console.log('\n✅ ALL COMPLETE! All companies have buyer groups and all people are enriched!');
      } else {
        console.log(`\n⏳ ${remaining.length} companies still need buyer groups. Continuing...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between iterations
      }
    }

    if (!allComplete) {
      console.log(`\n⚠️  Reached max iterations (${this.maxIterations}). Some companies may still need buyer groups.`);
    }

    await this.prisma.$disconnect();
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

  async runBuyerGroupDiscovery(companies) {
    console.log(`\n🔍 Running buyer group discovery for ${companies.length} companies...`);

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`\n📊 Processing ${i + 1}/${companies.length}: ${company.name}`);

      try {
        // Try standard pipeline first
        const identifier = company.website || company.linkedinUrl || company.name;
        const pipeline = new SmartBuyerGroupPipeline({
          workspaceId: this.workspaceId,
          userId: this.userId,
          dealSize: this.workspaceId === TOP_WORKSPACE_ID ? 300000 : 50000,
          productCategory: this.workspaceId === TOP_WORKSPACE_ID ? 'engineering-services' : 'sales',
          usaOnly: this.workspaceId === TOP_WORKSPACE_ID
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
          console.log('⚠️  Standard pipeline failed, using Enhanced Intelligence Research...');
          
          const intelligenceResult = await this.intelligence.researchCompany(
            company.name,
            company.website,
            company.linkedinUrl,
            company.industry,
            company.employeeCount
          );

          if (intelligenceResult.executives && intelligenceResult.executives.length > 0) {
            console.log(`✅ Found ${intelligenceResult.executives.length} executives via AI research`);
            
            // Convert to buyer group format and save
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

            await this.saveBuyerGroup(company, result);
            console.log(`✅ Saved ${result.buyerGroup.length} members to database`);
          } else {
            console.log(`❌ No executives found via any method`);
          }
        } else {
          console.log(`✅ Success: ${result.buyerGroup.length} members via Coresignal`);
        }

      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
      }

      // Wait between companies
      if (i < companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  async enrichAllPeople() {
    // Get all people in workspace (including buyer group members)
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true
          }
        }
      }
    });

    console.log(`📧 Enriching ${people.length} people with accurate emails...`);

    let enriched = 0;
    let verified = 0;
    let discovered = 0;
    let errors = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      
      try {
        const companyDomain = person.company?.website 
          ? this.extractDomain(person.company.website) 
          : null;

        let emailResult = null;

        // If person has email, verify it using pipeline's email verifier
        if (person.email && person.email.includes('@')) {
          console.log(`   🔍 Verifying email for ${person.fullName}...`);
          // Create a temporary pipeline instance to use its email verifier
          const tempPipeline = new SmartBuyerGroupPipeline({
            workspaceId: this.workspaceId,
            userId: this.userId
          });
          const verification = await tempPipeline.emailVerifier.verifyEmailMultiLayer(
            person.email,
            person.fullName,
            companyDomain
          );

          if (verification.valid && verification.confidence >= 70) {
            // Update person with verified email
            await this.prisma.people.update({
              where: { id: person.id },
              data: {
                email: person.email,
                emailVerified: true,
                emailConfidence: verification.confidence
              }
            });
            verified++;
            emailResult = { verified: true, email: person.email, confidence: verification.confidence };
          } else {
            console.log(`   ⚠️  Email verification failed (${verification.confidence}%), trying discovery...`);
          }
        }

        // If no verified email, try to discover
        if (!emailResult && companyDomain && process.env.PROSPEO_API_KEY) {
          console.log(`   🔍 Discovering email for ${person.fullName}...`);
          const discovery = await this.discoverEmailWithProspeo(
            person.fullName,
            person.company?.name || '',
            companyDomain
          );

          if (discovery && discovery.email) {
            await this.prisma.people.update({
              where: { id: person.id },
              data: {
                email: discovery.email,
                emailVerified: true,
                emailConfidence: discovery.confidence || 80
              }
            });
            discovered++;
            emailResult = { discovered: true, email: discovery.email, confidence: discovery.confidence };
          }
        }

        if (emailResult) {
          enriched++;
          const action = emailResult.verified ? 'verified' : 'discovered';
          console.log(`   ✅ ${person.fullName}: ${action} email (${emailResult.confidence}% confidence)`);
        } else {
          console.log(`   ⚠️  ${person.fullName}: No email available`);
        }

      } catch (error) {
        errors++;
        console.error(`   ❌ Error enriching ${person.fullName}: ${error.message}`);
      }

      // Progress update every 10 people
      if ((i + 1) % 10 === 0) {
        console.log(`   📊 Progress: ${i + 1}/${people.length} (${enriched} enriched, ${errors} errors)`);
      }

      // Small delay to avoid rate limiting
      if (i < people.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n📊 Email Enrichment Summary:`);
    console.log(`   Total people: ${people.length}`);
    console.log(`   ✅ Enriched: ${enriched} (${verified} verified, ${discovered} discovered)`);
    console.log(`   ❌ Errors: ${errors}`);
  }

  async discoverEmailWithProspeo(name, companyName, companyDomain) {
    if (!process.env.PROSPEO_API_KEY) return null;

    try {
      const response = await fetch('https://api.prospeo.io/email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': process.env.PROSPEO_API_KEY.trim()
        },
        body: JSON.stringify({
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          domain: companyDomain
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.email && data.email.verification?.result === 'deliverable') {
          return {
            email: data.email.email,
            confidence: 85,
            source: 'prospeo'
          };
        }
      }
    } catch (error) {
      console.error(`   ⚠️  Prospeo discovery error: ${error.message}`);
    }

    return null;
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch {
      return null;
    }
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
    const buyerGroup = await this.prisma.buyerGroups.create({
      data: {
        workspaceId: this.workspaceId,
        companyId: company.id,
        totalMembers: result.buyerGroup.length,
        summary: `Buyer group discovered via Enhanced Intelligence Research for ${company.name}`,
        methodology: result.intelligence?.sources?.join(', ') || 'ai-research'
      }
    });

    for (const member of result.buyerGroup) {
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
            buyerGroupRole: member.role,
            email: member.email || person.email
          }
        });
      }

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
}

// Run for both workspaces
async function runAll() {
  // Run for Dan's Adrata workspace
  console.log('\n🎯 Starting for Dan\'s Adrata Workspace...\n');
  const adrataRunner = new CompleteBuyerGroupWithEnrichment(
    ADRATA_WORKSPACE_ID,
    "Dan's Adrata",
    DAN_USER_ID
  );
  await adrataRunner.run();

  // Run for TOP workspace
  console.log('\n🎯 Starting for TOP Workspace...\n');
  const topRunner = new CompleteBuyerGroupWithEnrichment(
    TOP_WORKSPACE_ID,
    "TOP Engineers Plus",
    DAN_USER_ID // Using Dan's ID, adjust if needed
  );
  await topRunner.run();
}

// Run if called directly
if (require.main === module) {
  const workspaceId = process.argv[2];
  const workspaceName = process.argv[3] || 'Workspace';
  const userId = process.argv[4] || DAN_USER_ID;

  if (workspaceId) {
    const runner = new CompleteBuyerGroupWithEnrichment(workspaceId, workspaceName, userId);
    runner.run().catch(console.error);
  } else {
    runAll().catch(console.error);
  }
}

module.exports = { CompleteBuyerGroupWithEnrichment };

