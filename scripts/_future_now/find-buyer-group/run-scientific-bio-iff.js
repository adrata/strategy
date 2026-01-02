#!/usr/bin/env node

/**
 * Scientific Bioprocessing → IFF Buyer Group Discovery
 * 
 * Runs buyer group discovery for Scientific Bioprocessing selling laboratory
 * equipment to IFF (International Flavors & Fragrances).
 * 
 * COMPANY CONTEXT:
 * ================
 * Scientific Bioprocessing (scientificbio.com):
 * - Laboratory equipment manufacturer
 * - Products: Upstream Bioprocessing Sensors for Bioreactors/Shake Flasks
 * - Small Scale Bioprocess Development Fermentation Platform for Shake Flasks
 * - Enables real-time bioprocess monitoring and optimization
 * - Customers: Biotech, pharma, food & beverage, industrial fermentation
 * 
 * IFF (iff.com):
 * - International Flavors & Fragrances Inc.
 * - NYSE: IFF - Fortune 500 company
 * - Global leader in food, beverage, scent, health, and biosciences
 * - ~22,000 employees worldwide
 * - Merged with DuPont Nutrition & Biosciences in 2021
 * - Heavy investment in biotechnology and fermentation
 * - R&D labs worldwide requiring bioprocess equipment
 * 
 * WHY SCIENTIFIC BIOPROCESSING FOR IFF:
 * =====================================
 * 1. IFF has extensive biosciences division from DuPont merger
 * 2. Fermentation is core to flavor/fragrance ingredient production
 * 3. Need for real-time bioprocess monitoring in R&D and production
 * 4. Scale-up from shake flask to bioreactor is critical workflow
 * 5. Precision sensors improve yield and reduce development time
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Clean API keys
const cleanEnvKeys = () => {
  const keysToClean = [
    'CORESIGNAL_API_KEY',
    'ZEROBOUNCE_API_KEY', 
    'MYEMAILVERIFIER_API_KEY',
    'PROSPEO_API_KEY',
    'PERPLEXITY_API_KEY',
    'PEOPLE_DATA_LABS_API_KEY',
    'OPENAI_API_KEY'
  ];
  
  keysToClean.forEach(key => {
    if (process.env[key]) {
      process.env[key] = process.env[key].replace(/\\n/g, '').replace(/\n/g, '').trim();
    }
  });
};
cleanEnvKeys();

const { getPrismaClient, disconnectPrismaClient } = require('../../lib/prisma-client');
const { SmartBuyerGroupPipeline } = require('./index');
const fs = require('fs');

class ScientificBioIFFRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;
    
    // Configuration for Scientific Bioprocessing selling lab equipment to IFF
    this.config = {
      // Product/Deal Configuration
      dealSize: 50000, // $50K midpoint of $10K-$100K range
      dealSizeRange: { min: 10000, max: 100000 },
      productCategory: 'custom', // Laboratory equipment
      productName: 'Upstream Bioprocessing Sensors & Fermentation Platform',
      productDescription: 'Upstream Bioprocessing Sensors for Bioreactors/Shake Flasks and Small Scale Bioprocess Development Fermentation Platform',
      
      // Department Filtering - Who would evaluate/use bioprocess equipment
      customFiltering: {
        departments: {
          primary: [
            // R&D / Science
            'research',
            'research and development',
            'r&d',
            'science',
            'scientific',
            'laboratory',
            'lab',
            
            // Bioprocess / Fermentation specific
            'bioprocess',
            'bioprocessing',
            'fermentation',
            'biosciences',
            'biotechnology',
            'biotech',
            'microbiology',
            'biochemistry',
            
            // Process Development
            'process development',
            'process engineering',
            'process sciences',
            'upstream',
            'downstream',
            
            // Manufacturing / Production
            'manufacturing',
            'production',
            'operations'
          ],
          secondary: [
            // Engineering
            'engineering',
            'chemical engineering',
            'bioengineering',
            'biological engineering',
            
            // Quality
            'quality',
            'quality assurance',
            'quality control',
            'qa',
            'qc',
            
            // Procurement / Supply Chain
            'procurement',
            'purchasing',
            'supply chain',
            'sourcing',
            
            // Product / Innovation
            'product development',
            'innovation',
            'new product',
            'applications'
          ],
          exclude: [
            // CRITICAL: Exclude Sales - they are NOT buyers of lab equipment
            'sales',
            'account manager',
            'account executive',
            'business development',
            'sales operations',
            'revenue',
            
            // Exclude Data/IT roles - not relevant for lab equipment
            'data governance',
            'data management',
            'data analytics',
            'information technology',
            'it',
            'software',
            'software development',
            'software engineering',
            
            // Exclude HR/Admin
            'human resources',
            'hr',
            'recruiting',
            'talent',
            'administration',
            'administrative',
            
            // Exclude Marketing/Communications
            'marketing',
            'communications',
            'public relations',
            'social media',
            'content',
            
            // Exclude Finance/Legal (unless procurement)
            'finance',
            'accounting',
            'legal',
            'compliance',
            
            // Exclude Customer-facing
            'customer success',
            'customer service',
            'support'
          ]
        },
        titles: {
          primary: [
            'scientist',
            'senior scientist',
            'principal scientist',
            'research scientist',
            'bioprocess scientist',
            'fermentation scientist',
            'bioprocess engineer',
            'fermentation engineer',
            'process engineer',
            'director',
            'manager',
            'head of',
            'lead'
          ],
          secondary: [
            'vp',
            'vice president',
            'technical',
            'specialist',
            'lab manager',
            'laboratory manager'
          ]
        }
      },
      
      // USA focus
      usaOnly: false, // IFF is global
      
      // Buyer group sizing
      buyerGroupSizing: { min: 8, max: 12, ideal: 10 },
      
      // Role priorities for lab equipment
      rolePriorities: {
        decision: ['director', 'head', 'vp', 'vice president', 'manager'],
        champion: ['scientist', 'engineer', 'lead', 'senior'],
        blocker: ['procurement', 'purchasing', 'finance', 'quality'],
        stakeholder: ['associate', 'specialist', 'analyst']
      }
    };
  }

  /**
   * Ensure workspace exists
   */
  async ensureWorkspace() {
    try {
      let workspace = await this.prisma.workspaces.findFirst({
        where: { name: { contains: 'Scientific Bioprocessing' } }
      });

      if (workspace) {
        console.log(`Found existing workspace: ${workspace.name} (${workspace.id})`);
        this.workspaceId = workspace.id;
        return workspace.id;
      }

      workspace = await this.prisma.workspaces.create({
        data: {
          name: 'Scientific Bioprocessing',
          slug: `scientific-bioprocessing-${Date.now()}`,
          updatedAt: new Date(),
        }
      });

      console.log(`Created workspace: ${workspace.name} (${workspace.id})`);
      this.workspaceId = workspace.id;
      return workspace.id;
    } catch (error) {
      console.error('Error with workspace:', error.message);
      this.workspaceId = `temp_scientificbio_${Date.now()}`;
      console.log(`Using temporary workspace ID: ${this.workspaceId}`);
      return this.workspaceId;
    }
  }

  /**
   * Run buyer group discovery for IFF
   */
  async run(companyIdentifier = 'iff.com', options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('SCIENTIFIC BIOPROCESSING -> IFF BUYER GROUP DISCOVERY');
    console.log('='.repeat(80));
    console.log('\nCONTEXT:');
    console.log('   Seller: Scientific Bioprocessing (Lab Equipment)');
    console.log('   Buyer:  IFF (NYSE: IFF - Biosciences & Specialty Chemicals)');
    console.log(`\nDeal Size: $${this.config.dealSize.toLocaleString()} (range: $${this.config.dealSizeRange.min.toLocaleString()}-$${this.config.dealSizeRange.max.toLocaleString()})`);
    console.log(`Product: ${this.config.productName}`);
    console.log(`Category: ${this.config.productCategory}`);
    console.log(`Target Buyer Group Size: ${this.config.buyerGroupSizing.min}-${this.config.buyerGroupSizing.max} (ideal: ${this.config.buyerGroupSizing.ideal})`);
    console.log(`USA Only: ${this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('\n' + '='.repeat(80) + '\n');

    await this.ensureWorkspace();

    try {
      // Initialize pipeline
      const pipeline = new SmartBuyerGroupPipeline({
        prisma: this.prisma,
        workspaceId: this.workspaceId,
        mainSellerId: this.mainSellerId,
        dealSize: this.config.dealSize,
        productCategory: this.config.productCategory,
        productName: this.config.productName,
        customFiltering: this.config.customFiltering,
        usaOnly: this.config.usaOnly,
        buyerGroupSizing: this.config.buyerGroupSizing,
        rolePriorities: this.config.rolePriorities,
        skipDatabase: options.skipDatabase || true
      });

      // Prepare company object for pipeline
      const company = {
        name: 'IFF',
        linkedinUrl: null,
        website: companyIdentifier.includes('http') ? companyIdentifier : `https://${companyIdentifier}`,
        mainSellerId: this.mainSellerId,
        originalIdentifier: companyIdentifier
      };

      // Run the discovery pipeline
      console.log('Starting buyer group discovery pipeline...\n');
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('Pipeline failed to produce results');
        return null;
      }

      console.log('\nBuyer Group Discovery Complete!');
      console.log(`Found ${result.buyerGroup.length} buyer group members`);

      // Save results to JSON file
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const outputFile = path.join(outputDir, `scientific-bio-iff-buyer-group-${timestamp}.json`);
      
      const outputData = this.formatOutputData(result, company);
      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`\nResults saved to: ${outputFile}`);

      // Generate HTML report
      const htmlFile = path.join(outputDir, `scientific-bio-iff-buyer-group-${timestamp}.html`);
      const htmlReport = this.generateHTMLReport(result, company);
      fs.writeFileSync(htmlFile, htmlReport);
      console.log(`HTML report saved to: ${htmlFile}`);

      // Copy to Desktop
      const desktopPath = '/Users/rosssylvester/Desktop/ScientificBio-IFF-BGI-Report.html';
      fs.writeFileSync(desktopPath, htmlReport);
      console.log(`HTML copied to Desktop: ${desktopPath}`);

      return result;

    } catch (error) {
      console.error('Buyer group discovery failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Format output data for JSON
   */
  formatOutputData(result, company) {
    return {
      context: {
        seller: {
          name: 'Scientific Bioprocessing',
          website: 'https://www.scientificbio.com',
          product: 'Upstream Bioprocessing Sensors & Fermentation Platform',
          valueProposition: 'Real-time bioprocess monitoring and optimization for shake flasks and bioreactors',
          keyCapabilities: [
            'Upstream Bioprocessing Sensors for Bioreactors',
            'Shake Flask Monitoring Systems',
            'Small Scale Fermentation Platform',
            'Real-time pH, DO, and biomass monitoring',
            'Non-invasive measurement technology'
          ]
        },
        buyer: {
          name: 'IFF',
          fullName: 'International Flavors & Fragrances Inc.',
          website: 'https://www.iff.com',
          industry: 'Specialty Chemicals / Biosciences',
          ticker: 'NYSE: IFF',
          relevantContext: [
            'Fortune 500 company with global R&D operations',
            'Major biosciences division from DuPont N&B merger',
            'Fermentation-based ingredient production',
            'Heavy investment in biotechnology R&D'
          ]
        },
        dealSize: this.config.dealSize,
        generatedAt: new Date().toISOString()
      },
      buyerGroup: {
        totalMembers: result.buyerGroup?.length || 0,
        members: result.buyerGroup || []
      },
      company: result.companyIntelligence || {},
      costs: result.costs || {},
      metadata: {
        pipelineVersion: '1.0',
        workspaceId: this.workspaceId
      }
    };
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(result, company) {
    const buyerGroup = result.buyerGroup || [];
    const decisionMakers = buyerGroup.filter(m => m.role === 'decision');
    const champions = buyerGroup.filter(m => m.role === 'champion');
    const blockers = buyerGroup.filter(m => m.role === 'blocker');
    const stakeholders = buyerGroup.filter(m => m.role === 'stakeholder' || m.role === 'introducer');

    const roleLabels = {
      decision: 'DECISION MAKER',
      champion: 'CHAMPION',
      blocker: 'BLOCKER',
      stakeholder: 'STAKEHOLDER',
      introducer: 'INTRODUCER'
    };

    const roleColors = {
      decision: '#dc2626',
      champion: '#16a34a',
      blocker: '#f97316',
      stakeholder: '#3b82f6',
      introducer: '#8b5cf6'
    };

    const generateProfilesHtml = (members) => {
      if (!members || members.length === 0) return '<p>No stakeholders found.</p>';
      
      const order = ['decision', 'champion', 'blocker', 'stakeholder', 'introducer'];
      let html = '';
      
      order.forEach(role => {
        const roleMembers = members.filter(m => m.role === role);
        roleMembers.forEach(m => {
          html += `
          <div class="profile-card">
            <div class="profile-header">
              <div class="profile-name">${m.name || 'Unknown'}</div>
              <span class="role-badge" style="background: ${roleColors[role] || '#6b7280'};">${roleLabels[role] || 'STAKEHOLDER'}</span>
            </div>
            <div class="profile-title">${m.title || 'Unknown Title'}</div>
            <div class="profile-meta">
              ${m.department ? `<span class="dept">${m.department}</span>` : ''}
              ${m.phone ? `<span class="phone">📞 ${m.phone}</span>` : ''}
              ${m.linkedin ? `<a href="${m.linkedin}" class="linkedin" target="_blank">LinkedIn</a>` : ''}
            </div>
            ${m.roleReasoning ? `<div class="reasoning">${m.roleReasoning}</div>` : ''}
          </div>`;
        });
      });
      
      return html;
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BGI Report | Scientific Bioprocessing → IFF</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #059669;
      --primary-dark: #047857;
      --decision: #dc2626;
      --champion: #16a34a;
      --blocker: #f97316;
      --stakeholder: #3b82f6;
      --text: #1e293b;
      --text-secondary: #64748b;
      --border: #e2e8f0;
      --bg: #ffffff;
      --bg-muted: #f8fafc;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; font-size: 14px; }
    .page { max-width: 850px; margin: 0 auto; padding: 48px; }
    .cover { min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 48px; }
    .cover-header { text-align: center; margin-bottom: 48px; }
    .label { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--primary); margin-bottom: 16px; }
    .cover-title { font-size: 42px; font-weight: 800; line-height: 1.1; margin-bottom: 16px; }
    .cover-subtitle { font-size: 18px; color: var(--text-secondary); max-width: 600px; margin: 0 auto; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-top: 48px; }
    .stat-box { background: var(--bg); padding: 20px 16px; text-align: center; }
    .stat-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; }
    .stat-value { font-size: 14px; font-weight: 700; }
    .section { padding: 48px 0; border-top: 1px solid var(--border); }
    .section-title { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
    .section-subtitle { font-size: 16px; color: var(--text-secondary); margin-bottom: 32px; }
    .profiles-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .profile-card { background: var(--bg-muted); border: 1px solid var(--border); padding: 20px; border-radius: 8px; }
    .profile-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .profile-name { font-size: 16px; font-weight: 700; }
    .profile-title { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
    .profile-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .role-badge { padding: 4px 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; color: white; border-radius: 4px; }
    .dept { font-size: 11px; color: var(--text-secondary); background: var(--border); padding: 4px 8px; border-radius: 4px; }
    .phone { font-size: 12px; color: var(--text-secondary); }
    .linkedin { font-size: 12px; color: var(--primary); text-decoration: none; }
    .reasoning { font-size: 11px; color: var(--text-secondary); margin-top: 12px; font-style: italic; border-top: 1px solid var(--border); padding-top: 12px; }
    .composition { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 32px; }
    .comp-item { background: var(--bg); padding: 20px; text-align: center; }
    .comp-value { font-size: 28px; font-weight: 800; }
    .comp-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-secondary); margin-top: 4px; }
    .footer { text-align: center; padding-top: 48px; margin-top: 48px; border-top: 1px solid var(--border); }
    .footer-logo { font-size: 18px; font-weight: 800; color: var(--primary); }
    .page-break { page-break-before: always; }
    @media print { * { print-color-adjust: exact !important; } .page { padding: 32px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <div class="cover-header">
        <div class="label">Buyer Group Intelligence</div>
        <h1 class="cover-title">Your path into IFF</h1>
        <p class="cover-subtitle">${buyerGroup.length} verified bioprocess & R&D stakeholders identified for Upstream Bioprocessing Sensors & Fermentation Platform.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Seller</div>
          <div class="stat-value">Scientific Bioprocessing</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Target</div>
          <div class="stat-value">IFF</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Deal Size</div>
          <div class="stat-value">$${this.config.dealSize.toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Industry</div>
          <div class="stat-value">Biosciences</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Generated</div>
          <div class="stat-value">${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Buyer Group Composition</h2>
      <p class="section-subtitle">Role distribution for bioprocess equipment purchase</p>
      
      <div class="composition">
        <div class="comp-item">
          <div class="comp-value" style="color: var(--decision);">${decisionMakers.length}</div>
          <div class="comp-label">Decision Makers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: var(--champion);">${champions.length}</div>
          <div class="comp-label">Champions</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: var(--blocker);">${blockers.length}</div>
          <div class="comp-label">Blockers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: var(--stakeholder);">${stakeholders.length}</div>
          <div class="comp-label">Stakeholders</div>
        </div>
      </div>

      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Buyer Group Profiles</h3>
      <div class="profiles-grid">
        ${generateProfilesHtml(buyerGroup)}
      </div>
    </div>

    <div class="footer">
      <div class="footer-logo">SCIENTIFIC BIOPROCESSING</div>
    </div>
  </div>
</body>
</html>`;
  }
}

// Main execution
async function main() {
  const runner = new ScientificBioIFFRunner();
  try {
    await runner.run(process.argv[2] || 'iff.com');
  } finally {
    await disconnectPrismaClient();
  }
}

module.exports = { ScientificBioIFFRunner };

if (require.main === module) {
  main().catch(console.error);
}
