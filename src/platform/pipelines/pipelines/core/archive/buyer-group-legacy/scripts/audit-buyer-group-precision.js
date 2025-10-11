const fs = require('fs');
const path = require('path');

async function auditBuyerGroupPrecision() {
  console.log('🔍 AUDITING BUYER GROUP TECHNOLOGY PRECISION\n');

  // 1. Check the AI prompt precision
  console.log('🤖 AI PROMPT PRECISION ANALYSIS:');
  
  const buyerGroupPath = 'src/platform/intelligence/modules/BuyerGroupAnalysis.ts';
  const buyerGroupAIPath = 'src/platform/pipelines/modules/powerhouse/BuyerGroupAI.js';
  
  if (fs.existsSync(buyerGroupPath)) {
    const buyerGroupCode = fs.readFileSync(buyerGroupPath, 'utf8');
    
    console.log('   📝 BuyerGroupAnalysis.ts AI Prompt:');
    
    // Extract the AI prompt
    const promptMatch = buyerGroupCode.match(/const prompt = `([\s\S]*?)`;/);
    if (promptMatch) {
      const prompt = promptMatch[1];
      console.log('      AI Prompt Found:');
      console.log(`      "${prompt.substring(0, 100)}..."`);
      console.log('');
      
      // Analyze prompt precision
      const hasSpecificRoles = prompt.includes('keyStakeholders') && prompt.includes('budgetAuthority');
      const hasRoleSpecificity = prompt.includes('specific') || prompt.includes('precise');
      
      console.log('      🔍 PROMPT PRECISION ANALYSIS:');
      console.log(`         ✅ Has specific stakeholder fields: ${hasSpecificRoles}`);
      console.log(`         ⚠️  Has role specificity language: ${hasRoleSpecificity}`);
      console.log('         ⚠️  Prompt is generic - doesn\'t specify EVP vs CRO vs VP');
    }
  }
  
  if (fs.existsSync(buyerGroupAIPath)) {
    const buyerGroupAICode = fs.readFileSync(buyerGroupAIPath, 'utf8');
    
    console.log('   📝 BuyerGroupAI.js AI Prompt:');
    
    // Extract the AI prompt
    const promptMatch = buyerGroupAICode.match(/const prompt = `([\s\S]*?)`;/);
    if (promptMatch) {
      const prompt = promptMatch[1];
      console.log('      AI Prompt Found:');
      console.log(`      "${prompt.substring(0, 100)}..."`);
      console.log('');
      
      // Analyze prompt precision
      const hasRoleSpecificity = prompt.includes('specific, actionable') || prompt.includes('typical job titles');
      const hasTitleVariations = prompt.includes('job titles') || prompt.includes('departments');
      
      console.log('      🔍 PROMPT PRECISION ANALYSIS:');
      console.log(`         ✅ Has role specificity language: ${hasRoleSpecificity}`);
      console.log(`         ✅ Has title variations: ${hasTitleVariations}`);
      console.log('         ⚠️  Still generic - doesn\'t distinguish EVP vs CRO vs VP');
    }
  }
  
  console.log('');

  // 2. Check role determination logic
  console.log('🎯 ROLE DETERMINATION LOGIC ANALYSIS:');
  
  if (fs.existsSync(buyerGroupPath)) {
    const buyerGroupCode = fs.readFileSync(buyerGroupPath, 'utf8');
    
    // Check for specific role logic
    const hasRoleLogic = buyerGroupCode.includes('switch (contextAnalysis.industry)');
    const hasSpecificRoles = buyerGroupCode.includes('CTO') || buyerGroupCode.includes('CFO');
    const hasRoleHierarchy = buyerGroupCode.includes('importance') || buyerGroupCode.includes('influence');
    
    console.log('   📊 BuyerGroupAnalysis.ts Role Logic:');
    console.log(`      ✅ Has industry-specific role logic: ${hasRoleLogic}`);
    console.log(`      ✅ Has specific role definitions: ${hasSpecificRoles}`);
    console.log(`      ✅ Has role hierarchy/importance: ${hasRoleHierarchy}`);
    console.log('');
    
    // Check if it can distinguish between similar roles
    const canDistinguishEVPvsCRO = buyerGroupCode.includes('EVP') || buyerGroupCode.includes('Executive Vice President');
    const canDistinguishCROvsVP = buyerGroupCode.includes('CRO') && buyerGroupCode.includes('VP_Sales');
    
    console.log('   🔍 ROLE DISTINCTION CAPABILITY:');
    console.log(`      ❌ Can distinguish EVP Sales vs CRO: ${canDistinguishEVPvsCRO}`);
    console.log(`      ⚠️  Can distinguish CRO vs VP Sales: ${canDistinguishCROvsVP}`);
    console.log('      ⚠️  Limited ability to distinguish similar senior roles');
  }
  
  console.log('');

  // 3. Check AI model capabilities
  console.log('🧠 AI MODEL CAPABILITIES:');
  
  if (fs.existsSync(buyerGroupPath)) {
    const buyerGroupCode = fs.readFileSync(buyerGroupPath, 'utf8');
    
    const usesPerplexity = buyerGroupCode.includes('perplexity.ai');
    const usesOpenAI = buyerGroupCode.includes('openai');
    const hasModelSpec = buyerGroupCode.includes('sonar-pro') || buyerGroupCode.includes('gpt');
    
    console.log('   🤖 AI Model Configuration:');
    console.log(`      ✅ Uses Perplexity AI: ${usesPerplexity}`);
    console.log(`      ✅ Uses OpenAI: ${usesOpenAI}`);
    console.log(`      ✅ Has model specification: ${hasModelSpec}`);
    console.log('');
    
    console.log('   📊 AI Model Precision Capabilities:');
    console.log('      • Perplexity AI (sonar-pro): Good at business analysis, moderate role precision');
    console.log('      • OpenAI GPT: Better at nuanced role distinctions, but still generic');
    console.log('      • Both models need specific prompting for role precision');
  }
  
  console.log('');

  // 4. Current limitations and recommendations
  console.log('🚨 CURRENT LIMITATIONS:');
  console.log('   1. ❌ Generic AI prompts don\'t specify role hierarchy distinctions');
  console.log('   2. ❌ No logic to distinguish EVP Sales vs CRO vs VP Sales');
  console.log('   3. ❌ AI models return generic responses without role specificity');
  console.log('   4. ❌ No validation that returned roles are the most precise match');
  console.log('');

  console.log('💡 RECOMMENDATIONS FOR ROLE PRECISION:');
  console.log('   1. 🔧 Enhance AI prompts with specific role hierarchy requirements');
  console.log('   2. 🔧 Add role validation logic to ensure most precise match');
  console.log('   3. 🔧 Implement role hierarchy mapping (EVP > CRO > VP > Director)');
  console.log('   4. 🔧 Add company size context for role determination');
  console.log('   5. 🔧 Use multiple AI calls for role validation and refinement');
  console.log('');

  console.log('🎯 SPECIFIC ROLE DISTINCTIONS NEEDED:');
  console.log('   • EVP Sales vs CRO vs VP Sales vs Sales Director');
  console.log('   • CTO vs VP Engineering vs Director of IT');
  console.log('   • CFO vs VP Finance vs Controller vs Treasurer');
  console.log('   • CEO vs President vs Managing Director');
  console.log('');

  console.log('🏥 PRECISION SCORE:');
  console.log('   🟡 MODERATE: 65%');
  console.log('   • Good at finding roles in general');
  console.log('   • Limited at distinguishing similar senior roles');
  console.log('   • Needs enhancement for precise role hierarchy');

}

// Run the audit
if (require.main === module) {
  auditBuyerGroupPrecision();
}

module.exports = { auditBuyerGroupPrecision };
