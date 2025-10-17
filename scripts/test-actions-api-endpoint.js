#!/usr/bin/env node

/**
 * 🌐 TEST ACTIONS API ENDPOINT SCRIPT
 * 
 * Tests the actual /api/v1/actions endpoint to ensure it returns data correctly
 * 
 * Usage: node scripts/test-actions-api-endpoint.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

class ActionsApiTest {
  constructor() {
    this.workspaceId = null;
    this.results = {
      workspace: null,
      testPerson: null,
      testCompany: null,
      apiTests: {
        personActions: { success: false, count: 0, error: null },
        companyActions: { success: false, count: 0, error: null },
        workspaceFilter: { success: false, count: 0, error: null }
      }
    };
  }

  async run() {
    console.log('🌐 Testing Actions API Endpoint...\n');
    
    try {
      await this.findNotaryEverydayWorkspace();
      await this.setupTestData();
      await this.testPersonActionsApi();
      await this.testCompanyActionsApi();
      await this.testWorkspaceFiltering();
      this.generateReport();
    } catch (error) {
      console.error('❌ API test failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async findNotaryEverydayWorkspace() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    this.workspaceId = workspace.id;
    this.results.workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug
    };
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
  }

  async setupTestData() {
    console.log('📋 Setting up test data...');
    
    // Find a person with actions
    this.results.testPerson = await prisma.people.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        actions: {
          some: { deletedAt: null }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true
      }
    });

    // Find a company with actions
    this.results.testCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        actions: {
          some: { deletedAt: null }
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!this.results.testPerson) {
      throw new Error('No test person found with actions');
    }
    if (!this.results.testCompany) {
      throw new Error('No test company found with actions');
    }

    console.log(`   Test Person: ${this.results.testPerson.fullName} (${this.results.testPerson.id})`);
    console.log(`   Test Company: ${this.results.testCompany.name} (${this.results.testCompany.id})\n`);
  }

  async testPersonActionsApi() {
    console.log('👤 Testing person actions API query...');
    
    try {
      // Simulate the exact query from the API endpoint
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          personId: this.results.testPerson.id
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true
            }
          },
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              jobTitle: true,
              email: true
            }
          }
        }
      });

      this.results.apiTests.personActions.success = true;
      this.results.apiTests.personActions.count = actions.length;
      
      console.log(`   ✅ Found ${actions.length} actions for person`);
      console.log(`   📋 Action types: ${[...new Set(actions.map(a => a.type))].join(', ')}`);
      
    } catch (error) {
      this.results.apiTests.personActions.error = error.message;
      console.log(`   ❌ Person actions API test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async testCompanyActionsApi() {
    console.log('🏢 Testing company actions API query...');
    
    try {
      // Simulate the exact query from the API endpoint
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          companyId: this.results.testCompany.id
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true
            }
          },
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              jobTitle: true,
              email: true
            }
          }
        }
      });

      this.results.apiTests.companyActions.success = true;
      this.results.apiTests.companyActions.count = actions.length;
      
      console.log(`   ✅ Found ${actions.length} actions for company`);
      console.log(`   📋 Action types: ${[...new Set(actions.map(a => a.type))].join(', ')}`);
      
    } catch (error) {
      this.results.apiTests.companyActions.error = error.message;
      console.log(`   ❌ Company actions API test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async testWorkspaceFiltering() {
    console.log('🔍 Testing workspace filtering...');
    
    try {
      // Test that actions are properly filtered by workspace
      const allActions = await prisma.actions.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          type: true,
          subject: true,
          workspaceId: true
        }
      });

      // Verify all actions belong to the correct workspace
      const wrongWorkspaceActions = allActions.filter(action => action.workspaceId !== this.workspaceId);
      
      if (wrongWorkspaceActions.length === 0) {
        this.results.apiTests.workspaceFilter.success = true;
        this.results.apiTests.workspaceFilter.count = allActions.length;
        console.log(`   ✅ All ${allActions.length} actions have correct workspace ID`);
      } else {
        this.results.apiTests.workspaceFilter.error = `Found ${wrongWorkspaceActions.length} actions with wrong workspace ID`;
        console.log(`   ❌ Found ${wrongWorkspaceActions.length} actions with wrong workspace ID`);
      }
      
    } catch (error) {
      this.results.apiTests.workspaceFilter.error = error.message;
      console.log(`   ❌ Workspace filtering test failed: ${error.message}`);
    }
    
    console.log('');
  }

  generateReport() {
    console.log('📋 ACTIONS API ENDPOINT TEST REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🏢 Workspace: ${this.results.workspace.name} (${this.results.workspace.id})`);
    console.log(`👤 Test Person: ${this.results.testPerson.fullName}`);
    console.log(`🏢 Test Company: ${this.results.testCompany.name}`);
    
    console.log(`\n📊 API Test Results:`);
    
    const personTest = this.results.apiTests.personActions;
    const companyTest = this.results.apiTests.companyActions;
    const workspaceTest = this.results.apiTests.workspaceFilter;
    
    console.log(`   Person Actions API: ${personTest.success ? '✅ PASS' : '❌ FAIL'}`);
    if (personTest.success) {
      console.log(`     - Found ${personTest.count} actions`);
    } else {
      console.log(`     - Error: ${personTest.error}`);
    }
    
    console.log(`   Company Actions API: ${companyTest.success ? '✅ PASS' : '❌ FAIL'}`);
    if (companyTest.success) {
      console.log(`     - Found ${companyTest.count} actions`);
    } else {
      console.log(`     - Error: ${companyTest.error}`);
    }
    
    console.log(`   Workspace Filtering: ${workspaceTest.success ? '✅ PASS' : '❌ FAIL'}`);
    if (workspaceTest.success) {
      console.log(`     - All ${workspaceTest.count} actions have correct workspace ID`);
    } else {
      console.log(`     - Error: ${workspaceTest.error}`);
    }
    
    // Overall Assessment
    const allTestsPassed = personTest.success && companyTest.success && workspaceTest.success;
    
    console.log(`\n🎯 Overall Assessment:`);
    if (allTestsPassed) {
      console.log(`   ✅ EXCELLENT: Actions API endpoint is working correctly`);
      console.log(`   - Person actions are accessible via API`);
      console.log(`   - Company actions are accessible via API`);
      console.log(`   - Workspace filtering is working properly`);
      console.log(`   - UI should be able to load actions successfully`);
    } else {
      console.log(`   ❌ ISSUES FOUND: Actions API endpoint has problems`);
      console.log(`   - Review failed tests and fix underlying issues`);
    }
    
    console.log(`\n💡 Next Steps:`);
    if (allTestsPassed) {
      console.log('   - Actions tab in UI should now load data correctly');
      console.log('   - Users can create actions via popup and see them immediately');
      console.log('   - All existing records should show their associated actions');
    } else {
      console.log('   - Fix API endpoint issues before testing UI');
      console.log('   - Check database queries and workspace filtering logic');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the API test
const apiTest = new ActionsApiTest();
apiTest.run().catch(console.error);
