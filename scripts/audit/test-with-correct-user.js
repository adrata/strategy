#!/usr/bin/env node

/**
 * 🔍 TEST WITH CORRECT USER SCRIPT
 * 
 * This script tests the speedrun data with the correct user ID
 * based on the actual database assignments.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWithCorrectUser() {
  console.log('🔍 [CORRECT USER TEST] Testing with actual assigned users...\n');

  try {
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';

    // Find users assigned to records in Dan's workspace
    console.log('👥 [USER ASSIGNMENTS] Finding assigned users in Dan\'s workspace:');
    
    const leadUsers = await prisma.leads.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        assignedUserId: { not: null }
      },
      select: {
        assignedUserId: true,
        fullName: true,
        status: true
      },
      distinct: ['assignedUserId']
    });

    const prospectUsers = await prisma.prospects.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        assignedUserId: { not: null }
      },
      select: {
        assignedUserId: true,
        fullName: true,
        status: true
      },
      distinct: ['assignedUserId']
    });

    const allUsers = [...new Set([
      ...leadUsers.map(l => l.assignedUserId),
      ...prospectUsers.map(p => p.assignedUserId)
    ])].filter(Boolean);

    console.log(`   Found ${allUsers.length} assigned users:`);
    allUsers.forEach(userId => {
      const leadCount = leadUsers.filter(l => l.assignedUserId === userId).length;
      const prospectCount = prospectUsers.filter(p => p.assignedUserId === userId).length;
      console.log(`   - ${userId}: ${leadCount} leads, ${prospectCount} prospects`);
    });

    // Test with the first assigned user
    if (allUsers.length > 0) {
      const testUserId = allUsers[0];
      console.log(`\n🧪 [API TEST] Testing with user: ${testUserId}`);
      
      const apiUrl = `http://localhost:3000/api/data/unified?currentSection=speedrunItems&workspaceId=${workspaceId}&userId=${testUserId}`;
      console.log(`   URL: ${apiUrl}`);
      
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const apiData = await response.json();
        const speedrunItems = apiData.data?.speedrunItems || [];
        
        console.log(`✅ [API] Retrieved ${speedrunItems.length} speedrun items\n`);
        
        // Display the speedrun items with last action data
        console.log('📋 [SPEEDRUN ITEMS] Sample speedrun items with last action data:');
        console.log('=' .repeat(80));
        
        speedrunItems.slice(0, 5).forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.fullName} (${item.status})`);
          console.log(`   Type: ${item.type}`);
          console.log(`   Company: ${item.company}`);
          console.log(`   Title: ${item.title}`);
          console.log(`   Priority: ${item.priority}`);
          console.log(`   Last Action Date: ${item.lastActionDate || 'null'}`);
          console.log(`   Last Contact Date: ${item.lastContactDate || 'null'}`);
          console.log(`   Next Action Date: ${item.nextActionDate || 'null'}`);
          
          // Calculate time differences
          const now = new Date();
          if (item.lastContactDate) {
            const daysSinceContact = Math.floor((now - new Date(item.lastContactDate)) / (1000 * 60 * 60 * 24));
            console.log(`   Days since last contact: ${daysSinceContact}`);
          }
          if (item.lastActionDate) {
            const daysSinceAction = Math.floor((now - new Date(item.lastActionDate)) / (1000 * 60 * 60 * 24));
            console.log(`   Days since last action: ${daysSinceAction}`);
          }
        });

        // Test the health status calculation
        console.log('\n🏥 [HEALTH STATUS] Testing health status calculation:');
        speedrunItems.slice(0, 3).forEach((item, index) => {
          const lastDate = item.lastContactDate || item.lastActionDate;
          let healthStatus = 'never';
          let healthText = 'Never';
          let healthColor = 'bg-red-100 text-red-800';
          
          if (lastDate) {
            const daysSince = Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
            if (daysSince <= 3) {
              healthStatus = 'recent';
              healthText = `${daysSince}d ago`;
              healthColor = 'bg-green-100 text-green-800';
            } else if (daysSince <= 7) {
              healthStatus = 'moderate';
              healthText = `${daysSince}d ago`;
              healthColor = 'bg-yellow-100 text-yellow-800';
            } else if (daysSince <= 14) {
              healthStatus = 'stale';
              healthText = `${Math.floor(daysSince/7)}w ago`;
              healthColor = 'bg-orange-100 text-orange-800';
            } else {
              healthStatus = 'very-stale';
              healthText = `${Math.floor(daysSince/7)}w ago`;
              healthColor = 'bg-red-100 text-red-800';
            }
          }
          
          console.log(`\n${index + 1}. ${item.fullName}`);
          console.log(`   Health Status: ${healthStatus}`);
          console.log(`   Health Text: ${healthText}`);
          console.log(`   Health Color: ${healthColor}`);
          
          // Test the action description
          const name = item.fullName || 'this contact';
          let actionDescription = '';
          
          switch (healthStatus) {
            case 'recent':
              actionDescription = `Recent activity with ${name} - capitalize on it`;
              break;
            case 'moderate':
              actionDescription = `Stale contact with ${name} - time to heat it up`;
              break;
            case 'stale':
            case 'very-stale':
              actionDescription = `${item.company || 'This company'} is dead - revive it or move on`;
              break;
            default:
              actionDescription = `${name} not yet contacted`;
          }
          
          console.log(`   Action Description: ${actionDescription}`);
        });

      } catch (apiError) {
        console.error('❌ [API ERROR] Failed to test API endpoint:', apiError.message);
        console.log('   Make sure the development server is running on localhost:3000');
      }
    } else {
      console.log('⚠️  [NO USERS] No assigned users found in Dan\'s workspace');
    }

    console.log('\n✅ [CORRECT USER TEST COMPLETE]');

  } catch (error) {
    console.error('❌ [TEST ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWithCorrectUser().catch(console.error);
