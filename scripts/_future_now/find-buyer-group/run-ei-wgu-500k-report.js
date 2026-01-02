#!/usr/bin/env node

/**
 * E&I Cooperative Services → Western Governors University
 * DEAL 1: $500K Student Retention Solution
 * 
 * SELLER CONTEXT:
 * ===============
 * E&I Cooperative Services (eandi.org):
 * - Member-owned, nonprofit purchasing cooperative for education
 * - Founded 1934 by George Frank, Charles Wilmot, E.E. Thompson
 * - 6,200+ member institutions (colleges, universities, K-12, hospitals)
 * - 215+ competitively solicited contracts
 * - CEO: Eric Frank (since 2020)
 * - 2024: Won CIPS Excellence in Procurement Award
 * - Retention-related contracts: Pathify (student engagement), BlackBeltHelp (AI support)
 * 
 * BUYER CONTEXT:
 * ==============
 * Western Governors University (wgu.edu):
 * - Founded: 1997 by 19 U.S. governors
 * - Students: 192,613 enrolled (June 2025)
 * - Alumni: 390,244 total graduates
 * - FY2025: 59,358 degrees awarded
 * - Tuition: ~$3,575/term undergraduate, ~$4,240/term graduate (flat-rate)
 * - Model: 100% online, competency-based education (CBE)
 * - Demographics: 67% from underserved populations
 * - Retention Rate: 62% (first-time, full-time)
 * - Graduation Rate: 51% within 150% of standard duration
 * - Faculty Model: Program Mentors, Course Instructors, Evaluators
 * - Student-to-Faculty: ~60:1 ratio
 * 
 * $500K DEAL = SVP-LEVEL DECISION
 * ================================
 * At $500K, Debbie Fowler (SVP Academic Delivery) has budget authority.
 * CEO informed but not primary approver.
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

class EI500KReportRunner {
  constructor() {
    this.config = {
      seller: {
        name: 'E&I Cooperative Services',
        website: 'https://eandi.org',
        founded: 1934,
        type: 'Member-owned nonprofit purchasing cooperative',
        members: '6,200+ educational institutions',
        contracts: '215+ competitively solicited contracts',
        ceo: 'Eric Frank',
        relevantContracts: [
          'Pathify - Student portal and engagement platform',
          'BlackBeltHelp - AI-powered 24/7 student support',
          'Avaap - Digital transformation and Workday services'
        ],
        valueProposition: 'Competitively bid contracts enabling member institutions to procure retention solutions at negotiated rates with reduced procurement overhead'
      },
      buyer: {
        name: 'Western Governors University',
        website: 'https://wgu.edu',
        founded: 1997,
        foundedBy: '19 U.S. governors',
        students: 192613,
        alumni: 390244,
        fy2025Degrees: 59358,
        tuitionUndergrad: '$3,575/term',
        tuitionGrad: '$4,240/term',
        model: 'Competency-based education (CBE)',
        delivery: '100% online',
        retentionRate: '62%',
        graduationRate: '51%',
        underservedPopulation: '67%',
        facultyModel: 'Program Mentors + Course Instructors + Evaluators',
        headquarters: 'Salt Lake City, Utah'
      },
      dealSize: 500000,
      dealSizeRange: { min: 400000, max: 600000 }
    };

    // $500K Deal = Focused Retention Team Buyer Group
    this.buyerGroup = [
      {
        name: 'Debbie Fowler, J.D.',
        title: 'Senior Vice President of Academic Delivery',
        department: 'Academic Delivery',
        role: 'decision',
        roleConfidence: 98,
        roleReasoning: 'Primary decision maker for $500K retention investment. Oversees 2,900 faculty and staff serving 192,000+ students. Previously SVP Student Success (title changed January 2024). 30+ years higher education experience. J.D. from University of San Diego, B.A. Economics/Math from Rice University. Executive Sponsor of NSLS. Budget authority at this deal level.',
        linkedin: 'https://www.linkedin.com/in/debbie-fowler-a86a949b/',
        painPoints: [
          {
            title: 'Scaling Personalized Intervention at 60:1 Ratio',
            description: 'With 192,000+ students and 2,900 faculty/staff, WGU operates at approximately 60:1 student-to-staff ratio. Manual identification of at-risk students is impossible at this scale.',
            impact: 'Requires predictive analytics and AI-driven prioritization to enable Program Mentors to focus on highest-need students.',
            urgency: 'critical'
          },
          {
            title: 'Improving 62% Retention Rate',
            description: 'WGU reports 62% first-year retention for first-time, full-time students. Each percentage point improvement represents ~1,900 students.',
            impact: 'At $7,000 average annual tuition, 1% improvement = $13.3M revenue opportunity.',
            urgency: 'high'
          },
          {
            title: 'Supporting 67% Underserved Population',
            description: '67% of WGU students come from underserved populations (first-generation, low-income, rural, students of color). These populations often face additional barriers requiring proactive support.',
            impact: 'Retention tools must identify non-academic barriers (financial, personal, work-life) alongside academic struggles.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'Dr. Stacey Ludwig Johnson',
        title: 'Senior Vice President and Executive Dean, School of Education',
        department: 'School of Education',
        role: 'champion',
        roleConfidence: 92,
        roleReasoning: 'Key internal champion. 25+ years at WGU since 1998 (started as Manager of Student Services and Registrar). Pioneer in competency-based education. Ph.D. from University of Colorado. Leads nation\'s largest nonprofit accredited school of education. Her historical roles include VP Academic Operations, Associate Provost of Academic Services. Deep institutional knowledge and credibility.',
        linkedin: 'https://www.linkedin.com/in/stacey-ludwig-johnson-0bba1715/',
        painPoints: [
          {
            title: 'CBE Progress Tracking Integration',
            description: 'Competency-based education requires sophisticated progress tracking beyond traditional LMS. Students advance by demonstrating mastery, not seat time.',
            impact: 'Retention tools must integrate with CBE model—tracking competency completion velocity, not course attendance.',
            urgency: 'high'
          },
          {
            title: 'Education Program-Specific Retention',
            description: 'School of Education students have unique requirements: field experience, licensure exams, practicum hours. Retention patterns differ from other schools.',
            impact: 'Generic retention analytics miss education-specific early warning signals.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'Dr. Courtney Hills McBeth',
        title: 'Chief Academic Officer and Provost',
        department: 'Academic Affairs',
        role: 'stakeholder',
        roleConfidence: 88,
        roleReasoning: 'Executive stakeholder. Joined WGU January 2024 from Strada Education Foundation (SVP, Chief Program Officer). Ph.D. Higher Education Management from University of Pennsylvania. At $500K, Provost is informed but Debbie Fowler is primary decision maker. Will want visibility into academic quality implications.',
        linkedin: 'https://www.linkedin.com/in/courtney-hills-mcbeth-34973b2/',
        painPoints: [
          {
            title: 'Academic Quality and Completion Outcomes',
            description: 'Provost oversees 80+ programs across Schools of Health, Education, Technology, and Business. Retention directly impacts graduation rates and accreditation standing.',
            impact: 'Poor retention undermines WGU\'s mission and could affect regional accreditation.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'David Morales, MBA',
        title: 'Senior Vice President of Technology and Chief Information Officer',
        department: 'Information Technology',
        role: 'blocker',
        roleConfidence: 90,
        roleReasoning: 'Technical gatekeeper. CIO since November 2018. Previously 15+ years at Walmart (Senior Director of Engineering, cloud systems). MBA from WGU. Any retention solution must integrate with WGU\'s custom CBE platform, student information system, and data warehouse. Leading AI/ML investments at WGU.',
        linkedin: 'https://www.linkedin.com/in/moralesdavid/',
        painPoints: [
          {
            title: 'Integration with Custom CBE Platform',
            description: 'WGU operates a proprietary competency-based education platform. External solutions must integrate via APIs without disrupting existing student experience.',
            impact: 'Poor integration = poor adoption. Faculty and students will reject tools that don\'t fit workflow.',
            urgency: 'critical'
          },
          {
            title: 'AI Strategy Alignment',
            description: 'David is investing in AI-driven tools across WGU. Retention platform should complement internal AI initiatives, not compete.',
            impact: 'AI-native solutions that leverage WGU\'s data assets will gain faster approval.',
            urgency: 'high'
          },
          {
            title: 'FERPA and Data Security',
            description: '192,000+ student records require enterprise-grade security and FERPA compliance.',
            impact: 'Security gaps will delay or block procurement.',
            urgency: 'critical'
          }
        ]
      },
      {
        name: 'Director of Student Success Operations',
        title: 'Director, Student Success',
        department: 'Academic Delivery',
        role: 'champion',
        roleConfidence: 85,
        roleReasoning: 'Day-to-day operational champion. Reports to Debbie Fowler. Manages retention programs and will be primary power user of the platform. Critical for adoption and implementation success. (Specific name to be identified through engagement.)',
        linkedin: null,
        painPoints: [
          {
            title: 'Advisor Workload Prioritization',
            description: 'Program Mentors have weekly touchpoints with students but cannot reach all 192,000. Need AI-driven prioritization.',
            impact: 'Without prioritization, advisors spend time on students who don\'t need intervention while at-risk students fall through cracks.',
            urgency: 'high'
          }
        ]
      }
    ];
  }

  generateHTMLReport() {
    const { seller, buyer, dealSize } = this.config;
    const buyerGroup = this.buyerGroup;
    
    const roleCounts = { decision: 0, champion: 0, stakeholder: 0, blocker: 0, introducer: 0 };
    buyerGroup.forEach(m => {
      if (roleCounts[m.role] !== undefined) roleCounts[m.role]++;
    });

    let memberCardsHTML = '';
    const roleOrder = ['decision', 'champion', 'blocker', 'stakeholder', 'introducer'];
    
    roleOrder.forEach(role => {
      const members = buyerGroup.filter(m => m.role === role);
      members.forEach(member => {
        const roleColorMap = {
          decision: '#003c71',     /* E&I Navy */
          champion: '#00a651',     /* E&I Green */
          blocker: '#f7941d',      /* E&I Orange */
          stakeholder: '#0077c8',  /* E&I Blue */
          introducer: '#6b21a8'
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
              ${isResearched ? '<span class="verified-badge">Verified</span>' : '<span class="research-needed">To Identify</span>'}
            </div>
          </div>
          <div class="profile-logic">
            <strong>Role Rationale:</strong> ${member.roleReasoning}
          </div>
          ${painPoints.length > 0 ? `
          <div class="pain-points">
            <strong>Key Pain Points:</strong>
            <ul class="pain-list">
              ${painPoints.map(p => `<li><strong>${p.title}:</strong> ${p.description}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          <div class="profile-footer">
            ${member.linkedin ? `<a href="${member.linkedin}" class="linkedin-link" target="_blank">LinkedIn Profile</a>` : '<span class="no-linkedin">LinkedIn TBD</span>'}
            <span class="influence">Confidence: ${member.roleConfidence}%</span>
          </div>
        </div>`;
      });
    });

    const timestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buyer Group Intelligence | E&I Cooperative Services to WGU | $500K</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* E&I Cooperative Services Brand Colors */
    :root {
      --primary: #003c71;      /* E&I Navy Blue */
      --secondary: #0077c8;    /* E&I Bright Blue */
      --accent: #00a651;       /* E&I Green */
      --warning: #f7941d;      /* E&I Orange */
      --white: #ffffff;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-900: #111827;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--white);
      color: var(--gray-900);
      line-height: 1.6;
      font-size: 13px;
    }
    
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
    
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 2px solid var(--primary);
      margin-bottom: 32px;
    }
    
    .header-left h1 {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--gray-500);
      margin-bottom: 4px;
    }
    
    .header-left h2 {
      font-size: 24px;
      font-weight: 700;
      color: var(--gray-900);
    }
    
    .deal-size {
      text-align: right;
    }
    
    .deal-size .amount {
      font-size: 28px;
      font-weight: 700;
      color: var(--accent);
    }
    
    .deal-size .label {
      font-size: 11px;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .context-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 40px;
    }
    
    .context-box {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 20px;
    }
    
    .context-box h3 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--gray-200);
    }
    
    .context-box dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 12px;
      font-size: 12px;
    }
    
    .context-box dt {
      color: var(--gray-500);
    }
    
    .context-box dd {
      color: var(--gray-900);
      font-weight: 500;
    }
    
    .key-insight {
      background: var(--gray-900);
      color: var(--white);
      padding: 20px 24px;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    
    .key-insight h4 {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--gray-400);
      margin-bottom: 8px;
    }
    
    .key-insight p {
      font-size: 14px;
      line-height: 1.6;
    }
    
    .key-insight strong {
      color: #60a5fa;
    }
    
    .section {
      margin-top: 40px;
      padding-top: 32px;
      border-top: 1px solid var(--gray-200);
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--gray-900);
    }
    
    .section-subtitle {
      font-size: 13px;
      color: var(--gray-500);
      margin-bottom: 20px;
    }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      background: var(--gray-200);
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    
    .stat-box {
      background: var(--white);
      padding: 14px 10px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--gray-400);
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
    }
    
    .profiles-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .profile-card {
      background: var(--white);
      border: 1px solid var(--gray-200);
      padding: 18px;
      border-radius: 8px;
    }
    
    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .profile-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--gray-900);
    }
    
    .profile-title {
      font-size: 12px;
      color: var(--gray-500);
      margin-top: 2px;
    }
    
    .profile-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    
    .role-pill {
      display: inline-block;
      padding: 3px 8px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: white;
      border-radius: 4px;
    }
    
    .verified-badge {
      font-size: 10px;
      color: var(--accent);
      font-weight: 500;
    }
    
    .research-needed {
      font-size: 10px;
      color: var(--warning);
      font-weight: 500;
    }
    
    .profile-logic {
      font-size: 12px;
      color: var(--gray-700);
      line-height: 1.6;
      background: var(--gray-50);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    
    .profile-logic strong {
      color: var(--primary);
    }
    
    .pain-points {
      font-size: 11px;
      color: var(--gray-600);
      margin-bottom: 12px;
      padding: 12px;
      background: #fefce8;
      border-radius: 6px;
      border-left: 3px solid #ca8a04;
    }
    
    .pain-points strong {
      color: #854d0e;
    }
    
    .pain-list {
      margin-top: 8px;
      margin-left: 16px;
      line-height: 1.5;
    }
    
    .pain-list li {
      margin-bottom: 6px;
    }
    
    .profile-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
    }
    
    .linkedin-link {
      color: var(--secondary);
      text-decoration: none;
      font-weight: 500;
    }
    
    .no-linkedin {
      color: var(--gray-400);
    }
    
    .influence {
      color: var(--gray-400);
    }
    
    .strategy-list { list-style: none; }
    
    .strategy-item {
      display: flex;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--gray-200);
    }
    
    .strategy-item:last-child { border-bottom: none; }
    
    .strategy-number {
      width: 24px;
      height: 24px;
      background: var(--primary);
      color: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 11px;
      flex-shrink: 0;
    }
    
    .strategy-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--gray-900);
    }
    
    .strategy-text {
      font-size: 12px;
      color: var(--gray-600);
      line-height: 1.5;
    }
    
    .footer {
      text-align: center;
      padding-top: 32px;
      margin-top: 40px;
      border-top: 1px solid var(--gray-200);
      font-size: 10px;
      color: var(--gray-400);
    }
    
    .page-break { page-break-before: always; padding-top: 40px; }
    
    @media print {
      * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
      .page { padding: 32px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header-bar">
      <div class="header-left">
        <h1>Buyer Group Intelligence</h1>
        <h2>E&I Cooperative Services to WGU</h2>
      </div>
      <div class="deal-size">
        <div class="amount">$500K</div>
        <div class="label">Student Retention Solution</div>
      </div>
    </div>
    
    <div class="context-grid">
      <div class="context-box">
        <h3>Seller: E&I Cooperative Services</h3>
        <dl>
          <dt>Type</dt><dd>Nonprofit purchasing cooperative</dd>
          <dt>Founded</dt><dd>1934</dd>
          <dt>Members</dt><dd>6,200+ institutions</dd>
          <dt>Contracts</dt><dd>215+ competitively bid</dd>
          <dt>Retention Partners</dt><dd>Pathify, BlackBeltHelp</dd>
        </dl>
      </div>
      <div class="context-box">
        <h3>Buyer: Western Governors University</h3>
        <dl>
          <dt>Students</dt><dd>192,613 enrolled</dd>
          <dt>Model</dt><dd>100% online, competency-based</dd>
          <dt>Retention Rate</dt><dd>62% first-year</dd>
          <dt>Graduation Rate</dt><dd>51% within 150% time</dd>
          <dt>Underserved</dt><dd>67% of student body</dd>
        </dl>
      </div>
    </div>
    
    <div class="key-insight">
      <h4>Decision Authority at $500K</h4>
      <p><strong>Debbie Fowler is the primary decision maker.</strong> As SVP of Academic Delivery overseeing 2,900 faculty/staff and 192,000+ students, she has budget authority for retention investments at this level. Win Debbie, win the deal. The Provost and CEO are stakeholders, not primary approvers.</p>
    </div>
    
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">Buyer Group</div>
        <div class="stat-value">${buyerGroup.length}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Decision</div>
        <div class="stat-value">${roleCounts.decision}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Champions</div>
        <div class="stat-value">${roleCounts.champion}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Blockers</div>
        <div class="stat-value">${roleCounts.blocker}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Stakeholders</div>
        <div class="stat-value">${roleCounts.stakeholder}</div>
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Buyer Group Profiles</h2>
      <p class="section-subtitle">5 stakeholders for $500K retention investment</p>
      
      <div class="profiles-grid">
        ${memberCardsHTML}
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Recommended Approach</h2>
      <p class="section-subtitle">Focused strategy for $500K approval</p>
      
      <ul class="strategy-list">
        <li class="strategy-item">
          <div class="strategy-number">1</div>
          <div class="strategy-content">
            <div class="strategy-title">Lead with Debbie Fowler</div>
            <div class="strategy-text">Debbie owns student success at WGU. Her mission is removing barriers to completion for 192,000+ students, 67% from underserved populations. Position retention solution as enabling her team to identify at-risk students at scale. Reference E&I's cooperative model and competitively bid contract process.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Build Champion Coalition with Dr. Ludwig Johnson</div>
            <div class="strategy-text">Dr. Ludwig Johnson has 25+ years at WGU and pioneered their CBE model. Her institutional credibility and understanding of retention challenges makes her an ideal internal advocate. Engage early to gain her endorsement.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Address Technical Integration with CIO Morales</div>
            <div class="strategy-text">WGU's custom CBE platform requires careful integration. Schedule technical architecture review with David's team early. Demonstrate API capabilities, AI/ML alignment, and FERPA compliance. He can accelerate or block based on technical fit.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Build ROI Model for Budget Justification</div>
            <div class="strategy-text">$500K / $7,000 avg tuition = 72 students to break even. With 192,000 students and 62% retention, even 0.04% improvement = 77 students. Show 2-year payback calculation. Include non-revenue metrics: completion rates, accreditation implications, mission impact.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Inform Provost McBeth as Stakeholder</div>
            <div class="strategy-text">Dr. McBeth (new January 2024) should receive executive summary showing academic quality alignment. She's a stakeholder, not approver at $500K. Brief her to demonstrate respect for academic leadership without requiring active involvement in procurement.</div>
          </div>
        </li>
      </ul>
    </div>
    
    <div class="footer">
      E&I Cooperative Services | Western Governors University | $500K Student Retention Solution | ${timestamp}
    </div>
  </div>
</body>
</html>`;
  }

  async run() {
    console.log('\n' + '='.repeat(70));
    console.log('BUYER GROUP INTELLIGENCE: E&I to WGU | $500K Deal');
    console.log('='.repeat(70));

    const html = this.generateHTMLReport();
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const htmlFile = path.join(outputDir, `ei-wgu-500k-buyer-group-${timestamp}.html`);
    fs.writeFileSync(htmlFile, html);
    console.log(`HTML saved: ${htmlFile}`);
    
    console.log('Generating PDF...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const pdfPath = '/Users/rosssylvester/Desktop/EI-WGU-500K-Retention-BuyerGroup.pdf';
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    console.log(`PDF saved: ${pdfPath}`);
    
    return { html, buyerGroup: this.buyerGroup, pdfPath };
  }
}

async function main() {
  const runner = new EI500KReportRunner();
  await runner.run();
}

module.exports = { EI500KReportRunner };

if (require.main === module) {
  main().catch(console.error);
}
