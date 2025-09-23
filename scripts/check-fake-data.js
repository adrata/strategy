const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function checkFakeData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking for fake/placeholder data...');
    
    // Get TOP workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP', mode: 'insensitive' } }
    });
    
    if (!workspace) {
      console.log('❌ TOP workspace not found');
      return;
    }
    
    console.log('✅ Found TOP workspace:', workspace.name);
    
    // Check for fake names
    const fakeNames = ['John Doe', 'Jane Doe', 'Test User', 'Demo User', 'Sample User'];
    let fakePeopleFound = 0;
    
    for (const fakeName of fakeNames) {
      const people = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          fullName: { contains: fakeName, mode: 'insensitive' }
        },
        select: { fullName: true, email: true }
      });
      
      if (people.length > 0) {
        console.log(`❌ Found ${people.length} people with fake name: ${fakeName}`);
        fakePeopleFound += people.length;
      }
    }
    
    // Check for test emails
    const testEmails = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        email: { contains: 'test', mode: 'insensitive' }
      },
      select: { fullName: true, email: true }
    });
    
    if (testEmails.length > 0) {
      console.log(`❌ Found ${testEmails.length} people with test emails`);
      fakePeopleFound += testEmails.length;
    }
    
    // Check for demo companies
    const demoCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        name: { contains: 'demo', mode: 'insensitive' }
      },
      select: { name: true }
    });
    
    if (demoCompanies.length > 0) {
      console.log(`❌ Found ${demoCompanies.length} demo companies`);
    }
    
    // Write results to file
    const results = {
      timestamp: new Date().toISOString(),
      workspace: workspace.name,
      fakePeopleFound: fakePeopleFound,
      testEmailsFound: testEmails.length,
      demoCompaniesFound: demoCompanies.length,
      totalIssues: fakePeopleFound + testEmails.length + demoCompanies.length
    };
    
    fs.writeFileSync('fake-data-audit-results.json', JSON.stringify(results, null, 2));
    
    console.log('✅ Audit complete - results saved to fake-data-audit-results.json');
    
    if (results.totalIssues === 0) {
      console.log('🎉 EXCELLENT - No fake/placeholder data detected!');
    } else {
      console.log('⚠️ ATTENTION NEEDED - Fake/placeholder data detected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFakeData();
