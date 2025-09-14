const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeUnlinkedNotes() {
  try {
    console.log('🔍 ANALYZING UNLINKED NOTES FOR BETTER LINKING');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. GET UNLINKED NOTES
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📝 UNLINKED NOTES: ${unlinkedNotes.length}`);
    console.log('-'.repeat(40));
    
    // 2. ANALYZE UNLINKED NOTES BY TYPE
    const unlinkedByType = {};
    unlinkedNotes.forEach(note => {
      unlinkedByType[note.type] = (unlinkedByType[note.type] || 0) + 1;
    });
    
    console.log('   Unlinked notes by type:');
    Object.entries(unlinkedByType).forEach(([type, count]) => {
      console.log(`      ${type}: ${count}`);
    });
    console.log('');
    
    // 3. SAMPLE UNLINKED NOTES
    console.log('📋 SAMPLE UNLINKED NOTES:');
    console.log('-'.repeat(40));
    
    unlinkedNotes.slice(0, 10).forEach((note, index) => {
      console.log(`   ${index + 1}. "${note.title}"`);
      console.log(`      Type: ${note.type}`);
      console.log(`      External ID: ${note.externalId}`);
      console.log(`      Content: ${note.content?.substring(0, 150)}...`);
      console.log(`      Created: ${note.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // 4. ANALYZE CONTENT FOR LINKING OPPORTUNITIES
    console.log('🔍 ANALYZING CONTENT FOR LINKING OPPORTUNITIES:');
    console.log('-'.repeat(40));
    
    let potentialLinks = 0;
    const linkingOpportunities = [];
    
    for (const note of unlinkedNotes.slice(0, 20)) { // Check first 20
      if (note.content) {
        const content = note.content.toLowerCase();
        
        // Look for company names in content
        const companies = await prisma.accounts.findMany({
          where: {
            OR: [
              { name: { contains: content.split(' ')[0], mode: 'insensitive' } },
              { legalName: { contains: content.split(' ')[0], mode: 'insensitive' } },
              { tradingName: { contains: content.split(' ')[0], mode: 'insensitive' } }
            ]
          },
          select: { id: true, name: true, legalName: true, tradingName: true }
        });
        
        // Look for contact names in content
        const words = content.split(' ').filter(word => word.length > 2);
        let foundContacts = [];
        
        for (const word of words.slice(0, 5)) { // Check first 5 words
          const contacts = await prisma.contacts.findMany({
            where: {
              OR: [
                { firstName: { contains: word, mode: 'insensitive' } },
                { lastName: { contains: word, mode: 'insensitive' } }
              ]
            },
            select: { id: true, firstName: true, lastName: true }
          });
          
          if (contacts.length > 0) {
            foundContacts = contacts;
            break;
          }
        }
        
        if (companies.length > 0 || foundContacts.length > 0) {
          potentialLinks++;
          linkingOpportunities.push({
            noteId: note.id,
            title: note.title,
            type: note.type,
            companies: companies,
            contacts: foundContacts,
            content: note.content.substring(0, 100)
          });
        }
      }
    }
    
    console.log(`   Found ${potentialLinks} notes with potential linking opportunities`);
    console.log('');
    
    // 5. SHOW LINKING OPPORTUNITIES
    if (linkingOpportunities.length > 0) {
      console.log('💡 LINKING OPPORTUNITIES:');
      console.log('-'.repeat(40));
      
      linkingOpportunities.forEach((opp, index) => {
        console.log(`   ${index + 1}. "${opp.title}"`);
        console.log(`      Type: ${opp.type}`);
        console.log(`      Content: ${opp.content}...`);
        
        if (opp.companies.length > 0) {
          console.log(`      Potential Companies: ${opp.companies.map(c => c.name).join(', ')}`);
        }
        
        if (opp.contacts.length > 0) {
          console.log(`      Potential Contacts: ${opp.contacts.map(c => `${c.firstName} ${c.lastName}`).join(', ')}`);
        }
        console.log('');
      });
    }
    
    // 6. CHECK EXTERNAL IDS FOR BETTER LINKING
    console.log('🔍 CHECKING EXTERNAL IDS FOR LINKING:');
    console.log('-'.repeat(40));
    
    const notesWithExternalIds = unlinkedNotes.filter(note => note.externalId);
    console.log(`   Notes with external IDs: ${notesWithExternalIds.length}`);
    
    if (notesWithExternalIds.length > 0) {
      console.log('   Sample external IDs:');
      notesWithExternalIds.slice(0, 5).forEach(note => {
        console.log(`      ${note.externalId} - "${note.title}"`);
      });
    }
    
    // 7. SUGGESTIONS FOR IMPROVING LINKING
    console.log('');
    console.log('💡 SUGGESTIONS FOR IMPROVING LINKING:');
    console.log('-'.repeat(40));
    console.log('   1. Parse note content for company/contact names');
    console.log('   2. Use external IDs to match with Zoho parent records');
    console.log('   3. Implement fuzzy matching for company names');
    console.log('   4. Use note titles to identify entity types');
    console.log('   5. Cross-reference with original CSV data');
    console.log('');
    
    // 8. SUMMARY
    console.log('📊 SUMMARY:');
    console.log('-'.repeat(40));
    console.log(`   Total unlinked notes: ${unlinkedNotes.length}`);
    console.log(`   Notes with potential links: ${potentialLinks}`);
    console.log(`   Notes with external IDs: ${notesWithExternalIds.length}`);
    console.log(`   Improvement potential: ${((potentialLinks / unlinkedNotes.length) * 100).toFixed(1)}%`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error analyzing unlinked notes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUnlinkedNotes();
