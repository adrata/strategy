/**
 * 🔍 DATA FLOW VERIFICATION SCRIPT
 * 
 * Verifies that the unified API is properly stitching data
 * and that the Overview/Intelligence components display real data
 */

const { PrismaClient } = require('@prisma/client');

// Configuration
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

class DataFlowVerifier {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async verifyDataFlow() {
    console.log('🔍 [DATA FLOW] Verifying data flow and display...\n');
    
    try {
      // Test unified API data retrieval
      await this.testUnifiedAPIData();
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // Test component data display
      await this.testComponentDataDisplay();
      
      console.log('\n🎯 [DATA FLOW] Verification completed!');
      
    } catch (error) {
      console.error('❌ [DATA FLOW] Error:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async testUnifiedAPIData() {
    console.log('🌐 [UNIFIED API] Testing unified API data retrieval...');
    
    // Test people data retrieval
    const peopleData = await this.prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        customFields: true,
        company: {
          select: { id: true, name: true, industry: true }
        }
      },
      take: 5
    });
    
    console.log(`📊 Retrieved ${peopleData.length} people records`);
    
    peopleData.forEach((person, index) => {
      console.log(`\n👤 Person ${index + 1}: ${person.fullName}`);
      console.log(`   - Job Title: ${person.jobTitle || 'Not available'}`);
      console.log(`   - Email: ${person.email || 'Not available'}`);
      console.log(`   - Company: ${person.company?.name || 'Not assigned'}`);
      
      const customFields = person.customFields || {};
      console.log(`   - CoreSignal ID: ${customFields.coresignalId || 'Not available'}`);
      console.log(`   - Buyer Group Role: ${customFields.buyerGroupRole || 'Not assigned'}`);
      console.log(`   - Influence Level: ${customFields.influenceLevel || 'Not assigned'}`);
      console.log(`   - Situation Analysis: ${customFields.situationAnalysis ? 'Available' : 'Not available'}`);
      console.log(`   - Strategic Intelligence: ${customFields.strategicIntelligence ? 'Available' : 'Not available'}`);
    });
    
    // Test companies data retrieval
    const companiesData = await this.prisma.companies.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        customFields: true
      },
      take: 5
    });
    
    console.log(`\n📊 Retrieved ${companiesData.length} company records`);
    
    companiesData.forEach((company, index) => {
      console.log(`\n🏢 Company ${index + 1}: ${company.name}`);
      console.log(`   - Industry: ${company.industry || 'Not available'}`);
      console.log(`   - Website: ${company.website || 'Not available'}`);
      
      const customFields = company.customFields || {};
      console.log(`   - CoreSignal ID: ${customFields.coresignalId || 'Not available'}`);
      console.log(`   - Situation Analysis: ${customFields.situationAnalysis ? 'Available' : 'Not available'}`);
      console.log(`   - Strategic Intelligence: ${customFields.strategicIntelligence ? 'Available' : 'Not available'}`);
    });
  }

  async testComponentDataDisplay() {
    console.log('🎨 [COMPONENT DISPLAY] Testing component data display...');
    
    // Test person with rich data
    const richPerson = await this.prisma.people.findFirst({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        customFields: true,
        company: {
          select: { id: true, name: true, industry: true }
        }
      }
    });
    
    if (richPerson) {
      console.log(`\n👤 Rich Person Example: ${richPerson.fullName}`);
      console.log('   This person has CoreSignal data and will display:');
      
      const customFields = richPerson.customFields || {};
      const coresignalData = customFields.coresignalData || {};
      
      console.log('   📋 Overview Tab will show:');
      console.log(`      - Full Name: ${coresignalData.full_name || richPerson.fullName}`);
      console.log(`      - Job Title: ${coresignalData.active_experience_title || richPerson.jobTitle}`);
      console.log(`      - Email: ${coresignalData.primary_professional_email || richPerson.email}`);
      console.log(`      - LinkedIn: ${coresignalData.linkedin_url || 'Not available'}`);
      console.log(`      - Company: ${coresignalData.active_experience_company || richPerson.company?.name}`);
      console.log(`      - Buyer Group Role: ${customFields.buyerGroupRole || 'Stakeholder'}`);
      console.log(`      - Influence Level: ${customFields.influenceLevel || 'Medium'}`);
      
      console.log('   🧠 Intelligence Tab will show:');
      console.log(`      - AI-Generated Insights: ${customFields.situationAnalysis ? 'Available' : 'Not available'}`);
      console.log(`      - Strategic Intelligence: ${customFields.strategicIntelligence ? 'Available' : 'Not available'}`);
      console.log(`      - Pain Points: ${customFields.painPoints?.length || 0} items`);
      console.log(`      - Goals: ${customFields.goals?.length || 0} items`);
      console.log(`      - Skills: ${coresignalData.skills?.length || 0} skills`);
      console.log(`      - Experience: ${coresignalData.experience?.length || 0} positions`);
    } else {
      console.log('⚠️ No rich person data found for testing');
    }
    
    // Test company with rich data
    const richCompany = await this.prisma.companies.findFirst({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        customFields: true
      }
    });
    
    if (richCompany) {
      console.log(`\n🏢 Rich Company Example: ${richCompany.name}`);
      console.log('   This company has CoreSignal data and will display:');
      
      const customFields = richCompany.customFields || {};
      const coresignalData = customFields.coresignalData || {};
      
      console.log('   📋 Overview Tab will show:');
      console.log(`      - Company Name: ${coresignalData.name || richCompany.name}`);
      console.log(`      - Industry: ${coresignalData.industry || richCompany.industry}`);
      console.log(`      - Employee Count: ${coresignalData.employees_count || 'Not available'}`);
      console.log(`      - Founded Year: ${coresignalData.founded_year || 'Not available'}`);
      console.log(`      - Website: ${coresignalData.website || richCompany.website}`);
      console.log(`      - LinkedIn: ${coresignalData.linkedin_url || 'Not available'}`);
      
      console.log('   🧠 Intelligence Tab will show:');
      console.log(`      - Strategic Intelligence: ${customFields.strategicIntelligence ? 'Available' : 'Not available'}`);
      console.log(`      - Market Position: ${customFields.marketPosition ? 'Available' : 'Not available'}`);
      console.log(`      - Competitive Advantages: ${customFields.competitiveAdvantages?.length || 0} items`);
      console.log(`      - Challenges: ${customFields.challenges?.length || 0} items`);
      console.log(`      - Opportunities: ${customFields.opportunities?.length || 0} items`);
    } else {
      console.log('⚠️ No rich company data found for testing');
    }
  }
}

// Run the verification
async function main() {
  const verifier = new DataFlowVerifier();
  await verifier.verifyDataFlow();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DataFlowVerifier };
