#!/usr/bin/env tsx

/**
 * Estimate email storage costs on Neon.tech
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
  console.log('💰 Email Storage Cost Estimation\n');
  console.log('='.repeat(70));
  
  // Find TOP Engineering Plus workspace
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
  
  // Get actual database size
  const dbSizeResult = await prisma.$queryRaw<Array<{size: bigint}>>`
    SELECT pg_database_size(current_database()) as size
  `;
  
  const totalDbSizeBytes = Number(dbSizeResult[0]?.size || 0);
  const totalDbSizeGB = totalDbSizeBytes / (1024 * 1024 * 1024);
  
  // Get email table size
  const emailTableSizeResult = await prisma.$queryRaw<Array<{size: bigint}>>`
    SELECT pg_total_relation_size('email_messages') as size
  `;
  
  const emailTableSizeBytes = Number(emailTableSizeResult[0]?.size || 0);
  const emailTableSizeGB = emailTableSizeBytes / (1024 * 1024 * 1024);
  const emailTableSizeMB = emailTableSizeBytes / (1024 * 1024);
  
  // Get email count and sample data
  const totalEmails = await prisma.email_messages.count({
    where: { workspaceId: workspace.id }
  });
  
  // Sample emails to estimate average size
  const sampleEmails = await prisma.email_messages.findMany({
    where: { workspaceId: workspace.id },
    take: 100,
    select: {
      subject: true,
      body: true,
      bodyHtml: true,
      from: true,
      to: true,
      cc: true,
      bcc: true,
      attachments: true
    }
  });
  
  // Calculate average email size
  let totalSampleSize = 0;
  for (const email of sampleEmails) {
    let emailSize = 0;
    emailSize += (email.subject?.length || 0);
    emailSize += (email.body?.length || 0);
    emailSize += (email.bodyHtml?.length || 0);
    emailSize += (email.from?.length || 0);
    emailSize += JSON.stringify(email.to || []).length;
    emailSize += JSON.stringify(email.cc || []).length;
    emailSize += JSON.stringify(email.bcc || []).length;
    emailSize += JSON.stringify(email.attachments || {}).length;
    // Add overhead for other fields (IDs, timestamps, etc.) - estimate ~500 bytes
    emailSize += 500;
    totalSampleSize += emailSize;
  }
  
  const avgEmailSizeBytes = sampleEmails.length > 0 ? totalSampleSize / sampleEmails.length : 0;
  const avgEmailSizeKB = avgEmailSizeBytes / 1024;
  const estimatedTotalSizeGB = (avgEmailSizeBytes * totalEmails) / (1024 * 1024 * 1024);
  
  console.log(`📊 Storage Analysis for: ${workspace.name}\n`);
  
  console.log('📧 Email Statistics:');
  console.log(`   Total Emails: ${totalEmails.toLocaleString()}`);
  console.log(`   Average Email Size: ${avgEmailSizeKB.toFixed(2)} KB`);
  console.log(`   Estimated Total Email Data: ${estimatedTotalSizeGB.toFixed(2)} GB\n`);
  
  console.log('💾 Database Storage:');
  console.log(`   Email Table Size: ${emailTableSizeMB.toFixed(2)} MB (${emailTableSizeGB.toFixed(3)} GB)`);
  console.log(`   Total Database Size: ${totalDbSizeGB.toFixed(2)} GB`);
  console.log(`   Email Table % of Total: ${((emailTableSizeGB / totalDbSizeGB) * 100).toFixed(1)}%\n`);
  
  console.log('💰 Neon.tech Pricing (as of 2025):');
  console.log('   Free Tier:');
  console.log('     • 0.5 GB storage included');
  console.log('     • $0.10 per GB/month for additional storage');
  console.log('   Launch Plan (~$19/month):');
  console.log('     • 10 GB storage included');
  console.log('     • $0.10 per GB/month for additional storage');
  console.log('   Scale Plan (~$69/month):');
  console.log('     • 50 GB storage included');
  console.log('     • $0.10 per GB/month for additional storage\n');
  
  // Calculate costs
  const storageNeededGB = Math.max(0, emailTableSizeGB - 0.5); // Free tier
  const freeTierCost = storageNeededGB > 0 ? storageNeededGB * 0.10 : 0;
  
  const launchPlanStorageNeededGB = Math.max(0, emailTableSizeGB - 10);
  const launchPlanCost = launchPlanStorageNeededGB * 0.10;
  
  const scalePlanStorageNeededGB = Math.max(0, emailTableSizeGB - 50);
  const scalePlanCost = scalePlanStorageNeededGB * 0.10;
  
  console.log('💵 Estimated Monthly Costs:');
  console.log(`   Free Tier: $${freeTierCost.toFixed(2)}/month (for email storage only)`);
  console.log(`   Launch Plan: $${launchPlanCost.toFixed(2)}/month extra (base $19 + storage)`);
  console.log(`   Scale Plan: $${scalePlanCost.toFixed(2)}/month extra (base $69 + storage)`);
  console.log(`   Total Launch Plan: $${(19 + launchPlanCost).toFixed(2)}/month`);
  console.log(`   Total Scale Plan: $${(69 + scalePlanCost).toFixed(2)}/month\n`);
  
  // Projection for growth
  const emailsPerMonth = 1000; // Estimate
  const avgSizePerEmailGB = avgEmailSizeBytes / (1024 * 1024 * 1024);
  const monthlyGrowthGB = emailsPerMonth * avgSizePerEmailGB;
  const yearlyGrowthGB = monthlyGrowthGB * 12;
  
  console.log('📈 Growth Projections (assuming 1,000 emails/month):');
  console.log(`   Monthly Growth: ${monthlyGrowthGB.toFixed(3)} GB`);
  console.log(`   Yearly Growth: ${yearlyGrowthGB.toFixed(2)} GB`);
  console.log(`   Storage in 1 year: ${(emailTableSizeGB + yearlyGrowthGB).toFixed(2)} GB`);
  console.log(`   Estimated cost in 1 year (Launch Plan): $${((19 + Math.max(0, (emailTableSizeGB + yearlyGrowthGB - 10)) * 0.10)).toFixed(2)}/month\n`);
  
  console.log('💡 Cost Optimization Tips:');
  console.log('   1. Archive old emails (>1 year) to reduce active storage');
  console.log('   2. Consider storing only email metadata, not full body');
  console.log('   3. Use compression for email bodies');
  console.log('   4. Delete spam/newsletter emails automatically');
  console.log('   5. Consider external storage (S3) for very old emails\n');
  
  await prisma.$disconnect();
}

main().catch(console.error);

