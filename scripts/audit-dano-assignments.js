#!/usr/bin/env node

/**
 * Audit Dano's Current Assignments in Notary Everyday Workspace
 * 
 * This script checks how many companies and people are currently assigned to dano.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_USER = {
  email: 'dano@notaryeveryday.com',
  name: 'Dano'
};

async function auditDanoAssignments() {
  console.log('========================================');
  console.log('   AUDIT: DANO ASSIGNMENTS');
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
    // COUNT COMPANIES
    // ========================================
    console.log('='.repeat(80));
    console.log('📋 COMPANIES ASSIGNED TO DANO');
    console.log('='.repeat(80) + '\n');

    const companyCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: user.id,
        deletedAt: null
      }
    });

    console.log(`Total companies assigned to Dano: ${companyCount}\n`);

    // Get sample companies
    const sampleCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: user.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (sampleCompanies.length > 0) {
      console.log('Sample companies (most recent 10):');
      sampleCompanies.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (created: ${c.createdAt.toISOString().split('T')[0]})`);
      });
      console.log('');
    }

    // ========================================
    // COUNT PEOPLE
    // ========================================
    console.log('='.repeat(80));
    console.log('👥 PEOPLE ASSIGNED TO DANO');
    console.log('='.repeat(80) + '\n');

    const peopleCount = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: user.id,
        deletedAt: null
      }
    });

    console.log(`Total people assigned to Dano: ${peopleCount}\n`);

    // Get sample people
    const samplePeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: user.id,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        createdAt: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (samplePeople.length > 0) {
      console.log('Sample people (most recent 10):');
      samplePeople.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.fullName || 'N/A'} (created: ${p.createdAt.toISOString().split('T')[0]})`);
      });
      console.log('');
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.log(`Companies assigned to Dano: ${companyCount}`);
    console.log(`People assigned to Dano: ${peopleCount}`);
    console.log('');
    console.log(`Expected: 122 companies, 245 people`);
    console.log(`Actual:   ${companyCount} companies, ${peopleCount} people`);
    console.log('');
    
    if (companyCount === 122 && peopleCount === 245) {
      console.log('✅ Counts match expected values!');
    } else {
      console.log('⚠️  Counts do NOT match expected values');
      if (companyCount !== 122) {
        console.log(`   Companies: Expected 122, got ${companyCount} (difference: ${companyCount - 122})`);
      }
      if (peopleCount !== 245) {
        console.log(`   People: Expected 245, got ${peopleCount} (difference: ${peopleCount - 245})`);
      }
    }
    console.log('');

    return { 
      success: true,
      companyCount,
      peopleCount,
      expectedCompanies: 122,
      expectedPeople: 245
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

auditDanoAssignments();

