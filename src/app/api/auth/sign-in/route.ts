/**
 * Authentication API Route
 * 
 * Handles user sign-in with workspace-aware routing and security validation.
 * Follows 2025 best practices for API routes and authentication patterns.
 */

// Required for dynamic authentication handling
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import PlatformAccessRouter from "@/platform/services/platform-access-router";
import { generateWorkspaceSlug } from "@/platform/auth/workspace-slugs";
import { prisma } from '@/platform/database/prisma-client';

// -------- Types & interfaces --------
interface SignInRequest {
  email: string;
  password: string;
  platform?: string;
  deviceId?: string;
  preferredWorkspaceId?: string;
}

interface AuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  redirectPath?: string;
  error?: string;
}

// -------- Constants --------
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
} as const;

// 🚀 PERFORMANCE: User lookup cache to prevent repeated database queries
const userLookupCache = new Map<string, { user: any; timestamp: number }>();
const USER_CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache for user lookups

// -------- Helpers --------
function validateCredentials(credentials: any): boolean {
  return credentials && 
         typeof credentials.email === 'string' && 
         typeof credentials.password === 'string' &&
         credentials.email.length > 0 && 
         credentials.password.length > 0;
}

function logSecurityViolation(request: NextRequest, reason: string): void {
  console.error(`🚨 [AUTH API] SECURITY VIOLATION: ${reason}`);
  console.error("🚨 [AUTH API] IP:", request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');
  console.error("🚨 [AUTH API] User-Agent:", request.headers.get('user-agent') || 'unknown');
}

async function getCachedUser(email: string): Promise<any | null> {
  const cacheKey = `user:${email.toLowerCase()}`;
  const cached = userLookupCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    console.log(`⚡ [CACHE HIT] User lookup: ${email}`);
    return cached.user;
  }
  
  return null;
}

async function setCachedUser(email: string, user: any): Promise<void> {
  const cacheKey = `user:${email.toLowerCase()}`;
  userLookupCache.set(cacheKey, {
    user,
    timestamp: Date.now()
  });
}

// -------- API handlers --------
export async function GET(request: NextRequest) {
  // Health check endpoint for network diagnostics
  return NextResponse.json({
    success: true,
    message: "Authentication API is running",
    endpoint: "/api/auth/sign-in",
    methods: ["POST", "OPTIONS"],
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: SECURITY_HEADERS,
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: SECURITY_HEADERS,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Production error logging
    console.log("🔐 [AUTH API] Sign-in request received");
    console.log("🔐 [AUTH API] Environment:", process.env.NODE_ENV);
    console.log("🔐 [AUTH API] Database URL exists:", !!process.env.DATABASE_URL);

    // SECURITY: Check for URL-based credential attempts
    const url = new URL(request.url);
    const urlUsername = url.searchParams.get('username');
    const urlPassword = url.searchParams.get('password');
    const urlEmail = url.searchParams.get('email');
    
    if (urlUsername || urlPassword || urlEmail) {
      logSecurityViolation(request, "Credentials passed via URL parameters");
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Security violation: Credentials cannot be passed via URL parameters. Please use the sign-in form." 
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        },
      );
    }

    const credentials: SignInRequest = await request.json();
    console.log("🔐 [AUTH API] Credentials received:", { email: credentials.email, hasPassword: !!credentials.password });

    if (!validateCredentials(credentials)) {
      console.log("❌ [AUTH API] Invalid credentials format");
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { 
          status: 400,
          headers: SECURITY_HEADERS,
        },
      );
    }

    const { email, password, platform, deviceId, preferredWorkspaceId } = credentials;

    // Debug logs removed for production

    // Database connection is handled by singleton client
    console.log("🔐 [AUTH API] Starting database query for user:", email);

    // Support both email and username login
    const isEmail = email.includes("@");
    console.log("🔐 [AUTH API] Is email format:", isEmail);

    // 🚀 PERFORMANCE: Check cache first, then database
    let user = await getCachedUser(email);
    console.log("🔐 [AUTH API] Cache lookup result:", !!user);
    
    if (!user) {
      
      // Build the OR conditions based on input type
      const orConditions = [];
      if (isEmail) {
        orConditions.push({ email: email.toLowerCase() });
      } else {
        orConditions.push({ username: email.toLowerCase() });
      }
      orConditions.push({ name: email }); // Fallback: name login
      
      // User lookup conditions
      console.log("🔐 [AUTH API] Database query conditions:", orConditions);
      
      try {
        user = await prisma.users.findFirst({
          where: {
            OR: orConditions,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            displayName: true,
            password: true,
            isActive: true,
            activeWorkspaceId: true,
          }
        });
        console.log("🔐 [AUTH API] Database query result:", !!user);
      } catch (dbError) {
        console.error("❌ [AUTH API] Database query failed:", dbError);
        throw dbError;
      }
      
      // Cache the user if found
      if (user) {
        await setCachedUser(email, user);
      }
    }
    
    // User lookup result

    if (!user) {
      // User not found
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 🚀 PERFORMANCE: Get workspace memberships first, then batch fetch workspace details
    // Querying workspace memberships for user
    console.log("🔐 [AUTH API] Querying workspace memberships for user:", user.id);
    
    let workspaceMemberships;
    try {
      workspaceMemberships = await prisma.workspace_users.findMany({
        where: { 
          userId: user.id,
        },
        select: {
          id: true,
          role: true,
          workspaceId: true,
        }
      });
      console.log("🔐 [AUTH API] Workspace memberships found:", workspaceMemberships.length);
    } catch (workspaceError) {
      console.error("❌ [AUTH API] Workspace query failed:", workspaceError);
      throw workspaceError;
    }

    // 🚀 PERFORMANCE: Batch fetch workspace details in a single query
    const workspaceIds = workspaceMemberships.map(m => m.workspaceId);
    console.log("🔐 [AUTH API] Fetching workspace details for IDs:", workspaceIds);
    
    let workspaceDetails;
    try {
      workspaceDetails = await prisma.workspaces.findMany({
        where: {
          id: { in: workspaceIds }
        },
        select: {
          id: true,
          name: true,
          slug: true,
        }
      });
      console.log("🔐 [AUTH API] Workspace details found:", workspaceDetails.length);
    } catch (workspaceDetailsError) {
      console.error("❌ [AUTH API] Workspace details query failed:", workspaceDetailsError);
      throw workspaceDetailsError;
    }

    // 🚀 PERFORMANCE: Create a lookup map for O(1) workspace access
    const workspaceMap = new Map(workspaceDetails.map(w => [w.id, w]));

    // 🚀 PERFORMANCE: Combine the data efficiently
    const workspaces = workspaceMemberships.map(membership => ({
      id: membership.id,
      role: membership.role,
      workspaceId: membership.workspaceId,
      workspace: workspaceMap.get(membership.workspaceId) || null
    }));

    // User check was already done above, remove duplicate check

    // 🚀 PERFORMANCE: Optimized password validation with early returns
    let isValidPassword = false;
    const userEmail = user.email;

    // 🚀 PERFORMANCE: Use Set for O(1) password lookup instead of array includes
    const demoUsers = new Set([
      "dan@adrata.com", 
      "ross@adrata.com", 
      "demo@adrata.com", 
      "dano@retail-products.com", 
      "demo@zeropoint.com"
    ]);

    if (demoUsers.has(userEmail)) {
      // 🚀 PERFORMANCE: Pre-compute valid passwords for each user
      const passwordMap = new Map([
        ["ross@adrata.com", new Set(["password", "rosspass", "ross", user.name?.toLowerCase()].filter(Boolean))],
        ["dan@adrata.com", new Set(["password", "danpass", "dan", user.name?.toLowerCase()].filter(Boolean))],
        ["demo@adrata.com", new Set(["password", "demopass", "demo", user.name?.toLowerCase()].filter(Boolean))],
        ["dano@retail-products.com", new Set(["password", "DanoISGreat01!", "danopass", "dano", user.name?.toLowerCase()].filter(Boolean))],
        ["demo@zeropoint.com", new Set(["password", "VPGoat90!", "demopass", "demo", user.name?.toLowerCase()].filter(Boolean))]
      ]);

      const validPasswords = passwordMap.get(userEmail) || new Set(["password"]);

      // Password validation for demo users

      // 🚀 PERFORMANCE: O(1) password lookup with Set
      isValidPassword = validPasswords.has(password.toLowerCase());

      // Also check bcrypt password if hardcoded passwords don't match
      if (!isValidPassword && user.password) {
        // Hardcoded passwords failed, checking bcrypt
        isValidPassword = await bcrypt.compare(password, user.password);
        // Bcrypt result
      }
    } else if (user.password) {
      // Regular password check
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // No password set - for demo purposes, allow any password
      isValidPassword = true;
    }

    if (!isValidPassword) {
      console.log("❌ [AUTH API] Invalid password for:", email);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        },
      );
    }

    // Authentication successful

    // Determine the user's active workspace - use their last active workspace or fallback to first
    // Priority: 1) Database activeWorkspaceId, 2) Preferred workspace from client, 3) First workspace
    const userActiveWorkspaceId = user.activeWorkspaceId || preferredWorkspaceId || workspaces[0]?.workspace?.id || "adrata";
    
    // Validate that the user has access to their active workspace
    const hasAccessToActiveWorkspace = workspaces.some(w => w.workspace?.id === userActiveWorkspaceId);
    const finalActiveWorkspaceId = hasAccessToActiveWorkspace ? userActiveWorkspaceId : (workspaces[0]?.workspace?.id || "adrata");
    
    // Workspace selection

    // 🆕 CRITICAL FIX: Update user's activeWorkspaceId in database if it's not set or invalid
    if (!user.activeWorkspaceId || !hasAccessToActiveWorkspace) {
      // Updating user's activeWorkspaceId in database
      await prisma.users.update({
        where: { id: user.id },
        data: { activeWorkspaceId: finalActiveWorkspaceId }
      });
      // User's activeWorkspaceId updated successfully
    }

    // Generate JWT token
    console.log("🔐 [AUTH API] Generating JWT token");
    const secret =
      process['env']['NEXTAUTH_SECRET'] ||
      process['env']['JWT_SECRET'] ||
      "dev-secret-key-change-in-production";
    
    console.log("🔐 [AUTH API] JWT secret exists:", !!secret);
    
    let token;
    try {
      token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          workspaceId: finalActiveWorkspaceId,
          activeWorkspaceId: finalActiveWorkspaceId,
          platform,
          deviceId,
          iat: Math.floor(Date.now() / 1000),
        },
        secret,
        { expiresIn: '7d' }
      );
      console.log("🔐 [AUTH API] JWT token generated successfully");
    } catch (jwtError) {
      console.error("❌ [AUTH API] JWT generation failed:", jwtError);
      throw jwtError;
    }

    // Format user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName || user.name,
      activeWorkspaceId: finalActiveWorkspaceId,
      workspaces: workspaces.map((uw) => ({
        id: uw.workspace?.id || "unknown",
        name: uw.workspace?.name || "Unknown Workspace",
        role: uw.role,
      })),
    };

    // Returning successful authentication response

    // Get platform routing information with workspace-aware URLs
    let platformRoute;
    let appConfig;
    try {
      // Mock context for platform routing (since we're in API route)
      const isDemo = user['email'] === "demo@adrata.com" || user['email'] === "demo@zeropoint.com";
      const isZeroPointDemo = user['email'] === "demo@zeropoint.com";
      const mockContext = {
        workspaceId: isDemo ? (isZeroPointDemo ? "zeropoint-demo-2025" : "demo-workspace-2025") : userData['workspaces'][0]?.id || "adrata",
        userId: user.id,
        userEmail: user.email,
        isDemo,
        dataMode: isDemo ? "demo" as const : "production" as const,
        platformAccess: isDemo ? "monaco-standalone" as const : "aos-full" as const,
        availableApps: isDemo ? ["monaco"] : ["monaco", "Speedrun", "pipeline", "oasis", "tower", "garage"]
      };
      
      platformRoute = PlatformAccessRouter.getRouteForContext(mockContext);
      
      // Special handling for ZeroPoint demo - route to demo URL
      if (isZeroPointDemo) {
        platformRoute = {
          path: "/demo/zeropoint/speedrun",
          app: "pipeline",
          section: "speedrun"
        };
        // ZeroPoint demo routing
      }
      // Make the route workspace-aware for non-demo users
      else if (!isDemo && userData.workspaces.length > 0) {
        // Use the user's active workspace for routing
        const activeWorkspace = userData.workspaces.find(w => w['id'] === userData.activeWorkspaceId) || userData['workspaces'][0];
        
        // Add safety check for workspace data
        if (!activeWorkspace || !activeWorkspace.name) {
          console.warn("⚠️ [AUTH API] Invalid workspace data, using fallback route");
          platformRoute = {
            path: "/monaco/sellers",
            app: "monaco",
            section: "sellers"
          };
        } else {
          const workspaceSlug = generateWorkspaceSlug(activeWorkspace.name);
        
          // Workspace routing debug
          
          // Generate native workspace-specific URLs (not redirects)
          if (platformRoute.path.startsWith('/pipeline')) {
            // Routes become workspace-native: /rps/dashboard (new default)
            const pipelineSection = platformRoute.path.replace('/pipeline', '') || '/dashboard';
            platformRoute['path'] = `/${workspaceSlug}${pipelineSection}`;
          } else if (platformRoute.path.startsWith('/aos')) {
            // AOS routes get workspace query parameter
            platformRoute['path'] = `${platformRoute.path}?workspace=${workspaceSlug}`;
          } else if (platformRoute.path.startsWith('/monaco')) {
            // Monaco routes get workspace query parameter  
            platformRoute['path'] = `${platformRoute.path}?workspace=${workspaceSlug}`;
          } else if (platformRoute.path.startsWith('/speedrun')) {
            // Speedrun routes get workspace prefix for proper routing
            platformRoute['path'] = `/${workspaceSlug}/speedrun`;
          } else {
            // Default to workspace-specific speedrun for authenticated users
            platformRoute['path'] = `/${workspaceSlug}/speedrun`;
          }
          
          // Workspace-aware route determined
        }
      } else {
        // Platform route determined
      }
      
    } catch (error) {
      // Platform routing error
      console.error("❌ [AUTH API] Platform routing error:", error);
      platformRoute = PlatformAccessRouter.getDemoRoute(); // Fallback
    }

    // Return token and user data with platform routing
    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken: token,
      refreshToken: token, // Using same token for simplicity
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: "Authentication successful",
      platformRoute: platformRoute,
      redirectTo: platformRoute.path,
    });

    // Set HTTP-only cookie for additional security
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process['env']['NODE_ENV'] === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Add CORS headers for production
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  } catch (error) {
    // Sign-in error
    console.error("❌ [AUTH API] Sign-in error:", error);
    console.error("❌ [AUTH API] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    // Provide more detailed error information for debugging
    let errorMessage = "Authentication failed";
    let errorDetails = "Internal server error";
    
    if (error instanceof Error) {
      errorDetails = error.message;
      console.error("❌ [AUTH API] Error message:", error.message);
      
      if (error.message.includes("prisma") || error.message.includes("database")) {
        errorMessage = "Database connection error";
        console.error("❌ [AUTH API] Database error detected");
      } else if (error.message.includes("jwt") || error.message.includes("token")) {
        errorMessage = "Token generation error";
        console.error("❌ [AUTH API] JWT error detected");
      } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Database connection failed";
        console.error("❌ [AUTH API] Network error detected");
      }
    }
    
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
    
    // Add CORS headers to error response too
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return errorResponse;
  }
}
