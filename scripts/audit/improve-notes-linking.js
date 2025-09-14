const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function improveNotesLinking() {
  try {
    console.log('🔧 IMPROVING NOTES LINKING USING CSV DATA');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. READ ORIGINAL CSV FILES TO GET PARENT ID MAPPING
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
        
        // Map Record Id to Parent ID
        records.forEach(record => {
          if (record.Record_Id && record.Parent_ID) {
            parentIdMapping[record.Record_Id] = {
              parentId: record.Parent_ID,
              parentType: record.Parent_ID?.startsWith('zcrm_') ? 'zoho' : 'unknown',
              noteTitle: record.Note_Title,
              noteContent: record.Note_Content
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
    
    // 3. ATTEMPT TO LINK USING PARENT ID MAPPING
    let linkedCount = 0;
    const linkingResults = [];
    
    for (const note of unlinkedNotes) {
      const mapping = parentIdMapping[note.id];
      
      if (mapping && mapping.parentId) {
        // Try to find the entity by Parent ID
        let entity = null;
        let entityType = null;
        
        // Check if Parent ID exists in our database
        // First, try to find by exact ID match
        const contact = await prisma.contacts.findFirst({
          where: { id: mapping.parentId }
        });
        
        if (contact) {
          entity = contact;
          entityType = 'contact';
        } else {
          const account = await prisma.accounts.findFirst({
            where: { id: mapping.parentId }
          });
          
          if (account) {
            entity = account;
            entityType = 'account';
          } else {
            const lead = await prisma.leads.findFirst({
              where: { id: mapping.parentId }
            });
            
            if (lead) {
              entity = lead;
              entityType = 'lead';
            } else {
              const opportunity = await prisma.opportunities.findFirst({
                where: { id: mapping.parentId }
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
    
    console.log(`✅ LINKED ${linkedCount} NOTES USING PARENT ID MAPPING`);
    console.log('-'.repeat(40));
    
    if (linkingResults.length > 0) {
      console.log('   Successfully linked notes:');
      linkingResults.forEach((result, index) => {
        console.log(`      ${index + 1}. "${result.noteTitle}" → ${result.entityType}: ${result.entityName}`);
      });
    }
    console.log('');
    
    // 4. ATTEMPT CONTENT-BASED LINKING FOR REMAINING NOTES
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
        },
        take: 10 // Process first 10 for content-based linking
      });
      
      let contentLinkedCount = 0;
      
      for (const note of remainingNotes) {
        if (note.content) {
          const content = note.content.toLowerCase();
          
          // Extract potential company names from content
          const companyKeywords = ['company', 'corp', 'inc', 'llc', 'ltd', 'group', 'enterprises'];
          const words = content.split(' ').filter(word => 
            word.length > 3 && 
            !companyKeywords.includes(word) &&
            !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'they', 'have', 'been', 'will', 'were'].includes(word)
          );
          
          // Try to match with company names
          for (const word of words.slice(0, 3)) { // Check first 3 meaningful words
            const companies = await prisma.accounts.findMany({
              where: {
                OR: [
                  { name: { contains: word, mode: 'insensitive' } },
                  { legalName: { contains: word, mode: 'insensitive' } },
                  { tradingName: { contains: word, mode: 'insensitive' } }
                ]
              },
              select: { id: true, name: true }
            });
            
            if (companies.length === 1) { // Only link if we find exactly one match
              await prisma.notes.update({
                where: { id: note.id },
                data: { accountId: companies[0].id }
              });
              
              contentLinkedCount++;
              console.log(`      Linked "${note.title}" to company: ${companies[0].name}`);
              break;
            }
          }
        }
      }
      
      console.log(`✅ CONTENT-BASED LINKING: ${contentLinkedCount} additional notes linked`);
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
    console.log(`   Improvement: +${linkedCount} notes linked using Parent ID mapping`);
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

improveNotesLinking();
