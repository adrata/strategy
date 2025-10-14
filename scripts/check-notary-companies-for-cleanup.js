#!/usr/bin/env node

/**
 * CHECK NOTARY EVERYDAY COMPANIES FOR CLEANUP
 * 
 * Identifies problematic/placeholder companies in the Notary Everyday workspace
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotaryCompanies() {
  try {
    console.log('🔍 Checking Notary Everyday companies for cleanup...\n');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Get all companies in the workspace
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        description: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📊 Total companies: ${companies.length}\n`);
    
    // Identify suspicious patterns
    const suspiciousPatterns = [
      // Companies with random code patterns
      /^Company [A-Z0-9]{8}$/i,
      /^[A-Z0-9]{8}$/,
      // Very short names (likely incomplete)
      /^[A-Z]{1,3}$/,
      // Companies with "test" or "placeholder"
      /test|placeholder|dummy|sample/i
    ];
    
    const problematicCompanies = companies.filter(company => {
      // Check if name matches any suspicious pattern
      const matchesPattern = suspiciousPatterns.some(pattern => pattern.test(company.name));
      
      // Check if it has no meaningful data
      const hasNoData = !company.website && !company.domain && !company.description;
      
      // Check if name is very short (less than 4 chars) and has no data
      const tooShort = company.name.length < 4 && hasNoData;
      
      return matchesPattern || tooShort;
    });
    
    console.log(`⚠️  Problematic companies found: ${problematicCompanies.length}\n`);
    
    if (problematicCompanies.length === 0) {
      console.log('✅ No problematic companies found!');
      return;
    }
    
    // Group by whether they have people
    const withPeople = problematicCompanies.filter(c => c._count.people > 0);
    const withoutPeople = problematicCompanies.filter(c => c._count.people === 0);
    
    console.log(`📋 PROBLEMATIC COMPANIES BREAKDOWN:`);
    console.log(`   - With people: ${withPeople.length}`);
    console.log(`   - Without people: ${withoutPeople.length}\n`);
    
    console.log(`🗑️  COMPANIES TO BE SOFT DELETED:\n`);
    
    problematicCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Website: ${company.website || 'none'}`);
      console.log(`   Domain: ${company.domain || 'none'}`);
      console.log(`   People: ${company._count.people}`);
      console.log('');
    });
    
    // Calculate total people that would be affected
    const totalPeopleAffected = problematicCompanies.reduce((sum, c) => sum + c._count.people, 0);
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Companies to soft delete: ${problematicCompanies.length}`);
    console.log(`   Total people that would be soft deleted: ${totalPeopleAffected}`);
    console.log(`   Companies with people: ${withPeople.length}`);
    console.log(`   Companies without people: ${withoutPeople.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotaryCompanies();

