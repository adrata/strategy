#!/usr/bin/env node
/**
 * TOP Engineering Plus Data Import Script - Updated
 * Imports cleaned data into the Adrata database using the final files
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function importData() {
  console.log('🚀 Starting TOP Engineering Plus data import...');
  console.log(`📁 Workspace ID: ${WORKSPACE_ID}`);
  
  try {
    // Check if workspace exists
    const workspace = await prisma.workspaces.findUnique({
      where: { id: WORKSPACE_ID }
    });
    
    if (!workspace) {
      console.error(`❌ Workspace ${WORKSPACE_ID} not found!`);
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name}`);
    
    let companiesImported = 0;
    let peopleImported = 0;
    let errors = [];
    
    // Import companies first
    console.log('\n🏢 Importing companies...');
    
    const companies = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('companies_final_with_workspace.csv')
        .pipe(csv())
        .on('data', (row) => companies.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Found ${companies.length} companies to import`);
    
    for (const company of companies) {
      try {
        // Skip empty company names
        if (!company.name || company.name.trim() === '') {
          console.log(`  ⚠️  Skipping company with empty name`);
          continue;
        }
        
        const companyData = {
          workspaceId: WORKSPACE_ID,
          name: company.name.trim(),
          email: company.email && company.email.trim() !== '' ? company.email.trim() : null,
          phone: company.phone && company.phone.trim() !== '' ? company.phone.trim() : null,
          website: company.website && company.website.trim() !== '' ? company.website.trim() : null,
          address: company.address && company.address.trim() !== '' ? company.address.trim() : null,
          city: company.city && company.city.trim() !== '' ? company.city.trim() : null,
          state: company.state && company.state.trim() !== '' ? company.state.trim() : null,
          country: company.country && company.country.trim() !== '' ? company.country.trim() : null,
          postalCode: company.postalCode && company.postalCode.trim() !== '' ? company.postalCode.trim() : null,
          industry: company.industry || 'Engineering',
          description: company.description && company.description.trim() !== '' ? company.description.trim() : null,
          notes: company.notes && company.notes.trim() !== '' ? company.notes.trim() : null,
          tags: company.tags ? company.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : ['TOP Engineering'],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await prisma.companies.create({
          data: companyData
        });
        
        companiesImported++;
        
        if (companiesImported % 50 === 0) {
          console.log(`  Imported ${companiesImported}/${companies.length} companies`);
        }
        
      } catch (error) {
        errors.push(`Company ${company.name}: ${error.message}`);
        console.error(`  ❌ Error importing company ${company.name}: ${error.message}`);
      }
    }
    
    // Import people
    console.log('\n👥 Importing people...');
    
    const people = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('people_final_with_workspace.csv')
        .pipe(csv())
        .on('data', (row) => people.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Found ${people.length} people to import`);
    
    for (const person of people) {
      try {
        const personData = {
          workspaceId: WORKSPACE_ID,
          firstName: person.firstName || 'Unknown',
          lastName: person.lastName || 'Person',
          fullName: person.fullName || `${person.firstName || 'Unknown'} ${person.lastName || 'Person'}`,
          email: person.email && person.email.trim() !== '' ? person.email.trim() : null,
          workEmail: person.workEmail && person.workEmail.trim() !== '' ? person.workEmail.trim() : null,
          personalEmail: person.personalEmail && person.personalEmail.trim() !== '' ? person.personalEmail.trim() : null,
          phone: person.phone && person.phone.trim() !== '' ? person.phone.trim() : null,
          mobilePhone: person.mobilePhone && person.mobilePhone.trim() !== '' ? person.mobilePhone.trim() : null,
          workPhone: person.workPhone && person.workPhone.trim() !== '' ? person.workPhone.trim() : null,
          jobTitle: person.jobTitle && person.jobTitle.trim() !== '' ? person.jobTitle.trim() : null,
          department: person.department && person.department.trim() !== '' ? person.department.trim() : null,
          address: person.address && person.address.trim() !== '' ? person.address.trim() : null,
          city: person.city && person.city.trim() !== '' ? person.city.trim() : null,
          state: person.state && person.state.trim() !== '' ? person.state.trim() : null,
          country: person.country && person.country.trim() !== '' && person.country.trim() !== 'nan' ? person.country.trim() : null,
          postalCode: person.postalCode && person.postalCode.trim() !== '' ? person.postalCode.trim() : null,
          linkedinUrl: person.linkedinUrl && person.linkedinUrl.trim() !== '' ? person.linkedinUrl.trim() : null,
          notes: person.notes && person.notes.trim() !== '' ? person.notes.trim() : null,
          tags: person.tags ? person.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await prisma.people.create({
          data: personData
        });
        
        peopleImported++;
        
        if (peopleImported % 100 === 0) {
          console.log(`  Imported ${peopleImported}/${people.length} people`);
        }
        
      } catch (error) {
        errors.push(`Person ${person.firstName} ${person.lastName}: ${error.message}`);
        console.error(`  ❌ Error importing person ${person.firstName} ${person.lastName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Import completed!');
    console.log(`  Companies imported: ${companiesImported}`);
    console.log(`  People imported: ${peopleImported}`);
    console.log(`  Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Import errors:');
      errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }
    
    // Verify the import
    console.log('\n🔍 Verifying import...');
    const finalPeopleCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID }
    });
    const finalCompaniesCount = await prisma.companies.count({
      where: { workspaceId: WORKSPACE_ID }
    });
    
    console.log(`  Final people count: ${finalPeopleCount}`);
    console.log(`  Final companies count: ${finalCompaniesCount}`);
    
    // Show funnel stage distribution
    const funnelStages = await prisma.people.groupBy({
      by: ['tags'],
      where: { workspaceId: WORKSPACE_ID },
      _count: true
    });
    
    console.log('\n📊 Funnel stage distribution:');
    const stageCounts = { Prospect: 0, Lead: 0, Opportunity: 0 };
    
    for (const person of people) {
      if (person.funnel_stage) {
        stageCounts[person.funnel_stage] = (stageCounts[person.funnel_stage] || 0) + 1;
      }
    }
    
    Object.entries(stageCounts).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importData().catch(console.error);
