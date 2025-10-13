#!/usr/bin/env node

/**
 * CHECK ROSS ACTIONS
 * Check if there are any action records for user ross in workspace adrata
 * If none exist, create some sample actions to test the speedrun table
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRossActions() {
  console.log('🔍 CHECKING ROSS ACTIONS');
  console.log('=========================\n');

  try {
    // First, find the workspace and user
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: 'adrata' },
          { name: { contains: 'adrata', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ Workspace "adrata" not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.slug}) - ID: ${workspace.id}`);

    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'ross', mode: 'insensitive' } },
          { name: { contains: 'ross', mode: 'insensitive' } },
          { firstName: { contains: 'ross', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      console.log('❌ User "ross" not found');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email}) - ID: ${user.id}`);

    // Check for existing actions
    const existingActions = await prisma.actions.findMany({
      where: {
        workspaceId: workspace.id,
        userId: user.id
      },
      include: {
        person: {
          select: { id: true, fullName: true }
        },
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`\n📊 Found ${existingActions.length} existing actions for Ross:`);
    
    if (existingActions.length === 0) {
      console.log('❌ NO ACTIONS FOUND - This explains why speedrun shows "No action taken"');
      console.log('\n🔧 Creating sample actions...\n');
      
      // Get some people and companies to create actions for
      const people = await prisma.people.findMany({
        where: { workspaceId: workspace.id },
        include: { company: { select: { id: true, name: true } } },
        take: 5
      });

      if (people.length === 0) {
        console.log('❌ No people found in workspace to create actions for');
        return;
      }

      console.log(`Found ${people.length} people to create actions for:`);
      people.forEach((person, i) => {
        console.log(`  ${i + 1}. ${person.fullName} (${person.company?.name || 'No company'})`);
      });

      // Create sample actions
      const sampleActions = [
        {
          type: 'email_sent',
          subject: 'Initial outreach email sent',
          description: 'Sent personalized email introducing our services',
          status: 'COMPLETED',
          priority: 'NORMAL'
        },
        {
          type: 'phone_call',
          subject: 'Discovery call completed',
          description: 'Had 30-minute discovery call to understand their needs',
          status: 'COMPLETED',
          priority: 'HIGH'
        },
        {
          type: 'meeting_scheduled',
          subject: 'Demo meeting scheduled',
          description: 'Scheduled product demo for next week',
          status: 'COMPLETED',
          priority: 'HIGH'
        },
        {
          type: 'follow_up',
          subject: 'Follow-up email sent',
          description: 'Sent follow-up email after initial contact',
          status: 'COMPLETED',
          priority: 'NORMAL'
        },
        {
          type: 'proposal_sent',
          subject: 'Proposal delivered',
          description: 'Sent detailed proposal with pricing',
          status: 'COMPLETED',
          priority: 'HIGH'
        }
      ];

      let createdCount = 0;
      for (let i = 0; i < people.length && i < sampleActions.length; i++) {
        const person = people[i];
        const actionTemplate = sampleActions[i];
        
        // Create action with some time variation
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - (i + 1)); // 1, 2, 3, 4, 5 days ago
        
        const completedAt = new Date(createdAt);
        completedAt.setHours(completedAt.getHours() + 1); // 1 hour later

        try {
          const action = await prisma.actions.create({
            data: {
              workspaceId: workspace.id,
              userId: user.id,
              personId: person.id,
              companyId: person.companyId,
              type: actionTemplate.type,
              subject: actionTemplate.subject,
              description: actionTemplate.description,
              status: actionTemplate.status,
              priority: actionTemplate.priority,
              completedAt: completedAt,
              createdAt: createdAt,
              updatedAt: createdAt
            }
          });

          console.log(`✅ Created action: ${action.subject} for ${person.fullName}`);
          createdCount++;

          // Update the person's lastAction fields
          await prisma.people.update({
            where: { id: person.id },
            data: {
              lastAction: actionTemplate.subject,
              lastActionDate: completedAt,
              actionStatus: actionTemplate.status
            }
          });

          console.log(`   Updated ${person.fullName}'s lastAction fields`);

        } catch (error) {
          console.error(`❌ Error creating action for ${person.fullName}:`, error.message);
        }
      }

      console.log(`\n🎉 Successfully created ${createdCount} sample actions!`);
      console.log('The speedrun table should now show action data instead of "No action taken"');

    } else {
      console.log('\n📋 Existing actions:');
      existingActions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.subject}`);
        console.log(`     Type: ${action.type}`);
        console.log(`     Status: ${action.status}`);
        console.log(`     Person: ${action.person?.fullName || 'None'}`);
        console.log(`     Company: ${action.company?.name || 'None'}`);
        console.log(`     Created: ${action.createdAt}`);
        console.log('');
      });
    }

    // Check company-level action aggregation
    console.log('\n🏢 COMPANY-LEVEL ACTION AGGREGATION:');
    const companiesWithActions = await prisma.companies.findMany({
      where: { workspaceId: workspace.id },
      include: {
        actions: {
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        _count: {
          select: { actions: true }
        }
      },
      where: {
        workspaceId: workspace.id,
        actions: {
          some: {}
        }
      }
    });

    console.log(`Found ${companiesWithActions.length} companies with actions:`);
    companiesWithActions.forEach((company, i) => {
      console.log(`  ${i + 1}. ${company.name} (${company._count.actions} total actions)`);
      company.actions.forEach((action, j) => {
        console.log(`     ${j + 1}. ${action.subject} (${action.type}) - ${action.status}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRossActions();
