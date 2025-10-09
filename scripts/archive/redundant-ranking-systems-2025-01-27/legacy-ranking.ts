// Ranking Algorithms - Extracted from 1,958-line monolithic SpeedrunRanking.ts

import type { CRMRecord } from "../types";
import type { RankedContact, SpeedrunUserSettings, CRMData } from "./types";
import {
  calculateDaysSinceContact,
  calculateFreshnessFactor,
  determineCompanySize,
  extractDealValue,
  detectEmailEngagement,
  calculateIndividualScore,
  generateEnhancedRankingReason,
} from "./scoring";
import { calculateOptimalContactTime as getTimingInfo } from "./timing";
import { COMPANY_RANKING_WEIGHTS, COMPANY_SIZE_MULTIPLIERS } from "./constants";

/**
 * 🏢 COMPANY-FIRST RANKING SYSTEM
 * Ranks companies first, then finds optimal people within those companies
 */
function rankCompaniesByValue(contacts: CRMRecord[]): Record<string, number> {
  const companyStats: Record<
    string,
    {
      totalValue: number;
      opportunityCount: number;
      avgDealSize: number;
      maxDealValue: number;
      activeDeals: number;
      companySize: string;
      highInfluenceContacts: number;
    }
  > = {};

  // Aggregate company-level metrics
  contacts.forEach((contact) => {
    const company = contact.company || "Unknown Company";
    if (!companyStats[company]) {
      companyStats[company] = {
        totalValue: 0,
        opportunityCount: 0,
        avgDealSize: 0,
        maxDealValue: 0,
        activeDeals: 0,
        companySize: "SMB",
        highInfluenceContacts: 0,
      };
    }

    const stats = companyStats[company];
    const dealValue = extractDealValue(contact);

    stats.totalValue += dealValue;
    stats.opportunityCount += 1;
    stats['maxDealValue'] = Math.max(stats.maxDealValue, dealValue);

    if (
      contact['status'] === "Qualified" ||
      contact['status'] === "Negotiate" ||
      contact['status'] === "Decision"
    ) {
      stats.activeDeals += 1;
    }

    if (
      contact['influence'] === "High" ||
      contact['buyerGroupRole'] === "Decision Maker" ||
      contact['buyerGroupRole'] === "Champion"
    ) {
      stats.highInfluenceContacts += 1;
    }

    // Update company size to the largest seen
    const contactCompanySize = determineCompanySize(contact);
    if (
      contactCompanySize === "Enterprise" ||
      (contactCompanySize === "Mid-Market" && stats['companySize'] === "SMB")
    ) {
      stats['companySize'] = contactCompanySize;
    }
  });

  // Calculate company ranking scores
  const companyRankings: Record<string, number> = {};
  Object.entries(companyStats).forEach(([company, stats]) => {
    stats['avgDealSize'] =
      stats.opportunityCount > 0
        ? stats.totalValue / stats.opportunityCount
        : 0;

    let companyScore = 0;

    // Total pipeline value (40% of score)
    companyScore += Math.min(stats.totalValue / 50000, 20); // Max 20 points for $1M+ pipeline

    // Average deal size (25% of score)
    companyScore += Math.min(stats.avgDealSize / 25000, 12.5); // Max 12.5 points for $500K+ avg

    // Active deals momentum (20% of score)
    companyScore += stats.activeDeals * 2.5; // 2.5 points per active deal

    // High-influence contacts (10% of score)
    companyScore += stats.highInfluenceContacts * 1.25; // 1.25 points per champion/decision maker

    // Company size multiplier (5% of score)
    const sizeMultiplier =
      stats['companySize'] === "Enterprise"
        ? 3
        : stats['companySize'] === "Mid-Market"
          ? 2
          : 1;
    companyScore += sizeMultiplier;

    companyRankings[company] = companyScore;
  });

  return companyRankings;
}

/**
 * 🎯 SMART INDIVIDUAL RANKING WITHIN COMPANIES
 * Finds the best people to contact at each company
 */
function rankIndividualsWithinCompany(
  companyContacts: CRMRecord[],
  settings: SpeedrunUserSettings,
): RankedContact[] {
  return companyContacts.map((contact) => {
    const daysSinceContact = calculateDaysSinceContact(contact.lastActionDate);
    const estimatedDealValue = extractDealValue(contact);
    const companySize = determineCompanySize(contact);
    const freshnessFactor = calculateFreshnessFactor(contact.id);

    // Enhanced time zone and engagement detection
    const emailEngagement = detectEmailEngagement(contact);
    const timingInfo = getTimingInfo(contact);

    const enhancedContact: RankedContact = {
      ...contact,
      daysSinceLastContact: daysSinceContact,
      estimatedDealValue,
      companySize,
      freshnessFactor,
      rankingScore: 0,
      rankingReason: "",
      priority: "Medium",
      emailEngagementScore: emailEngagement.emailScore,
      readyToBuyScore: emailEngagement.readyToBuyScore,
      timeZone: timingInfo.timeZone,
      optimalContactTime: timingInfo.optimalTime,
      callingPriority: timingInfo.callingPriority,
      callingWindow: timingInfo.callingWindow,
    };

    // Calculate individual score within company
    enhancedContact['rankingScore'] = calculateIndividualScore(
      enhancedContact,
      settings,
    );

    // Generate ranking reason
    enhancedContact['rankingReason'] = generateEnhancedRankingReason(
      enhancedContact,
      settings,
    );

    // Set priority based on score
    if (enhancedContact.rankingScore >= 30) enhancedContact['priority'] = "High";
    else if (enhancedContact.rankingScore >= 15)
      enhancedContact['priority'] = "Medium";
    else enhancedContact['priority'] = "Low";

    return enhancedContact;
  });
}

/**
 * 🚀 ULTIMATE MARK_I RANKING SYSTEM
 * Company-first ranking with time zone optimization and smart individual selection
 */
export function rankContacts(
  contacts: CRMRecord[],
  settings: SpeedrunUserSettings,
): RankedContact[] {
  // Step 1: Rank companies by value and potential
  const companyRankings = rankCompaniesByValue(contacts);

  // Step 2: Group contacts by company
  const contactsByCompany: Record<string, CRMRecord[]> = {};
  contacts.forEach((contact) => {
    const company = contact.company || "Unknown Company";
    if (!contactsByCompany[company]) {
      contactsByCompany[company] = [];
    }
    contactsByCompany[company].push(contact);
  });

  // Step 3: Rank individuals within each company and combine with company score
  const allRankedContacts: RankedContact[] = [];

  Object.entries(contactsByCompany).forEach(([company, companyContacts]) => {
    const companyScore = companyRankings[company] || 0;
    const rankedIndividuals = rankIndividualsWithinCompany(
      companyContacts,
      settings,
    );

    // Add company ranking score to each individual
    rankedIndividuals.forEach((individual) => {
      individual['companyRankingScore'] = companyScore;
      // Combine company score (60%) + individual score (40%) for final ranking
      const combinedScore = companyScore * 0.6 + individual.rankingScore * 0.4;
      individual['rankingScore'] = combinedScore;
    });

    allRankedContacts.push(...rankedIndividuals);
  });

  // Step 4: Final sort by combined score and time zone priority
  const finalRanking = allRankedContacts.sort((a, b) => {
    // First, sort by time zone calling priority (higher = call earlier in day)
    const priorityDiff = (b.callingPriority || 3) - (a.callingPriority || 3);
    if (priorityDiff !== 0) {
      return priorityDiff; // Higher calling priority first
    }

    // Then by ranking score (higher = more important)
    return b.rankingScore - a.rankingScore;
  });

  console.log(
    `🏢 Company-first ranking complete: ${Object.keys(contactsByCompany).length} companies, ${finalRanking.length} total contacts`,
  );
  console.log(`🌍 Time zone distribution:`, {
    "High Priority (Same/Similar TZ)": finalRanking.filter(
      (c) => (c.callingPriority || 0) >= 4,
    ).length,
    "Medium Priority (West Coast)": finalRanking.filter(
      (c) => (c.callingPriority || 0) === 3,
    ).length,
    "Low Priority (Asia/Australia)": finalRanking.filter(
      (c) => (c.callingPriority || 0) <= 2,
    ).length,
  });

  return finalRanking;
}

/**
 * Source contacts from Pipeline data
 */
export function sourceContactsFromCRM(
  crmData: CRMData,
  settings: SpeedrunUserSettings,
): CRMRecord[] {
  console.log("📊 Sourcing contacts from Pipeline data...");

  // Combine all contact sources
  const allContacts = [
    ...(crmData.leads || []),
    ...(crmData.contacts || []),
    ...(crmData.buyerGroups || []),
    ...(crmData.opportunities || []),
  ];

  console.log(`📋 Sourced ${allContacts.length} total contacts from CRM`);
  console.log(
    `📈 Pipeline breakdown: ${crmData.leads?.length || 0} leads, ${crmData.contacts?.length || 0} contacts, ${crmData.buyerGroups?.length || 0} buyer groups, ${crmData.opportunities?.length || 0} opportunities`,
  );

  // Remove duplicates based on email or name+company
  const uniqueContacts = allContacts.filter((contact, index, array) => {
    return (
      array.findIndex(
        (c) =>
          (c['email'] && c['email'] === contact.email) ||
          (c['name'] === contact['name'] && c['company'] === contact.company),
      ) === index
    );
  });

  console.log(
    `🔄 After deduplication: ${uniqueContacts.length} unique contacts`,
  );

  return uniqueContacts;
}
