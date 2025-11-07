/**
 * Progress Tracker Module
 * 
 * Handles progress saving and loading for resumability
 * Tracks processed companies and allows resume from checkpoint
 */

const fs = require('fs');
const path = require('path');

class ProgressTracker {
  constructor(progressFile) {
    this.progressFile = progressFile;
    this.results = {
      totalCompanies: 0,
      withWebsites: 0,
      withoutWebsites: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
      contactsDiscovered: 0,
      emailsVerified: 0,
      phonesVerified: 0,
      creditsUsed: {
        search: 0,
        collect: 0,
        employeePreview: 0,
        email: 0,
        phone: 0
      },
      errors: [],
      processedCompanies: [],
      startTime: new Date().toISOString()
    };
  }

  /**
   * Load progress from file
   * @returns {Array} Array of processed company IDs
   */
  async loadProgress() {
    try {
      const data = await fs.promises.readFile(this.progressFile, 'utf8');
      const progressData = JSON.parse(data);
      this.results = { ...this.results, ...progressData };
      return progressData.processedCompanies || [];
    } catch (error) {
      console.log('ℹ️  No previous progress found, starting fresh');
      return [];
    }
  }

  /**
   * Save progress to file
   */
  async saveProgress() {
    try {
      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      await fs.promises.writeFile(this.progressFile, JSON.stringify(progressData, null, 2));
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  }

  /**
   * Track processed company
   * @param {string} id - Company ID
   * @param {string} name - Company name
   * @param {string} website - Company website
   * @param {object} result - Processing result
   */
  trackProcessed(id, name, website, result) {
    this.results.processedCompanies.push({
      id,
      name,
      website,
      result,
      processedAt: new Date().toISOString()
    });
  }

  /**
   * Track error
   * @param {string} company - Company name
   * @param {string} error - Error message
   */
  trackError(company, error) {
    this.results.errors.push({ company, error });
  }

  /**
   * Update statistics
   * @param {object} stats - Statistics to update
   */
  updateStats(stats) {
    Object.keys(stats).forEach(key => {
      if (typeof stats[key] === 'number') {
        this.results[key] = (this.results[key] || 0) + stats[key];
      } else if (typeof stats[key] === 'object' && !Array.isArray(stats[key])) {
        this.results[key] = { ...this.results[key], ...stats[key] };
      }
    });
  }

  /**
   * Print final results
   */
  printResults() {
    console.log('\n📊 Company Enrichment Results:');
    console.log('='.repeat(60));
    console.log(`Total Companies: ${this.results.totalCompanies}`);
    console.log(`Companies with Websites: ${this.results.withWebsites}`);
    console.log(`Companies without Websites: ${this.results.withoutWebsites}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`\n👥 Contact Discovery:`);
    console.log(`Contacts Discovered: ${this.results.contactsDiscovered}`);
    console.log(`Emails Verified: ${this.results.emailsVerified}`);
    console.log(`Phones Verified: ${this.results.phonesVerified}`);
    console.log(`\n💳 Credits Used:`);
    console.log(`Search: ${this.results.creditsUsed.search}`);
    console.log(`Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Employee Preview: ${this.results.creditsUsed.employeePreview}`);
    console.log(`Email Verification: $${this.results.creditsUsed.email.toFixed(4)}`);
    console.log(`Phone Verification: $${this.results.creditsUsed.phone.toFixed(4)}`);
    console.log(`Total Credits: ${this.results.creditsUsed.search + this.results.creditsUsed.collect + this.results.creditsUsed.employeePreview} + $${(this.results.creditsUsed.email + this.results.creditsUsed.phone).toFixed(4)}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error.company}: ${error.error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }
  }

  /**
   * Get results object
   * @returns {object} Complete results
   */
  getResults() {
    return this.results;
  }
}

module.exports = { ProgressTracker };

