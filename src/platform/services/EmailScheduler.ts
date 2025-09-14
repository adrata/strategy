import { prisma } from '@/platform/database/prisma-client';
import { generateEmailContent, EmailContext } from './EmailContentGenerator';
import { sendMondayPrepEmail, sendEndOfDayEmail, sendFridayCombinedEmail, DailyProgress, WeeklySummary } from './SalesEmailService';
import { shouldSendEmailNow, getUserSchedule } from './EmailContentGenerator';

export interface UserEmailSettings {
  id: string;
  email: string;
  name: string;
  timezone: string;
  workspaceId: string;
  workspaceName: string;
  role: 'seller' | 'manager';
  isActive: boolean;
  emailPreferences: {
    mondayPrep: boolean;
    dailyWrap: boolean;
    weeklySummary: boolean;
    fridayCombined: boolean;
  };
}

/**
 * Production Email Scheduler
 * Handles timezone-aware email scheduling and sending
 */
export class EmailScheduler {
  private static instance: EmailScheduler;
  
  private constructor() {}
  
  static getInstance(): EmailScheduler {
    if (!EmailScheduler.instance) {
      EmailScheduler['instance'] = new EmailScheduler();
    }
    return EmailScheduler.instance;
  }
  
  /**
   * Get all users who should receive emails
   */
  async getActiveUsers(): Promise<UserEmailSettings[]> {
    try {
      const users = await prisma.users.findMany({
        where: {
          isActive: true,
          workspaceMemberships: {
            some: {
              workspace: {
                isActive: true
              }
            }
          }
        },
        include: {
          workspaceMemberships: {
            include: {
              workspace: true
            }
          }
        }
      });
      
      return users.map(user => {
        const primaryWorkspace = user['workspaceMemberships'][0]?.workspace;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone || 'America/New_York',
          workspaceId: primaryWorkspace?.id || '',
          workspaceName: primaryWorkspace?.name || 'Adrata',
          role: this.determineUserRole(user),
          isActive: user.isActive,
          emailPreferences: {
            mondayPrep: true,
            dailyWrap: true,
            weeklySummary: true,
            fridayCombined: true
          }
        };
      });
    } catch (error) {
      console.error('Error fetching active users:', error);
      return [];
    }
  }
  
  /**
   * Determine if user is a manager based on their role/position
   */
  private determineUserRole(user: any): 'seller' | 'manager' {
    const title = user.title?.toLowerCase() || '';
    const department = user.department?.toLowerCase() || '';
    
    const managerKeywords = ['manager', 'director', 'vp', 'head', 'lead', 'supervisor'];
    const isManager = managerKeywords.some(keyword => 
      title.includes(keyword) || department.includes(keyword)
    );
    
    return isManager ? 'manager' : 'seller';
  }
  
  /**
   * Get user's daily progress data
   */
  async getUserDailyProgress(userId: string, date: Date = new Date()): Promise<DailyProgress> {
    try {
      // This would integrate with your actual data sources
      // For now, returning mock data
      return {
        callsMade: Math.floor(Math.random() * 20) + 5,
        emailsSent: Math.floor(Math.random() * 50) + 20,
        meetings: Math.floor(Math.random() * 5) + 1,
        dealsAdvanced: Math.floor(Math.random() * 3) + 1,
        newOpportunities: Math.floor(Math.random() * 2) + 1,
        pipelineValueAdded: Math.random() * 5 + 1,
        wins: [
          'Booked 3 meetings for next week',
          'Advanced 2 deals to proposal stage',
          'Generated 5 new qualified leads'
        ],
        activities: [
          'Called 15 prospects',
          'Sent 45 personalized emails',
          'Had 2 discovery meetings'
        ]
      };
    } catch (error) {
      console.error('Error fetching user daily progress:', error);
      return {
        callsMade: 0,
        emailsSent: 0,
        meetings: 0,
        dealsAdvanced: 0,
        newOpportunities: 0,
        pipelineValueAdded: 0,
        wins: [],
        activities: []
      };
    }
  }
  
  /**
   * Get user's weekly summary data
   */
  async getUserWeeklySummary(userId: string, date: Date = new Date()): Promise<WeeklySummary> {
    try {
      // This would integrate with your actual data sources
      // For now, returning mock data
      return {
        totalCalls: Math.floor(Math.random() * 100) + 50,
        totalEmails: Math.floor(Math.random() * 200) + 100,
        totalMeetings: Math.floor(Math.random() * 20) + 10,
        dealsClosed: Math.floor(Math.random() * 5) + 1,
        revenueGenerated: Math.random() * 200 + 50,
        pipelineGrowth: Math.random() * 50 + 10,
        topWins: [
          'Closed $150K in new revenue',
          'Advanced 8 opportunities to next stage',
          'Generated 15 new qualified leads',
          'Exceeded weekly targets by 20%'
        ],
        keyMetrics: {
          newOpportunities: Math.floor(Math.random() * 10) + 5,
          avgDealSize: Math.floor(Math.random() * 50) + 25,
          conversionRate: Math.floor(Math.random() * 20) + 10,
          pipelineVelocity: Math.floor(Math.random() * 30) + 20
        }
      };
    } catch (error) {
      console.error('Error fetching user weekly summary:', error);
      return {
        totalCalls: 0,
        totalEmails: 0,
        totalMeetings: 0,
        dealsClosed: 0,
        revenueGenerated: 0,
        pipelineGrowth: 0,
        topWins: [],
        keyMetrics: {}
      };
    }
  }
  
  /**
   * Send Monday prep email to user
   */
  async sendMondayPrepEmail(user: UserEmailSettings): Promise<boolean> {
    try {
      const progress = await this.getUserDailyProgress(user.id);
      
      const emailContent = await generateEmailContent({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
          title: user.role
        },
        workspace: {
          id: user.workspaceId,
          name: user.workspaceName
        },
        progress,
        emailType: 'monday-prep',
        isManager: user['role'] === 'manager'
      });
      
      // Add red flag if needed
      const subject = emailContent.useRedFlag 
        ? `🚨 ${emailContent.subject}` 
        : emailContent.subject;
      
      const success = await sendMondayPrepEmail({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        workspaceName: user.workspaceName
      });
      
      if (success) {
        console.log(`✅ Monday prep email sent to ${user.name} (${user.email})`);
        await this.logEmailSent(user.id, 'monday-prep', subject);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Error sending Monday prep email to ${user.email}:`, error);
      return false;
    }
  }
  
  /**
   * Send daily wrap email to user
   */
  async sendDailyWrapEmail(user: UserEmailSettings): Promise<boolean> {
    try {
      const progress = await this.getUserDailyProgress(user.id);
      
      const emailContent = await generateEmailContent({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
          title: user.role
        },
        workspace: {
          id: user.workspaceId,
          name: user.workspaceName
        },
        progress,
        emailType: 'daily-wrap',
        isManager: user['role'] === 'manager'
      });
      
      const subject = emailContent.useRedFlag 
        ? `🚨 ${emailContent.subject}` 
        : emailContent.subject;
      
      const success = await sendEndOfDayEmail({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        workspaceName: user.workspaceName
      }, progress);
      
      if (success) {
        console.log(`✅ Daily wrap email sent to ${user.name} (${user.email})`);
        await this.logEmailSent(user.id, 'daily-wrap', subject);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Error sending daily wrap email to ${user.email}:`, error);
      return false;
    }
  }
  
  /**
   * Send Friday combined email to user
   */
  async sendFridayCombinedEmail(user: UserEmailSettings): Promise<boolean> {
    try {
      const dailyProgress = await this.getUserDailyProgress(user.id);
      const weeklySummary = await this.getUserWeeklySummary(user.id);
      
      const emailContent = await generateEmailContent({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          timezone: user.timezone,
          title: user.role
        },
        workspace: {
          id: user.workspaceId,
          name: user.workspaceName
        },
        progress: dailyProgress,
        summary: weeklySummary,
        emailType: 'friday-combined',
        isManager: user['role'] === 'manager'
      });
      
      const subject = emailContent.useRedFlag 
        ? `🚨 ${emailContent.subject}` 
        : emailContent.subject;
      
      const success = await sendFridayCombinedEmail({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
        workspaceName: user.workspaceName
      }, dailyProgress, weeklySummary);
      
      if (success) {
        console.log(`✅ Friday combined email sent to ${user.name} (${user.email})`);
        await this.logEmailSent(user.id, 'friday-combined', subject);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Error sending Friday combined email to ${user.email}:`, error);
      return false;
    }
  }
  
  /**
   * Log email sent for tracking
   */
  async logEmailSent(userId: string, emailType: string, subject: string): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'email_sent',
          details: {
            emailType,
            subject,
            sentAt: new Date().toISOString()
          },
          workspaceId: 'system'
        }
      });
    } catch (error) {
      console.error('Error logging email sent:', error);
    }
  }
  
  /**
   * Main scheduling function - runs every minute
   */
  async runScheduler(): Promise<void> {
    console.log('🕐 Running email scheduler...');
    
    try {
      const users = await this.getActiveUsers();
      const now = new Date();
      const currentDay = now.getDay();
      
      for (const user of users) {
        // Check if it's time to send emails for this user
        if (shouldSendEmailNow(user, 'monday-prep') && user.emailPreferences.mondayPrep) {
          await this.sendMondayPrepEmail(user);
        }
        
        if (shouldSendEmailNow(user, 'daily-wrap') && user.emailPreferences.dailyWrap) {
          // Don't send daily wrap on Friday (use combined instead)
          if (currentDay !== 5) {
            await this.sendDailyWrapEmail(user);
          }
        }
        
        if (shouldSendEmailNow(user, 'friday-combined') && user.emailPreferences.fridayCombined) {
          await this.sendFridayCombinedEmail(user);
        }
      }
      
      console.log(`✅ Email scheduler completed for ${users.length} users`);
    } catch (error) {
      console.error('❌ Error in email scheduler:', error);
    }
  }
  
  /**
   * Start the email scheduler
   */
  startScheduler(): void {
    console.log('🚀 Starting email scheduler...');
    
    // Run every minute
    setInterval(() => {
      this.runScheduler();
    }, 60 * 1000);
    
    // Also run immediately
    this.runScheduler();
  }
}
