#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * Verifies that all new tables and relations are properly set up
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verifying Database Schema...\n');

  try {
    // 1. Verify meeting_transcripts table exists
    console.log('1. Checking meeting_transcripts table...');
    try {
      const transcriptCount = await prisma.meeting_transcripts.count();
      console.log(`   ✅ meeting_transcripts table exists (${transcriptCount} records)`);
    } catch (error) {
      console.log(`   ❌ meeting_transcripts table missing or inaccessible`);
      console.log(`      Error: ${error.message}`);
    }

    // 2. Verify documents table exists
    console.log('\n2. Checking documents table...');
    try {
      const documentCount = await prisma.documents.count();
      console.log(`   ✅ documents table exists (${documentCount} records)`);
    } catch (error) {
      console.log(`   ❌ documents table missing or inaccessible`);
      console.log(`      Error: ${error.message}`);
    }

    // 3. Verify grand_central_connections table exists
    console.log('\n3. Checking grand_central_connections table...');
    try {
      const connectionCount = await prisma.grand_central_connections.count();
      console.log(`   ✅ grand_central_connections table exists (${connectionCount} records)`);
    } catch (error) {
      console.log(`   ❌ grand_central_connections table missing`);
      console.log(`      Error: ${error.message}`);
    }

    // 4. Verify actions table exists and has proper types
    console.log('\n4. Checking actions table...');
    try {
      const actionsCount = await prisma.actions.count();
      console.log(`   ✅ actions table exists (${actionsCount} records)`);

      // Check for meeting types
      const meetingTypes = [
        'discovery_meeting',
        'demo_meeting',
        'proposal_meeting',
        'closing_meeting',
      ];

      for (const type of meetingTypes) {
        const count = await prisma.actions.count({
          where: { type }
        });
        console.log(`      • ${type}: ${count} records`);
      }
    } catch (error) {
      console.log(`   ❌ actions table issue`);
      console.log(`      Error: ${error.message}`);
    }

    // 5. Test creating a document
    console.log('\n5. Testing document creation...');
    try {
      // Get first workspace for testing
      const workspace = await prisma.workspaces.findFirst();
      const user = await prisma.users.findFirst({ where: { activeWorkspaceId: workspace?.id } });
      const company = await prisma.companies.findFirst({ where: { workspaceId: workspace?.id } });

      if (workspace && user && company) {
        const testDoc = await prisma.documents.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            companyId: company.id,
            documentType: 'proposal',
            title: 'Test Document - Safe to Delete',
            status: 'draft',
          },
        });

        console.log(`   ✅ Document creation successful (ID: ${testDoc.id})`);

        // Clean up test document
        await prisma.documents.delete({ where: { id: testDoc.id } });
        console.log(`   ✅ Test document cleaned up`);
      } else {
        console.log(`   ⚠️  Skipped (no test data available)`);
      }
    } catch (error) {
      console.log(`   ❌ Document creation failed`);
      console.log(`      Error: ${error.message}`);
      console.log(`      Note: Run migration if tables don't exist yet`);
    }

    // 6. Test creating a meeting transcript
    console.log('\n6. Testing meeting transcript creation...');
    try {
      const workspace = await prisma.workspaces.findFirst();
      const user = await prisma.users.findFirst({ where: { activeWorkspaceId: workspace?.id } });
      const company = await prisma.companies.findFirst({ where: { workspaceId: workspace?.id } });
      const connection = await prisma.grand_central_connections.findFirst({ 
        where: { workspaceId: workspace?.id } 
      });

      if (workspace && user && company && connection) {
        const testTranscript = await prisma.meeting_transcripts.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            connectionId: connection.id,
            provider: 'test',
            externalMeetingId: `test-${Date.now()}`,
            meetingTitle: 'Test Meeting - Safe to Delete',
            linkedCompanyId: company.id,
          },
        });

        console.log(`   ✅ Meeting transcript creation successful (ID: ${testTranscript.id})`);

        // Clean up
        await prisma.meeting_transcripts.delete({ where: { id: testTranscript.id } });
        console.log(`   ✅ Test transcript cleaned up`);
      } else {
        console.log(`   ⚠️  Skipped (no test data or connections available)`);
      }
    } catch (error) {
      console.log(`   ❌ Meeting transcript creation failed`);
      console.log(`      Error: ${error.message}`);
      console.log(`      Note: Run migration if tables don't exist yet`);
    }

    // 7. Verify relations work
    console.log('\n7. Verifying relations...');
    try {
      const workspace = await prisma.workspaces.findFirst({
        include: {
          meeting_transcripts: { take: 1 },
          documents: { take: 1 },
        },
      });

      console.log(`   ✅ Workspace relations work`);
      console.log(`      • meeting_transcripts relation: ✅`);
      console.log(`      • documents relation: ✅`);
    } catch (error) {
      console.log(`   ❌ Relation query failed`);
      console.log(`      Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Database schema verification complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifySchema().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

