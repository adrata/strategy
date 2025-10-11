/**
 * BUYER GROUP AI TOOL
 * 
 * AI tool for discovering buyer groups from the chat panel
 * Integrates with the unified buyer group pipeline
 */

export interface BuyerGroupToolParams {
  companyName: string;
  website?: string;
  enrichmentLevel?: 'identify' | 'enrich' | 'deep_research';
  sellerProfile?: {
    company: string;
    product: string;
    industry: string;
    targetRoles?: string[];
  };
  saveToDatabase?: boolean;
  returnFullData?: boolean;
}

export interface BuyerGroupToolResult {
  success: boolean;
  companyName: string;
  website?: string;
  industry?: string;
  companySize?: string;
  processingTime: number;
  timestamp: string;
  buyerGroup: {
    totalMembers: number;
    cohesionScore: number;
    overallConfidence: number;
    roles: Record<string, any[]>;
    members: any[];
  };
  quality: {
    cohesionScore: number;
    overallConfidence: number;
    roleDistribution: Record<string, number>;
    validationStatus: string;
  };
  databaseId?: string;
  cacheUtilized: boolean;
  error?: string;
}

export const buyerGroupTool = {
  name: 'discover_buyer_group',
  description: 'Discover the complete buyer group for a target company, including decision makers, champions, stakeholders, blockers, and introducers with contact information',
  
  parameters: {
    type: 'object',
    properties: {
      companyName: {
        type: 'string',
        description: 'The name of the company to discover buyer group for (required)',
        minLength: 2,
        maxLength: 200
      },
      website: {
        type: 'string',
        description: 'Optional website URL of the company for better identification',
        format: 'uri'
      },
      enrichmentLevel: {
        type: 'string',
        description: 'Enrichment level: identify (fast, $0.10), enrich (medium, $2-3), deep_research (full, $5-8)',
        enum: ['identify', 'enrich', 'deep_research'],
        default: 'enrich'
      },
      sellerProfile: {
        type: 'object',
        description: 'Optional seller profile to customize buyer group discovery',
        properties: {
          company: { type: 'string', description: 'Your company name' },
          product: { type: 'string', description: 'Product/service being sold' },
          industry: { type: 'string', description: 'Target industry' },
          targetRoles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific roles to focus on (e.g., CFO, CTO, VP Sales)'
          }
        }
      },
      saveToDatabase: {
        type: 'boolean',
        description: 'Whether to save results to database (default: true)',
        default: true
      },
      returnFullData: {
        type: 'boolean',
        description: 'Whether to return full detailed data (default: false)',
        default: false
      }
    },
    required: ['companyName']
  },

  async execute(params: BuyerGroupToolParams): Promise<BuyerGroupToolResult> {
    try {
      console.log(`🤖 [AI TOOL] Buyer group discovery requested for: ${params.companyName} at ${params.enrichmentLevel || 'enrich'} level`);

      // Call the V1 buyer group API endpoint
      const response = await fetch('/api/v1/intelligence/buyer-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: params.companyName,
          website: params.website,
          enrichmentLevel: params.enrichmentLevel || 'enrich', // Default to medium level
          saveToDatabase: params.saveToDatabase !== false, // Default to true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Buyer group discovery failed');
      }

      console.log(`✅ [AI TOOL] Buyer group discovery completed for ${params.companyName}: ${result.data.buyerGroup.totalMembers} members`);

      return {
        success: true,
        companyName: result.data.companyName,
        website: result.data.website,
        industry: result.data.industry,
        companySize: result.data.companySize,
        processingTime: result.data.processingTime,
        timestamp: result.data.timestamp,
        buyerGroup: result.data.buyerGroup,
        quality: result.data.quality,
        databaseId: result.data.databaseId,
        cacheUtilized: result.data.cacheUtilized
      };

    } catch (error) {
      console.error(`❌ [AI TOOL] Buyer group discovery failed for ${params.companyName}:`, error);
      
      return {
        success: false,
        companyName: params.companyName,
        website: params.website,
        processingTime: 0,
        timestamp: new Date().toISOString(),
        buyerGroup: {
          totalMembers: 0,
          cohesionScore: 0,
          overallConfidence: 0,
          roles: {},
          members: []
        },
        quality: {
          cohesionScore: 0,
          overallConfidence: 0,
          roleDistribution: {},
          validationStatus: 'failed'
        },
        cacheUtilized: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * HELPER FUNCTION: Format buyer group results for AI chat display
 */
export function formatBuyerGroupForChat(result: BuyerGroupToolResult): string {
  if (!result.success) {
    return `❌ **Buyer Group Discovery Failed**\n\n**Company:** ${result.companyName}\n**Error:** ${result.error}\n\nPlease try again or check the company name.`;
  }

  const { companyName, website, industry, companySize, buyerGroup, quality, processingTime } = result;
  
  let response = `🎯 **Buyer Group Discovered for ${companyName}**\n\n`;
  
  // Company info
  response += `**Company Details:**\n`;
  response += `• **Name:** ${companyName}\n`;
  if (website) response += `• **Website:** ${website}\n`;
  if (industry) response += `• **Industry:** ${industry}\n`;
  if (companySize) response += `• **Size:** ${companySize}\n`;
  response += `\n`;
  
  // Buyer group summary
  response += `**Buyer Group Summary:**\n`;
  response += `• **Total Members:** ${buyerGroup.totalMembers}\n`;
  response += `• **Cohesion Score:** ${buyerGroup.cohesionScore}/10\n`;
  response += `• **Overall Confidence:** ${quality.overallConfidence}%\n`;
  response += `• **Processing Time:** ${Math.round(processingTime / 1000)}s\n`;
  response += `\n`;
  
  // Role breakdown
  if (Object.keys(buyerGroup.roles).length > 0) {
    response += `**Role Distribution:**\n`;
    for (const [role, members] of Object.entries(buyerGroup.roles)) {
      if (members && members.length > 0) {
        const roleName = role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, ' $1');
        response += `• **${roleName}:** ${members.length} member(s)\n`;
      }
    }
    response += `\n`;
  }
  
  // Top members
  if (buyerGroup.members && buyerGroup.members.length > 0) {
    response += `**Key Buyer Group Members:**\n`;
    const topMembers = buyerGroup.members
      .filter(member => member.confidence >= 70)
      .slice(0, 5);
    
    for (const member of topMembers) {
      response += `• **${member.name}** - ${member.title} (${member.role})\n`;
      if (member.email) response += `  📧 ${member.email}\n`;
      if (member.phone) response += `  📞 ${member.phone}\n`;
      if (member.linkedin) response += `  💼 [LinkedIn](${member.linkedin})\n`;
      response += `  🎯 Confidence: ${member.confidence}%\n\n`;
    }
  }
  
  // Quality indicators
  if (quality.overallConfidence >= 80) {
    response += `✅ **High Quality Results** - This buyer group has strong confidence and cohesion.\n`;
  } else if (quality.overallConfidence >= 60) {
    response += `⚠️ **Moderate Quality Results** - Consider additional research for key contacts.\n`;
  } else {
    response += `❌ **Low Quality Results** - Results may need manual verification.\n`;
  }
  
  if (result.cacheUtilized) {
    response += `\n💾 *Results retrieved from cache for faster processing.*`;
  }
  
  return response;
}

/**
 * HELPER FUNCTION: Get buyer group from database
 */
export async function getBuyerGroupFromDatabase(companyName: string): Promise<BuyerGroupToolResult | null> {
  try {
    const response = await fetch(`/api/v1/intelligence/buyer-group?company=${encodeURIComponent(companyName)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return null; // No existing buyer group found
    }

    const result = await response.json();
    
    if (!result.success) {
      return null;
    }

    return {
      success: true,
      companyName: result.data.companyName,
      website: result.data.website,
      industry: result.data.industry,
      companySize: result.data.companySize,
      processingTime: 0, // Already processed
      timestamp: result.data.createdAt,
      buyerGroup: {
        totalMembers: result.data.totalMembers,
        cohesionScore: result.data.cohesionScore,
        overallConfidence: result.data.overallConfidence,
        roles: {}, // Would need to reconstruct from members
        members: result.data.members
      },
      quality: {
        cohesionScore: result.data.cohesionScore,
        overallConfidence: result.data.overallConfidence,
        roleDistribution: {},
        validationStatus: 'cached'
      },
      databaseId: result.data.id,
      cacheUtilized: true
    };

  } catch (error) {
    console.error('Error retrieving buyer group from database:', error);
    return null;
  }
}

export default buyerGroupTool;