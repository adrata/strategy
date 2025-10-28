/**
 * ROLE FINDER SERVICE
 * 
 * AI-powered role discovery service for finding specific roles (CFO, CTO, etc.) at companies
 * Converted from _future_now/find_role.js to TypeScript
 */

import { prisma } from '@/platform/database/prisma-client';
import type {
  RoleFinderOptions,
  RoleFinderResult,
  RoleVariations,
  PersonMatch,
  CompanyInfo
} from '../types';

export class RoleFinder {
  private apiKey: string;
  private claudeApiKey?: string;
  private delayBetweenRequests = 1000;

  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY || '';
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;

    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
  }

  /**
   * Find a specific role at a company
   * Main entry point for role finding
   */
  async findRole(options: RoleFinderOptions): Promise<RoleFinderResult> {
    const startTime = Date.now();
    const {
      role,
      companyName,
      companyId,
      companyLinkedInUrl,
      workspaceId,
      maxResults = 1,
      enrichmentLevel = 'identify',
      useAI = true
    } = options;

    console.log(`🎯 [ROLE FINDER] Starting search for: ${role}`);
    console.log(`   Company: ${companyName || companyId || companyLinkedInUrl}`);
    console.log(`   Workspace: ${workspaceId}`);

    try {
      // Step 1: Find the company
      const company = await this.findCompany({
        companyName,
        companyId,
        companyLinkedInUrl,
        workspaceId
      });

      if (!company) {
        throw new Error('Company not found');
      }

      console.log(`🏢 Found company: ${company.name}`);

      // Step 2: Generate role variations using AI
      const roleVariations = await this.generateRoleVariations(role, {
        companyName: company.name,
        industry: company.industry || 'Technology',
        website: company.website,
        useAI
      });

      console.log(`🔍 Generated ${roleVariations.primary.length + roleVariations.secondary.length + roleVariations.tertiary.length} role variations`);

      // Step 3: Search for people with these roles
      const matches = await this.searchForRoleMatches(company, roleVariations, maxResults);

      // Step 4: Process and enrich matches based on level
      const enrichedMatches = await this.enrichMatches(matches, enrichmentLevel, workspaceId);

      const processingTime = Date.now() - startTime;

      console.log(`✅ [ROLE FINDER] Complete! Found ${enrichedMatches.length} matches in ${processingTime}ms`);

      return {
        success: true,
        person: enrichedMatches[0],
        people: enrichedMatches,
        confidence: enrichedMatches[0]?.confidence || 0,
        tier: enrichedMatches[0]?.tier || 0,
        company,
        processingTime,
        creditsUsed: {
          search: matches.length,
          collect: enrichedMatches.length
        }
      };
    } catch (error) {
      console.error('❌ [ROLE FINDER] Error:', error);
      throw error;
    }
  }

  /**
   * Find company in database
   */
  private async findCompany(options: {
    companyName?: string;
    companyId?: string;
    companyLinkedInUrl?: string;
    workspaceId: string;
  }): Promise<CompanyInfo | null> {
    const { companyName, companyId, companyLinkedInUrl, workspaceId } = options;

    // Try by ID first
    if (companyId) {
      const company = await prisma.companies.findFirst({
        where: {
          id: companyId,
          workspaceId,
          deletedAt: null
        }
      });

      if (company) {
        return {
          id: company.id,
          name: company.name,
          website: company.website || undefined,
          industry: company.industry || undefined,
          size: company.size || undefined,
          coresignalId: (company.customFields as any)?.coresignalId
        };
      }
    }

    // Try by LinkedIn URL
    if (companyLinkedInUrl) {
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId,
          deletedAt: null,
          linkedinUrl: companyLinkedInUrl
        }
      });

      if (company) {
        return {
          id: company.id,
          name: company.name,
          website: company.website || undefined,
          industry: company.industry || undefined,
          size: company.size || undefined,
          coresignalId: (company.customFields as any)?.coresignalId
        };
      }
    }

    // Try by name
    if (companyName) {
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId,
          deletedAt: null,
          name: {
            contains: companyName,
            mode: 'insensitive'
          }
        }
      });

      if (company) {
        return {
          id: company.id,
          name: company.name,
          website: company.website || undefined,
          industry: company.industry || undefined,
          size: company.size || undefined,
          coresignalId: (company.customFields as any)?.coresignalId
        };
      }
    }

    return null;
  }

  /**
   * Generate role variations using Claude AI
   */
  private async generateRoleVariations(
    targetRole: string,
    context: {
      companyName: string;
      industry: string;
      website?: string;
      useAI: boolean;
    }
  ): Promise<RoleVariations> {
    if (!context.useAI || !this.claudeApiKey) {
      console.log('⚠️ Claude AI not available, using fallback role dictionary');
      return this.getFallbackRoleVariations(targetRole);
    }

    try {
      const prompt = this.buildRoleVariationPrompt(targetRole, context);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        console.warn('⚠️ Claude AI request failed, using fallback');
        return this.getFallbackRoleVariations(targetRole);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse the JSON response
      const variations = JSON.parse(content);
      console.log('🤖 AI generated role variations successfully');

      return variations;
    } catch (error) {
      console.warn('⚠️ Error generating AI variations, using fallback:', error);
      return this.getFallbackRoleVariations(targetRole);
    }
  }

  /**
   * Build prompt for Claude AI to generate role variations
   */
  private buildRoleVariationPrompt(targetRole: string, context: any): string {
    return `You are a business title expert. Generate hierarchical role variations for finding a "${targetRole}" at ${context.companyName} (${context.industry} industry).

Return ONLY a JSON object with this exact structure (no markdown, no explanations):

{
  "primary": ["exact title matches"],
  "secondary": ["one level down titles"],
  "tertiary": ["two levels down titles"]
}

Rules:
1. Primary: Exact equivalents (e.g., CFO = Chief Financial Officer)
2. Secondary: One level down (e.g., VP Finance, Finance Director)
3. Tertiary: Two levels down (e.g., Senior Finance Manager)
4. Include 3-5 variations per tier
5. Use common business titles
6. Consider ${context.industry} industry norms

Example for CFO:
{
  "primary": ["CFO", "Chief Financial Officer", "Chief Finance Officer"],
  "secondary": ["VP Finance", "Vice President Finance", "Finance Director", "Head of Finance"],
  "tertiary": ["Senior Finance Manager", "Finance Manager", "Controller"]
}

Now generate for "${targetRole}":`;
  }

  /**
   * Fallback role variations (static dictionary)
   */
  private getFallbackRoleVariations(targetRole: string): RoleVariations {
    const roleLower = targetRole.toLowerCase();

    const dictionary: Record<string, RoleVariations> = {
      cfo: {
        primary: ['CFO', 'Chief Financial Officer', 'Chief Finance Officer'],
        secondary: ['VP Finance', 'Vice President Finance', 'Finance Director', 'Head of Finance'],
        tertiary: ['Senior Finance Manager', 'Finance Manager', 'Controller', 'Financial Controller']
      },
      cto: {
        primary: ['CTO', 'Chief Technology Officer', 'Chief Technical Officer'],
        secondary: ['VP Engineering', 'Vice President Engineering', 'Engineering Director', 'Head of Engineering'],
        tertiary: ['Senior Engineering Manager', 'Engineering Manager', 'Technical Director']
      },
      cro: {
        primary: ['CRO', 'Chief Revenue Officer'],
        secondary: ['VP Sales', 'Vice President Sales', 'Sales Director', 'Head of Sales'],
        tertiary: ['Senior Sales Manager', 'Sales Manager', 'Revenue Director']
      },
      cmo: {
        primary: ['CMO', 'Chief Marketing Officer'],
        secondary: ['VP Marketing', 'Vice President Marketing', 'Marketing Director', 'Head of Marketing'],
        tertiary: ['Senior Marketing Manager', 'Marketing Manager']
      },
      ceo: {
        primary: ['CEO', 'Chief Executive Officer'],
        secondary: ['President', 'Managing Director'],
        tertiary: ['General Manager', 'Executive Director']
      },
      coo: {
        primary: ['COO', 'Chief Operating Officer', 'Chief Operations Officer'],
        secondary: ['VP Operations', 'Vice President Operations', 'Operations Director', 'Head of Operations'],
        tertiary: ['Senior Operations Manager', 'Operations Manager']
      }
    };

    // Find matching role
    for (const [key, variations] of Object.entries(dictionary)) {
      if (roleLower.includes(key) || key.includes(roleLower)) {
        return variations;
      }
    }

    // Default fallback
    return {
      primary: [targetRole],
      secondary: [`VP ${targetRole}`, `Director of ${targetRole}`],
      tertiary: [`Senior ${targetRole} Manager`, `${targetRole} Manager`]
    };
  }

  /**
   * Search for role matches using Coresignal API
   */
  private async searchForRoleMatches(
    company: CompanyInfo,
    roleVariations: RoleVariations,
    maxResults: number
  ): Promise<PersonMatch[]> {
    const matches: PersonMatch[] = [];

    // Try primary tier first
    console.log('🔍 Searching primary tier...');
    const primaryMatches = await this.searchCoresignal(company, roleVariations.primary, 1);
    if (primaryMatches.length > 0) {
      matches.push(...primaryMatches.map(m => ({ ...m, tier: 1 })));
      if (matches.length >= maxResults) {
        return matches.slice(0, maxResults);
      }
    }

    // Try secondary tier
    console.log('🔍 Searching secondary tier...');
    const secondaryMatches = await this.searchCoresignal(company, roleVariations.secondary, 2);
    if (secondaryMatches.length > 0) {
      matches.push(...secondaryMatches.map(m => ({ ...m, tier: 2 })));
      if (matches.length >= maxResults) {
        return matches.slice(0, maxResults);
      }
    }

    // Try tertiary tier
    console.log('🔍 Searching tertiary tier...');
    const tertiaryMatches = await this.searchCoresignal(company, roleVariations.tertiary, 3);
    if (tertiaryMatches.length > 0) {
      matches.push(...tertiaryMatches.map(m => ({ ...m, tier: 3 })));
    }

    return matches.slice(0, maxResults);
  }

  /**
   * Search Coresignal API for people with specific titles
   */
  private async searchCoresignal(
    company: CompanyInfo,
    titles: string[],
    tier: number
  ): Promise<PersonMatch[]> {
    try {
      const query = {
        bool: {
          must: [
            {
              term: {
                'company.name.keyword': company.name
              }
            },
            {
              bool: {
                should: titles.map(title => ({
                  match: {
                    'job_title': {
                      query: title,
                      operator: 'and'
                    }
                  }
                })),
                minimum_should_match: 1
              }
            }
          ]
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v1/professional_network/member/search/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          query,
          size: 10
        })
      });

      if (!response.ok) {
        console.error(`Coresignal API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const members = data.hits?.hits || [];

      return members.map((hit: any) => {
        const source = hit._source;
        const confidence = this.calculateConfidence(tier, source);

        return {
          name: source.name || 'Unknown',
          title: source.job_title || 'Unknown',
          email: source.professional_email || source.email,
          linkedin: source.url,
          department: source.department,
          seniority: source.seniority_level,
          confidence,
          tier,
          coresignalId: source.id
        };
      });
    } catch (error) {
      console.error('Error searching Coresignal:', error);
      return [];
    }
  }

  /**
   * Calculate confidence score based on tier and data quality
   */
  private calculateConfidence(tier: number, source: any): number {
    let confidence = 0;

    // Base confidence by tier
    if (tier === 1) confidence += 90;
    else if (tier === 2) confidence += 75;
    else if (tier === 3) confidence += 60;

    // Boost for active experience
    if (source.is_active) confidence += 5;

    // Boost for LinkedIn URL
    if (source.url) confidence += 3;

    // Boost for email
    if (source.professional_email || source.email) confidence += 2;

    return Math.min(confidence, 100);
  }

  /**
   * Enrich matches based on enrichment level
   */
  private async enrichMatches(
    matches: PersonMatch[],
    enrichmentLevel: string,
    workspaceId: string
  ): Promise<PersonMatch[]> {
    if (enrichmentLevel === 'identify') {
      // Just return basic info
      return matches;
    }

    // For 'enrich' and 'deep_research', we would call additional APIs
    // For now, just save to database
    for (const match of matches) {
      await this.saveToDatabase(match, workspaceId);
    }

    return matches;
  }

  /**
   * Save person to database
   */
  private async saveToDatabase(person: PersonMatch, workspaceId: string): Promise<void> {
    try {
      // Check if person already exists
      const existing = await prisma.people.findFirst({
        where: {
          workspaceId,
          OR: [
            { email: person.email },
            { linkedin: person.linkedin }
          ].filter(condition => Object.values(condition)[0]) // Filter out undefined values
        }
      });

      if (existing) {
        // Update existing person
        await prisma.people.update({
          where: { id: existing.id },
          data: {
            fullName: person.name,
            jobTitle: person.title,
            email: person.email,
            linkedin: person.linkedin,
            department: person.department,
            seniority: person.seniority,
            enrichmentScore: person.confidence,
            coresignalData: {
              id: person.coresignalId,
              tier: person.tier,
              confidence: person.confidence
            },
            lastEnriched: new Date(),
            updatedAt: new Date()
          }
        });

        person.id = existing.id;
      } else {
        // Create new person
        const newPerson = await prisma.people.create({
          data: {
            workspaceId,
            fullName: person.name,
            jobTitle: person.title,
            email: person.email,
            linkedin: person.linkedin,
            department: person.department,
            seniority: person.seniority,
            enrichmentScore: person.confidence,
            coresignalData: {
              id: person.coresignalId,
              tier: person.tier,
              confidence: person.confidence
            },
            lastEnriched: new Date(),
            status: 'LEAD'
          }
        });

        person.id = newPerson.id;
      }

      console.log(`💾 Saved person to database: ${person.name}`);
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  }
}


