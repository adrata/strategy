/**
 * CORESIGNAL WEBHOOK SETUP SCRIPT
 * 
 * Sets up webhook subscriptions for real-time buyer group data updates
 */

const { CoresignalWebhookIntegration } = require('../coresignal-webhook-integration');
const fs = require('fs');
const path = require('path');

class CoresignalWebhookSetup {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.webhookSecret = process.env.CORESIGNAL_WEBHOOK_SECRET;
    this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'https://your-domain.com/api/webhooks/coresignal';
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    if (!this.webhookSecret) {
      throw new Error('CORESIGNAL_WEBHOOK_SECRET environment variable is required');
    }
    
    this.webhookIntegration = new CoresignalWebhookIntegration(this.apiKey, this.webhookSecret);
    this.setupLog = [];
  }

  /**
   * Set up webhooks for all monitored companies
   */
  async setupAllWebhooks() {
    console.log('🚀 CORESIGNAL WEBHOOK SETUP');
    console.log('============================');
    
    try {
      // Load monitored companies
      const companies = await this.loadMonitoredCompanies();
      
      console.log(`📋 Found ${companies.length} companies to monitor`);
      
      // Set up webhooks for each company
      const results = [];
      
      for (const company of companies) {
        console.log(`\n🏢 Setting up webhooks for: ${company.name}`);
        
        try {
          const result = await this.setupCompanyWebhooks(company);
          results.push({ company: company.name, success: true, ...result });
          console.log(`   ✅ Webhooks created successfully`);
        } catch (error) {
          console.error(`   ❌ Failed: ${error.message}`);
          results.push({ 
            company: company.name, 
            success: false, 
            error: error.message 
          });
        }
      }
      
      // Save setup results
      await this.saveSetupResults(results);
      
      // Display summary
      this.displaySetupSummary(results);
      
      return results;
      
    } catch (error) {
      console.error('❌ Webhook setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Set up webhooks for a specific company
   */
  async setupCompanyWebhooks(company) {
    const webhookUrl = this.webhookBaseUrl;
    
    // Create employee monitoring subscription
    const employeeSubscription = await this.webhookIntegration.createEmployeeSubscription({
      webhookUrl: `${webhookUrl}/employee-changes`,
      companyName: company.name,
      companyId: company.id,
      departments: [
        'Executive',
        'Sales',
        'Marketing', 
        'Product',
        'Engineering',
        'Data',
        'Analytics',
        'Business Development',
        'Operations'
      ],
      jobTitles: [
        'CEO', 'CTO', 'CFO', 'COO', 'CPO', 'CMO',
        'VP', 'Director', 'Head of', 'Lead',
        'Manager', 'Senior', 'Principal'
      ],
      seniorityLevels: ['C-Level', 'VP', 'Director', 'Senior']
    });

    // Create company monitoring subscription
    const companySubscription = await this.webhookIntegration.createCompanySubscription({
      webhookUrl: `${webhookUrl}/company-changes`,
      companyName: company.name,
      companyId: company.id,
      industry: company.industry,
      companySize: company.size
    });

    // Create advanced monitoring with Elasticsearch query
    const advancedQuery = this.webhookIntegration.createAdvancedEmployeeQuery(
      company.name,
      {
        departments: ['Executive', 'Sales', 'Marketing', 'Product', 'Engineering'],
        seniorityLevels: ['C-Level', 'VP', 'Director', 'Senior']
      }
    );

    const advancedSubscription = await this.webhookIntegration.createEmployeeSubscription({
      webhookUrl: `${webhookUrl}/advanced-employee-changes`,
      companyName: company.name,
      elasticsearchQuery: advancedQuery
    });

    return {
      employeeSubscription: employeeSubscription.id,
      companySubscription: companySubscription.id,
      advancedSubscription: advancedSubscription.id
    };
  }

  /**
   * Load monitored companies from configuration
   */
  async loadMonitoredCompanies() {
    // This would typically load from a database or configuration file
    // For now, we'll use a sample list
    return [
      {
        name: 'Nike',
        id: 'nike-inc',
        industry: 'Retail',
        size: 'Large'
      },
      {
        name: 'Salesforce',
        id: 'salesforce-com',
        industry: 'Technology',
        size: 'Large'
      },
      {
        name: 'HubSpot',
        id: 'hubspot',
        industry: 'Technology',
        size: 'Medium'
      },
      {
        name: 'First Premier Bank',
        id: 'first-premier-bank',
        industry: 'Banking',
        size: 'Large'
      },
      {
        name: 'Match Group',
        id: 'match-group',
        industry: 'Technology',
        size: 'Large'
      },
      {
        name: 'Zuora',
        id: 'zuora',
        industry: 'Technology',
        size: 'Medium'
      },
      {
        name: 'Brex',
        id: 'brex',
        industry: 'FinTech',
        size: 'Medium'
      }
    ];
  }

  /**
   * Save setup results to file
   */
  async saveSetupResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(__dirname, `../backups/webhook-setup-${timestamp}.json`);
    
    const setupData = {
      timestamp: new Date().toISOString(),
      totalCompanies: results.length,
      successfulSetups: results.filter(r => r.success).length,
      failedSetups: results.filter(r => !r.success).length,
      results
    };
    
    // Ensure backup directory exists
    const backupDir = path.dirname(resultsFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsFile, JSON.stringify(setupData, null, 2));
    console.log(`\n💾 Setup results saved to: ${resultsFile}`);
  }

  /**
   * Display setup summary
   */
  displaySetupSummary(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n📊 WEBHOOK SETUP SUMMARY');
    console.log('=========================');
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successfully configured:');
      successful.forEach(result => {
        console.log(`   • ${result.company}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed to configure:');
      failed.forEach(result => {
        console.log(`   • ${result.company}: ${result.error}`);
      });
    }
    
    console.log('\n🔗 Webhook URLs:');
    console.log(`   Employee Changes: ${this.webhookBaseUrl}/employee-changes`);
    console.log(`   Company Changes: ${this.webhookBaseUrl}/company-changes`);
    console.log(`   Advanced Changes: ${this.webhookBaseUrl}/advanced-employee-changes`);
  }

  /**
   * List all active webhook subscriptions
   */
  async listWebhooks() {
    try {
      const subscriptions = await this.webhookIntegration.listSubscriptions();
      
      console.log('\n📋 ACTIVE WEBHOOK SUBSCRIPTIONS');
      console.log('================================');
      
      if (subscriptions.length === 0) {
        console.log('No active subscriptions found');
        return;
      }
      
      subscriptions.forEach((sub, index) => {
        console.log(`\n${index + 1}. Subscription ID: ${sub.id}`);
        console.log(`   Event Types: ${sub.event_types.join(', ')}`);
        console.log(`   Webhook URL: ${sub.webhook_url}`);
        console.log(`   Active: ${sub.active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${sub.created_at}`);
        console.log(`   Last Triggered: ${sub.last_triggered || 'Never'}`);
      });
      
      return subscriptions;
      
    } catch (error) {
      console.error('❌ Failed to list webhooks:', error.message);
      throw error;
    }
  }

  /**
   * Clean up old webhook subscriptions
   */
  async cleanupWebhooks() {
    try {
      console.log('\n🧹 CLEANING UP OLD WEBHOOK SUBSCRIPTIONS');
      console.log('==========================================');
      
      const subscriptions = await this.webhookIntegration.listSubscriptions();
      const oldSubscriptions = subscriptions.filter(sub => {
        const createdAt = new Date(sub.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return createdAt < thirtyDaysAgo;
      });
      
      if (oldSubscriptions.length === 0) {
        console.log('No old subscriptions found to clean up');
        return;
      }
      
      console.log(`Found ${oldSubscriptions.length} old subscriptions to clean up`);
      
      for (const subscription of oldSubscriptions) {
        try {
          await this.webhookIntegration.deleteSubscription(subscription.id);
          console.log(`   ✅ Deleted: ${subscription.id}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ${subscription.id}: ${error.message}`);
        }
      }
      
      console.log('\n✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook() {
    try {
      console.log('\n🧪 TESTING WEBHOOK ENDPOINT');
      console.log('============================');
      
      const testPayload = {
        event_type: 'employee.updated',
        profile_id: 'test-profile-123',
        change_type: 'updated',
        data: {
          name: 'Test Employee',
          title: 'Test Title',
          company_name: 'Test Company'
        }
      };
      
      const signature = 'sha256=test-signature';
      const timestamp = Date.now().toString();
      
      const result = await this.webhookIntegration.processWebhookNotification(
        JSON.stringify(testPayload),
        signature,
        timestamp
      );
      
      if (result.success) {
        console.log('✅ Webhook endpoint test passed');
      } else {
        console.log('❌ Webhook endpoint test failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Webhook test failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  
  try {
    const setup = new CoresignalWebhookSetup();
    
    switch (command) {
      case 'setup':
        await setup.setupAllWebhooks();
        break;
        
      case 'list':
        await setup.listWebhooks();
        break;
        
      case 'cleanup':
        await setup.cleanupWebhooks();
        break;
        
      case 'test':
        await setup.testWebhook();
        break;
        
      default:
        console.log('Usage: node setup-coresignal-webhooks.js [setup|list|cleanup|test]');
        console.log('');
        console.log('Commands:');
        console.log('  setup   - Set up webhooks for all monitored companies');
        console.log('  list    - List all active webhook subscriptions');
        console.log('  cleanup - Clean up old webhook subscriptions');
        console.log('  test    - Test webhook endpoint');
        break;
    }
    
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CoresignalWebhookSetup };
