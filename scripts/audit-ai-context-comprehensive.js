const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditAIContextComprehensive() {
  try {
    console.log('🔍 COMPREHENSIVE AI CONTEXT AUDIT FOR TOP ENGINEERING PLUS\n');
    
    const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK';
    
    // 1. WORKSPACE BUSINESS CONTEXT AUDIT
    console.log('=== 1. WORKSPACE BUSINESS CONTEXT AUDIT ===');
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        businessModel: true,
        industry: true,
        serviceOfferings: true,
        productPortfolio: true,
        valuePropositions: true,
        targetIndustries: true,
        targetCompanySize: true,
        idealCustomerProfile: true,
        competitiveAdvantages: true,
        salesMethodology: true
      }
    });
    
    console.log('✅ Workspace Business Context:');
    console.log(`   Company: ${workspace.name}`);
    console.log(`   Business Model: ${workspace.businessModel}`);
    console.log(`   Industry: ${workspace.industry}`);
    console.log(`   Service Offerings: ${workspace.serviceOfferings?.join(', ')}`);
    console.log(`   Product Portfolio: ${workspace.productPortfolio?.join(', ')}`);
    console.log(`   Value Props: ${workspace.valuePropositions?.join(', ')}`);
    console.log(`   Target Industries: ${workspace.targetIndustries?.join(', ')}`);
    console.log(`   Ideal Customer: ${workspace.idealCustomerProfile}`);
    console.log(`   Competitive Edge: ${workspace.competitiveAdvantages?.join(', ')}`);
    console.log(`   Sales Methodology: ${workspace.salesMethodology}\n`);
    
    // 2. SAMPLE RECORDS FOR DIFFERENT VIEWS
    console.log('=== 2. SAMPLE RECORDS FOR DIFFERENT VIEWS ===');
    
    // Get sample prospect (Speedrun)
    const sampleProspect = await prisma.people.findFirst({
      where: { 
        workspaceId: workspaceId,
        deletedAt: null,
        status: { in: ['PROSPECT', 'READY'] }
      },
      include: {
        company: {
          select: {
            name: true,
            industry: true,
            description: true,
            size: true,
            website: true
          }
        }
      }
    });
    
    // Get sample lead (Pipeline)
    const sampleLead = await prisma.people.findFirst({
      where: { 
        workspaceId: workspaceId,
        deletedAt: null,
        status: 'LEAD'
      },
      include: {
        company: {
          select: {
            name: true,
            industry: true,
            description: true,
            size: true,
            website: true
          }
        }
      }
    });
    
    // Get sample company
    const sampleCompany = await prisma.companies.findFirst({
      where: { 
        workspaceId: workspaceId,
        deletedAt: null
      },
      include: {
        people: {
          select: {
            fullName: true,
            jobTitle: true,
            email: true
          },
          take: 3
        }
      }
    });
    
    console.log('✅ Sample Prospect (Speedrun):');
    if (sampleProspect) {
      console.log(`   Name: ${sampleProspect.fullName}`);
      console.log(`   Title: ${sampleProspect.jobTitle}`);
      console.log(`   Company: ${sampleProspect.company?.name || 'Unknown'}`);
      console.log(`   Industry: ${sampleProspect.company?.industry || 'Unknown'}`);
      console.log(`   Status: ${sampleProspect.status}`);
      console.log(`   Email: ${sampleProspect.email || 'Not available'}`);
    } else {
      console.log('   No prospects found');
    }
    
    console.log('\n✅ Sample Lead (Pipeline):');
    if (sampleLead) {
      console.log(`   Name: ${sampleLead.fullName}`);
      console.log(`   Title: ${sampleLead.jobTitle}`);
      console.log(`   Company: ${sampleLead.company?.name || 'Unknown'}`);
      console.log(`   Industry: ${sampleLead.company?.industry || 'Unknown'}`);
      console.log(`   Status: ${sampleLead.status}`);
      console.log(`   Email: ${sampleLead.email || 'Not available'}`);
    } else {
      console.log('   No leads found');
    }
    
    console.log('\n✅ Sample Company:');
    if (sampleCompany) {
      console.log(`   Name: ${sampleCompany.name}`);
      console.log(`   Industry: ${sampleCompany.industry || 'Unknown'}`);
      console.log(`   Size: ${sampleCompany.size || 'Unknown'}`);
      console.log(`   Website: ${sampleCompany.website || 'Not available'}`);
      console.log(`   People Count: ${sampleCompany.people?.length || 0}`);
    } else {
      console.log('   No companies found');
    }
    
    // 3. DATA METRICS FOR AI CONTEXT
    console.log('\n=== 3. DATA METRICS FOR AI CONTEXT ===');
    
    const [peopleCount, companiesCount, prospectsCount, leadsCount] = await Promise.all([
      prisma.people.count({ where: { workspaceId, deletedAt: null } }),
      prisma.companies.count({ where: { workspaceId, deletedAt: null } }),
      prisma.people.count({ where: { workspaceId, deletedAt: null, status: { in: ['PROSPECT', 'READY'] } } }),
      prisma.people.count({ where: { workspaceId, deletedAt: null, status: 'LEAD' } })
    ]);
    
    console.log('✅ Workspace Data Metrics:');
    console.log(`   Total People: ${peopleCount}`);
    console.log(`   Total Companies: ${companiesCount}`);
    console.log(`   Prospects (Speedrun): ${prospectsCount}`);
    console.log(`   Leads (Pipeline): ${leadsCount}`);
    
    // 4. AI CONTEXT STRING SIMULATION
    console.log('\n=== 4. AI CONTEXT STRING SIMULATION ===');
    
    const aiContextString = `=== YOUR BUSINESS (WHO YOU ARE) ===
Company: ${workspace.name}
Industry: ${workspace.industry}
Business Model: ${workspace.businessModel}
What You Sell: ${workspace.productPortfolio?.join(', ')}
Your Value Props: ${workspace.valuePropositions?.join(', ')}
Your Ideal Customers: ${workspace.idealCustomerProfile}
Your Competitive Edge: ${workspace.competitiveAdvantages?.join(', ')}
Your Sales Approach: ${workspace.salesMethodology}

=== WORKSPACE DATA CONTEXT ===
- Total People: ${peopleCount}
- Total Companies: ${companiesCount}
- Active Prospects: ${prospectsCount}
- Active Leads: ${leadsCount}

=== CURRENT RECORD CONTEXT (Example) ===
${sampleProspect ? `
Person: ${sampleProspect.fullName}
Company: ${sampleProspect.company?.name || 'Unknown'}
Title: ${sampleProspect.jobTitle}
Industry: ${sampleProspect.company?.industry || 'Unknown'}
Email: ${sampleProspect.email || 'Not available'}
Status: ${sampleProspect.status}
` : 'No current record selected'}`;
    
    console.log('✅ AI Would Receive This Context:');
    console.log(aiContextString);
    
    // 5. CONTEXT CONSISTENCY CHECK
    console.log('\n=== 5. CONTEXT CONSISTENCY CHECK ===');
    
    const contextChecks = {
      workspaceBusinessContext: !!(workspace.businessModel && workspace.industry && workspace.serviceOfferings?.length),
      productKnowledge: !!(workspace.productPortfolio?.length && workspace.valuePropositions?.length),
      targetMarket: !!(workspace.targetIndustries?.length && workspace.idealCustomerProfile),
      competitiveAdvantage: !!(workspace.competitiveAdvantages?.length && workspace.salesMethodology),
      sampleData: !!(sampleProspect || sampleLead || sampleCompany)
    };
    
    console.log('✅ Context Completeness:');
    console.log(`   Workspace Business Context: ${contextChecks.workspaceBusinessContext ? '✅' : '❌'}`);
    console.log(`   Product Knowledge: ${contextChecks.productKnowledge ? '✅' : '❌'}`);
    console.log(`   Target Market: ${contextChecks.targetMarket ? '✅' : '❌'}`);
    console.log(`   Competitive Advantage: ${contextChecks.competitiveAdvantage ? '✅' : '❌'}`);
    console.log(`   Sample Data Available: ${contextChecks.sampleData ? '✅' : '❌'}`);
    
    // 6. RECOMMENDATIONS
    console.log('\n=== 6. RECOMMENDATIONS ===');
    
    const issues = [];
    if (!contextChecks.workspaceBusinessContext) issues.push('Workspace business context incomplete');
    if (!contextChecks.productKnowledge) issues.push('Product knowledge incomplete');
    if (!contextChecks.targetMarket) issues.push('Target market definition incomplete');
    if (!contextChecks.competitiveAdvantage) issues.push('Competitive advantage unclear');
    if (!contextChecks.sampleData) issues.push('No sample data for testing');
    
    if (issues.length === 0) {
      console.log('✅ All context checks passed! AI should have comprehensive understanding.');
    } else {
      console.log('⚠️ Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n=== AUDIT COMPLETE ===');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error during audit:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

auditAIContextComprehensive();
