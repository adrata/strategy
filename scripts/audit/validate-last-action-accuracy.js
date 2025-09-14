#!/usr/bin/env node

/**
 * 🔍 LAST ACTION ACCURACY VALIDATION SCRIPT
 * 
 * This script validates that the last action data being displayed
 * in the speedrun dashboard is accurate and matches the database records.
 * 
 * It checks:
 * 1. Database records for leads and prospects
 * 2. API response data from unified endpoint
 * 3. Data consistency between database and API
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateLastActionAccuracy() {
  console.log('🔍 [LAST ACTION VALIDATION] Starting accuracy check...\n');

  try {
    // Test workspace and user (using Dan's workspace)
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    const userId = 'dan@adrata.com';

    console.log(`📊 [VALIDATION] Checking workspace: ${workspaceId}`);
    console.log(`👤 [VALIDATION] Checking user: ${userId}\n`);

    // 1. Check database records directly
    console.log('🗄️ [DATABASE CHECK] Querying leads and prospects...');
    
    const [leads, prospects] = await Promise.all([
      prisma.leads.findMany({
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
          updatedAt: true
        },
        take: 10
      }),
      prisma.prospects.findMany({
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
          updatedAt: true
        },
        take: 10
      })
    ]);

    console.log(`✅ [DATABASE] Found ${leads.length} leads and ${prospects.length} prospects\n`);

    // 2. Display sample records with last action data
    console.log('📋 [SAMPLE RECORDS] Last action data from database:');
    console.log('=' .repeat(80));
    
    [...leads, ...prospects].slice(0, 5).forEach((record, index) => {
      console.log(`\n${index + 1}. ${record.fullName} (${record.status})`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Last Action Date: ${record.lastActionDate || 'null'}`);
      console.log(`   Last Contact Date: ${record.lastContactDate || 'null'}`);
      console.log(`   Next Action Date: ${record.nextActionDate || 'null'}`);
      console.log(`   Updated At: ${record.updatedAt}`);
      
      // Calculate time differences
      const now = new Date();
      if (record.lastContactDate) {
        const daysSinceContact = Math.floor((now - new Date(record.lastContactDate)) / (1000 * 60 * 60 * 24));
        console.log(`   Days since last contact: ${daysSinceContact}`);
      }
      if (record.lastActionDate) {
        const daysSinceAction = Math.floor((now - new Date(record.lastActionDate)) / (1000 * 60 * 60 * 24));
        console.log(`   Days since last action: ${daysSinceAction}`);
      }
    });

    // 3. Test API endpoint
    console.log('\n🌐 [API CHECK] Testing unified API endpoint...');
    
    const apiUrl = `http://localhost:3000/api/data/unified?currentSection=speedrunItems&workspaceId=${workspaceId}&userId=${userId}`;
    console.log(`   URL: ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      const speedrunItems = apiData.data?.speedrunItems || [];
      
      console.log(`✅ [API] Retrieved ${speedrunItems.length} speedrun items\n`);
      
      // 4. Compare database vs API data
      console.log('🔄 [COMPARISON] Database vs API data consistency:');
      console.log('=' .repeat(80));
      
      speedrunItems.slice(0, 5).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.fullName} (${item.status})`);
        console.log(`   Type: ${item.type}`);
        console.log(`   API Last Action Date: ${item.lastActionDate || 'null'}`);
        console.log(`   API Last Contact Date: ${item.lastContactDate || 'null'}`);
        console.log(`   API Next Action Date: ${item.nextActionDate || 'null'}`);
        
        // Find corresponding database record
        const dbRecord = [...leads, ...prospects].find(r => r.id === item.id);
        if (dbRecord) {
          console.log(`   DB Last Action Date: ${dbRecord.lastActionDate || 'null'}`);
          console.log(`   DB Last Contact Date: ${dbRecord.lastContactDate || 'null'}`);
          console.log(`   DB Next Action Date: ${dbRecord.nextActionDate || 'null'}`);
          
          // Check consistency
          const actionMatch = item.lastActionDate === dbRecord.lastActionDate;
          const contactMatch = item.lastContactDate === dbRecord.lastContactDate;
          const nextMatch = item.nextActionDate === dbRecord.nextActionDate;
          
          console.log(`   ✅ Action Date Match: ${actionMatch}`);
          console.log(`   ✅ Contact Date Match: ${contactMatch}`);
          console.log(`   ✅ Next Action Match: ${nextMatch}`);
        } else {
          console.log(`   ⚠️  No matching database record found`);
        }
      });

      // 5. Summary statistics
      console.log('\n📊 [SUMMARY] Data accuracy summary:');
      console.log('=' .repeat(80));
      
      const totalRecords = leads.length + prospects.length;
      const recordsWithLastContact = [...leads, ...prospects].filter(r => r.lastContactDate).length;
      const recordsWithLastAction = [...leads, ...prospects].filter(r => r.lastActionDate).length;
      const recordsWithNextAction = [...leads, ...prospects].filter(r => r.nextActionDate).length;
      
      console.log(`Total records: ${totalRecords}`);
      console.log(`Records with last contact date: ${recordsWithLastContact} (${Math.round(recordsWithLastContact/totalRecords*100)}%)`);
      console.log(`Records with last action date: ${recordsWithLastAction} (${Math.round(recordsWithLastAction/totalRecords*100)}%)`);
      console.log(`Records with next action date: ${recordsWithNextAction} (${Math.round(recordsWithNextAction/totalRecords*100)}%)`);
      
      // Check for data quality issues
      const staleRecords = [...leads, ...prospects].filter(r => {
        if (!r.lastContactDate && !r.lastActionDate) return false;
        const lastDate = r.lastContactDate || r.lastActionDate;
        const daysSince = Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        return daysSince > 30;
      });
      
      console.log(`\n⚠️  Stale records (>30 days): ${staleRecords.length}`);
      if (staleRecords.length > 0) {
        console.log('   Sample stale records:');
        staleRecords.slice(0, 3).forEach(r => {
          const lastDate = r.lastContactDate || r.lastActionDate;
          const daysSince = Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
          console.log(`   - ${r.fullName}: ${daysSince} days ago`);
        });
      }

    } catch (apiError) {
      console.error('❌ [API ERROR] Failed to test API endpoint:', apiError.message);
      console.log('   Make sure the development server is running on localhost:3000');
    }

    console.log('\n✅ [VALIDATION COMPLETE] Last action accuracy check finished');

  } catch (error) {
    console.error('❌ [VALIDATION ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
validateLastActionAccuracy().catch(console.error);
