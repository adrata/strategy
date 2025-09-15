const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmailLinking() {
  console.log('🔧 FIXING EMAIL LINKING');
  console.log('========================');
  
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
    
    let fixed = 0;
    let created = 0;
    
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
        fixed++;
        continue;
      }
      
      // Get sample emails for this accountId to extract company info
      const sampleEmails = await prisma.$queryRaw`
        SELECT "from", "to", subject, "sentAt"
        FROM email_messages 
        WHERE "accountId" = $1
        LIMIT 5;
      `, [accountId];
      
      if (sampleEmails.length === 0) {
        console.log(`  ⚠️  No emails found for accountId: ${accountId}`);
        continue;
      }
      
      // Extract company name from email recipients
      const recipients = sampleEmails.map(email => email.to).filter(Boolean);
      const companyName = extractCompanyName(recipients);
      
      if (!companyName) {
        console.log(`  ⚠️  Could not extract company name for accountId: ${accountId}`);
        continue;
      }
      
      // Create new company
      const newCompany = await prisma.companies.create({
        data: {
          id: accountId,
          name: companyName,
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✅ Created company: ${newCompany.name} (ID: ${newCompany.id})`);
      created++;
    }
    
    console.log('\n📊 EMAIL LINKING FIX SUMMARY:');
    console.log(`  ✅ Already linked: ${fixed} companies`);
    console.log(`  🆕 Created: ${created} companies`);
    console.log(`  📧 Total emails that can now be linked: ${uniqueAccountIds.reduce((sum, row) => sum + row.count, 0)}`);
    
    // Verify the fix
    console.log('\n🔍 VERIFICATION:');
    const linkedEmails = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      JOIN companies c ON em."accountId" = c.id
      WHERE c."workspaceId" = $1;
    `, ['01K1VBYV8ETM2RCQA4GNN9EG72'];
    console.log(`  📧 Emails now linked to companies: ${linkedEmails[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function extractCompanyName(recipients) {
  // Extract company names from email recipients
  const domains = new Set();
  
  recipients.forEach(recipient => {
    if (recipient && recipient.includes('@')) {
      const domain = recipient.split('@')[1];
      if (domain && !domain.includes('retail-products.com')) {
        domains.add(domain);
      }
    }
  });
  
  if (domains.size === 0) {
    return null;
  }
  
  // Use the most common domain as company name
  const domain = Array.from(domains)[0];
  
  // Convert domain to company name
  const companyName = domain
    .split('.')[0] // Remove .com, .org, etc.
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return companyName;
}

fixEmailLinking();
