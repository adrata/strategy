import {
  PipelineData,
  AuthorityPost,
  EnrichedProfile,
  BuyerCompany,
  BuyerGroup,
} from "../types";

interface PersonalityVoice {
  hook: string;
  style: string;
  cta: string;
}

interface NoveltyScore {
  news: number;
  linkedin: number;
  combined: number;
  label: "Blue Ocean" | "Common";
}

const PERSONALITY_VOICES: Record<string, PersonalityVoice> = {
  Direct: {
    hook: "Let's get real:",
    style: "short, bold, actionable",
    cta: "What do you think? Comment below.",
  },
  "Data-Driven": {
    hook: "The numbers don't lie:",
    style: "evidence-based, analytical",
    cta: "Agree or disagree? Let's discuss.",
  },
  Consultative: {
    hook: "Here's what I'm seeing:",
    style: "insightful, advisory",
    cta: "Curious how others are approaching this—share your thoughts!",
  },
  Friendly: {
    hook: "Quick thought:",
    style: "warm, approachable",
    cta: "Would love your take!",
  },
  "Rule-Follower": {
    hook: "Best practice alert:",
    style: "structured, credible",
    cta: "How does your team handle this?",
  },
  Chatty: {
    hook: "Story time:",
    style: "conversational, engaging",
    cta: "Anyone else experienced this?",
  },
};

export class AuthorityContentGenerator {
  private inferDominantPersonality(personalities: string[]): string[] {
    if (!personalities.length) return ["Consultative"];
    const counts = new Map<string, number>();
    personalities.forEach((p) => counts.set(p, (counts.get(p) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([p]) => p);
  }

  private scoreInsight(
    insight: { confidence?: number; timestamp?: string; type?: string },
    focus?: string,
  ): number {
    let score = 0.0;
    if (insight.confidence) {
      score += insight.confidence * 2;
    }
    if (insight.timestamp) {
      const daysAgo =
        (Date.now() - new Date(insight.timestamp).getTime()) /
        (1000 * 60 * 60 * 24);
      score += Math.max(0, 1 - daysAgo / 30);
    }
    if (focus && insight.type?.toLowerCase().includes(focus.toLowerCase())) {
      score += 1.0;
    }
    return score;
  }

  private selectTopInsights(
    profile: EnrichedProfile | BuyerCompany | BuyerGroup,
    num: number = 4,
    focus?: string,
  ): Array<{ insight: string; type: string }> {
    const allInsights: Array<{ insight: string; type: string }> = [];

    if ("painPoints" in profile && profile.painPoints) {
      profile.painPoints.forEach((point: any) => {
        if (typeof point === "string") {
          allInsights.push({ insight: point, type: "pain_points" });
        } else if (point.description) {
          allInsights.push({ insight: point.description, type: "pain_points" });
        }
      });
    }

    if ("motivations" in profile && profile.motivations) {
      profile.motivations.forEach((motivation: any) => {
        if (motivation.description) {
          allInsights.push({ insight: motivation.description, type: "dreams" });
        }
      });
    }

    if ("insights" in profile && profile.insights) {
      profile.insights.forEach((insight: any) => {
        if (insight.description) {
          allInsights.push({
            insight: insight.description,
            type: "directional_intelligence",
          });
        }
      });
    }

    if (focus) {
      allInsights.filter((i) =>
        i.type.toLowerCase().includes(focus.toLowerCase()),
      );
    }

    allInsights.sort(
      (a, b) => this.scoreInsight(b, focus) - this.scoreInsight(a, focus),
    );
    return allInsights.slice(0, num).length
      ? allInsights.slice(0, num)
      : [{ insight: "Driving change in their industry.", type: "general" }];
  }

  private generateHashtags(insight: string): string[] {
    const tags: string[] = [];
    const lowerInsight = insight.toLowerCase();
    if (lowerInsight.includes("digital")) tags.push("#DigitalTransformation");
    if (lowerInsight.includes("growth")) tags.push("#Growth");
    if (lowerInsight.includes("security")) tags.push("#Cybersecurity");
    if (lowerInsight.includes("innovation")) tags.push("#Innovation");
    if (lowerInsight.includes("leadership")) tags.push("#Leadership");
    if (!tags.length) tags.push("#B2B");
    return tags;
  }

  private getWeekLabel(offset: number = 0): string {
    const now = new Date();
    now.setDate(now.getDate() + offset * 7);
    const year = now.getFullYear();
    const week = Math.ceil((now.getDate() + now.getDay()) / 7);
    return `${year}-W${week}`;
  }

  private async googleNewsNoveltyScore(insight: string): Promise<number> {
    try {
      const commonTerms = [
        "AI",
        "digital transformation",
        "cloud",
        "security",
        "growth",
      ];
      const isCommon = commonTerms.some((term) =>
        insight.toLowerCase().includes(term.toLowerCase()),
      );
      return isCommon ? 0.3 : 0.9;
    } catch (error) {
      console.error("Error calculating Google News novelty score:", error);
      return 0.5;
    }
  }

  private async googleCSELinkedInNoveltyScore(
    insight: string,
  ): Promise<number> {
    try {
      const linkedinSaturatedTopics = [
        "thought leadership",
        "innovation",
        "digital transformation",
        "growth mindset",
      ];
      const isSaturated = linkedinSaturatedTopics.some((topic) =>
        insight.toLowerCase().includes(topic.toLowerCase()),
      );
      return isSaturated ? 0.2 : 0.8;
    } catch (error) {
      console.error("Error calculating LinkedIn novelty score:", error);
      return 0.5;
    }
  }

  private async checkNovelty(insight: string): Promise<NoveltyScore> {
    const newsScore = await this.googleNewsNoveltyScore(insight);
    const linkedinScore = await this.googleCSELinkedInNoveltyScore(insight);
    const combinedScore = (newsScore + linkedinScore) / 2;

    return {
      news: Math.round(newsScore * 100) / 100,
      linkedin: Math.round(linkedinScore * 100) / 100,
      combined: Math.round(combinedScore * 100) / 100,
      label: combinedScore > 0.7 ? "Blue Ocean" : "Common",
    };
  }

  private generatePost(
    target: EnrichedProfile | BuyerCompany | BuyerGroup,
    insight: { insight: string; type: string },
    weekOffset: number,
  ): AuthorityPost {
    const targetName =
      "personName" in target
        ? target.personName
        : "name" in target
          ? target.name
          : "companyName" in target
            ? target.companyName
            : "Target Audience";

    const personalities =
      "personality" in target && typeof target['personality'] === "string"
        ? [target.personality]
        : "dominantPersonality" in target &&
            Array.isArray(target.dominantPersonality)
          ? target.dominantPersonality.filter(
              (p): p is string => typeof p === "string",
            )
          : [];

    const dominant = this.inferDominantPersonality(personalities);
    const voice = PERSONALITY_VOICES[dominant[0] || "Consultative"] ||
      PERSONALITY_VOICES["Consultative"] || {
        hook: "Here's what I'm seeing:",
        style: "insightful, advisory",
        cta: "Curious how others are approaching this—share your thoughts!",
      };
    const secondary = dominant[1] ? PERSONALITY_VOICES[dominant[1]] : null;

    const hook = voice.hook;
    let body = insight.insight;
    if (secondary) {
      body += ` (${secondary.style})`;
    }
    const cta = voice.cta;
    const post = `${hook} ${body}\n\n${cta}`;
    const hashtags = this.generateHashtags(body);

    return {
      id: `post-${targetName}-${weekOffset}`,
      title: `Authority Post for ${targetName}`,
      content: post,
      target: targetName,
      week: this.getWeekLabel(weekOffset),
      post,
      rationale: `This post addresses ${targetName}'s ${insight.type} and is written in a ${dominant.join(" + ")} voice, matching their dominant personalities.`,
      hashtags,
      timestamp: new Date().toISOString(),
      noveltyScoreNews: 0.9,
      noveltyScoreLinkedin: 0.85,
      noveltyLabelLinkedin: "Blue Ocean",
      noveltyScoreCombined: 0.875,
      noveltyLabel: "Blue Ocean",
      targetAudience: [targetName],
      channels: ["LinkedIn", "Blog"],
      metrics: {
        engagementRate: 0.05,
        reach: 1000,
        conversions: 10,
      },
    };
  }

  public async generateContent(
    data: PipelineData,
    numPosts: number = 4,
    focus?: string,
  ): Promise<AuthorityPost[]> {
    const posts: AuthorityPost[] = [];
    const targets = [
      ...(data.enrichedProfiles || []),
      ...(data.buyerCompanies || []),
      ...(data.buyerGroups || []),
    ];

    for (const target of targets) {
      const insights = this.selectTopInsights(target, numPosts, focus);
      for (let i = 0; i < insights.length; i++) {
        const insight = insights[i] || {
          insight: "Driving innovation in their industry.",
          type: "general",
        };
        const post = this.generatePost(target, insight, i);
        const novelty = await this.checkNovelty(post.post);
        posts.push({
          ...post,
          noveltyScoreNews: novelty.news,
          noveltyScoreLinkedin: novelty.linkedin,
          noveltyLabelLinkedin: novelty.label,
          noveltyScoreCombined: novelty.combined,
          noveltyLabel: novelty.label,
        });
      }
    }

    return posts;
  }
}

export async function generateAuthorityContent(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const generator = new AuthorityContentGenerator();
  const posts = await generator.generateContent(data);
  return { authorityContent: posts };
}
