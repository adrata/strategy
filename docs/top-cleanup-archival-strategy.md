# TOP Data Cleanup & Archival Strategy
## Smart Duplicate Removal with Historical Preservation

**Date:** September 18, 2025  
**Client:** TOP Engineering Plus  
**Objective:** Clean up duplicates while preserving historical data for reference  

---

## 🎯 **Cleanup & Archival Overview**

### **Core Strategy**
1. **Archive Before Cleanup**: Preserve all existing data in timestamped archives
2. **Smart Deduplication**: Intelligent merging based on multiple criteria
3. **Relationship Preservation**: Maintain buyer group and action relationships
4. **Audit Trail**: Complete record of what was changed and why

### **Archival Philosophy**
- **Never lose data**: Everything archived before modification
- **Timestamped snapshots**: Point-in-time recovery capability
- **Relationship preservation**: Maintain data connections in archives
- **Query capability**: Archives remain searchable

---

## 📊 **Current Duplicate Patterns (From Analysis)**

### **Existing Duplicate Detection Logic**
Based on `scripts/complete-data-integrity-fix.js` and `_data/data_cleanup.py`:

```typescript
// Current duplicate detection strategies
interface DuplicateDetectionStrategy {
  email: {
    priority: 'high',
    method: 'exact_match',
    keepStrategy: 'oldest_record'
  },
  nameAndCompany: {
    priority: 'medium', 
    method: 'fuzzy_match',
    keepStrategy: 'most_complete_record'
  },
  phoneNumber: {
    priority: 'medium',
    method: 'normalized_match',
    keepStrategy: 'highest_confidence'
  },
  linkedinUrl: {
    priority: 'high',
    method: 'exact_match',
    keepStrategy: 'most_recent_activity'
  }
}
```

### **Enhanced Duplicate Detection for Buyer Groups**
```typescript
interface BuyerGroupDuplicateStrategy {
  coreSignalId: {
    priority: 'highest',
    method: 'exact_match',
    action: 'merge_immediately'
  },
  emailAndCompany: {
    priority: 'high',
    method: 'exact_match',
    action: 'merge_with_role_preservation'
  },
  nameCompanyTitle: {
    priority: 'medium',
    method: 'fuzzy_match_with_title',
    action: 'merge_if_confidence_80_plus'
  },
  linkedinProfile: {
    priority: 'high',
    method: 'exact_url_match',
    action: 'merge_with_profile_update'
  }
}
```

---

## 🗂️ **Archival Structure**

### **Archive Directory Structure**
```
_data/archives/top-enrichment-2025-09-18/
├── pre-enrichment/
│   ├── companies_snapshot.json
│   ├── people_snapshot.json  
│   ├── leads_snapshot.json
│   ├── prospects_snapshot.json
│   ├── buyer_groups_snapshot.json
│   └── relationships_snapshot.json
├── enrichment-process/
│   ├── buyer_groups_generated.json
│   ├── new_people_discovered.json
│   ├── enrichment_metadata.json
│   └── processing_log.txt
├── post-cleanup/
│   ├── duplicates_identified.json
│   ├── merge_operations.json
│   ├── archived_records.json
│   └── final_counts.json
└── audit/
    ├── cleanup_report.md
    ├── data_quality_metrics.json
    └── recovery_instructions.md
```

### **Archive Implementation**
```typescript
// Archive service: top-data-archival.ts
export class TOPDataArchival {
  private archiveBasePath = '_data/archives';
  private timestamp = new Date().toISOString().split('T')[0];
  
  async createPreEnrichmentArchive(workspaceId: string): Promise<string> {
    const archivePath = `${this.archiveBasePath}/top-enrichment-${this.timestamp}`;
    
    console.log('📦 Creating pre-enrichment archive...');
    
    // Create archive directory
    await this.ensureDirectory(`${archivePath}/pre-enrichment`);
    
    // Archive all current data in parallel
    const [companies, people, leads, prospects, buyerGroups, relationships] = await Promise.all([
      this.archiveCompanies(workspaceId),
      this.archivePeople(workspaceId),
      this.archiveLeads(workspaceId),
      this.archiveProspects(workspaceId),
      this.archiveBuyerGroups(workspaceId),
      this.archiveRelationships(workspaceId)
    ]);
    
    // Save archives in parallel
    await Promise.all([
      this.saveArchive(`${archivePath}/pre-enrichment/companies_snapshot.json`, companies),
      this.saveArchive(`${archivePath}/pre-enrichment/people_snapshot.json`, people),
      this.saveArchive(`${archivePath}/pre-enrichment/leads_snapshot.json`, leads),
      this.saveArchive(`${archivePath}/pre-enrichment/prospects_snapshot.json`, prospects),
      this.saveArchive(`${archivePath}/pre-enrichment/buyer_groups_snapshot.json`, buyerGroups),
      this.saveArchive(`${archivePath}/pre-enrichment/relationships_snapshot.json`, relationships)
    ]);
    
    console.log(`✅ Pre-enrichment archive created: ${archivePath}`);
    return archivePath;
  }
  
  async archiveCompanies(workspaceId: string) {
    return await prisma.companies.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        people: true,
        buyer_groups: true
      }
    });
  }
  
  async archivePeople(workspaceId: string) {
    return await prisma.people.findMany({
      where: { workspaceId, deletedAt: null },
      include: {
        buyerGroups: true,
        actions: true
      }
    });
  }
  
  // Similar methods for other entities...
}
```

---

## 🧹 **Smart Cleanup Implementation**

### **Phase 1: Pre-Cleanup Archival**
```typescript
// Implementation: smart-duplicate-cleanup.ts
export class SmartDuplicateCleanup {
  private archival: TOPDataArchival;
  
  constructor() {
    this.archival = new TOPDataArchival();
  }
  
  async cleanupTOPDuplicates(workspaceId: string): Promise<CleanupResults> {
    console.log('🧹 Starting Smart Duplicate Cleanup for TOP...');
    
    // STEP 1: Create complete archive
    const archivePath = await this.archival.createPreEnrichmentArchive(workspaceId);
    
    // STEP 2: Identify all duplicates in parallel
    const [
      emailDuplicates,
      nameDuplicates, 
      linkedinDuplicates,
      coreSignalDuplicates
    ] = await Promise.all([
      this.findEmailDuplicates(workspaceId),
      this.findNameCompanyDuplicates(workspaceId),
      this.findLinkedInDuplicates(workspaceId),
      this.findCoreSignalDuplicates(workspaceId)
    ]);
    
    // STEP 3: Create smart merge plan
    const mergePlan = this.createSmartMergePlan(
      emailDuplicates,
      nameDuplicates,
      linkedinDuplicates,
      coreSignalDuplicates
    );
    
    console.log(`📋 Merge plan: ${mergePlan.length} operations planned`);
    
    // STEP 4: Execute merges with relationship preservation
    const cleanupResults = await this.executeMergePlan(mergePlan, workspaceId);
    
    // STEP 5: Create post-cleanup archive
    await this.archival.createPostCleanupArchive(workspaceId, cleanupResults);
    
    return cleanupResults;
  }
  
  private async findEmailDuplicates(workspaceId: string): Promise<DuplicateGroup[]> {
    console.log('📧 Finding email duplicates...');
    
    // Find duplicates across all entity types
    const [peopleDuplicates, leadsDuplicates, prospectsDuplicates] = await Promise.all([
      this.findPeopleEmailDuplicates(workspaceId),
      this.findLeadsEmailDuplicates(workspaceId),
      this.findProspectsEmailDuplicates(workspaceId)
    ]);
    
    return this.consolidateDuplicateGroups(peopleDuplicates, leadsDuplicates, prospectsDuplicates);
  }
  
  private createSmartMergePlan(
    emailDuplicates: DuplicateGroup[],
    nameDuplicates: DuplicateGroup[],
    linkedinDuplicates: DuplicateGroup[],
    coreSignalDuplicates: DuplicateGroup[]
  ): MergeOperation[] {
    
    const mergePlan: MergeOperation[] = [];
    
    // Priority 1: CoreSignal ID matches (highest confidence)
    coreSignalDuplicates.forEach(group => {
      mergePlan.push({
        type: 'coresignal_merge',
        priority: 1,
        primaryRecord: this.selectBestRecord(group.records),
        duplicateRecords: group.records.slice(1),
        mergeStrategy: 'preserve_all_data',
        preserveRelationships: true,
        reason: `Same CoreSignal ID: ${group.coreSignalId}`
      });
    });
    
    // Priority 2: Email matches (high confidence)
    emailDuplicates.forEach(group => {
      mergePlan.push({
        type: 'email_merge',
        priority: 2,
        primaryRecord: this.selectMostComplete(group.records),
        duplicateRecords: group.records.slice(1),
        mergeStrategy: 'merge_fields',
        preserveRelationships: true,
        reason: `Same email: ${group.email}`
      });
    });
    
    // Priority 3: LinkedIn matches (medium confidence)
    linkedinDuplicates.forEach(group => {
      mergePlan.push({
        type: 'linkedin_merge',
        priority: 3,
        primaryRecord: this.selectMostRecent(group.records),
        duplicateRecords: group.records.slice(1),
        mergeStrategy: 'merge_with_validation',
        preserveRelationships: true,
        reason: `Same LinkedIn: ${group.linkedinUrl}`
      });
    });
    
    return mergePlan.sort((a, b) => a.priority - b.priority);
  }
  
  private async executeMergePlan(
    mergePlan: MergeOperation[],
    workspaceId: string
  ): Promise<CleanupResults> {
    
    console.log(`🔄 Executing ${mergePlan.length} merge operations...`);
    
    const results: CleanupResults = {
      totalMerges: 0,
      recordsArchived: 0,
      relationshipsPreserved: 0,
      errors: []
    };
    
    // Execute merges in parallel batches
    const batchSize = 10;
    const batches = this.chunkArray(mergePlan, batchSize);
    
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`📦 Merge batch ${batchIndex + 1}/${batches.length}`);
      
      const batchPromises = batch.map(operation => 
        this.executeSingleMerge(operation, workspaceId)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.totalMerges++;
          results.recordsArchived += result.value.archivedCount;
          results.relationshipsPreserved += result.value.relationshipsCount;
        } else {
          results.errors.push({
            operation: batch[index],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }
    
    return results;
  }
  
  private async executeSingleMerge(
    operation: MergeOperation,
    workspaceId: string
  ): Promise<MergeResult> {
    
    // Use database transaction for consistency
    return await prisma.$transaction(async (tx) => {
      const primaryRecord = operation.primaryRecord;
      const duplicateRecords = operation.duplicateRecords;
      
      // Step 1: Merge data into primary record
      const mergedData = this.mergeRecordData(primaryRecord, duplicateRecords);
      
      // Step 2: Update primary record with merged data
      await this.updatePrimaryRecord(tx, primaryRecord.id, mergedData);
      
      // Step 3: Preserve relationships by updating foreign keys
      const relationshipUpdates = await this.preserveRelationships(
        tx, 
        primaryRecord.id, 
        duplicateRecords.map(r => r.id)
      );
      
      // Step 4: Archive duplicate records before deletion
      await this.archiveDuplicateRecords(duplicateRecords, operation.reason);
      
      // Step 5: Soft delete duplicate records
      await this.softDeleteDuplicates(tx, duplicateRecords.map(r => r.id));
      
      return {
        primaryId: primaryRecord.id,
        archivedCount: duplicateRecords.length,
        relationshipsCount: relationshipUpdates.length,
        mergeReason: operation.reason
      };
    });
  }
  
  private async preserveRelationships(
    tx: any,
    primaryId: string,
    duplicateIds: string[]
  ): Promise<RelationshipUpdate[]> {
    
    const updates: RelationshipUpdate[] = [];
    
    // Update buyer group relationships
    for (const duplicateId of duplicateIds) {
      // Move buyer group memberships to primary record
      const buyerGroupMemberships = await tx.BuyerGroupToPerson.findMany({
        where: { personId: duplicateId }
      });
      
      for (const membership of buyerGroupMemberships) {
        // Check if primary already has this buyer group relationship
        const existingMembership = await tx.BuyerGroupToPerson.findFirst({
          where: {
            buyerGroupId: membership.buyerGroupId,
            personId: primaryId
          }
        });
        
        if (!existingMembership) {
          // Create new relationship for primary record
          await tx.BuyerGroupToPerson.create({
            data: {
              buyerGroupId: membership.buyerGroupId,
              personId: primaryId,
              role: membership.role,
              influence: membership.influence,
              isPrimary: membership.isPrimary,
              notes: `Merged from duplicate record ${duplicateId}. Original notes: ${membership.notes || 'None'}`
            }
          });
          
          updates.push({
            type: 'buyer_group_membership',
            fromId: duplicateId,
            toId: primaryId,
            buyerGroupId: membership.buyerGroupId
          });
        }
        
        // Delete old relationship
        await tx.BuyerGroupToPerson.delete({
          where: {
            buyerGroupId_personId: {
              buyerGroupId: membership.buyerGroupId,
              personId: duplicateId
            }
          }
        });
      }
      
      // Update actions/activities
      await tx.actions.updateMany({
        where: { leadId: duplicateId },
        data: { 
          leadId: primaryId,
          notes: { append: ` [Merged from ${duplicateId}]` }
        }
      });
      
      updates.push({
        type: 'actions_transferred',
        fromId: duplicateId,
        toId: primaryId
      });
    }
    
    return updates;
  }
}
```

---

## 🎯 **Implementation Timeline**

### **Phase 1: Pre-Enrichment Archive (Hour 0-1)**
```typescript
// Execute before starting enrichment
const archival = new TOPDataArchival();
const archivePath = await archival.createPreEnrichmentArchive(TOP_WORKSPACE_ID);

console.log(`📦 Archive created: ${archivePath}`);
// Proceed with enrichment...
```

### **Phase 2: Enrichment with Duplicate Tracking (Hours 1-20)**
```typescript
// During enrichment, track potential duplicates
class EnrichmentWithDuplicateTracking {
  private duplicateTracker = new Map();
  
  async enrichWithDuplicateDetection(person: any, company: any) {
    // Check for existing records before creating new ones
    const duplicateCheck = await this.checkForDuplicates(person);
    
    if (duplicateCheck.found) {
      // Update existing record instead of creating new
      return await this.updateExistingRecord(duplicateCheck.existingId, person);
    } else {
      // Create new record
      return await this.createNewRecord(person, company);
    }
  }
  
  private async checkForDuplicates(person: any): Promise<DuplicateCheckResult> {
    // Parallel duplicate checks
    const [emailMatch, linkedinMatch, coreSignalMatch] = await Promise.all([
      this.findByEmail(person.email),
      this.findByLinkedIn(person.linkedinUrl),
      this.findByCoreSignalId(person.coreSignalId)
    ]);
    
    // Return highest confidence match
    if (coreSignalMatch) return { found: true, existingId: coreSignalMatch.id, confidence: 100 };
    if (emailMatch) return { found: true, existingId: emailMatch.id, confidence: 95 };
    if (linkedinMatch) return { found: true, existingId: linkedinMatch.id, confidence: 90 };
    
    return { found: false };
  }
}
```

### **Phase 3: Post-Enrichment Cleanup (Hours 20-23)**
```typescript
// Final cleanup after enrichment
async function finalCleanup(workspaceId: string) {
  console.log('🧹 Final cleanup and deduplication...');
  
  const cleanup = new SmartDuplicateCleanup();
  
  // Step 1: Identify any remaining duplicates
  const duplicates = await cleanup.identifyRemainingDuplicates(workspaceId);
  console.log(`🔍 Found ${duplicates.length} remaining duplicate groups`);
  
  // Step 2: Execute cleanup with archival
  const cleanupResults = await cleanup.cleanupWithArchival(duplicates, workspaceId);
  
  // Step 3: Validate data integrity
  const validation = await cleanup.validateDataIntegrity(workspaceId);
  
  // Step 4: Generate final report
  const report = await cleanup.generateCleanupReport(cleanupResults, validation);
  
  console.log('✅ Cleanup complete!');
  console.log(`📊 Final stats: ${report.totalRecords} records, ${report.duplicatesRemoved} duplicates removed`);
  
  return report;
}
```

### **Phase 4: Archive Organization (Hour 23-24)**
```typescript
// Organize and document archives
async function organizeArchives(archivePath: string) {
  console.log('📚 Organizing archives and creating documentation...');
  
  // Create recovery documentation
  const recoveryDoc = `
# TOP Data Recovery Instructions
## Archive: ${archivePath}

### Quick Recovery Commands
\`\`\`sql
-- Restore people from archive
COPY people FROM '${archivePath}/pre-enrichment/people_snapshot.json';

-- Restore buyer groups
COPY buyer_groups FROM '${archivePath}/pre-enrichment/buyer_groups_snapshot.json';
\`\`\`

### Archive Contents
- **Pre-enrichment**: Original data before enrichment
- **Enrichment process**: New data discovered during enrichment  
- **Post-cleanup**: Final state after duplicate removal
- **Audit**: Complete change log and metrics

### Data Counts
- Companies: ${companiesCount}
- People: ${peopleCount}  
- Buyer Groups: ${buyerGroupsCount}
- Duplicates Removed: ${duplicatesRemovedCount}
`;

  await fs.writeFile(`${archivePath}/recovery_instructions.md`, recoveryDoc);
  
  console.log('✅ Archive documentation complete');
}
```

---

## 🔍 **Quality Assurance & Validation**

### **Duplicate Prevention During Enrichment**
```typescript
// Real-time duplicate prevention
class DuplicatePreventionEngine {
  private seenRecords = new Set();
  
  async preventDuplicate(newRecord: any): Promise<boolean> {
    // Create composite key for duplicate detection
    const compositeKeys = [
      `email:${newRecord.email}`,
      `linkedin:${newRecord.linkedinUrl}`,
      `coresignal:${newRecord.coreSignalId}`,
      `name_company:${newRecord.fullName}_${newRecord.company}`
    ].filter(key => !key.includes('undefined') && !key.includes('null'));
    
    // Check if any key already seen
    for (const key of compositeKeys) {
      if (this.seenRecords.has(key)) {
        console.log(`⚠️ Duplicate prevented: ${key}`);
        return false; // Duplicate detected
      }
    }
    
    // Add keys to seen records
    compositeKeys.forEach(key => this.seenRecords.add(key));
    return true; // No duplicate
  }
}
```

### **Post-Cleanup Validation**
```typescript
// Comprehensive validation after cleanup
async function validateCleanupResults(workspaceId: string): Promise<ValidationReport> {
  console.log('🔍 Validating cleanup results...');
  
  const [
    duplicateCheck,
    relationshipCheck,
    dataIntegrityCheck,
    buyerGroupCheck
  ] = await Promise.all([
    this.checkForRemainingDuplicates(workspaceId),
    this.validateRelationshipIntegrity(workspaceId),
    this.validateDataIntegrity(workspaceId),
    this.validateBuyerGroupIntegrity(workspaceId)
  ]);
  
  return {
    duplicatesRemaining: duplicateCheck.count,
    relationshipsIntact: relationshipCheck.intact,
    dataIntegrityScore: dataIntegrityCheck.score,
    buyerGroupsValid: buyerGroupCheck.valid,
    overallHealth: this.calculateOverallHealth([
      duplicateCheck,
      relationshipCheck, 
      dataIntegrityCheck,
      buyerGroupCheck
    ])
  };
}
```

---

## 📋 **Cleanup Checklist**

### **Pre-Cleanup (Must Complete)**
- [ ] Complete archive of all current data created
- [ ] Archive integrity verified (can restore if needed)
- [ ] Duplicate detection algorithms tested
- [ ] Merge strategies defined and tested

### **During Cleanup**
- [ ] Real-time duplicate prevention active
- [ ] Relationship preservation working
- [ ] Archive creation for each merge operation
- [ ] Progress monitoring and error handling

### **Post-Cleanup Validation**
- [ ] No remaining duplicates detected
- [ ] All buyer group relationships intact
- [ ] Data integrity score >95%
- [ ] Archive documentation complete
- [ ] Recovery procedures tested

### **Final Deliverables**
- [ ] Clean, deduplicated TOP database
- [ ] Complete historical archives with recovery instructions
- [ ] Cleanup report with before/after metrics
- [ ] Validation report confirming data integrity

**BOTTOM LINE**: We'll archive everything before cleanup, use smart merging to preserve relationships, and provide complete recovery capability. TOP gets clean data while maintaining full historical access.
