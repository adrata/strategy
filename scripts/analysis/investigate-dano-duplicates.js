#!/usr/bin/env node

/**
 * 🔍 INVESTIGATE DANO'S DUPLICATES & VERTICALS
 * 
 * Research Dano's actual business and data quality:
 * - Use Zoho IDs to identify true duplicates
 * - Understand his retail fixtures business model
 * - Ensure proper vertical classification
 * - Build correct buyer group profiles for physical retail products
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
const danoUserId = '01K1VBYYV7TRPY04NW4TW4XWRB';

async function investigateDanoData() {
  console.log('🔍 INVESTIGATING DANO\'S DUPLICATES & VERTICALS');
  console.log('===============================================');
  console.log('Business: Retail fixtures, store equipment, millwork, coolers/freezers');
  console.log('Target: Grocery stores, C-stores, retail chains\n');
  
  try {
    // Check Zoho integration status
    const [
      leadsWithZoho, leadsTotal,
      prospectsWithZoho, prospectsTotal,
      contactsWithZoho, contactsTotal,
      accountsWithZoho, accountsTotal
    ] = await Promise.all([
      prisma.lead.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          zohoId: { not: null }, 
          deletedAt: null, 
          isDemoData: false 
        }
      }),
      prisma.lead.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          deletedAt: null, 
          isDemoData: false 
        }
      }),
      prisma.prospect.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          zohoId: { not: null }, 
          deletedAt: null, 
          isDemoData: false 
        }
      }),
      prisma.prospect.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          deletedAt: null, 
          isDemoData: false 
        }
      }),
      prisma.contact.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          zohoId: { not: null }, 
          deletedAt: null 
        }
      }),
      prisma.contact.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          deletedAt: null 
        }
      }),
      prisma.account.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          zohoId: { not: null }, 
          deletedAt: null 
        }
      }),
      prisma.account.count({ 
        where: { 
          workspaceId: danoWorkspaceId, 
          assignedUserId: danoUserId, 
          deletedAt: null 
        }
      })
    ]);
    
    console.log('🔗 ZOHO INTEGRATION STATUS:');
    console.log(`   Leads: ${leadsWithZoho}/${leadsTotal} (${Math.round(leadsWithZoho/leadsTotal*100)}%) have Zoho IDs`);
    console.log(`   Prospects: ${prospectsWithZoho}/${prospectsTotal} (${Math.round(prospectsWithZoho/prospectsTotal*100)}%) have Zoho IDs`);
    console.log(`   Contacts: ${contactsWithZoho}/${contactsTotal} (${Math.round(contactsWithZoho/contactsTotal*100)}%) have Zoho IDs`);
    console.log(`   Accounts: ${accountsWithZoho}/${accountsTotal} (${Math.round(accountsWithZoho/accountsTotal*100)}%) have Zoho IDs`);
    
    // Find duplicates by checking same Zoho ID across different record types
    const duplicateZohoIds = await prisma.$queryRaw`
      SELECT "zohoId", 
             COUNT(*) as total_records,
             STRING_AGG(DISTINCT record_type, ', ') as record_types,
             STRING_AGG(DISTINCT full_name, ', ') as names,
             STRING_AGG(DISTINCT email, ', ') as emails
      FROM (
        SELECT "zohoId", 'lead' as record_type, "fullName" as full_name, "workEmail" as email
        FROM leads 
        WHERE "workspaceId" = ${danoWorkspaceId} AND "assignedUserId" = ${danoUserId} 
          AND "zohoId" IS NOT NULL AND "deletedAt" IS NULL AND "isDemoData" = false
        
        UNION ALL
        
        SELECT "zohoId", 'prospect' as record_type, "fullName" as full_name, "workEmail" as email
        FROM prospects 
        WHERE "workspaceId" = ${danoWorkspaceId} AND "assignedUserId" = ${danoUserId} 
          AND "zohoId" IS NOT NULL AND "deletedAt" IS NULL AND "isDemoData" = false
        
        UNION ALL
        
        SELECT "zohoId", 'contact' as record_type, "fullName" as full_name, "workEmail" as email
        FROM contacts 
        WHERE "workspaceId" = ${danoWorkspaceId} AND "assignedUserId" = ${danoUserId} 
          AND "zohoId" IS NOT NULL AND "deletedAt" IS NULL
      ) all_records
      GROUP BY "zohoId" 
      HAVING COUNT(*) > 1
      ORDER BY total_records DESC
      LIMIT 20
    `;
    
    console.log(`\n🔄 ZOHO ID DUPLICATES: ${duplicateZohoIds.length} found`);
    duplicateZohoIds.forEach((dup, i) => {
      console.log(`   ${i+1}. Zoho ID: ${dup.zoho_id}`);
      console.log(`      Record Types: ${dup.record_types} (${dup.total_records} total)`);
      console.log(`      Names: ${dup.names}`);
      console.log(`      Emails: ${dup.emails}`);
      console.log('');
    });
    
    // Check account verticals
    const accounts = await prisma.account.findMany({
      where: { 
        workspaceId: danoWorkspaceId, 
        assignedUserId: danoUserId,
        deletedAt: null
      },
      select: { 
        id: true,
        name: true, 
        industry: true, 
        vertical: true,
        zohoId: true,
        website: true
      }
    });
    
    const verticalAnalysis = {
      withVertical: 0,
      missingVertical: 0,
      withIndustryOnly: 0,
      completelyMissing: 0
    };
    
    const missingVerticals = [];
    
    accounts.forEach(account => {
      if (account.vertical) {
        verticalAnalysis.withVertical++;
      } else if (account.industry) {
        verticalAnalysis.withIndustryOnly++;
        missingVerticals.push(account);
      } else {
        verticalAnalysis.completelyMissing++;
        missingVerticals.push(account);
      }
    });
    
    console.log('\n📊 VERTICAL CLASSIFICATION STATUS:');
    console.log(`   Total Accounts: ${accounts.length}`);
    console.log(`   With Vertical: ${verticalAnalysis.withVertical} (${Math.round(verticalAnalysis.withVertical/accounts.length*100)}%)`);
    console.log(`   Industry Only: ${verticalAnalysis.withIndustryOnly} (${Math.round(verticalAnalysis.withIndustryOnly/accounts.length*100)}%)`);
    console.log(`   Missing Both: ${verticalAnalysis.completelyMissing} (${Math.round(verticalAnalysis.completelyMissing/accounts.length*100)}%)`);
    
    console.log('\n🎯 ACCOUNTS NEEDING VERTICAL CLASSIFICATION:');
    missingVerticals.slice(0, 15).forEach((account, i) => {
      console.log(`   ${i+1}. ${account.name}`);
      console.log(`      Industry: ${account.industry || 'MISSING'}`);
      console.log(`      Website: ${account.website || 'MISSING'}`);
      console.log(`      Zoho: ${account.zohoId ? 'Linked' : 'Not linked'}`);
      console.log('');
    });
    
    // Analyze Dano's business model based on opportunities
    const opportunities = await prisma.opportunity.findMany({
      where: { 
        workspaceId: danoWorkspaceId, 
        assignedUserId: danoUserId,
        deletedAt: null
      },
      select: { 
        name: true, 
        description: true, 
        amount: true,
        account: { select: { name: true, vertical: true, industry: true } }
      }
    });
    
    console.log('\n💼 DANO\'S BUSINESS MODEL ANALYSIS:');
    console.log(`   Total Opportunities: ${opportunities.length}`);
    
    const productCategories = {};
    opportunities.forEach(opp => {
      const name = opp.name.toLowerCase();
      if (name.includes('joinery') || name.includes('millwork')) {
        productCategories['Millwork/Joinery'] = (productCategories['Millwork/Joinery'] || 0) + 1;
      } else if (name.includes('cooler') || name.includes('freezer')) {
        productCategories['Cooler/Freezer Equipment'] = (productCategories['Cooler/Freezer Equipment'] || 0) + 1;
      } else if (name.includes('rack') || name.includes('fixture')) {
        productCategories['Racks/Fixtures'] = (productCategories['Racks/Fixtures'] || 0) + 1;
      } else if (name.includes('reset') || name.includes('remodel')) {
        productCategories['Store Resets/Remodeling'] = (productCategories['Store Resets/Remodeling'] || 0) + 1;
      } else if (name.includes('rfp')) {
        productCategories['RFP/Competitive Bids'] = (productCategories['RFP/Competitive Bids'] || 0) + 1;
      } else {
        productCategories['Other/Custom'] = (productCategories['Other/Custom'] || 0) + 1;
      }
    });
    
    console.log('   Product Categories:');
    Object.entries(productCategories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`      ${category}: ${count} opportunities`);
      });
    
    console.log('\n🎯 RETAIL FIXTURES BUYER GROUP INSIGHTS:');
    console.log('   Decision Makers: Presidents, VPs (budget authority for capital equipment)');
    console.log('   Champions: Operations Directors, Store Development (day-to-day impact)');
    console.log('   Stakeholders: Merchandising (display needs), Procurement (vendor management)');
    console.log('   Financial: CFOs (capital expenditure approval)');
    console.log('   Blockers: Procurement (vendor selection), Legal (contract terms)');
    console.log('   NOT NEEDED: IT/Technology (physical products, not software)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  investigateDanoData();
}

module.exports = { investigateDanoData };
