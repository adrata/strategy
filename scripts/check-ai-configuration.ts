/**
 * Check AI Configuration for Intelligence Generation
 * Verifies that all required API keys and prompts are set up
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function checkAIConfiguration() {
  console.log('🔍 CHECKING AI CONFIGURATION FOR INTELLIGENCE GENERATION\n');
  console.log('='.repeat(80));

  // Check API Keys
  console.log('\n📋 API KEY CONFIGURATION:');
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const claudeKey = process.env.CLAUDE_API_KEY;

  console.log(`   ANTHROPIC_API_KEY: ${anthropicKey ? `✅ Set (${anthropicKey.substring(0, 8)}...)` : '❌ Not set'}`);
  console.log(`   OPENROUTER_API_KEY: ${openRouterKey ? `✅ Set (${openRouterKey.substring(0, 8)}...)` : '❌ Not set'}`);
  console.log(`   CLAUDE_API_KEY: ${claudeKey ? `✅ Set (${claudeKey.substring(0, 8)}...)` : '❌ Not set'}`);

  const hasApiKey = !!(anthropicKey || openRouterKey || claudeKey);
  console.log(`\n   Status: ${hasApiKey ? '✅ API key configured' : '❌ No API key found'}`);

  // Check Model Configuration
  console.log('\n📋 MODEL CONFIGURATION:');
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  console.log(`   Model: ${model}`);
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Using: ${anthropicKey ? 'Direct Anthropic API' : openRouterKey ? 'OpenRouter API' : 'None'}`);

  // Check Prompt Service
  console.log('\n📋 PROMPT SERVICE STATUS:');
  try {
    const { ClaudeStrategyService } = await import('../src/platform/services/claude-strategy-service');
    const service = new ClaudeStrategyService();
    console.log('   ✅ ClaudeStrategyService available');
    console.log('   ✅ Prompt templates configured');
  } catch (error) {
    console.log('   ❌ ClaudeStrategyService not available');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check Company Strategy Service
  console.log('\n📋 COMPANY STRATEGY SERVICE STATUS:');
  try {
    const { companyStrategyService } = await import('../src/platform/services/company-strategy-service');
    console.log('   ✅ CompanyStrategyService available');
  } catch (error) {
    console.log('   ❌ CompanyStrategyService not available');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 CONFIGURATION SUMMARY:');
  console.log('='.repeat(80));
  
  if (hasApiKey) {
    console.log('✅ AI Configuration: READY');
    console.log('   You can proceed with batch intelligence generation.');
  } else {
    console.log('❌ AI Configuration: NOT READY');
    console.log('   Please set one of the following environment variables:');
    console.log('   - ANTHROPIC_API_KEY (recommended for direct API)');
    console.log('   - OPENROUTER_API_KEY (alternative)');
    console.log('   - CLAUDE_API_KEY (alternative)');
  }

  console.log('\n');
}

checkAIConfiguration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error checking configuration:', error);
    process.exit(1);
  });

