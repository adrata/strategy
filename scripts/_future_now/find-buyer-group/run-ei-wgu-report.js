#!/usr/bin/env node

/**
 * E&I Cooperative Services → Western Governors University Buyer Group Report
 * 
 * E&I is selling a high-value (~$1M) student retention solution to WGU.
 * 
 * SELLER CONTEXT:
 * ===============
 * E&I Cooperative Services (eandi.org):
 * - Member-owned, non-profit purchasing cooperative for education
 * - Established 1934, serves 6,200+ member institutions
 * - Provides competitively solicited contracts for higher ed
 * - Product: Student Retention Solution
 * 
 * BUYER CONTEXT:
 * ==============
 * Western Governors University (wgu.edu):
 * - ~175,000 students (one of largest universities in US)
 * - 100% online, competency-based education
 * - Focus on adult learners and working professionals
 * - Headquarters: Salt Lake City, Utah
 * 
 * WHO BUYS RETENTION SOLUTIONS ($1M+ deals):
 * ==========================================
 * - CEO/President (final approval for major investments)
 * - Provost/Chief Academic Officer (academic strategy)
 * - SVP Student Success (owns retention metrics)
 * - VP Enrollment/VP Student Affairs
 * - VP Finance/CFO (budget authority)
 * - Dean of Student Success
 * - Director of Retention/Student Success
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

class EIWGUReportRunner {
  constructor() {
    // E&I branding colors
    this.brandColors = {
      primary: '#003366',      // Navy blue
      secondary: '#0066cc',    // Blue
      accent: '#ff6600',       // Orange
      light: '#f5f7fa'         // Light gray
    };

    // Configuration
    this.config = {
      seller: {
        name: 'E&I Cooperative Services',
        website: 'https://eandi.org',
        tagline: 'Education\'s Purchasing Cooperative',
        product: 'Student Retention Solution',
        valueProposition: 'Comprehensive retention platform that identifies at-risk students, enables proactive intervention, and improves completion rates through data-driven insights and personalized support pathways',
        solutions: [
          'Early Alert & Intervention System',
          'Predictive Analytics for At-Risk Students',
          'Personalized Student Success Pathways',
          'Retention Dashboard & Reporting',
          'Integration with SIS/LMS Systems',
          'Financial Aid & Advising Coordination'
        ]
      },
      buyer: {
        name: 'Western Governors University',
        website: 'https://wgu.edu',
        industry: 'Higher Education',
        size: '~175,000 students',
        location: 'Salt Lake City, Utah',
        characteristics: [
          '100% online, competency-based education',
          'Adult learners and working professionals',
          'One of largest universities in the US',
          'Mission: Expanding access to higher education'
        ]
      },
      dealSize: 950000, // ~$1M retention solution
      dealSizeRange: { min: 750000, max: 1200000 }
    };

    // Researched WGU Buyer Group
    this.buyerGroup = [
      {
        name: 'Scott D. Pulsipher',
        title: 'President and Chief Executive Officer',
        department: 'Executive Office',
        role: 'decision',
        roleConfidence: 98,
        roleReasoning: 'CEO with final authority on major strategic investments. A $1M retention solution requires C-suite approval. Scott has led WGU since 2016, overseeing growth to 175K+ students.',
        linkedin: 'https://www.linkedin.com/in/scottpulsipher/',
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Student Completion Rates',
            description: 'Online universities face scrutiny over completion rates. Improving retention directly impacts WGU\'s reputation and accreditation standing.',
            impact: 'Every 1% improvement in retention = thousands more graduates and millions in tuition revenue.',
            urgency: 'high'
          },
          {
            title: 'Scaling Student Support',
            description: 'With 175K+ students, traditional advising models don\'t scale. Need technology-enabled support.',
            impact: 'Manual processes limit growth and personalization.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'Dr. Courtney Hills McBeth',
        title: 'Chief Academic Officer and Provost',
        department: 'Academic Affairs',
        role: 'decision',
        roleConfidence: 95,
        roleReasoning: 'Provost overseeing all academic programs and curriculum. Retention directly impacts academic outcomes. Joined WGU January 2024 from Strada Education Foundation where she focused on education-workforce transformation. PhD from UPenn.',
        linkedin: 'https://www.linkedin.com/in/courtneyhillsmcbeth/',
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Academic Quality vs. Accessibility',
            description: 'Balancing open access mission with academic rigor. Need data to identify where students struggle.',
            impact: 'Without intervention tools, at-risk students fall through the cracks.',
            urgency: 'high'
          },
          {
            title: 'Competency-Based Progression Tracking',
            description: 'CBE model requires sophisticated tracking of student progress. Traditional LMS may not capture early warning signs.',
            impact: 'Delayed intervention leads to higher dropout rates.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'Debbie Fowler',
        title: 'Senior Vice President of Academic Delivery',
        department: 'Academic Delivery / Student Success',
        role: 'champion',
        roleConfidence: 95,
        roleReasoning: 'Formerly SVP Student Success, now SVP Academic Delivery overseeing 2,900 faculty/staff supporting 175K students. 30+ years experience. JD from USD. Executive Sponsor of NSLS. Key champion who owns student success metrics.',
        linkedin: 'https://www.linkedin.com/in/debbie-fowler-a86a949b/',
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Faculty/Staff to Student Ratio',
            description: 'With 175K students and 2,900 faculty/staff, need technology to identify which students need intervention.',
            impact: 'Cannot provide personalized support at scale without predictive analytics.',
            urgency: 'high'
          },
          {
            title: 'Systemic Barriers to Completion',
            description: 'Debbie champions removing barriers to education. Needs tools to identify and address obstacles.',
            impact: 'Financial, personal, and academic barriers cause preventable dropouts.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'Sarah DeMark',
        title: 'Vice Provost, Workforce Intelligence and Credential Integrity',
        department: 'Academic Affairs',
        role: 'stakeholder',
        roleConfidence: 85,
        roleReasoning: 'Focuses on aligning program outcomes with employer needs. Retention data informs program quality and workforce relevance.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Program-to-Workforce Alignment',
            description: 'Need data on which programs have retention issues that may indicate curriculum misalignment.',
            impact: 'Poor retention in specific programs signals need for curriculum updates.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'CFO/VP Finance',
        title: 'Chief Financial Officer',
        department: 'Finance',
        role: 'blocker',
        roleConfidence: 90,
        roleReasoning: 'For a ~$1M investment, CFO approval is required. Will scrutinize ROI and total cost of ownership.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'ROI Justification',
            description: '$1M investment requires clear ROI. Retention improvements directly impact tuition revenue.',
            impact: 'Each retained student = ~$7,000-15,000 in annual tuition.',
            urgency: 'high'
          },
          {
            title: 'Budget Cycle Alignment',
            description: 'Major purchases must align with fiscal year planning.',
            impact: 'Timing matters for deal closure.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'VP Enrollment Management',
        title: 'Vice President of Enrollment Management',
        department: 'Enrollment',
        role: 'stakeholder',
        roleConfidence: 80,
        roleReasoning: 'Enrollment and retention are interconnected. VP Enrollment cares about student lifecycle from admission to completion.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Enrollment-to-Completion Pipeline',
            description: 'High enrollment means nothing if students don\'t persist. Need visibility into retention trends.',
            impact: 'Enrollment targets are meaningless without retention.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'CIO/VP Technology',
        title: 'Chief Information Officer',
        department: 'Information Technology',
        role: 'blocker',
        roleConfidence: 85,
        roleReasoning: 'Technology integration gatekeeper. Retention solution must integrate with WGU\'s SIS, LMS, and data systems.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'System Integration Complexity',
            description: 'New solutions must integrate with existing tech stack. WGU runs on custom CBE platform.',
            impact: 'Poor integration = poor adoption.',
            urgency: 'high'
          },
          {
            title: 'Data Security & Privacy',
            description: 'Student data requires FERPA compliance and robust security.',
            impact: 'Security concerns can block or delay deals.',
            urgency: 'high'
          }
        ]
      }
    ];
  }

  generateHTMLReport() {
    const { seller, buyer, dealSize } = this.config;
    const buyerGroup = this.buyerGroup;
    
    // Count roles
    const roleCounts = { decision: 0, champion: 0, stakeholder: 0, blocker: 0, introducer: 0 };
    buyerGroup.forEach(m => {
      if (roleCounts[m.role] !== undefined) roleCounts[m.role]++;
    });

    // Generate member cards HTML
    let memberCardsHTML = '';
    const roleOrder = ['decision', 'champion', 'blocker', 'stakeholder', 'introducer'];
    
    roleOrder.forEach(role => {
      const members = buyerGroup.filter(m => m.role === role);
      members.forEach(member => {
        const roleColorMap = {
          decision: '#dc2626',
          champion: '#16a34a',
          blocker: '#f97316',
          stakeholder: '#003366',
          introducer: '#9333ea'
        };
        const roleLabelMap = {
          decision: 'DECISION MAKER',
          champion: 'CHAMPION',
          blocker: 'BLOCKER',
          stakeholder: 'STAKEHOLDER',
          introducer: 'INTRODUCER'
        };
        const painPoints = member.painPoints || [];
        const isResearched = member.linkedin ? true : false;
        
        memberCardsHTML += `
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-left">
              <div class="profile-name">${member.name}</div>
              <div class="profile-title">${member.title}</div>
            </div>
            <div class="profile-right">
              <span class="role-pill" style="background: ${roleColorMap[role]};">${roleLabelMap[role]}</span>
              ${isResearched ? '<span class="verified-badge">✓ Research Verified</span>' : '<span class="research-needed">⚠ Identify Contact</span>'}
            </div>
          </div>
          <div class="profile-logic">
            <strong>Why this person:</strong> ${member.roleReasoning}
          </div>
          ${painPoints.length > 0 ? `
          <div class="pain-points">
            <strong>Key pain points:</strong> ${painPoints.map(p => p.title).join('; ')}
          </div>
          ` : ''}
          <div class="profile-footer">
            ${member.linkedin ? `<a href="${member.linkedin}" class="linkedin-link" target="_blank">LinkedIn Profile →</a>` : '<span class="no-linkedin">Research LinkedIn</span>'}
            <span class="influence">Confidence: ${member.roleConfidence}%</span>
          </div>
        </div>`;
      });
    });

    const timestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence | E&I Cooperative Services → Western Governors University</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #003366;
      --orange: #ff6600;
      --teal: #0099cc;
      --white: #ffffff;
      --gray-50: #f8fafc;
      --gray-100: #f1f5f9;
      --gray-200: #e2e8f0;
      --gray-400: #94a3b8;
      --gray-500: #64748b;
      --gray-700: #334155;
      --gray-900: #0f172a;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--white);
      color: var(--gray-900);
      line-height: 1.5;
      font-size: 14px;
    }
    
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
    
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--gray-100);
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--gray-500);
      margin-bottom: 24px;
    }
    
    .badge::before {
      content: '';
      width: 8px;
      height: 8px;
      background: var(--orange);
      border-radius: 50%;
    }
    
    .cover-title {
      font-size: 36px;
      font-weight: 800;
      color: var(--gray-900);
      margin-bottom: 16px;
    }
    
    .cover-subtitle {
      font-size: 16px;
      color: var(--gray-500);
      margin-bottom: 48px;
      max-width: 600px;
    }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      background: var(--gray-200);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    
    .stat-box {
      background: var(--white);
      padding: 16px 12px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--gray-400);
      margin-bottom: 6px;
    }
    
    .stat-value {
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-900);
    }
    
    .stat-value.highlight {
      font-size: 32px;
      font-weight: 800;
      color: var(--orange);
    }
    
    .section {
      margin-top: 48px;
      padding-top: 48px;
      border-top: 1px solid var(--gray-200);
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    
    .section-subtitle {
      font-size: 15px;
      color: var(--gray-500);
      margin-bottom: 24px;
    }
    
    .logic-callout {
      background: linear-gradient(135deg, var(--navy) 0%, #004d99 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 32px;
    }
    
    .logic-callout h3 {
      font-size: 16px;
      margin-bottom: 12px;
      color: var(--orange);
    }
    
    .logic-callout p {
      font-size: 14px;
      line-height: 1.6;
      opacity: 0.9;
    }
    
    .composition {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--gray-200);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    
    .comp-item {
      background: var(--white);
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
      color: var(--gray-400);
      margin-top: 4px;
    }
    
    .profiles-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .profile-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      padding: 20px;
      border-radius: 12px;
    }
    
    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .profile-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--gray-900);
    }
    
    .profile-title {
      font-size: 13px;
      color: var(--gray-500);
      margin-top: 2px;
    }
    
    .profile-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    
    .role-pill {
      display: inline-block;
      padding: 4px 10px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: white;
      border-radius: 100px;
    }
    
    .verified-badge {
      font-size: 10px;
      color: #16a34a;
      font-weight: 600;
    }
    
    .research-needed {
      font-size: 10px;
      color: #f97316;
      font-weight: 600;
    }
    
    .profile-logic {
      font-size: 13px;
      color: var(--gray-700);
      line-height: 1.6;
      background: var(--gray-50);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .profile-logic strong {
      color: var(--navy);
    }
    
    .pain-points {
      font-size: 12px;
      color: var(--gray-500);
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #fffbeb;
      border-radius: 6px;
      border-left: 3px solid var(--orange);
    }
    
    .pain-points strong {
      color: #92400e;
    }
    
    .profile-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .linkedin-link {
      font-size: 12px;
      color: var(--navy);
      text-decoration: none;
      font-weight: 600;
    }
    
    .no-linkedin {
      font-size: 12px;
      color: var(--gray-400);
    }
    
    .influence {
      font-size: 11px;
      color: var(--gray-400);
    }
    
    .strategy-list { list-style: none; }
    
    .strategy-item {
      display: flex;
      gap: 16px;
      padding: 20px 0;
      border-bottom: 1px solid var(--gray-200);
    }
    
    .strategy-item:last-child { border-bottom: none; }
    
    .strategy-number {
      width: 32px;
      height: 32px;
      background: var(--navy);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .strategy-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    
    .strategy-text {
      font-size: 13px;
      color: var(--gray-500);
      line-height: 1.5;
    }
    
    .footer {
      text-align: center;
      padding-top: 48px;
      margin-top: 48px;
      border-top: 1px solid var(--gray-200);
    }
    
    .footer-logo {
      font-size: 14px;
      font-weight: 800;
    }
    .footer-logo .ei { color: var(--navy); }
    .footer-logo .coop { color: var(--orange); }
    
    .page-break { page-break-before: always; padding-top: 48px; }
    
    @media print {
      * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
      .page { padding: 32px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="badge">BUYER GROUP INTELLIGENCE • HIGH-VALUE DEAL</div>
    
    <h1 class="cover-title">Your path into Western Governors University</h1>
    <p class="cover-subtitle">${buyerGroup.length} key stakeholders for a ~$1M student retention solution. Clear logic for why each person matters to this strategic purchase.</p>
    
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">Seller</div>
        <div class="stat-value">E&I Cooperative</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Target Account</div>
        <div class="stat-value">WGU</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Deal Size</div>
        <div class="stat-value">~$1M</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Product</div>
        <div class="stat-value">Retention Solution</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Generated</div>
        <div class="stat-value">${timestamp}</div>
      </div>
    </div>
    
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-value highlight">${buyerGroup.length}</div>
        <div class="stat-label">Buyer Group</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">${roleCounts.decision}</div>
        <div class="stat-label">Decision Makers</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">${roleCounts.champion}</div>
        <div class="stat-label">Champions</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">${roleCounts.blocker}</div>
        <div class="stat-label">Blockers</div>
      </div>
      <div class="stat-box">
        <div class="stat-value highlight">${roleCounts.stakeholder}</div>
        <div class="stat-label">Stakeholders</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Why This Buyer Group</h2>
      
      <div class="logic-callout">
        <h3>E&I Retention Solution → WGU Product-Market Fit</h3>
        <p>Western Governors University serves 175,000+ students with a 100% online, competency-based model focused on adult learners. Student retention is critical to their mission and financial sustainability. With ~60:1 student-to-faculty ratio, WGU needs technology-enabled retention tools to identify at-risk students and enable proactive intervention. A ~$1M retention solution requires C-suite approval (CEO, Provost), a strong internal champion (SVP Academic Delivery), and buy-in from Finance and IT gatekeepers.</p>
      </div>
      
      <div class="composition">
        <div class="comp-item">
          <div class="comp-value" style="color: #dc2626;">${roleCounts.decision}</div>
          <div class="comp-label">Decision Makers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: #16a34a;">${roleCounts.champion}</div>
          <div class="comp-label">Champions</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: #f97316;">${roleCounts.blocker}</div>
          <div class="comp-label">Blockers</div>
        </div>
        <div class="comp-item">
          <div class="comp-value" style="color: var(--navy);">${roleCounts.stakeholder}</div>
          <div class="comp-label">Stakeholders</div>
        </div>
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Buyer Group Profiles</h2>
      <p class="section-subtitle">Each person with clear logic for their role in the buying decision</p>
      
      <div class="profiles-grid">
        ${memberCardsHTML}
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Recommended Strategy</h2>
      <p class="section-subtitle">Multi-Thread Enterprise Approach for $1M Deal</p>
      
      <ul class="strategy-list">
        <li class="strategy-item">
          <div class="strategy-number">1</div>
          <div class="strategy-content">
            <div class="strategy-title">Lead with Debbie Fowler (Champion)</div>
            <div class="strategy-text">Debbie is your internal champion. As SVP Academic Delivery (formerly SVP Student Success), she owns student outcomes for 175K students. She advocates for removing barriers to education and needs technology to scale personalized support. Position E&I's solution as enabling her mission.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Build Academic Case with Provost McBeth</div>
            <div class="strategy-text">Dr. McBeth joined WGU from Strada Education Foundation where she focused on education-workforce transformation. Connect retention to academic quality, credential integrity, and employer outcomes. She'll champion the academic value proposition.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Address IT Integration Early</div>
            <div class="strategy-text">WGU runs a custom competency-based platform. CIO must approve any system touching student data. Proactively share integration architecture, API capabilities, and security certifications (SOC 2, FERPA compliance).</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Quantify ROI for Finance</div>
            <div class="strategy-text">CFO will scrutinize $1M investment. Build ROI model: If WGU retains 1% more students = 1,750 students × $7,000 avg annual tuition = $12.25M revenue. A 1% improvement pays for the solution 12x over.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Get CEO Vision Alignment</div>
            <div class="strategy-text">Scott Pulsipher cares about WGU's mission: expanding access while maintaining quality. Frame retention solution as enabling both - students succeed AND WGU grows sustainably. Reference E&I's cooperative model and education focus.</div>
          </div>
        </li>
      </ul>
    </div>
    
    <div class="footer">
      <div class="footer-logo"><span class="ei">E&I</span> <span class="coop">COOPERATIVE SERVICES</span></div>
    </div>
  </div>
</body>
</html>`;
  }

  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 E&I COOPERATIVE SERVICES → WESTERN GOVERNORS UNIVERSITY');
    console.log('   Buyer Group Intelligence Report');
    console.log('   Product: Student Retention Solution (~$1M)');
    console.log('='.repeat(80));
    console.log('\n📋 CONTEXT:');
    console.log(`   Seller: ${this.config.seller.name} (${this.config.seller.product})`);
    console.log(`   Buyer:  ${this.config.buyer.name} (${this.config.buyer.size})`);
    console.log(`   Deal:   $${this.config.dealSize.toLocaleString()}`);
    console.log('\n');

    // Generate HTML report
    const html = this.generateHTMLReport();
    
    // Save to output folder
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const htmlFile = path.join(outputDir, `ei-wgu-retention-buyer-group-${timestamp}.html`);
    fs.writeFileSync(htmlFile, html);
    console.log(`✅ HTML report saved: ${htmlFile}`);
    
    // Generate PDF
    console.log('\n📄 Generating PDF...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for fonts
    
    const pdfPath = '/Users/rosssylvester/Desktop/EI-WGU-Retention-BuyerGroup-Report.pdf';
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    console.log(`✅ PDF saved to Desktop: ${pdfPath}`);
    
    // Also save JSON data
    const jsonFile = path.join(outputDir, `ei-wgu-retention-buyer-group-${timestamp}.json`);
    const jsonData = {
      context: {
        seller: this.config.seller,
        buyer: this.config.buyer,
        generatedAt: new Date().toISOString()
      },
      dealSize: this.config.dealSize,
      buyerGroup: {
        totalMembers: this.buyerGroup.length,
        members: this.buyerGroup
      }
    };
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
    console.log(`✅ JSON data saved: ${jsonFile}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ REPORT GENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n👥 Buyer Group: ${this.buyerGroup.length} stakeholders identified`);
    console.log('\n📁 Files saved:');
    console.log(`   - ${pdfPath}`);
    console.log(`   - ${htmlFile}`);
    console.log(`   - ${jsonFile}`);
    
    return { html, buyerGroup: this.buyerGroup };
  }
}

// CLI
async function main() {
  const runner = new EIWGUReportRunner();
  await runner.run();
}

module.exports = { EIWGUReportRunner };

if (require.main === module) {
  main().catch(console.error);
}
