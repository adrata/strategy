const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmailLinking() {
  console.log('🔧 FIXING EMAIL LINKING - FINAL SOLUTION');
  console.log('=========================================');
  
  try {
    // Get unique accountIds from emails
    const uniqueAccountIds = await prisma.$queryRaw`
      SELECT "accountId", COUNT(*) as count
      FROM email_messages 
      GROUP BY "accountId"
      ORDER BY count DESC;
    `;
    
    console.log('📊 Found accountIds in emails:');
    uniqueAccountIds.forEach(row => {
      console.log(`  ${row.accountId}: ${row.count} emails`);
    });
    
    let created = 0;
    let mapped = 0;
    
    for (const row of uniqueAccountIds) {
      const accountId = row.accountId;
      const emailCount = row.count;
      
      console.log(`\n🔍 Processing accountId: ${accountId}`);
      
      // Check if this accountId exists in companies
      const existingCompany = await prisma.companies.findUnique({
        where: { id: accountId }
      });
      
      if (existingCompany) {
        console.log(`  ✅ Company already exists: ${existingCompany.name}`);
        mapped++;
        continue;
      }
      
      // Get sample emails for this accountId
      const sampleEmails = await prisma.$queryRaw`
        SELECT "from", "to", subject
        FROM email_messages 
        WHERE "accountId" = $1
        LIMIT 3;
      `, [accountId];
      
      if (sampleEmails.length === 0) {
        console.log(`  ⚠️  No emails found for accountId: ${accountId}`);
        continue;
      }
      
      console.log(`  📧 Sample emails:`);
      sampleEmails.forEach((email, i) => {
        console.log(`    ${i+1}. To: ${email.to}`);
      });
      
      // Extract company name from first email recipient
      const firstRecipient = sampleEmails[0].to;
      let companyName = 'Unknown Company';
      
      if (firstRecipient && firstRecipient.includes('@')) {
        const domain = firstRecipient.split('@')[1];
        if (domain && !domain.includes('retail-products.com')) {
          // Convert domain to company name
          companyName = domain
            .split('.')[0] // Remove .com, .org, etc.
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      // Generate a shorter ID for the company (max 30 chars)
      const shortId = generateShortId(accountId, companyName);
      
      // Create new company with shorter ID
      const newCompany = await prisma.companies.create({
        data: {
          id: shortId,
          name: companyName,
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✅ Created company: ${newCompany.name} (ID: ${newCompany.id})`);
      
      // Update email_messages to use the new company ID
      const updateResult = await prisma.$executeRaw`
        UPDATE email_messages 
        SET "accountId" = $1
        WHERE "accountId" = $2;
      `, [shortId, accountId];
      
      console.log(`  🔄 Updated ${updateResult} emails to use new company ID`);
      created++;
    }
    
    console.log('\n📊 EMAIL LINKING FIX SUMMARY:');
    console.log(`  🆕 Created: ${created} companies`);
    console.log(`  ✅ Already mapped: ${mapped} companies`);
    console.log(`  📧 Total emails processed: ${uniqueAccountIds.reduce((sum, row) => sum + row.count, 0)}`);
    
    // Verify the fix
    console.log('\n🔍 VERIFICATION:');
    const linkedEmails = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      JOIN companies c ON em."accountId" = c.id
      WHERE c."workspaceId" = $1;
    `, ['01K1VBYV8ETM2RCQA4GNN9EG72'];
    console.log(`  📧 Emails now linked to companies: ${linkedEmails[0].count}`);
    
    // Check for any remaining unlinked emails
    const unlinkedEmails = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      LEFT JOIN companies c ON em."accountId" = c.id
      WHERE c.id IS NULL;
    `;
    console.log(`  ❌ Unlinked emails: ${unlinkedEmails[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function generateShortId(originalId, companyName) {
  // Generate a short ID (max 30 chars) based on company name and original ID
  const namePrefix = companyName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .substring(0, 10);
  
  const idSuffix = originalId.substring(originalId.length - 10);
  
  return `${namePrefix}_${idSuffix}`.substring(0, 30);
}

fixEmailLinking();
