#!/usr/bin/env node

/**
 * Adrata → Twilio
 * Sales Intelligence Platform Deal
 * 
 * Full Report - No Blurring
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Verified buyer group for Twilio
const BUYER_GROUP = [
  {
    name: 'Thomas Wyatt',
    title: 'Chief Revenue Officer',
    role: 'decision',
    linkedin: 'https://www.linkedin.com/in/thomasmwyatt/',
    influence: 10,
    reason: 'Ultimate decision maker for revenue tools. Appointed CRO January 2025—new leader looking to make immediate impact. Previously President of Twilio Segment. Owns all revenue teams and go-to-market strategy.',
    personalPain: 'Inherited sales org post-layoffs. Need to grow revenue 15%+ with fewer reps. Board pressure on profitability. Must prove new leadership quickly.',
    motivator: 'Tools that help remaining sales team punch above their weight. Demonstrable ROI. Anything that accelerates time-to-close and improves forecast accuracy.',
    positioning: 'Position Adrata as the force multiplier his leaner team needs. Emphasize BGI\'s ability to identify complete buying committees instantly—critical when you have fewer reps.'
  },
  {
    name: 'John Hartingh',
    title: 'Vice President of Sales Operations',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/johnhartingh/',
    influence: 9,
    reason: 'Appointed VP Sales Ops early 2025. Directly owns sales productivity, tool stack, and process. New to role—looking for quick wins. Will evaluate and champion sales intelligence tools.',
    personalPain: 'Sales productivity metrics under scrutiny post-layoffs. Tool sprawl from years of acquisitions. Need to consolidate and show efficiency gains.',
    motivator: 'Unified platform that reduces tool count. Measurable productivity gains. Easy adoption for sales teams. Integration with existing Salesforce stack.',
    positioning: 'Lead with consolidation story—Adrata replaces 3-4 point solutions. Show productivity metrics from similar enterprise deployments. Offer proof-of-concept with small team.'
  },
  {
    name: 'Libby MacNeil',
    title: 'SVP Worldwide Sales & Go-To-Market',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/libbymacneil/',
    influence: 9,
    reason: 'Since April 2021 leading global sales and GTM. Reports to CRO. Champions tools that help her teams close deals faster. Deep institutional knowledge of what works at Twilio.',
    personalPain: 'Managing global sales teams through restructuring. Need to maintain win rates with smaller team. Complex enterprise deals require multi-threading.',
    motivator: 'Buyer Group Intelligence directly addresses her pain—knowing who to engage across complex enterprise accounts. Global team coordination tools.',
    positioning: 'Show BGI reports for accounts similar to Twilio\'s target customers. Demonstrate how AI identifies complete buying committees. Reference enterprise case studies.'
  },
  {
    name: 'Elizabeth Templeton',
    title: 'Global Director of Revenue Operations',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/elizabethtempleton/',
    influence: 7,
    reason: 'Since January 2021 owning Sales Strategy, Annual Planning, and Programs. Will be key evaluator of any revenue tools. Executes what leadership decides.',
    personalPain: 'Data quality issues across disparate systems. Manual reporting processes. Need better pipeline visibility and forecasting.',
    motivator: 'Clean data, automated insights, accurate forecasting. Tools that integrate with existing stack without adding complexity.',
    positioning: 'Emphasize data enrichment and Prophet forecasting. Show how Adrata improves CRM data quality automatically. Offer integration assessment.'
  },
  {
    name: 'Chris Koehler',
    title: 'Chief Marketing Officer',
    role: 'stakeholder',
    linkedin: 'https://www.linkedin.com/in/chriskoehler/',
    influence: 7,
    reason: 'Appointed CMO May 2024 from Box. 25+ years experience. Sales and marketing alignment is critical. Will want to ensure any sales tool supports ABM and marketing attribution.',
    personalPain: 'Marketing-sales handoff friction. Lead quality debates. Need shared view of target accounts and buyer engagement.',
    motivator: 'Unified account intelligence that both sales and marketing can use. ABM support. Clear attribution and engagement data.',
    positioning: 'Show how BGI bridges sales-marketing gap. Emphasize account-based approach. Reference Box implementation if possible—he knows the brand.'
  },
  {
    name: 'Aidan Viggiano',
    title: 'Chief Financial Officer',
    role: 'blocker',
    linkedin: 'https://www.linkedin.com/in/aidanviggiano/',
    influence: 8,
    reason: 'CFO since March 2023. Driving profitability mandate. All significant spend requires his approval. Will scrutinize ROI heavily given cost-cutting environment.',
    personalPain: 'Pressure to reach GAAP profitability by Q4 2025. Every new expense must show clear ROI. Previous tool investments may have underperformed.',
    motivator: 'Clear, quantifiable ROI model. Proof of cost savings or revenue acceleration. Vendor consolidation that reduces overall spend.',
    positioning: 'Lead with ROI model showing 3x+ return. Frame as cost-saving through consolidation. Offer success-based pricing or pilot structure to reduce risk.'
  },
  {
    name: 'Mark Simms',
    title: 'Chief Technology Officer',
    role: 'blocker',
    linkedin: 'https://www.linkedin.com/in/marksimms/',
    influence: 7,
    reason: 'CTO responsible for technical architecture. Any enterprise tool needs his team\'s approval for security, integration, and data handling compliance.',
    personalPain: 'Technical debt from acquisitions (Segment, etc.). Security scrutiny. Integration complexity with existing systems.',
    motivator: 'Clean API integrations. SOC 2 compliance. No additional security surface area. Minimal IT overhead.',
    positioning: 'Lead with security credentials and integration simplicity. Show Salesforce native integration. Emphasize data privacy and compliance posture.'
  }
];

// Role config
const roleLabels = {
  decision: 'DECISION MAKER',
  champion: 'CHAMPION',
  blocker: 'BLOCKER',
  stakeholder: 'STAKEHOLDER'
};

const roleColors = {
  decision: '#2563eb',  // Adrata Blue
  champion: '#059669',  // Green
  blocker: '#dc2626',   // Red
  stakeholder: '#64748b' // Gray
};

// Group by role
const byRole = { decision: [], champion: [], stakeholder: [], blocker: [] };
BUYER_GROUP.forEach(m => {
  if (byRole[m.role]) byRole[m.role].push(m);
});

const totalMembers = BUYER_GROUP.length;
const decisionMakers = byRole.decision.length;
const champions = byRole.champion.length;
const blockers = byRole.blocker.length;
const stakeholders = byRole.stakeholder.length;

// Generate profile cards with full Pain Intelligence
function generateProfiles() {
  const order = ['decision', 'champion', 'blocker', 'stakeholder'];
  let html = '';
  
  order.forEach(role => {
    const members = byRole[role];
    members.forEach(m => {
      html += `
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-name">${m.name}</div>
            <span class="role-pill" style="background: ${roleColors[role]};">${roleLabels[role]}</span>
          </div>
          <div class="profile-title">${m.title}</div>
          <div class="profile-reason"><strong>Why this person:</strong> ${m.reason}</div>
          <div class="profile-footer">
            ${m.linkedin ? `<a href="${m.linkedin}" class="linkedin-link" target="_blank">LinkedIn →</a>` : '<span class="to-identify">To be identified</span>'}
            <span class="influence">Influence: ${m.influence}/10</span>
          </div>
          <div class="pain-intel">
            <div class="pain-intel-row"><span class="pain-intel-label">Personal Pain:</span> <span class="pain-intel-value">${m.personalPain}</span></div>
            <div class="pain-intel-row"><span class="pain-intel-label">Primary Motivator:</span> <span class="pain-intel-value">${m.motivator}</span></div>
            <div class="pain-intel-row"><span class="pain-intel-label">How to position Adrata:</span> <span class="pain-intel-value">${m.positioning}</span></div>
          </div>
        </div>`;
    });
  });
  
  return html;
}

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence | Adrata → Twilio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #1e293b;
      line-height: 1.5;
    }
    
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 48px;
    }
    
    /* Badge */
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: #0f172a;
      color: white;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-radius: 100px;
      margin-bottom: 24px;
    }
    
    /* Cover */
    .cover-title {
      font-size: 42px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 16px;
      color: #0f172a;
    }
    
    .cover-subtitle {
      font-size: 18px;
      color: #64748b;
      margin-bottom: 48px;
      max-width: 600px;
    }
    
    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      background: #e2e8f0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    
    .stat-box {
      background: #ffffff;
      padding: 16px 12px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    
    .stat-value {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .stat-value.highlight {
      font-size: 32px;
      font-weight: 800;
      color: #2563eb;
    }
    
    /* Section */
    .section {
      margin-top: 48px;
      padding-top: 48px;
      border-top: 1px solid #e2e8f0;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
      color: #0f172a;
    }
    
    .section-subtitle {
      font-size: 15px;
      color: #64748b;
      margin-bottom: 24px;
    }
    
    /* Opportunity */
    .opportunity-text {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      margin-bottom: 24px;
    }
    
    /* Benefits Grid */
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 24px;
    }
    
    .benefit-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 8px;
    }
    
    .benefit-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    
    .benefit-text {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    
    /* Composition */
    .composition {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: #e2e8f0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    
    .comp-item {
      background: #ffffff;
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
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-top: 4px;
    }
    
    /* Profile Cards */
    .profile-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }
    
    .profile-name {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .profile-title {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 12px;
    }
    
    .role-pill {
      padding: 4px 10px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: white;
      border-radius: 100px;
      white-space: nowrap;
    }
    
    .profile-reason {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    
    .profile-reason strong {
      color: #0f172a;
    }
    
    .profile-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }
    
    .linkedin-link {
      font-size: 13px;
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
    
    .linkedin-link:hover { text-decoration: underline; }
    
    .influence {
      font-size: 12px;
      color: #94a3b8;
    }
    
    /* Pain Intelligence - Full (not blurred) */
    .pain-intel {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #e2e8f0;
      background: #f8fafc;
      margin-left: -20px;
      margin-right: -20px;
      margin-bottom: -20px;
      padding: 16px 20px;
      border-radius: 0 0 8px 8px;
    }
    
    .pain-intel-row {
      font-size: 12px;
      margin-bottom: 8px;
      line-height: 1.5;
    }
    
    .pain-intel-row:last-child {
      margin-bottom: 0;
    }
    
    .pain-intel-label {
      font-weight: 700;
      color: #0f172a;
      display: block;
      margin-bottom: 2px;
    }
    
    .pain-intel-value {
      color: #475569;
    }
    
    /* Strategy */
    .strategy-intro {
      font-size: 15px;
      color: #475569;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    
    .strategy-list { list-style: none; }
    
    .strategy-item {
      display: flex;
      gap: 16px;
      padding: 20px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .strategy-item:last-child { border-bottom: none; }
    
    .strategy-number {
      width: 32px;
      height: 32px;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .strategy-content { flex: 1; }
    
    .strategy-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    
    .strategy-text {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 48px;
      margin-top: 48px;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-logo {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #2563eb;
    }
    
    @media print {
      * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
      body { background: white !important; }
      .page { padding: 32px; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Cover Section -->
    <div class="badge">BUYER GROUP INTELLIGENCE</div>
    
    <h1 class="cover-title">Your path into Twilio</h1>
    <p class="cover-subtitle">${totalMembers} key stakeholders identified, mapped, and ready for coordinated outreach. This is your complete buyer group for closing Twilio.</p>
    
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">Seller</div>
        <div class="stat-value">Adrata</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Target Account</div>
        <div class="stat-value">Twilio</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Deal Size</div>
        <div class="stat-value">$250K+</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Product</div>
        <div class="stat-value">Sales Intelligence Platform</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Generated</div>
        <div class="stat-value">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
    </div>
    
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-value highlight">${totalMembers}</div>
        <div class="stat-label">Buyer Group</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">${decisionMakers}</div>
        <div class="stat-label">Decision Makers</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">${champions}</div>
        <div class="stat-label">Champions</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">${blockers}</div>
        <div class="stat-label">Blockers</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">3 mo</div>
        <div class="stat-label">Time Saved</div>
      </div>
    </div>
    
    <!-- The Opportunity -->
    <div class="section">
      <h2 class="section-title">The Opportunity</h2>
      <p class="section-subtitle">Why Twilio Needs Adrata Now</p>
      
      <p class="opportunity-text">
        Twilio is a $4.46B revenue communications platform with 325,000+ customers and 5,500 employees. After three rounds of layoffs (2022-2024), their sales team must do more with less. New CRO Thomas Wyatt (appointed January 2025) is under pressure to grow revenue while the company drives toward GAAP profitability by Q4 2025.
      </p>
      <p class="opportunity-text">
        This creates the perfect environment for Adrata: a lean sales team that needs AI-powered intelligence to identify buying committees faster, close deals more efficiently, and improve forecast accuracy. Their new VP of Sales Operations (John Hartingh, early 2025) is actively evaluating tools—timing is optimal.
      </p>
      
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-title">New Revenue Leadership</div>
          <div class="benefit-text">CRO Thomas Wyatt (Jan 2025) and VP Sales Ops John Hartingh are new to roles—looking for quick wins and willing to evaluate new solutions.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Efficiency Mandate</div>
          <div class="benefit-text">Post-layoff environment means every rep must be more productive. Adrata's AI-powered BGI directly addresses this need.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Tool Consolidation</div>
          <div class="benefit-text">Years of acquisitions (Segment, etc.) created tool sprawl. CFO pushing for vendor consolidation—Adrata replaces 3-4 point solutions.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Profitability Focus</div>
          <div class="benefit-text">GAAP profitability target Q4 2025 means ROI-positive tools get fast approval. Adrata's productivity gains and consolidation story align perfectly.</div>
        </div>
      </div>
    </div>
    
    <!-- Buyer Group Profiles -->
    <div class="section">
      <h2 class="section-title">Buyer Group Profiles</h2>
      <p class="section-subtitle">Each person verified with clear logic for their role in the buying decision</p>
      
      <div class="composition">
        <div class="comp-item">
          <div class="comp-value" style="color: #2563eb;">${decisionMakers}</div>
          <div class="comp-label">Decision Makers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: #059669;">${champions}</div>
          <div class="comp-label">Champions</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: #dc2626;">${blockers}</div>
          <div class="comp-label">Blockers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: #64748b;">${stakeholders}</div>
          <div class="comp-label">Stakeholders</div>
        </div>
      </div>
      
      ${generateProfiles()}
    </div>
    
    <!-- Recommended Strategy -->
    <div class="section">
      <h2 class="section-title">Recommended Strategy</h2>
      <p class="section-subtitle">Multi-Thread Enterprise Approach</p>
      
      <ul class="strategy-list">
        <li class="strategy-item">
          <div class="strategy-number">1</div>
          <div class="strategy-content">
            <div class="strategy-title">Enter Through John Hartingh (VP Sales Ops)</div>
            <div class="strategy-text">New to role and actively evaluating tools. Lead with productivity metrics and consolidation story. Offer proof-of-concept with one sales team. He can champion to Thomas Wyatt.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Build Champion Coalition (Libby + Elizabeth)</div>
            <div class="strategy-text">Libby MacNeil (SVP Sales) has institutional knowledge—get her excited about BGI for complex enterprise deals. Elizabeth Templeton (Rev Ops) will validate data and integration story.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Address Blockers Early (CFO + CTO)</div>
            <div class="strategy-text">Prepare ROI model for Aidan Viggiano (CFO) showing 3x+ return and vendor consolidation savings. Get security documentation to Mark Simms (CTO) before they ask.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Executive Alignment with Thomas Wyatt</div>
            <div class="strategy-text">Once champions aligned and blockers addressed, secure executive presentation with CRO. Frame as "force multiplier for lean sales org" and reference similar enterprise wins.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Include CMO for Long-Term Value</div>
            <div class="strategy-text">Chris Koehler (CMO from Box) will appreciate sales-marketing alignment story. Reference Box if we have that case study. Creates cross-functional buy-in.</div>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">ADRATA</div>
    </div>
  </div>
</body>
</html>`;

// Save and generate PDF
async function run() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const htmlFile = path.join(outputDir, `adrata-twilio-${new Date().toISOString().split('T')[0]}.html`);
  fs.writeFileSync(htmlFile, html);
  console.log(`HTML saved: ${htmlFile}`);
  
  console.log('Generating PDF...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const pdfPath = '/Users/rosssylvester/Desktop/Adrata-Twilio-BuyerGroup.pdf';
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  await browser.close();
  console.log(`PDF saved: ${pdfPath}`);
  
  console.log(`\nBuyer Group: ${totalMembers} | Decision: ${decisionMakers} | Champions: ${champions} | Blockers: ${blockers}`);
}

run().catch(console.error);

