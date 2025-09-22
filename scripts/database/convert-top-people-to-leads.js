#!/usr/bin/env node

/**
 * 🔄 CONVERT TOP WORKSPACE PEOPLE TO LEADS
 * 
 * This script converts all people records in the TOP Engineering Plus workspace
 * that are not already leads or prospects into leads.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus
const BACKUP_DIR = path.join(__dirname, '../../_data/migration-backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = `top-people-to-leads-backup-${TIMESTAMP}.json`;
const BATCH_SIZE = 50; // Process in smaller batches

/**
 * 📊 Get current data counts for TOP workspace
 */
async function getCurrentCounts() {
  const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
    prisma.people.count({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    }),
    prisma.leads.count({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    }),
    prisma.prospects.count({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    })
  ]);
  
  console.log('📊 TOP Workspace Current Counts:');
  console.log(`   People: ${peopleCount}`);
  console.log(`   Leads: ${leadsCount}`);
  console.log(`   Prospects: ${prospectsCount}`);
  
  return { peopleCount, leadsCount, prospectsCount };
}

/**
 * 💾 Create backup of current data
 */
async function createBackup() {
  console.log('💾 Creating backup...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Get all TOP workspace data
  const [people, leads, prospects] = await Promise.all([
    prisma.people.findMany({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    }),
    prisma.leads.findMany({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    }),
    prisma.prospects.findMany({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    })
  ]);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    migration: 'top-people-to-leads-conversion',
    workspaceId: TOP_WORKSPACE_ID,
    workspaceName: 'TOP Engineering Plus',
    originalCounts: {
      people: people.length,
      leads: leads.length,
      prospects: prospects.length
    },
    data: { people, leads, prospects }
  };
  
  const backupPath = path.join(BACKUP_DIR, BACKUP_FILE);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  
  console.log(`✅ Backup created: ${backupPath}`);
  console.log(`   Backed up ${people.length} people, ${leads.length} leads, ${prospects.length} prospects`);
  
  return { backupPath, people };
}

/**
 * 🔄 Convert person record to lead format
 */
function convertPersonToLead(person) {
  return {
    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_converted`,
    workspaceId: person.workspaceId,
    assignedUserId: person.assignedUserId,
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    fullName: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
    displayName: person.displayName,
    email: person.email,
    workEmail: person.workEmail,
    personalEmail: person.personalEmail,
    phone: person.phone,
    mobilePhone: person.mobilePhone,
    workPhone: person.workPhone,
    company: person.company,
    companyDomain: null, // Not typically in people records
    industry: null, // Not typically in people records
    companySize: null, // Not typically in people records
    jobTitle: person.jobTitle,
    title: person.jobTitle, // Map jobTitle to title for leads
    department: person.department,
    linkedinUrl: person.linkedinUrl,
    address: person.address,
    city: person.city,
    state: person.state,
    country: person.country,
    postalCode: person.postalCode,
    status: 'new', // Default status for converted leads
    priority: 'medium', // Default priority
    source: 'people_conversion', // Track that these came from people records
    estimatedValue: null,
    currency: 'USD',
    notes: person.notes ? `Converted from people record. Original notes: ${person.notes}` : 'Converted from people record.',
    description: person.bio || null,
    tags: person.tags || [],
    customFields: person.customFields,
    preferredLanguage: person.preferredLanguage,
    timezone: person.timezone,
    lastEnriched: person.lastEnriched,
    enrichmentSources: person.enrichmentSources || [],
    emailVerified: person.emailVerified || false,
    phoneVerified: person.phoneVerified || false,
    mobileVerified: person.mobileVerified || false,
    enrichmentScore: person.enrichmentScore,
    emailConfidence: person.emailConfidence,
    phoneConfidence: person.phoneConfidence,
    dataCompleteness: person.dataCompleteness,
    createdAt: person.createdAt,
    updatedAt: new Date(),
    personId: person.id, // Link back to original person record
    deletedAt: null,
    buyerGroupRole: person.buyerGroupRole,
    completedStages: [],
    currentStage: null,
    lastActionDate: person.lastActionDate,
    nextAction: person.nextAction,
    nextActionDate: person.nextActionDate,
    lastContactDate: null,
    companyId: person.companyId
  };
}

/**
 * 🔄 Perform the people to leads conversion
 */
async function performConversion(people) {
  console.log(`🔄 Starting conversion of ${people.length} people to leads...`);
  
  // Process in batches for better performance and memory management
  const batches = [];
  for (let i = 0; i < people.length; i += BATCH_SIZE) {
    batches.push(people.slice(i, i + BATCH_SIZE));
  }
  
  let totalConverted = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📝 Processing batch ${i + 1}/${batches.length} (${batch.length} records)...`);
    
    // Convert batch to leads format
    const convertedBatch = batch.map(convertPersonToLead);
    
    try {
      // Insert the converted leads
      await prisma.leads.createMany({
        data: convertedBatch,
        skipDuplicates: true
      });
      
      totalConverted += convertedBatch.length;
      console.log(`   ✅ Batch ${i + 1} completed: ${convertedBatch.length} people → leads`);
      
    } catch (error) {
      console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
      throw error;
    }
  }
  
  console.log(`✅ Conversion completed: ${totalConverted} people converted to leads`);
  return totalConverted;
}

/**
 * 🔍 Validate conversion results
 */
async function validateConversion(originalCounts, convertedCount) {
  console.log('🔍 Validating conversion results...');
  
  const [newLeadsCount, peopleCount, prospectsCount] = await Promise.all([
    prisma.leads.count({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    }),
    prisma.people.count({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    }),
    prisma.prospects.count({ 
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } 
    })
  ]);
  
  const expectedLeadsCount = originalCounts.leadsCount + convertedCount;
  
  console.log('📊 Validation Results:');
  console.log(`   Original leads: ${originalCounts.leadsCount}`);
  console.log(`   People converted: ${convertedCount}`);
  console.log(`   Expected new leads total: ${expectedLeadsCount}`);
  console.log(`   Actual new leads total: ${newLeadsCount}`);
  console.log(`   People count (unchanged): ${peopleCount}`);
  console.log(`   Prospects count (unchanged): ${prospectsCount}`);
  
  const validationPassed = newLeadsCount === expectedLeadsCount;
  console.log(`   Validation: ${validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return validationPassed;
}

/**
 * 🚀 Main conversion function
 */
async function main() {
  try {
    console.log('🚀 Starting TOP Workspace People → Leads Conversion');
    console.log('==================================================');
    console.log(`Workspace: TOP Engineering Plus (${TOP_WORKSPACE_ID})`);
    
    // Step 1: Get current counts
    const originalCounts = await getCurrentCounts();
    
    if (originalCounts.peopleCount === 0) {
      console.log('⚠️  No people found to convert. Exiting.');
      return;
    }
    
    // Step 2: Create backup and get people data
    const { backupPath, people } = await createBackup();
    
    // Step 3: Confirm before proceeding
    console.log('\n⚠️  FINAL CONFIRMATION REQUIRED:');
    console.log(`This will convert ${people.length} people records to leads in TOP Engineering Plus workspace.`);
    console.log(`Backup created at: ${backupPath}`);
    console.log('\\nTo proceed, you must manually confirm by running:');
    console.log('node scripts/database/convert-top-people-to-leads.js --confirm');
    
    if (!process.argv.includes('--confirm')) {
      console.log('\\n🛑 Conversion halted. Use --confirm flag to proceed.');
      return;
    }
    
    console.log('\\n🔄 Proceeding with conversion...');
    
    // Step 4: Perform conversion
    const convertedCount = await performConversion(people);
    
    // Step 5: Validate results
    const isValid = await validateConversion(originalCounts, convertedCount);
    
    if (isValid) {
      console.log('\\n🎉 CONVERSION COMPLETED SUCCESSFULLY!');
      console.log(`${convertedCount} people from TOP Engineering Plus converted to leads.`);
      console.log(`Backup available at: ${backupPath}`);
      console.log('\\n📊 Final Summary:');
      console.log(`   Before: ${originalCounts.leadsCount} leads`);
      console.log(`   After: ${originalCounts.leadsCount + convertedCount} leads`);
      console.log(`   People records: ${originalCounts.peopleCount} (preserved)`);
    } else {
      console.log('\\n❌ CONVERSION VALIDATION FAILED!');
      console.log('Please check the data and consider restoring from backup.');
    }
    
  } catch (error) {
    console.error('💥 Conversion failed:', error);
    console.log('Please check the backup and consider manual rollback.');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
