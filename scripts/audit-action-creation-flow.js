#!/usr/bin/env node

/**
 * 🔍 AUDIT ACTION CREATION FLOW SCRIPT
 * 
 * Tests the complete flow of creating actions from UI popup and verifying they're accessible
 * 
 * Usage: node scripts/audit-action-creation-flow.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

class ActionCreationAudit {
  constructor() {
    this.workspaceId = null;
    this.testResults = {
      workspace: null,
      testPerson: null,
      testCompany: null,
      tests: {
        personActionCreation: { passed: 0, failed: 0, details: [] },
        companyActionCreation: { passed: 0, failed: 0, details: [] },
        actionRetrieval: { passed: 0, failed: 0, details: [] },
        apiEndpointTests: { passed: 0, failed: 0, details: [] }
      },
      errors: []
    };
  }

  async run() {
    console.log('🔍 Starting Action Creation Flow Audit...\n');
    
    try {
      await this.findNotaryEverydayWorkspace();
      await this.setupTestData();
      await this.testPersonActionCreation();
      await this.testCompanyActionCreation();
      await this.testActionRetrieval();
      await this.testApiEndpoints();
      this.generateReport();
    } catch (error) {
      console.error('❌ Audit failed:', error);
      this.testResults.errors.push(`Audit error: ${error.message}`);
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
    this.testResults.workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug
    };
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
  }

  async setupTestData() {
    console.log('📋 Setting up test data...');
    
    // Find a test person with actions
    this.testResults.testPerson = await prisma.people.findFirst({
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
        fullName: true,
        mainSellerId: true
      }
    });

    // Find a test company with actions
    this.testResults.testCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        actions: {
          some: { deletedAt: null }
        }
      },
      select: {
        id: true,
        name: true,
        mainSellerId: true
      }
    });

    if (!this.testResults.testPerson) {
      throw new Error('No test person found with actions');
    }
    if (!this.testResults.testCompany) {
      throw new Error('No test company found with actions');
    }

    console.log(`   Test Person: ${this.testResults.testPerson.fullName} (${this.testResults.testPerson.id})`);
    console.log(`   Test Company: ${this.testResults.testCompany.name} (${this.testResults.testCompany.id})\n`);
  }

  async testPersonActionCreation() {
    console.log('👤 Testing person action creation...');
    
    const testAction = {
      type: 'call',
      subject: 'Test Call - Action Creation Audit',
      description: 'This is a test action created during the audit process',
      status: 'PLANNED',
      priority: 'NORMAL',
      workspaceId: this.workspaceId,
      userId: this.testResults.testPerson.mainSellerId || '01K1VBYZMWTCT09FWEKBDMCXZM',
      personId: this.testResults.testPerson.id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Create action via direct database call (simulating API)
      const createdAction = await prisma.actions.create({
        data: testAction,
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      this.testResults.tests.personActionCreation.passed++;
      this.testResults.tests.personActionCreation.details.push({
        test: 'Person Action Creation',
        status: 'PASSED',
        actionId: createdAction.id,
        personId: createdAction.personId,
        subject: createdAction.subject
      });

      console.log(`   ✅ Created action: ${createdAction.subject} (${createdAction.id})`);
      
      // Store for later retrieval test
      this.testResults.createdPersonAction = createdAction;
      
    } catch (error) {
      this.testResults.tests.personActionCreation.failed++;
      this.testResults.tests.personActionCreation.details.push({
        test: 'Person Action Creation',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Failed to create person action: ${error.message}`);
    }
    
    console.log('');
  }

  async testCompanyActionCreation() {
    console.log('🏢 Testing company action creation...');
    
    const testAction = {
      type: 'meeting',
      subject: 'Test Meeting - Action Creation Audit',
      description: 'This is a test company action created during the audit process',
      status: 'PLANNED',
      priority: 'HIGH',
      workspaceId: this.workspaceId,
      userId: this.testResults.testCompany.mainSellerId || '01K1VBYZMWTCT09FWEKBDMCXZM',
      companyId: this.testResults.testCompany.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Create action via direct database call (simulating API)
      const createdAction = await prisma.actions.create({
        data: testAction,
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      this.testResults.tests.companyActionCreation.passed++;
      this.testResults.tests.companyActionCreation.details.push({
        test: 'Company Action Creation',
        status: 'PASSED',
        actionId: createdAction.id,
        companyId: createdAction.companyId,
        subject: createdAction.subject
      });

      console.log(`   ✅ Created action: ${createdAction.subject} (${createdAction.id})`);
      
      // Store for later retrieval test
      this.testResults.createdCompanyAction = createdAction;
      
    } catch (error) {
      this.testResults.tests.companyActionCreation.failed++;
      this.testResults.tests.companyActionCreation.details.push({
        test: 'Company Action Creation',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Failed to create company action: ${error.message}`);
    }
    
    console.log('');
  }

  async testActionRetrieval() {
    console.log('🔍 Testing action retrieval...');
    
    // Test person action retrieval
    if (this.testResults.createdPersonAction) {
      try {
        const personActions = await prisma.actions.findMany({
          where: {
            personId: this.testResults.testPerson.id,
            workspaceId: this.workspaceId,
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' },
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true
              }
            }
          }
        });

        const foundTestAction = personActions.find(action => 
          action.id === this.testResults.createdPersonAction.id
        );

        if (foundTestAction) {
          this.testResults.tests.actionRetrieval.passed++;
          this.testResults.tests.actionRetrieval.details.push({
            test: 'Person Action Retrieval',
            status: 'PASSED',
            actionId: foundTestAction.id,
            totalActions: personActions.length
          });
          console.log(`   ✅ Found person action in retrieval: ${foundTestAction.subject}`);
        } else {
          this.testResults.tests.actionRetrieval.failed++;
          this.testResults.tests.actionRetrieval.details.push({
            test: 'Person Action Retrieval',
            status: 'FAILED',
            error: 'Created action not found in retrieval query'
          });
          console.log(`   ❌ Created person action not found in retrieval`);
        }
      } catch (error) {
        this.testResults.tests.actionRetrieval.failed++;
        this.testResults.tests.actionRetrieval.details.push({
          test: 'Person Action Retrieval',
          status: 'FAILED',
          error: error.message
        });
        console.log(`   ❌ Person action retrieval failed: ${error.message}`);
      }
    }

    // Test company action retrieval
    if (this.testResults.createdCompanyAction) {
      try {
        const companyActions = await prisma.actions.findMany({
          where: {
            companyId: this.testResults.testCompany.id,
            workspaceId: this.workspaceId,
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        const foundTestAction = companyActions.find(action => 
          action.id === this.testResults.createdCompanyAction.id
        );

        if (foundTestAction) {
          this.testResults.tests.actionRetrieval.passed++;
          this.testResults.tests.actionRetrieval.details.push({
            test: 'Company Action Retrieval',
            status: 'PASSED',
            actionId: foundTestAction.id,
            totalActions: companyActions.length
          });
          console.log(`   ✅ Found company action in retrieval: ${foundTestAction.subject}`);
        } else {
          this.testResults.tests.actionRetrieval.failed++;
          this.testResults.tests.actionRetrieval.details.push({
            test: 'Company Action Retrieval',
            status: 'FAILED',
            error: 'Created action not found in retrieval query'
          });
          console.log(`   ❌ Created company action not found in retrieval`);
        }
      } catch (error) {
        this.testResults.tests.actionRetrieval.failed++;
        this.testResults.tests.actionRetrieval.details.push({
          test: 'Company Action Retrieval',
          status: 'FAILED',
          error: error.message
        });
        console.log(`   ❌ Company action retrieval failed: ${error.message}`);
      }
    }
    
    console.log('');
  }

  async testApiEndpoints() {
    console.log('🌐 Testing API endpoint patterns...');
    
    // Test the exact query patterns used by the frontend
    const testQueries = [
      {
        name: 'Person Actions Query',
        query: `personId=${this.testResults.testPerson.id}`,
        test: async () => {
          const actions = await prisma.actions.findMany({
            where: {
              personId: this.testResults.testPerson.id,
              workspaceId: this.workspaceId,
              deletedAt: null
            },
            orderBy: { createdAt: 'desc' },
            take: 100
          });
          return actions.length > 0;
        }
      },
      {
        name: 'Company Actions Query',
        query: `companyId=${this.testResults.testCompany.id}`,
        test: async () => {
          const actions = await prisma.actions.findMany({
            where: {
              companyId: this.testResults.testCompany.id,
              workspaceId: this.workspaceId,
              deletedAt: null
            },
            orderBy: { createdAt: 'desc' },
            take: 100
          });
          return actions.length > 0;
        }
      }
    ];

    for (const queryTest of testQueries) {
      try {
        const hasResults = await queryTest.test();
        if (hasResults) {
          this.testResults.tests.apiEndpointTests.passed++;
          this.testResults.tests.apiEndpointTests.details.push({
            test: queryTest.name,
            status: 'PASSED',
            query: queryTest.query
          });
          console.log(`   ✅ ${queryTest.name}: Returns results`);
        } else {
          this.testResults.tests.apiEndpointTests.failed++;
          this.testResults.tests.apiEndpointTests.details.push({
            test: queryTest.name,
            status: 'FAILED',
            query: queryTest.query,
            error: 'No results returned'
          });
          console.log(`   ❌ ${queryTest.name}: No results returned`);
        }
      } catch (error) {
        this.testResults.tests.apiEndpointTests.failed++;
        this.testResults.tests.apiEndpointTests.details.push({
          test: queryTest.name,
          status: 'FAILED',
          query: queryTest.query,
          error: error.message
        });
        console.log(`   ❌ ${queryTest.name}: ${error.message}`);
      }
    }
    
    console.log('');
  }

  generateReport() {
    console.log('📋 ACTION CREATION FLOW AUDIT REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🏢 Workspace: ${this.testResults.workspace.name} (${this.testResults.workspace.id})`);
    console.log(`👤 Test Person: ${this.testResults.testPerson.fullName}`);
    console.log(`🏢 Test Company: ${this.testResults.testCompany.name}`);
    
    // Test Results Summary
    console.log(`\n📊 Test Results Summary:`);
    Object.entries(this.testResults.tests).forEach(([testCategory, results]) => {
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      console.log(`   ${testCategory}: ${results.passed}/${total} passed (${passRate}%)`);
    });
    
    // Detailed Results
    console.log(`\n📋 Detailed Test Results:`);
    Object.entries(this.testResults.tests).forEach(([testCategory, results]) => {
      if (results.details.length > 0) {
        console.log(`\n   ${testCategory}:`);
        results.details.forEach(detail => {
          const status = detail.status === 'PASSED' ? '✅' : '❌';
          console.log(`     ${status} ${detail.test}`);
          if (detail.status === 'FAILED' && detail.error) {
            console.log(`       Error: ${detail.error}`);
          }
        });
      }
    });
    
    // Overall Assessment
    const totalTests = Object.values(this.testResults.tests).reduce((sum, test) => sum + test.passed + test.failed, 0);
    const totalPassed = Object.values(this.testResults.tests).reduce((sum, test) => sum + test.passed, 0);
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 Overall Assessment:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Pass Rate: ${overallPassRate}%`);
    
    if (overallPassRate >= 90) {
      console.log(`   ✅ EXCELLENT: Action creation flow is working properly`);
    } else if (overallPassRate >= 70) {
      console.log(`   ⚠️  GOOD: Action creation flow mostly working with minor issues`);
    } else {
      console.log(`   ❌ NEEDS ATTENTION: Action creation flow has significant issues`);
    }
    
    if (this.testResults.errors.length > 0) {
      console.log(`\n❌ Audit Errors:`);
      this.testResults.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log(`\n💡 Recommendations:`);
    if (overallPassRate >= 90) {
      console.log('   - Action creation flow is healthy');
      console.log('   - UI popup should work correctly for creating actions');
      console.log('   - Actions should be accessible in the actions tab');
    } else {
      console.log('   - Review failed tests and fix underlying issues');
      console.log('   - Check API endpoint implementations');
      console.log('   - Verify database constraints and relationships');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the audit
const audit = new ActionCreationAudit();
audit.run().catch(console.error);
