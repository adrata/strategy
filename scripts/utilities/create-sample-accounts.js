#!/usr/bin/env node

/**
 * 🏗️ CREATE SAMPLE TITLE AGENCY ACCOUNTS
 * 
 * Create a few sample accounts so we can test buyer group discovery
 */

const { PrismaClient } = require('@prisma/client');

const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

async function createSampleAccounts() {
  console.log('🏗️ CREATING SAMPLE TITLE AGENCY ACCOUNTS');
  console.log('=========================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // Sample title agencies from the CSV
    const sampleAccounts = [
      {
        name: 'ClearEdge Title',
        website: 'cetitle.com',
        city: 'Clearwater',
        state: 'FL',
        size: '51-200 employees'
      },
      {
        name: 'Great American Title Agency',
        website: 'azgat.com', 
        city: 'Phoenix',
        state: 'AZ',
        size: '51-200 employees'
      },
      {
        name: 'Magnus Title Agency',
        website: 'magnustitle.com',
        city: 'Phoenix', 
        state: 'AZ',
        size: '201-500 employees'
      }
    ];
    
    console.log('Creating sample title agency accounts for Dano...');
    
    let created = 0;
    for (const account of sampleAccounts) {
      try {
        const existing = await prisma.accounts.findFirst({
          where: {
            name: account.name,
            workspaceId: NOTARY_WORKSPACE_ID
          }
        });
        
        if (!existing) {
          const newAccount = await prisma.accounts.create({
            data: {
              id: `notary-sample-${Date.now()}-${created}`,
              workspaceId: NOTARY_WORKSPACE_ID,
              assignedUserId: 'dano',
              name: account.name,
              website: account.website,
              city: account.city,
              state: account.state,
              country: 'United States',
              industry: 'Title Insurance',
              sector: 'Real Estate Services',
              size: account.size,
              description: `Title agency in ${account.city}, ${account.state}`,
              status: 'prospect',
              priority: 'high',
              source: 'notary-everyday-sample',
              tags: ['title-agency', 'notary-services', account.state.toLowerCase()],
              updatedAt: new Date(),
              createdAt: new Date()
            }
          });
          created++;
          console.log(`   ✅ Created: ${account.name}`);
        } else {
          console.log(`   ⚠️ Already exists: ${account.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${account.name}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Created ${created} sample accounts`);
    
    // Verify the setup
    const danoAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      }
    });
    
    console.log('\n📋 DANO\'S TITLE AGENCY ACCOUNTS:');
    console.log('----------------------------------');
    danoAccounts.forEach((account, i) => {
      console.log(`   ${i + 1}. ${account.name} (${account.city}, ${account.state})`);
      console.log(`      Website: ${account.website || 'N/A'}`);
      console.log(`      Size: ${account.size || 'N/A'}`);
    });
    
    await prisma.$disconnect();
    
    console.log('\n🚀 FOUNDATION READY!');
    console.log('Now we can test buyer group discovery to find decision makers at these title agencies.');
    
    return {
      accountsCreated: created,
      totalDanoAccounts: danoAccounts.length,
      sampleAccountNames: danoAccounts.map(a => a.name)
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createSampleAccounts();
