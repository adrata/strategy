import { prisma } from "@/platform/prisma";
import { Prisma } from "@prisma/client";

interface ScoringWeights {
  email: number;
  meeting: number;
  event: number;
  decisionMaker: number;
  group: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  email: 0.3,
  meeting: 0.3,
  event: 0.2,
  decisionMaker: 0.1,
  group: 0.1,
};

type CompanyWithRelations = {
  id: string;
  sellerProfiles: {
    id: string;
    contacts: {
      id: string;
    }[];
  }[];
  buyerProfiles: {
    id: string;
    groups: {
      id: string;
      decisionMakers: {
        id: string;
      }[];
    }[];
  }[];
};

type PersonWithRelations = {
  id: string;
  groups: {
    id: string;
    decisionMakers: {
      id: string;
    }[];
  }[];
  decisionMakers: {
    id: string;
  }[];
};

export class ScoringService {
  private weights: ScoringWeights;

  constructor(weights: Partial<ScoringWeights> = {}) {
    this['weights'] = { ...DEFAULT_WEIGHTS, ...weights };
  }

  async scoreCompany(companyId: string): Promise<{
    score: number;
    insights: string[];
  }> {
    const company = (await prisma.accounts.findUnique({
      where: { id: companyId },
      include: {
        sellerProfiles: {
          include: {
            contacts: true,
          },
        },
        buyerProfiles: {
          include: {
            groups: {
              include: {
                decisionMakers: true,
              },
            },
          },
        },
      },
    })) as CompanyWithRelations | null;

    if (!company) {
      throw new Error("Company not found");
    }

    const emailScore = this.calculateEmailScore(company);
    const meetingScore = this.calculateMeetingScore(company);
    const eventScore = this.calculateEventScore(company);
    const decisionMakerScore = this.calculateDecisionMakerScore(company);
    const groupScore = this.calculateGroupScore(company);

    const totalScore =
      emailScore * this.weights.email +
      meetingScore * this.weights.meeting +
      eventScore * this.weights.event +
      decisionMakerScore * this.weights.decisionMaker +
      groupScore * this.weights.group;

    const insights = this.generateCompanyInsights(company, {
      emailScore,
      meetingScore,
      eventScore,
      decisionMakerScore,
      groupScore,
    });

    return {
      score: totalScore,
      insights,
    };
  }

  async scoreContact(contactId: string): Promise<{
    score: number;
    insights: string[];
  }> {
    const contact = (await prisma.people.findUnique({
      where: { id: contactId },
      include: {
        groups: {
          include: {
            decisionMakers: true,
          },
        },
        decisionMakers: true,
      },
    })) as PersonWithRelations | null;

    if (!contact) {
      throw new Error("Contact not found");
    }

    const emailScore = this.calculateContactEmailScore(contact);
    const meetingScore = this.calculateContactMeetingScore(contact);
    const eventScore = this.calculateContactEventScore(contact);
    const decisionMakerScore = this.calculateContactDecisionMakerScore(contact);
    const groupScore = this.calculateContactGroupScore(contact);

    const totalScore =
      emailScore * this.weights.email +
      meetingScore * this.weights.meeting +
      eventScore * this.weights.event +
      decisionMakerScore * this.weights.decisionMaker +
      groupScore * this.weights.group;

    const insights = this.generateContactInsights(contact, {
      emailScore,
      meetingScore,
      eventScore,
      decisionMakerScore,
      groupScore,
    });

    return {
      score: totalScore,
      insights,
    };
  }

  private calculateEmailScore(company: CompanyWithRelations): number {
    const emailCount = company.sellerProfiles.reduce(
      (total: number, profile) => total + profile.contacts.length,
      0,
    );
    return Math.min(emailCount / 10, 1);
  }

  private calculateMeetingScore(company: CompanyWithRelations): number {
    const meetingCount = company.sellerProfiles.reduce(
      (total: number, profile) => total + profile.contacts.length,
      0,
    );
    return Math.min(meetingCount / 5, 1);
  }

  private calculateEventScore(company: CompanyWithRelations): number {
    const eventCount = company.sellerProfiles.reduce(
      (total: number, profile) => total + profile.contacts.length,
      0,
    );
    return Math.min(eventCount / 3, 1);
  }

  private calculateDecisionMakerScore(company: CompanyWithRelations): number {
    const decisionMakerCount = company.buyerProfiles.reduce(
      (total: number, profile) =>
        total +
        profile.groups.reduce(
          (groupTotal: number, group) =>
            groupTotal + group.decisionMakers.length,
          0,
        ),
      0,
    );
    return Math.min(decisionMakerCount / 3, 1);
  }

  private calculateGroupScore(company: CompanyWithRelations): number {
    const groupCount = company.buyerProfiles.reduce(
      (total: number, profile) => total + profile.groups.length,
      0,
    );
    return Math.min(groupCount / 2, 1);
  }

  private calculateContactEmailScore(contact: PersonWithRelations): number {
    return Math.min(contact.groups.length / 5, 1);
  }

  private calculateContactMeetingScore(contact: PersonWithRelations): number {
    return Math.min(contact.groups.length / 3, 1);
  }

  private calculateContactEventScore(contact: PersonWithRelations): number {
    return Math.min(contact.groups.length / 2, 1);
  }

  private calculateContactDecisionMakerScore(
    contact: PersonWithRelations,
  ): number {
    return contact.decisionMakers.length > 0 ? 1 : 0;
  }

  private calculateContactGroupScore(contact: PersonWithRelations): number {
    return contact.groups.length > 0 ? 1 : 0;
  }

  private generateCompanyInsights(
    company: CompanyWithRelations,
    scores: {
      emailScore: number;
      meetingScore: number;
      eventScore: number;
      decisionMakerScore: number;
      groupScore: number;
    },
  ): string[] {
    const insights: string[] = [];

    if (scores.emailScore > 0.7) {
      insights.push("High email engagement with multiple team members");
    } else if (scores.emailScore < 0.3) {
      insights.push(
        "Limited email communication - consider increasing outreach",
      );
    }

    if (scores.meetingScore > 0.7) {
      insights.push("Strong meeting presence with regular interactions");
    } else if (scores.meetingScore < 0.3) {
      insights.push(
        "Few meetings scheduled - opportunity to increase face-to-face engagement",
      );
    }

    if (scores.eventScore > 0.7) {
      insights.push("Active participation in company events");
    } else if (scores.eventScore < 0.3) {
      insights.push(
        "Limited event participation - consider inviting to more events",
      );
    }

    if (scores.decisionMakerScore > 0.7) {
      insights.push("Strong connections with key decision makers");
    } else if (scores.decisionMakerScore < 0.3) {
      insights.push(
        "Limited engagement with decision makers - focus on building these relationships",
      );
    }

    if (scores.groupScore > 0.7) {
      insights.push("Well integrated into multiple buyer groups");
    } else if (scores.groupScore < 0.3) {
      insights.push(
        "Limited integration with buyer groups - opportunity to expand network",
      );
    }

    return insights;
  }

  private generateContactInsights(
    contact: PersonWithRelations,
    scores: {
      emailScore: number;
      meetingScore: number;
      eventScore: number;
      decisionMakerScore: number;
      groupScore: number;
    },
  ): string[] {
    const insights: string[] = [];

    if (scores.emailScore > 0.7) {
      insights.push("High email engagement with regular communication");
    } else if (scores.emailScore < 0.3) {
      insights.push(
        "Limited email communication - consider increasing outreach",
      );
    }

    if (scores.meetingScore > 0.7) {
      insights.push("Regular meeting attendance and active participation");
    } else if (scores.meetingScore < 0.3) {
      insights.push(
        "Few meetings attended - opportunity to increase face-to-face engagement",
      );
    }

    if (scores.eventScore > 0.7) {
      insights.push("Active participation in company events");
    } else if (scores.eventScore < 0.3) {
      insights.push(
        "Limited event participation - consider inviting to more events",
      );
    }

    if (scores['decisionMakerScore'] === 1) {
      insights.push("Key decision maker in the organization");
    }

    if (scores['groupScore'] === 1) {
      insights.push("Integrated into buyer group structure");
    }

    return insights;
  }
}
