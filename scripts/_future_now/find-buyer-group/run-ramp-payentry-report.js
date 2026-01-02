#!/usr/bin/env node

/**
 * Ramp → PayEntry BGI Report
 * Buyer Group Intelligence for Ramp selling expense management into PayEntry
 * 
 * PayEntry (MPAY LLC) is a payroll and HCM solutions provider founded in 1994.
 * Ramp offers corporate cards, expense management, accounts payable, and accounting automation.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Seller Information: Ramp
const SELLER = {
  name: 'Ramp',
  website: 'https://ramp.com',
  tagline: 'Time is money. Save both.',
  product: 'Spend Management Platform',
  valueProposition: 'All-in-one finance automation platform with corporate cards, expense management, accounts payable, procurement, travel, and accounting automation',
  solutions: [
    'Corporate Cards with built-in spend controls',
    'Expense Management - Expenses that submit themselves',
    'Accounts Payable - Process bills in seconds',
    'Procurement - Run intake-to-pay without delay',
    'Accounting Automation - Accelerate monthly close',
    'Travel Management - Always in policy'
  ],
  keyMetrics: {
    customers: '50,000+',
    timeSaved: '20M+ hours saved',
    moneySaved: '$2B+ saved',
    valuation: '$22.5B (July 2025)'
  },
  brandColors: {
    primary: '#1e3a5f',
    accent: '#f59e0b',
    secondary: '#2563eb'
  }
};

// Buyer Information: PayEntry
const BUYER = {
  name: 'PayEntry',
  legalName: 'MPAY LLC DBA Payentry',
  website: 'https://www.payentry.com',
  industry: 'Payroll & Human Capital Management',
  founded: 1994,
  headquarters: 'United States',
  description: 'Forward-thinking personnel management solutions company delivering exceptional service combined with efficient technology. Provides payroll processing, HR management, insurance services, retirement plan services, and workforce management.',
  services: [
    'Payroll Services',
    'HR Services',
    'Insurance Services',
    'Retirement Plan Services',
    'Workforce Management',
    'Enhancement Services'
  ],
  recentNews: [
    'September 2025: Partnership with California Trucking Association',
    'September 2025: Merged with Corporate Payroll Services (CPS)'
  ],
  estimatedEmployees: '200-500',
  estimatedRevenue: '$50M-100M'
};

// Deal Configuration
const DEAL = {
  size: '$150,000',
  sizeNumeric: 150000,
  product: 'Spend Management Platform',
  timeline: '6-9 months',
  type: 'Mid-Market Enterprise'
};

// Buyer Group - Key stakeholders at PayEntry who would be involved in purchasing Ramp
const BUYER_GROUP = [
  // DECISION MAKERS
  {
    name: 'Executive Leadership',
    title: 'Chief Executive Officer',
    role: 'decision',
    department: 'Executive',
    linkedin: null,
    influence: 10,
    roleReasoning: 'CEO has ultimate authority for strategic investments. Expense management platform impacts company-wide operations and would require executive buy-in for a $150K deal.',
    painPoints: [
      {
        title: 'Scaling Operations Post-Merger',
        description: 'Following the 2025 merger with Corporate Payroll Services, need unified financial operations across combined entities.',
        urgency: 'high'
      }
    ]
  },
  {
    name: 'Finance Leadership',
    title: 'Chief Financial Officer',
    role: 'decision',
    department: 'Finance',
    linkedin: null,
    influence: 10,
    roleReasoning: 'CFO controls all financial operations and budget allocation. Primary decision maker for expense management and corporate card solutions.',
    painPoints: [
      {
        title: 'Manual Expense Processing',
        description: 'Current expense tracking likely involves manual processes that slow down monthly close.',
        urgency: 'high'
      },
      {
        title: 'Lack of Real-time Visibility',
        description: 'Limited visibility into company spending across departments until month-end reporting.',
        urgency: 'medium'
      }
    ]
  },
  // CHAMPIONS
  {
    name: 'Controller',
    title: 'Controller / Director of Accounting',
    role: 'champion',
    department: 'Finance',
    linkedin: null,
    influence: 8,
    roleReasoning: 'Controller manages day-to-day accounting operations and month-end close. Would directly benefit from Ramp\'s accounting automation and be a strong internal advocate.',
    painPoints: [
      {
        title: 'Slow Month-End Close',
        description: 'Chasing receipts and reconciling expenses extends close process by days.',
        urgency: 'high'
      },
      {
        title: 'Integration Challenges',
        description: 'Need seamless integration with existing accounting systems.',
        urgency: 'medium'
      }
    ]
  },
  {
    name: 'Operations Leadership',
    title: 'VP of Operations / COO',
    role: 'champion',
    department: 'Operations',
    linkedin: null,
    influence: 9,
    roleReasoning: 'Operations leader focused on efficiency and process improvement. Ramp\'s automation capabilities directly address operational pain points.',
    painPoints: [
      {
        title: 'Operational Inefficiencies',
        description: 'Manual approval workflows and paper-based processes slow operations.',
        urgency: 'high'
      },
      {
        title: 'Policy Enforcement',
        description: 'Difficulty enforcing spending policies across distributed teams.',
        urgency: 'medium'
      }
    ]
  },
  {
    name: 'HR Leadership',
    title: 'VP of Human Resources',
    role: 'champion',
    department: 'Human Resources',
    linkedin: null,
    influence: 7,
    roleReasoning: 'HR leader manages employee experience and onboarding. Corporate cards for new hires and T&E policies impact HR workflows.',
    painPoints: [
      {
        title: 'Employee Onboarding Delays',
        description: 'Getting new employees set up with expense capabilities takes too long.',
        urgency: 'medium'
      }
    ]
  },
  // BLOCKERS
  {
    name: 'IT Leadership',
    title: 'Director of IT / CTO',
    role: 'blocker',
    department: 'Information Technology',
    linkedin: null,
    influence: 8,
    roleReasoning: 'IT leader will evaluate security, compliance, and integration requirements. Critical gatekeeper for any new platform adoption.',
    painPoints: [
      {
        title: 'Security & Compliance',
        description: 'Any financial platform must meet strict security requirements and SOC 2 compliance.',
        urgency: 'high'
      },
      {
        title: 'Integration Complexity',
        description: 'Concerned about integration with existing payroll and accounting systems.',
        urgency: 'high'
      }
    ]
  },
  {
    name: 'Procurement',
    title: 'Procurement Manager',
    role: 'blocker',
    department: 'Procurement',
    linkedin: null,
    influence: 6,
    roleReasoning: 'Procurement will manage vendor selection, contract negotiation, and ensure competitive pricing.',
    painPoints: [
      {
        title: 'Vendor Consolidation',
        description: 'Prefer to reduce number of vendor relationships and consolidate tools.',
        urgency: 'medium'
      }
    ]
  },
  // STAKEHOLDERS
  {
    name: 'Sales Leadership',
    title: 'VP of Sales',
    role: 'stakeholder',
    department: 'Sales',
    linkedin: null,
    influence: 6,
    roleReasoning: 'Sales team needs corporate cards for client entertainment and travel. Would benefit from streamlined expense reporting.',
    painPoints: [
      {
        title: 'Slow Reimbursements',
        description: 'Sales reps frustrated with slow reimbursement cycles.',
        urgency: 'medium'
      }
    ]
  },
  {
    name: 'Client Services',
    title: 'VP of Client Services',
    role: 'stakeholder',
    department: 'Client Services',
    linkedin: null,
    influence: 5,
    roleReasoning: 'Client services team travels to client sites and has significant T&E needs. End users of expense management system.',
    painPoints: [
      {
        title: 'Complex Travel Booking',
        description: 'Need simple travel booking that stays within policy.',
        urgency: 'low'
      }
    ]
  },
  {
    name: 'Accounts Payable',
    title: 'AP Manager',
    role: 'stakeholder',
    department: 'Finance',
    linkedin: null,
    influence: 6,
    roleReasoning: 'AP Manager handles vendor payments daily. Ramp\'s bill payment automation would significantly reduce workload.',
    painPoints: [
      {
        title: 'Manual Bill Processing',
        description: 'Processing vendor invoices manually is time-consuming and error-prone.',
        urgency: 'high'
      }
    ]
  }
];

// Calculate stats
const totalMembers = BUYER_GROUP.length;
const decisionMakers = BUYER_GROUP.filter(m => m.role === 'decision').length;
const champions = BUYER_GROUP.filter(m => m.role === 'champion').length;
const blockers = BUYER_GROUP.filter(m => m.role === 'blocker').length;
const stakeholders = BUYER_GROUP.filter(m => m.role === 'stakeholder').length;

// Role labels and colors
const roleLabels = {
  decision: 'DECISION MAKER',
  champion: 'CHAMPION',
  blocker: 'BLOCKER',
  stakeholder: 'STAKEHOLDER'
};

const roleColors = {
  decision: '#dc2626',
  champion: '#16a34a',
  blocker: '#f97316',
  stakeholder: '#3b82f6'
};

// Generate profile cards
function generateProfiles() {
  const order = ['decision', 'champion', 'blocker', 'stakeholder'];
  let html = '';
  
  order.forEach(role => {
    const members = BUYER_GROUP.filter(m => m.role === role);
    members.forEach(m => {
      const painPointsHtml = m.painPoints && m.painPoints.length > 0 
        ? `<div class="pain-point">Key Pain: ${m.painPoints[0].title}</div>`
        : '';
      
      html += `
      <div class="profile-card">
        <div class="profile-info">
          <div class="profile-name">${m.title}</div>
          <div class="profile-dept">${m.department} Department</div>
        </div>
        <div class="profile-meta">
          <span class="role-badge" style="background: ${roleColors[role]};">${roleLabels[role]}</span>
        </div>
        <div class="influence">Influence: ${m.influence}/10</div>
        <div class="reasoning">${m.roleReasoning}</div>
        ${painPointsHtml}
      </div>`;
    });
  });
  
  return html;
}

// Generate the HTML report
const today = new Date();
const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence | Ramp → PayEntry</title>
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
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }
    
    .page {
      max-width: 850px;
      margin: 0 auto;
      padding: 48px;
    }
    
    /* Cover Page */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding-bottom: 48px;
    }
    
    .cover-header {
      text-align: center;
      margin-bottom: 48px;
    }
    
    .label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 16px;
    }
    
    .cover-title {
      font-size: 42px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 16px;
      color: var(--text);
    }
    
    .cover-subtitle {
      font-size: 18px;
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-top: 48px;
    }
    
    .stat-box {
      background: var(--bg);
      padding: 20px 16px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
    }
    
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-top: 24px;
    }
    
    .hero-stat {
      background: var(--bg);
      padding: 24px 16px;
      text-align: center;
    }
    
    .hero-stat-value {
      font-size: 32px;
      font-weight: 800;
      color: var(--primary);
    }
    
    .hero-stat-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    
    /* Section Styles */
    .section {
      padding: 48px 0;
      border-top: 1px solid var(--border);
    }
    
    .section-title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    
    .section-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 32px;
    }
    
    /* Opportunity Section */
    .opportunity-text {
      font-size: 16px;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 32px;
    }
    
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .benefit-card {
      background: var(--bg-muted);
      border: 1px solid var(--border);
      padding: 20px;
      border-radius: 8px;
    }
    
    .benefit-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--primary-dark);
    }
    
    .benefit-text {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    
    /* Composition Bar */
    .composition {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    
    .comp-item {
      background: var(--bg);
      padding: 20px;
      text-align: center;
    }
    
    .comp-value {
      font-size: 28px;
      font-weight: 800;
    }
    
    .comp-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    
    /* Profile Cards */
    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .profile-card {
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: 8px;
    }
    
    .profile-info {
      margin-bottom: 12px;
    }
    
    .profile-name {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    
    .profile-dept {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .profile-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .role-badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: white;
      border-radius: 4px;
    }
    
    .influence {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 8px;
    }
    
    .reasoning {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 8px;
      line-height: 1.4;
      font-style: italic;
    }
    
    .pain-point {
      font-size: 11px;
      color: var(--primary-dark);
      margin-top: 8px;
      font-weight: 600;
    }
    
    /* Strategy Section */
    .strategy-list {
      list-style: none;
    }
    
    .strategy-item {
      display: flex;
      gap: 16px;
      padding: 20px 0;
      border-bottom: 1px solid var(--border);
    }
    
    .strategy-item:last-child {
      border-bottom: none;
    }
    
    .strategy-number {
      width: 32px;
      height: 32px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .strategy-content {
      flex: 1;
    }
    
    .strategy-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    
    .strategy-text {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    
    /* Product Fit */
    .product-fit {
      background: linear-gradient(135deg, var(--navy) 0%, #2c5282 100%);
      color: white;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 32px;
    }
    
    .product-fit h3 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 16px;
    }
    
    .fit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .fit-item {
      background: rgba(255,255,255,0.1);
      padding: 16px;
      border-radius: 8px;
    }
    
    .fit-item-title {
      font-weight: 700;
      margin-bottom: 4px;
      color: var(--primary);
    }
    
    .fit-item-text {
      font-size: 13px;
      opacity: 0.9;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 48px;
      margin-top: 48px;
      border-top: 1px solid var(--border);
    }
    
    .footer-logo {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: var(--navy);
    }
    
    .footer-tagline {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
    
    /* Page Breaks */
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    
    @media print {
      * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
      body { background: white !important; }
      .page { padding: 32px; }
      .cover { min-height: auto; padding-bottom: 24px; }
      .section { padding: 32px 0; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Cover Page -->
    <div class="cover">
      <div class="cover-header">
        <div class="label">Buyer Group Intelligence</div>
        <h1 class="cover-title">Your path into PayEntry</h1>
        <p class="cover-subtitle">${totalMembers} key stakeholder roles identified and mapped for coordinated outreach. This is your complete buyer group strategy for closing PayEntry.</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Seller</div>
          <div class="stat-value">Ramp</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Target Account</div>
          <div class="stat-value">PayEntry</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Deal Size</div>
          <div class="stat-value">${DEAL.size}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Product</div>
          <div class="stat-value">Spend Management</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Generated</div>
          <div class="stat-value">${dateStr}</div>
        </div>
      </div>
      
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-value">${totalMembers}</div>
          <div class="hero-stat-label">Buyer Group</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">${decisionMakers}</div>
          <div class="hero-stat-label">Decision Makers</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">${champions}</div>
          <div class="hero-stat-label">Champions</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-value">${blockers}</div>
          <div class="hero-stat-label">Blockers</div>
        </div>
      </div>
    </div>
    
    <!-- The Opportunity -->
    <div class="section page-break">
      <h2 class="section-title">The Opportunity</h2>
      <p class="section-subtitle">Why PayEntry is an Ideal Target for Ramp</p>
      
      <div class="product-fit">
        <h3>Why Ramp for PayEntry</h3>
        <div class="fit-grid">
          <div class="fit-item">
            <div class="fit-item-title">Post-Merger Integration</div>
            <div class="fit-item-text">PayEntry merged with Corporate Payroll Services in Sept 2025. They need unified financial operations across the combined entity - exactly what Ramp provides.</div>
          </div>
          <div class="fit-item">
            <div class="fit-item-title">Scaling Operations</div>
            <div class="fit-item-text">As PayEntry grows through M&A, manual expense processes won't scale. Ramp's automation eliminates manual work as headcount grows.</div>
          </div>
          <div class="fit-item">
            <div class="fit-item-title">Complementary Expertise</div>
            <div class="fit-item-text">PayEntry helps clients manage payroll - they understand the value of automation. Ramp extends that automation to their own expense operations.</div>
          </div>
          <div class="fit-item">
            <div class="fit-item-title">Partnership Potential</div>
            <div class="fit-item-text">PayEntry partners with trucking associations and other verticals. Ramp could become an integrated offering for their clients.</div>
          </div>
        </div>
      </div>
      
      <p class="opportunity-text">
        PayEntry is a forward-thinking payroll and HCM solutions provider founded in 1994 under MPAY LLC. With their recent merger with Corporate Payroll Services and partnership with the California Trucking Association, they're in growth mode. Companies in growth mode need financial infrastructure that scales.
      </p>
      <p class="opportunity-text">
        Ramp's expense management and corporate card platform is ideally positioned to help PayEntry streamline their own internal financial operations while demonstrating the value of automation that they preach to their clients.
      </p>
      
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-title">Accelerated Month-End Close</div>
          <div class="benefit-text">Ramp customers save 7+ hours per month-end close through automated reconciliation and expense categorization.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Control Before Spend</div>
          <div class="benefit-text">Set spending policies that enforce themselves. Issue cards with built-in controls and stop out-of-policy spending before it happens.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Single Platform</div>
          <div class="benefit-text">Replace 4+ tools with one platform for cards, expenses, bills, travel, and accounting automation. Perfect for post-merger consolidation.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">AI-Powered Intelligence</div>
          <div class="benefit-text">Ramp AI catches out-of-policy transactions, uncovers errors, and identifies savings opportunities automatically.</div>
        </div>
      </div>
    </div>
    
    <!-- Buyer Group Composition -->
    <div class="section page-break">
      <h2 class="section-title">Buyer Group Composition</h2>
      <p class="section-subtitle">Key Roles to Engage at PayEntry</p>
      
      <div class="composition">
        <div class="comp-item">
          <div class="comp-value" style="color: var(--decision);">${decisionMakers}</div>
          <div class="comp-label">Decision Makers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: var(--champion);">${champions}</div>
          <div class="comp-label">Champions</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: var(--blocker);">${blockers}</div>
          <div class="comp-label">Blockers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: var(--stakeholder);">${stakeholders}</div>
          <div class="comp-label">Stakeholders</div>
        </div>
      </div>
      
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Stakeholder Profiles</h3>
      
      <div class="profiles-grid">
        ${generateProfiles()}
      </div>
    </div>
    
    <!-- Recommended Strategy -->
    <div class="section page-break">
      <h2 class="section-title">Recommended Strategy</h2>
      <p class="section-subtitle">Multi-Thread Engagement Approach</p>
      <p class="opportunity-text" style="margin-bottom: 24px;">
        Execute coordinated outreach to build momentum across the organization. Lead with efficiency gains, demonstrate quick time-to-value, and address security concerns early.
      </p>
      
      <ul class="strategy-list">
        <li class="strategy-item">
          <div class="strategy-number">1</div>
          <div class="strategy-content">
            <div class="strategy-title">Lead with the CFO - Time is Money</div>
            <div class="strategy-text">The CFO is your primary entry point. Lead with Ramp's core value prop: "Time is money. Save both." Reference specific metrics: 325+ hours saved monthly, 3-5% total spend savings, and 7 hours saved per month-end close. Position as infrastructure for post-merger financial consolidation.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Activate the Controller as Champion</div>
            <div class="strategy-text">The Controller feels the pain of manual expense processing daily. Offer a sandbox demo and ROI calculator. Show how Ramp's accounting automation accelerates close and eliminates receipt chasing. This role becomes your internal champion once they see the time savings.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Engage IT Early with Security Credentials</div>
            <div class="strategy-text">IT will evaluate security and integration requirements. Proactively share Ramp's SOC 2 Type II certification, enterprise security practices, and integration capabilities with major accounting systems. Address concerns before they become blockers.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Build Operations Support</div>
            <div class="strategy-text">VP of Operations cares about efficiency and policy enforcement. Demonstrate Ramp's automated approval workflows and built-in spending controls. Show how policies enforce themselves without manual oversight.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Position for Partnership</div>
            <div class="strategy-text">PayEntry serves payroll clients who also need expense management. Explore a referral or integration partnership where PayEntry can offer Ramp to their clients. This strategic angle may accelerate executive sponsorship.</div>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Key Talking Points -->
    <div class="section page-break">
      <h2 class="section-title">Key Talking Points</h2>
      <p class="section-subtitle">Tailored Messaging for PayEntry</p>
      
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-title">1. Post-Merger Consolidation</div>
          <div class="benefit-text">"After your merger with Corporate Payroll Services, you need unified financial operations. Ramp provides a single platform for cards, expenses, bills, and accounting across the combined entity."</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">2. Practice What You Preach</div>
          <div class="benefit-text">"You help clients automate payroll. Ramp helps you automate expenses. Show your clients you use the same automation principles for your own operations."</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">3. Scale Without Adding Headcount</div>
          <div class="benefit-text">"As you grow through M&A, Ramp's automation means your finance team doesn't need to grow at the same rate. Process more volume with the same team."</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">4. Real-Time Visibility</div>
          <div class="benefit-text">"Stop waiting for month-end to see spending patterns. Ramp gives you real-time visibility and alerts, so you can act on insights immediately."</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">5. Enterprise-Grade Security</div>
          <div class="benefit-text">"SOC 2 Type II certified with enterprise security practices. We serve 50,000+ businesses including CBRE, Shopify, and other enterprises with strict security requirements."</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">6. Quick Implementation</div>
          <div class="benefit-text">"Most customers are live within days, not months. Seamless integration with major accounting systems means minimal disruption to your existing workflows."</div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">RAMP</div>
      <div class="footer-tagline">Time is money. Save both.</div>
    </div>
  </div>
</body>
</html>`;

// Save HTML
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const htmlPath = path.join(outputDir, `ramp-payentry-buyer-group-${today.toISOString().split('T')[0]}.html`);
fs.writeFileSync(htmlPath, html);
console.log(`HTML saved: ${htmlPath}`);

// Also save to Desktop
const desktopHtmlPath = '/Users/rosssylvester/Desktop/Ramp-PayEntry-Buyer-Group-Report.html';
fs.writeFileSync(desktopHtmlPath, html);
console.log(`HTML saved to Desktop: ${desktopHtmlPath}`);

// Generate PDF
async function generatePDF() {
  console.log('Generating PDF...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const pdfPath = '/Users/rosssylvester/Desktop/Ramp-PayEntry-Buyer-Group-Report.pdf';
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '24px', right: '24px', bottom: '24px', left: '24px' }
  });
  
  await browser.close();
  
  console.log(`PDF saved to: ${pdfPath}`);
  console.log(`File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`);
}

generatePDF().then(() => {
  console.log('\nReport Summary:');
  console.log(`   Seller: ${SELLER.name}`);
  console.log(`   Buyer: ${BUYER.name}`);
  console.log(`   Deal Size: ${DEAL.size}`);
  console.log(`   Total Stakeholder Roles: ${totalMembers}`);
  console.log(`   Decision Makers: ${decisionMakers}`);
  console.log(`   Champions: ${champions}`);
  console.log(`   Blockers: ${blockers}`);
  console.log(`   Stakeholders: ${stakeholders}`);
  console.log('\nFiles saved:');
  console.log(`   - ${htmlPath}`);
  console.log(`   - ${desktopHtmlPath}`);
  console.log(`   - /Users/rosssylvester/Desktop/Ramp-PayEntry-Buyer-Group-Report.pdf`);
}).catch(err => {
  console.error('PDF generation failed:', err.message);
  console.log('\nHTML report was still saved successfully.');
  process.exit(0);
});

module.exports = { SELLER, BUYER, DEAL, BUYER_GROUP };

