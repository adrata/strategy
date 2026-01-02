/**
 * OBP Report Generator
 *
 * Generates beautiful, shareable HTML reports from OBP analysis.
 * Reports can be downloaded as PDF or shared via URL.
 */

const fs = require('fs');
const path = require('path');

class OBPReportGenerator {
  constructor(options = {}) {
    this.productConfig = options.productConfig || this.loadDefaultProductConfig();
    this.outputDir = options.outputDir || path.join(__dirname, '../output/reports');

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  loadDefaultProductConfig() {
    const configPath = path.join(__dirname, '../product-configs/adrata.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {
      product: { name: 'Your Product', company: 'Your Company' },
      reportBranding: {
        primaryColor: '#2563EB',
        secondaryColor: '#1E40AF',
        accentColor: '#3B82F6',
        gradientStart: '#2563EB',
        gradientEnd: '#7C3AED'
      }
    };
  }

  /**
   * Generate HTML report from OBP analysis
   */
  generateReport(obpResult, options = {}) {
    const branding = this.productConfig.reportBranding || {};
    const product = this.productConfig.product || {};

    const reportData = {
      ...obpResult,
      generatedAt: new Date().toISOString(),
      productName: product.name || 'OBP Analysis',
      productCompany: product.company || ''
    };

    const html = this.buildHTML(reportData, branding);

    // Save report
    const timestamp = Date.now();
    const companySlug = (obpResult.company || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `obp-report-${companySlug}-${timestamp}.html`;
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, html);

    console.log(`\n   Report saved: ${filepath}`);

    return {
      filepath,
      filename,
      html
    };
  }

  buildHTML(data, branding) {
    const primaryColor = branding.primaryColor || '#6366F1';
    const secondaryColor = branding.secondaryColor || '#4F46E5';
    const accentColor = branding.accentColor || '#818CF8';
    const gradientStart = branding.gradientStart || primaryColor;
    const gradientEnd = branding.gradientEnd || '#8B5CF6';

    const pullScore = data.pullScore || 0;
    const classification = data.classification || {};
    const tensions = data.tensions || {};
    const champion = data.champion || {};
    const predictions = data.predictions || {};
    const strategy = data.strategy || {};

    // Determine score color and label
    const scoreColor = this.getScoreColor(pullScore);
    const scoreLabel = this.getScoreLabel(classification.category);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PULL Analysis: ${data.company || 'Company'} | ${data.productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --accent: ${accentColor};
      --gradient-start: ${gradientStart};
      --gradient-end: ${gradientEnd};
      --score-color: ${scoreColor};
      --bg-dark: #0F172A;
      --bg-card: #1E293B;
      --text-primary: #F8FAFC;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --border: #334155;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-dark);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 48px;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }

    .header h1 {
      font-size: 48px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-subtitle {
      font-size: 18px;
      color: var(--text-secondary);
    }

    /* Score Hero */
    .score-hero {
      background: linear-gradient(135deg, var(--bg-card), #2D3748);
      border-radius: 24px;
      padding: 48px;
      margin-bottom: 32px;
      border: 1px solid var(--border);
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 48px;
      align-items: center;
    }

    .score-circle-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .score-circle {
      position: relative;
      width: 200px;
      height: 200px;
    }

    .score-circle svg {
      transform: rotate(-90deg);
      width: 200px;
      height: 200px;
    }

    .score-circle-bg {
      fill: none;
      stroke: var(--border);
      stroke-width: 12;
    }

    .score-circle-progress {
      fill: none;
      stroke: var(--score-color);
      stroke-width: 12;
      stroke-linecap: round;
      stroke-dasharray: ${2 * Math.PI * 88};
      stroke-dashoffset: ${2 * Math.PI * 88 * (1 - pullScore / 100)};
      transition: stroke-dashoffset 1s ease-out;
    }

    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .score-number {
      font-size: 56px;
      font-weight: 800;
      color: var(--score-color);
      line-height: 1;
    }

    .score-label {
      font-size: 14px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .classification-badge {
      margin-top: 16px;
      padding: 8px 20px;
      background: ${this.getClassificationBg(classification.category)};
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      color: ${scoreColor};
    }

    .score-details h2 {
      font-size: 28px;
      margin-bottom: 16px;
    }

    .score-summary {
      font-size: 16px;
      color: var(--text-secondary);
      margin-bottom: 24px;
      line-height: 1.8;
    }

    .buying-probability {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .buying-probability-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--success);
    }

    .buying-probability-label {
      font-size: 14px;
      color: var(--text-secondary);
    }

    /* Sections */
    .section {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      border: 1px solid var(--border);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .section-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
    }

    /* Tension Bars */
    .tension-grid {
      display: grid;
      gap: 20px;
    }

    .tension-item {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--border);
    }

    .tension-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .tension-name {
      font-weight: 600;
      font-size: 16px;
    }

    .tension-score {
      font-weight: 700;
      font-size: 18px;
    }

    .tension-bar-container {
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .tension-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease-out;
    }

    .tension-implication {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* Champion Card */
    .champion-card {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 24px;
      align-items: start;
    }

    .champion-avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 700;
    }

    .champion-info h3 {
      font-size: 24px;
      margin-bottom: 4px;
    }

    .champion-title {
      color: var(--accent);
      font-size: 16px;
      margin-bottom: 16px;
    }

    .champion-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .champion-meta-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 12px 16px;
      border-radius: 8px;
    }

    .champion-meta-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .champion-meta-value {
      font-weight: 600;
      font-size: 16px;
    }

    .champion-insight {
      background: rgba(99, 102, 241, 0.1);
      border-left: 3px solid var(--primary);
      padding: 16px;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: var(--text-secondary);
    }

    .no-champion {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }

    .no-champion-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    /* Internal Dialogue */
    .dialogue-container {
      background: #0D1117;
      border-radius: 12px;
      padding: 24px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.8;
      max-height: 500px;
      overflow-y: auto;
      white-space: pre-wrap;
      border: 1px solid var(--border);
    }

    /* Strategy Grid */
    .strategy-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .strategy-card {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
      padding: 24px;
      border: 1px solid var(--border);
    }

    .strategy-card h4 {
      font-size: 14px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .strategy-card p {
      font-size: 16px;
      color: var(--text-primary);
    }

    .strategy-do {
      border-left: 3px solid var(--success);
    }

    .strategy-avoid {
      border-left: 3px solid var(--danger);
    }

    /* Action Timeline */
    .timeline {
      position: relative;
      padding-left: 32px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 24px;
    }

    .timeline-dot {
      position: absolute;
      left: -32px;
      top: 4px;
      width: 24px;
      height: 24px;
      background: var(--primary);
      border-radius: 50%;
      border: 4px solid var(--bg-card);
    }

    .timeline-dot.urgent {
      background: var(--danger);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    }

    .timeline-content {
      background: rgba(255, 255, 255, 0.02);
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .timeline-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .timeline-desc {
      font-size: 14px;
      color: var(--text-secondary);
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .footer-brand {
      font-weight: 600;
      color: var(--accent);
    }

    /* Print Styles */
    @media print {
      body {
        background: white;
        color: #1a1a1a;
      }

      .container {
        max-width: 100%;
      }

      .section, .score-hero {
        background: #f8f9fa;
        border: 1px solid #e5e7eb;
        break-inside: avoid;
      }

      .dialogue-container {
        background: #f1f5f9;
        max-height: none;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .score-hero {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .champion-card {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .champion-avatar {
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="header-badge">
        <span>Organizational Behavioral Physics</span>
      </div>
      <h1>${data.company || 'Company Analysis'}</h1>
      <p class="header-subtitle">PULL Intelligence Report by ${data.productName}</p>
    </header>

    <!-- Score Hero -->
    <section class="score-hero">
      <div class="score-circle-container">
        <div class="score-circle">
          <svg viewBox="0 0 200 200">
            <circle class="score-circle-bg" cx="100" cy="100" r="88"></circle>
            <circle class="score-circle-progress" cx="100" cy="100" r="88"></circle>
          </svg>
          <div class="score-value">
            <div class="score-number">${pullScore}</div>
            <div class="score-label">PULL Score</div>
          </div>
        </div>
        <div class="classification-badge">${scoreLabel}</div>
      </div>
      <div class="score-details">
        <h2>${this.getScoreHeadline(classification.category, data.company)}</h2>
        <p class="score-summary">${this.formatExecutiveSummary(data.executiveSummary)}</p>
        ${predictions.buyingProbability ? `
        <div class="buying-probability">
          <div class="buying-probability-value">${Math.round(predictions.buyingProbability)}%</div>
          <div class="buying-probability-label">Estimated buying probability<br>within action window</div>
        </div>
        ` : ''}
      </div>
    </section>

    <!-- Organizational Tensions -->
    <section class="section">
      <div class="section-header">
        <div class="section-icon">&#9889;</div>
        <h2 class="section-title">Organizational Tensions</h2>
      </div>
      <div class="tension-grid">
        ${this.renderTensions(tensions)}
      </div>
    </section>

    <!-- Champion -->
    <section class="section">
      <div class="section-header">
        <div class="section-icon">&#128081;</div>
        <h2 class="section-title">Identified Champion</h2>
      </div>
      ${this.renderChampion(champion)}
    </section>

    <!-- Action Windows -->
    ${predictions.actionWindow ? `
    <section class="section">
      <div class="section-header">
        <div class="section-icon">&#9200;</div>
        <h2 class="section-title">Action Windows</h2>
      </div>
      <div class="timeline">
        ${this.renderActionWindows(predictions.actionWindow)}
      </div>
    </section>
    ` : ''}

    <!-- Internal Dialogue -->
    ${data.internalDialogue ? `
    <section class="section">
      <div class="section-header">
        <div class="section-icon">&#128172;</div>
        <h2 class="section-title">Simulated Internal Dialogue</h2>
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">
        Based on organizational tensions, this is the conversation likely happening inside ${data.company}:
      </p>
      <div class="dialogue-container">${this.escapeHtml(data.internalDialogue)}</div>
    </section>
    ` : ''}

    <!-- Recommended Strategy -->
    <section class="section">
      <div class="section-header">
        <div class="section-icon">&#127919;</div>
        <h2 class="section-title">Recommended Approach</h2>
      </div>
      ${this.renderStrategy(strategy, champion)}
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>Generated on ${new Date(data.generatedAt || data.analyzedAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })}</p>
      <p>Powered by <span class="footer-brand">Organizational Behavioral Physics</span></p>
      <p style="margin-top: 8px; font-size: 12px;">
        PULL Score methodology based on structural organizational analysis, leadership dynamics, and behavioral economics.
      </p>
    </footer>
  </div>

  <script>
    // Animate tensions on load
    document.addEventListener('DOMContentLoaded', () => {
      const bars = document.querySelectorAll('.tension-bar');
      bars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
          bar.style.width = width;
        }, 100);
      });
    });
  </script>
</body>
</html>`;
  }

  getScoreColor(score) {
    if (score >= 70) return '#10B981'; // Green - High PULL
    if (score >= 50) return '#F59E0B'; // Yellow - Consideration
    if (score >= 30) return '#F97316'; // Orange - Low priority
    return '#EF4444'; // Red - Not in market
  }

  getScoreLabel(category) {
    const labels = {
      'HIGH_PULL': 'HIGH PULL',
      'PULL': 'ACTIVE PULL',
      'HIGH_CONSIDERATION': 'HIGH CONSIDERATION',
      'CONSIDERATION': 'IN CONSIDERATION',
      'LOW_PRIORITY': 'LOW PRIORITY',
      'NOT_IN_MARKET': 'NOT IN MARKET'
    };
    return labels[category] || category || 'ANALYZING';
  }

  getClassificationBg(category) {
    const bgs = {
      'HIGH_PULL': 'rgba(16, 185, 129, 0.15)',
      'PULL': 'rgba(16, 185, 129, 0.15)',
      'HIGH_CONSIDERATION': 'rgba(245, 158, 11, 0.15)',
      'CONSIDERATION': 'rgba(245, 158, 11, 0.15)',
      'LOW_PRIORITY': 'rgba(249, 115, 22, 0.15)',
      'NOT_IN_MARKET': 'rgba(239, 68, 68, 0.15)'
    };
    return bgs[category] || 'rgba(255, 255, 255, 0.1)';
  }

  getScoreHeadline(category, company) {
    const headlines = {
      'HIGH_PULL': `${company} Has Strong PULL - Pursue Immediately`,
      'PULL': `${company} Shows Active Buying Signals`,
      'HIGH_CONSIDERATION': `${company} Likely to Act Soon`,
      'CONSIDERATION': `${company} Worth Nurturing`,
      'LOW_PRIORITY': `${company} Not Urgent - Monitor`,
      'NOT_IN_MARKET': `${company} Not Currently In Market`
    };
    return headlines[category] || `${company} Analysis Complete`;
  }

  formatExecutiveSummary(summary) {
    if (!summary) return 'Analysis complete. Review tensions and champion data below.';
    // Remove markdown formatting
    return summary.replace(/\*\*/g, '').replace(/\n/g, ' ').substring(0, 500);
  }

  renderTensions(tensions) {
    const tensionItems = [
      { key: 'ratio', name: 'Staffing Ratio', icon: '&#128101;' },
      { key: 'leadership', name: 'Leadership Dynamics', icon: '&#128081;' },
      { key: 'growth', name: 'Growth Pressure', icon: '&#128200;' },
      { key: 'resource', name: 'Resource Constraints', icon: '&#128176;' },
      { key: 'reporting', name: 'Reporting Structure', icon: '&#128202;' }
    ];

    return tensionItems.map(item => {
      const tension = tensions[item.key] || {};
      const score = tension.score || 0;
      const color = this.getTensionColor(score);

      return `
        <div class="tension-item">
          <div class="tension-header">
            <span class="tension-name">${item.icon} ${item.name}</span>
            <span class="tension-score" style="color: ${color}">${score}/100</span>
          </div>
          <div class="tension-bar-container">
            <div class="tension-bar" style="width: ${score}%; background: ${color}"></div>
          </div>
          <p class="tension-implication">${tension.implication || 'No significant tension detected'}</p>
        </div>
      `;
    }).join('');
  }

  getTensionColor(score) {
    if (score >= 70) return '#10B981';
    if (score >= 50) return '#F59E0B';
    if (score >= 30) return '#F97316';
    return '#64748B';
  }

  renderChampion(champion) {
    if (!champion || !champion.name) {
      return `
        <div class="no-champion">
          <div class="no-champion-icon">&#128100;</div>
          <h3>No Clear Champion Identified</h3>
          <p>No new security/compliance leadership detected in the last 90 days.<br>
          Consider identifying or creating a champion through education and relationship building.</p>
        </div>
      `;
    }

    const initials = champion.name.split(' ').map(n => n[0]).join('').substring(0, 2);

    return `
      <div class="champion-card">
        <div class="champion-avatar">${initials}</div>
        <div class="champion-info">
          <h3>${champion.name}</h3>
          <p class="champion-title">${champion.title || 'Security Leader'}</p>

          <div class="champion-meta">
            <div class="champion-meta-item">
              <div class="champion-meta-label">Tenure</div>
              <div class="champion-meta-value">${champion.tenure || champion.tenureDays + ' days' || 'Unknown'}</div>
            </div>
            <div class="champion-meta-item">
              <div class="champion-meta-label">Action Window</div>
              <div class="champion-meta-value">${champion.windowRemaining || 'N/A'} days remaining</div>
            </div>
            <div class="champion-meta-item">
              <div class="champion-meta-label">Previous Company</div>
              <div class="champion-meta-value">${champion.previousCompany || 'Unknown'}</div>
            </div>
            <div class="champion-meta-item">
              <div class="champion-meta-label">Urgency Level</div>
              <div class="champion-meta-value">${champion.urgencyLevel || 'N/A'}/100</div>
            </div>
          </div>

          ${champion.insight ? `
          <div class="champion-insight">
            "${champion.insight}"
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderActionWindows(actionWindow) {
    const windows = actionWindow.windows || [];
    if (windows.length === 0) {
      return '<p style="color: var(--text-muted)">No specific action windows identified.</p>';
    }

    return windows.map((window, i) => {
      const isUrgent = window.urgency === 'high';
      return `
        <div class="timeline-item">
          <div class="timeline-dot ${isUrgent ? 'urgent' : ''}"></div>
          <div class="timeline-content">
            <div class="timeline-title">${window.type === 'champion_window' ? 'Champion Window' :
              window.type === 'post_funding' ? 'Post-Funding Phase' :
              window.type === 'fiscal_calendar' ? 'Fiscal Calendar' : window.type}</div>
            <div class="timeline-desc">${window.description}</div>
            ${window.daysRemaining ? `<div style="margin-top: 8px; font-weight: 600; color: ${isUrgent ? 'var(--danger)' : 'var(--accent)'}">${window.daysRemaining} days remaining</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderStrategy(strategy, champion) {
    const pitchAngle = strategy.pitchAngle || {};
    const timing = strategy.timing || {};
    const objections = strategy.objections || [];

    return `
      <div class="strategy-grid">
        <div class="strategy-card strategy-do">
          <h4>Opening Angle</h4>
          <p>${pitchAngle.openingAngle || 'Lead with value and relevance to their situation'}</p>
        </div>

        <div class="strategy-card">
          <h4>Primary Message</h4>
          <p>${pitchAngle.primary?.message || 'Focus on quick wins and measurable impact'}</p>
        </div>

        <div class="strategy-card strategy-avoid">
          <h4>Avoid</h4>
          <p>${Array.isArray(pitchAngle.avoid) ? pitchAngle.avoid.slice(0, 2).join(', ') : 'Generic pitches, long timelines'}</p>
        </div>

        <div class="strategy-card">
          <h4>Timing</h4>
          <p><strong>${timing.urgency === 'high' ? 'Act Now' : 'Monitor'}</strong> - ${timing.rationale?.[0] || 'Timing depends on organizational signals'}</p>
        </div>

        ${objections.length > 0 ? `
        <div class="strategy-card" style="grid-column: span 2;">
          <h4>Anticipated Objections</h4>
          ${objections.slice(0, 3).map(obj => `
            <p style="margin-bottom: 8px;"><strong>${obj.source}:</strong> "${obj.objection}"</p>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">Response: ${obj.response}</p>
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;
  }

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = { OBPReportGenerator };
