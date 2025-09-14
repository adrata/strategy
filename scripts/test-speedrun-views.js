#!/usr/bin/env node

/**
 * Speedrun Views Data Test Script
 * 
 * Tests that data is loading correctly for all Speedrun views:
 * - Actions (sales_actions)
 * - Insights (insights) 
 * - Targets (prospects)
 * - Calendar (time)
 */

const { PrismaClient } = require('@prisma/client');
const { SpeedrunSalesActionsService } = require('../src/platform/services/speedrun-sales-actions');
const { SpeedrunCalendarService } = require('../src/platform/services/speedrun-calendar');
const { SpeedrunInsightsService } = require('../src/platform/services/speedrun-insights-service');

const prisma = new PrismaClient();

async function testSpeedrunViews() {
  console.log('🧪 Testing Speedrun Views Data Loading...\n');
  
  const results = {
    actions: { success: false, data: null, error: null },
    insights: { success: false, data: null, error: null },
    targets: { success: false, data: null, error: null },
    calendar: { success: false, data: null, error: null }
  };

  // Test 1: Actions View
  console.log('📋 Testing Actions View...');
  try {
    const salesActionsService = SpeedrunSalesActionsService.getInstance();
    
    // Get sample prospects for testing
    const prospects = await prisma.person.findMany({
      take: 5,
      include: {
        company: true
      }
    });

    if (prospects.length === 0) {
      throw new Error('No prospects found in database');
    }

    const actions = await salesActionsService.generateDailySalesActions(
      prospects,
      [], // upcoming meetings
      { meetings: 0, emails: 0, calls: 0, demos: 0 }, // current progress
      'default' // workspaceId
    );

    results.actions.success = true;
    results.actions.data = {
      count: actions.length,
      sample: actions.slice(0, 2).map(a => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
        estimatedTime: a.estimatedTime
      }))
    };
    
    console.log(`✅ Actions: ${actions.length} actions generated`);
  } catch (error) {
    results.actions.error = error.message;
    console.log(`❌ Actions: ${error.message}`);
  }

  // Test 2: Insights View
  console.log('\n💡 Testing Insights View...');
  try {
    const insightsService = SpeedrunInsightsService.getInstance();
    const insights = await insightsService.getInsights();
    
    results.insights.success = true;
    results.insights.data = {
      count: insights.length,
      categories: [...new Set(insights.map(i => i.category))],
      sample: insights.slice(0, 2).map(i => ({
        id: i.id,
        title: i.title,
        category: i.category,
        urgency: i.urgency
      }))
    };
    
    console.log(`✅ Insights: ${insights.length} insights available`);
  } catch (error) {
    results.insights.error = error.message;
    console.log(`❌ Insights: ${error.message}`);
  }

  // Test 3: Targets View (Prospects)
  console.log('\n🎯 Testing Targets View...');
  try {
    const prospects = await prisma.person.findMany({
      take: 10,
      include: {
        company: true,
        painPoints: true,
        valueDrivers: true
      },
      where: {
        status: {
          in: ['LEAD', 'PROSPECT', 'OPPORTUNITY']
        }
      }
    });

    if (prospects.length === 0) {
      throw new Error('No prospects found in database');
    }

    results.targets.success = true;
    results.targets.data = {
      count: prospects.length,
      sample: prospects.slice(0, 2).map(p => ({
        id: p.id,
        name: p.name,
        title: p.title,
        company: p.company?.name,
        status: p.status,
        painPoints: p.painPoints?.length || 0,
        valueDrivers: p.valueDrivers?.length || 0
      }))
    };
    
    console.log(`✅ Targets: ${prospects.length} prospects found`);
  } catch (error) {
    results.targets.error = error.message;
    console.log(`❌ Targets: ${error.message}`);
  }

  // Test 4: Calendar View
  console.log('\n📅 Testing Calendar View...');
  try {
    const calendarService = SpeedrunCalendarService.getInstance();
    const schedule = await calendarService.getDailySchedule(
      new Date(),
      'default' // workspaceId
    );
    
    results.calendar.success = true;
    results.calendar.data = {
      events: schedule.events.length,
      timeBlocks: schedule.timeBlocks.length,
      focusBlocks: schedule.focusBlocks.length,
      availableTime: schedule.availableTime,
      totalMeetingTime: schedule.totalMeetingTime,
      sample: {
        events: schedule.events.slice(0, 2).map(e => ({
          id: e.id,
          title: e.title,
          type: e.type,
          startTime: e.startTime
        })),
        timeBlocks: schedule.timeBlocks.slice(0, 2).map(t => ({
          id: t.id,
          title: t.title,
          type: t.type,
          startTime: t.startTime
        }))
      }
    };
    
    console.log(`✅ Calendar: ${schedule.events.length} events, ${schedule.timeBlocks.length} time blocks`);
  } catch (error) {
    results.calendar.error = error.message;
    console.log(`❌ Calendar: ${error.message}`);
  }

  // Summary Report
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([view, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const dataInfo = result.success ? 
      `(${result.data.count || result.data.events || result.data.timeBlocks || 0} items)` : 
      `(${result.error})`;
    
    console.log(`${status} ${view.toUpperCase()}: ${dataInfo}`);
  });

  const allPassed = Object.values(results).every(r => r.success);
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed. Check the errors above.'}`);

  // Detailed Data Report
  console.log('\n📋 Detailed Data Report:');
  console.log('=======================');
  
  Object.entries(results).forEach(([view, result]) => {
    if (result.success && result.data) {
      console.log(`\n${view.toUpperCase()}:`);
      console.log(`  Total Items: ${result.data.count || result.data.events || result.data.timeBlocks || 0}`);
      if (result.data.sample) {
        console.log('  Sample Data:');
        result.data.sample.forEach((item, index) => {
          console.log(`    ${index + 1}. ${JSON.stringify(item, null, 4)}`);
        });
      }
    }
  });

  await prisma.$disconnect();
  return results;
}

// Run the test
if (require.main === module) {
  testSpeedrunViews()
    .then(() => {
      console.log('\n✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testSpeedrunViews };
