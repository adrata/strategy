#!/usr/bin/env node
/**
 * TOP Engineering Plus Data Import Script
 * Imports cleaned data into the Adrata database
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
      fs.createReadStream('processed/companies_import_ready.csv')
        .pipe(csv())
        .on('data', (row) => companies.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    for (const company of companies) {
      try {
        const companyData = {
          workspaceId: WORKSPACE_ID,
          name: company.name || 'Unknown Company',
          email: company.email || null,
          phone: company.phone || null,
          website: company.website || null,
          address: company.address || null,
          city: company.city || null,
          state: company.state || null,
          country: company.country || null,
          postalCode: company.postalCode || null,
          industry: company.industry || 'Engineering',
          description: company.description || null,
          notes: company.notes || null,
          tags: company.tags ? [company.tags] : ['TOP Engineering'],
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
      fs.createReadStream('processed/people_import_ready.csv')
        .pipe(csv())
        .on('data', (row) => people.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    for (const person of people) {
      try {
        const personData = {
          workspaceId: WORKSPACE_ID,
          firstName: person.firstName || 'Unknown',
          lastName: person.lastName || 'Person',
          fullName: person.fullName || `${person.firstName || 'Unknown'} ${person.lastName || 'Person'}`,
          email: person.email || null,
          workEmail: person.workEmail || null,
          personalEmail: person.personalEmail || null,
          phone: person.phone || null,
          mobilePhone: person.mobilePhone || null,
          workPhone: person.workPhone || null,
          jobTitle: person.jobTitle || null,
          department: person.department || null,
          address: person.address || null,
          city: person.city || null,
          state: person.state || null,
          country: person.country || null,
          postalCode: person.postalCode || null,
          linkedinUrl: person.linkedinUrl || null,
          notes: person.notes || null,
          tags: person.tags ? [person.tags] : [],
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
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importData().catch(console.error);