/**
 * Generate Demo Intelligence Data (Existing Fields Only)
 * 
 * This script generates intelligence data for the demo environment
 * using only existing database fields.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateDemoIntelligence() {
  try {
    console.log('🚀 Starting demo intelligence generation...');
    
    // Get the demo workspace
    const demoWorkspace = await prisma.workspaces.findFirst({
      where: { id: 'demo-workspace-2025' }
    });
    
    if (!demoWorkspace) {
      console.error('❌ Demo workspace not found');
      return;
    }
    
    console.log('✅ Found demo workspace:', demoWorkspace.name);
    
    // Get all companies in the demo workspace
    const companies = await prisma.companies.findMany({
      where: { workspaceId: 'demo-workspace-2025' }
    });
    
    console.log(`📊 Found ${companies.length} companies in demo workspace`);
    
    // Process each company
    for (const company of companies) {
      console.log(`\n🏢 Processing company: ${company.name}`);
      
      // Update company with intelligence data using existing fields
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          // Use existing fields to store intelligence data
          description: `${company.name} is a leading company in their industry with strong growth potential and innovative solutions.`,
          tags: [...(company.tags || []), 'demo-intelligence', 'high-potential'],
          customFields: {
            ...company.customFields,
            companyStage: 'growth',
            industry: 'technology',
            companySize: 'medium',
            companyWants: ['Digital Transformation', 'Market Expansion', 'Operational Excellence'],
            companyNeeds: ['Scalable Solutions', 'Cost Optimization', 'Team Efficiency'],
            companyChallenges: ['Legacy Systems', 'Market Competition', 'Talent Acquisition'],
            companyPriorities: ['Innovation', 'Growth', 'Customer Success'],
            intelligenceScore: 85,
            lastIntelligenceUpdate: new Date().toISOString()
          }
        }
      });
      
      // Get people for this company
      const people = await prisma.people.findMany({
        where: { 
          workspaceId: 'demo-workspace-2025',
          companyId: company.id
        }
      });
      
      console.log(`👥 Found ${people.length} people for ${company.name}`);
      
      // Update each person with intelligence data using existing fields
      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        
        console.log(`  👤 Updating ${person.fullName}`);
        
        // Update person with comprehensive intelligence using existing fields
        await prisma.people.update({
          where: { id: person.id },
          data: {
            // Use existing fields to store intelligence data
            description: `${person.fullName} is a key decision maker at ${company.name} with significant influence over technology and business decisions.`,
            tags: [...(person.tags || []), 'demo-intelligence', 'decision-maker', 'high-influence'],
            customFields: {
              ...person.customFields,
              // Basic intelligence
              wants: ['Modern Solutions', 'Cost Efficiency', 'Team Productivity', 'Innovation', 'Competitive Advantage'],
              needs: ['Reliable Technology', 'Scalable Systems', 'Security', 'Integration', 'Support'],
              painPoints: ['Legacy Systems', 'Manual Processes', 'Integration Challenges', 'Cost Overruns', 'Team Coordination'],
              personalGoals: ['Career Growth', 'Team Success', 'Innovation Leadership', 'Operational Excellence'],
              professionalGoals: ['Digital Transformation', 'Market Leadership', 'Team Excellence', 'Cost Optimization'],
              
              // Role-based intelligence
              rolePriorities: {
                role: ['Innovation', 'Efficiency', 'Security', 'Growth', 'Team Development'],
                industry: ['Technology Trends', 'Market Opportunities', 'Competitive Advantage'],
                company: ['Digital Transformation', 'Market Expansion', 'Operational Excellence']
              },
              decisionFactors: ['ROI', 'Technical Merit', 'Vendor Reputation', 'Implementation Ease', 'Long-term Value'],
              budgetAuthority: '$100K-$1M',
              influenceLevel: 'High',
              decisionTimeline: '3-6 months',
              
              // Psychographic profile
              communicationStyle: 'Professional',
              decisionMakingStyle: 'Data-Driven',
              riskTolerance: 'Medium',
              innovationAdoption: 'Early',
              leadershipStyle: 'Collaborative',
              
              // Behavioral intelligence
              engagementLevel: 'high',
              preferredChannels: ['Email', 'LinkedIn', 'Industry Events'],
              contentPreferences: ['Industry Reports', 'Case Studies', 'Technical Whitepapers'],
              keyInfluencers: ['Industry Peers', 'Thought Leaders', 'Vendor Partners'],
              currentSolutions: ['Legacy Systems', 'Manual Processes', 'Basic Tools'],
              evaluationCriteria: ['ROI', 'Technical Merit', 'Vendor Reputation', 'Implementation Ease'],
              
              // Financial & business intelligence
              budgetRange: '$100K-$1M',
              urgencyLevel: 'Medium',
              businessImpact: 'Operational Efficiency and Growth',
              
              // Report data
              deepValueReports: {
                person: person.fullName,
                role: person.title || 'Decision Maker',
                company: company.name,
                industry: 'technology',
                wants: ['Modern Solutions', 'Cost Efficiency', 'Team Productivity'],
                needs: ['Reliable Technology', 'Scalable Systems', 'Security'],
                painPoints: ['Legacy Systems', 'Manual Processes', 'Integration Challenges'],
                goals: ['Digital Transformation', 'Market Leadership', 'Team Excellence'],
                decisionFactors: ['ROI', 'Technical Merit', 'Vendor Reputation'],
                budgetAuthority: '$100K-$1M',
                timeline: '3-6 months',
                recommendations: ['Focus on ROI', 'Emphasize Security', 'Highlight Integration']
              },
              miniBriefs: {
                summary: `${person.fullName} is a key decision maker at ${company.name}`,
                keyInsights: ['Modern Solutions', 'Cost Efficiency'],
                painPoints: ['Legacy Systems', 'Manual Processes'],
                recommendations: ['Focus on ROI', 'Emphasize Security']
              },
              
              // Intelligence metadata
              intelligenceScore: 85,
              lastIntelligenceUpdate: new Date().toISOString(),
              dataSources: ['CoreSignal', 'Web Research', 'Role Triangulation', 'Industry Analysis'],
              confidenceLevel: 80
            }
          }
        });
      }
    }
    
    console.log('\n🎉 Demo intelligence generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Updated companies with intelligence data in customFields');
    console.log('✅ Updated people with comprehensive intelligence profiles in customFields');
    console.log('✅ Generated Deep Value Reports and Mini Briefs for all records');
    console.log('✅ All data stored in existing database fields');
    
  } catch (error) {
    console.error('❌ Error generating demo intelligence:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateDemoIntelligence();
