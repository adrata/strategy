const fs = require('fs');

// Configuration
const INPUT_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-from-coresignal.json';
const OUTPUT_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-proper.json';

// Role assignment logic based on titles and seniority
function assignBuyerRole(member) {
  const title = member.title.toLowerCase();
  
  // Decision Makers - C-level, Senior VPs, Directors with budget authority
  if (title.includes('chief') || title.includes('ceo') || title.includes('cfo') || 
      title.includes('cto') || title.includes('cpo') || title.includes('president') ||
      title.includes('senior vice president') ||
      (title.includes('vice president') && (title.includes('finance') || title.includes('marketing'))) ||
      (title.includes('director') && (title.includes('finance') || title.includes('marketing')))) {
    return 'decision';
  }
  
  // Champions - VPs and Directors in operational/technical roles
  if ((title.includes('vice president') && (title.includes('card') || title.includes('services') || title.includes('technology'))) ||
      (title.includes('director') && (title.includes('financial') || title.includes('modeling') || title.includes('analysis') || title.includes('human resources')))) {
    return 'champion';
  }
  
  // Stakeholders - Managers and Senior roles
  if (title.includes('manager') || title.includes('senior') || title.includes('lead') ||
      title.includes('supervisor') || title.includes('coordinator')) {
    return 'stakeholder';
  }
  
  // Introducers - Sales, Marketing, Business Development roles
  if (title.includes('banker') || title.includes('collector') || title.includes('sales') ||
      title.includes('marketing') || title.includes('business development') ||
      title.includes('relationship')) {
    return 'introducer';
  }
  
  // Default to stakeholder for other roles
  return 'stakeholder';
}

// Adjust influence scores based on role
function adjustInfluenceScore(member, role) {
  const baseScore = member.influenceScore;
  
  switch (role) {
    case 'decision':
      return Math.max(9.0, baseScore);
    case 'champion':
      return Math.max(8.5, baseScore);
    case 'stakeholder':
      return Math.max(7.5, baseScore);
    case 'introducer':
      return Math.max(7.0, baseScore);
    default:
      return baseScore;
  }
}

// Get personalized messaging based on role
function getPersonalizedMessaging(member, role) {
  const title = member.title.toLowerCase();
  
  if (role === 'decision') {
    if (title.includes('finance') || title.includes('cfo') || title.includes('financial')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "As a financial leader, you understand the challenge of measuring AI investment returns. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
        valueProp: "ROI measurement and AI investment justification for financial decision makers",
        callToAction: "Schedule a 15-minute demo to see how we help CFOs measure AI ROI"
      };
    }
    if (title.includes('marketing') || title.includes('vice president')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "Track the business impact of your AI marketing initiatives. Our platform provides real-time ROI visibility for your AI investments in customer acquisition and engagement.",
        valueProp: "Marketing leaders can track AI initiative success and ROI",
        callToAction: "See how we help marketing teams prove AI business impact"
      };
    }
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "95% of generative AI pilots fail to show business impact. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
      valueProp: "ROI measurement and AI investment justification for executive decision makers",
      callToAction: "Schedule a 15-minute demo to see how we help executives measure AI ROI"
    };
  }
  
  if (role === 'champion') {
    if (title.includes('financial') || title.includes('modeling') || title.includes('analysis')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "As a financial modeling expert, you understand the importance of data-driven decisions. Our platform gives you the visibility to prove your AI initiatives are driving real business value.",
        valueProp: "Financial analysts can demonstrate AI success with measurable outcomes",
        callToAction: "See how we help financial teams prove AI business impact"
      };
    }
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Track the business impact of your AI initiatives. Our Snowflake-native platform provides real-time ROI visibility for your AI investments.",
      valueProp: "Technical champions can demonstrate AI success with measurable outcomes",
      callToAction: "Learn how we help teams measure AI project success"
    };
  }
  
  if (role === 'introducer') {
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Help your executives understand the business impact of AI investments. Our platform provides the ROI data needed to justify and optimize AI spending.",
      valueProp: "Introducers can connect AI teams with budget holders for ROI discussions",
      callToAction: "Connect your data team with budget decision makers"
    };
  }
  
  // Default stakeholder messaging
  return {
    subject: "Close the AI Impact Gap - Measure Your AI ROI",
    message: "Join the 5% of companies that successfully measure AI ROI. Our Snowflake-native platform helps you prove the business impact of your AI initiatives.",
    valueProp: "Stakeholders can track and optimize AI investments for maximum business impact",
    callToAction: "Discover how we help teams measure AI success"
  };
}

// Main processing function
async function createProperBuyerGroup() {
  console.log('🚀 Creating proper buyer group structure...');
  
  try {
    // Read the existing buyer group data
    const existingData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`📊 Loaded ${existingData.buyerGroup.totalMembers} members from existing data`);
    
    const allMembers = existingData.buyerGroup.members || [];
    
    // Assign proper roles to each member
    const membersWithRoles = allMembers.map(member => {
      const buyerRole = assignBuyerRole(member);
      const adjustedScore = adjustInfluenceScore(member, buyerRole);
      const messaging = getPersonalizedMessaging(member, buyerRole);
      
      return {
        ...member,
        buyerRole: buyerRole,
        influenceScore: adjustedScore,
        confidence: Math.min(95, Math.max(70, adjustedScore * 10)),
        winningVariantMessaging: messaging
      };
    });
    
    // Sort by influence score
    membersWithRoles.sort((a, b) => b.influenceScore - a.influenceScore);
    
    // Group by roles
    const roles = {
      decision: membersWithRoles.filter(m => m.buyerRole === 'decision'),
      champion: membersWithRoles.filter(m => m.buyerRole === 'champion'),
      stakeholder: membersWithRoles.filter(m => m.buyerRole === 'stakeholder'),
      introducer: membersWithRoles.filter(m => m.buyerRole === 'introducer')
    };
    
    // Create the proper buyer group structure
    const properBuyerGroup = {
      company: {
        companyId: "7578901",
        companyName: "First PREMIER Bank"
      },
      buyerGroup: {
        id: `first_premier_bank_proper_${Date.now()}`,
        companyName: "First PREMIER Bank",
        totalMembers: membersWithRoles.length,
        roles: roles,
        members: membersWithRoles,
        winningVariantContext: {
          productName: "AI Impact Visibility Platform",
          targetMarket: "Mid-market companies with $100K+ AI investments",
          valueProposition: "Close the AI Impact Gap - Measure Your AI ROI",
          keyMessage: "95% of generative AI pilots are failures - prove your AI ROI",
          deploymentModel: "Snowflake-native (100% inside customer Snowflake account)",
          targetDepartments: ["data science", "product", "engineering", "analytics", "finance"],
          dealSize: "$100K+ annually",
          sellerCompany: "Winning Variant"
        },
        metadata: {
          source: 'coresignal-employee-data',
          processedAt: new Date().toISOString(),
          roleDistribution: {
            decision: roles.decision.length,
            champion: roles.champion.length,
            stakeholder: roles.stakeholder.length,
            introducer: roles.introducer.length
          },
          totalEmployeesFound: existingData.buyerGroup.metadata?.firstPremierEmployeesFound || 0,
          filterCriteria: 'Current employees with proper role assignment'
        }
      }
    };
    
    // Save the proper buyer group
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(properBuyerGroup, null, 2));
    console.log(`💾 Saved proper buyer group: ${OUTPUT_FILE}`);
    
    // Display summary
    console.log('\n🎯 Proper First Premier Bank Buyer Group Summary:');
    console.log(`📊 Total Members: ${membersWithRoles.length}`);
    console.log(`👑 Decision Makers: ${roles.decision.length}`);
    console.log(`🚀 Champions: ${roles.champion.length}`);
    console.log(`👥 Stakeholders: ${roles.stakeholder.length}`);
    console.log(`🤝 Introducers: ${roles.introducer.length}`);
    
    console.log('\n👑 Decision Makers:');
    roles.decision.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
    });
    
    console.log('\n🚀 Champions:');
    roles.champion.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
    });
    
    console.log('\n👥 Stakeholders:');
    roles.stakeholder.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
    });
    
    console.log('\n🤝 Introducers:');
    roles.introducer.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
    });
    
    return properBuyerGroup;
    
  } catch (error) {
    console.error('❌ Error creating proper buyer group:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await createProperBuyerGroup();
    console.log('\n✅ Proper buyer group creation completed successfully!');
  } catch (error) {
    console.error('❌ Creation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createProperBuyerGroup };
