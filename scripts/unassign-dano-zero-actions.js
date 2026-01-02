#!/usr/bin/env node

/**
 * Unassign Dano from Companies and People with ZERO Actions
 * 
 * This script finds all companies and people assigned to dano in Notary Everyday workspace
 * and unassigns those where dano has zero actions.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_USER = {
  email: 'dano@notaryeveryday.com',
  name: 'Dano'
};

async function unassignDanoZeroActions() {
  console.log('========================================');
  console.log('   UNASSIGN DANO FROM ZERO-ACTION RECORDS');
  console.log('   Workspace: Notary Everyday');
  console.log('========================================');
  console.log(`Target: ${TARGET_USER.email}`);
  console.log('');

  try {
    await prisma.$connect();
    console.log('Connected to database');

    // Find Notary Everyday workspace
    console.log('🔍 Finding Notary Everyday workspace...');
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log(`   Slug: ${workspace.slug}\n`);

    // Find Dano user
    console.log('🔍 Finding Dano user...');
    const user = await prisma.users.findFirst({
      where: { 
        email: { equals: TARGET_USER.email, mode: 'insensitive' },
        isActive: true 
      },
      select: { 
        id: true, 
        email: true, 
        name: true
      }
    });

    if (!user) {
      throw new Error(`User not found: ${TARGET_USER.email}`);
    }

    console.log(`✅ Found user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Email: ${user.email}\n`);

    // ========================================
    // PROCESS COMPANIES
    // ========================================
    console.log('='.repeat(80));
    console.log('📋 PROCESSING COMPANIES');
    console.log('='.repeat(80) + '\n');

    // Get all companies assigned to dano
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: user.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Total companies assigned to Dano: ${allCompanies.length}\n`);

    if (allCompanies.length === 0) {
      console.log('No companies to process.\n');
    } else {
      // Check actions for each company
      console.log('🔍 Checking actions for each company...');
      const companiesToUnassign = [];
      const companiesToKeep = [];

      // System action types to exclude (not meaningful engagement)
      const SYSTEM_ACTION_TYPES = [
        'person_created',
        'company_created',
        'record_created',
        'record_updated',
        'note_added',
        'field_updated',
        'status_changed',
        'stage_advanced'
      ];

      for (const company of allCompanies) {
        // Count meaningful actions (excluding system actions) for this company by dano
        // Get all actions first, then filter out system actions
        const allActions = await prisma.actions.findMany({
          where: {
            companyId: company.id,
            userId: user.id,
            workspaceId: workspace.id,
            deletedAt: null
          },
          select: {
            type: true,
            subject: true
          }
        });

        // Filter out system actions (by type or subject pattern)
        const meaningfulActions = allActions.filter(action => {
          // Exclude by type
          if (SYSTEM_ACTION_TYPES.includes(action.type)) {
            return false;
          }
          // Exclude by subject pattern (system-created records)
          if (action.subject && (
            action.subject.startsWith('New company added') ||
            action.subject.startsWith('New person added') ||
            action.subject.startsWith('System created new')
          )) {
            return false;
          }
          return true;
        });

        const actionCount = meaningfulActions.length;

        if (actionCount === 0) {
          companiesToUnassign.push(company);
        } else {
          companiesToKeep.push({ ...company, actionCount });
        }
      }

      console.log(`Companies with actions: ${companiesToKeep.length}`);
      console.log(`Companies with ZERO actions: ${companiesToUnassign.length}\n`);

      // Show sample of what will be unassigned
      if (companiesToUnassign.length > 0) {
        console.log('Sample companies being unassigned (first 10):');
        companiesToUnassign.slice(0, 10).forEach(c => {
          console.log(`   - ${c.name}`);
        });
        console.log('');

        // Unassign companies
        const companyIds = companiesToUnassign.map(c => c.id);
        console.log('🔄 Unassigning Dano from companies with zero actions...');
        const companyResult = await prisma.companies.updateMany({
          where: {
            id: { in: companyIds }
          },
          data: {
            mainSellerId: null,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Unassigned Dano from ${companyResult.count} companies\n`);
      } else {
        console.log('✅ No companies to unassign (all have actions)\n');
      }
    }

    // ========================================
    // PROCESS PEOPLE
    // ========================================
    console.log('='.repeat(80));
    console.log('👥 PROCESSING PEOPLE');
    console.log('='.repeat(80) + '\n');

    // Get all people assigned to dano
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: user.id,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true
      }
    });

    console.log(`Total people assigned to Dano: ${allPeople.length}\n`);

    if (allPeople.length === 0) {
      console.log('No people to process.\n');
    } else {
      // Check actions for each person
      console.log('🔍 Checking actions for each person...');
      const peopleToUnassign = [];
      const peopleToKeep = [];

      // System action types to exclude (not meaningful engagement)
      const SYSTEM_ACTION_TYPES = [
        'person_created',
        'company_created',
        'record_created',
        'record_updated',
        'note_added',
        'field_updated',
        'status_changed',
        'stage_advanced'
      ];

      for (const person of allPeople) {
        // Count meaningful actions (excluding system actions) for this person by dano
        // Get all actions first, then filter out system actions
        const allActions = await prisma.actions.findMany({
          where: {
            personId: person.id,
            userId: user.id,
            workspaceId: workspace.id,
            deletedAt: null
          },
          select: {
            type: true,
            subject: true
          }
        });

        // Filter out system actions (by type or subject pattern)
        const meaningfulActions = allActions.filter(action => {
          // Exclude by type
          if (SYSTEM_ACTION_TYPES.includes(action.type)) {
            return false;
          }
          // Exclude by subject pattern (system-created records)
          if (action.subject && (
            action.subject.startsWith('New company added') ||
            action.subject.startsWith('New person added') ||
            action.subject.startsWith('System created new')
          )) {
            return false;
          }
          return true;
        });

        const actionCount = meaningfulActions.length;

        if (actionCount === 0) {
          peopleToUnassign.push(person);
        } else {
          peopleToKeep.push({ ...person, actionCount });
        }
      }

      console.log(`People with actions: ${peopleToKeep.length}`);
      console.log(`People with ZERO actions: ${peopleToUnassign.length}\n`);

      // Show sample of what will be unassigned
      if (peopleToUnassign.length > 0) {
        console.log('Sample people being unassigned (first 10):');
        peopleToUnassign.slice(0, 10).forEach(p => {
          console.log(`   - ${p.fullName}`);
        });
        console.log('');

        // Unassign people
        const peopleIds = peopleToUnassign.map(p => p.id);
        console.log('🔄 Unassigning Dano from people with zero actions...');
        const peopleResult = await prisma.people.updateMany({
          where: {
            id: { in: peopleIds }
          },
          data: {
            mainSellerId: null,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Unassigned Dano from ${peopleResult.count} people\n`);
      } else {
        console.log('✅ No people to unassign (all have actions)\n');
      }
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    const companiesUnassigned = allCompanies.length > 0 ? 
      (await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          mainSellerId: user.id,
          deletedAt: null
        }
      })) : 0;
    
    const peopleUnassigned = allPeople.length > 0 ?
      (await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          mainSellerId: user.id,
          deletedAt: null
        }
      })) : 0;

    console.log(`Companies remaining assigned to Dano: ${companiesUnassigned}`);
    console.log(`People remaining assigned to Dano: ${peopleUnassigned}`);
    console.log('\n✅ COMPLETED SUCCESSFULLY!\n');

    return { 
      success: true,
      companiesUnassigned: allCompanies.length - companiesUnassigned,
      peopleUnassigned: allPeople.length - peopleUnassigned,
      companiesRemaining: companiesUnassigned,
      peopleRemaining: peopleUnassigned
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

unassignDanoZeroActions();

