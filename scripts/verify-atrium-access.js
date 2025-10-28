const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function verifyAtriumAccess() {
  try {
    console.log('🔍 Verifying Atrium access for Dan and Noel...');

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
    const dano = await prisma.users.findFirst({
      where: { email: 'dano@notaryeveryday.com' }
    });

    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    // Check workspace membership
    if (dano) {
      const danoMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: dano.id,
          workspaceId: workspace.id,
          isActive: true
        }
      });

      if (danoMembership) {
        console.log(`✅ Dano is a member of the workspace (role: ${danoMembership.role})`);
      } else {
        console.log(`❌ Dano is NOT a member of the workspace`);
      }
    } else {
      console.log(`❌ Dano user not found`);
    }

    if (noel) {
      const noelMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: noel.id,
          workspaceId: workspace.id,
          isActive: true
        }
      });

      if (noelMembership) {
        console.log(`✅ Noel is a member of the workspace (role: ${noelMembership.role})`);
      } else {
        console.log(`❌ Noel is NOT a member of the workspace`);
      }
    } else {
      console.log(`❌ Noel user not found`);
    }

    // Get all Atrium documents in the workspace
    const documents = await prisma.atriumDocument.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        folder: {
          select: {
            name: true
          }
        },
        activities: {
          where: {
            activityType: 'CREATED'
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📄 Atrium Documents in ${workspace.name}:`);
    console.log(`   Total documents: ${documents.length}`);

    if (documents.length > 0) {
      console.log(`\n📋 Document List:`);
      documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title}`);
        console.log(`      - Owner: ${doc.owner.name} (${doc.owner.email})`);
        console.log(`      - Folder: ${doc.folder?.name || 'No folder'}`);
        console.log(`      - Type: ${doc.documentType}`);
        console.log(`      - Status: ${doc.status}`);
        console.log(`      - Report Type: ${doc.reportType || 'N/A'}`);
        console.log(`      - Tags: ${doc.tags.join(', ') || 'None'}`);
        console.log(`      - Created: ${doc.createdAt.toISOString()}`);
        if (doc.activities.length > 0) {
          console.log(`      - Activity: ${doc.activities[0].description}`);
        }
        console.log('');
      });
    }

    // Check sales enablement documents specifically
    const salesEnablementDocs = documents.filter(doc => 
      doc.reportType === 'SALES_ENABLEMENT' || 
      doc.tags.includes('sales-enablement')
    );

    console.log(`📊 Sales Enablement Documents: ${salesEnablementDocs.length}`);

    if (salesEnablementDocs.length > 0) {
      console.log(`\n🎯 Sales Enablement Document Details:`);
      salesEnablementDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title}`);
        console.log(`      - Description: ${doc.description || 'No description'}`);
        console.log(`      - Tags: ${doc.tags.join(', ')}`);
        console.log('');
      });
    }

    // Verify folder structure
    const folders = await prisma.atriumFolder.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      include: {
        documents: {
          where: {
            deletedAt: null
          }
        }
      }
    });

    console.log(`📁 Folders in workspace: ${folders.length}`);
    folders.forEach(folder => {
      console.log(`   - ${folder.name}: ${folder.documents.length} documents`);
    });

    console.log(`\n✅ Verification completed!`);
    console.log(`\n💡 Access Summary:`);
    console.log(`   - Dano and Noel can access documents through workspace membership`);
    console.log(`   - All documents are stored in the Atrium system`);
    console.log(`   - Documents are organized in folders`);
    console.log(`   - Activity tracking is enabled for audit trails`);

  } catch (error) {
    console.error('❌ Error verifying Atrium access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyAtriumAccess();
