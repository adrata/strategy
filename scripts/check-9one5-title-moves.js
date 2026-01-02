#!/usr/bin/env node

/**
 * Check if other people were moved to 9one5 Title LLC around the same time
 * as Dennis DeLoach
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COMPANY_ID = '01KBDXEWVJNK60T7H8PWYTNE7P'; // 9one5 Title LLC
const DENNIS_PERSON_ID = '01K8NP9YH1MF4A21Q6SW44BPQJ';
const DENNIS_UPDATE_TIME = new Date('2025-12-15T14:55:54.000Z'); // When Dennis was updated

async function check9one5TitleMoves() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Get the company info
    const company = await prisma.companies.findUnique({
      where: { id: COMPANY_ID },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    console.log('='.repeat(80));
    console.log('CHECKING 9ONE5 TITLE LLC ASSIGNMENTS');
    console.log('='.repeat(80));
    console.log(`Company: ${company.name} (${company.id})`);
    console.log(`Company Created: ${company.createdAt}`);
    console.log(`Dennis Update Time: ${DENNIS_UPDATE_TIME}`);
    console.log('');

    // Find all people currently assigned to 9one5 Title LLC
    console.log('🔍 Finding all people currently assigned to 9one5 Title LLC...\n');
    const currentPeople = await prisma.people.findMany({
      where: {
        companyId: COMPANY_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        updatedAt: true,
        createdAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`Total people currently assigned: ${currentPeople.length}\n`);

    // Check for people updated around the same time as Dennis (within 1 hour)
    const timeWindow = 60 * 60 * 1000; // 1 hour in milliseconds
    const windowStart = new Date(DENNIS_UPDATE_TIME.getTime() - timeWindow);
    const windowEnd = new Date(DENNIS_UPDATE_TIME.getTime() + timeWindow);

    console.log('='.repeat(80));
    console.log('PEOPLE UPDATED AROUND THE SAME TIME AS DENNIS');
    console.log('='.repeat(80));
    console.log(`Time window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}\n`);

    const peopleUpdatedInWindow = currentPeople.filter(person => {
      const updatedAt = new Date(person.updatedAt);
      return updatedAt >= windowStart && updatedAt <= windowEnd;
    });

    console.log(`People updated within 1 hour of Dennis: ${peopleUpdatedInWindow.length}\n`);

    if (peopleUpdatedInWindow.length > 0) {
      console.log('People updated around the same time:');
      peopleUpdatedInWindow.forEach((person, i) => {
        const isDennis = person.id === DENNIS_PERSON_ID;
        console.log(`   ${i + 1}. ${person.fullName}${isDennis ? ' (Dennis DeLoach)' : ''}`);
        console.log(`      ID: ${person.id}`);
        console.log(`      Updated: ${person.updatedAt}`);
        console.log(`      Created: ${person.createdAt}`);
        console.log('');
      });
    } else {
      console.log('No other people were updated around the same time.\n');
    }

    // Check entity_change_log if it exists
    console.log('='.repeat(80));
    console.log('CHECKING CHANGE LOGS');
    console.log('='.repeat(80));
    
    try {
      const changeLogs = await prisma.entity_change_log.findMany({
        where: {
          entityType: 'person',
          fieldName: 'companyId',
          newValue: COMPANY_ID,
          createdAt: {
            gte: windowStart,
            lte: windowEnd
          }
        },
        select: {
          id: true,
          entityId: true,
          oldValue: true,
          newValue: true,
          changedBy: true,
          changeSource: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Found ${changeLogs.length} change log entries for companyId changes to 9one5 Title LLC\n`);

      if (changeLogs.length > 0) {
        console.log('Change log entries:');
        for (const log of changeLogs) {
          const person = await prisma.people.findUnique({
            where: { id: log.entityId },
            select: {
              fullName: true,
              email: true
            }
          });

          const isDennis = log.entityId === DENNIS_PERSON_ID;
          console.log(`   ${person?.fullName || log.entityId}${isDennis ? ' (Dennis DeLoach)' : ''}`);
          console.log(`      Changed: ${log.createdAt}`);
          console.log(`      From: ${log.oldValue || 'None'}`);
          console.log(`      To: ${log.newValue || 'None'}`);
          console.log(`      Source: ${log.changeSource || 'N/A'}`);
          console.log(`      Changed By: ${log.changedBy || 'N/A'}`);
          console.log('');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not check entity_change_log (table may not exist or have data)');
      console.log(`   Error: ${error.message}\n`);
    }

    // Check audit_logs
    console.log('='.repeat(80));
    console.log('CHECKING AUDIT LOGS');
    console.log('='.repeat(80));
    
    try {
      const auditLogs = await prisma.audit_logs.findMany({
        where: {
          entityType: 'person',
          entityId: { in: currentPeople.map(p => p.id) },
          action: 'update',
          timestamp: {
            gte: windowStart,
            lte: windowEnd
          }
        },
        select: {
          id: true,
          entityId: true,
          oldValues: true,
          newValues: true,
          userId: true,
          timestamp: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      console.log(`Found ${auditLogs.length} audit log entries\n`);

      if (auditLogs.length > 0) {
        console.log('Audit log entries:');
        for (const log of auditLogs) {
          const person = currentPeople.find(p => p.id === log.entityId);
          const isDennis = log.entityId === DENNIS_PERSON_ID;
          
          console.log(`   ${person?.fullName || log.entityId}${isDennis ? ' (Dennis DeLoach)' : ''}`);
          console.log(`      Timestamp: ${log.timestamp}`);
          
          const oldValues = log.oldValues;
          const newValues = log.newValues;
          
          if (oldValues?.companyId || newValues?.companyId) {
            console.log(`      Company Change:`);
            if (oldValues?.companyId) {
              const oldCompany = await prisma.companies.findUnique({
                where: { id: oldValues.companyId },
                select: { name: true }
              });
              console.log(`         From: ${oldCompany?.name || oldValues.companyId}`);
            }
            if (newValues?.companyId) {
              const newCompany = await prisma.companies.findUnique({
                where: { id: newValues.companyId },
                select: { name: true }
              });
              console.log(`         To: ${newCompany?.name || newValues.companyId}`);
            }
          }
          console.log('');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not check audit_logs (may not have relevant entries)');
      console.log(`   Error: ${error.message}\n`);
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total people at 9one5 Title LLC: ${currentPeople.length}`);
    console.log(`People updated around same time as Dennis: ${peopleUpdatedInWindow.length}`);
    
    if (peopleUpdatedInWindow.length === 1 && peopleUpdatedInWindow[0].id === DENNIS_PERSON_ID) {
      console.log('\n✅ Only Dennis DeLoach was moved to 9one5 Title LLC at that time.');
    } else if (peopleUpdatedInWindow.length > 1) {
      console.log(`\n⚠️  ${peopleUpdatedInWindow.length} people were updated around the same time.`);
      console.log('   This suggests a batch update may have occurred.');
    } else {
      console.log('\n✅ No other people were updated at the same time.');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check9one5TitleMoves();

