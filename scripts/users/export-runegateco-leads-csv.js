#!/usr/bin/env node

/**
 * Export RuneGateCo Leads to CSV
 * 
 * Exports all leads for runegateco workspace to CSV with columns for:
 * - Lead information (name, email, phone, etc.)
 * - Josh or Marcus assignment
 * - Notes column for fixing logins later
 * 
 * Usage: node scripts/users/export-runegateco-leads-csv.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
}

async function main() {
  console.log('\n============================================================');
  console.log('   EXPORT RUNEGATECO LEADS TO CSV');
  console.log('============================================================\n');

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find runegateco workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: WORKSPACE_ID },
          { slug: 'runegateco' },
          { name: { contains: 'rune gate', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      throw new Error('RuneGateCo workspace not found!');
    }
    console.log(`Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Get users
    const josh = await prisma.users.findFirst({ 
      where: { email: 'finn@runegateco.com' } 
    });
    const marcus = await prisma.users.findFirst({ 
      where: { email: 'clients@runegateco.com' } 
    });

    if (!josh || !marcus) {
      throw new Error('Josh or Marcus user not found!');
    }

    console.log('USERS:');
    console.log(`  Josh: ${josh.name || josh.email} (${josh.id})`);
    console.log(`  Marcus: ${marcus.name || marcus.email} (${marcus.id})\n`);

    // Get all leads (people) for this workspace
    const leads = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        company: true,
        jobTitle: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        status: true,
        priority: true,
        source: true,
        notes: true,
        mainSellerId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${leads.length} leads in RuneGateCo workspace\n`);

    // Create CSV header
    const csvRows = [
      [
        'ID',
        'Full Name',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Mobile Phone',
        'Work Phone',
        'Company',
        'Job Title',
        'City',
        'State',
        'Country',
        'Postal Code',
        'Status',
        'Priority',
        'Source',
        'Josh or Marcus',
        'Notes',
        'Created Date',
        'Updated Date'
      ].join(',')
    ];

    // Add each lead to CSV
    for (const lead of leads) {
      // Determine assignment
      let assignment = '';
      if (lead.mainSellerId === josh.id) {
        assignment = 'Josh';
      } else if (lead.mainSellerId === marcus.id) {
        assignment = 'Marcus';
      } else if (lead.mainSellerId) {
        assignment = 'Other';
      }

      // Get best phone number
      const phone = lead.phone || lead.mobilePhone || lead.workPhone || '';

      csvRows.push([
        escapeCsv(lead.id),
        escapeCsv(lead.fullName),
        escapeCsv(lead.firstName),
        escapeCsv(lead.lastName),
        escapeCsv(lead.email),
        escapeCsv(phone),
        escapeCsv(lead.mobilePhone),
        escapeCsv(lead.workPhone),
        escapeCsv(lead.company),
        escapeCsv(lead.jobTitle),
        escapeCsv(lead.city),
        escapeCsv(lead.state),
        escapeCsv(lead.country),
        escapeCsv(lead.postalCode),
        escapeCsv(lead.status),
        escapeCsv(lead.priority),
        escapeCsv(lead.source),
        escapeCsv(assignment),
        escapeCsv(lead.notes?.replace(/\n/g, ' | ')),
        escapeCsv(lead.createdAt?.toISOString().split('T')[0]),
        escapeCsv(lead.updatedAt?.toISOString().split('T')[0])
      ].join(','));
    }

    // Write CSV file
    const exportDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const csvPath = path.join(exportDir, `runegateco-leads-${timestamp}.csv`);

    fs.writeFileSync(csvPath, csvRows.join('\n'));

    console.log('✅ CSV file exported successfully!');
    console.log(`   Location: ${csvPath}`);
    console.log(`   Records: ${leads.length}`);
    console.log(`\n   Breakdown:`);
    console.log(`   - Assigned to Josh: ${leads.filter(l => l.mainSellerId === josh.id).length}`);
    console.log(`   - Assigned to Marcus: ${leads.filter(l => l.mainSellerId === marcus.id).length}`);
    console.log(`   - Unassigned/Other: ${leads.filter(l => !l.mainSellerId || (l.mainSellerId !== josh.id && l.mainSellerId !== marcus.id)).length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
