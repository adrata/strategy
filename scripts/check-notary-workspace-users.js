const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotaryWorkspaceUsers() {
  try {
    console.log('🔍 Checking users associated with Notary Everyday workspace...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    
    // Get workspace details
    const workspace = await prisma.workspaces.findUnique({
      where: { id: NOTARY_WORKSPACE_ID },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`🏢 Workspace: ${workspace.name} (${workspace.id})`);
    
    // Get all workspace members
    const workspaceMembers = await prisma.workspaceMembers.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    console.log(`\n👥 Workspace Members (${workspaceMembers.length}):`);
    workspaceMembers.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.user.name} (${member.user.email})`);
      console.log(`      User ID: ${member.user.id}`);
      console.log(`      Role: ${member.role}`);
      console.log(`      Joined: ${member.joinedAt}`);
      console.log('');
    });
    
    // Check company assignments by user
    console.log(`📊 Company assignments by user:`);
    for (const member of workspaceMembers) {
      const companyCount = await prisma.companies.count({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: member.user.id,
          deletedAt: null
        }
      });
      
      console.log(`   ${member.user.name}: ${companyCount} companies assigned`);
    }
    
    // Check unassigned companies
    const unassignedCount = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: null,
        deletedAt: null
      }
    });
    
    console.log(`   Unassigned: ${unassignedCount} companies`);
    
    // Show total companies in workspace
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`\n📈 Total companies in workspace: ${totalCompanies}`);
    
    // Check if Dano is a member
    const danoMember = workspaceMembers.find(member => 
      member.user.email === 'dano@retail-products.com'
    );
    
    if (danoMember) {
      console.log(`\n✅ Dano is a member of this workspace with role: ${danoMember.role}`);
    } else {
      console.log(`\n❌ Dano is NOT a member of this workspace`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotaryWorkspaceUsers();
