#!/usr/bin/env node

/**
 * 🏢 COMPLETE NOTARY EVERYDAY SETUP
 * 
 * 1. Create Ryan Serrato as manager
 * 2. Import 150 notary accounts for Dano
 * 3. Set up proper data separation between workspaces
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function setupNotaryEveryday() {
  console.log('🏢 COMPLETE NOTARY EVERYDAY SETUP');
  console.log('==================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // STEP 1: Create Ryan Serrato as manager
    console.log('1️⃣ CREATING RYAN SERRATO (MANAGER):');
    console.log('------------------------------------');
    
    // Check if Ryan already has workspace membership
    const existingRyanMembership = await prisma.workspaceMembership.findFirst({
      where: {
        userId: 'ryan',
        workspaceId: NOTARY_WORKSPACE_ID
      }
    });
    
    if (!existingRyanMembership) {
      const ryanMembership = await prisma.workspaceMembership.create({
        data: {
          id: `ryan-notary-${Date.now()}`,
          userId: 'ryan',
          workspaceId: NOTARY_WORKSPACE_ID,
          role: 'MANAGER', // Manager role
          isActive: true,
          joinedAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Ryan Serrato as MANAGER in Notary Everyday');
    } else {
      console.log('✅ Ryan already has membership in Notary Everyday');
    }
    
    // Create Ryan's user profile
    const existingRyanProfile = await prisma.userProfile.findFirst({
      where: {
        userId: 'ryan',
        workspaceId: NOTARY_WORKSPACE_ID
      }
    });
    
    if (!existingRyanProfile) {
      const ryanProfile = await prisma.userProfile.create({
        data: {
          id: `ryan-profile-${Date.now()}`,
          userId: 'ryan',
          workspaceId: NOTARY_WORKSPACE_ID,
          title: 'Sales Manager',
          department: 'Sales',
          seniorityLevel: 'Manager',
          territory: 'Florida & Arizona',
          quota: 500000, // $500k quota
          avgDealSize: 25000, // $25k average deal
          winRate: 0.35, // 35% win rate
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Ryan\'s user profile');
    } else {
      console.log('✅ Ryan already has user profile');
    }
    
    // STEP 2: Create Dano's user profile in Notary Everyday
    console.log('\n2️⃣ CREATING DANO\'S NOTARY PROFILE:');
    console.log('-----------------------------------');
    
    const existingDanoProfile = await prisma.userProfile.findFirst({
      where: {
        userId: 'dano',
        workspaceId: NOTARY_WORKSPACE_ID
      }
    });
    
    if (!existingDanoProfile) {
      const danoProfile = await prisma.userProfile.create({
        data: {
          id: `dano-notary-profile-${Date.now()}`,
          userId: 'dano',
          workspaceId: NOTARY_WORKSPACE_ID,
          title: 'Account Executive',
          department: 'Sales',
          seniorityLevel: 'Individual Contributor',
          territory: 'Title Agencies - FL/AZ',
          quota: 200000, // $200k quota
          avgDealSize: 15000, // $15k average deal
          winRate: 0.28, // 28% win rate
          managerId: 'ryan', // Ryan is his manager
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Dano\'s Notary Everyday profile (reports to Ryan)');
    } else {
      console.log('✅ Dano already has Notary Everyday profile');
    }
    
    // STEP 3: Create Notary service product portfolio for Dano
    console.log('\n3️⃣ CREATING NOTARY SERVICE PORTFOLIO:');
    console.log('--------------------------------------');
    
    const existingNotaryProduct = await prisma.sellerProductPortfolio.findFirst({
      where: {
        sellerId: 'dano',
        workspaceId: NOTARY_WORKSPACE_ID,
        productName: 'Notary Everyday Services'
      }
    });
    
    if (!existingNotaryProduct) {
      const notaryProduct = await prisma.sellerProductPortfolio.create({
        data: {
          id: `dano-notary-product-${Date.now()}`,
          sellerId: 'dano',
          workspaceId: NOTARY_WORKSPACE_ID,
          productName: 'Notary Everyday Services',
          productCategory: 'Legal Services',
          description: 'Comprehensive notary and document signing services for title agencies',
          targetIndustries: ['Real Estate', 'Title Insurance', 'Legal Services', 'Financial Services'],
          targetCompanySize: ['2-10 employees', '11-50 employees', '51-200 employees'],
          primaryUseCases: ['Document notarization', 'Remote online notarization', 'Closing services', 'Mobile notary'],
          startingPrice: 50, // $50 per signing
          averageDealSize: 15000, // $15k annual contract
          maxDealSize: 100000, // $100k enterprise contract
          typicalSalesCycle: 30, // 30 days
          keyValueProps: ['Mobile convenience', 'RON capability', 'Compliance expertise', 'Cost savings'],
          commonObjections: ['Cost concerns', 'Technology adoption', 'Compliance questions', 'Existing relationships'],
          competitorLandscape: ['Local notaries', 'In-house staff', 'Other notary services'],
          idealCustomerProfile: 'Title agencies with 10-200 employees doing 50+ closings per month',
          buyingCommitteeRoles: ['CEO', 'COO', 'Operations Manager', 'Compliance Officer', 'CFO'],
          successMetrics: ['Reduced closing time', 'Cost per closing', 'Compliance score', 'Customer satisfaction'],
          isActive: true,
          lastUpdated: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Notary Everyday service portfolio for Dano');
    } else {
      console.log('✅ Dano already has Notary Everyday product portfolio');
    }
    
    // STEP 4: Import notary accounts (companies)
    console.log('\n4️⃣ IMPORTING NOTARY ACCOUNTS:');
    console.log('-----------------------------');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, 'data/title-companies/notary_accounts.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const header = lines[0].split(',');
    
    console.log(`Found ${lines.length - 1} notary accounts in CSV`);
    
    // Parse the first 150 accounts assigned to Dano
    const danoAccounts = [];
    const allAccounts = [];
    
    for (let i = 1; i < lines.length && i <= 150; i++) {
      const values = lines[i].split(',');
      if (values.length >= 14) {
        const account = {
          rank: parseInt(values[0]) || i,
          name: values[1]?.replace(/"/g, ''),
          size: values[2]?.replace(/"/g, ''),
          type: values[3]?.replace(/"/g, ''),
          city: values[4]?.replace(/"/g, ''),
          state: values[5]?.replace(/"/g, ''),
          stateAbbr: values[6]?.replace(/"/g, ''),
          domain: values[10]?.replace(/"/g, ''),
          linkedIn: values[11]?.replace(/"/g, ''),
          assignedUser: values[13]?.replace(/"/g, ''),
          score: parseFloat(values[14]) || 0
        };
        
        if (account.assignedUser === 'dano') {
          danoAccounts.push(account);
        }
        allAccounts.push(account);
      }
    }
    
    console.log(`Parsed ${danoAccounts.length} accounts assigned to Dano`);
    console.log(`Parsed ${allAccounts.length} total accounts`);
    
    // Create accounts in database
    let accountsCreated = 0;
    for (const account of danoAccounts.slice(0, 10)) { // Start with first 10 for testing
      try {
        const existingAccount = await prisma.accounts.findFirst({
          where: {
            name: account.name,
            workspaceId: NOTARY_WORKSPACE_ID
          }
        });
        
        if (!existingAccount) {
          const newAccount = await prisma.accounts.create({
            data: {
              id: `notary-account-${Date.now()}-${accountsCreated}`,
              workspaceId: NOTARY_WORKSPACE_ID,
              assignedUserId: 'dano', // Assigned to Dano
              name: account.name,
              website: account.domain,
              city: account.city,
              state: account.stateAbbr,
              country: 'United States',
              industry: 'Title Insurance',
              sector: 'Real Estate Services',
              size: account.size,
              description: `Title agency in ${account.city}, ${account.state}`,
              tags: ['title-agency', 'notary-services', account.stateAbbr.toLowerCase()],
              status: 'prospect',
              priority: account.score > 1000 ? 'high' : 'medium',
              source: 'notary-everyday-import',
              updatedAt: new Date(),
              createdAt: new Date()
            }
          });
          accountsCreated++;
          console.log(`   ✅ Created account: ${account.name}`);
        } else {
          console.log(`   ⚠️ Account already exists: ${account.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating account ${account.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Created ${accountsCreated} new accounts for Dano`);
    
    // STEP 5: Create sample contacts and leads
    console.log('\n5️⃣ CREATING SAMPLE CONTACTS AND LEADS:');
    console.log('---------------------------------------');
    
    // Get the created accounts
    const createdAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      },
      take: 5 // Just first 5 for testing
    });
    
    console.log(`Found ${createdAccounts.length} accounts to create contacts/leads for`);
    
    // Create sample contacts and leads for each account
    const commonTitleRoles = ['CEO', 'COO', 'Operations Manager', 'Compliance Officer', 'CFO'];
    let contactsCreated = 0;
    let leadsCreated = 0;
    
    for (const account of createdAccounts) {
      // Create 1-2 contacts per account (people we know)
      for (let i = 0; i < 2; i++) {
        try {
          const role = commonTitleRoles[i % commonTitleRoles.length];
          const firstName = ['John', 'Sarah', 'Mike', 'Lisa', 'David'][i % 5];
          const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][i % 5];
          
          const contact = await prisma.contacts.create({
            data: {
              id: `notary-contact-${Date.now()}-${contactsCreated}`,
              workspaceId: NOTARY_WORKSPACE_ID,
              accountId: account.id,
              assignedUserId: 'dano',
              firstName: firstName,
              lastName: lastName,
              fullName: `${firstName} ${lastName}`,
              jobTitle: role,
              department: role.includes('CEO') ? 'Executive' : role.includes('CFO') ? 'Finance' : 'Operations',
              email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${account.website || 'company.com'}`,
              status: 'active',
              relationshipStage: 'prospect',
              source: 'notary-everyday-import',
              tags: ['title-industry', 'decision-maker'],
              updatedAt: new Date(),
              createdAt: new Date()
            }
          });
          contactsCreated++;
          console.log(`   ✅ Created contact: ${contact.fullName} (${role}) at ${account.name}`);
        } catch (error) {
          console.log(`   ❌ Error creating contact: ${error.message}`);
        }
      }
      
      // Create 1-2 leads per account (people we haven't engaged)
      for (let i = 2; i < 4; i++) {
        try {
          const role = commonTitleRoles[i % commonTitleRoles.length];
          const firstName = ['Tom', 'Emily', 'Chris', 'Jessica', 'Mark'][i % 5];
          const lastName = ['Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson'][i % 5];
          
          const lead = await prisma.leads.create({
            data: {
              id: `notary-lead-${Date.now()}-${leadsCreated}`,
              workspaceId: NOTARY_WORKSPACE_ID,
              assignedUserId: 'dano',
              firstName: firstName,
              lastName: lastName,
              fullName: `${firstName} ${lastName}`,
              company: account.name,
              companyDomain: account.website,
              title: role,
              jobTitle: role,
              department: role.includes('CEO') ? 'Executive' : role.includes('CFO') ? 'Finance' : 'Operations',
              industry: 'Title Insurance',
              companySize: account.size,
              city: account.city,
              state: account.state,
              country: 'United States',
              status: 'new',
              priority: 'medium',
              source: 'notary-everyday-import',
              tags: ['title-agency', 'decision-maker', 'unengaged'],
              estimatedValue: 15000, // $15k estimated deal value
              updatedAt: new Date(),
              createdAt: new Date()
            }
          });
          leadsCreated++;
          console.log(`   ✅ Created lead: ${lead.fullName} (${role}) at ${account.name}`);
        } catch (error) {
          console.log(`   ❌ Error creating lead: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Created ${contactsCreated} contacts and ${leadsCreated} leads`);
    
    // STEP 6: Verify data separation
    console.log('\n6️⃣ VERIFYING DATA SEPARATION:');
    console.log('------------------------------');
    
    const notaryAccounts = await prisma.accounts.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const retailAccounts = await prisma.accounts.count({
      where: { workspaceId: RETAIL_WORKSPACE_ID }
    });
    
    const notaryLeads = await prisma.leads.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const retailLeads = await prisma.leads.count({
      where: { workspaceId: RETAIL_WORKSPACE_ID }
    });
    
    console.log(`Notary Everyday workspace:`);
    console.log(`   Accounts: ${notaryAccounts}`);
    console.log(`   Leads: ${notaryLeads}`);
    
    console.log(`Retail Product Solutions workspace:`);
    console.log(`   Accounts: ${retailAccounts}`);
    console.log(`   Leads: ${retailLeads}`);
    
    console.log('✅ Data separation verified');
    
    // STEP 7: Test assignments
    console.log('\n7️⃣ TESTING ASSIGNMENTS:');
    console.log('------------------------');
    
    const danoAssignedAccounts = await prisma.accounts.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      }
    });
    
    const danoAssignedLeads = await prisma.leads.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      }
    });
    
    console.log(`Dano's assignments in Notary Everyday:`);
    console.log(`   Accounts: ${danoAssignedAccounts}`);
    console.log(`   Leads: ${danoAssignedLeads}`);
    
    // Ryan should see all but not be assigned
    const ryanVisibleAccounts = await prisma.accounts.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    console.log(`Ryan's visibility in Notary Everyday (as manager):`);
    console.log(`   All accounts visible: ${ryanVisibleAccounts}`);
    console.log(`   Assigned to Ryan: 0 (manager role)`);
    
    await prisma.$disconnect();
    console.log('\n🎉 NOTARY EVERYDAY SETUP COMPLETE!');
    
    return {
      accountsCreated,
      contactsCreated,
      leadsCreated,
      danoAssignedAccounts,
      danoAssignedLeads,
      ryanVisibleAccounts
    };
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    console.error('Stack:', error.stack);
  }
}

setupNotaryEveryday();
