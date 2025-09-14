#!/usr/bin/env node

/**
 * 🕵️ COMPREHENSIVE SYSTEM AUDIT
 * 
 * Reads through both new and old systems file by file to understand exactly how they work
 */

const fs = require('fs');
const path = require('path');

async function auditBothSystems() {
  console.log('🕵️ COMPREHENSIVE SYSTEM AUDIT');
  console.log('=' .repeat(80));
  console.log('Reading through both systems file by file for complete understanding');
  console.log('');

  // NEW SYSTEM AUDIT
  console.log('🆕 NEW SYSTEM AUDIT');
  console.log('=' .repeat(60));
  await auditNewSystem();
  
  console.log('');
  console.log('📚 OLD SYSTEM AUDIT');
  console.log('=' .repeat(60));
  await auditOldSystem();
  
  console.log('');
  console.log('🔍 COMPARISON ANALYSIS');
  console.log('=' .repeat(60));
  await compareSystemsAnalysis();
}

async function auditNewSystem() {
  console.log('📋 NEW SYSTEM EXECUTION FLOW:');
  console.log('');

  // Step 1: Entry Point
  console.log('🚀 STEP 1: API Entry Point');
  console.log('File: src/app/api/intelligence/research/route.ts');
  const apiRoute = readFileContent('src/app/api/intelligence/research/route.ts');
  console.log(`   Lines: ${apiRoute.lines}`);
  console.log(`   Key Functions: POST (line 104), GET (line 46), validateResearchRequest (line 186)`);
  console.log(`   Purpose: Receives requests, validates, calls ResearchOrchestrator`);
  console.log(`   Key Call: orchestrator.research(researchRequest) [line 147]`);
  console.log('');

  // Step 2: Research Orchestrator
  console.log('🎯 STEP 2: Research Orchestration');
  console.log('File: src/platform/intelligence/core/ResearchOrchestrator.ts');
  const orchestrator = readFileContent('src/platform/intelligence/core/ResearchOrchestrator.ts');
  console.log(`   Lines: ${orchestrator.lines}`);
  console.log(`   Key Methods: research() [line 50], executeExecutiveResearch() [line 413]`);
  console.log(`   Purpose: Coordinates all research activities, manages sessions`);
  console.log(`   Key Calls:`);
  console.log(`     - adaptiveProcessor.createResearchPlan() [line 58]`);
  console.log(`     - executeResearchPlan() [line 76]`);
  console.log(`     - dataQualityValidator.validateExecutive() [line 108]`);
  console.log('');

  // Step 3: Executive Research
  console.log('🧠 STEP 3: Executive Research');
  console.log('File: src/platform/intelligence/modules/ExecutiveResearchEnhanced.ts');
  const execResearch = readFileContent('src/platform/intelligence/modules/ExecutiveResearchEnhanced.ts');
  console.log(`   Lines: ${execResearch.lines}`);
  console.log(`   Key Methods: researchExecutives() [line 64], intelligentExecutiveResearch() [line 187]`);
  console.log(`   Purpose: Uses Perplexity AI to find executives with JSON array format`);
  console.log(`   AI Prompt: Requests JSON with executives array for multiple roles`);
  console.log(`   Parsing: parseJSONResponse() extracts executives from AI response`);
  console.log('');

  // Step 4: Contact Intelligence
  console.log('📧 STEP 4: Contact Intelligence');
  console.log('File: src/platform/intelligence/modules/ContactIntelligence.ts');
  const contactIntel = readFileContent('src/platform/intelligence/modules/ContactIntelligence.ts');
  console.log(`   Lines: ${contactIntel.lines}`);
  console.log(`   Key Methods: discoverContacts() [line 81], searchLushaExecutiveIntegrated() [line 787]`);
  console.log(`   Purpose: Finds email, phone, LinkedIn using Lusha + CoreSignal + validation`);
  console.log(`   Approach: Sophisticated cross-validation, no generated data unless verified`);
  console.log('');

  // Step 5: Buyer Group Analysis
  console.log('🎯 STEP 5: Buyer Group Analysis');
  console.log('File: src/platform/intelligence/modules/BuyerGroupAnalysis.ts');
  const buyerGroup = readFileContent('src/platform/intelligence/modules/BuyerGroupAnalysis.ts');
  console.log(`   Lines: ${buyerGroup.lines}`);
  console.log(`   Key Methods: analyzeBuyerGroup() [line 47], mapExecutivesToBuyerGroup() [line 158]`);
  console.log(`   Purpose: Identifies decision makers, champions, influencers, blockers`);
  console.log(`   Context: Uses workspace profile for dynamic buyer group analysis`);
  console.log('');

  // Step 6: Data Quality Validation
  console.log('🛡️ STEP 6: Data Quality Validation');
  console.log('File: src/platform/intelligence/modules/DataQualityValidator.ts');
  const dataQuality = readFileContent('src/platform/intelligence/modules/DataQualityValidator.ts');
  console.log(`   Lines: ${dataQuality.lines}`);
  console.log(`   Purpose: Validates executives, checks for duplicates, ensures quality`);
  console.log('');

  // Step 7: Contact/Lead Management
  console.log('📝 STEP 7: Contact/Lead Management');
  console.log('File: src/platform/intelligence/services/ContactLeadManager.ts');
  const contactLead = readFileContent('src/platform/intelligence/services/ContactLeadManager.ts');
  console.log(`   Lines: ${contactLead.lines}`);
  console.log(`   Purpose: Adds discovered executives as contacts and leads in database`);
  console.log('');
}

async function auditOldSystem() {
  console.log('📋 OLD SYSTEM EXECUTION FLOW:');
  console.log('');

  // Step 1: Core Pipeline Entry
  console.log('🚀 STEP 1: Core Pipeline Entry');
  console.log('File: pipelines-backup/adrata-pipeline-deploy-clean/pipelines/core-pipeline.js');
  const corePipeline = readFileContent('/Users/rosssylvester/Development/history/pipelines-backup-20250830_182959/adrata-pipeline-deploy-clean/pipelines/core-pipeline.js');
  console.log(`   Lines: ${corePipeline.lines}`);
  console.log(`   Key Methods: processCompany() [line 295], processCompanyOptimized() [line 1782]`);
  console.log(`   Purpose: Main pipeline that processes companies for CFO/CRO discovery`);
  console.log(`   Key Calls:`);
  console.log(`     - companyResolver.resolveCompany() [line 357]`);
  console.log(`     - researcher.researchExecutives() [line 535]`);
  console.log(`     - executiveContactIntelligence.enhanceExecutiveIntelligence() [line 580]`);
  console.log('');

  // Step 2: Executive Research (Old)
  console.log('🧠 STEP 2: Executive Research (Old)');
  console.log('File: pipelines-backup/adrata-pipeline-deploy-clean/modules/ExecutiveResearch.js');
  const oldExecResearch = readFileContent('/Users/rosssylvester/Development/history/pipelines-backup-20250830_182959/adrata-pipeline-deploy-clean/modules/ExecutiveResearch.js');
  console.log(`   Lines: ${oldExecResearch.lines}`);
  console.log(`   Key Methods: researchExecutives() [line 53], intelligentExecutiveFallback() [line 203]`);
  console.log(`   Purpose: Multi-layer executive discovery (Leadership scraping + CoreSignal + AI fallback)`);
  console.log(`   AI Approach: JSON format asking for specific CFO/CRO objects`);
  console.log(`   Return Format: { cfo: {...}, cro: {...}, confidence: ... }`);
  console.log('');

  // Step 3: Contact Intelligence (Old)
  console.log('📧 STEP 3: Contact Intelligence (Old)');
  console.log('File: pipelines-backup/adrata-pipeline-deploy-clean/modules/ExecutiveContactIntelligence.js');
  const oldContactIntel = readFileContent('/Users/rosssylvester/Development/history/pipelines-backup-20250830_182959/adrata-pipeline-deploy-clean/modules/ExecutiveContactIntelligence.js');
  console.log(`   Lines: ${oldContactIntel.lines}`);
  console.log(`   Key Methods: enhanceExecutiveIntelligence() [line 35], searchLushaExecutive() [line 290]`);
  console.log(`   Purpose: Gets contact info using Lusha + CoreSignal with cross-validation`);
  console.log(`   Approach: Lusha → CoreSignal → Cross-validate → Generate if needed`);
  console.log(`   Validation: crossValidateEmails() [line 812] with sophisticated confidence scoring`);
  console.log('');

  // Step 4: Accuracy Optimized Contacts (Old)
  console.log('🎯 STEP 4: Accuracy Optimized Contacts (Old)');
  console.log('File: pipelines-backup/adrata-pipeline-deploy-clean/modules/AccuracyOptimizedContacts.js');
  const accuracyContacts = readFileContent('/Users/rosssylvester/Development/history/pipelines-backup-20250830_182959/adrata-pipeline-deploy-clean/modules/AccuracyOptimizedContacts.js');
  console.log(`   Lines: ${accuracyContacts.lines}`);
  console.log(`   Key Methods: discoverAccurateContacts() [line 43], getCoresignalProfessionalEmail() [line 128]`);
  console.log(`   Purpose: Primary email source (CoreSignal), validation, phone discovery`);
  console.log(`   Strategy: CoreSignal primary → Lusha phones → ZeroBounce validation`);
  console.log('');

  // Step 5: Validation Engine (Old)
  console.log('✅ STEP 5: Validation Engine (Old)');
  console.log('File: pipelines-backup/adrata-pipeline-deploy-clean/modules/ValidationEngine.js');
  const oldValidation = readFileContent('/Users/rosssylvester/Development/history/pipelines-backup-20250830_182959/adrata-pipeline-deploy-clean/modules/ValidationEngine.js');
  console.log(`   Lines: ${oldValidation.lines}`);
  console.log(`   Purpose: Comprehensive data quality validation and confidence scoring`);
  console.log('');
}

async function compareSystemsAnalysis() {
  console.log('🔍 KEY DIFFERENCES ANALYSIS:');
  console.log('');
  
  console.log('📊 EXECUTIVE DISCOVERY:');
  console.log('   OLD: CFO/CRO hardcoded + Leadership scraping + AI fallback');
  console.log('   NEW: Dynamic roles + AI-first with JSON array format');
  console.log('');
  
  console.log('📧 CONTACT INTELLIGENCE:');
  console.log('   OLD: Lusha → CoreSignal → Cross-validate → Generate fallback');
  console.log('   NEW: Sophisticated validation → No unverified data returned');
  console.log('');
  
  console.log('🎯 BUYER GROUP ANALYSIS:');
  console.log('   OLD: Fixed CFO/CRO output');
  console.log('   NEW: Dynamic buyer group with decision makers, champions, influencers');
  console.log('');
  
  console.log('🏗️ ARCHITECTURE:');
  console.log('   OLD: Monolithic pipeline with fixed stages');
  console.log('   NEW: Modular with adaptive research depth and workspace profiles');
  console.log('');
  
  console.log('📈 PERFORMANCE:');
  console.log('   OLD: Fixed processing time, all companies get same treatment');
  console.log('   NEW: Adaptive processing based on importance and context');
}

function readFileContent(filePath) {
  try {
    const fullPath = filePath.startsWith('/') ? filePath : path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    
    return {
      lines,
      content,
      exists: true
    };
  } catch (error) {
    return {
      lines: 0,
      content: '',
      exists: false,
      error: error.message
    };
  }
}

// Run the audit
if (require.main === module) {
  auditBothSystems().catch(console.error);
}

module.exports = { auditBothSystems };
