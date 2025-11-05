#!/usr/bin/env node

/**
 * Safe Prisma Client Generation Script for Windows
 * 
 * Handles file locking issues on Windows by:
 * 1. Checking if dev server is running
 * 2. Attempting graceful generation
 * 3. Providing clear error messages and solutions
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkIfProcessRunning(processName) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV`, { encoding: 'utf8', stdio: 'pipe' });
      return result.includes(processName);
    } else {
      const result = execSync(`pgrep -f ${processName}`, { encoding: 'utf8', stdio: 'pipe' });
      return result.trim().length > 0;
    }
  } catch (error) {
    return false;
  }
}

function findNodeProcesses() {
  try {
    if (process.platform === 'win32') {
      const result = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8', stdio: 'pipe' });
      const lines = result.split('\n').filter(line => line.includes('node.exe'));
      return lines.length;
    } else {
      const result = execSync('pgrep -f node', { encoding: 'utf8', stdio: 'pipe' });
      return result.trim().split('\n').filter(Boolean).length;
    }
  } catch (error) {
    return 0;
  }
}

function killPrismaQueryEngine() {
  try {
    const queryEnginePath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'query-engine-windows.exe');
    if (fs.existsSync(queryEnginePath)) {
      console.log('🔍 Attempting to unlock query engine file...');
      
      // On Windows, try to unlock the file by removing it if possible
      try {
        // Try to remove any temp files first
        const tempFiles = fs.readdirSync(path.dirname(queryEnginePath))
          .filter(f => f.startsWith('query-engine-windows.exe.tmp'));
        
        tempFiles.forEach(file => {
          try {
            fs.unlinkSync(path.join(path.dirname(queryEnginePath), file));
            console.log(`  ✅ Removed temp file: ${file}`);
          } catch (e) {
            // Ignore - file might be locked
          }
        });
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

async function generatePrisma() {
  console.log('🚀 Starting Prisma Client Generation...\n');

  // Check for running Node processes
  const nodeProcesses = findNodeProcesses();
  if (nodeProcesses > 1) { // More than just this script
    console.log('⚠️  Warning: Found Node.js processes running');
    console.log('   This may cause file locking issues on Windows\n');
    console.log('   Recommendation: Stop your dev server (npm run dev) before generating\n');
  }

  // Try to clean up any temp files
  killPrismaQueryEngine();

  console.log('📝 Generating Prisma Client...\n');

  return new Promise((resolve, reject) => {
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema-streamlined.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      reject(new Error('Schema file not found'));
      return;
    }

    const prismaGenerate = spawn('npx', ['prisma', 'generate', '--schema', schemaPath], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..')
    });

    prismaGenerate.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Prisma Client generated successfully!\n');
        resolve();
      } else {
        console.error('\n❌ Prisma generation failed with code:', code);
        console.error('\n💡 Troubleshooting steps:');
        console.error('   1. Make sure your dev server is stopped (Ctrl+C in the terminal running "npm run dev")');
        console.error('   2. Close any other applications that might be using the Prisma client');
        console.error('   3. Try running: npm run db:generate');
        console.error('   4. If still failing, restart your terminal/IDE and try again');
        console.error('   5. As a last resort, delete node_modules/.prisma/client and try again\n');
        reject(new Error(`Prisma generation failed with code ${code}`));
      }
    });

    prismaGenerate.on('error', (error) => {
      console.error('\n❌ Error spawning Prisma generation:', error.message);
      console.error('\n💡 Make sure Prisma is installed: npm install\n');
      reject(error);
    });
  });
}

// Run the generation
generatePrisma()
  .then(() => {
    console.log('✅ All done! You can now restart your dev server.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Generation failed:', error.message);
    process.exit(1);
  });

