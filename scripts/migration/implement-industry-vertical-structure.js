#!/usr/bin/env node

/**
 * Industry & Vertical Structure Implementation
 * 
 * This script implements the new clean industry/vertical classification system:
 * 1. Creates core industry and vertical records
 * 2. Links existing companies to the new structure
 * 3. Maintains backward compatibility with existing string fields
 * 
 * Architecture:
 * - Core: people + companies (with industry/vertical intelligence)
 * - Extensions: leads, prospects, opportunities (linked via personId/companyId)
 * - Intelligence: Real-time industry/vertical insights
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Core Industry Structure - Clean & Sales-Friendly
const CORE_INDUSTRIES = [
  {
    name: "Technology",
    code: "TECH",
    description: "Software, hardware, and technology services",
    marketSize: "$2.3T globally",
    growthRate: 0.08,
    maturity: "growth",
    keyTrends: ["AI adoption", "Digital transformation", "Cloud migration"],
    commonPainPoints: ["Legacy systems", "Security", "Scalability"],
    verticals: [
      {
        name: "SaaS",
        code: "SAAS",
        description: "Software as a Service companies",
        marketSize: "$673B globally",
        growthRate: 0.15,
        maturity: "growth",
        keyPlayers: ["Salesforce", "HubSpot", "Pipedrive", "Slack", "Zoom"],
        marketLeaders: ["Salesforce", "Microsoft", "Adobe"],
        emergingPlayers: ["Notion", "Airtable", "Linear"],
        keyTrends: ["AI-powered automation", "No-code platforms", "API-first architecture"],
        painPoints: ["Integration complexity", "Data silos", "User adoption"],
        opportunities: ["Vertical-specific solutions", "API-first", "AI integration"],
        avgSalesCycle: "6-18 months",
        decisionMakers: ["CTO", "VP Engineering", "IT Director"],
        budgetSeason: ["Q4", "Q1"],
        priceSensitivity: "medium",
        commonTechStack: ["AWS", "React", "PostgreSQL", "Node.js"],
        integrationNeeds: ["CRM", "ERP", "Analytics", "Slack"],
        complianceReqs: ["SOC 2", "GDPR", "HIPAA"],
        regulatoryComplexity: "medium"
      },
      {
        name: "FinTech",
        code: "FINTECH",
        description: "Financial technology companies",
        marketSize: "$310B globally",
        growthRate: 0.20,
        maturity: "growth",
        keyPlayers: ["Stripe", "Square", "PayPal", "Robinhood", "Coinbase"],
        marketLeaders: ["Visa", "Mastercard", "PayPal"],
        emergingPlayers: ["Plaid", "Chime", "Revolut"],
        keyTrends: ["Digital banking", "Cryptocurrency", "Open banking"],
        painPoints: ["Regulatory compliance", "Security", "Legacy systems"],
        opportunities: ["Digital transformation", "API banking", "AI fraud detection"],
        avgSalesCycle: "12-24 months",
        decisionMakers: ["CTO", "CFO", "Compliance Officer"],
        budgetSeason: ["Q1", "Q2"],
        priceSensitivity: "low",
        commonTechStack: ["Java", "Python", "Kubernetes", "PostgreSQL"],
        integrationNeeds: ["Banking APIs", "Payment systems", "Compliance tools"],
        complianceReqs: ["PCI DSS", "SOX", "GDPR", "AML"],
        regulatoryComplexity: "high"
      },
      {
        name: "HealthTech",
        code: "HEALTHTECH",
        description: "Healthcare technology companies",
        marketSize: "$660B globally",
        growthRate: 0.12,
        maturity: "growth",
        keyPlayers: ["Epic", "Cerner", "Teladoc", "Livongo", "Veracyte"],
        marketLeaders: ["Epic", "Cerner", "Allscripts"],
        emergingPlayers: ["Ro", "Hims", "Carbon Health"],
        keyTrends: ["Telemedicine", "AI diagnostics", "Digital therapeutics"],
        painPoints: ["Interoperability", "Data privacy", "Regulatory compliance"],
        opportunities: ["AI-powered diagnostics", "Remote monitoring", "Patient engagement"],
        avgSalesCycle: "18-36 months",
        decisionMakers: ["CMO", "CTO", "Compliance Officer"],
        budgetSeason: ["Q4", "Q1"],
        priceSensitivity: "low",
        commonTechStack: ["Java", "C#", "HL7", "FHIR"],
        integrationNeeds: ["EMR systems", "Lab systems", "Pharmacy systems"],
        complianceReqs: ["HIPAA", "FDA", "SOC 2"],
        regulatoryComplexity: "high"
      }
    ]
  },
  {
    name: "Healthcare",
    code: "HEALTH",
    description: "Healthcare providers, payers, and life sciences",
    marketSize: "$4.1T globally",
    growthRate: 0.06,
    maturity: "mature",
    keyTrends: ["Value-based care", "Digital health", "Precision medicine"],
    commonPainPoints: ["Cost management", "Quality outcomes", "Regulatory compliance"],
    verticals: [
      {
        name: "Digital Health",
        code: "DIGITALHEALTH",
        description: "Digital health solutions and telemedicine",
        marketSize: "$660B globally",
        growthRate: 0.15,
        maturity: "growth",
        keyPlayers: ["Teladoc", "Livongo", "Amwell", "Doctor on Demand"],
        marketLeaders: ["Teladoc", "Amwell", "MDLive"],
        emergingPlayers: ["Ro", "Hims", "Carbon Health"],
        keyTrends: ["Telemedicine", "Remote monitoring", "AI diagnostics"],
        painPoints: ["Reimbursement", "Regulatory compliance", "Provider adoption"],
        opportunities: ["Chronic care management", "Mental health", "Preventive care"],
        avgSalesCycle: "12-24 months",
        decisionMakers: ["CMO", "CFO", "IT Director"],
        budgetSeason: ["Q4", "Q1"],
        priceSensitivity: "medium",
        commonTechStack: ["React", "Node.js", "AWS", "FHIR"],
        integrationNeeds: ["EMR systems", "Billing systems", "Patient portals"],
        complianceReqs: ["HIPAA", "FDA", "SOC 2"],
        regulatoryComplexity: "high"
      }
    ]
  },
  {
    name: "Financial Services",
    code: "FINANCE",
    description: "Banks, insurance, investment, and financial services",
    marketSize: "$22.5T globally",
    growthRate: 0.04,
    maturity: "mature",
    keyTrends: ["Digital banking", "Open banking", "RegTech"],
    commonPainPoints: ["Digital transformation", "Regulatory compliance", "Customer experience"],
    verticals: [
      {
        name: "Banking",
        code: "BANKING",
        description: "Traditional and digital banks",
        marketSize: "$8.9T globally",
        growthRate: 0.03,
        maturity: "mature",
        keyPlayers: ["JPMorgan", "Bank of America", "Wells Fargo", "Chase"],
        marketLeaders: ["JPMorgan", "Bank of America", "Wells Fargo"],
        emergingPlayers: ["Chime", "Varo", "Current"],
        keyTrends: ["Digital banking", "Open banking", "AI fraud detection"],
        painPoints: ["Legacy systems", "Regulatory compliance", "Customer acquisition"],
        opportunities: ["Digital transformation", "API banking", "Personalization"],
        avgSalesCycle: "24-36 months",
        decisionMakers: ["CTO", "CFO", "Risk Officer"],
        budgetSeason: ["Q1", "Q2"],
        priceSensitivity: "low",
        commonTechStack: ["Java", "C#", "Mainframe", "Kubernetes"],
        integrationNeeds: ["Core banking", "Payment systems", "Compliance tools"],
        complianceReqs: ["Basel III", "SOX", "AML", "PCI DSS"],
        regulatoryComplexity: "high"
      }
    ]
  }
];

async function implementIndustryVerticalStructure() {
  console.log('🏗️  IMPLEMENTING INDUSTRY & VERTICAL STRUCTURE');
  console.log('===============================================\n');
  
  try {
    // Step 1: Create Core Industries
    console.log('📊 STEP 1: Creating core industries...');
    const createdIndustries = {};
    
    for (const industryData of CORE_INDUSTRIES) {
      const industry = await prisma.industries.upsert({
        where: { code: industryData.code },
        update: {
          name: industryData.name,
          description: industryData.description,
          marketSize: industryData.marketSize,
          growthRate: industryData.growthRate,
          maturity: industryData.maturity,
          keyTrends: industryData.keyTrends,
          commonPainPoints: industryData.commonPainPoints,
          updatedAt: new Date()
        },
        create: {
          workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
          name: industryData.name,
          code: industryData.code,
          description: industryData.description,
          marketSize: industryData.marketSize,
          growthRate: industryData.growthRate,
          maturity: industryData.maturity,
          keyTrends: industryData.keyTrends,
          commonPainPoints: industryData.commonPainPoints,
          isActive: true,
          sortOrder: CORE_INDUSTRIES.indexOf(industryData)
        }
      });
      
      createdIndustries[industryData.code] = industry;
      console.log(`✅ Created industry: ${industry.name} (${industry.code})`);
    }
    
    // Step 2: Create Verticals
    console.log('\n📊 STEP 2: Creating industry verticals...');
    const createdVerticals = {};
    
    for (const industryData of CORE_INDUSTRIES) {
      const industry = createdIndustries[industryData.code];
      
      for (const verticalData of industryData.verticals) {
        const vertical = await prisma.industry_verticals.upsert({
          where: { 
            industryId_code: {
              industryId: industry.id,
              code: verticalData.code
            }
          },
          update: {
            name: verticalData.name,
            description: verticalData.description,
            marketSize: verticalData.marketSize,
            growthRate: verticalData.growthRate,
            maturity: verticalData.maturity,
            keyPlayers: verticalData.keyPlayers,
            marketLeaders: verticalData.marketLeaders,
            emergingPlayers: verticalData.emergingPlayers,
            keyTrends: verticalData.keyTrends,
            painPoints: verticalData.painPoints,
            opportunities: verticalData.opportunities,
            avgSalesCycle: verticalData.avgSalesCycle,
            decisionMakers: verticalData.decisionMakers,
            budgetSeason: verticalData.budgetSeason,
            priceSensitivity: verticalData.priceSensitivity,
            commonTechStack: verticalData.commonTechStack,
            integrationNeeds: verticalData.integrationNeeds,
            complianceReqs: verticalData.complianceReqs,
            regulatoryComplexity: verticalData.regulatoryComplexity,
            updatedAt: new Date()
          },
          create: {
            workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
            industryId: industry.id,
            name: verticalData.name,
            code: verticalData.code,
            description: verticalData.description,
            marketSize: verticalData.marketSize,
            growthRate: verticalData.growthRate,
            maturity: verticalData.maturity,
            keyPlayers: verticalData.keyPlayers,
            marketLeaders: verticalData.marketLeaders,
            emergingPlayers: verticalData.emergingPlayers,
            keyTrends: verticalData.keyTrends,
            painPoints: verticalData.painPoints,
            opportunities: verticalData.opportunities,
            avgSalesCycle: verticalData.avgSalesCycle,
            decisionMakers: verticalData.decisionMakers,
            budgetSeason: verticalData.budgetSeason,
            priceSensitivity: verticalData.priceSensitivity,
            commonTechStack: verticalData.commonTechStack,
            integrationNeeds: verticalData.integrationNeeds,
            complianceReqs: verticalData.complianceReqs,
            regulatoryComplexity: verticalData.regulatoryComplexity,
            isActive: true,
            sortOrder: industryData.verticals.indexOf(verticalData)
          }
        });
        
        createdVerticals[verticalData.code] = vertical;
        console.log(`✅ Created vertical: ${vertical.name} (${vertical.code}) under ${industry.name}`);
      }
    }
    
    // Step 3: Link Existing Companies
    console.log('\n🔗 STEP 3: Linking existing companies to industry/vertical structure...');
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' // Dan's workspace
      },
      select: {
        id: true,
        name: true,
        industry: true,
        vertical: true
      }
    });
    
    console.log(`Found ${companies.length} companies to process`);
    
    let linkedCount = 0;
    const industryMapping = {
      'Technology': 'TECH',
      'Software': 'TECH',
      'SaaS': 'TECH',
      'FinTech': 'TECH',
      'HealthTech': 'TECH',
      'Healthcare': 'HEALTH',
      'Financial Services': 'FINANCE',
      'Banking': 'FINANCE'
    };
    
    const verticalMapping = {
      'SaaS': 'SAAS',
      'FinTech': 'FINTECH',
      'HealthTech': 'HEALTHTECH',
      'Digital Health': 'DIGITALHEALTH',
      'Banking': 'BANKING'
    };
    
    for (const company of companies) {
      let industryId = null;
      let verticalId = null;
      
      // Try to map existing industry string to new structure
      if (company.industry) {
        const industryCode = industryMapping[company.industry] || 'TECH'; // Default to TECH
        const industry = createdIndustries[industryCode];
        if (industry) {
          industryId = industry.id;
        }
      }
      
      // Try to map existing vertical string to new structure
      if (company.vertical) {
        const verticalCode = verticalMapping[company.vertical];
        if (verticalCode && createdVerticals[verticalCode]) {
          verticalId = createdVerticals[verticalCode].id;
        }
      }
      
      // Update company with new foreign keys (keep legacy fields for backward compatibility)
      if (industryId || verticalId) {
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            industryId: industryId,
            verticalId: verticalId
          }
        });
        
        linkedCount++;
        console.log(`✅ Linked ${company.name} to industry/vertical structure`);
      }
    }
    
    console.log(`\n🎉 SUCCESS: Industry & Vertical Structure Implemented`);
    console.log('==================================================');
    console.log(`✅ Created ${Object.keys(createdIndustries).length} industries`);
    console.log(`✅ Created ${Object.keys(createdVerticals).length} verticals`);
    console.log(`✅ Linked ${linkedCount} companies to new structure`);
    console.log('\n📋 Next Steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Test the new industry/vertical relationships');
    console.log('3. Update UI components to use new structure');
    console.log('4. Gradually migrate from string fields to relationships');
    
  } catch (error) {
    console.error('❌ Error implementing industry/vertical structure:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the implementation
if (require.main === module) {
  implementIndustryVerticalStructure()
    .then(() => {
      console.log('\n✅ Industry & Vertical Structure implementation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Implementation failed:', error);
      process.exit(1);
    });
}

module.exports = { implementIndustryVerticalStructure, CORE_INDUSTRIES };
