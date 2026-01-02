#!/usr/bin/env node

/**
 * Ramp → PayEntry Buyer Group Discovery
 * 
 * Runs buyer group discovery for Ramp selling expense management/corporate cards
 * to PayEntry (MPAY LLC) - a payroll and HCM solutions provider.
 * 
 * COMPANY CONTEXT:
 * ================
 * Ramp (ramp.com):
 * - Financial technology company ($22.5B valuation, July 2025)
 * - Products: Corporate cards, expense management, accounts payable, 
 *   procurement, travel, accounting automation
 * - 50,000+ customers including CBRE, Shopify, Figma
 * - Value proposition: "Time is money. Save both."
 * 
 * PayEntry (MPAY LLC):
 * - Payroll and HCM solutions provider (founded 1994)
 * - Services: Payroll, HR, Insurance, Retirement Plans, Workforce Management
 * - Recent merger with Corporate Payroll Services (Sept 2025)
 * - Partnership with California Trucking Association
 * 
 * WHY RAMP FOR PAYENTRY:
 * ======================
 * 1. Post-merger financial consolidation need
 * 2. Growing company needs scalable expense management
 * 3. PayEntry preaches automation to clients - should use it internally
 * 4. Potential partnership opportunity (offer Ramp to PayEntry clients)
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

class RampPayEntryRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;
    
    // Configuration for Ramp selling expense management to PayEntry
    this.config = {
      // Product/Deal Configuration
      dealSize: 150000, // $150K mid-market deal
      dealSizeRange: { min: 100000, max: 250000 },
      productCategory: 'finance', // Finance/expense management software
      productName: 'Spend Management Platform',
      productDescription: 'Corporate cards, expense management, accounts payable, procurement, travel, and accounting automation',
      
      // Department Filtering - Who would evaluate/use Ramp's software
      customFiltering: {
        departments: {
          primary: [
            // Finance & Accounting
            'finance',
            'accounting',
            'accounts payable',
            'financial operations',
            'fp&a',
            'controller',
            'treasury',
            
            // Operations
            'operations',
            'business operations',
            'corporate operations',
            
            // Executive
            'executive',
            'c-suite',
            'leadership'
          ],
          secondary: [
            // Technology/IT for integrations
            'information technology',
            'it',
            'technology',
            'enterprise systems',
            'systems',
            
            // Procurement
            'procurement',
            'purchasing',
            'vendor management',
            
            // HR (for expense policies)
            'human resources',
            'hr',
            'people operations'
          ],
          exclude: [
            // Sales - NOT buyers of expense management tools
            'sales',
            'business development',
            'account executive',
            'account manager',
            
            // Client facing - expense USERS not buyers
            'client services',
            'customer success',
            'professional services',
            
            // Clearly irrelevant departments
            'marketing',
            'creative',
            'design',
            'legal',
            'facilities',
            'real estate',
            'manufacturing',
            'warehouse',
            'logistics',
            'engineering', // Software engineers less relevant
            'product development'
          ]
        },
        titles: {
          primary: [
            // C-Level
            'cfo',
            'chief financial officer',
            'ceo',
            'chief executive officer',
            'coo',
            'chief operating officer',
            'president',
            
            // VP Level - Finance
            'vp finance',
            'vp financial',
            'vice president finance',
            'vice president financial',
            'svp finance',
            'senior vice president finance',
            
            // VP Level - Operations
            'vp operations',
            'vice president operations',
            'svp operations',
            
            // Controller
            'controller',
            'corporate controller',
            'assistant controller',
            
            // Director Level - Finance
            'director finance',
            'director accounting',
            'director financial',
            'director fp&a',
            'finance director',
            'accounting director',
            
            // Director Level - Operations
            'director operations',
            'director business operations'
          ],
          secondary: [
            // Manager Level
            'finance manager',
            'accounting manager',
            'ap manager',
            'accounts payable manager',
            'operations manager',
            'business operations manager',
            
            // IT/Technology
            'cto',
            'chief technology officer',
            'cio',
            'chief information officer',
            'vp technology',
            'vp it',
            'director it',
            'director technology',
            'it director',
            
            // Procurement
            'procurement manager',
            'purchasing manager',
            'director procurement',
            
            // HR
            'vp human resources',
            'hr director',
            'director human resources',
            'chro',
            
            // Senior Staff
            'senior accountant',
            'staff accountant',
            'financial analyst'
          ],
          exclude: [
            // Too junior or irrelevant
            'intern',
            'assistant',
            'coordinator',
            'specialist', // Often too junior
            'associate', // Often too junior
            'receptionist',
            'administrator',
            'clerk'
          ]
        }
      },
      
      // Buyer Group Sizing - $150K deal = mid-size group
      buyerGroupSizing: {
        min: 8,
        max: 14,
        ideal: 10
      },
      
      // Role Priorities for mid-market finance software deal
      rolePriorities: {
        decision: 10,      // Critical - CFO, CEO, VP Finance
        champion: 9,       // Very important - Controller, Finance Director
        stakeholder: 7,    // Important - IT, Operations
        blocker: 8,        // Important - IT security, Procurement
        introducer: 4      // Nice to have
      },
      
      // Location Filter
      usaOnly: true, // PayEntry is US-based
      
      // Special Requirements
      specialRequirements: {
        alwaysInclude: [
          'finance',
          'accounting',
          'operations',
          'controller'
        ],
        industrySpecific: 'Payroll & HCM Services',
        companyContext: {
          seller: {
            name: 'Ramp',
            website: 'https://ramp.com',
            product: 'Spend Management Platform',
            valueProposition: 'Time is money. Save both. - Corporate cards, expense management, AP automation, and accounting automation.',
            keyMetrics: {
              customers: '50,000+',
              savings: '$2B+ saved for customers',
              timeSaved: '20M+ hours saved'
            }
          },
          buyer: {
            name: 'PayEntry',
            legalName: 'MPAY LLC DBA Payentry',
            website: 'https://www.payentry.com',
            industry: 'Payroll & Human Capital Management',
            founded: 1994,
            relevantContext: [
              'Recent merger with Corporate Payroll Services (Sept 2025)',
              'Partnership with California Trucking Association',
              'Growing through M&A - needs scalable financial operations'
            ]
          }
        }
      }
    };
  }

  /**
   * Find or create workspace for this buyer group discovery
   */
  async ensureWorkspace() {
    if (this.workspaceId) {
      return this.workspaceId;
    }

    console.log('Finding or creating workspace...');
    
    try {
      let workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'Ramp', mode: 'insensitive' } }
          ]
        }
      });

      if (workspace) {
        console.log(`Found existing workspace: ${workspace.name}`);
        this.workspaceId = workspace.id;
        return workspace.id;
      }

      // Create new workspace if needed
      console.log('Creating new workspace for Ramp...');
      workspace = await this.prisma.workspaces.create({
        data: {
          name: 'Ramp',
          slug: `ramp-${Date.now()}`,
          updatedAt: new Date(),
        }
      });

      console.log(`Created workspace: ${workspace.name} (${workspace.id})`);
      this.workspaceId = workspace.id;
      return workspace.id;
    } catch (error) {
      console.error('Error with workspace:', error.message);
      this.workspaceId = `temp_ramp_${Date.now()}`;
      console.log(`Using temporary workspace ID: ${this.workspaceId}`);
      return this.workspaceId;
    }
  }

  /**
   * Run buyer group discovery for PayEntry
   */
  async run(companyIdentifier = 'payentry.com', options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('RAMP -> PAYENTRY BUYER GROUP DISCOVERY');
    console.log('='.repeat(80));
    console.log('\nCONTEXT:');
    console.log('   Seller: Ramp (Spend Management Platform)');
    console.log('   Buyer:  PayEntry / MPAY LLC (Payroll & HCM)');
    console.log(`\nDeal Size: $${this.config.dealSize.toLocaleString()} (range: $${this.config.dealSizeRange.min.toLocaleString()}-$${this.config.dealSizeRange.max.toLocaleString()})`);
    console.log(`Product: ${this.config.productName}`);
    console.log(`Category: ${this.config.productCategory}`);
    console.log(`Target Buyer Group Size: ${this.config.buyerGroupSizing.min}-${this.config.buyerGroupSizing.max} (ideal: ${this.config.buyerGroupSizing.ideal})`);
    console.log(`USA Only: ${this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('\n' + '='.repeat(80) + '\n');

    await this.ensureWorkspace();

    try {
      // Initialize pipeline with Ramp configuration
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
        skipDatabase: options.skipDatabase || true // Skip database by default for safety
      });

      // Prepare company object for pipeline
      const company = {
        name: 'PayEntry',
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
      const outputFile = path.join(outputDir, `ramp-payentry-buyer-group-${timestamp}.json`);
      
      const outputData = this.formatOutputData(result, company);
      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`\nResults saved to: ${outputFile}`);

      // Generate HTML report
      const htmlFile = path.join(outputDir, `ramp-payentry-buyer-group-${timestamp}.html`);
      const htmlReport = this.generateHTMLReport(result, company);
      fs.writeFileSync(htmlFile, htmlReport);
      console.log(`HTML report saved to: ${htmlFile}`);

      // Copy to Desktop
      const desktopPath = '/Users/rosssylvester/Desktop/Ramp-PayEntry-BGI-Report.html';
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
   * Format output data for JSON export
   */
  formatOutputData(result, company) {
    return {
      context: {
        seller: this.config.specialRequirements.companyContext.seller,
        buyer: this.config.specialRequirements.companyContext.buyer,
        dealSize: this.config.dealSize,
        generatedAt: new Date().toISOString()
      },
      buyerGroup: {
        totalMembers: result.buyerGroup?.length || 0,
        members: (result.buyerGroup || []).map(member => ({
          name: member.name,
          title: member.title,
          department: member.department,
          role: member.buyerGroupRole || member.role,
          roleConfidence: member.roleConfidence || 0,
          roleReasoning: member.roleReasoning || null,
          email: member.email,
          phone: member.phone,
          linkedin: member.linkedinUrl,
          verified: member.verified || false
        }))
      },
      company: {
        name: result.intelligence?.companyName || company.name,
        website: result.intelligence?.website || company.website,
        employeeCount: result.intelligence?.employeeCount || null,
        industry: result.intelligence?.industry || 'Payroll & HCM'
      },
      costs: result.costs || null,
      metadata: {
        pipelineVersion: '1.0',
        workspaceId: this.workspaceId
      }
    };
  }

  /**
   * Generate HTML report with real data
   */
  generateHTMLReport(result, company) {
    const buyerGroup = result.buyerGroup || [];
    const intelligence = result.intelligence || {};
    
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

    // Group by role
    const byRole = { decision: [], champion: [], blocker: [], stakeholder: [], introducer: [] };
    buyerGroup.forEach(m => {
      const role = m.buyerGroupRole || m.role || 'stakeholder';
      if (byRole[role]) byRole[role].push(m);
    });

    const decisionCount = byRole.decision.length;
    const championCount = byRole.champion.length;
    const blockerCount = byRole.blocker.length;
    const stakeholderCount = byRole.stakeholder.length + byRole.introducer.length;

    // Generate profile cards
    let profilesHtml = '';
    ['decision', 'champion', 'blocker', 'stakeholder', 'introducer'].forEach(role => {
      (byRole[role] || []).forEach(m => {
        profilesHtml += `
        <div class="profile-card">
          <div class="profile-info">
            <div class="profile-name">${m.name}</div>
            <div class="profile-title">${m.title || 'N/A'}</div>
          </div>
          <div class="profile-meta">
            <span class="role-badge" style="background: ${roleColors[role]};">${roleLabels[role]}</span>
            ${m.linkedinUrl ? `<a href="${m.linkedinUrl}" class="linkedin-link" target="_blank">LinkedIn</a>` : ''}
          </div>
          <div class="influence">Confidence: ${m.roleConfidence || 0}%</div>
          ${m.roleReasoning ? `<div class="reasoning">${m.roleReasoning}</div>` : ''}
        </div>`;
      });
    });

    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence | Ramp -> PayEntry</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #f59e0b;
      --primary-dark: #d97706;
      --navy: #1e3a5f;
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
    .hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-top: 24px; }
    .hero-stat { background: var(--bg); padding: 24px 16px; text-align: center; }
    .hero-stat-value { font-size: 32px; font-weight: 800; color: var(--primary); }
    .hero-stat-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); margin-top: 4px; }
    .section { padding: 48px 0; border-top: 1px solid var(--border); }
    .section-title { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
    .section-subtitle { font-size: 16px; color: var(--text-secondary); margin-bottom: 32px; }
    .profiles-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .profile-card { background: var(--bg); border: 1px solid var(--border); padding: 16px; border-radius: 8px; }
    .profile-info { margin-bottom: 12px; }
    .profile-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
    .profile-title { font-size: 12px; color: var(--text-secondary); }
    .profile-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .role-badge { display: inline-block; padding: 3px 8px; font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: white; border-radius: 4px; }
    .linkedin-link { font-size: 11px; color: var(--primary); text-decoration: none; font-weight: 500; }
    .influence { font-size: 11px; color: var(--text-secondary); margin-top: 8px; }
    .reasoning { font-size: 11px; color: var(--text-secondary); margin-top: 8px; font-style: italic; }
    .footer { text-align: center; padding-top: 48px; margin-top: 48px; border-top: 1px solid var(--border); }
    .footer-logo { font-size: 18px; font-weight: 800; color: var(--navy); }
    .page-break { page-break-before: always; }
    @media print { * { print-color-adjust: exact !important; } .page { padding: 32px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <div class="cover-header">
        <div class="label">Buyer Group Intelligence</div>
        <h1 class="cover-title">Your path into PayEntry</h1>
        <p class="cover-subtitle">${buyerGroup.length} verified stakeholders identified and mapped for coordinated outreach.</p>
      </div>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-label">Seller</div><div class="stat-value">Ramp</div></div>
        <div class="stat-box"><div class="stat-label">Target</div><div class="stat-value">PayEntry</div></div>
        <div class="stat-box"><div class="stat-label">Deal Size</div><div class="stat-value">$${this.config.dealSize.toLocaleString()}</div></div>
        <div class="stat-box"><div class="stat-label">Product</div><div class="stat-value">Spend Mgmt</div></div>
        <div class="stat-box"><div class="stat-label">Generated</div><div class="stat-value">${dateStr}</div></div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><div class="hero-stat-value">${buyerGroup.length}</div><div class="hero-stat-label">Buyer Group</div></div>
        <div class="hero-stat"><div class="hero-stat-value">${decisionCount}</div><div class="hero-stat-label">Decision Makers</div></div>
        <div class="hero-stat"><div class="hero-stat-value">${championCount}</div><div class="hero-stat-label">Champions</div></div>
        <div class="hero-stat"><div class="hero-stat-value">${blockerCount}</div><div class="hero-stat-label">Blockers</div></div>
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Buyer Group Profiles</h2>
      <p class="section-subtitle">Verified stakeholders at PayEntry discovered via Coresignal</p>
      <div class="profiles-grid">
        ${profilesHtml || '<p>No stakeholders found. Try adjusting search parameters.</p>'}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">RAMP</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Time is money. Save both.</div>
    </div>
  </div>
</body>
</html>`;
  }
}

// CLI Interface
async function main() {
  console.log('\nRamp -> PayEntry Buyer Group Discovery\n');

  const args = process.argv.slice(2);
  const companyIdentifier = args[0] || 'payentry.com';
  const options = {
    skipDatabase: true // Always skip database for this run
  };

  const runner = new RampPayEntryRunner({
    workspaceId: process.env.RAMP_WORKSPACE_ID || null,
    mainSellerId: process.env.RAMP_SELLER_ID || null
  });

  try {
    const result = await runner.run(companyIdentifier, options);
    
    if (result) {
      console.log('\n' + '='.repeat(80));
      console.log('DISCOVERY COMPLETED SUCCESSFULLY');
      console.log('='.repeat(80));
      console.log(`\nBuyer Group: ${result.buyerGroup?.length || 0} members`);
      console.log(`Cost: $${(result.costs?.total || 0).toFixed(2)}`);
      console.log('\nOutput files saved to: scripts/_future_now/find-buyer-group/output/');
      
      await disconnectPrismaClient();
      process.exit(0);
    } else {
      console.log('\nDiscovery completed but no results generated.');
      await disconnectPrismaClient();
      process.exit(1);
    }
  } catch (error) {
    console.error('\nDiscovery failed:', error.message);
    await disconnectPrismaClient();
    process.exit(1);
  }
}

module.exports = { RampPayEntryRunner };

if (require.main === module) {
  main().catch(console.error);
}

