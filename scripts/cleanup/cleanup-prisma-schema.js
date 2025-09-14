#!/usr/bin/env node

/**
 * 🧹 CLEANUP PRISMA SCHEMA
 * 
 * Removes all deleted table models from the Prisma schema file
 */

const fs = require('fs');
const path = require('path');

// List of models to remove (the ones we deleted from the database)
const modelsToRemove = [
  'App', 'AuditLog', 'Bundle', 'BundleApp', 'BuyerCompanyProfile', 'BuyerGroup',
  'ChangeLog', 'Chat', 'ChatMember', 'Company', 'ConnectedProvider', 'CreditTransaction',
  'DataRegion', 'DataTransferLog', 'DecisionMaker', 'DocumentShare', 'Email',
  'EnrichmentAnalytics', 'EnrichmentCache', 'EnrichmentExecution', 'EnrichmentStep',
  'Event', 'Grid', 'IntelligenceReport', 'Meeting', 'MembershipApp', 'Message',
  'MessageReaction', 'OpportunityActivity', 'OpportunityStakeholder', 'OutboxSettings',
  'Paper', 'Partnership', 'PartnershipLead', 'Person', 'PipelineExecution',
  'PipelineResult', 'PipelineStep', 'Pitch', 'ProviderToken', 'Role', 'RolePermission',
  'SCIMConnection', 'SCIMSyncOperation', 'SSOProvider', 'SecurityEvent', 'SecurityMetrics',
  'SellerProductPortfolio', 'SellerProfile', 'UserApp', 'UserChatReadState',
  'UserCreditBalance', 'UserProfile', 'UserRoleHistory', 'VectorEmbedding',
  'WorkspaceApp', 'WorkspaceMembership', 'WorkspaceRegion'
];

function cleanupPrismaSchema() {
  const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
  
  console.log('🧹 Cleaning up Prisma schema...');
  console.log(`📁 Schema file: ${schemaPath}`);
  
  // Read the schema file
  let content = fs.readFileSync(schemaPath, 'utf8');
  const originalLength = content.length;
  
  // Remove each model
  let removedCount = 0;
  for (const modelName of modelsToRemove) {
    const modelRegex = new RegExp(
      `^model ${modelName} \\{[\\s\\S]*?^\\}`,
      'gm'
    );
    
    const beforeLength = content.length;
    content = content.replace(modelRegex, '');
    
    if (content.length < beforeLength) {
      removedCount++;
      console.log(`✅ Removed model: ${modelName}`);
    }
  }
  
  // Clean up any extra blank lines (more than 2 consecutive)
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Write the cleaned schema back
  fs.writeFileSync(schemaPath, content, 'utf8');
  
  const finalLength = content.length;
  const removedBytes = originalLength - finalLength;
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   Models removed: ${removedCount}`);
  console.log(`   Bytes removed: ${removedBytes}`);
  console.log(`   Original size: ${originalLength} bytes`);
  console.log(`   Final size: ${finalLength} bytes`);
  
  console.log('\n✅ Prisma schema cleanup completed!');
}

if (require.main === module) {
  cleanupPrismaSchema();
}

module.exports = { cleanupPrismaSchema };
