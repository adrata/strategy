#!/usr/bin/env node

/**
 * 👤 SETUP JUSTIN JOHNSON
 * 
 * Creates Justin Johnson user and makes him main seller for CloudCaddie workspace
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function setupJustinJohnson() {
  try {
    console.log('👤 Setting up Justin Johnson...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to new database!\n');

    // 1. Find CloudCaddie workspace
    console.log('📋 FINDING CLOUDCADDIE WORKSPACE:');
    const cloudCaddieWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'CloudCaddie',
          mode: 'insensitive'
        }
      }
    });
    
    if (!cloudCaddieWorkspace) {
      throw new Error('CloudCaddie workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${cloudCaddieWorkspace.name} (${cloudCaddieWorkspace.id})\n`);

    // 2. Create or find Justin Johnson user
    console.log('👤 CREATING JUSTIN JOHNSON USER:');
    let justin = await newPrisma.users.findFirst({
      where: {
        OR: [
          { name: { contains: 'Justin Johnson', mode: 'insensitive' } },
          { email: { contains: 'justin', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!justin) {
      justin = await newPrisma.users.create({
        data: {
          email: 'justin.johnson@cloudcaddie.com',
          name: 'Justin Johnson',
          firstName: 'Justin',
          lastName: 'Johnson',
          timezone: 'UTC',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created Justin Johnson: ${justin.name} (${justin.id})`);
    } else {
      console.log(`📋 Justin Johnson already exists: ${justin.name} (${justin.id})`);
    }

    // 3. Add Justin to CloudCaddie workspace
    console.log('\n🏢 ADDING JUSTIN TO CLOUDCADDIE WORKSPACE:');
    const justinWorkspace = await newPrisma.workspace_users.findFirst({
      where: {
        workspaceId: cloudCaddieWorkspace.id,
        userId: justin.id
      }
    });
    
    if (!justinWorkspace) {
      await newPrisma.workspace_users.create({
        data: {
          workspaceId: cloudCaddieWorkspace.id,
          userId: justin.id,
          role: 'SELLER',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Added Justin to CloudCaddie workspace`);
    } else {
      console.log(`📋 Justin already in CloudCaddie workspace`);
    }

    // 4. Get all companies and people in CloudCaddie workspace
    console.log('\n📊 GETTING CLOUDCADDIE DATA:');
    const companies = await newPrisma.companies.findMany({
      where: {
        workspaceId: cloudCaddieWorkspace.id
      },
      select: {
        id: true,
        name: true
      }
    });
    
    const people = await newPrisma.people.findMany({
      where: {
        workspaceId: cloudCaddieWorkspace.id
      },
      select: {
        id: true,
        fullName: true,
        companyId: true
      }
    });
    
    console.log(`   Found ${companies.length} companies`);
    console.log(`   Found ${people.length} people`);

    // 5. Make Justin the main seller for all companies
    console.log('\n👑 MAKING JUSTIN MAIN SELLER FOR ALL COMPANIES:');
    const companyUpdateResult = await newPrisma.companies.updateMany({
      where: { 
        workspaceId: cloudCaddieWorkspace.id,
        mainSellerId: { not: justin.id }
      },
      data: { 
        mainSellerId: justin.id,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Updated ${companyUpdateResult.count} companies with Justin as main seller`);

    // 6. Make Justin the main seller for all people
    console.log('\n👑 MAKING JUSTIN MAIN SELLER FOR ALL PEOPLE:');
    const peopleUpdateResult = await newPrisma.people.updateMany({
      where: { 
        workspaceId: cloudCaddieWorkspace.id,
        mainSellerId: { not: justin.id }
      },
      data: { 
        mainSellerId: justin.id,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Updated ${peopleUpdateResult.count} people with Justin as main seller`);

    // 7. Assign super admin role (if roles exist in schema)
    console.log('\n🔐 ASSIGNING SUPER ADMIN ROLE:');
    try {
      // Check if roles table exists and has super admin role
      const superAdminRole = await newPrisma.roles.findFirst({
        where: {
          name: {
            contains: 'super admin',
            mode: 'insensitive'
          }
        }
      });
      
      if (superAdminRole) {
        // Check if user already has this role
        const existingUserRole = await newPrisma.user_roles.findFirst({
          where: {
            userId: justin.id,
            roleId: superAdminRole.id
          }
        });
        
        if (!existingUserRole) {
          await newPrisma.user_roles.create({
            data: {
              userId: justin.id,
              roleId: superAdminRole.id
            }
          });
          console.log(`✅ Assigned super admin role to Justin`);
        } else {
          console.log(`📋 Justin already has super admin role`);
        }
      } else {
        console.log(`📋 Super admin role not found in database - skipping role assignment`);
      }
    } catch (error) {
      console.log(`📋 Role assignment not available: ${error.message}`);
    }

    // 8. Verify assignments
    console.log('\n🔍 VERIFYING ASSIGNMENTS:');
    const justinCompanies = await newPrisma.companies.count({
      where: { 
        workspaceId: cloudCaddieWorkspace.id,
        mainSellerId: justin.id
      }
    });
    
    const justinPeople = await newPrisma.people.count({
      where: { 
        workspaceId: cloudCaddieWorkspace.id,
        mainSellerId: justin.id
      }
    });
    
    console.log(`   Justin companies: ${justinCompanies}`);
    console.log(`   Justin people: ${justinPeople}\n`);

    // 9. Summary
    console.log('📊 JUSTIN JOHNSON SETUP SUMMARY:');
    console.log('=================================');
    console.log(`✅ User: ${justin.name} (${justin.id})`);
    console.log(`✅ Email: ${justin.email}`);
    console.log(`✅ Workspace: ${cloudCaddieWorkspace.name}`);
    console.log(`✅ Role: SELLER`);
    console.log(`✅ Main seller for ${justinCompanies} companies`);
    console.log(`✅ Main seller for ${justinPeople} people`);
    console.log(`✅ Super admin role assigned (if available)`);
    console.log('\n🎉 Justin Johnson setup completed successfully!');

  } catch (error) {
    console.error('❌ Error during Justin Johnson setup:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the setup
setupJustinJohnson();
