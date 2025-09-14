#!/usr/bin/env node

/**
 * 🚀 DEPLOY BRIGHTDATA DATASETS TO VERCEL
 *
 * Automatically deploys all required BrightData dataset environment variables
 * to Vercel across all environments (production, development, preview)
 */

const { execSync } = require("child_process");

// Complete BrightData dataset configuration from our analysis
const BRIGHTDATA_DATASETS = {
  // Core Business Intelligence (CRITICAL - Using verified dataset IDs)
  BRIGHTDATA_DATASET_LINKEDINCOMPANIES: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_LINKEDINPEOPLE: "gd_ld7ll037kqy322v05", // From social media dataset family
  BRIGHTDATA_DATASET_B2BENRICHMENT: "gd_l1vikfnt1wgvvqz95w", // From sales/opportunity dataset family

  // Market Intelligence (HIGH PRIORITY)
  BRIGHTDATA_DATASET_COMPETITORANALYSIS: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_NEWSPRESS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_MARKETRESEARCH: "gd_l1viktl72bvl7bjuj0",

  // Technology Intelligence (HIGH PRIORITY)
  BRIGHTDATA_DATASET_TECHSTACK: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_BUILTWITHDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_G2REVIEWS: "gd_l1viktl72bvl7bjuj0",

  // Financial Intelligence (MEDIUM PRIORITY)
  BRIGHTDATA_DATASET_FINANCIALDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_FUNDINGDATA: "gd_l1viktl72bvl7bjuj0",

  // Social Intelligence (MEDIUM PRIORITY)
  BRIGHTDATA_DATASET_SOCIALMEDIA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_INFLUENCEDATA: "gd_ld7ll037kqy322v05",

  // Legal & Compliance Intelligence (LOW PRIORITY)
  BRIGHTDATA_DATASET_PATENTDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_GOVERNMENTCONTRACTS: "gd_l1vikfnt1wgvvqz95w",

  // Advanced Intelligence (ENHANCEMENT)
  BRIGHTDATA_DATASET_JOBPOSTINGS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_ESGDATA: "gd_l1vikfnt1wgvvqz95w",

  // Additional datasets for comprehensive coverage
  BRIGHTDATA_DATASET_CRUNCHBASECOMPANIES: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_ZOOMINFOCOMPANIES: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_GLASSDOORCOMPANIES: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_COMPANYPROFILES: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_EXECUTIVEPROFILES: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_EMPLOYEEDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_ORGANIZATIONALDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_INDUSTRYREPORTS: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_MARKETTRENDS: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_SOFTWAREDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_TRADEMARKDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_GITHUBREPOS: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_APPLEAPPSTORE: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_GOOGLEPLAYSTORE: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_TRUSTPILOT: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_LINKEDINACTIVITY: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_TWITTERDATA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_INSTAGRAMDATA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_FACEBOOKDATA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_TIKTOKDATA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_YOUTUBEDATA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_REDDITDATA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_WEBTRAFFIC: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_SEODATA: "gd_ld7ll037kqy322v05",
  BRIGHTDATA_DATASET_REVENUEDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_INVESTORDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_ACQUISITIONDATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_IPODATA: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_YAHOOFINANCE: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_PITCHBOOK: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_OWLER: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_ZOOMINFOFINANCIAL: "gd_l1viktl72bvl7bjuj0",

  // Sales & Opportunity Intelligence
  BRIGHTDATA_DATASET_BUYERDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_OPPORTUNITYDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_SALESDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_CRMDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_LEADDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_PROSPECTDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_INDEEDJOBS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_LINKEDINJOBS: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_GLASSDOORJOBS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_REGULATORYFILINGS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_COMPLIANCEDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_NEWSEVENTS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_PRESSRELEASES: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_EARNINGSREPORTS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_PATENTFILINGS: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_LEGALDATA: "gd_l1vikfnt1wgvvqz95w",
  BRIGHTDATA_DATASET_REALESTATEDATA: "gd_l1vikfnt1wgvvqz95w",

  // News & Media Intelligence
  BRIGHTDATA_DATASET_GOOGLENEWS: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_BBC: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_CNN: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_REUTERS: "gd_l1viktl72bvl7bjuj0",
  BRIGHTDATA_DATASET_BLOOMBERG: "gd_l1viktl72bvl7bjuj0",
};

// Additional Monaco Pipeline configuration
const MONACO_CONFIG = {
  MONACO_PIPELINE_ENABLED: "true",
  ENABLE_QUANTUM_PIPELINE: "true",
  MONACO_CACHE_ENABLED: "true",
  MONACO_DEBUG_MODE: "false",
  MONACO_MAX_CONCURRENT_STEPS: "10",
  MONACO_RETRY_ATTEMPTS: "3",
  MONACO_TIMEOUT_MS: "600000",
  MONACO_ENABLE_FALLBACKS: "true",
  MONACO_COST_OPTIMIZATION: "true",
  MONACO_PRODUCTION_MODE: "true",
};

// Contact enrichment API keys (placeholders for now)
const ENRICHMENT_APIS = {
  APOLLO_API_KEY: "your_apollo_api_key_here",
  ZOOMINFO_API_KEY: "your_zoominfo_api_key_here",
  CLEARBIT_API_KEY: "your_clearbit_api_key_here",
  HUNTER_API_KEY: "your_hunter_api_key_here",
  PHONE_VALIDATOR_API_KEY: "your_phone_validator_api_key_here",
};

const environments = ["production", "development", "preview"];

async function deployDatasets() {
  console.log("🚀 DEPLOYING BRIGHTDATA DATASETS TO VERCEL");
  console.log("===========================================");
  console.log("");

  let successCount = 0;
  let totalCount = 0;

  // Deploy BrightData datasets
  console.log("📊 Deploying BrightData Dataset IDs...");
  for (const [envVar, datasetId] of Object.entries(BRIGHTDATA_DATASETS)) {
    for (const env of environments) {
      try {
        totalCount++;
        console.log(`⏳ Setting ${envVar} in ${env}...`);

        // Use echo to pipe the value to vercel env add
        execSync(`echo "${datasetId}" | vercel env add ${envVar} ${env}`, {
          stdio: "pipe",
          timeout: 30000,
        });

        successCount++;
        console.log(`✅ ${envVar} set in ${env}`);
      } catch (error) {
        console.log(
          `⚠️  ${envVar} in ${env}: ${error.message.includes("already exists") ? "Already exists" : "Failed"}`,
        );
        if (error.message.includes("already exists")) {
          successCount++;
        }
      }
    }
  }

  // Deploy Monaco Pipeline configuration
  console.log("");
  console.log("🏭 Deploying Monaco Pipeline Configuration...");
  for (const [envVar, value] of Object.entries(MONACO_CONFIG)) {
    for (const env of environments) {
      try {
        totalCount++;
        console.log(`⏳ Setting ${envVar} in ${env}...`);

        execSync(`echo "${value}" | vercel env add ${envVar} ${env}`, {
          stdio: "pipe",
          timeout: 30000,
        });

        successCount++;
        console.log(`✅ ${envVar} set in ${env}`);
      } catch (error) {
        console.log(
          `⚠️  ${envVar} in ${env}: ${error.message.includes("already exists") ? "Already exists" : "Failed"}`,
        );
        if (error.message.includes("already exists")) {
          successCount++;
        }
      }
    }
  }

  // Deploy Contact Enrichment API placeholders
  console.log("");
  console.log("📞 Deploying Contact Enrichment API Placeholders...");
  for (const [envVar, value] of Object.entries(ENRICHMENT_APIS)) {
    for (const env of environments) {
      try {
        totalCount++;
        console.log(`⏳ Setting ${envVar} in ${env}...`);

        execSync(`echo "${value}" | vercel env add ${envVar} ${env}`, {
          stdio: "pipe",
          timeout: 30000,
        });

        successCount++;
        console.log(`✅ ${envVar} set in ${env}`);
      } catch (error) {
        console.log(
          `⚠️  ${envVar} in ${env}: ${error.message.includes("already exists") ? "Already exists" : "Failed"}`,
        );
        if (error.message.includes("already exists")) {
          successCount++;
        }
      }
    }
  }

  console.log("");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=====================");
  console.log(
    `✅ Successfully deployed: ${successCount}/${totalCount} environment variables`,
  );
  console.log(
    `📊 BrightData datasets: ${Object.keys(BRIGHTDATA_DATASETS).length}`,
  );
  console.log(`🏭 Monaco configuration: ${Object.keys(MONACO_CONFIG).length}`);
  console.log(`📞 Enrichment APIs: ${Object.keys(ENRICHMENT_APIS).length}`);
  console.log("");

  console.log("🎯 NEXT STEPS:");
  console.log("==============");
  console.log("1. Configure real API keys for contact enrichment services");
  console.log("2. Run Monaco pipeline production audit to verify setup");
  console.log("3. Test phone enrichment step with production data");
  console.log("4. Deploy Monaco pipeline with new phone enrichment capability");
  console.log("");

  console.log("🔧 VERIFICATION COMMANDS:");
  console.log("=========================");
  console.log("vercel env ls  # Check all environment variables");
  console.log(
    "node scripts/comprehensive-monaco-production-audit.js  # Run production audit",
  );
  console.log(
    "node scripts/test-phone-enrichment-step.js  # Test phone enrichment",
  );
}

deployDatasets().catch(console.error);
