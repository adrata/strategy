#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function checkFakeData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking for fake/placeholder data in TOP workspace...');
    
    // Get TOP workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP', mode: 'insensitive' } }
    });
    
    if (!workspace) {
      console.log('❌ TOP workspace not found');
      return;
    }
    
    console.log('✅ Found TOP workspace:', workspace.name);
    
    // Check for common fake names
    const fakeNameChecks = [
      { name: 'John Doe', pattern: 'john doe' },
      { name: 'Jane Doe', pattern: 'jane doe' },
      { name: 'Test User', pattern: 'test user' },
      { name: 'Demo User', pattern: 'demo user' },
      { name: 'Sample User', pattern: 'sample user' },
      { name: 'Placeholder', pattern: 'placeholder' },
      { name: 'Fake User', pattern: 'fake user' },
      { name: 'Dummy User', pattern: 'dummy user' }
    ];
    
    console.log('\n👥 Checking people for fake names...');
    let totalFakePeople = 0;
    
    for (const check of fakeNameChecks) {
      const people = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          fullName: { contains: check.pattern, mode: 'insensitive' }
        },
        select: { fullName: true, email: true, company: { select: { name: true } } }
      });
      
      if (people.length > 0) {
        console.log(`❌ Found ${people.length} people with fake name: ${check.name}`);
        people.forEach(p => {
          console.log(`   - ${p.fullName} (${p.email || 'No email'}) at ${p.company?.name || 'No company'}`);
        });
        totalFakePeople += people.length;
      }
    }
    
    if (totalFakePeople === 0) {
      console.log('✅ No fake names found in people data');
    }
    
    // Check for test emails
    console.log('\n📧 Checking for test/demo emails...');
    const testEmails = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { email: { contains: 'test', mode: 'insensitive' } },
          { email: { contains: 'demo', mode: 'insensitive' } },
          { email: { contains: 'sample', mode: 'insensitive' } },
          { email: { contains: 'placeholder', mode: 'insensitive' } },
          { email: { contains: 'fake', mode: 'insensitive' } },
          { email: { contains: 'dummy', mode: 'insensitive' } }
        ]
      },
      select: { fullName: true, email: true, company: { select: { name: true } } }
    });
    
    if (testEmails.length > 0) {
      console.log(`❌ Found ${testEmails.length} people with test/demo emails:`);
      testEmails.forEach(p => {
        console.log(`   - ${p.fullName} (${p.email}) at ${p.company?.name || 'No company'}`);
      });
    } else {
      console.log('✅ No test/demo emails found');
    }
    
    // Check for companies with test names
    console.log('\n🏢 Checking companies for fake names...');
    const testCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { name: { contains: 'demo', mode: 'insensitive' } },
          { name: { contains: 'sample', mode: 'insensitive' } },
          { name: { contains: 'placeholder', mode: 'insensitive' } },
          { name: { contains: 'fake', mode: 'insensitive' } },
          { name: { contains: 'dummy', mode: 'insensitive' } }
        ]
      },
      select: { name: true, website: true }
    });
    
    if (testCompanies.length > 0) {
      console.log(`❌ Found ${testCompanies.length} companies with test/demo names:`);
      testCompanies.forEach(c => {
        console.log(`   - ${c.name} (${c.website || 'No website'})`);
      });
    } else {
      console.log('✅ No test/demo companies found');
    }
    
    // Check for people with suspicious job titles
    console.log('\n💼 Checking for suspicious job titles...');
    const suspiciousTitles = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { jobTitle: { contains: 'test', mode: 'insensitive' } },
          { jobTitle: { contains: 'demo', mode: 'insensitive' } },
          { jobTitle: { contains: 'sample', mode: 'insensitive' } },
          { jobTitle: { contains: 'placeholder', mode: 'insensitive' } },
          { jobTitle: { contains: 'fake', mode: 'insensitive' } },
          { jobTitle: { contains: 'dummy', mode: 'insensitive' } }
        ]
      },
      select: { fullName: true, jobTitle: true, company: { select: { name: true } } }
    });
    
    if (suspiciousTitles.length > 0) {
      console.log(`❌ Found ${suspiciousTitles.length} people with suspicious job titles:`);
      suspiciousTitles.forEach(p => {
        console.log(`   - ${p.fullName} (${p.jobTitle}) at ${p.company?.name || 'No company'}`);
      });
    } else {
      console.log('✅ No suspicious job titles found');
    }
    
    // Summary
    const totalIssues = totalFakePeople + testEmails.length + testCompanies.length + suspiciousTitles.length;
    
    console.log('\n🎉 FAKE DATA AUDIT COMPLETE!');
    console.log('============================');
    console.log(`Total issues found: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('✅ EXCELLENT - No fake/placeholder data detected!');
      console.log('✅ Data quality is high and production-ready');
    } else {
      console.log('⚠️ ATTENTION NEEDED - Fake/placeholder data detected');
      console.log('🔧 Review and clean up identified issues');
    }
    
  } catch (error) {
    console.error('❌ Error checking fake data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFakeData();
