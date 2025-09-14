#!/usr/bin/env node

/**
 * Analyze All Adrata Workspace Data - Understand what companies and data exist
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAdrataData() {
  console.log('🔍 Starting analysis of all Adrata workspace data...\n');

  try {
    // Find the "adrata" workspace
    console.log('📋 Step 1: Finding the "adrata" workspace');
    const adrataWorkspace = await prisma.workspace.findFirst({
      where: { slug: 'adrata' }
    });

    if (!adrataWorkspace) {
      console.log('❌ No "adrata" workspace found');
      return;
    }

    console.log(`✅ Found adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})\n`);

    // Get all users in the workspace
    console.log('📋 Step 2: Finding all users in adrata workspace');
    const workspaceUsers = await prisma.workspaceUser.findMany({
      where: { workspaceId: adrataWorkspace.id },
      include: { user: true }
    });

    console.log(`✅ Found ${workspaceUsers.length} users in adrata workspace:`);
    workspaceUsers.forEach(wu => {
      console.log(`   - ${wu.user.name} (${wu.user.email}) - Role: ${wu.role}`);
    });
    console.log('');

    // Get all leads in the workspace
    console.log('📋 Step 3: Finding all leads in adrata workspace');
    const allLeads = await prisma.lead.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        deletedAt: null
      },
      include: {
        assignedUser: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`✅ Found ${allLeads.length} total leads in adrata workspace\n`);

    // Get all opportunities in the workspace
    console.log('📋 Step 4: Finding all opportunities in adrata workspace');
    const allOpportunities = await prisma.opportunity.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        deletedAt: null
      },
      include: {
        assignedUser: {
          select: { name: true, email: true }
        },
        account: true,
        lead: true
      }
    });

    console.log(`✅ Found ${allOpportunities.length} total opportunities in adrata workspace\n`);

    if (allLeads.length === 0 && allOpportunities.length === 0) {
      console.log('❌ No leads or opportunities found in adrata workspace');
      return;
    }

    // Analyze assignment patterns
    console.log('📊 Step 5: Analyzing user assignment patterns\n');
    
    const leadAssignments = new Map();
    const oppAssignments = new Map();

    allLeads.forEach(lead => {
      const assignee = lead.assignedUser ? `${lead.assignedUser.name} (${lead.assignedUser.email})` : 'Unassigned';
      leadAssignments.set(assignee, (leadAssignments.get(assignee) || 0) + 1);
    });

    allOpportunities.forEach(opp => {
      const assignee = opp.assignedUser ? `${opp.assignedUser.name} (${opp.assignedUser.email})` : 'Unassigned';
      oppAssignments.set(assignee, (oppAssignments.get(assignee) || 0) + 1);
    });

    console.log('📊 LEAD ASSIGNMENTS:');
    Array.from(leadAssignments.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([assignee, count]) => {
        console.log(`   ${assignee}: ${count} leads`);
      });

    console.log('\n🎯 OPPORTUNITY ASSIGNMENTS:');
    Array.from(oppAssignments.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([assignee, count]) => {
        console.log(`   ${assignee}: ${count} opportunities`);
      });

    // Analyze companies from all data
    console.log('\n\n📊 Step 6: Analyzing all companies in workspace\n');
    
    const companies = new Map();
    
    // Process all leads
    allLeads.forEach(lead => {
      if (lead.company) {
        const companyKey = lead.company.toLowerCase();
        if (!companies.has(companyKey)) {
          companies.set(companyKey, {
            name: lead.company,
            domain: lead.companyDomain,
            industry: lead.industry,
            size: lead.companySize,
            leads: [],
            opportunities: [],
            assignedUsers: new Set(),
            totalEstimatedValue: 0,
            currencies: new Set()
          });
        }
        
        const company = companies.get(companyKey);
        company.leads.push({
          name: lead.fullName,
          title: lead.jobTitle,
          assignedTo: lead.assignedUser ? lead.assignedUser.email : 'Unassigned'
        });
        
        if (lead.assignedUser) {
          company.assignedUsers.add(lead.assignedUser.email);
        }
        
        if (lead.estimatedValue) {
          company.totalEstimatedValue += lead.estimatedValue;
        }
        if (lead.currency) {
          company.currencies.add(lead.currency);
        }
      }
    });

    // Process all opportunities
    allOpportunities.forEach(opp => {
      let companyName = null;
      let companyKey = null;
      
      if (opp.account && opp.account.name) {
        companyName = opp.account.name;
        companyKey = companyName.toLowerCase();
      } else if (opp.lead && opp.lead.company) {
        companyName = opp.lead.company;
        companyKey = companyName.toLowerCase();
      }
      
      if (companyName && companyKey) {
        if (!companies.has(companyKey)) {
          companies.set(companyKey, {
            name: companyName,
            domain: opp.account?.website || opp.lead?.companyDomain,
            industry: opp.account?.industry || opp.lead?.industry,
            size: opp.account?.size || opp.lead?.companySize,
            leads: [],
            opportunities: [],
            assignedUsers: new Set(),
            totalEstimatedValue: 0,
            currencies: new Set()
          });
        }
        
        const company = companies.get(companyKey);
        company.opportunities.push({
          name: opp.name,
          amount: opp.amount,
          stage: opp.stage,
          assignedTo: opp.assignedUser ? opp.assignedUser.email : 'Unassigned'
        });
        
        if (opp.assignedUser) {
          company.assignedUsers.add(opp.assignedUser.email);
        }
        
        if (opp.amount) {
          company.totalEstimatedValue += opp.amount;
        }
        if (opp.currency) {
          company.currencies.add(opp.currency);
        }
      }
    });

    console.log(`🏢 All Companies in Adrata Workspace (${companies.size} unique companies):`);
    console.log('═'.repeat(80));

    // Show top 20 companies by value
    const sortedCompanies = Array.from(companies.values())
      .sort((a, b) => b.totalEstimatedValue - a.totalEstimatedValue)
      .slice(0, 20);

    sortedCompanies.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`);
      console.log(`   📝 Industry: ${company.industry || 'Not specified'}`);
      console.log(`   📏 Size: ${company.size || 'Not specified'}`);
      console.log(`   👥 Lead Count: ${company.leads.length}`);
      console.log(`   🎯 Opportunity Count: ${company.opportunities.length}`);
      console.log(`   💰 Total Value: $${company.totalEstimatedValue.toLocaleString()}`);
      console.log(`   👨‍💼 Assigned Users: ${Array.from(company.assignedUsers).join(', ') || 'None'}`);
    });

    // Check specifically for Dan-related data
    console.log('\n\n🔍 LOOKING FOR DAN-RELATED DATA:');
    console.log('═'.repeat(80));

    const danRelatedCompanies = Array.from(companies.values()).filter(company => 
      company.assignedUsers.has('dan@adrata.com')
    );

    console.log(`📊 Companies with dan@adrata.com assigned: ${danRelatedCompanies.length}`);

    if (danRelatedCompanies.length > 0) {
      danRelatedCompanies.forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.name}`);
        console.log(`   📝 Industry: ${company.industry || 'Not specified'}`);
        console.log(`   📏 Size: ${company.size || 'Not specified'}`);
        console.log(`   💰 Total Value: $${company.totalEstimatedValue.toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing adrata data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeAdrataData(); 