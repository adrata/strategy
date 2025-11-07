/**
 * Progress Tracker Module
 * 
 * Handles progress saving and loading for role searches
 * Tracks role matches and statistics
 */

const fs = require('fs');

class ProgressTracker {
  constructor(progressFile) {
    this.progressFile = progressFile;
    this.results = {
      totalSearches: 0,
      successfulMatches: 0,
      failedMatches: 0,
      aiGeneratedVariations: 0,
      fallbackVariations: 0,
      emailsVerified: 0,
      phonesVerified: 0,
      creditsUsed: {
        search: 0,
        collect: 0,
        email: 0,
        phone: 0
      },
      errors: [],
      processedRoles: [],
      startTime: new Date().toISOString()
    };
  }

  async loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progressData = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        this.results = { ...this.results, ...progressData };
        console.log(`📂 Loaded progress: ${this.results.processedRoles.length} roles processed`);
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

  trackMatch(match) {
    this.results.processedRoles.push(match);
  }

  trackError(role, matchLevel, error) {
    this.results.errors.push({
      timestamp: new Date().toISOString(),
      role,
      matchLevel,
      error
    });
  }

  updateStats(stats) {
    Object.keys(stats).forEach(key => {
      if (typeof stats[key] === 'number') {
        this.results[key] = (this.results[key] || 0) + stats[key];
      }
    });
  }

  printResults() {
    console.log('\n📊 Final Results:');
    console.log(`✅ Successful matches: ${this.results.successfulMatches}`);
    console.log(`❌ Failed matches: ${this.results.failedMatches}`);
    console.log(`🤖 AI generated variations: ${this.results.aiGeneratedVariations}`);
    console.log(`🔄 Fallback variations: ${this.results.fallbackVariations}`);
    console.log(`\n📧📞 Contact Verification:`);
    console.log(`Emails Verified: ${this.results.emailsVerified}`);
    console.log(`Phones Verified: ${this.results.phonesVerified}`);
    console.log(`\n💳 Credits Used:`);
    console.log(`Search: ${this.results.creditsUsed.search}`);
    console.log(`Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Email Verification: $${this.results.creditsUsed.email.toFixed(4)}`);
    console.log(`Phone Verification: $${this.results.creditsUsed.phone.toFixed(4)}`);
    
    if (this.results.processedRoles.length > 0) {
      console.log('\n👥 Found Contacts:');
      this.results.processedRoles.forEach((role, index) => {
        console.log(`${index + 1}. ${role.name} - ${role.title}`);
        console.log(`   Email: ${role.email || 'N/A'} ${role.emailVerified ? '✅' : ''}`);
        console.log(`   Phone: ${role.phone || 'N/A'} ${role.phoneVerified ? '✅' : ''}`);
      });
    }
  }

  getResults() {
    return {
      ...this.results,
      endTime: new Date().toISOString(),
      duration: new Date() - new Date(this.results.startTime)
    };
  }
}

module.exports = { ProgressTracker };

