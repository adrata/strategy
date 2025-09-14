#!/usr/bin/env node

/**
 * Final Analysis: Dan's Companies in Adrata Workspace
 * Analyzing all companies since they're likely Dan's pipeline
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDanCompaniesFinal() {
  console.log('🔍 Final Analysis: Dan\'s Companies in Adrata Workspace...\n');

  try {
    // Get the adrata workspace
    const adrataWorkspace = await prisma.workspace.findFirst({
      where: { slug: 'adrata' }
    });

    if (!adrataWorkspace) {
      console.log('❌ No "adrata" workspace found');
      return;
    }

    console.log(`✅ Found adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})\n`);

    // Get all leads and opportunities (treating them as Dan's data)
    console.log('📋 Getting all leads and opportunities in adrata workspace...');
    
    const allLeads = await prisma.lead.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        deletedAt: null
      }
    });

    const allOpportunities = await prisma.opportunity.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        deletedAt: null
      },
      include: {
        account: true,
        lead: true
      }
    });

    console.log(`✅ Found ${allLeads.length} leads and ${allOpportunities.length} opportunities\n`);

    // Analyze companies
    console.log('📊 Analyzing company patterns...\n');
    
    const companies = new Map();
    
    // Process leads
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
            totalEstimatedValue: 0,
            currencies: new Set()
          });
        }
        
        const company = companies.get(companyKey);
        company.leads.push({
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
            totalEstimatedValue: 0,
            currencies: new Set()
          });
        }
        
        const company = companies.get(companyKey);
        company.opportunities.push({
          name: opp.name,
          description: opp.description,
          amount: opp.amount,
          currency: opp.currency,
          stage: opp.stage,
          probability: opp.probability
        });
        
        if (opp.amount) {
          company.totalEstimatedValue += opp.amount;
        }
        if (opp.currency) {
          company.currencies.add(opp.currency);
        }
      }
    });

    console.log(`🏢 Dan's Companies Analysis (${companies.size} unique companies):`);
    console.log('═'.repeat(80));

    // Pattern Analysis
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
      
      // Analyze opportunities
      company.opportunities.forEach(opp => {
        const stage = opp.stage || 'Unknown';
        statuses.set(stage, (statuses.get(stage) || 0) + 1);
      });
    });

    // Display top companies
    console.log('\n🏆 TOP 20 COMPANIES BY VALUE:');
    Array.from(companies.values())
      .sort((a, b) => b.totalEstimatedValue - a.totalEstimatedValue)
      .slice(0, 20)
      .forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   📝 Industry: ${company.industry || 'Not specified'}`);
        console.log(`   📏 Size: ${company.size || 'Not specified'}`);
        console.log(`   👥 Leads: ${company.leads.length} | 🎯 Opportunities: ${company.opportunities.length}`);
        console.log(`   💰 Value: $${company.totalEstimatedValue.toLocaleString()}`);
        console.log('');
      });

    // Pattern Analysis Results
    console.log('\n🔍 PATTERN ANALYSIS RESULTS');
    console.log('═'.repeat(80));

    console.log('\n📊 INDUSTRY DISTRIBUTION:');
    Array.from(industries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Top 15
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

    // L1-3, M1-3 size classification
    console.log('\n📏 COMPANY SIZE CLASSIFICATION (L1-3, M1-3 Style):');
    const sizeClassification = new Map();
    
    Array.from(companies.values()).forEach(company => {
      const size = company.size || 'Unknown';
      let classification = 'Unknown';
      
      // Map to L1-3, M1-3 classification
      if (size.toLowerCase().includes('small') || 
          size.toLowerCase().includes('startup') ||
          size.toLowerCase().includes('1-10') ||
          size.toLowerCase().includes('seed') ||
          size.toLowerCase().includes('pre-') ||
          size.match(/\b(1-50|1-25|1-100)\b/i)) {
        classification = 'S1-S3 (Small: 1-100 employees)';
      } else if (size.toLowerCase().includes('medium') ||
                 size.toLowerCase().includes('series a') ||
                 size.toLowerCase().includes('series b') ||
                 size.match(/\b(50-200|100-500|101-250|201-500)\b/i)) {
        classification = 'M1-M3 (Medium: 100-500 employees)';
      } else if (size.toLowerCase().includes('large') ||
                 size.toLowerCase().includes('enterprise') ||
                 size.toLowerCase().includes('series c') ||
                 size.toLowerCase().includes('series d') ||
                 size.toLowerCase().includes('public') ||
                 size.match(/\b(500\+|1000\+|501-1000|1001-5000|5000\+)\b/i)) {
        classification = 'L1-L3 (Large: 500+ employees)';
      }
      
      sizeClassification.set(classification, (sizeClassification.get(classification) || 0) + 1);
    });

    Array.from(sizeClassification.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([classification, count]) => {
        const percentage = ((count / companies.size) * 100).toFixed(1);
        console.log(`   ${classification}: ${count} companies (${percentage}%)`);
      });

    console.log('\n🏢 TOP DEPARTMENTS:');
    Array.from(departments.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([dept, count]) => {
        const percentage = ((count / allLeads.length) * 100).toFixed(1);
        console.log(`   ${dept}: ${count} leads (${percentage}%)`);
      });

    console.log('\n🎯 BUYER ROLE DISTRIBUTION:');
    Array.from(buyerRoles.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([role, count]) => {
        const percentage = ((count / allLeads.length) * 100).toFixed(1);
        console.log(`   ${role}: ${count} leads (${percentage}%)`);
      });

    console.log('\n📊 STATUS/STAGE DISTRIBUTION:');
    Array.from(statuses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([status, count]) => {
        const totalItems = allLeads.length + allOpportunities.length;
        const percentage = ((count / totalItems) * 100).toFixed(1);
        console.log(`   ${status}: ${count} items (${percentage}%)`);
      });

    // Key Insights
    console.log('\n\n💡 KEY INSIGHTS & COMMON ATTRIBUTES');
    console.log('═'.repeat(80));
    
    const topIndustry = Array.from(industries.entries()).sort((a, b) => b[1] - a[1])[0];
    const topSize = Array.from(companySizes.entries()).sort((a, b) => b[1] - a[1])[0];
    const topDepartment = Array.from(departments.entries()).sort((a, b) => b[1] - a[1])[0];
    const topBuyerRole = Array.from(buyerRoles.entries()).sort((a, b) => b[1] - a[1])[0];
    const topStatus = Array.from(statuses.entries()).sort((a, b) => b[1] - a[1])[0];
    
    console.log(`🏆 Most Common Industry: ${topIndustry?.[0]} (${topIndustry?.[1]} companies)`);
    console.log(`📏 Most Common Size Category: ${topSize?.[0]} (${topSize?.[1]} companies)`);
    console.log(`🏢 Most Common Department: ${topDepartment?.[0]} (${topDepartment?.[1]} leads)`);
    console.log(`🎯 Most Common Buyer Role: ${topBuyerRole?.[0]} (${topBuyerRole?.[1]} leads)`);
    console.log(`📊 Most Common Status: ${topStatus?.[0]} (${topStatus?.[1]} items)`);
    
    const totalValue = Array.from(companies.values()).reduce((sum, company) => sum + company.totalEstimatedValue, 0);
    console.log(`💰 Total Pipeline Value: $${totalValue.toLocaleString()}`);
    console.log(`📊 Average Value per Company: $${Math.round(totalValue / companies.size).toLocaleString()}`);
    console.log(`📈 Total Companies: ${companies.size}`);
    console.log(`👥 Total Leads: ${allLeads.length}`);
    console.log(`🎯 Total Opportunities: ${allOpportunities.length}`);

    // Company profile insights
    console.log('\n🎯 COMPANY PROFILE INSIGHTS:');
    const techCompanies = Array.from(companies.values()).filter(c => 
      c.industry?.toLowerCase().includes('tech') || 
      c.industry?.toLowerCase().includes('software') ||
      c.industry?.toLowerCase().includes('saas') ||
      c.name.match(/(Adobe|Datadog|Snowflake|Twilio|Okta|HashiCorp|Smartsheet)/i)
    ).length;
    
    const seriesABCompanies = Array.from(companies.values()).filter(c => 
      c.size?.toLowerCase().includes('series a') || 
      c.size?.toLowerCase().includes('series b')
    ).length;

    console.log(`🔧 Technology/Software Companies: ${techCompanies} (${((techCompanies / companies.size) * 100).toFixed(1)}%)`);
    console.log(`🚀 Series A/B Stage Companies: ${seriesABCompanies} (${((seriesABCompanies / companies.size) * 100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Error analyzing Dan\'s companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeDanCompaniesFinal(); 