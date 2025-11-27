/**
 * 🎯 CONTENT QUALITY EVALUATOR
 * 
 * Automated evaluation of AI-generated content quality.
 * Scores emails, LinkedIn messages, texts, and advice based on multiple criteria.
 */

export interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    clarity: number;      // How clear and easy to understand
    personalization: number; // How personalized to the recipient
    professionalism: number; // Appropriate tone and language
    actionability: number;   // Clear next steps / call to action
    brevity: number;         // Appropriate length, not too wordy
    relevance: number;       // On-topic and relevant to context
  };
  suggestions: string[];
  contentType: 'email' | 'linkedin' | 'text' | 'advice' | 'general';
}

export interface EvaluationContext {
  recipientName?: string;
  recipientCompany?: string;
  recipientTitle?: string;
  senderName?: string;
  senderCompany?: string;
  purpose?: string; // e.g., "cold outreach", "follow-up", "introduction"
  industry?: string;
}

// Scoring weights by content type
const WEIGHTS: Record<string, Record<string, number>> = {
  email: {
    clarity: 0.20,
    personalization: 0.25,
    professionalism: 0.20,
    actionability: 0.15,
    brevity: 0.10,
    relevance: 0.10
  },
  linkedin: {
    clarity: 0.15,
    personalization: 0.30,
    professionalism: 0.15,
    actionability: 0.15,
    brevity: 0.15,
    relevance: 0.10
  },
  text: {
    clarity: 0.25,
    personalization: 0.15,
    professionalism: 0.10,
    actionability: 0.20,
    brevity: 0.20,
    relevance: 0.10
  },
  advice: {
    clarity: 0.25,
    personalization: 0.10,
    professionalism: 0.15,
    actionability: 0.25,
    brevity: 0.10,
    relevance: 0.15
  },
  general: {
    clarity: 0.20,
    personalization: 0.15,
    professionalism: 0.15,
    actionability: 0.15,
    brevity: 0.15,
    relevance: 0.20
  }
};

/**
 * Evaluate content quality using rule-based heuristics
 * Fast evaluation without LLM calls
 */
export function evaluateContentFast(
  content: string,
  contentType: 'email' | 'linkedin' | 'text' | 'advice' | 'general',
  context?: EvaluationContext
): QualityScore {
  const breakdown = {
    clarity: evaluateClarity(content),
    personalization: evaluatePersonalization(content, context),
    professionalism: evaluateProfessionalism(content, contentType),
    actionability: evaluateActionability(content),
    brevity: evaluateBrevity(content, contentType),
    relevance: evaluateRelevance(content, context)
  };

  const weights = WEIGHTS[contentType];
  const overall = Math.round(
    breakdown.clarity * weights.clarity +
    breakdown.personalization * weights.personalization +
    breakdown.professionalism * weights.professionalism +
    breakdown.actionability * weights.actionability +
    breakdown.brevity * weights.brevity +
    breakdown.relevance * weights.relevance
  );

  const suggestions = generateSuggestions(breakdown, contentType, content, context);

  return {
    overall,
    breakdown,
    suggestions,
    contentType
  };
}

/**
 * Evaluate clarity - sentence structure, readability
 */
function evaluateClarity(content: string): number {
  let score = 100;
  
  // Check for very long sentences (over 30 words)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 30);
  score -= longSentences.length * 10;
  
  // Check for passive voice indicators
  const passiveIndicators = ['was ', 'were ', 'been ', 'being ', 'is being', 'are being'];
  const passiveCount = passiveIndicators.reduce((count, indicator) => 
    count + (content.toLowerCase().match(new RegExp(indicator, 'g')) || []).length, 0
  );
  score -= passiveCount * 5;
  
  // Check for jargon overload
  const jargonWords = ['synergy', 'leverage', 'paradigm', 'holistic', 'proactive', 'bandwidth', 'circle back'];
  const jargonCount = jargonWords.reduce((count, word) => 
    count + (content.toLowerCase().match(new RegExp(word, 'gi')) || []).length, 0
  );
  score -= jargonCount * 8;
  
  // Bonus for short paragraphs (easier to read)
  const paragraphs = content.split(/\n\n+/);
  if (paragraphs.length > 1 && paragraphs.every(p => p.split(/\s+/).length < 100)) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate personalization - use of names, company, specific details
 */
function evaluatePersonalization(content: string, context?: EvaluationContext): number {
  let score = 50; // Start at neutral
  
  if (!context) return score;
  
  const lowerContent = content.toLowerCase();
  
  // Check for recipient name
  if (context.recipientName) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    if (lowerContent.includes(firstName)) {
      score += 20;
    }
  }
  
  // Check for company name
  if (context.recipientCompany) {
    if (lowerContent.includes(context.recipientCompany.toLowerCase())) {
      score += 15;
    }
  }
  
  // Check for title/role reference
  if (context.recipientTitle) {
    const titleWords = context.recipientTitle.toLowerCase().split(' ');
    if (titleWords.some(word => lowerContent.includes(word) && word.length > 3)) {
      score += 10;
    }
  }
  
  // Check for industry-specific language
  if (context.industry) {
    if (lowerContent.includes(context.industry.toLowerCase())) {
      score += 10;
    }
  }
  
  // Penalize generic openings
  const genericOpenings = ['dear sir', 'to whom it may concern', 'dear hiring manager', 'dear team'];
  if (genericOpenings.some(opening => lowerContent.startsWith(opening))) {
    score -= 30;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate professionalism - tone, language appropriateness
 */
function evaluateProfessionalism(content: string, contentType: string): number {
  let score = 100;
  const lowerContent = content.toLowerCase();
  
  // Check for unprofessional language
  const unprofessionalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'ya', 'yep', 'nope', 'lol', 'omg'];
  const unprofessionalCount = unprofessionalWords.reduce((count, word) => 
    count + (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  
  // LinkedIn and text can be slightly more casual
  const penalty = contentType === 'linkedin' || contentType === 'text' ? 5 : 10;
  score -= unprofessionalCount * penalty;
  
  // Check for excessive exclamation marks
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    score -= (exclamationCount - 2) * 5;
  }
  
  // Check for ALL CAPS (excluding acronyms)
  const capsWords = content.match(/\b[A-Z]{4,}\b/g) || [];
  const nonAcronymCaps = capsWords.filter(w => !['ASAP', 'CEO', 'CFO', 'CTO', 'COO', 'VP', 'ROI', 'KPI'].includes(w));
  score -= nonAcronymCaps.length * 10;
  
  // Check for proper greeting
  const hasGreeting = /^(hi|hello|hey|dear|good morning|good afternoon)/i.test(content.trim());
  if (hasGreeting) {
    score += 5;
  }
  
  // Check for proper sign-off
  const hasSignoff = /(best|regards|thanks|thank you|sincerely|cheers)[\s,!]*([\w\s]*)?$/i.test(content.trim());
  if (hasSignoff && contentType !== 'text') {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate actionability - clear next steps, call to action
 */
function evaluateActionability(content: string): number {
  let score = 50; // Neutral start
  const lowerContent = content.toLowerCase();
  
  // Check for action words
  const actionPhrases = [
    'let me know', 'would you be', 'can we', 'could we', 'schedule', 'call',
    'meet', 'discuss', 'review', 'check out', 'take a look', 'click here',
    'reply', 'respond', 'get back to', 'follow up', 'next step', 'action item'
  ];
  
  const actionCount = actionPhrases.reduce((count, phrase) => 
    count + (lowerContent.includes(phrase) ? 1 : 0), 0
  );
  
  score += Math.min(actionCount * 15, 40);
  
  // Check for question marks (engagement)
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount >= 1 && questionCount <= 3) {
    score += 10;
  }
  
  // Check for specific time references
  const timeReferences = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 
    'this week', 'next week', 'tomorrow', 'today', 'morning', 'afternoon'];
  if (timeReferences.some(ref => lowerContent.includes(ref))) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate brevity - appropriate length for content type
 */
function evaluateBrevity(content: string, contentType: string): number {
  const wordCount = content.split(/\s+/).length;
  
  // Ideal word counts by type
  const idealRanges: Record<string, { min: number; max: number; ideal: number }> = {
    email: { min: 50, max: 200, ideal: 100 },
    linkedin: { min: 30, max: 150, ideal: 75 },
    text: { min: 10, max: 50, ideal: 25 },
    advice: { min: 50, max: 300, ideal: 150 },
    general: { min: 30, max: 250, ideal: 100 }
  };
  
  const range = idealRanges[contentType];
  
  if (wordCount >= range.min && wordCount <= range.max) {
    // Within acceptable range
    const distanceFromIdeal = Math.abs(wordCount - range.ideal);
    const maxDistance = Math.max(range.ideal - range.min, range.max - range.ideal);
    return Math.round(100 - (distanceFromIdeal / maxDistance) * 30);
  } else if (wordCount < range.min) {
    // Too short
    return Math.max(30, 70 - (range.min - wordCount) * 2);
  } else {
    // Too long
    return Math.max(20, 70 - (wordCount - range.max) * 0.5);
  }
}

/**
 * Evaluate relevance - alignment with stated purpose/context
 */
function evaluateRelevance(content: string, context?: EvaluationContext): number {
  if (!context?.purpose) return 70; // Neutral without context
  
  let score = 70;
  const lowerContent = content.toLowerCase();
  const purpose = context.purpose.toLowerCase();
  
  // Check for purpose-aligned language
  const purposeKeywords: Record<string, string[]> = {
    'cold outreach': ['introduction', 'reaching out', 'connect', 'noticed', 'impressed', 'interested'],
    'follow-up': ['following up', 'checking in', 'last', 'previous', 'mentioned', 'discussed'],
    'introduction': ['introduce', 'meet', 'connect', 'mutual', 'recommended', 'referred'],
    'meeting request': ['schedule', 'meet', 'call', 'time', 'available', 'calendar'],
    'thank you': ['thank', 'appreciate', 'grateful', 'enjoyed', 'pleasure'],
    'proposal': ['proposal', 'solution', 'recommend', 'suggest', 'option', 'approach']
  };
  
  const keywords = purposeKeywords[purpose] || [];
  const matchCount = keywords.reduce((count, keyword) => 
    count + (lowerContent.includes(keyword) ? 1 : 0), 0
  );
  
  score += Math.min(matchCount * 10, 30);
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate improvement suggestions based on scores
 */
function generateSuggestions(
  breakdown: QualityScore['breakdown'],
  contentType: string,
  content: string,
  context?: EvaluationContext
): string[] {
  const suggestions: string[] = [];
  
  if (breakdown.clarity < 70) {
    suggestions.push('Simplify sentence structure and reduce jargon for better clarity');
  }
  
  if (breakdown.personalization < 60 && context?.recipientName) {
    suggestions.push(`Consider using ${context.recipientName.split(' ')[0]}'s name more naturally`);
  }
  
  if (breakdown.personalization < 60 && context?.recipientCompany) {
    suggestions.push(`Reference ${context.recipientCompany} or their specific challenges`);
  }
  
  if (breakdown.professionalism < 70) {
    suggestions.push('Review tone - ensure it matches the professional context');
  }
  
  if (breakdown.actionability < 60) {
    suggestions.push('Add a clear call-to-action or next step');
  }
  
  if (breakdown.brevity < 60) {
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 200) {
      suggestions.push('Consider shortening the message for better engagement');
    } else if (wordCount < 30) {
      suggestions.push('Add more context or value to the message');
    }
  }
  
  // Content-type specific suggestions
  if (contentType === 'linkedin' && !content.includes('?')) {
    suggestions.push('Consider adding a question to encourage engagement');
  }
  
  if (contentType === 'email' && !/subject:/i.test(content) && breakdown.overall > 70) {
    suggestions.push('Good content! Consider crafting a compelling subject line');
  }
  
  return suggestions.slice(0, 3); // Max 3 suggestions
}

/**
 * Get quality rating label from score
 */
export function getQualityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Get quality color for UI display
 */
export function getQualityColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

/**
 * Format score breakdown for display
 */
export function formatScoreBreakdown(score: QualityScore): string {
  const { breakdown } = score;
  return `
Quality Score: ${score.overall}/100 (${getQualityLabel(score.overall)})

Breakdown:
- Clarity: ${breakdown.clarity}/100
- Personalization: ${breakdown.personalization}/100
- Professionalism: ${breakdown.professionalism}/100
- Actionability: ${breakdown.actionability}/100
- Brevity: ${breakdown.brevity}/100
- Relevance: ${breakdown.relevance}/100

${score.suggestions.length > 0 ? `Suggestions:\n${score.suggestions.map(s => `• ${s}`).join('\n')}` : 'No suggestions - great job!'}
`.trim();
}

