#!/usr/bin/env node

/**
 * 🔧 UPDATE SCHEMA TO USE ULID SCRIPT
 * 
 * Updates the Prisma schema to use ULID as the default ID generator
 * This ensures all future records use ULIDs automatically
 */

import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = 'prisma/schema.prisma';

async function updateSchemaToULID() {
  try {
    console.log('🔧 Updating Prisma schema to use ULID...');
    
    // Read the current schema
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    // Find all model definitions that have @id without @default
    const modelRegex = /model\s+(\w+)\s*\{[\s\S]*?id\s+String\s+@id(?!\s+@default)/g;
    
    let updatedSchema = schemaContent;
    let modelsUpdated = 0;
    
    // Replace each occurrence
    updatedSchema = updatedSchema.replace(modelRegex, (match, modelName) => {
      // Find the id line and add @default(ulid())
      const idLineRegex = /(id\s+String\s+@id)/g;
      const updatedMatch = match.replace(idLineRegex, '$1 @default(ulid())');
      
      console.log(`   ✅ Updated model: ${modelName}`);
      modelsUpdated++;
      
      return updatedMatch;
    });
    
    // Add ULID import at the top if not present
    if (!updatedSchema.includes('import { ulid }')) {
      const importStatement = '\n// ULID ID generation\nimport { ulid } from "ulid";\n';
      updatedSchema = updatedSchema.replace(/generator client \{/, importStatement + 'generator client {');
    }
    
    // Write the updated schema
    fs.writeFileSync(SCHEMA_PATH, updatedSchema, 'utf8');
    
    console.log(`\n🎯 Schema updated successfully!`);
    console.log(`   Models updated: ${modelsUpdated}`);
    console.log(`   All future records will use ULIDs automatically`);
    
    // Show what to do next
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Run: npx prisma generate`);
    console.log(`   2. Run: npx prisma db push`);
    console.log(`   3. Restart your development server`);
    
  } catch (error) {
    console.error('❌ Failed to update schema:', error);
    throw error;
  }
}

// Run the update
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSchemaToULID()
    .then(() => {
      console.log('\n🎉 Schema update complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Schema update failed:', error);
      process.exit(1);
    });
}
