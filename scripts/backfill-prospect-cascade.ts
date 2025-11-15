#!/usr/bin/env tsx

/**
 * Backfill Prospect Cascade
 * 
 * For all current PROSPECT people:
 * 1. Ensure their company is PROSPECT
 * 2. Find all other people at those companies
 * 3. Update other people to PROSPECT if they're LEAD or lower
 * 4. Set appropriate statusReason values
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { EngagementClassificationService } from '../src/platform/services/engagement-classification-service';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const workspaceIdArg = args.find(arg => arg.startsWith('--workspace='));
  const workspaceId = workspaceIdArg ? workspaceIdArg.split('=')[1] : null;

  if (!workspaceId) {
    console.log('❌ Please provide workspace ID: --workspace=WORKSPACE_ID');
    await prisma.$disconnect();
    return;
  }

  console.log('🔄 Backfill Prospect Cascade');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}\n`);

  // Get all current PROSPECT people
  const prospects = await prisma.people.findMany({
    where: {
      workspaceId,
      status: 'PROSPECT',
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      companyId: true,
      statusReason: true,
      company: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  });

  console.log(`📊 Found ${prospects.length} current prospects\n`);

  let companiesUpdated = 0;
  let peopleUpdated = 0;
  const processedCompanies = new Set<string>();

  for (const prospect of prospects) {
    if (!prospect.companyId) {
      continue;
    }

    // Skip if we've already processed this company
    if (processedCompanies.has(prospect.companyId)) {
      continue;
    }

    processedCompanies.add(prospect.companyId);

    // Check if company is PROSPECT
    const company = prospect.company;
    if (company && company.status !== 'PROSPECT' && company.status !== 'OPPORTUNITY' && 
        company.status !== 'CLIENT' && company.status !== 'SUPERFAN') {
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          status: 'PROSPECT'
        }
      });
      companiesUpdated++;
      console.log(`✅ Updated company ${company.name} to PROSPECT`);
    }

    // Find all other people at this company
    const companyPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        companyId: prospect.companyId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        statusReason: true
      }
    });

    // Find the direct engager (person with direct engagement reason)
    const directEngager = companyPeople.find(p => 
      p.status === 'PROSPECT' && 
      p.statusReason && 
      !p.statusReason.includes('Company became prospect')
    ) || prospect;

    // Update other people to PROSPECT if they're LEAD or lower
    for (const person of companyPeople) {
      // Skip if already PROSPECT or higher
      if (person.status === 'PROSPECT' || person.status === 'OPPORTUNITY' || 
          person.status === 'CLIENT' || person.status === 'SUPERFAN' || person.status === 'PARTNER') {
        continue;
      }

      // Only update if status is LEAD or lower
      if (person.status === 'LEAD' || !person.status) {
        const engagerName = directEngager.fullName || 'a colleague';
        await prisma.people.update({
          where: { id: person.id },
          data: {
            status: 'PROSPECT',
            statusUpdateDate: new Date(),
            statusReason: `Company became prospect via ${engagerName}`
          }
        });
        peopleUpdated++;
        console.log(`✅ Updated ${person.fullName || person.id} to PROSPECT - company cascade`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Companies Updated: ${companiesUpdated}`);
  console.log(`   People Updated: ${peopleUpdated}`);
  console.log(`   Companies Processed: ${processedCompanies.size}`);

  await prisma.$disconnect();
}

main().catch(console.error);

