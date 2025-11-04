#!/usr/bin/env node

/**
 * 🗑️ DELETE FICTIONAL COMPANIES
 * 
 * Removes the 10 fictional companies that were added
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const fictionalCompanyNames = [
  "TechFlow Solutions",
  "Velocity Consulting Group",
  "CloudBridge Technologies",
  "Digital Nexus Partners",
  "Apex Systems Integration",
  "Nexus Tech Solutions",
  "InnovateIT Consulting",
  "Strategic IT Partners",
  "CodeForge Solutions",
  "TechVenture Consulting"
];

async function deleteFictionalCompanies() {
  try {
    console.log('🗑️ DELETING FICTIONAL COMPANIES');
    console.log('================================\n');
    
    await prisma.$connect();
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } },
          { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name}\n`);
    
    // Find and delete fictional companies
    let deletedCount = 0;
    
    for (const companyName of fictionalCompanyNames) {
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId: workspace.id,
          name: { equals: companyName, mode: 'insensitive' }
        }
      });
      
      if (company) {
        await prisma.companies.delete({
          where: { id: company.id }
        });
        console.log(`✅ Deleted: ${companyName}`);
        deletedCount++;
      } else {
        console.log(`⏭️  Not found: ${companyName}`);
      }
    }
    
    console.log(`\n📊 Summary: Deleted ${deletedCount} fictional companies\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteFictionalCompanies();

