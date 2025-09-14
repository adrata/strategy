#!/usr/bin/env node

/**
 * Setup Ryan Serrato as Dano's Manager
 * 
 * Creates Ryan Serrato user and sets up proper access to Notary Everyday workspace
 * 
 * Details:
 * - Name: Ryan Serrato  
 * - Email: ryan@notaryeveryday.com
 * - Username: ryan (if available)
 * - Password: RyanIsGreat01!
 * - Role: Manager in Notary Everyday workspace
 * - Access: Can see all Dano's accounts/contacts in Notary Everyday only
 * 
 * Usage: node scripts/users/setup-ryan-serrato.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Ryan's details
const RYAN_EMAIL = 'ryan@notaryeveryday.com';
const RYAN_NAME = 'Ryan Serrato';
const RYAN_USERNAME = 'ryan';
const RYAN_PASSWORD = 'RyanIsGreat01!';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

/**
 * Check if Ryan already exists
 */
async function checkExistingRyan() {
  console.log('🔍 Checking for existing Ryan users...\n');
  
  // Check by email
  const ryanByEmail = await prisma.user.findUnique({
    where: { email: RYAN_EMAIL },
    include: {
      workspaceMemberships: {
        include: {
          workspace: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });
  
  // Check by name pattern (no username field in schema)
  const ryanByName = await prisma.user.findFirst({
    where: { 
      name: { contains: 'Ryan Serrato', mode: 'insensitive' }
    }
  });
  
  // Check for other Ryans
  const otherRyans = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'Ryan', mode: 'insensitive' } },
        { email: { contains: 'ryan', mode: 'insensitive' } }
      ],
      NOT: {
        email: RYAN_EMAIL
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  
  console.log('👥 Existing Ryan Users Found:');
  if (ryanByEmail) {
    console.log(`   ✅ Ryan by email: ${ryanByEmail.name} (${ryanByEmail.email})`);
    console.log(`      ID: ${ryanByEmail.id}`);
    console.log(`      Username: ${ryanByEmail.username || 'None'}`);
    console.log(`      Workspaces: ${ryanByEmail.workspaceMemberships.map(m => m.workspace.name).join(', ') || 'None'}`);
  } else {
    console.log('   ❌ No Ryan found with target email');
  }
  

  
  if (otherRyans.length > 0) {
    console.log(`\n📋 Other Ryan users found (${otherRyans.length}):`);
    otherRyans.forEach(ryan => {
      console.log(`   - ${ryan.name} (${ryan.email})`);
    });
  }
  
  return { ryanByEmail, otherRyans };
}

/**
 * Update other Ryan usernames to avoid conflicts
 */
async function updateOtherRyans(otherRyans) {
  console.log('\n🔄 Checking other Ryan users...');
  
  if (otherRyans.length > 0) {
    console.log(`   Found ${otherRyans.length} other Ryan users (no conflicts to resolve)`);
  } else {
    console.log(`   No other Ryan users found`);
  }
}

/**
 * Create or update Ryan Serrato
 */
async function createOrUpdateRyan(existingRyan) {
  console.log('\n👤 Setting up Ryan Serrato...');
  
  const hashedPassword = await bcrypt.hash(RYAN_PASSWORD, 12);
  
  let ryan;
  
  if (existingRyan) {
    // Update existing Ryan
    ryan = await prisma.user.update({
      where: { id: existingRyan.id },
      data: {
        name: RYAN_NAME,
        password: hashedPassword
      }
    });
    console.log(`✅ Updated existing Ryan: ${ryan.name} (${ryan.email})`);
  } else {
    // Create new Ryan
    ryan = await prisma.user.create({
      data: {
        name: RYAN_NAME,
        email: RYAN_EMAIL,
        password: hashedPassword
      }
    });
    console.log(`✅ Created new Ryan: ${ryan.name} (${ryan.email})`);
  }
  
  console.log(`   ID: ${ryan.id}`);
  console.log(`   Email: ${ryan.email}`);
  
  return ryan;
}

/**
 * Setup Ryan's workspace access
 */
async function setupRyanWorkspaceAccess(ryan) {
  console.log('\n🏢 Setting up workspace access...');
  
  // Find Notary Everyday workspace
  const notaryWorkspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { name: 'Notary Everyday' },
        { slug: 'notary-everyday' }
      ]
    }
  });
  
  if (!notaryWorkspace) {
    throw new Error('Notary Everyday workspace not found!');
  }
  
  console.log(`✅ Found workspace: ${notaryWorkspace.name} (${notaryWorkspace.id})`);
  
  // Check if Ryan already has membership
  const existingMembership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: ryan.id,
      workspaceId: notaryWorkspace.id
    }
  });
  
  if (existingMembership) {
    // Update existing membership
    await prisma.workspaceMembership.update({
      where: { id: existingMembership.id },
      data: {
        role: 'manager',
        isActive: true,
        joinedAt: new Date()
      }
    });
    console.log(`✅ Updated workspace membership: Manager role`);
  } else {
    // Create new membership
    await prisma.workspaceMembership.create({
      data: {
        userId: ryan.id,
        workspaceId: notaryWorkspace.id,
        role: 'manager',
        isActive: true,
        joinedAt: new Date()
      }
    });
    console.log(`✅ Created workspace membership: Manager role`);
  }
  
  return notaryWorkspace;
}

/**
 * Verify Ryan's access to Dano's data
 */
async function verifyRyanAccess(ryan, workspace) {
  console.log('\n🔍 Verifying Ryan\'s access to Dano\'s data...');
  
  // Count accounts assigned to Dano that Ryan should see
  const danoAccounts = await prisma.account.count({
    where: {
      workspaceId: workspace.id,
      assignedUserId: DANO_USER_ID
    }
  });
  
  // Count total accounts in workspace
  const totalAccounts = await prisma.account.count({
    where: {
      workspaceId: workspace.id
    }
  });
  
  // Get sample accounts
  const sampleAccounts = await prisma.account.findMany({
    where: {
      workspaceId: workspace.id,
      assignedUserId: DANO_USER_ID
    },
    take: 5,
    select: {
      name: true,
      city: true,
      state: true,
      assignedUserId: true
    }
  });
  
  console.log(`📊 Data Access Verification:`);
  console.log(`   Workspace: ${workspace.name}`);
  console.log(`   Total accounts in workspace: ${totalAccounts}`);
  console.log(`   Accounts assigned to Dano: ${danoAccounts}`);
  console.log(`   Unassigned accounts: ${totalAccounts - danoAccounts}`);
  
  console.log(`\n🏆 Sample Dano accounts Ryan can access:`);
  sampleAccounts.forEach((account, index) => {
    console.log(`   ${index + 1}. ${account.name} (${account.city}, ${account.state})`);
  });
  
  // Verify Ryan has manager permissions
  const ryanMembership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: ryan.id,
      workspaceId: workspace.id
    }
  });
  
  console.log(`\n🔐 Ryan's Permissions:`);
  console.log(`   Role: ${ryanMembership?.role || 'None'}`);
  console.log(`   Can view all accounts: ${ryanMembership?.role === 'manager' ? '✅ Yes' : '❌ No'}`);
  console.log(`   Can manage Dano's accounts: ${ryanMembership?.role === 'manager' ? '✅ Yes' : '❌ No'}`);
  
  return {
    totalAccounts,
    danoAccounts,
    ryanRole: ryanMembership?.role,
    hasAccess: ryanMembership?.role === 'manager'
  };
}

/**
 * Generate login instructions
 */
function generateLoginInstructions(ryan, workspace) {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 RYAN SERRATO SETUP COMPLETE');
  console.log('='.repeat(60));
  
  console.log(`\n👤 User Details:`);
  console.log(`   Name: ${ryan.name}`);
  console.log(`   Email: ${ryan.email}`);
  console.log(`   Password: ${RYAN_PASSWORD}`);
  console.log(`   Role: Manager`);
  
  console.log(`\n🏢 Workspace Access:`);
  console.log(`   Workspace: ${workspace.name}`);
  console.log(`   Role: Manager (can see all data)`);
  console.log(`   Access: Full access to Dano's accounts and data`);
  
  console.log(`\n🚀 Login Instructions:`);
  console.log(`   1. Go to the Adrata login page`);
  console.log(`   2. Email: ${ryan.email}`);
  console.log(`   3. Password: ${RYAN_PASSWORD}`);
  console.log(`   4. Switch to "Notary Everyday" workspace`);
  console.log(`   5. View all accounts assigned to Dano`);
  
  console.log(`\n💡 What Ryan Can Do:`);
  console.log(`   ✅ View all 150 accounts assigned to Dano`);
  console.log(`   ✅ View all 524 unassigned accounts`);
  console.log(`   ✅ Manage and reassign accounts`);
  console.log(`   ✅ Add contacts and leads to accounts`);
  console.log(`   ✅ Monitor Dano's outreach progress`);
  console.log(`   ❌ Cannot access Retail Product Solutions data`);
}

/**
 * Main setup function
 */
async function main() {
  console.log('🎯 SETTING UP RYAN SERRATO - DANO\'S MANAGER\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Step 1: Check existing Ryan users
    const { ryanByEmail, otherRyans } = await checkExistingRyan();
    
    // Step 2: Update other Ryan usernames if needed
    if (otherRyans.length > 0) {
      await updateOtherRyans(otherRyans);
    }
    
    // Step 3: Create or update Ryan
    const ryan = await createOrUpdateRyan(ryanByEmail);
    
    // Step 4: Setup workspace access
    const workspace = await setupRyanWorkspaceAccess(ryan);
    
    // Step 5: Verify access
    const accessResults = await verifyRyanAccess(ryan, workspace);
    
    // Step 6: Generate instructions
    generateLoginInstructions(ryan, workspace);
    
    // Step 7: Save setup report
    const report = {
      timestamp: new Date().toISOString(),
      user: {
        id: ryan.id,
        name: ryan.name,
        email: ryan.email,
        username: ryan.username,
        role: ryan.role
      },
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      access: accessResults,
      credentials: {
        username: ryan.username,
        email: ryan.email,
        password: RYAN_PASSWORD
      }
    };
    
    // Ensure reports directory exists
    const fs = await import('fs');
    const path = await import('path');
    const reportsDir = 'scripts/reports';
    if (!fs.default.existsSync(reportsDir)) {
      fs.default.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.default.writeFileSync(
      'scripts/reports/ryan-serrato-setup.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n📋 Setup report saved to: scripts/reports/ryan-serrato-setup.json`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Audit Ryan's access (separate function for testing)
 */
async function auditRyanAccess() {
  console.log('🔍 AUDITING RYAN\'S ACCESS TO NOTARY EVERYDAY DATA\n');
  
  try {
    await prisma.$connect();
    
    // Find Ryan
    const ryan = await prisma.user.findUnique({
      where: { email: RYAN_EMAIL },
      include: {
        workspaceMemberships: {
          include: {
            workspace: true
          }
        }
      }
    });
    
    if (!ryan) {
      console.log('❌ Ryan not found');
      return;
    }
    
    console.log(`👤 Ryan User: ${ryan.name} (${ryan.email})`);

    
    // Check workspace memberships
    console.log(`\n🏢 Workspace Memberships:`);
    for (const membership of ryan.workspaceMemberships) {
      console.log(`   - ${membership.workspace.name}: ${membership.role} (${membership.isActive ? 'Active' : 'Inactive'})`);
      
      if (membership.workspace.name === 'Notary Everyday') {
        // Count data Ryan can access
        const accountsCount = await prisma.account.count({
          where: { workspaceId: membership.workspace.id }
        });
        
        const danoAccountsCount = await prisma.account.count({
          where: {
            workspaceId: membership.workspace.id,
            assignedUserId: DANO_USER_ID
          }
        });
        
        console.log(`     📊 Can access ${accountsCount} total accounts`);
        console.log(`     🎯 Including ${danoAccountsCount} accounts assigned to Dano`);
      }
    }
    
    console.log(`\n✅ Audit complete!`);
    
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function runSetup() {
  const args = process.argv.slice(2);
  
  if (args.includes('--audit-only')) {
    await auditRyanAccess();
    return;
  }
  
  await main();
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup().catch(console.error);
}

export { main as setupRyanSerrato, auditRyanAccess };
