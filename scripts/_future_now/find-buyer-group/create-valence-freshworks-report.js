/**
 * Create Valence Security → Freshworks Buyer Group Report
 * Generated December 2025
 */

const fs = require('fs');
const path = require('path');

// VERIFIED FRESHWORKS BUYER GROUP (researched Dec 2025)
const VERIFIED_BUYER_GROUP = [
  // DECISION MAKERS
  {
    name: 'Jason Loomis',
    title: 'Chief Information Security Officer (CISO)',
    role: 'decision',
    department: 'Information Security',
    linkedin: 'https://www.linkedin.com/in/jasonloomis1/',
    insight: 'Joined Freshworks in 2022 with 20+ years in cybersecurity leadership. Previously CISO at MINDBODY and TechStyle Fashion Group (Fabletics, Savage X Fenty). Described as "one of the most visionary and approachable CISOs" with rare ability to align security with business strategy.',
    painPoint: 'As CISO of a public SaaS company, he\'s responsible for securing dozens of business-critical SaaS applications across the organization. Shadow SaaS, misconfigurations, and unmanaged integrations create blind spots. He needs comprehensive SSPM visibility to protect Freshworks\' own infrastructure while the company sells security-conscious software to 72,000+ customers.',
    rationale: 'Primary budget owner for security tools. SSPM and SaaS security fall directly under his mandate. His experience at multiple SaaS companies means he understands the complexity of securing a SaaS-heavy environment.'
  },
  {
    name: 'Ashwin Ballal',
    title: 'Chief Information Officer (CIO)',
    role: 'decision',
    department: 'Information Technology',
    linkedin: 'https://www.linkedin.com/in/ashwinballal/',
    insight: 'Appointed CIO in May 2024 with nearly 30 years of leadership experience. Previously EVP & CIO at Medallia where he transformed IT, security, workplace services, and corporate procurement. Earlier spent 15 years at KLA-Tencor as VP & Chief Information, Intelligence and Data Officer.',
    painPoint: 'Owns the enterprise SaaS stack that powers Freshworks\' 4,400+ employees globally. Every SaaS application introduces configuration drift, identity sprawl, and integration risks. His Medallia experience taught him that IT and security must work together—he needs tools that give both teams visibility without slowing down the business.',
    rationale: 'Controls IT budget and SaaS procurement decisions. His dual experience in IT and security leadership at Medallia makes him uniquely positioned to evaluate SSPM solutions that bridge both functions.'
  },

  // CHAMPIONS
  {
    name: 'Murali Swaminathan',
    title: 'Chief Technology Officer (CTO)',
    role: 'champion',
    department: 'Engineering',
    linkedin: 'https://www.linkedin.com/in/muraliswaminathan/',
    insight: 'Joined as CTO in September 2024 with 30+ years in software engineering. Previously VP of Engineering at ServiceNow overseeing IT Service Management products. Leads Freshworks\' technology roadmap, global engineering, and architecture teams.',
    painPoint: 'Engineering teams use GitHub, AWS, and dozens of developer tools daily. Each tool has its own permissions, API tokens, and service accounts creating non-human identity sprawl. His ServiceNow background means he understands enterprise security requirements—he needs to ensure engineering tools are configured securely without slowing developer velocity.',
    rationale: 'Engineering organization is a major consumer of SaaS applications with complex configurations. His ServiceNow ITSM experience gives him deep appreciation for security posture management. Would champion a solution that protects engineering tools.'
  },
  {
    name: 'Prakash K.',
    title: 'Director, IT Security, Infrastructure and Operations',
    role: 'champion',
    department: 'IT Security',
    linkedin: 'https://www.linkedin.com/in/prakash-k-447a7013/',
    insight: 'Leads IT security, infrastructure, and operations at Freshworks. Passionate cybersecurity professional with expertise in global network architecture, cloud infrastructure strategy, and IT operations. Focus on embedding security essentials and ensuring data protection and compliance.',
    painPoint: 'Responsible for day-to-day security operations across infrastructure and SaaS applications. Manual configuration reviews don\'t scale when the company uses dozens of SaaS apps across 13 global locations. He needs automated misconfiguration detection and remediation to keep pace with business growth while maintaining security posture.',
    rationale: 'Hands-on security operations leader who would evaluate, implement, and manage an SSPM solution daily. His infrastructure background means he understands the complexity of securing cloud and SaaS environments.'
  },
  {
    name: 'Parastoo Sanadi',
    title: 'Director, Security Compliance',
    role: 'champion',
    department: 'Security & Compliance',
    linkedin: 'https://www.linkedin.com/in/parastoo-sanadi-cisa-88951726/',
    insight: 'CISA-certified compliance and security leader at Freshworks. Recognized for creating elite compliance and security teams. Every audit under her leadership improved the company\'s security posture beyond compliance requirements.',
    painPoint: 'As a public company (NASDAQ: FRSH), Freshworks faces SOX compliance, SOC 2 audits, and customer security questionnaires constantly. She needs continuous compliance monitoring across all SaaS applications—not point-in-time audits. Automated evidence collection for NIST, ISO, and CIS benchmarks would transform audit preparation from weeks to hours.',
    rationale: 'Compliance requirements drive many security purchases. Her CISA certification and track record of exceeding compliance requirements means she would champion tools that provide continuous compliance visibility.'
  },

  // STAKEHOLDERS
  {
    name: 'Shafiq Amarsi',
    title: 'SVP, Go-to-Market Strategy and Operations',
    role: 'stakeholder',
    department: 'GTM Operations',
    linkedin: 'https://www.linkedin.com/in/shafiqamarsi/',
    insight: 'Oversees sales and marketing operations, strategy, program management, sales enablement, and IT. Previously spent 8 years at AWS leading worldwide sales strategy, operations, and enablement teams during hyper-growth phase.',
    painPoint: 'His team relies on Salesforce, HubSpot, Outreach, and dozens of GTM SaaS tools. Each system contains sensitive customer and pipeline data. Misconfigured sharing settings or excessive permissions could expose competitive intelligence. He needs assurance that GTM tools are secured without impacting sales productivity.',
    rationale: 'GTM operations uses high-value SaaS applications with sensitive business data. His IT oversight role means he has input on tools that affect sales and marketing operations. Would provide stakeholder perspective on business impact.'
  },
  {
    name: 'Srinivasan Raghavan',
    title: 'Chief Product Officer (CPO)',
    role: 'stakeholder',
    department: 'Product',
    linkedin: 'https://www.linkedin.com/in/srinivasanraghavan/',
    insight: 'Appointed CPO in December 2024 with 20+ years in enterprise SaaS. Leads product strategy and vision, reporting directly to CEO Dennis Woodside. Responsible for Freshworks\' product roadmap including Freshservice (ITSM) and security-related features.',
    painPoint: 'Freshworks sells software to 72,000+ companies who ask about Freshworks\' own security practices. Product teams use Figma, Jira, Confluence, and developer tools with complex permissions. He needs confidence that internal tools are secured—because customers will ask how Freshworks practices what it preaches.',
    rationale: 'Product organization is a major SaaS consumer. Customer security questionnaires often ask about vendor\'s internal security practices. Would provide input on how security posture affects product credibility.'
  },

  // BLOCKERS
  {
    name: 'Tyler Sloat',
    title: 'Chief Financial Officer & Chief Operating Officer',
    role: 'blocker',
    department: 'Finance & Operations',
    linkedin: 'https://www.linkedin.com/in/tylersloat/',
    insight: 'CFO since 2020, expanded to CFO/COO in 2024. Oversees finance, legal, IT, corporate strategy, and revenue enablement. Previously CFO at Zuora guiding them through IPO. Stanford MBA, California CPA. Board member at multiple companies.',
    painPoint: 'Every new vendor adds complexity to procurement and legal review. He needs to validate ROI—does this reduce audit costs, prevent breaches, or improve efficiency? His dual CFO/COO role means he evaluates both financial and operational impact. Security tools must demonstrate measurable business value, not just technical capability.',
    rationale: 'Ultimate budget authority for enterprise purchases. His expanded COO role means he oversees IT and operations, giving him direct influence on security tool decisions. Will scrutinize ROI and total cost of ownership.'
  },
  {
    name: 'Dennis Woodside',
    title: 'Chief Executive Officer & President',
    role: 'blocker',
    department: 'Executive',
    linkedin: 'https://www.linkedin.com/in/denniswoodside/',
    insight: 'CEO since May 2024, previously President since 2022. Former COO at Dropbox ($250M to $1.3B revenue, successful IPO). Previously CEO of Motorola Mobility after Google acquisition. Various leadership roles at Google 2003-2014.',
    painPoint: 'As CEO of a public company, he\'s accountable to shareholders and customers for security. A breach would damage Freshworks\' reputation and stock price. His Dropbox and Google experience means he understands the stakes of enterprise security. He needs confidence that the security team has the tools to protect the company.',
    rationale: 'Enterprise security purchases at public companies often require CEO awareness or approval. His background at security-conscious companies (Google, Dropbox) means he understands the importance of security tooling. Would be informed of significant security investments.'
  }
];

// Context
const CONTEXT = {
  seller: {
    name: 'Valence Security',
    website: 'https://valencesecurity.com',
    product: 'SaaS Security Platform (SSPM + ITDR)',
    description: 'The only SaaS security platform delivering comprehensive SSPM, advanced risk remediation, and Identity Threat Detection & Response with AI governance capabilities',
    keyFeatures: [
      'SaaS Security Posture Management (SSPM)',
      'Identity Threat Detection & Response (ITDR)',
      'Automated misconfiguration remediation',
      'SaaS-to-SaaS integration risk analysis',
      'GenAI governance and shadow AI detection',
      'Business user collaboration workflows',
      'NIST, ISO, CIS compliance mapping',
      'Microsoft Copilot for Security integration'
    ],
    brandColors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899'
    }
  },
  buyer: {
    name: 'Freshworks',
    website: 'https://www.freshworks.com',
    industry: 'Enterprise SaaS / Business Software',
    employeeCount: 4400,
    revenue: '$720M (2024)',
    headquarters: 'San Mateo, CA',
    ticker: 'NASDAQ: FRSH'
  },
  deal: {
    estimatedSize: '$75,000 - $120,000',
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
    case 'decision': return '#6366F1';
    case 'champion': return '#8B5CF6';
    case 'blocker': return '#6B7280';
    case 'stakeholder': return '#EC4899';
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
  <title>Buyer Group Intelligence: Valence Security → Freshworks</title>
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
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
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
    .feature-list li svg { color: #6366F1; flex-shrink: 0; margin-top: 2px; }

    .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 48px; }
    @media (max-width: 768px) { .summary-stats { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-number { font-size: 36px; font-weight: 700; color: #6366F1; margin-bottom: 4px; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #333; }
    .section-header h2 { font-size: 20px; font-weight: 600; color: #fff; }
    .section-count { background: #6366F1; color: #fff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px; }

    .person-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 48px; }
    @media (max-width: 900px) { .person-grid { grid-template-columns: 1fr; } }
    .person-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; transition: border-color 0.2s; }
    .person-card:hover { border-color: #6366F1; }
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
    .person-pain-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6366F1; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .person-pain-content { font-size: 13px; color: #bbb; line-height: 1.5; filter: blur(5px); user-select: none; pointer-events: none; }
    .person-pain-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); }
    .unlock-badge { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }

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
      <h1>Valence Security → Freshworks</h1>
      <div class="header-subtitle">SaaS Security Platform (SSPM + ITDR)</div>
      <div class="header-meta">
        <div class="header-meta-item">
          <div class="header-meta-label">Deal Size</div>
          <div class="header-meta-value">${CONTEXT.deal.estimatedSize}</div>
        </div>
        <div class="header-meta-item">
          <div class="header-meta-label">Target Company</div>
          <div class="header-meta-value">Freshworks (${CONTEXT.buyer.employeeCount.toLocaleString()} employees)</div>
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
        <p>Public SaaS company (${CONTEXT.buyer.ticker}) providing customer and employee experience software. ${CONTEXT.buyer.revenue} revenue.</p>
        <ul class="feature-list">
          <li>${icons.check} ${CONTEXT.buyer.employeeCount.toLocaleString()} employees globally</li>
          <li>${icons.check} Headquarters: ${CONTEXT.buyer.headquarters}</li>
          <li>${icons.check} Industry: ${CONTEXT.buyer.industry}</li>
          <li>${icons.check} 72,000+ customers including Fortune 500</li>
          <li>${icons.check} Products: Freshservice, Freshdesk, Freshsales</li>
          <li>${icons.check} 13 global office locations</li>
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
      <div class="footer-brand">Buyer Group Intelligence | Valence Security</div>
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
  console.log('Generating Valence Security → Freshworks Buyer Group Report...\n');

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Generate HTML
  const html = generateHTML();
  const htmlPath = path.join(outputDir, 'valence-freshworks-buyer-group-2025-12-19.html');
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
      decisionMakers: "CISO and CIO control security and IT budgets respectively. SSPM falls at the intersection of both—security tooling that protects IT-managed SaaS applications. Both must approve for enterprise security purchases at a public company.",
      champions: "CTO owns engineering tools security, Director of IT Security handles day-to-day operations, and Director of Compliance drives audit requirements. Each has a distinct use case for SSPM that makes them natural advocates.",
      stakeholders: "SVP GTM Ops and CPO lead teams that are heavy SaaS consumers. They provide business context on which applications matter most and how security tools affect productivity. Their input shapes requirements.",
      blockers: "CFO/COO controls budget and evaluates ROI for all enterprise purchases. CEO is accountable to shareholders for security posture. Both must be convinced of business value for significant security investments at a public company."
    }
  };

  const jsonPath = path.join(outputDir, 'valence-freshworks-buyer-group-2025-12-19.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`JSON saved: ${jsonPath}`);

  console.log('\n=== BUYER GROUP SUMMARY ===\n');
  console.log(`Total: ${VERIFIED_BUYER_GROUP.length} contacts`);
  console.log(`Decision Makers: ${VERIFIED_BUYER_GROUP.filter(m => m.role === 'decision').length}`);
  console.log(`Champions: ${VERIFIED_BUYER_GROUP.filter(m => m.role === 'champion').length}`);
  console.log(`Stakeholders: ${VERIFIED_BUYER_GROUP.filter(m => m.role === 'stakeholder').length}`);
  console.log(`Blockers: ${VERIFIED_BUYER_GROUP.filter(m => m.role === 'blocker').length}`);
}

main();
