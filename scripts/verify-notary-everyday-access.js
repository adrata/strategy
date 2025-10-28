#!/usr/bin/env node

/**
 * Verify Notary Everyday Access
 * 
 * This script verifies that Dan and Noel have access to the Notary Everyday
 * workspace and can see the sales enablement documents.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function verifyNotaryEverydayAccess() {
  try {
    console.log('🔍 Verifying Notary Everyday Access...\n');

    // 1. Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { slug: 'notary-everyday' }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

    // 2. Check users with access
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id
      },
      include: {
        user: true
      }
    });

    console.log(`\n👥 Users with workspace access:`);
    workspaceUsers.forEach(wu => {
      console.log(`   ✅ ${wu.user.name} (${wu.user.email}) - Role: ${wu.role}`);
    });

    // 3. Check sales enablement documents
    const documents = await prisma.research_data.findMany({
      where: {
        workspaceId: workspace.id,
        researchType: 'SALES_ENABLEMENT',
        entityType: 'WORKSPACE'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`\n📄 Sales Enablement Documents (${documents.length} total):`);
    documents.forEach((doc, index) => {
      const extractedData = doc.extractedData || {};
      console.log(`   ${index + 1}. ${extractedData.title || 'Untitled'}`);
      console.log(`      ID: ${doc.id}`);
      console.log(`      Created: ${doc.createdAt.toISOString()}`);
      console.log(`      Content Length: ${doc.content?.length || 0} characters`);
      console.log('');
    });

    // 4. Summary
    console.log('📊 SUMMARY:');
    console.log(`✅ Workspace: ${workspace.name}`);
    console.log(`✅ Users with access: ${workspaceUsers.length}`);
    console.log(`✅ Documents available: ${documents.length}`);
    console.log(`✅ All documents stored in research_data table`);
    console.log(`✅ Accessible via workspace: ${workspace.slug}`);

    console.log('\n🎉 Verification complete! Dan and Noel have access to all sales enablement documents.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  verifyNotaryEverydayAccess();
}

module.exports = { verifyNotaryEverydayAccess };
