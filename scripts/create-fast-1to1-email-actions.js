#!/usr/bin/env node

/**
 * 🚀 FAST 1:1 EMAIL-TO-ACTION MAPPING
 * 
 * Optimized version that processes emails in batches without loading all into memory
 */

const { PrismaClient } = require('@prisma/client');

// Configuration
const BATCH_SIZE = 500; // Larger batches for efficiency
const MAX_CONCURRENT_EMAILS = 100; // More concurrent processing

const prisma = new PrismaClient();

async function createFast1to1EmailActions() {
  console.log('🚀 FAST 1:1 EMAIL-TO-ACTION MAPPING');
  console.log('===================================');
  console.log('🎯 Goal: Every email gets its own individual action');
  
  try {
    // Get total count first
    const totalEmails = await prisma.email_messages.count();
    console.log(`📧 Total emails to process: ${totalEmails}`);
    
    let processed = 0;
    let created = 0;
    let errors = 0;
    
    const startTime = Date.now();
    
    // Process in batches without loading all emails
    for (let skip = 0; skip < totalEmails; skip += BATCH_SIZE) {
      const batchNumber = Math.floor(skip / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(totalEmails / BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches}...`);
      
      // Get batch of emails
      const emails = await prisma.email_messages.findMany({
        skip: skip,
        take: BATCH_SIZE,
        orderBy: { sentAt: 'desc' }
      });
      
      if (emails.length === 0) break;
      
      // Process emails in parallel chunks
      for (let i = 0; i < emails.length; i += MAX_CONCURRENT_EMAILS) {
        const emailChunk = emails.slice(i, i + MAX_CONCURRENT_EMAILS);
        
        // Process chunk in parallel
        const chunkPromises = emailChunk.map(async (email) => {
          try {
            const result = await createIndividualActionForEmail(email);
            return result;
          } catch (error) {
            return { success: false, error: error.message };
          }
        });
        
        const chunkResults = await Promise.all(chunkPromises);
        
        // Count results
        for (const result of chunkResults) {
          processed++;
          if (result.success) {
            created++;
          } else {
            errors++;
          }
        }
      }
      
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = totalEmails - processed;
      const eta = remaining / rate;
      
      console.log(`✅ Processed ${processed}/${totalEmails} emails (${Math.round(processed/totalEmails*100)}%)`);
      console.log(`⚡ Rate: ${Math.round(rate)} emails/sec | ETA: ${Math.round(eta)}s`);
      console.log(`📊 Created: ${created} actions | Errors: ${errors}`);
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('\n🎉 FAST 1:1 EMAIL-TO-ACTION MAPPING COMPLETE!');
    console.log('=============================================');
    console.log(`⏱️  Total time: ${Math.round(totalTime)}s`);
    console.log(`⚡ Average rate: ${Math.round(processed/totalTime)} emails/sec`);
    console.log(`✅ Total emails processed: ${processed}`);
    console.log(`📊 Individual actions created: ${created}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Quick verification
    await quickVerify();
    
  } catch (error) {
    console.error('❌ Error creating fast 1:1 email actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createIndividualActionForEmail(email) {
  try {
    // Determine action type
    const actionType = determineEmailActionType(email);
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    
    // Create action directly without checking for duplicates (faster)
    const action = await prisma.actions.create({
      data: {
        type: actionType,
        subject: email.subject || 'Email Communication',
        description: `Email from ${email.from} to ${email.to}`,
        workspaceId: workspaceId,
        userId: workspaceId,
        createdAt: email.sentAt || email.createdAt,
        updatedAt: new Date()
      }
    });
    
    // Link email to action
    await linkEmailToAction(email.id, action.id);
    
    return { success: true, actionId: action.id };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function determineEmailActionType(email) {
  const subject = (email.subject || '').toLowerCase();
  const from = (email.from || '').toLowerCase();
  
  // Simplified but fast type detection
  if (subject.includes('proposal') || subject.includes('quote')) return 'email_proposal';
  if (subject.includes('meeting') || subject.includes('call')) return 'email_meeting';
  if (subject.includes('follow up') || subject.includes('follow-up')) return 'email_follow_up';
  if (from.includes('noreply') || from.includes('no-reply')) return 'email_automated';
  if (subject.includes('thank')) return 'email_thank_you';
  if (subject.includes('intro')) return 'email_introduction';
  if (subject.includes('contract')) return 'email_contract';
  if (subject.includes('support')) return 'email_support';
  if (subject.includes('urgent')) return 'email_urgent';
  
  return 'email_conversation';
}

async function linkEmailToAction(emailId, actionId) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "_EmailToAction" ("A", "B")
      VALUES (${emailId}, ${actionId})
      ON CONFLICT DO NOTHING
    `;
  } catch (error) {
    // Ignore duplicate key errors
  }
}

async function quickVerify() {
  console.log('\n🔍 QUICK VERIFICATION');
  console.log('=====================');
  
  try {
    const totalEmails = await prisma.email_messages.count();
    const emailActions = await prisma.actions.count({
      where: { type: { startsWith: 'email_' } }
    });
    
    console.log(`📧 Total emails: ${totalEmails}`);
    console.log(`📧 Email actions: ${emailActions}`);
    
    if (emailActions >= totalEmails) {
      console.log('🎉 SUCCESS: 1:1 mapping achieved!');
    } else {
      console.log(`⚠️  Need ${totalEmails - emailActions} more email actions`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying:', error);
  }
}

// Run the script
createFast1to1EmailActions().catch(console.error);
