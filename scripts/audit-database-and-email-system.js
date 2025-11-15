#!/usr/bin/env node

/**
 * Database and Email System Audit
 * 
 * Audits:
 * 1. Database schema consistency (schema.prisma vs schema-streamlined.prisma)
 * 2. Prisma client generation status
 * 3. Database connection and table existence
 * 4. Email sync system configuration
 * 5. Email linking and sync status
 * 
 * Usage:
 *   node scripts/audit-database-and-email-system.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

class DatabaseAndEmailAudit {
  constructor() {
    this.results = {
      schema: {
        mainSchemaExists: false,
        streamlinedSchemaExists: false,
        schemasMatch: false,
        activeSchema: null,
        differences: []
      },
      database: {
        connected: false,
        tables: [],
        missingTables: [],
        foreignKeys: [],
        indexes: []
      },
      emailSync: {
        connections: [],
        emailCounts: {},
        linkingStatus: {},
        syncStatus: {}
      },
      errors: []
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('DATABASE AND EMAIL SYSTEM AUDIT', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      // Step 1: Audit Schemas
      await this.auditSchemas();

      // Step 2: Audit Database Connection and Tables
      await this.auditDatabase();

      // Step 3: Audit Email Sync System
      await this.auditEmailSyncSystem();

      // Step 4: Generate Report
      this.generateReport();

    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  // Step 1: Audit Schemas
  async auditSchemas() {
    this.log('Step 1: Auditing Prisma Schemas', 'info');
    this.log('-'.repeat(70), 'info');

    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const streamlinedPath = path.join(process.cwd(), 'prisma', 'schema-streamlined.prisma');

    // Check if schemas exist
    this.results.schema.mainSchemaExists = fs.existsSync(schemaPath);
    this.results.schema.streamlinedSchemaExists = fs.existsSync(streamlinedPath);

    if (this.results.schema.mainSchemaExists) {
      this.log(`Main schema exists: schema.prisma`, 'success');
    } else {
      this.log(`Main schema missing: schema.prisma`, 'error');
    }

    if (this.results.schema.streamlinedSchemaExists) {
      this.log(`Streamlined schema exists: schema-streamlined.prisma`, 'success');
    } else {
      this.log(`Streamlined schema missing: schema-streamlined.prisma`, 'warn');
    }

    // Determine which schema is active (check package.json or prisma config)
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      const prismaScripts = packageJson.scripts || {};
      
      // Check for schema references in scripts
      for (const [scriptName, script] of Object.entries(prismaScripts)) {
        if (script.includes('schema.prisma')) {
          this.results.schema.activeSchema = 'schema.prisma';
          break;
        } else if (script.includes('schema-streamlined.prisma')) {
          this.results.schema.activeSchema = 'schema-streamlined.prisma';
          break;
        }
      }

      // Default to main schema if not specified
      if (!this.results.schema.activeSchema) {
        this.results.schema.activeSchema = 'schema.prisma';
      }

      this.log(`Active schema: ${this.results.schema.activeSchema}`, 'info');
    } catch (error) {
      this.log(`Could not determine active schema: ${error.message}`, 'warn');
      this.results.schema.activeSchema = 'schema.prisma'; // Default
    }

    // Compare schemas if both exist
    if (this.results.schema.mainSchemaExists && this.results.schema.streamlinedSchemaExists) {
      const mainSchema = fs.readFileSync(schemaPath, 'utf8');
      const streamlinedSchema = fs.readFileSync(streamlinedPath, 'utf8');

      // Extract model names from both schemas
      const mainModels = mainSchema.match(/^model\s+(\w+)/gm)?.map(m => m.replace(/^model\s+/, '')) || [];
      const streamlinedModels = streamlinedSchema.match(/^model\s+(\w+)/gm)?.map(m => m.replace(/^model\s+/, '')) || [];

      const mainModelSet = new Set(mainModels);
      const streamlinedModelSet = new Set(streamlinedModels);

      // Find differences
      const onlyInMain = mainModels.filter(m => !streamlinedModelSet.has(m));
      const onlyInStreamlined = streamlinedModels.filter(m => !mainModelSet.has(m));

      if (onlyInMain.length > 0) {
        this.log(`Models only in main schema: ${onlyInMain.join(', ')}`, 'warn');
        this.results.schema.differences.push({
          type: 'models_only_in_main',
          models: onlyInMain
        });
      }

      if (onlyInStreamlined.length > 0) {
        this.log(`Models only in streamlined schema: ${onlyInStreamlined.join(', ')}`, 'warn');
        this.results.schema.differences.push({
          type: 'models_only_in_streamlined',
          models: onlyInStreamlined
        });
      }

      if (onlyInMain.length === 0 && onlyInStreamlined.length === 0) {
        this.log(`Schemas have same models`, 'success');
        this.results.schema.schemasMatch = true;
      } else {
        this.log(`Schemas have differences`, 'warn');
        this.results.schema.schemasMatch = false;
      }

      this.log(`Main schema: ${mainModels.length} models`, 'info');
      this.log(`Streamlined schema: ${streamlinedModels.length} models`, 'info');
    }

    this.log('', 'info');
  }

  // Step 2: Audit Database
  async auditDatabase() {
    this.log('Step 2: Auditing Database Connection and Tables', 'info');
    this.log('-'.repeat(70), 'info');

    try {
      // Test connection
      await prisma.$queryRaw`SELECT 1`;
      this.results.database.connected = true;
      this.log('Database connection: SUCCESS', 'success');

      // Get all tables from database
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      this.results.database.tables = tables.map(t => t.table_name);
      this.log(`Found ${this.results.database.tables.length} tables in database`, 'info');

      // Check for key tables from schema
      const keyTables = [
        'workspaces', 'users', 'workspace_users', 'companies', 'people',
        'actions', 'email_messages', 'grand_central_connections',
        'person_co_sellers', 'reminders', 'documents', 'meeting_transcripts'
      ];

      const missingTables = keyTables.filter(table => !this.results.database.tables.includes(table));
      
      if (missingTables.length > 0) {
        this.log(`Missing key tables: ${missingTables.join(', ')}`, 'error');
        this.results.database.missingTables = missingTables;
      } else {
        this.log('All key tables exist', 'success');
      }

      // Check foreign key constraints
      const foreignKeys = await prisma.$queryRaw`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `;

      this.results.database.foreignKeys = foreignKeys;
      this.log(`Found ${foreignKeys.length} foreign key constraints`, 'info');

      // Check indexes
      const indexes = await prisma.$queryRaw`
        SELECT
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;

      this.results.database.indexes = indexes;
      this.log(`Found ${indexes.length} indexes`, 'info');

    } catch (error) {
      this.log(`Database audit failed: ${error.message}`, 'error');
      this.results.database.connected = false;
      this.results.errors.push({ type: 'database', error: error.message });
    }

    this.log('', 'info');
  }

  // Step 3: Audit Email Sync System
  async auditEmailSyncSystem() {
    this.log('Step 3: Auditing Email Sync System', 'info');
    this.log('-'.repeat(70), 'info');

    try {
      // Get all email connections
      const connections = await prisma.grand_central_connections.findMany({
        where: {
          provider: { in: ['outlook', 'gmail'] },
          status: 'active'
        },
        include: {
          workspace: {
            select: { id: true, name: true, slug: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      this.results.emailSync.connections = connections.map(c => ({
        id: c.id,
        provider: c.provider,
        workspaceId: c.workspaceId,
        workspaceName: c.workspace.name,
        userId: c.userId,
        userName: c.user.name,
        lastSyncAt: c.lastSyncAt,
        nangoConnectionId: c.nangoConnectionId
      }));

      this.log(`Found ${connections.length} active email connections`, 'info');

      // Get email counts per workspace
      const workspaces = await prisma.workspaces.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true }
      });

      for (const workspace of workspaces) {
        const emailCount = await prisma.email_messages.count({
          where: { workspaceId: workspace.id }
        });

        const linkedEmailCount = await prisma.email_messages.count({
          where: {
            workspaceId: workspace.id,
            OR: [
              { companyId: { not: null } },
              { personId: { not: null } }
            ]
          }
        });

        const unlinkedEmailCount = emailCount - linkedEmailCount;

        this.results.emailSync.emailCounts[workspace.id] = {
          workspaceName: workspace.name,
          total: emailCount,
          linked: linkedEmailCount,
          unlinked: unlinkedEmailCount,
          linkPercentage: emailCount > 0 ? ((linkedEmailCount / emailCount) * 100).toFixed(2) : 0
        };
      }

      // Check email linking status
      for (const workspace of workspaces) {
        const emailsWithCompany = await prisma.email_messages.count({
          where: {
            workspaceId: workspace.id,
            companyId: { not: null }
          }
        });

        const emailsWithPerson = await prisma.email_messages.count({
          where: {
            workspaceId: workspace.id,
            personId: { not: null }
          }
        });

        const emailsWithBoth = await prisma.email_messages.count({
          where: {
            workspaceId: workspace.id,
            companyId: { not: null },
            personId: { not: null }
          }
        });

        this.results.emailSync.linkingStatus[workspace.id] = {
          workspaceName: workspace.name,
          withCompany: emailsWithCompany,
          withPerson: emailsWithPerson,
          withBoth: emailsWithBoth
        };
      }

      // Check sync status for each connection
      for (const connection of connections) {
        const recentEmails = await prisma.email_messages.count({
          where: {
            workspaceId: connection.workspaceId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        });

        this.results.emailSync.syncStatus[connection.id] = {
          connectionId: connection.nangoConnectionId,
          provider: connection.provider,
          workspaceId: connection.workspaceId,
          lastSyncAt: connection.lastSyncAt,
          recentEmails: recentEmails,
          daysSinceLastSync: connection.lastSyncAt 
            ? Math.floor((Date.now() - new Date(connection.lastSyncAt).getTime()) / (1000 * 60 * 60 * 24))
            : null
        };
      }

      // Display summary
      this.log('Email Counts by Workspace:', 'info');
      for (const [workspaceId, counts] of Object.entries(this.results.emailSync.emailCounts)) {
        this.log(`  ${counts.workspaceName}: ${counts.total} total, ${counts.linked} linked (${counts.linkPercentage}%)`, 'info');
      }

      this.log('', 'info');
      this.log('Email Connections:', 'info');
      for (const conn of this.results.emailSync.connections) {
        const syncStatus = this.results.emailSync.syncStatus[Object.keys(this.results.emailSync.syncStatus).find(k => 
          this.results.emailSync.connections.find(c => c.id === k)?.nangoConnectionId === conn.nangoConnectionId
        )] || {};
        
        const daysSince = syncStatus.daysSinceLastSync !== null ? `${syncStatus.daysSinceLastSync} days ago` : 'Never';
        this.log(`  ${conn.workspaceName} - ${conn.provider} (${conn.userName}): Last sync ${daysSince}`, 'info');
      }

    } catch (error) {
      this.log(`Email sync audit failed: ${error.message}`, 'error');
      this.results.errors.push({ type: 'email_sync', error: error.message });
    }

    this.log('', 'info');
  }

  // Step 4: Generate Report
  generateReport() {
    this.log('='.repeat(70), 'info');
    this.log('AUDIT SUMMARY', 'info');
    this.log('='.repeat(70), 'info');

    // Schema Status
    this.log('', 'info');
    this.log('SCHEMA STATUS:', 'info');
    this.log(`  Main schema exists: ${this.results.schema.mainSchemaExists ? 'YES' : 'NO'}`, 'info');
    this.log(`  Streamlined schema exists: ${this.results.schema.streamlinedSchemaExists ? 'YES' : 'NO'}`, 'info');
    this.log(`  Active schema: ${this.results.schema.activeSchema || 'UNKNOWN'}`, 'info');
    this.log(`  Schemas match: ${this.results.schema.schemasMatch ? 'YES' : 'NO'}`, 'info');
    
    if (this.results.schema.differences.length > 0) {
      this.log('  Differences found:', 'warn');
      this.results.schema.differences.forEach(diff => {
        this.log(`    - ${diff.type}: ${diff.models.join(', ')}`, 'warn');
      });
    }

    // Database Status
    this.log('', 'info');
    this.log('DATABASE STATUS:', 'info');
    this.log(`  Connected: ${this.results.database.connected ? 'YES' : 'NO'}`, 'info');
    this.log(`  Tables: ${this.results.database.tables.length}`, 'info');
    this.log(`  Foreign keys: ${this.results.database.foreignKeys.length}`, 'info');
    this.log(`  Indexes: ${this.results.database.indexes.length}`, 'info');
    
    if (this.results.database.missingTables.length > 0) {
      this.log(`  Missing tables: ${this.results.database.missingTables.join(', ')}`, 'error');
    }

    // Email Sync Status
    this.log('', 'info');
    this.log('EMAIL SYNC STATUS:', 'info');
    this.log(`  Active connections: ${this.results.emailSync.connections.length}`, 'info');
    
    const totalEmails = Object.values(this.results.emailSync.emailCounts).reduce((sum, c) => sum + c.total, 0);
    const totalLinked = Object.values(this.results.emailSync.emailCounts).reduce((sum, c) => sum + c.linked, 0);
    const overallLinkPercentage = totalEmails > 0 ? ((totalLinked / totalEmails) * 100).toFixed(2) : 0;
    
    this.log(`  Total emails: ${totalEmails}`, 'info');
    this.log(`  Linked emails: ${totalLinked} (${overallLinkPercentage}%)`, 'info');

    // Errors
    if (this.results.errors.length > 0) {
      this.log('', 'info');
      this.log('ERRORS:', 'error');
      this.results.errors.forEach(err => {
        this.log(`  ${err.type}: ${err.error}`, 'error');
      });
    }

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('Audit complete', 'success');
  }
}

// Main execution
async function main() {
  const audit = new DatabaseAndEmailAudit();
  
  try {
    await audit.execute();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseAndEmailAudit;

