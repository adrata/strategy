require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIntelligenceStatus() {
  try {
    console.log('🔍 Checking Intelligence Generation Status...\n');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP workspace ID

    // Check people records
    const totalPeople = await prisma.people.count({
      where: { workspaceId }
    });

    const peopleWithIntelligence = await prisma.people.count({
      where: { 
        workspaceId,
        customFields: {
          path: ['intelligenceSummary'],
          not: null
        }
      }
    });

    // Check leads records
    const totalLeads = await prisma.leads.count({
      where: { workspaceId }
    });

    const leadsWithIntelligence = await prisma.leads.count({
      where: { 
        workspaceId,
        customFields: {
          path: ['intelligenceSummary'],
          not: null
        }
      }
    });

    // Check prospects records
    const totalProspects = await prisma.prospects.count({
      where: { workspaceId }
    });

    const prospectsWithIntelligence = await prisma.prospects.count({
      where: { 
        workspaceId,
        customFields: {
          path: ['intelligenceSummary'],
          not: null
        }
      }
    });

    console.log('📊 INTELLIGENCE GENERATION STATUS:');
    console.log('=====================================');
    console.log(`👥 PEOPLE: ${peopleWithIntelligence}/${totalPeople} (${Math.round((peopleWithIntelligence/totalPeople)*100)}%)`);
    console.log(`🎯 LEADS: ${leadsWithIntelligence}/${totalLeads} (${Math.round((leadsWithIntelligence/totalLeads)*100)}%)`);
    console.log(`💼 PROSPECTS: ${prospectsWithIntelligence}/${totalProspects} (${Math.round((prospectsWithIntelligence/totalProspects)*100)}%)`);
    
    const totalRecords = totalPeople + totalLeads + totalProspects;
    const totalWithIntelligence = peopleWithIntelligence + leadsWithIntelligence + prospectsWithIntelligence;
    
    console.log(`\n🎯 OVERALL: ${totalWithIntelligence}/${totalRecords} (${Math.round((totalWithIntelligence/totalRecords)*100)}%)`);

    // Check recent intelligence generation
    const recentIntelligence = await prisma.people.findMany({
      where: { 
        workspaceId,
        customFields: {
          path: ['intelligenceSummary'],
          not: null
        }
      },
      select: {
        fullName: true,
        customFields: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    console.log('\n🕒 RECENT INTELLIGENCE GENERATION:');
    recentIntelligence.forEach((person, index) => {
      const intelligenceLevel = person.customFields?.engagementLevel || 'Unknown';
      console.log(`${index + 1}. ${person.fullName} - ${intelligenceLevel}`);
    });

    if (totalWithIntelligence < totalRecords) {
      console.log('\n⏳ INTELLIGENCE GENERATION IN PROGRESS...');
      console.log('The batch script is likely still running in the background.');
    } else {
      console.log('\n✅ ALL INTELLIGENCE GENERATION COMPLETE!');
    }

  } catch (error) {
    console.error('❌ Error checking intelligence status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIntelligenceStatus();
