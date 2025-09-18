#!/usr/bin/env node
/**
 * Database Export Script
 * Exports current database to JSON and CSV formats
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function exportDatabase() {
  try {
    console.log('📤 EXPORTING DATABASE...');
    
    const exportDir = path.join(__dirname, 'backup_2025-09-18');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Export companies to CSV
    const companies = await prisma.companies.findMany();
    if (companies.length > 0) {
      const csvHeader = Object.keys(companies[0]).join(',');
      const csvRows = companies.map(company => 
        Object.values(company).map(value => {
          if (value === null) return '';
          if (Array.isArray(value)) return JSON.stringify(value);
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(path.join(exportDir, 'companies_export.csv'), csvContent);
      console.log(`✅ Exported ${companies.length} companies to CSV`);
    }
    
    // Export people to CSV
    const people = await prisma.people.findMany();
    if (people.length > 0) {
      const csvHeader = Object.keys(people[0]).join(',');
      const csvRows = people.map(person => 
        Object.values(person).map(value => {
          if (value === null) return '';
          if (Array.isArray(value)) return JSON.stringify(value);
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(path.join(exportDir, 'people_export.csv'), csvContent);
      console.log(`✅ Exported ${people.length} people to CSV`);
    }
    
    // Export workspaces to CSV
    const workspaces = await prisma.workspaces.findMany();
    if (workspaces.length > 0) {
      const csvHeader = Object.keys(workspaces[0]).join(',');
      const csvRows = workspaces.map(workspace => 
        Object.values(workspace).map(value => {
          if (value === null) return '';
          if (Array.isArray(value)) return JSON.stringify(value);
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(path.join(exportDir, 'workspaces_export.csv'), csvContent);
      console.log(`✅ Exported ${workspaces.length} workspaces to CSV`);
    }
    
    // Export users to CSV
    const users = await prisma.users.findMany();
    if (users.length > 0) {
      const csvHeader = Object.keys(users[0]).join(',');
      const csvRows = users.map(user => 
        Object.values(user).map(value => {
          if (value === null) return '';
          if (Array.isArray(value)) return JSON.stringify(value);
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value;
        }).join(',')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(path.join(exportDir, 'users_export.csv'), csvContent);
      console.log(`✅ Exported ${users.length} users to CSV`);
    }
    
    console.log(`\n📁 Export completed in: ${exportDir}`);
    console.log('\n📋 EXPORT SUMMARY:');
    console.log(`  Workspaces: ${workspaces.length}`);
    console.log(`  Users: ${users.length}`);
    console.log(`  Companies: ${companies.length}`);
    console.log(`  People: ${people.length}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();
