#!/usr/bin/env node

/**
 * Analyze Dano's current data structure and identify cleanup needs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function analyzeDataStructure() {
  console.log('🔍 Analyzing Dano\'s data structure for cleanup...\n');
  
  try {
    // Get all data types
    const [leads, prospects, opportunities, accounts, contacts] = await Promise.all([
      prisma.lead.findMany({
        where: { workspaceId: danoWorkspaceId, isDemoData: false },
        select: { id: true, fullName: true, company: true, status: true, estimatedValue: true, email: true }
      }),
      prisma.prospect.findMany({
        where: { workspaceId: danoWorkspaceId },
        select: { id: true, fullName: true, company: true, engagementLevel: true }
      }),
      prisma.opportunity.findMany({
        where: { workspaceId: danoWorkspaceId },
        select: { id: true, name: true, amount: true, stage: true }
      }),
      prisma.account.findMany({
        where: { workspaceId: danoWorkspaceId },
        select: { id: true, name: true, industry: true }
      }),
      prisma.contact.findMany({
        where: { workspaceId: danoWorkspaceId },
        select: { id: true, firstName: true, lastName: true, email: true, accountId: true, account: { select: { name: true } } }
      })
    ]);

    console.log('📊 CURRENT DATA COUNTS:');
    console.log(`   Leads: ${leads.length}`);
    console.log(`   Prospects: ${prospects.length}`);
    console.log(`   Opportunities: ${opportunities.length}`);
    console.log(`   Accounts: ${accounts.length}`);
    console.log(`   Contacts: ${contacts.length}\n`);

    // Analyze leads without corresponding accounts/contacts
    console.log('🔍 LEADS ANALYSIS:');
    const leadCompanies = new Set(leads.map(l => l.company));
    const accountNames = new Set(accounts.map(a => a.name));
    
    console.log('Lead companies missing from accounts:');
    leadCompanies.forEach(company => {
      if (company && !accountNames.has(company)) {
        const leadsForCompany = leads.filter(l => l.company === company);
        console.log(`   ❌ ${company} (${leadsForCompany.length} leads)`);
      }
    });

    // Check which lead people are missing as contacts
    console.log('\nLead people missing from contacts:');
    const contactEmails = new Set(contacts.map(c => c.email).filter(Boolean));
    const contactNames = new Set(contacts.map(c => `${c.firstName} ${c.lastName}`.trim()));
    
    leads.forEach(lead => {
      const hasEmailMatch = lead.email && contactEmails.has(lead.email);
      const hasNameMatch = contactNames.has(lead.fullName);
      
      if (!hasEmailMatch && !hasNameMatch) {
        console.log(`   ❌ ${lead.fullName} at ${lead.company} (no contact record)`);
      }
    });

    // Analyze engagement levels
    console.log('\n🎯 ENGAGEMENT ANALYSIS:');
    
    // Group leads by company and status
    const leadsByCompany = {};
    leads.forEach(lead => {
      const company = lead.company || 'Unknown';
      if (!leadsByCompany[company]) {
        leadsByCompany[company] = [];
      }
      leadsByCompany[company].push(lead);
    });

    // Identify engaged companies (companies with qualified/active leads)
    const engagedCompanies = [];
    const nonEngagedCompanies = [];
    
    Object.entries(leadsByCompany).forEach(([company, companyLeads]) => {
      const hasEngagedPeople = companyLeads.some(lead => 
        ['qualified', 'active', 'interested', 'demo-scheduled'].includes(lead.status)
      );
      
      if (hasEngagedPeople) {
        engagedCompanies.push({ company, leads: companyLeads, engaged: true });
      } else {
        nonEngagedCompanies.push({ company, leads: companyLeads, engaged: false });
      }
    });

    console.log(`Companies with engaged people: ${engagedCompanies.length}`);
    engagedCompanies.forEach(({ company, leads }) => {
      const engagedPeople = leads.filter(l => ['qualified', 'active', 'interested', 'demo-scheduled'].includes(l.status));
      console.log(`   ✅ ${company}: ${engagedPeople.length}/${leads.length} people engaged`);
    });

    console.log(`\nCompanies with no engagement: ${nonEngagedCompanies.length}`);
    nonEngagedCompanies.forEach(({ company, leads }) => {
      console.log(`   ⏳ ${company}: ${leads.length} people (all new/cold)`);
    });

    // Analyze current prospects
    console.log('\n📋 CURRENT PROSPECTS:');
    if (prospects.length > 0) {
      prospects.forEach(prospect => {
        console.log(`   - ${prospect.fullName} at ${prospect.company} (${prospect.engagementLevel})`);
      });
    } else {
      console.log('   (No prospects currently in system)');
    }

    // Generate cleanup recommendations
    console.log('\n🛠️  CLEANUP RECOMMENDATIONS:');
    
    console.log('\n1. CREATE MISSING ACCOUNTS:');
    leadCompanies.forEach(company => {
      if (company && !accountNames.has(company)) {
        console.log(`   + Create account for: ${company}`);
      }
    });

    console.log('\n2. CREATE MISSING CONTACTS:');
    leads.forEach(lead => {
      const hasEmailMatch = lead.email && contactEmails.has(lead.email);
      const hasNameMatch = contactNames.has(lead.fullName);
      
      if (!hasEmailMatch && !hasNameMatch) {
        console.log(`   + Create contact for: ${lead.fullName} (${lead.company})`);
      }
    });

    console.log('\n3. PROMOTE TO PROSPECTS:');
    engagedCompanies.forEach(({ company, leads }) => {
      console.log(`   → Move all ${leads.length} people from ${company} to Prospects`);
      leads.forEach(lead => {
        console.log(`     - ${lead.fullName} (${lead.status})`);
      });
    });

    console.log('\n4. KEEP AS LEADS:');
    nonEngagedCompanies.forEach(({ company, leads }) => {
      console.log(`   ← Keep ${leads.length} people from ${company} as Leads`);
    });

  } catch (error) {
    console.error('❌ Error analyzing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDataStructure();
