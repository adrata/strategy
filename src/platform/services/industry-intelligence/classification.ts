// Industry Classification - Extracted from 1,309-line monolithic industry-intelligence.ts

import type { CompanyData, CompanyClassification } from "./types";
import { industryIntelligence } from "./service";

/**
 * Classify a company into an industry using AI-powered analysis
 */
export async function classifyCompany(
  company: CompanyData,
): Promise<CompanyClassification[]> {
  return industryIntelligence.classifyCompany(company);
}

/**
 * Classify industry by name/description
 */
export async function classifyIndustry(
  industryName: string,
): Promise<CompanyClassification[]> {
  return industryIntelligence.classifyIndustry(industryName);
}

/**
 * Basic classification using keyword matching
 */
export function basicClassification(
  company: CompanyData,
): CompanyClassification[] {
  return industryIntelligence.classifyCompany(company);
}

/**
 * Advanced AI-powered classification (placeholder for future implementation)
 */
export async function aiClassification(
  company: CompanyData,
): Promise<CompanyClassification[]> {
  // Fallback to basic classification for now
  return basicClassification(company);
}
