/**
 * 📧 MANUAL EMAIL TEST FOR DANO
 * 
 * This script creates a manual email entry to test the buying signal detection pipeline
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createManualEmailTest() {
  console.log('📧 [EMAIL TEST] Creating manual email test for Dano...\n');

  try {
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's workspace
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB'; // Dano's user ID

    // Find Dano's email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId
      }
    });

    if (!emailAccount) {
      console.log('❌ No email account found for Dano. Please set up email integration first.');
      return;
    }

    console.log(`✅ Found email account: ${emailAccount.email}`);

    // Create a test email with strong buying signals
    const testEmailId = `test-${Date.now()}`;
    const emailContent = `Hi Dano,

I hope this email finds you well. I'm reaching out because our company is actively looking to purchase a solution like yours.

We have budget approved for Q1 implementation and are evaluating vendors. Our key requirements:
- Need pricing for 100 users
- Looking for enterprise-grade security
- Must integrate with our existing CRM
- Timeline: implementation by March 2025

Could we schedule a demo next week? Our procurement team is ready to move forward with the right solution.

We're comparing a few vendors and your solution seems promising. Please send over pricing information when you get a chance.

Best regards,
John Smith
Procurement Manager
Signal Test Company
john.smith@signaltest.com
+1-555-BUYING`;

    // Create the email message
    const emailMessage = await prisma.emailMessage.create({
      data: {
        accountId: emailAccount.id,
        messageId: testEmailId,
        threadId: `thread-${testEmailId}`,
        subject: 'Interested in Purchasing Your Solution - Budget Approved',
        from: 'John Smith <john.smith@signaltest.com>',
        to: emailAccount.email,
        body: emailContent,
        bodyText: emailContent,
        receivedAt: new Date(),
        isRead: false,
        hasAttachments: false,
        importance: 'high',
        folder: 'INBOX'
      }
    });

    console.log(`✅ Test email created with ID: ${emailMessage.id}`);

    // Now run the email scanning service on this email
    console.log(`\n🔍 Running buying signal analysis...`);

    // Import and run the email scanning service
    const { EmailScanningService } = require('../src/platform/services/email-scanning-service');
    const scanningService = new EmailScanningService();

    const signals = await scanningService.analyzeEmailForBuyingSignals(emailMessage);

    console.log(`\n📊 BUYING SIGNAL ANALYSIS RESULTS:`);
    console.log(`==================================`);
    console.log(`✅ Signals detected: ${signals.length}`);
    
    signals.forEach((signal, index) => {
      console.log(`\n📍 Signal ${index + 1}:`);
      console.log(`   • Type: ${signal.type}`);
      console.log(`   • Confidence: ${signal.confidence}`);
      console.log(`   • Keywords: ${signal.keywords.join(', ')}`);
      console.log(`   • Context: ${signal.context}`);
    });

    if (signals.length > 0) {
      console.log(`\n🎯 SPEEDRUN IMPACT:`);
      console.log(`==================`);
      console.log(`• ✅ High-priority signals detected`);
      console.log(`• ✅ Contact should move to top of Speedrun list`);
      console.log(`• ✅ Signal notification should appear`);
      console.log(`• ✅ Email should be marked as high-value`);
    }

    // Create a contact/lead for this email if it doesn't exist
    console.log(`\n👤 Creating contact for signal attribution...`);

    const existingContact = await prisma.contact.findFirst({
      where: {
        email: 'john.smith@signaltest.com',
        workspaceId: workspaceId
      }
    });

    if (!existingContact) {
      const newContact = await prisma.contact.create({
        data: {
          workspaceId: workspaceId,
          firstName: 'John',
          lastName: 'Smith',
          fullName: 'John Smith',
          email: 'john.smith@signaltest.com',
          phone: '+1-555-BUYING',
          jobTitle: 'Procurement Manager',
          department: 'Procurement',
          status: 'Active',
          source: 'Email Signal Test',
          notes: 'Contact created from buying signal email test',
          assignedUserId: userId
        }
      });

      console.log(`✅ Contact created: ${newContact.fullName}`);

      // Create a lead for Speedrun
      const newLead = await prisma.lead.create({
        data: {
          workspaceId: workspaceId,
          firstName: 'John',
          lastName: 'Smith',
          fullName: 'John Smith',
          email: 'john.smith@signaltest.com',
          phone: '+1-555-BUYING',
          company: 'Signal Test Company',
          title: 'Procurement Manager',
          source: 'Email Signal Test',
          status: 'Hot Lead',
          notes: 'Lead created from buying signal email test - shows strong purchase intent',
          assignedUserId: userId,
          contactId: newContact.id
        }
      });

      console.log(`✅ Lead created: ${newLead.fullName}`);
      console.log(`📍 Lead ID for Speedrun: ${newLead.id}`);
    } else {
      console.log(`✅ Contact already exists: ${existingContact.fullName}`);
    }

    console.log(`\n🎯 TEST COMPLETE!`);
    console.log(`================`);
    console.log(`📧 Email ID: ${emailMessage.id}`);
    console.log(`🔍 Signals found: ${signals.length}`);
    console.log(`👤 Contact: John Smith (Signal Test Company)`);
    console.log(`📍 Check Speedrun for this lead with buying signals!`);

    console.log(`\n🧪 VERIFICATION STEPS:`);
    console.log(`=====================`);
    console.log(`1. 🔍 Go to Speedrun`);
    console.log(`2. 🔍 Look for "John Smith" from "Signal Test Company"`);
    console.log(`3. ✅ Should see high priority/signals`);
    console.log(`4. ✅ Should see signal notifications`);

  } catch (error) {
    console.error(`❌ [EMAIL TEST] Error:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createManualEmailTest().catch(console.error);
}

module.exports = { createManualEmailTest };
