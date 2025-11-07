/**
 * Enhanced Intelligence Research Module
 * 
 * Uses multiple AI sources (Claude, OpenRouter, Perplexity) to research companies
 * when Coresignal fails. This is the "best system in the world" approach.
 */

class EnhancedIntelligenceResearch {
  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
  }

  /**
   * Research company using all available AI sources
   * Tries multiple sources in order of reliability
   */
  async researchCompany(companyName, website, linkedinUrl, industry, employeeCount) {
    console.log(`\n🧠 Enhanced Intelligence Research for: ${companyName}`);
    console.log(`   Website: ${website || 'N/A'}`);
    console.log(`   LinkedIn: ${linkedinUrl || 'N/A'}`);
    console.log(`   Industry: ${industry || 'N/A'}`);
    console.log(`   Employees: ${employeeCount || 'N/A'}`);

    const results = {
      companyName,
      website,
      linkedinUrl,
      executives: [],
      sources: [],
      errors: []
    };

    // Strategy 1: Perplexity (best for real-time web research)
    if (this.perplexityApiKey) {
      try {
        console.log('\n🔍 Strategy 1: Perplexity AI (Real-time Web Research)');
        const perplexityResult = await this.researchWithPerplexity(companyName, website, linkedinUrl, industry);
        if (perplexityResult && perplexityResult.executives && perplexityResult.executives.length > 0) {
          results.executives = [...results.executives, ...perplexityResult.executives];
          results.sources.push('perplexity');
          console.log(`   ✅ Found ${perplexityResult.executives.length} executives via Perplexity`);
        }
      } catch (error) {
        console.log(`   ⚠️  Perplexity error: ${error.message}`);
        results.errors.push({ source: 'perplexity', error: error.message });
      }
    }

    // Strategy 2: Claude (best for structured analysis)
    if (this.anthropicApiKey && results.executives.length < 5) {
      try {
        console.log('\n🤖 Strategy 2: Claude AI (Structured Analysis)');
        const claudeResult = await this.researchWithClaude(companyName, website, linkedinUrl, industry, employeeCount);
        if (claudeResult && claudeResult.executives && claudeResult.executives.length > 0) {
          // Merge with existing, avoiding duplicates
          const newExecutives = claudeResult.executives.filter(e => 
            !results.executives.some(ex => 
              ex.name?.toLowerCase() === e.name?.toLowerCase() ||
              ex.linkedinUrl === e.linkedinUrl
            )
          );
          results.executives = [...results.executives, ...newExecutives];
          results.sources.push('claude');
          console.log(`   ✅ Found ${newExecutives.length} additional executives via Claude`);
        }
      } catch (error) {
        console.log(`   ⚠️  Claude error: ${error.message}`);
        results.errors.push({ source: 'claude', error: error.message });
      }
    }

    // Strategy 3: OpenRouter (best for model diversity)
    if (this.openRouterApiKey && results.executives.length < 5) {
      try {
        console.log('\n🌐 Strategy 3: OpenRouter (Model Diversity)');
        const openRouterResult = await this.researchWithOpenRouter(companyName, website, linkedinUrl, industry);
        if (openRouterResult && openRouterResult.executives && openRouterResult.executives.length > 0) {
          // Merge with existing, avoiding duplicates
          const newExecutives = openRouterResult.executives.filter(e => 
            !results.executives.some(ex => 
              ex.name?.toLowerCase() === e.name?.toLowerCase() ||
              ex.linkedinUrl === e.linkedinUrl
            )
          );
          results.executives = [...results.executives, ...newExecutives];
          results.sources.push('openrouter');
          console.log(`   ✅ Found ${newExecutives.length} additional executives via OpenRouter`);
        }
      } catch (error) {
        console.log(`   ⚠️  OpenRouter error: ${error.message}`);
        results.errors.push({ source: 'openrouter', error: error.message });
      }
    }

    // Remove duplicates and format
    results.executives = this.deduplicateExecutives(results.executives);
    
    console.log(`\n📊 Research Summary:`);
    console.log(`   Total executives found: ${results.executives.length}`);
    console.log(`   Sources used: ${results.sources.join(', ') || 'none'}`);
    console.log(`   Errors: ${results.errors.length}`);

    return results;
  }

  /**
   * Research with Perplexity AI (real-time web search)
   */
  async researchWithPerplexity(companyName, website, linkedinUrl, industry) {
    const query = `Find the current senior executives and decision makers at "${companyName}"${website ? ` (${website})` : ''}${linkedinUrl ? ` LinkedIn: ${linkedinUrl}` : ''}${industry ? ` in the ${industry} industry` : ''}.

Provide their:
- Full names
- Current job titles
- LinkedIn profile URLs (if available)
- Email addresses (if publicly available)

Focus on:
- CEO, President, Founder
- CTO, VP Engineering, Chief Technology Officer
- CFO, VP Finance
- COO, VP Operations
- VP Sales, VP Marketing
- Other C-level executives

Format as JSON array with fields: name, title, linkedinUrl, email.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional business intelligence researcher. Provide accurate, structured data in JSON format. Only include verified, current information.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const executives = JSON.parse(jsonMatch[0]);
      return {
        executives: executives.map(e => ({
          name: e.name,
          title: e.title,
          linkedinUrl: e.linkedinUrl,
          email: e.email,
          source: 'perplexity'
        }))
      };
    }

    // Try to extract structured data from text
    return this.parseTextResponse(content, companyName);
  }

  /**
   * Research with Claude AI (structured analysis)
   */
  async researchWithClaude(companyName, website, linkedinUrl, industry, employeeCount) {
    const prompt = `Research the company "${companyName}"${website ? ` (${website})` : ''}${linkedinUrl ? ` LinkedIn: ${linkedinUrl}` : ''}${industry ? ` in the ${industry} industry` : ''}${employeeCount ? ` with approximately ${employeeCount} employees` : ''}.

Find the current senior executives and decision makers who would be involved in purchasing decisions for software/services.

Return a JSON array with the following structure:
[
  {
    "name": "Full Name",
    "title": "Current Job Title",
    "linkedinUrl": "LinkedIn profile URL if available",
    "email": "Email if publicly available"
  }
]

Focus on finding:
- CEO, President, Founder
- CTO, VP Engineering, Chief Technology Officer  
- CFO, VP Finance
- COO, VP Operations
- VP Sales, VP Marketing
- Other C-level executives

Only include verified, current information. Return only valid JSON.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const executives = JSON.parse(jsonMatch[0]);
      return {
        executives: executives.map(e => ({
          name: e.name,
          title: e.title,
          linkedinUrl: e.linkedinUrl,
          email: e.email,
          source: 'claude'
        }))
      };
    }

    return this.parseTextResponse(content, companyName);
  }

  /**
   * Research with OpenRouter (model diversity)
   */
  async researchWithOpenRouter(companyName, website, linkedinUrl, industry) {
    const prompt = `Find the current senior executives at "${companyName}"${website ? ` (${website})` : ''}${linkedinUrl ? ` LinkedIn: ${linkedinUrl}` : ''}${industry ? ` in the ${industry} industry` : ''}.

Return a JSON array with: name, title, linkedinUrl, email.

Focus on: CEO, CTO, CFO, COO, VP Engineering, VP Sales, and other C-level executives.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/adrata',
        'X-Title': 'Adrata Buyer Group Discovery'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const executives = JSON.parse(jsonMatch[0]);
      return {
        executives: executives.map(e => ({
          name: e.name,
          title: e.title,
          linkedinUrl: e.linkedinUrl,
          email: e.email,
          source: 'openrouter'
        }))
      };
    }

    return this.parseTextResponse(content, companyName);
  }

  /**
   * Parse text response and extract executive information
   */
  parseTextResponse(content, companyName) {
    const executives = [];
    
    // Try to find name-title patterns
    const patterns = [
      /(?:^|\n)\s*[-•]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-–—]\s*([^,\n]+)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+),\s*([^,\n]+)/g,
      /(?:CEO|CTO|CFO|COO|VP|President|Founder)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim();
        const title = match[2]?.trim() || match[1]?.trim();
        if (name && name.length > 3 && !executives.some(e => e.name === name)) {
          executives.push({
            name,
            title: title || 'Executive',
            source: 'parsed'
          });
        }
      }
    }

    return { executives };
  }

  /**
   * Remove duplicate executives
   */
  deduplicateExecutives(executives) {
    const seen = new Set();
    return executives.filter(e => {
      const key = `${e.name?.toLowerCase()}_${e.linkedinUrl || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

module.exports = { EnhancedIntelligenceResearch };

