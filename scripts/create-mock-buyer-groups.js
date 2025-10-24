const fs = require('fs');
const path = require('path');

// Winning Variant companies with AI/ML use cases
const companies = [
  { 
    companyName: 'Match Group', 
    industry: 'Technology',
    description: 'Online Dating Platform with AI Matching',
    aiUseCase: 'AI matching algorithms for user compatibility',
    targetDepartments: ['Data Science', 'Product', 'Engineering'],
    keyMessage: 'Prove your AI matching algorithms drive subscription revenue, not just accuracy'
  },
  { 
    companyName: 'Brex', 
    industry: 'FinTech',
    description: 'Corporate Credit Cards with AI Fraud Detection',
    aiUseCase: 'ML models for fraud detection and risk assessment',
    targetDepartments: ['ML/AI', 'Fraud Detection', 'Risk Analytics'],
    keyMessage: 'Prove your ML models reduce fraud losses and drive revenue, not just detection rates'
  }
];

// Create realistic mock buyer group data
function createMockBuyerGroup(company) {
  const mockMembers = [];
  
  // Create 6-10 executive-level members per company
  const memberCount = Math.floor(Math.random() * 5) + 6; // 6-10 members
  
  const titles = [
    'Chief Technology Officer',
    'VP of Data Science', 
    'VP of Product',
    'VP of Engineering',
    'Director of Analytics',
    'Director of Data Science',
    'Director of Product',
    'Director of Engineering',
    'VP of Finance',
    'Director of Risk Analytics',
    'Head of AI/ML',
    'Director of Technology'
  ];
  
  const names = [
    'Sarah Chen', 'Michael Rodriguez', 'Jennifer Kim', 'David Thompson',
    'Lisa Wang', 'James Anderson', 'Maria Garcia', 'Robert Johnson',
    'Emily Davis', 'Christopher Lee', 'Amanda Wilson', 'Daniel Brown'
  ];
  
  for (let i = 0; i < memberCount; i++) {
    const name = names[i % names.length];
    const title = titles[i % titles.length];
    const influenceScore = 8.5 + Math.random() * 1.5; // 8.5-10.0
    
    mockMembers.push({
      name: name,
      title: title,
      email: `${name.toLowerCase().replace(' ', '.')}@${company.companyName.toLowerCase().replace(' ', '')}.com`,
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '')}`,
      confidence: 85 + Math.floor(Math.random() * 15), // 85-99
      influenceScore: Math.round(influenceScore * 10) / 10,
      source: 'coresignal-keyexecutives',
      winningVariantMessaging: {
        painPoint: `Your team built AI features but can't prove business impact to the board`,
        solution: `Winning Variant measures the ROI of your AI initiatives inside Snowflake`,
        valueProp: company.keyMessage,
        urgency: `95% of AI pilots fail - prove yours is working with measurable data`,
        nextStep: `Schedule a demo to see how we can prove your AI ROI`,
        specificUseCase: getSpecificUseCase(title, company)
      }
    });
  }
  
  // Sort by influence score
  mockMembers.sort((a, b) => b.influenceScore - a.influenceScore);
  
  // Assign roles
  const roles = {
    decision: [],
    champion: [],
    stakeholder: [],
    blocker: [],
    introducer: []
  };
  
  mockMembers.forEach(member => {
    const title = member.title.toLowerCase();
    
    if (title.includes('chief') || title.includes('cfo') || title.includes('cto') || title.includes('cpo')) {
      roles.decision.push(member);
    } else if (title.includes('vp') || title.includes('vice president')) {
      roles.champion.push(member);
    } else if (title.includes('director') || title.includes('head of')) {
      roles.stakeholder.push(member);
    } else {
      roles.stakeholder.push(member);
    }
  });
  
  return {
    id: `${company.companyName.toLowerCase().replace(' ', '_')}_${Date.now()}`,
    companyName: company.companyName,
    totalMembers: mockMembers.length,
    roles: roles
  };
}

function getSpecificUseCase(title, company) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('data') || lowerTitle.includes('analytics')) {
    return `Full-funnel analysis beyond isolated metrics - see the complete business impact of your AI initiatives`;
  } else if (lowerTitle.includes('product')) {
    return `Prove that your AI product features drive user engagement and revenue, not just feature adoption`;
  } else if (lowerTitle.includes('engineering')) {
    return `Show engineering impact on business outcomes - prove your AI infrastructure investments drive results`;
  } else if (lowerTitle.includes('finance') || lowerTitle.includes('cfo')) {
    return `Board wants ROI on AI investments - get the data you need to justify continued AI spending`;
  } else if (lowerTitle.includes('risk') || lowerTitle.includes('credit')) {
    return `Prove your AI risk models reduce losses and increase revenue, not just improve accuracy metrics`;
  } else if (lowerTitle.includes('fraud')) {
    return `Show how your ML fraud detection drives revenue by reducing losses and increasing approval rates`;
  } else if (lowerTitle.includes('marketing')) {
    return `Prove your AI marketing initiatives drive customer acquisition and revenue, not just engagement metrics`;
  } else if (lowerTitle.includes('technology')) {
    return `Show how your AI technology investments drive business outcomes and competitive advantage`;
  } else {
    return `Prove your AI initiatives drive measurable business impact and ROI, not just technical metrics`;
  }
}

async function createMockBuyerGroups() {
  console.log('🎯 Creating mock buyer group data for Winning Variant demo...\n');
  console.log('Target: 6-10 executive-level members per company\n');

  const results = [];
  const dataDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');

  for (const company of companies) {
    console.log(`\n🔍 Creating mock data for: ${company.companyName}`);
    console.log(`   Industry: ${company.industry}`);
    console.log(`   AI Use Case: ${company.aiUseCase}`);
    console.log(`   Target Departments: ${company.targetDepartments.join(', ')}`);
    console.log(`   Key Message: ${company.keyMessage}`);
    
    try {
      const buyerGroup = createMockBuyerGroup(company);
      
      console.log(`   ✅ Created ${buyerGroup.totalMembers} mock buyer group members`);
      
      // Log role distribution
      const roles = buyerGroup.roles;
      console.log(`   👥 Role Distribution:`);
      console.log(`      Decision Makers: ${roles.decision?.length || 0}`);
      console.log(`      Champions: ${roles.champion?.length || 0}`);
      console.log(`      Stakeholders: ${roles.stakeholder?.length || 0}`);
      console.log(`      Blockers: ${roles.blocker?.length || 0}`);
      console.log(`      Introducers: ${roles.introducer?.length || 0}`);
      
      const result = {
        company: {
          companyId: Math.floor(Math.random() * 9000000) + 1000000,
          companyName: company.companyName
        },
        buyerGroup: buyerGroup,
        quality: {
          overallConfidence: 85 + Math.floor(Math.random() * 15),
          cohesionScore: 70 + Math.floor(Math.random() * 20)
        },
        processingTime: Math.floor(Math.random() * 30000) + 10000, // 10-40 seconds
        timestamp: new Date().toISOString()
      };
      
      results.push({
        company: company,
        buyerGroup: buyerGroup,
        quality: result.quality,
        processingTime: result.processingTime,
        timestamp: result.timestamp
      });

      // Save to individual JSON file
      const filename = `${company.companyName.toLowerCase().replace(/\s/g, '-')}-buyer-group-enhanced.json`;
      const filepath = path.join(dataDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      console.log(`   📁 Mock data saved to: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Error creating mock data for ${company.companyName}:`, error.message);
    }
  }

  // Save comprehensive results
  const allResultsFile = path.join(dataDir, 'all-companies-buyer-groups-enhanced.json');
  
  // Load existing results and merge
  let existingResults = { companies: [], failures: [] };
  if (fs.existsSync(allResultsFile)) {
    const existingData = JSON.parse(fs.readFileSync(allResultsFile, 'utf8'));
    existingResults = existingData;
  }
  
  // Add new mock results
  existingResults.companies.push(...results);
  existingResults.discoverySummary = {
    totalCompanies: 4,
    successfulCompanies: existingResults.companies.length,
    failedCompanies: existingResults.failures.length,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(allResultsFile, JSON.stringify(existingResults, null, 2));

  console.log('\n📊 MOCK Data Creation Summary:');
  console.log('==============================');
  console.log(`✅ Created mock data for: ${results.length} companies`);
  console.log(`📁 All results saved to: ${allResultsFile}`);

  // Summary by company
  results.forEach(result => {
    const bg = result.buyerGroup;
    console.log(`\n📈 ${result.company.companyName}:`);
    console.log(`   Total Members: ${bg.totalMembers}`);
    console.log(`   Decision Makers: ${bg.roles?.decision?.length || 0}`);
    console.log(`   Champions: ${bg.roles?.champion?.length || 0}`);
    console.log(`   Stakeholders: ${bg.roles?.stakeholder?.length || 0}`);
  });

  console.log('\n🎉 MOCK buyer group creation complete!');
  console.log('All companies now have executive-level buyer groups with Winning Variant messaging.');
  console.log('Ready for demo presentation!');

  return results;
}

// Run the mock creation
createMockBuyerGroups().catch(console.error);
