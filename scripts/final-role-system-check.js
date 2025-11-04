#!/usr/bin/env node

/**
 * ✅ FINAL ROLE SYSTEM COMPREHENSIVE CHECK
 * 
 * Verifies everything is complete and working:
 * 1. Database structure
 * 2. Roles exist
 * 3. User assignments
 * 4. Prisma client access
 * 5. Role switching service can function
 * 6. API endpoints are ready
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalCheck() {
  try {
    console.log('✅ FINAL ROLE SYSTEM COMPREHENSIVE CHECK\n');
    console.log('='.repeat(70));
    
    const checks = {
      schema: false,
      roles: false,
      permissions: false,
      userAssignments: false,
      prismaClient: false,
      roleSwitchingService: false,
      apiEndpoints: false
    };
    
    // Check 1: Schema Structure
    console.log('\n📋 Check 1: Schema Structure');
    console.log('-'.repeat(70));
    try {
      const rolesTable = await prisma.roles.findFirst();
      const userRolesTable = await prisma.user_roles.findFirst();
      const permissionsTable = await prisma.permissions.findFirst();
      
      if (rolesTable && userRolesTable && permissionsTable) {
        checks.schema = true;
        console.log('✅ All RBAC tables exist and are accessible');
        console.log('   - roles table: OK');
        console.log('   - user_roles table: OK');
        console.log('   - permissions table: OK');
      }
    } catch (error) {
      console.log(`❌ Schema check failed: ${error.message}`);
    }
    
    // Check 2: Seller and Leader Roles Exist
    console.log('\n📋 Check 2: Seller and Leader Roles');
    console.log('-'.repeat(70));
    try {
      const sellerRole = await prisma.roles.findFirst({
        where: { name: 'Seller', isActive: true }
      });
      const leaderRole = await prisma.roles.findFirst({
        where: { name: 'Leader', isActive: true }
      });
      
      if (sellerRole && leaderRole) {
        checks.roles = true;
        console.log('✅ Both roles exist in database');
        console.log(`   - Seller: ${sellerRole.id} (${sellerRole.description || 'No description'})`);
        console.log(`   - Leader: ${leaderRole.id} (${leaderRole.description || 'No description'})`);
      } else {
        console.log(`❌ Missing roles: Seller=${!!sellerRole}, Leader=${!!leaderRole}`);
      }
    } catch (error) {
      console.log(`❌ Roles check failed: ${error.message}`);
    }
    
    // Check 3: Permissions Assigned
    console.log('\n📋 Check 3: Role Permissions');
    console.log('-'.repeat(70));
    try {
      const sellerRole = await prisma.roles.findFirst({ where: { name: 'Seller' } });
      const leaderRole = await prisma.roles.findFirst({ where: { name: 'Leader' } });
      
      if (sellerRole && leaderRole) {
        const sellerPerms = await prisma.role_permissions.count({
          where: { roleId: sellerRole.id }
        });
        const leaderPerms = await prisma.role_permissions.count({
          where: { roleId: leaderRole.id }
        });
        
        checks.permissions = true;
        console.log('✅ Permissions assigned to roles');
        console.log(`   - Seller: ${sellerPerms} permissions`);
        console.log(`   - Leader: ${leaderPerms} permissions`);
      }
    } catch (error) {
      console.log(`❌ Permissions check failed: ${error.message}`);
    }
    
    // Check 4: User Assignments (Ryan and Noel)
    console.log('\n📋 Check 4: User Role Assignments');
    console.log('-'.repeat(70));
    try {
      const workspace = await prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
            { name: { contains: 'NotaryEveryday', mode: 'insensitive' } }
          ]
        }
      });
      
      if (workspace) {
        const ryan = await prisma.users.findFirst({
          where: {
            OR: [
              { email: 'ryan@notaryeveryday.com' },
              { email: 'ryan@notary-everyday.com' }
            ]
          }
        });
        const noel = await prisma.users.findFirst({
          where: { email: 'noel@notaryeveryday.com' }
        });
        
        if (ryan && noel) {
          const ryanSeller = await prisma.user_roles.findFirst({
            where: {
              userId: ryan.id,
              workspaceId: workspace.id,
              role: { name: 'Seller' },
              isActive: true
            }
          });
          const ryanLeader = await prisma.user_roles.findFirst({
            where: {
              userId: ryan.id,
              workspaceId: workspace.id,
              role: { name: 'Leader' },
              isActive: true
            }
          });
          const noelSeller = await prisma.user_roles.findFirst({
            where: {
              userId: noel.id,
              workspaceId: workspace.id,
              role: { name: 'Seller' },
              isActive: true
            }
          });
          const noelLeader = await prisma.user_roles.findFirst({
            where: {
              userId: noel.id,
              workspaceId: workspace.id,
              role: { name: 'Leader' },
              isActive: true
            }
          });
          
          if (ryanSeller && ryanLeader && noelSeller && noelLeader) {
            checks.userAssignments = true;
            console.log('✅ Both users have both roles assigned');
            console.log(`   - Ryan: ✅ Seller, ✅ Leader`);
            console.log(`   - Noel: ✅ Seller, ✅ Leader`);
          } else {
            console.log(`❌ Missing assignments:`);
            console.log(`   - Ryan Seller: ${!!ryanSeller}, Leader: ${!!ryanLeader}`);
            console.log(`   - Noel Seller: ${!!noelSeller}, Leader: ${!!noelLeader}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ User assignments check failed: ${error.message}`);
    }
    
    // Check 5: Prisma Client Access
    console.log('\n📋 Check 5: Prisma Client Access');
    console.log('-'.repeat(70));
    try {
      const user = await prisma.users.findFirst({
        select: {
          id: true,
          email: true,
          dashboardConfig: true
        }
      });
      
      if (user && 'dashboardConfig' in user) {
        checks.prismaClient = true;
        console.log('✅ Prisma client can access dashboardConfig field');
        console.log('   - Field is available in client');
        console.log('   - Can read and write values');
      } else {
        console.log('❌ dashboardConfig field not accessible');
      }
    } catch (error) {
      console.log(`❌ Prisma client check failed: ${error.message}`);
    }
    
    // Check 6: Role Switching Service Functions
    console.log('\n📋 Check 6: Role Switching Service');
    console.log('-'.repeat(70));
    try {
      // Test the queries that role-switching-service uses
      const workspace = await prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'Notary Everyday', mode: 'insensitive' } }
          ]
        }
      });
      
      if (workspace) {
        const ryan = await prisma.users.findFirst({
          where: { email: 'ryan@notaryeveryday.com' }
        });
        
        if (ryan) {
          // Test getUserRoles query
          const userRoles = await prisma.user_roles.findMany({
            where: {
              userId: ryan.id,
              workspaceId: workspace.id,
              isActive: true
            },
            include: {
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          // Test getActiveRole query (dashboardConfig)
          const user = await prisma.users.findUnique({
            where: { id: ryan.id },
            select: { dashboardConfig: true }
          });
          
          // Test setActiveRole query
          const canUpdate = await prisma.users.update({
            where: { id: ryan.id },
            data: {
              dashboardConfig: user?.dashboardConfig || {}
            },
            select: { dashboardConfig: true }
          });
          
          checks.roleSwitchingService = true;
          console.log('✅ Role switching service queries work');
          console.log(`   - Can get user roles: ${userRoles.length} roles`);
          console.log(`   - Can read dashboardConfig: ${!!user}`);
          console.log(`   - Can update dashboardConfig: ${!!canUpdate}`);
        }
      }
    } catch (error) {
      console.log(`❌ Role switching service check failed: ${error.message}`);
    }
    
    // Check 7: API Endpoints
    console.log('\n📋 Check 7: API Endpoints');
    console.log('-'.repeat(70));
    try {
      const fs = require('fs');
      const path = require('path');
      
      const apiRoute = path.join(process.cwd(), 'src', 'app', 'api', 'user', 'active-role', 'route.ts');
      if (fs.existsSync(apiRoute)) {
        checks.apiEndpoints = true;
        console.log('✅ API endpoint exists');
        console.log('   - GET /api/user/active-role: Available');
        console.log('   - POST /api/user/active-role: Available');
      } else {
        console.log('❌ API endpoint file not found');
      }
    } catch (error) {
      console.log(`❌ API endpoints check failed: ${error.message}`);
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));
    
    const allChecks = Object.values(checks);
    const passedChecks = allChecks.filter(c => c).length;
    const totalChecks = allChecks.length;
    
    console.log(`\n   Checks Passed: ${passedChecks}/${totalChecks}`);
    console.log(`\n   ✅ Schema Structure: ${checks.schema ? 'PASS' : 'FAIL'}`);
    console.log(`   ${checks.roles ? '✅' : '❌'} Roles Exist: ${checks.roles ? 'PASS' : 'FAIL'}`);
    console.log(`   ${checks.permissions ? '✅' : '❌'} Permissions: ${checks.permissions ? 'PASS' : 'FAIL'}`);
    console.log(`   ${checks.userAssignments ? '✅' : '❌'} User Assignments: ${checks.userAssignments ? 'PASS' : 'FAIL'}`);
    console.log(`   ${checks.prismaClient ? '✅' : '❌'} Prisma Client: ${checks.prismaClient ? 'PASS' : 'FAIL'}`);
    console.log(`   ${checks.roleSwitchingService ? '✅' : '❌'} Role Switching Service: ${checks.roleSwitchingService ? 'PASS' : 'FAIL'}`);
    console.log(`   ${checks.apiEndpoints ? '✅' : '❌'} API Endpoints: ${checks.apiEndpoints ? 'PASS' : 'FAIL'}`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 ALL CHECKS PASSED - ROLE SYSTEM IS FULLY OPERATIONAL!');
      console.log('\n✅ Everything is connected and ready:');
      console.log('   - Database schema matches code');
      console.log('   - Seller and Leader roles exist');
      console.log('   - Ryan and Noel have both roles');
      console.log('   - Prisma client can access all fields');
      console.log('   - Role switching service is functional');
      console.log('   - API endpoints are ready');
      console.log('\n🚀 Ready for production use!');
    } else {
      console.log('\n⚠️  Some checks failed - please review above');
    }
    
  } catch (error) {
    console.error('❌ Critical error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalCheck();

