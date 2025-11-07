#!/usr/bin/env node

/**
 * Batch Enrichment for Workspace
 * 
 * Re-runs email and phone verification for all people in a workspace
 * Use this when contact data quality needs improvement
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

const prisma = new PrismaClient();

// Configuration
const WORKSPACE_NAME = process.argv[2] || 'Adrata'; // Get from command line or default to Adrata
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds
const DELAY_BETWEEN_CONTACTS = 500; // 500ms

class WorkspaceEnrichment {
  constructor(workspaceName) {
    this.workspaceName = workspaceName;
    this.workspaceId = null;
    
    // Initialize verifier
    this.verifier = new MultiSourceVerifier({
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      LUSHA_API_KEY: process.env.LUSHA_API_KEY,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      TIMEOUT: 30000
    });
    
    this.stats = {
      totalPeople: 0,
      processed: 0,
      emailsVerified: 0,
      emailsDiscovered: 0,
      phonesVerified: 0,
      phonesDiscovered: 0,
      skipped: 0,
      failed: 0,
      costs: {
        email: 0,
        phone: 0,
        total: 0
      },
      startTime: Date.now()
    };
  }

  async run() {
    try {
      console.log(`\n🚀 Starting Batch Enrichment for "${this.workspaceName}" Workspace`);
      console.log('='.repeat(80));
      
      // Find workspace
      const workspace = await this.findWorkspace();
      if (!workspace) {
        console.error(`❌ Workspace "${this.workspaceName}" not found`);
        console.log('\n💡 Available workspaces:');
        const workspaces = await prisma.workspaces.findMany({
          where: { deletedAt: null },
          select: { name: true, slug: true }
        });
        workspaces.forEach(w => console.log(`   - ${w.name} (${w.slug})`));
        process.exit(1);
      }
      
      this.workspaceId = workspace.id;
      console.log(`✅ Found workspace: ${workspace.name} (${workspace.slug})`);
      console.log(`📊 Workspace ID: ${this.workspaceId}\n`);
      
      // Get all people in workspace
      const people = await this.getPeople();
      this.stats.totalPeople = people.length;
      
      console.log(`📋 Found ${people.length} people in workspace`);
      
      if (people.length === 0) {
        console.log('❌ No people found to enrich');
        return;
      }
      
      // Filter people needing enrichment
      const needsEnrichment = people.filter(p => 
        (p.email || p.linkedinUrl) && // Has email or LinkedIn
        (!p.emailVerified || !p.phoneVerified || !p.emailConfidence || p.emailConfidence < 70) // Needs verification
      );
      
      console.log(`🔄 ${needsEnrichment.length} people need email/phone verification`);
      console.log(`⏭️  ${people.length - needsEnrichment.length} already verified (skipping)\n`);
      
      if (needsEnrichment.length === 0) {
        console.log('✅ All people already have verified contact information!');
        return;
      }
      
      // Confirm before proceeding
      console.log(`💰 Estimated cost: $${this.estimateCost(needsEnrichment)}`);
      console.log(`⏱️  Estimated time: ${this.estimateTime(needsEnrichment)}\n`);
      
      const confirm = await this.confirm('Proceed with batch enrichment?');
      if (!confirm) {
        console.log('❌ Enrichment cancelled');
        return;
      }
      
      // Process in batches
      await this.processPeopleInBatches(needsEnrichment);
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Batch enrichment failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async findWorkspace() {
    return await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: this.workspaceName, mode: 'insensitive' } },
          { slug: { contains: this.workspaceName.toLowerCase() } }
        ],
        deletedAt: null
      }
    });
  }

  async getPeople() {
    return await prisma.people.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async processPeopleInBatches(people) {
    const totalBatches = Math.ceil(people.length / BATCH_SIZE);
    
    console.log(`\n📦 Processing ${people.length} people in ${totalBatches} batches...\n`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = people.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
      
      console.log(`📦 Batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
      
      for (const person of batch) {
        await this.enrichPerson(person);
        await this.delay(DELAY_BETWEEN_CONTACTS);
      }
      
      // Progress update
      console.log(`\n📈 Progress: ${this.stats.processed}/${people.length} processed`);
      console.log(`   ✅ Emails verified: ${this.stats.emailsVerified}`);
      console.log(`   ✅ Phones verified: ${this.stats.phonesVerified}`);
      console.log(`   💰 Cost so far: $${this.stats.costs.total.toFixed(4)}\n`);
      
      if (batchIndex < totalBatches - 1) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...\n`);
        await this.delay(DELAY_BETWEEN_BATCHES);
      }
    }
  }

  async enrichPerson(person) {
    console.log(`   👤 ${person.fullName || person.firstName + ' ' + person.lastName}`);
    
    try {
      const companyDomain = person.company?.website ? this.extractDomain(person.company.website) : null;
      
      let emailResult = null;
      let phoneResult = null;
      
      // Verify/discover email
      if (person.email && person.email.includes('@')) {
        emailResult = await this.verifyEmail(person.email, person.fullName, companyDomain);
      } else if (companyDomain) {
        emailResult = await this.discoverEmail(person.fullName, companyDomain);
      }
      
      // Verify/discover phone
      if (person.linkedinUrl) {
        phoneResult = await this.discoverPhone(person.linkedinUrl);
      }
      
      // Update database
      await this.updatePerson(person.id, emailResult, phoneResult);
      
      this.stats.processed++;
      
      if (emailResult?.verified) {
        this.stats.emailsVerified++;
        console.log(`      📧 Email: ${emailResult.verified ? '✅' : '❌'} (${emailResult.confidence}%)`);
      }
      
      if (phoneResult?.verified) {
        this.stats.phonesVerified++;
        console.log(`      📞 Phone: ${phoneResult.verified ? '✅' : '❌'} (${phoneResult.confidence}%)`);
      }
      
    } catch (error) {
      console.error(`      ❌ Error: ${error.message}`);
      this.stats.failed++;
    }
  }

  async verifyEmail(email, fullName, companyDomain) {
    try {
      const verification = await this.verifier.verifyEmailMultiLayer(email, fullName, companyDomain);
      
      if (verification.valid) {
        this.stats.costs.email += 0.003;
        this.stats.costs.total += 0.003;
        return {
          email,
          verified: true,
          confidence: verification.confidence,
          source: 'verified'
        };
      }
    } catch (error) {
      console.log(`      ⚠️ Email verification error: ${error.message}`);
    }
    return null;
  }

  async discoverEmail(fullName, companyDomain) {
    if (!process.env.PROSPEO_API_KEY || !companyDomain) {
      return null;
    }

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      
      const response = await fetch('https://api.prospeo.io/email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': process.env.PROSPEO_API_KEY.trim()
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          company_domain: companyDomain
        }),
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.email && data.email.email) {
          this.stats.emailsDiscovered++;
          this.stats.costs.email += 0.0198;
          this.stats.costs.total += 0.0198;
          return {
            email: data.email.email,
            verified: true,
            confidence: 85,
            source: 'discovered'
          };
        }
      }
    } catch (error) {
      console.log(`      ⚠️ Email discovery error: ${error.message}`);
    }
    return null;
  }

  async discoverPhone(linkedinUrl) {
    if (!process.env.LUSHA_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
        method: 'GET',
        headers: {
          'api_key': process.env.LUSHA_API_KEY.trim(),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.contact?.data?.phoneNumbers?.length > 0) {
          const phones = data.contact.data.phoneNumbers;
          const best = phones.find(p => p.phoneType === 'direct') || phones.find(p => p.phoneType === 'mobile') || phones[0];
          
          this.stats.phonesDiscovered++;
          this.stats.costs.phone += 0.01;
          this.stats.costs.total += 0.01;
          
          return {
            phone: best.number,
            verified: true,
            confidence: 75,
            phoneType: best.phoneType,
            source: 'discovered'
          };
        }
      }
    } catch (error) {
      console.log(`      ⚠️ Phone discovery error: ${error.message}`);
    }
    return null;
  }

  async updatePerson(personId, emailResult, phoneResult) {
    const updateData = {};
    
    if (emailResult) {
      updateData.email = emailResult.email;
      updateData.emailVerified = emailResult.verified;
      updateData.emailConfidence = emailResult.confidence;
      updateData.emailSource = emailResult.source;
    }
    
    if (phoneResult) {
      updateData.phone = phoneResult.phone;
      updateData.phoneVerified = phoneResult.verified;
      updateData.phoneConfidence = phoneResult.confidence;
      updateData.phoneType = phoneResult.phoneType;
      if (phoneResult.phoneType === 'mobile') {
        updateData.mobilePhone = phoneResult.phone;
      } else if (phoneResult.phoneType === 'work') {
        updateData.workPhone = phoneResult.phone;
      }
    }
    
    if (Object.keys(updateData).length > 0) {
      updateData.lastEnriched = new Date();
      updateData.enrichmentSources = ['multi-source-verification'];
      updateData.enrichmentVersion = '2.1';
      
      await prisma.people.update({
        where: { id: personId },
        data: updateData
      });
    }
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  estimateCost(people) {
    const avgEmailCost = 0.01; // Conservative estimate
    const avgPhoneCost = 0.01; // Conservative estimate
    return ((people.length * avgEmailCost) + (people.length * avgPhoneCost)).toFixed(2);
  }

  estimateTime(people) {
    const avgTimePerPerson = 10; // seconds
    const totalSeconds = people.length * avgTimePerPerson;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  async confirm(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(`${question} (y/n): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }

  printResults() {
    const duration = Date.now() - this.stats.startTime;
    const durationSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 BATCH ENRICHMENT COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n👥 People Statistics:`);
    console.log(`   Total: ${this.stats.totalPeople}`);
    console.log(`   Processed: ${this.stats.processed}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    console.log(`   Failed: ${this.stats.failed}`);
    
    console.log(`\n📧 Email Results:`);
    console.log(`   Verified: ${this.stats.emailsVerified}`);
    console.log(`   Discovered: ${this.stats.emailsDiscovered}`);
    console.log(`   Total: ${this.stats.emailsVerified + this.stats.emailsDiscovered}`);
    
    console.log(`\n📞 Phone Results:`);
    console.log(`   Verified: ${this.stats.phonesVerified}`);
    console.log(`   Discovered: ${this.stats.phonesDiscovered}`);
    console.log(`   Total: ${this.stats.phonesVerified + this.stats.phonesDiscovered}`);
    
    console.log(`\n💰 Costs:`);
    console.log(`   Email: $${this.stats.costs.email.toFixed(4)}`);
    console.log(`   Phone: $${this.stats.costs.phone.toFixed(4)}`);
    console.log(`   Total: $${this.stats.costs.total.toFixed(4)}`);
    
    console.log(`\n⏱️  Duration: ${minutes}m ${seconds}s`);
    console.log('='.repeat(80) + '\n');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  console.log('\n🎯 Workspace Batch Enrichment Tool');
  console.log('Usage: node enrich-workspace.js [workspace-name]');
  console.log('Example: node enrich-workspace.js "Adrata"\n');
  
  const enrichment = new WorkspaceEnrichment(WORKSPACE_NAME);
  enrichment.run().catch(console.error);
}

module.exports = { WorkspaceEnrichment };

