/*
 * Run Buyer Group Pipeline for a given company and seller profile
 * Usage:
 *   npx ts-node --transpile-only scripts/run-buyer-group.ts --company "Dell Technologies" --profile buyer-group-intelligence --limit 100
 */

import * as path from 'path';
import { BuyerGroupPipeline, PipelineConfig, getSellerProfile } from '../src/platform/services/buyer-group/index.js';

function parseArgs(): { 
  company: string; 
  profile: string; 
  limit: number; 
  dryRun: boolean; 
  confirm: boolean; 
  maxCredits: number; 
  maxCollects: number; 
} {
  const args = process.argv.slice(2);
  const company = getArg(args, '--company') || 'Dell Technologies';
  const profile = getArg(args, '--profile') || 'buyer-group-intelligence';
  const limitStr = getArg(args, '--limit') || '100';
  const limit = Number.parseInt(limitStr, 10);
  const dryRun = args.includes('--dry-run') || !args.includes('--confirm');
  const confirm = args.includes('--confirm');
  const maxCreditsStr = getArg(args, '--max-credits') || '500';
  const maxCollectsStr = getArg(args, '--max-collects') || '120';
  const maxCredits = Number.parseInt(maxCreditsStr, 10);
  const maxCollects = Number.parseInt(maxCollectsStr, 10);
  
  return { 
    company, 
    profile, 
    limit: Number.isFinite(limit) ? limit : 100,
    dryRun,
    confirm,
    maxCredits: Number.isFinite(maxCredits) ? maxCredits : 500,
    maxCollects: Number.isFinite(maxCollects) ? maxCollects : 120
  };
}

function getArg(args: string[], key: string): string | undefined {
  const hit = args.find((a) => a.startsWith(key + '='));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}

async function main() {
  const { company, profile, limit, dryRun, confirm, maxCredits, maxCollects } = parseArgs();
  const apiKey = process.env.CORESIGNAL_API_KEY || '';
  if (!apiKey) {
    console.error('❌ CORESIGNAL_API_KEY is not set in environment');
    process.exit(1);
  }

  // Enhanced Dell aliases for maximum accuracy
  const companyAliases = company.toLowerCase().includes('dell') 
    ? ['Dell', 'Dell Technologies', 'Dell Inc', 'Dell EMC', 'Dell Technologies Inc']
    : [];

  const sellerProfile = getSellerProfile(profile);
  const config: PipelineConfig = {
    sellerProfile,
    coreSignal: {
      apiKey,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: Math.min(limit, maxCollects), // Respect spending limits
      batchSize: 20, // Progressive collection batches
      useCache: true,
      cacheTTL: 72, // 3-day cache for cost efficiency
      dryRun: dryRun
    },
    analysis: {
      minInfluenceScore: 7, // Higher bar for accuracy
      maxBuyerGroupSize: 12,
      requireDirector: false,
      allowIC: true,
      targetBuyerGroupRange: { min: 8, max: 12 },
              earlyStopMode: 'accuracy_first', // Maximum accuracy safeguards
      minRoleTargets: { decision: 1, champion: 2, stakeholder: 2, blocker: 1, introducer: 2 } // Complete buyer group with introducers for access
    },
    output: {
      format: 'json',
      includeFlightRisk: true,
      includeDecisionFlow: true,
      generatePlaybooks: true
    },
    llm: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-4o-mini'
    },
    targetCompanyAliases: companyAliases,
    enforceExactCompany: true // Strict company matching for accuracy
  };

  const pipeline = new BuyerGroupPipeline(config);
  const report = await pipeline.generateBuyerGroup(company);

  const outPath = path.join(
    'data',
    'production',
    'reports',
    `buyer-group-${company.toLowerCase().replace(/\s+/g, '-')}-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.json`
  );
  await pipeline.exportReport(report, outPath);

  console.log(`\n✅ Buyer group generated for ${company}`);
  console.log(`   Decision makers: ${report.buyerGroup.roles.decision.length}`);
  console.log(`   Champions: ${report.buyerGroup.roles.champion.length}`);
  console.log(`   Stakeholders: ${report.buyerGroup.roles.stakeholder.length}`);
  console.log(`   Blockers: ${report.buyerGroup.roles.blocker?.length || 0}`);
  console.log(`   Introducers: ${report.buyerGroup.roles.introducer?.length || 0}`);
  console.log(`   Total members: ${Object.values(report.buyerGroup.roles).flat().length}`);
  console.log(`   Output: ${outPath}`);
}

main().catch((err) => {
  console.error('❌ Error running buyer group pipeline:', err);
  process.exit(1);
});


