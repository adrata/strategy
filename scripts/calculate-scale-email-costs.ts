#!/usr/bin/env tsx

/**
 * Calculate email storage costs at scale (100,000 emails per company)
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
  console.log('💰 Email Storage Costs at Scale\n');
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
  const avgEmailSizeMB = avgEmailSizeGB * 1024;
  const avgEmailSizeKB = avgEmailSizeMB * 1024;
  
  console.log('📊 Current Baseline:');
  console.log(`   Emails: ${currentEmailCount.toLocaleString()}`);
  console.log(`   Storage: ${currentEmailTableSizeGB.toFixed(3)} GB`);
  console.log(`   Average Email Size: ${avgEmailSizeKB.toFixed(2)} KB\n`);
  
  // Calculate for 100,000 emails per company
  const emailsPerCompany = 100000;
  const storagePerCompanyGB = avgEmailSizeGB * emailsPerCompany;
  const storagePerCompanyMB = storagePerCompanyGB * 1024;
  
  console.log('📈 Scale Calculations (100,000 emails per company):');
  console.log(`   Storage per Company: ${storagePerCompanyGB.toFixed(2)} GB (${storagePerCompanyMB.toFixed(0)} MB)\n`);
  
  // Calculate for different numbers of companies
  const companyScenarios = [1, 5, 10, 25, 50, 100];
  
  console.log('💵 Monthly Storage Costs by Number of Companies:\n');
  console.log('   Companies | Total Emails | Total Storage | Free Tier | Launch Plan | Scale Plan');
  console.log('   ' + '-'.repeat(70));
  
  for (const numCompanies of companyScenarios) {
    const totalEmails = numCompanies * emailsPerCompany;
    const totalStorageGB = storagePerCompanyGB * numCompanies;
    
    // Free tier: 0.5 GB included, $0.10/GB/month after
    const freeTierStorageGB = Math.max(0, totalStorageGB - 0.5);
    const freeTierCost = freeTierStorageGB * 0.10;
    
    // Launch plan: $19/month base + 10 GB included, $0.10/GB/month after
    const launchPlanStorageGB = Math.max(0, totalStorageGB - 10);
    const launchPlanExtraCost = launchPlanStorageGB * 0.10;
    const launchPlanTotalCost = 19 + launchPlanExtraCost;
    
    // Scale plan: $69/month base + 50 GB included, $0.10/GB/month after
    const scalePlanStorageGB = Math.max(0, totalStorageGB - 50);
    const scalePlanExtraCost = scalePlanStorageGB * 0.10;
    const scalePlanTotalCost = 69 + scalePlanExtraCost;
    
    console.log(`   ${numCompanies.toString().padStart(9)} | ${totalEmails.toLocaleString().padStart(12)} | ${totalStorageGB.toFixed(2).padStart(11)} GB | $${freeTierCost.toFixed(2).padStart(8)} | $${launchPlanTotalCost.toFixed(2).padStart(10)} | $${scalePlanTotalCost.toFixed(2).padStart(9)}`);
  }
  
  console.log('');
  
  // Show per-company cost breakdown
  console.log('📋 Per-Company Cost Breakdown (100,000 emails each):');
  console.log(`   Storage per Company: ${storagePerCompanyGB.toFixed(2)} GB`);
  console.log(`   Free Tier: $${(storagePerCompanyGB > 0.5 ? (storagePerCompanyGB - 0.5) * 0.10 : 0).toFixed(2)}/month per company`);
  console.log(`   Launch Plan: $${(storagePerCompanyGB > 10 ? (storagePerCompanyGB - 10) * 0.10 : 0).toFixed(2)}/month extra per company`);
  console.log(`   Scale Plan: $${(storagePerCompanyGB > 50 ? (storagePerCompanyGB - 50) * 0.10 : 0).toFixed(2)}/month extra per company\n`);
  
  // Show cost per email
  const costPerEmailFreeTier = (storagePerCompanyGB > 0.5 ? (storagePerCompanyGB - 0.5) * 0.10 : 0) / emailsPerCompany;
  const costPerEmailLaunch = (storagePerCompanyGB > 10 ? (storagePerCompanyGB - 10) * 0.10 : 0) / emailsPerCompany;
  const costPerEmailScale = (storagePerCompanyGB > 50 ? (storagePerCompanyGB - 50) * 0.10 : 0) / emailsPerCompany;
  
  console.log('💡 Cost per Email (at 100,000 emails/company):');
  console.log(`   Free Tier: $${(costPerEmailFreeTier * 1000000).toFixed(4)} per million emails`);
  console.log(`   Launch Plan: $${(costPerEmailLaunch * 1000000).toFixed(4)} per million emails (beyond 10 GB)`);
  console.log(`   Scale Plan: $${(costPerEmailScale * 1000000).toFixed(4)} per million emails (beyond 50 GB)\n`);
  
  // Show break-even points
  console.log('🎯 Break-Even Points:');
  const freeTierMaxCompanies = Math.floor(0.5 / storagePerCompanyGB);
  const launchPlanMaxCompanies = Math.floor(10 / storagePerCompanyGB);
  const scalePlanMaxCompanies = Math.floor(50 / storagePerCompanyGB);
  
  console.log(`   Free Tier: Up to ${freeTierMaxCompanies} companies (${(freeTierMaxCompanies * emailsPerCompany).toLocaleString()} emails) = $0/month`);
  console.log(`   Launch Plan: Up to ${launchPlanMaxCompanies} companies (${(launchPlanMaxCompanies * emailsPerCompany).toLocaleString()} emails) = $19/month`);
  console.log(`   Scale Plan: Up to ${scalePlanMaxCompanies} companies (${(scalePlanMaxCompanies * emailsPerCompany).toLocaleString()} emails) = $69/month\n`);
  
  // Show annual costs
  console.log('📅 Annual Costs (100 companies, 100,000 emails each):');
  const hundredCompaniesStorageGB = storagePerCompanyGB * 100;
  const hundredCompaniesLaunchCost = 19 + Math.max(0, (hundredCompaniesStorageGB - 10) * 0.10);
  const hundredCompaniesScaleCost = 69 + Math.max(0, (hundredCompaniesStorageGB - 50) * 0.10);
  
  console.log(`   Launch Plan: $${(hundredCompaniesLaunchCost * 12).toLocaleString()}/year`);
  console.log(`   Scale Plan: $${(hundredCompaniesScaleCost * 12).toLocaleString()}/year\n`);
  
  // Comparison with other storage options
  console.log('🔄 Comparison with Other Storage Options:');
  console.log(`   Neon.tech: $${(hundredCompaniesLaunchCost).toFixed(2)}/month for ${hundredCompaniesStorageGB.toFixed(2)} GB`);
  console.log(`   AWS S3 Standard: ~$${(hundredCompaniesStorageGB * 0.023).toFixed(2)}/month (storage only, no query capability)`);
  console.log(`   Vercel Blob: ~$${(hundredCompaniesStorageGB * 0.023).toFixed(2)}/month (storage only, no query capability)`);
  console.log(`   Note: Neon includes full Postgres database, indexes, and query capabilities\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);

