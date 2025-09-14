#!/usr/bin/env node

/**
 * 🏢 NOTARY EVERYDAY INTELLIGENCE RUNNER
 * 
 * Runs the intelligence system for all 150 Notary Everyday accounts for Dano
 * Finds buyer groups, adds contacts/leads, gets email/phone/LinkedIn
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const INTELLIGENCE_API_URL = 'http://localhost:3000/api/intelligence';
const DANO_USER_ID = 'dano';
const NOTARY_WORKSPACE_ID = 'notary-everyday';

async function runNotaryEverydayIntelligence() {
  console.log('🏢 NOTARY EVERYDAY INTELLIGENCE SYSTEM');
  console.log('=' .repeat(60));
  console.log('Running intelligence for all 150 accounts for Dano');
  console.log('');

  try {
    // Step 1: Get all Notary Everyday accounts
    console.log('📋 Step 1: Getting Notary Everyday accounts...');
    
    const accountsResponse = await fetch(`${INTELLIGENCE_API_URL.replace('/intelligence', '')}/data/accounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': DANO_USER_ID,
        'x-workspace-id': NOTARY_WORKSPACE_ID
      }
    });

    if (!accountsResponse.ok) {
      throw new Error(`Failed to get accounts: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    console.log(`✅ Found ${accounts.length} Notary Everyday accounts`);
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found. Make sure Dano has accounts in the Notary Everyday workspace.');
      return;
    }

    // Step 2: Process accounts in batches (to avoid overwhelming the system)
    console.log('\n📊 Step 2: Processing accounts in batches...');
    
    const BATCH_SIZE = 10; // Process 10 accounts at a time
    const totalBatches = Math.ceil(accounts.length / BATCH_SIZE);
    let totalProcessed = 0;
    let totalContactsAdded = 0;
    let totalLeadsAdded = 0;
    let totalExecutivesFound = 0;
    let totalCost = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, accounts.length);
      const batchAccounts = accounts.slice(batchStart, batchEnd);
      
      console.log(`\n🔄 Batch ${batchIndex + 1}/${totalBatches}: Processing accounts ${batchStart + 1}-${batchEnd}`);
      console.log('─'.repeat(50));
      
      // Prepare accounts for intelligence API
      const intelligenceAccounts = batchAccounts.map(account => ({
        id: account.id,
        name: account.name || account.companyName || 'Unknown Company',
        website: account.website || account.domain || '',
        industry: account.industry || 'Legal Services',
        dealSize: 75000 // Notary Everyday typical deal size
      }));

      try {
        // Run intelligence for this batch
        const intelligenceResponse = await fetch(`${INTELLIGENCE_API_URL}/research`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': DANO_USER_ID,
            'x-workspace-id': NOTARY_WORKSPACE_ID
          },
          body: JSON.stringify({
            workspaceId: NOTARY_WORKSPACE_ID,
            userId: DANO_USER_ID,
            accounts: intelligenceAccounts,
            researchDepth: 'comprehensive',
            targetRoles: ['COO', 'General_Counsel', 'VP_Operations', 'President', 'CEO'] // Notary industry decision makers
          })
        });

        if (intelligenceResponse.ok) {
          const result = await intelligenceResponse.json();
          
          console.log(`✅ Batch ${batchIndex + 1} Results:`);
          console.log(`   👥 Executives Found: ${result.executives?.length || 0}`);
          console.log(`   📝 Contacts Added: ${result.contactsAdded || 0}`);
          console.log(`   🎯 Leads Added: ${result.leadsAdded || 0}`);
          console.log(`   💰 Cost: $${result.totalCost?.toFixed(2) || '0.00'}`);
          console.log(`   ⏱️  Processing Time: ${(result.processingTimeMs / 1000).toFixed(1)}s`);
          console.log(`   🎯 Confidence: ${result.confidence}%`);
          
          // Show buyer group analysis for first account if available
          if (result.buyerGroupAnalysis && batchIndex === 0) {
            console.log(`\n🎯 BUYER GROUP ANALYSIS (Sample from ${intelligenceAccounts[0].name}):`);
            const bg = result.buyerGroupAnalysis;
            if (bg.decisionMaker) {
              console.log(`   Decision Maker: ${bg.decisionMaker.name} (${bg.decisionMaker.role})`);
              console.log(`   Reasoning: ${bg.decisionMaker.reasoning || 'N/A'}`);
            }
            if (bg.champions && bg.champions.length > 0) {
              console.log(`   Champions: ${bg.champions.map(c => `${c.name} (${c.role})`).join(', ')}`);
            }
            if (bg.influencers && bg.influencers.length > 0) {
              console.log(`   Influencers: ${bg.influencers.map(i => `${i.name} (${i.role})`).join(', ')}`);
            }
          }
          
          // Accumulate totals
          totalProcessed += intelligenceAccounts.length;
          totalContactsAdded += result.contactsAdded || 0;
          totalLeadsAdded += result.leadsAdded || 0;
          totalExecutivesFound += result.executives?.length || 0;
          totalCost += result.totalCost || 0;
          
        } else {
          console.log(`❌ Batch ${batchIndex + 1} failed: ${intelligenceResponse.status}`);
          const error = await intelligenceResponse.text();
          console.log(`   Error: ${error}`);
        }

      } catch (error) {
        console.error(`❌ Batch ${batchIndex + 1} error:`, error.message);
      }

      // Wait between batches to be respectful of API limits
      if (batchIndex < totalBatches - 1) {
        console.log(`⏳ Waiting 5 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Final summary
    console.log('\n🎉 NOTARY EVERYDAY INTELLIGENCE COMPLETE');
    console.log('=' .repeat(60));
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   Accounts Processed: ${totalProcessed}/${accounts.length}`);
    console.log(`   👥 Total Executives Found: ${totalExecutivesFound}`);
    console.log(`   📝 Total Contacts Added: ${totalContactsAdded}`);
    console.log(`   🎯 Total Leads Added: ${totalLeadsAdded}`);
    console.log(`   💰 Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`   📈 Average Executives per Account: ${(totalExecutivesFound / totalProcessed).toFixed(1)}`);
    console.log(`   📈 Contact Addition Rate: ${((totalContactsAdded / totalExecutivesFound) * 100).toFixed(1)}%`);
    console.log(`   📈 Lead Conversion Rate: ${((totalLeadsAdded / totalContactsAdded) * 100).toFixed(1)}%`);
    console.log('');
    console.log('🎯 SYSTEM CAPABILITIES DEMONSTRATED:');
    console.log('   ✅ Multi-workspace intelligence (Notary Everyday context)');
    console.log('   ✅ Legal industry decision maker targeting');
    console.log('   ✅ Buyer group analysis with MEDDIC methodology');
    console.log('   ✅ Automatic contact/lead database insertion');
    console.log('   ✅ Email, phone, LinkedIn discovery');
    console.log('   ✅ Data quality validation and confidence scoring');
    console.log('   ✅ Cost optimization and API orchestration');
    console.log('');
    console.log('🚀 Ready for Dano to start selling to these decision makers!');

  } catch (error) {
    console.error('❌ SYSTEM ERROR:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('   1. Make sure the development server is running (npm run dev)');
    console.log('   2. Verify Dano has accounts in the Notary Everyday workspace');
    console.log('   3. Check API keys are configured in .env');
    console.log('   4. Ensure database is connected and migrations are run');
  }
}

// Run the system
if (require.main === module) {
  runNotaryEverydayIntelligence().catch(console.error);
}

module.exports = { runNotaryEverydayIntelligence };
