#!/usr/bin/env node

/**
 * Script to move all leads back to prospects
 * This script will:
 * 1. Get all active leads
 * 2. Move each lead back to prospects using the advance_to_prospect action
 * 3. Log the results
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/data/unified';
const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's workspace
const USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG'; // Dan's user ID

async function moveLeadsToProspects() {
  console.log('🔄 Starting to move leads back to prospects...');
  
  try {
    // Step 1: Get all active leads
    console.log('📋 Fetching all active leads...');
    const leadsResponse = await fetch(`${API_BASE_URL}?type=leads&action=get&workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`);
    
    if (!leadsResponse.ok) {
      throw new Error(`Failed to fetch leads: ${leadsResponse.status} ${leadsResponse.statusText}`);
    }
    
    const leadsResult = await leadsResponse.json();
    
    if (!leadsResult.success) {
      throw new Error(`API error: ${leadsResult.error}`);
    }
    
    const leads = leadsResult.data || [];
    console.log(`✅ Found ${leads.length} active leads`);
    
    if (leads.length === 0) {
      console.log('ℹ️ No leads to move. Exiting.');
      return;
    }
    
    // Step 2: Move each lead to prospects
    console.log('🔄 Moving leads to prospects...');
    const results = [];
    
    for (const lead of leads) {
      try {
        console.log(`🔄 Moving lead: ${lead.fullName || lead.firstName + ' ' + lead.lastName} (${lead.id})`);
        
        const advanceResponse = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'leads',
            action: 'advance_to_prospect',
            workspaceId: WORKSPACE_ID,
            userId: USER_ID,
            id: lead.id,
            data: {}
          })
        });
        
        if (!advanceResponse.ok) {
          throw new Error(`HTTP ${advanceResponse.status}: ${advanceResponse.statusText}`);
        }
        
        const advanceResult = await advanceResponse.json();
        
        if (advanceResult.success) {
          console.log(`✅ Successfully moved: ${lead.fullName || lead.firstName + ' ' + lead.lastName}`);
          results.push({
            leadId: lead.id,
            leadName: lead.fullName || lead.firstName + ' ' + lead.lastName,
            success: true,
            newProspectId: advanceResult.newRecordId,
            message: advanceResult.message
          });
        } else {
          console.log(`❌ Failed to move: ${lead.fullName || lead.firstName + ' ' + lead.lastName} - ${advanceResult.error}`);
          results.push({
            leadId: lead.id,
            leadName: lead.fullName || lead.firstName + ' ' + lead.lastName,
            success: false,
            error: advanceResult.error
          });
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`❌ Error moving lead ${lead.id}: ${error.message}`);
        results.push({
          leadId: lead.id,
          leadName: lead.fullName || lead.firstName + ' ' + lead.lastName,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 3: Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully moved: ${successful.length} leads`);
    console.log(`❌ Failed to move: ${failed.length} leads`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successfully moved leads:');
      successful.forEach(result => {
        console.log(`  - ${result.leadName} → Prospect ${result.newProspectId}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed to move leads:');
      failed.forEach(result => {
        console.log(`  - ${result.leadName}: ${result.error}`);
      });
    }
    
    console.log('\n🎉 Lead to prospect conversion completed!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  moveLeadsToProspects();
}

module.exports = { moveLeadsToProspects };
