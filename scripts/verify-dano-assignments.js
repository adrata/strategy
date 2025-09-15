const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDanoAssignments() {
  try {
    console.log('🔍 Verifying Dano\'s company assignments...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    const DANO_EMAIL = 'dano@retail-products.com';
    
    // First, let's find the correct Dano user
    const danoUser = await prisma.users.findFirst({
      where: { email: DANO_EMAIL },
      select: { id: true, email: true, name: true }
    });
    
    if (!danoUser) {
      console.log('❌ Dano user not found with email:', DANO_EMAIL);
      return;
    }
    
    console.log(`👤 Found Dano user:`);
    console.log(`   ID: ${danoUser.id}`);
    console.log(`   Name: ${danoUser.name}`);
    console.log(`   Email: ${danoUser.email}`);
    
    // Now check companies assigned to this user ID
    const danoCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: danoUser.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        assignedUserId: true
      }
    });
    
    console.log(`\n📊 Companies assigned to Dano (${danoUser.id}):`);
    console.log(`   Total: ${danoCompanies.length}`);
    
    if (danoCompanies.length > 0) {
      console.log(`\n📋 First 10 companies:`);
      danoCompanies.slice(0, 10).forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name}`);
      });
      
      if (danoCompanies.length > 10) {
        console.log(`   ... and ${danoCompanies.length - 10} more`);
      }
    }
    
    // Also check if there are any companies with similar assignment patterns
    console.log(`\n🔍 Checking for companies that might be assigned differently...`);
    
    // Check for companies assigned to users with similar IDs
    const similarAssignments = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: {
          startsWith: danoUser.id.substring(0, 10) // First 10 characters
        }
      },
      select: {
        id: true,
        name: true,
        assignedUserId: true
      },
      take: 10
    });
    
    if (similarAssignments.length > 0) {
      console.log(`   Found ${similarAssignments.length} companies with similar user IDs:`);
      similarAssignments.forEach(company => {
        console.log(`   ${company.name} - Assigned to: ${company.assignedUserId}`);
      });
    }
    
    // Check if Dano is a member of the Notary Everyday workspace
    const danoMembership = await prisma.workspaceMembers.findFirst({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        userId: danoUser.id
      }
    });
    
    console.log(`\n🏢 Dano's workspace membership:`);
    if (danoMembership) {
      console.log(`   ✅ Dano is a member of Notary Everyday workspace (role: ${danoMembership.role})`);
    } else {
      console.log(`   ❌ Dano is NOT a member of Notary Everyday workspace`);
    }
    
    // Final verification - this is what the enrichment script should find
    console.log(`\n🎯 Final verification (what enrichment script should find):`);
    const enrichmentQuery = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: danoUser.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        industry: true,
        description: true,
        website: true
      }
    });
    
    console.log(`   Companies found for enrichment: ${enrichmentQuery.length}`);
    
    if (enrichmentQuery.length === 0) {
      console.log(`   ❌ This explains why the enrichment script found 0 companies!`);
      console.log(`   The script is looking for companies assigned to: ${danoUser.id}`);
      console.log(`   But found: ${danoCompanies.length} companies`);
    } else {
      console.log(`   ✅ This matches what the enrichment script should find`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDanoAssignments();
