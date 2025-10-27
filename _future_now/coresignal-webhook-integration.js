/**
 * CORESIGNAL WEBHOOK INTEGRATION
 * 
 * Implements real-time data updates using Coresignal's webhook subscription feature
 * to keep buyer group data live and automatically updated
 */

const crypto = require('crypto');
const axios = require('axios');

class CoresignalWebhookIntegration {
  constructor(apiKey, webhookSecret) {
    this.apiKey = apiKey;
    this.webhookSecret = webhookSecret;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v1';
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Create a webhook subscription for employee data changes
   */
  async createEmployeeSubscription(options = {}) {
    const {
      webhookUrl,
      companyName,
      companyId,
      departments = [],
      jobTitles = [],
      seniorityLevels = [],
      elasticsearchQuery = null
    } = options;

    try {
      // Build subscription criteria
      let subscriptionCriteria;
      
      if (elasticsearchQuery) {
        // Use Elasticsearch DSL query for advanced filtering
        subscriptionCriteria = {
          query: elasticsearchQuery
        };
      } else {
        // Use search filter parameters
        const filters = {};
        
        if (companyId) {
          filters.company_id = companyId;
        } else if (companyName) {
          filters.company_name = companyName;
        }
        
        if (departments.length > 0) {
          filters.department = departments;
        }
        
        if (jobTitles.length > 0) {
          filters.job_title = jobTitles;
        }
        
        if (seniorityLevels.length > 0) {
          filters.seniority_level = seniorityLevels;
        }
        
        subscriptionCriteria = {
          filters
        };
      }

      const subscriptionData = {
        webhook_url: webhookUrl,
        event_types: ['employee.added', 'employee.updated', 'employee.deleted'],
        criteria: subscriptionCriteria,
        active: true
      };

      const response = await axios.post(
        `${this.baseUrl}/webhooks/subscriptions`,
        subscriptionData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const subscription = response.data;
      this.subscriptions.set(subscription.id, subscription);
      
      console.log(`✅ Created webhook subscription: ${subscription.id}`);
      return subscription;

    } catch (error) {
      console.error('❌ Failed to create webhook subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a webhook subscription for company data changes
   */
  async createCompanySubscription(options = {}) {
    const {
      webhookUrl,
      companyName,
      companyId,
      industry = null,
      companySize = null
    } = options;

    try {
      const filters = {};
      
      if (companyId) {
        filters.company_id = companyId;
      } else if (companyName) {
        filters.company_name = companyName;
      }
      
      if (industry) {
        filters.industry = industry;
      }
      
      if (companySize) {
        filters.company_size = companySize;
      }

      const subscriptionData = {
        webhook_url: webhookUrl,
        event_types: ['company.updated', 'company.merged'],
        criteria: { filters },
        active: true
      };

      const response = await axios.post(
        `${this.baseUrl}/webhooks/subscriptions`,
        subscriptionData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const subscription = response.data;
      this.subscriptions.set(subscription.id, subscription);
      
      console.log(`✅ Created company webhook subscription: ${subscription.id}`);
      return subscription;

    } catch (error) {
      console.error('❌ Failed to create company webhook subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List all active webhook subscriptions
   */
  async listSubscriptions() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/webhooks/subscriptions`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Failed to list subscriptions:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a webhook subscription
   */
  async deleteSubscription(subscriptionId) {
    try {
      await axios.delete(
        `${this.baseUrl}/webhooks/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      this.subscriptions.delete(subscriptionId);
      console.log(`✅ Deleted webhook subscription: ${subscriptionId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to delete subscription:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload, signature, timestamp) {
    if (!this.webhookSecret) {
      console.warn('⚠️ Webhook secret not configured, skipping signature verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(timestamp + payload)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('❌ Error verifying webhook signature:', error.message);
      return false;
    }
  }

  /**
   * Process incoming webhook notification
   */
  async processWebhookNotification(payload, signature, timestamp) {
    try {
      // Verify signature for security
      if (!this.verifyWebhookSignature(payload, signature, timestamp)) {
        console.error('❌ Invalid webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      const data = JSON.parse(payload);
      const { event_type, profile_id, change_type, data: eventData } = data;

      console.log(`📨 Received webhook: ${event_type} - ${profile_id} - ${change_type}`);

      // Route to appropriate handler
      const handler = this.eventHandlers.get(event_type);
      if (handler) {
        await handler({
          profileId: profile_id,
          changeType: change_type,
          data: eventData,
          timestamp: new Date(timestamp)
        });
      } else {
        console.warn(`⚠️ No handler for event type: ${event_type}`);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error processing webhook notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register event handler for specific event types
   */
  on(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
    console.log(`📝 Registered handler for: ${eventType}`);
  }

  /**
   * Create comprehensive buyer group monitoring subscription
   */
  async createBuyerGroupMonitoring(companyName, webhookUrl) {
    try {
      // Create employee subscription for buyer group roles
      const employeeSubscription = await this.createEmployeeSubscription({
        webhookUrl: `${webhookUrl}/employee-changes`,
        companyName,
        departments: [
          'Executive',
          'Sales',
          'Marketing',
          'Product',
          'Engineering',
          'Data',
          'Analytics',
          'Business Development'
        ],
        jobTitles: [
          'CEO', 'CTO', 'CFO', 'COO', 'CPO', 'CMO',
          'VP', 'Director', 'Head of', 'Lead',
          'Manager', 'Senior', 'Principal'
        ],
        seniorityLevels: ['C-Level', 'VP', 'Director', 'Senior']
      });

      // Create company subscription for company-level changes
      const companySubscription = await this.createCompanySubscription({
        webhookUrl: `${webhookUrl}/company-changes`,
        companyName
      });

      return {
        employeeSubscription,
        companySubscription,
        monitoringActive: true
      };

    } catch (error) {
      console.error('❌ Failed to create buyer group monitoring:', error.message);
      throw error;
    }
  }

  /**
   * Create Elasticsearch DSL query for advanced filtering
   */
  createAdvancedEmployeeQuery(companyName, buyerGroupCriteria) {
    return {
      bool: {
        must: [
          {
            term: {
              'company.name.keyword': companyName
            }
          },
          {
            bool: {
              should: [
                // C-Level executives
                {
                  terms: {
                    'job_title.keyword': ['CEO', 'CTO', 'CFO', 'COO', 'CPO', 'CMO']
                  }
                },
                // VP and Director level
                {
                  bool: {
                    must: [
                      {
                        terms: {
                          'job_title.keyword': ['VP', 'Director', 'Head of']
                        }
                      },
                      {
                        terms: {
                          'department.keyword': buyerGroupCriteria.departments
                        }
                      }
                    ]
                  }
                },
                // Senior level in key departments
                {
                  bool: {
                    must: [
                      {
                        terms: {
                          'seniority_level.keyword': ['Senior', 'Principal', 'Lead']
                        }
                      },
                      {
                        terms: {
                          'department.keyword': buyerGroupCriteria.departments
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ],
        must_not: [
          {
            terms: {
              'job_title.keyword': ['Intern', 'Junior', 'Associate']
            }
          }
        ]
      }
    };
  }

  /**
   * Get subscription status and statistics
   */
  async getSubscriptionStatus() {
    try {
      const subscriptions = await this.listSubscriptions();
      
      const status = {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.active).length,
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          eventTypes: sub.event_types,
          criteria: sub.criteria,
          active: sub.active,
          createdAt: sub.created_at,
          lastTriggered: sub.last_triggered
        }))
      };

      return status;
    } catch (error) {
      console.error('❌ Failed to get subscription status:', error.message);
      throw error;
    }
  }
}

/**
 * Express.js middleware for handling Coresignal webhooks
 */
function createWebhookMiddleware(webhookIntegration) {
  return async (req, res) => {
    try {
      const signature = req.headers['x-coresignal-signature'];
      const timestamp = req.headers['x-coresignal-timestamp'];
      const payload = JSON.stringify(req.body);

      const result = await webhookIntegration.processWebhookNotification(
        payload,
        signature,
        timestamp
      );

      if (result.success) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('❌ Webhook middleware error:', error.message);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}

/**
 * Buyer Group Update Handler
 * Handles webhook notifications and updates buyer group data
 */
class BuyerGroupUpdateHandler {
  constructor(consolidatedEngine, database) {
    this.engine = consolidatedEngine;
    this.database = database;
    this.updateQueue = [];
    this.processing = false;
  }

  /**
   * Handle employee data changes
   */
  async handleEmployeeChange(event) {
    const { profileId, changeType, data, timestamp } = event;
    
    console.log(`👤 Employee ${changeType}: ${profileId}`);
    
    // Add to update queue
    this.updateQueue.push({
      type: 'employee',
      profileId,
      changeType,
      data,
      timestamp
    });

    // Process queue if not already processing
    if (!this.processing) {
      await this.processUpdateQueue();
    }
  }

  /**
   * Handle company data changes
   */
  async handleCompanyChange(event) {
    const { profileId, changeType, data, timestamp } = event;
    
    console.log(`🏢 Company ${changeType}: ${profileId}`);
    
    // Add to update queue
    this.updateQueue.push({
      type: 'company',
      profileId,
      changeType,
      data,
      timestamp
    });

    // Process queue if not already processing
    if (!this.processing) {
      await this.processUpdateQueue();
    }
  }

  /**
   * Process the update queue
   */
  async processUpdateQueue() {
    if (this.processing || this.updateQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift();
        await this.processUpdate(update);
      }
    } catch (error) {
      console.error('❌ Error processing update queue:', error.message);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process individual update
   */
  async processUpdate(update) {
    try {
      if (update.type === 'employee') {
        await this.updateEmployeeInBuyerGroup(update);
      } else if (update.type === 'company') {
        await this.updateCompanyData(update);
      }
    } catch (error) {
      console.error(`❌ Error processing ${update.type} update:`, error.message);
    }
  }

  /**
   * Update employee in buyer group
   */
  async updateEmployeeInBuyerGroup(update) {
    const { profileId, changeType, data } = update;

    if (changeType === 'deleted') {
      // Remove employee from buyer group
      await this.database.removeEmployeeFromBuyerGroup(profileId);
      console.log(`🗑️ Removed employee ${profileId} from buyer group`);
    } else {
      // Update or add employee to buyer group
      const buyerGroup = await this.engine.discoverBuyerGroup(data.company_name, {
        sellerProfile: {
          productName: 'Winning Variant Intelligence',
          solutionCategory: 'revenue_technology',
          targetMarket: 'enterprise'
        }
      });

      if (buyerGroup.success) {
        await this.database.updateBuyerGroup(data.company_name, buyerGroup.buyerGroup);
        console.log(`✅ Updated buyer group for ${data.company_name}`);
      }
    }
  }

  /**
   * Update company data
   */
  async updateCompanyData(update) {
    const { profileId, changeType, data } = update;

    if (changeType === 'updated') {
      // Refresh buyer group for updated company
      const buyerGroup = await this.engine.discoverBuyerGroup(data.name, {
        sellerProfile: {
          productName: 'Winning Variant Intelligence',
          solutionCategory: 'revenue_technology',
          targetMarket: 'enterprise'
        }
      });

      if (buyerGroup.success) {
        await this.database.updateBuyerGroup(data.name, buyerGroup.buyerGroup);
        console.log(`✅ Refreshed buyer group for updated company ${data.name}`);
      }
    }
  }
}

module.exports = {
  CoresignalWebhookIntegration,
  createWebhookMiddleware,
  BuyerGroupUpdateHandler
};
