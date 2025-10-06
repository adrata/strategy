/**
 * 🎯 WORKSPACE DATA ROUTER
 * Routes data based on authenticated user's workspace
 * - Demo users see ZeroPoint demo data
 * - Production users see real production data
 * - URL-based workspace selection for complete data separation
 */

import { UnifiedAuthService } from "@/platform/auth-unified";
import { storeSession } from "@/platform/auth/session";
import { PrismaClient } from "@prisma/client";
import { prisma } from '@/platform/database/prisma-client';
import * as jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { parseWorkspaceFromUrl, getWorkspaceBySlug, generateWorkspaceSlug } from "@/platform/auth/workspace-slugs";

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  userEmail: string;
  isDemo: boolean;
  dataMode: "demo" | "production";
  platformAccess: "monaco-standalone" | "aos-full";
  availableApps: string[];
}

export class WorkspaceDataRouter {
  
  /**
   * Get the current workspace context for data routing
   * Now supports URL-based workspace selection for complete data separation
   */
  static async getWorkspaceContext(request?: NextRequest): Promise<WorkspaceContext> {
    try {
      // If running server-side (API route), try to get user from JWT token
      if (request && typeof window === "undefined") {
        console.log("🔍 WorkspaceDataRouter: Server-side context, checking JWT token...");
        return await this.getServerSideContext(request);
      }
      
      // Client-side: Get current authenticated user
      console.log("🔍 WorkspaceDataRouter: Getting client-side session...");
      const session = await UnifiedAuthService.getSession();
      console.log("🔍 WorkspaceDataRouter: Session result:", session ? "found" : "null");
      
      if (session?.user) {
        console.log("🔍 WorkspaceDataRouter: User data:", {
          id: session.user.id,
          email: session.user.email,
          activeWorkspaceId: session.user.activeWorkspaceId
        });
      }
      
      if (!session?.user) {
        // Return demo context for users without session - DO NOT expose real user data
        return this.getDemoFallback();
      }

      const user = session.user;
      
      // Determine if this is a demo user - ONLY if explicitly demo credentials
      const emailCheck = user['email'] === "demo@adrata.com";
      const idCheck = user['id'] === "demo-user-2025";
      const workspaceCheck = user['activeWorkspaceId'] === "demo-workspace-2025";
      const isDemo = emailCheck || idCheck || workspaceCheck;
      
      // REMOVED: Hardcoded user mappings that cause data leakage between workspaces
      // All users should get their actual workspace data from database queries
      
      console.log("🔍 WorkspaceDataRouter: Demo user checks:", {
        email: user.email,
        emailCheck,
        id: user.id,
        idCheck,
        finalIsDemo: isDemo,
        workspacesCount: user.workspaces?.length || 0,
        firstWorkspaceId: user.workspaces?.[0]?.id
      });

      // Route workspace based on user
      let workspaceId: string;
      
      if (isDemo) {
        // Use the user's actual workspace from their account
        workspaceId = user.activeWorkspaceId || user.workspaces?.[0]?.id;
        console.log(`🎯 [DEMO USER] Using user's actual workspace: ${workspaceId}`);
      } else {
        // Initialize workspaceId for non-demo users
        workspaceId = "";
        
        // 🆕 NEW: Check for URL-based workspace selection first (for complete data separation)
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          const parsedWorkspace = parseWorkspaceFromUrl(currentPath);
          
          if (parsedWorkspace && user.workspaces) {
            const urlWorkspace = getWorkspaceBySlug(user.workspaces, parsedWorkspace.slug);
            
            if (urlWorkspace) {
              workspaceId = urlWorkspace.id;
              console.log(`🎯 [URL-BASED SELECTION] Using workspace from URL: ${parsedWorkspace.slug} -> ${urlWorkspace.name} (${workspaceId})`);
              
              // 🆕 CRITICAL: Force workspace context update for URL-based navigation
              if (user.activeWorkspaceId !== workspaceId) {
                console.log(`🔄 [FORCED WORKSPACE SWITCH] URL indicates workspace ${workspaceId}, but JWT has ${user.activeWorkspaceId}`);
                console.log(`🔄 [FORCED WORKSPACE SWITCH] This will cause data to be pulled from the wrong workspace!`);
                
                // Force the workspace ID to match the URL, even if JWT is wrong
                user['activeWorkspaceId'] = workspaceId;
              }
              
              // 🆕 CRITICAL FIX: Update the user's active workspace to match URL selection
              if (user.activeWorkspaceId !== workspaceId) {
                console.log(`🔄 [WORKSPACE SWITCH] Switching from ${user.activeWorkspaceId} to ${workspaceId} based on URL`);
                
                // CRITICAL: Call the workspace switch API to update JWT token and database
                try {
                  const session = await UnifiedAuthService.getSession();
                  if (session?.accessToken) {
                    const response = await fetch('/api/auth/unified', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.accessToken}`,
                      },
                      body: JSON.stringify({ 
                        action: 'switch-workspace',
                        workspaceId 
                      }),
                      credentials: 'include',
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      console.log(`✅ [WORKSPACE SWITCH] Successfully switched to workspace ${workspaceId} via API`);
                      
                      // Update the session with the new token
                      if (result.auth?.token) {
                        session['accessToken'] = result.auth.token;
                        await storeSession(session);
                        console.log(`✅ [WORKSPACE SWITCH] Updated session with new JWT token`);
                      }
                    } else {
                      console.warn(`⚠️ [WORKSPACE SWITCH] API call failed:`, response.status);
                    }
                  }
                } catch (error) {
                  console.warn(`⚠️ [WORKSPACE SWITCH] Failed to call workspace switch API:`, error);
                  // Continue with local update as fallback
                }
                
                // CRITICAL: Update the user object immediately for this context
                user['activeWorkspaceId'] = workspaceId;
                
                // Update the session with the new workspace ID
                try {
                  const session = await UnifiedAuthService.getSession();
                  if (session && session.user) {
                    session['user']['activeWorkspaceId'] = workspaceId;
                        await storeSession(session);
                    console.log(`✅ [WORKSPACE SWITCH] Session updated with new activeWorkspaceId: ${workspaceId}`);
                  }
                } catch (error) {
                  console.warn(`⚠️ [WORKSPACE SWITCH] Failed to update session:`, error);
                  // Continue with the workspace switch even if session update fails
                }
                
                // 🆕 CRITICAL: Also update the database to persist the workspace switch
                try {
                  // Update the database directly to ensure persistence
                  const { prisma } = await import('@/platform/database/prisma-client');
                  await prisma.users.update({
                    where: { id: user.id },
                    data: { activeWorkspaceId: workspaceId }
                  });
                  console.log(`✅ [DATABASE] Updated user ${user.id} activeWorkspaceId to ${workspaceId}`);
                } catch (error) {
                  console.warn(`⚠️ [DATABASE] Failed to update user activeWorkspaceId:`, error);
                }
              }
            } else {
              console.log(`⚠️ [URL-BASED SELECTION] URL workspace '${parsedWorkspace.slug}' not found in user's workspaces`);
            }
          }
        }
        
        // If no URL-based selection, fall back to session-based selection
        if (!workspaceId) {
          // 🆕 CRITICAL FIX: Use the user's activeWorkspaceId from database
          console.log("🔍 WorkspaceDataRouter: No URL-based selection, checking activeWorkspaceId...");
          
          if (user['activeWorkspaceId'] && user.workspaces?.some(w => w['id'] === user.activeWorkspaceId)) {
            workspaceId = user.activeWorkspaceId;
            console.log(`✅ WorkspaceDataRouter: Using activeWorkspaceId from database: ${workspaceId}`);
          } else if (user['workspaces'] && user.workspaces.length > 0) {
            workspaceId = user['workspaces'][0].id;
            console.log(`⚠️ [WORKSPACE FALLBACK] Using first workspace as fallback: ${workspaceId}`);
          } else {
            console.error(`❌ [CRITICAL] No URL-based workspace selection and no workspaces found`);
            throw new Error("Cannot determine workspace context - URL-based selection required for data separation");
          }
        }
      }
      
      const context: WorkspaceContext = {
        workspaceId,
        userId: user.id,
        userEmail: user.email,
        isDemo,
        dataMode: isDemo ? "demo" as const : "production" as const,
        platformAccess: isDemo ? "monaco-standalone" as const : "aos-full" as const,
        availableApps: isDemo ? ["monaco"] : ["monaco", "rtp", "pipeline", "oasis", "tower", "garage"]
      };
      
      console.log("🔍 WorkspaceDataRouter: Final context:", {
        ...context,
        workspaceSelectionMethod: workspaceId === user.activeWorkspaceId ? "session-based" : "url-based",
        urlPath: typeof window !== "undefined" ? window.location.pathname : "server-side",
        userActiveWorkspace: user.activeWorkspaceId
      });
      return context;
      
    } catch (error) {
      console.error("❌ WorkspaceDataRouter: Error getting context:", error);
      
      // Fallback to demo mode on error
      return {
        workspaceId: "demo-workspace-2025",
        userId: "demo-user-2025", 
        userEmail: "demo@adrata.com",
        isDemo: true,
        dataMode: "demo",
        platformAccess: "monaco-standalone",
        availableApps: ["monaco"]
      };
    }
  }

  /**
   * Get API parameters for data fetching
   */
  static async getApiParams(): Promise<{ workspaceId: string; userId: string }> {
    const context = await this.getWorkspaceContext();
    return {
      workspaceId: context.workspaceId,
      userId: context.userId
    };
  }

  /**
   * Get API parameters for server-side routes with request context
   */
  static async getServerApiParams(request: NextRequest): Promise<{ workspaceId: string; userId: string; userEmail: string }> {
    const context = await this.getWorkspaceContext(request);
    return {
      workspaceId: context.workspaceId,
      userId: context.userId,
      userEmail: context.userEmail
    };
  }

  /**
   * Get ZeroPoint demo companies for demo mode
   */
  static getZeroPointDemoCompanies() {
    return [
      {
        id: "zeropoint-company",
        name: "ZeroPoint",
        domain: "zeropoint.com",
        industry: "Cybersecurity",
        employeeCount: 500,
        revenue: "$50M+",
        location: "Austin, TX",
        icpScore: 95,
        lastUpdated: new Date().toISOString(),
        status: "prospecting" as const,
        companyIntelligence: {
          foundedYear: 2018,
          funding: "Series B",
          growthStage: "Scale-up" as const,
          techStack: ["Quantum Cryptography", "AI Security", "Blockchain", "Python", "React"],
          painPoints: ["Quantum-resistant security", "Scaling detection algorithms", "Enterprise integration"],
          businessPriorities: ["Product innovation", "Market expansion", "Talent acquisition"],
          decisionMakingStyle: "Consensus" as const,
          buyingSignals: ["Enterprise security initiatives", "Quantum threat awareness"],
          competitorAnalysis: [],
          recentNews: [],
          executiveInsights: "ZeroPoint is pioneering quantum-resistant cybersecurity solutions, positioning themselves as the future of enterprise security against quantum computing threats.",
          salesIntelligence: {
            idealContactTitle: ["CTO", "CISO", "VP Security", "Director of Product Security"],
            avgSalesCycle: "3-6 months", 
            avgDealSize: "$500K-$1M",
            successFactors: ["Technical validation", "Quantum threat education", "ROI demonstration"],
            objectionHandling: ["Maturity concerns", "Integration complexity", "Budget allocation"],
          },
        },
      }
    ];
  }

  /**
   * Check if current context is demo mode
   */
  static async isDemoMode(): Promise<boolean> {
    const context = await this.getWorkspaceContext();
    return context.isDemo;
  }

  /**
   * Get workspace context from server-side request (API routes)
   */
  private static async getServerSideContext(request: NextRequest): Promise<WorkspaceContext> {
    try {
      // Try to get JWT token from cookies or Authorization header
      const cookieToken = request.cookies.get("auth-token")?.value || 
                         request.cookies.get("auth_token")?.value ||
                         request.cookies.get("access_token")?.value;
      
      // Check Authorization header for Bearer token
      const authHeader = request.headers.get("Authorization");
      const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      
      // Check unified session cookie as fallback
      let unifiedSessionToken = null;
      try {
        const unifiedCookie = request.cookies.get("adrata_unified_session")?.value;
        if (unifiedCookie) {
          const sessionData = JSON.parse(decodeURIComponent(unifiedCookie));
          unifiedSessionToken = sessionData.accessToken;
        }
      } catch (error) {
        // Failed to parse unified session cookie
      }
      
      const token = cookieToken || headerToken || unifiedSessionToken;
      

      
      if (!token) {
        return this.getDemoFallback();
      }
      
      // Verify and decode JWT token
      const possibleSecrets = [
        process['env']['NEXTAUTH_SECRET'],
        process['env']['JWT_SECRET'], 
        "dev-secret-key-change-in-production"
      ].filter((secret): secret is string => typeof secret === 'string');
      
      let decoded = null;
      for (const secret of possibleSecrets) {
        try {
          decoded = jwt.verify(token, secret) as any;
          break;
        } catch (error) {
          // Try next secret
        }
      }
      
      if (!decoded) {
        return this.getDemoFallback();
      }
      
      // Determine if this is a demo user
            const isDemo = decoded['email'] === "demo@adrata.com" ||
                     decoded['userId'] === "demo-user-2025" ||
                     decoded['workspaceId'] === "demo-workspace-2025";
      
      // SECURITY: Validate workspace access for the user
      let workspaceId: string;
      if (isDemo) {
        workspaceId = "demo-workspace-2025";
      } else {
        // Initialize workspaceId for non-demo users
        workspaceId = "";
        // 🆕 NEW: Check for URL-based workspace selection first (for complete data separation)
        const url = request.nextUrl || new URL(request.url);
        const pathname = url.pathname;
        const parsedWorkspace = parseWorkspaceFromUrl(pathname);
        
        if (parsedWorkspace) {
          console.log(`🎯 [SERVER-SIDE URL SELECTION] Detected workspace from URL: ${parsedWorkspace.slug}`);
          
          // Query database to get user's workspaces and validate URL-based selection
          try {
            // Query workspace_users table to get user's workspaces
            const userWorkspaces = await prisma.workspace_users.findMany({
              where: { userId: decoded.userId }
            });
            
            if (userWorkspaces && userWorkspaces.length > 0) {
              // Get workspace data for each membership to find the one matching the URL slug
              for (const membership of userWorkspaces) {
                const workspaceData = await prisma.workspaces.findUnique({
                  where: { id: membership.workspaceId }
                });
                
                if (workspaceData && generateWorkspaceSlug(workspaceData.name) === parsedWorkspace.slug) {
                  workspaceId = membership.workspaceId;
                  console.log(`✅ [SERVER-SIDE URL SELECTION] Using workspace from URL: ${parsedWorkspace.slug} -> ${workspaceData.name} (${workspaceId})`);
                  break;
                }
              }
              
              if (!workspaceId) {
                console.log(`⚠️ [SERVER-SIDE URL SELECTION] URL workspace '${parsedWorkspace.slug}' not found in user's workspaces`);
              }
            }
          } catch (error) {
            console.error("❌ [SERVER-SIDE URL SELECTION] Error validating URL-based workspace:", error);
          }
        }
        
        // If no URL-based selection, fall back to JWT or database query
        if (!workspaceId) {
          // 🆕 CRITICAL FIX: Prioritize activeWorkspaceId from JWT, not first workspace
          if (decoded.activeWorkspaceId) {
            workspaceId = decoded.activeWorkspaceId;
            console.log(`✅ [SERVER-SIDE] Using activeWorkspaceId from JWT: ${workspaceId}`);
          } else if (decoded.workspaceId) {
            workspaceId = decoded.workspaceId;
            console.log(`✅ [SERVER-SIDE] Using workspaceId from JWT: ${workspaceId}`);
          } else {
            // Query database to get user's actual active workspace
            try {
              const userWithWorkspace = await prisma.users.findUnique({
                where: { id: decoded.userId },
                select: {
                  activeWorkspaceId: true
                }
              });
              
              // Query workspace_users table to get user's workspaces (same as sign-in route)
              const userWorkspaces = await prisma.workspace_users.findMany({
                where: { 
                  userId: decoded.userId
                }
              });
              
              // 🆕 CRITICAL FIX: Use activeWorkspaceId from database, not first workspace
              if (userWithWorkspace?.activeWorkspaceId) {
                workspaceId = userWithWorkspace.activeWorkspaceId;
                console.log(`✅ [SERVER-SIDE] Using activeWorkspaceId from database: ${workspaceId}`);
              } else if (userWorkspaces && userWorkspaces.length > 0) {
                // Only fallback to first workspace if no activeWorkspaceId is set
                workspaceId = userWorkspaces[0].workspaceId;
                console.log(`⚠️ [SERVER-SIDE] No activeWorkspaceId, falling back to first workspace: ${workspaceId}`);
              } else {
                console.error(`❌ [SECURITY] No workspace found for user ${decoded.email} (${decoded.userId})`);
                return this.getDemoFallback(); // Don't expose any data if no workspace found
              }
            } catch (error) {
              console.error("❌ [SECURITY] Error validating user workspace:", error);
              return this.getDemoFallback();
            }
          }
        }
      }

      const context: WorkspaceContext = {
        workspaceId,
        userId: decoded.userId,
        userEmail: decoded.email,
        isDemo,
        dataMode: isDemo ? "demo" : "production",
        platformAccess: isDemo ? "monaco-standalone" : "aos-full",
        availableApps: isDemo ? ["monaco"] : ["monaco", "rtp", "pipeline", "oasis", "tower", "garage"]
      };
      
      console.log("🔍 WorkspaceDataRouter: Server-side context:", context);
      return context;
      
    } catch (error) {
      console.error("❌ WorkspaceDataRouter: Error decoding JWT:", error);
      return this.getDemoFallback();
    }
  }
  
  /**
   * Get demo fallback context
   */
  private static getDemoFallback(): WorkspaceContext {
    return {
      workspaceId: "demo-workspace-2025", // Use separate demo workspace, NOT real user data
      userId: "demo-user-2025", 
      userEmail: "demo@adrata.com",
      isDemo: true,
      dataMode: "demo",
      platformAccess: "monaco-standalone",
      availableApps: ["monaco"]
    };
  }

  /**
   * Log current routing context for debugging
   */
  static async logContext(source: string = "Unknown") {
    const context = await this.getWorkspaceContext();
    console.log(`🎯 [${source}] Workspace Context:`, {
      workspaceId: context.workspaceId,
      userId: context.userId,
      userEmail: context.userEmail,
      isDemo: context.isDemo,
      dataMode: context.dataMode
    });
  }
}

export default WorkspaceDataRouter; 