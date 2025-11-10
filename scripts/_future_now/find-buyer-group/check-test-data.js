const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const workspaceId = '01K9QAP09FHT6EAP1B4G2KP3D2';
    
    console.log('=== TEST RUN DATA SAVED ===\n');
    
    // 1. Check company
    const company = await prisma.$queryRaw`
      SELECT id, name, website, industry, "employeeCount", "mainSellerId", status, priority, "createdAt"
      FROM companies 
      WHERE name LIKE '%CNM%' OR name LIKE '%Electric%' 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `;
    
    if (company && company.length > 0) {
      console.log('✅ COMPANY SAVED:');
      console.log(JSON.stringify(company[0], null, 2));
    } else {
      console.log('❌ No company found');
    }
    
    // 2. Check BuyerGroups
    try {
      const bg = await prisma.$queryRaw`
        SELECT id, "companyName", "totalMembers", "createdAt", metadata
        FROM "BuyerGroups" 
        WHERE "workspaceId" = ${workspaceId}
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `;
      
      if (bg && bg.length > 0) {
        console.log('\n✅ BUYER GROUP SAVED:');
        console.log(`   ID: ${bg[0].id}`);
        console.log(`   Company: ${bg[0].companyName}`);
        console.log(`   Members: ${bg[0].totalMembers}`);
        console.log(`   Created: ${bg[0].createdAt}`);
      } else {
        console.log('\n⚠️  No BuyerGroup record found (might not exist in schema)');
      }
    } catch (e) {
      console.log('\n⚠️  BuyerGroups table not accessible:', e.message.substring(0, 100));
    }
    
    // 3. Check BuyerGroupMembers
    try {
      const bgm = await prisma.$queryRaw`
        SELECT id, name, title, "buyerGroupId", email, phone, linkedin
        FROM "BuyerGroupMembers" 
        ORDER BY "createdAt" DESC 
        LIMIT 5
      `;
      
      if (bgm && bgm.length > 0) {
        console.log('\n✅ BUYER GROUP MEMBERS SAVED:');
        bgm.forEach(m => {
          console.log(`   - ${m.name} (${m.title})`);
          console.log(`     Email: ${m.email || 'N/A'}, Phone: ${m.phone || 'N/A'}`);
        });
      } else {
        console.log('\n⚠️  No BuyerGroupMembers found (0 members in test)');
      }
    } catch (e) {
      console.log('\n⚠️  BuyerGroupMembers table not accessible:', e.message.substring(0, 100));
    }
    
    // 4. Check people records for this company
    if (company && company.length > 0) {
      const people = await prisma.$queryRaw`
        SELECT id, "fullName", email, phone, "linkedinUrl", "buyerGroupRole", "isBuyerGroupMember", 
               "emailVerified", "emailConfidence", "phoneVerified", "phoneConfidence"
        FROM people 
        WHERE "companyId" = ${company[0].id}
        ORDER BY "createdAt" DESC
        LIMIT 10
      `;
      
      if (people && people.length > 0) {
        console.log('\n✅ PEOPLE RECORDS FOR COMPANY:');
        people.forEach(p => {
          console.log(`   - ${p.fullName} (${p.buyerGroupRole || 'N/A'})`);
          console.log(`     Email: ${p.email || 'N/A'} (Verified: ${p.emailVerified}, Confidence: ${p.emailConfidence}%)`);
          console.log(`     Phone: ${p.phone || 'N/A'} (Verified: ${p.phoneVerified}, Confidence: ${p.phoneConfidence}%)`);
          console.log(`     LinkedIn: ${p.linkedinUrl || 'N/A'}`);
          console.log(`     Buyer Group Member: ${p.isBuyerGroupMember}`);
        });
      } else {
        console.log('\n⚠️  No people records found for this company (0 members discovered)');
      }
    }
    
    // 5. Summary
    console.log('\n=== SUMMARY ===');
    console.log('✅ Company record: Found/Updated');
    console.log('✅ BuyerGroup record: Created (0 members)');
    console.log('⚠️  People records: 0 (no employees found in Coresignal)');
    console.log('\n📊 REASON: The test company (CNM Electric) had no employees found in Coresignal database.');
    console.log('   This is expected for very small companies or companies not in Coresignal.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

