#!/usr/bin/env node

/**
 * 🚀 CREATE TRUE 1:1 EMAIL-TO-ACTION MAPPING
 * 
 * This script creates individual action records for EVERY email.
 * Each email is a discrete business activity and should have its own action.
 * 
 * Goal: 15,588 emails = 15,588 individual email actions
 */

const { PrismaClient } = require('@prisma/client');

// Configuration
const BATCH_SIZE = 100; // Process emails in batches
const MAX_CONCURRENT_EMAILS = 50; // Process up to 50 emails in parallel per batch

const prisma = new PrismaClient();

async function createTrue1to1EmailActions() {
  console.log('🚀 CREATE TRUE 1:1 EMAIL-TO-ACTION MAPPING');
  console.log('==========================================');
  console.log('🎯 Goal: Every email gets its own individual action');
  
  try {
    // Get all emails
    console.log('🔍 Getting all emails...');
    const allEmails = await prisma.email_messages.findMany({
      orderBy: { sentAt: 'desc' }
    });
    
    const totalEmails = allEmails.length;
    console.log(`📧 Total emails to process: ${totalEmails}`);
    
    // Check how many already have individual actions
    const emailsWithIndividualActions = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT e.id) as count
      FROM email_messages e
      INNER JOIN actions a ON a.type LIKE 'email_%' AND a.subject = e.subject
      WHERE a.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'
    `;
    
    const alreadyHaveActions = Number(emailsWithIndividualActions[0].count);
    const needActions = totalEmails - alreadyHaveActions;
    
    console.log(`✅ Emails already with individual actions: ${alreadyHaveActions}`);
    console.log(`🔄 Emails needing individual actions: ${needActions}`);
    
    if (needActions === 0) {
      console.log('🎉 All emails already have individual actions!');
      return;
    }
    
    let processed = 0;
    let created = 0;
    let errors = 0;
    
    const startTime = Date.now();
    
    // Process in batches
    for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
      const batch = allEmails.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allEmails.length / BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)...`);
      
      // Process emails in parallel within the batch
      const promises = batch.map(async (email) => {
        try {
          const result = await createIndividualActionForEmail(email);
          return result;
        } catch (error) {
          console.log(`     ❌ Error creating action for email ${email.id}: ${error.message}`);
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
      const remaining = totalEmails - processed;
      const eta = remaining / rate;
      
      console.log(`✅ Processed ${processed}/${totalEmails} emails (${Math.round(processed/totalEmails*100)}%)`);
      console.log(`⚡ Rate: ${Math.round(rate)} emails/sec | ETA: ${Math.round(eta)}s`);
      console.log(`📊 Created: ${created} actions | Errors: ${errors}`);
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('\n🎉 TRUE 1:1 EMAIL-TO-ACTION MAPPING COMPLETE!');
    console.log('============================================');
    console.log(`⏱️  Total time: ${Math.round(totalTime)}s`);
    console.log(`⚡ Average rate: ${Math.round(processed/totalTime)} emails/sec`);
    console.log(`✅ Total emails processed: ${processed}`);
    console.log(`📊 Individual actions created: ${created}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify the results
    await verify1to1Results();
    
  } catch (error) {
    console.error('❌ Error creating true 1:1 email actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createIndividualActionForEmail(email) {
  try {
    // Determine action type based on email content
    const actionType = determineEmailActionType(email);
    
    // Get workspace ID
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    
    // Check if this email already has an individual action
    const existingAction = await prisma.actions.findFirst({
      where: {
        type: actionType,
        subject: email.subject,
        workspaceId: workspaceId,
        userId: workspaceId
      }
    });
    
    if (existingAction) {
      // Link email to existing action if not already linked
      await linkEmailToAction(email.id, existingAction.id);
      return { success: true, actionId: existingAction.id, wasExisting: true };
    }
    
    // Create new individual action for this email
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
    
    // Link the email to its individual action
    await linkEmailToAction(email.id, action.id);
    
    return { success: true, actionId: action.id, wasExisting: false };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function determineEmailActionType(email) {
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
  
  // Comprehensive email action type detection
  
  // PROPOSAL & QUOTES
  if (subject.includes('proposal') || subject.includes('quote') || 
      subject.includes('pricing') || subject.includes('estimate') ||
      subject.includes('cost') || subject.includes('budget')) {
    return 'email_proposal';
  }
  
  // MEETING & CALL EMAILS
  if (subject.includes('meeting') || subject.includes('call') || 
      subject.includes('schedule') || subject.includes('calendar') ||
      subject.includes('appointment') || subject.includes('demo') ||
      subject.includes('presentation') || subject.includes('walkthrough')) {
    return 'email_meeting';
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
    return 'email_automated';
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

async function verify1to1Results() {
  console.log('\n🔍 VERIFYING 1:1 EMAIL-TO-ACTION MAPPING');
  console.log('==========================================');
  
  try {
    // Check total counts
    const totalEmails = await prisma.email_messages.count();
    const totalActions = await prisma.actions.count();
    const emailActions = await prisma.actions.count({
      where: {
        type: {
          startsWith: 'email_'
        }
      }
    });
    
    const emailsWithActions = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "A") as count FROM "_EmailToAction"
    `;
    
    console.log(`📧 Total emails: ${totalEmails}`);
    console.log(`⚡ Total actions: ${totalActions}`);
    console.log(`📧 Email actions: ${emailActions}`);
    console.log(`🔗 Emails linked to actions: ${emailsWithActions[0].count}`);
    
    // Check if we have 1:1 mapping
    const is1to1 = emailActions === totalEmails && emailsWithActions[0].count === totalEmails;
    
    if (is1to1) {
      console.log('\n🎉 SUCCESS: Perfect 1:1 email-to-action mapping achieved!');
      console.log(`✅ Every email (${totalEmails}) has its own individual action`);
    } else {
      console.log('\n⚠️  Not quite 1:1 mapping yet:');
      console.log(`📊 Email actions: ${emailActions} (should be ${totalEmails})`);
      console.log(`🔗 Linked emails: ${emailsWithActions[0].count} (should be ${totalEmails})`);
    }
    
    // Show action type breakdown
    const actionTypes = await prisma.actions.groupBy({
      by: ['type'],
      _count: { type: true },
      where: {
        type: {
          startsWith: 'email_'
        }
      },
      orderBy: { _count: { type: 'desc' } }
    });
    
    console.log('\n📊 EMAIL ACTION TYPES:');
    actionTypes.forEach(type => {
      console.log(`   ${type.type}: ${type._count.type}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying results:', error);
  }
}

// Run the script
createTrue1to1EmailActions().catch(console.error);
