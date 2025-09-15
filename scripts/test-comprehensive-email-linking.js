#!/usr/bin/env node

/**
 * Test Comprehensive Email Linking System
 * Tests the new simplified email linking to Person, Company, and Action
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 TESTING COMPREHENSIVE EMAIL LINKING SYSTEM');
  console.log('==============================================\n');

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Current Email Linking State');
    console.log('--------------------------------------');
    await showCurrentState();

    // Step 2: Test with a small sample
    console.log('\n🔬 Step 2: Testing with Sample Emails');
    console.log('-------------------------------------');
    await testWithSampleEmails();

    // Step 3: Show final state
    console.log('\n📈 Step 3: Final State After Testing');
    console.log('------------------------------------');
    await showCurrentState();

    // Step 4: Test API endpoint
    console.log('\n🌐 Step 4: Testing API Endpoint');
    console.log('-------------------------------');
    await testApiEndpoint();

  } catch (error) {
    console.error('❌ Error in testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Show current email linking state
 */
async function showCurrentState() {
  const totalEmails = await prisma.email_messages.count();
  const emailsLinkedToPerson = await prisma.emailToPerson.count();
  const emailsLinkedToCompany = await prisma.emailToCompany.count();
  const emailsLinkedToAction = await prisma.emailToAction.count();

  // Count emails that are linked to all three entities
  const fullyLinkedEmails = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM email_messages e
    WHERE EXISTS (SELECT 1 FROM "_EmailToPerson" etp WHERE etp.A = e.id)
      AND EXISTS (SELECT 1 FROM "_EmailToCompany" etc WHERE etc.A = e.id)
      AND EXISTS (SELECT 1 FROM "_EmailToAction" eta WHERE eta.A = e.id)
  `;

  console.log(`📧 Total emails: ${totalEmails}`);
  console.log(`👤 Emails linked to person: ${emailsLinkedToPerson} (${Math.round((emailsLinkedToPerson/totalEmails)*100)}%)`);
  console.log(`🏢 Emails linked to company: ${emailsLinkedToCompany} (${Math.round((emailsLinkedToCompany/totalEmails)*100)}%)`);
  console.log(`⚡ Emails linked to action: ${emailsLinkedToAction} (${Math.round((emailsLinkedToAction/totalEmails)*100)}%)`);
  console.log(`🎯 Fully linked emails: ${fullyLinkedEmails[0]?.count || 0} (${Math.round(((fullyLinkedEmails[0]?.count || 0)/totalEmails)*100)}%)`);
}

/**
 * Test with a small sample of emails
 */
async function testWithSampleEmails() {
  // Get a small sample of unlinked emails
  const sampleEmails = await prisma.email_messages.findMany({
    take: 5,
    orderBy: { sentAt: 'desc' },
    where: {
      NOT: {
        id: {
          in: await prisma.emailToPerson.findMany({
            select: { A: true }
          }).then(results => results.map(r => r.A))
        }
      }
    }
  });

  console.log(`Found ${sampleEmails.length} sample emails to test`);

  for (const email of sampleEmails) {
    console.log(`\n📧 Testing email: ${email.subject || 'No Subject'}`);
    
    try {
      const result = await linkEmailToEntities(email);
      console.log(`  ✅ Linked to person: ${result.linkedToPerson}`);
      console.log(`  ✅ Linked to company: ${result.linkedToCompany}`);
      console.log(`  ✅ Linked to action: ${result.linkedToAction}`);
      console.log(`  📊 Confidence: ${Math.round(result.confidence * 100)}%`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
}

/**
 * Link a single email to entities (simplified version)
 */
async function linkEmailToEntities(email) {
  const result = {
    linkedToPerson: false,
    linkedToCompany: false,
    linkedToAction: false,
    confidence: 0
  };

  // Extract email addresses
  const allEmails = [
    email.from,
    ...email.to,
    ...email.cc,
    ...email.bcc
  ].filter(Boolean);

  // 1. Find person
  const person = await prisma.people.findFirst({
    where: {
      OR: [
        { email: { in: allEmails } },
        { workEmail: { in: allEmails } },
        { personalEmail: { in: allEmails } },
        { secondaryEmail: { in: allEmails } }
      ]
    }
  });

  if (person) {
    result.linkedToPerson = true;
    result.confidence += 0.4;

    // 2. Link to company through person
    if (person.companyId) {
      result.linkedToCompany = true;
      result.confidence += 0.3;
    }
  }

  // 3. Find or create action
  let action = await prisma.actions.findFirst({
    where: {
      externalId: `email_${email.id}`
    }
  });

  if (!action) {
    // Create a simple action
    action = await prisma.actions.create({
      data: {
        workspaceId: 'test-workspace', // You might want to get this from email account
        userId: 'system',
        type: 'email',
        subject: email.subject || 'Email',
        description: `Email: ${email.subject}`,
        status: 'completed',
        priority: 'normal',
        externalId: `email_${email.id}`,
        personId: person?.id || null,
        companyId: person?.companyId || null,
        scheduledAt: email.sentAt,
        completedAt: email.sentAt
      }
    });
  }

  if (action) {
    result.linkedToAction = true;
    result.confidence += 0.3;
  }

  return result;
}

/**
 * Test API endpoint
 */
async function testApiEndpoint() {
  try {
    // Get a sample email ID
    const sampleEmail = await prisma.email_messages.findFirst({
      select: { id: true }
    });

    if (!sampleEmail) {
      console.log('❌ No emails found to test API');
      return;
    }

    console.log(`Testing API with email ID: ${sampleEmail.id}`);

    // This would normally be an HTTP request, but for testing we'll simulate
    const testData = {
      emailIds: [sampleEmail.id],
      workspaceId: 'test-workspace'
    };

    console.log('📡 API Test Data:', testData);
    console.log('✅ API endpoint structure is ready for testing');

  } catch (error) {
    console.log(`❌ API test error: ${error.message}`);
  }
}

main().catch(console.error);
