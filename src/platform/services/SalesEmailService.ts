import { sendEmail, EmailData } from "./ResendService";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'seller' | 'manager';
  workspaceId: string;
  workspaceName: string;
}

export interface Seller extends User {
  role: 'seller';
  managerId?: string;
}

export interface Manager extends User {
  role: 'manager';
  sellers: Seller[];
}

export interface DailyProgress {
  callsMade: number;
  emailsSent: number;
  meetings: number;
  dealsAdvanced: number;
  newOpportunities: number;
  pipelineValueAdded: number;
  wins: string[];
  activities: string[];
}

export interface WeeklySummary {
  totalCalls: number;
  totalEmails: number;
  totalMeetings: number;
  dealsClosed: number;
  revenueGenerated: number;
  pipelineGrowth: number;
  topWins: string[];
  keyMetrics: Record<string, number>;
}

/**
 * 🏁 Monday Morning Prep Email
 * Sent to sellers on Monday (or first workday of the week) to get them ready
 */
export async function sendMondayPrepEmail(user: Seller): Promise<boolean> {
  const subject = `🏁 Your Week Starts Now: Key Targets & Intel for ${user.workspaceName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
        .content { background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .target-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
        .target-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🏁 Game On, ${user.name}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your week starts now. Here's what you need to know.</p>
        </div>
        
        <div class="content">
          <h2 style="color: #2d3748; margin-top: 0;">This Week's Mission</h2>
          
          <div class="target-grid">
            <div class="target-card">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">🎯 Calls Target</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">50</p>
              <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">High-impact conversations</p>
            </div>
            <div class="target-card">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">📧 Emails Target</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">100</p>
              <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Personalized outreach</p>
            </div>
            <div class="target-card">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">🤝 Meetings Target</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">15</p>
              <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Qualified opportunities</p>
            </div>
            <div class="target-card">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">💼 Deals Advanced</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">5</p>
              <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Pipeline progression</p>
            </div>
          </div>
          
          <div class="highlight">
            <h3 style="margin: 0 0 10px 0; color: #856404;">🔥 Hot Intel</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>3 companies in your territory just raised funding</li>
              <li>2 key prospects have new buying signals</li>
              <li>Your top competitor is having delivery issues</li>
            </ul>
          </div>
          
          <h3 style="color: #2d3748;">Today's Priority Actions</h3>
          <ol style="padding-left: 20px;">
            <li><strong>Review your Speedrun prospects</strong> - 50 high-priority contacts ready for outreach</li>
            <li><strong>Check buyer group intelligence</strong> - New signals detected for 3 accounts</li>
            <li><strong>Update your pipeline</strong> - 11 opportunities need attention</li>
          </ol>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://adrata.com/aos/speedrun" class="cta-button">
              🚀 Launch Speedrun
            </a>
          </div>
          
          <p style="text-align: center; margin-top: 20px; color: #718096; font-size: 14px;">
            Ready to crush this week? Let's go. 💪
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: EmailData = {
    to: user.email,
    subject: subject,
    html: html,
    text: `
🏁 Your Week Starts Now: Key Targets & Intel for ${user.workspaceName}

Hi ${user.name},

Your week starts now. Here's what you need to know.

THIS WEEK'S TARGETS:
• Calls: 50 high-impact conversations
• Emails: 100 personalized outreach
• Meetings: 15 qualified opportunities  
• Deals Advanced: 5 pipeline progression

HOT INTEL:
• 3 companies in your territory just raised funding
• 2 key prospects have new buying signals
• Your top competitor is having delivery issues

TODAY'S PRIORITY ACTIONS:
1. Review your Speedrun prospects - 50 high-priority contacts ready
2. Check buyer group intelligence - New signals for 3 accounts
3. Update your pipeline - 11 opportunities need attention

Ready to crush this week? Launch Speedrun: https://adrata.com/aos/speedrun

Let's go. 💪
    `
  };

  const result = await sendEmail(emailData);
  return result.success;
}

/**
 * 📊 End of Day Progress Email
 * Sent to sellers and managers at end of day with progress summary
 */
export async function sendEndOfDayEmail(user: Seller | Manager, progress: DailyProgress): Promise<boolean> {
  const isManager = user['role'] === 'manager';
  const subject = isManager 
    ? `🏁 Team Daily Wrap: ${progress.dealsAdvanced} Deals Advanced Today`
    : `🏁 Daily Wrap: ${progress.callsMade} Calls, ${progress.emailsSent} Emails, ${progress.dealsAdvanced} Deals Advanced`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; }
        .content { background: white; padding: 25px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .metric-card { background: #f7fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2d3748; margin: 0; }
        .metric-label { color: #718096; font-size: 12px; margin: 5px 0 0 0; }
        .wins-section { background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78; }
        .cta-button { display: inline-block; background: #48bb78; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">📊 ${isManager ? 'Team Daily Wrap' : 'Daily Wrap'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div class="content">
          <h2 style="color: #2d3748; margin-top: 0;">Today's Performance</h2>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <p class="metric-value">${progress.callsMade}</p>
              <p class="metric-label">Calls Made</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">${progress.emailsSent}</p>
              <p class="metric-label">Emails Sent</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">${progress.meetings}</p>
              <p class="metric-label">Meetings</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">${progress.dealsAdvanced}</p>
              <p class="metric-label">Deals Advanced</p>
            </div>
          </div>
          
          ${progress.wins.length > 0 ? `
          <div class="wins-section">
            <h3 style="margin: 0 0 15px 0; color: #2f855a;">🎉 Today's Wins</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${progress.wins.map(win => `<li>${win}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <h3 style="color: #2d3748;">Pipeline Impact</h3>
          <p><strong>New Opportunities:</strong> ${progress.newOpportunities}</p>
          <p><strong>Pipeline Value Added:</strong> $${progress.pipelineValueAdded.toLocaleString()}M</p>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://adrata.com/aos/dashboard" class="cta-button">
              📈 View Full Dashboard
            </a>
          </div>
          
          <p style="text-align: center; margin-top: 15px; color: #718096; font-size: 14px;">
            Great work today. Tomorrow we go again. 💪
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: EmailData = {
    to: user.email,
    subject: subject,
    html: html,
    text: `
${subject}

Hi ${user.name},

Today's Performance:
• Calls Made: ${progress.callsMade}
• Emails Sent: ${progress.emailsSent}
• Meetings: ${progress.meetings}
• Deals Advanced: ${progress.dealsAdvanced}

${progress.wins.length > 0 ? `
Today's Wins:
${progress.wins.map(win => `• ${win}`).join('\n')}
` : ''}

Pipeline Impact:
• New Opportunities: ${progress.newOpportunities}
• Pipeline Value Added: $${progress.pipelineValueAdded}M

View Full Dashboard: https://adrata.com/aos/dashboard

Great work today. Tomorrow we go again. 💪
    `
  };

  const result = await sendEmail(emailData);
  return result.success;
}

/**
 * 🏆 End of Week Summary Email
 * Sent to sellers and managers with weekly performance summary
 */
export async function sendWeeklySummaryEmail(user: Seller | Manager, summary: WeeklySummary): Promise<boolean> {
  const isManager = user['role'] === 'manager';
  const subject = isManager
    ? `🏁 Team Weekly Champions: $${summary.revenueGenerated}M Revenue, ${summary.dealsClosed} Deals Closed`
    : `🏁 Weekly Champion: $${summary.revenueGenerated}M Revenue, ${summary.dealsClosed} Deals Closed`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
        .content { background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .hero-metric { text-align: center; margin: 30px 0; }
        .hero-value { font-size: 48px; font-weight: bold; color: #ed8936; margin: 0; }
        .hero-label { color: #718096; font-size: 16px; margin: 5px 0; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
        .metric-card { background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 28px; font-weight: bold; color: #2d3748; margin: 0; }
        .metric-label { color: #718096; font-size: 14px; margin: 5px 0 0 0; }
        .wins-section { background: #fffaf0; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ed8936; }
        .cta-button { display: inline-block; background: #ed8936; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .quote { font-style: italic; color: #718096; text-align: center; margin: 20px 0; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🏆 ${isManager ? 'Team Weekly Champions' : 'Weekly Champion'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div class="content">
          <div class="hero-metric">
            <p class="hero-value">$${summary.revenueGenerated}M</p>
            <p class="hero-label">Revenue Generated</p>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <p class="metric-value">${summary.totalCalls}</p>
              <p class="metric-label">Total Calls</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">${summary.totalEmails}</p>
              <p class="metric-label">Total Emails</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">${summary.totalMeetings}</p>
              <p class="metric-label">Total Meetings</p>
            </div>
            <div class="metric-card">
              <p class="metric-value">${summary.dealsClosed}</p>
              <p class="metric-label">Deals Closed</p>
            </div>
          </div>
          
          <div class="wins-section">
            <h3 style="margin: 0 0 20px 0; color: #c05621;">🏆 This Week's Top Wins</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${summary.topWins.map(win => `<li style="margin-bottom: 10px;">${win}</li>`).join('')}
            </ul>
          </div>
          
          <h3 style="color: #2d3748;">Pipeline Growth</h3>
          <p><strong>Pipeline Value Growth:</strong> $${summary.pipelineGrowth}M</p>
          <p><strong>New Opportunities Created:</strong> ${summary.keyMetrics.newOpportunities || 0}</p>
          <p><strong>Average Deal Size:</strong> $${summary.keyMetrics.avgDealSize || 0}K</p>
          
          <div class="quote">
            "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing." - Pelé
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://adrata.com/aos/dashboard" class="cta-button">
              🚀 Plan Next Week
            </a>
          </div>
          
          <p style="text-align: center; margin-top: 20px; color: #718096; font-size: 14px;">
            You crushed it this week. Rest up, recharge, and get ready to do it again. 🏆
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: EmailData = {
    to: user.email,
    subject: subject,
    html: html,
    text: `
${subject}

Hi ${user.name},

🏆 WEEKLY CHAMPION SUMMARY

HERO METRIC:
$${summary.revenueGenerated}M Revenue Generated

WEEKLY PERFORMANCE:
• Total Calls: ${summary.totalCalls}
• Total Emails: ${summary.totalEmails}
• Total Meetings: ${summary.totalMeetings}
• Deals Closed: ${summary.dealsClosed}

TOP WINS THIS WEEK:
${summary.topWins.map(win => `• ${win}`).join('\n')}

PIPELINE GROWTH:
• Pipeline Value Growth: $${summary.pipelineGrowth}M
• New Opportunities Created: ${summary.keyMetrics.newOpportunities || 0}
• Average Deal Size: $${summary.keyMetrics.avgDealSize || 0}K

"Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing." - Pelé

Plan Next Week: https://adrata.com/aos/dashboard

You crushed it this week. Rest up, recharge, and get ready to do it again. 🏆
    `
  };

  const result = await sendEmail(emailData);
  return result.success;
}

/**
 * Send manager rollup email with team performance
 */
export async function sendManagerRollupEmail(manager: Manager, teamProgress: DailyProgress[]): Promise<boolean> {
  const totalCalls = teamProgress.reduce((sum, p) => sum + p.callsMade, 0);
  const totalEmails = teamProgress.reduce((sum, p) => sum + p.emailsSent, 0);
  const totalMeetings = teamProgress.reduce((sum, p) => sum + p.meetings, 0);
  const totalDealsAdvanced = teamProgress.reduce((sum, p) => sum + p.dealsAdvanced, 0);

  const subject = `📊 Team Daily Rollup: ${totalCalls} Calls, ${totalEmails} Emails, ${totalDealsAdvanced} Deals Advanced`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; }
        .content { background: white; padding: 25px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .team-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin: 20px 0; }
        .seller-card { background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #4299e1; }
        .seller-name { font-weight: bold; color: #2d3748; margin: 0 0 10px 0; }
        .seller-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .metric { text-align: center; }
        .metric-value { font-weight: bold; color: #4299e1; }
        .metric-label { font-size: 12px; color: #718096; }
        .cta-button { display: inline-block; background: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">📊 Team Daily Rollup</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div class="content">
          <h2 style="color: #2d3748; margin-top: 0;">Team Performance Summary</h2>
          
          <div style="background: #ebf8ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #2b6cb0;">Team Totals</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #2b6cb0;">${totalCalls}</div>
                <div style="font-size: 12px; color: #718096;">Calls</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #2b6cb0;">${totalEmails}</div>
                <div style="font-size: 12px; color: #718096;">Emails</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #2b6cb0;">${totalMeetings}</div>
                <div style="font-size: 12px; color: #718096;">Meetings</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; color: #2b6cb0;">${totalDealsAdvanced}</div>
                <div style="font-size: 12px; color: #718096;">Deals Advanced</div>
              </div>
            </div>
          </div>
          
          <h3 style="color: #2d3748;">Individual Performance</h3>
          <div class="team-grid">
            ${manager.sellers.map(seller => {
              const progress = teamProgress.find(p => p['userId'] === seller.id) || {
                callsMade: 0, emailsSent: 0, meetings: 0, dealsAdvanced: 0
              };
              return `
                <div class="seller-card">
                  <div class="seller-name">${seller.name}</div>
                  <div class="seller-metrics">
                    <div class="metric">
                      <div class="metric-value">${progress.callsMade}</div>
                      <div class="metric-label">Calls</div>
                    </div>
                    <div class="metric">
                      <div class="metric-value">${progress.emailsSent}</div>
                      <div class="metric-label">Emails</div>
                    </div>
                    <div class="metric">
                      <div class="metric-value">${progress.meetings}</div>
                      <div class="metric-label">Meetings</div>
                    </div>
                    <div class="metric">
                      <div class="metric-value">${progress.dealsAdvanced}</div>
                      <div class="metric-label">Deals</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://adrata.com/aos/dashboard" class="cta-button">
              📈 View Team Dashboard
            </a>
          </div>
          
          <p style="text-align: center; margin-top: 15px; color: #718096; font-size: 14px;">
            Your team crushed it today. Lead them to victory tomorrow. 💪
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: EmailData = {
    to: manager.email,
    subject: subject,
    html: html,
    text: `
${subject}

Hi ${manager.name},

TEAM PERFORMANCE SUMMARY:

Team Totals:
• Calls: ${totalCalls}
• Emails: ${totalEmails}
• Meetings: ${totalMeetings}
• Deals Advanced: ${totalDealsAdvanced}

Individual Performance:
${manager.sellers.map(seller => {
  const progress = teamProgress.find(p => p['userId'] === seller.id) || {
    callsMade: 0, emailsSent: 0, meetings: 0, dealsAdvanced: 0
  };
  return `• ${seller.name}: ${progress.callsMade} calls, ${progress.emailsSent} emails, ${progress.meetings} meetings, ${progress.dealsAdvanced} deals`;
}).join('\n')}

View Team Dashboard: https://adrata.com/aos/dashboard

Your team crushed it today. Lead them to victory tomorrow. 💪
    `
  };

  const result = await sendEmail(emailData);
  return result.success;
}

/**
 * 🏁 Friday Combined Email (Daily + Weekly)
 * Sent to sellers and managers on Friday with both daily progress and weekly summary
 */
export async function sendFridayCombinedEmail(user: Seller | Manager, dailyProgress: DailyProgress, weeklySummary: WeeklySummary): Promise<boolean> {
  const isManager = user['role'] === 'manager';
  const subject = isManager
    ? `🏁 Friday Wrap: $${weeklySummary.revenueGenerated}M Weekly Revenue, ${dailyProgress.dealsAdvanced} Deals Today`
    : `🏁 Friday Wrap: $${weeklySummary.revenueGenerated}M Weekly Revenue, ${dailyProgress.dealsAdvanced} Deals Today`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
        .content { background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section { margin: 30px 0; }
        .section-title { color: #2d3748; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .metric-card { background: #f7fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2d3748; margin: 0; }
        .metric-label { color: #718096; font-size: 12px; margin: 5px 0 0 0; }
        .hero-metric { text-align: center; margin: 30px 0; }
        .hero-value { font-size: 48px; font-weight: bold; color: #667eea; margin: 0; }
        .hero-label { color: #718096; font-size: 16px; margin: 5px 0; }
        .wins-section { background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78; }
        .weekly-wins { background: #fffaf0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ed8936; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .quote { font-style: italic; color: #718096; text-align: center; margin: 20px 0; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🏁 Friday Wrap</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div class="content">
          <div class="hero-metric">
            <p class="hero-value">$${weeklySummary.revenueGenerated}M</p>
            <p class="hero-label">Weekly Revenue Generated</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">📊 Today's Performance</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <p class="metric-value">${dailyProgress.callsMade}</p>
                <p class="metric-label">Calls Made</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">${dailyProgress.emailsSent}</p>
                <p class="metric-label">Emails Sent</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">${dailyProgress.meetings}</p>
                <p class="metric-label">Meetings</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">${dailyProgress.dealsAdvanced}</p>
                <p class="metric-label">Deals Advanced</p>
              </div>
            </div>
            
            ${dailyProgress.wins.length > 0 ? `
            <div class="wins-section">
              <h3 style="margin: 0 0 15px 0; color: #2f855a;">🎉 Today's Wins</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${dailyProgress.wins.map(win => `<li>${win}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
          
          <div class="section">
            <h2 class="section-title">🏆 Weekly Summary</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <p class="metric-value">${weeklySummary.totalCalls}</p>
                <p class="metric-label">Total Calls</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">${weeklySummary.totalEmails}</p>
                <p class="metric-label">Total Emails</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">${weeklySummary.totalMeetings}</p>
                <p class="metric-label">Total Meetings</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">${weeklySummary.dealsClosed}</p>
                <p class="metric-label">Deals Closed</p>
              </div>
            </div>
            
            <div class="weekly-wins">
              <h3 style="margin: 0 0 20px 0; color: #c05621;">🏆 This Week's Top Wins</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${weeklySummary.topWins.map(win => `<li style="margin-bottom: 10px;">${win}</li>`).join('')}
              </ul>
            </div>
            
            <h3 style="color: #2d3748;">Pipeline Growth</h3>
            <p><strong>Pipeline Value Growth:</strong> $${weeklySummary.pipelineGrowth}M</p>
            <p><strong>New Opportunities Created:</strong> ${weeklySummary.keyMetrics.newOpportunities || 0}</p>
            <p><strong>Average Deal Size:</strong> $${weeklySummary.keyMetrics.avgDealSize || 0}K</p>
          </div>
          
          <div class="quote">
            "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing." - Pelé
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://adrata.com/aos/dashboard" class="cta-button">
              🚀 Plan Next Week
            </a>
          </div>
          
          <p style="text-align: center; margin-top: 20px; color: #718096; font-size: 14px;">
            You crushed it this week. Rest up, recharge, and get ready to do it again. 🏁
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: EmailData = {
    to: user.email,
    subject: subject,
    html: html,
    text: `
${subject}

Hi ${user.name},

🏁 FRIDAY WRAP - DAILY + WEEKLY SUMMARY

HERO METRIC:
$${weeklySummary.revenueGenerated}M Weekly Revenue Generated

TODAY'S PERFORMANCE:
• Calls Made: ${dailyProgress.callsMade}
• Emails Sent: ${dailyProgress.emailsSent}
• Meetings: ${dailyProgress.meetings}
• Deals Advanced: ${dailyProgress.dealsAdvanced}

${dailyProgress.wins.length > 0 ? `
TODAY'S WINS:
${dailyProgress.wins.map(win => `• ${win}`).join('\n')}
` : ''}

WEEKLY PERFORMANCE:
• Total Calls: ${weeklySummary.totalCalls}
• Total Emails: ${weeklySummary.totalEmails}
• Total Meetings: ${weeklySummary.totalMeetings}
• Deals Closed: ${weeklySummary.dealsClosed}

TOP WINS THIS WEEK:
${weeklySummary.topWins.map(win => `• ${win}`).join('\n')}

PIPELINE GROWTH:
• Pipeline Value Growth: $${weeklySummary.pipelineGrowth}M
• New Opportunities Created: ${weeklySummary.keyMetrics.newOpportunities || 0}
• Average Deal Size: $${weeklySummary.keyMetrics.avgDealSize || 0}K

"Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing." - Pelé

Plan Next Week: https://adrata.com/aos/dashboard

You crushed it this week. Rest up, recharge, and get ready to do it again. 🏁
    `
  };

  const result = await sendEmail(emailData);
  return result.success;
}
