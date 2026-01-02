#!/usr/bin/env node

/**
 * Mantra Health → Western Governors University
 * $1.4M Enterprise Mental Health Platform
 * 
 * EXACT Cardinal Gray Light Theme Style (matching HR Acuity → Google report)
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Verified buyer group
const BUYER_GROUP = [
  {
    name: 'Scott D. Pulsipher',
    title: 'President and Chief Executive Officer',
    role: 'decision',
    linkedin: 'https://www.linkedin.com/in/scott-pulsipher-5735143/',
    influence: 10,
    reason: 'Ultimate decision maker for $1.4M. President since 2016. MBA from Harvard. Led growth to 192K students. Mission: access for underserved. 74% of students are underserved—mental health is mission-aligned.'
  },
  {
    name: 'Dr. Courtney Hills McBeth',
    title: 'Chief Academic Officer and Provost',
    role: 'decision',
    linkedin: 'https://www.linkedin.com/in/courtney-hills-mcbeth-34973b2/',
    influence: 10,
    reason: 'Academic co-decision maker for $1.4M. Joined Jan 2024 from Strada (workforce focus). Ph.D. from UPenn. Mental health impacts academic performance and accreditation. Signs off on student success investments.'
  },
  {
    name: 'Debbie Fowler, J.D.',
    title: 'Senior Vice President of Academic Delivery',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/debbie-fowler-a86a949b/',
    influence: 10,
    reason: 'Primary internal champion. Oversees 2,900 faculty/staff. Author of "Fostering Connection in Higher Ed" (Nov 2024). Mental health is #1 dropout reason—directly impacts her retention metrics.'
  },
  {
    name: 'Jason Levin',
    title: 'Executive Director, WGU Labs',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/jasonhlevin/',
    influence: 9,
    reason: 'Innovation champion. Already piloted Flourish Labs Peers.net with 85%+ positive feedback. Former VP of Institutional Research. Looking to scale beyond pilots to enterprise solution.'
  },
  {
    name: 'Dr. Stacey Ludwig Johnson',
    title: 'SVP & Executive Dean, School of Education',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/stacey-ludwig-johnson-0bba1715/',
    influence: 9,
    reason: '25+ years at WGU since 1998. Leads nation\'s largest education school. Her students (teachers) face high burnout. Can champion pilot program for enterprise rollout.'
  },
  {
    name: 'Anmy Tran Mayfield',
    title: 'VP & Dean, College of Nursing, School of Health',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/anmy-mayfield/',
    influence: 8,
    reason: 'Appointed March 2024. First-generation graduate. Nursing students face highest stress. Led 10-year CCNE reaccreditation. School of Health ideal pilot for high-need population.'
  },
  {
    name: 'David Morales, MBA',
    title: 'SVP of Technology and CIO',
    role: 'blocker',
    linkedin: 'https://www.linkedin.com/in/moralesdavid/',
    influence: 9,
    reason: 'Critical technical gatekeeper. CIO since 2018. Former Walmart engineering leader. CIO 100 Award winner. Mental health requires HIPAA compliance. Gate on architecture and AI strategy alignment.'
  },
  {
    name: 'Chief Financial Officer',
    title: 'CFO / VP Finance',
    role: 'blocker',
    linkedin: null,
    influence: 9,
    reason: 'Financial gatekeeper. $1.4M requires CFO approval. Must validate ROI: $1.4M / 192K students = $7.29/student. Show 2-3 year payback via retention improvement.'
  },
  {
    name: 'General Counsel',
    title: 'General Counsel / VP Legal',
    role: 'blocker',
    linkedin: null,
    influence: 8,
    reason: 'Legal gatekeeper. HIPAA requires BAA with liability allocation. Multi-state telehealth compliance (50 states). Proactively share compliance documentation to prevent late-stage delays.'
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
  decision: '#6B46C1',  // Mantra Purple
  champion: '#319795',  // Mantra Teal
  blocker: '#DD6B20',   // Orange
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

// Generate profile cards
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
            <div class="pain-intel-row"><span class="pain-intel-label">Personal Pain:</span> <span class="pain-intel-blur">████████████████████████████████████████████████████</span></div>
            <div class="pain-intel-row"><span class="pain-intel-label">Primary Motivator:</span> <span class="pain-intel-blur">██████████████████████████████████████████████</span></div>
            <div class="pain-intel-row"><span class="pain-intel-label">How to position Mantra:</span> <span class="pain-intel-blur">████████████████████████████████████████████████████████</span></div>
          </div>
        </div>`;
    });
  });
  
  return html;
}

// Generate HTML - EXACT Cardinal Gray Light Theme
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence | Mantra Health → WGU | $1.4M</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #1e293b;
      line-height: 1.5;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }
    
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
    
    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f5f3ff;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #6B46C1;
      margin-bottom: 24px;
    }
    
    .badge::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #6B46C1;
      border-radius: 50%;
    }
    
    /* Cover */
    .cover-title {
      font-size: 36px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    
    .cover-subtitle {
      font-size: 16px;
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
      color: #6B46C1;
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
    .profiles-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #0f172a;
    }
    
    .profiles-subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 20px;
    }
    
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
      color: #6B46C1;
      text-decoration: none;
      font-weight: 600;
    }
    
    .linkedin-link:hover { text-decoration: underline; }
    
    .to-identify {
      font-size: 13px;
      color: #f59e0b;
      font-weight: 500;
    }
    
    .influence {
      font-size: 12px;
      color: #94a3b8;
    }
    
    /* Inline Pain Intelligence */
    .pain-intel {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #e2e8f0;
    }
    
    .pain-intel-row {
      font-size: 12px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
    }
    
    .pain-intel-label {
      font-weight: 600;
      color: #64748b;
      min-width: 160px;
    }
    
    .pain-intel-blur {
      color: #cbd5e1;
      filter: blur(4px);
      user-select: none;
      font-family: monospace;
      letter-spacing: -0.5px;
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
      background: #6B46C1;
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
    
    /* Blurred Section */
    .blurred-section {
      position: relative;
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e2e8f0;
    }
    
    .blurred-content {
      filter: blur(4px);
      user-select: none;
      pointer-events: none;
    }
    
    .blurred-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.95);
      padding: 24px 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }
    
    .blurred-overlay-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    
    .blurred-overlay-text {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 12px;
    }
    
    .blurred-overlay-cta {
      display: inline-block;
      padding: 10px 20px;
      background: #6B46C1;
      color: white;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
    }
    
    .pain-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .pain-mini {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 14px 16px;
      border-radius: 6px;
    }
    
    .pain-mini-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }
    
    .pain-mini-row {
      font-size: 11px;
      color: #475569;
      margin-bottom: 4px;
      display: flex;
    }
    
    .pain-mini-label {
      font-weight: 600;
      min-width: 180px;
    }
    
    .pain-mini-blur {
      color: #cbd5e1;
      letter-spacing: -0.5px;
      font-family: monospace;
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
      color: #6B46C1;
    }
    
    .page-break {
      page-break-before: always;
      break-before: page;
      padding-top: 48px;
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
    
    <h1 class="cover-title">Your path into WGU</h1>
    <p class="cover-subtitle">${totalMembers} key stakeholders identified, mapped, and ready for coordinated outreach. This is your complete buyer group for closing Western Governors University's enterprise mental health platform.</p>
    
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">Seller</div>
        <div class="stat-value">Mantra Health</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Target Account</div>
        <div class="stat-value">WGU</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Deal Size</div>
        <div class="stat-value">$1.4M</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Product</div>
        <div class="stat-value">Enterprise Mental Health</div>
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
      <p class="section-subtitle">Why WGU Needs Mantra Health</p>
      
      <p class="opportunity-text">
        Western Governors University is a nonprofit serving 192,613 students—the largest university in the U.S. by enrollment. With only 62% first-year retention, mental health is their #1 dropout driver. 74% of students are from underserved populations who face higher mental health barriers and stigma. This creates exactly the challenge that Mantra Health's enterprise mental health platform solves at scale.
      </p>
      <p class="opportunity-text">
        At $1.4M, this requires CEO Scott Pulsipher and Provost Dr. McBeth approval. WGU Labs already piloted peer support with 85%+ positive feedback—they're primed for enterprise solution. Traditional sales cycles at institutions this size average 9-12 months. With this buyer group intelligence, you can execute coordinated multi-thread outreach from day one.
      </p>
      
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-title">C-Suite Access</div>
          <div class="benefit-text">2 decision makers identified: CEO Pulsipher and Provost McBeth. Both mapped with pain points and engagement strategy.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">4 Internal Champions</div>
          <div class="benefit-text">Debbie Fowler (retention), Jason Levin (innovation), plus School deans. Build consensus before executive meetings.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Blockers Identified</div>
          <div class="benefit-text">CIO, CFO, and Legal identified upfront. Engage early with HIPAA compliance and ROI model to prevent late-stage deal killers.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Clear ROI Path</div>
          <div class="benefit-text">$1.4M / 192,613 students = $7.29/student. 70% "stayed enrolled" outcome = 2-3 year payback via retained tuition.</div>
        </div>
      </div>
    </div>
    
    <!-- Buyer Group Profiles -->
    <div class="section">
      <h2 class="section-title">Buyer Group Profiles</h2>
      <p class="section-subtitle">Each person verified with clear logic for their role in the buying decision</p>
      
      <div class="composition">
        <div class="comp-item">
          <div class="comp-value" style="color: #6B46C1;">${decisionMakers}</div>
          <div class="comp-label">Decision Makers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: #319795;">${champions}</div>
          <div class="comp-label">Champions</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: #DD6B20;">${blockers}</div>
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
            <div class="strategy-title">Build Champion Coalition First (Debbie + Jason)</div>
            <div class="strategy-text">Jason's WGU Labs already piloted mental health innovation. Debbie owns retention. Together they can build internal consensus before engaging CEO. Reference Jason's Peers.net pilot outcomes and Debbie's Nov 2024 blog on student connection.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Connect to Provost McBeth's Workforce Mission</div>
            <div class="strategy-text">Dr. McBeth came from Strada Education Foundation (workforce focus). Mental health → completion → workforce readiness. Students who complete with resilience are better employees. She led Craft Education acquisition—aligned vision on innovation.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Propose School of Health or Education Pilot</div>
            <div class="strategy-text">Anmy Mayfield (Nursing) and Stacey Ludwig Johnson (Education) lead highest-stress populations. Propose pilot to generate WGU-specific outcomes data before enterprise approval. Pilot success reduces CEO risk perception.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Pre-empt All Three Blockers Early</div>
            <div class="strategy-text">CIO Morales: HIPAA + AI strategy alignment. CFO: $7.29/student ROI model with 2-3 year payback. Legal: BAA templates + 50-state telehealth compliance. Share documentation proactively—don't let any become late-stage deal killer.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Frame for CEO Pulsipher's Mission</div>
            <div class="strategy-text">Scott's mission is access for underserved. 74% of WGU students are underserved—and they disproportionately face mental health barriers. Position Mantra as enabling WGU's mission, not just a service. His Dec 2025 "Workforce Decoded" report shows workforce focus—connect mental health to career readiness.</div>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">MANTRA HEALTH</div>
    </div>
  </div>
</body>
</html>`;

// Save and generate PDF
async function run() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const htmlFile = path.join(outputDir, `mantra-wgu-1.4m-${new Date().toISOString().split('T')[0]}.html`);
  fs.writeFileSync(htmlFile, html);
  console.log(`HTML saved: ${htmlFile}`);
  
  console.log('Generating PDF...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const pdfPath = '/Users/rosssylvester/Desktop/Mantra-WGU-1.4M-BuyerGroup.pdf';
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  await browser.close();
  
  console.log(`PDF saved: ${pdfPath}`);
  console.log(`\nBuyer Group: ${totalMembers} | Decision: ${decisionMakers} | Champions: ${champions} | Blockers: ${blockers}`);
}

run().catch(console.error);
