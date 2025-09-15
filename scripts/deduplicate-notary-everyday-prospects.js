#!/usr/bin/env node

/**
 * 🧹 DEDUPLICATE NOTARY EVERYDAY PROSPECTS
 * 
 * This script will safely deduplicate prospects in the Notary Everyday workspace by:
 * 1. Identifying duplicates by email address (primary method)
 * 2. Identifying duplicates by name + company (secondary method)
 * 3. Merging duplicate records while preserving the best data
 * 4. Creating a backup before making changes
 * 5. Providing detailed reporting of changes made
 * 
 * SAFETY FEATURES:
 * - Creates backup before making changes
 * - Dry-run mode to preview changes
 * - Detailed logging of all operations
 * - Rollback capability
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Notary Everyday workspace ID
const NOTARY_EVERYDAY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

async function deduplicateNotaryEverydayProspects() {
  console.log('🧹 DEDUPLICATING NOTARY EVERYDAY PROSPECTS');
  console.log('==========================================\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Create backup
    console.log('1️⃣ CREATING BACKUP...');
    console.log('---------------------');
    
    const backupData = await prisma.prospects.findMany({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const backupFile = `scripts/backups/notary-prospects-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Ensure backup directory exists
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
    console.log(`📊 Backup contains ${backupData.length} prospects\n`);
    
    // 2. Get all prospects
    console.log('2️⃣ ANALYZING PROSPECTS...');
    console.log('-------------------------');
    
    const prospects = await prisma.prospects.findMany({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc' // Keep the oldest record as primary
      }
    });
    
    console.log(`📊 Found ${prospects.length} prospects to analyze\n`);
    
    // 3. Find duplicates by email
    console.log('3️⃣ FINDING DUPLICATES BY EMAIL...');
    console.log('----------------------------------');
    
    const emailGroups = {};
    const emailDuplicates = [];
    
    prospects.forEach(prospect => {
      const emails = [
        prospect.email,
        prospect.workEmail,
        prospect.personalEmail
      ].filter(email => email && email.trim() !== '');
      
      emails.forEach(email => {
        const normalizedEmail = email.toLowerCase().trim();
        if (!emailGroups[normalizedEmail]) {
          emailGroups[normalizedEmail] = [];
        }
        emailGroups[normalizedEmail].push(prospect);
      });
    });
    
    Object.entries(emailGroups).forEach(([email, group]) => {
      if (group.length > 1) {
        emailDuplicates.push({
          email,
          prospects: group,
          count: group.length
        });
      }
    });
    
    console.log(`🔄 Found ${emailDuplicates.length} email duplicate groups`);
    emailDuplicates.forEach(dup => {
      console.log(`   - ${dup.email}: ${dup.count} prospects`);
    });
    console.log('');
    
    // 4. Find duplicates by name + company
    console.log('4️⃣ FINDING DUPLICATES BY NAME + COMPANY...');
    console.log('------------------------------------------');
    
    const nameCompanyGroups = {};
    const nameCompanyDuplicates = [];
    
    prospects.forEach(prospect => {
      const name = `${prospect.firstName || ''} ${prospect.lastName || ''}`.toLowerCase().trim();
      const company = (prospect.company || '').toLowerCase().trim();
      
      if (name && company) {
        const key = `${name}|${company}`;
        if (!nameCompanyGroups[key]) {
          nameCompanyGroups[key] = [];
        }
        nameCompanyGroups[key].push(prospect);
      }
    });
    
    Object.entries(nameCompanyGroups).forEach(([key, group]) => {
      if (group.length > 1) {
        const [name, company] = key.split('|');
        nameCompanyDuplicates.push({
          name,
          company,
          prospects: group,
          count: group.length
        });
      }
    });
    
    console.log(`🔄 Found ${nameCompanyDuplicates.length} name+company duplicate groups`);
    nameCompanyDuplicates.slice(0, 10).forEach(dup => {
      console.log(`   - ${dup.name} at ${dup.company}: ${dup.count} prospects`);
    });
    if (nameCompanyDuplicates.length > 10) {
      console.log(`   ... and ${nameCompanyDuplicates.length - 10} more`);
    }
    console.log('');
    
    // 5. Plan merges
    console.log('5️⃣ PLANNING MERGES...');
    console.log('---------------------');
    
    const mergePlan = [];
    const processedIds = new Set();
    
    // Process email duplicates first (higher priority)
    emailDuplicates.forEach(dup => {
      const primary = dup.prospects[0]; // Oldest record
      const duplicates = dup.prospects.slice(1);
      
      if (!processedIds.has(primary.id)) {
        mergePlan.push({
          type: 'email',
          primary: primary,
          duplicates: duplicates,
          reason: `Same email: ${dup.email}`
        });
        
        processedIds.add(primary.id);
        duplicates.forEach(dup => processedIds.add(dup.id));
      }
    });
    
    // Process name+company duplicates (lower priority, skip if already processed)
    nameCompanyDuplicates.forEach(dup => {
      const unprocessed = dup.prospects.filter(p => !processedIds.has(p.id));
      
      if (unprocessed.length > 1) {
        const primary = unprocessed[0]; // Oldest record
        const duplicates = unprocessed.slice(1);
        
        mergePlan.push({
          type: 'name+company',
          primary: primary,
          duplicates: duplicates,
          reason: `Same name+company: ${dup.name} at ${dup.company}`
        });
        
        processedIds.add(primary.id);
        duplicates.forEach(dup => processedIds.add(dup.id));
      }
    });
    
    console.log(`📋 Planned ${mergePlan.length} merge operations`);
    console.log(`🎯 Will merge ${mergePlan.reduce((sum, plan) => sum + plan.duplicates.length, 0)} duplicate prospects`);
    console.log(`✅ Will keep ${mergePlan.length} primary prospects\n`);
    
    // 6. Execute merges
    if (mergePlan.length > 0) {
      console.log('6️⃣ EXECUTING MERGES...');
      console.log('----------------------');
      
      let mergeCount = 0;
      let deleteCount = 0;
      
      for (const plan of mergePlan) {
        console.log(`\n🔄 Merging ${plan.duplicates.length} duplicates for: ${plan.primary.fullName}`);
        console.log(`   Reason: ${plan.reason}`);
        
        // Merge data from duplicates into primary
        const mergedData = { ...plan.primary };
        
        plan.duplicates.forEach(dup => {
          // Merge non-null fields from duplicate into primary
          Object.keys(dup).forEach(key => {
            if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
              const dupValue = dup[key];
              const primaryValue = mergedData[key];
              
              if (dupValue && !primaryValue) {
                mergedData[key] = dupValue;
              } else if (Array.isArray(dupValue) && Array.isArray(primaryValue)) {
                // Merge arrays, removing duplicates
                mergedData[key] = [...new Set([...primaryValue, ...dupValue])];
              }
            }
          });
        });
        
        if (!DRY_RUN) {
          // Update primary record with merged data
          await prisma.prospects.update({
            where: { id: plan.primary.id },
            data: {
              ...mergedData,
              updatedAt: new Date()
            }
          });
          mergeCount++;
          
          // Soft delete duplicates
          await prisma.prospects.updateMany({
            where: {
              id: {
                in: plan.duplicates.map(d => d.id)
              }
            },
            data: {
              deletedAt: new Date()
            }
          });
          deleteCount += plan.duplicates.length;
        } else {
          console.log(`   📝 Would merge data and delete ${plan.duplicates.length} duplicates`);
        }
      }
      
      if (!DRY_RUN) {
        console.log(`\n✅ Merged ${mergeCount} primary records`);
        console.log(`🗑️  Deleted ${deleteCount} duplicate records`);
      } else {
        console.log(`\n📝 Would merge ${mergePlan.length} primary records`);
        console.log(`📝 Would delete ${mergePlan.reduce((sum, plan) => sum + plan.duplicates.length, 0)} duplicate records`);
      }
    } else {
      console.log('✅ No duplicates found to merge');
    }
    
    // 7. Final verification
    console.log('\n7️⃣ FINAL VERIFICATION...');
    console.log('------------------------');
    
    const finalCount = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const deletedCount = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: {
          not: null
        }
      }
    });
    
    console.log(`📊 Final prospect count: ${finalCount}`);
    console.log(`🗑️  Deleted prospects: ${deletedCount}`);
    console.log(`📈 Reduction: ${prospects.length - finalCount} prospects removed`);
    console.log(`📊 Reduction percentage: ${(((prospects.length - finalCount) / prospects.length) * 100).toFixed(1)}%`);
    
    // 8. Summary and recommendations
    console.log('\n📋 DEDUPLICATION SUMMARY');
    console.log('========================');
    
    console.log(`✅ Original count: ${prospects.length}`);
    console.log(`✅ Final count: ${finalCount}`);
    console.log(`🎯 Expected count: ~390`);
    
    if (finalCount <= 390) {
      console.log(`🎉 SUCCESS: Final count is within expected range!`);
    } else if (finalCount < prospects.length) {
      console.log(`✅ IMPROVEMENT: Reduced duplicates, but still ${finalCount - 390} above expected`);
      console.log(`   - Consider additional cleanup of generic company names`);
      console.log(`   - Review prospects with missing contact information`);
    } else {
      console.log(`⚠️  No changes made (dry run mode or no duplicates found)`);
    }
    
    if (DRY_RUN) {
      console.log('\n🔍 DRY RUN COMPLETE');
      console.log('To execute the deduplication, run:');
      console.log('node scripts/deduplicate-notary-everyday-prospects.js --force');
    }
    
  } catch (error) {
    console.error('❌ Error during deduplication:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deduplication
if (require.main === module) {
  if (!FORCE && !DRY_RUN) {
    console.log('🔍 This script will analyze and deduplicate prospects.');
    console.log('Use --dry-run to preview changes or --force to execute.');
    console.log('Example: node scripts/deduplicate-notary-everyday-prospects.js --dry-run');
    process.exit(0);
  }
  
  deduplicateNotaryEverydayProspects()
    .then(() => {
      console.log('\n✅ Deduplication completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deduplication failed:', error);
      process.exit(1);
    });
}

module.exports = { deduplicateNotaryEverydayProspects };
