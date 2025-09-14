import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TokenRefreshScheduler {
  private static instance: TokenRefreshScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): TokenRefreshScheduler {
    if (!TokenRefreshScheduler.instance) {
      TokenRefreshScheduler['instance'] = new TokenRefreshScheduler();
    }
    return TokenRefreshScheduler.instance;
  }

  /**
   * Start the token refresh scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('🔄 Token refresh scheduler is already running');
      return;
    }

    console.log('🚀 Starting token refresh scheduler...');
    this['isRunning'] = true;

    // Run every 30 minutes
    this['intervalId'] = setInterval(() => {
      this.refreshExpiredTokens();
    }, 30 * 60 * 1000);

    // Run immediately on start
    this.refreshExpiredTokens();
  }

  /**
   * Stop the token refresh scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this['intervalId'] = null;
    }
    this['isRunning'] = false;
    console.log('⏹️ Token refresh scheduler stopped');
  }

  /**
   * Refresh expired tokens
   */
  private async refreshExpiredTokens(): Promise<void> {
    try {
      console.log('🔄 Checking for expired tokens...');

      // Find accounts with tokens expiring in the next 15 minutes
      const soonToExpire = new Date(Date.now() + 15 * 60 * 1000);
      
      const accountsToRefresh = await prisma.email_accounts.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: soonToExpire
          },
          platform: {
            in: ['outlook', 'google', 'zoho']
          }
        }
      });

      console.log(`🔍 Found ${accountsToRefresh.length} accounts with expiring tokens`);

      for (const account of accountsToRefresh) {
        try {
          await this.refreshAccountToken(account);
        } catch (error) {
          console.error(`❌ Failed to refresh token for ${account.email}:`, error);
        }
      }

      console.log('✅ Token refresh check completed');
    } catch (error) {
      console.error('❌ Error in token refresh scheduler:', error);
    }
  }

  /**
   * Refresh token for a specific account
   */
  private async refreshAccountToken(account: any): Promise<void> {
    try {
      console.log(`🔄 Refreshing token for ${account.email} (${account.platform})`);

      if (!account.refreshToken) {
        console.log(`⚠️ No refresh token available for ${account.email}`);
        await prisma.email_accounts.update({
          where: { id: account.id },
          data: { syncStatus: 'error' }
        });
        return;
      }

      let refreshResponse: Response;
      let tokenEndpoint: string;
      let clientId: string;
      let clientSecret: string;
      let scope: string;

      switch (account.platform) {
        case 'outlook':
          tokenEndpoint = 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token';
          clientId = '8335dd15-23e0-40ed-8978-5700fddf00eb';
          clientSecret = process['env']['MICROSOFT_CLIENT_SECRET'];
          scope = 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access';
          break;
        case 'google':
          tokenEndpoint = 'https://oauth2.googleapis.com/token';
          clientId = process['env']['GOOGLE_CLIENT_ID'];
          clientSecret = process['env']['GOOGLE_CLIENT_SECRET'];
          scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
          break;
        case 'zoho':
          tokenEndpoint = 'https://accounts.zoho.com/oauth/v2/token';
          clientId = process['env']['ZOHO_CLIENT_ID'];
          clientSecret = process['env']['ZOHO_CLIENT_SECRET'];
          scope = 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL';
          break;
        default:
          console.log(`⚠️ Unsupported platform: ${account.platform}`);
          return;
      }

      if (!clientSecret) {
        console.log(`⚠️ Client secret not available for ${account.platform}`);
        return;
      }

      refreshResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          scope: scope
        })
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error(`❌ Token refresh failed for ${account.email}: ${refreshResponse.status} - ${errorText}`);
        
        await prisma.email_accounts.update({
          where: { id: account.id },
          data: { syncStatus: 'error' }
        });
        return;
      }

      const refreshData = await refreshResponse.json();
      
      // Update token in database
      await prisma.email_accounts.update({
        where: { id: account.id },
        data: {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token || account.refreshToken,
          expiresAt: refreshData.expires_in ? 
            new Date(Date.now() + refreshData.expires_in * 1000) : 
            new Date(Date.now() + 3600 * 1000),
          updatedAt: new Date(),
          syncStatus: 'healthy'
        }
      });

      console.log(`✅ Token refreshed successfully for ${account.email}`);
    } catch (error) {
      console.error(`❌ Error refreshing token for ${account.email}:`, error);
      await prisma.email_accounts.update({
        where: { id: account.id },
        data: { syncStatus: 'error' }
      });
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextRun?: Date } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? new Date(Date.now() + 30 * 60 * 1000) : undefined
    };
  }
}
