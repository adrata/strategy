#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  const NOTARY_WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  
  try {
    // Get workspace info
    const workspace = await prisma.workspaces.findUnique({
      where: { id: NOTARY_WORKSPACE_ID },
      select: { id: true, name: true, slug: true }
    });
    
    console.log('Workspace:', JSON.stringify(workspace, null, 2));
    
    // Count companies
    const companyCount = await prisma.companies.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null }
    });
    
    console.log('\nTotal Companies:', companyCount);
    
    // Sample companies to see naming patterns
    const sampleCompanies = await prisma.companies.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null },
      select: { id: true, name: true, domain: true, email: true, website: true },
      take: 20,
      orderBy: { name: 'asc' }
    });
    
    console.log('\nSample Companies:');
    sampleCompanies.forEach(c => console.log(`  - ${c.name} | ${c.domain || 'no domain'} | ${c.website || 'no website'}`));
    
    // Count people
    const peopleCount = await prisma.people.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null }
    });
    
    console.log('\nTotal People:', peopleCount);
    
    // Check for potential duplicates by exact name match
    const nameGroups = await prisma.companies.groupBy({
      by: ['name'],
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null },
      _count: true,
      having: { name: { _count: { gt: 1 } } }
    });
    
    console.log('\nExact Company Name Duplicates:', nameGroups.length);
    if (nameGroups.length > 0) {
      console.log('Examples:');
      nameGroups.slice(0, 10).forEach(g => console.log(`  - ${g.name}: ${g._count} records`));
    }
    
    // Check for potential people duplicates by email
    const emailDupes = await prisma.people.groupBy({
      by: ['email'],
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      },
      _count: true,
      having: { email: { _count: { gt: 1 } } }
    });
    
    console.log('\nPeople Email Duplicates:', emailDupes.length);
    if (emailDupes.length > 0) {
      console.log('Examples:');
      emailDupes.slice(0, 10).forEach(d => console.log(`  - ${d.email}: ${d._count} records`));
    }
    
    // Check for similar company names (case variations)
    const allCompanies = await prisma.companies.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    const lowercaseGroups = {};
    allCompanies.forEach(c => {
      const key = c.name.toLowerCase().trim();
      if (!lowercaseGroups[key]) lowercaseGroups[key] = [];
      lowercaseGroups[key].push(c);
    });
    
    const caseVariations = Object.values(lowercaseGroups).filter(g => g.length > 1);
    console.log('\nCompanies with Case/Whitespace Variations:', caseVariations.length);
    if (caseVariations.length > 0) {
      console.log('Examples:');
      caseVariations.slice(0, 5).forEach(group => {
        console.log(`  Group (${group.length} records):`);
        group.forEach(c => console.log(`    - "${c.name}"`));
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();

