/**
 * Progress Tracker Module
 * 
 * Handles progress saving and loading for resumability
 * Tracks processed homeowners and statistics
 */

const fs = require('fs');
const path = require('path');

class ProgressTracker {
  constructor(progressFile) {
    this.progressFile = progressFile || 'scripts/_future_now/find-homeowners/homeowner-progress.json';
    this.results = {
      totalProperties: 0,
      totalHomeowners: 0,
      withPhone: 0,
      withMobile: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      averageScore: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      creditsUsed: {
        batchData: 0,
        phoneVerification: 0
      },
      errors: [],
      processedIds: [],
      startTime: new Date().toISOString()
    };
  }

  /**
   * Load previous progress
   * @returns {Promise<Array>} - Previously processed IDs
   */
  async loadProgress() {
    try {
      const data = await fs.promises.readFile(this.progressFile, 'utf8');
      const progressData = JSON.parse(data);
      this.results = { ...this.results, ...progressData };
      return progressData.processedIds || [];
    } catch (error) {
      console.log('   No previous progress found, starting fresh');
      return [];
    }
  }

  /**
   * Save current progress
   */
  async saveProgress() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.progressFile);
      await fs.promises.mkdir(dir, { recursive: true });

      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      await fs.promises.writeFile(this.progressFile, JSON.stringify(progressData, null, 2));
    } catch (error) {
      console.error('   Error saving progress:', error.message);
    }
  }

  /**
   * Track a processed homeowner
   * @param {Object} homeowner - Processed homeowner data
   */
  trackProcessed(homeowner) {
    this.results.processedIds.push({
      id: homeowner.id || homeowner.propertyId,
      address: homeowner.address,
      score: homeowner.thirstyBuyerScore,
      processedAt: new Date().toISOString()
    });
  }

  /**
   * Track an error
   * @param {string} context - Error context
   * @param {string} error - Error message
   */
  trackError(context, error) {
    this.results.errors.push({
      context,
      error,
      timestamp: new Date().toISOString()
    });
    this.results.failed++;
  }

  /**
   * Update statistics
   * @param {Object} stats - Statistics to update
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
   * Set a statistic value
   * @param {string} key - Stat key
   * @param {any} value - Stat value
   */
  setStat(key, value) {
    this.results[key] = value;
  }

  /**
   * Get current results
   * @returns {Object} - Results object
   */
  getResults() {
    return this.results;
  }

  /**
   * Print final results summary
   */
  printResults() {
    const duration = this.calculateDuration();
    
    console.log('\n' + '='.repeat(60));
    console.log('   HOMEOWNER IMPORT RESULTS');
    console.log('='.repeat(60));
    
    console.log('\n   Data Collection:');
    console.log(`   - Properties searched: ${this.results.totalProperties}`);
    console.log(`   - Homeowners found: ${this.results.totalHomeowners}`);
    console.log(`   - With phone: ${this.results.withPhone}`);
    console.log(`   - With mobile: ${this.results.withMobile}`);
    
    console.log('\n   Import Results:');
    console.log(`   - Successfully imported: ${this.results.imported}`);
    console.log(`   - Skipped (duplicates): ${this.results.skipped}`);
    console.log(`   - Failed: ${this.results.failed}`);
    
    console.log('\n   Lead Quality:');
    console.log(`   - High priority (75+): ${this.results.highPriority}`);
    console.log(`   - Medium priority (50-74): ${this.results.mediumPriority}`);
    console.log(`   - Low priority (<50): ${this.results.lowPriority}`);
    console.log(`   - Average score: ${this.results.averageScore}`);
    
    console.log('\n   Costs:');
    console.log(`   - BatchData credits: ~${this.results.creditsUsed.batchData}`);
    console.log(`   - Phone verification: ~$${this.results.creditsUsed.phoneVerification?.toFixed(2) || '0.00'}`);
    
    console.log('\n   Performance:');
    console.log(`   - Duration: ${duration}`);
    console.log(`   - Start: ${this.results.startTime}`);
    console.log(`   - End: ${new Date().toISOString()}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n   Errors (${this.results.errors.length}):`);
      this.results.errors.slice(0, 5).forEach(error => {
        console.log(`   - ${error.context}: ${error.error}`);
      });
      if (this.results.errors.length > 5) {
        console.log(`   ... and ${this.results.errors.length - 5} more errors`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Calculate duration since start
   * @returns {string} - Formatted duration
   */
  calculateDuration() {
    const start = new Date(this.results.startTime);
    const end = new Date();
    const durationMs = end - start;
    
    const seconds = Math.floor(durationMs / 1000) % 60;
    const minutes = Math.floor(durationMs / (1000 * 60)) % 60;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Export results to CSV
   * @param {Array} homeowners - Homeowners to export
   * @param {string} filename - Output filename
   */
  async exportToCSV(homeowners, filename = 'homeowners-export.csv') {
    const headers = [
      'Name',
      'Phone',
      'Address',
      'City',
      'State',
      'Zip',
      'Home Value',
      'Lot Size (sqft)',
      'Year Built',
      'Score',
      'Priority'
    ];

    const rows = homeowners.map(h => [
      h.ownerName || `${h.firstName || ''} ${h.lastName || ''}`.trim(),
      h.phoneFormatted || h.phone || '',
      h.address || '',
      h.city || '',
      h.state || '',
      h.postalCode || '',
      h.homeValue || '',
      h.lotSizeSqFt || '',
      h.yearBuilt || '',
      h.thirstyBuyerScore || '',
      h.priority || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const filepath = path.join(path.dirname(this.progressFile), filename);
    await fs.promises.writeFile(filepath, csv);
    console.log(`   Exported ${homeowners.length} homeowners to ${filepath}`);
    
    return filepath;
  }
}

module.exports = { ProgressTracker };

