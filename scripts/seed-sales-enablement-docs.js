#!/usr/bin/env node

/**
 * Seed Sales Enablement Documents into Atrium
 * 
 * This script creates all 7 sales enablement documents in the Atrium system
 * for the Notary Everyday workspace.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const NOTARY_EVERYDAY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

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
    description: 'Validation elements that generate interest through proof and authority',
    tags: ['sales', 'enablement', 'social-proof', 'credibility']
  },
  {
    filename: '07-demo-wow-moments.md',
    title: 'Demo Hooks & Wow Moments',
    description: 'Features that generate excitement and move prospects from "cool" to "I NEED this"',
    tags: ['sales', 'enablement', 'demo', 'features']
  }
];

async function seedDocuments() {
  try {
    console.log('🚀 Starting sales enablement document seeding...\n');

    // Find Ryan (the main user for Notary Everyday)
    const ryan = await prisma.users.findFirst({
      where: {
        email: 'ryan@notaryeveryday.com'
      }
    });

    if (!ryan) {
      console.error('❌ Ryan user not found. Please ensure ryan@notaryeveryday.com exists.');
      process.exit(1);
    }

    console.log(`✅ Found user: ${ryan.name} (${ryan.email})\n`);

    // Verify workspace exists
    const workspace = await prisma.workspaces.findUnique({
      where: { id: NOTARY_EVERYDAY_WORKSPACE_ID }
    });

    if (!workspace) {
      console.error('❌ Notary Everyday workspace not found.');
      process.exit(1);
    }

    console.log(`✅ Found workspace: ${workspace.name}\n`);

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
            workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
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
            workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
            createdById: ryan.id,
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
        await prisma.workshopActivity.create({
          data: {
            documentId: document.id,
            activityType: 'CREATED',
            description: 'Sales enablement document created',
            metadata: {
              category: 'sales-enablement',
              tags: doc.tags
            },
            performedById: ryan.id
          }
        });

        console.log(`   ✅ Created document: ${document.id}`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error processing ${doc.title}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully created: ${successCount} documents`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📚 Total documents: ${documents.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Sales enablement documents are now available in Atrium!');
      console.log('   Users can access them from the Atrium interface.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  seedDocuments().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { seedDocuments };

