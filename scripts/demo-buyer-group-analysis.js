const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demoBuyerGroupAnalysis() {
  try {
    console.log('🎯 DEMO: ENHANCED BUYER GROUP ANALYSIS OUTPUT\n');

    // Get one of Dan's technology accounts
    const danAccount = await prisma.accounts.findFirst({
      where: {
        assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM', // Dan
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Adrata workspace
        industry: {
          not: 'Retail/Convenience Store' // Exclude retail accounts
        }
      }
    });

    if (!danAccount) {
      console.log('❌ No technology accounts found for Dan');
      return;
    }

    console.log('📊 ACCOUNT SELECTED FOR ANALYSIS:');
    console.log(`   Company: ${danAccount.name}`);
    console.log(`   Industry: ${danAccount.industry}`);
    console.log(`   Account Type: ${danAccount.accountType}`);
    console.log(`   Tier: ${danAccount.tier}`);
    console.log('');

    // Simulate the enhanced buyer group analysis output
    console.log('🤖 ENHANCED BUYER GROUP ANALYSIS OUTPUT:');
    console.log('   (This is what the system would return)');
    console.log('');

    // Example output based on company size and industry
    const companySize = danAccount.tier === 'Tier 1' ? 'enterprise' : 
                       danAccount.tier === 'Tier 2' ? 'mid-market' : 'small';

    console.log('📋 COMPANY CONTEXT ANALYSIS:');
    console.log(`   Company Size: ${companySize.toUpperCase()}`);
    console.log(`   Industry: ${danAccount.industry}`);
    console.log(`   Decision Complexity: High (B2B software purchase)`);
    console.log('');

    console.log('🎯 ROLE HIERARCHY DETERMINATION:');
    if (companySize === 'enterprise') {
      console.log('   Sales: EVP Sales > CRO > VP Sales > Sales Director > Sales Manager');
      console.log('   Technology: CTO > VP Engineering > VP IT > IT Director > IT Manager');
      console.log('   Finance: CFO > VP Finance > Controller > Treasurer > Finance Manager');
    } else if (companySize === 'mid-market') {
      console.log('   Sales: CRO > VP Sales > Sales Director > Sales Manager');
      console.log('   Technology: CTO > VP Engineering > IT Director > IT Manager');
      console.log('   Finance: CFO > VP Finance > Controller > Finance Manager');
    } else {
      console.log('   Sales: VP Sales > Sales Director > Sales Manager');
      console.log('   Technology: CTO > IT Director > IT Manager');
      console.log('   Finance: CFO > Controller > Finance Manager');
    }
    console.log('');

    console.log('🔍 BUYER GROUP ROLES IDENTIFIED:');
    console.log('');
    
    console.log('1. 💰 DECISION MAKER (Budget Authority):');
    if (companySize === 'enterprise') {
      console.log('   Role: EVP Sales or CRO');
      console.log('   Reasoning: Enterprise companies have dedicated revenue leadership');
      console.log('   Decision Criteria: Strategic revenue impact, ROI, competitive advantage');
    } else if (companySize === 'mid-market') {
      console.log('   Role: CRO or VP Sales');
      console.log('   Reasoning: Mid-market companies consolidate sales leadership');
      console.log('   Decision Criteria: Revenue growth, operational efficiency, cost savings');
    } else {
      console.log('   Role: VP Sales');
      console.log('   Reasoning: Small companies have streamlined sales leadership');
      console.log('   Decision Criteria: Direct revenue impact, implementation ease');
    }
    console.log('');

    console.log('2. 🚀 CHAMPION (Internal Advocate):');
    if (danAccount.industry?.toLowerCase().includes('technology')) {
      console.log('   Role: CTO or VP Engineering');
      console.log('   Reasoning: Technology companies need technical validation');
      console.log('   Advocacy Points: Technical integration, scalability, innovation');
    } else {
      console.log('   Role: VP Operations or COO');
      console.log('   Reasoning: Operations leaders drive efficiency improvements');
      console.log('   Advocacy Points: Process optimization, cost reduction');
    }
    console.log('');

    console.log('3. 🎯 INFLUENCERS (Technical & Business):');
    console.log('   • VP Sales: Revenue impact and sales process integration');
    console.log('   • VP Marketing: Market positioning and competitive differentiation');
    console.log('   • Director of Sales Operations: Implementation and training');
    console.log('   • Sales Enablement Manager: User adoption and success metrics');
    console.log('');

    console.log('4. 💼 FINANCIAL STAKEHOLDERS:');
    console.log('   • CFO: Budget approval and financial ROI validation');
    console.log('   • VP Finance: Cost analysis and payment terms');
    console.log('   • Controller: Financial reporting and compliance');
    console.log('');

    console.log('5. 🔧 PROCUREMENT STAKEHOLDERS:');
    console.log('   • VP Procurement: Vendor selection and contract negotiation');
    console.log('   • Legal Counsel: Contract review and risk assessment');
    console.log('   • IT Procurement: Technical requirements and integration');
    console.log('');

    console.log('6. 🚫 POTENTIAL BLOCKERS:');
    console.log('   • IT Security Team: Security and compliance concerns');
    console.log('   • Change Management: User adoption and training resistance');
    console.log('   • Budget Holders: Financial constraints and approval delays');
    console.log('');

    console.log('7. 🌟 INTRODUCERS (Access Providers):');
    console.log('   • Sales Development Representatives: Initial outreach');
    console.log('   • Marketing Team: Lead generation and nurturing');
    console.log('   • Industry Partners: Referral and introduction networks');
    console.log('');

    console.log('📊 ROLE PRECISION SCORES:');
    console.log(`   Decision Maker Precision: ${companySize === 'enterprise' ? '95%' : companySize === 'mid-market' ? '90%' : '85%'}`);
    console.log(`   Champion Precision: ${danAccount.industry?.toLowerCase().includes('technology') ? '92%' : '88%'}`);
    console.log(`   Overall Role Hierarchy Precision: ${companySize === 'enterprise' ? '90%' : companySize === 'mid-market' ? '85%' : '80%'}`);
    console.log('');

    console.log('🎯 NEXT STEPS FOR SALES PROCESS:');
    console.log('   1. Target the Decision Maker first (budget authority)');
    console.log('   2. Cultivate the Champion for internal advocacy');
    console.log('   3. Engage Influencers for broader support');
    console.log('   4. Address potential blockers proactively');
    console.log('   5. Leverage introducers for warm introductions');
    console.log('');

    console.log('💡 KEY DIFFERENTIATION FROM OLD SYSTEM:');
    console.log('   • OLD: Generic "Sales Leader" or "VP" roles');
    console.log('   • NEW: Precise "EVP Sales vs CRO vs VP Sales" distinction');
    console.log('   • OLD: One-size-fits-all role determination');
    console.log('   • NEW: Company size and industry-specific hierarchies');
    console.log('   • OLD: No role validation or precision scoring');
    console.log('   • NEW: Role precision scores and validation logic');

  } catch (error) {
    console.error('❌ Error in demo buyer group analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo
if (require.main === module) {
  demoBuyerGroupAnalysis();
}

module.exports = { demoBuyerGroupAnalysis };
