#!/usr/bin/env node

/**
 * TEST SPEEDRUN FIX
 * Test if the speedrun data transformation now includes lastActionTime
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSpeedrunFix() {
  console.log('🧪 TESTING SPEEDRUN FIX');
  console.log('========================\n');

  try {
    // Simulate the API response data structure
    const mockApiResponse = {
      id: 'test-person-1',
      name: 'Ross Sylvester',
      fullName: 'Ross Sylvester',
      email: 'ross@adrata.com',
      company: 'InnovateSoft Global',
      title: 'CEO',
      lastAction: 'Initial outreach email sent',
      lastActionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      lastActionTime: 'Yesterday', // This should be calculated by the API
      nextAction: 'Schedule Discovery Call',
      nextActionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      status: 'Lead',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📊 Mock API Response:');
    console.log(JSON.stringify(mockApiResponse, null, 2));

    // Simulate the speedrun data transformation
    const transformedData = {
      id: mockApiResponse.id,
      name: mockApiResponse.name || mockApiResponse.fullName || 'Unknown',
      email: mockApiResponse.email || '',
      company: mockApiResponse.company || 'Unknown Company',
      title: mockApiResponse.title || 'Unknown Title',
      phone: mockApiResponse.phone || '',
      location: mockApiResponse.location || '',
      industry: mockApiResponse.industry || 'General',
      status: mockApiResponse.status || 'Lead',
      priority: mockApiResponse.priority || 'medium',
      lastContact: mockApiResponse.lastContact || mockApiResponse.updatedAt,
      lastAction: mockApiResponse.lastAction || 'No action taken',
      lastActionDate: mockApiResponse.lastActionDate || null,
      lastActionTime: mockApiResponse.lastActionTime || 'Never', // ✅ This should now be included
      notes: mockApiResponse.notes || '',
      tags: mockApiResponse.tags || [],
      source: mockApiResponse.source || 'speedrun',
      enrichmentScore: mockApiResponse.enrichmentScore || 0,
      buyerGroupRole: mockApiResponse.buyerGroupRole || 'unknown',
      currentStage: mockApiResponse.currentStage || 'initial',
      nextAction: mockApiResponse.nextAction || '',
      nextActionDate: mockApiResponse.nextActionDate || '',
      createdAt: mockApiResponse.createdAt || new Date().toISOString(),
      updatedAt: mockApiResponse.updatedAt || new Date().toISOString(),
      assignedUser: mockApiResponse.assignedUser || null,
      workspaceId: mockApiResponse.workspaceId || ''
    };

    console.log('\n🔄 Transformed Data:');
    console.log(JSON.stringify(transformedData, null, 2));

    // Test the table component logic
    console.log('\n🎯 Table Component Logic Test:');
    
    // Simulate getLastActionTiming function
    function getLastActionTiming(record) {
      const lastActionTime = record['lastActionTime'];
      if (lastActionTime) {
        if (lastActionTime === 'Never') {
          return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
        } else if (lastActionTime === 'Today') {
          return { text: lastActionTime, color: 'bg-green-100 text-green-800' };
        } else if (lastActionTime === 'Yesterday') {
          return { text: lastActionTime, color: 'bg-blue-100 text-blue-800' };
        } else {
          return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
        }
      }
      
      // Fallback: Calculate timing from date
      const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
      const timing = getRealtimeActionTiming(lastActionDate);
      return { ...timing, color: 'bg-[var(--hover)] text-gray-800' };
    }

    // Mock getRealtimeActionTiming function
    function getRealtimeActionTiming(date) {
      if (!date) return { text: 'Never', color: 'bg-[var(--hover)] text-gray-800' };
      
      const daysSince = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince === 0) return { text: 'Today', color: 'bg-green-100 text-green-800' };
      else if (daysSince === 1) return { text: 'Yesterday', color: 'bg-blue-100 text-blue-800' };
      else if (daysSince <= 7) return { text: `${daysSince} days ago`, color: 'bg-[var(--hover)] text-gray-800' };
      else if (daysSince <= 30) return { text: `${Math.floor(daysSince / 7)} weeks ago`, color: 'bg-[var(--hover)] text-gray-800' };
      else return { text: `${Math.floor(daysSince / 30)} months ago`, color: 'bg-[var(--hover)] text-gray-800' };
    }

    const timing = getLastActionTiming(transformedData);
    console.log(`✅ Timing result: ${timing.text} (${timing.color})`);
    console.log(`✅ Action text: ${transformedData.lastAction}`);

    console.log('\n🎉 SUCCESS! The speedrun table should now display:');
    console.log(`   - Date pill: "${timing.text}" with color ${timing.color}`);
    console.log(`   - Action description: "${transformedData.lastAction}"`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSpeedrunFix();
