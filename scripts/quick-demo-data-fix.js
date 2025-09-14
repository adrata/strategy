#!/usr/bin/env node

/**
 * Quick Demo Data Fix Script
 * 
 * This script quickly enhances demo data for go-to-market strategy company demo.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ZEROPOINT_WORKSPACE_ID = 'zeropoint-demo-2025';

async function quickDemoDataFix() {
  console.log('🚀 Starting quick demo data enhancement...');

  try {
    // 1. Create comprehensive Sarah Johnson record
    console.log('👤 Creating comprehensive Sarah Johnson record...');
    
    const sarahJohnson = {
      name: 'Sarah Johnson',
      title: 'VP of Sales Operations',
      email: 'sarah.johnson@adp.com',
      phone: '+1 (973) 974-5200',
      department: 'Sales Operations',
      role: 'Decision Maker',
      engagement: 'Interested 4/5',
      influence: 88,
      decisionPower: 85,
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson-adp',
      city: 'Roseland',
      state: 'NJ',
      country: 'United States',
      seniority: 'VP',
      company: 'ADP'
    };

    // Find or create ADP company
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
          sector: 'Human Resources & Payroll',
          website: 'adp.com',
          size: '5000+',
          city: 'Roseland',
          state: 'NJ',
          country: 'United States',
          notes: 'Automatic Data Processing, Inc. is a global provider of cloud-based human capital management solutions.'
        }
      });
    }

    // Update or create Sarah Johnson
    const existingSarah = await prisma.people.findFirst({
      where: {
        email: sarahJohnson.email,
        workspaceId: ZEROPOINT_WORKSPACE_ID
      }
    });

    if (existingSarah) {
      await prisma.people.update({
        where: { id: existingSarah.id },
        data: {
          fullName: sarahJohnson.name,
          firstName: sarahJohnson.name.split(' ')[0],
          lastName: sarahJohnson.name.split(' ')[1],
          jobTitle: sarahJohnson.title,
          email: sarahJohnson.email,
          phone: sarahJohnson.phone,
          department: sarahJohnson.department,
          seniority: sarahJohnson.seniority,
          linkedinUrl: sarahJohnson.linkedinUrl,
          city: sarahJohnson.city,
          state: sarahJohnson.state,
          country: sarahJohnson.country,
          companyId: adpCompany.id,
          notes: JSON.stringify({
            buyerRole: sarahJohnson.role,
            engagement: sarahJohnson.engagement,
            influence: sarahJohnson.influence,
            decisionPower: sarahJohnson.decisionPower,
            company: sarahJohnson.company,
            lastContactDate: new Date().toISOString(),
            nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            communicationStyle: 'Direct',
            decisionMakingStyle: 'Data-driven',
            painPoints: ['Manual reporting processes', 'Lack of real-time insights', 'Integration challenges'],
            interests: ['Sales automation', 'Data analytics', 'Process optimization'],
            personalGoals: ['Improve team efficiency', 'Reduce manual work', 'Increase revenue'],
            professionalGoals: ['VP promotion', 'Build high-performing team', 'Implement new systems']
          })
        }
      });
    } else {
      await prisma.people.create({
        data: {
          id: '01HZ8K9M2N3P4Q5R6S7T8U9V0W',
          fullName: sarahJohnson.name,
          firstName: sarahJohnson.name.split(' ')[0],
          lastName: sarahJohnson.name.split(' ')[1],
          jobTitle: sarahJohnson.title,
          email: sarahJohnson.email,
          phone: sarahJohnson.phone,
          department: sarahJohnson.department,
          seniority: sarahJohnson.seniority,
          linkedinUrl: sarahJohnson.linkedinUrl,
          city: sarahJohnson.city,
          state: sarahJohnson.state,
          country: sarahJohnson.country,
          companyId: adpCompany.id,
          workspaceId: ZEROPOINT_WORKSPACE_ID,
          notes: JSON.stringify({
            buyerRole: sarahJohnson.role,
            engagement: sarahJohnson.engagement,
            influence: sarahJohnson.influence,
            decisionPower: sarahJohnson.decisionPower,
            company: sarahJohnson.company,
            lastContactDate: new Date().toISOString(),
            nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            communicationStyle: 'Direct',
            decisionMakingStyle: 'Data-driven',
            painPoints: ['Manual reporting processes', 'Lack of real-time insights', 'Integration challenges'],
            interests: ['Sales automation', 'Data analytics', 'Process optimization'],
            personalGoals: ['Improve team efficiency', 'Reduce manual work', 'Increase revenue'],
            professionalGoals: ['VP promotion', 'Build high-performing team', 'Implement new systems']
          })
        }
      });
    }

    // 2. Create comprehensive buyer group members
    console.log('👥 Creating comprehensive buyer group members...');
    
    const buyerGroupMembers = [
      {
        name: 'James Wilson',
        title: 'Director Platform Architecture',
        email: 'james.wilson@adp.com',
        phone: '+1 (973) 974-5101',
        department: 'Engineering',
        role: 'Decision Maker',
        engagement: 'Interested 3/5',
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
        influence: 95,
        decisionPower: 95
      }
    ];

    for (const member of buyerGroupMembers) {
      const existingPerson = await prisma.people.findFirst({
        where: {
          email: member.email,
          workspaceId: ZEROPOINT_WORKSPACE_ID
        }
      });

      if (!existingPerson) {
        await prisma.people.create({
          data: {
            id: `01${Math.random().toString(36).substr(2, 24)}`,
            fullName: member.name,
            firstName: member.name.split(' ')[0],
            lastName: member.name.split(' ')[1],
            jobTitle: member.title,
            email: member.email,
            phone: member.phone,
            department: member.department,
            seniority: 'Senior',
            linkedinUrl: `https://linkedin.com/in/${member.name.toLowerCase().replace(' ', '')}-adp`,
            city: 'Roseland',
            state: 'NJ',
            country: 'United States',
            companyId: adpCompany.id,
            workspaceId: ZEROPOINT_WORKSPACE_ID,
            notes: JSON.stringify({
              buyerRole: member.role,
              engagement: member.engagement,
              influence: member.influence,
              decisionPower: member.decisionPower,
              company: 'ADP'
            })
          }
        });
      }
    }

    console.log('✅ Quick demo data enhancement completed successfully!');

  } catch (error) {
    console.error('❌ Error in quick demo data enhancement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  quickDemoDataFix()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { quickDemoDataFix };
