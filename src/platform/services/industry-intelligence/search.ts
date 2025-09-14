// Search Functionality - Extracted from 1,309-line monolithic industry-intelligence.ts

import type {
  IndustryDefinition,
  SearchCriteria,
  IndustrySearchResult,
} from "./types";
import {
  getAllIndustries,
  getIndustriesBySector,
  getIndustriesByVertical,
} from "./database";

/**
 * Search industries by criteria
 */
export function searchIndustries(
  criteria: SearchCriteria,
): IndustrySearchResult[] {
  let industries = getAllIndustries();

  // Filter by sector
  if (criteria.sector) {
    industries = industries.filter(
      (industry) => industry['sector'] === criteria.sector,
    );
  }

  // Filter by vertical
  if (criteria.vertical) {
    industries = industries.filter(
      (industry) => industry['vertical'] === criteria.vertical,
    );
  }

  // Filter by market
  if (criteria.market) {
    industries = industries.filter(
      (industry) => industry['market'] === criteria.market,
    );
  }

  // Filter by maturity
  if (criteria.maturity) {
    industries = industries.filter(
      (industry) => industry['maturity'] === criteria.maturity,
    );
  }

  // Filter by growth rate
  if (criteria.growthRate) {
    industries = industries.filter((industry) => {
      const rate = industry.growthRate;
      return (
        (!criteria.growthRate!.min || rate >= criteria.growthRate!.min) &&
        (!criteria.growthRate!.max || rate <= criteria.growthRate!.max)
      );
    });
  }

  // Convert to search results with relevance scores
  return industries
    .map((industry) => ({
      industry,
      relevanceScore: calculateRelevanceScore(industry, criteria),
      matchedFields: getMatchedFields(industry, criteria),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Search industries by text
 */
export function searchIndustriesByText(query: string): IndustrySearchResult[] {
  const industries = getAllIndustries();
  const queryLower = query.toLowerCase();

  return industries
    .map((industry) => {
      let score = 0;
      const matchedFields: string[] = [];

      // Check name match
      if (industry.name.toLowerCase().includes(queryLower)) {
        score += 2;
        matchedFields.push("name");
      }

      // Check description match
      if (industry.description.toLowerCase().includes(queryLower)) {
        score += 1;
        matchedFields.push("description");
      }

      // Check keywords match
      const keywords = [
        ...industry.technologies,
        ...industry.painPoints,
        ...industry.opportunities,
      ];
      const keywordMatches = keywords.filter((keyword) =>
        keyword.toLowerCase().includes(queryLower),
      );
      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 0.5;
        matchedFields.push("keywords");
      }

      return {
        industry,
        relevanceScore: score,
        matchedFields,
      };
    })
    .filter((result) => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(
  industry: IndustryDefinition,
  criteria: SearchCriteria,
): number {
  let score = 1; // Base score

  // Boost score for exact matches
  if (criteria['sector'] === industry.sector) score += 0.5;
  if (criteria['vertical'] === industry.vertical) score += 0.3;
  if (criteria['market'] === industry.market) score += 0.2;
  if (criteria['maturity'] === industry.maturity) score += 0.1;

  return score;
}

/**
 * Get matched fields for search results
 */
function getMatchedFields(
  industry: IndustryDefinition,
  criteria: SearchCriteria,
): string[] {
  const matchedFields: string[] = [];

  if (criteria['sector'] === industry.sector) matchedFields.push("sector");
  if (criteria['vertical'] === industry.vertical) matchedFields.push("vertical");
  if (criteria['market'] === industry.market) matchedFields.push("market");
  if (criteria['maturity'] === industry.maturity) matchedFields.push("maturity");

  return matchedFields;
}
