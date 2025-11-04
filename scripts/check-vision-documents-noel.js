#!/usr/bin/env node

/**
 * CHECK VISION DOCUMENTS FOR NOEL IN NOTARY EVERYDAY
 * 
 * Checks what vision documents exist and if Noel can see them
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVisionDocuments() {
  try {
    console.log('🔍 Checking vision documents for Notary Everyday workspace...\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: 'notary-everyday' }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Find Noel
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!noel) {
      console.log('❌ Noel user not found!');
      return;
    }

    console.log(`✅ Found Noel: ${noel.name} (${noel.email})\n`);

    // Check all vision documents in the workspace
    console.log('📄 Checking vision documents (papers and pitches)...');
    const documents = await prisma.workshopDocument.findMany({
      where: {
        workspaceId: workspace.id,
        documentType: {
          in: ['paper', 'pitch']
        },
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        description: true,
        documentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`\n📊 Found ${documents.length} vision documents:\n`);
    
    if (documents.length === 0) {
      console.log('❌ No vision documents found in the workspace!');
      console.log('\n💡 You may need to create the documents using the create-notary-growth-strategy-documents.js script.\n');
    } else {
      documents.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title}`);
        console.log(`   Type: ${doc.documentType}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Owner: ${doc.owner?.name || 'Unknown'} (${doc.owner?.email || 'N/A'})`);
        console.log(`   Created: ${doc.createdAt.toLocaleString()}`);
        console.log(`   ID: ${doc.id}`);
        console.log('');
      });
    }

    // Check Noel's workspace membership
    console.log('👤 Checking Noel\'s workspace access...');
    const membership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: noel.id
      }
    });

    if (membership) {
      console.log(`✅ Noel is a member with role: ${membership.role}`);
      console.log(`   Active: ${membership.isActive ? 'Yes' : 'No'}\n`);
    } else {
      console.log('❌ Noel is NOT a member of the workspace!\n');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Workspace: ${workspace.name}`);
    console.log(`Documents found: ${documents.length}`);
    console.log(`Noel's access: ${membership ? 'Yes (' + membership.role + ')' : 'No'}`);
    
    if (documents.length === 0) {
      console.log('\n⚠️  No documents found. You may need to run:');
      console.log('   node scripts/create-notary-growth-strategy-documents.js');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkVisionDocuments();

