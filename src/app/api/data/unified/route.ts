/**
 * 🚀 UNIFIED DATA API - ENTERPRISE GRADE
 * 
 * Single endpoint for ALL data operations across the platform
 * Replaces 20+ individual data endpoints with one powerful API
 * 
 * Features:
 * - CRUD operations for all data types
 * - Advanced caching and performance optimization
 * - Request deduplication and background preloading
 * - Consistent error handling and response formats
 * - Type-safe operations with full validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { Prisma } from '@prisma/client';
import { cache } from '@/platform/services';
import jwt from 'jsonwebtoken';
import { ulid } from 'ulid';

// 🚀 PERFORMANCE: Aggressive caching for instant loading
const WORKSPACE_CONTEXT_TTL = 300; // 5 minutes
const UNIFIED_DATA_TTL = 600; // 10 minutes for unified data
const DASHBOARD_TTL = 60; // 1 minute for dashboard data (faster updates)

// 🎯 DEMO SCENARIO SUPPORT
const DEMO_WORKSPACE_ID = "demo-workspace-2025";
const ZEROPOINT_DEMO_WORKSPACE_ID = "zeropoint-demo-2025";

// Load demo data directly from database
async function loadDemoData(scenarioSlug: string = 'winning-variant') {
  try {
    console.log(`🎯 [DEMO DATA] Loading demo data from database for scenario: ${scenarioSlug}`);
    
    // Determine workspace ID based on scenario
    const workspaceId = scenarioSlug === 'zeropoint' ? ZEROPOINT_DEMO_WORKSPACE_ID : DEMO_WORKSPACE_ID;
    
    // Get the demo scenario ID - use the most recent one for winning-variant
    const demoScenario = await prisma.demo_scenarios.findFirst({
      where: { slug: scenarioSlug },
      orderBy: { createdAt: 'desc' } // Get the most recent one
    });
    
    if (!demoScenario) {
      console.warn(`⚠️ [DEMO DATA] Demo scenario not found: ${scenarioSlug}`);
      return {
        leads: [],
        prospects: [],
        opportunities: [],
        companies: [],
        people: [],
        clients: [],
        partnerships: [],
        sellers: [],
        speedrunItems: [],
        counts: {
          leads: 0,
          prospects: 0,
          opportunities: 0,
          companies: 0,
          people: 0,
          clients: 0,
          partners: 0,
          sellers: 0,
          speedrun: 0
        }
      };
    }
    
    // Load data directly from database with demo scenario filter
    // For ZeroPoint scenario, also check for the string-based demoScenarioId
    const demoScenarioFilter = scenarioSlug === 'zeropoint' 
      ? {
          workspaceId: workspaceId,
          OR: [
            { demoScenarioId: demoScenario.id },
            { demoScenarioId: 'zeropoint-vp-sales-2025' }
          ],
          isDemoData: true
        }
      : {
          workspaceId: workspaceId,
          demoScenarioId: demoScenario.id,
          isDemoData: true
        };

    const [leads, prospects, opportunities, companies, people, clients, buyerGroups, workspaceUsers, partnerships] = await Promise.all([
      prisma.leads.findMany({
        where: demoScenarioFilter
      }),
      prisma.prospects.findMany({
        where: demoScenarioFilter
      }),
      prisma.opportunities.findMany({
        where: demoScenarioFilter
      }),
      prisma.companies.findMany({
        where: { workspaceId: workspaceId }
      }),
      prisma.people.findMany({
        where: {
          workspaceId: workspaceId
        }
      }),
      prisma.clients.findMany({
        where: {
          workspaceId: workspaceId
        }
      }),
      prisma.buyer_groups.findMany({
        where: { workspaceId: workspaceId }
      }),
      prisma.workspace_users.findMany({
        where: { workspaceId: workspaceId }
      }),
      prisma.partners.findMany({
        where: { workspaceId: workspaceId }
      })
    ]);

    // 🆕 FIX: Get actual user data for sellers
    const userIds = workspaceUsers.map(wu => wu.userId);
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, firstName: true, lastName: true }
    });

    // Create enriched sellers data
    const enrichedSellers = workspaceUsers.map(wu => {
      const user = users.find(u => u['id'] === wu.userId);
      return {
        id: wu.id,
        userId: wu.userId,
        name: user?.name || user?.email || 'Unknown User',
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        role: wu.role,
        workspaceId: wu.workspaceId,
        createdAt: wu.createdAt,
        updatedAt: wu.updatedAt
      };
    });

    // For ZeroPoint scenario, use actual database data instead of hardcoded CoreSignal data
    if (scenarioSlug === 'zeropoint') {
      console.log(`🎯 [DEMO DATA] Using actual database data for ZeroPoint scenario`);
      
      // Use the actual database data we loaded
      const realLeads = leads.map(lead => ({
        id: lead.id,
        fullName: lead.name,
        email: lead.email,
        company: lead.company,
        companyId: lead.companyId,
        title: lead.title,
        stage: lead.stage,
        source: lead.source,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        workspaceId: lead.workspaceId,
        isDemoData: lead.isDemoData,
        demoScenarioId: lead.demoScenarioId,
        buyerGroupRole: lead.buyerGroupRole
      }));
      
      const realProspects = prospects.map(prospect => ({
        id: prospect.id,
        fullName: prospect.name,
        email: prospect.email,
        company: prospect.company,
        companyId: prospect.companyId,
        title: prospect.title,
        stage: prospect.stage,
        source: prospect.source,
        createdAt: prospect.createdAt,
        updatedAt: prospect.updatedAt,
        workspaceId: prospect.workspaceId,
        isDemoData: prospect.isDemoData,
        demoScenarioId: prospect.demoScenarioId,
        buyerGroupRole: prospect.buyerGroupRole
      }));
      
      const realOpportunities = opportunities.map(opp => ({
        id: opp.id,
        name: opp.name,
        company: opp.company,
        companyId: opp.companyId,
        stage: opp.stage,
        value: opp.value,
        probability: opp.probability,
        source: opp.source,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        workspaceId: opp.workspaceId,
        isDemoData: opp.isDemoData,
        demoScenarioId: opp.demoScenarioId,
        buyerGroupId: opp.buyerGroupId,
        people: opp.people
      }));
      
      // Create speedrun items from the actual data
      const speedrunItems = [...realLeads, ...realProspects, ...realOpportunities].map((item, index) => ({
        id: item.id,
        rank: index + 1,
        company: item.company,
        person: item.fullName,
        title: item.title,
        stage: item.stage,
        lastAction: item.updatedAt,
        source: item.source
      }));
      
      // Create companies from leads data (companies are stored as leads with company field)
      const companiesFromLeads = leads
        .filter(lead => lead.company) // Only include leads with company names
        .map(lead => ({
          id: lead.id, // Use the ULID from leads table
          name: lead.company,
          domain: lead.companyDomain || `${lead.company?.toLowerCase().replace(/\s+/g, '')}.com`,
          industry: lead.industry || 'Technology',
          employeeCount: lead.companySize || '100-500',
          revenue: lead.estimatedValue ? `$${lead.estimatedValue}M` : '$10M-50M',
          location: lead.city || 'San Francisco, CA',
          icpScore: Math.floor(Math.random() * 20) + 80, // 80-100 for demo
          lastUpdated: (lead.lastActionDate || lead.updatedAt).toISOString(),
          status: lead.status || 'Active',
          assignedUserId: lead.assignedUserId,
          workspaceId: lead.workspaceId,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt
        }));
      
      return {
        leads: realLeads,
        prospects: realProspects,
        opportunities: realOpportunities,
        companies: companiesFromLeads, // Use companies derived from leads data
        people: people,
        partnerships: partnerships,
        clients: clients,
        buyerGroups: buyerGroups,
        catalyst: [],
        calendar: [],
        champions: [],
        decisionMakers: [],
        speedrunItems: speedrunItems,
        sellers: enrichedSellers,
        counts: {
          leads: realLeads.length,
          prospects: realProspects.length,
          opportunities: realOpportunities.length,
          companies: companiesFromLeads.length, // Use the correct count
          people: people.length,
          clients: clients.length,
          partners: partnerships.length,
          sellers: enrichedSellers.length,
          speedrun: speedrunItems.length // Add speedrun count
        }
      };
    }
    
    // For other scenarios, use the hardcoded CoreSignal data
    let realBuyerGroupData = { buyerGroups: [] };
    try {
      const baseUrl = process['env']['NEXTAUTH_URL'] || 'http://localhost:3000';
      const buyerGroupsResponse = await fetch(`${baseUrl}/api/demo-scenarios/buyer-groups`);
      if (buyerGroupsResponse.ok) {
        realBuyerGroupData = await buyerGroupsResponse.json();
        console.log(`✅ [DEMO DATA] Loaded real buyer group data: ${realBuyerGroupData.buyerGroups.length} groups`);
      }
    } catch (error) {
      console.error('❌ [DEMO DATA] Error fetching real buyer group data:', error);
    }
    
    // Process real buyer group data to extract leads, prospects, and opportunities
    const realBuyerGroups = realBuyerGroupData.buyerGroups || [];
    
    // Extract people from buyer groups and map to leads/prospects/opportunities
    const matchGroupPeople = realBuyerGroups
      .find(bg => bg['accountName'] === 'Match Group')?.people || [];
    const brexPeople = realBuyerGroups
      .find(bg => bg['accountName'] === 'Brex')?.people || [];
    const firstPremierPeople = realBuyerGroups
      .find(bg => bg['accountName'] === 'First Premier Bank')?.people || [];
    
    // Create leads from Match Group people (10 people)
    const realLeads = matchGroupPeople.map((person, index) => ({
      id: ulid(), // Generate proper ULID
      fullName: person.name,
      firstName: person.name.split(' ')[0] || 'First',
      lastName: person.name.split(' ').slice(1).join(' ') || 'Last',
      name: person.name, // Add name field for consistency
      email: person.email,
      company: 'Match Group',
      companyId: 'company_match_group',
      title: person.role || 'Professional',
      stage: 'lead',
      source: 'CoreSignal Analysis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspaceId: workspaceId,
      isDemoData: true,
      demoScenarioId: demoScenario.id,
      buyerGroupRole: person.buyerGroupRole || 'Stakeholder'
    }));
    
    // Create prospects from Brex people (8 people, excluding introducers if any)
    const realProspects = brexPeople
      .filter(person => person.buyerGroupRole !== 'Introducer')
      .slice(0, 8) // Take first 8 people
      .map((person, index) => ({
        id: ulid(), // Generate proper ULID
        fullName: person.name,
        firstName: person.name.split(' ')[0] || 'First',
        lastName: person.name.split(' ').slice(1).join(' ') || 'Last',
        name: person.name, // Add name field for consistency
        email: person.email,
        company: 'Brex',
        companyId: 'company_brex',
        title: person.role || 'Professional',
        stage: 'prospect',
        source: 'CoreSignal Analysis',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspaceId: workspaceId,
        isDemoData: true,
        demoScenarioId: demoScenario.id,
        buyerGroupRole: person.buyerGroupRole || 'Stakeholder'
      }));
    
    // Create single opportunity from First Premier Bank
    const realOpportunities = [{
      id: ulid(), // Generate proper ULID
      name: 'First Premier Bank CRO Platform Implementation',
      company: 'First Premier Bank',
      companyId: 'company_first_premier_bank',
      stage: 'opportunity',
      value: 50000,
      probability: 75,
      source: 'CoreSignal Analysis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspaceId: workspaceId,
      isDemoData: true,
      demoScenarioId: demoScenario.id,
      buyerGroupId: realBuyerGroups.find(bg => bg['companyName'] === 'First Premier Bank')?.id,
      people: firstPremierPeople.length
    }];
    
    // Extract all people from real buyer groups
    const realPeople = realBuyerGroups.flatMap(bg =>
      Object.values(bg.roles).flat().map(role => ({
        ...role,
        companyId: bg.companyId,
        companyName: bg.companyName,
        buyerGroupId: bg.id,
        buyerGroupStage: bg.stage
      }))
    );

    // Create sellers from workspace users with seller roles
    const sellerWorkspaceUsers = workspaceUsers.filter(wu => ['OWNER', 'ADMIN', 'SELLER'].includes(wu.role));
    
    // Fetch user details for sellers
    const sellerUsers = await Promise.all(
      sellerWorkspaceUsers.map(wu => 
        prisma.users.findUnique({ where: { id: wu.userId } })
      )
    );
    
    const sellers = sellerWorkspaceUsers.map((wu, index) => {
      const user = sellerUsers[index];
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        title: user.title || 'Sales Representative',
        company: 'Winning Variant',
        isOnline: true, // Demo users are always online
        assignedCompanies: [], // Will be populated based on actual assignments
        assignedProspects: prospects.filter(p => p['assignedUserId'] === user.id).length,
        assignedLeads: leads.filter(l => l['assignedUserId'] === user.id).length,
        assignedOpportunities: opportunities.filter(o => o['assignedUserId'] === user.id).length,
        role: wu.role,
        department: user.department || 'Sales',
        seniorityLevel: user.seniorityLevel || 'Mid-Level'
      };
    }).filter(Boolean);

    // Map database data to unified format - prioritize database data for leads
    // For people, combine realPeople (from buyer groups) with actual people from database
    const combinedPeople = [...realPeople];
    people.forEach(person => {
      // Add person if not already in realPeople (avoid duplicates)
      if (!combinedPeople.find(p => p['id'] === person.id)) {
        combinedPeople.push(person);
      }
    });
    
    const demoData = {
      leads: leads.length > 0 ? leads : realLeads,
      prospects: prospects.length > 0 ? prospects : realProspects,
      opportunities: realOpportunities.length > 0 ? realOpportunities : opportunities,
      companies: companies,
      people: combinedPeople,
      partnerships: partnerships, // Load partnerships from database
      clients: clients, // Load clients from database
      buyerGroups: realBuyerGroups.length > 0 ? realBuyerGroups : buyerGroups,
      catalyst: [],
      calendar: [],
      champions: realPeople.filter(p => p['buyerGroupRole'] === 'Champion'),
      decisionMakers: realPeople.filter(p => p['buyerGroupRole'] === 'Decision Maker'),
      speedrunItems: prospects.length > 0 ? prospects : realProspects, // Use database prospects as speedrun items
      sellers: sellers,
      counts: {
        leads: leads.length > 0 ? leads.length : realLeads.length,
        prospects: prospects.length > 0 ? prospects.length : realProspects.length,
        opportunities: realOpportunities.length > 0 ? realOpportunities.length : opportunities.length,
        companies: companies.length,
        people: combinedPeople.length,
        clients: clients.length,
        partners: partnerships.length,
        sellers: sellers.length,
        speedrun: prospects.length > 0 ? prospects.length : realProspects.length // Add speedrun count
      }
    };
    
    console.log(`✅ [DEMO DATA] Loaded demo data from database:`, {
      leads: demoData.leads.length,
      prospects: demoData.prospects.length,
      companies: demoData.companies.length,
      people: demoData.people.length,
      opportunities: demoData.opportunities.length
    });
    
    return demoData;
  } catch (error) {
    console.error('❌ [DEMO DATA] Error loading demo data:', error);
    return {
      leads: [],
      prospects: [],
      opportunities: [],
        companies: [],
        people: [],
      partnerships: [],
      clients: [],
      buyerGroups: [],
      catalyst: [],
      calendar: [],
      champions: [],
      decisionMakers: [],
      speedrunItems: [],
      sellers: [],
      counts: {
        leads: 0,
        prospects: 0,
        opportunities: 0,
        companies: 0,
        people: 0,
        clients: 0,
        partners: 0,
        sellers: 0,
        speedrun: 0
      }
    };
  }
}

// 🚀 CACHING: Multi-layer cache for instant responses
const pendingRequests = new Map<string, Promise<any>>();
const workspaceContextMemoryCache = new Map<string, { data: any; timestamp: number }>();
const unifiedDataMemoryCache = new Map<string, { data: any; timestamp: number }>();
const preloadInProgress = new Set<string>();

// 🆕 TYPES: Enhanced API structures
interface UnifiedDataResponse {
  success: boolean;
  data?: any;
  error?: string;
  meta?: {
    timestamp: string;
    cacheHit: boolean;
    responseTime: number;
    totalCount?: number;
  };
}

interface UnifiedDataRequest {
  type: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'clients' | 'partners' | 'speedrun' | 'dashboard' | 'search';
  action: 'get' | 'create' | 'update' | 'delete' | 'search';
  id?: string;
  data?: any;
  filters?: any;
  pagination?: {
    offset?: number;
    limit?: number;
  };
  search?: {
    query: string;
    category?: string;
  };
}

// 🆕 SUPPORTED DATA TYPES
const SUPPORTED_TYPES = [
  'leads', 'prospects', 'opportunities', 'companies', 
  'people', 'clients', 'partners', 'sellers', 'notes', 'activities', 'speedrun', 'dashboard', 'search'
] as const;

const SUPPORTED_ACTIONS = ['get', 'create', 'update', 'delete', 'search', 'advance_to_prospect', 'advance_to_opportunity'] as const;

// 🆕 CACHE HELPERS
function getCachedResponse(key: string): any | null {
  return null; // Redis integration placeholder
}

function setCachedResponse(key: string, data: any): void {
  // Redis integration placeholder
}

function clearWorkspaceCache(workspaceId: string, userId: string, forceClear: boolean = false): void {
  if (!forceClear) return;
  
  const keysToDelete: string[] = [];
  for (const key of unifiedDataMemoryCache.keys()) {
    if (key.includes(workspaceId) && key.includes(userId)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => {
    unifiedDataMemoryCache.delete(key);
    console.log(`🧹 [CACHE CLEAR] Cleared cache key: ${key}`);
  });
}

// 🚀 WORKSPACE CONTEXT: Optimized workspace resolution
async function getOptimizedWorkspaceContext(request: NextRequest, requestBody?: any): Promise<{
  workspaceId: string;
  userId: string;
  userEmail: string;
}> {
  try {
    console.log('🔍 [WORKSPACE CONTEXT] Starting workspace context resolution');
    console.log('🔍 [WORKSPACE CONTEXT] Request body:', JSON.stringify(requestBody, null, 2));
    
    const authHeader = request.headers.get('authorization');
    console.log('🔍 [WORKSPACE CONTEXT] Auth header present:', !!authHeader);
    
    // Check for Bearer token in Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process['env']['NEXTAUTH_SECRET'] || process['env']['JWT_SECRET'] || "dev-secret-key-change-in-production";
      const decoded = jwt.verify(token, secret) as any;
      
      if (!decoded || !decoded.workspaceId || !decoded.userId || !decoded.email) {
        throw new Error('Invalid JWT token structure');
      }

      console.log('✅ [WORKSPACE CONTEXT] Resolved from JWT token in Authorization header');
      return {
        workspaceId: decoded.workspaceId,
        userId: decoded.userId,
        userEmail: decoded.email
      };
    }
    
    // Check for JWT token in cookies (for web requests with credentials: 'include')
    const cookieToken = request.cookies.get("auth-token")?.value || 
                       request.cookies.get("auth_token")?.value ||
                       request.cookies.get("access_token")?.value;
    
    if (cookieToken) {
      try {
        const secret = process['env']['NEXTAUTH_SECRET'] || process['env']['JWT_SECRET'] || "dev-secret-key-change-in-production";
        const decoded = jwt.verify(cookieToken, secret) as any;
        
        if (decoded && decoded['workspaceId'] && decoded['userId'] && decoded.email) {
          console.log('✅ [WORKSPACE CONTEXT] Resolved from JWT token in cookies');
          return {
            workspaceId: decoded.workspaceId,
            userId: decoded.userId,
            userEmail: decoded.email
          };
        }
      } catch (error) {
        console.warn('⚠️ [WORKSPACE CONTEXT] Failed to verify cookie token:', error);
      }
    }
    
    // Check request body for workspaceId and userId (for POST/PUT requests)
    if (requestBody) {
      // Check both direct body and nested data structure
      const workspaceId = requestBody.workspaceId || requestBody.data?.workspaceId;
      const userId = requestBody.userId || requestBody.data?.userId;
      
      console.log('🔍 [WORKSPACE CONTEXT] Request body data:', {
        workspaceId,
        userId,
        hasWorkspaceId: !!workspaceId,
        hasUserId: !!userId,
        bodyKeys: Object.keys(requestBody)
      });
      
      if (workspaceId && userId) {
        console.log('✅ [WORKSPACE CONTEXT] Resolved from request body');
        return {
          workspaceId,
          userId,
          userEmail: 'api@adrata.com'
        };
      }
    }
    
    // Fallback to query parameters
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const userId = url.searchParams.get('userId');
    const demo = url.searchParams.get('demo');
    
    console.log('🔍 [WORKSPACE CONTEXT] Query params:', { workspaceId, userId, demo });
    
    // Handle demo scenarios
    if (demo === 'true') {
      console.log('✅ [WORKSPACE CONTEXT] Resolved for demo scenario');
      return {
        workspaceId: workspaceId,
        userId: 'demo-user-2025',
        userEmail: 'demo@adrata.com'
      };
    }
    
    // Handle ZeroPoint demo scenarios
    if (workspaceId === ZEROPOINT_DEMO_WORKSPACE_ID) {
      console.log('✅ [WORKSPACE CONTEXT] Resolved for ZeroPoint demo scenario');
      return {
        workspaceId: ZEROPOINT_DEMO_WORKSPACE_ID,
        userId: 'zeropoint-demo-user-2025',
        userEmail: 'demo@zeropoint.com'
      };
    }
    
    // Development fallback - if no workspace/user provided, throw error to let frontend handle it
    if (!workspaceId || !userId) {
      console.log('⚠️ [WORKSPACE CONTEXT] No workspaceId/userId provided in query parameters');
      throw new Error('Missing workspaceId and userId in request');
    }
    
    console.log('✅ [WORKSPACE CONTEXT] Resolved from query parameters');
    return {
      workspaceId,
      userId,
      userEmail: 'api@adrata.com'
    };
    
  } catch (error) {
    console.error('❌ [WORKSPACE CONTEXT] Error:', error);
    console.error('❌ [WORKSPACE CONTEXT] Request body was:', JSON.stringify(requestBody, null, 2));
    throw new Error('Failed to resolve workspace context');
  }
}

// 🆕 DATA OPERATIONS: CRUD operations for all data types
async function handleDataOperation(
  type: string,
  action: string,
  workspaceId: string,
  userId: string,
  requestData?: any,
  id?: string,
  filters?: any,
  pagination?: any,
  search?: any
): Promise<any> {
  
  console.log(`🔧 [DATA OP] ${action.toUpperCase()} ${type}${id ? ` (${id})` : ''}`);
  
  switch (action) {
    case 'get':
      return await handleGet(type, workspaceId, userId, id, filters, pagination);
    case 'create':
      return await handleCreate(type, workspaceId, userId, requestData);
    case 'update':
      return await handleUpdate(type, workspaceId, userId, id!, requestData);
    case 'delete':
      return await handleDelete(type, workspaceId, userId, id!);
    case 'search':
      return await handleSearch(type, workspaceId, userId, search!, pagination);
    case 'advance_to_prospect':
      return await handleAdvanceToProspect(type, workspaceId, userId, id!, requestData);
    case 'advance_to_opportunity':
      return await handleAdvanceToOpportunity(type, workspaceId, userId, id!, requestData);
    case 'get_buyer_groups':
      return await handleGetBuyerGroups(type, workspaceId, userId, id!);
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}

// 🆕 GET OPERATIONS
async function handleGet(
  type: string,
  workspaceId: string,
  userId: string,
  id?: string,
  filters?: any,
  pagination?: any
): Promise<any> {
  
  if (id) {
    // Get single record
    return await getSingleRecord(type, workspaceId, userId, id);
  } else {
    // Get multiple records
    return await getMultipleRecords(type, workspaceId, userId, filters, pagination);
  }
}

async function getSingleRecord(type: string, workspaceId: string, userId: string, id: string): Promise<any> {
  const model = getPrismaModel(type);
  if (!model) throw new Error(`Unsupported type: ${type}`);
  
  // Add include for contacts to get account relationship
  const includeClause = type === 'people' ? {
    include: {
      company: {
        select: {
          id: true,
          name: true,
          industry: true,
          website: true
        }
      }
    }
  } : {};
  
  const whereClause: any = {
    id,
    workspaceId
  };
  
  // Only add deletedAt filter for models that have this field
  if (['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners'].includes(type)) {
    whereClause['deletedAt'] = null;
  }
  
  console.log(`🔍 [GET SINGLE] Looking for ${type} record with ID: ${id} in workspace: ${workspaceId}`);
  console.log(`🔍 [GET SINGLE] Where clause:`, JSON.stringify(whereClause, null, 2));
  
  const record = await model.findFirst({
    where: whereClause,
    ...includeClause
  });
  
  if (!record) {
    console.log(`❌ [GET SINGLE] No ${type} record found with ID: ${id}`);
    throw new Error(`${type} not found`);
  }
  
  console.log(`✅ [GET SINGLE] Found ${type} record:`, record.id);
  return { success: true, data: record };
}

async function getMultipleRecords(
  type: string,
  workspaceId: string,
  userId: string,
  filters?: any,
  pagination?: any
): Promise<any> {
  
  // Check if this is a demo workspace
  if (workspaceId === DEMO_WORKSPACE_ID || workspaceId === ZEROPOINT_DEMO_WORKSPACE_ID) {
    console.log(`🎯 [DEMO DATA] Loading demo data for type: ${type}`);
    
    // Determine scenario slug based on workspace ID
    const scenarioSlug = workspaceId === ZEROPOINT_DEMO_WORKSPACE_ID ? 'zeropoint' : 'winning-variant';
    const demoData = await loadDemoData(scenarioSlug);
    
    // Return the appropriate data based on type
    switch (type) {
      case 'dashboard':
        return {
          success: true,
          data: {
            leads: demoData.leads,
            prospects: demoData.prospects,
            opportunities: demoData.opportunities,
            companies: demoData.companies,
            people: demoData.people,
            partnerships: demoData.partnerships,
            clients: demoData.clients,
            buyerGroups: demoData.buyerGroups,
            catalyst: demoData.catalyst,
            calendar: demoData.calendar,
            champions: demoData.champions,
            decisionMakers: demoData.decisionMakers,
            speedrunItems: demoData.speedrunItems,
            sellers: demoData.sellers,
            counts: demoData.counts
          }
        };
      case 'speedrun':
        return await loadSpeedrunData(workspaceId, userId);
      case 'leads':
        return { success: true, data: demoData.leads };
      case 'prospects':
        return { success: true, data: demoData.prospects };
      case 'opportunities':
        return { success: true, data: demoData.opportunities };
      case 'companies':
        return { success: true, data: demoData.companies };
      case 'people':
        return { success: true, data: demoData.people };
      case 'clients':
        return { success: true, data: demoData.clients };
      case 'partners':
        return { success: true, data: demoData.partnerships };
      case 'sellers':
        return { success: true, data: demoData.sellers };
      default:
        return { success: true, data: [] };
    }
  }
  
  if (type === 'dashboard') {
    return await loadDashboardData(workspaceId, userId);
  }
  
  if (type === 'search') {
    return await handleSearch('all', workspaceId, userId, filters, pagination);
  }
  
  if (type === 'speedrun') {
    return await loadSpeedrunData(workspaceId, userId);
  }
  
  // Special handling for people - show all people records in workspace
  if (type === 'people') {
    const people = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        // Modified: Show all people in workspace, not just assigned ones
        OR: [
          { assignedUserId: userId }, // User's assigned people
          { assignedUserId: null }    // Unassigned people in workspace
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true
          }
        }
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: pagination?.limit || 1000 // Load all people records
    });
    
    return { success: true, data: people };
  }
  
  // Handle speedrun case for non-demo workspaces
  if (type === 'speedrun') {
    return await loadSpeedrunData(workspaceId, userId);
  }
  
  const model = getPrismaModel(type);
  if (!model) throw new Error(`Unsupported type: ${type}`);
  
  const whereClause: any = {
    workspaceId
  };
  
  // Only add deletedAt filter for models that have this field
  if (['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners'].includes(type)) {
    whereClause['deletedAt'] = null;
  }
  
  // Add workspace-level visibility for most types (show assigned + unassigned)
  if (['leads', 'prospects', 'opportunities', 'people', 'companies'].includes(type)) {
    whereClause['OR'] = [
      { assignedUserId: userId }, // User's assigned records
      { assignedUserId: null }    // Unassigned records in workspace
    ];
  }
  
  // Apply additional filters
  if (filters) {
    Object.assign(whereClause, filters);
  }
  
  // Add include for contacts and leads to get account relationship
  const includeClause = type === 'people' ? {
    include: {
      company: {
        select: {
          id: true,
          name: true,
          industry: true,
          website: true
        }
      }
    }
  } : {};

  const records = await model.findMany({
    where: whereClause,
    orderBy: [{ updatedAt: 'desc' }],
    take: pagination?.limit || 1000,
    skip: pagination?.offset || 0,
    ...includeClause
  });
  
  return { success: true, data: records };
}

// 🆕 GET BUYER GROUPS OPERATION
async function handleGetBuyerGroups(type: string, workspaceId: string, userId: string, recordId: string): Promise<any> {
  console.log(`🔧 [BUYER GROUPS] Getting buyer groups for ${type} ${recordId}`);
  
  try {
    // Get the record to find associated buyer groups
    const record = await getPrismaModel(type)?.findUnique({
      where: { id: recordId }
    });
    
    if (!record) {
      throw new Error(`Record not found: ${recordId}`);
    }
    
    // Find buyer groups that include this person
    const buyerGroups = await prisma.buyer_groups.findMany({
      where: {
        workspaceId,
        people: {
          some: {
            personId: record.personId || recordId
          }
        }
      },
      include: {
        people: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                workEmail: true,
                jobTitle: true,
                linkedinUrl: true,
                phone: true,
                mobilePhone: true
              }
            }
          }
        }
      }
    });
    
    console.log(`✅ [BUYER GROUPS] Found ${buyerGroups.length} buyer groups`);
    
    return { success: true, data: buyerGroups };
  } catch (error) {
    console.error(`❌ [BUYER GROUPS] Failed to get buyer groups:`, error);
    throw new Error(`Failed to get buyer groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 🆕 CREATE OPERATIONS
async function handleCreate(type: string, workspaceId: string, userId: string, data: any): Promise<any> {
  // Special handling for clients - need to create both account and client records
  if (type === 'clients') {
    return await handleClientCreate(workspaceId, userId, data);
  }
  
  const model = getPrismaModel(type);
  if (!model) throw new Error(`Unsupported type: ${type}`);
  
  // Add workspace and user context
  const createData = {
    ...data,
    workspaceId
  };
  
  // Only add assignedUserId for records that have this field
  if (type !== 'notes') {
    createData.assignedUserId = userId;
  }
  
  // Only add createdAt/updatedAt for records that need them
  if (type !== 'notes') {
    createData.createdAt = new Date();
    createData.updatedAt = new Date();
  }

  // Generate ID for records that require it
  if (!createData.id) {
    if (type === 'companies') {
      createData['id'] = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (type === 'leads') {
      createData['id'] = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (type === 'prospects') {
      createData['id'] = `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (type === 'opportunities') {
      createData['id'] = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (type === 'people') {
      createData['id'] = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (type === 'partners') {
      createData['id'] = `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Handle special field requirements for leads, prospects, partners, and clients
  if (type === 'leads' || type === 'prospects' || type === 'partners' || type === 'clients') {
    // If name is provided but firstName/lastName are not, split the name
    if (createData['name'] && !createData['firstName'] && !createData.lastName) {
      const nameParts = createData.name.trim().split(' ');
      createData['firstName'] = nameParts[0] || '';
      createData['lastName'] = nameParts.slice(1).join(' ') || '';
      createData['fullName'] = createData.name;
    }
    
    // Comprehensive field mapping for frontend to database consistency
    const fieldMappings = {
      // Name fields
      'name': 'fullName',
      'jobTitle': 'title',
      'companyName': 'company',
      'workEmail': 'workEmail',
      'personalEmail': 'personalEmail',
      'mobilePhone': 'mobilePhone',
      'workPhone': 'workPhone',
      'linkedinUrl': 'linkedinUrl',
      'companyDomain': 'companyDomain',
      'companySize': 'companySize',
      'department': 'department',
      'industry': 'industry',
      'vertical': 'vertical',
      'address': 'address',
      'city': 'city',
      'state': 'state',
      'country': 'country',
      'postalCode': 'postalCode',
      'notes': 'notes',
      'description': 'description',
      'tags': 'tags',
      'customFields': 'customFields',
      'preferredLanguage': 'preferredLanguage',
      'timezone': 'timezone',
      'status': 'status',
      'priority': 'priority',
      'source': 'source',
      'estimatedValue': 'estimatedValue',
      'currency': 'currency'
    };
    
    // Apply field mappings
    Object.entries(fieldMappings).forEach(([frontendField, dbField]) => {
      if (createData[frontendField] !== undefined && !createData[dbField]) {
        createData[dbField] = createData[frontendField];
      }
      // Remove the frontend field after mapping
      delete createData[frontendField];
    });
    
    // Ensure required fields have defaults - these are required by the schema
    if (!createData.firstName) createData['firstName'] = 'First';
    if (!createData.lastName) createData['lastName'] = 'Last';
    if (!createData.fullName) createData['fullName'] = `${createData.firstName} ${createData.lastName}`;
    
    // Ensure updatedAt is set
    if (!createData.updatedAt) createData['updatedAt'] = new Date();
    
    // Remove frontend-specific fields that don't exist in database
    delete createData.name; // We've already split this into firstName/lastName/fullName
    delete createData.title; // We've mapped this to jobTitle
    delete createData.userId; // This is mapped to assignedUserId
  }
  
  console.log(`🔧 [CREATE] Creating ${type} with data:`, JSON.stringify(createData, null, 2));
  
  try {
    // For person-related records (leads, prospects, partners), create person and company records first
    if (type === 'leads' || type === 'prospects' || type === 'partners') {
      return await createPersonRelatedRecord(type, createData, workspaceId, userId);
    }
    
    const record = await model.create({
      data: createData
    });
    
    console.log(`✅ [CREATE] Successfully created ${type}:`, record.id);
    
    // Clear cache after create
    clearWorkspaceCache(workspaceId, userId, true);
    
    return { success: true, data: record };
  } catch (createError) {
    console.error(`❌ [CREATE] Failed to create ${type}:`, createError);
    console.error(`❌ [CREATE] Data that failed:`, JSON.stringify(createData, null, 2));
    throw new Error(`Failed to create ${type}: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
  }
}

// Special function to handle person-related record creation (leads, prospects, partners)
async function createPersonRelatedRecord(type: string, createData: any, workspaceId: string, userId: string): Promise<any> {
  console.log(`🔧 [CREATE_PERSON_RELATED] Creating ${type} with person and company linking`);
  
  let personId: string | null = null;
  let companyId: string | null = null;
  
  try {
    // Step 1: Create or find company record if company name is provided
    if (createData['company'] && createData.company.trim()) {
      console.log(`🏢 [CREATE_PERSON_RELATED] Processing company: ${createData.company}`);
      
      // Check if company already exists
      const existingCompany = await prisma.companies.findFirst({
        where: {
          workspaceId,
          name: { equals: createData.company, mode: 'insensitive' }
        }
      });
      
      if (existingCompany) {
        companyId = existingCompany.id;
        console.log(`✅ [CREATE_PERSON_RELATED] Found existing company: ${existingCompany.id}`);
      } else {
        // Create new company record
        const newCompany = await prisma.companies.create({
          data: {
            id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId,
            name: createData.company,
            website: createData.companyDomain || createData.website || null,
            industry: createData.industry || null,
            size: createData.companySize || null,
            assignedUserId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        companyId = newCompany.id;
        console.log(`✅ [CREATE_PERSON_RELATED] Created new company: ${newCompany.id}`);
      }
    }
    
    // Step 2: Create person record
    console.log(`👤 [CREATE_PERSON_RELATED] Creating person record for ${createData.fullName}`);
    
    const personData = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId,
      companyId,
      assignedUserId: userId,
      firstName: createData.firstName,
      lastName: createData.lastName,
      fullName: createData.fullName,
      displayName: createData.displayName || createData.fullName,
      jobTitle: createData.jobTitle || createData.title || null,
      department: createData.department || null,
      email: createData.email || createData.workEmail || null,
      workEmail: createData.workEmail || createData.email || null,
      phone: createData.phone || createData.workPhone || null,
      mobilePhone: createData.mobilePhone || null,
      workPhone: createData.workPhone || createData.phone || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newPerson = await prisma.people.create({
      data: personData
    });
    personId = newPerson.id;
    console.log(`✅ [CREATE_PERSON_RELATED] Created person record: ${newPerson.id}`);
    
    // Step 3: Create the main record (lead, prospect, or partner) with proper linking
    const model = getPrismaModel(type);
    if (!model) throw new Error(`Unsupported type: ${type}`);
    
    // Add the personId and companyId to the create data
    const linkedCreateData = {
      ...createData,
      personId,
      companyId
    };
    
    console.log(`🔗 [CREATE_PERSON_RELATED] Creating ${type} with personId: ${personId}, companyId: ${companyId}`);
    
    const record = await model.create({
      data: linkedCreateData
    });
    
    console.log(`✅ [CREATE_PERSON_RELATED] Successfully created ${type}: ${record.id} linked to person: ${personId} and company: ${companyId}`);
    
    // Clear cache after create
    clearWorkspaceCache(workspaceId, userId, true);
    
    return { success: true, data: record };
    
  } catch (error) {
    console.error(`❌ [CREATE_PERSON_RELATED] Failed to create ${type}:`, error);
    throw new Error(`Failed to create ${type} with person linking: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Special function to handle client creation (account + client records)
async function handleClientCreate(workspaceId: string, userId: string, data: any): Promise<any> {
  try {
    // First create the account record
    const account = await prisma.companies.create({
      data: {
        id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        website: data.website || null,
        notes: data.notes || null,
        workspaceId,
        assignedUserId: userId,
        updatedAt: new Date()
      }
    });

    // Then create the client record
    const client = await prisma.clients.create({
      data: {
        id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId,
        companyId: account.id,
        customerSince: new Date(),
        customerStatus: 'active',
        contractValue: data.contractValue ? parseFloat(data.contractValue) : 0,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        totalLifetimeValue: data.contractValue ? parseFloat(data.contractValue) : 0,
        updatedAt: new Date()
      }
    });

    // Log person IDs for future relationship creation
    if (data['personIds'] && data.personIds.length > 0) {
      console.log('📝 [UNIFIED API] Person IDs to associate with client:', data.personIds);
      // TODO: Implement person-client relationship creation
    }

    // Clear cache after create
    clearWorkspaceCache(workspaceId, userId, true);

    return { 
      success: true, 
      data: { 
        ...client, 
        accountName: account.name, 
        accountWebsite: account.website 
      } 
    };
  } catch (error) {
    console.error('Error creating client:', error);
    throw new Error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 🆕 UPDATE OPERATIONS
async function handleUpdate(type: string, workspaceId: string, userId: string, id: string, data: any): Promise<any> {
  console.log(`🔧 [UPDATE] Updating ${type} ${id} with data:`, JSON.stringify(data, null, 2));
  
  try {
    const model = getPrismaModel(type);
    if (!model) throw new Error(`Unsupported type: ${type}`);
    
    // Get the current record to compare changes
    const currentRecord = await model.findUnique({
      where: { id }
    });
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // Handle special field requirements for leads, prospects, partners, and clients
    if (type === 'leads' || type === 'prospects' || type === 'partners' || type === 'clients') {
      // If name is provided but firstName/lastName are not, split the name
      if (updateData['name'] && !updateData['firstName'] && !updateData.lastName) {
        const nameParts = updateData.name.trim().split(' ');
        updateData['firstName'] = nameParts[0] || '';
        updateData['lastName'] = nameParts.slice(1).join(' ') || '';
        updateData['fullName'] = updateData.name;
      }
      
      // Comprehensive field mapping for frontend to database consistency
      const fieldMappings = {
        'name': 'fullName',
        'jobTitle': 'title',
        'companyName': 'company',
        'workEmail': 'workEmail',
        'personalEmail': 'personalEmail',
        'mobilePhone': 'mobilePhone',
        'workPhone': 'workPhone',
        'linkedinUrl': 'linkedinUrl',
        'companyDomain': 'companyDomain',
        'companySize': 'companySize',
        'department': 'department',
        'industry': 'industry',
        'vertical': 'vertical',
        'address': 'address',
        'city': 'city',
        'state': 'state',
        'country': 'country',
        'postalCode': 'postalCode',
        'notes': 'notes',
        'description': 'description',
        'tags': 'tags',
        'customFields': 'customFields',
        'preferredLanguage': 'preferredLanguage',
        'timezone': 'timezone',
        'status': 'status',
        'priority': 'priority',
        'source': 'source',
        'estimatedValue': 'estimatedValue',
        'currency': 'currency'
      };
      
      // Apply field mappings
      Object.entries(fieldMappings).forEach(([frontendField, dbField]) => {
        if (updateData[frontendField] !== undefined && !updateData[dbField]) {
          updateData[dbField] = updateData[frontendField];
        }
        // Remove the frontend field after mapping
        delete updateData[frontendField];
      });
      
      // Remove frontend-specific fields that don't exist in database
      delete updateData.userId; // This is mapped to assignedUserId
    }
    
    const record = await model.update({
      where: { id },
      data: updateData
    });
    
    // Log activities for field changes
    await logFieldChanges(type, id, currentRecord, data, userId, workspaceId);
    
    console.log(`✅ [UPDATE] Successfully updated ${type} ${id}`);
    console.log(`✅ [UPDATE] Updated record:`, JSON.stringify(record, null, 2));
    console.log(`✅ [UPDATE] Update data that was sent:`, JSON.stringify(updateData, null, 2));
    
    // Clear cache after update
    clearWorkspaceCache(workspaceId, userId, true);
    
    // Also clear the unified data cache specifically
    const cacheKeysToClear = Array.from(unifiedDataMemoryCache.keys()).filter(key => 
      key.includes(workspaceId) && key.includes(userId)
    );
    cacheKeysToClear.forEach(key => unifiedDataMemoryCache.delete(key));
    console.log(`🧹 [UPDATE] Cleared ${cacheKeysToClear.length} cache entries`);
    
    return { 
      success: true, 
      data: record,
      message: `Successfully updated ${type} record`
    };
  } catch (updateError) {
    console.error(`❌ [UPDATE] Failed to update ${type} ${id}:`, updateError);
    console.error(`❌ [UPDATE] Data that failed:`, JSON.stringify(data, null, 2));
    throw new Error(`Failed to update ${type}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
  }
}

// 🆕 LOG FIELD CHANGES FOR TIMELINE
async function logFieldChanges(type: string, recordId: string, oldRecord: any, newData: any, userId: string, workspaceId: string): Promise<void> {
  try {
    const activities = [];
    
    // Define field display names
    const fieldDisplayNames: { [key: string]: string } = {
      'email': 'Email',
      'phone': 'Phone',
      'company': 'Company',
      'title': 'Title',
      'department': 'Department',
      'source': 'Source',
      'status': 'Status',
      'priority': 'Priority',
      'industry': 'Industry',
      'linkedinUrl': 'LinkedIn',
      'website': 'Website',
      'address': 'Address',
      'city': 'City',
      'state': 'State',
      'country': 'Country',
      'notes': 'Notes',
      'description': 'Description'
    };
    
    // Check each field for changes
    for (const [field, newValue] of Object.entries(newData)) {
      if (field === 'updatedAt') continue; // Skip timestamp fields
      
      const oldValue = oldRecord?.[field];
      const displayName = fieldDisplayNames[field] || field.charAt(0).toUpperCase() + field.slice(1);
      
      // Check if value actually changed
      if (oldValue !== newValue && (oldValue || newValue)) {
        let activityDescription = '';
        
        if (!oldValue && newValue) {
          // Field was added
          activityDescription = `Added ${displayName.toLowerCase()}`;
        } else if (oldValue && !newValue) {
          // Field was removed
          activityDescription = `Removed ${displayName.toLowerCase()}`;
        } else {
          // Field was updated
          activityDescription = `Updated ${displayName.toLowerCase()}`;
        }
        
        activities.push({
          type: 'field_update',
          field: field,
          oldValue: oldValue,
          newValue: newValue,
          description: activityDescription,
          timestamp: new Date()
        });
      }
    }
    
    // Store activities in the record's lastAction and lastActionDate
    if (activities.length > 0) {
      const latestActivity = activities[activities.length - 1];
      const model = getPrismaModel(type);
      
      if (model) {
        await model.update({
          where: { id: recordId },
          data: {
            lastAction: latestActivity.description,
            lastActionDate: latestActivity.timestamp,
            lastActionBy: userId
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [ACTIVITY LOG] Failed to log field changes:', error);
    // Don't throw error - activity logging failure shouldn't break the update
  }
}

// 🆕 DELETE OPERATIONS (Soft Delete)
async function handleDelete(type: string, workspaceId: string, userId: string, id: string): Promise<any> {
  const model = getPrismaModel(type);
  if (!model) throw new Error(`Unsupported type: ${type}`);
  
  const record = await model.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  // Clear cache after delete
  clearWorkspaceCache(workspaceId, userId, true);
  
  return { success: true, data: record };
}

// 🆕 ADVANCE TO PROSPECT OPERATIONS
async function handleAdvanceToProspect(type: string, workspaceId: string, userId: string, id: string, requestData: any): Promise<any> {
  console.log(`🔧 [ADVANCE] Advancing ${type} ${id} to prospect`);
  
  try {
    // Only allow advancing leads to prospects
    if (type !== 'leads') {
      throw new Error(`Cannot advance ${type} to prospect. Only leads can be advanced.`);
    }
    
    // Get the lead record
    const leadModel = getPrismaModel('leads');
    if (!leadModel) throw new Error('Leads model not found');
    
    const lead = await leadModel.findUnique({
      where: { id }
    });
    
    if (!lead) {
      throw new Error(`Lead with id ${id} not found`);
    }
    
    console.log(`✅ [ADVANCE] Found lead:`, lead.fullName);
    
    // Check for other leads at the same company
    const companyLeads = await leadModel.findMany({
      where: {
        workspaceId,
        company: lead.company,
        id: { not: id }, // Exclude the current lead
        deletedAt: null
      }
    });
    
    console.log(`🔍 [ADVANCE] Found ${companyLeads.length} other leads at ${lead.company}`);
    
    // Create a new prospect record with the lead data
    const prospectModel = getPrismaModel('prospects');
    if (!prospectModel) throw new Error('Prospects model not found');
    
    // Prepare prospect data from lead data - using new schema structure
    const prospectData = {
      workspaceId: lead.workspaceId,
      assignedUserId: lead.assignedUserId,
      personId: lead.personId, // Use the same personId from the lead
      firstName: lead.firstName,
      lastName: lead.lastName,
      fullName: lead.fullName,
      displayName: lead.displayName,
      email: lead.email,
      workEmail: lead.workEmail,
      personalEmail: lead.personalEmail,
      phone: lead.phone,
      mobilePhone: lead.mobilePhone,
      workPhone: lead.workPhone,
      company: lead.company,
      companyDomain: lead.companyDomain,
      industry: lead.industry,
      vertical: lead.vertical,
      companySize: lead.companySize,
      jobTitle: lead.jobTitle,
      title: lead.title,
      department: lead.department,
      linkedinUrl: lead.linkedinUrl,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      postalCode: lead.postalCode,
      status: 'engaged', // Set to engaged status for new prospect
      priority: lead.priority || 'medium',
      source: lead.source || 'Advanced from Lead',
      estimatedValue: lead.estimatedValue,
      currency: lead.currency || 'USD',
      notes: lead.notes,
      description: lead.description,
      tags: lead.tags || [],
      customFields: lead.customFields,
      preferredLanguage: lead.preferredLanguage,
      timezone: lead.timezone,
      lastEnriched: lead.lastEnriched,
      enrichmentSources: lead.enrichmentSources || [],
      emailVerified: lead.emailVerified,
      phoneVerified: lead.phoneVerified,
      mobileVerified: lead.mobileVerified,
      enrichmentScore: lead.enrichmentScore,
      emailConfidence: lead.emailConfidence,
      phoneConfidence: lead.phoneConfidence,
      dataCompleteness: lead.dataCompleteness,
      engagementLevel: 'initial', // Reset engagement level for new prospect
      lastContactDate: null,
      nextFollowUpDate: null,
      touchPointsCount: 0,
      responseRate: null,
      avgResponseTime: lead.avgResponseTime || 0,
      buyingSignals: lead.buyingSignals || [],
      painPoints: [],
      interests: [],
      budget: lead.budget,
      authority: lead.authority,
      needUrgency: null,
      timeline: null,
      competitorMentions: lead.competitorMentions || [],
      marketingQualified: false,
      salesQualified: false,
      buyerGroupRole: lead.buyerGroupRole,
      completedStages: [],
      currentStage: null,
      lastActionDate: null,
      nextAction: null,
      nextActionDate: null,
      relationship: lead.relationship,
      demoScenarioId: lead.demoScenarioId,
      isDemoData: lead.isDemoData,
      externalId: lead.externalId,
      zohoId: lead.zohoId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create the prospect
    const newProspect = await prospectModel.create({
      data: prospectData
    });
    
    console.log(`✅ [ADVANCE] Created prospect:`, newProspect.id);
    
    // Create buyer group for the company if it doesn't exist
    let buyerGroup = await prisma.buyer_groups.findFirst({
      where: {
        workspaceId,
        name: { contains: lead.company }
      }
    });
    
    if (!buyerGroup) {
      buyerGroup = await prisma.buyer_groups.create({
        data: {
          workspaceId,
          assignedUserId: userId,
          name: `${lead.company} Leadership`,
          description: `Decision makers for software purchases at ${lead.company}`,
          purpose: 'Evaluating CRM and sales tools',
          status: 'active',
          priority: 'high',
          estimatedValue: 50000,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ [ADVANCE] Created buyer group:`, buyerGroup.id);
    }
    
    // Add the new prospect to the buyer group
    await prisma.buyerGroupToPerson.create({
      data: {
        buyerGroupId: buyerGroup.id,
        personId: lead.personId,
        role: lead.buyerGroupRole || 'Decision Maker',
        isPrimary: true, // First prospect is primary
        influence: 'high',
        notes: 'Primary decision maker',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Convert other company leads to prospects if they meet criteria
    const convertedLeads = [];
    for (const companyLead of companyLeads) {
      // Check if this lead should be auto-converted
      const shouldConvert = companyLead['buyerGroupRole'] && 
                           (companyLead.buyerGroupRole.includes('Decision') || 
                            companyLead.buyerGroupRole.includes('Champion') ||
                            companyLead.buyerGroupRole.includes('Stakeholder'));
      
      if (shouldConvert) {
        // Create prospect for this lead
        const companyProspectData = {
          ...prospectData,
          firstName: companyLead.firstName,
          lastName: companyLead.lastName,
          fullName: companyLead.fullName,
          displayName: companyLead.displayName,
          email: companyLead.email,
          workEmail: companyLead.workEmail,
          personalEmail: companyLead.personalEmail,
          phone: companyLead.phone,
          mobilePhone: companyLead.mobilePhone,
          workPhone: companyLead.workPhone,
          jobTitle: companyLead.jobTitle,
          title: companyLead.title,
          department: companyLead.department,
          linkedinUrl: companyLead.linkedinUrl,
          buyerGroupRole: companyLead.buyerGroupRole,
          personId: companyLead.personId
        };
        
        const companyProspect = await prospectModel.create({
          data: companyProspectData
        });
        
        // Add to buyer group
        await prisma.buyerGroupToPerson.create({
          data: {
            buyerGroupId: buyerGroup.id,
            personId: companyLead.personId,
            role: companyLead.buyerGroupRole || 'Stakeholder',
            isPrimary: false,
            influence: companyLead.buyerGroupRole?.includes('Decision') ? 'high' : 'medium',
            notes: 'Auto-converted from lead',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Soft delete the lead
        await leadModel.update({
          where: { id: companyLead.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        convertedLeads.push(companyLead.fullName);
        console.log(`✅ [ADVANCE] Auto-converted lead:`, companyLead.fullName);
      }
    }
    
    // Soft delete the original lead
    await leadModel.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ [ADVANCE] Successfully advanced lead ${id} to prospect ${newProspect.id}`);
    
    // Clear cache after advance
    clearWorkspaceCache(workspaceId, userId, true);
    
    return { 
      success: true, 
      data: newProspect,
      newRecordId: newProspect.id,
      message: `Lead successfully advanced to prospect${convertedLeads.length > 0 ? ` and ${convertedLeads.length} other company leads auto-converted` : ''}`,
      convertedLeads: convertedLeads,
      buyerGroupId: buyerGroup.id
    };
    
  } catch (error) {
    console.error(`❌ [ADVANCE] Failed to advance ${type} ${id}:`, error);
    throw new Error(`Failed to advance to prospect: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 🆕 ADVANCE TO LEAD OPERATIONS (formerly advance to opportunity)
async function handleAdvanceToOpportunity(type: string, workspaceId: string, userId: string, id: string, requestData: any): Promise<any> {
  console.log(`🔧 [ADVANCE] Advancing ${type} ${id} to lead`);
  
  try {
    // Only allow advancing prospects to leads
    if (type !== 'prospects') {
      throw new Error(`Cannot advance ${type} to lead. Only prospects can be advanced.`);
    }
    
    // Get the prospect record
    const prospectModel = getPrismaModel('prospects');
    if (!prospectModel) throw new Error('Prospects model not found');
    
    const prospect = await prospectModel.findUnique({
      where: { id }
    });
    
    if (!prospect) {
      throw new Error(`Prospect with id ${id} not found`);
    }
    
    console.log(`✅ [ADVANCE] Found prospect:`, prospect.fullName);
    
    // Create a new lead record with the prospect data
    const leadModel = getPrismaModel('leads');
    if (!leadModel) throw new Error('Leads model not found');
    
    // Prepare lead data from prospect data
    const leadData = {
      workspaceId: prospect.workspaceId,
      assignedUserId: prospect.assignedUserId,
      personId: prospect.personId,
      companyId: prospect.companyId,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      fullName: prospect.fullName,
      displayName: prospect.displayName,
      email: prospect.email,
      workEmail: prospect.workEmail,
      personalEmail: prospect.personalEmail,
      phone: prospect.phone,
      mobilePhone: prospect.mobilePhone,
      workPhone: prospect.workPhone,
      company: prospect.company,
      companyDomain: prospect.companyDomain,
      industry: prospect.industry,
      vertical: prospect.vertical,
      companySize: prospect.companySize,
      jobTitle: prospect.jobTitle,
      title: prospect.title,
      department: prospect.department,
      linkedinUrl: prospect.linkedinUrl,
      address: prospect.address,
      city: prospect.city,
      state: prospect.state,
      country: prospect.country,
      postalCode: prospect.postalCode,
      status: 'new', // Set to new status for new lead
      priority: prospect.priority || 'medium',
      source: prospect.source || 'Advanced from Prospect',
      estimatedValue: prospect.estimatedValue,
      currency: prospect.currency || 'USD',
      notes: prospect.notes,
      description: prospect.description,
      tags: prospect.tags || [],
      customFields: prospect.customFields,
      preferredLanguage: prospect.preferredLanguage,
      timezone: prospect.timezone,
      lastEnriched: prospect.lastEnriched,
      enrichmentSources: prospect.enrichmentSources || [],
      emailVerified: prospect.emailVerified,
      phoneVerified: prospect.phoneVerified,
      mobileVerified: prospect.mobileVerified,
      enrichmentScore: prospect.enrichmentScore,
      emailConfidence: prospect.emailConfidence,
      phoneConfidence: prospect.phoneConfidence,
      dataCompleteness: prospect.dataCompleteness,
      engagementLevel: 'initial', // Reset engagement level for new lead
      lastContactDate: null,
      nextFollowUpDate: null,
      touchPointsCount: 0,
      responseRate: null,
      avgResponseTime: prospect.avgResponseTime || 0,
      buyingSignals: prospect.buyingSignals || [],
      painPoints: [],
      interests: [],
      budget: prospect.budget,
      authority: prospect.authority,
      needUrgency: null,
      timeline: null,
      competitorMentions: prospect.competitorMentions || [],
      marketingQualified: false,
      salesQualified: false,
      buyerGroupRole: prospect.buyerGroupRole,
      completedStages: [],
      currentStage: null,
      lastActionDate: null,
      nextAction: null,
      nextActionDate: null,
      relationship: prospect.relationship,
      demoScenarioId: prospect.demoScenarioId,
      isDemoData: prospect.isDemoData,
      externalId: prospect.externalId,
      zohoId: prospect.zohoId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create the lead
    const newLead = await leadModel.create({
      data: leadData
    });
    
    console.log(`✅ [ADVANCE] Created lead:`, newLead.id);
    console.log(`✅ [ADVANCE] Lead data:`, JSON.stringify(newLead, null, 2));
    
    // Soft delete the original prospect
    await prospectModel.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ [ADVANCE] Successfully advanced prospect ${id} to lead ${newLead.id}`);
    
    // Clear cache after advance
    clearWorkspaceCache(workspaceId, userId, true);
    
    // Also clear the unified data cache specifically
    const cacheKeysToClear = Array.from(unifiedDataMemoryCache.keys()).filter(key => 
      key.includes(workspaceId) && key.includes(userId)
    );
    cacheKeysToClear.forEach(key => unifiedDataMemoryCache.delete(key));
    console.log(`🧹 [ADVANCE] Cleared ${cacheKeysToClear.length} cache entries`);
    
    return { 
      success: true, 
      data: newLead,
      newRecordId: newLead.id,
      message: `Prospect successfully advanced to lead`
    };
    
  } catch (error) {
    console.error(`❌ [ADVANCE] Failed to advance ${type} ${id}:`, error);
    throw new Error(`Failed to advance to lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 🆕 SEARCH OPERATIONS
async function handleSearch(
  type: string,
  workspaceId: string,
  userId: string,
  search: any,
  pagination?: any
): Promise<any> {
  
  const { query, category } = search;
  if (!query) throw new Error('Search query is required');
  
  // If category is specified, search that specific type
  const searchType = category || type;
  
  if (searchType === 'all') {
    // Search across all types
    return await searchAllTypes(workspaceId, userId, query, pagination);
  } else {
    // Search specific type
    return await searchSpecificType(searchType, workspaceId, userId, query, pagination);
  }
}

async function searchAllTypes(workspaceId: string, userId: string, query: string, pagination?: any): Promise<any> {
  const searchTypes = ['leads', 'prospects', 'opportunities', 'companies', 'people'];
  const results: any = {};
  
  for (const type of searchTypes) {
    try {
      const typeResults = await searchSpecificType(type, workspaceId, userId, query, { limit: 20 });
      results[type] = typeResults.data || [];
    } catch (error) {
      console.warn(`Search failed for ${type}:`, error);
      results[type] = [];
    }
  }
  
  return { success: true, data: results };
}

async function searchSpecificType(
  type: string,
  workspaceId: string,
  userId: string,
  query: string,
  pagination?: any
): Promise<any> {
  
  const model = getPrismaModel(type);
  if (!model) throw new Error(`Unsupported search type: ${type}`);
  
  const whereClause: any = {
    workspaceId,
    deletedAt: null,
    OR: [
      { fullName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { company: { contains: query, mode: 'insensitive' } }
    ]
  };
  
  // Add user assignment filter for most types
  if (['leads', 'prospects', 'opportunities', 'people', 'companies'].includes(type)) {
    whereClause['assignedUserId'] = userId;
  }
  
  const records = await model.findMany({
    where: whereClause,
    orderBy: [{ updatedAt: 'desc' }],
    take: pagination?.limit || 50,
    skip: pagination?.offset || 0
  });
  
  return { success: true, data: records };
}

// 🆕 PRISMA MODEL MAPPING
function getPrismaModel(type: string): any {
  const modelMap: { [key: string]: any } = {
    leads: prisma.leads,
    prospects: prisma.prospects,
    opportunities: prisma.opportunities,
    companies: prisma.companies,
    people: prisma.people,
    clients: prisma.clients,
    partners: prisma.partners,
    sellers: prisma.workspace_users, // 🆕 FIX: Add sellers support
    notes: prisma.notes,
    activities: prisma.actions
  };
  
  return modelMap[type];
}

// 🆕 DASHBOARD DATA LOADING
async function loadDashboardData(workspaceId: string, userId: string): Promise<any> {
  try {
    console.log(`🔍 [DASHBOARD] Loading dashboard data for workspace: ${workspaceId}, user: ${userId}`);
    
    // Check if this is a demo scenario
    if (workspaceId === ZEROPOINT_DEMO_WORKSPACE_ID || workspaceId === DEMO_WORKSPACE_ID) {
      console.log(`🎯 [DASHBOARD] Using demo data for workspace: ${workspaceId}`);
      const scenarioSlug = workspaceId === ZEROPOINT_DEMO_WORKSPACE_ID ? 'zeropoint' : 'winning-variant';
      const demoData = await loadDemoData(scenarioSlug);
      
      return {
        success: true,
        data: {
          leads: demoData.leads,
          prospects: demoData.prospects,
          opportunities: demoData.opportunities,
          companies: demoData.companies,
          people: demoData.people,
          clients: demoData.clients,
          partners: demoData.partnerships,
          speedrunItems: demoData.speedrunItems,
          counts: demoData.counts,
          totalPipelineValue: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // 🚀 PERFORMANCE: Load counts and data in fewer queries
    const [
      leadsCount,
      prospectsCount,
      opportunitiesCount,
      companiesCount,
      peopleCount,
      clientsCount,
      partnersCount,
      speedrunCount,
      leadsData,
      prospectsData,
      opportunitiesData,
      companiesData,
      peopleData,
      clientsData,
      partnersData,
      speedrunData
    ] = await Promise.all([
      prisma.leads.count({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      prisma.prospects.count({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      prisma.opportunities.count({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      prisma.companies.count({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      prisma.people.count({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      prisma.clients.count({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId }
      }).catch(() => 0), // Fallback to 0 if clients table has issues
      prisma.partners.count({ 
        where: { workspaceId, deletedAt: null }
      }).catch(() => 0), // Fallback to 0 if partners table has issues
      // Speedrun count - count leads and prospects that are active for speedrun
      Promise.all([
        prisma.leads.count({
          where: {
            workspaceId,
            deletedAt: null,
            assignedUserId: userId,
            status: {
              in: ["new", "contacted", "qualified", "follow-up", "demo-scheduled"]
            }
          }
        }),
        prisma.prospects.count({
          where: {
            workspaceId,
            deletedAt: null,
            assignedUserId: userId,
            status: {
              in: ["new", "contacted", "qualified", "follow-up", "demo-scheduled"]
            }
          }
        })
      ]).then(([leadsCount, prospectsCount]) => leadsCount + prospectsCount),
      // 🚀 PERFORMANCE: Load minimal data for dashboard display only
      prisma.leads.findMany({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000 // Load all leads for full pipeline view
      }),
      prisma.prospects.findMany({ 
        where: { 
          workspaceId, 
          deletedAt: null
          // Show all prospects in workspace regardless of assignment
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000 // Load all prospects for full pipeline view
      }),
      prisma.opportunities.findMany({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000 // Load all opportunities for full pipeline view
      }),
      prisma.companies.findMany({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 2000, // Load all companies for full pipeline view
        select: { id: true, name: true, industry: true, updatedAt: true, rank: true }
      }).then(companies => {
        // Sort companies to put 5Bars Services first
        const sortedCompanies = companies.sort((a, b) => {
          const aIs5Bars = a.name.toLowerCase().includes('5bars') || a.name.toLowerCase().includes('5 bars');
          const bIs5Bars = b.name.toLowerCase().includes('5bars') || b.name.toLowerCase().includes('5 bars');
          
          if (aIs5Bars && !bIs5Bars) return -1;
          if (!aIs5Bars && bIs5Bars) return 1;
          
          // If both or neither are 5Bars, maintain original order (by updatedAt desc)
          return 0;
        });

        // Assign ranks to companies (1-based indexing)
        for (let i = 0; i < sortedCompanies.length; i++) {
          sortedCompanies[i].rank = i + 1;
        }

        return sortedCompanies;
      }),
      prisma.people.findMany({ 
        where: { 
          workspaceId, 
          deletedAt: null, 
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 2000, // Load all people for full pipeline view
        select: { id: true, fullName: true, firstName: true, lastName: true, company: true, updatedAt: true }
      }),
      prisma.clients.findMany({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 10, // Only load 10 most recent clients
        select: { id: true, customerStatus: true, totalLifetimeValue: true, updatedAt: true }
      }).catch(() => []), // Fallback to empty array if clients table has issues
      prisma.partners.findMany({ 
        where: { workspaceId, deletedAt: null },
        orderBy: [{ updatedAt: 'desc' }],
        take: 10, // Only load 10 most recent partners
        select: { id: true, name: true, email: true, updatedAt: true }
      }).catch(() => []), // Fallback to empty array if partners table has issues
      // 🚀 PERFORMANCE: Load limited speedrun data for dashboard
      loadSpeedrunData(workspaceId, userId).then(result => {
        if (result.success) {
          // Return first 50 items for speedrun
          return result.data.speedrunItems.slice(0, 50);
        } else {
          console.error('❌ [DASHBOARD] Failed to load speedrun data:', result.error);
          return [];
        }
      })
    ]);
    
    console.log(`✅ [DASHBOARD] Loaded data: leads=${leadsData.length}, prospects=${prospectsData.length}, opportunities=${opportunitiesData.length}, speedrun=${speedrunData.length}`);
    
    // Debug: Log sample speedrun data to verify names
    if (speedrunData.length > 0) {
      console.log(`🔍 [DASHBOARD DEBUG] Sample speedrun data:`, speedrunData.slice(0, 3).map(item => ({
        id: item.id,
        fullName: item.fullName,
        firstName: item.firstName,
        lastName: item.lastName,
        company: item.company
      })));
    } else {
      console.log(`⚠️ [DASHBOARD DEBUG] No speedrun data loaded`);
    }
    
    // Debug: Log sample leads and prospects data before transformation
    if (leadsData.length > 0) {
      console.log(`🔍 [DASHBOARD DEBUG] Sample leads data (before transformation):`, leadsData.slice(0, 2).map(item => ({
        id: item.id,
        fullName: item.fullName,
        firstName: item.firstName,
        lastName: item.lastName,
        name: item.name,
        company: item.company
      })));
    }
    
    if (prospectsData.length > 0) {
      console.log(`🔍 [DASHBOARD DEBUG] Sample prospects data (before transformation):`, prospectsData.slice(0, 2).map(item => ({
        id: item.id,
        fullName: item.fullName,
        firstName: item.firstName,
        lastName: item.lastName,
        name: item.name,
        company: item.company
      })));
    }
    
    // Transform data to ensure consistent field mapping
    const transformedLeads = leadsData.map(lead => ({
      ...lead,
      name: lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Name',
      // Ensure firstName and lastName are available for display logic
      firstName: lead.firstName || lead.fullName?.split(' ')[0] || 'First',
      lastName: lead.lastName || lead.fullName?.split(' ').slice(1).join(' ') || 'Last'
    }));
    
    const transformedProspects = prospectsData.map(prospect => {
      // Calculate smart action data for prospects
      const lastContactDate = prospect.lastContactDate || prospect.lastActionDate || prospect.updatedAt;
      const nextFollowUpDate = prospect.nextFollowUpDate || prospect.nextActionDate;
      
      // Determine last action based on prospect data
      let lastAction = 'Initial Contact';
      let lastActionTime = 'Never';
      
      if (lastContactDate) {
        const daysSince = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince === 0) lastActionTime = 'Today';
        else if (daysSince === 1) lastActionTime = 'Yesterday';
        else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
        else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
        else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
        
        // Determine action type based on status
        if (prospect.status === 'responded') lastAction = 'Email Response';
        else if (prospect.status === 'contacted') lastAction = 'Phone Call';
        else if (prospect.status === 'engaged') lastAction = 'Meeting Scheduled';
        else lastAction = 'Initial Outreach';
      }
      
      // Determine next action and timing
      let nextAction = 'Schedule Discovery Call';
      let nextActionTiming = 'This Week';
      
      if (nextFollowUpDate) {
        const daysUntil = Math.floor((new Date(nextFollowUpDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 0) nextActionTiming = 'Overdue';
        else if (daysUntil === 1) nextActionTiming = 'Tomorrow';
        else if (daysUntil <= 7) nextActionTiming = 'This Week';
        else if (daysUntil <= 14) nextActionTiming = 'Next Week';
        else nextActionTiming = 'Future';
      }
      
      // Determine stage based on status and engagement
      let currentStage = 'Prospect';
      if (prospect.status === 'responded') currentStage = 'Engaged';
      else if (prospect.status === 'contacted') currentStage = 'Contacted';
      else if (prospect.status === 'qualified') currentStage = 'Qualified';
      else if (prospect.status === 'opportunity') currentStage = 'Opportunity';
      
      return {
        ...prospect,
        name: prospect.fullName || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'Name',
        // Ensure firstName and lastName are available for display logic
        firstName: prospect.firstName || prospect.fullName?.split(' ')[0] || 'First',
        lastName: prospect.lastName || prospect.fullName?.split(' ').slice(1).join(' ') || 'Last',
        // Add complete action fields
        lastAction: lastAction,
        lastActionDate: lastContactDate,
        lastActionTime: lastActionTime,
        nextAction: nextAction,
        nextActionDate: nextFollowUpDate,
        nextActionTiming: nextActionTiming,
        currentStage: currentStage,
        stage: currentStage,
        // Add additional fields for table display
        state: prospect.state || prospect.city || 'State',
        jobTitle: prospect.jobTitle || prospect.title || 'Title',
        companyName: prospect.company || 'Company',
        buyerGroupRole: prospect.buyerGroupRole || 'Stakeholder'
      };
    });
    
    // Debug: Log transformed data
    if (transformedLeads.length > 0) {
      console.log(`🔍 [DASHBOARD DEBUG] Sample transformed leads data:`, transformedLeads.slice(0, 2).map(item => ({
        id: item.id,
        fullName: item.fullName,
        firstName: item.firstName,
        lastName: item.lastName,
        name: item.name,
        company: item.company
      })));
    }
    
    if (transformedProspects.length > 0) {
      console.log(`🔍 [DASHBOARD DEBUG] Sample transformed prospects data:`, transformedProspects.slice(0, 2).map(item => ({
        id: item.id,
        fullName: item.fullName,
        firstName: item.firstName,
        lastName: item.lastName,
        name: item.name,
        company: item.company
      })));
    }

    // 🚀 PERFORMANCE: Calculate real dashboard metrics from database
    console.log('📊 [DASHBOARD] Calculating real metrics from database...');
    
    // Calculate date ranges for metrics
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Calculate activity metrics from actions table
    const [weeklyActivities, monthlyActivities, ytdActivities] = await Promise.all([
      // Weekly activities
      prisma.actions.findMany({
        where: {
          workspaceId,
          userId,
          completedAt: { gte: startOfWeek },
          status: 'completed'
        },
        select: { type: true, completedAt: true }
      }),
      // Monthly activities  
      prisma.actions.findMany({
        where: {
          workspaceId,
          userId,
          completedAt: { gte: startOfMonth },
          status: 'completed'
        },
        select: { type: true, completedAt: true }
      }),
      // YTD activities
      prisma.actions.findMany({
        where: {
          workspaceId,
          userId,
          completedAt: { gte: startOfYear },
          status: 'completed'
        },
        select: { type: true, completedAt: true }
      })
    ]);

    // Calculate activity counts by type
    const calculateActivityCounts = (activities: any[]) => {
      return activities.reduce((acc, activity) => {
        const type = activity.type?.toLowerCase() || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
    };

    const weeklyActivityCounts = calculateActivityCounts(weeklyActivities);
    const monthlyActivityCounts = calculateActivityCounts(monthlyActivities);
    const ytdActivityCounts = calculateActivityCounts(ytdActivities);

    // Calculate pipeline metrics from opportunities
    const pipelineMetrics = await prisma.opportunities.aggregate({
      where: {
        workspaceId,
        assignedUserId: userId,
        deletedAt: null
      },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true
    });

    // Calculate closed won opportunities this month
    const monthlyClosedWon = await prisma.opportunities.count({
      where: {
        workspaceId,
        assignedUserId: userId,
        stage: { in: ['Closed Won', 'Won', 'Closed'] },
        actualCloseDate: { gte: startOfMonth },
        deletedAt: null
      }
    });

    // Calculate YTD closed won opportunities
    const ytdClosedWon = await prisma.opportunities.count({
      where: {
        workspaceId,
        assignedUserId: userId,
        stage: { in: ['Closed Won', 'Won', 'Closed'] },
        actualCloseDate: { gte: startOfYear },
        deletedAt: null
      }
    });

    // Calculate conversion rate (leads to opportunities)
    const conversionRate = leadsCount > 0 ? (opportunitiesCount / leadsCount) * 100 : 0;

    // Calculate average deal size
    const avgDealSize = pipelineMetrics._avg.amount || 0;

    // Calculate total pipeline value
    const totalPipelineValue = pipelineMetrics._sum.amount || 0;

    // Calculate win rate (opportunities closed won / total opportunities)
    const winRate = opportunitiesCount > 0 ? (ytdClosedWon / opportunitiesCount) * 100 : 0;

    console.log('📊 [DASHBOARD] Real metrics calculated:', {
      weeklyActivities: weeklyActivityCounts,
      monthlyActivities: monthlyActivityCounts,
      pipelineValue: totalPipelineValue,
      avgDealSize,
      conversionRate,
      winRate
    });

    // Process opportunities to extract people count from description
    const processedOpportunities = opportunitiesData.map((opp: any) => {
      let peopleCount = 0;
      
      // Extract people count from description
      if (opp.description) {
        const match = opp.description.match(/(\d+)\s+engaged\s+contact/);
        if (match) {
          peopleCount = parseInt(match[1]);
        }
      }
      
      return {
        ...opp,
        peopleCount: peopleCount
      };
    });

    return {
      success: true,
      data: {
        // Return transformed data arrays
        leads: transformedLeads,
        prospects: transformedProspects,
        opportunities: processedOpportunities,
        companies: companiesData,
        people: peopleData,
        clients: clientsData,
        partners: partnersData,
        speedrunItems: speedrunData,
        // Use actual counts from database, but limit speedrun to 50 for display
        counts: { 
          leads: leadsCount, 
          prospects: prospectsCount, 
          opportunities: opportunitiesCount, 
          companies: companiesCount, 
          people: peopleCount,
          clients: clientsCount,
          partners: partnersCount,
          speedrun: Math.min(speedrunData.length, 50) // Limit speedrun count to 50 for dashboard performance
        },
        // 🚀 REAL METRICS: Calculated from actual database data
        metrics: {
          // Weekly Performance
          weeklyCalls: weeklyActivityCounts.call || weeklyActivityCounts.phone || 0,
          weeklyEmails: weeklyActivityCounts.email || 0,
          weeklyMeetings: weeklyActivityCounts.meeting || weeklyActivityCounts.call || 0,
          weeklyLinkedins: weeklyActivityCounts.linkedin || 0,
          
          // Monthly Performance
          monthlyNewOpportunities: opportunitiesData.filter(opp => 
            new Date(opp.createdAt) >= startOfMonth
          ).length,
          monthlyPipelineValue: totalPipelineValue,
          monthlyConversionRate: conversionRate,
          monthlyDealsClosed: monthlyClosedWon,
          
          // YTD Revenue Performance
          ytdRevenue: totalPipelineValue, // Using pipeline value as revenue proxy
          ytdAvgDealSize: avgDealSize,
          ytdWinRate: winRate,
          ytdSalesCycle: 0, // Would need more complex calculation
          
          // Additional calculated metrics
          totalPipelineValue,
          avgDealSize,
          conversionRate,
          winRate
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ [DASHBOARD] Error loading dashboard data:', error);
    console.error('❌ [DASHBOARD] Error details:', error);
    throw new Error(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 🎯 ACTION PRIORITY SCORING FOR SPEEDRUN
function calculateActionPriorityScore(record: any): number {
  let actionScore = 0;
  
  // Get next action timing and urgency - using real database fields
  const nextActionDate = record.nextActionDate || record.nextFollowUpDate || record.nextActivityDate;
  const lastContactDate = record.lastContactDate || record.lastActionDate || record.lastActivityDate || record.updatedAt;
  
  // Calculate days since last contact
  const daysSinceLastContact = lastContactDate 
    ? Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Calculate days until next action
  const daysUntilNextAction = nextActionDate 
    ? Math.floor((new Date(nextActionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // === ACTION-BASED SCORING ===
  // Overdue actions get highest priority
  if (daysUntilNextAction < 0) {
    actionScore = Math.abs(daysUntilNextAction) * 100; // More overdue = higher score
  }
  // Actions due today get high priority
  else if (daysUntilNextAction === 0) {
    actionScore = 200;
  }
  // Actions due tomorrow get medium-high priority
  else if (daysUntilNextAction === 1) {
    actionScore = 150;
  }
  // Actions due this week get medium priority
  else if (daysUntilNextAction <= 7) {
    actionScore = 100 - (daysUntilNextAction * 10);
  }
  // No next action set - use last contact timing
  else if (!nextActionDate) {
    if (daysSinceLastContact >= 30) actionScore = 80; // Haven't contacted in 30+ days
    else if (daysSinceLastContact >= 14) actionScore = 60; // Haven't contacted in 2+ weeks
    else if (daysSinceLastContact >= 7) actionScore = 40; // Haven't contacted in 1+ week
    else actionScore = 20; // Recently contacted
  }
  
  // === COMPANY/PERSON IMPORTANCE BOOST ===
  // Company size boost
  const companySize = record.companySize || 0;
  if (companySize >= 1000) actionScore += 50;
  else if (companySize >= 500) actionScore += 30;
  else if (companySize >= 100) actionScore += 20;
  
  // Role importance boost
  const buyerGroupRole = record.buyerGroupRole || record.role || '';
  if (buyerGroupRole === 'Decision Maker') actionScore += 100;
  else if (buyerGroupRole === 'Champion') actionScore += 75;
  else if (buyerGroupRole === 'Stakeholder') actionScore += 50;
  
  // Priority boost
  const priority = record.priority?.toLowerCase() || '';
  if (priority === 'urgent') actionScore += 80;
  else if (priority === 'high') actionScore += 50;
  else if (priority === 'medium') actionScore += 25;
  
  // Status boost
  const status = record.status?.toLowerCase() || '';
  if (status === 'responded' || status === 'engaged') actionScore += 60;
  else if (status === 'contacted') actionScore += 30;
  else if (status === 'new' || status === 'uncontacted') actionScore += 20;
  
  return actionScore;
}

// 🚀 PERFORMANCE: Speedrun data cache
const speedrunCache = new Map<string, { data: any; timestamp: number }>();
const SPEEDRUN_CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

// 🚀 SPEEDRUN DATA LOADING
async function loadSpeedrunData(workspaceId: string, userId: string): Promise<any> {
  try {
    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `speedrun:${workspaceId}:${userId}`;
    const cached = speedrunCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < SPEEDRUN_CACHE_TTL) {
      console.log('⚡ [SPEEDRUN] Cache hit for workspace:', workspaceId);
      return cached.data;
    }

    console.log(`🚀 [SPEEDRUN] Loading speedrun data for workspace: ${workspaceId}, user: ${userId}`);
    
    // 🚀 SIMPLIFIED: Load prospects for speedrun with basic query
    const prospects = await prisma.prospects.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    console.log(`📊 [SPEEDRUN] Loaded ${prospects.length} prospects from prospects table`);
    
    // If no prospects, fallback to people table
    let speedrunData = prospects;
    let dataSource = 'prospects';
    
    if (prospects.length === 0) {
      console.log(`🔄 [SPEEDRUN] No prospects found, trying people table...`);
      const people = await prisma.people.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          status: 'active'
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      speedrunData = people;
      dataSource = 'people';
      console.log(`📊 [SPEEDRUN] Loaded ${people.length} people as fallback`);
    }
    
    // Transform data to speedrun format with complete field mapping
    const speedrunItems = speedrunData.map((record, index) => {
      // Calculate smart action data based on record status and dates
      const lastContactDate = record.lastContactDate || record.lastActionDate || record.updatedAt;
      const nextFollowUpDate = record.nextFollowUpDate || record.nextActionDate;
      
      // Determine last action based on record data
      let lastAction = 'Initial Contact';
      let lastActionTime = 'Never';
      
      if (lastContactDate) {
        const daysSince = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince === 0) lastActionTime = 'Today';
        else if (daysSince === 1) lastActionTime = 'Yesterday';
        else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
        else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
        else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
        
        // Determine action type based on status
        if (record.status === 'responded') lastAction = 'Email Response';
        else if (record.status === 'contacted') lastAction = 'Phone Call';
        else if (record.status === 'engaged') lastAction = 'Meeting Scheduled';
        else lastAction = 'Initial Outreach';
      }
      
      // Determine next action and timing
      let nextAction = 'Schedule Discovery Call';
      let nextActionTiming = 'This Week';
      
      if (nextFollowUpDate) {
        const daysUntil = Math.floor((new Date(nextFollowUpDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 0) nextActionTiming = 'Overdue';
        else if (daysUntil === 1) nextActionTiming = 'Tomorrow';
        else if (daysUntil <= 7) nextActionTiming = 'This Week';
        else if (daysUntil <= 14) nextActionTiming = 'Next Week';
        else nextActionTiming = 'Future';
      }
      
      // Determine stage based on status and engagement
      let currentStage = 'Prospect';
      if (record.status === 'responded') currentStage = 'Engaged';
      else if (record.status === 'contacted') currentStage = 'Contacted';
      else if (record.status === 'qualified') currentStage = 'Qualified';
      else if (record.status === 'opportunity') currentStage = 'Opportunity';
      
      return {
        id: record.id,
        // Handle both prospects and people data structures
        name: record.fullName || record.displayName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Name',
        fullName: record.fullName || record.displayName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Name',
        firstName: record.firstName || 'First',
        lastName: record.lastName || 'Last',
        email: record.email || record.workEmail,
        phone: record.phone || record.workPhone || record.mobilePhone,
        title: record.jobTitle || record.title || 'Title',
        company: record.company || record.company?.name || 'Company',
        location: record.city || record.state || record.country,
        status: record.status || 'new',
        priority: record.priority || 'high',
        source: dataSource,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        // Add ranking for speedrun
        rank: index + 1,
        // Add complete action fields
        lastAction: lastAction,
        lastActionDate: lastContactDate,
        lastActionTime: lastActionTime,
        nextAction: nextAction,
        nextActionDate: nextFollowUpDate,
        nextActionTiming: nextActionTiming,
        buyerGroupRole: record.buyerGroupRole || 'Stakeholder',
        currentStage: currentStage,
        // Add additional fields for table display
        stage: currentStage,
        state: record.state || record.city || 'State',
        jobTitle: record.jobTitle || record.title || 'Title',
        companyName: record.company || record.company?.name || 'Company'
      };
    });
    
    console.log(`🏆 [SPEEDRUN] Transformed ${speedrunItems.length} speedrun items from ${dataSource}`);
    
    const result = {
      success: true,
      data: {
        speedrunItems,
        counts: {
          speedrun: speedrunItems.length
        }
      }
    };

    // 🚀 PERFORMANCE: Cache the result
    speedrunCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('❌ [SPEEDRUN] Error loading speedrun data:', error);
    return {
      success: false,
      error: error.message,
      data: {
        speedrunItems: [],
        counts: {
          speedrun: 0
        }
      }
    };
  }
}

// 🚀 MAIN API HANDLERS

// 🚀 MAIN API HANDLERS
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const context = await getOptimizedWorkspaceContext(request);
    const { workspaceId, userId } = context;
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'dashboard';
    const action = url.searchParams.get('action') || 'get';
    const id = url.searchParams.get('id') || undefined;
    
    // Parse filters and pagination
    const filters = url.searchParams.get('filters') ? JSON.parse(url.searchParams.get('filters')!) : undefined;
    const pagination = url.searchParams.get('pagination') ? JSON.parse(url.searchParams.get('pagination')!) : undefined;
    const search = url.searchParams.get('search') ? JSON.parse(url.searchParams.get('search')!) : undefined;
    
    // Validate request
    if (!SUPPORTED_TYPES.includes(type as any)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported type: ${type}. Supported types: ${SUPPORTED_TYPES.join(', ')}`
      }, { status: 400 });
    }
    
    if (!SUPPORTED_ACTIONS.includes(action as any)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported action: ${action}. Supported actions: ${SUPPORTED_ACTIONS.join(', ')}`
      }, { status: 400 });
    }
    
    // Check cache first
    const cacheKey = `unified-${type}-${action}-${workspaceId}-${userId}-${id || 'list'}-${JSON.stringify(filters || {})}-${JSON.stringify(pagination || {})}`;
    const memoryCached = unifiedDataMemoryCache.get(cacheKey);
    
    if (memoryCached && Date.now() - memoryCached.timestamp < UNIFIED_DATA_TTL * 1000) {
      console.log(`⚡ [CACHE HIT] ${cacheKey}`);
      return NextResponse.json({
        ...memoryCached.data,
        meta: {
          ...memoryCached.data.meta,
          cacheHit: true,
          responseTime: Date.now() - startTime
        }
      });
    }
    
    // Handle request deduplication
    const existingRequest = pendingRequests.get(cacheKey);
    if (existingRequest) {
      console.log(`⚡ [DEDUP] Waiting for existing request: ${cacheKey}`);
      const result = await existingRequest;
      return NextResponse.json({
        ...result,
        meta: {
          ...result.meta,
          responseTime: Date.now() - startTime
        }
      });
    }
    
    // Execute operation
    const requestPromise = handleDataOperation(type, action, workspaceId, userId, undefined, id, filters, pagination, search);
    pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      
      // Add metadata
      const response = {
        ...result,
        meta: {
          timestamp: new Date().toISOString(),
          cacheHit: false,
          responseTime: Date.now() - startTime
        }
      };
      
      // Cache the result
      unifiedDataMemoryCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      console.log(`✅ [SUCCESS] ${action.toUpperCase()} ${type} completed in ${response.meta.responseTime}ms`);
      
      return NextResponse.json(response);
      
    } finally {
      pendingRequests.delete(cacheKey);
    }
    
  } catch (error) {
    console.error('❌ [UNIFIED API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      meta: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        responseTime: Date.now() - startTime
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: UnifiedDataRequest = await request.json();
    const { type, action, data, id, filters, pagination, search } = body;
    
    const context = await getOptimizedWorkspaceContext(request, body);
    const { workspaceId, userId } = context;
    
    // Validate request
    if (!type || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type and action'
      }, { status: 400 });
    }
    
    if (!SUPPORTED_TYPES.includes(type)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported type: ${type}. Supported types: ${SUPPORTED_TYPES.join(', ')}`
      }, { status: 400 });
    }
    
    if (!SUPPORTED_ACTIONS.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Unsupported action: ${action}. Supported actions: ${SUPPORTED_ACTIONS.join(', ')}`
      }, { status: 400 });
    }
    
    // Execute operation
    const result = await handleDataOperation(type, action, workspaceId, userId, data, id, filters, pagination, search);
    
    // Add metadata
    const response = {
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        responseTime: Date.now() - startTime
      }
    };
    
    console.log(`✅ [SUCCESS] ${action.toUpperCase()} ${type} completed in ${response.meta.responseTime}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [UNIFIED API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      meta: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        responseTime: Date.now() - startTime
      }
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: UnifiedDataRequest = await request.json();
    const context = await getOptimizedWorkspaceContext(request, body);
    const { workspaceId, userId } = context;
    const { type, action, data, id } = body;
    
    if (!type || !id || !data) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, id, and data'
      }, { status: 400 });
    }
    
    // Execute update operation
    const result = await handleDataOperation(type, 'update', workspaceId, userId, data, id);
    
    // Add metadata
    const response = {
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        responseTime: Date.now() - startTime
      }
    };
    
    console.log(`✅ [SUCCESS] UPDATE ${type} (${id}) completed in ${response.meta.responseTime}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [UNIFIED API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      meta: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        responseTime: Date.now() - startTime
      }
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const context = await getOptimizedWorkspaceContext(request);
    const { workspaceId, userId } = context;
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');
    
    if (!type || !id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: type and id'
      }, { status: 400 });
    }
    
    // Execute delete operation
    const result = await handleDataOperation(type, 'delete', workspaceId, userId, undefined, id);
    
    // Add metadata
    const response = {
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        responseTime: Date.now() - startTime
      }
    };
    
    console.log(`✅ [SUCCESS] DELETE ${type} (${id}) completed in ${response.meta.responseTime}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [UNIFIED API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      meta: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        responseTime: Date.now() - startTime
      }
    }, { status: 500 });
  }
}
