const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

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
  },
  { 
    companyName: 'First Premier Bank', 
    industry: 'Banking',
    description: 'Regional Banking with AI Credit Models',
    aiUseCase: 'AI credit decisioning and risk modeling',
    targetDepartments: ['Risk Analytics', 'Credit', 'Data Science'],
    keyMessage: 'Prove your AI credit models reduce losses and increase approvals, not just accuracy'
  },
  { 
    companyName: 'Zuora', 
    industry: 'SaaS',
    description: 'Subscription Management with AI Churn Prediction',
    aiUseCase: 'AI churn prediction and subscription analytics',
    targetDepartments: ['Product Analytics', 'Data Science', 'Engineering'],
    keyMessage: 'Prove your AI churn models drive retention revenue, not just prediction accuracy'
  }
];

// Filter to executive-level members for $100K deals
function filterToExecutiveLevel(buyerGroup, company) {
  console.log(`   🔍 Filtering ${buyerGroup.totalMembers} members to executive level for ${company.companyName}...`);
  
  // Collect all members from all roles
  const allMembers = [];
  if (buyerGroup.roles) {
    Object.values(buyerGroup.roles).forEach(roleMembers => {
      if (Array.isArray(roleMembers)) {
        allMembers.push(...roleMembers);
      }
    });
  }
  
  if (allMembers.length === 0) {
    console.log(`   ⚠️ No members found to filter`);
    return buyerGroup;
  }

  console.log(`   📊 Found ${allMembers.length} total members across all roles`);

  // Filter members by title level and relevance to AI/ML/Data/Product/Engineering
  const filteredMembers = allMembers.filter(member => {
    const title = (member.title || '').toLowerCase();
    const name = (member.name || '').toLowerCase();
    
    // Must be director level or above
    const isExecutiveLevel = title.includes('chief') || 
                           title.includes('cfo') || 
                           title.includes('cto') || 
                           title.includes('cpo') || 
                           title.includes('vp') || 
                           title.includes('vice president') ||
                           title.includes('director') ||
                           title.includes('head of') ||
                           title.includes('board');
    
    // Must be relevant to AI/ML/Data/Product/Engineering/Finance
    const isRelevant = title.includes('data') || 
                      title.includes('analytics') || 
                      title.includes('ml') || 
                      title.includes('ai') || 
                      title.includes('product') || 
                      title.includes('engineering') || 
                      title.includes('finance') ||
                      title.includes('risk') ||
                      title.includes('credit') ||
                      title.includes('fraud') ||
                      title.includes('technology') ||
                      title.includes('digital') ||
                      title.includes('innovation') ||
                      title.includes('strategy') ||
                      title.includes('revenue') ||
                      title.includes('growth') ||
                      title.includes('marketing') ||
                      title.includes('operations') ||
                      title.includes('support');
    
    return isExecutiveLevel && isRelevant;
  });

  // Sort by influence score and take top 14
  const sortedMembers = filteredMembers
    .sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0))
    .slice(0, 14);

  console.log(`   📊 Filtered from ${allMembers.length} to ${sortedMembers.length} executive-level members`);
  
  // Update buyer group with filtered members
  const filteredBuyerGroup = {
    ...buyerGroup,
    totalMembers: sortedMembers.length
  };

  // Reassign roles based on filtered members
  const roles = {
    decision: [],
    champion: [],
    stakeholder: [],
    blocker: [],
    introducer: []
  };

  sortedMembers.forEach(member => {
    const title = (member.title || '').toLowerCase();
    const influenceScore = member.influenceScore || 0;
    
    if (title.includes('chief') || title.includes('cfo') || title.includes('cto') || title.includes('cpo') || title.includes('board')) {
      roles.decision.push(member);
    } else if (title.includes('vp') || title.includes('vice president')) {
      roles.champion.push(member);
    } else if (title.includes('director') || title.includes('head of')) {
      roles.stakeholder.push(member);
    } else {
      roles.stakeholder.push(member);
    }
  });

  filteredBuyerGroup.roles = roles;
  
  return filteredBuyerGroup;
}

// Add Winning Variant messaging to each member
function addWinningVariantMessaging(buyerGroup, company) {
  console.log(`   💬 Adding Winning Variant messaging for ${company.companyName}...`);
  
  // Process all members in all roles
  if (buyerGroup.roles) {
    Object.values(buyerGroup.roles).forEach(roleMembers => {
      if (Array.isArray(roleMembers)) {
        roleMembers.forEach(member => {
          const title = (member.title || '').toLowerCase();
          
          // Add personalized messaging based on role and company
          member.winningVariantMessaging = {
            painPoint: `Your team built AI features but can't prove business impact to the board`,
            solution: `Winning Variant measures the ROI of your AI initiatives inside Snowflake`,
            valueProp: company.keyMessage,
            urgency: `95% of AI pilots fail - prove yours is working with measurable data`,
            nextStep: `Schedule a demo to see how we can prove your AI ROI`
          };

          // Add specific use case messaging
          if (title.includes('data') || title.includes('analytics')) {
            member.winningVariantMessaging.specificUseCase = `Full-funnel analysis beyond isolated metrics - see the complete business impact of your AI initiatives`;
          } else if (title.includes('product')) {
            member.winningVariantMessaging.specificUseCase = `Prove that your AI product features drive user engagement and revenue, not just feature adoption`;
          } else if (title.includes('engineering')) {
            member.winningVariantMessaging.specificUseCase = `Show engineering impact on business outcomes - prove your AI infrastructure investments drive results`;
          } else if (title.includes('finance') || title.includes('cfo')) {
            member.winningVariantMessaging.specificUseCase = `Board wants ROI on AI investments - get the data you need to justify continued AI spending`;
          } else if (title.includes('risk') || title.includes('credit')) {
            member.winningVariantMessaging.specificUseCase = `Prove your AI risk models reduce losses and increase revenue, not just improve accuracy metrics`;
          } else if (title.includes('fraud')) {
            member.winningVariantMessaging.specificUseCase = `Show how your ML fraud detection drives revenue by reducing losses and increasing approval rates`;
          } else if (title.includes('marketing')) {
            member.winningVariantMessaging.specificUseCase = `Prove your AI marketing initiatives drive customer acquisition and revenue, not just engagement metrics`;
          } else if (title.includes('operations')) {
            member.winningVariantMessaging.specificUseCase = `Show how your AI operations improvements drive cost savings and efficiency gains`;
          }
        });
      }
    });
  }

  return buyerGroup;
}

async function filterExistingBuyerGroups() {
  console.log('🎯 Filtering existing buyer group data for Winning Variant demo...\n');
  console.log('Target: 4-14 executive-level members per company\n');

  const results = [];
  const failedCompanies = [];
  const dataDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');

  for (const company of companies) {
    console.log(`\n🔍 Processing: ${company.companyName}`);
    console.log(`   Industry: ${company.industry}`);
    console.log(`   AI Use Case: ${company.aiUseCase}`);
    console.log(`   Target Departments: ${company.targetDepartments.join(', ')}`);
    console.log(`   Key Message: ${company.keyMessage}`);
    
    try {
      // Try different possible filenames
      const possibleFiles = [
        `${company.companyName.toLowerCase().replace(/\s/g, '-')}-buyer-group-real.json`,
        `${company.companyName.toLowerCase().replace(/\s/g, '')}-buyer-group-real.json`,
        `${company.companyName.toLowerCase().replace(/\s/g, '-')}-strategic-buyer-group.json`,
        `${company.companyName.toLowerCase().replace(/\s/g, '')}-strategic-buyer-group.json`
      ];

      // Special cases for known files
      if (company.companyName === 'First Premier Bank') {
        possibleFiles.unshift('first-premier-bank-buyer-group-real.json');
      }
      if (company.companyName === 'Zuora') {
        possibleFiles.unshift('zuora,-inc.-buyer-group-real.json');
      }

      let dataFile = null;
      for (const filename of possibleFiles) {
        const filepath = path.join(dataDir, filename);
        if (fs.existsSync(filepath)) {
          dataFile = filepath;
          break;
        }
      }

      if (!dataFile) {
        console.log(`   ⚠️ No data file found for ${company.companyName}`);
        failedCompanies.push({ 
          companyName: company.companyName, 
          error: 'No data file found' 
        });
        continue;
      }

      console.log(`   📁 Loading data from: ${path.basename(dataFile)}`);
      const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      
      if (!rawData.buyerGroup) {
        console.log(`   ⚠️ No buyer group data in file`);
        failedCompanies.push({ 
          companyName: company.companyName, 
          error: 'No buyer group data in file' 
        });
        continue;
      }

      console.log(`   ✅ Found ${rawData.buyerGroup.totalMembers} initial buyer group members`);
      
      // Apply executive-level filtering
      const filteredResult = {
        ...rawData,
        buyerGroup: filterToExecutiveLevel(rawData.buyerGroup, company)
      };
      
      // Add Winning Variant messaging
      const enhancedResult = {
        ...filteredResult,
        buyerGroup: addWinningVariantMessaging(filteredResult.buyerGroup, company)
      };
      
      console.log(`   📊 Final: ${enhancedResult.buyerGroup.totalMembers} executive-level members`);
      
      // Log role distribution
      const roles = enhancedResult.buyerGroup.roles || {};
      console.log(`   👥 Role Distribution:`);
      console.log(`      Decision Makers: ${roles.decision?.length || 0}`);
      console.log(`      Champions: ${roles.champion?.length || 0}`);
      console.log(`      Stakeholders: ${roles.stakeholder?.length || 0}`);
      console.log(`      Blockers: ${roles.blocker?.length || 0}`);
      console.log(`      Introducers: ${roles.introducer?.length || 0}`);
      
      results.push({
        company: company,
        buyerGroup: enhancedResult.buyerGroup,
        quality: enhancedResult.quality,
        processingTime: enhancedResult.processingTime,
        timestamp: new Date().toISOString()
      });

      // Save to individual JSON file
      const filename = `${company.companyName.toLowerCase().replace(/\s/g, '-')}-buyer-group-enhanced.json`;
      const filepath = path.join(dataDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(enhancedResult, null, 2));
      console.log(`   📁 Enhanced data saved to: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${company.companyName}:`, error.message);
      failedCompanies.push({ 
        companyName: company.companyName, 
        error: error.message 
      });
    }
  }

  // Save comprehensive results
  const allResultsFile = path.join(dataDir, 'all-companies-buyer-groups-enhanced.json');
  fs.writeFileSync(allResultsFile, JSON.stringify({
    discoverySummary: {
      totalCompanies: companies.length,
      successfulCompanies: results.length,
      failedCompanies: failedCompanies.length,
      timestamp: new Date().toISOString()
    },
    companies: results,
    failures: failedCompanies
  }, null, 2));

  console.log('\n📊 ENHANCED Filtering Summary:');
  console.log('==============================');
  console.log(`✅ Successful: ${results.length}/${companies.length}`);
  console.log(`❌ Failed: ${failedCompanies.length}/${companies.length}`);
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

  if (failedCompanies.length > 0) {
    console.log('\n❌ Failed Companies:');
    failedCompanies.forEach(f => console.log(`   ${f.companyName}: ${f.error}`));
  }

  console.log('\n🎉 ENHANCED buyer group filtering complete!');
  console.log('All data is filtered to executive-level with Winning Variant messaging.');
  console.log('Ready for demo presentation!');

  return results;
}

// Run the filtering
filterExistingBuyerGroups().catch(console.error);
