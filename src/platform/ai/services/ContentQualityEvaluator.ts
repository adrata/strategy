/**
 * 🎯 CONTENT QUALITY EVALUATOR
 * 
 * Research-backed evaluation of AI-generated content quality.
 * Optimized for highest conversion rates based on industry data.
 * 
 * KEY RESEARCH INSIGHTS:
 * - Personalized emails get 29% higher open rates and 41% higher click rates
 * - Emails with 50-125 words have 50%+ response rates
 * - Subject lines under 50 characters have 12% higher open rates
 * - Following up 5+ times increases response rates by 25%
 * - Tuesday-Thursday sends outperform Monday/Friday by 20%
 * - LinkedIn messages under 100 words have 50% higher response rates
 */

export interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    clarity: number;           // Clear, easy to understand
    personalization: number;   // Tailored to recipient
    professionalism: number;   // Appropriate tone
    actionability: number;     // Clear CTA
    brevity: number;           // Optimal length
    relevance: number;         // On-topic
    hookStrength: number;      // Opening line impact
    valueProposition: number;  // Clear benefit to recipient
    urgencyBalance: number;    // Creates urgency without pressure
  };
  suggestions: string[];
  contentType: 'email' | 'linkedin' | 'text' | 'advice' | 'general';
  conversionPotential: 'high' | 'medium' | 'low';
  stage: 'cold' | 'warm' | 'follow-up' | 'closing';
}

export interface EvaluationContext {
  recipientName?: string;
  recipientCompany?: string;
  recipientTitle?: string;
  senderName?: string;
  senderCompany?: string;
  purpose?: string;
  industry?: string;
  // NEW: Stage and conversation context
  stage?: 'cold' | 'warm' | 'follow-up' | 'closing';
  priorMessages?: string[];        // Previous messages in the thread
  priorResponseRate?: number;      // 0-100, how engaged is recipient
  touchpointNumber?: number;       // 1st, 2nd, 3rd outreach
  lastInteraction?: string;        // "opened email", "clicked link", "replied", "no response"
  recipientPainPoints?: string[];  // Known challenges
  recentNews?: string;             // Recent company news to reference
}

// Research-backed weights optimized for conversion
const WEIGHTS: Record<string, Record<string, number>> = {
  email: {
    clarity: 0.10,
    personalization: 0.20,      // High impact on open/response rates
    professionalism: 0.10,
    actionability: 0.15,
    brevity: 0.10,
    relevance: 0.10,
    hookStrength: 0.10,         // First line determines if they read more
    valueProposition: 0.10,     // Why should they care?
    urgencyBalance: 0.05
  },
  linkedin: {
    clarity: 0.10,
    personalization: 0.25,      // Critical for LinkedIn acceptance
    professionalism: 0.10,
    actionability: 0.10,
    brevity: 0.15,              // LinkedIn messages must be SHORT
    relevance: 0.10,
    hookStrength: 0.10,
    valueProposition: 0.05,
    urgencyBalance: 0.05
  },
  text: {
    clarity: 0.20,
    personalization: 0.10,
    professionalism: 0.05,
    actionability: 0.20,
    brevity: 0.25,              // Texts must be very short
    relevance: 0.10,
    hookStrength: 0.05,
    valueProposition: 0.05,
    urgencyBalance: 0.00
  },
  advice: {
    clarity: 0.20,
    personalization: 0.10,
    professionalism: 0.10,
    actionability: 0.25,        // Advice must be actionable
    brevity: 0.05,
    relevance: 0.15,
    hookStrength: 0.05,
    valueProposition: 0.05,
    urgencyBalance: 0.05
  },
  general: {
    clarity: 0.15,
    personalization: 0.15,
    professionalism: 0.10,
    actionability: 0.15,
    brevity: 0.10,
    relevance: 0.15,
    hookStrength: 0.10,
    valueProposition: 0.05,
    urgencyBalance: 0.05
  }
};

// Stage-specific adjustments
const STAGE_MULTIPLIERS: Record<string, Record<string, number>> = {
  cold: {
    hookStrength: 1.5,          // Critical for cold outreach
    personalization: 1.3,
    valueProposition: 1.2
  },
  warm: {
    relevance: 1.3,             // Reference prior interaction
    actionability: 1.2
  },
  'follow-up': {
    brevity: 1.3,               // Follow-ups should be shorter
    urgencyBalance: 1.2,
    actionability: 1.2
  },
  closing: {
    actionability: 1.5,         // Clear next steps critical
    urgencyBalance: 1.3
  }
};

/**
 * Research-backed content evaluation
 */
export function evaluateContentFast(
  content: string,
  contentType: 'email' | 'linkedin' | 'text' | 'advice' | 'general',
  context?: EvaluationContext
): QualityScore {
  const stage = context?.stage || detectStage(content, context);
  
  const breakdown = {
    clarity: evaluateClarity(content),
    personalization: evaluatePersonalization(content, context),
    professionalism: evaluateProfessionalism(content, contentType),
    actionability: evaluateActionability(content, stage),
    brevity: evaluateBrevity(content, contentType),
    relevance: evaluateRelevance(content, context),
    hookStrength: evaluateHookStrength(content, contentType),
    valueProposition: evaluateValueProposition(content, context),
    urgencyBalance: evaluateUrgencyBalance(content, stage)
  };

  // Apply stage-specific multipliers
  const stageMultipliers = STAGE_MULTIPLIERS[stage] || {};
  Object.keys(stageMultipliers).forEach(key => {
    if (breakdown[key as keyof typeof breakdown] !== undefined) {
      breakdown[key as keyof typeof breakdown] = Math.min(100, 
        breakdown[key as keyof typeof breakdown] * stageMultipliers[key]
      );
    }
  });

  const weights = WEIGHTS[contentType];
  const overall = Math.round(
    breakdown.clarity * weights.clarity +
    breakdown.personalization * weights.personalization +
    breakdown.professionalism * weights.professionalism +
    breakdown.actionability * weights.actionability +
    breakdown.brevity * weights.brevity +
    breakdown.relevance * weights.relevance +
    breakdown.hookStrength * weights.hookStrength +
    breakdown.valueProposition * weights.valueProposition +
    breakdown.urgencyBalance * weights.urgencyBalance
  );

  const suggestions = generateSuggestions(breakdown, contentType, content, context, stage);
  const conversionPotential = overall >= 85 ? 'high' : overall >= 70 ? 'medium' : 'low';

  return {
    overall,
    breakdown,
    suggestions,
    contentType,
    conversionPotential,
    stage
  };
}

/**
 * Detect the stage based on content and context
 */
function detectStage(content: string, context?: EvaluationContext): 'cold' | 'warm' | 'follow-up' | 'closing' {
  if (context?.stage) return context.stage;
  
  const lowerContent = content.toLowerCase();
  
  // Follow-up indicators
  if (lowerContent.includes('following up') || 
      lowerContent.includes('checking in') ||
      lowerContent.includes('last email') ||
      lowerContent.includes('previous message') ||
      lowerContent.includes('circling back')) {
    return 'follow-up';
  }
  
  // Closing indicators
  if (lowerContent.includes('final') ||
      lowerContent.includes('last chance') ||
      lowerContent.includes('before we close') ||
      lowerContent.includes('ready to move forward')) {
    return 'closing';
  }
  
  // Warm indicators (reference to prior interaction)
  if (lowerContent.includes('great speaking') ||
      lowerContent.includes('enjoyed our') ||
      lowerContent.includes('as we discussed') ||
      lowerContent.includes('per our conversation')) {
    return 'warm';
  }
  
  return 'cold';
}

/**
 * Evaluate clarity - sentence structure, readability
 */
function evaluateClarity(content: string): number {
  let score = 100;
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25);
  score -= longSentences.length * 8;
  
  // Jargon detection (research shows jargon reduces response rates by 10-15%)
  const jargonWords = [
    'synergy', 'leverage', 'paradigm', 'holistic', 'proactive', 'bandwidth',
    'circle back', 'touch base', 'low-hanging fruit', 'move the needle',
    'deep dive', 'thought leader', 'best-in-class', 'disruptive'
  ];
  const jargonCount = jargonWords.reduce((count, word) => 
    count + (content.toLowerCase().match(new RegExp(word, 'gi')) || []).length, 0
  );
  score -= jargonCount * 10;
  
  // Bonus for short paragraphs
  const paragraphs = content.split(/\n\n+/);
  if (paragraphs.length > 1 && paragraphs.every(p => p.split(/\s+/).length < 50)) {
    score += 5;
  }
  
  // Check readability (simple sentences score higher)
  const avgWordsPerSentence = content.split(/\s+/).length / Math.max(sentences.length, 1);
  if (avgWordsPerSentence <= 15) score += 5;
  else if (avgWordsPerSentence > 25) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate personalization - research shows 29% higher open rates
 */
function evaluatePersonalization(content: string, context?: EvaluationContext): number {
  let score = 40; // Start lower - personalization must be earned
  
  if (!context) return score;
  
  const lowerContent = content.toLowerCase();
  
  // First name usage (+20) - most impactful personalization
  if (context.recipientName) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    if (lowerContent.includes(firstName)) {
      score += 20;
      // Extra points for using name naturally (not just in greeting)
      const nameOccurrences = (lowerContent.match(new RegExp(firstName, 'g')) || []).length;
      if (nameOccurrences >= 2) score += 5;
    }
  }
  
  // Company name reference (+15)
  if (context.recipientCompany) {
    if (lowerContent.includes(context.recipientCompany.toLowerCase())) {
      score += 15;
    }
  }
  
  // Title/role reference (+10)
  if (context.recipientTitle) {
    const titleWords = context.recipientTitle.toLowerCase().split(' ');
    if (titleWords.some(word => lowerContent.includes(word) && word.length > 3)) {
      score += 10;
    }
  }
  
  // Recent news/event reference (+15) - shows research effort
  if (context.recentNews && lowerContent.includes(context.recentNews.toLowerCase().substring(0, 20))) {
    score += 15;
  }
  
  // Pain point reference (+10)
  if (context.recipientPainPoints?.some(pain => lowerContent.includes(pain.toLowerCase()))) {
    score += 10;
  }
  
  // Industry reference (+5)
  if (context.industry && lowerContent.includes(context.industry.toLowerCase())) {
    score += 5;
  }
  
  // Penalize generic openings heavily
  const genericOpenings = [
    'dear sir', 'to whom it may concern', 'dear hiring manager',
    'i hope this email finds you well', 'i hope you are doing well',
    'i am writing to', 'i wanted to reach out'
  ];
  if (genericOpenings.some(opening => lowerContent.includes(opening))) {
    score -= 25;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate professionalism
 */
function evaluateProfessionalism(content: string, contentType: string): number {
  let score = 100;
  const lowerContent = content.toLowerCase();
  
  const unprofessionalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'ya', 'yep', 'nope', 'lol', 'omg', 'tbh', 'btw'];
  const unprofessionalCount = unprofessionalWords.reduce((count, word) => 
    count + (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  
  const penalty = contentType === 'text' ? 3 : 8;
  score -= unprofessionalCount * penalty;
  
  // Excessive exclamation marks (more than 1 looks unprofessional)
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    score -= (exclamationCount - 1) * 8;
  }
  
  // ALL CAPS detection
  const capsWords = content.match(/\b[A-Z]{4,}\b/g) || [];
  const acceptableAcronyms = ['ASAP', 'CEO', 'CFO', 'CTO', 'COO', 'VP', 'ROI', 'KPI', 'SaaS', 'API', 'CRM', 'AI', 'ML'];
  const badCaps = capsWords.filter(w => !acceptableAcronyms.includes(w));
  score -= badCaps.length * 10;
  
  // Check for greeting
  const hasGreeting = /^(hi|hello|hey|dear|good morning|good afternoon|good evening)/i.test(content.trim());
  if (hasGreeting) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate actionability - stage-aware CTA evaluation
 */
function evaluateActionability(content: string, stage: string): number {
  let score = 40;
  const lowerContent = content.toLowerCase();
  
  // Strong CTAs by stage
  const strongCTAs: Record<string, string[]> = {
    cold: ['would you be open to', 'can i send you', 'worth a conversation', 'quick call'],
    warm: ['shall we schedule', 'how about we', 'ready to', 'let\'s set up'],
    'follow-up': ['still interested', 'would next week work', 'any thoughts', 'quick update'],
    closing: ['ready to move forward', 'shall i send over', 'next steps would be', 'let\'s finalize']
  };
  
  const stageCTAs = strongCTAs[stage] || strongCTAs.cold;
  const ctaMatches = stageCTAs.filter(cta => lowerContent.includes(cta)).length;
  score += ctaMatches * 20;
  
  // Questions encourage response
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount === 1) score += 15;  // One clear question is best
  else if (questionCount === 2) score += 10;
  else if (questionCount > 2) score += 5;  // Too many questions = overwhelming
  
  // Specific time references increase conversion
  const timeRefs = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'this week', 'next week', 'tomorrow', '15 minutes', '15-minute', 'quick call'];
  const hasTimeRef = timeRefs.some(ref => lowerContent.includes(ref));
  if (hasTimeRef) score += 15;
  
  // Binary choice (easy to respond to)
  if (lowerContent.includes(' or ') && questionCount > 0) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Evaluate brevity - research-backed optimal lengths
 */
function evaluateBrevity(content: string, contentType: string): number {
  const wordCount = content.split(/\s+/).length;
  
  // Research-backed optimal ranges
  const optimalRanges: Record<string, { min: number; max: number; ideal: number }> = {
    email: { min: 50, max: 125, ideal: 75 },      // 50-125 words = 50%+ response rate
    linkedin: { min: 25, max: 100, ideal: 50 },   // Under 100 words = 50% higher response
    text: { min: 10, max: 40, ideal: 20 },        // Texts should be very short
    advice: { min: 75, max: 250, ideal: 150 },
    general: { min: 50, max: 150, ideal: 100 }
  };
  
  const range = optimalRanges[contentType] || optimalRanges.general;
  
  if (wordCount >= range.min && wordCount <= range.max) {
    const distanceFromIdeal = Math.abs(wordCount - range.ideal);
    const maxDistance = Math.max(range.ideal - range.min, range.max - range.ideal);
    return Math.round(100 - (distanceFromIdeal / maxDistance) * 20);
  } else if (wordCount < range.min) {
    return Math.max(40, 80 - (range.min - wordCount) * 3);
  } else {
    // Heavily penalize being too long
    return Math.max(20, 80 - (wordCount - range.max) * 1.5);
  }
}

/**
 * Evaluate relevance
 */
function evaluateRelevance(content: string, context?: EvaluationContext): number {
  if (!context?.purpose) return 70;
  
  let score = 60;
  const lowerContent = content.toLowerCase();
  
  const purposeKeywords: Record<string, string[]> = {
    'cold outreach': ['reaching out', 'noticed', 'impressed', 'interested', 'connect', 'introduction'],
    'follow-up': ['following up', 'checking in', 'last', 'previous', 'discussed', 'mentioned'],
    'introduction': ['introduce', 'meet', 'mutual', 'recommended', 'referred', 'connect'],
    'meeting request': ['schedule', 'meet', 'call', 'time', 'available', 'calendar', '15 minutes'],
    'thank you': ['thank', 'appreciate', 'grateful', 'enjoyed', 'pleasure', 'great meeting'],
    'proposal': ['proposal', 'solution', 'recommend', 'option', 'approach', 'pricing']
  };
  
  const keywords = purposeKeywords[context.purpose] || [];
  const matchCount = keywords.filter(keyword => lowerContent.includes(keyword)).length;
  score += Math.min(matchCount * 8, 40);
  
  return Math.max(0, Math.min(100, score));
}

/**
 * NEW: Evaluate hook strength - the opening line determines if they read more
 */
function evaluateHookStrength(content: string, contentType: string): number {
  let score = 50;
  
  // Get first sentence
  const firstSentence = content.split(/[.!?]/)[0].toLowerCase().trim();
  
  // Weak openings (penalize heavily)
  const weakOpenings = [
    'i hope this', 'i am writing', 'i wanted to', 'my name is',
    'i\'m reaching out', 'we are a company', 'our company'
  ];
  if (weakOpenings.some(weak => firstSentence.includes(weak))) {
    score -= 30;
  }
  
  // Strong openings (reward)
  const strongOpenings = [
    'noticed', 'congrats', 'saw your', 'loved your', 'impressed by',
    'quick question', 'thought you\'d', 'given your'
  ];
  if (strongOpenings.some(strong => firstSentence.includes(strong))) {
    score += 30;
  }
  
  // Starting with recipient's name or company is strong
  if (firstSentence.length < 50) {
    score += 10;  // Short first lines work better
  }
  
  // Question as opener (attention-grabbing)
  if (firstSentence.includes('?')) {
    score += 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * NEW: Evaluate value proposition - why should recipient care?
 */
function evaluateValueProposition(content: string, context?: EvaluationContext): number {
  let score = 50;
  const lowerContent = content.toLowerCase();
  
  // Value-focused language
  const valueWords = [
    'help you', 'save', 'increase', 'reduce', 'improve', 'grow',
    'benefit', 'result', 'achieve', 'success', 'faster', 'easier',
    'automate', 'streamline', 'eliminate'
  ];
  const valueMatches = valueWords.filter(word => lowerContent.includes(word)).length;
  score += Math.min(valueMatches * 10, 30);
  
  // Specific numbers/results (social proof)
  if (/\d+%|\$\d+|\d+x|saved \d+|increased \d+/i.test(content)) {
    score += 15;
  }
  
  // Reference to similar companies (social proof)
  if (lowerContent.includes('companies like') || lowerContent.includes('similar to')) {
    score += 10;
  }
  
  // Penalize self-focused language
  const selfFocused = ['we are', 'our company', 'i have', 'we have', 'our product', 'we offer'];
  const selfCount = selfFocused.filter(phrase => lowerContent.includes(phrase)).length;
  score -= selfCount * 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * NEW: Evaluate urgency balance - creates urgency without being pushy
 */
function evaluateUrgencyBalance(content: string, stage: string): number {
  let score = 70; // Neutral start
  const lowerContent = content.toLowerCase();
  
  // Good urgency (time-bounded, not pushy)
  const goodUrgency = ['this week', 'next week', 'before end of', 'quick', 'brief'];
  const goodCount = goodUrgency.filter(phrase => lowerContent.includes(phrase)).length;
  score += goodCount * 8;
  
  // Bad urgency (too pushy, can hurt response rates)
  const badUrgency = ['act now', 'limited time', 'don\'t miss', 'last chance', 'urgent', 'asap'];
  const badCount = badUrgency.filter(phrase => lowerContent.includes(phrase)).length;
  score -= badCount * 15;
  
  // Stage-appropriate urgency
  if (stage === 'follow-up' || stage === 'closing') {
    // More urgency acceptable in later stages
    score += 10;
  } else if (stage === 'cold') {
    // Less urgency for cold outreach
    if (badCount > 0) score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate research-backed suggestions
 */
function generateSuggestions(
  breakdown: QualityScore['breakdown'],
  contentType: string,
  content: string,
  context?: EvaluationContext,
  stage?: string
): string[] {
  const suggestions: string[] = [];
  const wordCount = content.split(/\s+/).length;
  
  // Hook suggestions
  if (breakdown.hookStrength < 70) {
    suggestions.push('Open with something specific about them (research shows 50% higher response rates)');
  }
  
  // Personalization suggestions
  if (breakdown.personalization < 70) {
    if (context?.recipientName) {
      suggestions.push(`Use ${context.recipientName.split(' ')[0]}'s name naturally in the body, not just greeting`);
    }
    if (context?.recipientCompany) {
      suggestions.push(`Reference something specific about ${context.recipientCompany} (recent news, product, growth)`);
    }
    if (!context?.recipientName && !context?.recipientCompany) {
      suggestions.push('Add recipient name and company - personalized emails get 29% higher open rates');
    }
  }
  
  // Brevity suggestions
  if (breakdown.brevity < 70) {
    if (contentType === 'email' && wordCount > 125) {
      suggestions.push(`Shorten to ~75 words (currently ${wordCount}). Emails 50-125 words get 50%+ response rates`);
    } else if (contentType === 'linkedin' && wordCount > 100) {
      suggestions.push(`Cut to under 100 words (currently ${wordCount}). Short LinkedIn messages get 50% more replies`);
    }
  }
  
  // Actionability suggestions
  if (breakdown.actionability < 70) {
    suggestions.push('Add a specific ask with a time frame (e.g., "15-minute call this Thursday?")');
    if (stage === 'cold') {
      suggestions.push('Try a soft CTA: "Would you be open to..." works better for cold outreach');
    }
  }
  
  // Value proposition suggestions
  if (breakdown.valueProposition < 70) {
    suggestions.push('Focus on their benefit, not your features. Use "you" more than "we"');
    suggestions.push('Add a specific result or stat (e.g., "helped X save 50% on Y")');
  }
  
  // Stage-specific suggestions
  if (stage === 'follow-up' && !content.toLowerCase().includes('last')) {
    suggestions.push('Reference your previous message specifically');
  }
  
  if (stage === 'cold' && breakdown.hookStrength < 80) {
    suggestions.push('For cold emails, the first line is critical. Make it about them, not you');
  }
  
  return suggestions.slice(0, 4); // Max 4 suggestions
}

/**
 * Get quality rating label
 */
export function getQualityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

/**
 * Get conversion potential description
 */
export function getConversionDescription(potential: 'high' | 'medium' | 'low'): string {
  const descriptions = {
    high: 'High conversion potential - this message follows best practices for engagement',
    medium: 'Moderate conversion potential - consider the suggestions to improve response rates',
    low: 'Low conversion potential - significant improvements needed for better results'
  };
  return descriptions[potential];
}

/**
 * Format score breakdown for display
 */
export function formatScoreBreakdown(score: QualityScore): string {
  const { breakdown } = score;
  return `
Quality Score: ${score.overall}/100 (${getQualityLabel(score.overall)})
Conversion Potential: ${score.conversionPotential.toUpperCase()}
Message Stage: ${score.stage}

Breakdown:
- Clarity: ${breakdown.clarity}/100
- Personalization: ${breakdown.personalization}/100
- Hook Strength: ${breakdown.hookStrength}/100
- Value Proposition: ${breakdown.valueProposition}/100
- Actionability: ${breakdown.actionability}/100
- Brevity: ${breakdown.brevity}/100
- Relevance: ${breakdown.relevance}/100
- Professionalism: ${breakdown.professionalism}/100
- Urgency Balance: ${breakdown.urgencyBalance}/100

${score.suggestions.length > 0 ? `Research-Backed Suggestions:\n${score.suggestions.map(s => `• ${s}`).join('\n')}` : '✨ Excellent work - no major improvements needed!'}
`.trim();
}
