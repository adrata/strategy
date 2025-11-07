/**
 * Progress Tracker Module
 * 
 * Handles progress saving and loading for resumability
 * Tracks processed people and statistics
 */

const fs = require('fs');

class ProgressTracker {
  constructor(progressFile) {
    this.progressFile = progressFile;
    this.results = {
      totalPeople: 0,
      withEmail: 0,
      withLinkedIn: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
      emailsVerified: 0,
      phonesVerified: 0,
      creditsUsed: {
        search: 0,
        collect: 0,
        email: 0,
        phone: 0
      },
      errors: [],
      processedPeople: [],
      startTime: new Date().toISOString()
    };
  }

  async loadProgress() {
    try {
      const data = await fs.promises.readFile(this.progressFile, 'utf8');
      const progressData = JSON.parse(data);
      this.results = { ...this.results, ...progressData };
      return progressData.processedPeople || [];
    } catch (error) {
      console.log('ℹ️  No previous progress found, starting fresh');
      return [];
    }
  }

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

  trackProcessed(id, name, email, linkedinUrl, result) {
    this.results.processedPeople.push({
      id,
      name,
      email,
      linkedinUrl,
      result,
      processedAt: new Date().toISOString()
    });
  }

  trackError(person, error) {
    this.results.errors.push({ person, error });
  }

  updateStats(stats) {
    Object.keys(stats).forEach(key => {
      if (typeof stats[key] === 'number') {
        this.results[key] = (this.results[key] || 0) + stats[key];
      } else if (typeof stats[key] === 'object' && !Array.isArray(stats[key])) {
        this.results[key] = { ...this.results[key], ...stats[key] };
      }
    });
  }

  printResults() {
    console.log('\n📊 Person Enrichment Results:');
    console.log('='.repeat(60));
    console.log(`Total People: ${this.results.totalPeople}`);
    console.log(`People with Email: ${this.results.withEmail}`);
    console.log(`People with LinkedIn: ${this.results.withLinkedIn}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`\n📧📞 Contact Verification:`);
    console.log(`Emails Verified: ${this.results.emailsVerified}`);
    console.log(`Phones Verified: ${this.results.phonesVerified}`);
    console.log(`\n💳 Credits Used:`);
    console.log(`Search: ${this.results.creditsUsed.search}`);
    console.log(`Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Email Verification: $${this.results.creditsUsed.email.toFixed(4)}`);
    console.log(`Phone Verification: $${this.results.creditsUsed.phone.toFixed(4)}`);
    console.log(`Total Credits: ${this.results.creditsUsed.search + this.results.creditsUsed.collect} + $${(this.results.creditsUsed.email + this.results.creditsUsed.phone).toFixed(4)}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error.person}: ${error.error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }
  }

  getResults() {
    return this.results;
  }
}

module.exports = { ProgressTracker };

