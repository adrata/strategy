#!/usr/bin/env node

/**
 * 🚀 CREATE MISSING EMAIL ACTIONS
 * 
 * This script creates action records for all emails that don't have corresponding actions.
 * Every email should have an action record to track it as a business activity.
 */

const { PrismaClient } = require('@prisma/client');

// Configuration
const BATCH_SIZE = 100; // Process emails in batches
const MAX_CONCURRENT_EMAILS = 50; // Process up to 50 emails in parallel per batch

const prisma = new PrismaClient();

async function createMissingEmailActions() {
  console.log('🚀 CREATE MISSING EMAIL ACTIONS');
  console.log('================================');
  
  try {
    // First, find all emails that don't have corresponding actions
    console.log('🔍 Finding emails without actions...');
    
    const emailsWithoutActions = await prisma.$queryRaw`
      SELECT e.id, e.subject, e.from, e.to, e."sentAt", e."createdAt"
      FROM email_messages e
      LEFT JOIN "_EmailToAction" eta ON e.id = eta."A"
      WHERE eta."A" IS NULL
      ORDER BY e."sentAt" DESC
    `;
    
    const totalMissing = emailsWithoutActions.length;
    console.log(`📧 Found ${totalMissing} emails without actions`);
    
    if (totalMissing === 0) {
      console.log('✅ All emails already have actions!');
      return;
    }
    
    let processed = 0;
    let created = 0;
    let errors = 0;
    
    const startTime = Date.now();
    
    // Process in batches
    for (let i = 0; i < emailsWithoutActions.length; i += BATCH_SIZE) {
      const batch = emailsWithoutActions.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(emailsWithoutActions.length / BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)...`);
      
      // Process emails in parallel within the batch
      const promises = batch.map(async (email) => {
        try {
          const result = await createActionForEmail(email);
          return result;
        } catch (error) {
          console.log(`     ❌ Error creating action for email ${email.id}: ${error.message}`);
          console.log(`     📧 Email details: subject="${email.subject?.substring(0, 50)}", from="${email.from}"`);
          return { success: false, error: error.message };
        }
      });
      
      // Wait for all emails in this batch to complete
      const results = await Promise.all(promises);
      
      // Count results
      for (const result of results) {
        processed++;
        if (result.success) {
          created++;
        } else {
          errors++;
        }
      }
      
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / elapsed;
      const remaining = totalMissing - processed;
      const eta = remaining / rate;
      
      console.log(`✅ Processed ${processed}/${totalMissing} emails (${Math.round(processed/totalMissing*100)}%)`);
      console.log(`⚡ Rate: ${Math.round(rate)} emails/sec | ETA: ${Math.round(eta)}s`);
      console.log(`📊 Created: ${created} actions | Errors: ${errors}`);
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('\n🎉 MISSING EMAIL ACTIONS CREATION COMPLETE!');
    console.log('===========================================');
    console.log(`⏱️  Total time: ${Math.round(totalTime)}s`);
    console.log(`⚡ Average rate: ${Math.round(processed/totalTime)} emails/sec`);
    console.log(`✅ Total emails processed: ${processed}`);
    console.log(`📊 Actions created: ${created}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify the results
    await verifyResults();
    
  } catch (error) {
    console.error('❌ Error creating missing email actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createActionForEmail(email) {
  try {
    // Determine action type based on email content
    const actionType = determineActionType(email);
    
    // Get workspace ID (assuming Dan's workspace for now)
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    
    // Create the action
    const action = await prisma.actions.create({
      data: {
        type: actionType,
        subject: email.subject || 'Email Communication',
        description: `Email from ${email.from} to ${email.to}`,
        workspaceId: workspaceId,
        userId: workspaceId, // Use workspace ID as user ID for system actions
        createdAt: email.sentAt || email.createdAt,
        updatedAt: new Date()
      }
    });
    
    // Link the email to the action
    await linkEmailToAction(email.id, action.id);
    
    return { success: true, actionId: action.id };
    
  } catch (error) {
    console.log(`     🔍 Detailed error for email ${email.id}:`, error);
    return { success: false, error: error.message };
  }
}

function determineActionType(email) {
  const subject = (email.subject || '').toLowerCase();
  const from = (email.from || '').toLowerCase();
  
  // Handle email.to as string, array, or other types
  let to = '';
  if (typeof email.to === 'string') {
    to = email.to.toLowerCase();
  } else if (Array.isArray(email.to)) {
    to = email.to.join(', ').toLowerCase();
  } else if (email.to) {
    to = String(email.to).toLowerCase();
  }
  
  // Comprehensive email type detection
  
  // PROPOSAL & QUOTES
  if (subject.includes('proposal') || subject.includes('quote') || 
      subject.includes('pricing') || subject.includes('estimate') ||
      subject.includes('cost') || subject.includes('budget')) {
    return 'proposal';
  }
  
  // MEETING & CALL DISCUSSIONS (not actual meetings)
  if (subject.includes('meeting') || subject.includes('call') || 
      subject.includes('schedule') || subject.includes('calendar') ||
      subject.includes('appointment') || subject.includes('demo') ||
      subject.includes('presentation') || subject.includes('walkthrough')) {
    return 'email_meeting_discussion';
  }
  
  // FOLLOW-UP EMAILS
  if (subject.includes('follow up') || subject.includes('follow-up') ||
      subject.includes('checking in') || subject.includes('touch base') ||
      subject.includes('circling back') || subject.includes('reaching out')) {
    return 'email_follow_up';
  }
  
  // AUTOMATED/SYSTEM EMAILS
  if (from.includes('noreply') || from.includes('no-reply') ||
      from.includes('notifications') || from.includes('updates') ||
      from.includes('support') || from.includes('help') ||
      from.includes('billing') || from.includes('payments') ||
      from.includes('accounts') || from.includes('system') ||
      from.includes('admin') || from.includes('info@')) {
    return 'email_received_automated';
  }
  
  // THANK YOU & APPRECIATION
  if (subject.includes('thank') || subject.includes('thanks') ||
      subject.includes('appreciate') || subject.includes('grateful') ||
      subject.includes('pleasure') || subject.includes('welcome')) {
    return 'email_thank_you';
  }
  
  // INTRODUCTIONS & REFERRALS
  if (subject.includes('introduction') || subject.includes('intro') ||
      subject.includes('referral') || subject.includes('connect') ||
      subject.includes('introducing') || subject.includes('meet')) {
    return 'email_introduction';
  }
  
  // CONTRACT & LEGAL
  if (subject.includes('contract') || subject.includes('agreement') ||
      subject.includes('terms') || subject.includes('legal') ||
      subject.includes('nda') || subject.includes('signature') ||
      subject.includes('signed') || subject.includes('document')) {
    return 'email_contract';
  }
  
  // ONBOARDING & SETUP
  if (subject.includes('onboarding') || subject.includes('setup') ||
      subject.includes('getting started') || subject.includes('welcome') ||
      subject.includes('kickoff') || subject.includes('implementation')) {
    return 'email_onboarding';
  }
  
  // FEEDBACK & REVIEWS
  if (subject.includes('feedback') || subject.includes('review') ||
      subject.includes('survey') || subject.includes('rating') ||
      subject.includes('testimonial') || subject.includes('case study')) {
    return 'email_feedback';
  }
  
  // TECHNICAL SUPPORT
  if (subject.includes('support') || subject.includes('help') ||
      subject.includes('issue') || subject.includes('problem') ||
      subject.includes('bug') || subject.includes('error') ||
      subject.includes('troubleshoot') || subject.includes('fix')) {
    return 'email_support';
  }
  
  // MARKETING & PROMOTIONS
  if (subject.includes('promotion') || subject.includes('offer') ||
      subject.includes('discount') || subject.includes('deal') ||
      subject.includes('sale') || subject.includes('marketing') ||
      subject.includes('newsletter') || subject.includes('update')) {
    return 'email_marketing';
  }
  
  // OUT OF OFFICE & VACATION
  if (subject.includes('out of office') || subject.includes('vacation') ||
      subject.includes('away') || subject.includes('unavailable') ||
      subject.includes('holiday') || subject.includes('traveling')) {
    return 'email_out_of_office';
  }
  
  // REJECTION & DECLINED
  if (subject.includes('decline') || subject.includes('reject') ||
      subject.includes('not interested') || subject.includes('pass') ||
      subject.includes('unfortunately') || subject.includes('regret')) {
    return 'email_rejection';
  }
  
  // URGENT & HIGH PRIORITY
  if (subject.includes('urgent') || subject.includes('asap') ||
      subject.includes('immediate') || subject.includes('priority') ||
      subject.includes('emergency') || subject.includes('critical')) {
    return 'email_urgent';
  }
  
  // DEFAULT: Regular email conversation
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

async function verifyResults() {
  console.log('\n🔍 VERIFYING RESULTS');
  console.log('====================');
  
  try {
    // Check total emails vs actions
    const totalEmails = await prisma.email_messages.count();
    const totalActions = await prisma.actions.count();
    const emailActions = await prisma.actions.count({
      where: {
        OR: [
          { type: 'email' },
          { type: 'email_conversation' },
          { type: 'email_sent' },
          { type: 'email_received_automated' },
          { type: 'email_follow_up' },
          { type: 'email_thank_you' },
          { type: 'email_introduction' },
          { type: 'email_meeting_discussion' },
          { type: 'email_contract' },
          { type: 'email_onboarding' },
          { type: 'email_feedback' },
          { type: 'email_support' },
          { type: 'email_marketing' },
          { type: 'email_out_of_office' },
          { type: 'email_rejection' },
          { type: 'email_urgent' },
          { type: 'proposal' }
        ]
      }
    });
    
    const emailsWithActions = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "A") as count FROM "_EmailToAction"
    `;
    
    console.log(`📧 Total emails: ${totalEmails}`);
    console.log(`⚡ Total actions: ${totalActions}`);
    console.log(`📧 Email-related actions: ${emailActions}`);
    console.log(`🔗 Emails linked to actions: ${emailsWithActions[0].count}`);
    
    const remainingUnlinked = totalEmails - Number(emailsWithActions[0].count);
    console.log(`📊 Remaining unlinked emails: ${remainingUnlinked}`);
    
    if (remainingUnlinked === 0) {
      console.log('\n🎉 SUCCESS: All emails now have corresponding actions!');
    } else {
      console.log(`\n⚠️  Still ${remainingUnlinked} emails without actions`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying results:', error);
  }
}

// Run the script
createMissingEmailActions().catch(console.error);
