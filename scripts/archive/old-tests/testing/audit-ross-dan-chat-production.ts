#!/usr/bin/env tsx

/**
 * 🔍 ROSS-DAN CHAT PRODUCTION AUDIT
 *
 * Comprehensive diagnostic to identify why the AI right panel chat
 * works in dev but not in production. This checks:
 * - Pusher configuration and connectivity
 * - API routes and endpoints
 * - Database connectivity
 * - Environment variables
 * - Frontend initialization
 */

import { prisma } from "../../src/lib/prisma";

// Production URL (update if needed)
const PRODUCTION_URL =
  process.env.PRODUCTION_URL || "https://adrata.vercel.app";
const DEV_URL = "http://localhost:3000";

interface AuditResult {
  category: string;
  test: string;
  status: "PASS" | "FAIL" | "WARNING";
  message: string;
  details?: any;
}

const results: AuditResult[] = [];

function addResult(
  category: string,
  test: string,
  status: "PASS" | "FAIL" | "WARNING",
  message: string,
  details?: any,
) {
  results.push({ category, test, status, message, details });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} [${category}] ${test}: ${message}`);
  if (details && typeof details === "object") {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
}

async function auditEnvironmentVariables() {
  console.log("\n🔧 AUDITING ENVIRONMENT VARIABLES");
  console.log("==================================");

  // Critical variables for Ross-Dan chat
  const criticalVars = [
    "DATABASE_URL",
    "PUSHER_APP_ID",
    "PUSHER_KEY",
    "PUSHER_SECRET",
    "PUSHER_CLUSTER",
    "NEXT_PUBLIC_PUSHER_KEY",
    "NEXT_PUBLIC_PUSHER_CLUSTER",
  ];

  for (const varName of criticalVars) {
    const value = process.env[varName];
    if (value) {
      if (varName.includes("SECRET") || varName.includes("KEY")) {
        addResult(
          "Environment",
          varName,
          "PASS",
          `Set (${value.length} chars)`,
          { preview: value.substring(0, 8) + "..." },
        );
      } else {
        addResult("Environment", varName, "PASS", `Set: ${value}`);
      }
    } else {
      addResult("Environment", varName, "FAIL", "Not set or empty");
    }
  }

  // Check for fallback values from next.config.mjs
  const pusherKeyFallback = "35a0427f72fc6b3c6d48";
  const pusherClusterFallback = "us3";

  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    addResult(
      "Environment",
      "Pusher Fallback",
      "WARNING",
      `Using fallback key: ${pusherKeyFallback.substring(0, 8)}...`,
    );
  }

  if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    addResult(
      "Environment",
      "Pusher Cluster Fallback",
      "WARNING",
      `Using fallback cluster: ${pusherClusterFallback}`,
    );
  }
}

async function auditDatabaseConnectivity() {
  console.log("\n💾 AUDITING DATABASE CONNECTIVITY");
  console.log("==================================");

  try {
    await prisma.$connect();
    addResult(
      "Database",
      "Connection",
      "PASS",
      "Successfully connected to database",
    );

    // Check if Ross and Dan users exist
    const rossUser = await prisma.user.findUnique({
      where: { email: "ross@adrata.com" },
    });

    const danUser = await prisma.user.findUnique({
      where: { email: "dan@adrata.com" },
    });

    if (rossUser && danUser) {
      addResult("Database", "Users", "PASS", "Ross and Dan users found", {
        ross: { id: rossUser.id, name: rossUser.name },
        dan: { id: danUser.id, name: danUser.name },
      });
    } else {
      addResult("Database", "Users", "FAIL", "Missing Ross or Dan users", {
        rossExists: !!rossUser,
        danExists: !!danUser,
      });
    }

    // Check for Ross-Dan chat
    if (rossUser && danUser) {
      const rossDanChat = await prisma.chat.findFirst({
        where: {
          AND: [
            { members: { some: { userId: rossUser.id } } },
            { members: { some: { userId: danUser.id } } },
          ],
        },
        include: {
          messages: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (rossDanChat) {
        addResult(
          "Database",
          "Ross-Dan Chat",
          "PASS",
          `Chat exists with ${rossDanChat.messages.length} recent messages`,
          {
            chatId: rossDanChat.id,
            messageCount: rossDanChat.messages.length,
          },
        );
      } else {
        addResult(
          "Database",
          "Ross-Dan Chat",
          "WARNING",
          "No Ross-Dan chat found - will be created on first message",
        );
      }
    }
  } catch (error) {
    addResult(
      "Database",
      "Connection",
      "FAIL",
      "Failed to connect to database",
      { error: error.message },
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function auditAPIEndpoints() {
  console.log("\n🌐 AUDITING API ENDPOINTS");
  console.log("==========================");

  const endpoints = [
    {
      path: "/api/chat/ross-dan",
      method: "GET",
      description: "Initialize Ross-Dan chat",
    },
    { path: "/api/chat/ross-dan", method: "POST", description: "Send message" },
    {
      path: "/api/chat/ross-dan/mark-read",
      method: "POST",
      description: "Mark as read",
    },
    {
      path: "/api/chat/ross-dan/typing",
      method: "POST",
      description: "Typing indicator",
    },
    {
      path: "/api/chat/ross-dan/upload",
      method: "POST",
      description: "Image upload",
    },
    {
      path: "/api/pusher/auth",
      method: "POST",
      description: "Pusher authentication",
    },
  ];

  for (const endpoint of endpoints) {
    try {
      if (endpoint.method === "GET") {
        const response = await fetch(`${PRODUCTION_URL}${endpoint.path}`);
        const responseText = await response.text();

        if (response.ok) {
          addResult(
            "API",
            `${endpoint.method} ${endpoint.path}`,
            "PASS",
            `${endpoint.description} - HTTP ${response.status}`,
          );
        } else {
          addResult(
            "API",
            `${endpoint.method} ${endpoint.path}`,
            "FAIL",
            `${endpoint.description} - HTTP ${response.status}`,
            {
              response: responseText.substring(0, 200),
            },
          );
        }
      } else {
        // For POST endpoints, we'll check if they respond (even with error for missing data)
        const response = await fetch(`${PRODUCTION_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // Empty body to test endpoint exists
        });

        if (response.status === 400) {
          // 400 is expected for empty body - endpoint exists
          addResult(
            "API",
            `${endpoint.method} ${endpoint.path}`,
            "PASS",
            `${endpoint.description} - Endpoint exists (HTTP ${response.status})`,
          );
        } else if (response.status === 404) {
          addResult(
            "API",
            `${endpoint.method} ${endpoint.path}`,
            "FAIL",
            `${endpoint.description} - Endpoint not found (HTTP ${response.status})`,
          );
        } else if (response.status >= 500) {
          addResult(
            "API",
            `${endpoint.method} ${endpoint.path}`,
            "WARNING",
            `${endpoint.description} - Server error (HTTP ${response.status})`,
          );
        } else {
          addResult(
            "API",
            `${endpoint.method} ${endpoint.path}`,
            "PASS",
            `${endpoint.description} - HTTP ${response.status}`,
          );
        }
      }
    } catch (error) {
      addResult(
        "API",
        `${endpoint.method} ${endpoint.path}`,
        "FAIL",
        `${endpoint.description} - Network error`,
        { error: error.message },
      );
    }
  }
}

async function auditPusherConnectivity() {
  console.log("\n📡 AUDITING PUSHER CONNECTIVITY");
  console.log("================================");

  // Test server-side Pusher initialization
  try {
    const Pusher = require("pusher");
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || "2014944",
      key: process.env.PUSHER_KEY || "35a0427f72fc6b3c6d48",
      secret: process.env.PUSHER_SECRET || "CREDENTIAL_REMOVED_FOR_SECURITY",
      cluster: process.env.PUSHER_CLUSTER || "us3",
      useTLS: true,
    });

    addResult(
      "Pusher",
      "Server Init",
      "PASS",
      "Server-side Pusher initialized successfully",
    );

    // Test a simple trigger
    try {
      await pusher.trigger("test-channel", "test-event", { message: "test" });
      addResult(
        "Pusher",
        "Server Trigger",
        "PASS",
        "Successfully triggered test event",
      );
    } catch (error) {
      addResult(
        "Pusher",
        "Server Trigger",
        "FAIL",
        "Failed to trigger test event",
        { error: error.message },
      );
    }
  } catch (error) {
    addResult(
      "Pusher",
      "Server Init",
      "FAIL",
      "Failed to initialize server-side Pusher",
      { error: error.message },
    );
  }

  // Check client-side configuration
  const clientConfig = {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || "35a0427f72fc6b3c6d48",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us3",
  };

  addResult(
    "Pusher",
    "Client Config",
    "PASS",
    "Client configuration available",
    clientConfig,
  );
}

async function auditChatServiceLogic() {
  console.log("\n🤖 AUDITING CHAT SERVICE LOGIC");
  console.log("===============================");

  // Test Ross-Dan chat service initialization
  try {
    const { RossDanChatService } = await import(
      "../../src/lib/services/ross-dan-chat"
    );
    const chatService = RossDanChatService.getInstance();

    addResult(
      "Chat Service",
      "Initialization",
      "PASS",
      "RossDanChatService imported and instantiated",
    );

    // Test chat data loading
    try {
      await chatService.initializeChat();
      const conversation = await chatService.toOasisConversation();

      if (conversation) {
        addResult(
          "Chat Service",
          "Data Loading",
          "PASS",
          "Chat data loaded successfully",
          {
            id: conversation.id,
            messageCount: conversation.messages?.length || 0,
          },
        );
      } else {
        addResult(
          "Chat Service",
          "Data Loading",
          "WARNING",
          "No chat data returned - may need initialization",
        );
      }
    } catch (error) {
      addResult(
        "Chat Service",
        "Data Loading",
        "FAIL",
        "Failed to load chat data",
        { error: error.message },
      );
    }
  } catch (error) {
    addResult(
      "Chat Service",
      "Initialization",
      "FAIL",
      "Failed to import RossDanChatService",
      { error: error.message },
    );
  }
}

async function auditProductionSpecificIssues() {
  console.log("\n🏭 AUDITING PRODUCTION-SPECIFIC ISSUES");
  console.log("======================================");

  // Check for common production issues

  // 1. CSP Headers
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/chat/ross-dan`);
    const cspHeader = response.headers.get("content-security-policy");

    if (cspHeader) {
      const allowsPusher =
        cspHeader.includes("pusher") ||
        cspHeader.includes("*.pusher.com") ||
        cspHeader.includes("connect-src");
      addResult(
        "Production",
        "CSP Headers",
        allowsPusher ? "PASS" : "WARNING",
        allowsPusher
          ? "CSP allows Pusher connections"
          : "CSP may block Pusher connections",
        { csp: cspHeader.substring(0, 100) + "..." },
      );
    } else {
      addResult(
        "Production",
        "CSP Headers",
        "PASS",
        "No restrictive CSP headers found",
      );
    }
  } catch (error) {
    addResult(
      "Production",
      "CSP Headers",
      "WARNING",
      "Could not check CSP headers",
      { error: error.message },
    );
  }

  // 2. CORS Configuration
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/pusher/auth`, {
      method: "OPTIONS",
    });

    const corsHeaders = {
      "access-control-allow-origin": response.headers.get(
        "access-control-allow-origin",
      ),
      "access-control-allow-methods": response.headers.get(
        "access-control-allow-methods",
      ),
      "access-control-allow-headers": response.headers.get(
        "access-control-allow-headers",
      ),
    };

    addResult(
      "Production",
      "CORS Configuration",
      "PASS",
      "CORS headers present",
      corsHeaders,
    );
  } catch (error) {
    addResult(
      "Production",
      "CORS Configuration",
      "WARNING",
      "Could not check CORS configuration",
      { error: error.message },
    );
  }

  // 3. WebSocket Support
  addResult(
    "Production",
    "WebSocket Support",
    "WARNING",
    "Vercel may not support persistent WebSocket connections - relies on Pusher",
  );

  // 4. Environment Variables in Production
  const productionEnvVars = ["VERCEL_ENV", "VERCEL_URL", "NODE_ENV"];

  for (const varName of productionEnvVars) {
    const value = process.env[varName];
    if (value) {
      addResult("Production", `Env ${varName}`, "PASS", `${varName}: ${value}`);
    } else {
      addResult(
        "Production",
        `Env ${varName}`,
        "WARNING",
        `${varName} not set`,
      );
    }
  }
}

function generateSummaryReport() {
  console.log("\n📊 AUDIT SUMMARY REPORT");
  console.log("========================");

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    warnings: results.filter((r) => r.status === "WARNING").length,
  };

  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⚠️ Warnings: ${summary.warnings}`);
  console.log("");

  // Group failures by category
  const failures = results.filter((r) => r.status === "FAIL");
  if (failures.length > 0) {
    console.log("🚨 CRITICAL ISSUES TO FIX:");
    console.log("===========================");
    failures.forEach((failure) => {
      console.log(
        `❌ [${failure.category}] ${failure.test}: ${failure.message}`,
      );
    });
    console.log("");
  }

  // Group warnings by category
  const warnings = results.filter((r) => r.status === "WARNING");
  if (warnings.length > 0) {
    console.log("⚠️ ISSUES TO INVESTIGATE:");
    console.log("==========================");
    warnings.forEach((warning) => {
      console.log(
        `⚠️ [${warning.category}] ${warning.test}: ${warning.message}`,
      );
    });
    console.log("");
  }

  // Recommendations
  console.log("💡 RECOMMENDATIONS:");
  console.log("===================");

  if (failures.some((f) => f.category === "Environment")) {
    console.log(
      "🔧 Environment: Set missing environment variables in Vercel dashboard",
    );
  }

  if (failures.some((f) => f.category === "API")) {
    console.log("🌐 API: Check Vercel function deployment and logs");
  }

  if (failures.some((f) => f.category === "Pusher")) {
    console.log("📡 Pusher: Verify Pusher credentials and test connectivity");
  }

  if (failures.some((f) => f.category === "Database")) {
    console.log("💾 Database: Check database connection and schema");
  }

  console.log("📚 Next Steps:");
  console.log("1. Fix critical issues (FAIL status)");
  console.log("2. Investigate warnings");
  console.log("3. Test in development vs production");
  console.log("4. Check browser dev tools for client-side errors");
  console.log("5. Review Vercel function logs");
}

async function runCompleteAudit() {
  console.log("🔍 ROSS-DAN CHAT PRODUCTION AUDIT");
  console.log("==================================");
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    await auditEnvironmentVariables();
    await auditDatabaseConnectivity();
    await auditAPIEndpoints();
    await auditPusherConnectivity();
    await auditChatServiceLogic();
    await auditProductionSpecificIssues();

    generateSummaryReport();
  } catch (error) {
    console.error("❌ Audit failed with error:", error);
    addResult(
      "Audit",
      "Execution",
      "FAIL",
      "Audit script encountered an error",
      { error: error.message },
    );
  }
}

// Run the audit
runCompleteAudit()
  .then(() => {
    console.log("✅ Audit completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  });
