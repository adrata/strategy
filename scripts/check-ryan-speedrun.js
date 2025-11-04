#!/usr/bin/env node

/**
 * Check Ryan's Speedrun data - companies and people assigned to him
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRyanSpeedrun() {
  try {
    await prisma.$connect();
    
    // Find Ryan
    const ryan = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'ryan@notaryeveryday.com' },
          { email: 'ryan@notary-everyday.com' },
          { name: { contains: 'Ryan Serrato', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        activeWorkspaceId: true
      }
    });
    
    if (!ryan) {
      console.log('❌ Ryan user not found');
      return;
    }

    console.log('👤 Ryan Information:');
    console.log('===================');
    console.log(`Name: ${ryan.name}`);
    console.log(`Email: ${ryan.email}`);
    console.log(`User ID: ${ryan.id}`);
    console.log(`Active Workspace: ${ryan.activeWorkspaceId}\n`);

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: 'notary-everyday' },
          { slug: 'ne' }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`🏢 Workspace: ${workspace.name} (${workspace.id})\n`);

    // Check companies where Ryan is main seller
    const companiesAsMainSeller = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id
      },
      select: {
        id: true,
        name: true,
        mainSellerId: true,
        createdAt: true
      }
    });

    console.log('🏢 Companies with Ryan as Main Seller:');
    console.log('=====================================');
    console.log(`Total: ${companiesAsMainSeller.length}`);
    if (companiesAsMainSeller.length > 0) {
      companiesAsMainSeller.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (${company.id})`);
      });
      if (companiesAsMainSeller.length > 10) {
        console.log(`... and ${companiesAsMainSeller.length - 10} more`);
      }
    } else {
      console.log('❌ No companies found with Ryan as main seller');
    }

    // Check people where Ryan is main seller
    const peopleAsMainSeller = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mainSellerId: true,
        createdAt: true
      }
    });

    console.log('\n👥 People with Ryan as Main Seller:');
    console.log('===================================');
    console.log(`Total: ${peopleAsMainSeller.length}`);
    if (peopleAsMainSeller.length > 0) {
      peopleAsMainSeller.slice(0, 10).forEach((person, index) => {
        const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'No name';
        console.log(`${index + 1}. ${name} (${person.email || 'No email'}) - ${person.id}`);
      });
      if (peopleAsMainSeller.length > 10) {
        console.log(`... and ${peopleAsMainSeller.length - 10} more`);
      }
    } else {
      console.log('❌ No people found with Ryan as main seller');
    }

    // Check total companies and people in workspace
    const totalCompanies = await prisma.companies.count({
      where: { workspaceId: workspace.id }
    });

    const totalPeople = await prisma.people.count({
      where: { workspaceId: workspace.id }
    });

    console.log('\n📊 Workspace Totals:');
    console.log('====================');
    console.log(`Total Companies: ${totalCompanies}`);
    console.log(`Total People: ${totalPeople}`);
    console.log(`Companies with Ryan: ${companiesAsMainSeller.length} (${totalCompanies > 0 ? ((companiesAsMainSeller.length / totalCompanies * 100).toFixed(1)) : 0}%)`);
    console.log(`People with Ryan: ${peopleAsMainSeller.length} (${totalPeople > 0 ? ((peopleAsMainSeller.length / totalPeople * 100).toFixed(1)) : 0}%)`);

    // Check if there are other sellers assigned
    const otherSellers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id,
        isActive: true,
        role: { in: ['SELLER', 'WORKSPACE_ADMIN', 'MANAGER'] }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log('\n👥 Other Sellers in Workspace:');
    console.log('==============================');
    otherSellers.forEach((member) => {
      const isRyan = member.userId === ryan.id;
      console.log(`${isRyan ? '→ ' : '  '}${member.user.name} (${member.user.email}) - ${member.role}${isRyan ? ' [RYAN]' : ''}`);
    });

    // Check who has the most assignments
    const sellerStats = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT c.id) as company_count,
        COUNT(DISTINCT p.id) as people_count
      FROM users u
      LEFT JOIN companies c ON c."mainSellerId" = u.id AND c."workspaceId" = ${workspace.id}
      LEFT JOIN people p ON p."mainSellerId" = u.id AND p."workspaceId" = ${workspace.id}
      WHERE u.id IN (
        SELECT "userId" FROM workspace_users 
        WHERE "workspaceId" = ${workspace.id} AND "isActive" = true
      )
      GROUP BY u.id, u.name, u.email
      ORDER BY company_count DESC, people_count DESC
    `;

    console.log('\n📈 Assignment Statistics:');
    console.log('=========================');
    sellerStats.forEach((stat) => {
      const isRyan = stat.id === ryan.id;
      console.log(`${isRyan ? '→ ' : '  '}${stat.name}: ${stat.company_count} companies, ${stat.people_count} people${isRyan ? ' [RYAN]' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error checking Speedrun data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRyanSpeedrun();

