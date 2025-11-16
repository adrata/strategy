/**
 * Fix Hill Country Telephone Cooperative Buyer Group Roles
 * 
 * This script fixes the issue where all 9 BG members are listed as Stakeholders
 * by syncing the correct roles from BuyerGroupMembers table to people records.
 * 
 * Usage:
 *   node scripts/fix-hill-country-stakeholder-roles.js [companyId]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate influence level from buyer group role
 */
function calculateInfluenceLevelFromRole(role) {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().replace(/[_-]/g, ' ').trim();
  
  // Decision Maker and Champion have high influence
  if (normalizedRole === 'decision maker' || 
      normalizedRole === 'champion' ||
      normalizedRole === 'decision' ||
      normalizedRole.includes('decision')) {
    return 'High';
  }
  
  // Blocker and Stakeholder have medium influence
  if (normalizedRole === 'blocker' || 
      normalizedRole === 'stakeholder') {
    return 'Medium';
  }
  
  // Introducer has low influence
  if (normalizedRole === 'introducer') {
    return 'Low';
  }
  
  // Default to Medium for unknown roles
  return 'Medium';
}

/**
 * Normalize role name to match BuyerGroupRole enum
 */
function normalizeRole(role) {
  if (!role) return null;
  
  const normalized = role.toLowerCase().trim();
  
  // Map common variations to enum values
  if (normalized === 'decision maker' || normalized === 'decision') {
    return 'decision';
  }
  if (normalized === 'champion') {
    return 'champion';
  }
  if (normalized === 'stakeholder') {
    return 'stakeholder';
  }
  if (normalized === 'blocker') {
    return 'blocker';
  }
  if (normalized === 'introducer') {
    return 'introducer';
  }
  
  return normalized;
}

/**
 * Sync roles from BuyerGroupMembers to people records for a company
 */
async function syncRolesFromBuyerGroupMembers(companyId) {
  console.log(`\n🔍 Syncing roles for company: ${companyId}`);
  
  // Get the company
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, workspaceId: true }
  });
  
  if (!company) {
    console.error(`❌ Company not found: ${companyId}`);
    return { synced: 0, errors: 0 };
  }
  
  console.log(`📋 Company: ${company.name} (${company.id})`);
  console.log(`📋 Workspace: ${company.workspaceId}`);
  
  // Find BuyerGroups for this company
  const buyerGroups = await prisma.buyerGroups.findMany({
    where: {
      companyId: companyId,
      workspaceId: company.workspaceId
    },
    include: {
      BuyerGroupMembers: {
        select: {
          id: true,
          name: true,
          email: true,
          linkedin: true,
          role: true,
          title: true
        }
      }
    }
  });
  
  console.log(`📊 Found ${buyerGroups.length} buyer group(s)`);
  
    if (buyerGroups.length === 0) {
      console.log(`⚠️  No buyer groups found. Checking people records directly...`);
      
      // If no buyer groups, check ALL people for this company and ensure they're properly marked
      const people = await prisma.people.findMany({
        where: {
          companyId: companyId,
          workspaceId: company.workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          jobTitle: true,
          buyerGroupRole: true,
          isBuyerGroupMember: true
        }
      });
      
      console.log(`📊 Found ${people.length} people for this company`);
      
      if (people.length === 0) {
        console.log(`✅ No people to fix`);
        return { synced: 0, errors: 0 };
      }
      
      // Fix all people: ensure they're marked as buyer group members and have valid roles
      let synced = 0;
      let errors = 0;
      
      for (const person of people) {
        try {
          const updateData = {};
          let needsUpdate = false;
          
          // Fix invalid roles (like 'Unknown') or missing roles
          let role = person.buyerGroupRole;
          if (!role || role === 'Unknown' || role === 'unknown') {
            role = inferRoleFromJobTitle(person.jobTitle);
            // If we still don't have a role, default to 'stakeholder'
            if (!role) {
              role = 'stakeholder';
            }
            updateData.buyerGroupRole = role;
            needsUpdate = true;
          }
          
          // Ensure isBuyerGroupMember is true
          if (!person.isBuyerGroupMember) {
            updateData.isBuyerGroupMember = true;
            needsUpdate = true;
          }
          
          // Set influence level if missing or incorrect
          const influenceLevel = calculateInfluenceLevelFromRole(role);
          if (influenceLevel) {
            // We'll update influenceLevel in a separate query if needed
            updateData.influenceLevel = influenceLevel;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            updateData.updatedAt = new Date();
            
            await prisma.people.update({
              where: { id: person.id },
              data: updateData
            });
            
            const changes = [];
            if (person.buyerGroupRole !== role) {
              changes.push(`role: ${person.buyerGroupRole || 'null'} → ${role}`);
            }
            if (!person.isBuyerGroupMember) {
              changes.push(`isBuyerGroupMember: false → true`);
            }
            
            console.log(`✅ Updated ${person.fullName}: ${changes.join(', ')}`);
            synced++;
          } else {
            console.log(`⏭️  ${person.fullName}: already correct (role=${role || 'null'})`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Error updating ${person.fullName}:`, error.message);
        }
      }
      
      return { synced, errors };
    }
  
  // Sync from BuyerGroupMembers
  let totalSynced = 0;
  let totalErrors = 0;
  
  for (const buyerGroup of buyerGroups) {
    console.log(`\n📦 Processing buyer group: ${buyerGroup.id}`);
    console.log(`   Members: ${buyerGroup.BuyerGroupMembers.length}`);
    
    for (const member of buyerGroup.BuyerGroupMembers) {
      try {
        // Find matching person by email or LinkedIn
        const person = await prisma.people.findFirst({
          where: {
            companyId: companyId,
            workspaceId: company.workspaceId,
            deletedAt: null,
            OR: [
              { email: member.email },
              { workEmail: member.email },
              { personalEmail: member.email },
              { linkedinUrl: member.linkedin }
            ]
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            buyerGroupRole: true
          }
        });
        
        if (!person) {
          console.log(`⚠️  No person found for ${member.name} (${member.email})`);
          continue;
        }
        
        // Normalize the role from BuyerGroupMembers
        const normalizedRole = normalizeRole(member.role);
        const currentRole = normalizeRole(person.buyerGroupRole);
        
        if (normalizedRole && normalizedRole !== currentRole) {
          const influenceLevel = calculateInfluenceLevelFromRole(normalizedRole);
          
          await prisma.people.update({
            where: { id: person.id },
            data: {
              buyerGroupRole: normalizedRole,
              influenceLevel: influenceLevel,
              isBuyerGroupMember: true,
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Updated ${person.fullName}: ${person.buyerGroupRole || 'null'} → ${normalizedRole}`);
          totalSynced++;
        } else {
          console.log(`⏭️  ${person.fullName}: role already correct (${normalizedRole || 'null'})`);
        }
      } catch (error) {
        totalErrors++;
        console.error(`❌ Error syncing ${member.name}:`, error.message);
      }
    }
  }
  
  return { synced: totalSynced, errors: totalErrors };
}

/**
 * Infer buyer group role from job title
 */
function inferRoleFromJobTitle(jobTitle) {
  if (!jobTitle) return null;
  
  const title = jobTitle.toLowerCase();
  
  // Decision makers
  if (title.includes('ceo') || title.includes('president') || title.includes('founder') || title.includes('owner')) {
    return 'decision';
  }
  if (title.includes('vp') || title.includes('vice president') || title.includes('director') || title.includes('head of')) {
    return 'decision';
  }
  if (title.includes('cfo') || title.includes('cto') || title.includes('cmo') || title.includes('coo')) {
    return 'decision';
  }
  
  // Champions
  if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
    return 'champion';
  }
  if (title.includes('consultant') || title.includes('advisor') || title.includes('expert')) {
    return 'champion';
  }
  
  // Blockers
  if (title.includes('legal') || title.includes('compliance') || title.includes('security')) {
    return 'blocker';
  }
  if (title.includes('procurement') || title.includes('purchasing')) {
    return 'blocker';
  }
  
  // Introducers
  if (title.includes('sales') || title.includes('marketing') || title.includes('business development')) {
    return 'introducer';
  }
  
  // Default to stakeholder
  return 'stakeholder';
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Hill Country Telephone Cooperative Role Fix');
    console.log('='.repeat(60));
    
    const args = process.argv.slice(2);
    const companyId = args[0] || '01K9QD3RTJNEZFWAGJS701PQ2V'; // Default to Hill Country Telephone Cooperative
    
    console.log(`\n📍 Company ID: ${companyId}`);
    
    const { synced, errors } = await syncRolesFromBuyerGroupMembers(companyId);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Role Sync Complete');
    console.log(`Total people synced: ${synced}`);
    console.log(`Total errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

