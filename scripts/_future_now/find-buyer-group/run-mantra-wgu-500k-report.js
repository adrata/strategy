#!/usr/bin/env node

/**
 * Mantra Health → Western Governors University
 * $500K Mental Health & Retention Solution
 * 
 * EXACT Cardinal Gray Light Theme Style (matching HR Acuity → Google report)
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Verified buyer group
const BUYER_GROUP = [
  {
    name: 'Debbie Fowler, J.D.',
    title: 'Senior Vice President of Academic Delivery',
    role: 'decision',
    linkedin: 'https://www.linkedin.com/in/debbie-fowler-a86a949b/',
    influence: 10,
    reason: 'Primary decision maker for $500K. Oversees 2,900 faculty/staff. Author of "Fostering Connection in Higher Ed" (Nov 2024). Mental health directly impacts her retention metrics.'
  },
  {
    name: 'Jason Levin',
    title: 'Executive Director, WGU Labs',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/jasonhlevin/',
    influence: 9,
    reason: 'Already piloted Flourish Labs Peers.net peer support with 85%+ positive feedback. Former VP of Institutional Research. Looking to scale mental health innovation.'
  },
  {
    name: 'Dr. Stacey Ludwig Johnson',
    title: 'SVP & Executive Dean, School of Education',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/stacey-ludwig-johnson-0bba1715/',
    influence: 9,
    reason: '25+ years at WGU since 1998. Leads nation\'s largest nonprofit school of education. Her students (teachers) face high burnout. Ideal pilot program champion.'
  },
  {
    name: 'Anmy Tran Mayfield',
    title: 'VP & Dean, College of Nursing, School of Health',
    role: 'champion',
    linkedin: 'https://www.linkedin.com/in/anmy-mayfield/',
    influence: 8,
    reason: 'Appointed March 2024. First-generation graduate. Nursing students face highest mental health stress. Led 10-year CCNE reaccreditation. Another pilot opportunity.'
  },
  {
    name: 'Dr. Courtney Hills McBeth',
    title: 'Chief Academic Officer and Provost',
    role: 'stakeholder',
    linkedin: 'https://www.linkedin.com/in/courtney-hills-mcbeth-34973b2/',
    influence: 8,
    reason: 'Joined January 2024 from Strada Education Foundation. Ph.D. from UPenn. Oversees 80+ programs. At $500K, she is informed stakeholder—Debbie is decision maker.'
  },
  {
    name: 'David Morales, MBA',
    title: 'SVP of Technology and CIO',
    role: 'blocker',
    linkedin: 'https://www.linkedin.com/in/moralesdavid/',
    influence: 9,
    reason: 'CIO since 2018. Former Walmart engineering leader. CIO 100 Award winner. Mental health platform requires HIPAA compliance (beyond FERPA). Gate on technical architecture.'
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
            ${m.linkedin ? `<a href="${m.linkedin}" class="linkedin-link" target="_blank">LinkedIn →</a>` : ''}
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
  <title>Buyer Group Intelligence | Mantra Health → WGU | $500K</title>
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
    <p class="cover-subtitle">${totalMembers} verified stakeholders mapped and ready for coordinated outreach. This is your complete buyer group for closing Western Governors University.</p>
    
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
        <div class="stat-value">$500K</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Product</div>
        <div class="stat-value">Mental Health Platform</div>
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
        <div class="stat-value highlight">2 mo</div>
        <div class="stat-label">Time Saved</div>
      </div>
    </div>
    
    <!-- The Opportunity -->
    <div class="section">
      <h2 class="section-title">The Opportunity</h2>
      <p class="section-subtitle">Why WGU Needs Mantra Health</p>
      
      <p class="opportunity-text">
        Western Governors University serves 192,613 students with only 62% first-year retention. Mental health is the #1 reason students drop out. 74% of WGU students are from underserved populations who face higher mental health barriers and stigma. This creates exactly the challenge that Mantra Health's digital mental health platform solves at scale.
      </p>
      <p class="opportunity-text">
        WGU Labs already piloted Flourish Labs Peers.net peer support with 85%+ positive feedback—they're actively seeking a scaled solution. Mantra's 70% "stayed enrolled" outcome directly addresses WGU's retention challenge. This is a retention investment, not a wellness perk.
      </p>
      
      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-title">Perfect Product-Market Fit</div>
          <div class="benefit-text">100% online students lack campus counseling. Adult learners need 24/7 access. Mantra's virtual-first model is the only way to serve 192,000 students.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Proven Pilot Interest</div>
          <div class="benefit-text">Jason Levin's WGU Labs already piloted mental health innovation with positive results. They're primed for enterprise solution.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Mission Alignment</div>
          <div class="benefit-text">74% underserved students face higher mental health barriers. Mantra enables WGU's mission of access and completion for all.</div>
        </div>
        <div class="benefit-card">
          <div class="benefit-title">Clear ROI Path</div>
          <div class="benefit-text">$500K / 192,613 students = $2.60/student. 70% "stayed enrolled" outcome pays for itself in retained tuition.</div>
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
            <div class="strategy-title">Lead with Jason Levin at WGU Labs</div>
            <div class="strategy-text">Jason's team already piloted Flourish Labs peer support with 85%+ positive feedback. He understands mental health as innovation priority. His endorsement provides internal credibility. Reference his Peers.net pilot outcomes and position Mantra as the scaled enterprise solution.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Win Debbie Fowler on Retention (Not Wellness)</div>
            <div class="strategy-text">Frame Mantra as a retention investment, not a wellness perk. Lead with 70% "stayed enrolled" outcome. Reference her Nov 2024 blog on "Fostering Connection"—she's already thinking about student isolation and belonging. Connect mental health to her retention KPIs.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Propose School of Health or Education Pilot</div>
            <div class="strategy-text">Anmy Mayfield (Nursing) and Stacey Ludwig Johnson (Education) lead highest-stress student populations. Propose pilot with one school to demonstrate WGU-specific outcomes before enterprise rollout. Pilot success reduces decision maker risk perception.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Pre-empt HIPAA Concerns with CIO Morales</div>
            <div class="strategy-text">Mental health data requires HIPAA compliance beyond FERPA. Engage David Morales early with BAA templates, SOC 2 Type II, and integration architecture. Reference Mantra's EAB Navigate360 integration as precedent. Don't let technical review become late-stage blocker.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Build ROI Around 74% Underserved Population</div>
            <div class="strategy-text">74% of WGU students are from underserved populations who face higher mental health barriers. Mantra's diverse provider matching and stigma-free digital access directly addresses this. Mission alignment + ROI = compelling case for $500K investment.</div>
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
  
  const htmlFile = path.join(outputDir, `mantra-wgu-500k-${new Date().toISOString().split('T')[0]}.html`);
  fs.writeFileSync(htmlFile, html);
  console.log(`HTML saved: ${htmlFile}`);
  
  console.log('Generating PDF...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const pdfPath = '/Users/rosssylvester/Desktop/Mantra-WGU-500K-BuyerGroup.pdf';
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  await browser.close();
  
  console.log(`PDF saved: ${pdfPath}`);
  console.log(`\nBuyer Group: ${totalMembers} | Decision: ${decisionMakers} | Champions: ${champions} | Blockers: ${blockers}`);
}

run().catch(console.error);
