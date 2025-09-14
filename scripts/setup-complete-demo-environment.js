#!/usr/bin/env node

/**
 * 🎯 COMPLETE DEMO ENVIRONMENT SETUP
 * Creates a comprehensive demo environment with all necessary data
 * Based on complete database schema analysis
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupCompleteDemoEnvironment() {
  try {
    console.log('🚀 Setting up complete demo environment...\n');

    // 1. Create demo scenario
    console.log('📋 Creating demo scenario...');
    const demoScenario = await prisma.demo_scenarios.upsert({
      where: { id: 'demo-scenario-winning-variant' },
      update: {},
      create: {
        id: 'demo-scenario-winning-variant',
        name: 'Winning Variant',
        slug: 'winning-variant',
        description: 'Conversion rate optimization platform for e-commerce',
        industry: 'SaaS',
        targetAudience: 'E-commerce Marketing Teams',
        isActive: true,
        sortOrder: 1,
        config: {
          features: ['A/B Testing', 'Conversion Analytics', 'Personalization'],
          integrations: ['Shopify', 'WooCommerce', 'Magento'],
          pricing: 'Enterprise'
        },
        branding: {
          primaryColor: '#2563eb',
          secondaryColor: '#1e40af',
          logo: 'https://winningvariant.com/logo.png'
        },
        features: {
          abTesting: true,
          analytics: true,
          personalization: true,
          segmentation: true
        },
        demoUser: {
          id: 'demo-user-2025',
          name: 'Kirk Morales',
          email: 'demo@winning-variant.com',
          role: 'Founder & CEO'
        },
        updatedAt: new Date()
      }
    });
    console.log('✅ Demo scenario created:', demoScenario.name);

    // 2. Create demo user
    console.log('👤 Creating demo user...');
    const demoUser = await prisma.users.upsert({
      where: { id: 'demo-user-2025' },
      update: {},
      create: {
        id: 'demo-user-2025',
        email: 'demo@winning-variant.com',
        name: 'Kirk Morales',
        firstName: 'Kirk',
        lastName: 'Morales',
        displayName: 'Kirk Morales',
        title: 'Founder & CEO',
        department: 'Executive',
        seniorityLevel: 'C-Level',
        preferredLanguage: 'en',
        timezone: 'America/Los_Angeles',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Demo user created:', demoUser.email);

    // 3. Create demo workspace
    console.log('🏢 Creating demo workspace...');
    const demoWorkspace = await prisma.workspaces.upsert({
      where: { id: 'demo-workspace-2025' },
      update: {},
      create: {
        id: 'demo-workspace-2025',
        name: 'Winning Variant',
        slug: 'winning-variant',
        description: 'Demo workspace for Winning Variant CRO platform',
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Demo workspace created:', demoWorkspace.name);

    // 4. Create workspace membership
    console.log('🔗 Creating workspace membership...');
    const existingMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: demoUser.id,
        workspaceId: demoWorkspace.id
      }
    });
    
    if (!existingMembership) {
      await prisma.workspace_users.create({
        data: {
          userId: demoUser.id,
          workspaceId: demoWorkspace.id,
          role: 'OWNER',
          updatedAt: new Date()
        }
      });
      console.log('✅ Workspace membership created');
    } else {
      console.log('✅ Workspace membership already exists');
    }

    // 5. Create demo companies
    console.log('🏭 Creating demo companies...');
    const companies = [
      {
        id: 'company_match_group',
        workspaceId: demoWorkspace.id,
        name: 'Match Group',
        legalName: 'Match Group, Inc.',
        tradingName: 'Match.com',
        website: 'https://match.com',
        email: 'contact@match.com',
        phone: '+1-214-576-9352',
        address: '8750 North Central Expressway',
        city: 'Dallas',
        state: 'TX',
        country: 'United States',
        postalCode: '75231',
        industry: 'Technology',
        sector: 'Online Dating',
        size: '1000-5000',
        revenue: 3200000000.00,
        currency: 'USD',
        description: 'Leading online dating platform with multiple brands including Match.com, Tinder, and Hinge',
        notes: 'High-value prospect with significant e-commerce conversion optimization needs',
        tags: ['e-commerce', 'dating', 'high-value', 'conversion-optimization'],
        customFields: {
          snowflake: {
            isCustomer: true,
            usage: 'Data warehouse and analytics platform',
            implementationDate: '2021-08-20',
            primaryUseCase: 'User behavior analytics and matching algorithm optimization',
            dataVolume: 'Very High',
            notes: 'Using Snowflake for user interaction data, matching algorithms, and conversion funnel analysis across multiple dating platforms'
          }
        },
        preferredLanguage: 'en',
        timezone: 'America/Chicago',
        accountType: 'enterprise',
        primaryContact: 'Sarah Johnson',
        tier: 'A',
        externalId: 'MG-001',
        vertical: 'Online Dating',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'company_brex',
        workspaceId: demoWorkspace.id,
        name: 'Brex',
        legalName: 'Brex Inc.',
        tradingName: 'Brex',
        website: 'https://brex.com',
        email: 'contact@brex.com',
        phone: '+1-415-967-0000',
        address: '1 Hacker Way',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
        postalCode: '94105',
        industry: 'Financial Technology',
        sector: 'FinTech',
        size: '500-1000',
        revenue: 500000000.00,
        currency: 'USD',
        description: 'Corporate credit card and financial services platform for startups and enterprises',
        notes: 'Fast-growing fintech with complex conversion funnel optimization needs',
        tags: ['fintech', 'startup', 'credit-cards', 'conversion-optimization'],
        customFields: {
          snowflake: {
            isCustomer: true,
            usage: 'Data warehouse and analytics platform',
            implementationDate: '2020-11-10',
            primaryUseCase: 'Financial transaction analytics and risk assessment',
            dataVolume: 'High',
            notes: 'Using Snowflake for transaction monitoring, fraud detection, and customer spending pattern analysis'
          }
        },
        preferredLanguage: 'en',
        timezone: 'America/Los_Angeles',
        accountType: 'enterprise',
        primaryContact: 'Michael Chen',
        tier: 'A',
        externalId: 'BX-002',
        vertical: 'FinTech',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'company_first_premier',
        workspaceId: demoWorkspace.id,
        name: 'First Premier Bank',
        legalName: 'First Premier Bank',
        tradingName: 'First Premier',
        website: 'https://firstpremier.com',
        email: 'contact@firstpremier.com',
        phone: '+1-605-338-8000',
        address: '601 South Minnesota Avenue',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'United States',
        postalCode: '57104',
        industry: 'Banking',
        sector: 'Financial Services',
        size: '1000-5000',
        revenue: 800000000.00,
        currency: 'USD',
        description: 'Regional bank specializing in credit cards and consumer banking services',
        notes: 'Traditional bank looking to optimize digital customer acquisition',
        tags: ['banking', 'credit-cards', 'digital-transformation', 'conversion-optimization'],
        customFields: {
          snowflake: {
            isCustomer: true,
            usage: 'Data warehouse and analytics platform',
            implementationDate: '2023-01-15',
            primaryUseCase: 'Regulatory compliance and customer analytics',
            dataVolume: 'Medium',
            notes: 'Using Snowflake for regulatory reporting, customer segmentation, and digital banking analytics'
          }
        },
        preferredLanguage: 'en',
        timezone: 'America/Chicago',
        accountType: 'enterprise',
        primaryContact: 'David Wilson',
        tier: 'A',
        externalId: 'FP-003',
        vertical: 'Banking',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    for (const company of companies) {
      await prisma.companies.upsert({
        where: { id: company.id },
        update: company,
        create: company
      });
    }
    console.log(`✅ Created ${companies.length} demo companies`);

    // 6. Skip creating other record types for now - will add later
    console.log('⏭️ Skipping people, leads, prospects, opportunities, and buyer groups for now');
    console.log('   These will be added in future iterations');

    console.log('\n🎉 Complete demo environment setup finished!');
    console.log('');
    console.log('📊 Demo Environment Summary:');
    console.log(`   👤 Demo User: ${demoUser.name} (${demoUser.email})`);
    console.log(`   🏢 Demo Workspace: ${demoWorkspace.name}`);
    console.log(`   📋 Demo Scenario: ${demoScenario.name}`);
    console.log(`   🏭 Companies: ${companies.length}`);
    console.log(`   👥 People: 0 (to be added later)`);
    console.log(`   🎯 Leads: 0 (to be added later)`);
    console.log(`   👥 Prospects: 0 (to be added later)`);
    console.log(`   💰 Opportunities: 0 (to be added later)`);
    console.log(`   👥 Buyer Groups: 0 (to be added later)`);
    console.log('');
    console.log('🚀 Demo environment is ready for use!');
    console.log('   Access via: /demo/winning-variant/pipeline/dashboard');
    console.log('   Next: Add people, leads, prospects, and opportunities records');

  } catch (error) {
    console.error('❌ Error setting up demo environment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupCompleteDemoEnvironment()
  .then(() => {
    console.log('✅ Complete demo environment setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Complete demo environment setup failed:', error);
    process.exit(1);
  });
