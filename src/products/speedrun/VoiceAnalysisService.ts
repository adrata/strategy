// Voice Analysis Service - Learns seller's communication style from LinkedIn data
// Generates personalized emails that sound exactly like the seller

export interface VoiceProfile {
  tone: string; // e.g., "Professional and approachable"
  style: string; // e.g., "Clear and concise"
  vocabulary: string[]; // Common words/phrases the person uses
  writingPatterns: string[]; // Writing patterns (bullet points, questions, etc.)
  personalityTraits: string[]; // Professional, Enthusiastic, Data-driven, etc.
  signatureElements: string[]; // How they typically end communications
  confidenceScore: number; // 0-1 confidence in the analysis
  lastUpdated: string; // ISO date string
}

export interface EmailGenerationRequest {
  voiceProfile: VoiceProfile;
  leadName: string;
  leadCompany: string;
  leadTitle: string;
  leadBio: string;
  leadRecentActivity: string;
  emailTone: "professional" | "friendly" | "casual";
  emailPurpose: "introduction" | "follow-up" | "meeting-request" | "proposal";
  customInstructions: string;
  existingEmail?: string; // For updates
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  reasoning: string;
}

/**
 * Analyze LinkedIn profile data to create a voice profile
 */
export async function analyzeLinkedInVoice(): Promise<VoiceProfile> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // In real implementation, would fetch LinkedIn data
  const userData = getUserDataForAnalysis();

  if (userData.linkedinPosts?.length > 0) {
    return analyzeFromLinkedInPosts(userData.linkedinPosts);
  }

  return createBaselineProfile();
}

/**
 * Generate a personalized email using the voice profile
 */
export async function generatePersonalizedEmail(
  request: EmailGenerationRequest,
): Promise<GeneratedEmail> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { emailPurpose, existingEmail, customInstructions, voiceProfile } =
    request;

  if (existingEmail && customInstructions) {
    return updateExistingEmail(existingEmail, customInstructions, voiceProfile);
  }

  switch (emailPurpose) {
    case "introduction":
      return generateIntroductionEmail(request);
    case "follow-up":
      return generateFollowUpEmail(request);
    case "meeting-request":
      return generateMeetingRequestEmail(request);
    case "proposal":
      return generateProposalEmail(request);
    default:
      return generateIntroductionEmail(request);
  }
}

function getUserDataForAnalysis(): any {
  return {
    linkedinPosts: [
      {
        content:
          "Excited to share that our team just closed a fantastic quarter! The key was really listening to our clients and understanding their unique challenges. When you focus on value over volume, amazing things happen. What's driving success in your business lately?",
        engagement: 45,
        type: "post",
      },
    ],
  };
}

function analyzeFromLinkedInPosts(posts: any[]): VoiceProfile {
  const allText = posts.map((p) => p.content).join(" ");

  return {
    tone: "Professional and enthusiastic",
    style: "Engaging with specific examples",
    vocabulary: ["excited", "fantastic", "value", "success", "clients"],
    writingPatterns: ["Asks engaging questions", "Uses specific examples"],
    personalityTraits: ["Enthusiastic", "Customer-focused", "Results-oriented"],
    signatureElements: ["Best regards", "Looking forward to connecting"],
    confidenceScore: 0.85,
    lastUpdated: new Date().toISOString(),
  };
}

function createBaselineProfile(): VoiceProfile {
  return {
    tone: "Professional and approachable",
    style: "Clear and concise with personal touches",
    vocabulary: ["excited", "opportunity", "value", "growth", "partnership"],
    writingPatterns: ["Uses specific examples", "Asks engaging questions"],
    personalityTraits: ["Professional", "Results-oriented"],
    signatureElements: ["Best regards", "Looking forward to connecting"],
    confidenceScore: 0.7,
    lastUpdated: new Date().toISOString(),
  };
}

function generateIntroductionEmail(
  request: EmailGenerationRequest,
): GeneratedEmail {
  const { leadName, leadCompany, voiceProfile } = request;

  const subject = `Quick intro - ${leadCompany} + Adrata opportunity`;

  const emailBody = `Hi ${leadName},

Hope this email finds you well! I've been following ${leadCompany}'s growth and I'm really impressed with your work.

I work with companies like ${leadCompany} who are looking to accelerate their growth. Based on what I've seen from your team, I think there might be a really interesting opportunity to explore.

Are you available for a quick 15-minute call this week? I'd love to share what we're seeing in the market and hear about your current priorities.

${voiceProfile['signatureElements'][0] || "Best regards"},
[Your name]`;

  return {
    subject,
    body: emailBody,
    reasoning: `Generated using ${voiceProfile.tone} tone with ${voiceProfile.style} style.`,
  };
}

function generateFollowUpEmail(
  request: EmailGenerationRequest,
): GeneratedEmail {
  const { leadName, leadCompany, voiceProfile } = request;

  const subject = `Following up on our conversation - ${leadCompany}`;

  const emailBody = `Hi ${leadName},

Thanks for taking the time to chat yesterday! I really enjoyed our conversation.

Based on our discussion, it sounds like growth is a key priority. I'd love to show you how we've helped similar companies achieve specific outcomes.

Are you available for a brief demo next week?

${voiceProfile['signatureElements'][0] || "Best regards"},
[Your name]`;

  return {
    subject,
    body: emailBody,
    reasoning: `Follow-up email maintaining conversation thread.`,
  };
}

function generateMeetingRequestEmail(
  request: EmailGenerationRequest,
): GeneratedEmail {
  const { leadName, leadCompany, voiceProfile } = request;

  const subject = `Meeting request - ${leadCompany} growth opportunity`;

  const emailBody = `Hi ${leadName},

I hope this email finds you well! I've been researching ${leadCompany} and I'm impressed with your recent achievements.

I'd love to schedule a 30-minute meeting to:
• Learn more about your current priorities
• Share how we've helped similar companies
• Explore whether there's a mutual fit

Are you available next Tuesday or Wednesday afternoon?

${voiceProfile['signatureElements'][0] || "Looking forward to connecting"},
[Your name]`;

  return {
    subject,
    body: emailBody,
    reasoning: `Meeting request with clear agenda and value proposition.`,
  };
}

function generateProposalEmail(
  request: EmailGenerationRequest,
): GeneratedEmail {
  const { leadName, leadCompany, voiceProfile } = request;

  const subject = `Proposal for ${leadCompany} - Growth Solution`;

  const emailBody = `Hi ${leadName},

Thank you for the great conversation about ${leadCompany}'s initiatives. I'm excited about the opportunity to work together.

Based on our discussion, I've put together a customized proposal that addresses your key priorities. The key highlights include:
• Specific benefits for your situation
• Implementation timeline
• Expected results

I've attached the detailed proposal for your review. I'd love to schedule a follow-up call to walk through it.

Are you available this Friday for a 30-minute discussion?

${voiceProfile['signatureElements'][0] || "Best regards"},
[Your name]`;

  return {
    subject,
    body: emailBody,
    reasoning: `Proposal email with structured approach and specific value propositions.`,
  };
}

function updateExistingEmail(
  existingEmail: string,
  instructions: string,
  voiceProfile: VoiceProfile,
): GeneratedEmail {
  let updatedEmail = existingEmail;
  const lowerInstructions = instructions.toLowerCase();

  if (lowerInstructions.includes("shorter")) {
    updatedEmail = makeEmailShorter(existingEmail);
  }

  if (lowerInstructions.includes("personality")) {
    updatedEmail = addPersonality(existingEmail);
  }

  if (lowerInstructions.includes("professional")) {
    updatedEmail = makeMoreProfessional(existingEmail);
  }

  const subject = "Updated email subject";

  return {
    subject,
    body: updatedEmail,
    reasoning: `Updated based on: "${instructions}"`,
  };
}

function makeEmailShorter(email: string): string {
  return email
    .replace(/\n\n+/g, "\n\n")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, -2) // Remove some lines
    .join("\n");
}

function addPersonality(email: string): string {
  return email.replace(/\./g, (match) => (Math.random() > 0.8 ? "!" : match));
}

function makeMoreProfessional(email: string): string {
  return email.replace(/!/g, ".").replace(/\bawesome\b/g, "excellent");
}
