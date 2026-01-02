#!/usr/bin/env node

/**
 * Run Adrata Company Analysis
 *
 * Uses the PULL Framework to identify optimal companies for Adrata.
 *
 * This script:
 * 1. Analyzes markets for PULL concentration
 * 2. Discovers companies in top markets
 * 3. Clusters companies as PULL (5%) / Consideration (15%) / Not-In-Market (80%)
 * 4. Generates actionable recommendations
 *
 * Usage:
 *   node run-adrata-analysis.js                    # Full pipeline
 *   node run-adrata-analysis.js --markets-only     # Just analyze markets
 *   node run-adrata-analysis.js --limit 50         # Limit companies per market
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const fs = require('fs');
const path = require('path');
const { OptimalCompanyFinder } = require('./index');

// Load Adrata configuration
const adrataConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'adrata-config.json'), 'utf8')
);

async function main() {
  const args = process.argv.slice(2);
  const marketsOnly = args.includes('--markets-only');
  const limitArg = args.find(a => a.startsWith('--limit'));
  const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf('--limit') + 1]) : 25;

  console.log('\n' + '='.repeat(70));
  console.log('  ADRATA OPTIMAL COMPANY ANALYSIS - PULL FRAMEWORK');
  console.log('='.repeat(70));
  console.log(`
  Product: ${adrataConfig.productContext.productName}
  Problem: ${adrataConfig.productContext.primaryProblem}
  Deal Size: $${adrataConfig.productContext.dealSize.toLocaleString()}

  PULL Framework:
  - P (Project): Getting SOC 2, ISO 27001, becoming enterprise-ready
  - U (Urgency): Enterprise deals waiting, funding requirements, audits
  - L (List): Vanta, Drata, consultants, manual processes
  - L (Limitations): Manual doesn't scale, consultants expensive
`);
  console.log('='.repeat(70) + '\n');

  // Create finder instance with Adrata config
  const finder = new OptimalCompanyFinder({
    productContext: adrataConfig.productContext,
    outputDir: path.join(__dirname, 'output'),
    batchSize: 10,
    enrichmentLevel: 'standard'
  });

  try {
    if (marketsOnly) {
      // Just analyze markets
      console.log(' Running market analysis only...\n');
      const marketAnalysis = await finder.analyzeMarkets(adrataConfig.markets);

      console.log('\n MARKET ANALYSIS RESULTS:\n');
      marketAnalysis.forEach((market, i) => {
        console.log(`  ${i + 1}. ${market.market.name}`);
        console.log(`     PULL Concentration: ${market.scores.pullConcentration}/100`);
        console.log(`     Est. % with PULL: ${market.details.pullConcentration.estimatedPullPercentage}%`);
        console.log(`     Market Size: ${market.scores.marketSize}/100`);
        console.log(`     Recommendation: ${market.intelligence.recommendation}`);
        console.log(`     Entry Strategy: ${market.intelligence.entryStrategy}`);
        console.log('');
      });

      // Save results
      const outputPath = path.join(__dirname, 'output', `adrata-market-analysis-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(marketAnalysis, null, 2));
      console.log(` Results saved to: ${outputPath}`);

    } else {
      // Run full pipeline
      console.log(' Running full pipeline...\n');

      const results = await finder.runFullPipeline({
        markets: adrataConfig.markets,
        topMarketsCount: 3,
        companiesPerMarket: limit
      });

      // Print PULL companies
      if (results.clustering?.clusters?.PULL?.length > 0) {
        console.log('\n PULL COMPANIES (Would be weird NOT to buy):');
        console.log(' These companies have active compliance projects with urgency.\n');

        results.clustering.clusters.PULL.forEach((company, i) => {
          console.log(`  ${i + 1}. ${company.name}`);
          console.log(`     Industry: ${company.industry}`);
          console.log(`     Size: ${company.employeeCount} employees`);
          console.log(`     PULL Score: ${company.pullScore}/100`);
          console.log(`     Top Signals:`);
          company.topSignals?.forEach(signal => {
            console.log(`       - ${signal.evidence}`);
          });
          console.log(`     Rationale: ${company.rationale?.substring(0, 150)}...`);
          console.log('');
        });
      }

      console.log('\n Next Steps:');
      results.recommendations?.nextSteps?.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
    }

  } catch (error) {
    console.error('\n Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the analysis
main().catch(console.error);
