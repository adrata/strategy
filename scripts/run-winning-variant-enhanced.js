const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Winning Variant companies with AI/ML use cases
const companies = [
  { 
    companyName: 'Match Group', 
    website: 'https://mtch.com',
    industry: 'Technology',
    description: 'Online Dating Platform with AI Matching',
    aiUseCase: 'AI matching algorithms for user compatibility',
    targetDepartments: ['Data Science', 'Product', 'Engineering'],
    keyMessage: 'Prove your AI matching algorithms drive subscription revenue, not just accuracy'
  },
  { 
    companyName: 'Brex', 
    website: 'https://brex.com',
    industry: 'FinTech',
    description: 'Corporate Credit Cards with AI Fraud Detection',
    aiUseCase: 'ML models for fraud detection and risk assessment',
    targetDepartments: ['ML/AI', 'Fraud Detection', 'Risk Analytics'],
    keyMessage: 'Prove your ML models reduce fraud losses and drive revenue, not just detection rates'
  },
  { 
    companyName: 'First Premier Bank', 
    website: 'https://firstpremier.com',
    industry: 'Banking',
    description: 'Regional Banking with AI Credit Models',
    aiUseCase: 'AI credit decisioning and risk modeling',
    targetDepartments: ['Risk Analytics', 'Credit', 'Data Science'],
    keyMessage: 'Prove your AI credit models reduce losses and increase approvals, not just accuracy'
  },
  { 
    companyName: 'Zuora', 
    website: 'https://zuora.com',
    industry: 'SaaS',
    description: 'Subscription Management with AI Churn Prediction',
    aiUseCase: 'AI churn prediction and subscription analytics',
    targetDepartments: ['Product Analytics', 'Data Science', 'Engineering'],
    keyMessage: 'Prove your AI churn models drive retention revenue, not just prediction accuracy'
  }
];

// Winning Variant Seller Profile
const WINNING_VARIANT_PROFILE = {
  company: 'Winning Variant',
  product: 'AI Impact Visibility Platform',
  productCategory: 'AI/ML ROI Analytics',
  pricePoint: '$100K+ annually',
  valueProposition: 'Measure business ROI of AI initiatives inside Snowflake',
  keyMessage: 'Close the AI Impact Gap - 95% of AI pilots fail, prove your AI ROI',
  deploymentModel: 'Snowflake-native (100% inside customer Snowflake account)',
  targetCustomers: 'Data-driven teams on Snowflake with AI/ML initiatives',
  targetDepartments: ['data science', 'product', 'engineering', 'analytics', 'finance'],
  mustHaveTitles: [
    'chief financial officer', 'cfo', 'chief technology officer', 'cto',
    'chief product officer', 'cpo', 'vp data science', 'vp engineering',
    'vp product', 'director analytics', 'director data science',
    'director engineering', 'director product', 'vp finance'
  ]
};

// Post-processing filter for executive-level targeting
function filterToExecutiveLevel(buyerGroup, company) {
  console.log(`   🔍 Filtering to executive level for ${company.companyName}...`);
  
  if (!buyerGroup.members || !Array.isArray(buyerGroup.members)) {
    console.log(`   ⚠️ No members found to filter`);
    return buyerGroup;
  }

  // Filter members by title level and relevance
  const filteredMembers = buyerGroup.members.filter(member => {
    const title = (member.title || '').toLowerCase();
    const name = (member.name || '').toLowerCase();
    
    // Must be director level or above
    const isExecutiveLevel = title.includes('chief') || 
                           title.includes('cfo') || 
                           title.includes('cto') || 
                           title.includes('cpo') || 
                           title.includes('vp') || 
                           title.includes('vice president') ||
                           title.includes('director');
    
    // Must be relevant to AI/ML/Data/Product/Engineering
    const isRelevant = title.includes('data') || 
                      title.includes('analytics') || 
                      title.includes('ml') || 
                      title.includes('ai') || 
                      title.includes('product') || 
                      title.includes('engineering') || 
                      title.includes('finance') ||
                      title.includes('risk') ||
                      title.includes('credit') ||
                      title.includes('fraud');
    
    return isExecutiveLevel && isRelevant;
  });

  // Sort by influence score and take top 14
  const sortedMembers = filteredMembers
    .sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0))
    .slice(0, 14);

  console.log(`   📊 Filtered from ${buyerGroup.members.length} to ${sortedMembers.length} executive-level members`);
  
  // Update buyer group with filtered members
  const filteredBuyerGroup = {
    ...buyerGroup,
    members: sortedMembers,
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
    
    if (title.includes('chief') || title.includes('cfo') || title.includes('cto') || title.includes('cpo')) {
      roles.decision.push(member);
    } else if (title.includes('vp') || title.includes('vice president')) {
      roles.champion.push(member);
    } else if (title.includes('director')) {
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
  
  if (!buyerGroup.members || !Array.isArray(buyerGroup.members)) {
    return buyerGroup;
  }

  buyerGroup.members.forEach(member => {
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
    }
  });

  return buyerGroup;
}

async function runEnhancedBuyerGroupDiscovery() {
  console.log('🎯 Starting ENHANCED buyer group discovery for Winning Variant demo...\n');
  console.log('Using BuyerGroupPipeline with Winning Variant targeting\n');
  console.log('Target: 4-14 executive-level members per company\n');

  try {
    // Import the pipeline
    const BuyerGroupPipeline = require('../src/platform/pipelines/pipelines/core/buyer-group-pipeline.js');
    const pipeline = new BuyerGroupPipeline();
    
    const results = [];
    const failedCompanies = [];

    for (const company of companies) {
      console.log(`\n🔍 Discovering buyer group for: ${company.companyName}`);
      console.log(`   Industry: ${company.industry}`);
      console.log(`   AI Use Case: ${company.aiUseCase}`);
      console.log(`   Target Departments: ${company.targetDepartments.join(', ')}`);
      console.log(`   Key Message: ${company.keyMessage}`);
      
      try {
        const result = await pipeline.processSingleCompany(company.companyName, {
          website: company.website,
          industry: company.industry,
          enrichmentLevel: 'enrich', // Full enrichment with contact info
          sellerProfile: WINNING_VARIANT_PROFILE
        });

        if (result && result.buyerGroup && result.buyerGroup.members) {
          console.log(`   ✅ Found ${result.buyerGroup.members.length} initial buyer group members`);
          
          // Apply executive-level filtering
          const filteredResult = {
            ...result,
            buyerGroup: filterToExecutiveLevel(result.buyerGroup, company)
          };
          
          // Add Winning Variant messaging
          const enhancedResult = {
            ...filteredResult,
            buyerGroup: addWinningVariantMessaging(filteredResult.buyerGroup, company)
          };
          
          console.log(`   📊 Final: ${enhancedResult.buyerGroup.totalMembers} executive-level members`);
          console.log(`   📈 Confidence: ${enhancedResult.quality?.overallConfidence || 0}%`);
          
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
          const filename = `${company.companyName.toLowerCase().replace(/\s/g, '-')}-buyer-group-real.json`;
          const filepath = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data', filename);
          
          // Ensure directory exists
          const dir = path.dirname(filepath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          fs.writeFileSync(filepath, JSON.stringify(enhancedResult, null, 2));
          console.log(`   📁 Enhanced data saved to: ${filepath}`);
          
        } else {
          throw new Error('No buyer group data returned from pipeline');
        }

      } catch (error) {
        console.error(`❌ Error discovering ${company.companyName}:`, error.message);
        failedCompanies.push({ 
          companyName: company.companyName, 
          error: error.message 
        });
      }
    }

    // Save comprehensive results
    const outputDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const allResultsFile = path.join(outputDir, 'all-companies-buyer-groups-real.json');
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

    console.log('\n📊 ENHANCED Discovery Summary:');
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

    console.log('\n🎉 ENHANCED buyer group discovery complete!');
    console.log('All data is 100% real with executive-level filtering and Winning Variant messaging.');
    console.log('Ready for demo presentation!');

  } catch (error) {
    console.error('❌ Failed to initialize pipeline:', error.message);
  }
}

// Run the enhanced discovery
runEnhancedBuyerGroupDiscovery().catch(console.error);
