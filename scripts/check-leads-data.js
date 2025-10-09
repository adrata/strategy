/**
 * Script to check what leads data is actually in the database
 * Run with: node scripts/check-leads-data.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLeadsData() {
  try {
    console.log('🔍 Checking leads data in database...\n');

    // First check what statuses actually exist in the database
    const statusCounts = await prisma.people.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    console.log('📊 Current status distribution in database:');
    console.log('=' .repeat(50));
    statusCounts.forEach(stat => {
      console.log(`${stat.status || 'NULL'}: ${stat._count.id}`);
    });
    console.log('');

    // Check all people with LEAD status (if it exists)
    let leads = [];
    try {
      leads = await prisma.people.findMany({
        where: {
          status: 'LEAD'
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.log('⚠️  LEAD status not found in database - may need migration');
      console.log('   Error:', error.message);
    }

    console.log(`📊 Found ${leads.length} people with LEAD status:`);
    console.log('=' .repeat(80));

    if (leads.length === 0) {
      console.log('✅ No people with LEAD status found in database');
    } else {
      leads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.fullName}`);
        console.log(`   ID: ${lead.id}`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Company: ${lead.company?.name || 'No company'}`);
        console.log(`   Email: ${lead.email || lead.workEmail || 'No email'}`);
        console.log(`   Created: ${lead.createdAt}`);
        console.log(`   Workspace: ${lead.workspaceId}`);
        console.log('');
      });
    }

    // Also check all people to see what statuses exist
    const allPeople = await prisma.people.findMany({
      select: {
        id: true,
        fullName: true,
        status: true,
        workspaceId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('📋 Recent people in database (last 10):');
    console.log('=' .repeat(80));
    allPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} - Status: ${person.status} - Workspace: ${person.workspaceId}`);
    });

    // Check if there are any people with sample/demo data
    const samplePeople = await prisma.people.findMany({
      where: {
        OR: [
          { fullName: { contains: 'Sample' } },
          { fullName: { contains: 'Test' } },
          { fullName: { contains: 'Demo' } },
          { fullName: { contains: 'John Wick' } },
          { fullName: { contains: 'Sarah Connor' } },
          { fullName: { contains: 'Jane Foster' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        workspaceId: true
      }
    });

    if (samplePeople.length > 0) {
      console.log('\n🎭 Found sample/demo people:');
      console.log('=' .repeat(50));
      samplePeople.forEach(person => {
        console.log(`${person.fullName} - Status: ${person.status} - Workspace: ${person.workspaceId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking leads data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeadsData();