/**
 * Step 27: AI Title Normalization & Cleaning
 * Uses OpenAI to clean and normalize job titles for better consistency
 */

import { PipelineStep, PipelineData, Person } from "../types";
import { openaiService } from "@/platform/ai/services/openaiService";

export const normalizeTitles: PipelineStep = {
  id: 27,
  name: "Normalize Titles",
  description: "Clean and normalize job titles using AI",
  run: async (data: PipelineData): Promise<PipelineData> => {
    console.log("🎯 Step 27: Starting AI title normalization...");

    try {
      // Get all people with titles that need normalization
      const peopleWithTitles = data.peopleData.filter(
        (person) => person['title'] && person.title.trim(),
      );

      if (peopleWithTitles['length'] === 0) {
        console.log("📝 No titles to normalize");
        return data;
      }

      console.log(`📝 Normalizing ${peopleWithTitles.length} titles...`);

      // Process titles in batches for efficiency
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < peopleWithTitles.length; i += batchSize) {
        batches.push(peopleWithTitles.slice(i, i + batchSize));
      }

      let normalizedCount = 0;

      for (const batch of batches) {
        const titles = batch.map((person) => person.title);
        const normalizedTitles = await normalizeTitleBatch(titles);

        // Update the people with normalized titles
        batch.forEach((person, index) => {
          if (
            normalizedTitles[index] &&
            normalizedTitles[index] !== person.title
          ) {
            console.log(
              `📝 Normalized: "${person.title}" → "${normalizedTitles[index]}"`,
            );
            person['title'] = normalizedTitles[index];
            normalizedCount++;
          }
        });
      }

      console.log(`✅ Step 27: Normalized ${normalizedCount} titles`);

      return {
        ...data,
        // TODO: Add metadata to PipelineData type
      };
    } catch (error) {
      console.error("❌ Step 27: Title normalization failed:", error);
      return data; // Return original data if normalization fails
    }
  },
  validate: (data: PipelineData): boolean => {
    return data.peopleData.length > 0;
  },
};

/**
 * Normalize a batch of titles using AI
 */
async function normalizeTitleBatch(titles: string[]): Promise<string[]> {
  const prompt = `Clean and normalize these job titles. Return ONLY the normalized titles, one per line, in the same order. Make them professional, standardized, and consistent:

Rules:
- Standardize common abbreviations (VP → Vice President, Dir → Director, etc.)
- Use proper title case
- Remove unnecessary punctuation and special characters
- Standardize department names (Eng → Engineering, Ops → Operations, etc.)
- Keep titles concise but descriptive
- Use standard corporate hierarchy terms

Titles to normalize:
${titles.map((title, i) => `${i + 1}. ${title}`).join("\n")}

Normalized titles:`;

  try {
    const response = await openaiService.generateContent(prompt, {
      temperature: 0.1, // Low temperature for consistency
      maxTokens: 500,
    });

    const normalizedTitles = response
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0);

    // Ensure we have the same number of results
    if (normalizedTitles.length !== titles.length) {
      console.warn("⚠️ Mismatch in normalized titles count, using originals");
      return titles;
    }

    return normalizedTitles;
  } catch (error) {
    console.error("❌ AI title normalization failed:", error);
    return titles; // Return original titles if AI fails
  }
}

/**
 * Common title normalization patterns (fallback)
 */
const titleNormalizationMap: Record<string, string> = {
  // Common abbreviations
  VP: "Vice President",
  SVP: "Senior Vice President",
  EVP: "Executive Vice President",
  Dir: "Director",
  "Sr Dir": "Senior Director",
  Mgr: "Manager",
  "Sr Mgr": "Senior Manager",
  Eng: "Engineering",
  Ops: "Operations",
  "Biz Dev": "Business Development",
  RevOps: "Revenue Operations",
  DevOps: "Development Operations",
  SRE: "Site Reliability Engineer",

  // Common patterns
  CTO: "Chief Technology Officer",
  CRO: "Chief Revenue Officer",
  CMO: "Chief Marketing Officer",
  CFO: "Chief Financial Officer",
  CEO: "Chief Executive Officer",
  COO: "Chief Operating Officer",

  // Department standardization
  "Sales Rep": "Sales Representative",
  "Account Exec": "Account Executive",
  SDR: "Sales Development Representative",
  BDR: "Business Development Representative",
  CSM: "Customer Success Manager",
  TAM: "Technical Account Manager",
};

/**
 * Fallback title normalization using patterns
 */
function fallbackTitleNormalization(title: string): string {
  let normalized = title.trim();

  // Apply common replacements
  Object.entries(titleNormalizationMap).forEach(([pattern, replacement]) => {
    const regex = new RegExp(`\\b${pattern}\\b`, "gi");
    normalized = normalized.replace(regex, replacement);
  });

  // Convert to proper title case
  normalized = normalized
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Clean up extra spaces and punctuation
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

export { normalizeTitles as default };
