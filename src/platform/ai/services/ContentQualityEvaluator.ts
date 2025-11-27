/**
 * INTELLIGENT CONTENT QUALITY EVALUATOR
 * 
 * Enterprise-grade message evaluation combining best practices from:
 * 
 * FRAMEWORKS:
 * - Russell Brunson's Hook-Story-Offer (enterprise adapted)
 * - Donald Miller's StoryBrand (customer as hero)
 * - Skip Miller's ProActive Selling (ATL/BTL buyer awareness)
 * - Chris Voss's Never Split the Difference (tactical empathy)
 * 
 * ============================================================================
 * RESEARCH-BACKED DATA (with citations):
 * ============================================================================
 * 
 * GONG LABS + 30MPC (85 MILLION cold emails analyzed):
 * - "Offer" CTAs = 4x more effective than "interest-based" CTAs
 * - Asking for meeting in cold email = 44% DECREASE in reply rates
 * - "Interest" CTAs (no meeting ask) = 2x better than other CTAs
 * - ROI claims in cold emails = 15% decrease in success
 * - Single CTA per email = 371% increase in clicks
 * - First-person CTAs ("my" vs "your") = 90% increase in conversions
 * 
 * GONG LABS (300,000+ sales emails):
 * - "Reason for the call" opener = 2.1x success rate
 * - Questions increase reply rates by 50%
 * - Binary choices = 25% higher response
 * - Specific times in CTAs = 20% higher response
 * - "How have you been?" opener = 40% LOWER success
 * 
 * 30 MINUTES TO PRESIDENT'S CLUB:
 * - Multi-touch (10-14 touches/30 days) = 20%+ reply rates
 * - One problem per email = higher clarity
 * - "Problem + Proof + Push" framework
 * - Under 75 words for cold emails
 * 
 * OFFER TYPES (ranked by effectiveness):
 * - Easy: "Pitch the Blind Date" - intro to relevant expert
 * - Medium: Industry benchmarks / case study share
 * - Hard: Personalized analysis / custom report
 * 
 * LAVENDER EMAIL RESEARCH:
 * - Under 100 words = 50%+ response rate
 * - Personalization in first line = 2x response
 * - Grade 5 reading level = optimal engagement
 * - Mobile-first formatting essential
 * 
 * CHRIS VOSS (Never Split the Difference):
 * - Tactical empathy ("It seems like...") builds rapport
 * - "No"-oriented questions increase buy-in
 * - Calibrated questions ("How" and "What") open dialogue
 * 
 * ============================================================================
 * 
 * The goal: Messages that feel like they were written by the best version
 * of the sender - elegant, specific, something they'd LOVE to send.
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
    wowFactor: number;         // Would seller say "I LOVE this!"?
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
    sellerAuthenticity: number;    // Would seller LOVE to send this?
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
  
  // SELLER CONTEXT - Makes messages authentic to the sender
  senderTitle?: string;
  senderExpertise?: string[];           // What the seller knows deeply
  senderTone?: 'professional' | 'casual' | 'consultative' | 'friendly';
  senderValueProp?: string;             // The core value they deliver
  senderCaseStudies?: string[];         // Success stories they can reference
  senderCredentials?: string[];         // Relevant credentials/experience
  companyDifferentiators?: string[];    // What makes their company unique
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
    storyBrand: evaluateStoryBrand(content, context),
    wowFactor: evaluateWowFactor(content, context, contentType)
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
    writingStyleMatch: evaluateWritingStyleMatch(content, context),
    sellerAuthenticity: evaluateSellerAuthenticity(content, context)
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
 * 
 * Russell Brunson: "You have 3 seconds to stop the scroll"
 * 30MPC: "Problem in the first line - make them feel understood"
 * Gong: Opening with the reason for contact = 2.1x success
 * Lavender: Personalization in first line = 2x response
 * 
 * Enterprise hooks that work:
 * - Pattern interrupt (unexpected insight)
 * - Specificity (concrete detail that proves research)  
 * - Curiosity gap (incomplete loop)
 * - Status trigger (peer reference)
 * - Problem acknowledgment (30MPC: they feel understood)
 */
function evaluateHook(content: string, contentType: string, context: EvaluationContext): number {
  let score = 50; // Higher baseline - easier to get a decent hook score
  
  const firstLine = content.split(/[.!?\n]/)[0].toLowerCase().trim();
  const firstTwoSentences = content.split(/[.!?]/).slice(0, 2).join('. ').toLowerCase();
  
  // NAME-FIRST OPENER - Good for personalization (Lavender: 2x response)
  if (context.recipientName) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    if (firstLine.startsWith(firstName)) {
      score += 18; // Starting with name is powerful (Lavender research)
    }
  }
  
  // PATTERN INTERRUPT - Does it break the expected pattern?
  const patternInterrupts = [
    // 30MPC: Observation-based openers
    { pattern: /^(noticed|saw|caught) (your|that|the)/i, points: 22 },
    { pattern: /your (post|article|talk|linkedin|tweet)/i, points: 20 },
    
    // Gong: Direct reason for contact
    { pattern: /^(quick question|curious|wondering)/i, points: 18 },
    { pattern: /reason (i'm|for)/i, points: 15 }, // Gong: 2.1x success rate
    
    // Social proof / congrats opener
    { pattern: /^(congrats|impressive|loved|great)/i, points: 15 },
    
    // Stat-first - very strong
    { pattern: /^\d+%|\$[\d,]+|\d+x/i, points: 25 },
    
    // Quote opener
    { pattern: /^"[^"]+"/i, points: 15 },
    
    // Follow-up openers (appropriate for warm leads)
    { pattern: /circling back|following up/i, points: 12 },
    { pattern: /thanks for|great (call|conversation|meeting)/i, points: 15 },
    
    // Chris Voss: Tactical empathy opener
    { pattern: /it (seems|sounds|looks) like/i, points: 18 },
    
    // 30MPC: Trigger event openers
    { pattern: /just (raised|closed|announced|hired|launched)/i, points: 20 },
    { pattern: /series [a-d]|funding|ipo/i, points: 18 },
  ];
  
  for (const { pattern, points } of patternInterrupts) {
    if (pattern.test(firstLine) || pattern.test(firstTwoSentences)) {
      score += points;
      break;
    }
  }
  
  // SPECIFICITY - Concrete details signal research (30MPC: "Prove you did homework")
  if (context.recipientCompany && firstTwoSentences.includes(context.recipientCompany.toLowerCase())) {
    score += 15;
  }
  if (context.recentNews && firstTwoSentences.includes(context.recentNews.substring(0, 15).toLowerCase())) {
    score += 15;
  }
  
  // WEAK HOOKS - Penalties (Gong: "How have you been?" = 40% lower success)
  const weakHooks = [
    'i hope this', 'i wanted to', 'i am writing', 'my name is',
    'i\'m reaching out', 'i\'d like to', 'our company', 'we are a',
    'how have you been', 'hope you\'re doing well', 'how are you'
  ];
  if (weakHooks.some(weak => firstLine.includes(weak))) {
    score -= 25;
  }
  
  // Short, punchy first line is better (Lavender: shorter = better)
  const firstLineWords = firstLine.split(/\s+/).length;
  if (firstLineWords <= 10) score += 10;
  else if (firstLineWords <= 15) score += 5;
  else if (firstLineWords > 20) score -= 8;
  
  // Question hooks are powerful (Gong: 50% higher reply rate)
  if (firstLine.includes('?')) score += 12;
  
  // LINKEDIN BONUS: Connection-style hooks work great
  if (contentType === 'linkedin') {
    const linkedInHooks = ['saw', 'noticed', 'your', 'congrats', 'impressive', 'love your'];
    if (linkedInHooks.some(h => firstLine.includes(h))) {
      score += 10; // Extra bonus for LinkedIn-appropriate hooks
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * STORY EVALUATION
 * Russell Brunson's "Epiphany Bridge" - enterprise adapted
 * 
 * IMPORTANT: Not all content needs a full story!
 * - Cold emails: Short proof/result is enough
 * - LinkedIn: No story needed at all
 * - Follow-ups: Reference prior conversation
 * 
 * Great enterprise stories:
 * - Transformation narrative (before → after)
 * - Social proof through narrative (not just claims)
 * - Emotional resonance with business impact
 */
function evaluateStory(content: string, context: EvaluationContext): number {
  // High baseline - most messages don't NEED a full story
  let score = 70;
  const lower = content.toLowerCase();
  const wordCount = content.split(/\s+/).length;
  
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
  
  // SHORT CONTENT BONUS: Under 60 words doesn't need a full story
  // A quick proof/result mention is perfect for cold outreach
  if (wordCount < 60) {
    // For short content, having ANY proof is great
    const hasAnyProof = storyProofPatterns.some(p => p.test(content)) || 
                        /\d+%|\$[\d,]+k?|\d+\s*(hours|days)/.test(content);
    if (hasAnyProof) {
      score = Math.max(score, 85); // Minimum 85 for short content with proof
    } else {
      score = Math.max(score, 70); // Still decent without story
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * OFFER EVALUATION
 * 
 * CRITICAL RESEARCH (Gong + 30MPC - 85 MILLION emails):
 * - "Offer" CTAs = 4x more effective than "interest-based" CTAs
 * - Asking for meeting in COLD email = 44% DECREASE in replies
 * - "Interest" CTAs (no meeting ask) = 2x better for cold
 * - Single CTA = 371% more clicks
 * - First-person ("my" vs "your") = 90% more conversions
 * - Questions increase reply rates 50%
 * - Binary choices = 25% higher response
 * - Specific times = 20% higher response
 * 
 * OFFER TYPES (from 30MPC research):
 * - Easy: "Pitch the Blind Date" - intro to relevant expert
 * - Medium: Industry benchmarks / case study share  
 * - Hard: Personalized analysis / custom report
 * 
 * Chris Voss: "No"-oriented questions for buy-in
 */
function evaluateOffer(content: string, stage: OpportunityStage, context: EvaluationContext): number {
  let score = 55;
  const lower = content.toLowerCase();
  const isColdOutreach = stage === 'QUALIFICATION' || context.status === 'LEAD';
  
  // =========================================================================
  // OFFER TYPE DETECTION (30MPC research - 4x more effective than interest)
  // =========================================================================
  
  // HARD OFFER: Personalized analysis/report (most valuable)
  const hardOffers = [
    'compiled a report', 'prepared an analysis', 'put together',
    'customized', 'specific to', 'for your', 'based on your',
    'personalized', 'tailored'
  ];
  if (hardOffers.some(o => lower.includes(o))) {
    score += 20; // 4x effectiveness
  }
  
  // MEDIUM OFFER: Case study / benchmark share
  const mediumOffers = [
    'case study', 'benchmark', 'how .* compares', 'similar companies',
    'companies like', 'industry data', 'share how', 'show you how',
    'helped .* achieve', 'helped .* reduce', 'helped .* save'
  ];
  if (mediumOffers.some(o => {
    if (o.includes('.*')) return new RegExp(o, 'i').test(lower);
    return lower.includes(o);
  })) {
    score += 15;
  }
  
  // EASY OFFER: Intro to expert ("Pitch the Blind Date")
  const easyOffers = [
    'introduce you to', 'connect you with', 'intro to',
    'our .* expert', 'our .* specialist', 'quick intro',
    'happy to share', 'can share', 'share the technical details'
  ];
  if (easyOffers.some(o => {
    if (o.includes('.*')) return new RegExp(o, 'i').test(lower);
    return lower.includes(o);
  })) {
    score += 12;
  }
  
  // =========================================================================
  // CTA TYPE SCORING (based on Gong 300K email research)
  // =========================================================================
  
  // COLD OUTREACH: Penalize direct meeting asks (44% lower response!)
  const directMeetingAsk = ['schedule a call', 'book a meeting', 'set up a time',
                            'schedule a demo', 'book time', 'get on a call'];
  if (isColdOutreach && directMeetingAsk.some(d => lower.includes(d))) {
    score -= 10; // Gong: 44% lower response
  }
  
  // INTEREST-BASED CTAs (2x better for cold - Gong)
  const interestBased = [
    'is this a priority', 'is this on your radar', 'does this resonate',
    'sound interesting', 'worth exploring', 'make sense to explore',
    'open to exploring', 'worth a conversation', 'worth connecting',
    'worth a quick', 'make sense to', 'interested in learning',
    'curious if', 'still open to'
  ];
  if (interestBased.some(i => lower.includes(i))) {
    score += 15;
  }
  
  // LOW FRICTION CTAs (40%+ higher response)
  const lowFriction = [
    { pattern: '15 minutes', points: 15 },
    { pattern: '15-minute', points: 15 },
    { pattern: '15 min', points: 15 },
    { pattern: 'quick call', points: 12 },
    { pattern: 'brief chat', points: 12 },
    { pattern: 'exchange approaches', points: 12 },
    { pattern: 'worth connecting', points: 12 },
  ];
  for (const { pattern, points } of lowFriction) {
    if (lower.includes(pattern)) {
      score += points;
      break;
    }
  }
  
  // CHRIS VOSS: "No"-oriented questions (powerful for buy-in)
  const noOriented = [
    'would it be crazy', 'would it be ridiculous',
    'is now a bad time', 'would it be wrong', 'have you given up on'
  ];
  if (noOriented.some(n => lower.includes(n))) {
    score += 10;
  }
  
  // =========================================================================
  // QUESTION & CHOICE OPTIMIZATION (Gong research)
  // =========================================================================
  
  // QUESTIONS: 50% higher reply rate
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount === 0) {
    score -= 15; // Major penalty
  } else if (questionCount === 1) {
    score += 15; // Single CTA = 371% more clicks
  } else if (questionCount === 2) {
    score += 10;
  }
  
  // BINARY CHOICE: 25% higher response
  const hasBinaryChoice = (lower.includes(' or ') && questionCount > 0) ||
    /tuesday.*thursday|thursday.*tuesday|monday.*wednesday/i.test(lower) ||
    /this week.*next week|next week.*this week/i.test(lower) ||
    /2pm.*10am|10am.*2pm|morning.*afternoon/i.test(lower);
  if (hasBinaryChoice) {
    score += 12;
  }
  
  // SPECIFIC TIME: 20% higher response
  const timeSpecific = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'this week', 'next week', 'tomorrow', '2pm', '2 pm', '10am', '10 am',
    'afternoon', 'morning'].some(d => lower.includes(d));
  if (timeSpecific) score += 10;
  
  // RISK REVERSAL (30MPC: give them an out)
  const riskReversal = ['no commitment', 'no obligation', 'just to explore',
    'see if it makes sense', 'no pressure', 'either way', 'if not'];
  if (riskReversal.some(r => lower.includes(r))) {
    score += 6;
  }
  
  // LINKEDIN-SPECIFIC CTAs (different from email)
  // LinkedIn works best with connection-focused asks, not meeting asks
  const linkedInCTAs = ['open to connecting', 'worth connecting', 'happy to connect',
                        'connect with you', 'add you', 'let\'s connect'];
  if (linkedInCTAs.some(c => lower.includes(c))) {
    score += 12; // LinkedIn-appropriate CTA
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
  let score = 40; // Higher baseline - StoryBrand principles should be easier to achieve
  const lower = content.toLowerCase();
  
  // HERO - Is the message about them? (count "you" vs "we/I")
  const youCount = (lower.match(/\byou\b|\byour\b/g) || []).length;
  const weCount = (lower.match(/\bwe\b|\bour\b|\bi\b/g) || []).length;
  
  // More generous you/we scoring
  if (youCount > 0 && youCount >= weCount) score += 15;
  if (youCount > weCount) score += 10; // Extra bonus
  
  // Company name usage counts as hero focus
  if (context.recipientCompany && lower.includes(context.recipientCompany.toLowerCase())) {
    score += 8;
  }
  
  // PROBLEM - Pain point acknowledged
  const problemIndicators = [
    'challenge', 'struggling', 'difficult', 'pain', 'problem',
    'frustrated', 'time-consuming', 'costly', 'complex', 'overwhelming',
    'bottleneck', 'roadblock', 'wall', 'scramble', 'drowning', 'eating',
    'hidden costs', 'hours', 'weekly', 'annual'
  ];
  if (problemIndicators.some(p => lower.includes(p))) score += 10;
  if (context.recipientPainPoints?.some(p => lower.includes(p.toLowerCase()))) score += 6;
  
  // GUIDE - Empathy + Authority
  const empathy = ['understand', 'know how', 'been there', 'hear you', 'makes sense', 'similar', 'same situation', 'same'];
  const authority = ['helped', 'worked with', 'experience', 'companies like', 'proven', 'results', 'achieved', 'confident'];
  
  if (empathy.some(e => lower.includes(e))) score += 6;
  if (authority.some(a => lower.includes(a))) score += 8;
  
  // PLAN - Clear path
  const planIndicators = ['here\'s how', 'simple', 'step', 'process', 'approach', 'path', 'proposal', 'show', 'based on', 'recap'];
  if (planIndicators.some(p => lower.includes(p))) score += 6;
  
  // CTA - Has ask
  if (content.includes('?')) score += 6;
  
  // SUCCESS - Transformation vision
  const successIndicators = [
    'imagine', 'picture', 'result', 'outcome', 'achieve',
    'success', 'growth', 'improvement', 'transformation',
    'roi', 'saving', 'saved', 'cut', 'eliminate', 'streamline',
    'reduction', 'deliver', 'similar roi'
  ];
  if (successIndicators.some(s => lower.includes(s))) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * WOW FACTOR EVALUATION
 * 
 * The ultimate test: Would the seller say "I LOVE this! I want to send this!"?
 * 
 * WOW messages have:
 * - Unexpected insight (shows they know something special)
 * - Clever observation (intelligence, not just templates)
 * - Peer-to-peer tone (not salesy or robotic)
 * - Irresistible specificity (couldn't be sent to anyone else)
 * - Natural flow (reads like a text to a friend, but professional)
 * - Value-first approach (gives before asking)
 * - Easy "yes" (low friction, high appeal)
 * - Memorable opening (would stand out in inbox)
 * 
 * This is the difference between "good" and "EXCEPTIONAL"
 */
function evaluateWowFactor(content: string, context: EvaluationContext, contentType: ContentType): number {
  let score = 50; // Start neutral
  const lower = content.toLowerCase();
  const firstLine = content.split(/[.!?\n]/)[0].toLowerCase().trim();
  
  // =========================================================================
  // UNEXPECTED INSIGHT (Shows seller knows something special)
  // =========================================================================
  
  // Specific observation about them (not generic)
  if (context.recipientName && context.recipientCompany) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    const company = context.recipientCompany.toLowerCase();
    
    // Name + company in first 2 sentences = highly personalized
    const firstTwo = content.split(/[.!?]/).slice(0, 2).join(' ').toLowerCase();
    if (firstTwo.includes(firstName) && firstTwo.includes(company)) {
      score += 15;
    }
  }
  
  // References something specific they did/said
  const insightSignals = [
    'your post', 'your article', 'your talk', 'your linkedin',
    'i noticed', 'i saw', 'caught my eye', 'impressive',
    'your recent', 'your approach', 'the way you'
  ];
  if (insightSignals.some(s => lower.includes(s))) {
    score += 12;
  }
  
  // References trigger event (funding, hire, launch)
  const triggerEvents = [
    'series', 'funding', 'raised', 'hired', 'launched',
    'announced', 'expanded', 'new role', 'congrats'
  ];
  if (triggerEvents.some(t => lower.includes(t))) {
    score += 10;
  }
  
  // =========================================================================
  // CLEVER/MEMORABLE (Not generic, shows intelligence)
  // =========================================================================
  
  // Specific numbers/stats (shows real research)
  if (/\d+%|\d+x|\$[\d,]+k?|[\d,]+ hours|[\d,]+ days/.test(content)) {
    score += 10;
  }
  
  // Named company reference (social proof with specificity)
  const namedCompanies = ['notion', 'stripe', 'figma', 'google', 'microsoft', 
                          'amazon', 'salesforce', 'hubspot', 'slack', 'zoom'];
  if (namedCompanies.some(c => lower.includes(c)) && context.recipientCompany?.toLowerCase() !== 'notion') {
    score += 8;
  }
  
  // Transformation with specifics (not vague)
  if (/went from .* to|reduced .* by|cut .* to|saved .* hours|from .* to under/.test(lower)) {
    score += 10;
  }
  
  // =========================================================================
  // PEER-TO-PEER TONE (Not salesy, sounds like a real person)
  // =========================================================================
  
  // Conversational openers (vs corporate)
  const peerOpeners = [
    'noticed', 'curious', 'quick thought', 'wondering',
    'between us', 'off the record', 'real talk'
  ];
  if (peerOpeners.some(p => firstLine.includes(p))) {
    score += 8;
  }
  
  // Uses contractions (human, not robot)
  const contractions = (content.match(/\b(i'm|you're|we're|don't|can't|it's|that's|here's|let's)\b/gi) || []).length;
  if (contractions >= 1) score += 5;
  
  // Penalize overly formal/corporate language
  const corporate = [
    'per my', 'as per', 'pursuant to', 'please be advised',
    'at your earliest convenience', 'please do not hesitate',
    'i am writing to inform', 'this email is to'
  ];
  if (corporate.some(c => lower.includes(c))) {
    score -= 15;
  }
  
  // =========================================================================
  // VALUE-FIRST (Gives before asking)
  // =========================================================================
  
  // Offers to share something valuable
  const valueOffers = [
    'happy to share', 'can share', 'share the',
    'put together', 'compiled', 'show you how',
    'case study', 'benchmark', 'report', 'analysis'
  ];
  if (valueOffers.some(v => lower.includes(v))) {
    score += 10;
  }
  
  // Makes them look smart if they respond (peer exchange)
  const peerExchange = [
    'exchange', 'compare notes', 'share approaches',
    'curious how you', 'your take on', 'interested in your perspective'
  ];
  if (peerExchange.some(p => lower.includes(p))) {
    score += 8;
  }
  
  // =========================================================================
  // EASY YES (Low friction, high appeal)
  // =========================================================================
  
  // Soft ask (not demanding)
  const softAsks = [
    'worth', 'make sense', 'interested in', 'open to',
    'curious if', 'worth connecting'
  ];
  if (softAsks.some(s => lower.includes(s))) {
    score += 6;
  }
  
  // Low time commitment
  if (lower.includes('15 min') || lower.includes('quick') || lower.includes('brief')) {
    score += 5;
  }
  
  // =========================================================================
  // PENALTIES (Things that make sellers cringe)
  // =========================================================================
  
  // Generic openers (seller would be embarrassed)
  const cringeOpeners = [
    'i hope this finds you well', 'i wanted to reach out',
    'i am writing to', 'my name is', 'we are a',
    'our company', 'i\'d like to introduce'
  ];
  if (cringeOpeners.some(c => firstLine.includes(c))) {
    score -= 20;
  }
  
  // Pushy/desperate language
  const pushy = [
    'act now', 'limited time', 'don\'t miss', 'last chance',
    'urgent', 'asap', 'immediately'
  ];
  if (pushy.some(p => lower.includes(p))) {
    score -= 10;
  }
  
  // Over-enthusiastic (feels fake)
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    score -= (exclamationCount - 2) * 5;
  }
  
  // Too long (seller knows short = better)
  const wordCount = content.split(/\s+/).length;
  if (contentType === 'email' && wordCount > 100) {
    score -= Math.min((wordCount - 100) / 10, 15);
  }
  if (contentType === 'linkedin' && wordCount > 75) {
    score -= Math.min((wordCount - 75) / 5, 15);
  }
  if (contentType === 'text' && wordCount > 40) {
    score -= Math.min((wordCount - 40) / 3, 20);
  }
  
  // CHANNEL-SPECIFIC WOW BONUSES
  if (contentType === 'linkedin') {
    // LinkedIn WOW: Connection-worthy, peer-to-peer feel
    const linkedInWow = ['open to connecting', 'worth connecting', 'exchange approaches',
                         'curious if', 'noticed your', 'your approach'];
    if (linkedInWow.some(w => lower.includes(w))) {
      score += 10;
    }
  }
  
  if (contentType === 'text') {
    // Text WOW: Quick, punchy, direct
    if (wordCount <= 30 && content.includes('?')) {
      score += 15; // Short text with question = WOW
    }
  }
  
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
 * 
 * Sophisticated without being stuffy
 * Confident without being arrogant
 * Clear without being simplistic
 * 
 * Chris Voss: Tactical empathy adds elegance
 * 30MPC: "Sound like a peer, not a salesperson"
 * Lavender: Grade 5 reading level = optimal
 */
function evaluateElegance(content: string): number {
  let score = 75; // Higher baseline - most business writing is decent
  const lower = content.toLowerCase();
  
  // FILLER WORDS (penalize)
  const fillers = ['just', 'really', 'very', 'actually', 'basically', 'literally',
                   'honestly', 'simply', 'definitely', 'absolutely', 'totally'];
  const fillerCount = fillers.filter(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    return regex.test(content);
  }).length;
  score -= fillerCount * 5;
  
  // WEAK LANGUAGE (penalize)
  const weakPhrases = ['i think', 'i believe', 'i feel', 'maybe', 'perhaps',
                       'sort of', 'kind of', 'a little bit', 'in my opinion'];
  const weakCount = weakPhrases.filter(w => lower.includes(w)).length;
  score -= weakCount * 6;
  
  // APOLOGETIC LANGUAGE (penalize - 30MPC: "Never apologize for reaching out")
  const apologetic = ['sorry to bother', 'sorry for', 'apologize for', 
                      'hate to ask', 'don\'t mean to', 'i know you\'re busy'];
  if (apologetic.some(a => lower.includes(a))) score -= 15;
  
  // CHRIS VOSS: Tactical empathy phrases (reward)
  const tacticalEmpathy = [
    'it seems like', 'it sounds like', 'it looks like',
    'i sense that', 'it appears',
    'what i\'m hearing', 'correct me if i\'m wrong'
  ];
  if (tacticalEmpathy.some(t => lower.includes(t))) score += 10;
  
  // STRONG VERBS (reward)
  const strongVerbs = ['transform', 'accelerate', 'eliminate', 'streamline',
                       'optimize', 'empower', 'enable', 'drive', 'achieve', 'deliver',
                       'solve', 'cut', 'reduce', 'increase', 'boost'];
  const strongCount = strongVerbs.filter(v => lower.includes(v)).length;
  score += Math.min(strongCount * 4, 15);
  
  // CONFIDENT LANGUAGE (reward)
  const confident = ['will', 'can', 'proven', 'results', 'demonstrated', 'track record', 'confident'];
  const confidentCount = confident.filter(c => lower.includes(c)).length;
  score += Math.min(confidentCount * 3, 12);
  
  // PEER LANGUAGE (30MPC: "Sound like a peer") - reward
  const peerLanguage = ['between us', 'off the record', 'candidly', 'honestly speaking',
                        'real talk', 'happy to share', 'exchange'];
  if (peerLanguage.some(p => lower.includes(p))) score += 6;
  
  // CONCISE STRUCTURE (reward)
  const paragraphs = content.split(/\n\n+/);
  if (paragraphs.length >= 2 && paragraphs.length <= 4) score += 8;
  
  // Single line paragraphs (good formatting - 30MPC)
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const shortLines = lines.filter(l => l.split(/\s+/).length <= 15).length;
  if (shortLines / lines.length > 0.7) score += 5;
  
  // No excessive punctuation
  if ((content.match(/!!/g) || []).length > 0) score -= 10;
  if ((content.match(/\.\.\./g) || []).length > 1) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * BREVITY EVALUATION
 * 
 * Research-backed optimal word counts:
 * 
 * Gong Research:
 * - 25-50 words = highest cold email response rates
 * - Sweet spot for B2B: 50-75 words
 * 
 * Lavender Research:
 * - Under 100 words = 50%+ response rate
 * - 25-50 words for cold = optimal
 * 
 * 30MPC:
 * - Under 75 words for cold outreach
 * - "If it looks long, it won't get read"
 * - One sentence = one line formatting
 */
function evaluateBrevity(content: string, contentType: ContentType): number {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  // ==========================================================================
  // RESEARCH-BACKED OPTIMAL WORD COUNTS BY CHANNEL
  // ==========================================================================
  // 
  // EMAIL (Gong + Lavender + 30MPC research):
  //   - 25-50 words = highest cold email response rates (Gong)
  //   - Under 75 words for cold (30MPC)
  //   - Under 100 words = 50%+ response rate (Lavender)
  //
  // LINKEDIN (Connection request research):
  //   - Under 50 words = optimal for connection acceptance
  //   - 20-40 words = sweet spot
  //   - Keep it conversational, not salesy
  //
  // TEXT (SMS/iMessage best practices):
  //   - Under 160 characters (1 SMS) is ideal
  //   - ~25-35 words max
  //   - Ultra-direct, one clear point
  //
  const ranges: Record<ContentType, { min: number; ideal: number; max: number }> = {
    email: { min: 20, ideal: 50, max: 80 },      // 20 word follow-ups are fine!
    linkedin: { min: 12, ideal: 30, max: 55 },   // Shorter for LinkedIn
    text: { min: 8, ideal: 18, max: 32 },        // Very short for texts
    advice: { min: 75, ideal: 150, max: 250 },
    general: { min: 30, ideal: 60, max: 100 }
  };
  
  const range = ranges[contentType];
  
  // Calculate base score based on word count
  // RESEARCH: Shorter is almost always better (Lavender, Gong)
  let score: number;
  if (wordCount >= range.min && wordCount <= range.max) {
    // In optimal range - great!
    const deviation = Math.abs(wordCount - range.ideal);
    const maxDeviation = Math.max(range.ideal - range.min, range.max - range.ideal);
    score = Math.round(100 - (deviation / maxDeviation) * 20); // Reduced penalty
  } else if (wordCount < range.min) {
    // Under minimum - still pretty good! Short is usually fine
    score = Math.max(70, 90 - (range.min - wordCount) * 2); // More generous for short
  } else {
    // Over maximum - this is the real problem (Gong: long emails hurt)
    score = Math.max(25, 80 - (wordCount - range.max) * 2); // Steeper penalty for long
  }
  
  // BONUS: One sentence = one line structure (30MPC)
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // If roughly one sentence per line (good mobile formatting)
  if (lines.length >= sentences.length * 0.7 && contentType !== 'advice') {
    score += 5;
  }
  
  // PENALTY: Wall of text (no paragraph breaks)
  if (wordCount > 60 && !content.includes('\n\n') && contentType !== 'text') {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function evaluateActionability(content: string, stage: OpportunityStage): number {
  let score = 50; // Higher baseline
  const lower = content.toLowerCase();
  
  // Has a question - Gong: questions increase reply rates by 50%
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount === 1) score += 22; // One clear ask = ideal (30MPC)
  else if (questionCount === 2) score += 20;
  else if (questionCount > 2) score += 15;
  else score -= 15; // No question = major weakness
  
  // Specific time reference - Gong: 20% higher response
  const timeRefs = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday',
                    'this week', 'next week', 'tomorrow', '15 minutes', '30 minutes',
                    '2pm', '2 pm', '10am', '10 am', 'afternoon', 'morning'];
  if (timeRefs.some(t => lower.includes(t))) score += 12;
  
  // Binary choice - Gong: 25% higher response
  const hasBinaryChoice = (lower.includes(' or ') && questionCount > 0);
  if (hasBinaryChoice) score += 12;
  
  // Direct ask patterns
  const directAsks = ['would you', 'can we', 'shall i', 'should i', 'would it', 'could we', 'are you'];
  if (directAsks.some(d => lower.includes(d))) score += 10;
  
  // Interest-based asks (30MPC + Gong: these convert well)
  const interestAsks = [
    'worth connecting', 'worth a', 'worth exploring',
    'make sense to', 'open to', 'interested in',
    'still open', 'still interested'
  ];
  if (interestAsks.some(i => lower.includes(i))) score += 12;
  
  // Stage-appropriate language
  if (stage === 'CLOSING' || stage === 'NEGOTIATION') {
    if (lower.includes('ready') || lower.includes('move forward') || lower.includes('finalize')) score += 8;
  }
  if (stage === 'PROPOSAL') {
    if (lower.includes('proposal') || lower.includes('walk through') || lower.includes('loop in')) score += 8;
  }
  if (stage === 'DISCOVERY' || stage === 'QUALIFICATION') {
    if (lower.includes('explore') || lower.includes('discuss') || lower.includes('learn')) score += 6;
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

/**
 * SELLER AUTHENTICITY SCORING
 * 
 * Key question: Would the seller LOVE to send this message?
 * 
 * Authentic messages:
 * - Sound human, not robotic or templated
 * - Reflect the seller's expertise and value prop
 * - Are confident but not arrogant
 * - Feel natural to read aloud
 * - Don't use corporate buzzwords or filler
 * - Show genuine curiosity about the buyer
 * 
 * This scoring ensures AI-generated content doesn't
 * feel like "AI slop" - generic, hollow, or fake.
 */
function evaluateSellerAuthenticity(content: string, context: EvaluationContext): number {
  let score = 70; // Start with decent baseline
  const lower = content.toLowerCase();
  
  // =========================================================================
  // PENALIZE AI-SOUNDING / ROBOTIC PATTERNS
  // =========================================================================
  
  // Generic AI phrases that feel hollow
  const aiSlop = [
    'i wanted to reach out', 'i hope this email finds you',
    'i am writing to', 'please do not hesitate',
    'at your earliest convenience', 'as per our conversation',
    'moving forward', 'circle back', 'touch base',
    'leverage', 'synergy', 'paradigm', 'holistic',
    'delighted to', 'thrilled to connect', 'excited to announce',
    'game-changing', 'revolutionary', 'cutting-edge',
    'best-in-class', 'world-class', 'industry-leading'
  ];
  const aiSlopCount = aiSlop.filter(p => lower.includes(p)).length;
  score -= aiSlopCount * 8;
  
  // Over-enthusiastic punctuation (feels fake)
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 2) score -= (exclamationCount - 2) * 5;
  
  // =========================================================================
  // REWARD AUTHENTIC HUMAN PATTERNS
  // =========================================================================
  
  // Conversational tone (sounds real)
  const conversational = [
    'noticed', 'saw', 'caught', 'curious',
    'quick question', 'wondering if',
    'makes sense', 'here\'s the thing',
    'between us', 'candidly', 'honestly'
  ];
  const conversationalCount = conversational.filter(c => lower.includes(c)).length;
  score += conversationalCount * 4;
  
  // Specificity (shows real research, not template)
  if (context.recipientCompany && lower.includes(context.recipientCompany.toLowerCase())) {
    score += 8;
  }
  if (context.recipientName) {
    const firstName = context.recipientName.split(' ')[0].toLowerCase();
    if (lower.includes(firstName)) score += 5;
  }
  if (context.recentNews && lower.includes(context.recentNews.substring(0, 10).toLowerCase())) {
    score += 8;
  }
  
  // Seller's expertise showing through
  if (context.senderExpertise?.some(e => lower.includes(e.toLowerCase()))) {
    score += 10;
  }
  if (context.senderValueProp && lower.includes(context.senderValueProp.toLowerCase().substring(0, 15))) {
    score += 8;
  }
  if (context.senderCaseStudies?.some(cs => lower.includes(cs.toLowerCase().substring(0, 10)))) {
    score += 10;
  }
  
  // =========================================================================
  // NATURAL FLOW CHECK
  // =========================================================================
  
  // Short sentences feel more natural (12-18 words avg is conversational)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordCount = content.split(/\s+/).length / Math.max(sentences.length, 1);
  if (avgWordCount <= 15) score += 8;
  else if (avgWordCount <= 20) score += 4;
  else if (avgWordCount > 25) score -= 8;
  
  // Contractions feel more human
  const contractions = ['i\'m', 'you\'re', 'we\'re', 'don\'t', 'can\'t', 'won\'t', 
                        'it\'s', 'that\'s', 'here\'s', 'let\'s'];
  if (contractions.some(c => lower.includes(c))) score += 5;
  
  // Questions show genuine curiosity
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount >= 1 && questionCount <= 2) score += 5;
  
  // =========================================================================
  // CONFIDENCE WITHOUT ARROGANCE
  // =========================================================================
  
  // Confident language (seller would be proud)
  const confident = ['helped', 'achieved', 'delivered', 'reduced', 'increased',
                     'saved', 'proven', 'track record', 'results'];
  const confidentCount = confident.filter(c => lower.includes(c)).length;
  score += Math.min(confidentCount * 3, 12);
  
  // Penalize bragging/over-claiming
  const bragging = ['#1', 'best in the world', 'guaranteed', 'always', 'never fails',
                    'everyone', 'nobody else'];
  if (bragging.some(b => lower.includes(b))) score -= 10;
  
  return Math.max(0, Math.min(100, score));
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
  // ==========================================================================
  // CHANNEL-SPECIFIC SCORING
  // Each channel has different requirements and expectations
  // ==========================================================================
  
  if (contentType === 'text') {
    // TEXT MESSAGES: Ultra-short, direct, no story needed
    // Research: SMS = 160 chars, conversational, immediate value
    return Math.round(
      framework.hook * 0.15 +          // Quick attention grab
      craft.clarity * 0.25 +           // Must be instantly clear
      craft.brevity * 0.30 +           // Under 40 words ideal
      craft.actionability * 0.20 +     // Clear next step
      craft.personalization * 0.10     // Name reference helps
    );
  }
  
  if (contentType === 'linkedin') {
    // LINKEDIN: Short, peer-to-peer, NO STORY NEEDED
    // Research: LinkedIn = 50-75 words, connection request feel
    // Key: Hook + Reason + Soft Ask (no narrative required)
    return Math.round(
      framework.hook * 0.30 +           // Opening line is EVERYTHING
      framework.offer * 0.25 +          // Clear but soft CTA
      framework.wowFactor * 0.20 +      // Would they accept/reply?
      craft.personalization * 0.15 +    // Shows you know them
      craft.brevity * 0.10              // Keep it short
      // NOTE: No story weight - LinkedIn doesn't need transformation narratives
    );
  }
  
  if (contentType === 'advice') {
    // ADVICE: Clarity and actionability over everything
    return Math.round(
      craft.clarity * 0.30 +
      craft.actionability * 0.25 +
      framework.storyBrand * 0.15 +     // Guide structure helps
      craft.personalization * 0.15 +
      craft.elegance * 0.15
    );
  }
  
  // ==========================================================================
  // EMAIL: Full framework evaluation
  // Cold emails can have short "proof" but don't require full story
  // ==========================================================================
  
  // Framework weights (Russell Brunson adapted for B2B)
  const frameworkWeight = 0.30;
  const frameworkScore = (
    framework.hook * 0.30 +      // Hook is critical for inbox standout
    framework.story * 0.10 +     // REDUCED - short proof is fine, not full narrative
    framework.offer * 0.30 +     // CTA is crucial (Gong: single CTA = 371% more clicks)
    framework.storyBrand * 0.05 + // Light touch - hero focus matters
    framework.wowFactor * 0.25   // Would seller LOVE this?
  );
  
  // Sales intelligence weights (Skip Miller)
  const salesWeight = 0.15;       // REDUCED - good messaging matters more than perfect alignment
  const salesScore = (
    salesIntelligence.buyerLevelAlignment * 0.30 +
    salesIntelligence.statusAlignment * 0.25 +
    salesIntelligence.stageAlignment * 0.25 +
    salesIntelligence.personalityMatch * 0.20
  );
  
  // Craft weights - THE MAIN EVENT
  const craftWeight = 0.55;       // INCREASED - execution matters most
  const craftScore = (
    craft.clarity * 0.12 +
    craft.personalization * 0.25 +    // Personalization is key (Lavender: 2x response)
    craft.elegance * 0.10 +
    craft.brevity * 0.15 +            // INCREASED - short = better (Gong data)
    craft.actionability * 0.15 +      // INCREASED - must have clear CTA
    craft.writingStyleMatch * 0.08 +
    craft.sellerAuthenticity * 0.15   // Would seller LOVE to send this?
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
  const lower = content.toLowerCase();
  
  // Hook suggestions (30MPC: "The first line determines if they read more")
  if (framework.hook < 70) {
    if (context.recipientName) {
      suggestions.push(`30MPC tip: Start with "${context.recipientName.split(' ')[0]} - [observation about them]" to pattern interrupt`);
    } else {
      suggestions.push('30MPC: Lead with an observation, trigger event, or stat - not "I hope this finds you well"');
    }
  }
  
  // Personalization (Lavender: 2x response with first-line personalization)
  if (craft.personalization < 70) {
    if (context.recipientName && !lower.includes(context.recipientName.split(' ')[0].toLowerCase())) {
      suggestions.push(`Lavender data: Using ${context.recipientName.split(' ')[0]}'s name = 2x higher response`);
    }
    if (context.recipientCompany && !lower.includes(context.recipientCompany.toLowerCase())) {
      suggestions.push(`Reference ${context.recipientCompany} - proves you did homework (30MPC)`);
    }
  }
  
  // Story/narrative (30MPC: "Problem + Proof + Push")
  if (framework.story < 60) {
    suggestions.push('30MPC framework: Add "Proof" - "We helped [similar company] achieve [specific result]"');
  }
  
  // Offer/CTA (Gong research-backed)
  if (framework.offer < 70) {
    if (!content.includes('?')) {
      suggestions.push('Gong data: Questions increase reply rates 50% - end with a clear question');
    }
    if (stage === 'QUALIFICATION' || stage === 'DISCOVERY') {
      suggestions.push('Gong: Interest-based CTAs work best - "Is this a priority for you right now?"');
    } else {
      suggestions.push('Gong: Specific times + binary choice = 45% higher response - "Thursday at 2pm or Friday at 10am?"');
    }
  }
  
  // Buyer level (Skip Miller)
  if (salesIntelligence.buyerLevelAlignment < 70) {
    if (buyerLevel === 'ATL') {
      suggestions.push('Skip Miller ATL: Executives care about outcomes, not features - lead with ROI/strategic impact');
    } else {
      suggestions.push('Skip Miller BTL: Evaluators need details - include implementation specifics and technical proof');
    }
  }
  
  // Elegance (Chris Voss + 30MPC)
  if (craft.elegance < 70) {
    if (lower.includes('sorry') || lower.includes('apologize') || lower.includes('bother')) {
      suggestions.push('30MPC: Never apologize for reaching out - remove "sorry to bother" language');
    } else {
      suggestions.push('Chris Voss: Add tactical empathy - "It seems like [their challenge]..." shows you understand');
    }
  }
  
  // Brevity (Lavender + Gong data)
  if (craft.brevity < 65) {
    const ideal = contentType === 'email' ? 65 : contentType === 'linkedin' ? 45 : 75;
    if (wordCount > ideal * 1.4) {
      suggestions.push(`Lavender: Under ${ideal} words = 50%+ response (currently ${wordCount}). Cut ruthlessly.`);
    }
    if (!content.includes('\n\n') && wordCount > 50) {
      suggestions.push('30MPC: Break into short paragraphs - walls of text don\'t get read on mobile');
    }
  }
  
  // No question = major issue
  if (!content.includes('?')) {
    suggestions.push('CRITICAL (Gong): Add a question - emails with questions get 50% more replies');
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
- WOW Factor: ${score.framework.wowFactor}/100

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
- Seller Authenticity: ${score.craft.sellerAuthenticity}/100

${score.suggestions.length > 0 ? `SUGGESTIONS:\n${score.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : 'No suggestions - this message is well-crafted.'}
`.trim();
}

