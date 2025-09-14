#!/usr/bin/env tsx

/**
 * 🔍 REAL-TIME MESSAGING DIAGNOSTIC
 *
 * Comprehensive diagnostic for Pusher real-time messaging issues
 * Identifies why chat and typing indicators aren't working in production
 */

interface DiagnosticResult {
  category: string;
  test: string;
  status: "PASS" | "FAIL" | "WARNING";
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

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
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
}

async function testPusherConnection() {
  console.log("\n📡 TESTING PUSHER CONNECTION");
  console.log("=============================");

  try {
    // Import Pusher client-side library
    const PusherClient = require("pusher-js");

    // Test with production credentials
    const pusherConfig = {
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || "35a0427f72fc6b3c6d48",
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us3",
      forceTLS: true,
      enabledTransports: ["ws", "wss"],
      activityTimeout: 30000,
      pongTimeout: 10000,
    };

    addResult(
      "Pusher",
      "Configuration",
      "PASS",
      "Pusher config loaded",
      pusherConfig,
    );

    const pusher = new PusherClient(pusherConfig.key, pusherConfig);

    // Test connection
    return new Promise((resolve) => {
      let connectionResolved = false;

      pusher.connection.bind("connected", () => {
        if (!connectionResolved) {
          connectionResolved = true;
          addResult(
            "Pusher",
            "Connection",
            "PASS",
            "Successfully connected to Pusher",
            {
              socketId: pusher.connection.socket_id,
              state: pusher.connection.state,
            },
          );
          pusher.disconnect();
          resolve(true);
        }
      });

      pusher.connection.bind("failed", () => {
        if (!connectionResolved) {
          connectionResolved = true;
          addResult(
            "Pusher",
            "Connection",
            "FAIL",
            "Failed to connect to Pusher",
          );
          resolve(false);
        }
      });

      pusher.connection.bind("error", (error: any) => {
        if (!connectionResolved) {
          connectionResolved = true;
          addResult("Pusher", "Connection", "FAIL", "Pusher connection error", {
            error,
          });
          resolve(false);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!connectionResolved) {
          connectionResolved = true;
          addResult(
            "Pusher",
            "Connection",
            "FAIL",
            "Connection timeout after 10 seconds",
          );
          pusher.disconnect();
          resolve(false);
        }
      }, 10000);
    });
  } catch (error) {
    addResult("Pusher", "Import", "FAIL", "Failed to import Pusher client", {
      error: error.message,
    });
    return false;
  }
}

async function testPusherAPIEndpoints() {
  console.log("\n🌐 TESTING PUSHER API ENDPOINTS");
  console.log("================================");

  const endpoints = [
    {
      url: "https://adrata.vercel.app/api/pusher/auth",
      method: "POST",
      description: "Pusher Authentication",
    },
    {
      url: "https://adrata.vercel.app/api/chat/ross-dan/typing",
      method: "POST",
      description: "Typing Indicator",
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: true,
          senderEmail: "dan@adrata.com",
          isTyping: true,
        }),
      });

      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 200
      ) {
        addResult(
          "API",
          endpoint.description,
          "PASS",
          `Endpoint accessible (HTTP ${response.status})`,
        );
      } else if (response.status === 500) {
        addResult(
          "API",
          endpoint.description,
          "WARNING",
          `Server error (HTTP ${response.status})`,
        );
      } else {
        addResult(
          "API",
          endpoint.description,
          "FAIL",
          `Unexpected status (HTTP ${response.status})`,
        );
      }
    } catch (error) {
      addResult("API", endpoint.description, "FAIL", "Network error", {
        error: error.message,
      });
    }
  }
}

async function testWebSocketConnectivity() {
  console.log("\n🔌 TESTING WEBSOCKET CONNECTIVITY");
  console.log("==================================");

  try {
    // Test direct WebSocket connection to Pusher
    const wsUrl = `wss://ws-us3.pusher.com/app/35a0427f72fc6b3c6d48?protocol=7&client=js&version=8.4.0-rc2&flash=false`;

    const ws = new WebSocket(wsUrl);

    return new Promise((resolve) => {
      let resolved = false;

      ws.onopen = () => {
        if (!resolved) {
          resolved = true;
          addResult(
            "WebSocket",
            "Direct Connection",
            "PASS",
            "WebSocket connection successful",
          );
          ws.close();
          resolve(true);
        }
      };

      ws.onerror = (error) => {
        if (!resolved) {
          resolved = true;
          addResult(
            "WebSocket",
            "Direct Connection",
            "FAIL",
            "WebSocket connection failed",
            { error },
          );
          resolve(false);
        }
      };

      ws.onclose = (event) => {
        if (!resolved) {
          resolved = true;
          if (event.code === 1000) {
            addResult(
              "WebSocket",
              "Direct Connection",
              "PASS",
              "WebSocket closed normally",
            );
          } else {
            addResult(
              "WebSocket",
              "Direct Connection",
              "FAIL",
              `WebSocket closed with error code ${event.code}`,
            );
          }
          resolve(event.code === 1000);
        }
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          addResult(
            "WebSocket",
            "Direct Connection",
            "FAIL",
            "WebSocket connection timeout",
          );
          ws.close();
          resolve(false);
        }
      }, 5000);
    });
  } catch (error) {
    addResult(
      "WebSocket",
      "Direct Connection",
      "FAIL",
      "WebSocket test failed",
      { error: error.message },
    );
    return false;
  }
}

async function testPusherChannels() {
  console.log("\n📺 TESTING PUSHER CHANNELS");
  console.log("===========================");

  try {
    const PusherClient = require("pusher-js");

    const pusher = new PusherClient("35a0427f72fc6b3c6d48", {
      cluster: "us3",
      forceTLS: true,
    });

    return new Promise((resolve) => {
      let resolved = false;

      pusher.connection.bind("connected", () => {
        try {
          // Test subscribing to Ross-Dan chat channel
          const channel = pusher.subscribe("chat-ross-dan-real");

          channel.bind("pusher:subscription_succeeded", () => {
            if (!resolved) {
              resolved = true;
              addResult(
                "Channels",
                "Ross-Dan Chat",
                "PASS",
                "Successfully subscribed to chat channel",
              );
              pusher.disconnect();
              resolve(true);
            }
          });

          channel.bind("pusher:subscription_error", (error: any) => {
            if (!resolved) {
              resolved = true;
              addResult(
                "Channels",
                "Ross-Dan Chat",
                "FAIL",
                "Failed to subscribe to chat channel",
                { error },
              );
              pusher.disconnect();
              resolve(false);
            }
          });

          // Test typing indicator channel
          const typingChannel = pusher.subscribe("chat-ross-dan-typing");

          typingChannel.bind("pusher:subscription_succeeded", () => {
            addResult(
              "Channels",
              "Typing Indicator",
              "PASS",
              "Successfully subscribed to typing channel",
            );
          });
        } catch (error) {
          if (!resolved) {
            resolved = true;
            addResult(
              "Channels",
              "Subscription",
              "FAIL",
              "Channel subscription error",
              { error: error.message },
            );
            pusher.disconnect();
            resolve(false);
          }
        }
      });

      pusher.connection.bind("error", (error: any) => {
        if (!resolved) {
          resolved = true;
          addResult(
            "Channels",
            "Connection",
            "FAIL",
            "Connection error during channel test",
            { error },
          );
          resolve(false);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          addResult("Channels", "Test", "FAIL", "Channel test timeout");
          pusher.disconnect();
          resolve(false);
        }
      }, 10000);
    });
  } catch (error) {
    addResult("Channels", "Test", "FAIL", "Channel test setup failed", {
      error: error.message,
    });
    return false;
  }
}

async function testServerSidePusher() {
  console.log("\n🖥️ TESTING SERVER-SIDE PUSHER");
  console.log("==============================");

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
      "Server Pusher",
      "Initialization",
      "PASS",
      "Server-side Pusher initialized",
    );

    // Test triggering an event
    try {
      await pusher.trigger("test-channel", "test-event", {
        message: "Test message from diagnostic",
        timestamp: new Date().toISOString(),
      });

      addResult(
        "Server Pusher",
        "Event Trigger",
        "PASS",
        "Successfully triggered test event",
      );
      return true;
    } catch (error) {
      addResult(
        "Server Pusher",
        "Event Trigger",
        "FAIL",
        "Failed to trigger test event",
        { error: error.message },
      );
      return false;
    }
  } catch (error) {
    addResult(
      "Server Pusher",
      "Initialization",
      "FAIL",
      "Failed to initialize server Pusher",
      { error: error.message },
    );
    return false;
  }
}

function checkEnvironmentConfig() {
  console.log("\n🔧 CHECKING ENVIRONMENT CONFIGURATION");
  console.log("======================================");

  const envVars = [
    "PUSHER_APP_ID",
    "PUSHER_KEY",
    "PUSHER_SECRET",
    "PUSHER_CLUSTER",
    "NEXT_PUBLIC_PUSHER_KEY",
    "NEXT_PUBLIC_PUSHER_CLUSTER",
  ];

  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      if (varName.includes("SECRET")) {
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
      addResult(
        "Environment",
        varName,
        "WARNING",
        "Not set locally (using fallback)",
      );
    }
  }

  // Check for common issues
  const pusherKey =
    process.env.NEXT_PUBLIC_PUSHER_KEY || "35a0427f72fc6b3c6d48";
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us3";

  if (pusherKey === "35a0427f72fc6b3c6d48") {
    addResult(
      "Environment",
      "Fallback Values",
      "WARNING",
      "Using hardcoded fallback credentials",
    );
  }

  addResult("Environment", "Final Config", "PASS", "Configuration ready", {
    key: pusherKey.substring(0, 8) + "...",
    cluster: pusherCluster,
  });
}

function generateSummaryReport() {
  console.log("\n📊 DIAGNOSTIC SUMMARY REPORT");
  console.log("=============================");

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

  // Show failures
  const failures = results.filter((r) => r.status === "FAIL");
  if (failures.length > 0) {
    console.log("🚨 CRITICAL ISSUES (Real-time messaging broken):");
    console.log("================================================");
    failures.forEach((failure) => {
      console.log(
        `❌ [${failure.category}] ${failure.test}: ${failure.message}`,
      );
    });
    console.log("");
  }

  // Show warnings
  const warnings = results.filter((r) => r.status === "WARNING");
  if (warnings.length > 0) {
    console.log("⚠️ POTENTIAL ISSUES:");
    console.log("====================");
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

  if (failures.some((f) => f.category === "Pusher")) {
    console.log("📡 Pusher: Check Pusher service status and credentials");
  }

  if (failures.some((f) => f.category === "WebSocket")) {
    console.log(
      "🔌 WebSocket: Check network connectivity and firewall settings",
    );
  }

  if (failures.some((f) => f.category === "Channels")) {
    console.log("📺 Channels: Verify channel permissions and authentication");
  }

  if (failures.some((f) => f.category === "API")) {
    console.log("🌐 API: Check server-side API implementation");
  }

  console.log("📚 Next Steps:");
  console.log("1. Fix critical connection issues");
  console.log("2. Test real-time messaging in browser");
  console.log("3. Verify typing indicators work");
  console.log("4. Check browser console for client-side errors");
}

async function runCompleteDiagnostic() {
  console.log("🔍 REAL-TIME MESSAGING DIAGNOSTIC");
  console.log("==================================");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("");

  try {
    // Run all diagnostic tests
    checkEnvironmentConfig();
    await testServerSidePusher();
    await testPusherAPIEndpoints();
    await testWebSocketConnectivity();
    await testPusherConnection();
    await testPusherChannels();

    generateSummaryReport();
  } catch (error) {
    console.error("❌ Diagnostic failed with error:", error);
    addResult(
      "Diagnostic",
      "Execution",
      "FAIL",
      "Diagnostic script encountered an error",
      { error: error.message },
    );
  }
}

// Run the diagnostic
runCompleteDiagnostic()
  .then(() => {
    console.log("✅ Real-time messaging diagnostic completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Diagnostic failed:", error);
    process.exit(1);
  });
