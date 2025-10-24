const fs = require('fs');

// Configuration
const INPUT_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-optimized.json';
const OUTPUT_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-final.json';

// Winning Variant's role distribution targets
const ROLE_TARGETS = {
  DECISION_MAKERS: { min: 1, max: 3, ideal: 2 },
  CHAMPIONS: { min: 2, max: 5, ideal: 3 },
  STAKEHOLDERS: { min: 1, max: 4, ideal: 3 },
  BLOCKERS: { min: 0, max: 1, ideal: 0 },
  INTRODUCERS: { min: 0, max: 2, ideal: 1 }
};

// Enhanced role assignment with manual curation for optimal balance
function assignOptimalBalancedRole(member, index) {
  const title = member.title.toLowerCase();
  const name = member.name.toLowerCase();
  
  // Manual curation for the best possible buyer group
  const manualAssignments = {
    // Decision Makers - C-level and senior executives with budget authority
    'trent myron': 'decision',           // Director of Finance - Budget authority
    'heather leraas': 'decision',        // Director Product Services - Strategic role
    
    // Champions - VPs and Directors in operational/technical roles
    'sadie haugen': 'champion',          // Director, Financial Modeling - Technical expertise
    'darrin graham': 'champion',         // Vice President, Marketing - Operational leader
    'brenda bethke': 'champion',         // Sr. Vice President of Marketing - Senior operational
    
    // Stakeholders - Managers and coordinators
    'david larson': 'stakeholder',       // Vice President, Card Services - Managerial role
    'jennifer larson': 'stakeholder',    // Vice President, Risk Services - Risk management
    'michael larson': 'stakeholder',    // Vice President, Technology - Technology management
    'sarah larson': 'stakeholder',      // Director, Human Resources - HR management
    'robert larson': 'stakeholder',     // Director, Financial Modeling - Financial analysis
    'lisa larson': 'stakeholder',       // Director, Product Services - Product management
    
    // Introducers - Customer-facing and relationship roles
    'john smith': 'introducer',         // Debt Collector - Customer-facing role
    'jane doe': 'introducer'             // Relationship Manager - Customer relationship
  };
  
  // Check manual assignments first
  if (manualAssignments[name]) {
    return manualAssignments[name];
  }
  
  // Fallback to title-based assignment
  if (title.includes('chief') || title.includes('ceo') || title.includes('cfo') || 
      title.includes('cto') || title.includes('cpo') || title.includes('president') ||
      title.includes('senior vice president') ||
      (title.includes('vice president') && (title.includes('finance') || title.includes('marketing')))) {
    return 'decision';
  }
  
  if ((title.includes('vice president') && (title.includes('card') || title.includes('services') || 
       title.includes('technology') || title.includes('data') || title.includes('analytics'))) ||
      (title.includes('director') && (title.includes('financial') || title.includes('modeling') || 
       title.includes('analysis') || title.includes('human resources') || title.includes('data') || 
       title.includes('analytics') || title.includes('product') || title.includes('engineering')))) {
    return 'champion';
  }
  
  if (title.includes('manager') || title.includes('coordinator') || title.includes('supervisor') ||
      title.includes('lead') || title.includes('specialist')) {
    return 'stakeholder';
  }
  
  if (title.includes('banker') || title.includes('collector') || title.includes('debt') ||
      title.includes('sales') || title.includes('relationship') || title.includes('business development')) {
    return 'introducer';
  }
  
  // Default to stakeholder
  return 'stakeholder';
}

// Enhanced messaging for each role
function getRoleSpecificMessaging(member, role) {
  const title = member.title.toLowerCase();
  
  if (role === 'decision') {
    if (title.includes('finance') || title.includes('financial')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "As a financial leader at First Premier Bank, you understand the challenge of measuring AI investment returns. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
        valueProp: "ROI measurement and AI investment justification for financial decision makers",
        callToAction: "Schedule a 15-minute demo to see how we help CFOs measure AI ROI",
        urgency: "95% of generative AI pilots fail to show business impact - don't let yours be one of them",
        painPoint: "AI investments are invisible to the business without proper ROI measurement",
        solution: "Real-time AI ROI visibility inside your existing Snowflake environment"
      };
    }
    if (title.includes('product') || title.includes('marketing')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "Track the business impact of your AI initiatives at First Premier Bank. Our platform provides real-time ROI visibility for your AI investments in customer experience and product development.",
        valueProp: "Product leaders can track AI initiative success and ROI",
        callToAction: "See how we help product teams prove AI business impact",
        urgency: "Prove the value of your AI product investments with measurable outcomes",
        painPoint: "AI product features lack measurable business impact data",
        solution: "Connect AI product features to business outcomes and revenue"
      };
    }
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "95% of generative AI pilots fail to show business impact. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
      valueProp: "ROI measurement and AI investment justification for executive decision makers",
      callToAction: "Schedule a 15-minute demo to see how we help executives measure AI ROI",
      urgency: "Don't let your AI initiatives become another failed pilot",
      painPoint: "AI investments lack measurable business impact",
      solution: "Real-time AI ROI visibility and business impact measurement"
    };
  }
  
  if (role === 'champion') {
    if (title.includes('financial') || title.includes('modeling') || title.includes('analysis')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "As a financial modeling expert at First Premier Bank, you understand the importance of data-driven decisions. Our platform gives you the visibility to prove your AI initiatives are driving real business value.",
        valueProp: "Financial analysts can demonstrate AI success with measurable outcomes",
        callToAction: "See how we help financial teams prove AI business impact",
        urgency: "Transform your AI investments from cost centers to profit drivers",
        painPoint: "AI financial models lack real business impact data",
        solution: "Connect AI models to actual business outcomes and ROI"
      };
    }
    if (title.includes('marketing') || title.includes('card') || title.includes('services')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "Track the business impact of your AI-powered services at First Premier Bank. Our platform provides real-time ROI visibility for your AI investments in customer experience and fraud detection.",
        valueProp: "Service leaders can demonstrate AI success with measurable outcomes",
        callToAction: "Learn how we help service teams measure AI project success",
        urgency: "Prove the business value of your AI-powered customer experiences",
        painPoint: "AI service improvements lack measurable business impact",
        solution: "Connect AI service enhancements to customer satisfaction and revenue"
      };
    }
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Track the business impact of your AI initiatives at First Premier Bank. Our Snowflake-native platform provides real-time ROI visibility for your AI investments.",
      valueProp: "Technical champions can demonstrate AI success with measurable outcomes",
      callToAction: "Learn how we help teams measure AI project success",
      urgency: "Be the champion who proves AI ROI at First Premier Bank",
      painPoint: "AI technical success doesn't translate to business impact",
      solution: "Bridge the gap between AI technical success and business outcomes"
    };
  }
  
  if (role === 'stakeholder') {
    if (title.includes('technology') || title.includes('engineering')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "As a technology leader at First Premier Bank, you need to demonstrate the business value of your AI initiatives. Our platform helps you connect technical success to measurable business outcomes.",
        valueProp: "Technology stakeholders can track AI project business impact",
        callToAction: "See how we help tech teams prove AI business value",
        urgency: "Show the business impact of your AI technology investments",
        painPoint: "AI technology success is invisible to business stakeholders",
        solution: "Make AI technology success visible to business decision makers"
      };
    }
    if (title.includes('human resources') || title.includes('hr')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "Track the business impact of AI initiatives across First Premier Bank. Our platform provides visibility into how AI investments are driving organizational success.",
        valueProp: "HR stakeholders can track AI impact on organizational performance",
        callToAction: "Learn how we help HR teams measure AI organizational impact",
        urgency: "Understand how AI investments are improving organizational outcomes",
        painPoint: "AI impact on organizational performance is unclear",
        solution: "Connect AI investments to organizational performance metrics"
      };
    }
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Join the 5% of companies that successfully measure AI ROI. Our Snowflake-native platform helps you prove the business impact of your AI initiatives at First Premier Bank.",
      valueProp: "Stakeholders can track and optimize AI investments for maximum business impact",
      callToAction: "Discover how we help teams measure AI success",
      urgency: "Don't let your AI investments become invisible to the business",
      painPoint: "AI investments lack clear business impact visibility",
      solution: "Real-time AI ROI visibility and business impact measurement"
    };
  }
  
  if (role === 'introducer') {
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Help your executives at First Premier Bank understand the business impact of AI investments. Our platform provides the ROI data needed to justify and optimize AI spending.",
      valueProp: "Introducers can connect AI teams with budget holders for ROI discussions",
      callToAction: "Connect your data team with budget decision makers",
      urgency: "Bridge the gap between AI teams and budget decision makers",
      painPoint: "AI teams struggle to communicate business value to executives",
      solution: "Provide AI teams with business impact data for executive discussions"
    };
  }
  
  // Default messaging
  return {
    subject: "Close the AI Impact Gap - Measure Your AI ROI",
    message: "Track the business impact of your AI initiatives at First Premier Bank. Our Snowflake-native platform provides real-time ROI visibility for your AI investments.",
    valueProp: "Track and optimize AI investments for maximum business impact",
    callToAction: "Learn how we help teams measure AI success",
    urgency: "Don't let your AI investments become invisible to the business",
    painPoint: "AI investments lack clear business impact visibility",
    solution: "Real-time AI ROI visibility and business impact measurement"
  };
}

// Main function to create balanced buyer group
async function createBalancedOptimizedBuyerGroup() {
  console.log('🚀 Creating balanced optimized buyer group...');
  
  try {
    // Load optimized buyer group
    const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`📊 Loaded ${data.buyerGroup.members.length} optimized members`);
    
    // Assign balanced roles
    const balancedMembers = data.buyerGroup.members.map((member, index) => {
      const role = assignOptimalBalancedRole(member, index);
      const enhancedMessaging = getRoleSpecificMessaging(member, role);
      
      return {
        ...member,
        buyerRole: role,
        winningVariantMessaging: enhancedMessaging
      };
    });
    
    // Group by roles
    const roles = {
      decision: balancedMembers.filter(m => m.buyerRole === 'decision'),
      champion: balancedMembers.filter(m => m.buyerRole === 'champion'),
      stakeholder: balancedMembers.filter(m => m.buyerRole === 'stakeholder'),
      introducer: balancedMembers.filter(m => m.buyerRole === 'introducer')
    };
    
    // Create final buyer group
    const finalBuyerGroup = {
      company: data.company,
      buyerGroup: {
        ...data.buyerGroup,
        id: `first_premier_bank_final_${Date.now()}`,
        totalMembers: balancedMembers.length,
        roles: roles,
        members: balancedMembers,
        metadata: {
          ...data.buyerGroup.metadata,
          balancedRoles: true,
          balancedAt: new Date().toISOString(),
          roleDistribution: {
            decision: roles.decision.length,
            champion: roles.champion.length,
            stakeholder: roles.stakeholder.length,
            introducer: roles.introducer.length
          },
          winningVariantOptimized: true,
          finalOptimization: true
        }
      }
    };
    
    // Save final buyer group
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalBuyerGroup, null, 2));
    console.log(`💾 Saved final balanced buyer group: ${OUTPUT_FILE}`);
    
    // Display results
    console.log('\n🎯 Final First Premier Bank Buyer Group Summary:');
    console.log(`📊 Total Members: ${finalBuyerGroup.buyerGroup.totalMembers}`);
    console.log(`👑 Decision Makers: ${finalBuyerGroup.buyerGroup.roles.decision.length}`);
    console.log(`🚀 Champions: ${finalBuyerGroup.buyerGroup.roles.champion.length}`);
    console.log(`👥 Stakeholders: ${finalBuyerGroup.buyerGroup.roles.stakeholder.length}`);
    console.log(`🤝 Introducers: ${finalBuyerGroup.buyerGroup.roles.introducer.length}`);
    
    console.log('\n👑 Decision Makers:');
    finalBuyerGroup.buyerGroup.roles.decision.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Message: ${member.winningVariantMessaging.urgency}`);
    });
    
    console.log('\n🚀 Champions:');
    finalBuyerGroup.buyerGroup.roles.champion.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Message: ${member.winningVariantMessaging.urgency}`);
    });
    
    console.log('\n👥 Stakeholders:');
    finalBuyerGroup.buyerGroup.roles.stakeholder.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Message: ${member.winningVariantMessaging.urgency}`);
    });
    
    console.log('\n🤝 Introducers:');
    finalBuyerGroup.buyerGroup.roles.introducer.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Message: ${member.winningVariantMessaging.urgency}`);
    });
    
    console.log('\n✅ Balanced buyer group creation completed successfully!');
    return finalBuyerGroup;
    
  } catch (error) {
    console.error('❌ Error creating balanced buyer group:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting balanced buyer group creation...');
    const finalBuyerGroup = await createBalancedOptimizedBuyerGroup();
    console.log('\n✅ Final buyer group creation completed successfully!');
  } catch (error) {
    console.error('❌ Creation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createBalancedOptimizedBuyerGroup };
