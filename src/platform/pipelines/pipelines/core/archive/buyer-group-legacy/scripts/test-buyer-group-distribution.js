const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class BuyerGroupDistributionTester {
  constructor() {
    this.roleTargets = {
      micro: { // 1-50 employees
        decisionMakers: { min: 1, max: 2, ideal: 1 },
        champions: { min: 0, max: 1, ideal: 0 },
        stakeholders: { min: 0, max: 3, ideal: 2 },
        blockers: { min: 0, max: 1, ideal: 0 },
        introducers: { min: 0, max: 1, ideal: 0 }
      },
      small: { // 51-200 employees
        decisionMakers: { min: 1, max: 2, ideal: 1 },
        champions: { min: 0, max: 2, ideal: 1 },
        stakeholders: { min: 1, max: 4, ideal: 3 },
        blockers: { min: 0, max: 2, ideal: 1 },
        introducers: { min: 0, max: 2, ideal: 1 }
      },
      medium: { // 201-500 employees
        decisionMakers: { min: 1, max: 2, ideal: 2 },
        champions: { min: 0, max: 2, ideal: 1 },
        stakeholders: { min: 2, max: 5, ideal: 4 },
        blockers: { min: 0, max: 2, ideal: 1 },
        introducers: { min: 0, max: 2, ideal: 1 }
      },
      large: { // 501-1000 employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 0, max: 3, ideal: 2 },
        stakeholders: { min: 2, max: 6, ideal: 4 },
        blockers: { min: 0, max: 3, ideal: 2 },
        introducers: { min: 0, max: 3, ideal: 2 }
      },
      xlarge: { // 1001-5000 employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 0, max: 3, ideal: 2 },
        stakeholders: { min: 3, max: 7, ideal: 5 },
        blockers: { min: 0, max: 4, ideal: 2 },
        introducers: { min: 0, max: 4, ideal: 2 }
      },
      enterprise: { // 5001+ employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 0, max: 3, ideal: 2 },
        stakeholders: { min: 4, max: 9, ideal: 6 },
        blockers: { min: 0, max: 5, ideal: 3 },
        introducers: { min: 0, max: 5, ideal: 3 }
      }
    };
  }

  async testDistribution() {
    console.log('🧪 BUYER GROUP DISTRIBUTION TESTER');
    console.log('==================================');
    console.log('Testing role distribution across different company sizes');
    console.log('');

    // Test companies with different sizes
    const testCompanies = [
      { name: 'Micro Utility Co', size: 25, category: 'micro' },
      { name: 'Small Utility Co', size: 150, category: 'small' },
      { name: 'Medium Utility Co', size: 350, category: 'medium' },
      { name: 'Large Utility Co', size: 750, category: 'large' },
      { name: 'X-Large Utility Co', size: 2500, category: 'xlarge' },
      { name: 'Enterprise Utility Co', size: 8000, category: 'enterprise' },
      { name: 'Mega Utility Co', size: 15000, category: 'enterprise' },
      { name: 'Regional Utility Co', size: 500, category: 'medium' },
      { name: 'Local Utility Co', size: 100, category: 'small' },
      { name: 'Startup Utility Co', size: 15, category: 'micro' }
    ];

    for (const company of testCompanies) {
      await this.testCompanyDistribution(company);
      console.log('');
    }

    console.log('✅ DISTRIBUTION TESTING COMPLETE!');
    console.log('All company sizes tested with appropriate role distributions.');
  }

  async testCompanyDistribution(company) {
    const targets = this.roleTargets[company.category];
    
    console.log(`🏢 ${company.name} (${company.size} employees - ${company.category.toUpperCase()})`);
    console.log('─'.repeat(60));
    
    console.log('📊 TARGET DISTRIBUTION:');
    console.log(`   Decision Makers: ${targets.decisionMakers.min}-${targets.decisionMakers.max} (ideal: ${targets.decisionMakers.ideal})`);
    console.log(`   Champions: ${targets.champions.min}-${targets.champions.max} (ideal: ${targets.champions.ideal})`);
    console.log(`   Stakeholders: ${targets.stakeholders.min}-${targets.stakeholders.max} (ideal: ${targets.stakeholders.ideal})`);
    console.log(`   Blockers: ${targets.blockers.min}-${targets.blockers.max} (ideal: ${targets.blockers.ideal})`);
    console.log(`   Introducers: ${targets.introducers.min}-${targets.introducers.max} (ideal: ${targets.introducers.ideal})`);
    
    // Calculate total range
    const totalMin = targets.decisionMakers.min + targets.champions.min + targets.stakeholders.min + targets.blockers.min + targets.introducers.min;
    const totalMax = targets.decisionMakers.max + targets.champions.max + targets.stakeholders.max + targets.blockers.max + targets.introducers.max;
    const totalIdeal = targets.decisionMakers.ideal + targets.champions.ideal + targets.stakeholders.ideal + targets.blockers.ideal + targets.introducers.ideal;
    
    console.log(`   TOTAL BUYER GROUP: ${totalMin}-${totalMax} people (ideal: ${totalIdeal})`);
    
    // Validate constraints
    const constraints = this.validateConstraints(targets, company.size);
    if (constraints.length > 0) {
      console.log('⚠️  CONSTRAINT WARNINGS:');
      constraints.forEach(warning => console.log(`   ${warning}`));
    } else {
      console.log('✅ All constraints satisfied');
    }
  }

  validateConstraints(targets, companySize) {
    const warnings = [];
    
    // Check for minimum Decision Makers
    if (targets.decisionMakers.min === 0) {
      warnings.push('No minimum Decision Makers required - may violate buyer group requirements');
    }
    
    // Check for reasonable total size
    const totalMin = targets.decisionMakers.min + targets.champions.min + targets.stakeholders.min + targets.blockers.min + targets.introducers.min;
    const totalMax = targets.decisionMakers.max + targets.champions.max + targets.stakeholders.max + targets.blockers.max + targets.introducers.max;
    
    if (totalMin === 0) {
      warnings.push('No minimum people required - may result in empty buyer group');
    }
    
    if (totalMax > 25) {
      warnings.push(`Maximum buyer group size (${totalMax}) exceeds recommended limit of 25`);
    }
    
    if (totalMax < 5) {
      warnings.push(`Maximum buyer group size (${totalMax}) may be too small for effective coverage`);
    }
    
    // Check for company size appropriateness
    if (companySize < 50 && totalMax > 10) {
      warnings.push(`Large buyer group (${totalMax}) for small company (${companySize} employees)`);
    }
    
    if (companySize > 5000 && totalMax < 15) {
      warnings.push(`Small buyer group (${totalMax}) for large company (${companySize} employees)`);
    }
    
    return warnings;
  }

  async callCoreSignalAPI(endpoint, data, method = 'POST') {
    const url = `${CORESIGNAL_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`CoreSignal API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
}

async function main() {
  const tester = new BuyerGroupDistributionTester();
  await tester.testDistribution();
  await prisma.$disconnect();
}

main().catch(console.error);
