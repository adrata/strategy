/**
 * Opportunity Name Generation Service
 * 
 * Generates descriptive opportunity titles using Claude AI
 * Creates meaningful titles based on company context, industry, and engagement
 */

import { ClaudeAIService } from './ClaudeAIService';
import { prisma } from '@/platform/database/prisma-client';

export class OpportunityNameGenerationService {
  /**
   * Generate opportunity title for a company using Claude AI
   */
  static async generateOpportunityTitle(
    companyName: string,
    companyData: {
      industry?: string | null;
      employeeCount?: number | null;
      revenue?: number | null;
      description?: string | null;
      descriptionEnriched?: string | null;
      lastAction?: string | null;
      businessChallenges?: string[];
      businessPriorities?: string[];
    },
    workspaceId: string
  ): Promise<string> {
    try {
      // Get workspace context for business model understanding
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: {
          businessModel: true,
          industry: true,
          serviceOfferings: true,
          idealCustomerProfile: true
        }
      });

      // Build context for Claude
      const context = `
Company: ${companyName}
Industry: ${companyData.industry || 'Unknown'}
Size: ${companyData.employeeCount ? `${companyData.employeeCount} employees` : 'Unknown'}
${companyData.descriptionEnriched ? `Company Description: ${companyData.descriptionEnriched.substring(0, 500)}` : ''}
${companyData.businessChallenges && companyData.businessChallenges.length > 0 ? `Challenges: ${companyData.businessChallenges.join(', ')}` : ''}
${companyData.businessPriorities && companyData.businessPriorities.length > 0 ? `Priorities: ${companyData.businessPriorities.join(', ')}` : ''}
${companyData.lastAction ? `Recent Activity: ${companyData.lastAction}` : ''}

${workspace?.businessModel ? `Our Business: ${workspace.businessModel}` : ''}
${workspace?.serviceOfferings && workspace.serviceOfferings.length > 0 ? `Our Services: ${workspace.serviceOfferings.join(', ')}` : ''}
`;

      const prompt = `Generate a concise, professional opportunity title (max 60 characters) for this company. 

The title should:
- Be specific and descriptive
- Reflect the potential business opportunity
- Consider the company's industry, size, and context
- Be professional and suitable for a sales pipeline
- NOT include generic terms like "Opportunity" or "Deal"

Examples of good titles:
- "Infrastructure Modernization Project"
- "Broadband Deployment Initiative"
- "Strategic Planning Engagement"
- "Process Optimization Program"
- "Technology Assessment & Deployment"

Company Context:
${context}

Generate ONLY the title, nothing else:`;

      const claudeService = new ClaudeAIService();
      const response = await claudeService.chat({
        message: prompt,
        workspaceId,
        recordType: 'opportunities'
      });

      if (response && response.response) {
        // Clean up the response - remove quotes, trim whitespace
        let title = response.response.trim();
        title = title.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        title = title.trim();
        
        // Ensure it's not too long
        if (title.length > 60) {
          title = title.substring(0, 57) + '...';
        }
        
        return title || `${companyName} Opportunity`;
      }

      // Fallback to simple format
      return `${companyName} Opportunity`;
    } catch (error) {
      console.error('Error generating opportunity title with Claude:', error);
      // Fallback to simple format
      return `${companyName} Opportunity`;
    }
  }

  /**
   * Generate opportunity name for a person (legacy method, kept for compatibility)
   */
  static async generateOpportunityName(
    personName: string,
    companyName: string | null,
    jobTitle?: string | null,
    workspaceId: string
  ): Promise<string> {
    // If we have company name, use standard format
    if (companyName) {
      return `${companyName} - ${personName}`;
    }

    // If no company, use person name with title if available
    if (jobTitle) {
      return `${personName} (${jobTitle})`;
    }

    return `${personName} Opportunity`;
  }

  /**
   * Batch generate opportunity names for multiple people
   */
  static async batchGenerateNames(
    opportunities: Array<{
      id: string;
      personName: string;
      companyName: string | null;
      jobTitle?: string | null;
    }>,
    workspaceId: string
  ): Promise<Record<string, string>> {
    const names: Record<string, string> = {};

    for (const opp of opportunities) {
      names[opp.id] = await this.generateOpportunityName(
        opp.personName,
        opp.companyName,
        opp.jobTitle,
        workspaceId
      );
    }

    return names;
  }
}

