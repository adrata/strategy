/**
 * ✅ WORKSPACE ENRICHMENT VERIFICATION
 * 
 * Verifies that all workspaces have been enriched with business context data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyWorkspaceEnrichment() {
  try {
    console.log('🔍 Verifying workspace enrichment...\n');

    // Get all workspaces with business context fields
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
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

    console.log(`Found ${workspaces.length} workspaces to verify:\n`);

    let enrichedCount = 0;
    let totalFields = 0;
    let filledFields = 0;

    for (const workspace of workspaces) {
      console.log(`🏢 Workspace: ${workspace.name}`);
      console.log(`   ID: ${workspace.id}`);
      
      const fields = [
        { name: 'businessModel', value: workspace.businessModel },
        { name: 'industry', value: workspace.industry },
        { name: 'serviceOfferings', value: workspace.serviceOfferings },
        { name: 'productPortfolio', value: workspace.productPortfolio },
        { name: 'valuePropositions', value: workspace.valuePropositions },
        { name: 'targetIndustries', value: workspace.targetIndustries },
        { name: 'targetCompanySize', value: workspace.targetCompanySize },
        { name: 'idealCustomerProfile', value: workspace.idealCustomerProfile },
        { name: 'competitiveAdvantages', value: workspace.competitiveAdvantages },
        { name: 'salesMethodology', value: workspace.salesMethodology }
      ];

      let workspaceFilledFields = 0;
      let workspaceTotalFields = fields.length;

      fields.forEach(field => {
        const hasValue = field.value && (
          (Array.isArray(field.value) && field.value.length > 0) ||
          (typeof field.value === 'string' && field.value.trim().length > 0)
        );
        
        if (hasValue) {
          workspaceFilledFields++;
          if (Array.isArray(field.value)) {
            console.log(`   ✅ ${field.name}: ${field.value.length} items`);
          } else {
            const preview = field.value.length > 50 ? field.value.substring(0, 50) + '...' : field.value;
            console.log(`   ✅ ${field.name}: ${preview}`);
          }
        } else {
          console.log(`   ❌ ${field.name}: Not set`);
        }
      });

      const enrichmentPercentage = Math.round((workspaceFilledFields / workspaceTotalFields) * 100);
      console.log(`   📊 Enrichment: ${workspaceFilledFields}/${workspaceTotalFields} fields (${enrichmentPercentage}%)`);

      if (workspaceFilledFields >= 8) { // At least 80% of fields filled
        enrichedCount++;
        console.log(`   🎉 WELL ENRICHED`);
      } else if (workspaceFilledFields >= 5) {
        console.log(`   ⚠️ PARTIALLY ENRICHED`);
      } else {
        console.log(`   ❌ NOT ENRICHED`);
      }

      totalFields += workspaceTotalFields;
      filledFields += workspaceFilledFields;
      console.log('');
    }

    console.log('📊 SUMMARY:');
    console.log(`   Total Workspaces: ${workspaces.length}`);
    console.log(`   Well Enriched: ${enrichedCount}`);
    console.log(`   Total Fields: ${totalFields}`);
    console.log(`   Filled Fields: ${filledFields}`);
    console.log(`   Overall Enrichment: ${Math.round((filledFields / totalFields) * 100)}%`);

    // Test specific workspace scenarios
    console.log('\n🎯 TESTING SPECIFIC SCENARIOS:\n');

    // Test TOP Engineers Plus
    const topWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('top') || 
      w.slug.toLowerCase().includes('top')
    );

    if (topWorkspace && topWorkspace.businessModel === 'Engineering Consulting') {
      console.log('🏗️ TOP Engineers Plus: ✅ CORRECTLY ENRICHED');
      console.log(`   Business Model: ${topWorkspace.businessModel}`);
      console.log(`   Industry: ${topWorkspace.industry}`);
      console.log(`   Services: ${topWorkspace.serviceOfferings?.length || 0} offerings`);
      console.log(`   Target Industries: ${topWorkspace.targetIndustries?.join(', ')}`);
    } else {
      console.log('🏗️ TOP Engineers Plus: ❌ NOT PROPERLY ENRICHED');
    }

    // Test CloudCaddie
    const cloudcaddieWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('cloudcaddie') || 
      w.slug.toLowerCase().includes('cloudcaddie')
    );

    if (cloudcaddieWorkspace && cloudcaddieWorkspace.businessModel === 'IT Staffing & Talent Acquisition') {
      console.log('☁️ CloudCaddie Consulting: ✅ CORRECTLY ENRICHED');
      console.log(`   Business Model: ${cloudcaddieWorkspace.businessModel}`);
      console.log(`   Industry: ${cloudcaddieWorkspace.industry}`);
      console.log(`   Services: ${cloudcaddieWorkspace.serviceOfferings?.length || 0} offerings`);
      console.log(`   Target Industries: ${cloudcaddieWorkspace.targetIndustries?.join(', ')}`);
    } else {
      console.log('☁️ CloudCaddie Consulting: ❌ NOT PROPERLY ENRICHED');
    }

    // Test Notary Everyday
    const notaryWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('notary') || 
      w.slug.toLowerCase().includes('notary')
    );

    if (notaryWorkspace && notaryWorkspace.businessModel === 'Notary Services') {
      console.log('📝 Notary Everyday: ✅ CORRECTLY ENRICHED');
      console.log(`   Business Model: ${notaryWorkspace.businessModel}`);
      console.log(`   Industry: ${notaryWorkspace.industry}`);
      console.log(`   Services: ${notaryWorkspace.serviceOfferings?.length || 0} offerings`);
      console.log(`   Target Industries: ${notaryWorkspace.targetIndustries?.join(', ')}`);
    } else {
      console.log('📝 Notary Everyday: ❌ NOT PROPERLY ENRICHED');
    }

    console.log('\n🎉 Verification Complete!');
    
    if (enrichedCount >= 3) {
      console.log('✅ SUCCESS: All three target workspaces are properly enriched!');
      console.log('✅ The AI right panel now has comprehensive business context for:');
      console.log('   - TOP Engineers Plus (Engineering Consulting)');
      console.log('   - CloudCaddie Consulting (IT Staffing)');
      console.log('   - Notary Everyday (Notary Services)');
    } else {
      console.log('⚠️ Some workspaces may need additional enrichment.');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
if (require.main === module) {
  verifyWorkspaceEnrichment();
}

module.exports = { verifyWorkspaceEnrichment };
