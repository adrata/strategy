#!/usr/bin/env node

/**
 * E&I Cooperative Services → Western Governors University
 * DEAL 2: $1.4M Enterprise Student Retention Platform
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
 * - Retention-related contracts: Pathify, BlackBeltHelp, Avaap
 * - Value: Competitively bid contracts reduce procurement overhead
 * 
 * BUYER CONTEXT:
 * ==============
 * Western Governors University (wgu.edu):
 * - Founded: 1997 by 19 U.S. governors
 * - Students: 192,613 enrolled (June 2025)
 * - Alumni: 390,244 total graduates
 * - FY2025: 59,358 degrees awarded (record year)
 * - Tuition: ~$3,575/term undergraduate, ~$4,240/term graduate
 * - Annual tuition: ~$7,150 undergrad, ~$8,480 grad
 * - Model: 100% online, competency-based education (CBE)
 * - Demographics: 67% from underserved populations
 * - Employment: 94% of graduates employed, 84% in chosen field
 * - Retention Rate: 62% (first-time, full-time)
 * - Graduation Rate: 51% within 150% of standard duration
 * - Faculty Model: Program Mentors + Course Instructors + Evaluators
 * - Faculty/Staff: ~2,900 serving students
 * - Student-to-Staff: ~60:1 ratio
 * 
 * $1.4M DEAL = CEO/BOARD-LEVEL APPROVAL REQUIRED
 * ===============================================
 * At $1.4M, CEO Scott Pulsipher must approve.
 * Provost is academic co-decision maker.
 * CFO validates ROI. CIO approves architecture.
 * Board may require visibility.
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

class EI14MReportRunner {
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
        awards: '2024 CIPS Excellence in Procurement Award',
        retentionPartners: ['Pathify', 'BlackBeltHelp', 'Avaap'],
        valueProposition: 'Competitively bid contracts with vendor accountability, reducing institutional procurement burden while ensuring competitive pricing'
      },
      buyer: {
        name: 'Western Governors University',
        website: 'https://wgu.edu',
        founded: 1997,
        foundedBy: '19 U.S. governors',
        students: 192613,
        alumni: 390244,
        fy2025Degrees: 59358,
        annualTuition: '$7,150 undergrad / $8,480 grad',
        model: 'Competency-based education (CBE)',
        delivery: '100% online',
        retentionRate: '62%',
        graduationRate: '51%',
        employmentRate: '94%',
        underservedPopulation: '67%',
        facultyStaff: 2900,
        headquarters: 'Salt Lake City, Utah'
      },
      dealSize: 1400000,
      dealSizeRange: { min: 1200000, max: 1600000 }
    };

    // $1.4M Deal = Full C-Suite Buyer Group
    this.buyerGroup = [
      {
        name: 'Scott D. Pulsipher',
        title: 'President and Chief Executive Officer',
        department: 'Executive Office',
        role: 'decision',
        roleConfidence: 99,
        roleReasoning: 'Ultimate decision maker for $1.4M investment. President since April 2016. Led growth from ~75,000 to 192,000+ students. Prior: 20+ years at Amazon, Sterling Commerce, startups. MBA from Harvard, B.A. from BYU. Chairman of Presidents Forum, ACE board member. Board visibility likely required at this investment level.',
        linkedin: 'https://www.linkedin.com/in/scott-pulsipher-5735143/',
        painPoints: [
          {
            title: 'Mission Scale: 192,000 Students, 67% Underserved',
            description: 'WGU\'s mission is expanding access to affordable, quality education. 67% of students are from underserved populations. Every student who doesn\'t complete represents mission failure.',
            impact: '$1.4M investment must demonstrably advance access AND completion for underserved learners.',
            urgency: 'critical'
          },
          {
            title: 'Financial Sustainability at $7,150 Tuition',
            description: 'WGU\'s tuition is ~40% below comparable institutions. Low-cost model depends on retention for financial sustainability.',
            impact: 'Each 1% retention improvement = 1,926 students = $13.8M annual tuition revenue.',
            urgency: 'high'
          },
          {
            title: 'Competitive Positioning Against For-Profits',
            description: 'Online education is crowded. WGU differentiates through outcomes: 94% employment, 84% in field. Retention and completion rates are competitive proof points.',
            impact: 'Superior retention reinforces WGU\'s mission-driven positioning against for-profit competitors.',
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
        roleReasoning: 'Academic co-decision maker for $1.4M. Joined January 2024 from Strada Education Foundation (SVP, Chief Program Officer) where she led education-workforce transformation. Ph.D. Higher Education Management from UPenn. Former University of Utah leadership. Oversees 80+ programs across Schools of Health, Education, Technology, Business.',
        linkedin: 'https://www.linkedin.com/in/courtney-hills-mcbeth-34973b2/',
        painPoints: [
          {
            title: 'Academic Quality and Accreditation Standing',
            description: 'Provost owns academic outcomes. WGU holds regional accreditation from NWCCU. Retention and graduation rates are accreditation metrics.',
            impact: 'Poor retention could trigger accreditation concerns. Strong retention reinforces academic quality narrative.',
            urgency: 'critical'
          },
          {
            title: 'Workforce Alignment (Strada Background)',
            description: 'Dr. McBeth\'s Strada experience focused on education-workforce connection. Retention to completion means graduates entering workforce with credentials.',
            impact: '94% employment rate depends on students completing programs. Incomplete students don\'t achieve workforce outcomes.',
            urgency: 'high'
          },
          {
            title: 'CBE Model Integrity',
            description: 'Competency-based education is WGU\'s differentiator. Retention tools must align with CBE philosophy—measuring competency mastery, not seat time.',
            impact: 'Solutions misaligned with CBE undermine academic model.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'Debbie Fowler, J.D.',
        title: 'Senior Vice President of Academic Delivery',
        department: 'Academic Delivery',
        role: 'champion',
        roleConfidence: 98,
        roleReasoning: 'Primary internal champion. Oversees 2,900 faculty/staff serving 192,000+ students. Previously SVP Student Success (title changed January 2024). 30+ years higher ed experience. J.D. from USD, B.A. from Rice. Executive Sponsor of NSLS. Her team will implement and operationalize the platform.',
        linkedin: 'https://www.linkedin.com/in/debbie-fowler-a86a949b/',
        painPoints: [
          {
            title: 'Operational Capacity at 60:1 Ratio',
            description: '192,000 students / 2,900 faculty-staff = ~66:1 ratio. Program Mentors cannot individually assess risk for all students weekly.',
            impact: 'AI-powered risk identification and prioritization is the only scalable path.',
            urgency: 'critical'
          },
          {
            title: 'Multi-Barrier Student Support',
            description: '67% of students face systemic barriers: first-generation, low-income, rural, working adults. Barriers are academic AND non-academic (financial, personal, work-life).',
            impact: 'Retention platform must identify multiple barrier types, not just academic performance.',
            urgency: 'critical'
          },
          {
            title: 'Faculty Tool Adoption',
            description: '2,900 faculty/staff need intuitive tools. Complex platforms fail. Adoption determines ROI.',
            impact: 'User experience and workflow integration are critical success factors.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'David Morales, MBA',
        title: 'Senior Vice President of Technology and Chief Information Officer',
        department: 'Information Technology',
        role: 'blocker',
        roleConfidence: 95,
        roleReasoning: 'Critical technical gatekeeper. CIO since November 2018. Previously 15+ years at Walmart (Senior Director of Engineering for cloud systems). MBA from WGU. Leads IT infrastructure, product management, cloud services. Driving AI/ML investment at WGU. Must approve architecture for $1.4M platform.',
        linkedin: 'https://www.linkedin.com/in/moralesdavid/',
        painPoints: [
          {
            title: 'Enterprise Integration Architecture',
            description: 'WGU operates custom CBE platform, student information system, and enterprise data warehouse. $1.4M platform must integrate via enterprise APIs.',
            impact: 'Integration failure = implementation failure. This is non-negotiable.',
            urgency: 'critical'
          },
          {
            title: 'AI/ML Strategy Alignment',
            description: 'David is building AI capabilities across WGU (chatbots, predictive models, personalization). External platform should leverage, not duplicate, internal AI investments.',
            impact: 'Platform that complements WGU AI strategy gains faster approval.',
            urgency: 'high'
          },
          {
            title: 'Security, Privacy, Compliance',
            description: 'FERPA compliance, SOC 2, data encryption, audit trails. 192,000 student records require enterprise-grade security.',
            impact: 'Security gaps will block procurement or delay implementation.',
            urgency: 'critical'
          },
          {
            title: 'Total Cost of Ownership',
            description: 'CIO evaluates 5-year TCO: implementation, integration, maintenance, upgrades, support. Year-1 price is insufficient.',
            impact: 'Hidden costs erode trust and ROI case.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'Chief Financial Officer',
        title: 'CFO / VP Finance',
        department: 'Finance',
        role: 'blocker',
        roleConfidence: 92,
        roleReasoning: 'Financial gatekeeper. At $1.4M, CFO approval is mandatory. Must validate ROI model, budget fit, payment terms. WGU does not publicly name CFO—identify through engagement.',
        linkedin: null,
        painPoints: [
          {
            title: 'ROI Validation and Payback Period',
            description: '$1.4M requires rigorous ROI model. CFO will calculate: retention improvement → tuition revenue → payback period.',
            impact: 'Weak ROI = no deal. Must demonstrate 2-3 year payback.',
            urgency: 'critical'
          },
          {
            title: 'Budget Cycle Alignment',
            description: 'Major purchases align with WGU fiscal year. Multi-year commitment requires budget planning.',
            impact: 'Timing matters. Miss budget window = 6-12 month delay.',
            urgency: 'high'
          },
          {
            title: 'Contract Terms and Risk',
            description: 'Finance reviews indemnification, liability caps, termination clauses, payment terms.',
            impact: 'Unfavorable terms extend legal review timeline.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'Dr. Stacey Ludwig Johnson',
        title: 'Senior Vice President and Executive Dean, School of Education',
        department: 'School of Education',
        role: 'champion',
        roleConfidence: 90,
        roleReasoning: 'Peer champion with deep institutional credibility. 25+ years at WGU since 1998 (started as Manager of Student Services & Registrar). Ph.D. from University of Colorado. Leads nation\'s largest nonprofit accredited school of education. Pioneer in CBE. Her endorsement carries significant weight.',
        linkedin: 'https://www.linkedin.com/in/stacey-ludwig-johnson-0bba1715/',
        painPoints: [
          {
            title: 'Education Program Retention Patterns',
            description: 'School of Education students have unique requirements: field experience, practicum, licensure exams. Retention patterns differ from other schools.',
            impact: 'Enterprise platform must support school-specific analytics and interventions.',
            urgency: 'medium'
          },
          {
            title: 'CBE Model Expertise',
            description: 'Dr. Ludwig Johnson helped build WGU\'s CBE model. She can validate that retention tools align with competency-based philosophy.',
            impact: 'Her endorsement validates CBE alignment for Provost and CEO.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'David Grow',
        title: 'Chief Operating Officer',
        department: 'Operations',
        role: 'stakeholder',
        roleConfidence: 85,
        roleReasoning: 'Operational stakeholder. As COO, oversees university-wide operational efficiency. $1.4M platform impacts workflows across enrollment, advising, student services. His buy-in ensures smooth cross-functional implementation.',
        linkedin: null,
        painPoints: [
          {
            title: 'Operational Efficiency',
            description: 'Retention platform must improve, not complicate, operational workflows for 2,900 staff.',
            impact: 'Complex implementation drains operational capacity.',
            urgency: 'medium'
          },
          {
            title: 'Cross-Functional Coordination',
            description: 'Retention touches enrollment, advising, financial aid, academics. COO ensures functions work together.',
            impact: 'Siloed implementation fails. Enterprise approach required.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'General Counsel',
        title: 'General Counsel / VP Legal',
        department: 'Legal',
        role: 'blocker',
        roleConfidence: 85,
        roleReasoning: 'Legal gatekeeper. At $1.4M, legal review is mandatory. Reviews contract terms, liability, data privacy agreements, vendor risk assessment.',
        linkedin: null,
        painPoints: [
          {
            title: 'Contract Terms and Liability',
            description: 'Legal reviews indemnification, limitation of liability, termination rights, IP ownership.',
            impact: 'Problematic terms extend negotiation by weeks or months.',
            urgency: 'high'
          },
          {
            title: 'Data Privacy and Compliance',
            description: 'FERPA, state privacy laws, data processing agreements, breach notification procedures.',
            impact: 'Privacy violations = regulatory and reputational risk.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'VP/Dean, School of Business',
        title: 'Senior Vice President and Executive Dean, School of Business',
        department: 'School of Business',
        role: 'stakeholder',
        roleConfidence: 75,
        roleReasoning: 'School stakeholder. Business school is major enrollment driver. Dean cares about retention in their programs. Enterprise platform must serve all schools.',
        linkedin: null,
        painPoints: [
          {
            title: 'Business Program Retention',
            description: 'Business students are often working professionals with competing demands. Retention strategies must account for adult learner needs.',
            impact: 'Generic approaches miss school-specific patterns.',
            urgency: 'low'
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
              ${painPoints.slice(0, 3).map(p => `<li><strong>${p.title}:</strong> ${p.description}</li>`).join('')}
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
  <title>Buyer Group Intelligence | E&I Cooperative Services to WGU | $1.4M</title>
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
      color: var(--primary);
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
      color: #7dd3fc;  /* Light blue for contrast on dark background */
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
      color: #166534;
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
        <div class="amount">$1.4M</div>
        <div class="label">Enterprise Retention Platform</div>
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
          <dt>Recognition</dt><dd>2024 CIPS Award Winner</dd>
        </dl>
      </div>
      <div class="context-box">
        <h3>Buyer: Western Governors University</h3>
        <dl>
          <dt>Students</dt><dd>192,613 enrolled</dd>
          <dt>FY25 Degrees</dt><dd>59,358 awarded</dd>
          <dt>Retention</dt><dd>62% first-year rate</dd>
          <dt>Employment</dt><dd>94% of graduates</dd>
          <dt>Underserved</dt><dd>67% of student body</dd>
        </dl>
      </div>
    </div>
    
    <div class="key-insight">
      <h4>Decision Authority at $1.4M</h4>
      <p><strong>This requires CEO and Provost approval.</strong> Scott Pulsipher (President) is ultimate decision maker. Dr. Courtney Hills McBeth (Provost) is academic co-decision maker. CFO validates ROI. CIO approves architecture. Board may require visibility. Multi-threaded 6+ month engagement required.</p>
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
      <p class="section-subtitle">${buyerGroup.length} stakeholders for $1.4M enterprise investment</p>
      
      <div class="profiles-grid">
        ${memberCardsHTML}
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Enterprise Engagement Strategy</h2>
      <p class="section-subtitle">Multi-threaded approach for $1.4M approval</p>
      
      <ul class="strategy-list">
        <li class="strategy-item">
          <div class="strategy-number">1</div>
          <div class="strategy-content">
            <div class="strategy-title">Build Debbie Fowler as Internal Champion</div>
            <div class="strategy-text">Debbie must advocate before engaging CEO. Her 2,900 faculty/staff will use the platform daily. Win her through retention workshops, pilot proposals, and mission alignment. She will orchestrate internal consensus.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Engage Provost McBeth on Academic Vision</div>
            <div class="strategy-text">Dr. McBeth (new January 2024) is shaping academic strategy. Connect to her Strada background—education-workforce alignment. Position retention as enabling both access and outcomes. She's co-decision maker.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Technical Deep-Dive with CIO Morales</div>
            <div class="strategy-text">Schedule architecture review with David's team early. Demonstrate CBE platform integration, AI/ML alignment, security certifications (SOC 2, FERPA). His approval is mandatory. Don't surprise him late in cycle.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Build Bulletproof ROI Model for CFO</div>
            <div class="strategy-text">$1.4M / $7,150 tuition = 196 students to break even. At 192,000 students with 62% retention, 0.10% improvement = 192 students. Build 3-year model showing 5-10x ROI with sensitivity analysis.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Executive Briefing for CEO Pulsipher</div>
            <div class="strategy-text">Once champions align, request executive briefing with Scott. Lead with mission impact (access + completion for 67% underserved), then scale (192,000 students), then ROI. Reference E&I's cooperative model and higher ed focus.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">6</div>
          <div class="strategy-content">
            <div class="strategy-title">Proactive Legal and Procurement Engagement</div>
            <div class="strategy-text">Share standard contract terms early with General Counsel. Address FERPA, data processing, liability proactively. Leverage E&I's competitive bid process to streamline procurement. Slow legal = slow deal.</div>
          </div>
        </li>
      </ul>
    </div>
    
    <div class="footer">
      E&I Cooperative Services | Western Governors University | $1.4M Enterprise Retention Platform | ${timestamp}
    </div>
  </div>
</body>
</html>`;
  }

  async run() {
    console.log('\n' + '='.repeat(70));
    console.log('BUYER GROUP INTELLIGENCE: E&I to WGU | $1.4M Enterprise Deal');
    console.log('='.repeat(70));

    const html = this.generateHTMLReport();
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const htmlFile = path.join(outputDir, `ei-wgu-1.4m-buyer-group-${timestamp}.html`);
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
    
    const pdfPath = '/Users/rosssylvester/Desktop/EI-WGU-1.4M-Enterprise-BuyerGroup.pdf';
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
  const runner = new EI14MReportRunner();
  await runner.run();
}

module.exports = { EI14MReportRunner };

if (require.main === module) {
  main().catch(console.error);
}
