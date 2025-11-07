/**
 * Smart Interviewer Engine
 * 
 * Gathers optimal context before running pipelines
 * Asks clarifying questions to ensure best possible outcomes
 * Similar to interview-config.js in find-buyer-group
 */

const readline = require('readline');

class InterviewEngine {
  constructor(pipelineName, options = {}) {
    this.pipelineName = pipelineName;
    this.useAI = options.useAI && process.env.ANTHROPIC_API_KEY;
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.context = {};
    
    // Create readline interface for CLI interaction
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Ask a question and wait for answer
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User's answer
   */
  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(`${question} `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Conduct interview to gather context
   * @param {string} pipelineType - Type of pipeline (company/person/role/buyer-group)
   * @returns {Promise<object>} Gathered context
   */
  async conductInterview(pipelineType) {
    console.log('\n' + '='.repeat(80));
    console.log(`🎤 SMART INTERVIEWER - ${this.pipelineName}`);
    console.log('='.repeat(80));
    console.log('\nLet me ask a few questions to get you the best results...\n');

    switch (pipelineType) {
      case 'company':
        return await this.interviewForCompany();
      case 'person':
        return await this.interviewForPerson();
      case 'role':
        return await this.interviewForRole();
      case 'buyer-group':
        return await this.interviewForBuyerGroup();
      case 'optimal-buyer-group':
        return await this.interviewForOptimalBuyerGroup();
      default:
        return {};
    }
  }

  async interviewForCompany() {
    const context = {};
    
    // Company identifier
    const identifier = await this.ask('🏢 What company would you like to enrich? (name, website, or LinkedIn URL):');
    context.identifier = identifier;
    
    // Level of enrichment
    const level = await this.ask('📊 Enrichment level? (1=basic, 2=with contacts, 3=full intelligence) [2]:');
    context.enrichmentLevel = level || '2';
    
    if (context.enrichmentLevel === '2' || context.enrichmentLevel === '3') {
      const contactCount = await this.ask('👥 How many key contacts do you need? [5]:');
      context.contactCount = parseInt(contactCount) || 5;
    }
    
    if (context.enrichmentLevel === '3') {
      const dealSize = await this.ask('💰 What\'s your typical deal size? (helps prioritize contacts) [$150,000]:');
      context.dealSize = parseInt(dealSize.replace(/[$,]/g, '')) || 150000;
      
      const productCategory = await this.ask('📦 Product category? (sales/marketing/operations) [sales]:');
      context.productCategory = productCategory || 'sales';
    }
    
    this.rl.close();
    return context;
  }

  async interviewForPerson() {
    const context = {};
    
    // Person identifier
    const name = await this.ask('👤 Person\'s full name:');
    context.name = name;
    
    const email = await this.ask('📧 Email address (if known) [optional]:');
    if (email) context.email = email;
    
    const linkedin = await this.ask('🔗 LinkedIn URL (if known) [optional]:');
    if (linkedin) context.linkedinUrl = linkedin;
    
    const companyName = await this.ask('🏢 Company name (helps with search) [optional]:');
    if (companyName) context.companyName = companyName;
    
    // Verification preferences
    const verify = await this.ask('✅ Verify email and phone? (y/n) [y]:');
    context.verifyContact = verify.toLowerCase() !== 'n';
    
    this.rl.close();
    return context;
  }

  async interviewForRole() {
    const context = {};
    
    // Target role
    const role = await this.ask('🎯 What role are you looking for? (e.g., CFO, CTO, VP Sales):');
    context.targetRole = role;
    
    // Company context
    const company = await this.ask('🏢 At which company? (name, website, or leave blank for all):');
    context.company = company;
    
    // Number of results
    const maxResults = await this.ask('📊 How many matches do you need? [1]:');
    context.maxResults = parseInt(maxResults) || 1;
    
    // Contact verification
    const verify = await this.ask('✅ Verify contact information for matches? (y/n) [y]:');
    context.verifyContact = verify.toLowerCase() !== 'n';
    
    // AI variations
    const useAI = await this.ask('🤖 Use AI to generate role variations? (y/n) [y]:');
    context.useAI = useAI.toLowerCase() !== 'n';
    
    this.rl.close();
    return context;
  }

  async interviewForBuyerGroup() {
    const context = {};
    
    // Company identifier
    const company = await this.ask('🏢 What company? (name, website, or LinkedIn URL):');
    context.company = company;
    
    // Deal context
    const dealSize = await this.ask('💰 Deal size? (helps identify right decision-makers) [$150,000]:');
    context.dealSize = parseInt(dealSize.replace(/[$,]/g, '')) || 150000;
    
    const productCategory = await this.ask('📦 Product category? (sales/marketing/operations/other) [sales]:');
    context.productCategory = productCategory || 'sales';
    
    // Buyer group preferences
    const minSize = await this.ask('👥 Minimum buyer group size? [1]:');
    context.minSize = parseInt(minSize) || 1;
    
    const maxSize = await this.ask('👥 Maximum buyer group size? [8]:');
    context.maxSize = parseInt(maxSize) || 8;
    
    // Geographic preference
    const usaOnly = await this.ask('🇺🇸 USA contacts only? (y/n) [n]:');
    context.usaOnly = usaOnly.toLowerCase() === 'y';
    
    // Verification
    const fullVerification = await this.ask('✅ Full email & phone verification? (y/n) [y]:');
    context.fullVerification = fullVerification.toLowerCase() !== 'n';
    
    this.rl.close();
    return context;
  }

  async interviewForOptimalBuyerGroup() {
    const context = {};
    
    console.log('This will help me find the BEST companies for your Go-To-Buyer Platform.\n');
    
    // Industries
    const industries = await this.ask('🏭 Target industries? (comma-separated, e.g., "Software,SaaS,FinTech"):');
    context.industries = industries.split(',').map(i => i.trim()).filter(Boolean);
    
    // Company size
    const sizeRange = await this.ask('📏 Company size range? (e.g., "50-200 employees", "200-1000 employees") [50-200 employees]:');
    context.sizeRange = sizeRange || '50-200 employees';
    
    // Growth rate
    const minGrowth = await this.ask('📈 Minimum growth rate %? (higher = faster growing companies) [10]:');
    context.minGrowthRate = parseInt(minGrowth) || 10;
    
    // Locations
    const locations = await this.ask('🌍 Target locations? (comma-separated, e.g., "United States,Canada") [leave blank for all]:');
    if (locations) {
      context.locations = locations.split(',').map(l => l.trim()).filter(Boolean);
    }
    
    // Technology keywords
    const keywords = await this.ask('💻 Technology keywords? (comma-separated, e.g., "AI,Cloud,SaaS") [optional]:');
    if (keywords) {
      context.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
    }
    
    // Results count
    const maxResults = await this.ask('📊 How many qualified buyer groups do you want? [20]:');
    context.maxResults = parseInt(maxResults) || 20;
    
    // Minimum score
    const minScore = await this.ask('🎯 Minimum buyer readiness score? (70-100, higher = more qualified) [70]:');
    context.minReadinessScore = parseInt(minScore) || 70;
    
    // Contact verification
    const verifyContacts = await this.ask('✅ Verify contact information for top candidates? (y/n) [y]:');
    context.verifyContacts = verifyContacts.toLowerCase() !== 'n';
    
    this.rl.close();
    return context;
  }

  /**
   * Generate AI-powered follow-up questions
   * @param {object} initialContext - Initial context gathered
   * @param {string} pipelineType - Pipeline type
   * @returns {Promise<Array>} Follow-up questions
   */
  async generateFollowUpQuestions(initialContext, pipelineType) {
    if (!this.useAI) {
      return [];
    }

    try {
      const prompt = `Based on this initial context for a ${pipelineType} search, what clarifying questions should I ask to get the best results?

Initial Context:
${JSON.stringify(initialContext, null, 2)}

Return ONLY a JSON array of 2-3 short, specific questions that would help narrow down and optimize the search. For example:
["What industry is the company in?", "What's your typical deal size?", "Do you need USA contacts only?"]

Return only the JSON array, nothing else.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 500,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.error('❌ AI follow-up generation failed:', error.message);
    }

    return [];
  }

  /**
   * Print context summary
   * @param {object} context - Gathered context
   */
  printContextSummary(context) {
    console.log('\n' + '-'.repeat(80));
    console.log('📋 CONTEXT SUMMARY');
    console.log('-'.repeat(80));
    
    Object.entries(context).forEach(([key, value]) => {
      console.log(`${key}: ${JSON.stringify(value)}`);
    });
    
    console.log('-'.repeat(80) + '\n');
  }
}

module.exports = { InterviewEngine };

