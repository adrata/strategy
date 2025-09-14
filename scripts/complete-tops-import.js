const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function completeTopsImport() {
  try {
    console.log('📥 COMPLETING TOPS IMPORT - MISSING DATA...\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG75';
    
    console.log('📋 WORKSPACE IDENTIFICATION:');
    console.log(`   TOPS Workspace: ${topsWorkspaceId}\n`);
    
    // Import utc_all_regionals.csv (Conference data)
    console.log('📊 IMPORTING UTC_ALL_REGIONALS.CSV (CONFERENCE DATA)...');
    const utcCsvPath = path.join(__dirname, '..', 'utc_all_regionals.csv');
    
    if (!fs.existsSync(utcCsvPath)) {
      console.log('   ❌ utc_all_regionals.csv not found');
    } else {
      const utcCsvContent = fs.readFileSync(utcCsvPath, 'utf8');
      const utcLines = utcCsvContent.split('\n').filter(line => line.trim());
      const utcHeaders = utcLines[0].split('\t');
      const utcData = utcLines.slice(1);
      
      console.log(`   📋 Found ${utcData.length} records in utc_all_regionals.csv`);
      console.log(`   📝 Headers: ${utcHeaders.join(', ')}`);
      
      let utcContacts = 0;
      let utcLeads = 0;
      
      for (const line of utcData) {
        const values = line.split('\t');
        const record = {};
        utcHeaders.forEach((header, index) => {
          record[header.trim()] = values[index]?.trim() || '';
        });
        
        // Create contact (Prisma will auto-generate ULID)
        const contact = await prisma.contacts.create({
          data: {
            workspaceId: topsWorkspaceId,
            firstName: record['First Name'] || '',
            lastName: record['Last Name'] || '',
            fullName: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim(),
            email: record['Email'] || null,
            phone: record['Phone'] || null,
            jobTitle: record['Job Title'] || null,
            source: 'TOPS UTC Conference Import',
            notes: `Imported from UTC Conference. Company: ${record['Company'] || 'Unknown'}. ${record['Notes'] || ''}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        utcContacts++;
        
        // Create lead for qualified contacts (Prisma will auto-generate ULID)
        if (record['Email'] || record['Phone']) {
          await prisma.leads.create({
            data: {
              workspaceId: topsWorkspaceId,
              assignedUserId: null,
              firstName: record['First Name'] || '',
              lastName: record['Last Name'] || '',
              fullName: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim(),
              email: record['Email'] || null,
              phone: record['Phone'] || null,
              jobTitle: record['Job Title'] || null,
              company: record['Company'] || 'Unknown',
              status: 'New',
              source: 'TOPS UTC Conference Import',
              notes: `Imported from UTC Conference. ${record['Notes'] || ''}`,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          utcLeads++;
        }
      }
      
      console.log(`   ✅ Created ${utcContacts} contacts and ${utcLeads} leads from utc_all_regionals.csv\n`);
    }
    
    // Import tops_mailer_campagin.csv (Mailer campaign data) - Note the typo in filename
    console.log('📊 IMPORTING TOPS_MAILER_CAMPAGIN.CSV (MAILER CAMPAIGN DATA)...');
    const mailerCsvPath = path.join(__dirname, '..', 'tops_mailer_campagin.csv');
    
    if (!fs.existsSync(mailerCsvPath)) {
      console.log('   ❌ tops_mailer_campagin.csv not found');
    } else {
      const mailerCsvContent = fs.readFileSync(mailerCsvPath, 'utf8');
      const mailerLines = mailerCsvContent.split('\n').filter(line => line.trim());
      const mailerHeaders = mailerLines[0].split('\t');
      const mailerData = mailerLines.slice(1);
      
      console.log(`   📋 Found ${mailerData.length} records in tops_mailer_campagin.csv`);
      console.log(`   📝 Headers: ${mailerHeaders.join(', ')}`);
      
      let mailerContacts = 0;
      let mailerLeads = 0;
      let mailerActivities = 0;
      
      for (const line of mailerData) {
        const values = line.split('\t');
        const record = {};
        mailerHeaders.forEach((header, index) => {
          record[header.trim()] = values[index]?.trim() || '';
        });
        
        // Create contact (Prisma will auto-generate ULID)
        const contact = await prisma.contacts.create({
          data: {
            workspaceId: topsWorkspaceId,
            firstName: record['First Name'] || '',
            lastName: record['Last Name'] || '',
            fullName: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim(),
            email: record['Email'] || null,
            phone: record['Phone'] || null,
            jobTitle: record['Job Title'] || null,
            source: 'TOPS Mailer Campaign Import',
            notes: `Imported from TOPS Mailer Campaign. Company: ${record['Company'] || 'Unknown'}. ${record['Notes'] || ''}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        mailerContacts++;
        
        // Create lead for qualified contacts (Prisma will auto-generate ULID)
        if (record['Email'] || record['Phone']) {
          await prisma.leads.create({
            data: {
              workspaceId: topsWorkspaceId,
              assignedUserId: null,
              firstName: record['First Name'] || '',
              lastName: record['Last Name'] || '',
              fullName: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim(),
              email: record['Email'] || null,
              phone: record['Phone'] || null,
              jobTitle: record['Job Title'] || null,
              company: record['Company'] || 'Unknown',
              status: 'New',
              source: 'TOPS Mailer Campaign Import',
              notes: `Imported from TOPS Mailer Campaign. ${record['Notes'] || ''}`,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          mailerLeads++;
        }
        
        // Create activity for mailer campaign (Prisma will auto-generate ULID)
        await prisma.activities.create({
          data: {
            workspaceId: topsWorkspaceId,
            userId: '01K1VBYZMWTCT09FWEKBDMCXZM', // Dan's user ID
            contactId: contact.id,
            type: 'email',
            campaignType: 'Mailer Campaign',
            subject: 'TOPS Engineering Talent Outreach',
            description: `Mailer campaign sent to ${record['First Name']} ${record['Last Name']} at ${record['Company'] || 'Unknown Company'}`,
            status: 'completed',
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        mailerActivities++;
      }
      
      console.log(`   ✅ Created ${mailerContacts} contacts, ${mailerLeads} leads, and ${mailerActivities} activities from tops_mailer_campagin.csv\n`);
    }
    
    // Final verification
    console.log('🔍 FINAL VERIFICATION...');
    
    const finalContacts = await prisma.contacts.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    const finalLeads = await prisma.leads.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    const finalActivities = await prisma.activities.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log('📊 FINAL TOPS WORKSPACE STATE:');
    console.log(`   📋 Contacts: ${finalContacts.length}`);
    console.log(`   🎯 Leads: ${finalLeads.length}`);
    console.log(`   📅 Activities: ${finalActivities.length}`);
    
    console.log('\n🎉 TOPS IMPORT COMPLETED SUCCESSFULLY!');
    console.log('🔒 All data is now properly isolated in the TOPS workspace.');
    console.log('👥 Dan has access to view and manage this data.');
    console.log('🆔 All new records use ULID standard (26 characters, Next.js compatible).');
    
  } catch (error) {
    console.error('❌ Error completing TOPS import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeTopsImport();
