/**
 * Check state data coverage for TOP Engineering Plus companies/leads
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

// Track if we're already disconnecting to prevent double disconnects
let isDisconnecting = false;

// Safe disconnect function that prevents UV_HANDLE_CLOSING errors
async function safeDisconnect() {
  if (isDisconnecting) {
    return;
  }
  
  isDisconnecting = true;
  
  try {
    if (prisma) {
      await prisma.$disconnect();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('already been disconnected') && 
        !errorMessage.includes('UV_HANDLE_CLOSING')) {
      console.warn('⚠️  [PRISMA] Disconnect warning:', errorMessage);
    }
  } finally {
    isDisconnecting = false;
  }
}

async function checkStateData() {
  try {
    console.log('🔍 Checking state data for TOP Engineering Plus...\n');
    
    // Check companies
    const companies = await prisma.companies.findMany({
      where: { 
        workspaceId: WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        name: true,
        state: true,
        city: true,
        country: true,
      }
    });

    const companiesWithState = companies.filter(c => c.state && c.state.trim() !== '').length;
    const companiesWithoutState = companies.length - companiesWithState;
    const usCompanies = companies.filter(c => c.country === 'US' || c.country === 'United States' || !c.country).length;
    
    console.log('📊 COMPANY STATE DATA:');
    console.log(`   Total companies: ${companies.length}`);
    console.log(`   Companies with state: ${companiesWithState} (${((companiesWithState / companies.length) * 100).toFixed(1)}%)`);
    console.log(`   Companies without state: ${companiesWithoutState} (${((companiesWithoutState / companies.length) * 100).toFixed(1)}%)`);
    console.log(`   US companies: ${usCompanies}`);
    
    // State breakdown
    const stateCounts = {};
    companies.forEach(c => {
      if (c.state && c.state.trim() !== '') {
        stateCounts[c.state] = (stateCounts[c.state] || 0) + 1;
      }
    });
    
    const sortedStates = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (sortedStates.length > 0) {
      console.log('\n   Top 10 states:');
      sortedStates.forEach(([state, count]) => {
        console.log(`     ${state}: ${count}`);
      });
    }
    
    // Check people/contacts
    const people = await prisma.people.findMany({
      where: { 
        workspaceId: WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        fullName: true,
        state: true,
        city: true,
        country: true,
      }
    });

    const peopleWithState = people.filter(p => p.state && p.state.trim() !== '').length;
    const peopleWithoutState = people.length - peopleWithState;
    
    console.log('\n👥 PEOPLE STATE DATA:');
    console.log(`   Total people: ${people.length}`);
    console.log(`   People with state: ${peopleWithState} (${people.length > 0 ? ((peopleWithState / people.length) * 100).toFixed(1) : 0}%)`);
    console.log(`   People without state: ${peopleWithoutState} (${people.length > 0 ? ((peopleWithoutState / people.length) * 100).toFixed(1) : 0}%)`);
    
    // Check leads
    const leads = await prisma.leads.findMany({
      where: { 
        workspaceId: WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        fullName: true,
        state: true,
        city: true,
        country: true,
      }
    });

    const leadsWithState = leads.filter(l => l.state && l.state.trim() !== '').length;
    const leadsWithoutState = leads.length - leadsWithState;
    
    console.log('\n📋 LEADS STATE DATA:');
    console.log(`   Total leads: ${leads.length}`);
    console.log(`   Leads with state: ${leadsWithState} (${leads.length > 0 ? ((leadsWithState / leads.length) * 100).toFixed(1) : 0}%)`);
    console.log(`   Leads without state: ${leadsWithoutState} (${leads.length > 0 ? ((leadsWithoutState / leads.length) * 100).toFixed(1) : 0}%)`);
    
    console.log('\n✅ State data check complete!');
    
  } catch (error) {
    console.error('❌ Error checking state data:', error);
    throw error;
  } finally {
    await safeDisconnect();
  }
}

// Run the check
checkStateData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

