const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function improveNotesLinkingV2() {
  try {
    console.log('🔧 IMPROVING NOTES LINKING USING CSV PARENT ID.ID');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. READ ORIGINAL CSV FILES TO GET PARENT ID.ID MAPPING
    const csvFiles = [
      '/Users/rosssylvester/Desktop/new-New/Notes_Contacts_2025_09_06.csv',
      '/Users/rosssylvester/Desktop/new-New/Notes_Accounts_2025_09_06.csv',
      '/Users/rosssylvester/Desktop/new-New/Notes_Leads_2025_09_06.csv',
      '/Users/rosssylvester/Desktop/new-New/Notes_Deals_2025_09_06.csv'
    ];
    
    const parentIdMapping = {};
    let totalCsvRecords = 0;
    
    for (const filePath of csvFiles) {
      if (fs.existsSync(filePath)) {
        console.log(`📁 Reading ${filePath.split('/').pop()}...`);
        
        const records = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
              records.push(row);
              totalCsvRecords++;
            })
            .on('end', resolve)
            .on('error', reject);
        });
        
        // Map Record Id to Parent ID.id
        records.forEach(record => {
          if (record['Record Id'] && record['Parent ID.id']) {
            parentIdMapping[record['Record Id']] = {
              parentIdId: record['Parent ID.id'],
              parentIdName: record['Parent ID'],
              noteTitle: record['Note Title'],
              noteContent: record['Note Content']
            };
          }
        });
        
        console.log(`   Found ${records.length} records`);
      }
    }
    
    console.log(`   Total CSV records processed: ${totalCsvRecords}`);
    console.log(`   Parent ID mappings created: ${Object.keys(parentIdMapping).length}`);
    console.log('');
    
    // 2. GET UNLINKED NOTES
    const unlinkedNotes = await prisma.notes.findMany({
      where: {
        contactId: null,
        accountId: null,
        leadId: null,
        opportunityId: null
      },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        createdAt: true,
        externalId: true
      }
    });
    
    console.log(`📝 UNLINKED NOTES: ${unlinkedNotes.length}`);
    console.log('-'.repeat(40));
    
    // 3. ATTEMPT TO LINK USING PARENT ID.ID MAPPING
    let linkedCount = 0;
    const linkingResults = [];
    
    for (const note of unlinkedNotes) {
      const mapping = parentIdMapping[note.id];
      
      if (mapping && mapping.parentIdId) {
        // Try to find the entity by Parent ID.id
        let entity = null;
        let entityType = null;
        
        // Check if Parent ID.id exists in our database
        const contact = await prisma.contacts.findFirst({
          where: { id: mapping.parentIdId }
        });
        
        if (contact) {
          entity = contact;
          entityType = 'contact';
        } else {
          const account = await prisma.accounts.findFirst({
            where: { id: mapping.parentIdId }
          });
          
          if (account) {
            entity = account;
            entityType = 'account';
          } else {
            const lead = await prisma.leads.findFirst({
              where: { id: mapping.parentIdId }
            });
            
            if (lead) {
              entity = lead;
              entityType = 'lead';
            } else {
              const opportunity = await prisma.opportunities.findFirst({
                where: { id: mapping.parentIdId }
              });
              
              if (opportunity) {
                entity = opportunity;
                entityType = 'opportunity';
              }
            }
          }
        }
        
        if (entity) {
          // Update the note with the correct entity link
          const updateData = {};
          updateData[`${entityType}Id`] = entity.id;
          
          await prisma.notes.update({
            where: { id: note.id },
            data: updateData
          });
          
          linkedCount++;
          linkingResults.push({
            noteId: note.id,
            noteTitle: note.title,
            entityType: entityType,
            entityId: entity.id,
            entityName: entity.name || entity.firstName + ' ' + entity.lastName || 'Unknown'
          });
        }
      }
    }
    
    console.log(`✅ LINKED ${linkedCount} NOTES USING PARENT ID.ID MAPPING`);
    console.log('-'.repeat(40));
    
    if (linkingResults.length > 0) {
      console.log('   Successfully linked notes:');
      linkingResults.forEach((result, index) => {
        console.log(`      ${index + 1}. "${result.noteTitle}" → ${result.entityType}: ${result.entityName}`);
      });
    }
    console.log('');
    
    // 4. ATTEMPT NAME-BASED LINKING FOR REMAINING NOTES
    const remainingUnlinked = await prisma.notes.count({
      where: {
        contactId: null,
        accountId: null,
        leadId: null,
        opportunityId: null
      }
    });
    
    console.log(`📝 REMAINING UNLINKED NOTES: ${remainingUnlinked}`);
    console.log('-'.repeat(40));
    
    if (remainingUnlinked > 0) {
      const remainingNotes = await prisma.notes.findMany({
        where: {
          contactId: null,
          accountId: null,
          leadId: null,
          opportunityId: null
        },
        select: {
          id: true,
          type: true,
          title: true,
          content: true
        }
      });
      
      let nameLinkedCount = 0;
      
      for (const note of remainingNotes) {
        const mapping = parentIdMapping[note.id];
        
        if (mapping && mapping.parentIdName) {
          const parentName = mapping.parentIdName;
          
          // Try to find entity by name
          let entity = null;
          let entityType = null;
          
          // Try contacts first
          const contacts = await prisma.contacts.findMany({
            where: {
              OR: [
                { firstName: { contains: parentName, mode: 'insensitive' } },
                { lastName: { contains: parentName, mode: 'insensitive' } },
                { fullName: { contains: parentName, mode: 'insensitive' } }
              ]
            },
            select: { id: true, firstName: true, lastName: true, fullName: true }
          });
          
          if (contacts.length === 1) {
            entity = contacts[0];
            entityType = 'contact';
          } else {
            // Try accounts
            const accounts = await prisma.accounts.findMany({
              where: {
                OR: [
                  { name: { contains: parentName, mode: 'insensitive' } },
                  { legalName: { contains: parentName, mode: 'insensitive' } },
                  { tradingName: { contains: parentName, mode: 'insensitive' } }
                ]
              },
              select: { id: true, name: true, legalName: true, tradingName: true }
            });
            
            if (accounts.length === 1) {
              entity = accounts[0];
              entityType = 'account';
            } else {
              // Try leads
              const leads = await prisma.leads.findMany({
                where: {
                  OR: [
                    { firstName: { contains: parentName, mode: 'insensitive' } },
                    { lastName: { contains: parentName, mode: 'insensitive' } },
                    { fullName: { contains: parentName, mode: 'insensitive' } }
                  ]
                },
                select: { id: true, firstName: true, lastName: true, fullName: true }
              });
              
              if (leads.length === 1) {
                entity = leads[0];
                entityType = 'lead';
              } else {
                // Try opportunities
                const opportunities = await prisma.opportunities.findMany({
                  where: {
                    name: { contains: parentName, mode: 'insensitive' }
                  },
                  select: { id: true, name: true }
                });
                
                if (opportunities.length === 1) {
                  entity = opportunities[0];
                  entityType = 'opportunity';
                }
              }
            }
          }
          
          if (entity) {
            const updateData = {};
            updateData[`${entityType}Id`] = entity.id;
            
            await prisma.notes.update({
              where: { id: note.id },
              data: updateData
            });
            
            nameLinkedCount++;
            console.log(`      Linked "${note.title}" to ${entityType}: ${parentName}`);
          }
        }
      }
      
      console.log(`✅ NAME-BASED LINKING: ${nameLinkedCount} additional notes linked`);
    }
    
    // 5. FINAL STATISTICS
    const finalLinked = await prisma.notes.count({
      where: {
        OR: [
          { contactId: { not: null } },
          { accountId: { not: null } },
          { leadId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });
    
    const totalNotes = await prisma.notes.count();
    const finalLinkingRate = ((finalLinked / totalNotes) * 100).toFixed(1);
    
    console.log('');
    console.log('📊 FINAL RESULTS:');
    console.log('-'.repeat(40));
    console.log(`   Total notes: ${totalNotes}`);
    console.log(`   Linked notes: ${finalLinked} (${finalLinkingRate}%)`);
    console.log(`   Unlinked notes: ${totalNotes - finalLinked} (${(100 - finalLinkingRate).toFixed(1)}%)`);
    console.log(`   Improvement: +${linkedCount} notes linked using Parent ID.id mapping`);
    console.log('');
    
    if (finalLinkingRate > 40.3) {
      console.log(`🎉 SUCCESS! Improved linking rate from 40.3% to ${finalLinkingRate}%`);
    } else {
      console.log(`📝 Linking rate maintained at ${finalLinkingRate}%`);
    }
    
  } catch (error) {
    console.error('❌ Error improving notes linking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

improveNotesLinkingV2();
