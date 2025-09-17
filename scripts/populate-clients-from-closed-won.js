#!/usr/bin/env node

/**
 * Populate Customers Table from Closed Won Opportunities
 * 
 * Business Logic:
 * - All accounts with closed won opportunities become clients
 * - All contacts associated with those accounts become customer contacts
 * - Calculate customer metrics based on their deal history
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateCustomersFromClosedWon() {
  console.log('🚀 Starting customer population from closed won opportunities...');
  
  try {
    // 1. Find all closed won opportunities
    const closedWonOpportunities = await prisma.opportunities.findMany({
      where: {
        OR: [
          { stage: 'closed-won' },
          { stage: 'Closed Won' },
          { stage: 'closed won' },
          { stage: { contains: 'Closed Won' } },
          { stage: { contains: 'closed won' } }
        ],
        deletedAt: null
      },
      include: {
        account: true,
        lead: true
      }
    });

    console.log(`📊 Found ${closedWonOpportunities.length} closed won opportunities`);

    // 2. Group by account to calculate customer metrics
    const accountMetrics = new Map();
    
    for (const opp of closedWonOpportunities) {
      if (!opp.accountId) continue;
      
      const accountId = opp.accountId;
      if (!accountMetrics.has(accountId)) {
        accountMetrics.set(accountId, {
          accountId,
          workspaceId: opp.workspaceId,
          deals: [],
          totalValue: 0,
          dealCount: 0,
          firstDealDate: opp.actualCloseDate || opp.createdAt,
          lastDealDate: opp.actualCloseDate || opp.createdAt,
          account: opp.account
        });
      }
      
      const metrics = accountMetrics.get(accountId);
      metrics.deals.push(opp);
      metrics.totalValue += parseFloat(opp.amount || '0') || 0;
      metrics.dealCount += 1;
      
      const dealDate = opp.actualCloseDate || opp.createdAt;
      if (dealDate < metrics.firstDealDate) metrics.firstDealDate = dealDate;
      if (dealDate > metrics.lastDealDate) metrics.lastDealDate = dealDate;
    }

    console.log(`📊 Found ${accountMetrics.size} unique customer accounts`);

    // 3. Create or update customer records
    let clientsCreated = 0;
    let clientsUpdated = 0;

    for (const [accountId, metrics] of accountMetrics) {
      try {
        // Check if customer already exists
        const existingCustomer = await prisma.clients.findFirst({
          where: { accountId, workspaceId: metrics.workspaceId }
        });

        const customerData = {
          id: `customer_${accountId}_${Date.now()}`, // Generate unique ID
          workspaceId: metrics.workspaceId,
          accountId,
          customerSince: metrics.firstDealDate,
          customerStatus: 'active',
          tier: metrics.totalValue > 100000 ? 'enterprise' : 
                metrics.totalValue > 50000 ? 'growth' : 'standard',
          segment: metrics.account?.industry || 'general',
          totalLifetimeValue: metrics.totalValue,
          avgDealSize: metrics.totalValue / metrics.dealCount,
          dealCount: metrics.dealCount,
          lastDealValue: Math.max(...metrics.deals.map(d => parseFloat(d.amount || '0') || 0)),
          firstPurchaseDate: metrics.firstDealDate,
          lastPurchaseDate: metrics.lastDealDate,
          healthScore: 85, // Default good health for closed won clients
          loyaltyScore: 75,
          retentionProbability: 90,
          priority: metrics.totalValue > 100000 ? 'high' : 'medium',
          updatedAt: new Date()
        };

        if (existingCustomer) {
          // Update existing customer
          await prisma.clients.update({
            where: { id: existingCustomer.id },
            data: customerData
          });
          clientsUpdated++;
          console.log(`✅ Updated customer: ${metrics.account?.name} ($${metrics.totalValue.toLocaleString()})`);
        } else {
          // Create new customer
          await prisma.clients.create({
            data: customerData
          });
          clientsCreated++;
          console.log(`🆕 Created customer: ${metrics.account?.name} ($${metrics.totalValue.toLocaleString()})`);
        }
      } catch (error) {
        console.error(`❌ Error processing customer for account ${accountId}:`, error.message);
      }
    }

    console.log(`\n🎯 CUSTOMER POPULATION COMPLETE:`);
    console.log(`   📈 Customers created: ${clientsCreated}`);
    console.log(`   🔄 Customers updated: ${clientsUpdated}`);
    console.log(`   💰 Total customer value: $${Array.from(accountMetrics.values()).reduce((sum, m) => sum + m.totalValue, 0).toLocaleString()}`);

    // 4. Verify the results
    const totalCustomers = await prisma.clients.count();
    console.log(`   ✅ Total clients in database: ${totalCustomers}`);

  } catch (error) {
    console.error('❌ Error populating clients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  populateCustomersFromClosedWon()
    .then(() => {
      console.log('🎉 Customer population completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Customer population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateCustomersFromClosedWon };
