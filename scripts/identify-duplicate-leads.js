#!/usr/bin/env node

/**
 * Identify Duplicate Leads in TOP Data
 * 
 * Finds leads that duplicate people or prospects to help clean up the data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function identifyDuplicates() {
  console.log('🔍 Identifying Duplicate Leads in TOP Data');
  console.log('==========================================\n');

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

    // 1. GET ALL DATA
    console.log('📥 Loading data...');
    
    const [people, leads, prospects] = await Promise.all([
      prisma.people.findMany({
        where: { workspaceId: topWorkspace.id },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          company: true,
          jobTitle: true
        }
      }),
      prisma.leads.findMany({
        where: { workspaceId: topWorkspace.id },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          company: true,
          jobTitle: true
        }
      }),
      prisma.prospects.findMany({
        where: { workspaceId: topWorkspace.id },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          company: true,
          jobTitle: true,
          personId: true
        }
      })
    ]);

    console.log(`Loaded: ${people.length} people, ${leads.length} leads, ${prospects.length} prospects\n`);

    // 2. FIND DUPLICATES BY EMAIL
    console.log('🔍 Finding duplicates by email...');
    
    const emailMap = new Map();
    const duplicates = [];

    // Index people by email
    people.forEach(person => {
      const emails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email).push({ 
          type: 'person', 
          id: person.id, 
          name: person.fullName,
          company: person.company,
          title: person.jobTitle
        });
      });
    });

    // Index prospects by email
    prospects.forEach(prospect => {
      const emails = [prospect.email, prospect.workEmail, prospect.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email).push({ 
          type: 'prospect', 
          id: prospect.id, 
          name: prospect.fullName,
          company: prospect.company,
          title: prospect.jobTitle,
          personId: prospect.personId
        });
      });
    });

    // Check leads against people and prospects
    leads.forEach(lead => {
      const emails = [lead.email, lead.workEmail, lead.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (emailMap.has(email)) {
          emailMap.get(email).push({ 
            type: 'lead', 
            id: lead.id, 
            name: lead.fullName,
            company: lead.company,
            title: lead.jobTitle
          });
        }
      });
    });

    // Find actual duplicates
    emailMap.forEach((records, email) => {
      if (records.length > 1) {
        const hasPerson = records.some(r => r.type === 'person');
        const hasLead = records.some(r => r.type === 'lead');
        const hasProspect = records.some(r => r.type === 'prospect');
        
        if (hasLead && (hasPerson || hasProspect)) {
          duplicates.push({ email, records });
        }
      }
    });

    console.log(`Found ${duplicates.length} email-based duplicates\n`);

    // 3. FIND DUPLICATES BY NAME AND COMPANY
    console.log('🔍 Finding duplicates by name and company...');
    
    const nameCompanyMap = new Map();
    const nameDuplicates = [];

    // Index people by name + company
    people.forEach(person => {
      const key = `${person.fullName?.toLowerCase()}_${person.company?.toLowerCase()}`;
      if (!nameCompanyMap.has(key)) {
        nameCompanyMap.set(key, []);
      }
      nameCompanyMap.get(key).push({ 
        type: 'person', 
        id: person.id, 
        name: person.fullName,
        company: person.company,
        title: person.jobTitle
      });
    });

    // Index prospects by name + company
    prospects.forEach(prospect => {
      const key = `${prospect.fullName?.toLowerCase()}_${prospect.company?.toLowerCase()}`;
      if (!nameCompanyMap.has(key)) {
        nameCompanyMap.set(key, []);
      }
      nameCompanyMap.get(key).push({ 
        type: 'prospect', 
        id: prospect.id, 
        name: prospect.fullName,
        company: prospect.company,
        title: prospect.jobTitle,
        personId: prospect.personId
      });
    });

    // Check leads against people and prospects
    leads.forEach(lead => {
      const key = `${lead.fullName?.toLowerCase()}_${lead.company?.toLowerCase()}`;
      if (nameCompanyMap.has(key)) {
        nameCompanyMap.get(key).push({ 
          type: 'lead', 
          id: lead.id, 
          name: lead.fullName,
          company: lead.company,
          title: lead.jobTitle
        });
      }
    });

    // Find name-based duplicates
    nameCompanyMap.forEach((records, key) => {
      if (records.length > 1) {
        const hasPerson = records.some(r => r.type === 'person');
        const hasLead = records.some(r => r.type === 'lead');
        const hasProspect = records.some(r => r.type === 'prospect');
        
        if (hasLead && (hasPerson || hasProspect)) {
          nameDuplicates.push({ key, records });
        }
      }
    });

    console.log(`Found ${nameDuplicates.length} name+company-based duplicates\n`);

    // 4. ANALYZE PROSPECTS WITH PERSONID
    console.log('🔍 Analyzing prospects with personId...');
    
    const prospectsWithPersonId = prospects.filter(p => p.personId);
    const prospectsWithoutPersonId = prospects.filter(p => !p.personId);
    
    console.log(`Prospects with personId: ${prospectsWithPersonId.length}`);
    console.log(`Prospects without personId: ${prospectsWithoutPersonId.length}\n`);

    // 5. SUMMARY REPORT
    console.log('📊 DUPLICATE ANALYSIS SUMMARY');
    console.log('=============================');
    console.log(`Total People: ${people.length}`);
    console.log(`Total Leads: ${leads.length}`);
    console.log(`Total Prospects: ${prospects.length}`);
    console.log(`Expected Leads: ${people.length - prospects.length}`);
    console.log(`Extra Leads: ${leads.length - (people.length - prospects.length)}`);
    console.log('');
    console.log(`Email-based duplicates: ${duplicates.length}`);
    console.log(`Name+Company duplicates: ${nameDuplicates.length}`);
    console.log('');

    // 6. SAMPLE DUPLICATES
    console.log('📋 SAMPLE EMAIL DUPLICATES (First 10)');
    console.log('======================================');
    duplicates.slice(0, 10).forEach((dup, index) => {
      console.log(`${index + 1}. Email: ${dup.email}`);
      dup.records.forEach(record => {
        console.log(`   - ${record.type.toUpperCase()}: ${record.name} (${record.company}) - ${record.id}`);
      });
      console.log('');
    });

    console.log('📋 SAMPLE NAME+COMPANY DUPLICATES (First 10)');
    console.log('=============================================');
    nameDuplicates.slice(0, 10).forEach((dup, index) => {
      console.log(`${index + 1}. Name+Company: ${dup.key}`);
      dup.records.forEach(record => {
        console.log(`   - ${record.type.toUpperCase()}: ${record.name} (${record.company}) - ${record.id}`);
      });
      console.log('');
    });

    // 7. RECOMMENDATIONS
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    console.log('1. DELETE DUPLICATE LEADS:');
    console.log(`   - Remove ${duplicates.length} leads that duplicate people/prospects by email`);
    console.log(`   - Remove ${nameDuplicates.length} leads that duplicate people/prospects by name+company`);
    console.log('');
    console.log('2. FIX PROSPECT-PERSON RELATIONSHIPS:');
    console.log(`   - ${prospectsWithoutPersonId.length} prospects need personId links`);
    console.log('');
    console.log('3. EXPECTED RESULT:');
    console.log(`   - People: ${people.length} (unchanged)`);
    console.log(`   - Prospects: ${prospects.length} (unchanged)`);
    console.log(`   - Leads: ${people.length - prospects.length} (after cleanup)`);
    console.log('');

    // 8. GENERATE CLEANUP SCRIPT
    console.log('🔧 GENERATING CLEANUP SCRIPT...');
    
    const duplicateLeadIds = new Set();
    duplicates.forEach(dup => {
      dup.records.forEach(record => {
        if (record.type === 'lead') {
          duplicateLeadIds.add(record.id);
        }
      });
    });
    
    nameDuplicates.forEach(dup => {
      dup.records.forEach(record => {
        if (record.type === 'lead') {
          duplicateLeadIds.add(record.id);
        }
      });
    });

    const cleanupScript = `-- Cleanup duplicate leads in TOP workspace
-- Generated on ${new Date().toISOString()}

-- Delete ${duplicateLeadIds.size} duplicate leads
DELETE FROM leads 
WHERE id IN (${Array.from(duplicateLeadIds).map(id => `'${id}'`).join(', ')})
AND "workspaceId" = '${topWorkspace.id}';

-- Verify counts after cleanup
SELECT 'people' as table_name, COUNT(*) as count FROM people WHERE "workspaceId" = '${topWorkspace.id}'
UNION ALL
SELECT 'leads', COUNT(*) FROM leads WHERE "workspaceId" = '${topWorkspace.id}'
UNION ALL
SELECT 'prospects', COUNT(*) FROM prospects WHERE "workspaceId" = '${topWorkspace.id}';`;

    require('fs').writeFileSync('scripts/cleanup-duplicate-leads.sql', cleanupScript);
    console.log('✅ Cleanup script saved to: scripts/cleanup-duplicate-leads.sql');
    console.log(`   This will delete ${duplicateLeadIds.size} duplicate leads`);

  } catch (error) {
    console.error('❌ Error identifying duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
identifyDuplicates();
