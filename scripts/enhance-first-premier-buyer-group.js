const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-real.json';
const OUTPUT_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-enhanced.json';

// Winning Variant messaging templates
const WINNING_VARIANT_MESSAGING = {
  decision: {
    subject: "Close the AI Impact Gap - Measure Your AI ROI",
    message: "95% of generative AI pilots fail to show business impact. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
    valueProp: "ROI measurement and AI investment justification for executive decision makers",
    callToAction: "Schedule a 15-minute demo to see how we help CFOs measure AI ROI"
  },
  champion: {
    subject: "Close the AI Impact Gap - Measure Your AI ROI", 
    message: "As a data science leader, you understand the challenge of measuring AI impact. Our platform gives you the visibility to prove your AI initiatives are driving real business value.",
    valueProp: "Technical champions can demonstrate AI success with measurable outcomes",
    callToAction: "See how we help data teams prove AI business impact"
  },
  stakeholder: {
    subject: "Close the AI Impact Gap - Measure Your AI ROI",
    message: "Track the business impact of your AI products and engineering initiatives. Our Snowflake-native platform provides real-time ROI visibility for your AI investments.",
    valueProp: "Product and engineering leaders can track AI initiative success",
    callToAction: "Learn how we help teams measure AI project success"
  },
  introducer: {
    subject: "Close the AI Impact Gap - Measure Your AI ROI",
    message: "Help your CFO understand the business impact of AI investments. Our platform provides the ROI data needed to justify and optimize AI spending.",
    valueProp: "Introducers can connect AI teams with budget holders for ROI discussions",
    callToAction: "Connect your data team with budget decision makers"
  }
};

// Determine buyer role based on title
function determineBuyerRole(title) {
  const titleLower = title.toLowerCase();
  
  // Decision makers - C-level and Directors
  if (titleLower.includes('chief') || titleLower.includes('ceo') || titleLower.includes('cfo') || 
      titleLower.includes('cto') || titleLower.includes('cpo') || titleLower.includes('director')) {
    return 'decision';
  }
  
  // Champions - VPs and Senior roles
  if (titleLower.includes('vp') || titleLower.includes('vice president') || 
      titleLower.includes('senior') || titleLower.includes('head of')) {
    return 'champion';
  }
  
  // Introducers - Sales, Marketing, Business Development
  if (titleLower.includes('sales') || titleLower.includes('marketing') || 
      titleLower.includes('business development') || titleLower.includes('revenue')) {
    return 'introducer';
  }
  
  // Default to stakeholder
  return 'stakeholder';
}

// Add Winning Variant messaging to a member
function addWinningVariantMessaging(member) {
  const buyerRole = determineBuyerRole(member.title);
  const messaging = WINNING_VARIANT_MESSAGING[buyerRole];
  
  return {
    ...member,
    buyerRole: buyerRole,
    winningVariantMessaging: messaging,
    personalizedApproach: getPersonalizedApproach(member, buyerRole)
  };
}

// Get personalized approach based on role and title
function getPersonalizedApproach(member, buyerRole) {
  const title = member.title.toLowerCase();
  
  if (buyerRole === 'decision') {
    if (title.includes('finance') || title.includes('cfo')) {
      return {
        focus: "ROI measurement and budget justification",
        painPoint: "95% of AI projects fail to show measurable ROI",
        solution: "Prove AI investment value with real business metrics",
        urgency: "AI spending is increasing but ROI visibility is lacking"
      };
    }
    if (title.includes('technology') || title.includes('cto')) {
      return {
        focus: "Technical implementation and security",
        painPoint: "AI initiatives lack measurable business impact",
        solution: "Snowflake-native platform for secure AI ROI tracking",
        urgency: "Technical teams need to prove AI business value"
      };
    }
  }
  
  if (buyerRole === 'champion') {
    if (title.includes('data') || title.includes('analytics')) {
      return {
        focus: "Data science and analytics leadership",
        painPoint: "AI models deployed but business impact unclear",
        solution: "Measure and optimize AI model performance for business outcomes",
        urgency: "Data teams need to demonstrate AI business value"
      };
    }
    if (title.includes('product')) {
      return {
        focus: "Product management and user experience",
        painPoint: "AI features launched but user impact unknown",
        solution: "Track AI feature adoption and business impact",
        urgency: "Product teams need AI feature performance data"
      };
    }
  }
  
  if (buyerRole === 'introducer') {
    return {
      focus: "Connecting technical teams with budget holders",
      painPoint: "AI teams struggle to communicate business value to executives",
      solution: "Bridge the gap between AI technical success and business ROI",
      urgency: "AI teams need executive buy-in for continued investment"
    };
  }
  
  // Default stakeholder approach
  return {
    focus: "AI initiative success and business impact",
    painPoint: "AI projects lack clear business outcome measurement",
    solution: "Prove AI project value with measurable business metrics",
    urgency: "AI investments need demonstrable ROI for continued funding"
  };
}

// Filter and optimize buyer group for $100K product
function optimizeBuyerGroup(buyerGroup) {
  const allMembers = [];
  
  // Collect all members from all roles
  if (buyerGroup.roles) {
    Object.values(buyerGroup.roles).forEach(roleMembers => {
      if (Array.isArray(roleMembers)) {
        allMembers.push(...roleMembers);
      }
    });
  }
  
  // Sort by influence score and take top 14
  const sortedMembers = allMembers
    .sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0))
    .slice(0, 14);
  
  // Reassign roles based on filtered members
  const optimizedRoles = {
    decision: [],
    champion: [],
    stakeholder: [],
    introducer: []
  };
  
  sortedMembers.forEach(member => {
    const buyerRole = determineBuyerRole(member.title);
    optimizedRoles[buyerRole].push(member);
  });
  
  return {
    ...buyerGroup,
    totalMembers: sortedMembers.length,
    roles: optimizedRoles,
    members: sortedMembers,
    metadata: {
      ...buyerGroup.metadata,
      optimized: true,
      optimizedAt: new Date().toISOString(),
      targetSize: 14,
      actualSize: sortedMembers.length,
      roleDistribution: {
        decision: optimizedRoles.decision.length,
        champion: optimizedRoles.champion.length,
        stakeholder: optimizedRoles.stakeholder.length,
        introducer: optimizedRoles.introducer.length
      }
    }
  };
}

// Main processing function
async function enhanceFirstPremierBuyerGroup() {
  console.log('🚀 Enhancing First Premier Bank buyer group with Winning Variant messaging...');
  
  try {
    // Read existing buyer group data
    const existingData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`📊 Loaded existing buyer group with ${existingData.buyerGroup.totalMembers} members`);
    
    // Add Winning Variant messaging to all members
    const enhancedRoles = {};
    Object.entries(existingData.buyerGroup.roles).forEach(([role, members]) => {
      enhancedRoles[role] = members.map(member => addWinningVariantMessaging(member));
    });
    
    // Create enhanced buyer group
    const enhancedBuyerGroup = {
      ...existingData,
      buyerGroup: {
        ...existingData.buyerGroup,
        roles: enhancedRoles,
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
          ...existingData.buyerGroup.metadata,
          enhanced: true,
          enhancedAt: new Date().toISOString(),
          winningVariantOptimized: true
        }
      }
    };
    
    // Optimize for $100K product (4-14 members)
    const optimizedBuyerGroup = optimizeBuyerGroup(enhancedBuyerGroup);
    
    // Save enhanced buyer group
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(optimizedBuyerGroup, null, 2));
    console.log(`💾 Saved enhanced buyer group: ${OUTPUT_FILE}`);
    
    // Display summary
    console.log('\n🎯 Enhanced First Premier Bank Buyer Group Summary:');
    console.log(`📊 Total Members: ${optimizedBuyerGroup.buyerGroup.totalMembers}`);
    console.log(`👑 Decision Makers: ${optimizedBuyerGroup.buyerGroup.roles.decision.length}`);
    console.log(`🚀 Champions: ${optimizedBuyerGroup.buyerGroup.roles.champion.length}`);
    console.log(`👥 Stakeholders: ${optimizedBuyerGroup.buyerGroup.roles.stakeholder.length}`);
    console.log(`🤝 Introducers: ${optimizedBuyerGroup.buyerGroup.roles.introducer.length}`);
    
    console.log('\n👥 Top Decision Makers:');
    optimizedBuyerGroup.buyerGroup.roles.decision.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Focus: ${member.personalizedApproach.focus}`);
    });
    
    console.log('\n🚀 Top Champions:');
    optimizedBuyerGroup.buyerGroup.roles.champion.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Focus: ${member.personalizedApproach.focus}`);
    });
    
    console.log('\n✅ First Premier Bank buyer group enhancement completed!');
    console.log(`📁 Enhanced data saved to: ${OUTPUT_FILE}`);
    
    return optimizedBuyerGroup;
    
  } catch (error) {
    console.error('❌ Error enhancing buyer group:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await enhanceFirstPremierBuyerGroup();
  } catch (error) {
    console.error('❌ Enhancement failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { enhanceFirstPremierBuyerGroup };
