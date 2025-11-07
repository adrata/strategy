/**
 * Buyer Group Analyzer Module
 * 
 * Analyzes buyer group quality using Claude AI
 * Evaluates pain signals, innovation, experience, and structure
 */

const fetch = require('node-fetch');

class BuyerGroupAnalyzer {
  constructor(claudeApiKey) {
    this.claudeApiKey = claudeApiKey;
  }

  /**
   * Analyze buyer group quality with AI
   * @param {object} company - Company data
   * @param {Array} previewEmployees - Sampled employees
   * @param {object} departmentCounts - Department breakdown
   * @param {object} managementLevelCounts - Management level breakdown
   * @returns {object} Buyer group quality analysis
   */
  async analyze(company, previewEmployees, departmentCounts, managementLevelCounts) {
    try {
      const prompt = `Analyze this employee preview data to assess buyer group quality for a Go-To-Buyer Platform:

Company: ${company.company_name} (${company.company_industry})
Employee Sample (${previewEmployees.length} employees from target departments):

${previewEmployees.map(e => `
- ${e.full_name}: ${e.active_experience_title}
  Department: ${e.active_experience_department}
  Management Level: ${e.active_experience_management_level}
  Connections: ${e.connections_count} | Followers: ${e.followers_count}
  Headline: ${e.headline}
`).join('\n')}

Department Breakdown:
${Object.entries(departmentCounts).map(([dept, count]) => `- ${dept}: ${count}`).join('\n')}

Management Level Breakdown:
${Object.entries(managementLevelCounts).map(([level, count]) => `- ${level}: ${count}`).join('\n')}

Score this company's buyer group on:

1. **Pain Signals (0-100)**: Evidence of operational challenges, growth pains, need for solutions
2. **Innovation Score (0-100)**: Forward-thinking, pioneering culture
3. **Buyer Experience Score (0-100)**: Sophisticated, experienced buyers
4. **Buyer Group Structure Score (0-100)**: Ideal composition for enterprise sales
5. **Overall Buyer Group Quality Score (0-100)**: Weighted average

Return ONLY valid JSON:
{
  "pain_signal_score": <0-100>,
  "pain_indicators": ["<indicator 1>", "<indicator 2>"],
  "innovation_score": <0-100>,
  "innovation_indicators": ["<indicator 1>", "<indicator 2>"],
  "buyer_experience_score": <0-100>,
  "experience_indicators": ["<indicator 1>", "<indicator 2>"],
  "buyer_group_structure_score": <0-100>,
  "structure_assessment": "<brief assessment>",
  "overall_buyer_group_quality": <0-100>,
  "key_strengths": ["<strength 1>", "<strength 2>"],
  "recommended_personas": ["VP Sales", "Director Revenue Ops"],
  "outreach_priority": "high|medium|low"
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
        throw new Error('No JSON found');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      if (!analysis.overall_buyer_group_quality) {
        throw new Error('Invalid JSON structure');
      }
      
      return analysis;
      
    } catch (error) {
      console.error(`❌ AI analysis failed:`, error.message);
      throw error;
    }
  }
}

module.exports = { BuyerGroupAnalyzer };

