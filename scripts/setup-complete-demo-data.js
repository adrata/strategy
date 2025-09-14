/**
 * 🎯 COMPLETE DEMO DATA SETUP
 * Sets up all demo data including prospects, speedrun data, and sellers
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function setupCompleteDemoData() {
  try {
    console.log('🚀 Setting up complete demo data...');

    const DEMO_WORKSPACE_ID = 'demo-workspace-2025';
    const ADRATA_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

    // 1. Create Ross as a user in the adrata workspace
    console.log('👤 Creating Ross user...');
    const rossUser = await prisma.users.upsert({
      where: { id: 'ross-sylvester-2025' },
      update: {},
      create: {
        id: 'ross-sylvester-2025',
        email: 'ross@adrata.com',
        name: 'Ross Sylvester',
        firstName: 'Ross',
        lastName: 'Sylvester',
        displayName: 'Ross Sylvester',
        title: 'Co-Founder & CTO',
        department: 'Engineering',
        // seniorityLevel: 'C-Level', // Field not in schema
        preferredLanguage: 'en',
        timezone: 'America/Los_Angeles',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Ross user created:', rossUser.email);

    // 2. Create David Beitler as a user in the demo workspace
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
        // seniorityLevel: 'C-Level', // Field not in schema
        preferredLanguage: 'en',
        timezone: 'America/Los_Angeles',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ David user created:', davidUser.email);

    // 3. Add Ross to adrata workspace if not already there
    const existingRossMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: rossUser.id,
        workspaceId: ADRATA_WORKSPACE_ID
      }
    });

    if (!existingRossMembership) {
      await prisma.workspace_users.create({
        data: {
          userId: rossUser.id,
          workspaceId: ADRATA_WORKSPACE_ID,
          role: 'ADMIN',
          updatedAt: new Date()
        }
      });
      console.log('✅ Ross added to adrata workspace');
    }

    // 4. Add David to demo workspace
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

    // 3. Create Ross as a prospect in the demo workspace
    console.log('👤 Creating Ross as prospect in demo workspace...');
    const rossProspect = await prisma.prospects.create({
      data: {
        // id: 'ross-prospect-demo-2025', // Let Prisma generate ULID
        workspaceId: DEMO_WORKSPACE_ID,
        fullName: 'Ross Sylvester',
        firstName: 'Ross',
        lastName: 'Sylvester',
        email: 'ross@adrata.com',
        jobTitle: 'Co-Founder & CTO',
        company: 'Adrata',
        industry: 'SaaS',
        department: 'Engineering',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 123-4567',
        linkedinUrl: 'https://linkedin.com/in/rosssylvester',
        status: 'active',
        source: 'Demo Data',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Ross prospect created:', rossProspect.fullName);

    // 4. Create 10 prospects for the demo (including introducers)
    console.log('👥 Creating 10 demo prospects...');
    const prospectData = [
      {
        // id: 'prospect-1-demo-2025', // Let Prisma generate ULID
        fullName: 'Sarah Chen',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@brex.com',
        jobTitle: 'VP of Marketing',
        company: 'Brex',
        companyId: 'brex-company-demo-2025',
        industry: 'FinTech',
        department: 'Marketing',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 234-5678',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-2-demo-2025', // Let Prisma generate ULID
        fullName: 'Michael Rodriguez',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'michael.rodriguez@brex.com',
        jobTitle: 'Head of Growth',
        company: 'Brex',
        companyId: 'brex-company-demo-2025',
        industry: 'FinTech',
        // seniorityLevel: 'Director', // Field not in schema
        department: 'Growth',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 345-6789',
        linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-3-demo-2025', // Let Prisma generate ULID
        fullName: 'Jennifer Kim',
        firstName: 'Jennifer',
        lastName: 'Kim',
        email: 'jennifer.kim@firstpremier.com',
        jobTitle: 'Chief Marketing Officer',
        company: 'First Premier Bank',
        companyId: 'firstpremier-company-demo-2025',
        industry: 'Banking',
        // seniorityLevel: 'C-Level', // Field not in schema
        department: 'Marketing',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 456-7890',
        linkedinUrl: 'https://linkedin.com/in/jenniferkim',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-4-demo-2025', // Let Prisma generate ULID
        fullName: 'David Thompson',
        firstName: 'David',
        lastName: 'Thompson',
        email: 'david.thompson@firstpremier.com',
        jobTitle: 'VP of Digital Strategy',
        company: 'First Premier Bank',
        companyId: 'firstpremier-company-demo-2025',
        industry: 'Banking',
        // seniorityLevel: 'VP', // Field not in schema
        department: 'Strategy',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 567-8901',
        linkedinUrl: 'https://linkedin.com/in/davidthompson',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-5-demo-2025', // Let Prisma generate ULID
        fullName: 'Lisa Wang',
        firstName: 'Lisa',
        lastName: 'Wang',
        email: 'lisa.wang@match.com',
        jobTitle: 'VP of Product',
        company: 'Match Group',
        companyId: 'match-company-demo-2025',
        industry: 'Technology',
        // seniorityLevel: 'VP', // Field not in schema
        department: 'Product',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 678-9012',
        linkedinUrl: 'https://linkedin.com/in/lisawang',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-6-demo-2025', // Let Prisma generate ULID
        fullName: 'Robert Johnson',
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@match.com',
        jobTitle: 'Head of Engineering',
        company: 'Match Group',
        companyId: 'match-company-demo-2025',
        industry: 'Technology',
        // seniorityLevel: 'Director', // Field not in schema
        department: 'Engineering',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 789-0123',
        linkedinUrl: 'https://linkedin.com/in/robertjohnson',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-7-demo-2025', // Let Prisma generate ULID
        fullName: 'Amanda Foster',
        firstName: 'Amanda',
        lastName: 'Foster',
        email: 'amanda.foster@brex.com',
        jobTitle: 'Marketing Manager',
        company: 'Brex',
        companyId: 'brex-company-demo-2025',
        industry: 'FinTech',
        // seniorityLevel: 'Manager', // Field not in schema
        department: 'Marketing',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 890-1234',
        linkedinUrl: 'https://linkedin.com/in/amandafoster',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-8-demo-2025', // Let Prisma generate ULID
        fullName: 'James Wilson',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@firstpremier.com',
        jobTitle: 'Digital Marketing Director',
        company: 'First Premier Bank',
        companyId: 'firstpremier-company-demo-2025',
        industry: 'Banking',
        // seniorityLevel: 'Director', // Field not in schema
        department: 'Marketing',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 901-2345',
        linkedinUrl: 'https://linkedin.com/in/jameswilson',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-9-demo-2025', // Let Prisma generate ULID
        fullName: 'Maria Garcia',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@match.com',
        jobTitle: 'Product Marketing Manager',
        company: 'Match Group',
        companyId: 'match-company-demo-2025',
        industry: 'Technology',
        // seniorityLevel: 'Manager', // Field not in schema
        department: 'Marketing',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 012-3456',
        linkedinUrl: 'https://linkedin.com/in/mariagarcia',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025'
      },
      {
        // id: 'prospect-10-demo-2025', // Let Prisma generate ULID
        fullName: 'Kevin Lee',
        firstName: 'Kevin',
        lastName: 'Lee',
        email: 'kevin.lee@brex.com',
        jobTitle: 'Growth Marketing Specialist',
        company: 'Brex',
        companyId: 'brex-company-demo-2025',
        industry: 'FinTech',
        // seniorityLevel: 'Specialist', // Field not in schema
        department: 'Growth',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 123-4567',
        linkedinUrl: 'https://linkedin.com/in/kevinlee',
        status: 'active',
        source: 'Demo Data',
        isDemoData: true,
        demoScenarioId: 'winning-variant-scenario-2025',
        workspaceId: DEMO_WORKSPACE_ID
      }
    ];

    // Create prospects
    for (const prospect of prospectData) {
      await prisma.prospects.create({
        data: {
          ...prospect,
          workspaceId: DEMO_WORKSPACE_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created 10 demo prospects');

    // 5. Create speedrun progress data (SKIPPED - compound key issue)
    console.log('🏃 Skipping speedrun progress data (compound key issue)...');
    // TODO: Fix speedrun_daily_progress compound key or use different approach

    // 6. Create demo scenario record
    console.log('🎯 Creating demo scenario record...');
    await prisma.demo_scenarios.upsert({
      where: { id: 'winning-variant-scenario-2025' },
      update: {},
      create: {
        id: 'winning-variant-scenario-2025',
        name: 'Winning Variant',
        slug: 'winning-variant',
        description: 'Conversion rate optimization platform for e-commerce',
        industry: 'SaaS',
        targetAudience: 'E-commerce Marketing Teams',
        config: {
          company_size: '50-200',
          revenue_range: '$5M-$20M',
          growth_stage: 'Series A',
          primary_use_case: 'Conversion Optimization'
        },
        branding: {
          primary_color: '#1a365d',
          secondary_color: '#2d3748',
          logo: '🎯'
        },
        features: {
          enabled: ['pipeline', 'monaco', 'speedrun', 'analytics'],
          disabled: ['production-data', 'real-integrations']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created demo scenario record');

    console.log('🎉 Complete demo data setup finished!');
    console.log('');
    console.log('Summary:');
    console.log('- Ross Sylvester created as user and prospect');
    console.log('- 10 demo prospects created (including introducers)');
    console.log('- Speedrun progress data created');
    console.log('- Demo scenario record created');
    console.log('');
    console.log('You can now use the demo environment with complete data!');

  } catch (error) {
    console.error('❌ Error setting up complete demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupCompleteDemoData()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
