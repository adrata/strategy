#!/usr/bin/env node
/**
 * Upload Enriched Data Script
 * Safely uploads the enriched TOP Engineering Plus data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function uploadEnrichedData() {
  try {
    console.log('🚀 UPLOADING ENRICHED DATA...');
    
    // First, create the TOP Engineering Plus workspace
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
    
    // Upload companies
    console.log('\n🏢 Uploading companies...');
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
        await prisma.companies.upsert({
          where: { id: company.id },
          update: {
            name: company.name,
            workspaceId: company.workspaceId,
            industry: company.industry || 'Engineering',
            description: company.description,
            notes: company.notes,
            tags: company.tags ? JSON.parse(company.tags) : ['TOP Engineering'],
            // Enhanced context fields
            serviceOfferings: company.serviceOfferings ? JSON.parse(company.serviceOfferings) : [],
            technicalCapabilities: company.technicalCapabilities ? JSON.parse(company.technicalCapabilities) : [],
            clientEngagementModel: company.clientEngagementModel,
            uniqueValuePropositions: company.uniqueValuePropositions ? JSON.parse(company.uniqueValuePropositions) : [],
            marketPositioning: company.marketPositioning,
            targetSegments: company.targetSegments ? JSON.parse(company.targetSegments) : [],
            businessApproach: company.businessApproach,
            industrySpecializations: company.industrySpecializations ? JSON.parse(company.industrySpecializations) : [],
            targetMarkets: company.targetMarkets ? JSON.parse(company.targetMarkets) : [],
            updatedAt: new Date()
          },
          create: {
            id: company.id,
            workspaceId: company.workspaceId,
            name: company.name,
            industry: company.industry || 'Engineering',
            description: company.description,
            notes: company.notes,
            tags: company.tags ? JSON.parse(company.tags) : ['TOP Engineering'],
            // Enhanced context fields
            serviceOfferings: company.serviceOfferings ? JSON.parse(company.serviceOfferings) : [],
            technicalCapabilities: company.technicalCapabilities ? JSON.parse(company.technicalCapabilities) : [],
            clientEngagementModel: company.clientEngagementModel,
            uniqueValuePropositions: company.uniqueValuePropositions ? JSON.parse(company.uniqueValuePropositions) : [],
            marketPositioning: company.marketPositioning,
            targetSegments: company.targetSegments ? JSON.parse(company.targetSegments) : [],
            businessApproach: company.businessApproach,
            industrySpecializations: company.industrySpecializations ? JSON.parse(company.industrySpecializations) : [],
            targetMarkets: company.targetMarkets ? JSON.parse(company.targetMarkets) : [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        companiesUploaded++;
        
        if (companiesUploaded % 50 === 0) {
          console.log(`  Uploaded ${companiesUploaded}/${companies.length} companies`);
        }
      } catch (error) {
        console.error(`  ❌ Error uploading company ${company.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Companies uploaded: ${companiesUploaded}/${companies.length}`);
    
    // Upload people
    console.log('\n👥 Uploading people...');
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
        await prisma.people.upsert({
          where: { id: person.id },
          update: {
            workspaceId: person.workspaceId,
            firstName: person.firstName,
            lastName: person.lastName,
            fullName: person.fullName,
            email: person.email,
            workEmail: person.workEmail,
            phone: person.phone,
            workPhone: person.workPhone,
            jobTitle: person.jobTitle,
            department: person.department,
            linkedinUrl: person.linkedinUrl,
            notes: person.notes,
            tags: person.tags ? JSON.parse(person.tags) : [],
            // Enhanced context fields
            engagementScore: person.engagementScore ? parseFloat(person.engagementScore) : 0,
            funnelStage: person.funnelStage || 'Prospect',
            updatedAt: new Date()
          },
          create: {
            id: person.id,
            workspaceId: person.workspaceId,
            firstName: person.firstName,
            lastName: person.lastName,
            fullName: person.fullName,
            email: person.email,
            workEmail: person.workEmail,
            phone: person.phone,
            workPhone: person.workPhone,
            jobTitle: person.jobTitle,
            department: person.department,
            linkedinUrl: person.linkedinUrl,
            notes: person.notes,
            tags: person.tags ? JSON.parse(person.tags) : [],
            // Enhanced context fields
            engagementScore: person.engagementScore ? parseFloat(person.engagementScore) : 0,
            funnelStage: person.funnelStage || 'Prospect',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        peopleUploaded++;
        
        if (peopleUploaded % 100 === 0) {
          console.log(`  Uploaded ${peopleUploaded}/${people.length} people`);
        }
      } catch (error) {
        console.error(`  ❌ Error uploading person ${person.firstName} ${person.lastName}: ${error.message}`);
      }
    }
    
    console.log(`✅ People uploaded: ${peopleUploaded}/${people.length}`);
    
    // Create Ross user
    console.log('\n👤 Creating Ross user...');
    const hashedPassword = bcrypt.hashSync('RossGoat89!', 10);
    
    const user = await prisma.users.upsert({
      where: { email: 'ross@adrata.com' },
      update: {
        name: 'Ross Sylvester',
        username: 'ross',
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
    
    console.log('\n🎯 DATA UPLOAD COMPLETE!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

uploadEnrichedData();
