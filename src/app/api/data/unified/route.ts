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
const DASHBOARD_TTL = 300; // 5 minutes for dashboard data

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
        customers: [],
        partnerships: [],
        sellers: [],
        speedrunItems: [],
        counts: {
          leads: 0,
          prospects: 0,
          opportunities: 0,
          companies: 0,
          people: 0,
          customers: 0,
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

    const [leads, prospects, opportunities, companies, people, buyerGroups, workspaceUsers, partnerships] = await Promise.all([
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
        customers: [],
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
          customers: 0,
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
      firstName: person.name.split(' ')[0] || 'Unknown',
      lastName: person.name.split(' ').slice(1).join(' ') || 'Person',
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
        firstName: person.name.split(' ')[0] || 'Unknown',
        lastName: person.name.split(' ').slice(1).join(' ') || 'Person',
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
      customers: [], // No customers yet
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
        customers: 0,
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
      customers: [],
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
        customers: 0,
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
  type: 'leads' | 'prospects' | 'opportunities' | 'companies' | 'people' | 'customers' | 'partners' | 'speedrun' | 'dashboard' | 'search';
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
  'people', 'customers', 'partners', 'sellers', 'notes', 'activities', 'speedrun', 'dashboard', 'search'
] as const;

const SUPPORTED_ACTIONS = ['get', 'create', 'update', 'delete', 'search', 'advance_to_prospect'] as const;

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
    
    if (!workspaceId || !userId) {
      throw new Error('Missing workspaceId and userId');
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
  if (['leads', 'prospects', 'opportunities', 'companies', 'people', 'customers', 'partners'].includes(type)) {
    whereClause['deletedAt'] = null;
  }
  
  const record = await model.findFirst({
    where: whereClause,
    ...includeClause
  });
  
  if (!record) {
    throw new Error(`${type} not found`);
  }
  
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
            customers: demoData.customers,
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
      case 'customers':
        return { success: true, data: demoData.customers };
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
  
  // Special handling for people - show only direct people records (not aggregated)
  if (type === 'people') {
    const people = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        assignedUserId: userId
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
      orderBy: [{ updatedAt: 'desc' }]
    });
    
    return { success: true, data: people };
  }
  
  const model = getPrismaModel(type);
  if (!model) throw new Error(`Unsupported type: ${type}`);
  
  const whereClause: any = {
    workspaceId
  };
  
  // Only add deletedAt filter for models that have this field
  if (['leads', 'prospects', 'opportunities', 'companies', 'people', 'customers', 'partners'].includes(type)) {
    whereClause['deletedAt'] = null;
  }
  
  // Add user assignment filter for most types
  if (['leads', 'prospects', 'opportunities', 'people', 'companies'].includes(type)) {
    whereClause['assignedUserId'] = userId;
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
    const buyerGroups = await (prisma as any).buyer_groups.findMany({
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
  // Special handling for customers - need to create both account and customer records
  if (type === 'customers') {
    return await handleCustomerCreate(workspaceId, userId, data);
  }
  
  const model = getPrismaModel(type);
  if (!model) throw new Error(`Unsupported type: ${type}`);
  
  // Add workspace and user context
  const createData = {
    ...data,
    workspaceId,
    assignedUserId: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

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

  // Handle special field requirements for leads, prospects, partners, and customers
  if (type === 'leads' || type === 'prospects' || type === 'partners' || type === 'customers') {
    // If name is provided but firstName/lastName are not, split the name
    if (createData['name'] && !createData['firstName'] && !createData.lastName) {
      const nameParts = createData.name.trim().split(' ');
      createData['firstName'] = nameParts[0] || '';
      createData['lastName'] = nameParts.slice(1).join(' ') || '';
      createData['fullName'] = createData.name;
    }
    
    // Map frontend fields to database fields - standardize on 'title'
    if (createData['jobTitle'] && !createData.title) {
      createData['title'] = createData.jobTitle;
    }
    // Remove jobTitle since we're standardizing on title
    delete createData.jobTitle;
    
    // Ensure required fields have defaults - these are required by the schema
    if (!createData.firstName) createData['firstName'] = 'Unknown';
    if (!createData.lastName) createData['lastName'] = 'Person';
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

// Special function to handle customer creation (account + customer records)
async function handleCustomerCreate(workspaceId: string, userId: string, data: any): Promise<any> {
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

    // Then create the customer record
    const customer = await prisma.customers.create({
      data: {
        id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId,
        accountId: account.id,
        customerSince: new Date(),
        customerStatus: 'active',
        contractValue: data.contractValue ? parseFloat(data.contractValue) : 0,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        totalLifetimeValue: data.contractValue ? parseFloat(data.contractValue) : 0,
        updatedAt: new Date()
      }
    });

    // Log contact IDs for future relationship creation
    if (data['contactIds'] && data.contactIds.length > 0) {
      console.log('📝 [UNIFIED API] Contact IDs to associate with customer:', data.contactIds);
      // TODO: Implement contact-customer relationship creation
    }

    // Clear cache after create
    clearWorkspaceCache(workspaceId, userId, true);

    return { 
      success: true, 
      data: { 
        ...customer, 
        accountName: account.name, 
        accountWebsite: account.website 
      } 
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    const record = await model.update({
      where: { id },
      data: updateData
    });
    
    // Log activities for field changes
    await logFieldChanges(type, id, currentRecord, data, userId, workspaceId);
    
    console.log(`✅ [UPDATE] Successfully updated ${type} ${id}`);
    
    // Clear cache after update
    clearWorkspaceCache(workspaceId, userId, true);
    
    return { success: true, data: record };
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
    let buyerGroup = await (prisma as any).buyer_groups.findFirst({
      where: {
        workspaceId,
        name: { contains: lead.company }
      }
    });
    
    if (!buyerGroup) {
      buyerGroup = await (prisma as any).buyer_groups.create({
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
    await (prisma as any).buyerGroupToPerson.create({
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
        await (prisma as any).buyerGroupToPerson.create({
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
    customers: prisma.customers,
    partners: prisma.partners,
    sellers: prisma.workspace_users, // 🆕 FIX: Add sellers support
    notes: prisma.notes,
    activities: prisma.activities
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
          customers: demoData.customers,
          partners: demoData.partnerships,
          speedrunItems: demoData.speedrunItems,
          counts: demoData.counts,
          totalPipelineValue: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Load both counts and actual data
    const [
      leadsCount,
      prospectsCount,
      opportunitiesCount,
      companiesCount,
      peopleCount,
      customersCount,
      partnersCount,
      speedrunCount,
      leadsData,
      prospectsData,
      opportunitiesData,
      companiesData,
      peopleData,
      customersData,
      partnersData,
      speedrunData
    ] = await Promise.all([
      prisma.leads.count({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId }
      }),
      prisma.prospects.count({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId }
      }),
      prisma.opportunities.count({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId }
      }),
      prisma.companies.count({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId }
      }),
      prisma.people.count({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId }
      }),
      prisma.customers.count({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId }
      }),
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
      // Load actual data
      prisma.leads.findMany({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000
      }),
      prisma.prospects.findMany({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000
      }),
      prisma.opportunities.findMany({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000
      }),
      prisma.companies.findMany({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000
      }),
      prisma.people.findMany({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000
      }),
      prisma.customers.findMany({ 
        where: { workspaceId, deletedAt: null, assignedUserId: userId },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000
      }),
      prisma.partners.findMany({ 
        where: { workspaceId, deletedAt: null },
        orderBy: [{ updatedAt: 'desc' }],
        take: 1000
      }).catch(() => []), // Fallback to empty array if partners table has issues
      // Load speedrun data - combine leads and prospects for speedrun
      Promise.all([
        prisma.leads.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            assignedUserId: userId,
            status: {
              in: ["new", "contacted", "qualified", "follow-up", "demo-scheduled"]
            }
          },
          orderBy: [{ updatedAt: 'desc' }],
          take: 100
        }),
        prisma.prospects.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            assignedUserId: userId,
            status: {
              in: ["new", "contacted", "qualified", "follow-up", "demo-scheduled"]
            }
          },
          orderBy: [{ updatedAt: 'desc' }],
          take: 100
        })
      ]).then(([leads, prospects]) => [...leads, ...prospects])
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
      name: lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown',
      // Ensure firstName and lastName are available for display logic
      firstName: lead.firstName || lead.fullName?.split(' ')[0] || 'Unknown',
      lastName: lead.lastName || lead.fullName?.split(' ').slice(1).join(' ') || 'Person'
    }));
    
    const transformedProspects = prospectsData.map(prospect => ({
      ...prospect,
      name: prospect.fullName || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'Unknown',
      // Ensure firstName and lastName are available for display logic
      firstName: prospect.firstName || prospect.fullName?.split(' ')[0] || 'Unknown',
      lastName: prospect.lastName || prospect.fullName?.split(' ').slice(1).join(' ') || 'Person'
    }));
    
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

    return {
      success: true,
      data: {
        // Return transformed data arrays
        leads: transformedLeads,
        prospects: transformedProspects,
        opportunities: opportunitiesData,
        companies: companiesData,
        people: peopleData,
        customers: customersData,
        partners: partnersData,
        speedrunItems: speedrunData,
        // Use actual counts from database
        counts: { 
          leads: leadsCount, 
          prospects: prospectsCount, 
          opportunities: opportunitiesCount, 
          companies: companiesCount, 
          people: peopleCount,
          customers: customersCount,
          partners: partnersCount,
          speedrun: speedrunCount
        },
        totalPipelineValue: 0,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ [DASHBOARD] Error loading dashboard data:', error);
    console.error('❌ [DASHBOARD] Error details:', error);
    throw new Error(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 🚀 SPEEDRUN DATA LOADING
async function loadSpeedrunData(workspaceId: string, userId: string): Promise<any> {
  try {
    console.log(`🚀 [SPEEDRUN] Loading speedrun data for workspace: ${workspaceId}, user: ${userId}`);
    
    // Load leads, prospects, and opportunities for speedrun
    const [leads, prospects, opportunities] = await Promise.all([
      // Load leads
      prisma.leads.findMany({
        where: {
          workspaceId,
          ...(workspaceId !== 'demo-workspace-2025' && workspaceId !== 'zeropoint-demo-2025' && { assignedUserId: userId }), // Skip user filter for demo
          deletedAt: null,
          status: {
            in: ["new", "contacted", "qualified", "follow-up", "demo-scheduled"]
          }
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          jobTitle: true, // 🆕 FIX: Use correct field name
          industry: true,
          status: true,
          priority: true,
          notes: true,
          tags: true,
          source: true,
          createdAt: true,
          updatedAt: true,
          assignedUserId: true,
          workspaceId: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 100
      }),
      
      // Load prospects
      prisma.prospects.findMany({
        where: {
          workspaceId,
          ...(workspaceId !== 'demo-workspace-2025' && workspaceId !== 'zeropoint-demo-2025' && { assignedUserId: userId }), // Skip user filter for demo
          deletedAt: null,
          status: {
            in: ["new", "contacted", "qualified", "follow-up", "demo-scheduled"]
          }
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          title: true,
          industry: true,
          status: true,
          priority: true,
          notes: true,
          tags: true,
          source: true,
          createdAt: true,
          updatedAt: true,
          assignedUserId: true,
          workspaceId: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 100
      }),
      
      // Load opportunities (only open ones)
      prisma.opportunities.findMany({
        where: {
          workspaceId,
          ...(workspaceId !== 'demo-workspace-2025' && workspaceId !== 'zeropoint-demo-2025' && { assignedUserId: userId }), // Skip user filter for demo
          deletedAt: null,
          stage: {
            notIn: ["closed", "won", "lost"]
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          amount: true,
          stage: true,
          priority: true,
          notes: true,
          tags: true,
          source: true,
          createdAt: true,
          updatedAt: true,
          assignedUserId: true,
          workspaceId: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 100
      })
    ]);
    
    // Combine all data sources
    const allRecords = [...leads, ...prospects, ...opportunities];
    
    // Transform leads to speedrun format
    const leadItems = leads.map(lead => ({
      id: lead.id,
      name: lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown',
      fullName: lead.fullName,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || 'Unknown Company',
      companyName: lead.company,
      title: lead.jobTitle || 'Unknown Title', // 🆕 FIX: Use jobTitle field
      jobTitle: lead.jobTitle,
      industry: lead.industry || '',
      status: lead.status || 'active',
      stage: 'initial',
      priority: lead.priority || 'medium',
      lastContact: lead.updatedAt,
      notes: lead.notes || '',
      tags: lead.tags || [],
      source: lead.source || 'speedrun',
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      assignedUser: lead.assignedUserId,
      workspaceId: lead.workspaceId,
      // Add speedrun-specific fields
      enrichmentScore: 0,
      buyerGroupRole: 'unknown',
      currentStage: 'initial',
      nextAction: '',
      nextActionDate: '',
      location: '',
      phoneNumber: lead.phone
    }));
    
    // Transform prospects to speedrun format
    const prospectItems = prospects.map(prospect => ({
      id: prospect.id,
      name: prospect.fullName || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'Unknown',
      fullName: prospect.fullName,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email || '',
      phone: prospect.phone || '',
      company: prospect.company || 'Unknown Company',
      companyName: prospect.company,
      title: prospect.title || 'Unknown Title',
      jobTitle: prospect.title,
      industry: prospect.industry || '',
      status: prospect.status || 'active',
      stage: 'initial',
      priority: prospect.priority || 'medium',
      lastContact: prospect.updatedAt,
      notes: prospect.notes || '',
      tags: prospect.tags || [],
      source: prospect.source || 'speedrun',
      createdAt: prospect.createdAt,
      updatedAt: prospect.updatedAt,
      assignedUser: prospect.assignedUserId,
      workspaceId: prospect.workspaceId,
      // Add speedrun-specific fields
      enrichmentScore: 0,
      buyerGroupRole: 'unknown',
      currentStage: 'initial',
      nextAction: '',
      nextActionDate: '',
      location: '',
      phoneNumber: prospect.phone
    }));
    
    // Transform opportunities to speedrun format
    const opportunityItems = opportunities.map(opportunity => ({
      id: opportunity.id,
      name: opportunity.name || 'Unknown Opportunity',
      fullName: opportunity.name,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: 'Opportunity',
      companyName: 'Opportunity',
      title: 'Opportunity',
      jobTitle: 'Opportunity',
      industry: '',
      status: 'opportunity',
      stage: opportunity.stage || 'initial',
      priority: opportunity.priority || 'medium',
      lastContact: opportunity.updatedAt,
      notes: opportunity.notes || '',
      tags: opportunity.tags || [],
      source: opportunity.source || 'speedrun',
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      assignedUser: opportunity.assignedUserId,
      workspaceId: opportunity.workspaceId,
      // Add speedrun-specific fields
      enrichmentScore: 0,
      buyerGroupRole: 'unknown',
      currentStage: opportunity.stage || 'initial',
      nextAction: '',
      nextActionDate: '',
      location: '',
      phoneNumber: ''
    }));
    
    // Combine all items
    const speedrunItems = [...leadItems, ...prospectItems, ...opportunityItems];
    
    console.log(`✅ [SPEEDRUN] Loaded ${speedrunItems.length} speedrun items (${leads.length} leads, ${prospects.length} prospects, ${opportunities.length} opportunities)`);
    
    // Debug: Log sample data to verify names are being loaded correctly
    if (speedrunItems.length > 0) {
      console.log(`🔍 [SPEEDRUN DEBUG] Sample speedrun items:`, speedrunItems.slice(0, 3).map(item => ({
        id: item.id,
        name: item.name,
        fullName: item.fullName,
        firstName: item.firstName,
        lastName: item.lastName,
        company: item.company
      })));
    } else {
      console.log(`⚠️ [SPEEDRUN DEBUG] No speedrun items loaded - checking raw data:`, {
        leadsCount: leads.length,
        prospectsCount: prospects.length,
        opportunitiesCount: opportunities.length,
        sampleLead: leads[0] ? {
          id: leads[0].id,
          fullName: leads[0].fullName,
          firstName: leads[0].firstName,
          lastName: leads[0].lastName
        } : null,
        sampleProspect: prospects[0] ? {
          id: prospects[0].id,
          fullName: prospects[0].fullName,
          firstName: prospects[0].firstName,
          lastName: prospects[0].lastName
        } : null
      });
    }
    
    return {
      success: true,
      data: speedrunItems // 🆕 FIX: Return the array directly
    };
  } catch (error) {
    console.error('❌ [SPEEDRUN] Error loading speedrun data:', error);
    // Return empty data instead of throwing error to prevent dashboard failure
    return {
      success: true,
      data: {
        speedrunItems: [],
        counts: {
          speedrunItems: 0,
          leads: 0,
          prospects: 0,
          opportunities: 0
        },
        timestamp: new Date().toISOString()
      }
    };
  }
}

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
