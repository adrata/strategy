/**
 * AI-POWERED PERSON INTELLIGENCE
 * 
 * Uses Claude API to generate deep insights into people's wants and pains
 * Following 2025 best practices: Pure functions, type-safe, composable
 * 
 * Provides:
 * - Wants & desires analysis (career aspirations, goals, motivations)
 * - Pains & challenges analysis (frustrations, obstacles, pressures)
 * - Outreach strategy (personalized approach, messaging, timing)
 */

import type { APIClients } from '../types/api-clients';
import type { PDLEnrichedPerson } from '../providers/pdl-service';
import type { MultiSourceEmployeeProfile } from '../providers/coresignal-multisource';
import type { SalesIntentSignal } from '../providers/coresignal-jobs';

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedPersonData {
  // Core identity
  name: string;
  title: string;
  company: string;
  
  // Career details
  department?: string;
  seniorityLevel?: string;
  yearsAtCompany?: number;
  totalExperience?: number;
  managementLevel?: string;
  isDecisionMaker?: boolean;
  
  // Work history (from PDL)
  workHistory?: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
  }>;
  
  // Education (from PDL)
  education?: Array<{
    school: string;
    degree?: string;
    fieldOfStudy?: string;
  }>;
  
  // Skills (from PDL/CoreSignal)
  skills?: string[];
  certifications?: string[];
  
  // Career changes (from CoreSignal)
  roleChanges?: Array<{
    fromTitle: string;
    toTitle: string;
    changeDate: string;
    type: string;
  }>;
  
  companyChanges?: Array<{
    fromCompany: string;
    toCompany: string;
    changeDate: string;
  }>;
}

export interface CompanyContext {
  industry?: string;
  companyStage?: string;
  competitors?: string[];
  growthSignals?: string[];
  hiringPatterns?: {
    totalJobs: number;
    salesRoles: number;
    engineeringRoles: number;
    leadershipRoles: number;
  };
  salesIntentScore?: number;
  departmentExpansion?: string[];
}

export interface PersonWantsAnalysis {
  careerAspirations: string[];        // What they want to achieve
  professionalGoals: string[];        // What they're working towards
  motivations: string[];              // What drives them
  opportunitiesOfInterest: string[];  // What would excite them
  confidence: number;                 // 0-100
  reasoning: string;                  // Why AI believes this
}

export interface PersonPainsAnalysis {
  currentChallenges: string[];        // Problems they're facing
  frustrations: string[];             // What frustrates them
  pressurePoints: string[];           // What keeps them up at night
  obstacles: string[];                // What blocks their success
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;                 // 0-100
  reasoning: string;                  // Why AI believes this
}

export interface OutreachStrategy {
  bestApproach: string;               // How to reach them
  valuePropositions: string[];        // What to emphasize
  conversationStarters: string[];     // Opening messages
  topicsToAvoid: string[];           // Red flags
  optimalTiming: string;              // When to reach out
  personalizedMessage: string;        // Ready-to-use template
}

export interface AIPersonIntelligence {
  person: {
    name: string;
    title: string;
    company: string;
  };
  wants: PersonWantsAnalysis;
  pains: PersonPainsAnalysis;
  outreach: OutreachStrategy;
  overallInsight: string;             // High-level summary
  confidence: number;                 // Overall confidence 0-100
  generatedAt: string;
  model: string;                      // Claude model used
}

// ============================================================================
// AI INTELLIGENCE FUNCTIONS
// ============================================================================

/**
 * Analyze person's wants and desires using Claude AI
 * 
 * @example
 * const wants = await analyzePersonWantsWithAI(personData, companyContext, apis);
 * // Returns: career aspirations, professional goals, motivations
 */
export async function analyzePersonWantsWithAI(
  personData: EnhancedPersonData,
  companyContext: CompanyContext,
  apis: APIClients
): Promise<PersonWantsAnalysis> {
  console.log(`🤖 [AI Wants] Analyzing wants for: ${personData.name}`);
  
  if (!apis.claude) {
    console.warn('   ⚠️ Claude API not configured');
    return getFallbackWants(personData);
  }
  
  try {
    const prompt = buildWantsPrompt(personData, companyContext);
    
    const response = await apis.claude.generateContent(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
      model: 'claude-sonnet-4-5'
    });
    
    const analysis = parseWantsResponse(response);
    
    console.log(`   ✅ Wants analyzed (confidence: ${analysis.confidence}%)`);
    
    return analysis;
  } catch (error) {
    console.error('   ❌ AI wants analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return getFallbackWants(personData);
  }
}

/**
 * Analyze person's pains and challenges using Claude AI
 * 
 * @example
 * const pains = await analyzePersonPainsWithAI(personData, companyContext, apis);
 * // Returns: current challenges, frustrations, pressure points
 */
export async function analyzePersonPainsWithAI(
  personData: EnhancedPersonData,
  companyContext: CompanyContext,
  apis: APIClients
): Promise<PersonPainsAnalysis> {
  console.log(`🤖 [AI Pains] Analyzing pains for: ${personData.name}`);
  
  if (!apis.claude) {
    console.warn('   ⚠️ Claude API not configured');
    return getFallbackPains(personData);
  }
  
  try {
    const prompt = buildPainsPrompt(personData, companyContext);
    
    const response = await apis.claude.generateContent(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
      model: 'claude-sonnet-4-5'
    });
    
    const analysis = parsePainsResponse(response);
    
    console.log(`   ✅ Pains analyzed (urgency: ${analysis.urgencyLevel}, confidence: ${analysis.confidence}%)`);
    
    return analysis;
  } catch (error) {
    console.error('   ❌ AI pains analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return getFallbackPains(personData);
  }
}

/**
 * Generate personalized outreach strategy using Claude AI
 * 
 * @example
 * const strategy = await generateOutreachStrategy(personData, wants, pains, apis);
 * // Returns: best approach, value props, conversation starters
 */
export async function generateOutreachStrategy(
  personData: EnhancedPersonData,
  wants: PersonWantsAnalysis,
  pains: PersonPainsAnalysis,
  apis: APIClients
): Promise<OutreachStrategy> {
  console.log(`🤖 [AI Outreach] Generating strategy for: ${personData.name}`);
  
  if (!apis.claude) {
    console.warn('   ⚠️ Claude API not configured');
    return getFallbackOutreach(personData, wants, pains);
  }
  
  try {
    const prompt = buildOutreachPrompt(personData, wants, pains);
    
    const response = await apis.claude.generateContent(prompt, {
      temperature: 0.8,
      maxTokens: 2000,
      model: 'claude-sonnet-4-5'
    });
    
    const strategy = parseOutreachResponse(response);
    
    console.log(`   ✅ Outreach strategy generated`);
    
    return strategy;
  } catch (error) {
    console.error('   ❌ AI outreach strategy error:', error instanceof Error ? error.message : 'Unknown error');
    return getFallbackOutreach(personData, wants, pains);
  }
}

/**
 * Create complete AI person intelligence profile
 * 
 * @example
 * const intelligence = await createAIPersonIntelligence(personData, companyContext, apis);
 * // Returns: complete wants, pains, outreach, and overall insight
 */
export async function createAIPersonIntelligence(
  personData: EnhancedPersonData,
  companyContext: CompanyContext,
  apis: APIClients
): Promise<AIPersonIntelligence> {
  console.log(`🤖 [AI Intelligence] Creating complete profile for: ${personData.name}`);
  
  const startTime = Date.now();
  
  // Analyze wants
  const wants = await analyzePersonWantsWithAI(personData, companyContext, apis);
  
  // Analyze pains
  const pains = await analyzePersonPainsWithAI(personData, companyContext, apis);
  
  // Generate outreach strategy
  const outreach = await generateOutreachStrategy(personData, wants, pains, apis);
  
  // Generate overall insight
  const overallInsight = generateOverallInsight(personData, wants, pains);
  
  // Calculate overall confidence
  const confidence = Math.round((wants.confidence + pains.confidence) / 2);
  
  const processingTime = Date.now() - startTime;
  
  console.log(`   ✅ Complete AI intelligence profile created (${processingTime}ms)`);
  
  return {
    person: {
      name: personData.name,
      title: personData.title,
      company: personData.company
    },
    wants,
    pains,
    outreach,
    overallInsight,
    confidence,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-5'
  };
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build Claude prompt for wants analysis
 */
function buildWantsPrompt(person: EnhancedPersonData, context: CompanyContext): string {
  return `You are an expert executive coach and career analyst. Analyze this professional profile to understand their wants, desires, and aspirations.

PERSON PROFILE:
- Name: ${person.name}
- Current Role: ${person.title} at ${person.company}
- Seniority: ${person.seniorityLevel || 'Unknown'} (${person.yearsAtCompany || 'Unknown'} years at company)
- Department: ${person.department || 'Unknown'}
- Total Experience: ${person.totalExperience || 'Unknown'} years
- Management Level: ${person.managementLevel || 'Unknown'}
- Decision Maker: ${person.isDecisionMaker ? 'Yes' : 'Unknown'}

CAREER HISTORY:
${formatWorkHistory(person.workHistory || [])}

RECENT CHANGES:
${formatRoleChanges(person.roleChanges || [])}

SKILLS & EDUCATION:
- Top Skills: ${person.skills?.slice(0, 10).join(', ') || 'Unknown'}
- Education: ${formatEducation(person.education || [])}
- Certifications: ${person.certifications?.join(', ') || 'None listed'}

COMPANY CONTEXT:
- Industry: ${context.industry || 'Unknown'}
- Company Stage: ${context.companyStage || 'Unknown'}
- Growth Signals: ${context.growthSignals?.join(', ') || 'Unknown'}
- Department Expansion: ${context.departmentExpansion?.join(', ') || 'Unknown'}
- Sales Intent Score: ${context.salesIntentScore || 'Unknown'}/100

Based on this comprehensive data, analyze:

1. CAREER ASPIRATIONS
   - What career milestones are they likely pursuing?
   - What leadership opportunities interest them?
   - Where do they see themselves in 2-3 years?

2. PROFESSIONAL GOALS
   - What are they trying to achieve in their current role?
   - What metrics/outcomes matter most to them?
   - What would constitute success for them?

3. MOTIVATIONS
   - What drives their career decisions?
   - What energizes them professionally?
   - What values guide their choices?

4. OPPORTUNITIES OF INTEREST
   - What new technologies/approaches would excite them?
   - What challenges would they find engaging?
   - What would make them consider a change?

Provide specific, actionable insights. Be confident but acknowledge uncertainty where appropriate.

Return ONLY valid JSON format (no markdown, no code blocks):
{
  "careerAspirations": ["aspiration 1", "aspiration 2", "aspiration 3"],
  "professionalGoals": ["goal 1", "goal 2", "goal 3"],
  "motivations": ["motivation 1", "motivation 2", "motivation 3"],
  "opportunitiesOfInterest": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "confidence": 85,
  "reasoning": "Brief explanation of analysis"
}`;
}

/**
 * Build Claude prompt for pains analysis
 */
function buildPainsPrompt(person: EnhancedPersonData, context: CompanyContext): string {
  return `You are an expert business consultant analyzing professional challenges. Identify this person's pains, frustrations, and obstacles.

PERSON PROFILE:
- Name: ${person.name}
- Current Role: ${person.title} at ${person.company}
- Seniority: ${person.seniorityLevel || 'Unknown'} (${person.yearsAtCompany || 'Unknown'} years at company)
- Department: ${person.department || 'Unknown'}
- Management Level: ${person.managementLevel || 'Unknown'}

CAREER PATTERN:
${formatCareerPattern(person)}

COMPANY CHALLENGES:
- Hiring Activity: ${context.hiringPatterns?.totalJobs || 0} open positions (${context.hiringPatterns?.salesRoles || 0} sales, ${context.hiringPatterns?.engineeringRoles || 0} engineering)
- Growth Stage: ${context.companyStage || 'Unknown'}
- Competitive Pressure: ${context.competitors?.length || 0} known competitors
- Sales Intent: ${context.salesIntentScore || 'Unknown'}/100

ROLE CONTEXT:
- Management Level: ${person.managementLevel || 'Unknown'}
- Decision-Making Authority: ${person.isDecisionMaker ? 'Yes' : 'Limited'}
- Years in Role: ${person.yearsAtCompany || 'Unknown'}

Based on this data, analyze:

1. CURRENT CHALLENGES
   - What operational challenges are they facing?
   - What resource constraints exist?
   - What execution gaps do they encounter?

2. FRUSTRATIONS
   - What inefficiencies slow them down?
   - What legacy systems/processes frustrate them?
   - What organizational obstacles exist?

3. PRESSURE POINTS
   - What metrics are they measured on?
   - What expectations do stakeholders have?
   - What competitive threats keep them alert?

4. OBSTACLES
   - What prevents them from achieving their goals?
   - What constraints limit their success?
   - What risks concern them?

5. URGENCY ASSESSMENT
   - How urgent are these challenges?
   - What's the timeline for solving them?
   - What happens if they don't address these?

Be specific and realistic. Focus on common challenges for their role/industry.

Return ONLY valid JSON format (no markdown, no code blocks):
{
  "currentChallenges": ["challenge 1", "challenge 2", "challenge 3"],
  "frustrations": ["frustration 1", "frustration 2", "frustration 3"],
  "pressurePoints": ["pressure 1", "pressure 2", "pressure 3"],
  "obstacles": ["obstacle 1", "obstacle 2", "obstacle 3"],
  "urgencyLevel": "high",
  "confidence": 80,
  "reasoning": "Brief explanation of analysis"
}`;
}

/**
 * Build Claude prompt for outreach strategy
 */
function buildOutreachPrompt(
  person: EnhancedPersonData,
  wants: PersonWantsAnalysis,
  pains: PersonPainsAnalysis
): string {
  return `You are an expert sales strategist. Create an optimal outreach strategy for this person.

PERSON PROFILE:
- Name: ${person.name}
- Role: ${person.title} at ${person.company}
- Seniority: ${person.seniorityLevel || 'Unknown'}

WANTS ANALYSIS:
- Career Aspirations: ${wants.careerAspirations.join(', ')}
- Professional Goals: ${wants.professionalGoals.join(', ')}
- Motivations: ${wants.motivations.join(', ')}

PAINS ANALYSIS:
- Current Challenges: ${pains.currentChallenges.join(', ')}
- Frustrations: ${pains.frustrations.join(', ')}
- Pressure Points: ${pains.pressurePoints.join(', ')}
- Urgency: ${pains.urgencyLevel}

Create an outreach strategy that:
1. Matches their communication style and seniority
2. Addresses their most urgent pains
3. Aligns with their career aspirations
4. Respects their time and priorities

Provide:
1. BEST APPROACH (tone, style, channel)
2. VALUE PROPOSITIONS (what to emphasize)
3. CONVERSATION STARTERS (specific opening messages)
4. TOPICS TO AVOID (red flags)
5. OPTIMAL TIMING (when to reach out)
6. PERSONALIZED MESSAGE (ready-to-use template)

Return ONLY valid JSON format (no markdown, no code blocks):
{
  "bestApproach": "Professional and solution-focused. Lead with data and ROI.",
  "valuePropositions": ["value prop 1", "value prop 2", "value prop 3"],
  "conversationStarters": ["starter 1", "starter 2", "starter 3"],
  "topicsToAvoid": ["avoid 1", "avoid 2"],
  "optimalTiming": "Tuesday or Wednesday morning, 9-11am",
  "personalizedMessage": "Hi [Name], I noticed... [personalized message template]"
}`;
}

// ============================================================================
// RESPONSE PARSERS
// ============================================================================

/**
 * Parse Claude response for wants analysis
 */
function parseWantsResponse(response: string): PersonWantsAnalysis {
  try {
    // Remove markdown code blocks if present
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return {
      careerAspirations: parsed.careerAspirations || [],
      professionalGoals: parsed.professionalGoals || [],
      motivations: parsed.motivations || [],
      opportunitiesOfInterest: parsed.opportunitiesOfInterest || [],
      confidence: parsed.confidence || 70,
      reasoning: parsed.reasoning || 'AI analysis based on profile data'
    };
  } catch (error) {
    console.error('   ❌ Failed to parse wants response:', error);
    return {
      careerAspirations: ['Career growth and advancement'],
      professionalGoals: ['Achieve team and company objectives'],
      motivations: ['Professional development and impact'],
      opportunitiesOfInterest: ['New challenges and technologies'],
      confidence: 50,
      reasoning: 'Fallback analysis due to parsing error'
    };
  }
}

/**
 * Parse Claude response for pains analysis
 */
function parsePainsResponse(response: string): PersonPainsAnalysis {
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return {
      currentChallenges: parsed.currentChallenges || [],
      frustrations: parsed.frustrations || [],
      pressurePoints: parsed.pressurePoints || [],
      obstacles: parsed.obstacles || [],
      urgencyLevel: parsed.urgencyLevel || 'medium',
      confidence: parsed.confidence || 70,
      reasoning: parsed.reasoning || 'AI analysis based on profile data'
    };
  } catch (error) {
    console.error('   ❌ Failed to parse pains response:', error);
    return {
      currentChallenges: ['Resource constraints and execution challenges'],
      frustrations: ['Process inefficiencies'],
      pressurePoints: ['Performance metrics and stakeholder expectations'],
      obstacles: ['Budget and time constraints'],
      urgencyLevel: 'medium',
      confidence: 50,
      reasoning: 'Fallback analysis due to parsing error'
    };
  }
}

/**
 * Parse Claude response for outreach strategy
 */
function parseOutreachResponse(response: string): OutreachStrategy {
  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return {
      bestApproach: parsed.bestApproach || 'Professional and solution-focused',
      valuePropositions: parsed.valuePropositions || [],
      conversationStarters: parsed.conversationStarters || [],
      topicsToAvoid: parsed.topicsToAvoid || [],
      optimalTiming: parsed.optimalTiming || 'Business hours, mid-week',
      personalizedMessage: parsed.personalizedMessage || 'Personalized outreach message'
    };
  } catch (error) {
    console.error('   ❌ Failed to parse outreach response:', error);
    return {
      bestApproach: 'Professional and solution-focused',
      valuePropositions: ['Efficiency improvements', 'Cost savings', 'Better outcomes'],
      conversationStarters: ['I noticed your company is growing...', 'I saw your recent role change...'],
      topicsToAvoid: ['Overly aggressive sales tactics', 'Unsubstantiated claims'],
      optimalTiming: 'Tuesday-Thursday, 9-11am or 2-4pm',
      personalizedMessage: 'Hi [Name], I noticed [specific observation]. Would love to discuss how we can help with [specific pain point].'
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format work history for prompt
 */
function formatWorkHistory(history: any[]): string {
  if (!history || history.length === 0) return 'No work history available';
  
  return history.slice(0, 5).map(job => 
    `- ${job.title} at ${job.company} (${job.startDate || 'Unknown'} - ${job.endDate || 'Present'})`
  ).join('\n');
}

/**
 * Format role changes for prompt
 */
function formatRoleChanges(changes: any[]): string {
  if (!changes || changes.length === 0) return 'No recent role changes';
  
  return changes.slice(0, 3).map(change => 
    `- ${change.type}: ${change.fromTitle} → ${change.toTitle} (${change.changeDate})`
  ).join('\n');
}

/**
 * Format education for prompt
 */
function formatEducation(education: any[]): string {
  if (!education || education.length === 0) return 'No education data available';
  
  return education.slice(0, 2).map(edu => 
    `${edu.degree || 'Degree'} in ${edu.fieldOfStudy || 'Unknown'} from ${edu.school}`
  ).join(', ');
}

/**
 * Format career pattern for prompt
 */
function formatCareerPattern(person: EnhancedPersonData): string {
  const changes = person.companyChanges || [];
  if (changes.length === 0) return 'Stable career at current company';
  
  return `${changes.length} company changes in career. Most recent: ${changes[0]?.fromCompany} → ${changes[0]?.toCompany}`;
}

/**
 * Generate overall insight summary
 */
function generateOverallInsight(
  person: EnhancedPersonData,
  wants: PersonWantsAnalysis,
  pains: PersonPainsAnalysis
): string {
  const topWant = wants.careerAspirations[0] || 'career growth';
  const topPain = pains.currentChallenges[0] || 'operational challenges';
  
  return `${person.name} is a ${person.seniorityLevel || 'professional'} at ${person.company} focused on ${topWant}. ` +
         `They're currently facing ${topPain}. ` +
         `Best approach: Address their challenges while aligning with their career aspirations.`;
}

/**
 * Get fallback wants (when AI unavailable)
 */
function getFallbackWants(person: EnhancedPersonData): PersonWantsAnalysis {
  return {
    careerAspirations: ['Advance to next leadership level', 'Build high-performing team', 'Drive strategic initiatives'],
    professionalGoals: ['Improve team performance', 'Implement new processes', 'Achieve key metrics'],
    motivations: ['Professional growth', 'Making impact', 'Team success'],
    opportunitiesOfInterest: ['Leadership opportunities', 'Strategic projects', 'Innovation initiatives'],
    confidence: 60,
    reasoning: 'Fallback analysis based on role and seniority'
  };
}

/**
 * Get fallback pains (when AI unavailable)
 */
function getFallbackPains(person: EnhancedPersonData): PersonPainsAnalysis {
  return {
    currentChallenges: ['Resource constraints', 'Process inefficiencies', 'Execution challenges'],
    frustrations: ['Manual processes', 'Legacy systems', 'Communication gaps'],
    pressurePoints: ['Performance metrics', 'Stakeholder expectations', 'Competitive pressure'],
    obstacles: ['Budget limitations', 'Time constraints', 'Technical debt'],
    urgencyLevel: 'medium',
    confidence: 60,
    reasoning: 'Fallback analysis based on common role challenges'
  };
}

/**
 * Get fallback outreach (when AI unavailable)
 */
function getFallbackOutreach(
  person: EnhancedPersonData,
  wants: PersonWantsAnalysis,
  pains: PersonPainsAnalysis
): OutreachStrategy {
  return {
    bestApproach: 'Professional, solution-focused approach emphasizing ROI and efficiency',
    valuePropositions: [
      'Improve operational efficiency',
      'Reduce manual work and errors',
      'Enable better decision-making'
    ],
    conversationStarters: [
      `Hi ${person.name}, I noticed ${person.company} is growing...`,
      `Saw your recent work in ${person.department || 'your department'}...`,
      'Would love to discuss how we can help with...'
    ],
    topicsToAvoid: ['Aggressive sales tactics', 'Unsubstantiated claims', 'Generic pitches'],
    optimalTiming: 'Tuesday-Thursday, 9-11am or 2-4pm',
    personalizedMessage: `Hi ${person.name}, I noticed your role as ${person.title} at ${person.company}. ` +
                        `Given your focus on ${wants.professionalGoals[0] || 'team success'}, ` +
                        `I thought you might be interested in how we help with ${pains.currentChallenges[0] || 'similar challenges'}. ` +
                        `Would you be open to a brief conversation?`
  };
}

