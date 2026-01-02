#!/usr/bin/env node

/**
 * OBP Report Generator - Test Drive CLI
 *
 * Runs the full Organizational Behavioral Physics pipeline on a target company
 * and generates a beautiful, shareable HTML report.
 *
 * Usage:
 *   node run-obp-report.js --product adrata --company "Ramp"
 *   node run-obp-report.js --product adrata --company "Nike" --output ./reports
 *   node run-obp-report.js --interactive
 *
 * Inputs Required:
 *   1. Product Config (--product or --config-file)
 *   2. Target Company (--company or --domain)
 *
 * Output:
 *   - Beautiful HTML report (can be printed to PDF)
 *   - JSON data export
 *   - Console summary
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import OBP modules
const { OBPPipeline } = require('./modules/OBPPipeline');
const { OBPReportGenerator } = require('./modules/OBPReportGenerator');

// =============================================================================
// Configuration Loading
// =============================================================================

function loadProductConfig(productName) {
  const configPaths = [
    path.join(__dirname, `product-configs/${productName}.json`),
    path.join(__dirname, `product-configs/${productName.toLowerCase()}.json`),
    path.join(__dirname, `${productName}-config.json`),
    path.join(__dirname, `${productName.toLowerCase()}-config.json`)
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      console.log(`   Loading product config: ${path.basename(configPath)}`);
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  }

  throw new Error(`Product config not found for "${productName}". Create one at product-configs/${productName}.json`);
}

function loadConfigFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }
  console.log(`   Loading config from: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    product: null,
    configFile: null,
    company: null,
    domain: null,
    output: null,
    interactive: false,
    verbose: false,
    jsonOnly: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--product':
      case '-p':
        options.product = nextArg;
        i++;
        break;
      case '--config':
      case '--config-file':
        options.configFile = nextArg;
        i++;
        break;
      case '--company':
      case '-c':
        options.company = nextArg;
        i++;
        break;
      case '--domain':
      case '-d':
        options.domain = nextArg;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = nextArg;
        i++;
        break;
      case '--interactive':
      case '-i':
        options.interactive = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--json':
        options.jsonOnly = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        // Positional argument - assume it's the company name
        if (!arg.startsWith('-') && !options.company) {
          options.company = arg;
        }
    }
  }

  return options;
}

function printHelp() {
  console.log(`
OBP Report Generator - Organizational Behavioral Physics

USAGE:
  node run-obp-report.js [OPTIONS] [COMPANY_NAME]

OPTIONS:
  --product, -p <name>     Product config name (e.g., "adrata")
  --config <file>          Path to custom product config JSON
  --company, -c <name>     Target company name to analyze
  --domain, -d <domain>    Target company domain (alternative to name)
  --output, -o <dir>       Output directory for reports (default: ./output/reports)
  --interactive, -i        Interactive mode - prompts for inputs
  --verbose, -v            Show detailed analysis output
  --json                   Output JSON only (no HTML report)
  --help, -h               Show this help message

EXAMPLES:
  # Analyze Ramp for Adrata
  node run-obp-report.js --product adrata --company "Ramp"

  # Analyze by domain
  node run-obp-report.js -p adrata -d stripe.com

  # Use custom config
  node run-obp-report.js --config ./my-product.json --company "Nike"

  # Interactive mode
  node run-obp-report.js --interactive

PRODUCT CONFIGS:
  Create product configs in ./product-configs/
  See ./product-configs/README.md for documentation
  See ./product-configs/template.json for a starting point

OUTPUT:
  - HTML report (shareable, printable as PDF)
  - JSON data export
  - Console summary with PULL score

REQUIREMENTS:
  - CORESIGNAL_API_KEY environment variable (for real org data)
  - ANTHROPIC_API_KEY environment variable (for dialogue simulation)
`);
}

// =============================================================================
// Interactive Mode
// =============================================================================

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function prompt(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

async function runInteractiveMode() {
  const rl = createInterface();

  console.log('\n' + '='.repeat(60));
  console.log('  OBP Report Generator - Interactive Mode');
  console.log('='.repeat(60) + '\n');

  try {
    // List available product configs
    const configDir = path.join(__dirname, 'product-configs');
    const configs = fs.readdirSync(configDir)
      .filter(f => f.endsWith('.json') && f !== 'template.json')
      .map(f => f.replace('.json', ''));

    if (configs.length > 0) {
      console.log('Available product configs:');
      configs.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
      console.log('');
    }

    const productInput = await prompt(rl, 'Product config name (or path to JSON file): ');
    const companyInput = await prompt(rl, 'Target company name: ');
    const outputInput = await prompt(rl, 'Output directory (press Enter for default): ');

    rl.close();

    return {
      product: productInput,
      company: companyInput,
      output: outputInput || null,
      verbose: true
    };
  } catch (error) {
    rl.close();
    throw error;
  }
}

// =============================================================================
// Main Pipeline
// =============================================================================

async function runOBPAnalysis(options) {
  console.log('\n' + '='.repeat(60));
  console.log('  ORGANIZATIONAL BEHAVIORAL PHYSICS');
  console.log('  PULL Intelligence Report Generator');
  console.log('='.repeat(60));

  // Step 1: Load product configuration
  console.log('\n1. Loading Product Configuration...');

  let productConfig;
  if (options.configFile) {
    productConfig = loadConfigFromFile(options.configFile);
  } else if (options.product) {
    productConfig = loadProductConfig(options.product);
  } else {
    throw new Error('No product config specified. Use --product or --config');
  }

  console.log(`   Product: ${productConfig.product?.name || 'Unknown'}`);
  console.log(`   Category: ${productConfig.product?.category || 'Unknown'}`);

  // Step 2: Validate target company
  console.log('\n2. Validating Target Company...');

  const targetCompany = options.company || options.domain;
  if (!targetCompany) {
    throw new Error('No target company specified. Use --company or --domain');
  }

  console.log(`   Target: ${targetCompany}`);

  // Step 3: Initialize OBP Pipeline with product context
  console.log('\n3. Initializing OBP Pipeline...');

  const productContext = {
    productName: productConfig.product?.name || 'Your Product',
    primaryProblem: productConfig.product?.problemStatement || 'Business problem',
    quickWinMetric: productConfig.product?.quickWinMetric || 'Key metric',
    targetDepartments: productConfig.targetBuyer?.primaryDepartments || ['security'],
    championTitles: productConfig.targetBuyer?.championTitles || [],
    economicBuyerTitles: productConfig.targetBuyer?.economicBuyerTitles || [],
    matureCompanies: productConfig.competitors?.matureCompanies || [],
    competitors: productConfig.competitors?.direct || [],
    ratios: productConfig.ratios || {}
  };

  const pipeline = new OBPPipeline({
    productContext,
    verbose: options.verbose
  });

  // Step 4: Run OBP Analysis
  console.log('\n4. Running OBP Analysis...');
  console.log('   This may take 30-60 seconds...\n');

  const startTime = Date.now();

  const obpResult = await pipeline.analyze({
    name: targetCompany,
    domain: options.domain
  });

  const analysisTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n   Analysis completed in ${analysisTime}s`);

  if (!obpResult.success) {
    console.error(`\n   Analysis failed: ${obpResult.error}`);
    return { success: false, error: obpResult.error };
  }

  // Step 5: Generate Report
  console.log('\n5. Generating Report...');

  const reportGenerator = new OBPReportGenerator({
    productConfig,
    outputDir: options.output || path.join(__dirname, 'output/reports')
  });

  const report = reportGenerator.generateReport(obpResult, {
    includeDialogue: true,
    includeStrategy: true
  });

  // Step 6: Save JSON Export
  const jsonFilename = report.filename.replace('.html', '.json');
  const jsonPath = path.join(path.dirname(report.filepath), jsonFilename);
  fs.writeFileSync(jsonPath, JSON.stringify(obpResult, null, 2));
  console.log(`   JSON saved: ${jsonPath}`);

  // Step 7: Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('  ANALYSIS COMPLETE');
  console.log('='.repeat(60));

  const pullScore = obpResult.pullScore || 0;
  const classification = obpResult.classification?.category || 'UNKNOWN';
  const champion = obpResult.champion || {};
  const buyingProb = obpResult.predictions?.buyingProbability || 0;

  console.log(`
  Company:            ${obpResult.company}
  PULL Score:         ${pullScore}/100
  Classification:     ${classification}
  Buying Probability: ${Math.round(buyingProb)}%

  Champion:           ${champion.name || 'None identified'}
  ${champion.name ? `Title:              ${champion.title}` : ''}
  ${champion.windowRemaining ? `Action Window:      ${champion.windowRemaining} days remaining` : ''}

  Reports Generated:
  - HTML: ${report.filepath}
  - JSON: ${jsonPath}
  `);

  // Verdict
  const verdictEmoji = pullScore >= 60 ? '✅' : pullScore >= 40 ? '⚠️' : '❌';
  const verdictText = pullScore >= 60 ? 'PURSUE' : pullScore >= 40 ? 'MONITOR' : 'SKIP';

  console.log(`  VERDICT: ${verdictEmoji} ${verdictText}`);
  console.log('='.repeat(60) + '\n');

  return {
    success: true,
    obpResult,
    htmlReport: report.filepath,
    jsonExport: jsonPath
  };
}

// =============================================================================
// Entry Point
// =============================================================================

async function main() {
  try {
    const options = parseArgs();

    if (options.help) {
      printHelp();
      process.exit(0);
    }

    let finalOptions = options;

    if (options.interactive) {
      finalOptions = await runInteractiveMode();
    }

    // Validate we have minimum required inputs
    if (!finalOptions.product && !finalOptions.configFile) {
      console.error('\nError: No product config specified.');
      console.error('Use --product <name> or --config <file>');
      console.error('Run with --help for usage information.\n');
      process.exit(1);
    }

    if (!finalOptions.company && !finalOptions.domain) {
      console.error('\nError: No target company specified.');
      console.error('Use --company <name> or --domain <domain>');
      console.error('Run with --help for usage information.\n');
      process.exit(1);
    }

    const result = await runOBPAnalysis(finalOptions);

    if (!result.success) {
      process.exit(1);
    }

    // Open report in browser (macOS)
    if (process.platform === 'darwin' && result.htmlReport) {
      const { exec } = require('child_process');
      exec(`open "${result.htmlReport}"`, (err) => {
        if (err) console.log('   (Could not auto-open report in browser)');
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
