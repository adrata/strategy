require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runAIPoweredRanking() {
  try {
    console.log('🏆 Running AI-Powered Ranking System...\n');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP workspace ID
    const userId = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan's user ID

    // Call the Unified Master Ranking API
    console.log('🤖 Calling Unified Master Ranking API...');
    
    const response = await fetch(`http://localhost:3000/api/data/unified-master-ranking?workspaceId=${workspaceId}&userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const rankingData = await response.json();
    
    if (!rankingData.success) {
      throw new Error(`Ranking API failed: ${rankingData.error}`);
    }

    console.log('✅ AI-Powered Ranking Generated Successfully!');
    console.log(`📊 Results:`);
    console.log(`  🏢 Companies: ${rankingData.data.companies.length}`);
    console.log(`  👥 People: ${rankingData.data.people.length}`);
    console.log(`  🎯 Leads: ${rankingData.data.leads.length}`);
    console.log(`  💼 Prospects: ${rankingData.data.prospects.length}`);
    console.log(`  🚀 Speedrun: ${rankingData.data.speedrun.length}`);

    // Update database with new rankings
    console.log('\n💾 Updating database with AI-generated rankings...');

    // Update Companies
    console.log('🏢 Updating company rankings...');
    for (const company of rankingData.data.companies) {
      await prisma.companies.update({
        where: { id: company.id },
        data: { rank: company.masterRank }
      });
    }

    // Update People
    console.log('👥 Updating people rankings...');
    for (const person of rankingData.data.people) {
      await prisma.people.update({
        where: { id: person.id },
        data: { rank: person.masterRank }
      });
    }

    // Update Leads
    console.log('🎯 Updating leads rankings...');
    for (const lead of rankingData.data.leads) {
      await prisma.leads.update({
        where: { id: lead.id },
        data: { rank: lead.masterRank }
      });
    }

    // Update Prospects
    console.log('💼 Updating prospects rankings...');
    for (const prospect of rankingData.data.prospects) {
      await prisma.prospects.update({
        where: { id: prospect.id },
        data: { rank: prospect.masterRank }
      });
    }

    console.log('\n🎉 AI-Powered Ranking Complete!');
    console.log('All records now have proper hierarchical rankings:');
    console.log('  🏢 Companies: 1-N (by AI-determined value)');
    console.log('  👥 People: 1-N (by company rank + role + engagement)');
    console.log('  🎯 Leads: Subset of people (keep person rank)');
    console.log('  💼 Prospects: Subset of people (keep person rank)');
    console.log('  🚀 Speedrun: Top 30 people');

    // Show sample rankings
    console.log('\n📊 Sample Rankings:');
    
    const sampleCompanies = rankingData.data.companies.slice(0, 5);
    console.log('🏢 Top 5 Companies:');
    sampleCompanies.forEach(company => {
      console.log(`  ${company.masterRank}. ${company.name} (Score: ${company.strategicValue})`);
    });

    const samplePeople = rankingData.data.people.slice(0, 5);
    console.log('\n👥 Top 5 People:');
    samplePeople.forEach(person => {
      console.log(`  ${person.masterRank}. ${person.name} at ${person.company} (${person.role})`);
    });

    const sampleSpeedrun = rankingData.data.speedrun.slice(0, 5);
    console.log('\n🚀 Top 5 Speedrun:');
    sampleSpeedrun.forEach((person, index) => {
      console.log(`  ${index + 1}. ${person.name} at ${person.company} (${person.role})`);
    });

  } catch (error) {
    console.error('❌ Error running AI-powered ranking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runAIPoweredRanking();
