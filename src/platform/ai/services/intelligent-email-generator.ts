// Intelligent Email Pre-Generation Service
// Automatically pre-writes emails in the user's authentic voice using their profile and industry intelligence

import { VoiceProfile } from "@/platform/ui/components/speedrun/VoiceAnalysisService";
import { IndustryIntelligenceService } from "@/platform/services/industry-intelligence";
import { brightDataService } from "@/platform/services/brightdata";

export interface EmailContext {
  leadName: string;
  leadCompany: string;
  leadTitle?: string;
  leadEmail: string;
  leadLinkedIn?: string;
  leadBio?: string;
  leadIndustry?: string;
  leadLocation?: string;
  leadRecentActivity?: string;
  companySize?: string;
  companyWebsite?: string;
  companyDescription?: string;
  connectionReason?: string;
  meetingObjective?: string;
  proposalContext?: string;
}

export interface PreGeneratedEmail {
  id: string;
  subject: string;
  body: string;
  emailType:
    | "introduction"
    | "follow-up"
    | "meeting-request"
    | "proposal"
    | "breakup"
    | "reconnect";
  confidence: number; // 0-1 confidence in personalization quality
  personalizations: string[]; // List of personalization elements used
  industryInsights: string[]; // Industry-specific insights included
  voiceElements: string[]; // Voice profile elements used
  suggestedSendTime?: Date;
  estimatedReplyProbability: number;
  alternativeVersions?: Partial<PreGeneratedEmail>[];
  generatedAt: Date;
}

export interface EmailSequence {
  id: string;
  leadId: string;
  emails: PreGeneratedEmail[];
  sequenceType:
    | "cold-outreach"
    | "warm-introduction"
    | "event-follow-up"
    | "referral";
  totalEmails: number;
  currentStep: number;
  expectedDuration: string; // e.g., "2 weeks"
  completionRate: number; // Industry benchmark for this sequence type
}

export class IntelligentEmailGenerator {
  // Pre-generate all email types for a lead
  static async preGenerateAllEmails(
    emailContext: EmailContext,
    voiceProfile: VoiceProfile,
    workspaceId: string,
  ): Promise<PreGeneratedEmail[]> {
    console.log(
      `🧠 Pre-generating intelligent emails for ${emailContext.leadName} at ${emailContext.leadCompany}`,
    );

    // Get industry intelligence
    const industryResult =
      emailContext.leadIndustry ||
      (await IndustryIntelligenceService.classifyCompany({
        name: emailContext.leadCompany,
        description: emailContext.companyDescription,
        website: emailContext.companyWebsite,
      }));

    // Convert industry to string if it's an array
    const industry = Array.isArray(industryResult)
      ? industryResult[0]?.industryId || "Technology"
      : industryResult;

    const marketIntelligence =
      await IndustryIntelligenceService.generateMarketIntelligence(industry);

    // Get company insights
    const companyData = await brightDataService.getCompanyData(
      emailContext.leadCompany,
    );

    const emails: PreGeneratedEmail[] = [];

    // 1. Introduction Email
    const introEmail = await this.generateIntroductionEmail(
      emailContext,
      voiceProfile,
      marketIntelligence,
      companyData,
    );
    emails.push(introEmail);

    // 2. Follow-up Email (for non-responders)
    const followUpEmail = await this.generateFollowUpEmail(
      emailContext,
      voiceProfile,
      marketIntelligence,
      companyData,
    );
    emails.push(followUpEmail);

    // 3. Meeting Request Email
    const meetingEmail = await this.generateMeetingRequestEmail(
      emailContext,
      voiceProfile,
      marketIntelligence,
      companyData,
    );
    emails.push(meetingEmail);

    // 4. Value-First Email (alternative approach)
    const valueEmail = await this.generateValueFirstEmail(
      emailContext,
      voiceProfile,
      marketIntelligence,
      companyData,
    );
    emails.push(valueEmail);

    // 5. Breakup Email (final attempt)
    const breakupEmail = await this.generateBreakupEmail(
      emailContext,
      voiceProfile,
      marketIntelligence,
      companyData,
    );
    emails.push(breakupEmail);

    console.log(
      `✅ Pre-generated ${emails.length} intelligent emails with ${emails.length > 0 ? Math.round((emails.reduce((sum, email) => sum + email.confidence, 0) / emails.length) * 100) : 0}% avg confidence`,
    );

    return emails;
  }

  // Generate complete email sequence
  static async generateEmailSequence(
    emailContext: EmailContext,
    voiceProfile: VoiceProfile,
    sequenceType: EmailSequence["sequenceType"] = "cold-outreach",
    workspaceId: string,
  ): Promise<EmailSequence> {
    const emails = await this.preGenerateAllEmails(
      emailContext,
      voiceProfile,
      workspaceId,
    );

    // Order emails based on sequence type
    const orderedEmails = this.orderEmailsForSequence(emails, sequenceType);

    return {
      id: `sequence_${Date.now()}_${emailContext.leadEmail}`,
      leadId: emailContext.leadEmail,
      emails: orderedEmails,
      sequenceType,
      totalEmails: orderedEmails.length,
      currentStep: 0,
      expectedDuration: this.calculateSequenceDuration(
        sequenceType,
        orderedEmails.length,
      ),
      completionRate: this.getIndustryBenchmark(sequenceType),
    };
  }

  // Generate introduction email with industry intelligence
  private static async generateIntroductionEmail(
    context: EmailContext,
    voice: VoiceProfile,
    marketIntel: any,
    companyData: any,
  ): Promise<PreGeneratedEmail> {
    const personalizations: string[] = [];
    const industryInsights: string[] = [];
    const voiceElements: string[] = [];

    // Build personalized subject line
    const subjectOptions = [
      `Quick question about ${context.leadCompany}'s ${this.getIndustryFocus(marketIntel)}`,
      `${context.leadCompany} + [Your Company] - potential fit?`,
      `Impressed by ${context.leadCompany}'s ${this.getRecentAchievement(companyData)}`,
      `${context.leadName} - ${this.getIndustryChallenge(marketIntel)} solution`,
    ];

    const subject =
      subjectOptions[0] || `Quick question about ${context.leadCompany}`;
    personalizations.push("Industry-specific subject line");

    // Build personalized email body using voice profile
    let emailBody = this.getVoiceGreeting(voice, context.leadName);
    voiceElements.push("Personalized greeting style");

    // Add industry-specific opening
    if (marketIntel) {
      const industryOpening = this.getIndustryOpening(
        context.leadCompany,
        marketIntel,
      );
      emailBody += `\n\n${industryOpening}`;
      industryInsights.push("Market trend awareness");
    }

    // Add company-specific insight
    if (companyData.recentGrowth || companyData.funding) {
      const companyInsight = this.getCompanyInsight(
        context.leadCompany,
        companyData,
      );
      emailBody += `\n\n${companyInsight}`;
      personalizations.push("Company growth recognition");
    }

    // Add value proposition using voice style
    const valueProposition = this.getVoiceValueProposition(voice, marketIntel);
    emailBody += `\n\n${valueProposition}`;
    voiceElements.push("Authentic value communication");

    // Add call to action in user's style
    const cta = this.getVoiceCallToAction(voice, context.leadName);
    emailBody += `\n\n${cta}`;
    voiceElements.push("Natural conversation starter");

    // Add signature in user's style
    emailBody += `\n\n${voice.patterns.closing || "Best regards"},\n[Your name]`;
    voiceElements.push("Signature style");

    const confidence = this.calculateConfidence(
      personalizations,
      industryInsights,
      voiceElements,
      context,
    );

    return {
      id: `intro_${Date.now()}`,
      subject,
      body: emailBody,
      emailType: "introduction",
      confidence,
      personalizations,
      industryInsights,
      voiceElements,
      suggestedSendTime: this.calculateOptimalSendTime(context, marketIntel),
      estimatedReplyProbability: this.estimateReplyProbability(
        "introduction",
        confidence,
        marketIntel,
      ),
      generatedAt: new Date(),
    };
  }

  // Generate follow-up email
  private static async generateFollowUpEmail(
    context: EmailContext,
    voice: VoiceProfile,
    marketIntel: any,
    companyData: any,
  ): Promise<PreGeneratedEmail> {
    const personalizations: string[] = [];
    const industryInsights: string[] = [];
    const voiceElements: string[] = [];

    const subject = `Re: ${context.leadCompany} follow-up - different angle`;

    let emailBody = this.getVoiceGreeting(voice, context.leadName);
    voiceElements.push("Consistent voice greeting");

    // Acknowledgment of no response (voice-appropriate)
    const acknowledgment = this.getVoiceAcknowledgment(voice);
    emailBody += `\n\n${acknowledgment}`;
    voiceElements.push("Graceful follow-up tone");

    // Different value angle
    const alternativeValue = this.getAlternativeValueProposition(
      marketIntel,
      companyData,
    );
    emailBody += `\n\n${alternativeValue}`;
    industryInsights.push("Alternative value angle");

    // Softer call to action
    const softCTA = this.getSoftCallToAction(voice, context.leadName);
    emailBody += `\n\n${softCTA}`;
    voiceElements.push("Low-pressure approach");

    emailBody += `\n\n${voice.patterns.closing || "Best regards"},\n[Your name]`;

    const confidence = this.calculateConfidence(
      personalizations,
      industryInsights,
      voiceElements,
      context,
    );

    return {
      id: `followup_${Date.now()}`,
      subject: subject || "Follow Up",
      body: emailBody,
      emailType: "follow-up",
      confidence,
      personalizations,
      industryInsights,
      voiceElements,
      suggestedSendTime: this.calculateFollowUpTiming(),
      estimatedReplyProbability: this.estimateReplyProbability(
        "follow-up",
        confidence,
        marketIntel,
      ),
      generatedAt: new Date(),
    };
  }

  // Generate meeting request email
  private static async generateMeetingRequestEmail(
    context: EmailContext,
    voice: VoiceProfile,
    marketIntel: any,
    companyData: any,
  ): Promise<PreGeneratedEmail> {
    const personalizations: string[] = [];
    const industryInsights: string[] = [];
    const voiceElements: string[] = [];

    const subject = `15-minute chat about ${context.leadCompany}'s ${this.getIndustryFocus(marketIntel)}?`;

    let emailBody = this.getVoiceGreeting(voice, context.leadName);
    voiceElements.push("Familiar greeting style");

    // Context for meeting request
    const meetingContext = this.getMeetingContext(
      context.leadCompany,
      marketIntel,
    );
    emailBody += `\n\n${meetingContext}`;
    industryInsights.push("Meeting relevance context");

    // Meeting agenda using voice style
    const agenda = this.getVoiceMeetingAgenda(voice, marketIntel);
    emailBody += `\n\n${agenda}`;
    voiceElements.push("Structured meeting approach");

    // Time flexibility
    const timeOptions = this.getVoiceTimeOptions(voice);
    emailBody += `\n\n${timeOptions}`;
    voiceElements.push("Accommodating scheduling");

    emailBody += `\n\n${voice.patterns?.closing || "Best regards"},\n[Your name]`;

    const confidence = this.calculateConfidence(
      personalizations,
      industryInsights,
      voiceElements,
      context,
    );

    return {
      id: `meeting_${Date.now()}`,
      subject,
      body: emailBody,
      emailType: "meeting-request",
      confidence,
      personalizations,
      industryInsights,
      voiceElements,
      suggestedSendTime: this.calculateMeetingRequestTiming(marketIntel),
      estimatedReplyProbability: this.estimateReplyProbability(
        "meeting-request",
        confidence,
        marketIntel,
      ),
      generatedAt: new Date(),
    };
  }

  // Generate value-first email
  private static async generateValueFirstEmail(
    context: EmailContext,
    voice: VoiceProfile,
    marketIntel: any,
    companyData: any,
  ): Promise<PreGeneratedEmail> {
    const personalizations: string[] = [];
    const industryInsights: string[] = [];
    const voiceElements: string[] = [];

    const subject = `Free ${this.getIndustryResource(marketIntel)} for ${context.leadCompany}`;

    let emailBody = this.getVoiceGreeting(voice, context.leadName);
    voiceElements.push("Value-first greeting");

    // Lead with value
    const valueGift = this.getIndustryValueGift(
      marketIntel,
      context.leadCompany,
    );
    emailBody += `\n\n${valueGift}`;
    industryInsights.push("Industry-specific value gift");

    // Soft introduction
    const softIntro = this.getVoiceSoftIntroduction(voice);
    emailBody += `\n\n${softIntro}`;
    voiceElements.push("Non-pushy introduction");

    // Resource delivery
    const resourceDelivery = this.getResourceDelivery(voice);
    emailBody += `\n\n${resourceDelivery}`;
    voiceElements.push("Helpful delivery style");

    emailBody += `\n\n${voice.patterns?.closing || "Best regards"},\n[Your name]`;

    const confidence = this.calculateConfidence(
      personalizations,
      industryInsights,
      voiceElements,
      context,
    );

    return {
      id: `value_${Date.now()}`,
      subject,
      body: emailBody,
      emailType: "introduction",
      confidence,
      personalizations,
      industryInsights,
      voiceElements,
      suggestedSendTime: this.calculateValueEmailTiming(),
      estimatedReplyProbability: this.estimateReplyProbability(
        "introduction",
        confidence + 0.1,
        marketIntel,
      ), // Higher for value-first
      generatedAt: new Date(),
    };
  }

  // Generate breakup email
  private static async generateBreakupEmail(
    context: EmailContext,
    voice: VoiceProfile,
    marketIntel: any,
    companyData: any,
  ): Promise<PreGeneratedEmail> {
    const personalizations: string[] = [];
    const industryInsights: string[] = [];
    const voiceElements: string[] = [];

    const subject = `Closing the loop - ${context.leadCompany}`;

    let emailBody = this.getVoiceGreeting(voice, context.leadName);
    voiceElements.push("Respectful final greeting");

    // Graceful conclusion
    const gracefulClose = this.getVoiceGracefulClose(
      voice,
      context.leadCompany,
    );
    emailBody += `\n\n${gracefulClose}`;
    voiceElements.push("Professional closure");

    // Door opener for future
    const futureOpener = this.getFutureOpener(voice, marketIntel);
    emailBody += `\n\n${futureOpener}`;
    voiceElements.push("Future relationship building");

    // Final value add
    const finalValue = this.getFinalValueAdd(marketIntel);
    emailBody += `\n\n${finalValue}`;
    industryInsights.push("Parting industry insight");

    emailBody += `\n\n${voice.patterns?.closing || "Best regards"},\n[Your name]`;

    const confidence = this.calculateConfidence(
      personalizations,
      industryInsights,
      voiceElements,
      context,
    );

    return {
      id: `breakup_${Date.now()}`,
      subject,
      body: emailBody,
      emailType: "breakup",
      confidence,
      personalizations,
      industryInsights,
      voiceElements,
      suggestedSendTime: this.calculateBreakupTiming(),
      estimatedReplyProbability: this.estimateReplyProbability(
        "breakup",
        confidence,
        marketIntel,
      ),
      generatedAt: new Date(),
    };
  }

  // Voice-specific content generators
  private static getVoiceGreeting(
    voice: VoiceProfile,
    leadName: string,
  ): string {
    if (
      voice.tone.toLowerCase().includes("casual") ||
      voice.tone.toLowerCase().includes("friendly")
    ) {
      return `Hi ${leadName},`;
    } else if (voice.tone.toLowerCase().includes("professional")) {
      return `Hello ${leadName},`;
    } else {
      return `Hi ${leadName},`;
    }
  }

  private static getVoiceValueProposition(
    voice: VoiceProfile,
    marketIntel: any,
  ): string {
    if (
      voice.patterns?.paragraphStructure === "bullet" ||
      voice.vocabulary?.preferredTerms?.some(term => term.includes("data") || term.includes("metrics"))
    ) {
      return `We've helped similar ${marketIntel?.industry || "companies"} achieve an average of 23% efficiency improvement in their first quarter.`;
    } else if (voice.personality?.assertiveness && voice.personality.assertiveness > 7) {
      return `I've been working with companies like yours to solve the exact challenges you're probably facing right now.`;
    } else {
      return `I'd love to share what we've learned from working with other ${marketIntel?.industry || "companies"} in your space.`;
    }
  }

  private static getVoiceCallToAction(
    voice: VoiceProfile,
    leadName: string,
  ): string {
    if (
      voice.patterns?.paragraphStructure === "mixed" ||
      voice['tone'] === "casual"
    ) {
      return `${leadName}, would you be interested in a quick 15-minute conversation to explore this?`;
    } else if (voice.tone.toLowerCase().includes("casual")) {
      return `Worth a quick chat to see if there's a fit?`;
    } else {
      return `Would you be open to a brief discussion about how this might apply to ${leadName}?`;
    }
  }

  // Industry intelligence content generators
  private static getIndustryFocus(marketIntel: any): string {
    if (!marketIntel) return "growth initiatives";

    const trends = marketIntel.strategicInsights?.keyTrends || [];
    if (trends.length > 0) {
      return trends[0].toLowerCase();
    }
    return "digital transformation";
  }

  private static getIndustryOpening(
    companyName: string,
    marketIntel: any,
  ): string {
    if (!marketIntel)
      return `I've been following ${companyName}'s growth and I'm impressed.`;

    const growth = marketIntel.marketOverview?.growth;
    if (growth && parseFloat(growth) > 10) {
      return `Given the ${growth} growth in the ${marketIntel.industry} space, I imagine ${companyName} is navigating some interesting opportunities right now.`;
    }

    return `I've been following what's happening in the ${marketIntel.industry} industry and ${companyName} caught my attention.`;
  }

  private static getIndustryChallenge(marketIntel: any): string {
    const challenges = marketIntel?.strategicInsights?.challenges || [
      "operational efficiency",
    ];
    return challenges[0] || "growth challenges";
  }

  // Helper methods for timing and scoring
  private static calculateOptimalSendTime(
    context: EmailContext,
    marketIntel: any,
  ): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set optimal send time based on industry patterns
    if (marketIntel?.buyingIntelligence?.budgetTiming?.includes("Q1")) {
      tomorrow.setHours(10, 0, 0, 0); // 10 AM for budget-conscious industries
    } else {
      tomorrow.setHours(9, 30, 0, 0); // 9:30 AM for most industries
    }

    return tomorrow;
  }

  private static calculateConfidence(
    personalizations: string[],
    industryInsights: string[],
    voiceElements: string[],
    context: EmailContext,
  ): number {
    let confidence = 0.4; // Base confidence

    confidence += personalizations.length * 0.1;
    confidence += industryInsights.length * 0.15;
    confidence += voiceElements.length * 0.05;

    // Bonus for having company data
    if (context.companyDescription) confidence += 0.1;
    if (context.leadTitle) confidence += 0.05;
    if (context.leadBio) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  private static estimateReplyProbability(
    emailType: string,
    confidence: number,
    marketIntel: any,
  ): number {
    const baseRates = {
      introduction: 0.05,
      "follow-up": 0.03,
      "meeting-request": 0.08,
      breakup: 0.12,
    };

    let probability = (baseRates as any)[emailType] || 0.05;
    probability *= 1 + confidence; // Confidence multiplier

    // Industry growth bonus
    if (
      marketIntel?.marketOverview?.growth &&
      parseFloat(marketIntel.marketOverview.growth) > 15
    ) {
      probability *= 1.2;
    }

    return Math.min(0.25, probability);
  }

  // Sequence management
  private static orderEmailsForSequence(
    emails: PreGeneratedEmail[],
    sequenceType: EmailSequence["sequenceType"],
  ): PreGeneratedEmail[] {
    switch (sequenceType) {
      case "cold-outreach":
        return emails.filter((e) =>
          ["introduction", "follow-up", "meeting-request", "breakup"].includes(
            e.emailType,
          ),
        );
      case "warm-introduction":
        return emails.filter((e) =>
          ["meeting-request", "follow-up"].includes(e.emailType),
        );
      default:
        return emails;
    }
  }

  private static calculateSequenceDuration(
    sequenceType: EmailSequence["sequenceType"],
    emailCount: number,
  ): string {
    const daysPerEmail = {
      "cold-outreach": 4,
      "warm-introduction": 3,
      "event-follow-up": 2,
      referral: 3,
    };

    const totalDays = emailCount * (daysPerEmail[sequenceType] || 3);
    const weeks = Math.round(totalDays / 7);

    return weeks <= 1 ? "1 week" : `${weeks} weeks`;
  }

  private static getIndustryBenchmark(
    sequenceType: EmailSequence["sequenceType"],
  ): number {
    const benchmarks = {
      "cold-outreach": 0.18,
      "warm-introduction": 0.45,
      "event-follow-up": 0.32,
      referral: 0.62,
    };

    return benchmarks[sequenceType] || 0.2;
  }

  // Additional voice-specific methods
  private static getVoiceAcknowledgment(voice: VoiceProfile): string {
    if (voice['tone'] === "professional" || voice['tone'] === "formal") {
      return "I know your inbox is probably overwhelming, so I'll keep this brief.";
    } else {
      return "I realized my last email might have gotten buried in your inbox.";
    }
  }

  private static getAlternativeValueProposition(
    marketIntel: any,
    companyData: any,
  ): string {
    const opportunities = marketIntel?.strategicInsights?.opportunities || [
      "operational efficiency",
    ];
    return `Instead of focusing on what everyone else is talking about, what if we looked at ${opportunities[0] || "new opportunities"} from a completely different angle?`;
  }

  private static getSoftCallToAction(
    voice: VoiceProfile,
    leadName: string,
  ): string {
    return `${leadName}, even a 10-minute conversation could be valuable - no pressure if the timing isn't right.`;
  }

  private static calculateFollowUpTiming(): Date {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 5); // 5 days later
    followUpDate.setHours(14, 0, 0, 0); // 2 PM
    return followUpDate;
  }

  // Additional helper methods for other email types...
  private static getMeetingContext(
    companyName: string,
    marketIntel: any,
  ): string {
    return `I've been researching what's happening in the ${marketIntel?.industry || "industry"} space, and ${companyName} is doing some really interesting work.`;
  }

  private static getVoiceMeetingAgenda(
    voice: VoiceProfile,
    marketIntel: any,
  ): string {
    if (voice.patterns?.paragraphStructure === "bullet") {
      return `Here's what I'd love to cover:\n• Your current ${marketIntel?.strategicInsights?.challenges?.[0] || "priorities"}\n• What's working well for you\n• Whether our approach might be relevant`;
    } else {
      return `I'd love to learn more about your current priorities and share what we're seeing work for similar companies.`;
    }
  }

  private static getVoiceTimeOptions(voice: VoiceProfile): string {
    return "I'm flexible on timing - what works better for you, mornings or afternoons?";
  }

  private static calculateMeetingRequestTiming(marketIntel: any): Date {
    const meetingDate = new Date();
    meetingDate.setDate(meetingDate.getDate() + 2); // 2 days later
    meetingDate.setHours(11, 0, 0, 0); // 11 AM
    return meetingDate;
  }

  private static getIndustryResource(marketIntel: any): string {
    const industry = marketIntel?.industry || "industry";
    return `${industry} benchspeedrunng report`;
  }

  private static getIndustryValueGift(
    marketIntel: any,
    companyName: string,
  ): string {
    const resource = this.getIndustryResource(marketIntel);
    return `I put together a ${resource} that shows how companies like ${companyName} are tackling their biggest challenges. Thought you might find it interesting.`;
  }

  private static getVoiceSoftIntroduction(voice: VoiceProfile): string {
    return "No agenda here - just sharing something that might be useful.";
  }

  private static getResourceDelivery(voice: VoiceProfile): string {
    return "I'll send it over regardless of whether we end up talking. Good intel should be shared.";
  }

  private static calculateValueEmailTiming(): Date {
    const valueDate = new Date();
    valueDate.setHours(9, 0, 0, 0); // 9 AM same day for value-first
    return valueDate;
  }

  private static getVoiceGracefulClose(
    voice: VoiceProfile,
    companyName: string,
  ): string {
    return `I've reached out a few times about ${companyName} and haven't heard back, which is totally fine - I know things get busy.`;
  }

  private static getFutureOpener(
    voice: VoiceProfile,
    marketIntel: any,
  ): string {
    return "If things change down the road or if you'd ever like to compare notes on what's working in the industry, I'm always happy to chat.";
  }

  private static getFinalValueAdd(marketIntel: any): string {
    const insight =
      marketIntel?.strategicInsights?.keyTrends?.[0] ||
      "industry consolidation";
    return `One last thought: keep an eye on ${insight} - it's going to create some big opportunities over the next 6 months.`;
  }

  private static calculateBreakupTiming(): Date {
    const breakupDate = new Date();
    breakupDate.setDate(breakupDate.getDate() + 14); // 2 weeks later
    breakupDate.setHours(10, 0, 0, 0); // 10 AM
    return breakupDate;
  }

  private static getRecentAchievement(companyData: any): string {
    if (companyData.funding) return "recent funding round";
    if (companyData.growthRate) return "growth trajectory";
    return "market position";
  }

  private static getCompanyInsight(
    companyName: string,
    companyData: any,
  ): string {
    if (companyData.funding) {
      return `I saw the news about ${companyName}'s funding - that's exciting growth.`;
    }
    return `${companyName} seems to be making some smart moves in the market.`;
  }
}

export default IntelligentEmailGenerator;
