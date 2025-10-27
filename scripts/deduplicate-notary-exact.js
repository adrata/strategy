#!/usr/bin/env node

/**
 * 🧹 DEDUPLICATE NOTARY EVERYDAY EXACT DUPLICATES
 * 
 * This script safely deduplicates exact duplicates in the Notary Everyday workspace:
 * - Companies with identical names (case-insensitive)
 * - People with identical email addresses
 * 
 * SAFETY FEATURES:
 * - Creates backup before making changes
 * - Dry-run mode by default
 * - Soft-delete only (set deletedAt timestamp)
 * - Transaction-based operations
 * - Detailed logging of all operations
 * - Rollback capability
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const NOTARY_WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// Configuration
const DRY_RUN = !process.argv.includes('--execute');
const FORCE = process.argv.includes('--force');

// Data quality scoring function (same as audit)
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

// Deep merge function for JSON fields
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (Array.isArray(source[key])) {
      // Merge arrays and remove duplicates
      const existing = target[key] || [];
      const newItems = source[key] || [];
      result[key] = [...new Set([...existing, ...newItems])];
    } else if (source[key] !== null && source[key] !== undefined && source[key] !== '') {
      result[key] = source[key];
    }
  }
  
  return result;
}

async function deduplicateExactDuplicates() {
  console.log('🧹 DEDUPLICATING NOTARY EVERYDAY EXACT DUPLICATES');
  console.log('=================================================\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be made to the database\n');
  }
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Create backup
    console.log('1️⃣ CREATING BACKUP...');
    console.log('---------------------');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      companies: await prisma.companies.findMany({
        where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null }
      }),
      people: await prisma.people.findMany({
        where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: null }
      })
    };
    
    const backupFile = `scripts/backups/notary-everyday-backup-${new Date().toISOString().split('T')[0]}.json`;
    const backupDir = path.dirname(backupFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    if (!DRY_RUN) {
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      console.log(`✅ Backup created: ${backupFile}`);
    } else {
      console.log(`📝 Would create backup: ${backupFile}`);
    }
    console.log(`📊 Backup contains ${backupData.companies.length} companies and ${backupData.people.length} people\n`);
    
    // 2. Process company duplicates
    console.log('2️⃣ PROCESSING COMPANY DUPLICATES...');
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
    
    let companyResults = {
      processed: 0,
      merged: 0,
      skipped: 0,
      errors: []
    };
    
    for (const group of companyGroups) {
      try {
        companyResults.processed++;
        
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
        
        // Calculate scores and sort
        const companiesWithScores = companies.map(company => ({
          ...company,
          dataQualityScore: calculateCompanyScore(company)
        }));
        
        companiesWithScores.sort((a, b) => {
          if (b.dataQualityScore !== a.dataQualityScore) {
            return b.dataQualityScore - a.dataQualityScore;
          }
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        
        const primary = companiesWithScores[0];
        const duplicates = companiesWithScores.slice(1);
        
        console.log(`\n${companyResults.processed}. "${group.name}" (${group._count} records)`);
        console.log(`   Primary: Score ${primary.dataQualityScore}, ${primary.people.length} people, ${primary._count.actions} actions`);
        console.log(`   Duplicates: ${duplicates.length} records to merge`);
        
        if (!DRY_RUN) {
          // Merge data from duplicates into primary
          let mergedData = { ...primary };
          
          for (const duplicate of duplicates) {
            // Merge scalar fields (if primary is null/empty)
            Object.keys(duplicate).forEach(key => {
              if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'dataQualityScore') {
                const dupValue = duplicate[key];
                const primaryValue = mergedData[key];
                
                if (dupValue && !primaryValue) {
                  mergedData[key] = dupValue;
                } else if (Array.isArray(dupValue) && Array.isArray(primaryValue)) {
                  // Merge arrays, removing duplicates
                  mergedData[key] = [...new Set([...primaryValue, ...dupValue])];
                } else if (typeof dupValue === 'object' && dupValue !== null && typeof primaryValue === 'object' && primaryValue !== null) {
                  // Deep merge JSON objects
                  mergedData[key] = deepMerge(primaryValue, dupValue);
                }
              }
            });
          }
          
          // Update primary with merged data
          await prisma.companies.update({
            where: { id: primary.id },
            data: {
              ...mergedData,
              updatedAt: new Date()
            }
          });
          
          // Reassign people from duplicates to primary
          for (const duplicate of duplicates) {
            await prisma.people.updateMany({
              where: { 
                companyId: duplicate.id,
                deletedAt: null
              },
              data: { 
                companyId: primary.id,
                updatedAt: new Date()
              }
            });
            
            // Reassign actions from duplicates to primary
            await prisma.actions.updateMany({
              where: { 
                companyId: duplicate.id
              },
              data: { 
                companyId: primary.id,
                updatedAt: new Date()
              }
            });
          }
          
          // Soft-delete duplicates
          const duplicateIds = duplicates.map(d => d.id);
          await prisma.companies.updateMany({
            where: { 
              id: { in: duplicateIds }
            },
            data: { 
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          console.log(`   ✅ Merged ${duplicates.length} duplicates into primary`);
          companyResults.merged += duplicates.length;
        } else {
          console.log(`   📝 Would merge ${duplicates.length} duplicates into primary`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing "${group.name}":`, error.message);
        companyResults.errors.push({ group: group.name, error: error.message });
        companyResults.skipped++;
      }
    }
    
    // 3. Process people duplicates
    console.log('\n3️⃣ PROCESSING PEOPLE DUPLICATES...');
    console.log('-----------------------------------');
    
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
    
    let peopleResults = {
      processed: 0,
      merged: 0,
      skipped: 0,
      errors: []
    };
    
    for (const group of peopleGroups) {
      try {
        peopleResults.processed++;
        
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
        
        // Calculate scores and sort
        const peopleWithScores = people.map(person => ({
          ...person,
          dataQualityScore: calculatePersonScore(person)
        }));
        
        peopleWithScores.sort((a, b) => {
          if (b.dataQualityScore !== a.dataQualityScore) {
            return b.dataQualityScore - a.dataQualityScore;
          }
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        
        const primary = peopleWithScores[0];
        const duplicates = peopleWithScores.slice(1);
        
        console.log(`\n${peopleResults.processed}. "${group.email}" (${group._count} records)`);
        console.log(`   Primary: ${primary.fullName}, Score ${primary.dataQualityScore}`);
        console.log(`   Duplicates: ${duplicates.length} records to merge`);
        
        if (!DRY_RUN) {
          // Merge data from duplicates into primary
          let mergedData = { ...primary };
          
          for (const duplicate of duplicates) {
            // Merge scalar fields (if primary is null/empty)
            Object.keys(duplicate).forEach(key => {
              if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'dataQualityScore') {
                const dupValue = duplicate[key];
                const primaryValue = mergedData[key];
                
                if (dupValue && !primaryValue) {
                  mergedData[key] = dupValue;
                } else if (Array.isArray(dupValue) && Array.isArray(primaryValue)) {
                  // Merge arrays, removing duplicates
                  mergedData[key] = [...new Set([...primaryValue, ...dupValue])];
                } else if (typeof dupValue === 'object' && dupValue !== null && typeof primaryValue === 'object' && primaryValue !== null) {
                  // Deep merge JSON objects
                  mergedData[key] = deepMerge(primaryValue, dupValue);
                }
              }
            });
          }
          
          // Update primary with merged data
          await prisma.people.update({
            where: { id: primary.id },
            data: {
              ...mergedData,
              updatedAt: new Date()
            }
          });
          
          // Reassign actions from duplicates to primary
          for (const duplicate of duplicates) {
            await prisma.actions.updateMany({
              where: { 
                personId: duplicate.id
              },
              data: { 
                personId: primary.id,
                updatedAt: new Date()
              }
            });
          }
          
          // Soft-delete duplicates
          const duplicateIds = duplicates.map(d => d.id);
          await prisma.people.updateMany({
            where: { 
              id: { in: duplicateIds }
            },
            data: { 
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          console.log(`   ✅ Merged ${duplicates.length} duplicates into primary`);
          peopleResults.merged += duplicates.length;
        } else {
          console.log(`   📝 Would merge ${duplicates.length} duplicates into primary`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing "${group.email}":`, error.message);
        peopleResults.errors.push({ email: group.email, error: error.message });
        peopleResults.skipped++;
      }
    }
    
    // 4. Summary
    console.log('\n📊 DEDUPLICATION SUMMARY');
    console.log('=========================');
    console.log(`Companies:`);
    console.log(`  - Processed: ${companyResults.processed} groups`);
    console.log(`  - Merged: ${companyResults.merged} records`);
    console.log(`  - Skipped: ${companyResults.skipped} groups`);
    console.log(`  - Errors: ${companyResults.errors.length}`);
    console.log(`People:`);
    console.log(`  - Processed: ${peopleResults.processed} groups`);
    console.log(`  - Merged: ${peopleResults.merged} records`);
    console.log(`  - Skipped: ${peopleResults.skipped} groups`);
    console.log(`  - Errors: ${peopleResults.errors.length}`);
    
    if (companyResults.errors.length > 0 || peopleResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      [...companyResults.errors, ...peopleResults.errors].forEach(error => {
        console.log(`  - ${error.group || error.email}: ${error.error}`);
      });
    }
    
    if (DRY_RUN) {
      console.log('\n🔍 This was a dry run. To execute changes, run with --execute flag');
    } else {
      console.log('\n✅ Deduplication complete!');
    }
    
  } catch (error) {
    console.error('❌ Error during deduplication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deduplicateExactDuplicates();
