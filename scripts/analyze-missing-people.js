#!/usr/bin/env node

/**
 * Analyze Missing People in TOP Data
 * 
 * Finds leads and prospects that don't have corresponding people records
 * Expected: People = Prospects + Leads
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeMissingPeople() {
  console.log('🔍 Analyzing Missing People in TOP Data');
  console.log('=======================================\n');

  try {
    // Get TOP workspace ID
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP',
          mode: 'insensitive'
        }
      }
    });

    if (!topWorkspace) {
      console.log('❌ TOP workspace not found');
      return;
    }

    console.log(`📊 Analyzing workspace: ${topWorkspace.name} (${topWorkspace.id})\n`);

    // 1. GET BASIC COUNTS
    console.log('📊 BASIC COUNTS');
    console.log('===============');
    
    const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
      prisma.people.count({ where: { workspaceId: topWorkspace.id } }),
      prisma.leads.count({ where: { workspaceId: topWorkspace.id } }),
      prisma.prospects.count({ where: { workspaceId: topWorkspace.id } })
    ]);

    const expectedPeople = leadsCount + prospectsCount;
    const missingPeople = expectedPeople - peopleCount;

    console.log(`People: ${peopleCount}`);
    console.log(`Leads: ${leadsCount}`);
    console.log(`Prospects: ${prospectsCount}`);
    console.log(`Expected People (Leads + Prospects): ${expectedPeople}`);
    console.log(`Missing People: ${missingPeople}`);
    console.log('');

    // 2. ANALYZE LEADS WITHOUT PEOPLE
    console.log('🎯 LEADS WITHOUT PEOPLE');
    console.log('=======================');
    
    const leadsWithoutPeople = await prisma.leads.findMany({
      where: {
        workspaceId: topWorkspace.id,
        personId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        status: true,
        createdAt: true
      },
      take: 20
    });

    console.log(`Leads without personId: ${leadsWithoutPeople.length}`);
    console.log('\nSample leads without people:');
    leadsWithoutPeople.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} (${lead.company}) - ${lead.email || 'No email'} - ${lead.status}`);
    });
    console.log('');

    // 3. ANALYZE PROSPECTS WITHOUT PEOPLE
    console.log('🔍 PROSPECTS WITHOUT PEOPLE');
    console.log('============================');
    
    const prospectsWithoutPeople = await prisma.prospects.findMany({
      where: {
        workspaceId: topWorkspace.id,
        personId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        status: true,
        createdAt: true
      },
      take: 20
    });

    console.log(`Prospects without personId: ${prospectsWithoutPeople.length}`);
    console.log('\nSample prospects without people:');
    prospectsWithoutPeople.forEach((prospect, index) => {
      console.log(`${index + 1}. ${prospect.fullName} (${prospect.company}) - ${prospect.email || 'No email'} - ${prospect.status}`);
    });
    console.log('');

    // 4. ANALYZE BY COMPANY
    console.log('🏢 COMPANY ANALYSIS');
    console.log('===================');
    
    const companyStats = await prisma.leads.groupBy({
      by: ['company'],
      where: {
        workspaceId: topWorkspace.id,
        company: { not: null }
      },
      _count: { company: true },
      orderBy: { _count: { company: 'desc' } },
      take: 10
    });

    console.log('Top 10 companies by lead count:');
    companyStats.forEach((company, index) => {
      console.log(`${index + 1}. ${company.company}: ${company._count.company} leads`);
    });
    console.log('');

    // 5. ANALYZE BY STATUS
    console.log('📊 STATUS ANALYSIS');
    console.log('==================');
    
    const leadStatuses = await prisma.leads.groupBy({
      by: ['status'],
      where: { workspaceId: topWorkspace.id },
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } }
    });

    const prospectStatuses = await prisma.prospects.groupBy({
      by: ['status'],
      where: { workspaceId: topWorkspace.id },
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } }
    });

    console.log('Lead statuses:');
    leadStatuses.forEach(status => {
      console.log(`  ${status.status}: ${status._count.status}`);
    });
    console.log('');

    console.log('Prospect statuses:');
    prospectStatuses.forEach(status => {
      console.log(`  ${status.status}: ${status._count.status}`);
    });
    console.log('');

    // 6. RECOMMENDATIONS
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    console.log('1. CREATE MISSING PEOPLE RECORDS:');
    console.log(`   - Create ${missingPeople} people records from leads and prospects`);
    console.log('   - Link leads and prospects to their corresponding people via personId');
    console.log('');
    console.log('2. DATA STRUCTURE SHOULD BE:');
    console.log('   - People: Master records for all contacts');
    console.log('   - Leads: People in early sales stages');
    console.log('   - Prospects: People in advanced sales stages');
    console.log('   - All leads and prospects should have personId pointing to people');
    console.log('');
    console.log('3. EXPECTED RESULT:');
    console.log(`   - People: ${expectedPeople} (Leads + Prospects)`);
    console.log(`   - Leads: ${leadsCount} (all with personId)`);
    console.log(`   - Prospects: ${prospectsCount} (all with personId)`);
    console.log('');

    // 7. GENERATE MIGRATION SCRIPT
    console.log('🔧 GENERATING MIGRATION SCRIPT...');
    
    const migrationScript = `-- Create missing people records from leads and prospects
-- Generated on ${new Date().toISOString()}

-- Step 1: Create people records from leads without personId
INSERT INTO people (
  id, "workspaceId", "firstName", "lastName", "fullName", 
  email, "workEmail", "personalEmail", phone, "mobilePhone", "workPhone",
  company, "jobTitle", department, "linkedinUrl", address, city, state, country,
  status, "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid() as id,
  '${topWorkspace.id}' as "workspaceId",
  "firstName", "lastName", "fullName",
  email, "workEmail", "personalEmail", phone, "mobilePhone", "workPhone",
  company, "jobTitle", department, "linkedinUrl", address, city, state, country,
  COALESCE(status, 'active') as status,
  "createdAt", "updatedAt"
FROM leads 
WHERE "workspaceId" = '${topWorkspace.id}' 
  AND "personId" IS NULL;

-- Step 2: Update leads with personId
UPDATE leads 
SET "personId" = p.id
FROM people p
WHERE leads."workspaceId" = '${topWorkspace.id}'
  AND leads."personId" IS NULL
  AND p."workspaceId" = '${topWorkspace.id}'
  AND (
    (leads.email IS NOT NULL AND leads.email = p.email) OR
    (leads."workEmail" IS NOT NULL AND leads."workEmail" = p."workEmail") OR
    (leads."personalEmail" IS NOT NULL AND leads."personalEmail" = p."personalEmail") OR
    (leads."fullName" = p."fullName" AND leads.company = p.company)
  );

-- Step 3: Create people records from prospects without personId
INSERT INTO people (
  id, "workspaceId", "firstName", "lastName", "fullName", 
  email, "workEmail", "personalEmail", phone, "mobilePhone", "workPhone",
  company, "jobTitle", department, "linkedinUrl", address, city, state, country,
  status, "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid() as id,
  '${topWorkspace.id}' as "workspaceId",
  "firstName", "lastName", "fullName",
  email, "workEmail", "personalEmail", phone, "mobilePhone", "workPhone",
  company, "jobTitle", department, "linkedinUrl", address, city, state, country,
  COALESCE(status, 'active') as status,
  "createdAt", "updatedAt"
FROM prospects 
WHERE "workspaceId" = '${topWorkspace.id}' 
  AND "personId" IS NULL;

-- Step 4: Update prospects with personId
UPDATE prospects 
SET "personId" = p.id
FROM people p
WHERE prospects."workspaceId" = '${topWorkspace.id}'
  AND prospects."personId" IS NULL
  AND p."workspaceId" = '${topWorkspace.id}'
  AND (
    (prospects.email IS NOT NULL AND prospects.email = p.email) OR
    (prospects."workEmail" IS NOT NULL AND prospects."workEmail" = p."workEmail") OR
    (prospects."personalEmail" IS NOT NULL AND prospects."personalEmail" = p."personalEmail") OR
    (prospects."fullName" = p."fullName" AND prospects.company = p.company)
  );

-- Step 5: Verify results
SELECT 'people' as table_name, COUNT(*) as count FROM people WHERE "workspaceId" = '${topWorkspace.id}'
UNION ALL
SELECT 'leads', COUNT(*) FROM leads WHERE "workspaceId" = '${topWorkspace.id}'
UNION ALL
SELECT 'prospects', COUNT(*) FROM prospects WHERE "workspaceId" = '${topWorkspace.id}';`;

    require('fs').writeFileSync('scripts/create-missing-people.sql', migrationScript);
    console.log('✅ Migration script saved to: scripts/create-missing-people.sql');
    console.log('   This will create missing people records and link them properly');

  } catch (error) {
    console.error('❌ Error analyzing missing people:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeMissingPeople();
