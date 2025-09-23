#!/usr/bin/env node

/**
 * Verify Missing People Analysis
 * 
 * Actually checks the database to confirm if leads/prospects have personId
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMissingPeople() {
  console.log('🔍 Verifying Missing People Analysis');
  console.log('====================================\n');

  try {
    // Get TOP workspace ID
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP',
          mode: 'insensitive'
        }
      }
    });

    if (!topWorkspace) {
      console.log('❌ TOP workspace not found');
      return;
    }

    console.log(`📊 Analyzing workspace: ${topWorkspace.name} (${topWorkspace.id})\n`);

    // 1. GET BASIC COUNTS
    console.log('📊 BASIC COUNTS');
    console.log('===============');
    
    const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
      prisma.people.count({ where: { workspaceId: topWorkspace.id } }),
      prisma.leads.count({ where: { workspaceId: topWorkspace.id } }),
      prisma.prospects.count({ where: { workspaceId: topWorkspace.id } })
    ]);

    console.log(`People: ${peopleCount}`);
    console.log(`Leads: ${leadsCount}`);
    console.log(`Prospects: ${prospectsCount}`);
    console.log(`Total Leads + Prospects: ${leadsCount + prospectsCount}`);
    console.log('');

    // 2. CHECK LEADS WITH/WITHOUT PERSONID
    console.log('🎯 LEADS PERSONID ANALYSIS');
    console.log('===========================');
    
    const [leadsWithPersonId, leadsWithoutPersonId] = await Promise.all([
      prisma.leads.count({ 
        where: { 
          workspaceId: topWorkspace.id,
          personId: { not: null }
        }
      }),
      prisma.leads.count({ 
        where: { 
          workspaceId: topWorkspace.id,
          personId: null
        }
      })
    ]);

    console.log(`Leads with personId: ${leadsWithPersonId}`);
    console.log(`Leads without personId: ${leadsWithoutPersonId}`);
    console.log(`Total leads: ${leadsWithPersonId + leadsWithoutPersonId}`);
    console.log('');

    // 3. CHECK PROSPECTS WITH/WITHOUT PERSONID
    console.log('🔍 PROSPECTS PERSONID ANALYSIS');
    console.log('===============================');
    
    const [prospectsWithPersonId, prospectsWithoutPersonId] = await Promise.all([
      prisma.prospects.count({ 
        where: { 
          workspaceId: topWorkspace.id,
          personId: { not: null }
        }
      }),
      prisma.prospects.count({ 
        where: { 
          workspaceId: topWorkspace.id,
          personId: null
        }
      })
    ]);

    console.log(`Prospects with personId: ${prospectsWithPersonId}`);
    console.log(`Prospects without personId: ${prospectsWithoutPersonId}`);
    console.log(`Total prospects: ${prospectsWithPersonId + prospectsWithoutPersonId}`);
    console.log('');

    // 4. CALCULATE MISSING PEOPLE
    console.log('🧮 MISSING PEOPLE CALCULATION');
    console.log('==============================');
    
    const totalContacts = leadsCount + prospectsCount;
    const contactsWithPeople = leadsWithPersonId + prospectsWithPersonId;
    const contactsWithoutPeople = leadsWithoutPersonId + prospectsWithoutPersonId;
    const missingPeople = totalContacts - peopleCount;

    console.log(`Total contacts (leads + prospects): ${totalContacts}`);
    console.log(`Contacts with personId: ${contactsWithPeople}`);
    console.log(`Contacts without personId: ${contactsWithoutPeople}`);
    console.log(`Current people count: ${peopleCount}`);
    console.log(`Missing people: ${missingPeople}`);
    console.log('');

    // 5. VERIFY THE MATH
    console.log('✅ VERIFICATION');
    console.log('===============');
    
    if (contactsWithoutPeople === missingPeople) {
      console.log('✅ CORRECT: Missing people = Contacts without personId');
      console.log(`   ${missingPeople} = ${contactsWithoutPeople}`);
    } else {
      console.log('❌ INCORRECT: The math doesn\'t add up');
      console.log(`   Missing people: ${missingPeople}`);
      console.log(`   Contacts without personId: ${contactsWithoutPeople}`);
    }

    // 6. SAMPLE DATA
    console.log('\n📋 SAMPLE LEADS WITHOUT PERSONID (First 5)');
    console.log('===========================================');
    
    const sampleLeads = await prisma.leads.findMany({
      where: {
        workspaceId: topWorkspace.id,
        personId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true
      },
      take: 5
    });

    sampleLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} (${lead.company}) - ${lead.email || 'No email'}`);
    });

    console.log('\n📋 SAMPLE PROSPECTS WITHOUT PERSONID (First 5)');
    console.log('===============================================');
    
    const sampleProspects = await prisma.prospects.findMany({
      where: {
        workspaceId: topWorkspace.id,
        personId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true
      },
      take: 5
    });

    sampleProspects.forEach((prospect, index) => {
      console.log(`${index + 1}. ${prospect.fullName} (${prospect.company}) - ${prospect.email || 'No email'}`);
    });

    // 7. FINAL CONCLUSION
    console.log('\n🎯 FINAL CONCLUSION');
    console.log('===================');
    
    if (contactsWithoutPeople > 0) {
      console.log(`✅ CONFIRMED: You have ${contactsWithoutPeople} leads and prospects without corresponding people records`);
      console.log(`   - ${leadsWithoutPersonId} leads without personId`);
      console.log(`   - ${prospectsWithoutPersonId} prospects without personId`);
      console.log(`   - Total missing people records: ${contactsWithoutPeople}`);
    } else {
      console.log('✅ All leads and prospects have corresponding people records');
    }

  } catch (error) {
    console.error('❌ Error verifying missing people:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyMissingPeople();
