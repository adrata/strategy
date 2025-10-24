/**
 * Fix Last Action and Next Action Display
 * 
 * This script backfills existing records with proper lastAction and nextActionDate values
 * by finding the most recent meaningful actions and calculating appropriate next action dates.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Meaningful action types that should appear in Last Action column
const MEANINGFUL_ACTION_TYPES = new Set([
  // LinkedIn Actions
  'LinkedIn Connection',
  'LinkedIn InMail', 
  'LinkedIn Message',
  'linkedin_connection_request',
  'linkedin_message',
  'linkedin_inmail',
  'linkedin_profile_viewed',
  'linkedin_post_liked',
  'linkedin_post_commented',
  
  // Phone Actions
  'Phone',
  'phone_call',
  'cold_call',
  'follow_up_call',
  'discovery_call',
  'qualification_call',
  'demo_call',
  'closing_call',
  'voicemail_left',
  'call_scheduled',
  'call_completed',
  
  // Email Actions
  'Email',
  'email_sent',
  'email_received',
  'email_replied',
  'email_forwarded',
  'cold_email',
  'follow_up_email',
  'email_conversation',
  
  // Meeting Actions
  'Meeting',
  'meeting_scheduled',
  'meeting_completed',
  'demo_meeting',
  'discovery_meeting',
  'proposal_meeting',
  'closing_meeting',
  'appointment',
  
  // Sales Process Actions
  'proposal_sent',
  'proposal_follow_up',
  'contract_sent',
  'deal_closed',
  
  // Relationship Building
  'relationship_building',
  'buying_signal_detected',
  'interest_expressed',
  'objection_raised',
  'decision_maker_identified'
]);

function isMeaningfulAction(actionType) {
  if (!actionType || typeof actionType !== 'string') {
    return false;
  }
  
  // Check exact match first
  if (MEANINGFUL_ACTION_TYPES.has(actionType)) {
    return true;
  }
  
  // Check for partial matches (case-insensitive)
  const lowerType = actionType.toLowerCase();
  for (const meaningfulType of MEANINGFUL_ACTION_TYPES) {
    if (meaningfulType.toLowerCase().includes(lowerType) || 
        lowerType.includes(meaningfulType.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

function calculateNextActionDate(lastActionDate, rank) {
  const baseDate = lastActionDate || new Date();
  const daysToAdd = (() => {
    if (rank <= 10) return 1; // Top 10: tomorrow
    if (rank <= 50) return 3; // Top 50: 3 days
    if (rank <= 100) return 5; // Top 100: 5 days
    if (rank <= 500) return 7; // Top 500: 1 week
    return 14; // Others: 2 weeks
  })();
  
  const nextActionDate = new Date(baseDate);
  nextActionDate.setDate(nextActionDate.getDate() + daysToAdd);
  return nextActionDate;
}

async function fixPeopleRecords() {
  console.log('👥 Fixing People records...');
  
  const batchSize = 100;
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  
  while (true) {
    const people = await prisma.people.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        globalRank: true,
        lastAction: true,
        lastActionDate: true,
        nextActionDate: true,
        createdAt: true
      },
      skip: offset,
      take: batchSize,
      orderBy: { id: 'asc' }
    });
    
    if (people.length === 0) {
      break;
    }
    
    console.log(`  Processing batch ${Math.floor(offset / batchSize) + 1} (${people.length} people)...`);
    
    for (const person of people) {
      try {
        // Find the most recent meaningful action
        const meaningfulAction = await prisma.actions.findFirst({
          where: {
            personId: person.id,
            deletedAt: null,
            status: 'COMPLETED',
            type: {
              in: Array.from(MEANINGFUL_ACTION_TYPES)
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          select: {
            type: true,
            subject: true,
            completedAt: true,
            createdAt: true
          }
        });
        
        let updateData = {};
        
        // Update lastAction if we found a meaningful action
        if (meaningfulAction) {
          updateData.lastAction = meaningfulAction.subject || meaningfulAction.type;
          updateData.lastActionDate = meaningfulAction.completedAt || meaningfulAction.createdAt;
        }
        
        // Calculate nextActionDate if it's null
        if (!person.nextActionDate) {
          const lastActionDate = updateData.lastActionDate || person.lastActionDate || person.createdAt;
          const rank = person.globalRank || 1000;
          updateData.nextActionDate = calculateNextActionDate(lastActionDate, rank);
        }
        
        // Only update if we have changes
        if (Object.keys(updateData).length > 0) {
          await prisma.people.update({
            where: { id: person.id },
            data: updateData
          });
          
          totalUpdated++;
          
          if (totalUpdated % 100 === 0) {
            console.log(`    Updated ${totalUpdated} people so far...`);
          }
        }
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`❌ Error processing person ${person.id}:`, error);
      }
    }
    
    offset += batchSize;
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ People processing complete: ${totalProcessed} processed, ${totalUpdated} updated`);
  return { processed: totalProcessed, updated: totalUpdated };
}

async function fixCompanyRecords() {
  console.log('🏢 Fixing Company records...');
  
  const batchSize = 100;
  let offset = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  
  while (true) {
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        globalRank: true,
        lastAction: true,
        lastActionDate: true,
        nextActionDate: true,
        createdAt: true
      },
      skip: offset,
      take: batchSize,
      orderBy: { id: 'asc' }
    });
    
    if (companies.length === 0) {
      break;
    }
    
    console.log(`  Processing batch ${Math.floor(offset / batchSize) + 1} (${companies.length} companies)...`);
    
    for (const company of companies) {
      try {
        // Find the most recent meaningful action
        const meaningfulAction = await prisma.actions.findFirst({
          where: {
            companyId: company.id,
            deletedAt: null,
            status: 'COMPLETED',
            type: {
              in: Array.from(MEANINGFUL_ACTION_TYPES)
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          select: {
            type: true,
            subject: true,
            completedAt: true,
            createdAt: true
          }
        });
        
        let updateData = {};
        
        // Update lastAction if we found a meaningful action
        if (meaningfulAction) {
          updateData.lastAction = meaningfulAction.subject || meaningfulAction.type;
          updateData.lastActionDate = meaningfulAction.completedAt || meaningfulAction.createdAt;
        }
        
        // Calculate nextActionDate if it's null
        if (!company.nextActionDate) {
          const lastActionDate = updateData.lastActionDate || company.lastActionDate || company.createdAt;
          const rank = company.globalRank || 1000;
          updateData.nextActionDate = calculateNextActionDate(lastActionDate, rank);
        }
        
        // Only update if we have changes
        if (Object.keys(updateData).length > 0) {
          await prisma.companies.update({
            where: { id: company.id },
            data: updateData
          });
          
          totalUpdated++;
          
          if (totalUpdated % 100 === 0) {
            console.log(`    Updated ${totalUpdated} companies so far...`);
          }
        }
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`❌ Error processing company ${company.id}:`, error);
      }
    }
    
    offset += batchSize;
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Company processing complete: ${totalProcessed} processed, ${totalUpdated} updated`);
  return { processed: totalProcessed, updated: totalUpdated };
}

async function main() {
  console.log('🚀 Starting Last Action and Next Action fix...');
  console.log('📊 This will backfill existing records with proper lastAction and nextActionDate values');
  console.log('');
  
  try {
    // Fix people records
    const peopleResults = await fixPeopleRecords();
    console.log('');
    
    // Fix company records
    const companyResults = await fixCompanyRecords();
    console.log('');
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`  People: ${peopleResults.processed} processed, ${peopleResults.updated} updated`);
    console.log(`  Companies: ${companyResults.processed} processed, ${companyResults.updated} updated`);
    console.log(`  Total: ${peopleResults.processed + companyResults.processed} processed, ${peopleResults.updated + companyResults.updated} updated`);
    console.log('');
    console.log('✅ Fix complete! Last Action and Next Action columns should now display correctly.');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, fixPeopleRecords, fixCompanyRecords };
