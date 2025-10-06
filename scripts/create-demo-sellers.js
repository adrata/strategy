#!/usr/bin/env node

/**
 * Create Demo Sellers Script
 * Creates 20 demo sellers in the demo workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDemoSellers() {
  try {
    console.log('🚀 Creating demo sellers...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    const USER_ID = '01K1VBYZMWTCT09FWEKBDMCXZM';
    
    // Check if sellers already exist
    const existingSellers = await prisma.people.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        role: 'seller',
        deletedAt: null
      }
    });
    
    console.log(`📊 Existing sellers: ${existingSellers}`);
    
    if (existingSellers > 0) {
      console.log('✅ Sellers already exist, skipping creation');
      return;
    }
    
    // Create 20 demo sellers
    const sellers = [
      { firstName: 'Alex', lastName: 'Chen', fullName: 'Alex Chen', email: 'alex.chen@adrata.com', jobTitle: 'Senior Account Executive' },
      { firstName: 'Sarah', lastName: 'Rodriguez', fullName: 'Sarah Rodriguez', email: 'sarah.rodriguez@adrata.com', jobTitle: 'Strategic Account Manager' },
      { firstName: 'Michael', lastName: 'Thompson', fullName: 'Michael Thompson', email: 'michael.thompson@adrata.com', jobTitle: 'Enterprise Sales Director' },
      { firstName: 'Jennifer', lastName: 'Kim', fullName: 'Jennifer Kim', email: 'jennifer.kim@adrata.com', jobTitle: 'Account Executive' },
      { firstName: 'David', lastName: 'Wilson', fullName: 'David Wilson', email: 'david.wilson@adrata.com', jobTitle: 'Senior Sales Manager' },
      { firstName: 'Lisa', lastName: 'Garcia', fullName: 'Lisa Garcia', email: 'lisa.garcia@adrata.com', jobTitle: 'Account Manager' },
      { firstName: 'James', lastName: 'Martinez', fullName: 'James Martinez', email: 'james.martinez@adrata.com', jobTitle: 'Sales Director' },
      { firstName: 'Maria', lastName: 'Johnson', fullName: 'Maria Johnson', email: 'maria.johnson@adrata.com', jobTitle: 'Senior Sales Rep' },
      { firstName: 'Robert', lastName: 'Davis', fullName: 'Robert Davis', email: 'robert.davis@adrata.com', jobTitle: 'Account Executive' },
      { firstName: 'Emily', lastName: 'Brown', fullName: 'Emily Brown', email: 'emily.brown@adrata.com', jobTitle: 'Sales Manager' },
      { firstName: 'Christopher', lastName: 'Lee', fullName: 'Christopher Lee', email: 'christopher.lee@adrata.com', jobTitle: 'Senior Account Manager' },
      { firstName: 'Jessica', lastName: 'Taylor', fullName: 'Jessica Taylor', email: 'jessica.taylor@adrata.com', jobTitle: 'Sales Representative' },
      { firstName: 'Daniel', lastName: 'Anderson', fullName: 'Daniel Anderson', email: 'daniel.anderson@adrata.com', jobTitle: 'Account Director' },
      { firstName: 'Ashley', lastName: 'Thomas', fullName: 'Ashley Thomas', email: 'ashley.thomas@adrata.com', jobTitle: 'Sales Executive' },
      { firstName: 'Matthew', lastName: 'Jackson', fullName: 'Matthew Jackson', email: 'matthew.jackson@adrata.com', jobTitle: 'Senior Sales Executive' },
      { firstName: 'Amanda', lastName: 'White', fullName: 'Amanda White', email: 'amanda.white@adrata.com', jobTitle: 'Sales Specialist' },
      { firstName: 'Joshua', lastName: 'Harris', fullName: 'Joshua Harris', email: 'joshua.harris@adrata.com', jobTitle: 'Account Manager' },
      { firstName: 'Stephanie', lastName: 'Martin', fullName: 'Stephanie Martin', email: 'stephanie.martin@adrata.com', jobTitle: 'Sales Coordinator' },
      { firstName: 'Andrew', lastName: 'Thompson', fullName: 'Andrew Thompson', email: 'andrew.thompson@adrata.com', jobTitle: 'Sales Analyst' },
      { firstName: 'Nicole', lastName: 'Garcia', fullName: 'Nicole Garcia', email: 'nicole.garcia@adrata.com', jobTitle: 'Sales Consultant' }
    ];
    
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      await prisma.people.create({
        data: {
          id: `seller-${i + 1}`,
          workspaceId: DEMO_WORKSPACE_ID,
          firstName: seller.firstName,
          lastName: seller.lastName,
          fullName: seller.fullName,
          email: seller.email,
          jobTitle: seller.jobTitle,
          department: 'Sales',
          role: 'seller',
          assignedUserId: USER_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log(`✅ Created ${sellers.length} demo sellers`);
    
    // Verify creation
    const sellerCount = await prisma.people.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        role: 'seller',
        deletedAt: null
      }
    });
    
    console.log(`📊 Total sellers in workspace: ${sellerCount}`);
    
  } catch (error) {
    console.error('❌ Error creating demo sellers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createDemoSellers();
}

module.exports = { createDemoSellers };
