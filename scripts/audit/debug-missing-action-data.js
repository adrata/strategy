#!/usr/bin/env node

/**
 * 🔍 DEBUG MISSING ACTION DATA SCRIPT
 * 
 * This script investigates why the API is not returning last action and next action data
 * that should be available in the database.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMissingActionData() {
  console.log('🔍 [DEBUG MISSING ACTION DATA] Investigating data issues...\n');

  try {
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    const userId = '01K1VBYZMWTCT09FWEKBDMCXZM';

    console.log('📊 [INVESTIGATING] Why API is missing action data\n');

    // 1. Check what's actually in the database for leads
    console.log('🗄️ [DATABASE CHECK] Direct database query for leads:');
    const dbLeads = await prisma.leads.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        lastActionDate: true,
        lastContactDate: true,
        nextActionDate: true,
        nextAction: true,
        email: true,
        company: true,
        jobTitle: true
      },
      take: 5
    });

    console.log(`Found ${dbLeads.length} leads in database:`);
    dbLeads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.fullName} (${lead.status})`);
      console.log(`   Last Action Date: ${lead.lastActionDate || 'null'}`);
      console.log(`   Last Contact Date: ${lead.lastContactDate || 'null'}`);
      console.log(`   Next Action Date: ${lead.nextActionDate || 'null'}`);
      console.log(`   Next Action: ${lead.nextAction || 'null'}`);
      console.log(`   Email: ${lead.email || 'null'}`);
      console.log(`   Company: ${lead.company || 'null'}`);
    });

    // 2. Check what the API is actually returning
    console.log('\n🌐 [API CHECK] What the API is returning:');
    const apiUrl = `http://localhost:3000/api/data/unified?currentSection=leads&workspaceId=${workspaceId}&userId=${userId}`;
    
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const apiData = await response.json();
        const apiLeads = apiData.data?.leads || [];
        
        console.log(`API returned ${apiLeads.length} leads:`);
        apiLeads.slice(0, 3).forEach((lead, index) => {
          console.log(`\n${index + 1}. ${lead.fullName || lead.name} (${lead.status})`);
          console.log(`   Last Action Date: ${lead.lastActionDate || 'null'}`);
          console.log(`   Last Contact Date: ${lead.lastContactDate || 'null'}`);
          console.log(`   Next Action Date: ${lead.nextActionDate || 'null'}`);
          console.log(`   Next Action: ${lead.nextAction || 'null'}`);
          console.log(`   Email: ${lead.email || 'null'}`);
          console.log(`   Company: ${lead.company || 'null'}`);
        });
      } else {
        console.log(`❌ API request failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API error: ${error.message}`);
    }

    // 3. Check prospects database vs API
    console.log('\n🗄️ [DATABASE CHECK] Direct database query for prospects:');
    const dbProspects = await prisma.prospects.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        lastActionDate: true,
        lastContactDate: true,
        nextActionDate: true,
        nextAction: true,
        email: true,
        company: true,
        jobTitle: true
      },
      take: 5
    });

    console.log(`Found ${dbProspects.length} prospects in database:`);
    dbProspects.forEach((prospect, index) => {
      console.log(`\n${index + 1}. ${prospect.fullName} (${prospect.status})`);
      console.log(`   Last Action Date: ${prospect.lastActionDate || 'null'}`);
      console.log(`   Last Contact Date: ${prospect.lastContactDate || 'null'}`);
      console.log(`   Next Action Date: ${prospect.nextActionDate || 'null'}`);
      console.log(`   Next Action: ${prospect.nextAction || 'null'}`);
      console.log(`   Email: ${prospect.email || 'null'}`);
      console.log(`   Company: ${prospect.company || 'null'}`);
    });

    // 4. Check accounts database vs API
    console.log('\n🗄️ [DATABASE CHECK] Direct database query for accounts:');
    const dbAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        state: true,
        lastActionDate: true,
        lastContactDate: true,
        nextActionDate: true,
        nextAction: true,
        email: true,
        industry: true
      },
      take: 5
    });

    console.log(`Found ${dbAccounts.length} accounts in database:`);
    dbAccounts.forEach((account, index) => {
      console.log(`\n${index + 1}. ${account.name} (${account.state || 'active'})`);
      console.log(`   Last Action Date: ${account.lastActionDate || 'null'}`);
      console.log(`   Last Contact Date: ${account.lastContactDate || 'null'}`);
      console.log(`   Next Action Date: ${account.nextActionDate || 'null'}`);
      console.log(`   Next Action: ${account.nextAction || 'null'}`);
      console.log(`   Email: ${account.email || 'null'}`);
      console.log(`   Industry: ${account.industry || 'null'}`);
    });

    // 5. Check if there are any activities or related data
    console.log('\n🔍 [ACTIVITIES CHECK] Looking for related activity data:');
    
    // Check if there are any activities for these leads
    if (dbLeads.length > 0) {
      const leadIds = dbLeads.map(l => l.id);
      console.log(`Checking for activities related to ${leadIds.length} leads...`);
      
      // Note: We don't have an activities table in the current schema, but let's check what we do have
      console.log('Note: No activities table found in current schema');
    }

    // 6. Summary of findings
    console.log('\n📋 [FINDINGS SUMMARY]:');
    console.log('=' .repeat(60));
    
    const leadsWithActionData = dbLeads.filter(l => l.lastActionDate || l.lastContactDate).length;
    const prospectsWithActionData = dbProspects.filter(p => p.lastActionDate || p.lastContactDate).length;
    const accountsWithActionData = dbAccounts.filter(a => a.lastActionDate || a.lastContactDate).length;
    
    console.log(`Database Records with Action Data:`);
    console.log(`  Leads: ${leadsWithActionData}/${dbLeads.length} (${Math.round(leadsWithActionData/dbLeads.length*100)}%)`);
    console.log(`  Prospects: ${prospectsWithActionData}/${dbProspects.length} (${Math.round(prospectsWithActionData/dbProspects.length*100)}%)`);
    console.log(`  Accounts: ${accountsWithActionData}/${dbAccounts.length} (${Math.round(accountsWithActionData/dbAccounts.length*100)}%)`);
    
    console.log('\n🔍 [ROOT CAUSE ANALYSIS]:');
    if (leadsWithActionData === 0 && prospectsWithActionData === 0 && accountsWithActionData === 0) {
      console.log('❌ ISSUE: No action data exists in database for this user/workspace');
      console.log('   - This suggests the data was never populated or was cleared');
      console.log('   - Need to check if there are other users/workspaces with action data');
      console.log('   - May need to populate sample action data for testing');
    } else {
      console.log('✅ Database has some action data - API may not be returning it correctly');
    }

    console.log('\n✅ [DEBUG COMPLETE] Investigation finished');

  } catch (error) {
    console.error('❌ [DEBUG ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugMissingActionData().catch(console.error);
