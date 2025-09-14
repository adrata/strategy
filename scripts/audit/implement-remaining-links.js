const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function implementRemainingLinks() {
  try {
    console.log('🔧 IMPLEMENTING REMAINING NOTE LINKS');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. GET REMAINING UNLINKED NOTES
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
        content: true
      }
    });
    
    console.log(`📝 PROCESSING ${unlinkedNotes.length} UNLINKED NOTES`);
    console.log('-'.repeat(40));
    
    let linkedCount = 0;
    const linkingResults = [];
    
    // 2. IMPLEMENT SMART LINKING FOR EACH NOTE
    for (const note of unlinkedNotes) {
      console.log(`\n🔍 Processing: "${note.title}"`);
      
      if (!note.content) {
        console.log('   ❌ No content to analyze');
        continue;
      }
      
      const content = note.content.toLowerCase();
      let bestMatch = null;
      let bestMatchType = null;
      let bestMatchScore = 0;
      
      // Extract meaningful keywords
      const words = content.split(/[\s,.\-()]+/).filter(word => 
        word.length > 2 && 
        !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'they', 'have', 'been', 'will', 'were', 'are', 'was', 'can', 'could', 'would', 'should', 'may', 'might', 'must', 'shall', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
      );
      
      // Try to find the best match based on note type and content
      for (const word of words.slice(0, 5)) { // Check first 5 meaningful words
        let matches = [];
        
        // Check contacts first (most common for contact notes)
        if (note.type === 'contact' || note.type === 'lead') {
          const contacts = await prisma.contacts.findMany({
            where: {
              OR: [
                { firstName: { contains: word, mode: 'insensitive' } },
                { lastName: { contains: word, mode: 'insensitive' } },
                { fullName: { contains: word, mode: 'insensitive' } }
              ]
            },
            select: { id: true, firstName: true, lastName: true, fullName: true }
          });
          
          if (contacts.length === 1) {
            matches.push({ type: 'contact', entity: contacts[0], score: 10 });
          } else if (contacts.length > 1) {
            // If multiple matches, try to find the best one
            const exactMatch = contacts.find(c => 
              c.firstName?.toLowerCase() === word.toLowerCase() || 
              c.lastName?.toLowerCase() === word.toLowerCase()
            );
            if (exactMatch) {
              matches.push({ type: 'contact', entity: exactMatch, score: 10 });
            }
          }
        }
        
        // Check accounts
        if (note.type === 'account' || note.type === 'opportunity') {
          const accounts = await prisma.accounts.findMany({
            where: {
              OR: [
                { name: { contains: word, mode: 'insensitive' } },
                { legalName: { contains: word, mode: 'insensitive' } },
                { tradingName: { contains: word, mode: 'insensitive' } }
              ]
            },
            select: { id: true, name: true, legalName: true, tradingName: true }
          });
          
          if (accounts.length === 1) {
            matches.push({ type: 'account', entity: accounts[0], score: 10 });
          } else if (accounts.length > 1) {
            // Try to find exact match
            const exactMatch = accounts.find(a => 
              a.name?.toLowerCase() === word.toLowerCase() ||
              a.legalName?.toLowerCase() === word.toLowerCase() ||
              a.tradingName?.toLowerCase() === word.toLowerCase()
            );
            if (exactMatch) {
              matches.push({ type: 'account', entity: exactMatch, score: 10 });
            }
          }
        }
        
        // Check leads
        if (note.type === 'lead') {
          const leads = await prisma.leads.findMany({
            where: {
              OR: [
                { firstName: { contains: word, mode: 'insensitive' } },
                { lastName: { contains: word, mode: 'insensitive' } },
                { fullName: { contains: word, mode: 'insensitive' } }
              ]
            },
            select: { id: true, firstName: true, lastName: true, fullName: true }
          });
          
          if (leads.length === 1) {
            matches.push({ type: 'lead', entity: leads[0], score: 10 });
          }
        }
        
        // Check opportunities
        if (note.type === 'opportunity') {
          const opportunities = await prisma.opportunities.findMany({
            where: {
              name: { contains: word, mode: 'insensitive' }
            },
            select: { id: true, name: true }
          });
          
          if (opportunities.length === 1) {
            matches.push({ type: 'opportunity', entity: opportunities[0], score: 10 });
          }
        }
        
        // Find the best match
        for (const match of matches) {
          if (match.score > bestMatchScore) {
            bestMatch = match.entity;
            bestMatchType = match.type;
            bestMatchScore = match.score;
          }
        }
        
        // If we found a good match, stop looking
        if (bestMatchScore >= 10) {
          break;
        }
      }
      
      // 3. IMPLEMENT THE LINK
      if (bestMatch && bestMatchType) {
        const updateData = {};
        updateData[`${bestMatchType}Id`] = bestMatch.id;
        
        await prisma.notes.update({
          where: { id: note.id },
          data: updateData
        });
        
        linkedCount++;
        const entityName = bestMatch.name || bestMatch.fullName || `${bestMatch.firstName} ${bestMatch.lastName}`;
        linkingResults.push({
          noteTitle: note.title,
          entityType: bestMatchType,
          entityName: entityName,
          entityId: bestMatch.id
        });
        
        console.log(`   ✅ Linked to ${bestMatchType}: ${entityName}`);
      } else {
        console.log(`   ❌ No suitable match found`);
      }
    }
    
    // 4. FINAL STATISTICS
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
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n✅ SUCCESSFULLY LINKED ${linkedCount} ADDITIONAL NOTES`);
    console.log('-'.repeat(40));
    
    if (linkingResults.length > 0) {
      console.log('   Linked notes:');
      linkingResults.forEach((result, index) => {
        console.log(`      ${index + 1}. "${result.noteTitle}" → ${result.entityType}: ${result.entityName}`);
      });
    }
    
    console.log(`\n📊 FINAL STATISTICS:`);
    console.log('-'.repeat(40));
    console.log(`   Total notes: ${totalNotes}`);
    console.log(`   Linked notes: ${finalLinked} (${finalLinkingRate}%)`);
    console.log(`   Unlinked notes: ${totalNotes - finalLinked} (${(100 - finalLinkingRate).toFixed(1)}%)`);
    console.log(`   Improvement: +${linkedCount} notes linked`);
    
    if (finalLinkingRate > 85.1) {
      console.log(`\n🎉 SUCCESS! Improved linking rate from 85.1% to ${finalLinkingRate}%`);
    } else {
      console.log(`\n📝 Linking rate maintained at ${finalLinkingRate}%`);
    }
    
  } catch (error) {
    console.error('❌ Error implementing remaining links:', error);
  } finally {
    await prisma.$disconnect();
  }
}

implementRemainingLinks();
