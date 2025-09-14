const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function studyRemainingUnlinked() {
  try {
    console.log('🔍 STUDYING REMAINING UNLINKED NOTES');
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
        content: true,
        createdAt: true,
        externalId: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📝 REMAINING UNLINKED NOTES: ${unlinkedNotes.length}`);
    console.log('-'.repeat(40));
    
    // 2. ANALYZE EACH UNLINKED NOTE
    let potentialLinks = 0;
    const linkingOpportunities = [];
    
    for (const note of unlinkedNotes) {
      console.log(`\n📋 NOTE: "${note.title}"`);
      console.log(`   Type: ${note.type}`);
      console.log(`   External ID: ${note.externalId || 'None'}`);
      console.log(`   Created: ${note.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Content: ${note.content?.substring(0, 200)}...`);
      
      // 3. ANALYZE CONTENT FOR LINKING OPPORTUNITIES
      if (note.content) {
        const content = note.content.toLowerCase();
        
        // Extract potential names/companies from content
        const words = content.split(/[\s,.\-()]+/).filter(word => 
          word.length > 2 && 
          !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'they', 'have', 'been', 'will', 'were', 'are', 'was', 'can', 'could', 'would', 'should', 'may', 'might', 'must', 'shall', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
        );
        
        console.log(`   Potential keywords: ${words.slice(0, 10).join(', ')}`);
        
        // Try to find matches for each meaningful word
        let foundMatches = [];
        
        for (const word of words.slice(0, 5)) { // Check first 5 meaningful words
          // Check contacts
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
          
          if (contacts.length > 0) {
            foundMatches.push({
              type: 'contact',
              matches: contacts,
              keyword: word
            });
          }
          
          // Check accounts
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
          
          if (accounts.length > 0) {
            foundMatches.push({
              type: 'account',
              matches: accounts,
              keyword: word
            });
          }
          
          // Check leads
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
          
          if (leads.length > 0) {
            foundMatches.push({
              type: 'lead',
              matches: leads,
              keyword: word
            });
          }
          
          // Check opportunities
          const opportunities = await prisma.opportunities.findMany({
            where: {
              name: { contains: word, mode: 'insensitive' }
            },
            select: { id: true, name: true }
          });
          
          if (opportunities.length > 0) {
            foundMatches.push({
              type: 'opportunity',
              matches: opportunities,
              keyword: word
            });
          }
        }
        
        if (foundMatches.length > 0) {
          potentialLinks++;
          linkingOpportunities.push({
            noteId: note.id,
            noteTitle: note.title,
            noteType: note.type,
            matches: foundMatches
          });
          
          console.log(`   🎯 POTENTIAL MATCHES FOUND:`);
          foundMatches.forEach(match => {
            console.log(`      ${match.type.toUpperCase()} (keyword: "${match.keyword}"):`);
            match.matches.forEach(entity => {
              const name = entity.name || entity.fullName || `${entity.firstName} ${entity.lastName}`;
              console.log(`         - ${name} (ID: ${entity.id})`);
            });
          });
        } else {
          console.log(`   ❌ No potential matches found`);
        }
      }
      
      // 4. CHECK FOR SPECIAL PATTERNS
      if (note.content) {
        const content = note.content.toLowerCase();
        
        // Check for email addresses
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = content.match(emailRegex);
        
        if (emails) {
          console.log(`   📧 Email addresses found: ${emails.join(', ')}`);
          
          // Try to find contacts by email
          for (const email of emails) {
            const contact = await prisma.contacts.findFirst({
              where: {
                OR: [
                  { email: { equals: email, mode: 'insensitive' } },
                  { workEmail: { equals: email, mode: 'insensitive' } },
                  { personalEmail: { equals: email, mode: 'insensitive' } }
                ]
              },
              select: { id: true, firstName: true, lastName: true, email: true, workEmail: true }
            });
            
            if (contact) {
              console.log(`      🎯 Found contact by email: ${contact.firstName} ${contact.lastName} (${contact.email || contact.workEmail})`);
              if (!linkingOpportunities.find(opp => opp.noteId === note.id)) {
                potentialLinks++;
                linkingOpportunities.push({
                  noteId: note.id,
                  noteTitle: note.title,
                  noteType: note.type,
                  emailMatch: contact
                });
              }
            }
          }
        }
        
        // Check for phone numbers
        const phoneRegex = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
        const phones = content.match(phoneRegex);
        
        if (phones) {
          console.log(`   📞 Phone numbers found: ${phones.join(', ')}`);
        }
        
        // Check for URLs
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = content.match(urlRegex);
        
        if (urls) {
          console.log(`   🌐 URLs found: ${urls.length} URLs`);
        }
      }
    }
    
    // 5. SUMMARY OF LINKING OPPORTUNITIES
    console.log('\n' + '='.repeat(60));
    console.log('📊 LINKING OPPORTUNITIES SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 NOTES WITH POTENTIAL LINKS: ${potentialLinks}`);
    console.log(`📝 TOTAL UNLINKED NOTES: ${unlinkedNotes.length}`);
    console.log(`📈 IMPROVEMENT POTENTIAL: ${((potentialLinks / unlinkedNotes.length) * 100).toFixed(1)}%`);
    
    if (linkingOpportunities.length > 0) {
      console.log('\n💡 RECOMMENDED ACTIONS:');
      console.log('-'.repeat(40));
      
      linkingOpportunities.forEach((opp, index) => {
        console.log(`\n${index + 1}. "${opp.noteTitle}"`);
        console.log(`   Type: ${opp.noteType}`);
        
        if (opp.matches) {
          console.log(`   Potential matches:`);
          opp.matches.forEach(match => {
            console.log(`      ${match.type}: ${match.matches.length} matches (keyword: "${match.keyword}")`);
          });
        }
        
        if (opp.emailMatch) {
          console.log(`   Email match: ${opp.emailMatch.firstName} ${opp.emailMatch.lastName}`);
        }
      });
      
      console.log('\n🔧 SUGGESTED IMPROVEMENTS:');
      console.log('-'.repeat(40));
      console.log('1. Implement fuzzy matching for company names');
      console.log('2. Use email addresses to link notes to contacts');
      console.log('3. Parse note titles for entity type hints');
      console.log('4. Use content analysis for better keyword matching');
      console.log('5. Implement confidence scoring for matches');
    } else {
      console.log('\n❌ NO ADDITIONAL LINKING OPPORTUNITIES FOUND');
      console.log('   The remaining unlinked notes appear to be:');
      console.log('   - Generic notes without specific entity references');
      console.log('   - System-generated notes');
      console.log('   - Notes with content that doesn\'t match existing entities');
    }
    
    // 6. FINAL STATISTICS
    const totalNotes = await prisma.notes.count();
    const linkedNotes = await prisma.notes.count({
      where: {
        OR: [
          { contactId: { not: null } },
          { accountId: { not: null } },
          { leadId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });
    
    const currentLinkingRate = ((linkedNotes / totalNotes) * 100).toFixed(1);
    const potentialLinkingRate = (((linkedNotes + potentialLinks) / totalNotes) * 100).toFixed(1);
    
    console.log('\n📊 FINAL STATISTICS:');
    console.log('-'.repeat(40));
    console.log(`   Current linking rate: ${currentLinkingRate}% (${linkedNotes}/${totalNotes})`);
    console.log(`   Potential linking rate: ${potentialLinkingRate}% (${linkedNotes + potentialLinks}/${totalNotes})`);
    console.log(`   Additional improvement possible: +${potentialLinks} notes (+${(potentialLinkingRate - currentLinkingRate).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error studying remaining unlinked notes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

studyRemainingUnlinked();
