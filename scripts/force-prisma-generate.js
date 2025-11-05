#!/usr/bin/env node

/**
 * Force Prisma Generation - Safe approach
 * 
 * This script will:
 * 1. Wait for file locks to be released
 * 2. Try multiple times with delays
 * 3. Use Windows-specific workarounds
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const queryEnginePath = path.join(prismaClientPath, 'query-engine-windows.exe');

console.log('🔧 Attempting safe Prisma client generation...\n');

// Function to check if file is locked
function isFileLocked(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    
    // Try to open the file in append mode - if it fails, it's locked
    const fd = fs.openSync(filePath, 'r+');
    fs.closeSync(fd);
    return false;
  } catch (error) {
    return error.code === 'EBUSY' || error.code === 'EPERM' || error.code === 'EACCES';
  }
}

// Function to wait for file to be unlocked
function waitForUnlock(filePath, maxAttempts = 10, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      if (!isFileLocked(filePath)) {
        console.log(`✅ File is unlocked (attempt ${attempts})`);
        resolve(true);
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.log(`⚠️  File still locked after ${maxAttempts} attempts`);
        resolve(false);
        return;
      }
      
      console.log(`⏳ Waiting for file to unlock... (attempt ${attempts}/${maxAttempts})`);
      setTimeout(check, delay);
    };
    
    check();
  });
}

// Function to safely delete directory
function safeDeleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) return true;
  
  try {
    // Try to remove files first
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          safeDeleteDir(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        // Ignore individual file errors
      }
    }
    
    // Try to remove directory
    fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    return true;
  } catch (error) {
    console.log(`⚠️  Could not fully delete ${dirPath}: ${error.message}`);
    return false;
  }
}

async function generatePrisma() {
  console.log('Step 1: Checking Prisma client directory...');
  
  // If query engine exists and is locked, wait for it
  if (fs.existsSync(queryEnginePath)) {
    console.log('Found existing query engine file');
    if (isFileLocked(queryEnginePath)) {
      console.log('⚠️  Query engine file is locked');
      console.log('⏳ Waiting for lock to be released (this may take a moment)...\n');
      
      const unlocked = await waitForUnlock(queryEnginePath, 30, 2000); // 30 attempts, 2 second delay = 60 seconds max
      
      if (!unlocked) {
        console.log('\n❌ File is still locked after waiting');
        console.log('💡 Please stop your dev server (Ctrl+C in the terminal running "npm run dev")');
        console.log('   Then run: npm run db:generate\n');
        process.exit(1);
      }
    }
  }
  
  console.log('Step 2: Cleaning up Prisma client directory...');
  
  // Try to safely remove the directory
  if (fs.existsSync(prismaClientPath)) {
    const deleted = safeDeleteDir(prismaClientPath);
    if (deleted) {
      console.log('✅ Cleaned up Prisma client directory\n');
    } else {
      console.log('⚠️  Could not fully clean up (some files may be locked)\n');
    }
  } else {
    console.log('✅ No existing Prisma client directory\n');
  }
  
  // Wait a moment for Windows to release file handles
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Step 3: Generating Prisma client...\n');
  
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
        
        // Verify it worked
        if (fs.existsSync(queryEnginePath)) {
          console.log('✅ Verification: Query engine file exists');
          console.log('✅ Everything is ready!\n');
          resolve();
        } else {
          console.log('⚠️  Warning: Query engine file not found after generation');
          reject(new Error('Generation may have failed'));
        }
      } else {
        console.error('\n❌ Prisma generation failed');
        reject(new Error(`Generation failed with code ${code}`));
      }
    });

    prismaGenerate.on('error', (error) => {
      console.error('\n❌ Error spawning Prisma generation:', error.message);
      reject(error);
    });
  });
}

// Run the generation
generatePrisma()
  .then(() => {
    console.log('🎉 Success! You can now restart your dev server.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    console.error('\n💡 Manual steps:');
    console.error('   1. Stop your dev server (Ctrl+C)');
    console.error('   2. Run: npm run db:generate');
    console.error('   3. Restart dev server: npm run dev\n');
    process.exit(1);
  });

