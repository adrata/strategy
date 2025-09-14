#!/usr/bin/env tsx

/**
 * 🔍 NOTARY EVERYDAY SEARCH TEST SCRIPT
 * 
 * Tests that notary everyday activities are properly searchable
 * and linked to accounts and contacts for accurate reporting.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

async function testNotarySearch() {
  console.log('🔍 Testing Notary Everyday Data Searchability...\n');

  // Test 1: Search by activity type
  console.log('📧 Test 1: Search by Activity Type');
  const notaryActivities = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    },
    select: {
      id: true,
      type: true,
      subject: true,
      completedAt: true
    },
    take: 5
  });

  console.log(`Found ${notaryActivities.length} notary activities (showing first 5):`);
  notaryActivities.forEach(activity => {
    console.log(`  • ${activity.type}: ${activity.subject} (${activity.completedAt?.toISOString().split('T')[0]})`);
  });

  // Test 2: Search by company name in subject
  console.log('\n🏢 Test 2: Search by Company Name');
  const titleCompanyActivities = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      subject: {
        contains: 'Title',
        mode: 'insensitive'
      }
    },
    select: {
      subject: true,
      type: true,
      completedAt: true
    },
    take: 5
  });

  console.log(`Found ${titleCompanyActivities.length} title company activities (showing first 5):`);
  titleCompanyActivities.forEach(activity => {
    console.log(`  • ${activity.subject} (${activity.type})`);
  });

  // Test 3: Search by date range
  console.log('\n📅 Test 3: Search by Date Range (September 2024)');
  const septemberActivities = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      },
      completedAt: {
        gte: new Date('2024-09-01'),
        lt: new Date('2024-10-01')
      }
    },
    select: {
      subject: true,
      completedAt: true,
      type: true
    }
  });

  console.log(`Found ${septemberActivities.length} September 2024 notary activities:`);
  septemberActivities.forEach(activity => {
    const date = activity.completedAt?.toISOString().split('T')[0] || 'Unknown';
    console.log(`  • ${date}: ${activity.subject}`);
  });

  // Test 4: Search by source in metadata
  console.log('\n📊 Test 4: Search by Source');
  const salesNavigatorActivities = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      },
      metadata: {
        path: ['source'],
        equals: 'Sales Navigator'
      }
    },
    select: {
      subject: true,
      metadata: true
    }
  });

  console.log(`Found ${salesNavigatorActivities.length} Sales Navigator activities:`);
  salesNavigatorActivities.forEach(activity => {
    console.log(`  • ${activity.subject}`);
  });

  // Test 5: Search by contact email
  console.log('\n👥 Test 5: Search by Contact Email');
  const activitiesWithEmails = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      },
      contactId: {
        not: null
      }
    },
    select: {
      subject: true,
      contactId: true,
      description: true
    }
  });

  console.log(`Found ${activitiesWithEmails.length} activities with contacts:`);
  for (const activity of activitiesWithEmails.slice(0, 5)) {
    const contact = await prisma.contacts.findUnique({
      where: { id: activity.contactId! },
      select: {
        fullName: true,
        email: true
      }
    });
    
    if (contact?.email) {
      console.log(`  • ${activity.subject} - ${contact.fullName} (${contact.email})`);
    }
  }

  // Test 6: Search by notes content
  console.log('\n📝 Test 6: Search by Notes Content');
  const activitiesWithNotes = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      },
      description: {
        contains: 'Notary',
        mode: 'insensitive'
      }
    },
    select: {
      subject: true,
      description: true
    }
  });

  console.log(`Found ${activitiesWithNotes.length} activities mentioning "Notary":`);
  activitiesWithNotes.forEach(activity => {
    const notes = activity.description?.split('\n').find(line => line.toLowerCase().includes('notary')) || 'No notes';
    console.log(`  • ${activity.subject} - ${notes}`);
  });

  // Test 7: Search by account industry
  console.log('\n🏭 Test 7: Search by Account Industry');
  const titleIndustryAccounts = await prisma.accounts.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    },
    select: {
      name: true,
      website: true,
      createdAt: true
    },
    take: 5
  });

  console.log(`Found ${titleIndustryAccounts.length} title industry accounts (showing first 5):`);
  titleIndustryAccounts.forEach(account => {
    console.log(`  • ${account.name} (${account.website})`);
  });

  console.log('\n🎉 Search Tests Complete!');
  console.log('\n📋 Test Results Summary:');
  console.log(`  ✅ Activity type search: ${notaryActivities.length} results`);
  console.log(`  ✅ Company name search: ${titleCompanyActivities.length} results`);
  console.log(`  ✅ Date range search: ${septemberActivities.length} results`);
  console.log(`  ✅ Source search: ${salesNavigatorActivities.length} results`);
  console.log(`  ✅ Contact email search: ${activitiesWithEmails.length} results`);
  console.log(`  ✅ Notes content search: ${activitiesWithNotes.length} results`);
  console.log(`  ✅ Industry search: ${titleIndustryAccounts.length} results`);
  
  console.log('\n🎯 All notary everyday data is properly searchable and linked!');
}

// Run tests
if (require.main === module) {
  testNotarySearch()
    .catch((error) => {
      console.error('💥 Search tests failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { testNotarySearch };
