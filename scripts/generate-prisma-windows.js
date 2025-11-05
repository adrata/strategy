#!/usr/bin/env node

/**
 * Windows-specific Prisma generation workaround
 * Tries to work around file locks by renaming/moving files
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const queryEnginePath = path.join(prismaClientPath, 'query-engine-windows.exe');
const backupPath = path.join(prismaClientPath, 'query-engine-windows.exe.backup');

console.log('🔧 Windows Prisma Generation Workaround...\n');

// Try to rename the locked file (Windows allows this even if file is in use)
function tryRenameLockedFile() {
  if (!fs.existsSync(queryEnginePath)) {
    return true;
  }
  
  try {
    // Try to rename - Windows allows renaming files that are in use
    fs.renameSync(queryEnginePath, backupPath);
    console.log('✅ Renamed locked file to backup\n');
    return true;
  } catch (error) {
    console.log(`⚠️  Could not rename file: ${error.message}`);
    return false;
  }
}

// Try to delete the backup after generation
function cleanupBackup() {
  if (fs.existsSync(backupPath)) {
    try {
      fs.unlinkSync(backupPath);
      console.log('✅ Cleaned up backup file\n');
    } catch (error) {
      // Ignore - backup can stay
    }
  }
}

async function generate() {
  console.log('Step 1: Attempting to work around file lock...');
  const renamed = tryRenameLockedFile();
  
  if (!renamed) {
    console.log('⚠️  Could not rename locked file, but continuing anyway...\n');
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('Step 2: Generating Prisma client...\n');
  
  return new Promise((resolve, reject) => {
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema-streamlined.prisma');
    
    const prismaGenerate = spawn('npx', ['prisma', 'generate', '--schema', schemaPath], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });

    prismaGenerate.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Prisma Client generated successfully!\n');
        
        // Clean up backup
        cleanupBackup();
        
        // Verify
        if (fs.existsSync(queryEnginePath)) {
          console.log('✅ Verification: New query engine file exists');
          console.log('✅ Generation complete and verified!\n');
          resolve();
        } else {
          console.log('⚠️  Warning: Query engine file not found, but generation reported success');
          resolve(); // Still resolve - might be in a subdirectory
        }
      } else {
        // Restore backup if generation failed
        if (fs.existsSync(backupPath) && !fs.existsSync(queryEnginePath)) {
          try {
            fs.renameSync(backupPath, queryEnginePath);
            console.log('✅ Restored original file\n');
          } catch (e) {
            // Ignore
          }
        }
        reject(new Error(`Generation failed with code ${code}`));
      }
    });

    prismaGenerate.on('error', (error) => {
      console.error('\n❌ Error:', error.message);
      reject(error);
    });
  });
}

generate()
  .then(() => {
    console.log('🎉 Success! Prisma client is ready.\n');
    console.log('📝 Next step: Restart your dev server to use the new client.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    console.error('\n💡 The database migration is complete, but Prisma client needs regeneration.');
    console.error('   The feature will work with limited TypeScript support until Prisma is regenerated.\n');
    process.exit(1);
  });

