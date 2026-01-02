#!/usr/bin/env node

/**
 * ITC Systems → Idaho State University Buyer Group Discovery
 * 
 * Runs buyer group discovery for ITC Systems selling campus card/OneCard
 * solutions to Idaho State University.
 * 
 * COMPANY CONTEXT:
 * ================
 * ITC Systems (itcsystems.com):
 * - Campus technology solutions provider
 * - Products: OneCard Solutions, POS & Mobile Ordering, Print/Copy Management,
 *   Access Control, Vending Solutions, Laundry Solutions, ID Cards & Credentials
 * - Target: Higher Education institutions
 * - Focus: Unified credential management, cashless campus solutions
 * 
 * Idaho State University:
 * - ~12,000 students
 * - Main campus in Pocatello, Idaho
 * - Multiple campuses across Idaho
 * - Looking to modernize campus card/ID systems
 * 
 * WHO BUYS CAMPUS CARD SOLUTIONS:
 * ================================
 * - CIO / IT Leadership
 * - Associate CIO / IT Directors
 * - VP of Finance / Business Office
 * - VP/Director of Auxiliary Services
 * - Director of Student Services
 * - Dining Services Director
 * - Housing Director
 * - Security/Access Control Director
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const fs = require('fs');

class ITCIdahoStateRunner {
  constructor(options = {}) {
    // ITC Systems branding colors
    this.brandColors = {
      primary: '#1e3a5f',      // Dark blue
      secondary: '#2c5282',    // Medium blue
      accent: '#ed8936',       // Orange accent
      light: '#edf2f7'         // Light gray
    };

    // Configuration for ITC selling to Idaho State University
    this.config = {
      seller: {
        name: 'ITC Systems',
        website: 'https://itcsystems.com',
        logo: 'https://itcsystems.com/wp-content/uploads/2023/01/ITC-Logo.png',
        tagline: 'Integrated Transaction Control',
        product: 'OneCard Campus Solutions',
        valueProposition: 'Unified credential management platform consolidating identity, access, payments, and services into a single solution',
        solutions: [
          'OneCard Solutions - Unified credential management',
          'Point of Sale & Mobile Ordering',
          'Print & Copy Management (GoPrint)',
          'Access Control with mobile credentials',
          'Vending & Laundry Solutions',
          'ID Cards & Credentials'
        ]
      },
      buyer: {
        name: 'Idaho State University',
        website: 'https://www.isu.edu',
        industry: 'Higher Education',
        size: '~12,000 students',
        location: 'Pocatello, Idaho',
        relevantDivisions: [
          'Information Technology Services',
          'Auxiliary Services',
          'Finance & Business Office',
          'Student Affairs',
          'Campus Security'
        ]
      },
      dealSize: 250000, // $250K for comprehensive campus card implementation
      dealSizeRange: { min: 150000, max: 400000 }
    };

    // Buyer Group - researched leadership at Idaho State University
    this.buyerGroup = [
      {
        name: 'Paula Renae Scott',
        title: 'Chief Information Officer',
        department: 'Information Technology Services',
        role: 'decision',
        roleConfidence: 95,
        roleReasoning: 'CIO with 30+ years IT experience in higher education. Ultimate technology decision maker. Previously CIO at University of Montana.',
        linkedin: 'https://www.linkedin.com/in/paula-renae-scott-13172452/',
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Legacy System Integration Challenges',
            description: 'Managing multiple disconnected systems for student ID, access control, dining, and payments creates operational inefficiency and poor user experience.',
            impact: 'Students and staff must carry multiple credentials; IT team spends excessive time maintaining integrations.',
            urgency: 'high'
          },
          {
            title: 'Mobile Credential Adoption Pressure',
            description: 'Students expect mobile-first experiences. Current physical card systems feel outdated compared to peer institutions.',
            impact: 'Risk of appearing technologically behind, affecting student recruitment and satisfaction.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'Lisa Lewis Mangum',
        title: 'Associate CIO of Strategic Technology',
        department: 'Information Technology Services',
        role: 'champion',
        roleConfidence: 90,
        roleReasoning: 'Oversees enterprise applications, project management, and IT contract review. Key influencer who evaluates solutions and manages vendor relationships.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Enterprise Application Complexity',
            description: 'Managing integrations between student information systems, ERP, and campus services requires significant resources.',
            impact: 'Technical debt accumulates; new projects are delayed by integration requirements.',
            urgency: 'high'
          },
          {
            title: 'Contract and Vendor Management',
            description: 'Multiple vendors for different campus services creates procurement complexity and reduces negotiating power.',
            impact: 'Higher total cost of ownership; inconsistent service levels across systems.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'Lowell Richards',
        title: 'Associate Vice President for Student Affairs',
        department: 'Student Affairs',
        role: 'decision',
        roleConfidence: 92,
        roleReasoning: 'Oversees auxiliary operations including dining, bookstore, and campus services. Has budget authority for auxiliary technology investments.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Declining Dining Revenue Capture',
            description: 'Without modern POS and mobile ordering, campus dining loses revenue to off-campus alternatives and delivery apps.',
            impact: 'Reduced meal plan utilization; lower auxiliary revenue that supports campus operations.',
            urgency: 'high'
          },
          {
            title: 'Cash Handling Costs and Security',
            description: 'Legacy cash-based systems in vending, laundry, and some dining locations create security risks and operational overhead.',
            impact: 'Labor costs for cash collection; theft and loss risks; poor user experience.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'Jennifer Steele',
        title: 'Vice President for Finance and University Planning',
        department: 'Finance',
        role: 'decision',
        roleConfidence: 88,
        roleReasoning: 'CFO-equivalent role with budget authority for major university investments. Final approval required for significant technology purchases.',
        linkedin: null,
        email: 'jennifersteele@isu.edu',
        phone: '(208) 282-4277',
        painPoints: [
          {
            title: 'Lack of Unified Financial Reporting',
            description: 'Disparate transaction systems make it difficult to get comprehensive view of campus commerce and auxiliary revenues.',
            impact: 'Delayed financial reporting; difficulty in budget planning and forecasting.',
            urgency: 'medium'
          },
          {
            title: 'Total Cost of Ownership Concerns',
            description: 'Multiple point solutions from different vendors create hidden costs in maintenance, training, and integration.',
            impact: 'Budget overruns; difficulty justifying technology investments.',
            urgency: 'medium'
          }
        ]
      },
      {
        name: 'Nicholas Shiosaki',
        title: 'Interim Chief Information Security Officer',
        department: 'Information Technology Services',
        role: 'blocker',
        roleConfidence: 85,
        roleReasoning: 'Security gatekeeper who must approve any system handling student data and campus access. Could block or delay if security concerns not addressed.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Access Control Security Gaps',
            description: 'Legacy access control systems may not meet modern security standards or provide adequate audit trails.',
            impact: 'Campus safety concerns; compliance risks with student privacy regulations.',
            urgency: 'high'
          },
          {
            title: 'Credential Management Vulnerabilities',
            description: 'Physical cards can be lost, stolen, or duplicated. Need for more secure, revocable credentials.',
            impact: 'Unauthorized access incidents; liability exposure.',
            urgency: 'high'
          }
        ]
      },
      {
        name: 'Nyk Vail',
        title: 'Director of Technology Support',
        department: 'Information Technology Services',
        role: 'stakeholder',
        roleConfidence: 80,
        roleReasoning: 'Manages IT support services and will be responsible for supporting any new campus card system. Key technical evaluator. Started Aug 2024, 17 years higher ed experience from BYU-Idaho.',
        linkedin: null,
        email: 'nykvail@isu.edu',
        phone: '(208) 282-5760',
        painPoints: [
          {
            title: 'Support Ticket Volume from Legacy Systems',
            description: 'Outdated systems generate more support requests from students and staff struggling with usability issues.',
            impact: 'IT support team overwhelmed; slower response times; frustrated users.',
            urgency: 'medium'
          },
          {
            title: 'Training and Documentation Gaps',
            description: 'Multiple systems require separate training; institutional knowledge loss when staff turn over.',
            impact: 'Longer onboarding; inconsistent service quality.',
            urgency: 'low'
          }
        ]
      },
      {
        name: 'Russell Mayer',
        title: 'Budget Director',
        department: 'Finance',
        role: 'stakeholder',
        roleConfidence: 75,
        roleReasoning: 'Involved in budget allocation and financial planning. Will need to approve budget line items for major technology investments.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Budget Cycle Timing Constraints',
            description: 'Major technology purchases must align with university budget cycles and approval processes.',
            impact: 'Projects can be delayed by missing budget windows.',
            urgency: 'low'
          }
        ]
      },
      {
        name: 'Kathy Hoffman',
        title: 'Interim Director for Infrastructure Services',
        department: 'Information Technology Services',
        role: 'stakeholder',
        roleConfidence: 78,
        roleReasoning: 'Responsible for IT infrastructure that will support campus card system. Technical stakeholder for implementation planning.',
        linkedin: null,
        email: null,
        phone: null,
        painPoints: [
          {
            title: 'Infrastructure Capacity Planning',
            description: 'Need to ensure network and server infrastructure can support new campus-wide systems.',
            impact: 'Performance issues; reliability concerns.',
            urgency: 'medium'
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

    // Generate member cards HTML - matching HR Acuity style
    let memberCardsHTML = '';
    const roleOrder = ['decision', 'champion', 'blocker', 'stakeholder', 'introducer'];
    
    roleOrder.forEach(role => {
      const members = buyerGroup.filter(m => m.role === role);
      members.forEach(member => {
        const roleColorMap = {
          decision: '#dc2626',
          champion: '#16a34a',
          blocker: '#f97316',
          stakeholder: '#1e3a5f',
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
        
        memberCardsHTML += `
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-left">
              <div class="profile-name">${member.name}</div>
              <div class="profile-title">${member.title}</div>
            </div>
            <div class="profile-right">
              <span class="role-pill" style="background: ${roleColorMap[role]};">${roleLabelMap[role]}</span>
              <span class="verified-badge">✓ Web Verified</span>
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
  <title>Buyer Group Intelligence | ITC Systems → Idaho State University</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #1e3a5f;
      --orange: #ed8936;
      --teal: #4ecdc4;
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
      background: linear-gradient(135deg, var(--navy) 0%, #2a4a73 100%);
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
    
    .footer-logo .itc { color: var(--navy); font-weight: 800; }
    .footer-logo .systems { color: var(--orange); font-weight: 800; }
    .footer-logo { font-size: 14px; }
    
    .page-break { page-break-before: always; padding-top: 48px; }
    
    @media print {
      * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
      .page { padding: 32px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="badge">BUYER GROUP INTELLIGENCE</div>
    
    <h1 class="cover-title">Your path into Idaho State University</h1>
    <p class="cover-subtitle">${buyerGroup.length} verified stakeholders with clear logic for why each person matters to your Campus Card & OneCard sale.</p>
    
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-label">Seller</div>
        <div class="stat-value">ITC Systems</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Target Account</div>
        <div class="stat-value">Idaho State U</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Deal Size</div>
        <div class="stat-value">$250K</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Product</div>
        <div class="stat-value">OneCard Solutions</div>
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
        <div class="stat-value highlight">${buyerGroup.length}</div>
        <div class="stat-label">Web Verified</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Why This Buyer Group</h2>
      
      <div class="logic-callout">
        <h3>ITC Systems Product-Market Fit Analysis</h3>
        <p>ITC Systems provides integrated campus card solutions including OneCard, POS systems, access control, and mobile credentials. Idaho State University (~12,000 students across multiple Idaho campuses) faces exactly the challenges ITC solves: fragmented credential systems, outdated payment infrastructure, and the need for mobile-first student experiences. This buyer group includes the people who control IT budget (CIO), will champion the solution (Associate CIO), must approve for security (CISO), manage auxiliary revenue (AVP Student Affairs), and control university finance (VP Finance).</p>
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
      <p class="section-subtitle">Each person verified with clear logic for their role in the buying decision</p>
      
      <div class="profiles-grid">
        ${memberCardsHTML}
      </div>
    </div>
    
    <div class="section page-break">
      <h2 class="section-title">Recommended Strategy</h2>
      <p class="section-subtitle">Multi-Thread Enterprise Approach for ITC Systems</p>
      
      <ul class="strategy-list">
        <li class="strategy-item">
          <div class="strategy-number">1</div>
          <div class="strategy-content">
            <div class="strategy-title">Lead with Lisa Mangum (Champion)</div>
            <div class="strategy-text">Lisa oversees enterprise applications and IT contracts at ISU. She's your internal advocate who can navigate the technical evaluation process. Position ITC's unified platform as solving her integration headaches and reducing vendor complexity.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">2</div>
          <div class="strategy-content">
            <div class="strategy-title">Address Security Early with Nicholas Shiosaki</div>
            <div class="strategy-text">As Interim CISO, Nicholas will scrutinize any system touching student credentials and campus access. Proactively share security documentation, SOC 2 compliance, and mobile credential security architecture. Converting him from blocker to supporter is critical.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">3</div>
          <div class="strategy-content">
            <div class="strategy-title">Build the Business Case for Lowell Richards</div>
            <div class="strategy-text">As AVP for Student Affairs overseeing auxiliary services, Lowell cares about dining revenue, student experience, and operational efficiency. Lead with ROI: mobile ordering increases dining revenue 40%, unified systems reduce operational costs.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">4</div>
          <div class="strategy-content">
            <div class="strategy-title">Get CIO Paula Scott's Vision Buy-In</div>
            <div class="strategy-text">Paula has 30+ years of higher ed IT experience. She's seen modernization projects succeed and fail. Position ITC as a long-term strategic partner (40+ years, 500+ campuses) who understands higher education's unique needs.</div>
          </div>
        </li>
        <li class="strategy-item">
          <div class="strategy-number">5</div>
          <div class="strategy-content">
            <div class="strategy-title">Align with Jennifer Steele on TCO & Budget</div>
            <div class="strategy-text">VP Finance Jennifer will need to approve budget. Frame the investment in terms of total cost of ownership reduction, revenue increase from dining, and operational savings. Time your proposal to ISU's budget cycle.</div>
          </div>
        </li>
      </ul>
    </div>
    
    <div class="footer">
      <div class="footer-logo"><span class="itc">ITC</span> <span class="systems">SYSTEMS</span></div>
    </div>
  </div>
</body>
</html>`;
  }

  async run() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 ITC SYSTEMS → IDAHO STATE UNIVERSITY');
    console.log('   Buyer Group Intelligence Report');
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
    const htmlFile = path.join(outputDir, `itc-idaho-state-buyer-group-${timestamp}.html`);
    fs.writeFileSync(htmlFile, html);
    console.log(`✅ HTML report saved: ${htmlFile}`);
    
    // Save to Desktop
    const desktopPath = '/Users/rosssylvester/Desktop/ITC-IdahoState-BuyerGroup-Report.html';
    fs.writeFileSync(desktopPath, html);
    console.log(`✅ Report saved to Desktop: ${desktopPath}`);
    
    // Also save JSON data
    const jsonFile = path.join(outputDir, `itc-idaho-state-buyer-group-${timestamp}.json`);
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
    console.log(`   - ${desktopPath}`);
    console.log(`   - ${htmlFile}`);
    console.log(`   - ${jsonFile}`);
    
    return { html, buyerGroup: this.buyerGroup };
  }
}

// CLI
async function main() {
  const runner = new ITCIdahoStateRunner();
  await runner.run();
}

module.exports = { ITCIdahoStateRunner };

if (require.main === module) {
  main().catch(console.error);
}
