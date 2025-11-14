#!/usr/bin/env node

/**
 * Workspace Context Verification Script
 * 
 * Verifies that workspace IDs match between:
 * - URL workspace slug (top-temp)
 * - Minnesota Power company record
 * - People records
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MINNESOTA_POWER_ID = '01K9QD382T5FKBSF0AS72RAFAT';
const URL_WORKSPACE_SLUG = 'top-temp';

async function verifyWorkspaceContext() {
  console.log('\n🔍 Workspace Context Verification');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Find the workspace by slug
    console.log(`\n📋 Step 1: Finding workspace with slug "${URL_WORKSPACE_SLUG}"...`);
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        slug: URL_WORKSPACE_SLUG
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });
    
    if (!workspace) {
      console.log(`\n❌ ERROR: No workspace found with slug "${URL_WORKSPACE_SLUG}"!`);
      console.log('\nThis is a CRITICAL issue - the URL workspace does not exist.');
      return;
    }
    
    console.log(`\n✅ Found workspace:`);
    console.log(`   ID: ${workspace.id}`);
    console.log(`   Name: ${workspace.name}`);
    console.log(`   Slug: ${workspace.slug}`);
    
    const urlWorkspaceId = workspace.id;
    
    // Step 2: Get Minnesota Power company workspace
    console.log(`\n📋 Step 2: Checking Minnesota Power company workspace...`);
    
    const company = await prisma.companies.findUnique({
      where: { id: MINNESOTA_POWER_ID },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
    
    if (!company) {
      console.log(`\n❌ ERROR: Minnesota Power company not found!`);
      return;
    }
    
    console.log(`\n✅ Found company:`);
    console.log(`   ID: ${company.id}`);
    console.log(`   Name: ${company.name}`);
    console.log(`   WorkspaceId: ${company.workspaceId}`);
    if (company.workspace) {
      console.log(`   Workspace Name: ${company.workspace.name}`);
      console.log(`   Workspace Slug: ${company.workspace.slug}`);
    }
    
    // Step 3: Compare workspaces
    console.log(`\n📋 Step 3: Comparing workspace IDs...`);
    
    const workspaceMatch = urlWorkspaceId === company.workspaceId;
    
    console.log(`\n   URL Workspace ID:     ${urlWorkspaceId}`);
    console.log(`   Company Workspace ID: ${company.workspaceId}`);
    console.log(`   Match: ${workspaceMatch ? '✅ YES' : '❌ NO'}`);
    
    if (!workspaceMatch) {
      console.log(`\n❌ CRITICAL ISSUE FOUND!`);
      console.log(`\n   The URL workspace (${URL_WORKSPACE_SLUG}) does NOT match the company's workspace!`);
      console.log(`\n   This explains why no data is showing:`);
      console.log(`   - Frontend auth uses workspace from URL: ${urlWorkspaceId}`);
      console.log(`   - Company and people are in workspace: ${company.workspaceId}`);
      console.log(`   - API filters by auth workspace, so it filters out all the data!`);
      console.log(`\n   SOLUTION:`);
      console.log(`   1. Navigate to the correct workspace URL for this company`);
      console.log(`   2. OR move the company/people to the ${URL_WORKSPACE_SLUG} workspace`);
      
      // Find the correct slug
      if (company.workspace?.slug) {
        console.log(`\n   Correct URL should be:`);
        console.log(`   https://staging.adrata.com/${company.workspace.slug}/companies/...`);
      }
    } else {
      console.log(`\n✅ Workspaces match correctly!`);
    }
    
    // Step 4: Check people records
    console.log(`\n📋 Step 4: Checking people records workspace...`);
    
    const people = await prisma.people.findMany({
      where: {
        companyId: MINNESOTA_POWER_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        workspaceId: true
      }
    });
    
    console.log(`\n   Found ${people.length} people for Minnesota Power`);
    
    const peopleWorkspaces = [...new Set(people.map(p => p.workspaceId))];
    console.log(`   Unique workspaceIds: ${peopleWorkspaces.length}`);
    
    peopleWorkspaces.forEach(wsId => {
      const count = people.filter(p => p.workspaceId === wsId).length;
      const matchesUrl = wsId === urlWorkspaceId ? '✅' : '❌';
      const matchesCompany = wsId === company.workspaceId ? '✅' : '❌';
      console.log(`\n   Workspace ${wsId}:`);
      console.log(`      People count: ${count}`);
      console.log(`      Matches URL workspace: ${matchesUrl}`);
      console.log(`      Matches company workspace: ${matchesCompany}`);
    });
    
    // Step 5: Summary
    console.log(`\n\n📊 SUMMARY`);
    console.log('='.repeat(80));
    
    if (!workspaceMatch) {
      console.log(`\n❌ WORKSPACE MISMATCH DETECTED!`);
      console.log(`\n   Root Cause:`);
      console.log(`   The URL uses workspace "${URL_WORKSPACE_SLUG}" (${urlWorkspaceId})`);
      console.log(`   but Minnesota Power is in workspace "${company.workspace?.slug || 'unknown'}" (${company.workspaceId})`);
      console.log(`\n   Impact:`);
      console.log(`   - Auth context filters data by URL workspace`);
      console.log(`   - API queries exclude all Minnesota Power data`);
      console.log(`   - Tabs show "No records found" even though data exists`);
      console.log(`\n   This is the PRIMARY issue causing the problem!`);
    } else {
      console.log(`\n✅ All workspaces match correctly`);
      console.log(`\n   The issue must be elsewhere:`);
      console.log(`   - Check if companyId is being passed correctly`);
      console.log(`   - Check auth headers in browser`);
      console.log(`   - Check for client-side filtering`);
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyWorkspaceContext()
  .then(() => {
    console.log('✅ Verification complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

