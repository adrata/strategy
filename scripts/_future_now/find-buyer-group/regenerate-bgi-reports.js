#!/usr/bin/env node

/**
 * Regenerate BGI Reports using Cardinal Gray Style Template
 * Generates HTML and PDF reports for all buyer groups
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const OUTPUT_DIR = path.join(__dirname, 'output');
const DESKTOP_PATH = '/Users/rosssylvester/Desktop';

// Report configurations
const REPORTS = [
  {
    id: 'ramp-payentry',
    jsonFile: 'ramp-payentry-buyer-group-2025-12-16.json',
    seller: { name: 'Ramp', primary: '#1A1A1A', accent: '#FCC732', textOnPrimary: '#FCC732' }, // Ramp: Black with gold accent
    buyer: { name: 'PayEntry' },
    dealSize: '$50K',
    product: 'Expense Management',
    opportunityText: [
      'PayEntry is a leading payroll and HCM solutions provider serving businesses across the United States. Their recent merger with Corporate Payroll Services has expanded their operations significantly, creating the perfect timing for Ramp\'s expense management and corporate card solutions.',
      'With growing client demands and operational complexity, PayEntry needs streamlined expense management to maintain competitive advantage. Ramp\'s platform offers automated expense reporting, real-time spend visibility, and seamless integration with existing payroll systems.'
    ],
    benefits: [
      { title: 'Seamless Payroll Integration', text: 'Integrate expense data directly into payroll processing for accurate reimbursements and tax compliance.' },
      { title: 'Real-Time Spend Visibility', text: 'Give clients complete visibility into corporate spending with automated categorization and reporting.' },
      { title: 'Automated Expense Policies', text: 'Reduce manual review with AI-powered policy enforcement and approval workflows.' },
      { title: 'Cost Reduction', text: 'Save on processing costs and eliminate late fees with automated bill pay and smart payment scheduling.' }
    ],
    strategy: [
      { title: 'Target CFO and VP Finance with ROI', text: 'Lead with cost savings and operational efficiency. Ramp customers save an average of 5% on spend through automated controls and negotiated vendor rates.' },
      { title: 'Engage Operations & Product Teams', text: 'Demonstrate how Ramp integrates seamlessly with existing payroll systems and can be offered as a value-add service to PayEntry clients.' },
      { title: 'Address Compliance Early', text: 'Proactively share SOC 2 Type II certification and financial compliance documentation to prevent late-stage blockers.' },
      { title: 'Build Partnership Opportunity', text: 'Position as a strategic partnership where PayEntry can offer Ramp\'s expense management to their client base as an upsell opportunity.' },
      { title: 'Enable Technical Evaluation', text: 'Provide API documentation and sandbox access for the product team to evaluate integration capabilities.' }
    ]
  },
  {
    id: 'valence-freshworks',
    jsonFile: 'valence-freshworks-buyer-group-2025-12-16.json',
    seller: { name: 'Valence Security', primary: '#7C3AED', accent: '#A855F7', textOnPrimary: '#FFFFFF' }, // Valence: Purple/violet gradient
    buyer: { name: 'Freshworks' },
    dealSize: '$75K',
    product: 'SaaS Security',
    opportunityText: [
      'Freshworks is a major SaaS company with 5,000+ employees and multiple products including Freshdesk, Freshsales, and Freshservice. As a public company (NASDAQ: FRSH), they face intense scrutiny over security practices and third-party integrations.',
      'With hundreds of SaaS applications and OAuth integrations across their organization, Freshworks is a prime target for supply chain attacks. Valence Security\'s SSPM platform provides the visibility and control they need to secure their SaaS ecosystem.'
    ],
    benefits: [
      { title: 'SaaS-to-SaaS Visibility', text: 'Discover all third-party integrations, OAuth tokens, and shadow IT across the organization.' },
      { title: 'Risk Remediation', text: 'Automatically identify and remediate risky app permissions and over-privileged access.' },
      { title: 'Compliance Automation', text: 'Maintain SOC 2, GDPR, and ISO 27001 compliance with continuous monitoring and reporting.' },
      { title: 'Supply Chain Protection', text: 'Prevent supply chain attacks by monitoring and controlling SaaS integrations and data flows.' }
    ],
    strategy: [
      { title: 'Target CISO and Security Leadership', text: 'Lead with risk reduction and compliance automation. Freshworks as a public company needs bulletproof security posture for investor confidence.' },
      { title: 'Engage IT and DevOps Champions', text: 'Demonstrate how Valence provides visibility without disrupting productivity. Show the shadow IT discovery capabilities.' },
      { title: 'Address Procurement Early', text: 'Provide security questionnaire responses and compliance certifications upfront to accelerate vendor review.' },
      { title: 'Build Board-Level Case', text: 'Position as essential infrastructure for preventing the next SolarWinds-style attack. Reference recent SaaS supply chain incidents.' },
      { title: 'Enable POC with Quick Wins', text: 'Offer a discovery-only POC that reveals risky integrations within 24 hours. Quick wins build internal momentum.' }
    ]
  },
  {
    id: 'scientific-bio-iff',
    jsonFile: 'scientific-bio-iff-buyer-group-2025-12-17.json',
    seller: { name: 'Scientific Bioprocessing', primary: '#0077B5', accent: '#00A3E0', textOnPrimary: '#FFFFFF' }, // SBI: Scientific blue
    buyer: { name: 'IFF' },
    dealSize: '$50K',
    product: 'Bioprocess Sensors',
    opportunityText: [
      'IFF (International Flavors & Fragrances) is a Fortune 500 company and global leader in biosciences, with significant R&D and manufacturing operations that rely heavily on bioprocessing and fermentation. Their 2021 acquisition of DuPont Nutrition & Biosciences expanded their biotechnology capabilities significantly.',
      'Scientific Bioprocessing\'s advanced sensors and fermentation platforms are directly aligned with IFF\'s need for optimizing bioprocesses, improving R&D efficiency, and ensuring product quality. Real-time monitoring of pH, DO, and biomass can accelerate their process development and scale-up operations.'
    ],
    benefits: [
      { title: 'Accelerated R&D', text: 'Real-time data from sensors enables faster experimentation and optimization of bioprocesses.' },
      { title: 'Enhanced Process Control', text: 'Continuous monitoring of critical parameters maximizes yields and product quality.' },
      { title: 'Reduced Contamination Risk', text: 'Non-invasive sensor technology minimizes handling and exposure in sterile environments.' },
      { title: 'Data Integrity & Compliance', text: 'Automated data collection supports regulatory compliance and provides defensible audit trails.' }
    ],
    strategy: [
      { title: 'Target R&D Leadership with Innovation', text: 'Position as a partner that enables breakthrough research and accelerates time-to-market. Highlight how real-time data and advanced platforms drive R&D efficiency.' },
      { title: 'Empower Scientists with Practical Benefits', text: 'Demonstrate tangible benefits for daily lab work: easier setup, more reliable data, reduced manual sampling, and improved reproducibility.' },
      { title: 'Address Quality & Compliance', text: 'Emphasize how non-invasive monitoring improves data integrity and supports audit trails for regulated products.' },
      { title: 'Engage Procurement with Scalability', text: 'Highlight long-term cost savings from optimized processes, reduced material waste, and scalability from R&D to production.' },
      { title: 'Showcase Integration Capabilities', text: 'Provide details on integration with existing bioreactors, data acquisition systems, and lab management software.' }
    ]
  }
];

// CSS Template (Cardinal Gray Style)
const CSS_TEMPLATE = `
:root {
  --primary: {PRIMARY_COLOR};
  --primary-dark: {PRIMARY_DARK};
  --accent: {ACCENT_COLOR};
  --text-on-primary: {TEXT_ON_PRIMARY};
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
  grid-template-columns: repeat(5, 1fr);
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
  color: var(--accent);
}

.hero-stat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-top: 4px;
}

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
  color: var(--primary);
}

.benefit-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

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

.profile-title {
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

.phone {
  font-size: 11px;
  color: var(--text-secondary);
}

.linkedin-link {
  font-size: 11px;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.linkedin-link:hover {
  text-decoration: underline;
}

.influence {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.phone-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.phone-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.phone-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.phone-list {
  background: var(--bg-muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.phone-row {
  display: grid;
  grid-template-columns: 1fr 140px 160px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  align-items: center;
}

.phone-row:last-child {
  border-bottom: none;
}

.phone-name {
  font-weight: 600;
}

.phone-role {
  font-size: 11px;
  color: var(--text-secondary);
}

.phone-number {
  font-family: 'SF Mono', monospace;
  font-size: 13px;
  color: var(--primary);
  text-align: right;
}

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
  color: var(--text-on-primary);
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

.footer {
  text-align: center;
  padding-top: 48px;
  margin-top: 48px;
  border-top: 1px solid var(--border);
}

.footer-logo {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--accent);
}

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
`;

const roleLabels = {
  decision: 'DECISION MAKER',
  champion: 'CHAMPION',
  blocker: 'BLOCKER',
  stakeholder: 'STAKEHOLDER',
  introducer: 'STAKEHOLDER'
};

const roleColors = {
  decision: '#dc2626',
  champion: '#16a34a',
  blocker: '#f97316',
  stakeholder: '#3b82f6',
  introducer: '#8b5cf6'
};

function darkenColor(hex, amount = 0.2) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function generateProfilesHtml(members) {
  const order = ['decision', 'champion', 'blocker', 'stakeholder', 'introducer'];
  let html = '';
  
  order.forEach(role => {
    const filteredMembers = members.filter(m => (m.buyerGroupRole || m.role) === role);
    filteredMembers.forEach(m => {
      const phone = m.phone && m.phone.trim() ? m.phone : null;
      const linkedin = m.linkedinUrl || m.linkedin;
      const influence = m.influence || m.roleConfidence ? Math.round((m.roleConfidence || 70) / 10) : 7;
      
      html += `
      <div class="profile-card">
        <div class="profile-info">
          <div class="profile-name">${m.name}</div>
          <div class="profile-title">${m.title}</div>
        </div>
        <div class="profile-meta">
          <span class="role-badge" style="background: ${roleColors[role]};">${roleLabels[role]}</span>
          ${phone ? `<span class="phone">${phone}</span>` : ''}
          ${linkedin ? `<a href="${linkedin}" class="linkedin-link" target="_blank">LinkedIn</a>` : ''}
        </div>
        <div class="influence">Influence: ${influence}/10</div>
      </div>`;
    });
  });
  return html;
}

function generatePhoneListHtml(members) {
  const withPhones = members.filter(m => m.phone && m.phone.trim());
  if (withPhones.length === 0) return '';
  
  let html = '<div class="phone-section"><h3>Verified Phone Numbers</h3><p class="phone-subtitle">Direct dial contacts for immediate outreach</p><div class="phone-list">';
  
  withPhones.forEach(m => {
    const role = m.buyerGroupRole || m.role || 'stakeholder';
    html += `
    <div class="phone-row">
      <span class="phone-name">${m.name}</span>
      <span class="phone-role">${roleLabels[role]}</span>
      <span class="phone-number">${m.phone}</span>
    </div>`;
  });
  
  html += '</div></div>';
  return html;
}

function generateHTML(config, data) {
  const members = data.buyerGroup?.members || data.buyerGroup || [];
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Calculate stats
  const totalMembers = members.length;
  const decisionMakers = members.filter(m => (m.buyerGroupRole || m.role) === 'decision').length;
  const champions = members.filter(m => (m.buyerGroupRole || m.role) === 'champion').length;
  const blockers = members.filter(m => (m.buyerGroupRole || m.role) === 'blocker').length;
  const stakeholders = members.filter(m => ['stakeholder', 'introducer'].includes(m.buyerGroupRole || m.role)).length;
  const phonesCount = members.filter(m => m.phone && m.phone.trim()).length;
  
  const css = CSS_TEMPLATE
    .replace(/{PRIMARY_COLOR}/g, config.seller.primary)
    .replace(/{PRIMARY_DARK}/g, darkenColor(config.seller.primary))
    .replace(/{ACCENT_COLOR}/g, config.seller.accent || config.seller.primary)
    .replace(/{TEXT_ON_PRIMARY}/g, config.seller.textOnPrimary || '#FFFFFF');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence | ${config.seller.name} → ${config.buyer.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <div class="page">
    <!-- Cover Page -->
    <div class="cover">
      <div class="cover-header">
        <div class="label">Buyer Group Intelligence</div>
        <h1 class="cover-title">Your path into ${config.buyer.name}</h1>
        <p class="cover-subtitle">${totalMembers} key stakeholders identified, mapped, and ready for coordinated outreach. This is your complete buyer group for closing ${config.buyer.name}.</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Seller</div>
          <div class="stat-value">${config.seller.name}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Target Account</div>
          <div class="stat-value">${config.buyer.name}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Deal Size</div>
          <div class="stat-value">${config.dealSize}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Product</div>
          <div class="stat-value">${config.product}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Generated</div>
          <div class="stat-value">${date}</div>
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
        <div class="hero-stat">
          <div class="hero-stat-value">${phonesCount}</div>
          <div class="hero-stat-label">Direct Phones</div>
        </div>
      </div>
    </div>
    
    <!-- The Opportunity -->
    <div class="section page-break">
      <h2 class="section-title">The Opportunity</h2>
      <p class="section-subtitle">Why This Account Matters</p>
      
      ${config.opportunityText.map(text => `<p class="opportunity-text">${text}</p>`).join('\n      ')}
      
      <div class="benefits-grid">
        ${config.benefits.map(b => `
        <div class="benefit-card">
          <div class="benefit-title">${b.title}</div>
          <div class="benefit-text">${b.text}</div>
        </div>`).join('')}
      </div>
    </div>
    
    <!-- Buyer Group Composition -->
    <div class="section page-break">
      <h2 class="section-title">Buyer Group Composition</h2>
      
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
      
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Buyer Group Profiles</h3>
      
      <div class="profiles-grid">
        ${generateProfilesHtml(members)}
      </div>
      
      ${generatePhoneListHtml(members)}
    </div>
    
    <!-- Recommended Strategy -->
    <div class="section page-break">
      <h2 class="section-title">Recommended Strategy</h2>
      <p class="section-subtitle">Multi-Thread Enterprise Approach</p>
      <p class="opportunity-text" style="margin-bottom: 24px;">
        Execute coordinated outreach to build momentum across the organization. Lead with pain, follow with champions, and engage blockers early.
      </p>
      
      <ul class="strategy-list">
        ${config.strategy.map((s, i) => `
        <li class="strategy-item">
          <div class="strategy-number">${i + 1}</div>
          <div class="strategy-content">
            <div class="strategy-title">${s.title}</div>
            <div class="strategy-text">${s.text}</div>
          </div>
        </li>`).join('')}
      </ul>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">${config.seller.name.toUpperCase()}</div>
    </div>
  </div>
</body>
</html>`;
}

async function generateReports() {
  console.log('='.repeat(60));
  console.log('BGI REPORT REGENERATION - CARDINAL GRAY STYLE');
  console.log('='.repeat(60));
  console.log('');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  for (const config of REPORTS) {
    console.log(`\nProcessing: ${config.seller.name} → ${config.buyer.name}`);
    
    const jsonPath = path.join(OUTPUT_DIR, config.jsonFile);
    if (!fs.existsSync(jsonPath)) {
      console.log(`  ⚠️  JSON file not found: ${config.jsonFile}`);
      continue;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const html = generateHTML(config, data);
      
      // Save HTML to output folder
      const htmlFilename = `${config.id}-cardinal-style.html`;
      const htmlPath = path.join(OUTPUT_DIR, htmlFilename);
      fs.writeFileSync(htmlPath, html);
      console.log(`  ✅ HTML saved: ${htmlFilename}`);
      
      // Save HTML to Desktop
      const desktopHtmlFilename = `${config.seller.name.replace(/\s+/g, '-')}-${config.buyer.name.replace(/\s+/g, '-')}-BGI-Report.html`;
      const desktopHtmlPath = path.join(DESKTOP_PATH, desktopHtmlFilename);
      fs.writeFileSync(desktopHtmlPath, html);
      console.log(`  ✅ Desktop HTML: ${desktopHtmlFilename}`);
      
      // Generate PDF
      const page = await browser.newPage();
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for fonts
      
      const desktopPdfFilename = `${config.seller.name.replace(/\s+/g, '-')}-${config.buyer.name.replace(/\s+/g, '-')}-BGI-Report.pdf`;
      const desktopPdfPath = path.join(DESKTOP_PATH, desktopPdfFilename);
      
      await page.pdf({
        path: desktopPdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '24px', right: '24px', bottom: '24px', left: '24px' }
      });
      
      await page.close();
      
      const pdfSize = (fs.statSync(desktopPdfPath).size / 1024).toFixed(1);
      console.log(`  ✅ Desktop PDF: ${desktopPdfFilename} (${pdfSize} KB)`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\nAll reports saved to: ${DESKTOP_PATH}`);
}

generateReports().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

