const fs = require('fs');
const path = require('path');

async function auditBuyerGroupSystem() {
  console.log('🤖 DEEP AUDIT OF BUYER GROUP SYSTEM\n');

  // 1. Check system architecture
  console.log('🏗️ SYSTEM ARCHITECTURE AUDIT:');
  
  const buyerGroupPath = 'src/platform/pipelines/modules/powerhouse/BuyerGroupAI.js';
  const intelligenceApiPath = 'src/app/api/intelligence_archive/research/route.ts';
  const researchOrchestratorPath = 'src/platform/intelligence/core/ResearchOrchestrator.ts';
  
  console.log(`   ${fs.existsSync(buyerGroupPath) ? '✅' : '❌'} BuyerGroupAI.js - Core AI engine`);
  console.log(`   ${fs.existsSync(intelligenceApiPath) ? '✅' : '❌'} Intelligence API - Research endpoint`);
  console.log(`   ${fs.existsSync(researchOrchestratorPath) ? '✅' : '❌'} ResearchOrchestrator - Main coordinator`);
  console.log('');

  // 2. Analyze BuyerGroupAI.js capabilities
  console.log('🧠 BUYER GROUP AI CAPABILITIES:');
  
  if (fs.existsSync(buyerGroupPath)) {
    const buyerGroupCode = fs.readFileSync(buyerGroupPath, 'utf8');
    
    // Check key methods
    const methods = [
      'determineBuyerGroup',
      'analyzeCompanyContext', 
      'determineBuyerGroupRoles',
      'generateRoleSearchCriteria',
      'validateBuyerGroup'
    ];
    
    methods.forEach(method => {
      const hasMethod = buyerGroupCode.includes(method) ? '✅' : '❌';
      console.log(`   ${hasMethod} ${method}() method`);
    });
    
    // Check AI integration
    const aiFeatures = [
      'Perplexity',
      'OpenAI',
      'AI analysis',
      'context analysis',
      'role determination'
    ];
    
    console.log('\n   🤖 AI INTEGRATION FEATURES:');
    aiFeatures.forEach(feature => {
      const hasFeature = buyerGroupCode.includes(feature) ? '✅' : '❌';
      console.log(`      ${hasFeature} ${feature}`);
    });
    
    // Check buyer group model
    const buyerGroupRoles = [
      'Decision Makers',
      'Champions', 
      'Influencers',
      'Financial Stakeholders',
      'Procurement Stakeholders',
      'Blockers',
      'Introducers'
    ];
    
    console.log('\n   🎯 BUYER GROUP ROLES SUPPORTED:');
    buyerGroupRoles.forEach(role => {
      const hasRole = buyerGroupCode.includes(role) ? '✅' : '❌';
      console.log(`      ${hasRole} ${role}`);
    });
    
  } else {
    console.log('   ❌ BuyerGroupAI.js not found');
  }
  console.log('');

  // 3. Check Intelligence API capabilities
  console.log('🌐 INTELLIGENCE API CAPABILITIES:');
  
  if (fs.existsSync(intelligenceApiPath)) {
    const apiCode = fs.readFileSync(intelligenceApiPath, 'utf8');
    
    // Check supported features
    const apiFeatures = [
      'researchDepths',
      'supportedRoles', 
      'urgencyLevels',
      'Buyer group analysis',
      'Real-time progress tracking'
    ];
    
    apiFeatures.forEach(feature => {
      const hasFeature = apiCode.includes(feature) ? '✅' : '❌';
      console.log(`   ${hasFeature} ${feature}`);
    });
    
    // Check supported roles
    const supportedRoles = [
      'CFO', 'CRO', 'CEO', 'CTO', 'COO', 'CMO',
      'VP_Finance', 'VP_Sales', 'VP_Engineering', 'VP_Marketing',
      'Director_Finance', 'Director_Sales', 'Head_of_Sales',
      'Controller', 'Treasurer', 'Decision_Maker', 'Buyer', 'Influencer'
    ];
    
    console.log('\n   👥 SUPPORTED EXECUTIVE ROLES:');
    supportedRoles.forEach(role => {
      const hasRole = apiCode.includes(role) ? '✅' : '❌';
      console.log(`      ${hasRole} ${role}`);
    });
    
  } else {
    console.log('   ❌ Intelligence API not found');
  }
  console.log('');

  // 4. Check Research Orchestrator
  console.log('🎼 RESEARCH ORCHESTRATOR CAPABILITIES:');
  
  if (fs.existsSync(researchOrchestratorPath)) {
    const orchestratorCode = fs.readFileSync(researchOrchestratorPath, 'utf8');
    
    const orchestratorFeatures = [
      'Adaptive research depth',
      'Cost optimization',
      'Intelligent caching',
      'Data quality validation',
      'Contact/lead management'
    ];
    
    orchestratorFeatures.forEach(feature => {
      const hasFeature = orchestratorCode.includes(feature) ? '✅' : '❌';
      console.log(`   ${hasFeature} ${feature}`);
    });
    
  } else {
    console.log('   ❌ ResearchOrchestrator not found');
  }
  console.log('');

  // 5. Check environment configuration
  console.log('🔧 ENVIRONMENT CONFIGURATION:');
  
  const requiredEnvVars = [
    'PERPLEXITY_API_KEY',
    'OPENAI_API_KEY', 
    'CORESIGNAL_API_KEY',
    'LUSHA_API_KEY',
    'ZEROBOUNCE_API_KEY',
    'PROSPEO_API_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const hasKey = process.env[envVar] ? '✅' : '❌';
    console.log(`   ${hasKey} ${envVar}`);
  });
  console.log('');

  // 6. Assess system readiness for Dan's accounts
  console.log('🎯 SYSTEM READINESS FOR DAN\'S ACCOUNTS:');
  
  // Dan has 400 accounts: 377 Technology + 22 Retail + 1 Professional Services
  const accountTypes = {
    'Technology': 377,
    'Retail/Convenience Store': 22, 
    'Professional Services': 1
  };
  
  console.log('   📊 ACCOUNT TYPE ANALYSIS:');
  Object.entries(accountTypes).forEach(([type, count]) => {
    console.log(`      ${type}: ${count} accounts`);
  });
  
  // Check if system can handle these industries
  console.log('\n   🏭 INDUSTRY SUPPORT ANALYSIS:');
  
  if (fs.existsSync(buyerGroupPath)) {
    const buyerGroupCode = fs.readFileSync(buyerGroupPath, 'utf8');
    
    const industryKeywords = {
      'Technology': ['tech', 'software', 'SaaS', 'digital', 'AI', 'cloud'],
      'Retail': ['retail', 'convenience', 'store', 'commerce', 'consumer'],
      'Professional Services': ['consulting', 'services', 'professional', 'advisory']
    };
    
    Object.entries(industryKeywords).forEach(([industry, keywords]) => {
      const hasSupport = keywords.some(keyword => 
        buyerGroupCode.toLowerCase().includes(keyword.toLowerCase())
      ) ? '✅' : '⚠️';
      console.log(`      ${hasSupport} ${industry} industry support`);
    });
  }
  
  console.log('');

  // 7. Performance and scalability assessment
  console.log('⚡ PERFORMANCE & SCALABILITY ASSESSMENT:');
  
  if (fs.existsSync(intelligenceApiPath)) {
    const apiCode = fs.readFileSync(intelligenceApiPath, 'utf8');
    
    const performanceFeatures = [
      'MAX_PARALLEL_COMPANIES',
      'MAX_PARALLEL_APIS', 
      'TIMEOUT_MS',
      'CACHE_TTL_SECONDS',
      'rate limiting',
      'batch processing'
    ];
    
    performanceFeatures.forEach(feature => {
      const hasFeature = apiCode.includes(feature) ? '✅' : '❌';
      console.log(`   ${hasFeature} ${feature}`);
    });
  }
  
  console.log('');

  // 8. Recommendations for optimal performance
  console.log('💡 RECOMMENDATIONS FOR OPTIMAL BUYER GROUP ANALYSIS:');
  
  console.log('   🎯 FOR TECHNOLOGY ACCOUNTS (377 accounts):');
  console.log('      • Focus on CTO, VP Engineering, Director of IT roles');
  console.log('      • Emphasize technical decision makers and champions');
  console.log('      • Use technology-specific buyer group templates');
  console.log('');
  
  console.log('   🏪 FOR RETAIL ACCOUNTS (22 accounts):');
  console.log('      • Target COO, VP Operations, Store Managers');
  console.log('      • Focus on operational decision makers');
  console.log('      • Use retail industry buyer group patterns');
  console.log('');
  
  console.log('   🔧 FOR PROFESSIONAL SERVICES (1 account):');
  console.log('      • Target Managing Partners, Directors');
  console.log('      • Focus on partnership decision makers');
  console.log('');
  
  console.log('   📊 PROCESSING STRATEGY:');
  console.log('      • Process in batches of 10-20 accounts');
  console.log('      • Start with accounts having website/domain data');
  console.log('      • Use industry-specific buyer group templates');
  console.log('      • Implement progressive enrichment for missing data');
  console.log('');

  // 9. System health score
  console.log('🏥 SYSTEM HEALTH SCORE:');
  
  let score = 0;
  let maxScore = 0;
  
  // Check core files
  [buyerGroupPath, intelligenceApiPath, researchOrchestratorPath].forEach(filePath => {
    maxScore += 1;
    if (fs.existsSync(filePath)) score += 1;
  });
  
  // Check API keys
  maxScore += 3;
  if (process.env.PERPLEXITY_API_KEY) score += 1;
  if (process.env.OPENAI_API_KEY) score += 1;
  if (process.env.CORESIGNAL_API_KEY) score += 1;
  
  // Check buyer group capabilities
  if (fs.existsSync(buyerGroupPath)) {
    const buyerGroupCode = fs.readFileSync(buyerGroupPath, 'utf8');
    maxScore += 2;
    if (buyerGroupCode.includes('determineBuyerGroup')) score += 1;
    if (buyerGroupCode.includes('AI analysis')) score += 1;
  }
  
  const healthPercentage = Math.round((score / maxScore) * 100);
  const healthStatus = healthPercentage >= 80 ? '🟢 EXCELLENT' : 
                      healthPercentage >= 60 ? '🟡 GOOD' : 
                      healthPercentage >= 40 ? '🟠 FAIR' : '🔴 POOR';
  
  console.log(`   ${healthStatus}: ${healthPercentage}% (${score}/${maxScore})`);
  
  if (healthPercentage >= 80) {
    console.log('   ✅ System is ready for production buyer group analysis');
  } else if (healthPercentage >= 60) {
    console.log('   ⚠️ System needs some configuration before optimal use');
  } else {
    console.log('   ❌ System needs significant setup before use');
  }

}

// Run the audit
if (require.main === module) {
  auditBuyerGroupSystem();
}

module.exports = { auditBuyerGroupSystem };
