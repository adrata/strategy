#!/usr/bin/env node

/**
 * 🔧 FIX EXTERNAL CORESIGNAL IDS
 * 
 * Identifies and fixes records with external Coresignal IDs
 * These IDs prevent proper data loading and navigation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function fixExternalIds() {
  console.log('🔧 FIXING EXTERNAL CORESIGNAL IDS');
  console.log('==================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. FIND ALL RECORDS WITH EXTERNAL IDS
    console.log('🔍 Finding records with external Coresignal IDs...');
    
    const externalAccounts = await prisma.accounts.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } },
          { externalId: { not: null } }
        ]
      },
      select: { id: true, name: true, workspaceId: true, externalId: true }
    });
    
    const externalLeads = await prisma.leads.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } },
          { externalId: { not: null } }
        ]
      },
      select: { id: true, fullName: true, workspaceId: true, externalId: true }
    });
    
    const externalContacts = await prisma.contacts.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } },
          { externalId: { not: null } }
        ]
      },
      select: { id: true, fullName: true, workspaceId: true, externalId: true }
    });
    
    console.log(`📊 Found external IDs:`);
    console.log(`   Accounts: ${externalAccounts.length}`);
    console.log(`   Leads: ${externalLeads.length}`);
    console.log(`   Contacts: ${externalContacts.length}`);
    console.log(`   Total: ${externalAccounts.length + externalLeads.length + externalContacts.length}`);
    
    if (externalAccounts.length + externalLeads.length + externalContacts.length === 0) {
      console.log('✅ No external IDs found!');
      return;
    }
    
    // 2. ANALYZE EXTERNAL ID PATTERNS
    console.log('\n🔍 Analyzing external ID patterns...');
    
    const allExternalIds = [
      ...externalAccounts.map(a => ({ type: 'account', ...a })),
      ...externalLeads.map(l => ({ type: 'lead', ...l })),
      ...externalContacts.map(c => ({ type: 'contact', ...c }))
    ];
    
    const idPatterns = {};
    allExternalIds.forEach(record => {
      const pattern = record.id.substring(0, 10) + '...';
      if (!idPatterns[pattern]) {
        idPatterns[pattern] = { count: 0, examples: [] };
      }
      idPatterns[pattern].count++;
      if (idPatterns[pattern].examples.length < 3) {
        idPatterns[pattern].examples.push(record);
      }
    });
    
    console.log('\n📋 External ID patterns:');
    Object.entries(idPatterns).forEach(([pattern, info]) => {
      console.log(`   ${pattern}: ${info.count} records`);
      info.examples.forEach(example => {
        console.log(`     - ${example.type}: ${example.fullName || example.name} (${example.id})`);
      });
    });
    
    // 3. GENERATE CLEANUP RECOMMENDATIONS
    console.log('\n📋 CLEANUP RECOMMENDATIONS:');
    console.log('============================');
    
    if (externalAccounts.length > 0) {
      console.log(`\n🏢 ACCOUNTS (${externalAccounts.length}):`);
      console.log('   These should be converted to internal accounts or removed');
      externalAccounts.slice(0, 5).forEach(account => {
        console.log(`   - ${account.name} (${account.id})`);
      });
      if (externalAccounts.length > 5) {
        console.log(`   ... and ${externalAccounts.length - 5} more`);
      }
    }
    
    if (externalLeads.length > 0) {
      console.log(`\n👤 LEADS (${externalLeads.length}):`);
      console.log('   These should be converted to internal leads or removed');
      externalLeads.slice(0, 5).forEach(lead => {
        console.log(`   - ${lead.fullName} (${lead.id})`);
      });
      if (externalLeads.length > 5) {
        console.log(`   ... and ${externalLeads.length - 5} more`);
      }
    }
    
    if (externalContacts.length > 0) {
      console.log(`\n📞 CONTACTS (${externalContacts.length}):`);
      console.log('   These should be converted to internal contacts or removed');
      externalContacts.slice(0, 5).forEach(contact => {
        console.log(`   - ${contact.fullName} (${contact.id})`);
      });
      if (externalContacts.length > 5) {
        console.log(`   ... and ${externalContacts.length - 5} more`);
      }
    }
    
    // 4. SAVE DETAILED REPORT
    console.log('\n📋 Saving detailed report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalExternalRecords: allExternalIds.length,
        accounts: externalAccounts.length,
        leads: externalLeads.length,
        contacts: externalContacts.length
      },
      externalAccounts,
      externalLeads,
      externalContacts,
      idPatterns,
      recommendations: [
        'Convert external Coresignal IDs to internal database IDs',
        'Remove duplicate external records',
        'Ensure all new imports use internal IDs only',
        'Update frontend to handle external ID conversion'
      ]
    };
    
    const fs = await import('fs');
    const reportPath = 'scripts/reports/external-ids-cleanup-report.json';
    
    // Ensure reports directory exists
    const reportsDir = 'scripts/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Detailed report saved to: ${reportPath}`);
    
    // 5. IMMEDIATE ACTION ITEMS
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
    console.log('=============================');
    console.log('1. Review external ID records in the detailed report');
    console.log('2. Decide whether to convert or remove external records');
    console.log('3. Update import scripts to prevent future external IDs');
    console.log('4. Test data loading after cleanup');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (import.meta.url === `file://${process.argv[1]}`) {
  fixExternalIds();
}
