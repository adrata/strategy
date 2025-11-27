/**
 * INTELLIGENT CONTENT QUALITY EVALUATOR
 * 
 * Enterprise-grade message evaluation combining:
 * - Russell Brunson's Hook-Story-Offer (enterprise adapted)
 * - Skip Miller's ProActive Selling (ATL/BTL buyer awareness)
 * - Personality-aware messaging
 * - User writing style learning
 * - Research-backed conversion optimization
 * 
 * The goal: Messages that feel like they were written by the best version
 * of the sender - elegant, specific, and impossible to ignore.
 */

// =============================================================================
// TYPES
// =============================================================================

export type PersonStatus = 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'PARTNER';
export type OpportunityStage = 'QUALIFICATION' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSING';
export type BuyerLevel = 'ATL' | 'BTL'; // Above/Below The Line (Skip Miller)
export type CommunicationStyle = 'direct' | 'analytical' | 'expressive' | 'amiable';
export type ContentType = 'email' | 'linkedin' | 'text' | 'advice' | 'general';

export interface QualityScore {
  overall: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  conversionPotential: 'exceptional' | 'high' | 'medium' | 'low';
  
  // Core Framework Scores
  framework: {
    hook: number;              // Russell Brunson - pattern interrupt
    story: number;             // Epiphany bridge / transformation narrative
    offer: number;             // Clear, low-friction next step
    storyBrand: number;        // Hero's journey structure
  };
  
  // Sales Intelligence Scores
  salesIntelligence: {
    buyerLevelAlignment: number;   // ATL vs BTL messaging
    statusAlignment: number;       // LEAD/PROSPECT/CUSTOMER appropriate
    stageAlignment: number;        // DISCOVERY/PROPOSAL/etc appropriate
    personalityMatch: number;      // Matches recipient's style
  };
  
  // Craft Scores
  craft: {
    clarity: number;
    personalization: number;
    elegance: number;              // Sophistication without stuffiness
    brevity: number;
    actionability: number;
    writingStyleMatch: number;     // Sounds like sender's best self
  };
  
  suggestions: string[];
  contentType: ContentType;
  detectedStatus: PersonStatus;
  detectedStage: OpportunityStage;
  detectedBuyerLevel: BuyerLevel;
}

export interface RecipientPersonality {
  communicationStyle: CommunicationStyle;
  decisionMakingStyle?: string;
  motivations?: string[];
  concerns?: string[];
  keyNeeds?: string[];
}

export interface EvaluationContext {
  // Recipient Info
  recipientName?: string;
  recipientCompany?: string;
  recipientTitle?: string;
  industry?: string;
  
  // Model-Aligned Fields (from Prisma schema)
  status?: PersonStatus;
  stage?: OpportunityStage;
  
  // Skip Miller - Buyer Level
  buyerLevel?: BuyerLevel;
  
  // Personality (from buyer archetypes)
  recipientPersonality?: RecipientPersonality;
  
  // Conversation Context
  priorMessages?: string[];
  touchpointNumber?: number;
  lastInteraction?: 'opened' | 'clicked' | 'replied' | 'no_response' | 'meeting_held';
  
  // Research & Intelligence
  recipientPainPoints?: string[];
  recentNews?: string;
  competitorMentioned?: string;
  
  // User Writing Style (for learning)
  userWritingSamples?: string[];
  senderName?: string;
  senderCompany?: string;
}

// =============================================================================
// MAIN EVALUATION FUNCTION
// =============================================================================

export function evaluateContent(
  content: string,
  contentType: ContentType,
  context: EvaluationContext = {}
): QualityScore {
  // Detect context from content if not provided
  const detectedStatus = context.status || detectStatus(content, context);
  const detectedStage = context.stage || detectStage(content, context);
  const detectedBuyerLevel = context.buyerLevel || detectBuyerLevel(content, context);
  
  // Evaluate all dimensions
  const framework = {
    hook: evaluateHook(content, contentType, context),
    story: evaluateStory(content, context),
    offer: evaluateOffer(content, detectedStage, context),
    storyBrand: evaluateStoryBrand(content, context)
  };
  
  const salesIntelligence = {
    buyerLevelAlignment: evaluateBuyerLevelAlignment(content, detectedBuyerLevel, context),
    statusAlignment: evaluateStatusAlignment(content, detectedStatus, context),
    stageAlignment: evaluateStageAlignment(content, detectedStage, context),
    personalityMatch: evaluatePersonalityMatch(content, context)
  };
  
  const craft = {
    clarity: evaluateClarity(content),
    personalization: evaluatePersonalization(content, context),
    elegance: evaluateElegance(content),
    brevity: evaluateBrevity(content, contentType),
    actionability: evaluateActionability(content, detectedStage),
    writingStyleMatch: evaluateWritingStyleMatch(content, context)
  };
  
  // Calculate weighted overall score
  const overall = calculateOverallScore(framework, salesIntelligence, craft, contentType);
  const grade = getGrade(overall);
  const conversionPotential = getConversionPotential(overall, framework.hook, craft.personalization);
  
  // Generate intelligent suggestions
  const suggestions = generateSuggestions(
    framework, salesIntelligence, craft, 
    content, contentType, context,
    detectedStatus, detectedStage, detectedBuyerLevel
  );
  
  return {
    overall,
    grade,
    conversionPotential,
    framework,
    salesIntelligence,
    craft,
    suggestions,
    contentType,
    detectedStatus,
    detectedStage,
    detectedBuyerLevel
  };
}

// Alias for backwards compatibility
export const evaluateContentFast = evaluateContent;

// =============================================================================
// RUSSELL BRUNSON FRAMEWORK (Enterprise Adapted)
// =============================================================================

/**
 * HOOK EVALUATION
 * Russell Brunson: "You have 3 seconds to stop the scroll"
 * 
 * Enterprise hooks that work:
 * - Pattern interrupt (unexpected insight)
 * - Specificity (concrete detail that proves research)
 * - Curiosity gap (incomplete loop)
 * - Status trigger (peer reference)
 */
function evaluateHook(content: string, contentType: string, context: EvaluationContext): number {
  let score = 50; // Higher baseline - easier to get a decent hook score
  
  const firstLine = content.split(/[.!?\n]/)[0].toLowerCase().trim();
  const firstTwoSentences = content.split(/[.!?]/).slice(0, 2).join('. ').toLowerCase();
  
  // NAME-FIRST OPENER - Good for personalization
  if (context.recipientName) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    if (firstLine.startsWith(firstName)) {
      score += 15; // Starting with name is a soft pattern interrupt
    }
  }
  
  // PATTERN INTERRUPT - Does it break the expected pattern?
  const patternInterrupts = [
    { pattern: /^(noticed|saw|caught) (your|that|the)/i, points: 20 },
    { pattern: /^(quick question|curious|wondering)/i, points: 18 },
    { pattern: /^(congrats|impressive|loved|great)/i, points: 15 },
    { pattern: /^\d+%|\$[\d,]+|\d+x/i, points: 25 }, // Opens with a stat - very strong
    { pattern: /^"[^"]+"/i, points: 15 }, // Opens with a quote
    { pattern: /circling back|following up/i, points: 10 }, // Follow-up openers are fine
    { pattern: /thanks for|great (call|conversation|meeting)/i, points: 12 }, // Post-meeting openers
  ];
  
  for (const { pattern, points } of patternInterrupts) {
    if (pattern.test(firstLine)) {
      score += points;
      break;
    }
  }
  
  // SPECIFICITY - Concrete details signal research
  if (context.recipientCompany && firstTwoSentences.includes(context.recipientCompany.toLowerCase())) {
    score += 12;
  }
  if (context.recentNews && firstTwoSentences.includes(context.recentNews.substring(0, 15).toLowerCase())) {
    score += 12;
  }
  
  // WEAK HOOKS - Penalties (but not as harsh)
  const weakHooks = [
    'i hope this', 'i wanted to', 'i am writing', 'my name is',
    'i\'m reaching out', 'i\'d like to', 'our company', 'we are a'
  ];
  if (weakHooks.some(weak => firstLine.includes(weak))) {
    score -= 25;
  }
  
  // Short, punchy first line is better
  const firstLineWords = firstLine.split(/\s+/).length;
  if (firstLineWords <= 12) score += 8;
  else if (firstLineWords > 20) score -= 8;
  
  // Question hooks are powerful
  if (firstLine.includes('?')) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * STORY EVALUATION
 * Russell Brunson's "Epiphany Bridge" - enterprise adapted
 * 
 * Great enterprise stories:
 * - Transformation narrative (before → after)
 * - Social proof through narrative (not just claims)
 * - Emotional resonance with business impact
 */
function evaluateStory(content: string, context: EvaluationContext): number {
  let score = 55; // Higher baseline
  const lower = content.toLowerCase();
  
  // TRANSFORMATION SIGNALS
  const transformationPairs = [
    ['struggling', 'now'],
    ['before', 'after'],
    ['used to', 'now'],
    ['was', 'became'],
    ['went from', 'to'],
    ['go from', 'to'],
    ['reduced', 'by'],
    ['increased', 'to'],
    ['saved', 'hours'],
    ['cut', 'to'],
    ['from', 'to under'],
    ['hours/week', 'hours']
  ];
  
  for (const [before, after] of transformationPairs) {
    if (lower.includes(before) && lower.includes(after)) {
      score += 20;
      break;
    }
  }
  
  // SOCIAL PROOF THROUGH STORY
  const storyProofPatterns = [
    /helped ([\w\s']+) (achieve|save|reduce|increase|grow|go from|cut)/i,
    /companies like ([\w\s,]+)/i,
    /(similar|same) (situation|challenge|problem|results|company)/i,
    /when ([\w\s']+) (faced|struggled|needed|hit)/i,
    /(notion|stripe|figma|google|microsoft|amazon)/i // Named companies
  ];
  
  for (const pattern of storyProofPatterns) {
    if (pattern.test(content)) {
      score += 10;
    }
  }
  
  // CONCRETE RESULTS (numbers in narrative context)
  if (/\d+%/i.test(content)) {
    score += 12;
  }
  if (/\$[\d,]+k?/i.test(content)) {
    score += 12;
  }
  if (/\d+\s*(hours|days|weeks|minutes)/i.test(content)) {
    score += 8;
  }
  
  // PAIN POINT ACKNOWLEDGMENT
  if (context.recipientPainPoints?.some(pain => lower.includes(pain.toLowerCase()))) {
    score += 8;
  }
  
  // Penalize pure feature lists (not story-driven)
  const bulletCount = (content.match(/^[-•*]\s/gm) || []).length;
  if (bulletCount > 3) score -= 8;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * OFFER EVALUATION
 * Russell Brunson: "Make them an offer they can't refuse"
 * 
 * Enterprise offers that convert:
 * - Low friction (15 min, not 1 hour)
 * - High value perception
 * - Clear next step
 * - Risk reversal (no commitment language)
 */
function evaluateOffer(content: string, stage: OpportunityStage, context: EvaluationContext): number {
  let score = 50; // Higher baseline
  const lower = content.toLowerCase();
  
  // LOW FRICTION CTAs
  const lowFriction = [
    { pattern: '15 minutes', points: 18 },
    { pattern: '15-minute', points: 18 },
    { pattern: 'quick call', points: 15 },
    { pattern: 'brief chat', points: 15 },
    { pattern: 'quick question', points: 12 },
    { pattern: 'short call', points: 12 },
    { pattern: 'worth connecting', points: 12 },
    { pattern: 'worth a', points: 10 }
  ];
  
  for (const { pattern, points } of lowFriction) {
    if (lower.includes(pattern)) {
      score += points;
      break;
    }
  }
  
  // SOFT CTAs (work better for cold/early stage)
  const softCTAs = [
    'would you be open to',
    'would it make sense',
    'worth a conversation',
    'interested in exploring',
    'open to learning',
    'make sense to',
    'worth exploring',
    'still open to'
  ];
  
  const hardCTAs = [
    'schedule a demo',
    'book a call',
    'sign up',
    'get started',
    'ready to move forward'
  ];
  
  const hasSoftCTA = softCTAs.some(cta => lower.includes(cta));
  const hasHardCTA = hardCTAs.some(cta => lower.includes(cta));
  
  // Stage-appropriate CTA scoring
  if (stage === 'QUALIFICATION' || stage === 'DISCOVERY') {
    if (hasSoftCTA) score += 18;
    if (hasHardCTA) score -= 5; // Slight penalty for too aggressive
  } else if (stage === 'PROPOSAL' || stage === 'NEGOTIATION' || stage === 'CLOSING') {
    if (hasHardCTA) score += 15;
    if (hasSoftCTA) score += 12;
  }
  
  // BINARY CHOICE (easy decision)
  if (lower.includes(' or ') && content.includes('?')) {
    score += 10;
  }
  
  // SPECIFIC TIME OFFERS
  const dayMentioned = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 
                        'this week', 'next week', 'tomorrow', 'afternoon'].some(d => lower.includes(d));
  if (dayMentioned) score += 8;
  
  // RISK REVERSAL LANGUAGE
  const riskReversal = ['no commitment', 'no obligation', 'just to explore', 'see if it makes sense', 'to see if'];
  if (riskReversal.some(r => lower.includes(r))) {
    score += 8;
  }
  
  // Must have a question (CTA) for emails/linkedin
  if (!content.includes('?')) {
    score -= 15;
  } else {
    score += 5; // Bonus for having a question
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * STORYBRAND EVALUATION
 * Donald Miller's 7-part framework (streamlined)
 * 
 * 1. Hero (customer) - Message is about them
 * 2. Problem - Their challenge acknowledged
 * 3. Guide (you) - Empathy + Authority
 * 4. Plan - Clear path forward
 * 5. CTA - Specific action
 * 6. Success - Vision of transformation
 */
function evaluateStoryBrand(content: string, context: EvaluationContext): number {
  let score = 30; // Higher baseline
  const lower = content.toLowerCase();
  
  // HERO - Is the message about them? (count "you" vs "we/I")
  const youCount = (lower.match(/\byou\b|\byour\b/g) || []).length;
  const weCount = (lower.match(/\bwe\b|\bour\b|\bi\b/g) || []).length;
  
  if (youCount > weCount * 1.5) score += 20;
  else if (youCount > weCount) score += 15;
  else if (youCount >= weCount) score += 10;
  
  // PROBLEM - Pain point acknowledged
  const problemIndicators = [
    'challenge', 'struggling', 'difficult', 'pain', 'problem',
    'frustrated', 'time-consuming', 'costly', 'complex', 'overwhelming',
    'bottleneck', 'roadblock', 'wall', 'scramble', 'drowning', 'eating'
  ];
  if (problemIndicators.some(p => lower.includes(p))) score += 12;
  if (context.recipientPainPoints?.some(p => lower.includes(p.toLowerCase()))) score += 8;
  
  // GUIDE - Empathy + Authority
  const empathy = ['understand', 'know how', 'been there', 'hear you', 'makes sense', 'similar'];
  const authority = ['helped', 'worked with', 'experience', 'companies like', 'proven', 'results'];
  
  if (empathy.some(e => lower.includes(e))) score += 8;
  if (authority.some(a => lower.includes(a))) score += 10;
  
  // PLAN - Clear path
  const planIndicators = ['here\'s how', 'simple', 'step', 'process', 'approach', 'path', 'proposal', 'show'];
  if (planIndicators.some(p => lower.includes(p))) score += 8;
  
  // CTA - Has ask
  if (content.includes('?')) score += 8;
  
  // SUCCESS - Transformation vision
  const successIndicators = [
    'imagine', 'picture', 'result', 'outcome', 'achieve',
    'success', 'growth', 'improvement', 'transformation',
    'roi', 'saving', 'saved', 'cut', 'eliminate', 'streamline'
  ];
  if (successIndicators.some(s => lower.includes(s))) score += 12;
  
  return Math.max(0, Math.min(100, score));
}

// =============================================================================
// SKIP MILLER - PROACTIVE SELLING
// =============================================================================

/**
 * ATL (Above The Line) vs BTL (Below The Line) Alignment
 * 
 * ATL (Executives): Focus on outcomes, ROI, strategic impact, time savings
 * BTL (Users/Evaluators): Focus on features, implementation, ease of use, support
 */
function evaluateBuyerLevelAlignment(
  content: string, 
  buyerLevel: BuyerLevel,
  context: EvaluationContext
): number {
  let score = 70; // Higher baseline
  const lower = content.toLowerCase();
  
  const atlKeywords = [
    'roi', 'revenue', 'growth', 'strategic', 'competitive',
    'market', 'board', 'stakeholder', 'bottom line', 'investment',
    'scale', 'efficiency', 'productivity', 'cost', 'risk',
    'cfo', 'ceo', 'executive', 'leadership', 'savings', 'impact',
    'time', 'hours', 'resource', 'team', '$', 'annual', 'year'
  ];
  
  const btlKeywords = [
    'feature', 'integration', 'workflow', 'dashboard', 'interface',
    'setup', 'implementation', 'training', 'support', 'documentation',
    'api', 'automation', 'configuration', 'user experience', 'how it works',
    'technical', 'architecture', 'latency', 'performance', 'code'
  ];
  
  const atlMatches = atlKeywords.filter(k => lower.includes(k)).length;
  const btlMatches = btlKeywords.filter(k => lower.includes(k)).length;
  
  if (buyerLevel === 'ATL') {
    score += Math.min(atlMatches * 4, 25); // Cap at 25 bonus
    if (btlMatches > atlMatches + 2) score -= 5; // Too tactical for execs (with buffer)
  } else {
    score += Math.min(btlMatches * 4, 25);
    // BTL folks can appreciate ROI too, don't penalize
  }
  
  // Title-based adjustments
  if (context.recipientTitle) {
    const title = context.recipientTitle.toLowerCase();
    const isExecutive = ['ceo', 'cfo', 'cto', 'coo', 'vp', 'chief', 'president', 'director'].some(t => title.includes(t));
    
    if (isExecutive && buyerLevel === 'ATL') score += 5;
    if (!isExecutive && buyerLevel === 'BTL') score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * STATUS ALIGNMENT (LEAD/PROSPECT/CUSTOMER/PARTNER)
 */
function evaluateStatusAlignment(
  content: string,
  status: PersonStatus,
  context: EvaluationContext
): number {
  let score = 75; // Higher baseline
  const lower = content.toLowerCase();
  
  const statusStrategies: Record<PersonStatus, { good: string[], bad: string[] }> = {
    LEAD: {
      good: ['introduce', 'learn more', 'explore', 'curious', 'initial', 'new', 'noticed', 'saw', 'congrats', 
             'make sense', 'worth', 'open to', 'just closed', 'recently', 'hit', 'challenge'],
      bad: ['renew', 'upgrade', 'existing customer', 'continue our partnership']
    },
    PROSPECT: {
      good: ['next step', 'demo', 'proposal', 'solution', 'requirements', 'timeline', 'follow', 'since we', 
             'recap', 'spoke', 'conversation', 'based on', 'discussed'],
      bad: ['introduce myself for the first time', 'let me tell you about our company from scratch']
    },
    CUSTOMER: {
      good: ['thank you', 'appreciate', 'value', 'feedback', 'expand', 'additional', 'continue', 'partnership'],
      bad: ['cold outreach', 'reaching out for the first time', 'who we are']
    },
    PARTNER: {
      good: ['collaborate', 'partnership', 'mutual', 'together', 'joint', 'co-', 'exchange', 'both'],
      bad: ['sell you', 'pitch you', 'pricing for you']
    }
  };
  
  const strategy = statusStrategies[status];
  if (strategy) {
    const goodMatches = strategy.good.filter(g => lower.includes(g)).length;
    const badMatches = strategy.bad.filter(b => lower.includes(b)).length;
    
    score += Math.min(goodMatches * 5, 20); // Cap bonus at 20
    score -= badMatches * 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * STAGE ALIGNMENT (QUALIFICATION/DISCOVERY/PROPOSAL/NEGOTIATION/CLOSING)
 */
function evaluateStageAlignment(
  content: string,
  stage: OpportunityStage,
  context: EvaluationContext
): number {
  let score = 70; // Higher baseline
  const lower = content.toLowerCase();
  
  const stageStrategies: Record<OpportunityStage, { keywords: string[] }> = {
    QUALIFICATION: {
      keywords: ['fit', 'right', 'make sense', 'explore', 'learn', 'understand', 'challenges', 'worth', 'open to']
    },
    DISCOVERY: {
      keywords: ['tell me more', 'help me understand', 'walk me through', 'priorities', 'goals', 'timeline', 'since we', 'spoke', 'conversation']
    },
    PROPOSAL: {
      keywords: ['solution', 'recommend', 'based on', 'proposal', 'approach', 'investment', 'roi', 'show', 'recap']
    },
    NEGOTIATION: {
      keywords: ['terms', 'pricing', 'flexibility', 'options', 'package', 'value', 'commitment', 'discuss']
    },
    CLOSING: {
      keywords: ['ready', 'move forward', 'next steps', 'start', 'begin', 'finalize', 'decision', 'proceed']
    }
  };
  
  const strategy = stageStrategies[stage];
  if (strategy) {
    const matches = strategy.keywords.filter(k => lower.includes(k)).length;
    score += matches * 6;
  }
  
  // Touchpoint awareness
  if (context.touchpointNumber && context.touchpointNumber > 1) {
    const hasFollowUpLanguage = lower.includes('follow') || lower.includes('circling') || lower.includes('since we') || lower.includes('checking');
    if (hasFollowUpLanguage) score += 8;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * PERSONALITY MATCH
 * Adapts to recipient's communication style
 */
function evaluatePersonalityMatch(content: string, context: EvaluationContext): number {
  if (!context.recipientPersonality?.communicationStyle) {
    return 80; // Higher neutral if unknown
  }
  
  let score = 70; // Higher baseline
  const style = context.recipientPersonality.communicationStyle;
  
  const stylePatterns: Record<CommunicationStyle, { good: RegExp[], bad: RegExp[] }> = {
    direct: {
      good: [
        /^[^.]{1,70}\./,           // Short punchy first sentence
        /would.*make sense/i,      // Direct ask
        /\?$/,                     // Ends with question
        /\d+%|\$[\d,]+/i,          // Concrete numbers
        /\d+\s*(hours|minutes)/i,  // Time specifics
        /roi|results|savings/i     // Results focus
      ],
      bad: [/i think maybe|perhaps we could possibly|not sure if/i]
    },
    analytical: {
      good: [
        /\d+%|\$[\d,]+|\d+x/i,
        /data|metrics|analysis|research/i,
        /\d+\s*(hours|days|weeks)/i,
        /specifically|precisely|exactly|technical/i,
        /architecture|performance|latency/i
      ],
      bad: [/trust me|believe me|gut feeling/i]
    },
    expressive: {
      good: [
        /excited|thrilled|love|great|congrats|impressive|amazing/i,
        /!/,
        /imagine|vision|transform|incredible/i
      ],
      bad: [/strictly speaking|merely|simply put/i]
    },
    amiable: {
      good: [
        /team|together|partnership|collaborate|exchange/i,
        /help|support|assist/i,
        /relationship|connect|looking forward/i
      ],
      bad: [/aggressive|push hard|demand immediate/i]
    }
  };
  
  const patterns = stylePatterns[style];
  if (patterns) {
    let matchCount = 0;
    for (const good of patterns.good) {
      if (good.test(content)) matchCount++;
    }
    score += Math.min(matchCount * 8, 25); // Cap bonus
    
    for (const bad of patterns.bad) {
      if (bad.test(content)) score -= 10;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

// =============================================================================
// CRAFT EVALUATORS
// =============================================================================

function evaluateClarity(content: string): number {
  let score = 100;
  
  // Sentence length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWords = content.split(/\s+/).length / Math.max(sentences.length, 1);
  
  if (avgWords > 25) score -= 15;
  else if (avgWords > 20) score -= 8;
  else if (avgWords <= 12) score += 5;
  
  // Jargon penalty
  const jargon = ['synergy', 'leverage', 'paradigm', 'holistic', 'bandwidth', 
                  'circle back', 'touch base', 'move the needle', 'low-hanging fruit'];
  const jargonCount = jargon.filter(j => content.toLowerCase().includes(j)).length;
  score -= jargonCount * 12;
  
  // Passive voice penalty (simple detection)
  const passivePatterns = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi;
  const passiveCount = (content.match(passivePatterns) || []).length;
  score -= passiveCount * 5;
  
  return Math.max(0, Math.min(100, score));
}

function evaluatePersonalization(content: string, context: EvaluationContext): number {
  let score = 40; // Higher baseline
  const lower = content.toLowerCase();
  
  // Name usage (+25)
  if (context.recipientName) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    if (lower.includes(firstName)) {
      score += 25;
      // Bonus for using beyond greeting
      const afterGreeting = lower.substring(lower.indexOf(firstName) + firstName.length);
      if (afterGreeting.includes(firstName)) score += 8;
    }
  }
  
  // Company reference (+18)
  if (context.recipientCompany && lower.includes(context.recipientCompany.toLowerCase())) {
    score += 18;
  }
  
  // Industry/title reference (+8)
  if (context.industry && lower.includes(context.industry.toLowerCase())) score += 8;
  if (context.recipientTitle) {
    const titleWords = context.recipientTitle.toLowerCase().split(' ');
    if (titleWords.some(w => w.length > 3 && lower.includes(w))) score += 6;
  }
  
  // Pain point reference (+12)
  if (context.recipientPainPoints?.some(p => lower.includes(p.toLowerCase()))) {
    score += 12;
  }
  
  // Recent news reference (+12)
  if (context.recentNews) {
    const newsWords = context.recentNews.toLowerCase().split(' ').filter(w => w.length > 3);
    if (newsWords.some(w => lower.includes(w))) {
      score += 12;
    }
  }
  
  // Generic penalty
  const genericPhrases = [
    'i hope this finds you well', 'to whom it may concern',
    'dear sir', 'dear hiring manager'
  ];
  if (genericPhrases.some(g => lower.includes(g))) score -= 25;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * ELEGANCE SCORING
 * Sophisticated without being stuffy
 * Confident without being arrogant
 * Clear without being simplistic
 */
function evaluateElegance(content: string): number {
  let score = 70;
  const lower = content.toLowerCase();
  
  // FILLER WORDS (penalize)
  const fillers = ['just', 'really', 'very', 'actually', 'basically', 'literally',
                   'honestly', 'simply', 'definitely', 'absolutely', 'totally'];
  const fillerCount = fillers.filter(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    return regex.test(content);
  }).length;
  score -= fillerCount * 6;
  
  // WEAK LANGUAGE (penalize)
  const weakPhrases = ['i think', 'i believe', 'i feel', 'maybe', 'perhaps',
                       'sort of', 'kind of', 'a little bit', 'in my opinion'];
  const weakCount = weakPhrases.filter(w => lower.includes(w)).length;
  score -= weakCount * 8;
  
  // APOLOGETIC LANGUAGE (penalize)
  const apologetic = ['sorry to bother', 'sorry for', 'apologize for', 
                      'hate to ask', 'don\'t mean to'];
  if (apologetic.some(a => lower.includes(a))) score -= 15;
  
  // STRONG VERBS (reward)
  const strongVerbs = ['transform', 'accelerate', 'eliminate', 'streamline',
                       'optimize', 'empower', 'enable', 'drive', 'achieve', 'deliver'];
  const strongCount = strongVerbs.filter(v => lower.includes(v)).length;
  score += strongCount * 5;
  
  // CONFIDENT LANGUAGE (reward)
  const confident = ['will', 'can', 'proven', 'results', 'demonstrated', 'track record'];
  const confidentCount = confident.filter(c => lower.includes(c)).length;
  score += confidentCount * 4;
  
  // CONCISE STRUCTURE (reward)
  const paragraphs = content.split(/\n\n+/);
  if (paragraphs.length >= 2 && paragraphs.length <= 4) score += 8;
  
  // No excessive punctuation
  if ((content.match(/!!/g) || []).length > 0) score -= 10;
  if ((content.match(/\.\.\./g) || []).length > 1) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function evaluateBrevity(content: string, contentType: ContentType): number {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  // Research-backed optimal ranges
  const ranges: Record<ContentType, { min: number; ideal: number; max: number }> = {
    email: { min: 50, ideal: 75, max: 125 },
    linkedin: { min: 25, ideal: 50, max: 90 },
    text: { min: 10, ideal: 20, max: 40 },
    advice: { min: 75, ideal: 150, max: 250 },
    general: { min: 40, ideal: 80, max: 150 }
  };
  
  const range = ranges[contentType];
  
  if (wordCount >= range.min && wordCount <= range.max) {
    const deviation = Math.abs(wordCount - range.ideal);
    const maxDeviation = Math.max(range.ideal - range.min, range.max - range.ideal);
    return Math.round(100 - (deviation / maxDeviation) * 25);
  } else if (wordCount < range.min) {
    return Math.max(30, 75 - (range.min - wordCount) * 3);
  } else {
    return Math.max(20, 75 - (wordCount - range.max) * 2);
  }
}

function evaluateActionability(content: string, stage: OpportunityStage): number {
  let score = 35;
  const lower = content.toLowerCase();
  
  // Has a question
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount === 1) score += 25;
  else if (questionCount === 2) score += 20;
  else if (questionCount > 2) score += 10;
  else score -= 15; // No question = no CTA
  
  // Specific time reference
  const timeRefs = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday',
                    'this week', 'next week', 'tomorrow', '15 minutes', '30 minutes'];
  if (timeRefs.some(t => lower.includes(t))) score += 15;
  
  // Binary choice
  if (lower.includes(' or ') && questionCount > 0) score += 12;
  
  // Stage-appropriate urgency
  if (stage === 'CLOSING' || stage === 'NEGOTIATION') {
    if (lower.includes('ready') || lower.includes('move forward')) score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * WRITING STYLE MATCH
 * Learn from user's previous messages to sound like their best self
 */
function evaluateWritingStyleMatch(content: string, context: EvaluationContext): number {
  if (!context.userWritingSamples || context.userWritingSamples.length === 0) {
    return 75; // Neutral if no samples
  }
  
  let score = 50;
  
  // Analyze user's writing patterns
  const samples = context.userWritingSamples.join(' ');
  const samplesLower = samples.toLowerCase();
  
  // Sentence length similarity
  const userSentences = samples.split(/[.!?]+/).filter(s => s.trim());
  const userAvgLength = samples.split(/\s+/).length / Math.max(userSentences.length, 1);
  
  const contentSentences = content.split(/[.!?]+/).filter(s => s.trim());
  const contentAvgLength = content.split(/\s+/).length / Math.max(contentSentences.length, 1);
  
  const lengthDiff = Math.abs(userAvgLength - contentAvgLength);
  if (lengthDiff < 3) score += 15;
  else if (lengthDiff < 6) score += 8;
  
  // Formality matching
  const userContractions = (samplesLower.match(/\b(i'm|you're|we're|don't|can't|won't|it's|that's)\b/g) || []).length;
  const contentContractions = (content.toLowerCase().match(/\b(i'm|you're|we're|don't|can't|won't|it's|that's)\b/g) || []).length;
  
  const userHasContractions = userContractions > 0;
  const contentHasContractions = contentContractions > 0;
  
  if (userHasContractions === contentHasContractions) score += 10;
  
  // Greeting style matching
  const userGreetings = ['hi', 'hey', 'hello', 'dear'].filter(g => samplesLower.includes(g));
  const contentGreeting = ['hi', 'hey', 'hello', 'dear'].find(g => content.toLowerCase().startsWith(g));
  
  if (userGreetings.length > 0 && contentGreeting && userGreetings.includes(contentGreeting)) {
    score += 10;
  }
  
  // Exclamation usage
  const userExclamations = (samples.match(/!/g) || []).length / Math.max(userSentences.length, 1);
  const contentExclamations = (content.match(/!/g) || []).length / Math.max(contentSentences.length, 1);
  
  if (Math.abs(userExclamations - contentExclamations) < 0.2) score += 10;
  
  // Common phrase patterns
  const userPhrases = extractCommonPhrases(samples);
  const matchingPhrases = userPhrases.filter(p => content.toLowerCase().includes(p));
  score += matchingPhrases.length * 5;
  
  return Math.max(0, Math.min(100, score));
}

function extractCommonPhrases(text: string): string[] {
  const phrases: string[] = [];
  const lower = text.toLowerCase();
  
  // Common sales phrases to detect
  const detectPhrases = [
    'let me know', 'looking forward', 'happy to', 'feel free',
    'would love to', 'excited to', 'great to', 'thanks for'
  ];
  
  for (const phrase of detectPhrases) {
    if (lower.includes(phrase)) {
      phrases.push(phrase);
    }
  }
  
  return phrases;
}

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

function detectStatus(content: string, context: EvaluationContext): PersonStatus {
  const lower = content.toLowerCase();
  
  if (lower.includes('partnership') || lower.includes('collaborate')) return 'PARTNER';
  if (lower.includes('thank you for being') || lower.includes('valued customer')) return 'CUSTOMER';
  if (lower.includes('following up') || lower.includes('our conversation')) return 'PROSPECT';
  
  return 'LEAD';
}

function detectStage(content: string, context: EvaluationContext): OpportunityStage {
  const lower = content.toLowerCase();
  
  if (lower.includes('ready to') || lower.includes('move forward') || lower.includes('finalize')) return 'CLOSING';
  if (lower.includes('terms') || lower.includes('pricing') || lower.includes('contract')) return 'NEGOTIATION';
  if (lower.includes('proposal') || lower.includes('recommend') || lower.includes('solution')) return 'PROPOSAL';
  if (lower.includes('understand') || lower.includes('tell me more') || lower.includes('learn about')) return 'DISCOVERY';
  
  return 'QUALIFICATION';
}

function detectBuyerLevel(content: string, context: EvaluationContext): BuyerLevel {
  if (context.recipientTitle) {
    const title = context.recipientTitle.toLowerCase();
    const execTitles = ['ceo', 'cfo', 'cto', 'coo', 'cmo', 'chief', 'president', 'vp ', 'vice president', 'director', 'head of'];
    if (execTitles.some(t => title.includes(t))) return 'ATL';
  }
  
  const lower = content.toLowerCase();
  const atlSignals = ['roi', 'strategic', 'board', 'revenue', 'growth', 'competitive'];
  const btlSignals = ['feature', 'integration', 'workflow', 'implementation', 'how it works'];
  
  const atlCount = atlSignals.filter(s => lower.includes(s)).length;
  const btlCount = btlSignals.filter(s => lower.includes(s)).length;
  
  return atlCount >= btlCount ? 'ATL' : 'BTL';
}

// =============================================================================
// SCORING HELPERS
// =============================================================================

function calculateOverallScore(
  framework: QualityScore['framework'],
  salesIntelligence: QualityScore['salesIntelligence'],
  craft: QualityScore['craft'],
  contentType: ContentType
): number {
  // Content type-specific weighting
  // Text messages and advice have different expectations than sales emails
  if (contentType === 'text') {
    // Text messages: clarity, brevity, and actionability matter most
    return Math.round(
      craft.clarity * 0.25 +
      craft.brevity * 0.30 +
      craft.actionability * 0.25 +
      craft.personalization * 0.10 +
      craft.elegance * 0.10
    );
  }
  
  if (contentType === 'advice') {
    // Advice: clarity, actionability, and value matter most
    return Math.round(
      craft.clarity * 0.25 +
      craft.actionability * 0.25 +
      framework.storyBrand * 0.15 +
      craft.personalization * 0.15 +
      craft.elegance * 0.10 +
      craft.brevity * 0.10
    );
  }
  
  // For email and LinkedIn - full framework evaluation
  // Framework weights (Russell Brunson + StoryBrand)
  const frameworkWeight = 0.30;
  const frameworkScore = (
    framework.hook * 0.40 +      // Hook is critical for cold
    framework.story * 0.15 +
    framework.offer * 0.30 +     // Offer/CTA matters
    framework.storyBrand * 0.15
  );
  
  // Sales intelligence weights (Skip Miller)
  const salesWeight = 0.20;
  const salesScore = (
    salesIntelligence.buyerLevelAlignment * 0.30 +
    salesIntelligence.statusAlignment * 0.25 +
    salesIntelligence.stageAlignment * 0.25 +
    salesIntelligence.personalityMatch * 0.20
  );
  
  // Craft weights
  const craftWeight = 0.50;
  const craftScore = (
    craft.clarity * 0.15 +
    craft.personalization * 0.30 +    // Personalization is key
    craft.elegance * 0.15 +
    craft.brevity * 0.15 +
    craft.actionability * 0.15 +
    craft.writingStyleMatch * 0.10
  );
  
  return Math.round(
    frameworkScore * frameworkWeight +
    salesScore * salesWeight +
    craftScore * craftWeight
  );
}

function getGrade(score: number): QualityScore['grade'] {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getConversionPotential(
  overall: number, 
  hookScore: number, 
  personalizationScore: number
): QualityScore['conversionPotential'] {
  // High hook + high personalization = exceptional even with moderate overall
  if (hookScore >= 85 && personalizationScore >= 80 && overall >= 80) return 'exceptional';
  if (overall >= 90) return 'exceptional';
  if (overall >= 80) return 'high';
  if (overall >= 65) return 'medium';
  return 'low';
}

// =============================================================================
// SUGGESTION GENERATION
// =============================================================================

function generateSuggestions(
  framework: QualityScore['framework'],
  salesIntelligence: QualityScore['salesIntelligence'],
  craft: QualityScore['craft'],
  content: string,
  contentType: ContentType,
  context: EvaluationContext,
  status: PersonStatus,
  stage: OpportunityStage,
  buyerLevel: BuyerLevel
): string[] {
  const suggestions: string[] = [];
  const wordCount = content.split(/\s+/).length;
  
  // Hook suggestions (most important)
  if (framework.hook < 70) {
    suggestions.push('Start with a pattern interrupt: specific insight, surprising stat, or observation about them');
  }
  
  // Personalization
  if (craft.personalization < 70) {
    if (context.recipientName && !content.toLowerCase().includes(context.recipientName.split(' ')[0].toLowerCase())) {
      suggestions.push(`Use ${context.recipientName.split(' ')[0]}'s name - personalization increases response 29%`);
    }
    if (context.recipientCompany) {
      suggestions.push(`Reference ${context.recipientCompany} specifically - shows you did research`);
    }
  }
  
  // Story/narrative
  if (framework.story < 60) {
    suggestions.push('Add a transformation narrative: "We helped [similar company] go from X to Y"');
  }
  
  // Offer/CTA
  if (framework.offer < 70) {
    if (stage === 'QUALIFICATION' || stage === 'DISCOVERY') {
      suggestions.push('Use a soft CTA: "Would you be open to a 15-minute call to explore?"');
    } else {
      suggestions.push('Add a clear next step with specific timing');
    }
  }
  
  // Buyer level
  if (salesIntelligence.buyerLevelAlignment < 70) {
    if (buyerLevel === 'ATL') {
      suggestions.push('Focus on strategic outcomes and ROI for executive audiences');
    } else {
      suggestions.push('Include more tactical details and implementation specifics for evaluators');
    }
  }
  
  // Elegance
  if (craft.elegance < 70) {
    suggestions.push('Remove filler words (just, really, actually) and weak language (I think, maybe)');
  }
  
  // Brevity
  if (craft.brevity < 65) {
    const ideal = contentType === 'email' ? 75 : contentType === 'linkedin' ? 50 : 80;
    if (wordCount > ideal * 1.5) {
      suggestions.push(`Shorten to ~${ideal} words (currently ${wordCount}). Concise messages get higher response rates`);
    }
  }
  
  // Stage alignment
  if (salesIntelligence.stageAlignment < 70) {
    suggestions.push(`Adjust tone for ${stage.toLowerCase()} stage - ${getStageAdvice(stage)}`);
  }
  
  return suggestions.slice(0, 4);
}

function getStageAdvice(stage: OpportunityStage): string {
  const advice: Record<OpportunityStage, string> = {
    QUALIFICATION: 'focus on fit and exploring if there\'s mutual value',
    DISCOVERY: 'ask thoughtful questions about their priorities',
    PROPOSAL: 'present your recommendation with confidence',
    NEGOTIATION: 'be collaborative on terms while protecting value',
    CLOSING: 'be direct about next steps and timeline'
  };
  return advice[stage];
}

// =============================================================================
// EXPORTS
// =============================================================================

export function getQualityLabel(score: number): string {
  if (score >= 95) return 'Exceptional';
  if (score >= 90) return 'Excellent';
  if (score >= 85) return 'Very Good';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Decent';
  if (score >= 60) return 'Needs Work';
  return 'Poor';
}

export function getConversionDescription(potential: QualityScore['conversionPotential']): string {
  const descriptions = {
    exceptional: 'Exceptional - This message is primed to convert. Strong hook, personalization, and clear CTA.',
    high: 'High - Solid message with good conversion potential. Minor optimizations could make it exceptional.',
    medium: 'Medium - Message has potential but needs refinement to maximize response rates.',
    low: 'Low - Significant improvements needed. Focus on hook, personalization, and clear CTA.'
  };
  return descriptions[potential];
}

export function formatScoreBreakdown(score: QualityScore): string {
  return `
SCORE: ${score.overall}/100 (${score.grade}) - ${getQualityLabel(score.overall)}
Conversion Potential: ${score.conversionPotential.toUpperCase()}
Status: ${score.detectedStatus} | Stage: ${score.detectedStage} | Buyer: ${score.detectedBuyerLevel}

FRAMEWORK (Hook-Story-Offer):
- Hook (pattern interrupt): ${score.framework.hook}/100
- Story (transformation): ${score.framework.story}/100  
- Offer (CTA): ${score.framework.offer}/100
- StoryBrand: ${score.framework.storyBrand}/100

SALES INTELLIGENCE:
- Buyer Level (ATL/BTL): ${score.salesIntelligence.buyerLevelAlignment}/100
- Status Alignment: ${score.salesIntelligence.statusAlignment}/100
- Stage Alignment: ${score.salesIntelligence.stageAlignment}/100
- Personality Match: ${score.salesIntelligence.personalityMatch}/100

CRAFT:
- Clarity: ${score.craft.clarity}/100
- Personalization: ${score.craft.personalization}/100
- Elegance: ${score.craft.elegance}/100
- Brevity: ${score.craft.brevity}/100
- Actionability: ${score.craft.actionability}/100
- Writing Style Match: ${score.craft.writingStyleMatch}/100

${score.suggestions.length > 0 ? `SUGGESTIONS:\n${score.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : 'No suggestions - this message is well-crafted.'}
`.trim();
}

