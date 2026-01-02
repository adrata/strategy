#!/usr/bin/env node

/**
 * Valence Security → Freshworks Buyer Group Discovery
 * 
 * Runs buyer group discovery for Valence Security selling SaaS security
 * to Freshworks - a major SaaS company with multiple products.
 * 
 * COMPANY CONTEXT:
 * ================
 * Valence Security (valencesecurity.com):
 * - SaaS Security Posture Management (SSPM) platform
 * - Secures SaaS-to-SaaS integrations and workflows
 * - Discovers shadow integrations and OAuth tokens
 * - Remediates risky third-party app permissions
 * - Backed by YL Ventures, Porsche Ventures
 * 
 * Freshworks (freshworks.com):
 * - Major SaaS company (~5,000+ employees)
 * - Products: Freshdesk, Freshsales, Freshservice, Freshchat, etc.
 * - Public company (NASDAQ: FRSH)
 * - Heavy SaaS user - likely has many third-party integrations
 * - Based in San Mateo, CA with global operations
 * 
 * WHY VALENCE FOR FRESHWORKS:
 * ===========================
 * 1. As a SaaS company, Freshworks uses dozens of SaaS tools internally
 * 2. Customer data security is paramount for a public SaaS company
 * 3. Need to secure third-party app integrations and OAuth permissions
 * 4. Regulatory compliance (SOC 2, GDPR) requires SaaS security
 * 5. Shadow IT/integrations pose significant risk at scale
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

class ValenceFreshworksRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;
    
    // Configuration for Valence Security selling SSPM to Freshworks
    this.config = {
      // Product/Deal Configuration
      dealSize: 250000, // $250K enterprise security deal
      dealSizeRange: { min: 150000, max: 400000 },
      productCategory: 'security', // Security software
      productName: 'SaaS Security Posture Management (SSPM)',
      productDescription: 'Discover, monitor, and remediate risky SaaS-to-SaaS integrations, OAuth tokens, and third-party app permissions',
      
      // Department Filtering - Who would evaluate/use Valence's SSPM
      customFiltering: {
        departments: {
          primary: [
            // Security
            'security',
            'information security',
            'cybersecurity',
            'application security',
            'product security',
            'cloud security',
            
            // IT
            'information technology',
            'it',
            'it operations',
            'infrastructure',
            
            // Engineering/Platform
            'engineering',
            'platform',
            'devops',
            'sre',
            'site reliability',
            
            // Compliance/Risk
            'compliance',
            'risk',
            'governance',
            'grc'
          ],
          secondary: [
            // Executive
            'executive',
            'c-suite',
            'leadership',
            
            // Technology leadership
            'technology',
            'tech ops',
            
            // Legal (for compliance)
            'legal',
            
            // Finance (procurement)
            'finance',
            'procurement'
          ],
          exclude: [
            // Clearly irrelevant departments
            'marketing',
            'sales',
            'customer success',
            'support',
            'hr',
            'human resources',
            'facilities',
            'recruiting',
            'talent'
          ]
        },
        titles: {
          primary: [
            // C-Level Security
            'ciso',
            'chief information security officer',
            'cto',
            'chief technology officer',
            'cio',
            'chief information officer',
            
            // VP Level - Security
            'vp security',
            'vp information security',
            'vp cybersecurity',
            'vice president security',
            'vice president information security',
            'svp security',
            
            // VP Level - IT/Engineering
            'vp engineering',
            'vp it',
            'vp infrastructure',
            'vp platform',
            'vice president engineering',
            'vice president it',
            
            // Director Level - Security
            'director security',
            'director information security',
            'director cybersecurity',
            'director application security',
            'director product security',
            'security director',
            
            // Director Level - IT/Engineering
            'director engineering',
            'director it',
            'director infrastructure',
            'director platform',
            'director devops',
            
            // Head of
            'head of security',
            'head of information security',
            'head of it',
            'head of engineering',
            'head of platform'
          ],
          secondary: [
            // Manager Level - Security
            'security manager',
            'information security manager',
            'security operations manager',
            'application security manager',
            
            // Manager Level - IT
            'it manager',
            'infrastructure manager',
            'platform manager',
            
            // Senior/Staff Level
            'senior security engineer',
            'staff security engineer',
            'principal security engineer',
            'security architect',
            'cloud security engineer',
            
            // Compliance
            'compliance manager',
            'compliance director',
            'grc manager',
            'risk manager'
          ],
          exclude: [
            // Too junior
            'intern',
            'junior',
            'associate',
            'coordinator',
            'analyst', // Often too junior for security purchases
            'specialist'
          ]
        }
      },
      
      // Buyer Group Sizing - $250K enterprise security deal = larger group
      buyerGroupSizing: {
        min: 10,
        max: 16,
        ideal: 12
      },
      
      // Role Priorities for enterprise security software deal
      rolePriorities: {
        decision: 10,      // Critical - CISO, VP Security, CTO
        champion: 9,       // Very important - Security Directors/Managers
        blocker: 8,        // Important - Procurement, Legal, IT Architecture
        stakeholder: 7,    // Important - Engineering, Platform teams
        introducer: 4      // Nice to have
      },
      
      // Location Filter
      usaOnly: false, // Freshworks is global company
      
      // Special Requirements
      specialRequirements: {
        alwaysInclude: [
          'security',
          'information security',
          'it',
          'engineering'
        ],
        industrySpecific: 'SaaS / Software',
        companyContext: {
          seller: {
            name: 'Valence Security',
            website: 'https://www.valencesecurity.com',
            product: 'SaaS Security Posture Management (SSPM)',
            valueProposition: 'Discover and secure risky SaaS-to-SaaS integrations, OAuth tokens, and third-party app permissions before they become breaches.',
            keyCapabilities: [
              'Shadow SaaS discovery',
              'OAuth token monitoring',
              'Third-party app risk assessment',
              'Automated remediation workflows',
              'Compliance reporting (SOC 2, GDPR)'
            ]
          },
          buyer: {
            name: 'Freshworks',
            website: 'https://www.freshworks.com',
            industry: 'SaaS / Enterprise Software',
            ticker: 'NASDAQ: FRSH',
            products: ['Freshdesk', 'Freshsales', 'Freshservice', 'Freshchat', 'Freshmarketer'],
            relevantContext: [
              'Public SaaS company with ~5,000+ employees',
              'Heavy internal SaaS usage across departments',
              'Customer data security is critical for reputation',
              'SOC 2 and GDPR compliance requirements',
              'Global operations with distributed teams'
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
            { name: { contains: 'Valence', mode: 'insensitive' } }
          ]
        }
      });

      if (workspace) {
        console.log(`Found existing workspace: ${workspace.name}`);
        this.workspaceId = workspace.id;
        return workspace.id;
      }

      // Create new workspace if needed
      console.log('Creating new workspace for Valence Security...');
      workspace = await this.prisma.workspaces.create({
        data: {
          name: 'Valence Security',
          slug: `valence-security-${Date.now()}`,
          updatedAt: new Date(),
        }
      });

      console.log(`Created workspace: ${workspace.name} (${workspace.id})`);
      this.workspaceId = workspace.id;
      return workspace.id;
    } catch (error) {
      console.error('Error with workspace:', error.message);
      this.workspaceId = `temp_valence_${Date.now()}`;
      console.log(`Using temporary workspace ID: ${this.workspaceId}`);
      return this.workspaceId;
    }
  }

  /**
   * Run buyer group discovery for Freshworks
   */
  async run(companyIdentifier = 'freshworks.com', options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('VALENCE SECURITY -> FRESHWORKS BUYER GROUP DISCOVERY');
    console.log('='.repeat(80));
    console.log('\nCONTEXT:');
    console.log('   Seller: Valence Security (SaaS Security Posture Management)');
    console.log('   Buyer:  Freshworks (NASDAQ: FRSH - Enterprise SaaS)');
    console.log(`\nDeal Size: $${this.config.dealSize.toLocaleString()} (range: $${this.config.dealSizeRange.min.toLocaleString()}-$${this.config.dealSizeRange.max.toLocaleString()})`);
    console.log(`Product: ${this.config.productName}`);
    console.log(`Category: ${this.config.productCategory}`);
    console.log(`Target Buyer Group Size: ${this.config.buyerGroupSizing.min}-${this.config.buyerGroupSizing.max} (ideal: ${this.config.buyerGroupSizing.ideal})`);
    console.log(`USA Only: ${this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('\n' + '='.repeat(80) + '\n');

    await this.ensureWorkspace();

    try {
      // Initialize pipeline with Valence configuration
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
        name: 'Freshworks',
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
      const outputFile = path.join(outputDir, `valence-freshworks-buyer-group-${timestamp}.json`);
      
      const outputData = this.formatOutputData(result, company);
      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`\nResults saved to: ${outputFile}`);

      // Generate HTML report
      const htmlFile = path.join(outputDir, `valence-freshworks-buyer-group-${timestamp}.html`);
      const htmlReport = this.generateHTMLReport(result, company);
      fs.writeFileSync(htmlFile, htmlReport);
      console.log(`HTML report saved to: ${htmlFile}`);

      // Copy to Desktop
      const desktopPath = '/Users/rosssylvester/Desktop/Valence-Freshworks-BGI-Report.html';
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
        industry: result.intelligence?.industry || 'SaaS / Software'
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
            ${m.phone ? `<span class="phone">📞 ${m.phone}</span>` : ''}
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
  <title>Buyer Group Intelligence | Valence Security -> Freshworks</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --accent: #22d3ee;
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
    .phone { font-size: 11px; color: var(--text-secondary); }
    .linkedin-link { font-size: 11px; color: var(--primary); text-decoration: none; font-weight: 500; }
    .influence { font-size: 11px; color: var(--text-secondary); margin-top: 8px; }
    .reasoning { font-size: 11px; color: var(--text-secondary); margin-top: 8px; font-style: italic; }
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
        <h1 class="cover-title">Your path into Freshworks</h1>
        <p class="cover-subtitle">${buyerGroup.length} verified security & IT stakeholders identified for SaaS Security Posture Management.</p>
      </div>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-label">Seller</div><div class="stat-value">Valence Security</div></div>
        <div class="stat-box"><div class="stat-label">Target</div><div class="stat-value">Freshworks</div></div>
        <div class="stat-box"><div class="stat-label">Deal Size</div><div class="stat-value">$${this.config.dealSize.toLocaleString()}</div></div>
        <div class="stat-box"><div class="stat-label">Product</div><div class="stat-value">SSPM</div></div>
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
      <p class="section-subtitle">Security, IT, and Engineering stakeholders at Freshworks</p>
      <div class="profiles-grid">
        ${profilesHtml || '<p>No stakeholders found. Try adjusting search parameters.</p>'}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">VALENCE SECURITY</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Secure Your SaaS Ecosystem</div>
    </div>
  </div>
</body>
</html>`;
  }
}

// CLI Interface
async function main() {
  console.log('\nValence Security -> Freshworks Buyer Group Discovery\n');

  const args = process.argv.slice(2);
  const companyIdentifier = args[0] || 'freshworks.com';
  const options = {
    skipDatabase: true
  };

  const runner = new ValenceFreshworksRunner({
    workspaceId: process.env.VALENCE_WORKSPACE_ID || null,
    mainSellerId: process.env.VALENCE_SELLER_ID || null
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

module.exports = { ValenceFreshworksRunner };

if (require.main === module) {
  main().catch(console.error);
}

