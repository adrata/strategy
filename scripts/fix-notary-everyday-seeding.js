#!/usr/bin/env node

/**
 * Fix Notary Everyday Seeding Script
 * 
 * This script fixes the workspace creation issue and ensures proper access
 * for Dan and Noel to the Notary Everyday workspace and documents.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// User emails to ensure access
const USERS_TO_GRANT_ACCESS = [
  'ryan@notaryeveryday.com',
  'dan@adrata.com', 
  'noel@adrata.com'
];

async function fixNotaryEverydaySeeding() {
  try {
    console.log('🔧 Fixing Notary Everyday seeding...\n');

    // 1. Find or create the Notary Everyday workspace
    console.log('📋 STEP 1: Finding/Creating Notary Everyday workspace...');
    
    let workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { slug: 'notary-everyday' },
          { slug: 'ne' }
        ]
      }
    });

    if (!workspace) {
      console.log('🏗️ Creating Notary Everyday workspace...');
      workspace = await prisma.workspaces.create({
        data: {
          name: 'Notary Everyday',
          slug: 'notary-everyday',
          description: 'Notary Everyday title company workspace',
          timezone: 'America/New_York',
          industry: 'Real Estate',
          businessModel: 'B2B SaaS',
          enabledFeatures: ['atrium', 'stacks', 'oasis', 'actions']
        }
      });
      console.log(`✅ Created workspace: ${workspace.name} (${workspace.id})`);
    } else {
      console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    }

    // 2. Find and verify users
    console.log('\n👥 STEP 2: Finding and verifying users...');
    
    const users = [];
    for (const email of USERS_TO_GRANT_ACCESS) {
      let user = await prisma.users.findFirst({
        where: { email }
      });

      if (!user) {
        console.log(`⚠️  User not found: ${email}`);
        continue;
      }

      console.log(`✅ Found user: ${user.name} (${user.email})`);
      users.push(user);
    }

    if (users.length === 0) {
      throw new Error('No users found! Please create users first.');
    }

    // 3. Ensure workspace access for all users
    console.log('\n🔐 STEP 3: Ensuring workspace access...');
    
    for (const user of users) {
      // Check if user already has access
      const existingAccess = await prisma.workspace_users.findFirst({
        where: {
          userId: user.id,
          workspaceId: workspace.id
        }
      });

      if (!existingAccess) {
        await prisma.workspace_users.create({
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            role: 'MEMBER',
            permissions: ['READ', 'WRITE', 'ADMIN']
          }
        });
        console.log(`✅ Granted access to ${user.name}`);
      } else {
        console.log(`ℹ️  ${user.name} already has access`);
      }
    }

    // 4. Seed sales enablement documents
    console.log('\n📄 STEP 4: Seeding sales enablement documents...');
    
    const documents = [
      {
        filename: '01-interest-building-framework.md',
        title: 'Interest-Building Framework: 5 Proven Approaches',
        description: 'Five different entry points to build interest based on where your prospect is mentally',
        tags: ['sales', 'enablement', 'interest-building', 'frameworks']
      },
      {
        filename: '02-pain-point-solution-playbook.md',
        title: 'Pain Point → Solution Playbook',
        description: 'Map common title company challenges to Notary Everyday solutions with deal-closing language',
        tags: ['sales', 'enablement', 'pain-points', 'solutions']
      },
      {
        filename: '03-conversation-starters.md',
        title: 'Conversation Starters & Entry Points',
        description: 'Open any conversation with confidence - templates for every scenario',
        tags: ['sales', 'enablement', 'conversation-starters', 'templates']
      },
      {
        filename: '04-storytelling-guide.md',
        title: 'Storytelling Guide: Before/After Scenarios',
        description: 'Stories that build interest and help prospects see themselves in the transformation',
        tags: ['sales', 'enablement', 'storytelling', 'case-studies']
      },
      {
        filename: '05-discovery-questions.md',
        title: 'Discovery Question Frameworks',
        description: 'Questions that uncover needs and build momentum - make prospects sell themselves',
        tags: ['sales', 'enablement', 'discovery', 'questions']
      },
      {
        filename: '06-social-proof-credibility.md',
        title: 'Social Proof & Credibility Builders',
        description: 'Leverage testimonials, case studies, and industry recognition to build trust',
        tags: ['sales', 'enablement', 'social-proof', 'credibility']
      },
      {
        filename: '07-demo-wow-moments.md',
        title: 'Demo Hooks & Wow Moments',
        description: 'Key features and benefits to highlight during demos that create excitement',
        tags: ['sales', 'enablement', 'demo', 'wow-moments']
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      try {
        console.log(`📄 Processing: ${doc.title}...`);

        // Read the markdown file
        const filePath = path.join(__dirname, '..', 'docs', 'sales-enablement', doc.filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`   ⚠️  File not found: ${filePath}`);
          errorCount++;
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if document already exists
        const existing = await prisma.workshopDocument.findFirst({
          where: {
            title: doc.title,
            workspaceId: workspace.id,
            deletedAt: null
          }
        });

        if (existing) {
          console.log(`   ℹ️  Document already exists, skipping...`);
          continue;
        }

        // Create the document
        const document = await prisma.workshopDocument.create({
          data: {
            title: doc.title,
            content: {
              markdown: content,
              description: doc.description,
              tags: doc.tags
            },
            type: 'PAPER',
            workspaceId: workspace.id,
            createdById: users[0].id, // Use first user as creator
            reportType: 'SALES_ENABLEMENT',
            sourceRecordType: 'ENABLEMENT',
            generatedByAI: false,
            metadata: {
              category: 'sales-enablement',
              tags: doc.tags,
              filename: doc.filename,
              createdAt: new Date().toISOString()
            }
          }
        });

        // Create activity log
        await prisma.audit_logs.create({
          data: {
            workspaceId: workspace.id,
            userId: users[0].id,
            action: 'DOCUMENT_CREATED',
            entityType: 'ATRIUM_DOCUMENT',
            entityId: document.id,
            details: {
              title: doc.title,
              type: 'SALES_ENABLEMENT'
            }
          }
        });

        console.log(`   ✅ Created document: ${document.id}`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error creating document: ${error.message}`);
        errorCount++;
      }
    }

    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);
    console.log(`✅ Users with access: ${users.length}`);
    console.log(`✅ Documents created: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    console.log('\n🎉 Notary Everyday workspace setup complete!');
    console.log('Dan and Noel now have access to all sales enablement documents.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixNotaryEverydaySeeding();
}

module.exports = { fixNotaryEverydaySeeding };
