// Voice Analysis Service for Speedrun system
export interface VoiceProfile {
  userId: string;
  tone: 'professional' | 'casual' | 'friendly' | 'formal' | 'enthusiastic';
  style: 'concise' | 'detailed' | 'conversational' | 'technical';
  vocabulary: {
    preferredTerms: string[];
    avoidedTerms: string[];
    industryJargon: string[];
  };
  patterns: {
    sentenceLength: 'short' | 'medium' | 'long' | 'varied';
    paragraphStructure: 'bullet' | 'narrative' | 'mixed';
    greeting: string;
    closing: string;
  };
  personality: {
    assertiveness: number; // 1-10
    empathy: number; // 1-10
    directness: number; // 1-10
    formality: number; // 1-10
  };
  examples: Array<{
    context: string;
    originalText: string;
    analysis: string;
  }>;
}

export interface VoiceAnalysisOptions {
  context?: string;
  targetAudience?: string;
  purpose?: 'follow-up' | 'introduction' | 'proposal' | 'update' | 'closing';
  urgency?: 'low' | 'medium' | 'high';
}

export interface GeneratedContent {
  subject?: string;
  body: string;
  confidence: number;
  suggestions: string[];
  voiceMatchScore: number;
}

export class VoiceAnalysisService {
  async analyzeVoice(samples: string[], userId: string): Promise<VoiceProfile> {
    // Mock implementation - replace with actual voice analysis
    const mockProfile: VoiceProfile = {
      userId,
      tone: 'professional',
      style: 'conversational',
      vocabulary: {
        preferredTerms: ['opportunity', 'collaborate', 'solution', 'value'],
        avoidedTerms: ['problem', 'issue', 'cheap', 'deal'],
        industryJargon: ['ROI', 'KPI', 'stakeholder', 'deliverable']
      },
      patterns: {
        sentenceLength: 'medium',
        paragraphStructure: 'mixed',
        greeting: 'Hi there,',
        closing: 'Best regards'
      },
      personality: {
        assertiveness: 7,
        empathy: 8,
        directness: 6,
        formality: 5
      },
      examples: [
        {
          context: 'Follow-up email',
          originalText: 'Hi John, I wanted to follow up on our conversation about the project timeline.',
          analysis: 'Direct, professional tone with personal touch'
        }
      ]
    };

    return mockProfile;
  }

  async generateContent(
    profile: VoiceProfile,
    context: string,
    options: VoiceAnalysisOptions = {}
  ): Promise<GeneratedContent> {
    // Mock implementation - replace with actual content generation
    const mockContent: GeneratedContent = {
      subject: this.generateSubject(context, profile, options),
      body: this.generateBody(context, profile, options),
      confidence: 0.85,
      suggestions: [
        'Consider adding a specific call-to-action',
        'Personalize the greeting based on relationship',
        'Add relevant industry context'
      ],
      voiceMatchScore: 0.82
    };

    return mockContent;
  }

  private generateSubject(
    context: string,
    profile: VoiceProfile,
    options: VoiceAnalysisOptions
  ): string {
    const urgencyPrefix = options['urgency'] === 'high' ? 'URGENT: ' : '';
    const purposeMap = {
      'follow-up': 'Following up on',
      'introduction': 'Introduction and',
      'proposal': 'Proposal for',
      'update': 'Update on',
      'closing': 'Next steps for'
    };

    const purposeText = purposeMap[options.purpose || 'follow-up'];
    return `${urgencyPrefix}${purposeText} ${context}`;
  }

  private generateBody(
    context: string,
    profile: VoiceProfile,
    options: VoiceAnalysisOptions
  ): string {
    const greeting = profile.patterns.greeting;
    const closing = profile.patterns.closing;
    
    let body = `${greeting}\n\n`;
    
    // RESEARCH-BACKED: Gong + 30MPC - Lead with observation, not generic openers
    switch (options.purpose) {
      case 'introduction':
        body += `Noticed your team is working on ${context} - companies at your stage typically see big wins by streamlining this.\n\n`;
        break;
      case 'follow-up':
        body += `Circling back on ${context}. Is this still a priority for your team right now?\n\n`;
        break;
      case 'proposal':
        body += `Based on our conversation, here's how we could help with ${context}:\n\n`;
        break;
      case 'update':
        body += `Quick update on ${context}:\n\n`;
        break;
      case 'closing':
        body += `Next steps for ${context}:\n\n`;
        break;
      default:
        body += `Quick question about ${context}:\n\n`;
    }

    // Add context-specific content
    body += `Based on our discussion, I believe there's a great opportunity to collaborate and create mutual value.\n\n`;
    
    // Add call to action
    body += `Would you be available for a brief call this week to discuss further?\n\n`;
    
    body += `${closing}`;

    return body;
  }

  async updateVoiceProfile(
    userId: string,
    updates: Partial<VoiceProfile>
  ): Promise<VoiceProfile> {
    // Mock implementation - replace with actual profile update
    const currentProfile = await this.getVoiceProfile(userId);
    return { ...currentProfile, ...updates };
  }

  async getVoiceProfile(userId: string): Promise<VoiceProfile> {
    // Mock implementation - replace with actual profile retrieval
    return {
      userId,
      tone: 'professional',
      style: 'conversational',
      vocabulary: {
        preferredTerms: ['opportunity', 'collaborate', 'solution'],
        avoidedTerms: ['problem', 'issue'],
        industryJargon: ['ROI', 'KPI']
      },
      patterns: {
        sentenceLength: 'medium',
        paragraphStructure: 'mixed',
        greeting: 'Hi there,',
        closing: 'Best regards'
      },
      personality: {
        assertiveness: 7,
        empathy: 8,
        directness: 6,
        formality: 5
      },
      examples: []
    };
  }

  async trainVoiceModel(userId: string, samples: string[]): Promise<void> {
    // Mock implementation - replace with actual model training
    console.log(`Training voice model for user ${userId} with ${samples.length} samples`);
  }
}

// Export singleton instance
export const voiceAnalysisService = new VoiceAnalysisService(); 