/**
 * Interactive CLI Interview for Buyer Group Personalization
 * 
 * Asks 7 questions to understand the company's business model,
 * then uses AI to generate optimized buyer group discovery configuration
 */

const readline = require('readline');

class BuyerGroupInterview {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.responses = {};
  }

  /**
   * Run the complete interview
   * @returns {Promise<object>} Interview responses
   */
  async run() {
    console.log('🎯 BUYER GROUP PERSONALIZATION INTERVIEW');
    console.log('==========================================\n');
    console.log('Answer these questions to personalize buyer group discovery for your business.\n');

    try {
      // Question 1: Product/Service Description
      await this.askQuestion(
        '1. What does your company sell? (e.g., Communications Engineering Services, Software, Consulting)\n   > ',
        'productDescription'
      );

      // Question 2: Target Industries
      await this.askMultiSelect(
        '2. What industries do you typically sell to? (Enter numbers separated by commas)\n   1. Utilities\n   2. Healthcare\n   3. Finance\n   4. Manufacturing\n   5. Technology\n   6. Energy\n   7. Government\n   8. Education\n   9. Retail\n   10. Other\n   > ',
        [
          'Utilities',
          'Healthcare',
          'Finance',
          'Manufacturing',
          'Technology',
          'Energy',
          'Government',
          'Education',
          'Retail',
          'Other'
        ],
        'targetIndustries'
      );

      // Question 3: Typical Deal Size
      await this.askQuestion(
        '3. What is your typical deal size? (e.g., $150K, $500K, $1M)\n   > ',
        'dealSize'
      );

      // Question 4: Decision Makers
      await this.askMultiSelect(
        '4. Who typically makes the buying decision? (Enter numbers separated by commas)\n   1. C-Level Executives (CEO, CFO, CTO)\n   2. VP/Director level\n   3. IT/Technology leaders\n   4. Operations leaders\n   5. Sales/Marketing leaders\n   6. Finance/Procurement\n   7. Other\n   > ',
        [
          'C-Level Executives (CEO, CFO, CTO)',
          'VP/Director level',
          'IT/Technology leaders',
          'Operations leaders',
          'Sales/Marketing leaders',
          'Finance/Procurement',
          'Other'
        ],
        'decisionMakers'
      );

      // Question 5: Key Departments
      await this.askQuestion(
        '5. Which departments are most involved in evaluating your solution? (comma-separated, e.g., Engineering, IT, Operations, Sales)\n   > ',
        'keyDepartments'
      );

      // Question 6: Sales Cycle Complexity
      await this.askSingleChoice(
        '6. How complex is your typical sales cycle?\n   1. Short (<3 months) - simpler buyer group\n   2. Medium (3-6 months) - standard buyer group\n   3. Long (>6 months) - comprehensive buyer group\n   > ',
        [
          'Short (<3 months)',
          'Medium (3-6 months)',
          'Long (>6 months)'
        ],
        'salesCycle'
      );

      // Question 7: Critical Roles (optional)
      await this.askQuestion(
        '7. Are there any specific titles, departments, or roles that are ALWAYS involved in your deals? (optional, press Enter to skip)\n   > ',
        'criticalRoles',
        { optional: true }
      );

      console.log('\n✅ Interview complete! Analyzing your responses...\n');
      return this.responses;

    } catch (error) {
      console.error('❌ Interview error:', error.message);
      throw error;
    } finally {
      this.close();
    }
  }

  /**
   * Ask a single text question
   * @param {string} question - Question text
   * @param {string} key - Response key
   * @param {object} options - Options (optional flag)
   */
  async askQuestion(question, key, options = {}) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const trimmed = answer.trim();
        if (!trimmed && !options.optional) {
          console.log('   ⚠️  This field is required. Please try again.');
          return this.askQuestion(question, key, options).then(resolve);
        }
        this.responses[key] = trimmed || null;
        resolve(trimmed);
      });
    });
  }

  /**
   * Ask a single-choice question
   * @param {string} question - Question text with options
   * @param {Array<string>} options - Array of option strings
   * @param {string} key - Response key
   */
  async askSingleChoice(question, options, key) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const choice = parseInt(answer.trim());
        if (isNaN(choice) || choice < 1 || choice > options.length) {
          console.log(`   ⚠️  Please enter a number between 1 and ${options.length}.`);
          return this.askSingleChoice(question, options, key).then(resolve);
        }
        this.responses[key] = options[choice - 1];
        resolve(options[choice - 1]);
      });
    });
  }

  /**
   * Ask a multi-select question
   * @param {string} question - Question text with options
   * @param {Array<string>} options - Array of option strings
   * @param {string} key - Response key
   */
  async askMultiSelect(question, options, key) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const selections = answer.trim().split(',').map(s => parseInt(s.trim()));
        const validSelections = selections.filter(s => !isNaN(s) && s >= 1 && s <= options.length);
        
        if (validSelections.length === 0) {
          console.log(`   ⚠️  Please enter at least one valid number between 1 and ${options.length}.`);
          return this.askMultiSelect(question, options, key).then(resolve);
        }

        const selectedOptions = [...new Set(validSelections)].map(i => options[i - 1]);
        this.responses[key] = selectedOptions;
        resolve(selectedOptions);
      });
    });
  }

  /**
   * Close the readline interface
   */
  close() {
    this.rl.close();
  }
}

module.exports = { BuyerGroupInterview };


