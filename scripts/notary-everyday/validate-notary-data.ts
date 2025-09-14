#!/usr/bin/env tsx

/**
 * 🔍 NOTARY EVERYDAY DATA VALIDATION SCRIPT
 * 
 * Validates that all notary everyday data was imported correctly
 * and is properly linked to accounts, contacts, and activities.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

async function validateNotaryData() {
  console.log('🔍 Validating Notary Everyday Data Import...\n');

  // 1. Check total activities created
  const totalActivities = await prisma.activities.count({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    }
  });

  console.log(`📊 Total Notary Activities: ${totalActivities}`);

  // 2. Check accounts created
  const totalAccounts = await prisma.accounts.count({
    where: {
      workspaceId: WORKSPACE_ID,
      industry: 'Real Estate / Title Services'
    }
  });

  console.log(`🏢 Total Title/Real Estate Accounts: ${totalAccounts}`);

  // 3. Check contacts created
  const totalContacts = await prisma.contacts.count({
    where: {
      workspaceId: WORKSPACE_ID,
      accounts: {
        industry: 'Real Estate / Title Services'
      }
    }
  });

  console.log(`👥 Total Contacts in Title Companies: ${totalContacts}`);

  // 4. Show detailed breakdown by date
  console.log('\n📅 Activities by Date:');
  const activitiesByDate = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    },
    select: {
      subject: true,
      completedAt: true,
      accountId: true,
      contactId: true,
      description: true
    },
    orderBy: {
      completedAt: 'asc'
    }
  });

  const dateGroups = activitiesByDate.reduce((acc, activity) => {
    const date = activity.completedAt?.toISOString().split('T')[0] || 'Unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, typeof activitiesByDate>);

  Object.entries(dateGroups).forEach(([date, activities]) => {
    console.log(`\n  ${date}: ${activities.length} activities`);
    activities.forEach(activity => {
      // Extract company name from subject
      const companyName = activity.subject.split(' - ')[1] || 'Unknown Company';
      const hasContact = activity.contactId ? 'With Contact' : 'No Contact';
      console.log(`    • ${companyName} - ${hasContact}`);
    });
  });

  // 5. Show companies with missing contacts
  console.log('\n⚠️  Companies without specific contacts:');
  const activitiesWithoutContacts = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      },
      contactId: null
    },
    select: {
      subject: true
    }
  });

  activitiesWithoutContacts.forEach(activity => {
    const companyName = activity.subject.split(' - ')[1] || 'Unknown Company';
    console.log(`  • ${companyName}`);
  });

  // 6. Show companies with contacts
  console.log('\n✅ Companies with specific contacts:');
  const activitiesWithContacts = await prisma.activities.findMany({
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

  // Get contact details for activities with contacts
  for (const activity of activitiesWithContacts) {
    const contact = await prisma.contacts.findUnique({
      where: { id: activity.contactId! },
      select: {
        fullName: true,
        jobTitle: true,
        email: true
      }
    });
    
    const companyName = activity.subject.split(' - ')[1] || 'Unknown Company';
    const email = contact?.email ? ` (${contact.email})` : '';
    console.log(`  • ${companyName} - ${contact?.fullName} (${contact?.jobTitle})${email}`);
  }

  // 7. Show activity types breakdown
  console.log('\n📈 Activity Types:');
  const activityTypes = await prisma.activities.groupBy({
    by: ['type'],
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    },
    _count: {
      type: true
    }
  });

  activityTypes.forEach(type => {
    console.log(`  • ${type.type}: ${type._count.type} activities`);
  });

  // 8. Show sources breakdown
  console.log('\n📊 Sources:');
  const sources = await prisma.activities.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      type: {
        startsWith: 'notary_'
      }
    },
    select: {
      metadata: true
    }
  });

  const sourceCounts = sources.reduce((acc, activity) => {
    const source = (activity.metadata as any)?.source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(sourceCounts).forEach(([source, count]) => {
    console.log(`  • ${source}: ${count} activities`);
  });

  console.log('\n🎉 Validation Complete!');
  console.log(`\n📋 Summary:`);
  console.log(`  • ${totalActivities} notary activities imported`);
  console.log(`  • ${totalAccounts} title/real estate companies`);
  console.log(`  • ${totalContacts} contacts created`);
  console.log(`  • ${activitiesWithContacts.length} activities with specific contacts`);
  console.log(`  • ${activitiesWithoutContacts.length} activities without specific contacts`);
}

// Run validation
if (require.main === module) {
  validateNotaryData()
    .catch((error) => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { validateNotaryData };
