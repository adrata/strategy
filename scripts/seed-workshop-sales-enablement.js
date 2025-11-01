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

// Sales enablement document metadata
const salesEnablementDocs = [
  {
    filename: '01-sales-process-overview.md',
    title: 'Sales Process Overview',
    description: 'Comprehensive guide to our sales process and methodology',
    tags: ['sales-process', 'methodology', 'overview']
  },
  {
    filename: '02-prospecting-strategies.md',
    title: 'Prospecting Strategies',
    description: 'Effective prospecting techniques and best practices',
    tags: ['prospecting', 'strategies', 'lead-generation']
  },
  {
    filename: '03-discovery-questions.md',
    title: 'Discovery Questions',
    description: 'Key questions to uncover customer needs and pain points',
    tags: ['discovery', 'questions', 'needs-analysis']
  },
  {
    filename: '04-objection-handling.md',
    title: 'Objection Handling',
    description: 'Common objections and proven response strategies',
    tags: ['objections', 'handling', 'responses']
  },
  {
    filename: '05-closing-techniques.md',
    title: 'Closing Techniques',
    description: 'Effective closing strategies and timing',
    tags: ['closing', 'techniques', 'timing']
  },
  {
    filename: '06-product-knowledge.md',
    title: 'Product Knowledge',
    description: 'Comprehensive product information and positioning',
    tags: ['product', 'knowledge', 'positioning']
  },
  {
    filename: '07-demo-wow-moments.md',
    title: 'Demo Wow Moments',
    description: 'Key features and benefits to highlight during demos',
    tags: ['demo', 'features', 'benefits']
  },
  {
    filename: '08-competitive-positioning.md',
    title: 'Competitive Positioning',
    description: 'How to position against competitors effectively',
    tags: ['competitive', 'positioning', 'differentiation']
  },
  {
    filename: '09-pricing-strategies.md',
    title: 'Pricing Strategies',
    description: 'Pricing models and negotiation approaches',
    tags: ['pricing', 'strategies', 'negotiation']
  },
  {
    filename: '10-follow-up-processes.md',
    title: 'Follow-up Processes',
    description: 'Systematic follow-up procedures and best practices',
    tags: ['follow-up', 'processes', 'procedures']
  }
];

async function seedWorkshopSalesEnablement() {
  try {
    console.log('🚀 Starting Workshop sales enablement document seeding...');

    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { slug: 'ne' },
          { slug: 'notary-everyday' }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

    // Find users
    const ryan = await prisma.users.findFirst({
      where: { email: 'ryan@notaryeveryday.com' }
    });

    const dano = await prisma.users.findFirst({
      where: { email: 'dano@notaryeveryday.com' }
    });

    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!ryan) {
      console.log('❌ Ryan user not found');
      return;
    }

    console.log(`✅ Found Ryan: ${ryan.name} (${ryan.id})`);

    // Ensure Dano and Noel are members of the workspace
    if (dano) {
      const danoMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: dano.id,
          workspaceId: workspace.id
        }
      });

      if (!danoMembership) {
        await prisma.workspace_users.create({
          data: {
            userId: dano.id,
            workspaceId: workspace.id,
            role: 'MANAGER',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Added Dano to workspace`);
      } else {
        console.log(`✅ Dano already a member of workspace`);
      }
    }

    if (noel) {
      const noelMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: noel.id,
          workspaceId: workspace.id
        }
      });

      if (!noelMembership) {
        await prisma.workspace_users.create({
          data: {
            userId: noel.id,
            workspaceId: workspace.id,
            role: 'MANAGER',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Added Noel to workspace`);
      } else {
        console.log(`✅ Noel already a member of workspace`);
      }
    }

    // Create a sales enablement folder
    let salesFolder = await prisma.workshopFolder.findFirst({
      where: {
        name: 'Sales Enablement',
        workspaceId: workspace.id
      }
    });

    if (!salesFolder) {
      salesFolder = await prisma.workshopFolder.create({
        data: {
          name: 'Sales Enablement',
          description: 'Sales enablement documents and resources',
          workspaceId: workspace.id,
          ownerId: ryan.id
        }
      });
      console.log(`✅ Created Sales Enablement folder`);
    } else {
      console.log(`✅ Sales Enablement folder already exists`);
    }

    // Seed documents
    let createdCount = 0;
    let skippedCount = 0;

    for (const doc of salesEnablementDocs) {
      // Check if document already exists
      const existing = await prisma.workshopDocument.findFirst({
        where: {
          title: doc.title,
          workspaceId: workspace.id,
          deletedAt: null
        }
      });

      if (existing) {
        console.log(`⏭️  Skipping ${doc.title} - already exists`);
        skippedCount++;
        continue;
      }

      // Read the markdown file
      const filePath = path.join(__dirname, '..', 'docs', 'sales-enablement', doc.filename);
      let content = '';

      try {
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf8');
        } else {
          // Create placeholder content if file doesn't exist
          content = `# ${doc.title}\n\n${doc.description}\n\n---\n\n*This document is a placeholder. Please add the actual content.*`;
        }
      } catch (error) {
        console.log(`⚠️  Could not read ${doc.filename}, using placeholder content`);
        content = `# ${doc.title}\n\n${doc.description}\n\n---\n\n*This document is a placeholder. Please add the actual content.*`;
      }

      // Create the document
      const document = await prisma.workshopDocument.create({
        data: {
          title: doc.title,
          description: doc.description,
          content: {
            markdown: content,
            description: doc.description,
            tags: doc.tags
          },
          documentType: 'paper',
          status: 'published',
          folderId: salesFolder.id,
          tags: doc.tags,
          ownerId: ryan.id,
          workspaceId: workspace.id,
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

      // Create activity record
      await prisma.workshopActivity.create({
        data: {
          documentId: document.id,
          activityType: 'CREATED',
          description: `Created sales enablement document: ${doc.title}`,
          performedById: ryan.id,
          metadata: {
            filename: doc.filename,
            tags: doc.tags
          }
        }
      });

      console.log(`✅ Created document: ${doc.title}`);
      createdCount++;
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Documents created: ${createdCount}`);
    console.log(`   - Documents skipped: ${skippedCount}`);
    console.log(`   - Total documents: ${salesEnablementDocs.length}`);

  } catch (error) {
    console.error('❌ Error seeding Workshop sales enablement documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedWorkshopSalesEnablement();
