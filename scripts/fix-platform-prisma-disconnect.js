const fs = require('fs');
const path = require('path');

const platformDir = path.join(__dirname, '../src/platform');

async function findAndFixPrismaDisconnect() {
  console.log('🔧 Starting platform Prisma disconnect fix script...');
  let filesFixedCount = 0;
  const filesToCheck = [];

  // Recursively find all TypeScript files in the platform directory
  function findTsFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findTsFiles(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        filesToCheck.push(filePath);
      }
    }
  }

  findTsFiles(platformDir);
  console.log(`🔧 Found ${filesToCheck.length} platform files to check`);

  for (const filePath of filesToCheck) {
    console.log(`🔧 Checking: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove standalone prisma.$disconnect() calls
    content = content.replace(/await\s+prisma\.\$disconnect\(\);\s*/g, '');
    
    // Remove prisma.$disconnect() in finally blocks
    const finallyDisconnectRegex = /(\s*)finally\s*{\s*await\s+prisma\.\$disconnect\(\);\s*}/g;
    content = content.replace(finallyDisconnectRegex, (match, p1) => {
      return `${p1}}`;
    });

    // Remove prisma.$disconnect() in catch blocks
    const catchDisconnectRegex = /(\s*)catch\s*\([^)]*\)\s*{\s*([\s\S]*?)await\s+prisma\.\$disconnect\(\);\s*([\s\S]*?)\s*}/g;
    content = content.replace(catchDisconnectRegex, (match, p1, p2, p3) => {
      return `${p1}catch (error) {\n${p2.replace(/await\s+prisma\.\$disconnect\(\);/g, '')}${p3}\n${p1}}`;
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      filesFixedCount++;
    } else {
      console.log(`- No changes needed for: ${filePath}`);
    }
  }

  console.log(`\n🎉 Fixed ${filesFixedCount} platform files`);
  console.log('✅ All prisma.$disconnect() calls removed from platform services');
  console.log('🚀 Authentication and API calls should work properly now');
}

findAndFixPrismaDisconnect();
