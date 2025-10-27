#!/usr/bin/env node

/**
 * Find Role - AI-Powered Role Enrichment Script
 * 
 * This script finds specific roles within companies using Claude AI
 * to generate role variations and Coresignal API for intelligent matching.
 * 
 * Features:
 * - Claude AI-powered role variation generation
 * - Multi-layered hierarchical search fallback
 * - Confidence-based matching system
 * - Progress tracking and resumability
 * - Real-time progress updates
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class RoleEnrichment {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    // Configuration options
    this.targetRole = options.targetRole; // Required
    this.companyId = options.companyId; // Optional
    this.companyLinkedInUrl = options.companyLinkedInUrl; // Optional
    this.maxResults = options.maxResults || 1; // Default 1, allow 3+
    this.useAI = options.useAI ?? true; // Default true
    
    // Processing settings
    this.batchSize = 5; // Smaller batches for better reliability
    this.delayBetweenBatches = 3000; // 3 seconds delay
    this.delayBetweenRequests = 1000; // 1 second between individual requests
    this.progressFile = '_future_now/role-enrichment-progress.json';
    
    this.results = {
      totalSearches: 0,
      successfulMatches: 0,
      failedMatches: 0,
      aiGeneratedVariations: 0,
      fallbackVariations: 0,
      creditsUsed: {
        search: 0,
        collect: 0
      },
      errors: [],
      processedRoles: [],
      startTime: new Date().toISOString()
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }

    if (!this.targetRole) {
      console.error('❌ targetRole is required in constructor options');
      process.exit(1);
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log(`🎯 Starting AI-powered role search for: ${this.targetRole}`);
      console.log(`📊 Max results: ${this.maxResults}`);
      console.log(`🤖 AI enabled: ${this.useAI}`);
      
      await this.loadProgress();
      
      // Find company first
      const company = await this.findCompany();
      if (!company) {
        throw new Error('Company not found or not specified');
      }
      
      console.log(`🏢 Found company: ${company.name} (${company.website})`);
      
      // Generate role variations using Claude AI
      const roleVariations = await this.generateRoleVariations(this.targetRole, {
        companyName: company.name,
        industry: company.industry || 'Technology',
        website: company.website
      });
      
      console.log(`🔍 Generated ${roleVariations.primary.length + roleVariations.secondary.length + roleVariations.tertiary.length} role variations`);
      
      // Search for people with these roles
      const matches = await this.searchForRoleMatches(company, roleVariations);
      
      // Process and save results
      await this.processMatches(matches, company);
      
      console.log(`✅ Role search completed successfully`);
      console.log(`📈 Results: ${this.results.successfulMatches} matches found`);
      
    } catch (error) {
      console.error('❌ Role search failed:', error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      await this.saveProgress();
      await this.prisma.$disconnect();
    }
  }

  /**
   * Find company using existing company search logic
   */
  async findCompany() {
    if (this.companyLinkedInUrl) {
      // Find company by LinkedIn URL
      const company = await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          customFields: {
            path: ['linkedinUrl'],
            equals: this.companyLinkedInUrl
          }
        }
      });
      
      if (company) {
        return company;
      }
    }
    
    if (this.companyId) {
      // Find company by ID
      const company = await this.prisma.companies.findFirst({
        where: {
          id: this.companyId,
          workspaceId: this.workspaceId,
          deletedAt: null
        }
      });
      
      if (company) {
        return company;
      }
    }
    
    // If no specific company, use first company with Coresignal data
    const company = await this.prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    });
    
    return company;
  }

  /**
   * Generate role variations using Claude AI
   */
  async generateRoleVariations(targetRole, context) {
    if (!this.useAI || !this.claudeApiKey) {
      console.log('⚠️ Claude AI not available, using fallback role dictionary');
      return this.getFallbackRoleVariations(targetRole);
    }

    try {
      const prompt = this.buildRoleVariationPrompt(targetRole, context);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          temperature: 0.2, // Lower temperature for consistent business titles
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      const variations = this.parseRoleVariations(content);
      this.results.aiGeneratedVariations++;
      
      console.log(`🤖 AI generated variations for "${targetRole}"`);
      return variations;
      
    } catch (error) {
      console.error('❌ Claude API call failed:', error.message);
      console.log('🔄 Falling back to static role dictionary');
      this.results.fallbackVariations++;
      return this.getFallbackRoleVariations(targetRole);
    }
  }

  /**
   * Build prompt for Claude AI role variation generation
   */
  buildRoleVariationPrompt(targetRole, context) {
    return `Given the target role "${targetRole}" at ${context.companyName} (${context.industry} industry), generate role title variations in a hierarchical structure:

1. PRIMARY variations: Exact equivalents and direct synonyms
2. SECONDARY variations: One level down in organizational hierarchy  
3. TERTIARY variations: Two levels down in organizational hierarchy

For each level, provide 3-5 realistic job titles that would be found in company directories, LinkedIn profiles, or job postings.

Return ONLY a valid JSON object in this exact format:
{
  "primary": ["Title 1", "Title 2", "Title 3"],
  "secondary": ["Title 1", "Title 2", "Title 3"], 
  "tertiary": ["Title 1", "Title 2", "Title 3"]
}

Focus on titles that would actually appear in professional contexts.`;
  }

  /**
   * Parse Claude AI response for role variations
   */
  parseRoleVariations(content) {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const variations = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (!variations.primary || !variations.secondary || !variations.tertiary) {
        throw new Error('Invalid JSON structure');
      }
      
      return {
        primary: variations.primary.filter(title => title && title.trim()),
        secondary: variations.secondary.filter(title => title && title.trim()),
        tertiary: variations.tertiary.filter(title => title && title.trim())
      };
      
    } catch (error) {
      console.error('❌ Failed to parse Claude response:', error.message);
      throw error;
    }
  }

  /**
   * Fallback role variations when AI is unavailable
   */
  getFallbackRoleVariations(targetRole) {
    const roleMap = {
      'CFO': {
        primary: ['CFO', 'Chief Financial Officer', 'VP Finance & Operations'],
        secondary: ['VP Finance', 'Finance Director', 'Financial Controller', 'Head of Finance'],
        tertiary: ['Senior Finance Manager', 'Finance Manager', 'Financial Analyst Manager']
      },
      'CEO': {
        primary: ['CEO', 'Chief Executive Officer', 'President'],
        secondary: ['Co-CEO', 'Founder & CEO', 'Managing Director'],
        tertiary: ['Executive Director', 'General Manager', 'VP Operations']
      },
      'CTO': {
        primary: ['CTO', 'Chief Technology Officer', 'VP Engineering'],
        secondary: ['VP Technology', 'Head of Engineering', 'Director of Technology'],
        tertiary: ['Senior Engineering Manager', 'Engineering Manager', 'Tech Lead']
      },
      'CMO': {
        primary: ['CMO', 'Chief Marketing Officer', 'VP Marketing'],
        secondary: ['VP Marketing', 'Head of Marketing', 'Director of Marketing'],
        tertiary: ['Senior Marketing Manager', 'Marketing Manager', 'Brand Manager']
      }
    };
    
    const normalizedRole = targetRole.toUpperCase();
    if (roleMap[normalizedRole]) {
      return roleMap[normalizedRole];
    }
    
    // Generic fallback
    return {
      primary: [targetRole, `${targetRole} Officer`, `Chief ${targetRole} Officer`],
      secondary: [`VP ${targetRole}`, `${targetRole} Director`, `Head of ${targetRole}`],
      tertiary: [`Senior ${targetRole} Manager`, `${targetRole} Manager`, `${targetRole} Lead`]
    };
  }

  /**
   * Search for role matches using hierarchical approach
   */
  async searchForRoleMatches(company, roleVariations) {
    const companyLinkedInUrl = company.customFields?.linkedinUrl || company.website;
    if (!companyLinkedInUrl) {
      throw new Error('Company LinkedIn URL or website required for role search');
    }

    const allMatches = [];
    
    // Try primary variations first
    console.log('🔍 Searching primary role variations...');
    for (const roleTitle of roleVariations.primary) {
      const matches = await this.searchCoresignalForRole(companyLinkedInUrl, roleTitle, 'primary');
      allMatches.push(...matches);
      
      if (allMatches.length >= this.maxResults) {
        break;
      }
      
      await this.delay(this.delayBetweenRequests);
    }
    
    // Try secondary variations if not enough results
    if (allMatches.length < this.maxResults) {
      console.log('🔍 Searching secondary role variations...');
      for (const roleTitle of roleVariations.secondary) {
        const matches = await this.searchCoresignalForRole(companyLinkedInUrl, roleTitle, 'secondary');
        allMatches.push(...matches);
        
        if (allMatches.length >= this.maxResults) {
          break;
        }
        
        await this.delay(this.delayBetweenRequests);
      }
    }
    
    // Try tertiary variations if still not enough results
    if (allMatches.length < this.maxResults) {
      console.log('🔍 Searching tertiary role variations...');
      for (const roleTitle of roleVariations.tertiary) {
        const matches = await this.searchCoresignalForRole(companyLinkedInUrl, roleTitle, 'tertiary');
        allMatches.push(...matches);
        
        if (allMatches.length >= this.maxResults) {
          break;
        }
        
        await this.delay(this.delayBetweenRequests);
      }
    }
    
    return allMatches.slice(0, this.maxResults);
  }

  /**
   * Search Coresignal API for specific role
   */
  async searchCoresignalForRole(companyLinkedInUrl, roleTitle, matchLevel) {
    try {
      const searchQuery = {
        "query": {
          "bool": {
            "must": [
              {
                "nested": {
                  "path": "experience",
                  "query": {
                    "bool": {
                      "must": [
                        {
                          "match": {
                            "experience.company_linkedin_url": companyLinkedInUrl
                          }
                        },
                        {
                          "term": {
                            "experience.active_experience": 1
                          }
                        },
                        {
                          "match": {
                            "experience.position_title": roleTitle
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=3', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Coresignal search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      this.results.creditsUsed.search += searchData.total_results || 0;

      if (!searchData.results || searchData.results.length === 0) {
        return [];
      }

      // Collect full profiles for found people
      const matches = [];
      for (const person of searchData.results.slice(0, 3)) { // Limit to 3 per role
        try {
          const profileData = await this.collectPersonProfile(person.id);
          if (profileData) {
            const confidence = this.calculateRoleMatchConfidence(profileData, roleTitle, matchLevel);
            matches.push({
              ...profileData,
              matchedRole: roleTitle,
              matchLevel,
              confidence
            });
          }
        } catch (error) {
          console.error(`❌ Failed to collect profile for person ${person.id}:`, error.message);
        }
        
        await this.delay(this.delayBetweenRequests);
      }

      return matches;

    } catch (error) {
      console.error(`❌ Search failed for role "${roleTitle}":`, error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        role: roleTitle,
        matchLevel,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Collect full person profile from Coresignal
   */
  async collectPersonProfile(personId) {
    try {
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${personId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!collectResponse.ok) {
        throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
      }

      const profileData = await collectResponse.json();
      this.results.creditsUsed.collect++;
      
      return profileData;

    } catch (error) {
      console.error(`❌ Failed to collect profile ${personId}:`, error.message);
      throw error;
    }
  }

  /**
   * Calculate confidence score for role match
   */
  calculateRoleMatchConfidence(person, matchedRole, matchLevel) {
    let score = 0;
    const factors = [];
    
    // Base score by match level
    if (matchLevel === 'primary') {
      score += 90;
      factors.push('Primary role match (+90)');
    } else if (matchLevel === 'secondary') {
      score += 75;
      factors.push('Secondary role match (+75)');
    } else if (matchLevel === 'tertiary') {
      score += 60;
      factors.push('Tertiary role match (+60)');
    }
    
    // Bonus factors
    if (person.experience?.some(exp => exp.active_experience === 1)) {
      score += 10;
      factors.push('Active experience (+10)');
    }
    
    if (person.linkedin_url) {
      score += 5;
      factors.push('LinkedIn URL present (+5)');
    }
    
    if (person.primary_professional_email || person.professional_emails_collection?.length > 0) {
      score += 5;
      factors.push('Professional email present (+5)');
    }
    
    // Cap at 100
    score = Math.min(score, 100);
    
    return {
      confidence: score,
      factors,
      reasoning: `Match confidence: ${score}% based on ${factors.join(', ')}`
    };
  }

  /**
   * Process and save role matches
   */
  async processMatches(matches, company) {
    console.log(`📊 Processing ${matches.length} role matches...`);
    
    for (const match of matches) {
      try {
        // Save to database or process as needed
        const processedMatch = {
          personId: match.id,
          name: match.full_name,
          title: match.active_experience_title || match.experience?.[0]?.position_title || 'Unknown',
          company: company.name,
          matchedRole: match.matchedRole,
          matchLevel: match.matchLevel,
          confidence: match.confidence.confidence,
          linkedinUrl: match.linkedin_url,
          email: match.primary_professional_email || match.professional_emails_collection?.[0]?.professional_email,
          processedAt: new Date().toISOString()
        };
        
        this.results.processedRoles.push(processedMatch);
        this.results.successfulMatches++;
        
        console.log(`✅ Found ${match.full_name} - ${match.matchedRole} (${match.confidence.confidence}% confidence)`);
        
      } catch (error) {
        console.error(`❌ Failed to process match:`, error.message);
        this.results.failedMatches++;
      }
    }
  }

  /**
   * Load progress from file
   */
  async loadProgress() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.progressFile)) {
        const progressData = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        this.results = { ...this.results, ...progressData };
        console.log(`📂 Loaded progress: ${this.results.processedRoles.length} roles processed`);
      }
    } catch (error) {
      console.log('📂 No existing progress file found, starting fresh');
    }
  }

  /**
   * Save progress to file
   */
  async saveProgress() {
    try {
      const fs = require('fs');
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

  /**
   * Utility method for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get final results summary
   */
  getResults() {
    return {
      ...this.results,
      endTime: new Date().toISOString(),
      duration: new Date() - new Date(this.results.startTime)
    };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node find_role.js <targetRole> [companyId] [maxResults]');
    console.log('Example: node find_role.js "CFO" "01K7DNYR5VZ7JY36KGKKN76XZ1" 3');
    process.exit(1);
  }
  
  const options = {
    targetRole: args[0],
    companyId: args[1] || null,
    maxResults: parseInt(args[2]) || 1,
    useAI: true
  };
  
  const roleEnrichment = new RoleEnrichment(options);
  
  roleEnrichment.run()
    .then(() => {
      const results = roleEnrichment.getResults();
      console.log('\n📊 Final Results:');
      console.log(`✅ Successful matches: ${results.successfulMatches}`);
      console.log(`❌ Failed matches: ${results.failedMatches}`);
      console.log(`🤖 AI generated variations: ${results.aiGeneratedVariations}`);
      console.log(`🔄 Fallback variations: ${results.fallbackVariations}`);
      console.log(`💳 Credits used: ${results.creditsUsed.search} search, ${results.creditsUsed.collect} collect`);
    })
    .catch(error => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = RoleEnrichment;
