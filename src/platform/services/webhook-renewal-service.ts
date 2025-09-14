/**
 * Webhook Renewal Service
 * Automatically renews Microsoft Graph webhook subscriptions to prevent sync cutouts
 */

import { PrismaClient } from '@prisma/client';
import { EmailPlatformIntegrator } from './email-platform-integrator';

const prisma = new PrismaClient();

export class WebhookRenewalService {
  private static instance: WebhookRenewalService;
  private renewalInterval: NodeJS.Timeout | null = null;

  static getInstance(): WebhookRenewalService {
    if (!WebhookRenewalService.instance) {
      WebhookRenewalService['instance'] = new WebhookRenewalService();
    }
    return WebhookRenewalService.instance;
  }

  /**
   * Start automatic webhook renewal service
   */
  startRenewalService(): void {
    console.log('🔄 Starting webhook renewal service...');
    
    // Check every 6 hours for expiring webhooks
    this['renewalInterval'] = setInterval(async () => {
      await this.renewExpiringWebhooks();
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Run initial check
    this.renewExpiringWebhooks();
  }

  /**
   * Stop the renewal service
   */
  stopRenewalService(): void {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      this['renewalInterval'] = null;
      console.log('🛑 Webhook renewal service stopped');
    }
  }

  /**
   * Check and renew expiring webhooks
   */
  async renewExpiringWebhooks(): Promise<void> {
    try {
      console.log('🔍 Checking for expiring webhook subscriptions...');

      // Find webhook subscriptions expiring in the next 24 hours
      const expiringSubscriptions = await prisma.webhookSubscription.findMany({
        where: {
          expiresAt: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
          },
          isActive: true
        },
        include: {
          emailAccount: true
        }
      });

      console.log(`📊 Found ${expiringSubscriptions.length} expiring webhook subscriptions`);

      for (const subscription of expiringSubscriptions) {
        await this.renewWebhookSubscription(subscription);
      }

    } catch (error) {
      console.error('❌ Error checking expiring webhooks:', error);
    }
  }

  /**
   * Renew a specific webhook subscription
   */
  private async renewWebhookSubscription(subscription: any): Promise<void> {
    try {
      console.log(`🔄 Renewing webhook subscription: ${subscription.subscriptionId}`);

      const emailAccount = subscription.emailAccount;
      if (!emailAccount) {
        console.error('❌ No email account found for subscription');
        return;
      }

      // Get fresh token for the account
      const providerToken = await prisma.providerToken.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId: emailAccount.workspaceId,
            provider: 'microsoft'
          }
        }
      });

      if (!providerToken) {
        console.error('❌ No provider token found for renewal');
        return;
      }

      // Check if token needs refresh
      let accessToken = providerToken.accessToken;
      const tokenExpired = providerToken['expiresAt'] && new Date(providerToken.expiresAt) < new Date();

      if (tokenExpired && providerToken.refreshToken) {
        console.log('🔄 Refreshing expired token before webhook renewal...');
        accessToken = await this.refreshMicrosoftToken(providerToken.refreshToken, providerToken.workspaceId);
      }

      if (!accessToken) {
        console.error('❌ Unable to get valid access token for webhook renewal');
        return;
      }

      // Update the existing subscription with new expiration
      const newExpiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days

      const updateResponse = await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${subscription.subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expirationDateTime: newExpiration
        })
      });

      if (updateResponse.ok) {
        // Update our database record
        await prisma.webhookSubscription.update({
          where: { id: subscription.id },
          data: { 
            expiresAt: new Date(newExpiration),
            updatedAt: new Date()
          }
        });

        console.log(`✅ Webhook subscription renewed: ${subscription.subscriptionId}`);
      } else {
        const errorText = await updateResponse.text();
        console.error(`❌ Failed to renew webhook subscription: ${updateResponse.status} - ${errorText}`);
        
        // If renewal fails, try to create a new subscription
        console.log('🔄 Attempting to create new webhook subscription...');
        await this.createNewWebhookSubscription(emailAccount, accessToken);
      }

    } catch (error) {
      console.error('❌ Error renewing webhook subscription:', error);
    }
  }

  /**
   * Create a new webhook subscription when renewal fails
   */
  private async createNewWebhookSubscription(emailAccount: any, accessToken: string): Promise<void> {
    try {
      const result = await EmailPlatformIntegrator.setupOutlookWebhook(emailAccount.id);
      
      if (result.success) {
        console.log(`✅ New webhook subscription created: ${result.subscriptionId}`);
      } else {
        console.error(`❌ Failed to create new webhook subscription: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating new webhook subscription:', error);
    }
  }

  /**
   * Refresh Microsoft token
   */
  private async refreshMicrosoftToken(refreshToken: string, workspaceId: string): Promise<string | null> {
    try {
      const clientSecret = process['env']['MICROSOFT_CLIENT_SECRET'];
      if (!clientSecret) {
        console.error('❌ MICROSOFT_CLIENT_SECRET not available for token refresh');
        return null;
      }

      const refreshResponse = await fetch('https://login.microsoftonline.com/organizations/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process['env']['MICROSOFT_CLIENT_ID'] || '8335dd15-23e0-40ed-8978-5700fddf00eb',
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access'
        })
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        
        // Update token in database
        await prisma.providerToken.updateMany({
          where: {
            workspaceId,
            provider: 'microsoft'
          },
          data: {
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token || refreshToken,
            expiresAt: new Date(Date.now() + refreshData.expires_in * 1000),
            updatedAt: new Date()
          }
        });

        console.log('✅ Microsoft token refreshed successfully');
        return refreshData.access_token;
      } else {
        const errorText = await refreshResponse.text();
        console.error(`❌ Token refresh failed: ${refreshResponse.status} - ${errorText}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error refreshing Microsoft token:', error);
      return null;
    }
  }

  /**
   * Get webhook subscription status for all accounts
   */
  async getWebhookStatus(workspaceId: string): Promise<any[]> {
    try {
      const subscriptions = await prisma.webhookSubscription.findMany({
        where: {
          emailAccount: {
            workspaceId
          }
        },
        include: {
          emailAccount: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return subscriptions.map(sub => ({
        id: sub.id,
        subscriptionId: sub.subscriptionId,
        platform: sub.platform,
        email: sub.emailAccount?.email,
        isActive: sub.isActive,
        expiresAt: sub.expiresAt,
        daysUntilExpiry: sub.expiresAt ? 
          Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
          null,
        needsRenewal: sub.expiresAt ? 
          new Date(sub.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000 : 
          true
      }));
    } catch (error) {
      console.error('❌ Error getting webhook status:', error);
      return [];
    }
  }
}

// Export singleton instance
export const webhookRenewalService = WebhookRenewalService.getInstance();
