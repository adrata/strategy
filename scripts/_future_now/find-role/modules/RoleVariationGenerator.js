/**
 * Role Variation Generator Module
 * 
 * Generates role title variations using Claude AI
 * Falls back to static dictionary when AI unavailable
 */

const fetch = require('node-fetch');

class RoleVariationGenerator {
  constructor(claudeApiKey, useAI = true) {
    this.claudeApiKey = claudeApiKey;
    this.useAI = useAI && !!claudeApiKey;
  }

  /**
   * Generate role variations hierarchically
   * @param {string} targetRole - Target role to find
   * @param {object} context - Company context for AI
   * @returns {object} Hierarchical role variations
   */
  async generateVariations(targetRole, context) {
    if (this.useAI) {
      try {
        return await this.generateWithAI(targetRole, context);
      } catch (error) {
        console.error('❌ AI generation failed:', error.message);
        console.log('🔄 Falling back to static dictionary');
      }
    }
    
    return this.getFallbackVariations(targetRole);
  }

  async generateWithAI(targetRole, context) {
    const prompt = `Given the target role "${targetRole}" at ${context.companyName} (${context.industry} industry), generate role title variations in a hierarchical structure:

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
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const variations = JSON.parse(jsonMatch[0]);
    
    if (!variations.primary || !variations.secondary || !variations.tertiary) {
      throw new Error('Invalid JSON structure');
    }
    
    console.log(`🤖 AI generated variations for "${targetRole}"`);
    return {
      primary: variations.primary.filter(title => title && title.trim()),
      secondary: variations.secondary.filter(title => title && title.trim()),
      tertiary: variations.tertiary.filter(title => title && title.trim())
    };
  }

  getFallbackVariations(targetRole) {
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
}

module.exports = { RoleVariationGenerator };

