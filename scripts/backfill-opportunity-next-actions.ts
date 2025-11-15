#!/usr/bin/env tsx

/**
 * Backfill Opportunity Next Actions
 * 
 * Generates and saves next actions for all opportunities (companies with status=OPPORTUNITY)
 * Uses the same logic as the companies API route to ensure consistency
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { computeCompanyLastAction } from '../src/platform/utils/company-last-action';
import { addBusinessDays } from '../src/platform/utils/actionUtils';

const prisma = new PrismaClient();

async function generateOpportunityNextAction(
  company: any,
  lastActionText: string | null,
  lastActionDate: Date | null
): Promise<{ nextAction: string; nextActionDate: Date }> {
  let nextAction = company.nextAction || '';
  let nextActionDate = company.nextActionDate;

  // Auto-populate nextActionDate if missing
  if (!nextActionDate) {
    const rank = company.globalRank || 1000;
    const lastActionDateForCalc = lastActionDate || company.createdAt;
    
    // Calculate days to add based on rank
    let businessDaysToAdd = 7; // Default 1 week
    if (rank <= 10) businessDaysToAdd = 1; // Top 10: tomorrow
    else if (rank <= 50) businessDaysToAdd = 3; // Top 50: 3 days
    else if (rank <= 100) businessDaysToAdd = 5; // Top 100: 5 days
    else if (rank <= 500) businessDaysToAdd = 7; // Top 500: 1 week
    else businessDaysToAdd = 14; // Others: 2 weeks
    
    const calculatedDate = addBusinessDays(lastActionDateForCalc, businessDaysToAdd);
    const now = new Date();
    nextActionDate = calculatedDate.getTime() < now.getTime() 
      ? addBusinessDays(now, businessDaysToAdd)
      : calculatedDate;
  }

  // Generate nextAction if missing
  if (!nextAction) {
    const opportunityStage = company.opportunityStage || 'QUALIFICATION';
    
    if (lastActionText && lastActionText !== 'No action taken') {
      const lastActionLower = lastActionText.toLowerCase();
      
      // Stage-based actions
      if (opportunityStage === 'QUALIFICATION' || opportunityStage === 'qualification') {
        if (lastActionLower.includes('email') || lastActionLower.includes('outreach')) {
          nextAction = 'Schedule discovery call to validate pain and qualify opportunity';
        } else if (lastActionLower.includes('call') || lastActionLower.includes('meeting')) {
          nextAction = 'Send qualification summary and next steps';
        } else {
          nextAction = 'Schedule discovery call to understand needs and timeline';
        }
      } else if (opportunityStage === 'DISCOVERY' || opportunityStage === 'discovery') {
        if (lastActionLower.includes('discovery') || lastActionLower.includes('call')) {
          nextAction = 'Send discovery summary and stakeholder mapping request';
        } else if (lastActionLower.includes('proposal') || lastActionLower.includes('quote')) {
          nextAction = 'Follow up on proposal and address questions';
        } else {
          nextAction = 'Schedule stakeholder alignment call';
        }
      } else if (opportunityStage === 'PROPOSAL' || opportunityStage === 'proposal') {
        if (lastActionLower.includes('proposal') || lastActionLower.includes('quote')) {
          nextAction = 'Follow up on proposal and address objections';
        } else if (lastActionLower.includes('roi') || lastActionLower.includes('business case')) {
          nextAction = 'Schedule executive alignment call';
        } else {
          nextAction = 'Send business case and ROI proposal';
        }
      } else if (opportunityStage === 'NEGOTIATION' || opportunityStage === 'negotiation') {
        if (lastActionLower.includes('negotiation') || lastActionLower.includes('contract')) {
          nextAction = 'Navigate procurement and legal approvals';
        } else if (lastActionLower.includes('proposal')) {
          nextAction = 'Schedule negotiation call to finalize terms';
        } else {
          nextAction = 'Follow up on negotiation and close timeline';
        }
      } else {
        nextAction = 'Schedule stakeholder alignment call';
      }
    } else {
      // No last action - start with discovery
      nextAction = 'Schedule discovery call to validate pain and qualify opportunity';
    }
  }

  return { nextAction, nextActionDate };
}

async function main() {
  const args = process.argv.slice(2);
  const workspaceIdArg = args.find(arg => arg.startsWith('--workspace='));
  const workspaceId = workspaceIdArg ? workspaceIdArg.split('=')[1] : null;
  const dryRun = args.includes('--dry-run');

  if (!workspaceId) {
    console.log('❌ Please provide workspace ID: --workspace=WORKSPACE_ID');
    await prisma.$disconnect();
    return;
  }

  console.log('🔄 Backfill Opportunity Next Actions');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}`);
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('');
  }

  try {
    // Get all opportunities
    const opportunities = await prisma.companies.findMany({
      where: {
        workspaceId,
        status: 'OPPORTUNITY',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        nextAction: true,
        nextActionDate: true,
        lastAction: true,
        lastActionDate: true,
        opportunityStage: true,
        globalRank: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Found ${opportunities.length} opportunities\n`);

    if (opportunities.length === 0) {
      console.log('No opportunities found.');
      await prisma.$disconnect();
      return;
    }

    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    // Process in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
      const batch = opportunities.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (company) => {
        try {
          // Compute last action
          const lastActionResult = await computeCompanyLastAction(
            company.id,
            company.lastAction,
            company.lastActionDate
          );

          const lastActionText = lastActionResult?.lastAction || company.lastAction || null;
          const lastActionDate = lastActionResult?.lastActionDate || company.lastActionDate || null;

          // Generate next action
          const { nextAction, nextActionDate } = await generateOpportunityNextAction(
            company,
            lastActionText,
            lastActionDate
          );

          // Check if update is needed
          const needsUpdate = 
            !company.nextAction || 
            company.nextAction !== nextAction ||
            !company.nextActionDate ||
            company.nextActionDate.getTime() !== nextActionDate.getTime();

          if (needsUpdate) {
            if (!dryRun) {
              await prisma.companies.update({
                where: { id: company.id },
                data: {
                  nextAction,
                  nextActionDate
                }
              });
            }
            updated++;
            if (updated <= 10) {
              console.log(`✅ ${company.name}: "${nextAction}"`);
            }
          } else {
            unchanged++;
          }
        } catch (error) {
          errors++;
          console.error(`❌ Error processing ${company.name}:`, error);
        }
      }));

      console.log(`📊 Processed ${Math.min(i + BATCH_SIZE, opportunities.length)}/${opportunities.length}...`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Errors: ${errors}`);

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN - No changes were made`);
      console.log(`Run without --dry-run to apply changes`);
    } else {
      console.log(`\n✅ Backfill complete!`);
    }

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

