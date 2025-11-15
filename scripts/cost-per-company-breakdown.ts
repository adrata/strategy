#!/usr/bin/env tsx

/**
 * Cost per company breakdown for email storage
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('💰 Cost Per Company Breakdown\n');
  console.log('='.repeat(70));
  
  // Get current email stats
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
        { name: { contains: 'Engineering Plus', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true
    }
  });
  
  if (!workspace) {
    console.log('❌ Workspace not found');
    await prisma.$disconnect();
    return;
  }
  
  // Get current email table size
  const emailTableSizeResult = await prisma.$queryRaw<Array<{size: bigint}>>`
    SELECT pg_total_relation_size('email_messages') as size
  `;
  
  const currentEmailTableSizeBytes = Number(emailTableSizeResult[0]?.size || 0);
  const currentEmailTableSizeGB = currentEmailTableSizeBytes / (1024 * 1024 * 1024);
  
  const currentEmailCount = await prisma.email_messages.count({
    where: { workspaceId: workspace.id }
  });
  
  // Calculate average email size
  const avgEmailSizeGB = currentEmailTableSizeGB / currentEmailCount;
  const emailsPerCompany = 100000;
  const storagePerCompanyGB = avgEmailSizeGB * emailsPerCompany;
  
  console.log('📊 Assumptions:');
  console.log(`   Emails per Company: ${emailsPerCompany.toLocaleString()}`);
  console.log(`   Storage per Company: ${storagePerCompanyGB.toFixed(2)} GB`);
  console.log(`   Average Email Size: ${(avgEmailSizeGB * 1024 * 1024).toFixed(2)} KB\n`);
  
  console.log('💵 Cost Per Company by Plan:\n');
  
  // Calculate for different numbers of companies
  const companyCounts = [1, 5, 10, 25, 50, 100, 200, 500];
  
  console.log('   Companies | Free Tier | Launch Plan | Scale Plan');
  console.log('   ' + '-'.repeat(55));
  
  for (const numCompanies of companyCounts) {
    const totalStorageGB = storagePerCompanyGB * numCompanies;
    
    // Free tier: 0.5 GB included, $0.10/GB/month after
    const freeTierStorageGB = Math.max(0, totalStorageGB - 0.5);
    const freeTierTotalCost = freeTierStorageGB * 0.10;
    const freeTierPerCompany = numCompanies > 0 ? freeTierTotalCost / numCompanies : 0;
    
    // Launch plan: $19/month base + 10 GB included, $0.10/GB/month after
    const launchPlanStorageGB = Math.max(0, totalStorageGB - 10);
    const launchPlanExtraCost = launchPlanStorageGB * 0.10;
    const launchPlanTotalCost = 19 + launchPlanExtraCost;
    const launchPlanPerCompany = numCompanies > 0 ? launchPlanTotalCost / numCompanies : 0;
    
    // Scale plan: $69/month base + 50 GB included, $0.10/GB/month after
    const scalePlanStorageGB = Math.max(0, totalStorageGB - 50);
    const scalePlanExtraCost = scalePlanStorageGB * 0.10;
    const scalePlanTotalCost = 69 + scalePlanExtraCost;
    const scalePlanPerCompany = numCompanies > 0 ? scalePlanTotalCost / numCompanies : 0;
    
    console.log(`   ${numCompanies.toString().padStart(10)} | $${freeTierPerCompany.toFixed(2).padStart(8)} | $${launchPlanPerCompany.toFixed(2).padStart(10)} | $${scalePlanPerCompany.toFixed(2).padStart(9)}`);
  }
  
  console.log('');
  
  // Show detailed breakdown for key scenarios
  console.log('📋 Detailed Breakdown:\n');
  
  const scenarios = [
    { companies: 1, name: 'Single Company' },
    { companies: 10, name: '10 Companies' },
    { companies: 50, name: '50 Companies' },
    { companies: 100, name: '100 Companies' }
  ];
  
  for (const scenario of scenarios) {
    const totalStorageGB = storagePerCompanyGB * scenario.companies;
    
    const freeTierStorageGB = Math.max(0, totalStorageGB - 0.5);
    const freeTierTotalCost = freeTierStorageGB * 0.10;
    const freeTierPerCompany = freeTierTotalCost / scenario.companies;
    
    const launchPlanStorageGB = Math.max(0, totalStorageGB - 10);
    const launchPlanExtraCost = launchPlanStorageGB * 0.10;
    const launchPlanTotalCost = 19 + launchPlanExtraCost;
    const launchPlanPerCompany = launchPlanTotalCost / scenario.companies;
    
    const scalePlanStorageGB = Math.max(0, totalStorageGB - 50);
    const scalePlanExtraCost = scalePlanStorageGB * 0.10;
    const scalePlanTotalCost = 69 + scalePlanExtraCost;
    const scalePlanPerCompany = scalePlanTotalCost / scenario.companies;
    
    console.log(`   ${scenario.name} (${scenario.companies} companies, ${(scenario.companies * emailsPerCompany).toLocaleString()} emails):`);
    console.log(`      Total Storage: ${totalStorageGB.toFixed(2)} GB`);
    console.log(`      Free Tier: $${freeTierPerCompany.toFixed(2)}/company/month ($${freeTierTotalCost.toFixed(2)} total)`);
    console.log(`      Launch Plan: $${launchPlanPerCompany.toFixed(2)}/company/month ($${launchPlanTotalCost.toFixed(2)} total)`);
    console.log(`      Scale Plan: $${scalePlanPerCompany.toFixed(2)}/company/month ($${scalePlanTotalCost.toFixed(2)} total)`);
    console.log('');
  }
  
  // Show annual costs
  console.log('📅 Annual Cost Per Company:\n');
  console.log('   Companies | Free Tier/Year | Launch Plan/Year | Scale Plan/Year');
  console.log('   ' + '-'.repeat(60));
  
  for (const numCompanies of [1, 10, 50, 100]) {
    const totalStorageGB = storagePerCompanyGB * numCompanies;
    
    const freeTierStorageGB = Math.max(0, totalStorageGB - 0.5);
    const freeTierTotalCost = freeTierStorageGB * 0.10;
    const freeTierPerCompanyYear = (freeTierTotalCost / numCompanies) * 12;
    
    const launchPlanStorageGB = Math.max(0, totalStorageGB - 10);
    const launchPlanExtraCost = launchPlanStorageGB * 0.10;
    const launchPlanTotalCost = 19 + launchPlanExtraCost;
    const launchPlanPerCompanyYear = (launchPlanTotalCost / numCompanies) * 12;
    
    const scalePlanStorageGB = Math.max(0, totalStorageGB - 50);
    const scalePlanExtraCost = scalePlanStorageGB * 0.10;
    const scalePlanTotalCost = 69 + scalePlanExtraCost;
    const scalePlanPerCompanyYear = (scalePlanTotalCost / numCompanies) * 12;
    
    console.log(`   ${numCompanies.toString().padStart(10)} | $${freeTierPerCompanyYear.toFixed(2).padStart(13)} | $${launchPlanPerCompanyYear.toFixed(15)} | $${scalePlanPerCompanyYear.toFixed(14)}`);
  }
  
  console.log('');
  
  // Show cost efficiency
  console.log('💡 Key Insights:\n');
  console.log(`   • At 1 company: Launch Plan = $${((19 + Math.max(0, (storagePerCompanyGB - 10)) * 0.10) / 1).toFixed(2)}/company/month`);
  console.log(`   • At 10 companies: Launch Plan = $${((19 + Math.max(0, (storagePerCompanyGB * 10 - 10)) * 0.10) / 10).toFixed(2)}/company/month`);
  console.log(`   • At 50 companies: Launch Plan = $${((19 + Math.max(0, (storagePerCompanyGB * 50 - 10)) * 0.10) / 50).toFixed(2)}/company/month`);
  console.log(`   • At 100 companies: Launch Plan = $${((19 + Math.max(0, (storagePerCompanyGB * 100 - 10)) * 0.10) / 100).toFixed(2)}/company/month`);
  console.log(`   • At 200 companies: Launch Plan = $${((19 + Math.max(0, (storagePerCompanyGB * 200 - 10)) * 0.10) / 200).toFixed(2)}/company/month`);
  console.log(`   • At 500 companies: Launch Plan = $${((19 + Math.max(0, (storagePerCompanyGB * 500 - 10)) * 0.10) / 500).toFixed(2)}/company/month\n`);
  
  console.log('   📉 Cost per company decreases as you scale!');
  console.log('   📈 Launch Plan becomes more cost-effective with more companies\n');
  
  await prisma.$disconnect();
}

main().catch(console.error);

