#!/usr/bin/env node

/**
 * TrustKeep.ai → Renesas Buyer Group Discovery (CLEAN VERSION)
 *
 * Properly designed buyer group discovery for TrustKeep.ai selling their
 * AI intelligence platform to Renesas Electronics.
 *
 * MODELED AFTER: HR Acuity → Google (successful pattern)
 *
 * COMPANY CONTEXT:
 * ================
 * TrustKeep.ai (trustkeep.ai):
 * - AI intelligence platform for B2B companies
 * - Unifies scattered customer signals from forums, CRM, and support data
 * - Provides real-time intelligence for product and support teams
 * - Target users: Product Management, Customer Support, Quality teams
 * - Pricing: ~$40K/year (mid-market SaaS)
 *
 * Renesas Electronics Corporation (renesas.com):
 * - Major global semiconductor manufacturer (~11,500 employees)
 * - Products: MCUs, analog components, power management, SoCs
 * - Focus areas: IoT, Industrial automation, robotics, HMI, Automotive
 * - Target division: MCU Product Line
 *
 * WHO BUYS TRUSTKEEP:
 * ===================
 * - Product Line Managers / Product Managers
 * - Application Engineering Managers / FAE Managers
 * - Customer Support / Technical Support Managers
 * - Quality Assurance Managers
 * - Customer Success / Customer Experience leaders
 *
 * INTERVIEW QUESTIONS ANSWERED:
 * =============================
 * 1. What does your company sell?
 *    AI-powered platform that aggregates customer signals from forums, CRM,
 *    support tickets, and community discussions into actionable intelligence
 *
 * 2. What industries do you typically sell to?
 *    Technology, Semiconductor, Electronics, B2B Hardware
 *
 * 3. What is your typical deal size?
 *    $30K-$50K/year (mid-market SaaS) - using $40K midpoint
 *
 * 4. Who typically makes the buying decision?
 *    Director/Senior Manager level in Product or Customer Support
 *
 * 5. Which departments are most involved in evaluating your solution?
 *    Product Management, Customer Support, Quality Assurance,
 *    Application Engineering, Customer Success
 *
 * 6. How complex is your typical sales cycle?
 *    Medium (3-4 months) - departmental budget decision
 *
 * 7. Critical roles always involved?
 *    Product Manager, Support Manager, possibly IT for integration
 *
 * 8. USA-only?
 *    No - Renesas is global (Japan HQ, worldwide operations)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Clean API keys
const cleanEnvKeys = () => {
  const keysToClean = [
    'CORESIGNAL_API_KEY', 'ZEROBOUNCE_API_KEY', 'MYEMAILVERIFIER_API_KEY',
    'PROSPEO_API_KEY', 'PERPLEXITY_API_KEY', 'PEOPLE_DATA_LABS_API_KEY',
    'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'
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

class TrustKeepRenesasCleanRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;

    // Configuration for TrustKeep.ai selling to Renesas
    this.config = {
      // Product/Deal Configuration - Mid-market SaaS deal
      dealSize: 40000, // $40K/year
      dealSizeRange: { min: 30000, max: 50000 },
      productCategory: 'custom',
      productName: 'AI Customer Intelligence Platform',
      productDescription: 'Aggregates customer signals from forums, CRM, support tickets, and community discussions into actionable intelligence for product and support teams',

      // Department Filtering - Who at Renesas would evaluate/use TrustKeep
      // SEMICONDUCTOR-SPECIFIC TERMINOLOGY
      customFiltering: {
        departments: {
          primary: [
            // Product Management - PRIMARY USERS
            'product management',
            'product line management',
            'product marketing',
            'product planning',
            'product strategy',

            // Application Engineering - Key semiconductor role
            'application engineering',
            'field application',
            'fae',
            'applications',
            'technical applications',

            // Customer Support - Data source & beneficiary
            'customer support',
            'technical support',
            'customer service',
            'support engineering',

            // Quality - Uses customer feedback
            'quality',
            'quality assurance',
            'quality engineering',
            'reliability',

            // Customer Success/Experience
            'customer success',
            'customer experience',
            'customer engagement'
          ],
          secondary: [
            // Data & Analytics
            'data analytics',
            'business intelligence',
            'analytics',
            'insights',

            // IT for integration
            'information technology',
            'it',
            'systems',

            // Marketing (product marketing)
            'marketing',
            'market intelligence'
          ],
          exclude: [
            // EXPLICITLY EXCLUDE SALES
            'sales',
            'account management',
            'business development',
            'account executive',
            'sales operations',
            'revenue',

            // Non-relevant
            'hr',
            'human resources',
            'facilities',
            'real estate',
            'finance',
            'accounting',
            'legal',

            // Semiconductor-specific non-relevant
            'mask design',
            'physical design',
            'layout',
            'foundry',
            'fabrication',
            'manufacturing',
            'test engineering',
            'validation',
            'verification'
          ]
        },
        titles: {
          primary: [
            // Director Level - Decision makers for $40K
            'director product',
            'director product management',
            'director product line',
            'director application engineering',
            'director applications',
            'director customer support',
            'director technical support',
            'director quality',
            'director customer success',

            // Senior Manager - Also can approve $40K
            'senior manager product',
            'senior manager application',
            'senior manager support',
            'senior manager quality',
            'senior manager customer',

            // Head of functions
            'head of product',
            'head of applications',
            'head of support',
            'head of quality',
            'head of customer'
          ],
          secondary: [
            // Manager Level - Champions and users
            'manager product',
            'manager application engineering',
            'manager customer support',
            'manager technical support',
            'manager quality',
            'manager customer success',
            'product manager',
            'product line manager',
            'application engineering manager',
            'fae manager',
            'support manager',
            'quality manager',

            // Senior individual contributors
            'senior product manager',
            'principal product manager',
            'senior application engineer',
            'principal application engineer',
            'lead application engineer'
          ]
        }
      },

      // Buyer Group Sizing - $40K deal = small focused group
      buyerGroupSizing: {
        min: 3,
        max: 5,
        ideal: 4
      },

      // Role Priorities for mid-market deal
      rolePriorities: {
        champion: 10,      // Critical - Product/Support manager who feels the pain
        decision: 9,       // Important - Director who can approve $40K
        stakeholder: 7,    // Supporting - Will use the platform
        blocker: 5,        // IT/Procurement if involved
        introducer: 3      // Nice to have
      },

      // Location Filter
      usaOnly: false, // Renesas is global

      // Special Requirements
      specialRequirements: {
        alwaysInclude: [
          'product management',
          'application engineering',
          'customer support'
        ],
        industrySpecific: 'Semiconductor - Customer Intelligence Platform',
        companyContext: {
          seller: {
            name: 'TrustKeep.ai',
            website: 'https://trustkeep.ai',
            product: 'AI Customer Intelligence Platform',
            valueProposition: 'Unifies customer signals from forums, CRM, and support data into actionable intelligence',
            pricing: '$40K/year'
          },
          buyer: {
            name: 'Renesas Electronics Corporation',
            website: 'https://www.renesas.com',
            industry: 'Semiconductor Manufacturing',
            size: '11,500+ employees',
            relevantDivisions: ['Product Management', 'Application Engineering', 'Customer Support', 'Quality']
          }
        }
      }
    };
  }

  async ensureWorkspace() {
    if (this.workspaceId) return this.workspaceId;

    console.log('🔍 Finding or creating workspace...');

    try {
      let workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'TrustKeep', mode: 'insensitive' } },
            { name: { contains: 'Trust Keep', mode: 'insensitive' } }
          ]
        }
      });

      if (workspace) {
        console.log(`✅ Found existing workspace: ${workspace.name}`);
        this.workspaceId = workspace.id;
        return workspace.id;
      }

      console.log('📝 Creating new workspace for TrustKeep.ai...');
      workspace = await this.prisma.workspaces.create({
        data: {
          name: 'TrustKeep.ai',
          slug: `trustkeep-${Date.now()}`,
          updatedAt: new Date(),
        }
      });

      console.log(`✅ Created workspace: ${workspace.name} (${workspace.id})`);
      this.workspaceId = workspace.id;
      return workspace.id;
    } catch (error) {
      console.error('❌ Error with workspace:', error.message);
      this.workspaceId = `temp_trustkeep_${Date.now()}`;
      console.log(`⚠️ Using temporary workspace ID: ${this.workspaceId}`);
      return this.workspaceId;
    }
  }

  async run(companyIdentifier = 'https://www.linkedin.com/company/renesas', options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 TRUSTKEEP.AI → RENESAS BUYER GROUP DISCOVERY');
    console.log('='.repeat(80));
    console.log('\n📋 CONTEXT:');
    console.log('   Seller: TrustKeep.ai (AI Customer Intelligence Platform)');
    console.log('   Buyer:  Renesas Electronics (Semiconductor - 11,500 employees)');
    console.log(`\n💰 Deal Size: $${this.config.dealSize.toLocaleString()}/year`);
    console.log(`🏷️  Product: ${this.config.productName}`);
    console.log(`👥 Target Buyer Group Size: ${this.config.buyerGroupSizing.min}-${this.config.buyerGroupSizing.max}`);
    console.log(`🌍 Global: Yes`);
    console.log('\n' + '='.repeat(80) + '\n');

    await this.ensureWorkspace();

    try {
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
        skipDatabase: options.skipDatabase || false
      });

      // Use Renesas's LinkedIn URL for precise matching
      let company = {
        name: 'Renesas Electronics',
        linkedinUrl: 'https://www.linkedin.com/company/renesas',
        website: 'https://www.renesas.com',
        mainSellerId: this.mainSellerId,
        originalIdentifier: 'https://www.linkedin.com/company/renesas'
      };

      console.log('\n🔍 Starting buyer group discovery pipeline...\n');
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      console.log('\n✅ Buyer Group Discovery Complete!');
      console.log(`👥 Found ${result.buyerGroup.length} buyer group members`);

      // Validate results
      console.log('\n📊 VALIDATION:');
      const validation = this.validateResults(result);
      validation.forEach(check => {
        console.log(`   ${check.passed ? '✅' : '❌'} ${check.message}`);
      });

      // Save results
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const outputFile = path.join(outputDir, `trustkeep-renesas-buyer-group-${timestamp}.json`);

      const outputData = this.formatOutputData(result, company);
      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`\n💾 JSON saved to: ${outputFile}`);

      // Generate HTML report (like HR Acuity)
      const reportFile = path.join(outputDir, `trustkeep-renesas-report.html`);
      const report = this.generateHTMLReport(result, company);
      fs.writeFileSync(reportFile, report);
      console.log(`📄 HTML report saved to: ${reportFile}`);

      // Also save to Desktop
      const desktopPath = path.join(process.env.HOME, 'Desktop', `TrustKeep-Renesas-BuyerGroup-${timestamp}.html`);
      fs.writeFileSync(desktopPath, report);
      console.log(`🖥️  Desktop report saved to: ${desktopPath}`);

      return result;

    } catch (error) {
      console.error('❌ Buyer group discovery failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  validateResults(result) {
    const checks = [];
    const buyerGroup = result.buyerGroup || [];

    // Check 1: 3-5 members
    const memberCount = buyerGroup.length;
    checks.push({
      passed: memberCount >= 3 && memberCount <= 6,
      message: `Buyer group has ${memberCount} members (target: 3-5)`
    });

    // Check 2: 60%+ from relevant departments
    const relevantDepts = ['product', 'application', 'support', 'quality', 'customer'];
    const relevantCount = buyerGroup.filter(m => {
      const dept = (m.department || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      return relevantDepts.some(d => dept.includes(d) || title.includes(d));
    }).length;
    const relevantPercent = memberCount > 0 ? Math.round((relevantCount / memberCount) * 100) : 0;
    checks.push({
      passed: relevantPercent >= 60,
      message: `${relevantPercent}% from relevant departments (target: 60%+)`
    });

    // Check 3: No sales people
    const salesPeople = buyerGroup.filter(m => {
      const dept = (m.department || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      return dept.includes('sales') || title.includes('sales') ||
             title.includes('account manager') || title.includes('business development');
    });
    checks.push({
      passed: salesPeople.length === 0,
      message: `No Sales people (found ${salesPeople.length})`
    });

    // Check 4: Has champion
    const hasChampion = buyerGroup.some(m => m.buyerGroupRole === 'champion');
    checks.push({
      passed: hasChampion,
      message: hasChampion ? 'Has champion identified' : 'Missing champion'
    });

    // Check 5: Has decision maker or director-level
    const hasDecision = buyerGroup.some(m =>
      m.buyerGroupRole === 'decision' ||
      (m.title || '').toLowerCase().includes('director')
    );
    checks.push({
      passed: hasDecision,
      message: hasDecision ? 'Has decision maker identified' : 'Missing decision maker'
    });

    return checks;
  }

  formatOutputData(result, company) {
    return {
      context: {
        seller: this.config.specialRequirements.companyContext.seller,
        buyer: this.config.specialRequirements.companyContext.buyer,
        discoveredAt: new Date().toISOString()
      },
      company: {
        name: result.intelligence?.companyName || company.name,
        website: result.intelligence?.website || company.website,
        linkedinUrl: result.intelligence?.linkedinUrl || company.linkedinUrl,
        industry: result.intelligence?.industry || 'Semiconductor Manufacturing',
        employeeCount: result.intelligence?.employeeCount || 11500
      },
      product: {
        name: this.config.productName,
        description: this.config.productDescription,
        category: this.config.productCategory,
        dealSize: this.config.dealSize
      },
      buyerGroup: {
        totalMembers: result.buyerGroup.length,
        members: result.buyerGroup.map(member => ({
          name: member.name,
          title: member.title,
          department: member.department,
          role: member.buyerGroupRole || member.role,
          roleConfidence: member.roleConfidence || 0,
          roleReasoning: member.roleReasoning || null,
          email: member.email,
          phone: member.phone,
          linkedin: member.linkedinUrl,
          painPoints: member.painPoints || member.aiIntelligence?.painPoints || []
        })),
        cohesionScore: result.cohesion?.score || null
      },
      validation: this.validateResults(result),
      costs: result.costs || null,
      metadata: {
        generatedAt: new Date().toISOString(),
        workspaceId: this.workspaceId
      }
    };
  }

  generateHTMLReport(result, company) {
    const buyerGroup = result.buyerGroup || [];
    const intelligence = result.intelligence || {};

    // Count roles
    const roleCounts = { decision: 0, champion: 0, stakeholder: 0, blocker: 0, introducer: 0 };
    buyerGroup.forEach(m => {
      const role = m.buyerGroupRole || 'stakeholder';
      if (roleCounts[role] !== undefined) roleCounts[role]++;
    });

    const roleColors = {
      decision: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      champion: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      stakeholder: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      blocker: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      introducer: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
    };

    // Generate member cards
    let memberCardsHTML = '';
    const roleOrder = ['decision', 'champion', 'stakeholder', 'blocker', 'introducer'];

    roleOrder.forEach(role => {
      const members = buyerGroup.filter(m => (m.buyerGroupRole || 'stakeholder') === role);
      if (members.length > 0) {
        members.forEach(member => {
          const initials = (member.name || 'UN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const colors = roleColors[role] || roleColors.stakeholder;
          const painPoints = member.painPoints || member.aiIntelligence?.painPoints || [];

          memberCardsHTML += `
          <div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6 card-shadow">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center text-white text-xl font-bold">
                ${initials}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                  <h3 class="text-xl font-bold">${member.name || 'Unknown'}</h3>
                  <span class="px-2 py-1 ${colors.bg} ${colors.text} text-xs font-medium rounded-full capitalize">${role.replace('_', ' ')}</span>
                </div>
                <div class="text-slate-600">${member.title || 'Title Unknown'}</div>
                <div class="text-sm text-slate-400">${member.department || 'Department Unknown'}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-xs text-slate-500 mb-1">LinkedIn</div>
                ${member.linkedinUrl ? `<a href="${member.linkedinUrl}" target="_blank" class="text-sm text-[#6366f1] hover:underline">View Profile →</a>` : '<span class="text-sm text-slate-400">Not available</span>'}
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-xs text-slate-500 mb-1">Confidence</div>
                <div class="text-sm font-medium">${member.roleConfidence || 0}%</div>
              </div>
            </div>

            ${painPoints.length > 0 ? `
            <div class="border-t pt-4">
              <h4 class="font-semibold text-sm mb-2">Key Pain Points</h4>
              <div class="space-y-2 text-sm text-slate-600">
                ${painPoints.slice(0, 3).map(p => {
                  const title = typeof p === 'object' ? p.title : p;
                  return `<p>• ${title}</p>`;
                }).join('')}
              </div>
            </div>
            ` : ''}
          </div>`;
        });
      }
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrustKeep.ai → Renesas | Buyer Group Intelligence Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Inter', sans-serif; }
    @media print {
      .page-break { page-break-before: always; }
      .no-print { display: none; }
    }
    .gradient-text {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .card-shadow {
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }
    .stat-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
    }
    .trustkeep-gradient {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    }
  </style>
</head>
<body class="bg-white text-slate-900">

  <!-- Cover Page -->
  <div class="min-h-screen flex flex-col justify-center items-center px-8 py-16 bg-gradient-to-br from-slate-50 to-slate-100">
    <div class="max-w-4xl w-full text-center">
      <div class="mb-8">
        <div class="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full card-shadow">
          <div class="w-3 h-3 rounded-full bg-[#6366f1]"></div>
          <span class="text-sm font-semibold text-slate-600 tracking-wide uppercase">Buyer Group Intelligence</span>
        </div>
      </div>

      <h1 class="text-5xl font-bold mb-4">
        <span class="gradient-text">TrustKeep.ai</span>
      </h1>
      <div class="flex items-center justify-center gap-4 mb-8">
        <span class="text-2xl text-slate-400">→</span>
        <h2 class="text-4xl font-bold text-slate-800">Renesas Electronics</h2>
      </div>

      <p class="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
        Strategic Buyer Group Analysis for AI Customer Intelligence Platform
      </p>

      <!-- Key Stats Preview -->
      <div class="grid grid-cols-4 gap-4 mb-12">
        <div class="stat-card rounded-xl p-6">
          <div class="text-3xl font-bold text-[#6366f1]">${intelligence.employeeCount ? Math.round(intelligence.employeeCount / 1000) + 'K' : '11.5K'}</div>
          <div class="text-sm text-slate-500 mt-1">Total Employees</div>
        </div>
        <div class="stat-card rounded-xl p-6">
          <div class="text-3xl font-bold text-[#4f46e5]">${buyerGroup.length}</div>
          <div class="text-sm text-slate-500 mt-1">Buyer Group Members</div>
        </div>
        <div class="stat-card rounded-xl p-6">
          <div class="text-3xl font-bold text-emerald-600">$40K</div>
          <div class="text-sm text-slate-500 mt-1">Annual Contract</div>
        </div>
        <div class="stat-card rounded-xl p-6">
          <div class="text-3xl font-bold text-orange-600">#3</div>
          <div class="text-sm text-slate-500 mt-1">Global MCU Vendor</div>
        </div>
      </div>

      <div class="text-sm text-slate-400">
        Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Powered by TrustKeep.ai
      </div>
    </div>
  </div>

  <!-- Page 2: The Problem -->
  <div class="page-break min-h-screen px-8 py-16 bg-white">
    <div class="max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        The Challenge
      </div>

      <h2 class="text-3xl font-bold mb-8">Customer Intelligence is Fragmented Across Semiconductor Companies</h2>

      <div class="grid grid-cols-2 gap-8 mb-12">
        <div class="bg-slate-50 rounded-2xl p-8">
          <div class="text-5xl font-bold text-red-500 mb-2">73%</div>
          <div class="text-lg font-medium text-slate-700 mb-2">of Customer Signals Go Unnoticed</div>
          <p class="text-slate-500">Forums, support tickets, CRM notes, and community discussions contain valuable intelligence that never reaches product teams.</p>
        </div>
        <div class="bg-slate-50 rounded-2xl p-8">
          <div class="text-5xl font-bold text-red-500 mb-2">6-12mo</div>
          <div class="text-lg font-medium text-slate-700 mb-2">Delayed Response to Market Needs</div>
          <p class="text-slate-500">Without aggregated customer intelligence, semiconductor companies react slowly to emerging requirements and competitive threats.</p>
        </div>
      </div>

      <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
        <h3 class="text-xl font-semibold mb-4">The Hidden Cost of Scattered Customer Data</h3>
        <div class="grid grid-cols-3 gap-6">
          <div>
            <div class="text-2xl font-bold text-red-400">5+</div>
            <div class="text-sm text-slate-300">disconnected systems with customer data</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-400">40%</div>
            <div class="text-sm text-slate-300">of PM time spent manually gathering insights</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-400">$2M+</div>
            <div class="text-sm text-slate-300">lost per missed market opportunity</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Page 3: The Solution -->
  <div class="page-break min-h-screen px-8 py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
    <div class="max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-[#6366f1]/10 text-[#6366f1] rounded-full text-sm font-medium mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        The TrustKeep.ai Solution
      </div>

      <h2 class="text-3xl font-bold mb-4">Your Complete Buyer Group — Instantly</h2>
      <p class="text-lg text-slate-600 mb-12">We analyzed Renesas's Product Management and Application Engineering teams to identify the exact stakeholders who would evaluate and champion TrustKeep.ai.</p>

      <div class="bg-white rounded-2xl card-shadow p-8 mb-8">
        <h3 class="text-lg font-semibold mb-6">Why Renesas Needs TrustKeep.ai</h3>
        <div class="grid grid-cols-2 gap-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <div>
              <div class="font-medium">Unified Customer Signals</div>
              <div class="text-sm text-slate-500">One platform aggregating forums, CRM, support tickets, and community discussions</div>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
            </div>
            <div>
              <div class="font-medium">AI-Powered Insights</div>
              <div class="text-sm text-slate-500">Automatically surface trends, feature requests, and competitive intelligence</div>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <div>
              <div class="font-medium">Cross-Functional Visibility</div>
              <div class="text-sm text-slate-500">Product, Support, and FAE teams share a single source of truth</div>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <div>
              <div class="font-medium">Semiconductor-Specific</div>
              <div class="text-sm text-slate-500">Built for MCU, analog, and embedded teams' unique workflows</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Page 4: Company Profile -->
  <div class="page-break min-h-screen px-8 py-16 bg-white">
    <div class="max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        Target Company
      </div>

      <h2 class="text-3xl font-bold mb-2">Renesas Electronics Corporation</h2>
      <p class="text-lg text-slate-500 mb-8">Global Semiconductor Manufacturer</p>

      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="stat-card rounded-xl p-6">
          <div class="text-sm text-slate-500 mb-1">Industry</div>
          <div class="text-lg font-semibold">Semiconductors</div>
        </div>
        <div class="stat-card rounded-xl p-6">
          <div class="text-sm text-slate-500 mb-1">Employees</div>
          <div class="text-lg font-semibold">~11,500</div>
        </div>
        <div class="stat-card rounded-xl p-6">
          <div class="text-sm text-slate-500 mb-1">HQ Location</div>
          <div class="text-lg font-semibold">Tokyo, Japan</div>
        </div>
      </div>

      <div class="bg-[#6366f1]/5 rounded-2xl p-8 mb-8">
        <h3 class="text-lg font-semibold mb-4">Why Renesas is an Ideal TrustKeep.ai Customer</h3>
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-[#6366f1] text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">1</div>
            <div>
              <div class="font-medium">Complex Product Portfolio</div>
              <div class="text-sm text-slate-600">MCUs, analog, power management, and SoCs across automotive, IoT, and industrial. Managing customer signals across product lines is critical.</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-[#6366f1] text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">2</div>
            <div>
              <div class="font-medium">Large FAE Network</div>
              <div class="text-sm text-slate-600">Field Application Engineers globally generate valuable customer insights that often stay siloed in individual conversations.</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-[#6366f1] text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">3</div>
            <div>
              <div class="font-medium">Active Community</div>
              <div class="text-sm text-slate-600">Renesas forums and design communities have thousands of engineers sharing feedback that could inform product decisions.</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-[#6366f1] text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">4</div>
            <div>
              <div class="font-medium">Competitive Pressure</div>
              <div class="text-sm text-slate-600">Competing with TI, NXP, Microchip, and STM requires faster response to market needs and customer requirements.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Page 5: Buyer Group Overview -->
  <div class="page-break min-h-screen px-8 py-16 bg-gradient-to-br from-slate-50 to-slate-100">
    <div class="max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-[#6366f1]/10 text-[#6366f1] rounded-full text-sm font-medium mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        Your Buyer Group
      </div>

      <h2 class="text-3xl font-bold mb-2">Strategic Buyer Group Map</h2>
      <p class="text-lg text-slate-500 mb-8">The key stakeholders you need to engage for this $40K/year deal</p>

      <div class="bg-white rounded-2xl card-shadow p-8 mb-8">
        <div class="grid grid-cols-4 gap-6 text-center mb-8">
          <div>
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <span class="text-2xl font-bold text-red-600">${roleCounts.decision}</span>
            </div>
            <div class="font-medium">Decision Makers</div>
            <div class="text-xs text-slate-500">Budget authority</div>
          </div>
          <div>
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span class="text-2xl font-bold text-green-600">${roleCounts.champion}</span>
            </div>
            <div class="font-medium">Champions</div>
            <div class="text-xs text-slate-500">Internal advocates</div>
          </div>
          <div>
            <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <span class="text-2xl font-bold text-blue-600">${roleCounts.stakeholder}</span>
            </div>
            <div class="font-medium">Stakeholders</div>
            <div class="text-xs text-slate-500">Key influencers</div>
          </div>
          <div>
            <div class="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
              <span class="text-2xl font-bold text-orange-600">${roleCounts.blocker}</span>
            </div>
            <div class="font-medium">Blockers</div>
            <div class="text-xs text-slate-500">Address concerns</div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h4 class="font-semibold mb-4">Recommended Engagement Order</h4>
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">1</div>
              <span class="text-sm">Champion (Product Manager)</span>
            </div>
            <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">2</div>
              <span class="text-sm">Stakeholder (FAE Manager)</span>
            </div>
            <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-medium">3</div>
              <span class="text-sm">Decision Maker (Director)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Buyer Group Member Profiles -->
  <div class="page-break min-h-screen px-8 py-16 bg-white">
    <div class="max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        Buyer Group Profiles
      </div>

      <h2 class="text-3xl font-bold mb-8">Key Stakeholder Intelligence</h2>

      <div id="profile-cards">
        ${memberCardsHTML}
      </div>
    </div>
  </div>

  <!-- Final Page: Next Steps -->
  <div class="page-break min-h-screen px-8 py-16 trustkeep-gradient text-white flex flex-col justify-center">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl font-bold mb-6">Ready to Win Renesas?</h2>
      <p class="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
        You now have complete intelligence on your buyer group. Every stakeholder, every pain point, every engagement path.
      </p>

      <div class="grid grid-cols-3 gap-8 mb-12">
        <div class="bg-white/10 rounded-2xl p-6">
          <div class="text-4xl font-bold text-white mb-2">11.5K</div>
          <div class="text-white/70">Employees at Renesas</div>
        </div>
        <div class="bg-white/10 rounded-2xl p-6">
          <div class="text-4xl font-bold text-white mb-2">${buyerGroup.length}</div>
          <div class="text-white/70">Buyer Group Identified</div>
        </div>
        <div class="bg-white/10 rounded-2xl p-6">
          <div class="text-4xl font-bold text-white mb-2">$40K</div>
          <div class="text-white/70">Annual Opportunity</div>
        </div>
      </div>

      <div class="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#6366f1] rounded-full text-lg font-semibold">
        Start Your Outreach Today
      </div>

      <div class="mt-12 text-sm text-white/50">
        Powered by TrustKeep.ai | Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  </div>

</body>
</html>`;
  }
}

// CLI Interface
async function main() {
  console.log('\n🚀 TrustKeep.ai → Renesas Buyer Group Discovery (Clean Version)\n');

  const args = process.argv.slice(2);
  const options = {
    skipDatabase: args.includes('--skip-database')
  };

  const runner = new TrustKeepRenesasCleanRunner({
    workspaceId: process.env.TRUSTKEEP_WORKSPACE_ID || null,
    mainSellerId: process.env.TRUSTKEEP_SELLER_ID || null
  });

  try {
    const result = await runner.run('https://www.linkedin.com/company/renesas', options);

    if (result) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ DISCOVERY COMPLETED SUCCESSFULLY');
      console.log('='.repeat(80));
      console.log(`\n👥 Buyer Group: ${result.buyerGroup.length} members`);
      console.log(`💰 Cost: $${(result.costs?.total || 0).toFixed(2)}`);
      console.log('\n📁 Output files saved to: scripts/_future_now/find-buyer-group/output/');
      console.log('🖥️  HTML report saved to Desktop!');

      await disconnectPrismaClient();
      process.exit(0);
    } else {
      console.log('\n⚠️  Discovery completed but no results generated.');
      await disconnectPrismaClient();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Discovery failed:', error.message);
    await disconnectPrismaClient();
    process.exit(1);
  }
}

module.exports = { TrustKeepRenesasCleanRunner };

if (require.main === module) {
  main().catch(console.error);
}
