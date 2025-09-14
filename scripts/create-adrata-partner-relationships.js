#!/usr/bin/env node

/**
 * Create Adrata Partner Relationships
 * 
 * Business Logic:
 * - Every client workspace should have Adrata as a partner
 * - Adrata is the service provider for all clients
 * - Create the partner relationship if it doesn't exist
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdrataPartnerRelationships() {
  console.log('🤝 Creating Adrata partner relationships for all client workspaces...');
  
  try {
    // 1. Get all unique workspaces that have clients
    const clientWorkspaces = await prisma.clients.findMany({
      select: {
        workspaceId: true
      },
      distinct: ['workspaceId']
    });

    console.log(`📊 Found ${clientWorkspaces.length} client workspaces`);

    let partnersCreated = 0;
    let partnersExisted = 0;

    // 2. For each workspace, ensure Adrata partner exists
    for (const workspace of clientWorkspaces) {
      const workspaceId = workspace.workspaceId;
      
      try {
        // Check if Adrata partner already exists
        const existingPartner = await prisma.partners.findFirst({
          where: { 
            workspaceId,
            name: 'Adrata'
          }
        });

        if (existingPartner) {
          partnersExisted++;
          console.log(`✅ Adrata partner already exists for workspace: ${workspaceId}`);
          continue;
        }

        // Create Adrata partner for this workspace
        const adrataPartner = await prisma.partners.create({
          data: {
            id: `partner_adrata_${workspaceId}_${Date.now()}`,
            workspaceId,
            name: 'Adrata',
            company: 'Adrata Inc.',
            email: 'partnerships@adrata.com',
            website: 'https://adrata.com',
            industry: 'Business Intelligence',
            size: 'Growth Stage',
            country: 'United States',
            city: 'Austin',
            state: 'Texas',
            partnershipType: 'Technology',
            partnershipModel: 'Service Provider',
            partnershipStartDate: new Date(),
            partnershipValue: 'High',
            revenueShare: '0%', // Adrata is the service provider, not revenue sharing
            territory: 'Global',
            exclusivity: 'Exclusive',
            performanceScore: 95,
            certificationLevel: 'Platinum',
            updatedAt: new Date()
          }
        });

        partnersCreated++;
        console.log(`🆕 Created Adrata partner for workspace: ${workspaceId}`);
        
      } catch (error) {
        console.error(`❌ Error creating Adrata partner for workspace ${workspaceId}:`, error.message);
      }
    }

    console.log(`\n🎯 ADRATA PARTNER CREATION COMPLETE:`);
    console.log(`   🆕 Partners created: ${partnersCreated}`);
    console.log(`   ✅ Partners already existed: ${partnersExisted}`);

    // 3. Verify the results
    const totalPartners = await prisma.partners.count({
      where: { name: 'Adrata' }
    });
    console.log(`   🤝 Total Adrata partnerships: ${totalPartners}`);

  } catch (error) {
    console.error('❌ Error creating Adrata partnerships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createAdrataPartnerRelationships()
    .then(() => {
      console.log('🎉 Adrata partner relationships created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Adrata partner creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdrataPartnerRelationships };
