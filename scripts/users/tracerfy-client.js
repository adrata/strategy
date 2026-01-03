/**
 * Tracerfy API Client
 * 
 * Skip tracing service at $0.009 per lead (22x cheaper than BatchData)
 * API Docs: https://tracerfy.com/skip-tracing-api-documentation
 */

const TRACERFY_BASE_URL = 'https://tracerfy.com/v1/api';

class TracerfyClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.stats = {
      jobsSubmitted: 0,
      propertiesTraced: 0,
      phonesFound: 0,
      creditsUsed: 0
    };
  }

  async request(endpoint, options = {}) {
    const url = `${TRACERFY_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Tracerfy API error ${response.status}: ${text}`);
    }

    return response.json();
  }

  /**
   * Submit a skip trace job with JSON data
   * @param {Array} properties - Array of property objects with address info
   * @returns {Object} - Queue info with queue_id
   */
  async submitSkipTrace(properties) {
    console.log(`   Submitting ${properties.length} properties to Tracerfy...`);

    // Format data for Tracerfy API
    const jsonData = properties.map(p => ({
      address: p.address,
      city: p.city || 'Paradise Valley',
      state: p.state || 'AZ',
      zip: p.zip || '',
      first_name: p.firstName || '',
      last_name: p.lastName || '',
      mail_address: p.address,
      mail_city: p.city || 'Paradise Valley',
      mail_state: p.state || 'AZ',
      mailing_zip: p.zip || ''
    }));

    const formData = new FormData();
    formData.append('json_data', JSON.stringify(jsonData));
    formData.append('address_column', 'address');
    formData.append('city_column', 'city');
    formData.append('state_column', 'state');
    formData.append('zip_column', 'zip');
    formData.append('first_name_column', 'first_name');
    formData.append('last_name_column', 'last_name');
    formData.append('mail_address_column', 'mail_address');
    formData.append('mail_city_column', 'mail_city');
    formData.append('mail_state_column', 'mail_state');
    formData.append('mailing_zip_column', 'mailing_zip');

    const result = await this.request('/trace/', {
      method: 'POST',
      body: formData
    });

    this.stats.jobsSubmitted++;
    console.log(`   ✅ Job submitted: queue_id=${result.queue_id}`);

    return result;
  }

  /**
   * Get job status and results
   * @param {number} queueId - The queue ID from submitSkipTrace
   * @returns {Object} - Job status and results
   */
  async getJobStatus(queueId) {
    return this.request(`/queue/${queueId}`);
  }

  /**
   * Wait for job completion and return results
   * @param {number} queueId - The queue ID
   * @param {number} maxWaitMs - Maximum wait time in ms (default 5 min)
   * @returns {Array} - Array of traced property results
   */
  async waitForResults(queueId, maxWaitMs = 300000) {
    console.log(`   Waiting for skip trace results (queue_id=${queueId})...`);
    
    const startTime = Date.now();
    let pollInterval = 2000; // Start with 2 seconds
    
    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getJobStatus(queueId);
      
      if (status.status === 'completed' || status.status === 'done') {
        console.log(`   ✅ Job completed!`);
        this.stats.propertiesTraced += status.results?.length || 0;
        return status.results || status.properties || [];
      }
      
      if (status.status === 'failed' || status.status === 'error') {
        throw new Error(`Skip trace job failed: ${status.message || 'Unknown error'}`);
      }
      
      // Still processing, wait and poll again
      await new Promise(r => setTimeout(r, pollInterval));
      
      // Increase poll interval up to 10 seconds
      pollInterval = Math.min(pollInterval + 1000, 10000);
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`   ... still processing (${elapsed}s elapsed, status: ${status.status})`);
    }
    
    throw new Error('Skip trace job timed out');
  }

  /**
   * Skip trace properties and wait for results
   * @param {Array} properties - Array of property objects
   * @returns {Array} - Array of results with phone numbers
   */
  async skipTraceAndWait(properties) {
    const job = await this.submitSkipTrace(properties);
    const results = await this.waitForResults(job.queue_id);
    return results;
  }

  /**
   * Get account analytics (balance, usage)
   */
  async getAnalytics() {
    return this.request('/analytics/');
  }

  /**
   * Get all queues/jobs
   */
  async getQueues() {
    return this.request('/queues/');
  }

  getStats() {
    return this.stats;
  }
}

module.exports = { TracerfyClient };













