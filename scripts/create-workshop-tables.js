/**
 * Script to create workshop tables directly in the database
 * Run this if migrations are blocked
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createWorkshopTables() {
  try {
    console.log('📝 Reading SQL file...');
    const sqlFile = path.join(__dirname, '../prisma/migrations/create_workshop_tables.sql');
    let sql = fs.readFileSync(sqlFile, 'utf-8');
    
    // Remove comments and clean up
    sql = sql.replace(/--.*$/gm, '').trim();
    
    // Execute as a single transaction
    console.log('📊 Executing SQL to create workshop tables...');
    
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ Workshop tables created successfully!');
  } catch (error) {
    // Check if tables already exist
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('⚠️  Some tables may already exist, checking...');
      
      // Try to verify tables exist
      const tables = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('workshopDocument', 'workshopFolder', 'workshopShare', 'workshopVersion', 'workshopComment', 'workshopActivity')
      `);
      
      console.log('✅ Found tables:', tables);
      return;
    }
    
    console.error('❌ Error creating workshop tables:', error.message);
    
    // Try alternative: execute statements one by one
    console.log('🔄 Trying alternative approach...');
    const sqlFile = path.join(__dirname, '../prisma/migrations/create_workshop_tables.sql');
    let sql = fs.readFileSync(sqlFile, 'utf-8');
    
    // Remove comments
    sql = sql.replace(/--.*$/gm, '').trim();
    
    // Split by semicolon but keep function definitions together
    const statements = [];
    let currentStatement = '';
    const lines = sql.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      currentStatement += line + '\n';
      
      // Check if this line ends a statement (but not if it's inside a function)
      if (trimmed.endsWith(';') && !currentStatement.includes('CREATE OR REPLACE FUNCTION')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (trimmed.includes('CREATE OR REPLACE FUNCTION') && trimmed.includes('$$')) {
        // Function definition - wait for END
        if (trimmed.includes('END;')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }
    
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].replace(/;+$/, '');
      if (!stmt.trim()) continue;
      
      try {
        await prisma.$executeRawUnsafe(stmt);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate') || err.message.includes('IF NOT EXISTS')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, err.message);
          console.error('Statement:', stmt.substring(0, 100));
          // Continue with other statements
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

createWorkshopTables()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

