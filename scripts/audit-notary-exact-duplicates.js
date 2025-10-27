#!/usr/bin/env node

/**
 * 🔍 AUDIT NOTARY EVERYDAY EXACT DUPLICATES
 * 
 * This script identifies and analyzes exact duplicates in the Notary Everyday workspace:
 * - Companies with identical names (case-insensitive)
 * - People with identical email addresses
 * 
 * Focus: EXACT matches only - no similarity analysis
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const NOTARY_WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// Data quality scoring function
function calculateCompanyScore(company) {
  let score = 0;
  
  // Critical fields (10 points each)
  if (company.email) score += 10;
  if (company.phone) score += 10;
  if (company.website) score += 10;
  if (company.domain) score += 10;
  
  // Important fields (5 points each)
  if (company.address) score += 5;
  if (company.city) score += 5;
  if (company.state) score += 5;
  if (company.country) score += 5;
  if (company.industry) score += 5;
  if (company.sector) score += 5;
  if (company.employeeCount) score += 5;
  if (company.foundedYear) score += 5;
  
  // Enrichment fields (3 points each)
  if (company.dataQualityScore && company.dataQualityScore > 0) score += 3;
  if (company.enrichmentScore && company.enrichmentScore > 0) score += 3;
  if (company.aiIntelligence) score += 3;
  if (company.companyIntelligence) score += 3;
  
  // Array fields (1 point per non-empty array)
  if (company.tags && company.tags.length > 0) score += 1;
  if (company.dataSources && company.dataSources.length > 0) score += 1;
  if (company.technologiesUsed && company.technologiesUsed.length > 0) score += 1;
  
  return score;
}

function calculatePersonScore(person) {
  let score = 0;
  
  // Critical fields (10 points each)
  if (person.email) score += 10;
  if (person.workEmail) score += 10;
  if (person.personalEmail) score += 10;
  if (person.phone) score += 10;
  if (person.mobilePhone) score += 10;
  if (person.workPhone) score += 10;
  if (person.linkedinUrl) score += 10;
  if (person.companyId) score += 10;
  
  // Important fields (5 points each)
  if (person.jobTitle) score += 5;
  if (person.department) score += 5;
  if (person.address) score += 5;
  if (person.city) score += 5;
  if (person.state) score += 5;
  if (person.country) score += 5;
  if (person.bio) score += 5;
  
  // Enrichment fields (3 points each)
  if (person.dataQualityScore && person.dataQualityScore > 0) score += 3;
  if (person.enrichmentScore && person.enrichmentScore > 0) score += 3;
  if (person.aiIntelligence) score += 3;
  if (person.enrichedData) score += 3;
  
  // Array fields (1 point per non-empty array)
  if (person.tags && person.tags.length > 0) score += 1;
  if (person.dataSources && person.dataSources.length > 0) score += 1;
  if (person.technicalSkills && person.technicalSkills.length > 0) score += 1;
  
  return score;
}

async function auditExactDuplicates() {
  console.log('🔍 AUDITING NOTARY EVERYDAY EXACT DUPLICATES');
  console.log('============================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Find exact company name duplicates
    console.log('1️⃣ ANALYZING COMPANY DUPLICATES...');
    console.log('-----------------------------------');
    
    const companyGroups = await prisma.companies.groupBy({
      by: ['name'],
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null 
      },
      _count: true,
      having: { name: { _count: { gt: 1 } } }
    });
    
    console.log(`Found ${companyGroups.length} company name groups with duplicates\n`);
    
    const companyDuplicates = [];
    
    for (const group of companyGroups) {
      const companies = await prisma.companies.findMany({
        where: { 
          workspaceId: NOTARY_WORKSPACE_ID,
          name: group.name,
          deletedAt: null
        },
        include: {
          people: {
            where: { deletedAt: null },
            select: { id: true, fullName: true }
          },
          _count: {
            select: {
              actions: true,
              people: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Calculate scores for each company
      const companiesWithScores = companies.map(company => ({
        ...company,
        dataQualityScore: calculateCompanyScore(company)
      }));
      
      // Sort by score descending, then by updatedAt descending
      companiesWithScores.sort((a, b) => {
        if (b.dataQualityScore !== a.dataQualityScore) {
          return b.dataQualityScore - a.dataQualityScore;
        }
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      
      const primary = companiesWithScores[0];
      const duplicates = companiesWithScores.slice(1);
      
      companyDuplicates.push({
        name: group.name,
        count: group._count,
        primary,
        duplicates,
        totalPeople: companies.reduce((sum, c) => sum + c.people.length, 0),
        totalActions: companies.reduce((sum, c) => sum + c._count.actions, 0)
      });
    }
    
    // 2. Find exact people email duplicates
    console.log('2️⃣ ANALYZING PEOPLE DUPLICATES...');
    console.log('----------------------------------');
    
    const peopleGroups = await prisma.people.groupBy({
      by: ['email'],
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID, 
        deletedAt: null,
        email: { not: null }
      },
      _count: true,
      having: { email: { _count: { gt: 1 } } }
    });
    
    console.log(`Found ${peopleGroups.length} people email groups with duplicates\n`);
    
    const peopleDuplicates = [];
    
    for (const group of peopleGroups) {
      const people = await prisma.people.findMany({
        where: { 
          workspaceId: NOTARY_WORKSPACE_ID,
          email: group.email,
          deletedAt: null
        },
        include: {
          company: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              actions: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Calculate scores for each person
      const peopleWithScores = people.map(person => ({
        ...person,
        dataQualityScore: calculatePersonScore(person)
      }));
      
      // Sort by score descending, then by updatedAt descending
      peopleWithScores.sort((a, b) => {
        if (b.dataQualityScore !== a.dataQualityScore) {
          return b.dataQualityScore - a.dataQualityScore;
        }
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      
      const primary = peopleWithScores[0];
      const duplicates = peopleWithScores.slice(1);
      
      peopleDuplicates.push({
        email: group.email,
        count: group._count,
        primary,
        duplicates,
        totalActions: people.reduce((sum, p) => sum + p._count.actions, 0)
      });
    }
    
    // 3. Handle empty email records
    console.log('3️⃣ ANALYZING EMPTY EMAIL RECORDS...');
    console.log('------------------------------------');
    
    const emptyEmailPeople = await prisma.people.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { email: null },
          { email: '' }
        ]
      },
      include: {
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${emptyEmailPeople.length} people with empty/null emails\n`);
    
    // 4. Generate detailed report
    console.log('4️⃣ GENERATING DETAILED REPORT...');
    console.log('----------------------------------');
    
    const report = {
      timestamp: new Date().toISOString(),
      workspace: {
        id: NOTARY_WORKSPACE_ID,
        name: 'Notary Everyday'
      },
      summary: {
        totalCompanies: await prisma.companies.count({
          where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null }
        }),
        totalPeople: await prisma.people.count({
          where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null }
        }),
        companyDuplicates: companyDuplicates.length,
        peopleDuplicates: peopleDuplicates.length,
        emptyEmailPeople: emptyEmailPeople.length
      },
      companyDuplicates,
      peopleDuplicates,
      emptyEmailPeople: emptyEmailPeople.map(p => ({
        id: p.id,
        fullName: p.fullName,
        company: p.company?.name || 'No company',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
    };
    
    // Save report
    const reportFile = `scripts/backups/notary-exact-duplicates-audit-${new Date().toISOString().split('T')[0]}.json`;
    const reportDir = path.dirname(reportFile);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved: ${reportFile}\n`);
    
    // 5. Display summary
    console.log('📊 AUDIT SUMMARY');
    console.log('================');
    console.log(`Total Companies: ${report.summary.totalCompanies}`);
    console.log(`Total People: ${report.summary.totalPeople}`);
    console.log(`Company Duplicates: ${report.summary.companyDuplicates}`);
    console.log(`People Duplicates: ${report.summary.peopleDuplicates}`);
    console.log(`Empty Email People: ${report.summary.emptyEmailPeople}\n`);
    
    // Show top company duplicates
    console.log('🏢 TOP COMPANY DUPLICATES:');
    console.log('---------------------------');
    companyDuplicates.slice(0, 10).forEach((dup, idx) => {
      console.log(`${idx + 1}. "${dup.name}" (${dup.count} records)`);
      console.log(`   Primary: Score ${dup.primary.dataQualityScore}, ${dup.primary.people.length} people, ${dup.primary._count.actions} actions`);
      console.log(`   Duplicates: ${dup.duplicates.length} records to merge`);
      console.log('');
    });
    
    // Show people duplicates
    if (peopleDuplicates.length > 0) {
      console.log('👥 PEOPLE DUPLICATES:');
      console.log('---------------------');
      peopleDuplicates.forEach((dup, idx) => {
        console.log(`${idx + 1}. "${dup.email}" (${dup.count} records)`);
        console.log(`   Primary: ${dup.primary.fullName}, Score ${dup.primary.dataQualityScore}`);
        console.log(`   Duplicates: ${dup.duplicates.length} records to merge`);
        console.log('');
      });
    }
    
    // Show empty email summary
    if (emptyEmailPeople.length > 0) {
      console.log('📧 EMPTY EMAIL PEOPLE:');
      console.log('----------------------');
      console.log(`${emptyEmailPeople.length} people with empty/null emails`);
      console.log('These will be handled separately (likely legitimate records)\n');
    }
    
    console.log('✅ Audit complete! Review the report file for detailed analysis.');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditExactDuplicates();
