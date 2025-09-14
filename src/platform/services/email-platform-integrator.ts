/**
 * Email Platform Integration Service
 * Multi-platform email support with delivery tracking, sentiment analysis, and auto-follow-up
 */

import { prisma } from "@/platform/prisma";
// Pusher integration temporarily disabled to prevent connection errors
// import { pusherClient } from "@/platform/pusher";

export interface EmailAccount {
  id: string;
  workspaceId: string;
  userId: string;
  platform: "gmail" | "outlook" | "exchange" | "imap";
  email: string;
  displayName: string;
  isActive: boolean;
  lastSyncAt: Date;
  syncStatus: "healthy" | "warning" | "error";
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    imapConfig?: {
      host: string;
      port: number;
      secure: boolean;
    };
  };
  settings: {
    autoSync: boolean;
    syncFrequency: number; // minutes
    enableDeliveryTracking: boolean;
    enableSentimentAnalysis: boolean;
    autoFollowUp: boolean;
  };
}

export interface EmailMessage {
  id: string;
  messageId: string;
  threadId: string;
  accountId: string;
  subject: string;
  body: string;
  bodyHtml: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo?: string;
  sentAt: Date;
  receivedAt: Date;
  isRead: boolean;
  isImportant: boolean;
  labels: string[];
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
  }>;
  tracking?: EmailTracking;
  sentiment?: EmailSentiment;
}

export interface EmailTracking {
  messageId: string;
  status: "sent" | "delivered" | "opened" | "clicked" | "replied" | "bounced";
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
  openCount: number;
  clickCount: number;
  deviceInfo?: {
    platform: string;
    browser: string;
    location: string;
  };
  engagement: {
    score: number; // 0-1
    timeSpentReading: number; // seconds
    interactionLevel: "low" | "medium" | "high";
  };
}

export interface EmailSentiment {
  messageId: string;
  overallSentiment: "positive" | "neutral" | "negative";
  sentimentScore: number; // -1 to 1
  emotions: Array<{
    emotion: string;
    confidence: number;
  }>;
  intent:
    | "inquiry"
    | "complaint"
    | "compliment"
    | "request"
    | "objection"
    | "interest";
  urgency: "low" | "medium" | "high";
  confidence: number;
  keyPhrases: string[];
}

export interface EmailSequence {
  id: string;
  name: string;
  workspaceId: string;
  userId: string;
  templateEmails: Array<{
    order: number;
    subject: string;
    body: string;
    delayDays: number;
    conditions?: {
      opened?: boolean;
      clicked?: boolean;
      replied?: boolean;
    };
  }>;
  isActive: boolean;
  stats: {
    enrollments: number;
    completions: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
  };
}

export interface EmailCampaign {
  id: string;
  sequenceId: string;
  contactId: string;
  status: "active" | "paused" | "completed" | "stopped";
  currentStep: number;
  enrolledAt: Date;
  completedAt?: Date;
  sentEmails: Array<{
    stepNumber: number;
    emailId: string;
    sentAt: Date;
    status: EmailTracking["status"];
  }>;
}

export class EmailPlatformIntegrator {
  /**
   * Connect an email account to the platform
   */
  static async connectEmailAccount(
    workspaceId: string,
    userId: string,
    platform: EmailAccount["platform"],
    credentials: any,
    settings?: Partial<EmailAccount["settings"]>,
  ): Promise<EmailAccount> {
    console.log(`📧 Connecting ${platform} account for user ${userId}`);

    // Validate credentials based on platform
    await this.validateCredentials(platform, credentials);

    // Create email account record
    const account: EmailAccount = {
      id: `account_${Date.now()}_${userId}`,
      workspaceId,
      userId,
      platform,
      email: credentials.email || "unknown@example.com",
      displayName: credentials.displayName || "Unknown User",
      isActive: true,
      lastSyncAt: new Date(),
      syncStatus: "healthy",
      credentials: {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        imapConfig: credentials.imapConfig,
      },
      settings: {
        autoSync: true,
        syncFrequency: 15,
        enableDeliveryTracking: true,
        enableSentimentAnalysis: true,
        autoFollowUp: false,
        ...settings,
      },
    };

    // Store in database (using enrichment cache for now)
    await this.storeEmailAccount(account);

    // Start initial sync
    await this.syncEmailAccount(account.id);

    // Set up real-time notifications if supported
    if (platform === 'outlook') {
      await this.setupOutlookWebhook(account.id);
    }

    // Trigger real-time notification (temporarily disabled)
    // if (pusherClient) {
    //   await pusherClient.trigger(
    //     `workspace-${workspaceId}`,
    //     "email-account-connected",
    //     { accountId: account.id, platform, email: account.email },
    //   );
    // }

    return account;
  }

  /**
   * Send email with tracking and follow-up capabilities
   */
  static async sendTrackedEmail(
    accountId: string,
    emailData: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      bodyHtml?: string;
      replyTo?: string;
      attachments?: any[];
    },
    options: {
      enableTracking?: boolean;
      enableSentimentAnalysis?: boolean;
      sequenceId?: string;
      campaignId?: string;
    } = {},
  ): Promise<EmailMessage> {
    console.log(`📤 Sending tracked email via account ${accountId}`);

    // Get email account
    const account = await this.getEmailAccount(accountId);
    if (!account) {
      throw new Error("Email account not found");
    }

    // Add tracking pixels and click tracking if enabled
    let enhancedBody = emailData.body;
    let enhancedBodyHtml =
      emailData.bodyHtml || this.convertToHtml(emailData.body);

    if (options['enableTracking'] && account.settings.enableDeliveryTracking) {
      enhancedBodyHtml = await this.addTrackingElements(
        enhancedBodyHtml,
        accountId,
      );
    }

    // Send email based on platform
    const messageId = await this.sendEmailViaPlatform(account, {
      ...emailData,
      body: enhancedBody,
      bodyHtml: enhancedBodyHtml,
    });

    // Create email message record
    const emailMessage: EmailMessage = {
      id: `email_${Date.now()}_${accountId}`,
      messageId,
      threadId: `thread_${Date.now()}`,
      accountId,
      subject: emailData.subject,
      body: emailData.body,
      bodyHtml: enhancedBodyHtml,
      from: account.email,
      to: emailData.to,
      cc: emailData.cc || [],
      bcc: emailData.bcc || [],
      replyTo: emailData.replyTo,
      sentAt: new Date(),
      receivedAt: new Date(),
      isRead: false,
      isImportant: false,
      labels: ["sent"],
      attachments: emailData.attachments || [],
      tracking: options.enableTracking
        ? {
            messageId,
            status: "sent",
            openCount: 0,
            clickCount: 0,
            engagement: {
              score: 0,
              timeSpentReading: 0,
              interactionLevel: "low",
            },
          }
        : undefined,
    };

    // Store email message
    await this.storeEmailMessage(emailMessage);

    // Start sentiment analysis if enabled
    if (
      options['enableSentimentAnalysis'] &&
      account.settings.enableSentimentAnalysis
    ) {
      setTimeout(() => this.analyzeEmailSentiment(emailMessage.id), 1000);
    }

    // Trigger real-time notification (temporarily disabled)
    // if (pusherClient) {
    //   await pusherClient.trigger(`workspace-${account.workspaceId}`, "email-sent", {
    //     emailId: emailMessage.id,
    //     messageId,
    //     to: emailData.to,
    //   });
    // }

    return emailMessage;
  }

  /**
   * Sync emails from Outlook/Microsoft Graph API
   */
  static async syncOutlookEmails(accountId: string): Promise<{ success: boolean; count: number; error?: string }> {
    console.log(`📧 Starting Outlook email sync for account: ${accountId}`);

    try {
      const account = await this.getEmailAccount(accountId);
      if (!account || account.platform !== 'outlook') {
        return { success: false, count: 0, error: 'Invalid Outlook account' };
      }

      // Get the latest sync timestamp to only fetch new emails
      const lastSyncAt = account.lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days default
      const filterDate = lastSyncAt.toISOString();

      console.log(`📧 Fetching Outlook emails since: ${filterDate}`);

      // Fetch emails from Microsoft Graph API (limit to 1000 to get all emails)
      const emailsResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${filterDate}&$orderby=receivedDateTime desc&$top=1000`,
        {
          headers: {
            'Authorization': `Bearer ${account.credentials.accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!emailsResponse.ok) {
        const errorText = await emailsResponse.text();
        throw new Error(`Microsoft Graph API error: ${emailsResponse.status} - ${errorText}`);
      }

      const emailsData = await emailsResponse.json();
      const emails = emailsData.value || [];

      console.log(`📧 Retrieved ${emails.length} emails from Outlook`);

      let syncCount = 0;

      // Process emails in batches to prevent timeout
      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < emails.length; i += batchSize) {
        batches.push(emails.slice(i, i + batchSize));
      }

      console.log(`📧 Processing ${emails.length} emails in ${batches.length} batches of ${batchSize}`);

      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);
        
        for (const email of batch) {
          try {
            // Convert Microsoft Graph email to our format
            const emailMessage: EmailMessage = {
              id: `outlook_${email.id}`,
              messageId: email.internetMessageId || email.id,
              threadId: email.conversationId || `thread_${email.id}`,
              accountId: account.id,
              subject: email.subject || '',
              body: email.body?.content || '',
              bodyHtml: email.body?.contentType === 'html' ? email.body.content : undefined,
              from: email.from?.emailAddress?.address || '',
              to: email.toRecipients?.map((r: any) => r.emailAddress.address) || [],
              cc: email.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
              bcc: email.bccRecipients?.map((r: any) => r.emailAddress.address) || [],
              replyTo: email.replyTo?.[0]?.emailAddress?.address,
              sentAt: email.sentDateTime ? new Date(email.sentDateTime) : new Date(),
              receivedAt: email.receivedDateTime ? new Date(email.receivedDateTime) : new Date(),
              isRead: email.isRead || false,
              isImportant: email['importance'] === 'high' || false,
              labels: [
                ...(email.categories || []),
                ...(email.flag?.flagStatus === 'flagged' ? ['flagged'] : []),
                ...(email.isDraft ? ['draft'] : []),
              ],
              attachments: [], // Skip attachments for now to prevent timeout
              tracking: undefined, // Will be populated if tracking is enabled
            };

            // Save email to database
            console.log(`💾 Storing email: ${emailMessage.subject} from ${emailMessage.from}`);
            await this.storeEmailMessage(emailMessage);
            syncCount++;
            console.log(`✅ Successfully stored email ${syncCount}: ${emailMessage.subject}`);

            if (syncCount % 5 === 0) {
              console.log(`📧 Processed ${syncCount}/${emails.length} emails...`);
            }

          } catch (emailError) {
            console.error(`❌ Failed to process email ${email.id}:`, emailError);
            // Continue processing other emails
          }
        }
        
        // Small delay between batches to prevent overwhelming the system
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update last sync timestamp
      await this.updateEmailAccountSyncStatus(accountId, 'healthy', new Date());

      console.log(`✅ Outlook email sync completed: ${syncCount} emails processed`);

      return { success: true, count: syncCount };

    } catch (error) {
      console.error(`❌ Outlook email sync failed for account ${accountId}:`, error);
      await this.updateEmailAccountSyncStatus(accountId, 'error', new Date());
      
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      };
    }
  }

  /**
   * Fetch attachments for an Outlook email
   */
  private static async fetchOutlookAttachments(account: EmailAccount, messageId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
        {
          headers: {
            'Authorization': `Bearer ${account.credentials.accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch attachments for message ${messageId}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return (data.value || []).map((attachment: any) => ({
        id: attachment.id,
        name: attachment.name,
        contentType: attachment.contentType,
        size: attachment.size,
        isInline: attachment.isInline || false,
      }));

    } catch (error) {
      console.error(`Failed to fetch attachments for message ${messageId}:`, error);
      return [];
    }
  }

  /**
   * Set up real-time email notifications for Outlook
   */
  static async setupOutlookWebhook(accountId: string): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    console.log(`🔔 Setting up Outlook webhook for account: ${accountId}`);

    try {
      const account = await this.getEmailAccount(accountId);
      if (!account || account.platform !== 'outlook') {
        return { success: false, error: 'Invalid Outlook account' };
      }

      // Create Microsoft Graph subscription for real-time notifications
      const subscription = {
        changeType: 'created,updated',
        notificationUrl: `${process['env']['NEXTAUTH_URL'] || 'http://localhost:3000'}/api/webhooks/outlook`,
        resource: 'me/messages',
        expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        clientState: `${accountId}_${Date.now()}`, // For verification
      };

      const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create webhook: ${response.status} - ${errorText}`);
      }

      const subscriptionData = await response.json();
      console.log(`✅ Outlook webhook created with subscription ID: ${subscriptionData.id}`);

      // Store subscription ID for later management
      await this.storeWebhookSubscription(accountId, 'outlook', subscriptionData.id);

      return { success: true, subscriptionId: subscriptionData.id };

    } catch (error) {
      console.error(`❌ Failed to setup Outlook webhook for account ${accountId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Webhook setup failed' 
      };
    }
  }

  /**
   * Track email delivery and engagement events
   */
  static async trackEmailEvent(
    messageId: string,
    eventType: EmailTracking["status"],
    eventData?: {
      timestamp?: Date;
      deviceInfo?: EmailTracking["deviceInfo"];
      engagementData?: Partial<EmailTracking["engagement"]>;
    },
  ): Promise<void> {
    console.log(
      `📊 Tracking email event: ${eventType} for message ${messageId}`,
    );

    const email = await this.getEmailByMessageId(messageId);
    if (!email || !email.tracking) return;

    // Update tracking data
    const tracking = email.tracking;
    tracking['status'] = eventType;

    switch (eventType) {
      case "delivered":
        tracking['deliveredAt'] = eventData?.timestamp || new Date();
        break;
      case "opened":
        tracking['openedAt'] = eventData?.timestamp || new Date();
        tracking.openCount += 1;
        tracking['engagement']['interactionLevel'] =
          tracking.openCount > 2 ? "high" : "medium";
        break;
      case "clicked":
        tracking['clickedAt'] = eventData?.timestamp || new Date();
        tracking.clickCount += 1;
        tracking['engagement']['interactionLevel'] = "high";
        tracking['engagement']['score'] = Math.min(
          1,
          tracking.engagement.score + 0.3,
        );
        break;
      case "replied":
        tracking['repliedAt'] = eventData?.timestamp || new Date();
        tracking['engagement']['interactionLevel'] = "high";
        tracking['engagement']['score'] = 1.0;
        break;
    }

    if (eventData?.deviceInfo) {
      tracking['deviceInfo'] = eventData.deviceInfo;
    }

    if (eventData?.engagementData) {
      Object.assign(tracking.engagement, eventData.engagementData);
    }

    // Update email record
    await this.updateEmailTracking(email.id, tracking);

    // Trigger real-time update (temporarily disabled)
    // if (pusherClient) {
    //   const account = await this.getEmailAccount(email.accountId);
    //   if (account) {
    //     await pusherClient.trigger(
    //       `workspace-${account.workspaceId}`,
    //       "email-tracking-updated",
    //       { emailId: email.id, messageId, eventType, tracking },
    //     );
    //   }
    // }

    // Check for auto-follow-up triggers
    if (eventType === "opened" && tracking['openCount'] === 1) {
      await this.checkAutoFollowUp(email);
    }
  }

  /**
   * Analyze email sentiment and intent
   */
  static async analyzeEmailSentiment(
    emailId: string,
  ): Promise<EmailSentiment | null> {
    console.log(`🎭 Analyzing sentiment for email ${emailId}`);

    const email = await this.getEmailMessage(emailId);
    if (!email) return null;

    // Use AI to analyze sentiment (simplified for demo)
    const sentiment: EmailSentiment = {
      messageId: email.messageId,
      overallSentiment: "neutral",
      sentimentScore: 0.1,
      emotions: [
        { emotion: "professional", confidence: 0.8 },
        { emotion: "friendly", confidence: 0.6 },
      ],
      intent: "inquiry",
      urgency: "medium",
      confidence: 0.75,
      keyPhrases: ["looking forward", "quick question", "best time"],
    };

    // Store sentiment analysis
    await this.updateEmailSentiment(emailId, sentiment);

    // Trigger real-time update (temporarily disabled)
    // if (pusherClient) {
    //   const account = await this.getEmailAccount(email.accountId);
    //   if (account) {
    //     await pusherClient.trigger(
    //       `workspace-${account.workspaceId}`,
    //       "email-sentiment-analyzed",
    //       { emailId, sentiment },
    //     );
    //   }
    // }

    return sentiment;
  }

  /**
   * Create and manage email sequences
   */
  static async createEmailSequence(
    workspaceId: string,
    userId: string,
    sequenceData: {
      name: string;
      templateEmails: EmailSequence["templateEmails"];
    },
  ): Promise<EmailSequence> {
    console.log(`📋 Creating email sequence: ${sequenceData.name}`);

    const sequence: EmailSequence = {
      id: `sequence_${Date.now()}_${userId}`,
      name: sequenceData.name,
      workspaceId,
      userId,
      templateEmails: sequenceData.templateEmails,
      isActive: true,
      stats: {
        enrollments: 0,
        completions: 0,
        openRate: 0,
        clickRate: 0,
        replyRate: 0,
      },
    };

    // Store sequence
    await this.storeEmailSequence(sequence);

    // Trigger real-time notification (temporarily disabled)
    // if (pusherClient) {
    //   await pusherClient.trigger(
    //     `workspace-${workspaceId}`,
    //     "email-sequence-created",
    //     { sequenceId: sequence.id, name: sequence.name },
    //   );
    // }

    return sequence;
  }

  /**
   * Enroll contact in email sequence
   */
  static async enrollInSequence(
    sequenceId: string,
    contactId: string,
    accountId: string,
  ): Promise<EmailCampaign> {
    console.log(`🎯 Enrolling contact ${contactId} in sequence ${sequenceId}`);

    const sequence = await this.getEmailSequence(sequenceId);
    if (!sequence || !sequence.isActive) {
      throw new Error("Sequence not found or inactive");
    }

    const campaign: EmailCampaign = {
      id: `campaign_${Date.now()}_${contactId}`,
      sequenceId,
      contactId,
      status: "active",
      currentStep: 0,
      enrolledAt: new Date(),
      sentEmails: [],
    };

    // Store campaign
    await this.storeEmailCampaign(campaign);

    // Schedule first email
    await this.scheduleSequenceEmail(campaign.id, 0);

    // Update sequence stats
    await this.updateSequenceStats(sequenceId, { enrollments: 1 });

    return campaign;
  }

  // Private helper methods

  private static async validateCredentials(
    platform: string,
    credentials: any,
  ): Promise<void> {
    // Validate credentials based on platform
    switch (platform) {
      case "gmail":
        if (!credentials.accessToken)
          throw new Error("Gmail access token required");
        break;
      case "outlook":
        if (!credentials.accessToken)
          throw new Error("Outlook access token required");
        break;
      case "exchange":
        if (!credentials.username || !credentials.password)
          throw new Error("Exchange credentials required");
        break;
      case "imap":
        if (!credentials.imapConfig)
          throw new Error("IMAP configuration required");
        break;
    }
  }

  private static async sendEmailViaPlatform(
    account: EmailAccount,
    emailData: any,
  ): Promise<string> {
    // Send email based on platform
    switch (account.platform) {
      case "gmail":
        return await this.sendViaGmail(account, emailData);
      case "outlook":
        return await this.sendViaOutlook(account, emailData);
      case "exchange":
        return await this.sendViaExchange(account, emailData);
      case "imap":
        return await this.sendViaIMAP(account, emailData);
      default:
        throw new Error(`Unsupported platform: ${account.platform}`);
    }
  }

  private static async sendViaGmail(
    account: EmailAccount,
    emailData: any,
  ): Promise<string> {
    // Gmail API integration
    console.log("📧 Sending via Gmail API");
    return `gmail_${Date.now()}`;
  }

  private static async sendViaOutlook(
    account: EmailAccount,
    emailData: any,
  ): Promise<string> {
    console.log("📧 Sending email via Microsoft Graph API");

    try {
      // Build the email message for Microsoft Graph
      const message = {
        subject: emailData.subject,
        body: {
          contentType: emailData.bodyHtml ? "HTML" : "Text",
          content: emailData.bodyHtml || emailData.body,
        },
        toRecipients: emailData.to.map((email: string) => ({
          emailAddress: { address: email },
        })),
        ccRecipients: (emailData.cc || []).map((email: string) => ({
          emailAddress: { address: email },
        })),
        bccRecipients: (emailData.bcc || []).map((email: string) => ({
          emailAddress: { address: email },
        })),
        attachments: emailData.attachments || [],
      };

      // Send via Microsoft Graph API
      const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.credentials.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Microsoft Graph API error: ${response.status} - ${errorText}`);
      }

      const messageId = `outlook_${Date.now()}_${account.id}`;
      console.log("✅ Email sent successfully via Microsoft Graph API");
      return messageId;

    } catch (error) {
      console.error("❌ Failed to send email via Outlook:", error);
      throw error;
    }
  }

  private static async sendViaExchange(
    account: EmailAccount,
    emailData: any,
  ): Promise<string> {
    // Exchange Web Services integration
    console.log("📧 Sending via Exchange Web Services");
    return `exchange_${Date.now()}`;
  }

  private static async sendViaIMAP(
    account: EmailAccount,
    emailData: any,
  ): Promise<string> {
    // IMAP/SMTP integration
    console.log("📧 Sending via IMAP/SMTP");
    return `imap_${Date.now()}`;
  }

  private static convertToHtml(text: string): string {
    return text.replace(/\n/g, "<br>");
  }

  private static async addTrackingElements(
    html: string,
    accountId: string,
  ): Promise<string> {
    const trackingPixel = `<img src="/api/email/track/open/${accountId}" width="1" height="1" style="display:none;">`;
    return html + trackingPixel;
  }

  private static async syncEmailAccount(accountId: string): Promise<void> {
    console.log(`🔄 Syncing email account ${accountId}`);
    // Implement email sync logic
  }

  private static async checkAutoFollowUp(email: EmailMessage): Promise<void> {
    // Check if auto-follow-up should be triggered
    console.log(`🤖 Checking auto-follow-up for email ${email.id}`);
  }

  private static async scheduleSequenceEmail(
    campaignId: string,
    stepNumber: number,
  ): Promise<void> {
    console.log(
      `⏰ Scheduling sequence email step ${stepNumber} for campaign ${campaignId}`,
    );
    // Implement email scheduling logic
  }

  // Storage methods - using proper email_accounts table
  private static async storeEmailAccount(account: EmailAccount): Promise<void> {
    console.log(`💾 [EMAIL INTEGRATOR] Storing email account: ${account.email} in workspace: ${account.workspaceId}`);
    
    // Store in proper email_accounts table
    // First check if account already exists
    const existingAccount = await prisma.email_accounts.findFirst({
      where: {
        workspaceId: account.workspaceId,
        email: account.email
      }
    });

    if (existingAccount) {
      // Update existing account
      await prisma.email_accounts.update({
        where: { id: existingAccount.id },
        data: {
          displayName: account.displayName,
          isActive: account.isActive,
          lastSyncAt: account.lastSyncAt,
          syncStatus: account.syncStatus,
          accessToken: account.credentials.accessToken,
          refreshToken: account.credentials.refreshToken,
          expiresAt: account.credentials.expiresAt,
          autoSync: account.settings.autoSync,
          syncFrequency: account.settings.syncFrequency,
          enableDeliveryTracking: account.settings.enableDeliveryTracking,
          enableSentimentAnalysis: account.settings.enableSentimentAnalysis,
          autoFollowUp: account.settings.autoFollowUp,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new account
      await prisma.email_accounts.create({
        data: {
          id: account.id,
          workspaceId: account.workspaceId,
          userId: account.userId,
          platform: account.platform,
          email: account.email,
          displayName: account.displayName,
          isActive: account.isActive,
          lastSyncAt: account.lastSyncAt,
          syncStatus: account.syncStatus,
          accessToken: account.credentials.accessToken,
          refreshToken: account.credentials.refreshToken,
          expiresAt: account.credentials.expiresAt,
          autoSync: account.settings.autoSync,
          syncFrequency: account.settings.syncFrequency,
          enableDeliveryTracking: account.settings.enableDeliveryTracking,
          enableSentimentAnalysis: account.settings.enableSentimentAnalysis,
          autoFollowUp: account.settings.autoFollowUp
        }
      });
    }

    console.log(`✅ [EMAIL INTEGRATOR] Email account stored successfully: ${account.email}`);
  }

  private static async getEmailAccount(
    accountId: string,
  ): Promise<EmailAccount | null> {
    const emailAccount = await prisma.email_accounts.findUnique({
      where: { id: accountId },
    });
    
    if (!emailAccount) return null;
    
    // Convert database record to EmailAccount interface
    return {
      id: emailAccount.id,
      workspaceId: emailAccount.workspaceId,
      userId: emailAccount.userId,
      platform: emailAccount.platform as EmailAccount["platform"],
      email: emailAccount.email,
      displayName: emailAccount.displayName,
      isActive: emailAccount.isActive,
      lastSyncAt: emailAccount.lastSyncAt,
      syncStatus: emailAccount.syncStatus as EmailAccount["syncStatus"],
      credentials: {
        accessToken: emailAccount.accessToken || undefined,
        refreshToken: emailAccount.refreshToken || undefined,
        expiresAt: emailAccount.expiresAt || undefined,
      },
      settings: {
        autoSync: emailAccount.autoSync,
        syncFrequency: emailAccount.syncFrequency,
        enableDeliveryTracking: emailAccount.enableDeliveryTracking,
        enableSentimentAnalysis: emailAccount.enableSentimentAnalysis,
        autoFollowUp: emailAccount.autoFollowUp,
      },
    };
  }

  private static async storeEmailMessage(message: EmailMessage): Promise<void> {
    console.log(`🔍 Checking if email already exists: ${message.messageId}`);
    
    // Store email message in the proper email_messages table
    // First check if message already exists
    const existingMessage = await prisma.email_messages.findFirst({
      where: {
        accountId: message.accountId,
        messageId: message.messageId
      }
    });

    if (!existingMessage) {
      console.log(`📝 Creating new email message: ${message.subject}`);
      // Create new message
      await prisma.email_messages.create({
        data: {
          messageId: message.messageId,
          threadId: message.threadId,
          accountId: message.accountId,
          subject: message.subject,
          body: message.body,
          bodyHtml: message.bodyHtml,
          from: message.from,
          to: message.to,
          cc: message.cc,
          bcc: message.bcc,
          replyTo: message.replyTo,
          sentAt: message.sentAt,
          receivedAt: message.receivedAt,
          isRead: message.isRead,
          isImportant: message.isImportant,
          labels: message.labels,
          attachments: message.attachments,
          tracking: message.tracking,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Successfully created email message: ${message.subject}`);
    } else {
      console.log(`⏭️ Email already exists, skipping: ${message.subject}`);
    }
  }

  private static async getEmailMessage(
    emailId: string,
  ): Promise<EmailMessage | null> {
    const cached = await prisma.enrichmentCache.findUnique({
      where: { cacheKey: `email_message_${emailId}` },
    });
    return cached ? (cached.cachedData as unknown as EmailMessage) : null;
  }

  private static async getEmailByMessageId(
    messageId: string,
  ): Promise<EmailMessage | null> {
    // Would need proper indexing in production
    return null;
  }

  private static async updateEmailTracking(
    emailId: string,
    tracking: EmailTracking,
  ): Promise<void> {
    const email = await this.getEmailMessage(emailId);
    if (email) {
      email['tracking'] = tracking;
      await this.storeEmailMessage(email);
    }
  }

  private static async updateEmailSentiment(
    emailId: string,
    sentiment: EmailSentiment,
  ): Promise<void> {
    const email = await this.getEmailMessage(emailId);
    if (email) {
      email['sentiment'] = sentiment;
      await this.storeEmailMessage(email);
    }
  }

  private static async storeEmailSequence(
    sequence: EmailSequence,
  ): Promise<void> {
    await prisma.enrichmentCache.create({
      data: {
        cacheKey: `email_sequence_${sequence.id}`,
        cacheType: "email_sequence",
        cachedData: JSON.parse(JSON.stringify(sequence)),
        dataSize: JSON.stringify(sequence).length,
        quality: 1.0,
        completeness: 1.0,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        workspaceId: sequence.workspaceId,
      },
    });
  }

  private static async getEmailSequence(
    sequenceId: string,
  ): Promise<EmailSequence | null> {
    const cached = await prisma.enrichmentCache.findUnique({
      where: { cacheKey: `email_sequence_${sequenceId}` },
    });
    return cached ? (cached.cachedData as unknown as EmailSequence) : null;
  }

  private static async storeEmailCampaign(
    campaign: EmailCampaign,
  ): Promise<void> {
    await prisma.enrichmentCache.create({
      data: {
        cacheKey: `email_campaign_${campaign.id}`,
        cacheType: "email_campaign",
        cachedData: JSON.parse(JSON.stringify(campaign)),
        dataSize: JSON.stringify(campaign).length,
        quality: 1.0,
        completeness: 1.0,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        workspaceId: "unknown", // Would get from sequence
      },
    });
  }

  private static async updateSequenceStats(
    sequenceId: string,
    updates: Partial<EmailSequence["stats"]>,
  ): Promise<void> {
    const sequence = await this.getEmailSequence(sequenceId);
    if (sequence) {
      Object.assign(sequence.stats, updates);
      await this.storeEmailSequence(sequence);
    }
  }

  // Helper methods for Outlook integration

  /**
   * Get email account by ID (duplicate method - REMOVED)
   * Using the properly implemented method above
   */

  /**
   * Update email account sync status
   */
  private static async updateEmailAccountSyncStatus(
    accountId: string, 
    status: 'healthy' | 'warning' | 'error', 
    timestamp: Date
  ): Promise<void> {
    try {
      console.log(`📧 Updating sync status for account ${accountId}: ${status}`);
      // TODO: Implement actual database update
    } catch (error) {
      console.error("❌ Failed to update sync status:", error);
    }
  }

  /**
   * Store webhook subscription info
   */
  private static async storeWebhookSubscription(
    accountId: string, 
    platform: string, 
    subscriptionId: string
  ): Promise<void> {
    try {
      console.log(`🔔 Storing webhook subscription: ${subscriptionId} for account ${accountId}`);
      // TODO: Implement actual database storage
    } catch (error) {
      console.error("❌ Failed to store webhook subscription:", error);
    }
  }

  /**
   * Sync emails for account based on platform
   */
  private static async syncEmailAccount(accountId: string): Promise<void> {
    try {
      const account = await this.getEmailAccount(accountId);
      if (!account) {
        console.error(`❌ Account not found: ${accountId}`);
        return;
      }

      console.log(`📧 Starting sync for ${account.platform} account: ${accountId}`);

      switch (account.platform) {
        case 'outlook':
          await this.syncOutlookEmails(accountId);
          break;
        case 'gmail':
          // TODO: Implement Gmail sync
          console.log("📧 Gmail sync not yet implemented");
          break;
        default:
          console.log(`📧 Sync not supported for platform: ${account.platform}`);
      }
    } catch (error) {
      console.error(`❌ Failed to sync account ${accountId}:`, error);
    }
  }
}
