#!/usr/bin/env node
// Run Buyer Group Pipeline for a given company and seller profile (JS wrapper)
// Usage:
//   CORESIGNAL_API_KEY=... node scripts/run-buyer-group.js --company "Dell Technologies" --profile buyer-group-intelligence --limit 100

require('ts-node').register({ transpileOnly: true });

const path = require('path');
const { BuyerGroupPipeline, getSellerProfile } = require('../src/platform/services/buyer-group/index.ts');

function getArg(key) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(key + '='));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}

async function main() {
  const company = getArg('--company') || 'Dell Technologies';
  const profile = getArg('--profile') || 'buyer-group-intelligence';
  const limit = parseInt(getArg('--limit') || '100', 10);

  const apiKey = process.env.CORESIGNAL_API_KEY || '';
  if (!apiKey) {
    console.error('❌ CORESIGNAL_API_KEY is not set');
    process.exit(1);
  }

  const sellerProfile = getSellerProfile(profile);
  const config = {
    sellerProfile,
    coreSignal: {
      apiKey,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: Number.isFinite(limit) ? limit : 100,
      batchSize: 10,
      useCache: true,
      cacheTTL: 24,
    },
    analysis: {
      minInfluenceScore: 5,
      maxBuyerGroupSize: 12,
      requireDirector: false,
      allowIC: true,
      targetBuyerGroupRange: { min: 8, max: 12 },
      earlyStopMode: 'conservative',
      minRoleTargets: { decision: 1, champion: 1 },
    },
    output: {
      format: 'json',
      includeFlightRisk: true,
      includeDecisionFlow: true,
      generatePlaybooks: true,
    },
    llm: { enabled: false, provider: 'openai', model: 'gpt-4o-mini' },
    targetCompanyAliases: [company, 'Dell', 'Dell Technologies'],
    enforceExactCompany: true,
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
  console.log(`   Total members: ${Object.values(report.buyerGroup.roles).flat().length}`);
  console.log(`   Output: ${outPath}`);
}

main().catch((err) => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});


