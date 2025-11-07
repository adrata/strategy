/**
 * Progress Tracker Module
 * 
 * Handles progress saving and loading for optimal buyer group searches
 * Tracks qualified buyers and statistics
 */

const fs = require('fs');

class ProgressTracker {
  constructor(progressFile) {
    this.progressFile = progressFile;
    this.results = {
      searchCriteria: {},
      searchDate: new Date().toISOString(),
      totalCandidates: 0,
      qualifiedBuyers: 0,
      optimalBuyerGroups: [],
      emailsVerified: 0,
      phonesVerified: 0,
      creditsUsed: {
        search: 0,
        collect: 0,
        person_search: 0,
        preview_search: 0,
        email: 0,
        phone: 0
      },
      errors: [],
      startTime: new Date().toISOString()
    };
  }

  async loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progressData = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        this.results = { ...this.results, ...progressData };
        console.log(`📂 Loaded progress: ${this.results.optimalBuyerGroups?.length || 0} buyer groups found`);
      }
    } catch (error) {
      console.log('📂 No existing progress file found, starting fresh');
    }
  }

  async saveProgress() {
    try {
      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.progressFile, JSON.stringify(progressData, null, 2));
      console.log(`💾 Progress saved to ${this.progressFile}`);
    } catch (error) {
      console.error('❌ Failed to save progress:', error.message);
    }
  }

  updateStats(stats) {
    Object.keys(stats).forEach(key => {
      if (typeof stats[key] === 'number') {
        this.results[key] = (this.results[key] || 0) + stats[key];
      } else if (key === 'creditsUsed' && typeof stats[key] === 'object') {
        Object.keys(stats[key]).forEach(creditType => {
          this.results.creditsUsed[creditType] = (this.results.creditsUsed[creditType] || 0) + stats[key][creditType];
        });
      }
    });
  }

  trackError(timestamp, error) {
    this.results.errors.push({ timestamp, error });
  }

  getResults() {
    return {
      ...this.results,
      endTime: new Date().toISOString(),
      processingTime: new Date() - new Date(this.results.startTime)
    };
  }

  setOptimalBuyerGroups(groups) {
    this.results.optimalBuyerGroups = groups;
    this.results.qualifiedBuyers = groups.length;
  }
}

module.exports = { ProgressTracker };

