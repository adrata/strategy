#!/usr/bin/env node

/**
 * 🔍 ANALYZE DANO'S DATA ENRICHMENT NEEDS
 * 
 * Analyzes current data quality in Dano's workspace to understand:
 * - Missing contact information (emails, phones, LinkedIn)
 * - Incomplete account data (websites, industries, company info)
 * - Enrichment opportunities using top100 pipeline modules
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function analyzeDanoEnrichmentNeeds() {
  console.log('🔍 ANALYZING DANO\'S DATA ENRICHMENT NEEDS');
  console.log('==========================================');
  
  try {
    // Get all data types
    const [leads, prospects, contacts, accounts, opportunities] = await Promise.all([
      prisma.lead.findMany({
        where: { workspaceId: danoWorkspaceId, deletedAt: null },
        select: { 
          id: true, 
          fullName: true, 
          company: true, 
          workEmail: true, 
          phone: true, 
          linkedinUrl: true, 
          jobTitle: true,
          industry: true,
          priority: true
        }
      }),
      prisma.prospect.findMany({
        where: { workspaceId: danoWorkspaceId, deletedAt: null },
        select: { 
          id: true, 
          fullName: true, 
          company: true, 
          workEmail: true, 
          phone: true, 
          linkedinUrl: true, 
          jobTitle: true,
          industry: true
        }
      }),
      prisma.contact.findMany({
        where: { workspaceId: danoWorkspaceId, deletedAt: null },
        select: { 
          id: true, 
          fullName: true, 
          workEmail: true, 
          phone: true, 
          linkedinUrl: true, 
          jobTitle: true, 
          department: true 
        }
      }),
      prisma.account.findMany({
        where: { workspaceId: danoWorkspaceId, deletedAt: null },
        select: { 
          id: true, 
          name: true, 
          website: true, 
          industry: true, 
          phone: true, 
          email: true, 
          size: true,
          revenue: true,
          description: true
        }
      }),
      prisma.opportunity.findMany({
        where: { workspaceId: danoWorkspaceId, deletedAt: null },
        select: { 
          id: true, 
          name: true, 
          amount: true, 
          stage: true 
        }
      })
    ]);

    console.log('\n📊 RECORD COUNTS:');
    console.log(`   Leads: ${leads.length}`);
    console.log(`   Prospects: ${prospects.length}`);
    console.log(`   Contacts: ${contacts.length}`);
    console.log(`   Accounts: ${accounts.length}`);
    console.log(`   Opportunities: ${opportunities.length}`);

    // Analyze people data completeness
    const allPeople = [...leads, ...prospects, ...contacts];
    const missingEmails = allPeople.filter(p => !p.workEmail).length;
    const missingPhones = allPeople.filter(p => !p.phone).length;
    const missingLinkedIn = allPeople.filter(p => !p.linkedinUrl).length;
    const missingTitles = allPeople.filter(p => !p.jobTitle).length;

    console.log('\n🔍 PEOPLE DATA COMPLETENESS:');
    console.log(`   Total People: ${allPeople.length}`);
    console.log(`   Missing Emails: ${missingEmails} (${Math.round(missingEmails/allPeople.length*100)}%)`);
    console.log(`   Missing Phones: ${missingPhones} (${Math.round(missingPhones/allPeople.length*100)}%)`);
    console.log(`   Missing LinkedIn: ${missingLinkedIn} (${Math.round(missingLinkedIn/allPeople.length*100)}%)`);
    console.log(`   Missing Job Titles: ${missingTitles} (${Math.round(missingTitles/allPeople.length*100)}%)`);

    // Analyze account completeness
    const missingWebsites = accounts.filter(a => !a.website).length;
    const missingIndustries = accounts.filter(a => !a.industry).length;
    const missingAccountEmails = accounts.filter(a => !a.email).length;
    const missingAccountPhones = accounts.filter(a => !a.phone).length;
    const missingSizes = accounts.filter(a => !a.size).length;
    const missingRevenue = accounts.filter(a => !a.revenue).length;

    console.log('\n🏢 ACCOUNT DATA COMPLETENESS:');
    console.log(`   Missing Websites: ${missingWebsites} (${Math.round(missingWebsites/accounts.length*100)}%)`);
    console.log(`   Missing Industries: ${missingIndustries} (${Math.round(missingIndustries/accounts.length*100)}%)`);
    console.log(`   Missing Account Emails: ${missingAccountEmails} (${Math.round(missingAccountEmails/accounts.length*100)}%)`);
    console.log(`   Missing Account Phones: ${missingAccountPhones} (${Math.round(missingAccountPhones/accounts.length*100)}%)`);
    console.log(`   Missing Company Sizes: ${missingSizes} (${Math.round(missingSizes/accounts.length*100)}%)`);
    console.log(`   Missing Revenue Data: ${missingRevenue} (${Math.round(missingRevenue/accounts.length*100)}%)`);

    // Sample records to show current state
    console.log('\n📝 SAMPLE LEAD RECORDS (Current State):');
    leads.slice(0, 3).forEach((lead, i) => {
      console.log(`   ${i+1}. ${lead.fullName} - ${lead.company}`);
      console.log(`      Email: ${lead.workEmail || '❌ MISSING'}`);
      console.log(`      Phone: ${lead.phone || '❌ MISSING'}`);
      console.log(`      LinkedIn: ${lead.linkedinUrl || '❌ MISSING'}`);
      console.log(`      Title: ${lead.jobTitle || '❌ MISSING'}`);
      console.log(`      Industry: ${lead.industry || '❌ MISSING'}`);
      console.log('');
    });

    console.log('\n📝 SAMPLE ACCOUNT RECORDS (Current State):');
    accounts.slice(0, 3).forEach((account, i) => {
      console.log(`   ${i+1}. ${account.name}`);
      console.log(`      Website: ${account.website || '❌ MISSING'}`);
      console.log(`      Industry: ${account.industry || '❌ MISSING'}`);
      console.log(`      Size: ${account.size || '❌ MISSING'}`);
      console.log(`      Revenue: ${account.revenue || '❌ MISSING'}`);
      console.log('');
    });

    // Identify high-priority enrichment candidates
    console.log('\n🎯 HIGH-PRIORITY ENRICHMENT CANDIDATES:');
    
    const highValueLeads = leads.filter(lead => 
      (!lead.workEmail || !lead.phone || !lead.linkedinUrl) && 
      (lead.priority >= 7 || lead.company)
    );
    
    console.log(`   High-value leads needing enrichment: ${highValueLeads.length}`);
    
    const companiesNeedingWebsites = accounts.filter(a => !a.website);
    console.log(`   Companies needing website discovery: ${companiesNeedingWebsites.length}`);
    
    const companiesNeedingIndustry = accounts.filter(a => !a.industry);
    console.log(`   Companies needing industry classification: ${companiesNeedingIndustry.length}`);

    // Enrichment potential analysis
    console.log('\n💎 ENRICHMENT POTENTIAL WITH TOP100 PIPELINE:');
    console.log('   ✅ Executive Contact Discovery: CEO/CFO emails and phones');
    console.log('   ✅ Company Intelligence: Industry classification, size, revenue');
    console.log('   ✅ PE/VC Ownership Analysis: Investment insights and exit strategies');
    console.log('   ✅ Contact Validation: Email verification and phone validation');
    console.log('   ✅ LinkedIn Profile Discovery: Professional network intelligence');
    console.log('   ✅ Hiring Intelligence: Job postings and growth signals');

    // Estimated enrichment impact
    const potentialEmailEnrichment = Math.min(missingEmails, Math.floor(allPeople.length * 0.7));
    const potentialPhoneEnrichment = Math.min(missingPhones, Math.floor(allPeople.length * 0.5));
    const potentialLinkedInEnrichment = Math.min(missingLinkedIn, Math.floor(allPeople.length * 0.8));

    console.log('\n📈 ESTIMATED ENRICHMENT IMPACT:');
    console.log(`   Potential Email Recovery: ${potentialEmailEnrichment} contacts (~70% success rate)`);
    console.log(`   Potential Phone Discovery: ${potentialPhoneEnrichment} contacts (~50% success rate)`);
    console.log(`   Potential LinkedIn Discovery: ${potentialLinkedInEnrichment} contacts (~80% success rate)`);
    
    const totalImprovementScore = Math.round(
      ((potentialEmailEnrichment + potentialPhoneEnrichment + potentialLinkedInEnrichment) / (allPeople.length * 3)) * 100
    );
    
    console.log(`   Overall Data Quality Improvement: +${totalImprovementScore}%`);

    console.log('\n🚀 RECOMMENDED ENRICHMENT STRATEGY:');
    console.log('   1. Start with high-priority leads (priority >= 7)');
    console.log('   2. Enrich company websites and industry classification');
    console.log('   3. Discover CEO/CFO contacts for all accounts');
    console.log('   4. Validate and enhance existing contact information');
    console.log('   5. Add PE/VC ownership intelligence for strategic insights');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  analyzeDanoEnrichmentNeeds();
}

module.exports = { analyzeDanoEnrichmentNeeds };
