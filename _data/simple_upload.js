#!/usr/bin/env node
/**
 * Simple Data Upload Script
 * Safely uploads the enriched TOP Engineering Plus data with proper error handling
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

function safeJsonParse(value, defaultValue = []) {
  if (!value || value === '' || value === 'null') {
    return defaultValue;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(`JSON parse error for value: ${value}, using default`);
    return defaultValue;
  }
}

function safeString(value, defaultValue = '') {
  if (!value || value === 'null' || value === 'undefined') {
    return defaultValue;
  }
  return String(value);
}

function safeNumber(value, defaultValue = 0) {
  if (!value || value === 'null' || value === 'undefined') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

async function simpleUpload() {
  try {
    console.log('🚀 SIMPLE DATA UPLOAD...');
    
    // Create the TOP Engineering Plus workspace
    console.log('\n🏢 Creating TOP Engineering Plus workspace...');
    const workspace = await prisma.workspaces.upsert({
      where: { id: '01K5D01YCQJ9TJ7CT4DZDE79T1' },
      update: {
        name: 'TOP Engineering Plus',
        slug: 'top-engineers-plus',
        description: 'TOP Engineering Plus - Communications Engineering firm specializing in critical infrastructure and broadband deployment.',
        companyContext: {
          companyName: 'TOP Engineers Plus PLLC',
          industry: 'Communications Engineering',
          specialization: 'Critical infrastructure and broadband deployment',
          valueProposition: 'Simplify, Optimize, Excel: The TOP Engineers Plus Advantage'
        },
        businessModel: 'Engineering Consulting',
        serviceFocus: ['Communications Engineering', 'Critical Infrastructure', 'Broadband Deployment', 'Strategic Consulting'],
        stakeholderApproach: 'Client-Centric',
        projectDeliveryStyle: 'Strategic Clarity',
        updatedAt: new Date()
      },
      create: {
        id: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        name: 'TOP Engineering Plus',
        slug: 'top-engineers-plus',
        description: 'TOP Engineering Plus - Communications Engineering firm specializing in critical infrastructure and broadband deployment.',
        companyContext: {
          companyName: 'TOP Engineers Plus PLLC',
          industry: 'Communications Engineering',
          specialization: 'Critical infrastructure and broadband deployment',
          valueProposition: 'Simplify, Optimize, Excel: The TOP Engineers Plus Advantage'
        },
        businessModel: 'Engineering Consulting',
        serviceFocus: ['Communications Engineering', 'Critical Infrastructure', 'Broadband Deployment', 'Strategic Consulting'],
        stakeholderApproach: 'Client-Centric',
        projectDeliveryStyle: 'Strategic Clarity',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Workspace created: ${workspace.name}`);
    
    // Create Ross user first
    console.log('\n👤 Creating Ross user...');
    const hashedPassword = bcrypt.hashSync('RossGoat89!', 10);
    
    const user = await prisma.users.upsert({
      where: { username: 'ross' },
      update: {
        email: 'ross@adrata.com',
        name: 'Ross Sylvester',
        activeWorkspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        password: hashedPassword,
        updatedAt: new Date()
      },
      create: {
        email: 'ross@adrata.com',
        name: 'Ross Sylvester',
        username: 'ross',
        activeWorkspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ User created: ${user.name} (${user.email})`);
    
    // Upload companies with basic data only
    console.log('\n🏢 Uploading companies (basic data only)...');
    const companies = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('backup_2025-09-18/companies_export.csv')
        .pipe(csv())
        .on('data', (row) => companies.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    let companiesUploaded = 0;
    for (const company of companies) {
      try {
        // Skip if essential fields are missing
        if (!company.id || !company.name || !company.workspaceId) {
          console.warn(`  ⚠️ Skipping company with missing essential fields: ${company.name || 'Unknown'}`);
          continue;
        }
        
        await prisma.companies.upsert({
          where: { id: company.id },
          update: {
            name: safeString(company.name),
            workspaceId: safeString(company.workspaceId),
            industry: safeString(company.industry, 'Engineering'),
            description: safeString(company.description),
            notes: safeString(company.notes),
            tags: safeJsonParse(company.tags, ['TOP Engineering']),
            updatedAt: new Date()
          },
          create: {
            id: company.id,
            workspaceId: safeString(company.workspaceId),
            name: safeString(company.name),
            industry: safeString(company.industry, 'Engineering'),
            description: safeString(company.description),
            notes: safeString(company.notes),
            tags: safeJsonParse(company.tags, ['TOP Engineering']),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        companiesUploaded++;
        
        if (companiesUploaded % 50 === 0) {
          console.log(`  Uploaded ${companiesUploaded}/${companies.length} companies`);
        }
      } catch (error) {
        console.error(`  ❌ Error uploading company ${company.name || 'Unknown'}: ${error.message}`);
      }
    }
    
    console.log(`✅ Companies uploaded: ${companiesUploaded}/${companies.length}`);
    
    // Upload people with basic data only
    console.log('\n👥 Uploading people (basic data only)...');
    const people = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('backup_2025-09-18/people_export.csv')
        .pipe(csv())
        .on('data', (row) => people.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    let peopleUploaded = 0;
    for (const person of people) {
      try {
        // Skip if essential fields are missing
        if (!person.id || !person.firstName || !person.lastName || !person.workspaceId) {
          console.warn(`  ⚠️ Skipping person with missing essential fields: ${person.firstName || 'Unknown'} ${person.lastName || 'Unknown'}`);
          continue;
        }
        
        await prisma.people.upsert({
          where: { id: person.id },
          update: {
            workspaceId: safeString(person.workspaceId),
            firstName: safeString(person.firstName),
            lastName: safeString(person.lastName),
            fullName: safeString(person.fullName, `${person.firstName} ${person.lastName}`),
            email: safeString(person.email),
            workEmail: safeString(person.workEmail),
            phone: safeString(person.phone),
            workPhone: safeString(person.workPhone),
            jobTitle: safeString(person.jobTitle),
            department: safeString(person.department),
            linkedinUrl: safeString(person.linkedinUrl),
            notes: safeString(person.notes),
            tags: safeJsonParse(person.tags, []),
            engagementScore: safeNumber(person.engagementScore, 0),
            funnelStage: safeString(person.funnelStage, 'Prospect'),
            updatedAt: new Date()
          },
          create: {
            id: person.id,
            workspaceId: safeString(person.workspaceId),
            firstName: safeString(person.firstName),
            lastName: safeString(person.lastName),
            fullName: safeString(person.fullName, `${person.firstName} ${person.lastName}`),
            email: safeString(person.email),
            workEmail: safeString(person.workEmail),
            phone: safeString(person.phone),
            workPhone: safeString(person.workPhone),
            jobTitle: safeString(person.jobTitle),
            department: safeString(person.department),
            linkedinUrl: safeString(person.linkedinUrl),
            notes: safeString(person.notes),
            tags: safeJsonParse(person.tags, []),
            engagementScore: safeNumber(person.engagementScore, 0),
            funnelStage: safeString(person.funnelStage, 'Prospect'),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        peopleUploaded++;
        
        if (peopleUploaded % 100 === 0) {
          console.log(`  Uploaded ${peopleUploaded}/${people.length} people`);
        }
      } catch (error) {
        console.error(`  ❌ Error uploading person ${person.firstName || 'Unknown'} ${person.lastName || 'Unknown'}: ${error.message}`);
      }
    }
    
    console.log(`✅ People uploaded: ${peopleUploaded}/${people.length}`);
    
    console.log('\n🎯 SIMPLE UPLOAD COMPLETE!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleUpload();
