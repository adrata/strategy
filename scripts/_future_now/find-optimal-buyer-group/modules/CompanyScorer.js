/**
 * Company Scorer Module
 * 
 * Scores companies for buyer readiness using Claude AI
 * Evaluates firmographic fit, growth signals, technology adoption
 */

const fetch = require('node-fetch');

class CompanyScorer {
  constructor(claudeApiKey, qualificationCriteria, scoringWeights) {
    this.claudeApiKey = claudeApiKey;
    this.criteria = qualificationCriteria;
    this.weights = scoringWeights;
  }

  /**
   * Score company for buyer readiness using AI
   * @param {object} company - Company profile data
   * @returns {object} Scoring results
   */
  async score(company) {
    try {
      const prompt = `Analyze this company as a qualified buyer for our Go-To-Buyer Platform:

Company Profile:
- Name: ${company.company_name}
- Industry: ${company.company_industry}
- Size: ${company.company_employees_count} employees (${company.company_size_range})
- Growth Rate: ${company.company_employees_count_change_yearly_percentage}%
- Founded: ${company.company_founded_year}
- Technology Keywords: ${company.company_categories_and_keywords?.join(', ') || 'None'}
- Recent Funding: ${company.company_last_funding_round_date || 'None'}
- Funding Amount: ${company.company_last_funding_round_amount_raised || 'N/A'}
- Revenue: ${company.company_annual_revenue_source_1 || 'Unknown'}
- Location: ${company.company_hq_city}, ${company.company_hq_state}, ${company.company_hq_country}

Buyer Qualification Criteria:
${JSON.stringify(this.criteria, null, 2)}

Score this company (0-100) in these categories:

1. **Firmographic Fit**: How well do they match our qualification criteria?
2. **Growth Signals**: Are they growing, well-funded, and expanding?
3. **Technology Adoption**: Do they embrace new technology and innovation?
4. **Adoption Maturity**: What's their buyer maturity profile?

Return ONLY valid JSON:
{
  "firmographic_fit_score": <number 0-100>,
  "growth_signals_score": <number 0-100>,
  "technology_adoption_score": <number 0-100>,
  "adoption_maturity_score": <number 0-100>,
  "buyer_readiness_score": <number 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "adoption_maturity_profile": "trailblazer|early_adopter|pragmatist|conservative|traditionalist",
  "key_strengths": ["<strength 1>", "<strength 2>"],
  "buyer_readiness_indicators": ["<indicator 1>", "<indicator 2>"]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1500,
          temperature: 0.3,
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
        throw new Error('No JSON found in Claude response');
      }
      
      const scores = JSON.parse(jsonMatch[0]);
      
      return {
        firmographicFitScore: scores.firmographic_fit_score,
        growthSignalsScore: scores.growth_signals_score,
        technologyAdoptionScore: scores.technology_adoption_score,
        adoptionMaturityScore: scores.adoption_maturity_score,
        buyerReadinessScore: scores.buyer_readiness_score,
        reasoning: scores.reasoning,
        adoptionMaturityProfile: scores.adoption_maturity_profile,
        keyStrengths: scores.key_strengths || [],
        buyerReadinessIndicators: scores.buyer_readiness_indicators || []
      };
      
    } catch (error) {
      console.error(`❌ AI scoring failed:`, error.message);
      throw error;
    }
  }
}

module.exports = { CompanyScorer };

