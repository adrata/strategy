const fs = require('fs');

// Configuration
const BUYER_GROUP_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-balanced.json';
const CORESIGNAL_DATA_FILE = 'wv/part-00000-032e66b6-9376-4c8d-8865-a5a3dc35bfad-c000.json';
const OUTPUT_FILE = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-optimized.json';

// Winning Variant's ideal buyer group criteria
const WINNING_VARIANT_CRITERIA = {
  // Size requirements
  MIN_SIZE: 4,
  MAX_SIZE: 14,
  TARGET_SIZE: 8,
  
  // Influence requirements
  MIN_INFLUENCE_SCORE: 8.5,
  REQUIRE_DIRECTOR: true,
  ALLOW_IC: false,
  
  // Role distribution targets
  ROLE_TARGETS: {
    DECISION_MAKERS: { min: 1, max: 3, ideal: 2 },
    CHAMPIONS: { min: 2, max: 5, ideal: 3 },
    STAKEHOLDERS: { min: 1, max: 4, ideal: 3 },
    BLOCKERS: { min: 0, max: 1, ideal: 0 },
    INTRODUCERS: { min: 0, max: 2, ideal: 1 }
  },
  
  // Must-have titles for $100K AI ROI product
  MUST_HAVE_TITLES: [
    "chief financial officer", "cfo", "chief technology officer", "cto",
    "chief product officer", "cpo", "chief executive officer", "ceo",
    "vp data science", "vp engineering", "vp product", "vp analytics", "vp finance",
    "director analytics", "director data science", "director engineering",
    "director product", "director finance", "head of data science",
    "head of product", "head of analytics", "head of engineering", "head of finance"
  ],
  
  // Target departments
  TARGET_DEPARTMENTS: ["data science", "product", "engineering", "analytics", "finance"]
};

// First Premier Bank identifiers for active employment verification
const FIRST_PREMIER_IDENTIFIERS = [
  'first premier bank',
  'firstpremierbank',
  'first premier',
  'firstpremier',
  'first premier bank/premier bankcard',
  'premier bankcard',
  'firstpremier.com'
];

// Enhanced influence score calculation
function calculateEnhancedInfluenceScore(member) {
  const title = member.title.toLowerCase();
  let baseScore = 0;
  
  // C-level executives
  if (title.includes('chief') || title.includes('ceo') || title.includes('cfo') || 
      title.includes('cto') || title.includes('cpo') || title.includes('president')) {
    baseScore = 10;
  }
  // Senior VPs
  else if (title.includes('senior vice president') || title.includes('sr. vice president')) {
    baseScore = 9.5;
  }
  // VPs
  else if (title.includes('vice president') || title.includes('vp')) {
    baseScore = 9.0;
  }
  // Directors
  else if (title.includes('director') || title.includes('head of')) {
    baseScore = 8.5;
  }
  // Senior Managers
  else if (title.includes('senior manager') || title.includes('senior')) {
    baseScore = 8.0;
  }
  // Managers
  else if (title.includes('manager')) {
    baseScore = 7.5;
  }
  // Other roles
  else {
    baseScore = 6.0;
  }
  
  // Bonus points for AI/Data/Finance relevance
  if (title.includes('data') || title.includes('analytics') || title.includes('finance') || 
      title.includes('technology') || title.includes('product')) {
    baseScore += 0.5;
  }
  
  return Math.min(10, baseScore);
}

// Check if title matches Winning Variant's must-have titles
function matchesMustHaveTitles(title) {
  const lowerTitle = title.toLowerCase();
  return WINNING_VARIANT_CRITERIA.MUST_HAVE_TITLES.some(mustHave => 
    lowerTitle.includes(mustHave)
  );
}

// Check if title is in target departments
function isInTargetDepartment(title) {
  const lowerTitle = title.toLowerCase();
  return WINNING_VARIANT_CRITERIA.TARGET_DEPARTMENTS.some(dept => 
    lowerTitle.includes(dept)
  );
}

// Enhanced role assignment based on Winning Variant criteria
function assignOptimalBuyerRole(member) {
  const title = member.title.toLowerCase();
  const name = member.name.toLowerCase();
  
  // Decision Makers - C-level and senior executives with budget authority
  if (title.includes('chief') || title.includes('ceo') || title.includes('cfo') || 
      title.includes('cto') || title.includes('cpo') || title.includes('president') ||
      title.includes('senior vice president') ||
      (title.includes('vice president') && (title.includes('finance') || title.includes('marketing'))) ||
      (title.includes('director') && title.includes('finance'))) {
    return 'decision';
  }
  
  // Champions - VPs and Directors in technical/operational roles
  if ((title.includes('vice president') && (title.includes('card') || title.includes('services') || 
       title.includes('technology') || title.includes('data') || title.includes('analytics'))) ||
      (title.includes('director') && (title.includes('financial') || title.includes('modeling') || 
       title.includes('analysis') || title.includes('human resources') || title.includes('data') || 
       title.includes('analytics') || title.includes('product') || title.includes('engineering')))) {
    return 'champion';
  }
  
  // Stakeholders - Managers and coordinators
  if (title.includes('manager') || title.includes('coordinator') || title.includes('supervisor') ||
      title.includes('lead') || title.includes('specialist')) {
    return 'stakeholder';
  }
  
  // Introducers - Sales and customer-facing roles
  if (title.includes('banker') || title.includes('collector') || title.includes('debt') ||
      title.includes('sales') || title.includes('relationship') || title.includes('business development')) {
    return 'introducer';
  }
  
  // Default to stakeholder for other roles
  return 'stakeholder';
}

// Verify if person is currently employed at First Premier Bank
function isCurrentlyEmployedAtFirstPremier(employee) {
  if (!employee.experience || !Array.isArray(employee.experience)) {
    return false;
  }
  
  return employee.experience.some(exp => {
    if (!exp.is_current) return false;
    
    const companyName = (exp.company_name || '').toLowerCase();
    const companyDomain = (exp.company_website || '').toLowerCase();
    
    return FIRST_PREMIER_IDENTIFIERS.some(identifier => 
      companyName.includes(identifier) || companyDomain.includes(identifier)
    );
  });
}

// Get current title from experience
function getCurrentTitle(employee) {
  if (!employee.experience || !Array.isArray(employee.experience)) {
    return employee.headline || 'Unknown';
  }
  
  const currentExp = employee.experience.find(exp => 
    exp.is_current && 
    FIRST_PREMIER_IDENTIFIERS.some(identifier => 
      (exp.company_name || '').toLowerCase().includes(identifier) ||
      (exp.company_website || '').toLowerCase().includes(identifier)
    )
  );
  
  return currentExp ? currentExp.title : (employee.headline || 'Unknown');
}

// Enhanced personalized messaging
function getEnhancedWinningVariantMessaging(member, role) {
  const title = member.title.toLowerCase();
  
  if (role === 'decision') {
    if (title.includes('finance') || title.includes('cfo') || title.includes('financial')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "As a financial leader at First Premier Bank, you understand the challenge of measuring AI investment returns. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
        valueProp: "ROI measurement and AI investment justification for financial decision makers",
        callToAction: "Schedule a 15-minute demo to see how we help CFOs measure AI ROI",
        urgency: "95% of generative AI pilots fail to show business impact - don't let yours be one of them"
      };
    }
    if (title.includes('marketing') || title.includes('vice president')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "Track the business impact of your AI marketing initiatives at First Premier Bank. Our platform provides real-time ROI visibility for your AI investments in customer acquisition and engagement.",
        valueProp: "Marketing leaders can track AI initiative success and ROI",
        callToAction: "See how we help marketing teams prove AI business impact",
        urgency: "Prove the value of your AI marketing investments with measurable outcomes"
      };
    }
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "95% of generative AI pilots fail to show business impact. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
      valueProp: "ROI measurement and AI investment justification for executive decision makers",
      callToAction: "Schedule a 15-minute demo to see how we help executives measure AI ROI",
      urgency: "Don't let your AI initiatives become another failed pilot"
    };
  }
  
  if (role === 'champion') {
    if (title.includes('financial') || title.includes('modeling') || title.includes('analysis')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "As a financial modeling expert at First Premier Bank, you understand the importance of data-driven decisions. Our platform gives you the visibility to prove your AI initiatives are driving real business value.",
        valueProp: "Financial analysts can demonstrate AI success with measurable outcomes",
        callToAction: "See how we help financial teams prove AI business impact",
        urgency: "Transform your AI investments from cost centers to profit drivers"
      };
    }
    if (title.includes('card') || title.includes('services')) {
      return {
        subject: "Close the AI Impact Gap - Measure Your AI ROI",
        message: "Track the business impact of your AI-powered card services at First Premier Bank. Our platform provides real-time ROI visibility for your AI investments in customer experience and fraud detection.",
        valueProp: "Card services leaders can demonstrate AI success with measurable outcomes",
        callToAction: "Learn how we help card services teams measure AI project success",
        urgency: "Prove the business value of your AI-powered customer experiences"
      };
    }
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Track the business impact of your AI initiatives at First Premier Bank. Our Snowflake-native platform provides real-time ROI visibility for your AI investments.",
      valueProp: "Technical champions can demonstrate AI success with measurable outcomes",
      callToAction: "Learn how we help teams measure AI project success",
      urgency: "Be the champion who proves AI ROI at First Premier Bank"
    };
  }
  
  if (role === 'introducer') {
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Help your executives at First Premier Bank understand the business impact of AI investments. Our platform provides the ROI data needed to justify and optimize AI spending.",
      valueProp: "Introducers can connect AI teams with budget holders for ROI discussions",
      callToAction: "Connect your data team with budget decision makers",
      urgency: "Bridge the gap between AI teams and budget decision makers"
    };
  }
  
  // Default stakeholder messaging
  return {
    subject: "Close the AI Impact Gap - Measure Your AI ROI",
    message: "Join the 5% of companies that successfully measure AI ROI. Our Snowflake-native platform helps you prove the business impact of your AI initiatives at First Premier Bank.",
    valueProp: "Stakeholders can track and optimize AI investments for maximum business impact",
    callToAction: "Discover how we help teams measure AI success",
    urgency: "Don't let your AI investments become invisible to the business"
  };
}

// Main analysis function
async function analyzeAndOptimizeBuyerGroup() {
  console.log('🔍 Analyzing buyer group quality against Winning Variant criteria...');
  
  try {
    // Load current buyer group
    const currentData = JSON.parse(fs.readFileSync(BUYER_GROUP_FILE, 'utf8'));
    console.log(`📊 Loaded current buyer group with ${currentData.buyerGroup.totalMembers} members`);
    
    // Load CoreSignal data for verification
    console.log('🔍 Loading CoreSignal data for employment verification...');
    const coresignalData = fs.readFileSync(CORESIGNAL_DATA_FILE, 'utf8');
    const coresignalLines = coresignalData.trim().split('\n');
    
    // Create lookup map for employment verification
    const employeeLookup = new Map();
    for (const line of coresignalLines) {
      try {
        const employee = JSON.parse(line);
        if (employee.full_name) {
          employeeLookup.set(employee.full_name.toLowerCase(), employee);
        }
      } catch (e) {
        // Skip invalid lines
        continue;
      }
    }
    
    console.log(`📊 Loaded ${employeeLookup.size} employees from CoreSignal data`);
    
    // Analyze and optimize each member
    const optimizedMembers = [];
    const analysisResults = {
      totalAnalyzed: 0,
      currentlyEmployed: 0,
      meetsInfluenceScore: 0,
      matchesMustHaveTitles: 0,
      inTargetDepartment: 0,
      optimized: 0
    };
    
    for (const member of currentData.buyerGroup.members) {
      analysisResults.totalAnalyzed++;
      
      // Verify current employment
      const employeeData = employeeLookup.get(member.name.toLowerCase());
      if (employeeData && isCurrentlyEmployedAtFirstPremier(employeeData)) {
        analysisResults.currentlyEmployed++;
        
        // Get current title
        const currentTitle = getCurrentTitle(employeeData);
        
        // Calculate enhanced influence score
        const enhancedScore = calculateEnhancedInfluenceScore({ ...member, title: currentTitle });
        
        // Check criteria
        const meetsInfluenceScore = enhancedScore >= WINNING_VARIANT_CRITERIA.MIN_INFLUENCE_SCORE;
        const matchesMustHave = matchesMustHaveTitles(currentTitle);
        const inTargetDept = isInTargetDepartment(currentTitle);
        
        if (meetsInfluenceScore) analysisResults.meetsInfluenceScore++;
        if (matchesMustHave) analysisResults.matchesMustHaveTitles++;
        if (inTargetDept) analysisResults.inTargetDepartment++;
        
        // Assign optimal role
        const optimalRole = assignOptimalBuyerRole({ ...member, title: currentTitle });
        
        // Create optimized member
        const optimizedMember = {
          ...member,
          title: currentTitle,
          influenceScore: enhancedScore,
          buyerRole: optimalRole,
          confidence: Math.min(95, Math.max(70, enhancedScore * 10)),
          winningVariantMessaging: getEnhancedWinningVariantMessaging({ ...member, title: currentTitle }, optimalRole),
          employmentVerified: true,
          criteriaMatch: {
            meetsInfluenceScore,
            matchesMustHaveTitles: matchesMustHave,
            inTargetDepartment: inTargetDept,
            overallScore: (meetsInfluenceScore ? 1 : 0) + (matchesMustHave ? 1 : 0) + (inTargetDept ? 1 : 0)
          }
        };
        
        optimizedMembers.push(optimizedMember);
        analysisResults.optimized++;
      } else {
        console.log(`⚠️  ${member.name} - Employment verification failed or not currently employed`);
      }
    }
    
    // Sort by influence score and criteria match
    optimizedMembers.sort((a, b) => {
      if (b.criteriaMatch.overallScore !== a.criteriaMatch.overallScore) {
        return b.criteriaMatch.overallScore - a.criteriaMatch.overallScore;
      }
      return b.influenceScore - a.influenceScore;
    });
    
    // Limit to target size
    const finalMembers = optimizedMembers.slice(0, WINNING_VARIANT_CRITERIA.MAX_SIZE);
    
    // Group by roles
    const roles = {
      decision: finalMembers.filter(m => m.buyerRole === 'decision'),
      champion: finalMembers.filter(m => m.buyerRole === 'champion'),
      stakeholder: finalMembers.filter(m => m.buyerRole === 'stakeholder'),
      introducer: finalMembers.filter(m => m.buyerRole === 'introducer')
    };
    
    // Create optimized buyer group
    const optimizedBuyerGroup = {
      company: {
        companyId: "7578901",
        companyName: "First PREMIER Bank"
      },
      buyerGroup: {
        id: `first_premier_bank_optimized_${Date.now()}`,
        companyName: "First PREMIER Bank",
        totalMembers: finalMembers.length,
        roles: roles,
        members: finalMembers,
        winningVariantContext: {
          productName: "AI Impact Visibility Platform",
          targetMarket: "Mid-market companies with $100K+ AI investments",
          valueProposition: "Close the AI Impact Gap - Measure Your AI ROI",
          keyMessage: "95% of generative AI pilots are failures - prove your AI ROI",
          deploymentModel: "Snowflake-native (100% inside customer Snowflake account)",
          targetDepartments: WINNING_VARIANT_CRITERIA.TARGET_DEPARTMENTS,
          dealSize: "$100K+ annually",
          sellerCompany: "Winning Variant"
        },
        metadata: {
          source: 'coresignal-employee-data-verified',
          processedAt: new Date().toISOString(),
          analysisResults: analysisResults,
          roleDistribution: {
            decision: roles.decision.length,
            champion: roles.champion.length,
            stakeholder: roles.stakeholder.length,
            introducer: roles.introducer.length
          },
          criteriaCompliance: {
            sizeCompliant: finalMembers.length >= WINNING_VARIANT_CRITERIA.MIN_SIZE && finalMembers.length <= WINNING_VARIANT_CRITERIA.MAX_SIZE,
            influenceCompliant: finalMembers.every(m => m.influenceScore >= WINNING_VARIANT_CRITERIA.MIN_INFLUENCE_SCORE),
            employmentVerified: finalMembers.every(m => m.employmentVerified),
            targetSize: WINNING_VARIANT_CRITERIA.TARGET_SIZE,
            actualSize: finalMembers.length
          }
        }
      }
    };
    
    // Save optimized buyer group
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(optimizedBuyerGroup, null, 2));
    console.log(`💾 Saved optimized buyer group: ${OUTPUT_FILE}`);
    
    // Display analysis results
    console.log('\n📊 Buyer Group Quality Analysis Results:');
    console.log(`📈 Total Members Analyzed: ${analysisResults.totalAnalyzed}`);
    console.log(`✅ Currently Employed: ${analysisResults.currentlyEmployed}`);
    console.log(`🎯 Meets Influence Score (≥${WINNING_VARIANT_CRITERIA.MIN_INFLUENCE_SCORE}): ${analysisResults.meetsInfluenceScore}`);
    console.log(`🏆 Matches Must-Have Titles: ${analysisResults.matchesMustHaveTitles}`);
    console.log(`🎯 In Target Departments: ${analysisResults.inTargetDepartment}`);
    console.log(`✨ Optimized Members: ${analysisResults.optimized}`);
    
    console.log('\n🎯 Optimized First Premier Bank Buyer Group Summary:');
    console.log(`📊 Total Members: ${finalMembers.length}`);
    console.log(`👑 Decision Makers: ${roles.decision.length}`);
    console.log(`🚀 Champions: ${roles.champion.length}`);
    console.log(`👥 Stakeholders: ${roles.stakeholder.length}`);
    console.log(`🤝 Introducers: ${roles.introducer.length}`);
    
    console.log('\n🏆 Top Decision Makers:');
    roles.decision.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Criteria Match: ${member.criteriaMatch.overallScore}/3`);
      console.log(`   Message: ${member.winningVariantMessaging.urgency}`);
    });
    
    console.log('\n🚀 Top Champions:');
    roles.champion.slice(0, 3).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (Score: ${member.influenceScore})`);
      console.log(`   Criteria Match: ${member.criteriaMatch.overallScore}/3`);
      console.log(`   Message: ${member.winningVariantMessaging.urgency}`);
    });
    
    console.log('\n✅ Criteria Compliance:');
    console.log(`📏 Size Compliant: ${optimizedBuyerGroup.buyerGroup.metadata.criteriaCompliance.sizeCompliant ? '✅' : '❌'}`);
    console.log(`🎯 Influence Compliant: ${optimizedBuyerGroup.buyerGroup.metadata.criteriaCompliance.influenceCompliant ? '✅' : '❌'}`);
    console.log(`💼 Employment Verified: ${optimizedBuyerGroup.buyerGroup.metadata.criteriaCompliance.employmentVerified ? '✅' : '❌'}`);
    
    return optimizedBuyerGroup;
    
  } catch (error) {
    console.error('❌ Error analyzing buyer group quality:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting comprehensive buyer group quality analysis...');
    const optimizedBuyerGroup = await analyzeAndOptimizeBuyerGroup();
    console.log('\n✅ Buyer group optimization completed successfully!');
    console.log(`📊 Final buyer group has ${optimizedBuyerGroup.buyerGroup.totalMembers} verified, optimized members`);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { analyzeAndOptimizeBuyerGroup };
