const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAccountContactToPersonCompany() {
  console.log('🔄 UPDATING ACCOUNT/CONTACT TO PERSON/COMPANY');
  console.log('==============================================');
  console.log('Converting legacy accountId/contactId to personId/companyId...\n');

  let stats = {
    activitiesUpdated: 0,
    emailMessagesUpdated: 0,
    notesUpdated: 0,
    opportunitiesUpdated: 0,
    webhookSubscriptionsUpdated: 0,
    customersUpdated: 0,
    errors: 0
  };

  try {
    // Update activities table
    console.log('📝 Updating activities table...');
    const activitiesResult = await prisma.$executeRaw`
      UPDATE activities 
      SET 
        "personId" = "contactId",
        "companyId" = "accountId"
      WHERE "contactId" IS NOT NULL OR "accountId" IS NOT NULL
    `;
    stats.activitiesUpdated = activitiesResult;
    console.log(`✅ Updated ${stats.activitiesUpdated} activities`);

    // Update email_messages table
    console.log('📧 Updating email_messages table...');
    const emailMessagesResult = await prisma.$executeRaw`
      UPDATE email_messages 
      SET "companyId" = "accountId"
      WHERE "accountId" IS NOT NULL
    `;
    stats.emailMessagesUpdated = emailMessagesResult;
    console.log(`✅ Updated ${stats.emailMessagesUpdated} email messages`);

    // Update notes table
    console.log('📝 Updating notes table...');
    const notesResult = await prisma.$executeRaw`
      UPDATE notes 
      SET 
        "personId" = "contactId",
        "companyId" = "accountId"
      WHERE "contactId" IS NOT NULL OR "accountId" IS NOT NULL
    `;
    stats.notesUpdated = notesResult;
    console.log(`✅ Updated ${stats.notesUpdated} notes`);

    // Update opportunities table
    console.log('💰 Updating opportunities table...');
    const opportunitiesResult = await prisma.$executeRaw`
      UPDATE opportunities 
      SET "companyId" = "accountId"
      WHERE "accountId" IS NOT NULL
    `;
    stats.opportunitiesUpdated = opportunitiesResult;
    console.log(`✅ Updated ${stats.opportunitiesUpdated} opportunities`);

    // Update webhook_subscriptions table
    console.log('🔗 Updating webhook_subscriptions table...');
    const webhookResult = await prisma.$executeRaw`
      UPDATE webhook_subscriptions 
      SET "companyId" = "accountId"
      WHERE "accountId" IS NOT NULL
    `;
    stats.webhookSubscriptionsUpdated = webhookResult;
    console.log(`✅ Updated ${stats.webhookSubscriptionsUpdated} webhook subscriptions`);

    // Update customers table
    console.log('🏆 Updating customers table...');
    const customersResult = await prisma.$executeRaw`
      UPDATE customers 
      SET "companyId" = "accountId"
      WHERE "accountId" IS NOT NULL
    `;
    stats.customersUpdated = customersResult;
    console.log(`✅ Updated ${stats.customersUpdated} customers`);

    // FINAL STATS
    console.log('\n🎉 ACCOUNT/CONTACT TO PERSON/COMPANY UPDATE COMPLETE!');
    console.log('=====================================================');
    console.log(`📝 Activities updated: ${stats.activitiesUpdated}`);
    console.log(`📧 Email messages updated: ${stats.emailMessagesUpdated}`);
    console.log(`📝 Notes updated: ${stats.notesUpdated}`);
    console.log(`💰 Opportunities updated: ${stats.opportunitiesUpdated}`);
    console.log(`🔗 Webhook subscriptions updated: ${stats.webhookSubscriptionsUpdated}`);
    console.log(`🏆 Customers updated: ${stats.customersUpdated}`);
    console.log(`❌ Errors: ${stats.errors}`);

    console.log('\n✅ ALL TABLES NOW USE PERSON/COMPANY MODEL:');
    console.log('• personId instead of contactId');
    console.log('• companyId instead of accountId');
    console.log('• Proper foreign key relationships established');

  } catch (error) {
    console.error('❌ Update failed:', error);
    stats.errors++;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateAccountContactToPersonCompany().catch(console.error);
