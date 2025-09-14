#!/usr/bin/env node

/**
 * Add Comprehensive Demo Data Script
 * 
 * This script adds comprehensive demo data to the database including:
 * - Enhanced seller data with Monaco-style metrics
 * - Buyer group roles and engagement data
 * - Company data with proper industry classifications
 * - People records with detailed professional information
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ZEROPOINT_WORKSPACE_ID = 'zeropoint-demo-2025';

async function addComprehensiveDemoData() {
  console.log('🚀 Starting comprehensive demo data addition...');

  try {
    // 1. Update existing sellers with Monaco-style metrics
    console.log('📊 Updating sellers with Monaco-style metrics...');
    
    const sellers = await prisma.people.findMany({
      where: {
        workspaceId: ZEROPOINT_WORKSPACE_ID,
        role: {
          contains: 'seller'
        }
      }
    });

    const sellerMetrics = [
      {
        activeBuyerGroups: 40,
        maxBuyerGroups: 50,
        dmEngagement: 89,
        stakeholders: 213,
        pacing: 'Ahead',
        percentToGoal: 105,
        region: 'Enterprise West',
        title: 'Senior Account Executive'
      },
      {
        activeBuyerGroups: 42,
        maxBuyerGroups: 60,
        dmEngagement: 92,
        stakeholders: 341,
        pacing: 'On Track',
        percentToGoal: 95,
        region: 'Fortune 500',
        title: 'Strategic Account Manager'
      },
      {
        activeBuyerGroups: 38,
        maxBuyerGroups: 45,
        dmEngagement: 85,
        stakeholders: 187,
        pacing: 'Ahead',
        percentToGoal: 115,
        region: 'Financial Services',
        title: 'Enterprise Sales Director'
      },
      {
        activeBuyerGroups: 29,
        maxBuyerGroups: 40,
        dmEngagement: 78,
        stakeholders: 134,
        pacing: 'On Track',
        percentToGoal: 88,
        region: 'Technology Sector',
        title: 'Account Executive'
      }
    ];

    for (let i = 0; i < sellers.length && i < sellerMetrics.length; i++) {
      const seller = sellers[i];
      const metrics = sellerMetrics[i];
      
      await prisma.people.update({
        where: { id: seller.id },
        data: {
          title: metrics.title,
          department: metrics.region,
          // Store metrics in notes field for now (we can create a separate metrics table later)
          notes: JSON.stringify({
            activeBuyerGroups: metrics.activeBuyerGroups,
            maxBuyerGroups: metrics.maxBuyerGroups,
            dmEngagement: metrics.dmEngagement,
            stakeholders: metrics.stakeholders,
            pacing: metrics.pacing,
            percentToGoal: metrics.percentToGoal
          })
        }
      });
    }

    // 2. Add comprehensive buyer group data
    console.log('👥 Adding comprehensive buyer group data...');
    
    const buyerGroupMembers = [
      {
        name: 'James Wilson',
        title: 'Director Platform Architecture',
        email: 'james.wilson@adp.com',
        phone: '+1 (973) 974-5101',
        department: 'Engineering',
        role: 'Decision Maker',
        engagement: 'Interested 3/5',
        riskStatus: '',
        fallbackRole: '',
        influence: 85,
        decisionPower: 90
      },
      {
        name: 'Sarah Rodriguez',
        title: 'VP of Engineering',
        email: 'sarah.rodriguez@adp.com',
        phone: '+1 (973) 974-5102',
        department: 'Engineering',
        role: 'Champion',
        engagement: 'Warming',
        riskStatus: 'At Risk of Leaving 3/5',
        fallbackRole: '',
        influence: 75,
        decisionPower: 80
      },
      {
        name: 'Kevin Zhang',
        title: 'Sr. Manager Cloud Infrastructure',
        email: 'kevin.zhang@adp.com',
        phone: '+1 (973) 974-5103',
        department: 'Engineering',
        role: 'Champion',
        engagement: 'Interested 4/5',
        riskStatus: '',
        fallbackRole: 'Fallback',
        influence: 70,
        decisionPower: 65
      },
      {
        name: 'Patricia Kim',
        title: 'Sr. Director Tech Procurement',
        email: 'patricia.kim@adp.com',
        phone: '+1 (973) 974-5104',
        department: 'Procurement',
        role: 'Stakeholder',
        engagement: 'Interested 4/5',
        riskStatus: '',
        fallbackRole: '',
        influence: 60,
        decisionPower: 70
      },
      {
        name: 'Michael Chen',
        title: 'CTO',
        email: 'michael.chen@adp.com',
        phone: '+1 (973) 974-5105',
        department: 'Engineering',
        role: 'Decision Maker',
        engagement: 'Neutral 1/5',
        riskStatus: '',
        fallbackRole: '',
        influence: 95,
        decisionPower: 95
      }
    ];

    // Add buyer group members as people records
    for (const member of buyerGroupMembers) {
      const existingPerson = await prisma.people.findFirst({
        where: {
          email: member.email,
          workspaceId: ZEROPOINT_WORKSPACE_ID
        }
      });

      if (!existingPerson) {
        // Find or create ADP company first
        let adpCompany = await prisma.companies.findFirst({
          where: {
            name: 'ADP',
            workspaceId: ZEROPOINT_WORKSPACE_ID
          }
        });

        if (!adpCompany) {
          adpCompany = await prisma.companies.create({
            data: {
              id: `01${Math.random().toString(36).substr(2, 24)}`,
              name: 'ADP',
              workspaceId: ZEROPOINT_WORKSPACE_ID,
              industry: 'Human Resources & Payroll',
              domain: 'adp.com',
              employeeCount: '5000+',
              location: 'Roseland, NJ'
            }
          });
        }

        await prisma.people.create({
          data: {
            id: `01${Math.random().toString(36).substr(2, 24)}`,
            fullName: member.name,
            firstName: member.name.split(' ')[0],
            lastName: member.name.split(' ')[1] || '',
            jobTitle: member.title,
            email: member.email,
            phone: member.phone,
            department: member.department,
            companyId: adpCompany?.id,
            workspaceId: ZEROPOINT_WORKSPACE_ID,
            // Store buyer group specific data in notes
            notes: JSON.stringify({
              buyerRole: member.role,
              engagement: member.engagement,
              riskStatus: member.riskStatus,
              fallbackRole: member.fallbackRole,
              influence: member.influence,
              decisionPower: member.decisionPower
            })
          }
        });
      }
    }

    // 3. Update company data with proper industry classifications
    console.log('🏢 Updating company data with industry classifications...');
    
    const companyUpdates = [
      {
        name: 'ADP',
        industry: 'Human Resources & Payroll',
        employeeCount: '5000+',
        revenue: '$15.4B',
        location: 'Roseland, NJ',
        domain: 'adp.com'
      },
      {
        name: 'Adobe',
        industry: 'Creative Software',
        employeeCount: '1000-5000',
        revenue: '$17.9B',
        location: 'San Jose, CA',
        domain: 'adobe.com'
      },
      {
        name: 'Amazon Web Services',
        industry: 'Cloud Services',
        employeeCount: '5000+',
        revenue: '$80.1B',
        location: 'Seattle, WA',
        domain: 'aws.amazon.com'
      },
      {
        name: 'Anthem',
        industry: 'Healthcare Insurance',
        employeeCount: '5000+',
        revenue: '$138.6B',
        location: 'Indianapolis, IN',
        domain: 'anthem.com'
      }
    ];

    for (const companyData of companyUpdates) {
      // Update leads that represent companies
      await prisma.leads.updateMany({
        where: {
          company: companyData.name,
          workspaceId: ZEROPOINT_WORKSPACE_ID
        },
        data: {
          companySize: companyData.employeeCount,
          description: JSON.stringify({
            industry: companyData.industry,
            revenue: companyData.revenue,
            location: companyData.location,
            domain: companyData.domain,
            buyerGroupIdentified: true,
            dealSize: '',
            status: 'Buyer Group Engaged',
            priority: 'Priority'
          })
        }
      });
    }

    // 4. Add comprehensive seller performance data
    console.log('📈 Adding seller performance data...');
    
    const performanceData = {
      qualificationScore: 83,
      totalPeople: 12,
      dailyTarget: '200/day',
      weeklyProgress: '150/400',
      totalProspects: 3247,
      targetAccounts: 590,
      decisionMakers: 1847,
      pipelineGrowth: '+12%'
    };

    // Store performance data in a workspace settings or notes
    const workspace = await prisma.workspaces.findFirst({
      where: { id: ZEROPOINT_WORKSPACE_ID }
    });

    if (workspace) {
      await prisma.workspaces.update({
        where: { id: ZEROPOINT_WORKSPACE_ID },
        data: {
          name: 'ZeroPoint Demo 2025',
          // Store performance metrics in description field
          description: JSON.stringify(performanceData)
        }
      });
    }

    console.log('✅ Comprehensive demo data addition completed successfully!');
    console.log('📊 Added:');
    console.log('  - Enhanced seller metrics (Monaco-style)');
    console.log('  - Buyer group member data with roles and engagement');
    console.log('  - Company industry classifications and metrics');
    console.log('  - Performance data for dashboard metrics');

  } catch (error) {
    console.error('❌ Error adding comprehensive demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addComprehensiveDemoData()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addComprehensiveDemoData };
