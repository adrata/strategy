import { prisma } from '@/platform/database/prisma-client';

export interface EmailContext {
  user: {
    id: string;
    name: string;
    email: string;
    timezone?: string;
    title?: string;
    department?: string;
    communicationStyle?: string;
  };
  workspace: {
    id: string;
    name: string;
  };
  progress: {
    callsMade: number;
    emailsSent: number;
    meetings: number;
    dealsAdvanced: number;
    newOpportunities: number;
    pipelineValueAdded: number;
    wins: string[];
    activities: string[];
  };
  summary?: {
    totalCalls: number;
    totalEmails: number;
    totalMeetings: number;
    dealsClosed: number;
    revenueGenerated: number;
    pipelineGrowth: number;
    topWins: string[];
    keyMetrics: Record<string, number>;
  };
  emailType: 'monday-prep' | 'daily-wrap' | 'weekly-summary' | 'friday-combined';
  isManager: boolean;
  teamProgress?: any[];
}

export interface GeneratedEmail {
  subject: string;
  heroMessage: string;
  keyInsights: string[];
  callToAction: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  useRedFlag: boolean;
  redFlagReason?: string;
}

/**
 * Generate professional, engaging email content using LLM
 * Inspired by Milk Road's engaging style but more professional
 */
export async function generateEmailContent(context: EmailContext): Promise<GeneratedEmail> {
  const { user, workspace, progress, summary, emailType, isManager } = context;
  
  // Build the prompt for the LLM
  const prompt = buildEmailPrompt(context);
  
  try {
    // Use your existing LLM service to generate content
    const response = await generateWithLLM(prompt);
    
    // Parse the response and extract components
    const emailContent = parseLLMResponse(response);
    
    // Determine if red flag should be used
    const shouldUseRedFlag = determineRedFlagUsage(context, emailContent);
    
    return {
      subject: emailContent.subject,
      heroMessage: emailContent.heroMessage,
      keyInsights: emailContent.keyInsights,
      callToAction: emailContent.callToAction,
      urgencyLevel: emailContent.urgencyLevel,
      useRedFlag: shouldUseRedFlag.use,
      redFlagReason: shouldUseRedFlag.reason
    };
  } catch (error) {
    console.error('Error generating email content:', error);
    return generateFallbackEmail(context);
  }
}

function buildEmailPrompt(context: EmailContext): string {
  const { user, workspace, progress, summary, emailType, isManager } = context;
  
  const basePrompt = `
You are a professional sales coach and email writer for Adrata, a Sales Acceleration platform. 
Create engaging, professional email content that motivates sales professionals to take action.

USER CONTEXT:
- Name: ${user.name}
- Role: ${isManager ? 'Manager' : 'Seller'}
- Communication Style: ${user.communicationStyle || 'consultative'}
- Workspace: ${workspace.name}
- Timezone: ${user.timezone || 'ET'}

EMAIL TYPE: ${emailType.toUpperCase()}

PERFORMANCE DATA:
${buildPerformanceData(context)}

REQUIREMENTS:
1. Subject line: Use 🏁 emoji, be engaging but professional
2. Hero message: One compelling sentence that captures attention
3. Key insights: 3-4 actionable insights based on data
4. Call to action: Clear, specific action to drive platform engagement
5. Tone: Professional but engaging, like a high-quality business newsletter
6. Length: Succinct, no fluff
7. Urgency: Determine if content suggests urgency (low/medium/high)

FORMAT YOUR RESPONSE AS JSON:
{
  "subject": "🏁 [Engaging subject line]",
  "heroMessage": "One compelling sentence",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "callToAction": "Specific action to take",
  "urgencyLevel": "low|medium|high"
}
`;

  return basePrompt;
}

function buildPerformanceData(context: EmailContext): string {
  const { progress, summary, emailType } = context;
  
  let data = `
TODAY'S PERFORMANCE:
- Calls: ${progress.callsMade}
- Emails: ${progress.emailsSent}
- Meetings: ${progress.meetings}
- Deals Advanced: ${progress.dealsAdvanced}
- New Opportunities: ${progress.newOpportunities}
- Pipeline Value Added: $${progress.pipelineValueAdded}M
- Wins: ${progress.wins.join(', ')}
`;

  if (summary) {
    data += `
WEEKLY PERFORMANCE:
- Total Calls: ${summary.totalCalls}
- Total Emails: ${summary.totalEmails}
- Total Meetings: ${summary.totalMeetings}
- Deals Closed: ${summary.dealsClosed}
- Revenue Generated: $${summary.revenueGenerated}M
- Pipeline Growth: $${summary.pipelineGrowth}M
- Top Wins: ${summary.topWins.join(', ')}
`;
  }
  
  return data;
}

async function generateWithLLM(prompt: string): Promise<string> {
  // This would integrate with your existing LLM service
  // For now, I'll create a mock implementation
  // You should replace this with your actual LLM service call
  
  // Mock response for demonstration
  const mockResponse = {
    subject: "🏁 Your Pipeline Just Got Stronger",
    heroMessage: "You're building momentum that your competitors can't match.",
    keyInsights: [
      "Your call-to-meeting ratio is 15% above average",
      "3 deals moved to proposal stage today",
      "Pipeline value grew by $2.5M this week"
    ],
    callToAction: "Review your Speedrun prospects and book 3 meetings for tomorrow",
    urgencyLevel: "medium"
  };
  
  return JSON.stringify(mockResponse);
}

function parseLLMResponse(response: string): any {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    throw new Error('Invalid LLM response format');
  }
}

function determineRedFlagUsage(context: EmailContext, emailContent: any): { use: boolean; reason?: string } {
  const { progress, summary } = context;
  
  // Only use red flag for genuine issues, not more than 10% of emails
  const redFlagTriggers = [
    { condition: progress.callsMade < 5, reason: 'Low call volume today' },
    { condition: progress['dealsAdvanced'] === 0, reason: 'No deals advanced today' },
    { condition: summary && summary.revenueGenerated < 50, reason: 'Weekly revenue below target' },
    { condition: progress.pipelineValueAdded < 1, reason: 'Low pipeline growth' }
  ];
  
  const triggered = redFlagTriggers.find(trigger => trigger.condition);
  
  if (triggered && Math.random() < 0.1) { // 10% chance to use red flag
    return { use: true, reason: triggered.reason };
  }
  
  return { use: false };
}

function generateFallbackEmail(context: EmailContext): GeneratedEmail {
  const { user, progress, emailType } = context;
  
  const fallbackSubjects = {
    'monday-prep': `🏁 Your Week Starts Now: Key Targets for ${user.name}`,
    'daily-wrap': `🏁 Daily Wrap: ${progress.callsMade} Calls, ${progress.dealsAdvanced} Deals Advanced`,
    'weekly-summary': `🏁 Weekly Champion: $${progress.pipelineValueAdded}M Pipeline Growth`,
    'friday-combined': `🏁 Friday Wrap: $${progress.pipelineValueAdded}M Weekly Growth`
  };
  
  return {
    subject: fallbackSubjects[emailType],
    heroMessage: "You're making progress that matters.",
    keyInsights: [
      "Your activity is building momentum",
      "Focus on quality conversations",
      "Pipeline growth requires consistent effort"
    ],
    callToAction: "Review your dashboard and plan tomorrow's priorities",
    urgencyLevel: "low",
    useRedFlag: false
  };
}

/**
 * Get user's timezone-adjusted schedule
 */
export function getUserSchedule(user: any) {
  const timezone = user.timezone || 'America/New_York';
  
  return {
    startTime: '08:00', // 8 AM in user's timezone
    endTime: '17:00',   // 5 PM in user's timezone
    timezone: timezone
  };
}

/**
 * Check if it's time to send emails based on user's timezone
 */
export function shouldSendEmailNow(user: any, emailType: string): boolean {
  const schedule = getUserSchedule(user);
  const now = new Date();
  
  // Convert to user's timezone
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: schedule.timezone }));
  const currentHour = userTime.getHours();
  const currentDay = userTime.getDay();
  
  switch (emailType) {
    case 'monday-prep':
      return currentDay === 1 && currentHour === 8; // Monday 8 AM
    case 'daily-wrap':
      return currentDay >= 1 && currentDay <= 5 && currentHour === 17; // Weekdays 5 PM
    case 'friday-combined':
      return currentDay === 5 && currentHour === 17; // Friday 5 PM
    default:
      return false;
  }
}
