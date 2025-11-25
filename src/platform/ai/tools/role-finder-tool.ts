/**
 * ROLE FINDER AI TOOL
 * 
 * AI chat integration for finding specific roles at companies
 * Handles queries like "find the CFO at Nike"
 */

export interface RoleFinderToolInput {
  role: string;
  company: string;
  enrichmentLevel?: 'identify' | 'enrich' | 'deep_research';
}

export interface RoleFinderToolResult {
  success: boolean;
  person?: {
    name: string;
    title: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  company: {
    name: string;
    website?: string;
  };
  confidence: number;
  message: string;
}

/**
 * Parse natural language query to extract role and company
 * Examples:
 * - "find the CFO at Nike"
 * - "who is the CTO at Salesforce"
 * - "get me the CMO of Adobe"
 */
export function parseRoleFindQuery(query: string): RoleFinderToolInput | null {
  const lowerQuery = query.toLowerCase().trim();

  // Pattern 1: "find [the] [role] at [company]"
  const pattern1 = /(?:find|get|show|lookup|search)\s+(?:the\s+|me\s+)?([a-z]{2,4}|chief\s+\w+\s+officer|vp\s+\w+|vice\s+president\s+\w+)\s+(?:at|for|of|from)\s+(.+)/i;
  const match1 = query.match(pattern1);
  if (match1) {
    return {
      role: match1[1].trim(),
      company: match1[2].trim(),
      enrichmentLevel: 'enrich'
    };
  }

  // Pattern 2: "who is the [role] at [company]"
  const pattern2 = /who\s+is\s+(?:the\s+)?([a-z]{2,4}|chief\s+\w+\s+officer|vp\s+\w+|vice\s+president\s+\w+)\s+(?:at|for|of)\s+(.+)/i;
  const match2 = query.match(pattern2);
  if (match2) {
    return {
      role: match2[1].trim(),
      company: match2[2].trim(),
      enrichmentLevel: 'enrich'
    };
  }

  // Pattern 3: "[role] at [company]"
  const pattern3 = /^([a-z]{2,4}|chief\s+\w+\s+officer|vp\s+\w+|vice\s+president\s+\w+)\s+(?:at|for|of)\s+(.+)/i;
  const match3 = query.match(pattern3);
  if (match3) {
    return {
      role: match3[1].trim(),
      company: match3[2].trim(),
      enrichmentLevel: 'identify'
    };
  }

  return null;
}

/**
 * Execute role finder tool
 */
export async function executeRoleFinderTool(
  input: RoleFinderToolInput,
  workspaceId: string
): Promise<RoleFinderToolResult> {
  try {
    console.log(`🔧 [ROLE FINDER TOOL] Executing: ${input.role} at ${input.company}`);

    const response = await fetch('/api/v1/ai-chat/tools/find-role-at-company/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `${input.role} at ${input.company}`,
        companyName: input.company,
        role: input.role,
        maxResults: 1
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data || result.data.people.length === 0) {
      return {
        success: false,
        company: { name: input.company },
        confidence: 0,
        message: `I couldn't find a ${input.role} at ${input.company}. The company might not have this role publicly listed, or they may use a different title.`
      };
    }

    const person = result.data.people[0];
    const company = { name: result.data.company, website: result.data.company };

    // Format response message
    let message = `I found the ${input.role} at ${company.name}:\n\n`;
    message += `**${person.name}**\n`;
    message += `Title: ${person.title}\n`;
    
    if (person.email) {
      message += `Email: ${person.email}\n`;
    }
    
    if (person.phone) {
      message += `Phone: ${person.phone}\n`;
    }
    
    if (person.linkedinUrl) {
      message += `LinkedIn: ${person.linkedinUrl}\n`;
    }

    message += `\nConfidence: ${person.confidence || 85}%`;

    return {
      success: true,
      person: {
        name: person.name,
        title: person.title,
        email: person.email,
        phone: person.phone,
        linkedin: person.linkedinUrl
      },
      company: {
        name: company.name,
        website: company.website
      },
      confidence: person.confidence || 85,
      message
    };
  } catch (error) {
    console.error('❌ [ROLE FINDER TOOL] Error:', error);
    
    return {
      success: false,
      company: { name: input.company },
      confidence: 0,
      message: `I encountered an error while searching for the ${input.role} at ${input.company}. Please try again.`
    };
  }
}

/**
 * Check if a query should use the role finder tool
 */
export function shouldUseRoleFinderTool(query: string): boolean {
  const parsed = parseRoleFindQuery(query);
  return parsed !== null;
}


