/**
 * Create eCore Services → Cisco Buyer Group Report
 *
 * Clean version without source citations or pain points
 */

const fs = require('fs');
const path = require('path');

// VERIFIED CISCO BUYER GROUP (researched Dec 2025)
const VERIFIED_BUYER_GROUP = [
  // DECISION MAKERS
  {
    name: 'Carrie Palin',
    title: 'SVP & Chief Marketing Officer',
    role: 'decision',
    department: 'Marketing',
    linkedin: 'https://www.linkedin.com/in/carrie-palin-37a1802/',
    insight: 'Member of Executive Leadership Team. Named to Forbes Most Influential CMOs list 2023 & 2024. Board member at DemandScience (B2B data company) and NetApp. Previously CMO at Splunk, SendGrid, and Box.',
    painPoint: 'As CMO, she owns the marketing budget and ROI metrics. With Cisco operating in 59 countries, bad contact data creates wasted spend across every region. Her board seat at DemandScience means she already understands the B2B data market—she knows what good data costs and what bad data costs more.',
    rationale: 'Ultimate budget authority for marketing technology investments. Her board seat at DemandScience (a B2B data company) demonstrates direct familiarity with this product category.'
  },
  {
    name: 'Rebecca Stone',
    title: 'SVP, Global Revenue Marketing',
    role: 'decision',
    department: 'Revenue Marketing',
    linkedin: 'https://www.linkedin.com/in/rebeccalawstone/',
    insight: 'Oversees integrated marketing, campaign planning, sales development, content marketing, media, and marketing technology operations. 20+ years B2B marketing experience with proven 5-10x pipeline growth.',
    painPoint: 'Responsible for marketing-generated pipeline. Inaccurate contact data wastes SDR time and marketing budget. Needs reliable data enrichment to maximize campaign effectiveness and sales development productivity across the entire revenue marketing organization.',
    rationale: 'Owns marketing technology operations and sales development—the two primary use cases for B2B contact data. Her team would be the primary users of eCore\'s platform.'
  },

  // CHAMPIONS
  {
    name: 'Chad Reese',
    title: 'VP, Marketing Operations & Digital Marketing Platforms',
    role: 'champion',
    department: 'Marketing Operations',
    linkedin: 'https://www.linkedin.com/in/reesechad/',
    insight: '23-year Cisco veteran. Accountable for end-to-end marketing technology strategy. Led Partner Revenue Marketing delivering $2.6B in SQL globally. Enables campaign execution across 59 countries and 27 languages.',
    painPoint: 'Managing marketing technology across 59 countries means constant data quality challenges. Every campaign depends on accurate contact information. His $2.6B SQL responsibility is directly impacted by data decay—every bounced email and wrong number is lost revenue opportunity.',
    rationale: 'Directly responsible for marketing technology stack and data infrastructure. Would evaluate, implement, and champion a B2B data enrichment solution. His team manages the systems that would integrate with eCore.'
  },
  {
    name: 'Britney Bartlett',
    title: 'VP, Global Field Marketing',
    role: 'champion',
    department: 'Field Marketing',
    linkedin: 'https://www.linkedin.com/in/britneybartlett/',
    insight: 'Won Go-to-Market Leader of the Year 2024. Led Cisco\'s transformation from scale-based to account-based marketing. Expertise in demand generation and sales-marketing alignment.',
    painPoint: 'ABM success depends on reaching the right people at target accounts. Account-based programs fail when contact data is stale or incomplete. Her award-winning ABM transformation requires continuously enriched data to maintain targeting accuracy and personalization at scale.',
    rationale: 'ABM programs require accurate, enriched account and contact data. She would champion a solution that improves targeting accuracy for her field marketing campaigns.'
  },
  {
    name: 'Rune Olslund',
    title: 'Sr. Director, Omnichannel Experiences & Demand Generation',
    role: 'champion',
    department: 'Digital Marketing',
    linkedin: 'https://www.linkedin.com/in/runeolslund/',
    insight: '24-year Cisco veteran. Grew inbound hand-raisers from 500K to 1M+. Contributed to $8.2B SQL pipeline and $3.1B revenue. Led Cisco.com transformation with 70% YoY engagement increase.',
    painPoint: 'Scaling from 500K to 1M+ hand-raisers means exponentially more data to verify and enrich. His demand gen engine needs real-time job change alerts to catch prospects moving between companies. Outdated data means missed opportunities in the $8.2B pipeline he supports.',
    rationale: 'Demand generation effectiveness directly tied to contact data quality. His team needs verified emails and accurate contact info to drive inbound and outbound campaigns.'
  },
  {
    name: 'Dan Wastchak',
    title: 'Director, Global Revenue Operations',
    role: 'champion',
    department: 'Revenue Operations',
    linkedin: 'https://www.linkedin.com/in/dan-wastchak/',
    insight: '15+ years leading global strategy and operations teams. Responsible for critical RevOps processes, aligning work with Sales GTM Strategy, and driving execution across the organization.',
    painPoint: 'RevOps lives and dies by CRM data quality. Duplicate records, outdated contacts, and missing information create friction between sales and marketing. He needs automated data cleansing and enrichment to keep the revenue engine running smoothly across global operations.',
    rationale: 'RevOps owns CRM data quality and sales-marketing alignment. Would champion data cleansing and enrichment to reduce operational friction and improve pipeline accuracy.'
  },

  // STAKEHOLDERS
  {
    name: 'Michael Prevete',
    title: 'Director, Revenue Operations',
    role: 'stakeholder',
    department: 'Revenue Operations',
    linkedin: 'https://www.linkedin.com/in/mikeprevete/',
    insight: 'Part of the Revenue Operations leadership team. Works alongside Dan Wastchak on sales and marketing alignment through data and process optimization.',
    painPoint: 'Day-to-day operations suffer when contact data is unreliable. His team spends time on manual data cleanup instead of strategic initiatives. Integration with existing CRM and marketing automation systems is critical for any data enrichment solution to deliver value.',
    rationale: 'Day-to-day RevOps operations impacted by data quality. Would be involved in evaluating how eCore integrates with existing CRM and marketing automation systems.'
  },
  {
    name: 'Todd Shimizu',
    title: 'VP, Digital Marketing and Media',
    role: 'stakeholder',
    department: 'Digital Marketing',
    linkedin: 'https://www.linkedin.com/in/todd-shimizu-6027164/',
    insight: 'Leads digital marketing and media strategy at Cisco. Responsible for digital advertising effectiveness and audience targeting across channels.',
    painPoint: 'Digital advertising ROI depends on accurate audience data. Every ad served to the wrong person or outdated contact is wasted spend. Better enriched data means more precise targeting, reduced waste, and higher conversion rates across all digital channels.',
    rationale: 'Digital advertising ROI depends on accurate targeting data. Would provide input on how enriched data could improve ad targeting and reduce wasted spend.'
  },

  // BLOCKERS
  {
    name: 'Alexandra Lopez',
    title: 'SVP & Chief Procurement Officer',
    role: 'blocker',
    department: 'Global Procurement Services',
    linkedin: 'https://www.linkedin.com/in/alexandra-lopez-408b92/',
    insight: 'Leads end-to-end buying ecosystem including vendor management. Named Top 10 Women in Procurement 2022. Member of Cisco Sustainability Council.',
    painPoint: 'Every new vendor adds complexity to the procurement ecosystem. She needs to validate pricing is competitive, contract terms protect Cisco, and the vendor meets sustainability and compliance standards. Data vendors handling personal information face extra scrutiny.',
    rationale: 'All enterprise vendor contracts require procurement approval. Will evaluate pricing, contract terms, and vendor compliance. Must validate eCore meets Cisco\'s procurement standards.'
  },
  {
    name: 'Trevor Thiel',
    title: 'Chief Information Security Officer (CISO)',
    role: 'blocker',
    department: 'Information Security',
    linkedin: 'https://www.linkedin.com/in/trevor-thiel-b2a1a322b/',
    insight: 'Oversees information and data security at Cisco. Any solution handling customer or prospect data requires security review and approval.',
    painPoint: 'B2B data vendors handle sensitive personal and business information. Any breach or compliance failure reflects on Cisco. He must validate SOC 2 Type II certification, GDPR/CCPA compliance, data handling practices, and ensure no security vulnerabilities before approval.',
    rationale: 'B2B data vendors must pass security review. Will validate SOC 2 compliance, data handling practices, and privacy controls. GDPR and CCPA compliance critical for approval.'
  }
];

// Context
const CONTEXT = {
  seller: {
    name: 'eCore Services',
    website: 'https://ecoreservice.com',
    product: 'B2B Data Enrichment Platform',
    description: 'Enterprise contact database with 200M+ contacts, 95%+ accuracy, real-time job change tracking, and CRM data cleansing',
    keyFeatures: [
      '200M+ B2B contacts globally',
      '80M+ verified email addresses',
      '70M+ mobile phone numbers',
      '95%+ data accuracy guarantee',
      'Real-time job change alerts',
      'CRM data cleansing & deduplication',
      'Standard & Pro waterfall enrichment',
      'API integration for automation'
    ],
    brandColors: {
      primary: '#BB1985',
      secondary: '#DD5E4D',
      accent: '#F79421'
    }
  },
  buyer: {
    name: 'Cisco Systems',
    website: 'https://www.cisco.com',
    industry: 'Technology / Networking',
    employeeCount: 86000,
    revenue: '$54B (FY2024)',
    headquarters: 'San Jose, CA'
  },
  deal: {
    estimatedSize: '$150,000 - $200,000',
    dealType: 'Annual Enterprise License'
  }
};

// Icons
const icons = {
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  crown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  database: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  zap: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
};

function getRoleIcon(role) {
  switch (role) {
    case 'decision': return icons.crown;
    case 'champion': return icons.star;
    case 'blocker': return icons.shield;
    case 'stakeholder': return icons.user;
    default: return icons.user;
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'decision': return 'Decision Maker';
    case 'champion': return 'Champion';
    case 'blocker': return 'Blocker';
    case 'stakeholder': return 'Stakeholder';
    default: return 'Contact';
  }
}

function getRoleColor(role) {
  switch (role) {
    case 'decision': return '#BB1985';
    case 'champion': return '#DD5E4D';
    case 'blocker': return '#6B7280';
    case 'stakeholder': return '#F79421';
    default: return '#9CA3AF';
  }
}

function generateHTML() {
  const decisionMakers = VERIFIED_BUYER_GROUP.filter(m => m.role === 'decision');
  const champions = VERIFIED_BUYER_GROUP.filter(m => m.role === 'champion');
  const stakeholders = VERIFIED_BUYER_GROUP.filter(m => m.role === 'stakeholder');
  const blockers = VERIFIED_BUYER_GROUP.filter(m => m.role === 'blocker');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence: eCore Services → Cisco</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0f0f0f;
      color: #ffffff;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }

    .header {
      text-align: center;
      margin-bottom: 60px;
      padding: 60px 40px;
      background: linear-gradient(135deg, #BB1985 0%, #DD5E4D 50%, #F79421 100%);
      border-radius: 16px;
    }
    .header-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: rgba(255,255,255,0.9);
      margin-bottom: 16px;
    }
    .header h1 { font-size: 42px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
    .header-subtitle { font-size: 20px; color: rgba(255,255,255,0.9); margin-bottom: 24px; }
    .header-meta { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
    .header-meta-item { text-align: center; }
    .header-meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
    .header-meta-value { font-size: 16px; font-weight: 600; color: #ffffff; }

    .context-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 48px; }
    @media (max-width: 768px) { .context-section { grid-template-columns: 1fr; } }
    .context-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; }
    .context-card h3 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .context-card h4 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .context-card p { color: #aaa; font-size: 14px; margin-bottom: 16px; }
    .feature-list { list-style: none; }
    .feature-list li { display: flex; align-items: flex-start; gap: 8px; color: #ccc; font-size: 13px; margin-bottom: 8px; }
    .feature-list li svg { color: #BB1985; flex-shrink: 0; margin-top: 2px; }

    .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 48px; }
    @media (max-width: 768px) { .summary-stats { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-number { font-size: 36px; font-weight: 700; color: #BB1985; margin-bottom: 4px; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #333; }
    .section-header h2 { font-size: 20px; font-weight: 600; color: #fff; }
    .section-count { background: #BB1985; color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px; }

    .person-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 48px; }
    @media (max-width: 900px) { .person-grid { grid-template-columns: 1fr; } }
    .person-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; transition: border-color 0.2s; }
    .person-card:hover { border-color: #BB1985; }
    .person-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .person-name { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .person-title { font-size: 14px; color: #aaa; margin-bottom: 8px; }
    .person-dept { font-size: 12px; color: #666; }
    .role-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .role-badge svg { width: 14px; height: 14px; }

    .person-insight { background: #252525; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .person-insight-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 6px; }
    .person-insight p { font-size: 13px; color: #bbb; line-height: 1.5; }

    .person-pain { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 8px; padding: 12px; margin-bottom: 12px; position: relative; overflow: hidden; }
    .person-pain-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #BB1985; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .person-pain-content { font-size: 13px; color: #bbb; line-height: 1.5; filter: blur(5px); user-select: none; pointer-events: none; }
    .person-pain-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); }
    .unlock-badge { background: linear-gradient(135deg, #BB1985 0%, #DD5E4D 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(187,25,133,0.3); }

    .person-footer { display: flex; justify-content: flex-end; align-items: center; padding-top: 12px; border-top: 1px solid #333; }
    .linkedin-link { display: flex; align-items: center; gap: 6px; color: #0A66C2; text-decoration: none; font-size: 12px; font-weight: 500; }
    .linkedin-link:hover { text-decoration: underline; }

    .report-footer { text-align: center; padding: 40px 20px; border-top: 1px solid #333; margin-top: 40px; }
    .footer-brand { font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="header-label">Buyer Group Intelligence</div>
      <h1>eCore Services → Cisco</h1>
      <div class="header-subtitle">B2B Data Enrichment Platform</div>
      <div class="header-meta">
        <div class="header-meta-item">
          <div class="header-meta-label">Deal Size</div>
          <div class="header-meta-value">${CONTEXT.deal.estimatedSize}</div>
        </div>
        <div class="header-meta-item">
          <div class="header-meta-label">Target Company</div>
          <div class="header-meta-value">Cisco Systems (${CONTEXT.buyer.employeeCount.toLocaleString()} employees)</div>
        </div>
        <div class="header-meta-item">
          <div class="header-meta-label">Buyer Group</div>
          <div class="header-meta-value">${VERIFIED_BUYER_GROUP.length} Contacts</div>
        </div>
      </div>
    </header>

    <div class="context-section">
      <div class="context-card">
        <h3>${icons.database} Seller</h3>
        <h4>${CONTEXT.seller.name}</h4>
        <p>${CONTEXT.seller.description}</p>
        <ul class="feature-list">
          ${CONTEXT.seller.keyFeatures.slice(0, 6).map(f => `<li>${icons.check} ${f}</li>`).join('')}
        </ul>
      </div>
      <div class="context-card">
        <h3>${icons.target} Buyer</h3>
        <h4>${CONTEXT.buyer.name}</h4>
        <p>Fortune 100 technology leader in networking, security, and collaboration. ${CONTEXT.buyer.revenue} revenue.</p>
        <ul class="feature-list">
          <li>${icons.check} ${CONTEXT.buyer.employeeCount.toLocaleString()} employees globally</li>
          <li>${icons.check} Headquarters: ${CONTEXT.buyer.headquarters}</li>
          <li>${icons.check} Industry: ${CONTEXT.buyer.industry}</li>
          <li>${icons.check} Marketing operates in 59 countries, 27 languages</li>
          <li>${icons.check} ABM-focused marketing strategy</li>
          <li>${icons.check} $8.2B+ annual marketing-generated pipeline</li>
        </ul>
      </div>
    </div>

    <div class="summary-stats">
      <div class="stat-card"><div class="stat-number">${decisionMakers.length}</div><div class="stat-label">Decision Makers</div></div>
      <div class="stat-card"><div class="stat-number">${champions.length}</div><div class="stat-label">Champions</div></div>
      <div class="stat-card"><div class="stat-number">${stakeholders.length}</div><div class="stat-label">Stakeholders</div></div>
      <div class="stat-card"><div class="stat-number">${blockers.length}</div><div class="stat-label">Blockers</div></div>
    </div>

    <div class="section-header"><h2>${icons.crown} Decision Makers</h2><span class="section-count">${decisionMakers.length}</span></div>
    <div class="person-grid">${decisionMakers.map(p => generatePersonCard(p)).join('')}</div>

    <div class="section-header"><h2>${icons.star} Champions</h2><span class="section-count">${champions.length}</span></div>
    <div class="person-grid">${champions.map(p => generatePersonCard(p)).join('')}</div>

    <div class="section-header"><h2>${icons.user} Stakeholders</h2><span class="section-count">${stakeholders.length}</span></div>
    <div class="person-grid">${stakeholders.map(p => generatePersonCard(p)).join('')}</div>

    <div class="section-header"><h2>${icons.shield} Blockers</h2><span class="section-count">${blockers.length}</span></div>
    <div class="person-grid">${blockers.map(p => generatePersonCard(p)).join('')}</div>

    <footer class="report-footer">
      <div class="footer-brand">Buyer Group Intelligence | eCore Services</div>
    </footer>
  </div>
</body>
</html>`;

  return html;
}

function generatePersonCard(person) {
  const roleColor = getRoleColor(person.role);
  return `
    <div class="person-card">
      <div class="person-header">
        <div>
          <div class="person-name">${person.name}</div>
          <div class="person-title">${person.title}</div>
          <div class="person-dept">${person.department}</div>
        </div>
        <div class="role-badge" style="background: ${roleColor}20; color: ${roleColor};">
          ${getRoleIcon(person.role)}
          ${getRoleLabel(person.role)}
        </div>
      </div>
      <div class="person-insight">
        <div class="person-insight-label">Background & Influence</div>
        <p>${person.insight}</p>
      </div>
      <div class="person-pain">
        <div class="person-pain-label">${icons.zap} Pain & Opportunity</div>
        <p class="person-pain-content">${person.painPoint}</p>
        <div class="person-pain-overlay">
          <div class="unlock-badge">${icons.lock} Unlock Full Report</div>
        </div>
      </div>
      <div class="person-footer">
        <a href="${person.linkedin}" target="_blank" class="linkedin-link">${icons.linkedin} LinkedIn Profile</a>
      </div>
    </div>
  `;
}

function main() {
  console.log('Generating eCore Services → Cisco Buyer Group Report...\n');

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Generate HTML
  const html = generateHTML();
  const htmlPath = path.join(outputDir, 'ecore-cisco-buyer-group-report.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`HTML saved: ${htmlPath}`);

  // Generate JSON with rationale
  const jsonData = {
    context: CONTEXT,
    buyerGroup: {
      totalMembers: VERIFIED_BUYER_GROUP.length,
      members: VERIFIED_BUYER_GROUP.map(m => ({
        name: m.name,
        title: m.title,
        role: m.role,
        department: m.department,
        linkedin: m.linkedin,
        insight: m.insight,
        painPoint: m.painPoint,
        rationale: m.rationale
      }))
    },
    roleRationale: {
      decisionMakers: "Budget authority for marketing technology investments. CMO and SVP Revenue Marketing control spend on data vendors and have final sign-off on enterprise contracts of this size ($150K-$200K).",
      champions: "Operational leaders who would evaluate, implement, and advocate for the solution. Marketing Operations owns the tech stack, Field Marketing needs accurate data for ABM, Demand Gen relies on verified contacts, and RevOps manages CRM data quality.",
      stakeholders: "End users and technical evaluators who would provide input but don't have final authority. They would assess integration requirements and day-to-day usability.",
      blockers: "Required approvers for enterprise vendor contracts. CPO (procurement) must approve vendor terms, pricing, and compliance. CISO must validate security controls, SOC 2 compliance, and data handling practices for any solution touching customer/prospect data."
    }
  };

  const jsonPath = path.join(outputDir, 'ecore-cisco-buyer-group-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`JSON saved: ${jsonPath}`);

  // Print rationale summary
  console.log('\n=== BUYER GROUP RATIONALE ===\n');

  console.log('DECISION MAKERS (2):');
  VERIFIED_BUYER_GROUP.filter(m => m.role === 'decision').forEach(m => {
    console.log(`  ${m.name} - ${m.title}`);
    console.log(`    WHY: ${m.rationale}\n`);
  });

  console.log('CHAMPIONS (4):');
  VERIFIED_BUYER_GROUP.filter(m => m.role === 'champion').forEach(m => {
    console.log(`  ${m.name} - ${m.title}`);
    console.log(`    WHY: ${m.rationale}\n`);
  });

  console.log('STAKEHOLDERS (2):');
  VERIFIED_BUYER_GROUP.filter(m => m.role === 'stakeholder').forEach(m => {
    console.log(`  ${m.name} - ${m.title}`);
    console.log(`    WHY: ${m.rationale}\n`);
  });

  console.log('BLOCKERS (2):');
  VERIFIED_BUYER_GROUP.filter(m => m.role === 'blocker').forEach(m => {
    console.log(`  ${m.name} - ${m.title}`);
    console.log(`    WHY: ${m.rationale}\n`);
  });
}

main();
