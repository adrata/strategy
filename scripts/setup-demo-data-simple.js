/**
 * 🎯 SIMPLE DEMO DATA SETUP
 * Sets up demo data with correct field names
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function setupSimpleDemoData() {
  try {
    console.log('🚀 Setting up simple demo data...');

    const DEMO_WORKSPACE_ID = 'demo-workspace-2025';
    const ADRATA_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

    // 1. Create David Beitler as a user in the demo workspace
    console.log('👤 Creating David Beitler user...');
    const davidUser = await prisma.users.upsert({
      where: { id: 'david-beitler-2025' },
      update: {},
      create: {
        id: 'david-beitler-2025',
        email: 'david@winning-variant.com',
        name: 'David Beitler',
        firstName: 'David',
        lastName: 'Beitler',
        displayName: 'David Beitler',
        title: 'Co-Founder',
        department: 'Executive',
        seniorityLevel: 'C-Level',
        preferredLanguage: 'en',
        timezone: 'America/Los_Angeles',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ David user created:', davidUser.email);

    // 2. Add David to demo workspace
    const existingDavidMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: davidUser.id,
        workspaceId: DEMO_WORKSPACE_ID
      }
    });

    if (!existingDavidMembership) {
      await prisma.workspace_users.create({
        data: {
          userId: davidUser.id,
          workspaceId: DEMO_WORKSPACE_ID,
          role: 'OWNER',
          updatedAt: new Date()
        }
      });
      console.log('✅ David added to demo workspace');
    }

    // 3. Create 10 prospects for the demo
    console.log('👥 Creating 10 demo prospects...');
    const prospectData = [
      {
        id: 'prospect-1-demo-2025',
        fullName: 'Sarah Chen',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@brex.com',
        jobTitle: 'VP of Marketing',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Marketing',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 234-5678',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-2-demo-2025',
        fullName: 'Michael Rodriguez',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'michael.rodriguez@brex.com',
        jobTitle: 'Head of Growth',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Growth',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 345-6789',
        linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-3-demo-2025',
        fullName: 'Jennifer Kim',
        firstName: 'Jennifer',
        lastName: 'Kim',
        email: 'jennifer.kim@firstpremier.com',
        jobTitle: 'Chief Marketing Officer',
        company: 'First Premier Bank',
        industry: 'Banking',
        department: 'Marketing',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 456-7890',
        linkedinUrl: 'https://linkedin.com/in/jenniferkim',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-4-demo-2025',
        fullName: 'David Thompson',
        firstName: 'David',
        lastName: 'Thompson',
        email: 'david.thompson@firstpremier.com',
        jobTitle: 'VP of Digital Strategy',
        company: 'First Premier Bank',
        industry: 'Banking',
        department: 'Strategy',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 567-8901',
        linkedinUrl: 'https://linkedin.com/in/davidthompson',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-5-demo-2025',
        fullName: 'Lisa Wang',
        firstName: 'Lisa',
        lastName: 'Wang',
        email: 'lisa.wang@match.com',
        jobTitle: 'VP of Product',
        company: 'Match Group',
        industry: 'Technology',
        department: 'Product',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 678-9012',
        linkedinUrl: 'https://linkedin.com/in/lisawang',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-6-demo-2025',
        fullName: 'Robert Johnson',
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@match.com',
        jobTitle: 'Head of Engineering',
        company: 'Match Group',
        industry: 'Technology',
        department: 'Engineering',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 789-0123',
        linkedinUrl: 'https://linkedin.com/in/robertjohnson',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-7-demo-2025',
        fullName: 'Amanda Foster',
        firstName: 'Amanda',
        lastName: 'Foster',
        email: 'amanda.foster@brex.com',
        jobTitle: 'Marketing Manager',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Marketing',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 890-1234',
        linkedinUrl: 'https://linkedin.com/in/amandafoster',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-8-demo-2025',
        fullName: 'James Wilson',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@firstpremier.com',
        jobTitle: 'Digital Marketing Director',
        company: 'First Premier Bank',
        industry: 'Banking',
        department: 'Marketing',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 901-2345',
        linkedinUrl: 'https://linkedin.com/in/jameswilson',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-9-demo-2025',
        fullName: 'Maria Garcia',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@match.com',
        jobTitle: 'Product Marketing Manager',
        company: 'Match Group',
        industry: 'Technology',
        department: 'Marketing',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 012-3456',
        linkedinUrl: 'https://linkedin.com/in/mariagarcia',
        status: 'active',
        source: 'Demo Data'
      },
      {
        id: 'prospect-10-demo-2025',
        fullName: 'Kevin Lee',
        firstName: 'Kevin',
        lastName: 'Lee',
        email: 'kevin.lee@brex.com',
        jobTitle: 'Growth Marketing Specialist',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Growth',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 123-4567',
        linkedinUrl: 'https://linkedin.com/in/kevinlee',
        status: 'active',
        source: 'Demo Data'
      }
    ];

    // Create prospects
    for (const prospect of prospectData) {
      await prisma.prospects.upsert({
        where: { id: prospect.id },
        update: {},
        create: {
          ...prospect,
          workspaceId: DEMO_WORKSPACE_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 10 demo prospects');

    // 4. Create speedrun progress data
    console.log('🏃 Creating speedrun progress data...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get Kirk's user ID
    const kirkUser = await prisma.users.findFirst({
      where: { email: 'demo@winning-variant.com' }
    });

    if (kirkUser) {
      await prisma.speedrun_daily_progress.upsert({
        where: { id: 'speedrun-today-demo-2025' },
        update: {},
        create: {
          id: 'speedrun-today-demo-2025',
          userId: kirkUser.id,
          workspaceId: DEMO_WORKSPACE_ID,
          date: today,
          targetCount: 100,
          completedCount: 10,
          viewedCount: 15,
          skippedCount: 2,
          isComplete: false,
          lastActivity: new Date()
        }
      });

      await prisma.speedrun_daily_progress.upsert({
        where: { id: 'speedrun-yesterday-demo-2025' },
        update: {},
        create: {
          id: 'speedrun-yesterday-demo-2025',
          userId: kirkUser.id,
          workspaceId: DEMO_WORKSPACE_ID,
          date: yesterday,
          targetCount: 100,
          completedCount: 7,
          viewedCount: 12,
          skippedCount: 1,
          isComplete: false,
          lastActivity: new Date()
        }
      });
      console.log('✅ Created speedrun progress data');
    } else {
      console.log('⚠️ Kirk user not found, skipping speedrun data');
    }

    // 5. Create Adrata partnership for both workspaces
    console.log('🤝 Creating Adrata partnerships...');
    
    // For demo workspace
    await prisma.partners.upsert({
      where: { id: 'adrata-partner-demo-2025' },
      update: {},
      create: {
        id: 'adrata-partner-demo-2025',
        workspaceId: DEMO_WORKSPACE_ID,
        name: 'Adrata',
        company: 'Adrata',
        industry: 'SaaS',
        partnershipType: 'Technology Partner',
        partnershipModel: 'Strategic Alliance',
        email: 'ross@adrata.com',
        phone: '+1 (555) 123-4567',
        website: 'https://adrata.com',
        country: 'USA',
        city: 'San Francisco',
        state: 'CA',
        updatedAt: new Date()
      }
    });

    // For adrata workspace
    await prisma.partners.upsert({
      where: { id: 'winning-variant-partner-adrata-2025' },
      update: {},
      create: {
        id: 'winning-variant-partner-adrata-2025',
        workspaceId: ADRATA_WORKSPACE_ID,
        name: 'Winning Variant',
        company: 'Winning Variant',
        industry: 'SaaS',
        partnershipType: 'Client',
        partnershipModel: 'Direct Client',
        email: 'kirk@winning-variant.com',
        phone: '+1 (555) 987-6543',
        website: 'https://winningvariant.com',
        country: 'USA',
        city: 'San Francisco',
        state: 'CA',
        updatedAt: new Date()
      }
    });
    console.log('✅ Created Adrata partnerships');

    console.log('🎉 Simple demo data setup finished!');
    console.log('');
    console.log('Summary:');
    console.log('- David Beitler created as user and added to demo workspace');
    console.log('- 10 demo prospects created');
    console.log('- Speedrun progress data created');
    console.log('- Adrata partnerships created for both workspaces');
    console.log('');
    console.log('You can now use the demo environment with complete data!');

  } catch (error) {
    console.error('❌ Error setting up simple demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupSimpleDemoData()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
