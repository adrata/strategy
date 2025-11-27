/**
 * 🏢 ENTERPRISE MULTI-THREAD EMAIL SERVICE
 * 
 * Generates personalized emails for ALL stakeholders on a deal/opportunity
 * 
 * CAPABILITIES:
 * - "Email everyone on this demo" → Generates role-specific emails for all stakeholders
 * - "Multi-thread this opportunity" → Creates strategic outreach for entire buyer group
 * - "Send follow-ups to all contacts" → Batch follow-up generation
 * 
 * RESEARCH-BACKED:
 * - 30MPC: Multi-threading = 3x higher close rates
 * - Gong: Deals with 3+ stakeholders = 2.5x more likely to close
 * - MEDDIC: Maps to Economic Buyer, Champion, Technical Evaluator
 */

import { getPrismaClient } from '@/platform/database/connection-pool';
import { evaluateContent, type EvaluationContext, type ContentType } from './ContentQualityEvaluator';

// =============================================================================
// TYPES
// =============================================================================

export type StakeholderRole = 
  | 'CHAMPION'           // Internal advocate, wants you to win
  | 'ECONOMIC_BUYER'     // Signs the check, C-level
  | 'TECHNICAL_BUYER'    // Evaluates technical fit
  | 'END_USER'           // Will use the product daily
  | 'INFLUENCER'         // Has opinion but no authority
  | 'BLOCKER'            // May oppose the deal
  | 'EXECUTIVE_SPONSOR'  // High-level sponsor
  | 'UNKNOWN';

export interface Stakeholder {
  id: string;
  name: string;
  firstName: string;
  title: string;
  email?: string;
  company: string;
  role: StakeholderRole;
  department?: string;
  lastContactDate?: Date;
  engagementLevel?: 'high' | 'medium' | 'low' | 'none';
  notes?: string;
}

export interface GeneratedEmail {
  stakeholder: Stakeholder;
  subject: string;
  body: string;
  contentType: 'cold' | 'warm' | 'follow-up' | 'nurture';
  qualityScore: number;
  qualityGrade: string;
  reasoning: string;
}

export interface MultiThreadResult {
  opportunityName: string;
  companyName: string;
  totalStakeholders: number;
  emailsGenerated: GeneratedEmail[];
  strategy: string;
  recommendations: string[];
}

export interface MultiThreadRequest {
  opportunityId?: string;
  companyId?: string;
  accountId?: string;
  workspaceId: string;
  userId: string;
  emailType?: 'cold' | 'warm' | 'follow-up' | 'custom';
  customPrompt?: string;
  senderName?: string;
  senderCompany?: string;
  senderTitle?: string;
  valueProposition?: string;
  caseStudies?: string[];
}

// =============================================================================
// MAIN SERVICE
// =============================================================================

export class MultiThreadEmailService {
  
  /**
   * Generate emails for ALL stakeholders on a deal
   * 
   * Usage: "Write emails for everyone on the TechCorp demo"
   */
  static async generateMultiThreadEmails(request: MultiThreadRequest): Promise<MultiThreadResult> {
    const prisma = getPrismaClient();
    
    // 1. Fetch stakeholders
    const stakeholders = await this.fetchStakeholders(request, prisma);
    
    if (stakeholders.length === 0) {
      return {
        opportunityName: 'Unknown',
        companyName: 'Unknown',
        totalStakeholders: 0,
        emailsGenerated: [],
        strategy: 'No stakeholders found for this opportunity/company.',
        recommendations: ['Add contacts to this opportunity first']
      };
    }
    
    // 2. Determine opportunity/company info
    const { opportunityName, companyName } = await this.getOpportunityInfo(request, prisma);
    
    // 3. Generate role-specific emails for each stakeholder
    const emailsGenerated: GeneratedEmail[] = [];
    
    for (const stakeholder of stakeholders) {
      const email = await this.generateStakeholderEmail(stakeholder, request, companyName);
      emailsGenerated.push(email);
    }
    
    // 4. Generate strategic recommendations
    const strategy = this.generateMultiThreadStrategy(stakeholders, emailsGenerated);
    const recommendations = this.generateRecommendations(stakeholders);
    
    return {
      opportunityName,
      companyName,
      totalStakeholders: stakeholders.length,
      emailsGenerated,
      strategy,
      recommendations
    };
  }
  
  /**
   * Fetch all stakeholders for an opportunity or company
   */
  private static async fetchStakeholders(
    request: MultiThreadRequest, 
    prisma: ReturnType<typeof getPrismaClient>
  ): Promise<Stakeholder[]> {
    const stakeholders: Stakeholder[] = [];
    
    // Try opportunity stakeholders first
    if (request.opportunityId) {
      const oppStakeholders = await prisma.opportunityStakeholder?.findMany({
        where: { opportunityId: request.opportunityId },
        include: { contact: true }
      }).catch(() => []) || [];
      
      for (const os of oppStakeholders) {
        if (os.contact) {
          stakeholders.push({
            id: os.contact.id,
            name: os.contact.fullName || `${os.contact.firstName || ''} ${os.contact.lastName || ''}`.trim(),
            firstName: os.contact.firstName || os.contact.fullName?.split(' ')[0] || 'there',
            title: os.contact.jobTitle || 'Stakeholder',
            email: os.contact.email || undefined,
            company: os.contact.company || 'the company',
            role: this.classifyRole(os.contact.jobTitle || '', os.role),
            department: os.contact.department || undefined,
            engagementLevel: 'medium'
          });
        }
      }
    }
    
    // Also try people/contacts linked to the company/account
    if (request.companyId || request.accountId) {
      const companyContacts = await prisma.people.findMany({
        where: {
          workspaceId: request.workspaceId,
          OR: [
            { companyId: request.companyId || undefined },
            { accountId: request.accountId || undefined }
          ]
        },
        take: 20 // Vercel-safe limit
      }).catch(() => []) || [];
      
      for (const contact of companyContacts) {
        // Skip if already added from opportunity stakeholders
        if (stakeholders.some(s => s.id === contact.id)) continue;
        
        stakeholders.push({
          id: contact.id,
          name: contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          firstName: contact.firstName || contact.fullName?.split(' ')[0] || 'there',
          title: contact.jobTitle || 'Contact',
          email: contact.email || undefined,
          company: contact.companyName || 'the company',
          role: this.classifyRole(contact.jobTitle || ''),
          department: contact.department || undefined,
          engagementLevel: this.determineEngagement(contact)
        });
      }
    }
    
    // Sort by role importance
    return this.sortByRoleImportance(stakeholders);
  }
  
  /**
   * Get opportunity name and company name
   */
  private static async getOpportunityInfo(
    request: MultiThreadRequest,
    prisma: ReturnType<typeof getPrismaClient>
  ): Promise<{ opportunityName: string; companyName: string }> {
    let opportunityName = 'Unknown Deal';
    let companyName = 'Unknown Company';
    
    if (request.opportunityId) {
      const opp = await prisma.opportunities?.findUnique({
        where: { id: request.opportunityId },
        include: { account: true, company: true }
      }).catch(() => null);
      
      if (opp) {
        opportunityName = opp.name || 'Unnamed Deal';
        companyName = opp.company?.name || opp.account?.name || 'Unknown Company';
      }
    }
    
    if (request.companyId && companyName === 'Unknown Company') {
      const company = await prisma.companies?.findUnique({
        where: { id: request.companyId }
      }).catch(() => null);
      
      if (company) {
        companyName = company.name || 'Unknown Company';
      }
    }
    
    return { opportunityName, companyName };
  }
  
  /**
   * Generate a personalized email for a specific stakeholder
   * 
   * ROLE-SPECIFIC MESSAGING:
   * - Economic Buyer: ROI, strategic impact, time savings
   * - Champion: Enable their advocacy, social proof
   * - Technical Buyer: Implementation details, integration
   * - End User: Ease of use, daily workflow benefits
   */
  private static async generateStakeholderEmail(
    stakeholder: Stakeholder,
    request: MultiThreadRequest,
    companyName: string
  ): Promise<GeneratedEmail> {
    const { role, firstName, title, company } = stakeholder;
    const emailType = request.emailType || 'warm';
    
    // Generate role-specific content
    const { subject, body, reasoning } = this.generateRoleSpecificContent(
      stakeholder,
      emailType,
      companyName,
      request
    );
    
    // Evaluate quality
    const context: EvaluationContext = {
      recipientName: stakeholder.name,
      recipientCompany: company,
      recipientTitle: title,
      status: 'PROSPECT',
      stage: emailType === 'cold' ? 'QUALIFICATION' : 'DISCOVERY',
      buyerLevel: this.roleToATLBTL(role),
      senderName: request.senderName,
      senderCompany: request.senderCompany,
      senderTitle: request.senderTitle,
      senderValueProp: request.valueProposition,
      senderCaseStudies: request.caseStudies
    };
    
    const score = evaluateContent(body, 'email', context);
    
    return {
      stakeholder,
      subject,
      body,
      contentType: emailType,
      qualityScore: score.overall,
      qualityGrade: score.grade,
      reasoning
    };
  }
  
  /**
   * Generate role-specific email content
   * 
   * RESEARCH-BACKED PATTERNS:
   * - 30MPC: Different roles need different messages
   * - Gong: Economic buyers respond to ROI/strategic
   * - Skip Miller: ATL (execs) vs BTL (users) messaging
   */
  private static generateRoleSpecificContent(
    stakeholder: Stakeholder,
    emailType: 'cold' | 'warm' | 'follow-up' | 'custom',
    companyName: string,
    request: MultiThreadRequest
  ): { subject: string; body: string; reasoning: string } {
    const { role, firstName, title, company } = stakeholder;
    const senderName = request.senderName || '[Your Name]';
    const valueProposition = request.valueProposition || 'helping teams work more efficiently';
    const caseStudy = request.caseStudies?.[0] || 'Honeywell cut their overhead by 73%';
    
    // ECONOMIC BUYER / EXECUTIVE SPONSOR - Focus on ROI, strategic impact
    if (role === 'ECONOMIC_BUYER' || role === 'EXECUTIVE_SPONSOR') {
      return {
        subject: `Quick question for ${firstName}`,
        body: `${firstName} - noticed ${companyName}'s growth trajectory.

Companies scaling this fast typically hit operational bottlenecks that impact revenue. ${caseStudy}.

Would a 15-minute call make sense to explore if this could accelerate ${companyName}'s goals?

${senderName}`,
        reasoning: 'Economic Buyer: Focus on ROI, strategic impact, and business outcomes (Skip Miller ATL messaging)'
      };
    }
    
    // CHAMPION - Enable their advocacy, make them look good
    if (role === 'CHAMPION') {
      return {
        subject: `${firstName} - quick update for you`,
        body: `${firstName} - wanted to share something that could help your case internally.

We just helped a similar ${title} at another company achieve results that made their exec team take notice: ${caseStudy}.

Happy to put together a brief for you to share with your leadership. Would that be helpful?

${senderName}`,
        reasoning: 'Champion: Enable their advocacy, give them ammunition to sell internally (30MPC multi-threading)'
      };
    }
    
    // TECHNICAL BUYER - Implementation, integration, specs
    if (role === 'TECHNICAL_BUYER') {
      return {
        subject: `${firstName} - technical question`,
        body: `${firstName} - quick technical question about ${companyName}'s stack.

We've helped similar teams integrate without disrupting existing workflows. ${caseStudy}.

Would it be helpful to walk through the technical approach? I can share our architecture docs ahead of time.

${senderName}`,
        reasoning: 'Technical Buyer: Focus on implementation, integration, and technical proof (Skip Miller BTL messaging)'
      };
    }
    
    // END USER - Ease of use, daily workflow benefits
    if (role === 'END_USER') {
      return {
        subject: `${firstName} - quick thought`,
        body: `${firstName} - curious about your day-to-day at ${companyName}.

Similar ${title}s told us they save hours each week after making a small change. ${caseStudy}.

Would it be worth 15 minutes to see if this could help your workflow?

${senderName}`,
        reasoning: 'End User: Focus on daily workflow benefits and ease of use (practical, not strategic)'
      };
    }
    
    // INFLUENCER - Peer-to-peer, exchange of ideas
    if (role === 'INFLUENCER') {
      return {
        subject: `${firstName} - quick question`,
        body: `${firstName} - noticed your background in ${stakeholder.department || 'this space'}.

Curious how ${companyName} is thinking about ${valueProposition}. We've seen some interesting patterns: ${caseStudy}.

Worth connecting to exchange approaches?

${senderName}`,
        reasoning: 'Influencer: Peer-to-peer exchange, value their opinion (build relationship)'
      };
    }
    
    // BLOCKER - Address concerns, provide proof
    if (role === 'BLOCKER') {
      return {
        subject: `${firstName} - addressing your concerns`,
        body: `${firstName} - I understand you may have reservations about changes at ${companyName}.

I wanted to share how we approached similar concerns at another company: ${caseStudy}. They had the same worries initially.

Would it be helpful to connect you with someone who had similar concerns? They can share their experience directly.

${senderName}`,
        reasoning: 'Blocker: Address concerns directly, provide peer references (Chris Voss tactical empathy)'
      };
    }
    
    // UNKNOWN / DEFAULT - General warm outreach
    return {
      subject: `${firstName} - quick question about ${companyName}`,
      body: `${firstName} - noticed ${companyName}'s recent growth.

Companies at your stage typically hit challenges we specialize in solving. ${caseStudy}.

Would a quick call make sense to explore if this could help ${companyName}?

${senderName}`,
      reasoning: 'General stakeholder: Standard warm outreach with social proof'
    };
  }
  
  /**
   * Classify stakeholder role from job title
   */
  private static classifyRole(title: string, existingRole?: string): StakeholderRole {
    if (existingRole) {
      const roleMap: Record<string, StakeholderRole> = {
        'champion': 'CHAMPION',
        'economic_buyer': 'ECONOMIC_BUYER',
        'technical_buyer': 'TECHNICAL_BUYER',
        'end_user': 'END_USER',
        'influencer': 'INFLUENCER',
        'blocker': 'BLOCKER',
        'executive_sponsor': 'EXECUTIVE_SPONSOR'
      };
      return roleMap[existingRole.toLowerCase()] || 'UNKNOWN';
    }
    
    const lowerTitle = title.toLowerCase();
    
    // Executive / Economic Buyer
    if (['ceo', 'cfo', 'cto', 'coo', 'cmo', 'chief', 'president', 'vp ', 'vice president', 'svp', 'evp'].some(t => lowerTitle.includes(t))) {
      return 'ECONOMIC_BUYER';
    }
    
    // Technical Buyer
    if (['engineer', 'developer', 'architect', 'technical', 'it ', 'devops', 'infrastructure', 'security'].some(t => lowerTitle.includes(t))) {
      return 'TECHNICAL_BUYER';
    }
    
    // Directors / Managers often Champions
    if (['director', 'head of', 'manager'].some(t => lowerTitle.includes(t))) {
      return 'CHAMPION';
    }
    
    // End Users
    if (['coordinator', 'specialist', 'analyst', 'associate', 'representative'].some(t => lowerTitle.includes(t))) {
      return 'END_USER';
    }
    
    return 'UNKNOWN';
  }
  
  /**
   * Map role to ATL (Above The Line) or BTL (Below The Line)
   */
  private static roleToATLBTL(role: StakeholderRole): 'ATL' | 'BTL' {
    if (['ECONOMIC_BUYER', 'EXECUTIVE_SPONSOR', 'CHAMPION'].includes(role)) {
      return 'ATL';
    }
    return 'BTL';
  }
  
  /**
   * Determine engagement level from contact data
   */
  private static determineEngagement(contact: any): 'high' | 'medium' | 'low' | 'none' {
    if (contact.lastContactedAt) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(contact.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceContact < 7) return 'high';
      if (daysSinceContact < 30) return 'medium';
      if (daysSinceContact < 90) return 'low';
    }
    return 'none';
  }
  
  /**
   * Sort stakeholders by role importance for multi-threading
   * 
   * ORDER (30MPC recommended):
   * 1. Champion (your advocate)
   * 2. Economic Buyer (signs the check)
   * 3. Executive Sponsor (high-level support)
   * 4. Technical Buyer (validates fit)
   * 5. Influencer (builds consensus)
   * 6. End User (drives adoption)
   * 7. Blocker (address concerns)
   * 8. Unknown
   */
  private static sortByRoleImportance(stakeholders: Stakeholder[]): Stakeholder[] {
    const roleOrder: Record<StakeholderRole, number> = {
      'CHAMPION': 1,
      'ECONOMIC_BUYER': 2,
      'EXECUTIVE_SPONSOR': 3,
      'TECHNICAL_BUYER': 4,
      'INFLUENCER': 5,
      'END_USER': 6,
      'BLOCKER': 7,
      'UNKNOWN': 8
    };
    
    return stakeholders.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  }
  
  /**
   * Generate multi-threading strategy summary
   */
  private static generateMultiThreadStrategy(
    stakeholders: Stakeholder[],
    emails: GeneratedEmail[]
  ): string {
    const roleCount = stakeholders.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgScore = emails.length > 0 
      ? Math.round(emails.reduce((sum, e) => sum + e.qualityScore, 0) / emails.length)
      : 0;
    
    return `Multi-Thread Strategy for ${stakeholders.length} stakeholders:
    
📊 Stakeholder Breakdown:
${Object.entries(roleCount).map(([role, count]) => `- ${role}: ${count}`).join('\n')}

📧 Email Quality: Average score ${avgScore}/100

🎯 Approach:
- Lead with Champion (enable their advocacy)
- Engage Economic Buyer with ROI focus
- Arm Technical Buyer with integration proof
- Build consensus with End Users
${roleCount['BLOCKER'] ? '- Address Blocker concerns directly with peer references' : ''}`;
  }
  
  /**
   * Generate strategic recommendations
   */
  private static generateRecommendations(stakeholders: Stakeholder[]): string[] {
    const recommendations: string[] = [];
    const roles = stakeholders.map(s => s.role);
    
    // Check for missing critical roles
    if (!roles.includes('CHAMPION')) {
      recommendations.push('⚠️ No Champion identified - find someone who wants you to win');
    }
    if (!roles.includes('ECONOMIC_BUYER')) {
      recommendations.push('⚠️ No Economic Buyer identified - find who signs the check');
    }
    if (!roles.includes('TECHNICAL_BUYER') && stakeholders.length > 2) {
      recommendations.push('💡 Consider engaging a Technical Buyer to validate fit');
    }
    
    // Multi-threading best practices
    if (stakeholders.length < 3) {
      recommendations.push('📈 Gong data: Deals with 3+ stakeholders are 2.5x more likely to close');
    }
    if (stakeholders.length >= 3) {
      recommendations.push('✅ Good multi-threading - you have 3+ stakeholders engaged');
    }
    
    // Timing recommendations
    recommendations.push('⏰ 30MPC tip: Send Champion email first, then others within 24-48 hours');
    
    return recommendations;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default MultiThreadEmailService;

