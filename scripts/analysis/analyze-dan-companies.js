#!/usr/bin/env node

/**
 * Analyze Dan's Companies - Find common variables and patterns
 * This script queries the database for user "dan" and analyzes the companies he has
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDanCompanies() {
  console.log('🔍 Starting analysis of Dan\'s companies...\n');

  try {
    // First, find user "dan@adrata.com"
    console.log('📋 Step 1: Finding user "dan@adrata.com"');
    const danUser = await prisma.user.findFirst({
      where: {
        email: 'dan@adrata.com'
      }
    });

    if (!danUser) {
      console.log('❌ No user found with email "dan@adrata.com"');
      return;
    }

    console.log(`✅ Found user: ${danUser.name} (${danUser.email}) - ID: ${danUser.id}\n`);

    // Get Dan's workspace memberships
    console.log('📋 Step 2: Finding Dan\'s workspaces');
    const workspaceMemberships = await prisma.workspaceUser.findMany({
      where: { userId: danUser.id },
      include: { workspace: true }
    });

    console.log(`✅ Found ${workspaceMemberships.length} workspace memberships:`);
    workspaceMemberships.forEach(membership => {
      console.log(`   - ${membership.workspace.name} (${membership.workspace.slug}) - Role: ${membership.role}`);
    });
    console.log('');

    // Find the "adrata" workspace
    console.log('📋 Step 3: Finding the "adrata" workspace');
    const adrataWorkspace = await prisma.workspace.findFirst({
      where: {
        slug: 'adrata'
      }
    });

    if (!adrataWorkspace) {
      console.log('❌ No "adrata" workspace found');
      return;
    }

    console.log(`✅ Found adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})\n`);

    // Get Dan's leads (which contain company information)
    console.log('📋 Step 4: Finding leads assigned to Dan in adrata workspace');
    const danLeads = await prisma.lead.findMany({
      where: {
        assignedUserId: danUser.id,
        workspaceId: adrataWorkspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        company: true,
        companyDomain: true,
        industry: true,
        companySize: true,
        jobTitle: true,
        department: true,
        email: true,
        workspaceId: true,
        status: true,
        priority: true,
        buyerGroupRole: true,
        estimatedValue: true,
        currency: true,
        createdAt: true
      }
    });

    console.log(`✅ Found ${danLeads.length} leads assigned to Dan in adrata workspace`);

    // Get Dan's opportunities (which also contain company information)
    console.log('📋 Step 5: Finding opportunities assigned to Dan in adrata workspace');
    const danOpportunities = await prisma.opportunity.findMany({
      where: {
        assignedUserId: danUser.id,
        workspaceId: adrataWorkspace.id,
        deletedAt: null
      },
      include: {
        account: true,
        lead: true
      }
    });

    console.log(`✅ Found ${danOpportunities.length} opportunities assigned to Dan in adrata workspace\n`);

    if (danLeads.length === 0 && danOpportunities.length === 0) {
      console.log('❌ No leads or opportunities found for Dan');
      return;
    }

    // Analyze company patterns
    console.log('📊 Step 6: Analyzing company patterns\n');
    
    // Extract unique companies from both leads and opportunities
    const companies = new Map();
    
    // Process leads
    danLeads.forEach(lead => {
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
            totalEstimatedValue: 0,
            currencies: new Set()
          });
        }
        
        const company = companies.get(companyKey);
        company.leads.push({
          type: 'lead',
          name: lead.fullName,
          title: lead.jobTitle,
          department: lead.department,
          email: lead.email,
          status: lead.status,
          priority: lead.priority,
          buyerGroupRole: lead.buyerGroupRole,
          estimatedValue: lead.estimatedValue,
          currency: lead.currency
        });
        
        if (lead.estimatedValue) {
          company.totalEstimatedValue += lead.estimatedValue;
        }
        if (lead.currency) {
          company.currencies.add(lead.currency);
        }
      }
    });

    // Process opportunities
    danOpportunities.forEach(opp => {
      let companyName = null;
      let companyKey = null;
      
      // Get company name from account or lead
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
            totalEstimatedValue: 0,
            currencies: new Set()
          });
        }
        
        const company = companies.get(companyKey);
        company.opportunities.push({
          type: 'opportunity',
          name: opp.name,
          description: opp.description,
          amount: opp.amount,
          currency: opp.currency,
          stage: opp.stage,
          probability: opp.probability,
          expectedCloseDate: opp.expectedCloseDate,
          priority: opp.priority,
          status: 'opportunity'
        });
        
        if (opp.amount) {
          company.totalEstimatedValue += opp.amount;
        }
        if (opp.currency) {
          company.currencies.add(opp.currency);
        }
      }
    });

    console.log(`🏢 Companies Overview (${companies.size} unique companies):`);
    console.log('═'.repeat(80));
    
    Array.from(companies.values()).forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`);
      console.log(`   📝 Industry: ${company.industry || 'Not specified'}`);
      console.log(`   📏 Size: ${company.size || 'Not specified'}`);
      console.log(`   🌐 Domain: ${company.domain || 'Not specified'}`);
      console.log(`   👥 Lead Count: ${company.leads.length}`);
      console.log(`   🎯 Opportunity Count: ${company.opportunities.length}`);
      console.log(`   💰 Total Estimated Value: $${company.totalEstimatedValue.toLocaleString()} (${Array.from(company.currencies).join(', ') || 'No currency'})`);
      
      // Show lead details
      if (company.leads.length > 0) {
        console.log(`   📋 LEADS:`);
        company.leads.forEach((lead, leadIndex) => {
          console.log(`      ${leadIndex + 1}. ${lead.name} - ${lead.title || 'No title'}`);
          console.log(`         📧 ${lead.email || 'No email'}`);
          console.log(`         🏢 ${lead.department || 'No department'}`);
          console.log(`         📊 Status: ${lead.status}, Priority: ${lead.priority}`);
          console.log(`         🎯 Buyer Role: ${lead.buyerGroupRole || 'Not specified'}`);
          if (lead.estimatedValue) {
            console.log(`         💵 Value: $${lead.estimatedValue.toLocaleString()} ${lead.currency || ''}`);
          }
        });
      }
      
      // Show opportunity details
      if (company.opportunities.length > 0) {
        console.log(`   🎯 OPPORTUNITIES:`);
        company.opportunities.forEach((opp, oppIndex) => {
          console.log(`      ${oppIndex + 1}. ${opp.name}`);
          if (opp.description) {
            console.log(`         📝 ${opp.description}`);
          }
          console.log(`         📊 Stage: ${opp.stage}, Priority: ${opp.priority || 'Not specified'}`);
          console.log(`         📈 Probability: ${opp.probability || 'Not specified'}%`);
          if (opp.amount) {
            console.log(`         💵 Amount: $${opp.amount.toLocaleString()} ${opp.currency || ''}`);
          }
          if (opp.expectedCloseDate) {
            console.log(`         📅 Expected Close: ${new Date(opp.expectedCloseDate).toLocaleDateString()}`);
          }
        });
      }
    });

    // Pattern Analysis
    console.log('\n\n🔍 PATTERN ANALYSIS');
    console.log('═'.repeat(80));

    // Industry analysis
    const industries = new Map();
    const companySizes = new Map();
    const departments = new Map();
    const buyerRoles = new Map();
    const statuses = new Map();
    const priorities = new Map();

    Array.from(companies.values()).forEach(company => {
      // Industry patterns
      const industry = company.industry || 'Unknown';
      industries.set(industry, (industries.get(industry) || 0) + 1);
      
      // Size patterns  
      const size = company.size || 'Unknown';
      companySizes.set(size, (companySizes.get(size) || 0) + 1);
      
      // Analyze leads within each company
      company.leads.forEach(lead => {
        const dept = lead.department || 'Unknown';
        departments.set(dept, (departments.get(dept) || 0) + 1);
        
        const role = lead.buyerGroupRole || 'Unknown';
        buyerRoles.set(role, (buyerRoles.get(role) || 0) + 1);
        
        const status = lead.status || 'Unknown';
        statuses.set(status, (statuses.get(status) || 0) + 1);
        
        const priority = lead.priority || 'Unknown';
        priorities.set(priority, (priorities.get(priority) || 0) + 1);
      });
      
      // Analyze opportunities within each company
      company.opportunities.forEach(opp => {
        const stage = opp.stage || 'Unknown';
        statuses.set(stage, (statuses.get(stage) || 0) + 1);
        
        const priority = opp.priority || 'Unknown';
        priorities.set(priority, (priorities.get(priority) || 0) + 1);
      });
    });

    // Display patterns
    console.log('\n📊 INDUSTRY DISTRIBUTION:');
    Array.from(industries.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([industry, count]) => {
        const percentage = ((count / companies.size) * 100).toFixed(1);
        console.log(`   ${industry}: ${count} companies (${percentage}%)`);
      });

    console.log('\n📏 COMPANY SIZE DISTRIBUTION:');
    Array.from(companySizes.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([size, count]) => {
        const percentage = ((count / companies.size) * 100).toFixed(1);
        console.log(`   ${size}: ${count} companies (${percentage}%)`);
      });

    const totalLeadsAndOpps = danLeads.length + danOpportunities.length;

    console.log('\n🏢 DEPARTMENT DISTRIBUTION:');
    Array.from(departments.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10
      .forEach(([dept, count]) => {
        const percentage = ((count / danLeads.length) * 100).toFixed(1);
        console.log(`   ${dept}: ${count} leads (${percentage}%)`);
      });

    console.log('\n🎯 BUYER ROLE DISTRIBUTION:');
    Array.from(buyerRoles.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([role, count]) => {
        const percentage = ((count / danLeads.length) * 100).toFixed(1);
        console.log(`   ${role}: ${count} leads (${percentage}%)`);
      });

    console.log('\n📊 STATUS/STAGE DISTRIBUTION:');
    Array.from(statuses.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const percentage = ((count / totalLeadsAndOpps) * 100).toFixed(1);
        console.log(`   ${status}: ${count} items (${percentage}%)`);
      });

    console.log('\n⚡ PRIORITY DISTRIBUTION:');
    Array.from(priorities.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([priority, count]) => {
        const percentage = ((count / totalLeadsAndOpps) * 100).toFixed(1);
        console.log(`   ${priority}: ${count} items (${percentage}%)`);
      });

    // L1-3, M1-3 size analysis
    console.log('\n📏 COMPANY SIZE CLASSIFICATION (L1-3, M1-3 Style):');
    const sizeClassification = new Map();
    
    Array.from(companies.values()).forEach(company => {
      const size = company.size || 'Unknown';
      let classification = 'Unknown';
      
      // Map common size formats to L1-3, M1-3 classification
      if (size.toLowerCase().includes('small') || 
          size.toLowerCase().includes('startup') ||
          size.toLowerCase().includes('1-10') ||
          size.toLowerCase().includes('1-50')) {
        classification = 'S1-S3 (Small)';
      } else if (size.toLowerCase().includes('medium') ||
                 size.toLowerCase().includes('50-200') ||
                 size.toLowerCase().includes('100-500')) {
        classification = 'M1-M3 (Medium)';
      } else if (size.toLowerCase().includes('large') ||
                 size.toLowerCase().includes('enterprise') ||
                 size.toLowerCase().includes('500+') ||
                 size.toLowerCase().includes('1000+')) {
        classification = 'L1-L3 (Large)';
      }
      
      sizeClassification.set(classification, (sizeClassification.get(classification) || 0) + 1);
    });

    Array.from(sizeClassification.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([classification, count]) => {
        const percentage = ((count / companies.size) * 100).toFixed(1);
        console.log(`   ${classification}: ${count} companies (${percentage}%)`);
      });

    // Summary insights
    console.log('\n\n💡 KEY INSIGHTS');
    console.log('═'.repeat(80));
    
    const topIndustry = Array.from(industries.entries()).sort((a, b) => b[1] - a[1])[0];
    const topSize = Array.from(companySizes.entries()).sort((a, b) => b[1] - a[1])[0];
    const topDepartment = Array.from(departments.entries()).sort((a, b) => b[1] - a[1])[0];
    const topBuyerRole = Array.from(buyerRoles.entries()).sort((a, b) => b[1] - a[1])[0];
    
    console.log(`🏆 Most Common Industry: ${topIndustry?.[0]} (${topIndustry?.[1]} companies)`);
    console.log(`📏 Most Common Size: ${topSize?.[0]} (${topSize?.[1]} companies)`);
    console.log(`🏢 Most Common Department: ${topDepartment?.[0]} (${topDepartment?.[1]} leads)`);
    console.log(`🎯 Most Common Buyer Role: ${topBuyerRole?.[0]} (${topBuyerRole?.[1]} leads)`);
    
    const totalValue = Array.from(companies.values()).reduce((sum, company) => sum + company.totalEstimatedValue, 0);
    console.log(`💰 Total Pipeline Value: $${totalValue.toLocaleString()}`);
    console.log(`📊 Average Value per Company: $${(totalValue / companies.size).toLocaleString()}`);
    console.log(`📈 Total Companies: ${companies.size}`);
    console.log(`👥 Total Leads: ${danLeads.length}`);
    console.log(`🎯 Total Opportunities: ${danOpportunities.length}`);

  } catch (error) {
    console.error('❌ Error analyzing Dan\'s companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeDanCompanies(); 