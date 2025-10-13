/**
 * 🧪 AI CONTEXT TESTING SCRIPT
 * 
 * Tests the AI context engineering with all three workspaces to verify
 * that the AI understands the business context and provides relevant advice
 */

const { PrismaClient } = require('@prisma/client');
const { AIContextService } = require('../src/platform/ai/services/AIContextService');
const { EnhancedWorkspaceContextService } = require('../src/platform/ai/services/EnhancedWorkspaceContextService');

const prisma = new PrismaClient();

async function testAIContext() {
  try {
    console.log('🧪 Starting AI Context Testing...\n');

    // Get all workspaces
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
        idealCustomerProfile: true
      }
    });

    console.log(`Found ${workspaces.length} workspaces to test:\n`);

    for (const workspace of workspaces) {
      console.log(`🏢 Testing workspace: ${workspace.name}`);
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Business Model: ${workspace.businessModel || 'Not set'}`);
      console.log(`   Industry: ${workspace.industry || 'Not set'}`);
      console.log(`   Services: ${workspace.serviceOfferings?.length || 0} offerings`);
      console.log(`   Products: ${workspace.productPortfolio?.length || 0} products`);
      console.log(`   Value Props: ${workspace.valuePropositions?.length || 0} propositions`);
      console.log(`   Target Industries: ${workspace.targetIndustries?.length || 0} industries`);
      console.log(`   ICP: ${workspace.idealCustomerProfile ? 'Set' : 'Not set'}`);

      // Test workspace context building
      try {
        const workspaceContext = await EnhancedWorkspaceContextService.buildWorkspaceContext(workspace.id);
        
        if (workspaceContext) {
          console.log(`   ✅ Workspace context built successfully`);
          console.log(`   📊 Company: ${workspaceContext.company.name}`);
          console.log(`   🎯 Business Model: ${workspaceContext.workspace.businessModel || 'Not set'}`);
          console.log(`   🏭 Industry: ${workspaceContext.workspace.industry || 'Not set'}`);
          console.log(`   📦 Services: ${workspaceContext.workspace.serviceOfferings?.length || 0} offerings`);
          console.log(`   💡 Value Props: ${workspaceContext.workspace.valuePropositions?.length || 0} propositions`);
          
          // Test AI context string generation
          const aiContextString = EnhancedWorkspaceContextService.buildAIContextString(workspaceContext);
          console.log(`   ✅ AI context string generated (${aiContextString.length} characters)`);
          
          // Show a preview of the context
          const preview = aiContextString.substring(0, 200) + '...';
          console.log(`   📝 Context Preview: ${preview}`);
        } else {
          console.log(`   ❌ Failed to build workspace context`);
        }
      } catch (error) {
        console.log(`   ❌ Error building workspace context: ${error.message}`);
      }

      // Test with a sample record
      try {
        const samplePerson = await prisma.people.findFirst({
          where: { workspaceId: workspace.id },
          include: { company: true }
        });

        if (samplePerson) {
          console.log(`   👤 Testing with sample person: ${samplePerson.fullName} at ${samplePerson.company?.name || 'Unknown Company'}`);
          
          // Build AI context with sample record
          const aiContext = await AIContextService.buildContext({
            userId: 'test-user',
            workspaceId: workspace.id,
            appType: 'Pipeline',
            currentRecord: samplePerson,
            recordType: 'people'
          });

          const combinedContext = AIContextService.combineContext(aiContext);
          console.log(`   ✅ AI context built with sample record (${combinedContext.length} characters)`);
          
          // Show preview of combined context
          const contextPreview = combinedContext.substring(0, 300) + '...';
          console.log(`   📝 Combined Context Preview: ${contextPreview}`);
        } else {
          console.log(`   👤 No sample person found for testing`);
        }
      } catch (error) {
        console.log(`   ❌ Error testing with sample record: ${error.message}`);
      }

      console.log(''); // Empty line for readability
    }

    // Test specific workspace scenarios
    console.log('🎯 Testing Specific Scenarios:\n');

    // Test TOP Engineers Plus scenario
    const topWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('top') || 
      w.slug.toLowerCase().includes('top')
    );

    if (topWorkspace) {
      console.log(`🏗️ TOP Engineers Plus Scenario:`);
      console.log(`   Testing with utility company record...`);
      
      // Create a mock utility company record
      const mockUtilityCompany = {
        name: 'Austin Energy',
        industry: 'Electric Utilities',
        employeeCount: 1500,
        description: 'Municipal electric utility serving Austin, Texas',
        businessChallenges: ['Infrastructure modernization', 'Grid reliability', 'Renewable energy integration'],
        businessPriorities: ['Operational excellence', 'Cost reduction', 'Sustainability'],
        techStack: ['SCADA', 'GIS', 'AMI'],
        city: 'Austin',
        state: 'Texas',
        country: 'USA'
      };

      const aiContext = await AIContextService.buildContext({
        userId: 'test-user',
        workspaceId: topWorkspace.id,
        appType: 'Pipeline',
        currentRecord: mockUtilityCompany,
        recordType: 'companies'
      });

      const combinedContext = AIContextService.combineContext(aiContext);
      console.log(`   ✅ Context built for utility company scenario`);
      
      // Check if context includes TOP Engineers Plus specific information
      if (combinedContext.includes('TOP Engineers') || combinedContext.includes('Communications Engineering')) {
        console.log(`   ✅ Context includes TOP Engineers Plus business information`);
      } else {
        console.log(`   ⚠️ Context may not include TOP Engineers Plus business information`);
      }
    }

    // Test CloudCaddie scenario
    const cloudcaddieWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('cloudcaddie') || 
      w.slug.toLowerCase().includes('cloudcaddie')
    );

    if (cloudcaddieWorkspace) {
      console.log(`☁️ CloudCaddie Consulting Scenario:`);
      console.log(`   Testing with tech company record...`);
      
      // Create a mock tech company record
      const mockTechCompany = {
        name: 'TechStart Inc',
        industry: 'Software Development',
        employeeCount: 50,
        description: 'SaaS startup building productivity tools',
        businessChallenges: ['Scaling engineering team', 'Finding senior developers', 'Technical debt'],
        businessPriorities: ['Team growth', 'Product development', 'Market expansion'],
        techStack: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
        city: 'San Francisco',
        state: 'California',
        country: 'USA'
      };

      const aiContext = await AIContextService.buildContext({
        userId: 'test-user',
        workspaceId: cloudcaddieWorkspace.id,
        appType: 'Pipeline',
        currentRecord: mockTechCompany,
        recordType: 'companies'
      });

      const combinedContext = AIContextService.combineContext(aiContext);
      console.log(`   ✅ Context built for tech company scenario`);
      
      // Check if context includes CloudCaddie specific information
      if (combinedContext.includes('CloudCaddie') || combinedContext.includes('IT Staffing')) {
        console.log(`   ✅ Context includes CloudCaddie business information`);
      } else {
        console.log(`   ⚠️ Context may not include CloudCaddie business information`);
      }
    }

    // Test Notary Everyday scenario
    const notaryWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('notary') || 
      w.slug.toLowerCase().includes('notary')
    );

    if (notaryWorkspace) {
      console.log(`📝 Notary Everyday Scenario:`);
      console.log(`   Testing with individual record...`);
      
      // Create a mock individual record
      const mockIndividual = {
        fullName: 'John Smith',
        title: 'Real Estate Agent',
        company: 'Smith Realty',
        email: 'john@smithrealty.com',
        phone: '(555) 123-4567',
        city: 'Dallas',
        state: 'Texas',
        country: 'USA'
      };

      const aiContext = await AIContextService.buildContext({
        userId: 'test-user',
        workspaceId: notaryWorkspace.id,
        appType: 'Pipeline',
        currentRecord: mockIndividual,
        recordType: 'people'
      });

      const combinedContext = AIContextService.combineContext(aiContext);
      console.log(`   ✅ Context built for individual scenario`);
      
      // Check if context includes Notary Everyday specific information
      if (combinedContext.includes('Notary') || combinedContext.includes('Notary Services')) {
        console.log(`   ✅ Context includes Notary Everyday business information`);
      } else {
        console.log(`   ⚠️ Context may not include Notary Everyday business information`);
      }
    }

    console.log('\n🎉 AI Context Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('- Schema fields added to workspaces table');
    console.log('- Enrichment scripts created for all three businesses');
    console.log('- EnhancedWorkspaceContextService updated to load dynamic data');
    console.log('- AIContextService enhanced with structured record analysis');
    console.log('- AI prompt engineering improved with seller/buyer framing');
    console.log('\n✅ The AI should now have deep understanding of:');
    console.log('  1. WHO IT IS (the user\'s business)');
    console.log('  2. WHO THEY\'RE TALKING TO (the current record)');
    console.log('  3. STRATEGIC FIT (how the record relates to the business)');
    console.log('  4. RELEVANT ADVICE (specific to the user\'s products/services)');

  } catch (error) {
    console.error('❌ Error during AI context testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testAIContext();
}

module.exports = { testAIContext };
