const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = 'wv/part-00000-032e66b6-9376-4c8d-8865-a5a3dc35bfad-c000.json';
const OUTPUT_JSON = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-from-coresignal.json';
const OUTPUT_CSV = 'src/app/(locker)/private/winning-variant/data/first-premier-bank-buyer-group-from-coresignal.csv';

// First Premier Bank identifiers
const FIRST_PREMIER_IDENTIFIERS = [
  'first premier bank',
  'firstpremierbank',
  'first premier',
  'firstpremier',
  'first premier bank/premier bankcard',
  'premier bankcard',
  'firstpremier.com'
];

// Target departments and titles for Winning Variant's $100K AI ROI product
const TARGET_ROLES = {
  decision: [
    'chief financial officer', 'cfo', 'chief technology officer', 'cto',
    'chief product officer', 'cpo', 'chief executive officer', 'ceo',
    'director of finance', 'director finance', 'director of data',
    'director data', 'director of analytics', 'director analytics',
    'director of product', 'director product', 'director of engineering',
    'director engineering', 'director of technology', 'director technology',
    'head of finance', 'head of data', 'head of analytics', 'head of product',
    'head of engineering', 'head of technology', 'president', 'vp',
    'vice president'
  ],
  champion: [
    'vp data science', 'vp data', 'vp analytics', 'vp product',
    'vp engineering', 'vp technology', 'vp finance', 'vice president data',
    'vice president analytics', 'vice president product', 'vice president engineering',
    'vice president finance', 'senior director data', 'senior director analytics',
    'senior director product', 'senior director engineering', 'senior director finance',
    'senior manager', 'senior analyst', 'senior business analyst'
  ],
  stakeholder: [
    'senior manager data', 'senior manager analytics', 'senior manager product',
    'senior manager engineering', 'senior manager finance', 'manager data',
    'manager analytics', 'manager product', 'manager engineering', 'manager finance',
    'lead data scientist', 'lead analyst', 'lead product manager', 'lead engineer',
    'principal data scientist', 'principal analyst', 'principal product manager',
    'business analyst', 'data analyst', 'product manager', 'project manager'
  ],
  introducer: [
    'revenue operations', 'revops', 'sales operations', 'business development',
    'strategic partnerships', 'commercial operations', 'revenue management',
    'sales strategy', 'business strategy', 'corporate development',
    'mortgage banker', 'banker', 'relationship manager'
  ]
};

// Influence score calculation based on title seniority
function calculateInfluenceScore(title) {
  const titleLower = title.toLowerCase();
  
  // C-level executives
  if (titleLower.includes('chief') || titleLower.includes('ceo') || titleLower.includes('cfo') || 
      titleLower.includes('cto') || titleLower.includes('cpo') || titleLower.includes('president')) {
    return 9.5;
  }
  
  // VPs and Senior Directors
  if (titleLower.includes('vp') || titleLower.includes('vice president') || 
      titleLower.includes('senior director')) {
    return 9.0;
  }
  
  // Directors
  if (titleLower.includes('director') || titleLower.includes('head of')) {
    return 8.5;
  }
  
  // Senior Managers and Principals
  if (titleLower.includes('senior manager') || titleLower.includes('principal') || 
      titleLower.includes('lead') || titleLower.includes('senior')) {
    return 8.0;
  }
  
  // Managers
  if (titleLower.includes('manager')) {
    return 7.5;
  }
  
  // Analysts and Specialists
  if (titleLower.includes('analyst') || titleLower.includes('specialist')) {
    return 7.0;
  }
  
  // Default for other roles
  return 6.5;
}

// Generate email from name and company domain
function generateEmail(name, companyDomain = 'firstpremier.com') {
  const cleanName = name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '.');
  return `${cleanName}@${companyDomain}`;
}

// Generate LinkedIn URL from name
function generateLinkedInUrl(name) {
  const cleanName = name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '');
  return `https://linkedin.com/in/${cleanName}`;
}

// Determine buyer group role based on title
function determineBuyerRole(title) {
  const titleLower = title.toLowerCase();
  
  for (const [role, keywords] of Object.entries(TARGET_ROLES)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return role;
      }
    }
  }
  
  return 'stakeholder'; // Default role
}

// Check if employee is currently at First Premier Bank
function isCurrentAtFirstPremier(employee) {
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

// Extract current title from experience
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

// Add Winning Variant messaging based on role
function getWinningVariantMessaging(member) {
  const role = member.buyerRole;
  const title = member.title.toLowerCase();
  
  if (role === 'decision' || title.includes('finance') || title.includes('cfo')) {
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "95% of generative AI pilots fail to show business impact. Our Snowflake-native platform helps you prove AI ROI and justify your $100K+ AI investments with measurable business outcomes.",
      valueProp: "ROI measurement and AI investment justification for executive decision makers",
      callToAction: "Schedule a 15-minute demo to see how we help CFOs measure AI ROI"
    };
  }
  
  if (role === 'champion' && (title.includes('data') || title.includes('analytics'))) {
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI", 
      message: "As a data science leader, you understand the challenge of measuring AI impact. Our platform gives you the visibility to prove your AI initiatives are driving real business value.",
      valueProp: "Technical champions can demonstrate AI success with measurable outcomes",
      callToAction: "See how we help data teams prove AI business impact"
    };
  }
  
  if (role === 'champion' && (title.includes('product') || title.includes('engineering'))) {
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Track the business impact of your AI products and engineering initiatives. Our Snowflake-native platform provides real-time ROI visibility for your AI investments.",
      valueProp: "Product and engineering leaders can track AI initiative success",
      callToAction: "Learn how we help teams measure AI project success"
    };
  }
  
  if (role === 'introducer') {
    return {
      subject: "Close the AI Impact Gap - Measure Your AI ROI",
      message: "Help your CFO understand the business impact of AI investments. Our platform provides the ROI data needed to justify and optimize AI spending.",
      valueProp: "Introducers can connect AI teams with budget holders for ROI discussions",
      callToAction: "Connect your data team with budget decision makers"
    };
  }
  
  // Default messaging
  return {
    subject: "Close the AI Impact Gap - Measure Your AI ROI",
    message: "Join the 5% of companies that successfully measure AI ROI. Our Snowflake-native platform helps you prove the business impact of your AI initiatives.",
    valueProp: "Stakeholders can track and optimize AI investments for maximum business impact",
    callToAction: "Discover how we help teams measure AI success"
  };
}

// Process the large JSON file line by line
async function processCoreSignalData() {
  console.log('🔍 Processing CoreSignal data for First Premier Bank buyer group...');
  
  const buyerGroupMembers = [];
  let totalProcessed = 0;
  let firstPremierEmployees = 0;
  
  try {
    const data = fs.readFileSync(INPUT_FILE, 'utf8');
    const lines = data.trim().split('\n');
    
    console.log(`📊 Processing ${lines.length} employee records...`);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const employee = JSON.parse(line);
        totalProcessed++;
        
        // Check if employee is currently at First Premier Bank
        if (isCurrentAtFirstPremier(employee)) {
          firstPremierEmployees++;
          
          const currentTitle = getCurrentTitle(employee);
          const buyerRole = determineBuyerRole(currentTitle);
          const influenceScore = calculateInfluenceScore(currentTitle);
          
          // Only include if influence score is high enough for $100K product
          if (influenceScore >= 6.5) {
            const member = {
              name: employee.full_name || employee.first_name + ' ' + employee.last_name || 'Unknown',
              title: currentTitle,
              email: generateEmail(employee.full_name || 'unknown'),
              phone: '+1-555-0000', // Placeholder
              linkedin: employee.profile_url || generateLinkedInUrl(employee.full_name || 'unknown'),
              confidence: Math.min(95, Math.max(70, influenceScore * 10)),
              influenceScore: influenceScore,
              source: 'coresignal-employee-data',
              buyerRole: buyerRole,
              location: employee.location || 'Unknown',
              originalData: {
                id: employee.id,
                headline: employee.headline,
                experience: employee.experience?.filter(exp => exp.is_current) || []
              }
            };
            
            // Add Winning Variant messaging
            member.winningVariantMessaging = getWinningVariantMessaging(member);
            
            buyerGroupMembers.push(member);
          }
        }
        
        if (totalProcessed % 100 === 0) {
          console.log(`📈 Processed ${totalProcessed} employees, found ${firstPremierEmployees} at First Premier Bank`);
        }
        
      } catch (parseError) {
        console.warn(`⚠️  Error parsing line ${totalProcessed}: ${parseError.message}`);
        continue;
      }
    }
    
    console.log(`✅ Processing complete: ${totalProcessed} total, ${firstPremierEmployees} at First Premier Bank`);
    
    // Sort by influence score and limit to 14 members
    buyerGroupMembers.sort((a, b) => b.influenceScore - a.influenceScore);
    const finalMembers = buyerGroupMembers.slice(0, 14);
    
    // Group by buyer roles
    const roles = {
      decision: finalMembers.filter(m => m.buyerRole === 'decision'),
      champion: finalMembers.filter(m => m.buyerRole === 'champion'),
      stakeholder: finalMembers.filter(m => m.buyerRole === 'stakeholder'),
      introducer: finalMembers.filter(m => m.buyerRole === 'introducer')
    };
    
    // Create the final buyer group structure
    const buyerGroup = {
      company: {
        companyId: "7578901",
        companyName: "First PREMIER Bank"
      },
      buyerGroup: {
        id: `first_premier_bank_${Date.now()}`,
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
          targetDepartments: ["data science", "product", "engineering", "analytics", "finance"],
          dealSize: "$100K+ annually",
          sellerCompany: "Winning Variant"
        },
        metadata: {
          source: 'coresignal-employee-data',
          processedAt: new Date().toISOString(),
          totalEmployeesProcessed: totalProcessed,
          firstPremierEmployeesFound: firstPremierEmployees,
          filterCriteria: 'Current employees with influence score >= 6.5',
          roleDistribution: {
            decision: roles.decision.length,
            champion: roles.champion.length,
            stakeholder: roles.stakeholder.length,
            introducer: roles.introducer.length
          }
        }
      }
    };
    
    // Save JSON output
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(buyerGroup, null, 2));
    console.log(`💾 Saved buyer group JSON: ${OUTPUT_JSON}`);
    
    // Save CSV output
    saveCSV(finalMembers);
    console.log(`💾 Saved buyer group CSV: ${OUTPUT_CSV}`);
    
    // Display summary
    console.log('\n🎯 First Premier Bank Buyer Group Summary:');
    console.log(`📊 Total Members: ${finalMembers.length}`);
    console.log(`👑 Decision Makers: ${roles.decision.length}`);
    console.log(`🚀 Champions: ${roles.champion.length}`);
    console.log(`👥 Stakeholders: ${roles.stakeholder.length}`);
    console.log(`🤝 Introducers: ${roles.introducer.length}`);
    
    console.log('\n👥 Top Members:');
    finalMembers.slice(0, 5).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - ${member.title} (${member.buyerRole}, Score: ${member.influenceScore})`);
    });
    
    return buyerGroup;
    
  } catch (error) {
    console.error('❌ Error processing CoreSignal data:', error);
    throw error;
  }
}

// Save CSV output for easy review
function saveCSV(members) {
  const headers = [
    'Name', 'Title', 'Email', 'LinkedIn', 'Buyer Role', 'Influence Score', 
    'Confidence', 'Source', 'Winning Variant Subject', 'Value Proposition'
  ];
  
  const csvRows = [headers.join(',')];
  
  members.forEach(member => {
    const row = [
      `"${member.name}"`,
      `"${member.title}"`,
      `"${member.email}"`,
      `"${member.linkedin}"`,
      `"${member.buyerRole}"`,
      member.influenceScore,
      member.confidence,
      `"${member.source}"`,
      `"${member.winningVariantMessaging.subject}"`,
      `"${member.winningVariantMessaging.valueProp}"`
    ];
    csvRows.push(row.join(','));
  });
  
  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n'));
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting First Premier Bank buyer group extraction from CoreSignal data...');
    console.log(`📁 Input file: ${INPUT_FILE}`);
    console.log(`📁 Output JSON: ${OUTPUT_JSON}`);
    console.log(`📁 Output CSV: ${OUTPUT_CSV}`);
    
    const buyerGroup = await processCoreSignalData();
    
    console.log('\n✅ Buyer group extraction completed successfully!');
    console.log(`📊 Found ${buyerGroup.buyerGroup.totalMembers} qualified members`);
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processCoreSignalData };
