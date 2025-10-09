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
 * 🏢 HIERARCHICAL COMPANY RANKING SYSTEM
 * Ranks companies 1-400, then people 1-4000 within each company
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

  // Calculate company ranking scores and limit to top 400 companies
  const companyRankings: Record<string, number> = {};
  const scoredCompanies: Array<{ company: string; score: number; stats: any }> = [];
  
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

    scoredCompanies.push({ company, score: companyScore, stats });
  });

  // Sort by score and limit to top 400 companies
  const topCompanies = scoredCompanies
    .sort((a, b) => b.score - a.score)
    .slice(0, 400); // Limit to top 400 companies

  // Assign ranks 1-400
  topCompanies.forEach((item, index) => {
    companyRankings[item.company] = item.score;
  });

  console.log(`🏢 [HIERARCHICAL] Ranked ${topCompanies.length} companies (top 400)`);
  return companyRankings;
}

/**
 * 🎯 HIERARCHICAL INDIVIDUAL RANKING WITHIN COMPANIES
 * Ranks people 1-4000 within each company, then creates sub-rankings
 */
function rankIndividualsWithinCompany(
  companyContacts: CRMRecord[],
  settings: SpeedrunUserSettings,
): RankedContact[] {
  // Limit to top 4000 people per company
  const limitedContacts = companyContacts.slice(0, 4000);
  
  return limitedContacts.map((contact) => {
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
 * 🚀 HIERARCHICAL RANKING SYSTEM
 * Companies 1-400, People 1-4000 within company, Sub-rankings for leads/prospects/opportunities
 */
export function rankContacts(
  contacts: CRMRecord[],
  settings: SpeedrunUserSettings,
): RankedContact[] {
  // Step 1: Rank companies by value and potential (1-400)
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

  // Step 3: Rank individuals within each company (1-4000 per company)
  const allRankedContacts: RankedContact[] = [];
  let globalPersonRank = 1;

  Object.entries(contactsByCompany).forEach(([company, companyContacts]) => {
    const companyScore = companyRankings[company] || 0;
    
    // Only process companies that made it to top 400
    if (companyScore > 0) {
      const rankedIndividuals = rankIndividualsWithinCompany(
        companyContacts,
        settings,
      );

      // Add company ranking score and assign hierarchical ranks
      rankedIndividuals.forEach((individual, index) => {
        individual['companyRankingScore'] = companyScore;
        individual['companyRank'] = Object.keys(companyRankings).indexOf(company) + 1; // 1-400
        individual['personRank'] = index + 1; // 1-4000 within company
        individual['globalPersonRank'] = globalPersonRank + index; // Global rank across all people
        
        // Combine company score (60%) + individual score (40%) for final ranking
        const combinedScore = companyScore * 0.6 + individual.rankingScore * 0.4;
        individual['rankingScore'] = combinedScore;
      });

      allRankedContacts.push(...rankedIndividuals);
      globalPersonRank += rankedIndividuals.length;
    }
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
    `🏢 [HIERARCHICAL] Ranking complete: ${Object.keys(companyRankings).length} companies (top 400), ${finalRanking.length} people ranked`,
  );
  console.log(`📊 [HIERARCHICAL] Company distribution:`, {
    "Top 100 Companies": finalRanking.filter(c => (c.companyRank || 0) <= 100).length,
    "Top 200 Companies": finalRanking.filter(c => (c.companyRank || 0) <= 200).length,
    "Top 400 Companies": finalRanking.filter(c => (c.companyRank || 0) <= 400).length,
  });
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
 * 🚀 GENERATE SPEEDRUN LIST (Top 30-50 People)
 * Returns the top people across all companies for daily calling
 */
export function generateSpeedrunList(
  rankedContacts: RankedContact[],
  limit: number = 50
): RankedContact[] {
  console.log(`🚀 [SPEEDRUN] Generating speedrun list with top ${limit} people`);
  
  // Sort by global person rank and take top N
  const speedrunList = rankedContacts
    .sort((a, b) => (a.globalPersonRank || 0) - (b.globalPersonRank || 0))
    .slice(0, limit);
  
  console.log(`✅ [SPEEDRUN] Generated speedrun list with ${speedrunList.length} people`);
  console.log(`📊 [SPEEDRUN] Top companies in speedrun:`, 
    speedrunList.slice(0, 10).map(c => 
      `${c.companyRank || 'N/A'}. ${c.company} - ${c.name} (Rank: ${c.globalPersonRank})`
    )
  );
  
  return speedrunList;
}

/**
 * 📋 CREATE SUB-RANKINGS FOR LEADS/PROSPECTS/OPPORTUNITIES
 * Creates sub-rankings within each person's records
 */
export function createSubRankings(
  rankedContacts: RankedContact[],
  leads: any[] = [],
  prospects: any[] = [],
  opportunities: any[] = []
): {
  leads: Array<any & { subRank: number; personRank: number }>;
  prospects: Array<any & { subRank: number; personRank: number }>;
  opportunities: Array<any & { subRank: number; personRank: number }>;
} {
  console.log(`📋 [SUB-RANKINGS] Creating sub-rankings for leads/prospects/opportunities`);
  
  const subRankedLeads: any[] = [];
  const subRankedProspects: any[] = [];
  const subRankedOpportunities: any[] = [];
  
  // Create person lookup map
  const personMap = new Map<string, RankedContact>();
  rankedContacts.forEach(contact => {
    if (contact.id) personMap.set(contact.id, contact);
  });
  
  // Process leads
  leads.forEach(lead => {
    const person = personMap.get(lead.personId);
    if (person) {
      subRankedLeads.push({
        ...lead,
        subRank: 1, // TODO: Calculate actual sub-rank within person
        personRank: person.personRank || 0,
        companyRank: person.companyRank || 0
      });
    }
  });
  
  // Process prospects
  prospects.forEach(prospect => {
    const person = personMap.get(prospect.personId);
    if (person) {
      subRankedProspects.push({
        ...prospect,
        subRank: 1, // TODO: Calculate actual sub-rank within person
        personRank: person.personRank || 0,
        companyRank: person.companyRank || 0
      });
    }
  });
  
  // Process opportunities
  opportunities.forEach(opportunity => {
    const person = personMap.get(opportunity.personId);
    if (person) {
      subRankedOpportunities.push({
        ...opportunity,
        subRank: 1, // TODO: Calculate actual sub-rank within person
        personRank: person.personRank || 0,
        companyRank: person.companyRank || 0
      });
    }
  });
  
  console.log(`✅ [SUB-RANKINGS] Created sub-rankings: ${subRankedLeads.length} leads, ${subRankedProspects.length} prospects, ${subRankedOpportunities.length} opportunities`);
  
  return {
    leads: subRankedLeads,
    prospects: subRankedProspects,
    opportunities: subRankedOpportunities
  };
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
