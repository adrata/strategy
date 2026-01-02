/**
 * Interactive CLI Interview for Buyer Group Personalization
 * 
 * ENHANCED VERSION - Asks comprehensive questions to build the BEST possible
 * buyer group configuration for any sales organization.
 * 
 * Key Features:
 * 1. Deeper ICP questions (buyer psychology, not just departments)
 * 2. Anti-persona identification (who NOT to target)
 * 3. Buying process understanding (committee size, approval chain)
 * 4. Success pattern analysis (what's worked before)
 * 5. Entry point strategy (champion vs economic buyer first)
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
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 SMART ICP & BUYER GROUP DISCOVERY');
    console.log('═'.repeat(70));
    console.log('\nThis interview builds the BEST possible buyer group configuration.');
    console.log('Better answers = Better buyer groups = More closed deals.\n');

    try {
      // ========================================
      // SECTION 1: PRODUCT & VALUE PROPOSITION
      // ========================================
      console.log('─'.repeat(70));
      console.log('📦 SECTION 1: YOUR PRODUCT');
      console.log('─'.repeat(70) + '\n');

      await this.askQuestion(
        '1. What does your product/service do in ONE sentence?\n   > ',
        'productDescription'
      );

      await this.askQuestion(
        '2. What is the PRIMARY problem you solve for customers?\n   (e.g., "Sales reps waste time calling wrong people who can\'t buy")\n   > ',
        'primaryProblem'
      );

      await this.askMultiSelect(
        '3. What category best describes your product?\n' +
        '   1. Sales Intelligence / Prospecting\n' +
        '   2. CRM / Pipeline Management\n' +
        '   3. Sales Engagement / Outreach\n' +
        '   4. Revenue Operations / Analytics\n' +
        '   5. Marketing Automation\n' +
        '   6. Customer Success / Retention\n' +
        '   7. HR / People Operations\n' +
        '   8. Finance / Accounting\n' +
        '   9. IT / Security\n' +
        '   10. Operations / Logistics\n' +
        '   11. Engineering / Development\n' +
        '   12. Other\n   > ',
        [
          'Sales Intelligence / Prospecting',
          'CRM / Pipeline Management',
          'Sales Engagement / Outreach',
          'Revenue Operations / Analytics',
          'Marketing Automation',
          'Customer Success / Retention',
          'HR / People Operations',
          'Finance / Accounting',
          'IT / Security',
          'Operations / Logistics',
          'Engineering / Development',
          'Other'
        ],
        'productCategories'
      );

      // ========================================
      // SECTION 2: IDEAL BUYER PERSONA
      // ========================================
      console.log('\n' + '─'.repeat(70));
      console.log('👤 SECTION 2: YOUR IDEAL BUYER');
      console.log('─'.repeat(70) + '\n');

      await this.askQuestion(
        '4. Who is your CHAMPION? (Person who fights for your product internally)\n   (e.g., "Director of Sales Ops who owns the tech stack")\n   > ',
        'championPersona'
      );

      await this.askQuestion(
        '5. Who is the ECONOMIC BUYER? (Person who signs the check)\n   (e.g., "VP Sales for <$100K, CRO for larger deals")\n   > ',
        'economicBuyer'
      );

      await this.askMultiSelect(
        '6. What DEPARTMENTS are involved in buying decisions?\n' +
        '   1. Sales\n' +
        '   2. Revenue Operations / Sales Operations\n' +
        '   3. Marketing\n' +
        '   4. IT / Technology\n' +
        '   5. Finance / Procurement\n' +
        '   6. Legal / Compliance\n' +
        '   7. Executive (CEO, COO)\n' +
        '   8. HR / People\n' +
        '   9. Product\n' +
        '   10. Engineering\n' +
        '   11. Customer Success\n' +
        '   12. Other\n   > ',
        [
          'Sales',
          'Revenue Operations / Sales Operations',
          'Marketing',
          'IT / Technology',
          'Finance / Procurement',
          'Legal / Compliance',
          'Executive (CEO, COO)',
          'HR / People',
          'Product',
          'Engineering',
          'Customer Success',
          'Other'
        ],
        'keyDepartments'
      );

      // ========================================
      // SECTION 3: ANTI-PERSONAS (CRITICAL!)
      // ========================================
      console.log('\n' + '─'.repeat(70));
      console.log('🚫 SECTION 3: WHO TO AVOID (ANTI-PERSONAS)');
      console.log('─'.repeat(70) + '\n');

      await this.askQuestion(
        '7. What TITLES should we NEVER include? (Roles that waste your time)\n   (e.g., "Account Managers, Product Managers, Engineers")\n   > ',
        'excludeTitles'
      );

      await this.askQuestion(
        '8. What DEPARTMENTS are NOT relevant to your sale?\n   (e.g., "Product, Engineering, Customer Success")\n   > ',
        'excludeDepartments'
      );

      await this.askQuestion(
        '9. What objections do you hear from WRONG people?\n   (e.g., "I have perfect visibility already" = wrong persona)\n   > ',
        'wrongPersonaSignals',
        { optional: true }
      );

      // ========================================
      // SECTION 4: DEAL DYNAMICS
      // ========================================
      console.log('\n' + '─'.repeat(70));
      console.log('💰 SECTION 4: DEAL DYNAMICS');
      console.log('─'.repeat(70) + '\n');

      await this.askQuestion(
        '10. What is your typical deal size (ACV)?\n    (e.g., "$50,000" or "$25K-$100K")\n    > ',
        'dealSize'
      );

      await this.askSingleChoice(
        '11. What is your typical sales cycle length?\n' +
        '    1. Fast (< 30 days)\n' +
        '    2. Medium (1-3 months)\n' +
        '    3. Long (3-6 months)\n' +
        '    4. Enterprise (6+ months)\n    > ',
        [
          'Fast (< 30 days)',
          'Medium (1-3 months)',
          'Long (3-6 months)',
          'Enterprise (6+ months)'
        ],
        'salesCycle'
      );

      await this.askSingleChoice(
        '12. How many people are typically in a buying committee?\n' +
        '    1. Small (1-3 people)\n' +
        '    2. Medium (3-5 people)\n' +
        '    3. Large (5-8 people)\n' +
        '    4. Enterprise (8+ people)\n    > ',
        [
          'Small (1-3 people)',
          'Medium (3-5 people)',
          'Large (5-8 people)',
          'Enterprise (8+ people)'
        ],
        'buyingCommitteeSize'
      );

      await this.askSingleChoice(
        '13. At what deal size does it require C-level approval?\n' +
        '    1. Always C-level\n' +
        '    2. $25K+ needs C-level\n' +
        '    3. $50K+ needs C-level\n' +
        '    4. $100K+ needs C-level\n' +
        '    5. $250K+ needs C-level\n' +
        '    6. Rarely involves C-level\n    > ',
        [
          'Always C-level',
          '$25K+ needs C-level',
          '$50K+ needs C-level',
          '$100K+ needs C-level',
          '$250K+ needs C-level',
          'Rarely involves C-level'
        ],
        'cLevelThreshold'
      );

      // ========================================
      // SECTION 5: TARGET COMPANIES
      // ========================================
      console.log('\n' + '─'.repeat(70));
      console.log('🏢 SECTION 5: TARGET COMPANIES');
      console.log('─'.repeat(70) + '\n');

      await this.askMultiSelect(
        '14. What industries convert best for you?\n' +
        '    1. Software / SaaS\n' +
        '    2. Technology / IT Services\n' +
        '    3. Financial Services\n' +
        '    4. Healthcare\n' +
        '    5. Manufacturing\n' +
        '    6. Retail / E-commerce\n' +
        '    7. Professional Services\n' +
        '    8. Education\n' +
        '    9. All industries\n    > ',
        [
          'Software / SaaS',
          'Technology / IT Services',
          'Financial Services',
          'Healthcare',
          'Manufacturing',
          'Retail / E-commerce',
          'Professional Services',
          'Education',
          'All industries'
        ],
        'targetIndustries'
      );

      await this.askSingleChoice(
        '15. What company size (employees) is your sweet spot?\n' +
        '    1. Startups (1-50)\n' +
        '    2. Small (50-200)\n' +
        '    3. Mid-Market (200-1,000)\n' +
        '    4. Upper Mid-Market (1,000-5,000)\n' +
        '    5. Enterprise (5,000+)\n' +
        '    6. All sizes\n    > ',
        [
          'Startups (1-50)',
          'Small (50-200)',
          'Mid-Market (200-1,000)',
          'Upper Mid-Market (1,000-5,000)',
          'Enterprise (5,000+)',
          'All sizes'
        ],
        'targetCompanySize'
      );

      // ========================================
      // SECTION 6: SUCCESS PATTERNS
      // ========================================
      console.log('\n' + '─'.repeat(70));
      console.log('🏆 SECTION 6: SUCCESS PATTERNS');
      console.log('─'.repeat(70) + '\n');

      await this.askQuestion(
        '16. What TITLE has closed the MOST deals for you?\n    (e.g., "VP Sales Operations" or "Director RevOps")\n    > ',
        'bestClosingTitle'
      );

      await this.askQuestion(
        '17. What titles are your MUST-HAVES in every buyer group?\n    (e.g., "Always need VP Sales or CRO")\n    > ',
        'criticalRoles',
        { optional: true }
      );

      await this.askSingleChoice(
        '18. Entry point strategy - who do you target FIRST?\n' +
        '    1. Economic buyer first (decision maker)\n' +
        '    2. Champion first (internal advocate)\n' +
        '    3. End user first (bottom-up)\n' +
        '    4. Multiple entry points\n    > ',
        [
          'Economic buyer first',
          'Champion first',
          'End user first (bottom-up)',
          'Multiple entry points'
        ],
        'entryPointStrategy'
      );

      // ========================================
      // SECTION 7: LOGISTICS
      // ========================================
      console.log('\n' + '─'.repeat(70));
      console.log('🌍 SECTION 7: LOGISTICS');
      console.log('─'.repeat(70) + '\n');

      await this.askSingleChoice(
        '19. Geographic focus?\n' +
        '    1. USA only\n' +
        '    2. North America (USA + Canada)\n' +
        '    3. English-speaking countries\n' +
        '    4. Global (no restrictions)\n    > ',
        [
          'USA only',
          'North America',
          'English-speaking',
          'Global'
        ],
        'usaOnly'
      );

      await this.askSingleChoice(
        '20. Do you need to engage BLOCKERS (IT, Security, Legal) early?\n' +
        '    1. Yes, always\n' +
        '    2. Only for enterprise deals\n' +
        '    3. Only if required\n' +
        '    4. No, avoid until necessary\n    > ',
        [
          'Yes, always',
          'Only for enterprise',
          'Only if required',
          'No, avoid'
        ],
        'blockerEngagement'
      );

      console.log('\n' + '═'.repeat(70));
      console.log('✅ INTERVIEW COMPLETE!');
      console.log('═'.repeat(70));
      console.log('\nAnalyzing responses to build optimal buyer group configuration...\n');

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


