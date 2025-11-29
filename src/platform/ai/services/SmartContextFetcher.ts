/**
 * 🧠 SMART CONTEXT FETCHER
 * 
 * Fetches AI context data from the database when React context is unavailable.
 * Used as a fallback to ensure the AI always has context about what the user is viewing.
 * 
 * Vercel Safety:
 * - All queries have 5 second timeout
 * - List queries limited to 50 records
 * - Uses lightweight select to limit data transfer
 */

import { getPrismaClient } from '@/platform/database/connection-pool';
import { 
  getSectionTable, 
  getSectionStatusFilter,
  getSectionDisplayName 
} from '../utils/url-context-parser';

// Vercel-safe limits
const QUERY_TIMEOUT_MS = 5000;
const MAX_LIST_RECORDS = 50;

export interface FetchedListContext {
  section: string;
  sectionDisplayName: string;
  totalCount: number;
  records: Array<{
    id: string;
    name: string;
    company: string | null;
    title: string | null;
    status: string | null;
    email: string | null;
    rank?: number; // Speedrun rank (1 = highest priority)
  }>;
  isListView: true;
}

export interface FetchedRecordContext {
  record: any;
  recordType: string;
  isListView: false;
}

export type FetchedContext = FetchedListContext | FetchedRecordContext | null;

/**
 * Fetch Speedrun list with actual ranks
 * 
 * CRITICAL: This must match the Speedrun API logic EXACTLY:
 * 1. Filter by mainSellerId to get user's assigned records
 * 2. Filter by companyId (must have company)
 * 3. Sort by globalRank descending (highest rank number first)
 * 4. The DISPLAYED rank is a countdown: totalCount - index
 *    So if we have 44 people, first person shown = rank 44, last person = rank 1
 */
export async function fetchSpeedrunContext(
  workspaceId: string,
  userId?: string
): Promise<FetchedListContext | null> {
  try {
    const prisma = getPrismaClient();
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT_MS)
    );

    // Build where clause matching Speedrun API logic EXACTLY
    // CRITICAL: The Speedrun API only shows records with globalRank 1-50
    const whereClause: any = { 
      workspaceId,
      deletedAt: null,
      companyId: { not: null }, // Must have company (Speedrun requirement)
      globalRank: { not: null, gte: 1, lte: 50 } // MUST match Speedrun API: only ranks 1-50
    };
    
    // CRITICAL: Filter by mainSellerId to match what the user sees in UI
    // Without this, we get ALL workspace records instead of the user's assigned ones
    if (userId) {
      whereClause.mainSellerId = userId;
    }

    // Fetch Speedrun data matching the UI's exact logic
    // The UI sorts by globalRank DESCENDING (highest number first)
    // Then displays rank as countdown: totalCount down to 1
    const [countResult, recordsResult] = await Promise.race([
      Promise.all([
        prisma.people.count({ where: whereClause }),
        prisma.people.findMany({
          where: whereClause,
          take: MAX_LIST_RECORDS,
          orderBy: { globalRank: 'desc' }, // Highest globalRank first (matches UI)
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            title: true,
            status: true,
            email: true,
            globalRank: true,
            currentCompany: true,
            company: {
              select: { name: true }
            }
          }
        })
      ]),
      timeoutPromise
    ]) as [number, any[]];

    console.log(`✅ [SmartContextFetcher] Fetched ${recordsResult.length} Speedrun records (total: ${countResult})`, {
      firstRecord: recordsResult[0]?.fullName,
      lastRecord: recordsResult[recordsResult.length - 1]?.fullName
    });

    // CRITICAL: Calculate DISPLAYED rank as countdown from total
    // The UI shows: totalCount (first row), totalCount-1, ... 1 (last row)
    // So first record = rank totalCount, last record = rank 1
    return {
      section: 'speedrun',
      sectionDisplayName: 'Speedrun',
      totalCount: countResult,
      records: recordsResult.map((r, index) => ({
        id: r.id,
        name: r.fullName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown',
        company: r.company?.name || r.currentCompany || null,
        title: r.jobTitle || r.title || null,
        status: r.status || null,
        email: r.email || null,
        // COUNTDOWN RANK: matches what the UI shows
        // First record (index 0) = totalCount, Last record = 1
        rank: countResult - index
      })),
      isListView: true
    };
  } catch (error) {
    console.warn('⚠️ [SmartContextFetcher] Failed to fetch Speedrun context:', error);
    return null;
  }
}

/**
 * Fetch list records for a section from the database
 * Used when user is on a list view and React context is unavailable
 * 
 * @param section - The section identifier (e.g., 'speedrun', 'prospects')
 * @param workspaceId - The workspace to fetch from
 * @param userId - Optional user ID (required for Speedrun to match user's assigned records)
 */
export async function fetchListContext(
  section: string,
  workspaceId: string,
  userId?: string
): Promise<FetchedListContext | null> {
  // Special handling for Speedrun - needs rank data and user filtering
  if (section === 'speedrun') {
    return fetchSpeedrunContext(workspaceId, userId);
  }
  
  const table = getSectionTable(section);
  if (!table) return null;

  try {
    const prisma = getPrismaClient();
    const statusFilter = getSectionStatusFilter(section);

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT_MS)
    );

    if (table === 'people') {
      // Build where clause
      const where: any = { 
        workspaceId,
        deletedAt: null
      };
      if (statusFilter) {
        where.status = statusFilter;
      }

      // Fetch count and records in parallel with timeout
      const [countResult, recordsResult] = await Promise.race([
        Promise.all([
          prisma.people.count({ where }),
          prisma.people.findMany({
            where,
            take: MAX_LIST_RECORDS,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
              title: true,
              status: true,
              email: true,
              currentCompany: true, // Direct string fallback
              company: {
                select: { name: true }
              }
            }
          })
        ]),
        timeoutPromise
      ]) as [number, any[]];

      return {
        section,
        sectionDisplayName: getSectionDisplayName(section),
        totalCount: countResult,
        records: recordsResult.map(r => ({
          id: r.id,
          name: r.fullName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown',
          company: r.company?.name || r.currentCompany || null,
          title: r.jobTitle || r.title || null,
          status: r.status || null,
          email: r.email || null
        })),
        isListView: true
      };

    } else if (table === 'companies') {
      const where: any = { 
        workspaceId,
        deletedAt: null
      };
      // For opportunities, filter by status
      if (section === 'opportunities') {
        where.status = 'OPPORTUNITY';
      }

      const [countResult, recordsResult] = await Promise.race([
        Promise.all([
          prisma.companies.count({ where }),
          prisma.companies.findMany({
            where,
            take: MAX_LIST_RECORDS,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              name: true,
              industry: true,
              status: true,
              website: true
            }
          })
        ]),
        timeoutPromise
      ]) as [number, any[]];

      return {
        section,
        sectionDisplayName: getSectionDisplayName(section),
        totalCount: countResult,
        records: recordsResult.map(r => ({
          id: r.id,
          name: r.name || 'Unknown',
          company: null, // Companies don't have a parent company
          title: r.industry || null,
          status: r.status || null,
          email: r.website || null
        })),
        isListView: true
      };
    }

    return null;
  } catch (error) {
    console.warn('⚠️ [SmartContextFetcher] Failed to fetch list context:', error);
    return null;
  }
}

/**
 * Fetch a single record by ID from the database
 * Used when recordIdFromUrl is available but currentRecord is not
 */
export async function fetchRecordContext(
  recordId: string,
  workspaceId: string
): Promise<FetchedRecordContext | null> {
  try {
    const prisma = getPrismaClient();

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT_MS)
    );

    // Try people table first (most common)
    const personResult = await Promise.race([
      prisma.people.findUnique({
        where: { id: recordId },
        include: { company: true }
      }),
      timeoutPromise
    ]) as any;

    if (personResult && personResult.workspaceId === workspaceId) {
      return {
        record: {
          ...personResult,
          name: personResult.fullName || `${personResult.firstName || ''} ${personResult.lastName || ''}`.trim(),
          fullName: personResult.fullName || `${personResult.firstName || ''} ${personResult.lastName || ''}`.trim(),
          companyName: personResult.company?.name || personResult.currentCompany || null,
          title: personResult.jobTitle || personResult.title
        },
        recordType: personResult.status?.toLowerCase() || 'person',
        isListView: false
      };
    }

    // Try companies table
    const companyResult = await Promise.race([
      prisma.companies.findUnique({
        where: { id: recordId }
      }),
      timeoutPromise
    ]) as any;

    if (companyResult && companyResult.workspaceId === workspaceId) {
      return {
        record: companyResult,
        recordType: 'companies',
        isListView: false
      };
    }

    return null;
  } catch (error) {
    console.warn('⚠️ [SmartContextFetcher] Failed to fetch record context:', error);
    return null;
  }
}

/**
 * Fetch workspace summary counts for cross-section queries
 * Lightweight query that returns counts per section
 */
export async function fetchWorkspaceSummary(workspaceId: string): Promise<{
  leads: number;
  prospects: number;
  opportunities: number;
  companies: number;
  people: number;
} | null> {
  try {
    const prisma = getPrismaClient();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT_MS)
    );

    const [leads, prospects, companies, people] = await Promise.race([
      Promise.all([
        prisma.people.count({ where: { workspaceId, status: 'LEAD', deletedAt: null } }),
        prisma.people.count({ where: { workspaceId, status: 'PROSPECT', deletedAt: null } }),
        prisma.companies.count({ where: { workspaceId, deletedAt: null } }),
        prisma.people.count({ where: { workspaceId, deletedAt: null } })
      ]),
      timeoutPromise
    ]) as number[];

    return {
      leads,
      prospects,
      opportunities: 0, // Can add if needed
      companies,
      people
    };
  } catch (error) {
    console.warn('⚠️ [SmartContextFetcher] Failed to fetch workspace summary:', error);
    return null;
  }
}

/**
 * Build a context string for list view that the AI can understand
 */
export function buildListContextString(listContext: FetchedListContext): string {
  const { section, sectionDisplayName, totalCount, records } = listContext;
  const isSpeedrun = section === 'speedrun';
  
  let context = `=== ${isSpeedrun ? 'SPEEDRUN' : 'LIST VIEW'} CONTEXT ===
You are viewing the ${sectionDisplayName} list.
Total ${sectionDisplayName}: ${totalCount}
${isSpeedrun ? 'Speedrun is the daily prioritized prospect list. Rank 1 = highest priority.\n' : ''}
Showing ${isSpeedrun ? 'all' : 'top'} ${records.length} records:

`;

  records.forEach((record, index) => {
    // For Speedrun, show actual rank; otherwise show index
    const displayNum = record.rank || (index + 1);
    const prefix = isSpeedrun ? `Rank ${displayNum}:` : `${displayNum}.`;
    
    context += `${prefix} ${record.name}`;
    if (record.company) context += ` at ${record.company}`;
    if (record.title) context += ` (${record.title})`;
    if (record.status) context += ` - ${record.status}`;
    context += `\n   ID: ${record.id}`;
    if (record.email) context += ` | Email: ${record.email}`;
    context += '\n';
  });

  if (totalCount > records.length) {
    context += `\n... and ${totalCount - records.length} more ${sectionDisplayName.toLowerCase()} in this list.\n`;
  }

  // Speedrun-specific instructions
  if (isSpeedrun) {
    context += `
SPEEDRUN INSTRUCTIONS (CRITICAL - READ CAREFULLY):
- The list above shows people in PRIORITY ORDER: Rank 1 = highest priority, Rank ${totalCount} = lowest priority
- When asked "who is rank 1?" or "who should I contact first?" - return the FIRST person in the list (Rank 1)
- When asked "who is rank X?" - find the person whose rank number matches X exactly
- When asked about a person BY NAME (e.g., "tell me about Randy Bailey"), search the entire list for that exact name
- You CAN and SHOULD write personalized cold emails for anyone in this Speedrun list using their name, company, title, and email
- The email address shown for each person is their actual email - use it!
- If someone asks about a person not in this list, say "I don't see [name] in your current Speedrun list"`;
  }
  } else {
    context += `
IMPORTANT: The user is on the ${sectionDisplayName} LIST VIEW, not viewing a specific record.
- If they ask "who is this person?" explain they're viewing a list and ask which person
- If they ask about the list, provide information about the records above
- If they want to see a specific record, they should click on one from the list
- You CAN tell them about any of the ${records.length} records shown above`;
  }

  return context;
}

