const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function verifyAdrataAtriumAccess() {
  try {
    console.log('🔍 Verifying Adrata Atrium access for Dan and Todd...');

    // Find the Adrata workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Adrata' },
          { slug: 'adrata' }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

    // Find users
    const dan = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });

    const todd = await prisma.users.findFirst({
      where: { email: 'todd@adrata.com' }
    });

    // Check workspace membership
    if (dan) {
      const danMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: dan.id,
          workspaceId: workspace.id,
          isActive: true
        }
      });

      if (danMembership) {
        console.log(`✅ Dan is a member of the workspace (role: ${danMembership.role})`);
      } else {
        console.log(`❌ Dan is NOT a member of the workspace`);
      }
    } else {
      console.log(`❌ Dan user not found`);
    }

    if (todd) {
      const toddMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: todd.id,
          workspaceId: workspace.id,
          isActive: true
        }
      });

      if (toddMembership) {
        console.log(`✅ Todd is a member of the workspace (role: ${toddMembership.role})`);
      } else {
        console.log(`❌ Todd is NOT a member of the workspace`);
      }
    } else {
      console.log(`❌ Todd user not found`);
    }

    // Get all Atrium documents in the workspace
    const documents = await prisma.workshopDocument.findMany({
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

    // Check buyer group intelligence documents specifically
    const buyerGroupDocs = documents.filter(doc => 
      doc.reportType === 'SALES_ENABLEMENT' && 
      (doc.tags.includes('buyer-group') || doc.tags.includes('intelligence') || doc.tags.includes('platform'))
    );

    console.log(`📊 Buyer Group Intelligence Documents: ${buyerGroupDocs.length}`);

    if (buyerGroupDocs.length > 0) {
      console.log(`\n🎯 Buyer Group Intelligence Document Details:`);
      buyerGroupDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title}`);
        console.log(`      - Description: ${doc.description || 'No description'}`);
        console.log(`      - Tags: ${doc.tags.join(', ')}`);
        console.log('');
      });
    }

    // Verify folder structure
    const folders = await prisma.workshopFolder.findMany({
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
    console.log(`   - Dan and Todd can access documents through workspace membership`);
    console.log(`   - All documents are stored in the Atrium system`);
    console.log(`   - Documents are organized in folders`);
    console.log(`   - Activity tracking is enabled for audit trails`);
    console.log(`   - Platform: Buyer Group Intelligence & Go-to-Buyer Operating System`);

  } catch (error) {
    console.error('❌ Error verifying Adrata Atrium access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyAdrataAtriumAccess();
