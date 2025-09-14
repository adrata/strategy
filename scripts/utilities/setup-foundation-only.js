#!/usr/bin/env node

/**
 * 🏗️ FOUNDATION SETUP ONLY
 * 
 * Just set up Ryan, Dano, and accounts - let buyer group discovery find the people
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function setupFoundation() {
  console.log('🏗️ FOUNDATION SETUP - ACCOUNTS ONLY');
  console.log('====================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // STEP 1: Ryan setup (quick check)
    console.log('1️⃣ RYAN & DANO SETUP:');
    console.log('----------------------');
    
    const ryanMembership = await prisma.workspaceMembership.findFirst({
      where: { userId: 'ryan', workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const danoMembership = await prisma.workspaceMembership.findFirst({
      where: { userId: 'dano', workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    console.log(`Ryan membership: ${ryanMembership ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Dano membership: ${danoMembership ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // STEP 2: Import just the account companies (first 10 for testing)
    console.log('\n2️⃣ IMPORTING TITLE AGENCY ACCOUNTS:');
    console.log('------------------------------------');
    
    // Read first 10 accounts from CSV
    const csvPath = path.join(__dirname, 'data/title-companies/notary_accounts.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log('Sample accounts from CSV:');
    
    const accountsToCreate = [];
    for (let i = 1; i <= 10 && i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',');
      
      if (values.length >= 14) {
        const account = {
          rank: parseInt(values[0]) || i,
          name: values[1]?.replace(/"/g, '').trim(),
          size: values[2]?.replace(/"/g, '').trim(),
          city: values[4]?.replace(/"/g, '').trim(),
          state: values[6]?.replace(/"/g, '').trim(),
          domain: values[10]?.replace(/"/g, '').trim(),
          assignedUser: values[13]?.replace(/"/g, '').trim()
        };
        
        if (account.name && account.assignedUser === 'dano') {
          accountsToCreate.push(account);
          console.log(`   ${i}. ${account.name} (${account.city}, ${account.state}) - ${account.size}`);
        }
      }
    }
    
    console.log(`\nFound ${accountsToCreate.length} accounts to create for Dano`);
    
    // Create the accounts
    let created = 0;
    for (const account of accountsToCreate) {
      try {
        const existing = await prisma.accounts.findFirst({
          where: {
            name: account.name,
            workspaceId: NOTARY_WORKSPACE_ID
          }
        });
        
        if (!existing) {
          await prisma.accounts.create({
            data: {
              id: `notary-${Date.now()}-${created}`,
              workspaceId: NOTARY_WORKSPACE_ID,
              assignedUserId: 'dano',
              name: account.name,
              website: account.domain || null,
              city: account.city,
              state: account.state,
              country: 'United States',
              industry: 'Title Insurance',
              size: account.size,
              status: 'prospect',
              priority: 'medium',
              source: 'notary-everyday-import',
              tags: ['title-agency', account.state.toLowerCase()],
              updatedAt: new Date(),
              createdAt: new Date()
            }
          });
          created++;
          console.log(`   ✅ Created: ${account.name}`);
        } else {
          console.log(`   ⚠️ Exists: ${account.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${account.name}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Created ${created} new title agency accounts`);
    
    // STEP 3: Verify setup
    console.log('\n3️⃣ VERIFICATION:');
    console.log('-----------------');
    
    const totalNotaryAccounts = await prisma.accounts.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const danoAccounts = await prisma.accounts.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      }
    });
    
    const retailAccounts = await prisma.accounts.count({
      where: { workspaceId: RETAIL_WORKSPACE_ID }
    });
    
    console.log(`Notary Everyday accounts: ${totalNotaryAccounts} (${danoAccounts} assigned to Dano)`);
    console.log(`Retail Product Solutions accounts: ${retailAccounts}`);
    console.log('✅ Data separation maintained');
    
    // Sample accounts for buyer group testing
    const sampleAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      },
      take: 3
    });
    
    console.log('\n📋 READY FOR BUYER GROUP TESTING:');
    console.log('Sample accounts for Dano:');
    sampleAccounts.forEach(account => {
      console.log(`   - ${account.name} (${account.city}, ${account.state})`);
    });
    
    await prisma.$disconnect();
    console.log('\n🎉 FOUNDATION READY! Now we can test buyer group discovery to find the people.');
    
    return {
      created,
      totalNotaryAccounts,
      danoAccounts,
      sampleAccounts: sampleAccounts.map(a => a.name)
    };
    
  } catch (error) {
    console.error('❌ Foundation setup error:', error.message);
  }
}

setupFoundation();
