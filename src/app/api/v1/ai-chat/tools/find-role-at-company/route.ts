/**
 * AI CHAT TOOL: FIND ROLE AT COMPANY
 * 
 * AI-powered tool for finding specific roles at companies
 * Integrates with the new buyer group v2 system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { ConsolidatedBuyerGroupEngine } from '@/platform/intelligence/buyer-group-v2/engine';
import { PersonEnricher } from '@/platform/intelligence/buyer-group-v2/services/person-enricher';

// Required for static export compatibility
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // 2. Parse request body
    const body = await request.json();
    const { 
      query,
      companyName,
      companyId,
      role,
      department,
      maxResults = 10
    } = body;

    // 3. Validate required parameters
    if (!query && !companyName) {
      return createErrorResponse(
        'Query or company name is required',
        'QUERY_OR_COMPANY_REQUIRED',
        400
      );
    }

    console.log(
      `🤖 [AI CHAT TOOL] Finding role at company: ${query || companyName} in workspace: ${workspaceId}`
    );

    // 4. Parse the query to extract role and company information
    const parsedQuery = parseRoleQuery(query || '', companyName);
    
    if (!parsedQuery.company) {
      return createErrorResponse(
        'Could not identify company from query',
        'COMPANY_NOT_IDENTIFIED',
        400
      );
    }

    // 5. Search for people at the company
    const personEnricher = new PersonEnricher();
    const searchResult = await personEnricher.searchPeopleAtCompany({
      companyName: parsedQuery.company,
      companyId,
      roles: parsedQuery.roles,
      departments: parsedQuery.departments,
      maxResults
    });

    if (!searchResult.success || searchResult.people.length === 0) {
      return createSuccessResponse({
        success: true,
        company: parsedQuery.company,
        role: parsedQuery.roles[0] || 'any',
        people: [],
        message: `No people found for ${parsedQuery.roles[0] || 'any role'} at ${parsedQuery.company}`,
        creditsUsed: searchResult.creditsUsed
      }, 'NO_PEOPLE_FOUND');
    }

    // 6. If we found people, optionally get more detailed buyer group analysis
    let buyerGroupAnalysis = null;
    if (searchResult.people.length > 0 && parsedQuery.roles.length > 0) {
      try {
        const engine = new ConsolidatedBuyerGroupEngine();
        const buyerGroupResult = await engine.discoverBuyerGroup({
          companyName: parsedQuery.company,
          companyId,
          workspaceId,
          enrichmentLevel: 'identify' // Quick analysis
        });

        buyerGroupAnalysis = {
          totalMembers: buyerGroupResult.buyerGroup.length,
          composition: buyerGroupResult.composition,
          qualityScore: buyerGroupResult.qualityMetrics.overallScore
        };
      } catch (error) {
        console.warn('Buyer group analysis failed:', error);
      }
    }

    // 7. Format response
    const responseData = {
      success: true,
      company: parsedQuery.company,
      role: parsedQuery.roles[0] || 'any',
      department: parsedQuery.departments[0] || 'any',
      people: searchResult.people.map(person => ({
        name: person.name,
        title: person.jobTitle,
        department: person.department,
        email: person.email,
        phone: person.phone,
        linkedinUrl: person.linkedinUrl,
        location: person.location,
        seniorityLevel: person.seniorityLevel,
        summary: person.summary,
        experience: person.experience?.slice(0, 3) || [], // First 3 experiences
        skills: person.skills?.slice(0, 10) || [] // Top 10 skills
      })),
      buyerGroupAnalysis,
      creditsUsed: searchResult.creditsUsed,
      timestamp: new Date().toISOString()
    };

    console.log(
      `✅ [AI CHAT TOOL] Found ${searchResult.people.length} people for role ${parsedQuery.roles[0] || 'any'} at ${parsedQuery.company}`
    );

    return createSuccessResponse(responseData, 'ROLE_FOUND');

  } catch (error: any) {
    console.error('❌ [AI CHAT TOOL] Error finding role at company:', error);
    
    return createErrorResponse(
      `Role search failed: ${error.message}`,
      'ROLE_SEARCH_ERROR',
      500,
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    );
  }
}

/**
 * Parse role query to extract company, role, and department information
 */
function parseRoleQuery(query: string, companyName?: string): {
  company: string | null;
  roles: string[];
  departments: string[];
} {
  const lowerQuery = query.toLowerCase();
  
  // Extract company name
  let company = companyName || null;
  if (!company) {
    // Common patterns for company extraction
    const companyPatterns = [
      /(?:at|from|in)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s|$|,|\.|!|\?)/,
      /([A-Z][a-zA-Z\s&.,]+?)\s+(?:company|corp|inc|llc|ltd)/i,
      /(?:find|get|search for).*?(?:at|from|in)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s|$|,|\.|!|\?)/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        company = match[1].trim();
        break;
      }
    }
  }

  // Extract roles
  const roles: string[] = [];
  const roleKeywords = {
    'CEO': ['ceo', 'chief executive', 'chief executive officer'],
    'CTO': ['cto', 'chief technology', 'chief technology officer', 'tech lead'],
    'CFO': ['cfo', 'chief financial', 'chief financial officer', 'finance director'],
    'CMO': ['cmo', 'chief marketing', 'chief marketing officer', 'marketing director'],
    'CRO': ['cro', 'chief revenue', 'chief revenue officer', 'revenue director'],
    'COO': ['coo', 'chief operating', 'chief operating officer', 'operations director'],
    'VP': ['vp', 'vice president', 'vice-president'],
    'Director': ['director', 'head of', 'head'],
    'Manager': ['manager', 'lead', 'senior'],
    'Sales': ['sales', 'account manager', 'business development'],
    'Marketing': ['marketing', 'growth', 'demand generation'],
    'Engineering': ['engineer', 'developer', 'architect', 'technical'],
    'Product': ['product', 'product manager', 'pm'],
    'Operations': ['operations', 'ops', 'process'],
    'Finance': ['finance', 'accounting', 'controller'],
    'HR': ['hr', 'human resources', 'talent', 'people'],
    'Legal': ['legal', 'counsel', 'attorney', 'compliance']
  };

  for (const [role, keywords] of Object.entries(roleKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      roles.push(role);
    }
  }

  // If no specific roles found, try to extract from context
  if (roles.length === 0) {
    if (lowerQuery.includes('executive') || lowerQuery.includes('c-level')) {
      roles.push('CEO', 'CTO', 'CFO', 'CMO', 'CRO', 'COO');
    } else if (lowerQuery.includes('director') || lowerQuery.includes('head')) {
      roles.push('Director');
    } else if (lowerQuery.includes('manager') || lowerQuery.includes('lead')) {
      roles.push('Manager');
    } else {
      roles.push('any'); // Default to any role
    }
  }

  // Extract departments
  const departments: string[] = [];
  const departmentKeywords = {
    'Engineering': ['engineering', 'tech', 'development', 'software', 'technical'],
    'Sales': ['sales', 'revenue', 'business development', 'account'],
    'Marketing': ['marketing', 'growth', 'demand generation', 'brand'],
    'Product': ['product', 'product management', 'strategy'],
    'Operations': ['operations', 'ops', 'process', 'supply chain'],
    'Finance': ['finance', 'accounting', 'controller', 'treasury'],
    'HR': ['hr', 'human resources', 'talent', 'people'],
    'Legal': ['legal', 'counsel', 'compliance', 'regulatory'],
    'Customer Success': ['customer success', 'customer support', 'support'],
    'Data': ['data', 'analytics', 'business intelligence', 'insights']
  };

  for (const [dept, keywords] of Object.entries(departmentKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      departments.push(dept);
    }
  }

  return {
    company,
    roles: roles.length > 0 ? roles : ['any'],
    departments: departments.length > 0 ? departments : ['any']
  };
}
