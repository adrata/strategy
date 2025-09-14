/**
 * Generate Demo Intelligence Data (Simple Version)
 * 
 * This script generates intelligence data for the demo environment
 * without requiring database schema changes.
 * 
 * It populates the existing fields with comprehensive intelligence data
 * for the real companies and people we have.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Demo intelligence data for the real companies and people
const demoIntelligenceData = {
  // Match Group (Lead stage - 10 people)
  'Match Group': {
    companyStage: 'mature',
    industry: 'technology',
    companySize: 'large',
    people: [
      {
        name: 'Joey Rapadas',
        role: 'CTO',
        tenure: 3,
        education: 'Computer Science',
        intelligence: {
          wants: ['Modern Tech Stack', 'Scalable Architecture', 'AI/ML Capabilities', 'Security Excellence', 'Team Productivity'],
          needs: ['Cloud Migration', 'Security Compliance', 'Performance Optimization', 'Developer Experience', 'Cost Control'],
          painPoints: ['Legacy System Integration', 'Security Vulnerabilities', 'Technical Debt', 'Talent Shortage', 'Budget Constraints'],
          personalGoals: ['Technical Leadership', 'Innovation', 'Team Growth', 'Security Excellence', 'Operational Efficiency'],
          professionalGoals: ['Digital Transformation', 'Security Excellence', 'Innovation Leadership', 'Operational Efficiency', 'Team Growth'],
          rolePriorities: {
            role: ['Security', 'Scalability', 'Innovation', 'Cost Optimization', 'Team Productivity'],
            industry: ['AI/ML Adoption', 'Cloud Migration', 'Remote Work', 'Cybersecurity'],
            company: ['Digital Transformation', 'Innovation', 'Cost Optimization', 'Team Building']
          },
          decisionFactors: ['Technical Merit', 'Security Posture', 'Scalability', 'Vendor Reputation', 'Implementation Complexity'],
          budgetAuthority: '$500K-$5M',
          influenceLevel: 'High',
          decisionTimeline: '3-6 months',
          communicationStyle: 'Technical',
          decisionMakingStyle: 'Data-Driven',
          riskTolerance: 'Medium',
          innovationAdoption: 'Early',
          leadershipStyle: 'Collaborative',
          engagementLevel: 'high',
          preferredChannels: ['Email', 'LinkedIn', 'Technical Forums', 'GitHub'],
          contentPreferences: ['Technical Whitepapers', 'Security Reports', 'Innovation Trends', 'Industry News', 'Case Studies'],
          keyInfluencers: ['Industry Peers', 'Thought Leaders', 'Security Experts', 'Technology Leaders', 'Vendor Partners'],
          currentSolutions: ['Legacy Systems', 'Manual Processes', 'Cloud Platforms', 'Development Tools', 'Security Solutions'],
          evaluationCriteria: ['Technical Merit', 'Security Posture', 'Scalability', 'Vendor Reputation', 'Implementation Complexity'],
          budgetRange: '$500K-$5M',
          urgencyLevel: 'High',
          businessImpact: 'Operational Efficiency and Security',
          intelligenceScore: 95,
          confidenceLevel: 90
        }
      },
      {
        name: 'Jovy Olasiman',
        role: 'VP Engineering',
        tenure: 2,
        education: 'Software Engineering',
        intelligence: {
          wants: ['Code Quality', 'Team Productivity', 'Delivery Speed', 'Technical Excellence', 'Innovation'],
          needs: ['Development Tools', 'Quality Assurance', 'Team Collaboration', 'Performance Monitoring', 'Technical Training'],
          painPoints: ['Technical Debt', 'Delivery Delays', 'Code Quality', 'Team Coordination', 'Resource Constraints'],
          personalGoals: ['Technical Excellence', 'Team Growth', 'Delivery Excellence', 'Innovation', 'Process Optimization'],
          professionalGoals: ['Technical Excellence', 'Team Growth', 'Delivery Excellence', 'Innovation', 'Process Optimization'],
          rolePriorities: {
            role: ['Code Quality', 'Team Productivity', 'Delivery Speed', 'Technical Excellence', 'Innovation'],
            industry: ['AI/ML Adoption', 'Cloud Migration', 'Remote Work', 'Cybersecurity'],
            company: ['Digital Transformation', 'Innovation', 'Cost Optimization', 'Team Building']
          },
          decisionFactors: ['Technical Merit', 'Team Impact', 'Implementation Speed', 'Learning Curve', 'Long-term Value'],
          budgetAuthority: '$10K-$200K',
          influenceLevel: 'Medium',
          decisionTimeline: '2-3 months',
          communicationStyle: 'Technical',
          decisionMakingStyle: 'Collaborative',
          riskTolerance: 'Medium',
          innovationAdoption: 'Early',
          leadershipStyle: 'Mentoring',
          engagementLevel: 'high',
          preferredChannels: ['Email', 'LinkedIn', 'Technical Forums', 'GitHub'],
          contentPreferences: ['Technical Whitepapers', 'Security Reports', 'Innovation Trends', 'Industry News', 'Case Studies'],
          keyInfluencers: ['Industry Peers', 'Thought Leaders', 'Security Experts', 'Technology Leaders', 'Vendor Partners'],
          currentSolutions: ['Legacy Systems', 'Manual Processes', 'Cloud Platforms', 'Development Tools', 'Security Solutions'],
          evaluationCriteria: ['Technical Merit', 'Team Impact', 'Implementation Speed', 'Learning Curve', 'Long-term Value'],
          budgetRange: '$10K-$200K',
          urgencyLevel: 'Medium',
          businessImpact: 'Team Productivity and Code Quality',
          intelligenceScore: 85,
          confidenceLevel: 85
        }
      }
    ]
  },
  
  // Brex (Prospect stage - 8 people)
  'Brex': {
    companyStage: 'growth',
    industry: 'fintech',
    companySize: 'medium',
    people: [
      {
        name: 'Levana Fernadi',
        role: 'CMO',
        tenure: 4,
        education: 'MBA',
        intelligence: {
          wants: ['Predictable Growth', 'Better Attribution', 'Automated Campaigns', 'Customer Insights', 'Brand Recognition'],
          needs: ['Lead Generation', 'Marketing Analytics', 'Campaign Automation', 'Customer Data', 'Team Alignment'],
          painPoints: ['Lead Quality', 'Attribution', 'Budget Efficiency', 'Team Coordination', 'Competitive Pressure'],
          personalGoals: ['Revenue Growth', 'Market Leadership', 'Customer Acquisition', 'Brand Building', 'Team Excellence'],
          professionalGoals: ['Revenue Growth', 'Market Leadership', 'Customer Acquisition', 'Brand Building', 'Team Excellence'],
          rolePriorities: {
            role: ['Growth', 'Brand Awareness', 'Customer Acquisition', 'Marketing ROI', 'Digital Transformation'],
            industry: ['Fintech Innovation', 'Digital Banking', 'AI/ML', 'Customer Experience'],
            company: ['Scale', 'Market Expansion', 'Process Optimization', 'Team Building']
          },
          decisionFactors: ['ROI Potential', 'Ease of Use', 'Integration Capability', 'Vendor Support', 'Scalability'],
          budgetAuthority: '$100K-$2M',
          influenceLevel: 'High',
          decisionTimeline: '1-3 months',
          communicationStyle: 'Results-Focused',
          decisionMakingStyle: 'ROI-Driven',
          riskTolerance: 'High',
          innovationAdoption: 'Early',
          leadershipStyle: 'Results-Oriented',
          engagementLevel: 'high',
          preferredChannels: ['Email', 'LinkedIn', 'Social Media', 'Industry Events'],
          contentPreferences: ['Marketing Analytics', 'Growth Strategies', 'Customer Insights', 'Industry News', 'Case Studies'],
          keyInfluencers: ['Industry Peers', 'Thought Leaders', 'Marketing Gurus', 'Sales Leaders', 'Customer Success'],
          currentSolutions: ['Legacy Systems', 'Manual Processes', 'Marketing Automation', 'Analytics Tools', 'CRM Systems'],
          evaluationCriteria: ['ROI Potential', 'Ease of Use', 'Integration Capability', 'Vendor Support', 'Scalability'],
          budgetRange: '$100K-$2M',
          urgencyLevel: 'High',
          businessImpact: 'Revenue Growth and Customer Acquisition',
          intelligenceScore: 90,
          confidenceLevel: 88
        }
      }
    ]
  },
  
  // First Premier Bank (Opportunity stage - 1 opportunity)
  'First Premier Bank': {
    companyStage: 'enterprise',
    industry: 'financial services',
    companySize: 'large',
    people: [
      {
        name: 'CFO Representative',
        role: 'CFO',
        tenure: 5,
        education: 'Finance',
        intelligence: {
          wants: ['Cost Savings', 'Financial Visibility', 'Automated Reporting', 'Risk Mitigation', 'Profit Growth'],
          needs: ['Financial Control', 'Compliance Tools', 'Reporting Automation', 'Cost Management', 'Risk Assessment'],
          painPoints: ['Budget Overruns', 'Financial Reporting', 'Compliance Issues', 'Cash Flow', 'Cost Visibility'],
          personalGoals: ['Cost Optimization', 'Financial Excellence', 'Compliance', 'Profitability', 'Strategic Planning'],
          professionalGoals: ['Cost Optimization', 'Financial Excellence', 'Compliance', 'Profitability', 'Strategic Planning'],
          rolePriorities: {
            role: ['Cost Control', 'Financial Planning', 'Compliance', 'Risk Management', 'Profitability'],
            industry: ['Fintech Integration', 'AI/ML', 'Blockchain', 'Digital Banking'],
            company: ['Digital Transformation', 'Compliance', 'Global Expansion', 'Innovation']
          },
          decisionFactors: ['Cost-Benefit Analysis', 'ROI', 'Compliance', 'Risk Assessment', 'Vendor Stability'],
          budgetAuthority: '$50K-$1M',
          influenceLevel: 'High',
          decisionTimeline: '2-4 months',
          communicationStyle: 'Analytical',
          decisionMakingStyle: 'Risk-Averse',
          riskTolerance: 'Low',
          innovationAdoption: 'Late',
          leadershipStyle: 'Conservative',
          engagementLevel: 'medium',
          preferredChannels: ['Email', 'LinkedIn', 'Industry Reports', 'Webinars'],
          contentPreferences: ['Financial Reports', 'ROI Analysis', 'Compliance Updates', 'Industry News', 'Case Studies'],
          keyInfluencers: ['Industry Peers', 'Thought Leaders', 'Financial Experts', 'Compliance Officers', 'Auditors'],
          currentSolutions: ['Legacy Systems', 'Manual Processes', 'Financial Software', 'Compliance Tools', 'Reporting Systems'],
          evaluationCriteria: ['Cost-Benefit Analysis', 'ROI', 'Compliance', 'Risk Assessment', 'Vendor Stability'],
          budgetRange: '$50K-$1M',
          urgencyLevel: 'Medium',
          businessImpact: 'Cost Control and Financial Performance',
          intelligenceScore: 88,
          confidenceLevel: 92
        }
      }
    ]
  }
};

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
      
      const companyData = demoIntelligenceData[company.name];
      if (!companyData) {
        console.log(`⚠️ No intelligence data found for ${company.name}`);
        continue;
      }
      
      // Update company with basic intelligence data (using existing fields)
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          // Use existing fields to store intelligence data
          description: `${company.name} is a ${companyData.companySize} ${companyData.industry} company in ${companyData.companyStage} stage. Key priorities: ${companyData.people[0].intelligence.rolePriorities.company.join(', ')}`,
          tags: [...(company.tags || []), companyData.industry, companyData.companyStage, 'demo-intelligence'],
          customFields: {
            ...company.customFields,
            companyStage: companyData.companyStage,
            industry: companyData.industry,
            companySize: companyData.companySize,
            companyWants: companyData.people[0].intelligence.wants.slice(0, 3),
            companyNeeds: companyData.people[0].intelligence.needs.slice(0, 3),
            companyChallenges: companyData.people[0].intelligence.painPoints.slice(0, 3),
            companyPriorities: companyData.people[0].intelligence.rolePriorities.company,
            intelligenceScore: companyData.people[0].intelligence.intelligenceScore,
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
      
      // Update each person with intelligence data (using existing fields)
      for (let i = 0; i < people.length && i < companyData.people.length; i++) {
        const person = people[i];
        const personData = companyData.people[i];
        
        console.log(`  👤 Updating ${person.fullName} (${personData.role})`);
        
        // Update person with comprehensive intelligence (using existing fields)
        await prisma.people.update({
          where: { id: person.id },
          data: {
            // Use existing fields to store intelligence data
            description: `${person.fullName} is a ${personData.role} at ${company.name}. Key wants: ${personData.intelligence.wants.slice(0, 3).join(', ')}. Key needs: ${personData.intelligence.needs.slice(0, 3).join(', ')}.`,
            tags: [...(person.tags || []), personData.role, companyData.industry, 'demo-intelligence'],
            customFields: {
              ...person.customFields,
              // Basic intelligence
              wants: personData.intelligence.wants,
              needs: personData.intelligence.needs,
              painPoints: personData.intelligence.painPoints,
              personalGoals: personData.intelligence.personalGoals,
              professionalGoals: personData.intelligence.professionalGoals,
              
              // Role-based intelligence
              rolePriorities: personData.intelligence.rolePriorities,
              decisionFactors: personData.intelligence.decisionFactors,
              budgetAuthority: personData.intelligence.budgetAuthority,
              influenceLevel: personData.intelligence.influenceLevel,
              decisionTimeline: personData.intelligence.decisionTimeline,
              
              // Psychographic profile
              communicationStyle: personData.intelligence.communicationStyle,
              decisionMakingStyle: personData.intelligence.decisionMakingStyle,
              riskTolerance: personData.intelligence.riskTolerance,
              innovationAdoption: personData.intelligence.innovationAdoption,
              leadershipStyle: personData.intelligence.leadershipStyle,
              
              // Behavioral intelligence
              engagementLevel: personData.intelligence.engagementLevel,
              preferredChannels: personData.intelligence.preferredChannels,
              contentPreferences: personData.intelligence.contentPreferences,
              keyInfluencers: personData.intelligence.keyInfluencers,
              currentSolutions: personData.intelligence.currentSolutions,
              evaluationCriteria: personData.intelligence.evaluationCriteria,
              
              // Financial & business intelligence
              budgetRange: personData.intelligence.budgetRange,
              urgencyLevel: personData.intelligence.urgencyLevel,
              businessImpact: personData.intelligence.businessImpact,
              
              // Report data
              deepValueReports: {
                person: person.fullName,
                role: personData.role,
                company: company.name,
                industry: companyData.industry,
                wants: personData.intelligence.wants,
                needs: personData.intelligence.needs,
                painPoints: personData.intelligence.painPoints,
                goals: personData.intelligence.professionalGoals,
                decisionFactors: personData.intelligence.decisionFactors,
                budgetAuthority: personData.intelligence.budgetAuthority,
                timeline: personData.intelligence.decisionTimeline,
                recommendations: ['Focus on ROI', 'Emphasize Security', 'Highlight Integration']
              },
              miniBriefs: {
                summary: `${person.fullName} is a ${personData.role} at ${company.name}`,
                keyInsights: personData.intelligence.wants.slice(0, 2),
                painPoints: personData.intelligence.painPoints.slice(0, 2),
                recommendations: ['Focus on ROI', 'Emphasize Security']
              },
              
              // Intelligence metadata
              intelligenceScore: personData.intelligence.intelligenceScore,
              lastIntelligenceUpdate: new Date().toISOString(),
              dataSources: ['CoreSignal', 'Web Research', 'Role Triangulation', 'Industry Analysis'],
              confidenceLevel: personData.intelligence.confidenceLevel
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
    console.log('✅ All data stored in existing database fields (no schema changes required)');
    
  } catch (error) {
    console.error('❌ Error generating demo intelligence:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateDemoIntelligence();
