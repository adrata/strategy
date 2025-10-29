#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdrataEmails() {
  try {
    // Get Adrata workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { 
        isActive: true,
        OR: [
          { name: 'Adrata' },
          { slug: 'adrata' }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }

    console.log('🎯 Adrata Workspace:', workspace.name, workspace.id);

    // Get people in Adrata workspace
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        customFields: true,
        enrichmentSources: true,
        coresignalData: true,
        enrichedData: true,
        createdAt: true,
        updatedAt: true
      },
      take: 20
    });

    console.log('\n📊 Found', people.length, 'people in Adrata workspace');
    console.log('\n📧 Email Analysis:');
    
    people.forEach((person, index) => {
      console.log('\n' + (index + 1) + '.', person.fullName);
      console.log('   Primary Email:', person.email || 'N/A');
      console.log('   Work Email:', person.workEmail || 'N/A');
      console.log('   Personal Email:', person.personalEmail || 'N/A');
      console.log('   Enrichment Sources:', person.enrichmentSources || 'N/A');
      console.log('   Custom Fields:', person.customFields ? Object.keys(person.customFields).length + ' fields' : 'None');
      
      if (person.customFields && person.customFields.email) {
        console.log('   Custom Email Field:', person.customFields.email);
      }
    });

    // Check for potential email issues
    console.log('\n🔍 Potential Issues:');
    const emailIssues = people.filter(person => {
      const hasCustomEmail = person.customFields && person.customFields.email;
      const hasPrimaryEmail = person.email;
      const hasWorkEmail = person.workEmail;
      const hasPersonalEmail = person.personalEmail;
      
      return hasCustomEmail && (!hasPrimaryEmail || !hasWorkEmail || !hasPersonalEmail);
    });

    if (emailIssues.length > 0) {
      console.log('Found', emailIssues.length, 'people with potential email field issues:');
      emailIssues.forEach(person => {
        console.log('  -', person.fullName, 'has custom email but missing primary/work/personal');
      });
    } else {
      console.log('No obvious email field issues found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdrataEmails();
