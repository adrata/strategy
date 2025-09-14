// COMPREHENSIVE DESKTOP DEBUG SCRIPT
// This will test every single component step by step

console.log("🔍 ===== ADRATA DESKTOP DEBUG SCRIPT =====");
console.log("🕐 Starting at:", new Date().toISOString());

// Test 1: Environment Detection
console.log("\n📋 TEST 1: Environment Detection");
console.log(
  "  - process.env.NEXT_PUBLIC_IS_DESKTOP:",
  process.env.NEXT_PUBLIC_IS_DESKTOP,
);
console.log("  - process.env.TAURI_BUILD:", process.env.TAURI_BUILD);
console.log("  - process.env.NODE_ENV:", process.env.NODE_ENV);

// Test 2: Database Connection (Direct PostgreSQL)
console.log("\n📋 TEST 2: Direct Database Connection");
const { Pool } = require("pg");

async function testDirectDatabase() {
  const pool = new Pool({
    connectionString:
      "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
  });

  try {
    console.log("  🔗 Connecting to production database...");
    const client = await pool.connect();

    // Test 2a: Check users table
    console.log("  👤 Testing users table...");
    const users = await client.query(`
      SELECT u.id, u.name, u.email, u.password, w.id as workspace_id, w.name as workspace_name
      FROM users u
      JOIN "WorkspaceMembership" wm ON u.id = wm."userId"  
      JOIN workspaces w ON wm."workspaceId" = w.id
      WHERE u.email = 'dan@adrata.com' OR u.id = 'dan'
      LIMIT 1
    `);

    if (users.rows.length > 0) {
      const user = users.rows[0];
      console.log("  ✅ User found:", {
        id: user.id,
        name: user.name,
        email: user.email,
        workspace_id: user.workspace_id,
        workspace_name: user.workspace_name,
        has_password: !!user.password,
      });

      // Test password verification
      const bcrypt = require("bcrypt");
      const passwordTest = await bcrypt.compare("danpass", user.password);
      console.log('  🔐 Password "danpass" matches:', passwordTest);
    } else {
      console.log("  ❌ No user found for dan@adrata.com");
    }

    // Test 2b: Check leads table
    console.log("  📊 Testing leads table...");
    const leadsCount = await client.query(
      `
      SELECT COUNT(*) as count FROM leads 
      WHERE "workspaceId" = $1 AND "assignedUserId" = $2
    `,
      ["adrata", "dan"],
    );
    console.log(
      "  📈 Leads for dan in adrata workspace:",
      leadsCount.rows[0].count,
    );

    // Test 2c: Check all leads
    const allLeadsCount = await client.query(
      "SELECT COUNT(*) as count FROM leads",
    );
    console.log("  📈 Total leads in database:", allLeadsCount.rows[0].count);

    // Test 2d: Sample leads
    const sampleLeads = await client.query(`
      SELECT id, "fullName", email, company, "assignedUserId", "workspaceId"
      FROM leads 
      LIMIT 5
    `);
    console.log("  📋 Sample leads:");
    sampleLeads.rows.forEach((lead, i) => {
      console.log(
        `    ${i + 1}. ${lead.fullName} (${lead.email}) - ${lead.company} [assigned: ${lead.assignedUserId}, workspace: ${lead.workspaceId}]`,
      );
    });

    client.release();
    console.log("  ✅ Database connection test complete");
  } catch (error) {
    console.log("  ❌ Database error:", error.message);
  } finally {
    await pool.end();
  }
}

// Test 3: Tauri Commands Test
console.log("\n📋 TEST 3: Tauri Commands (if available)");

async function testTauriCommands() {
  if (typeof window !== "undefined" && window.__TAURI__) {
    try {
      console.log("  🖥️ Tauri environment detected");
      const { invoke } = await import("@tauri-apps/api/core");

      // Test 3a: Health check
      console.log("  🏥 Testing health_check command...");
      const health = await invoke("health_check");
      console.log("  ✅ Health check result:", health);

      // Test 3b: Authentication test
      console.log("  🔐 Testing authenticate_user_direct command...");
      const authResult = await invoke("authenticate_user_direct", {
        email: "dan@adrata.com",
        password: "danpass",
      });
      console.log("  ✅ Auth result:", authResult);

      if (authResult && authResult.id) {
        // Test 3c: Data loading commands
        console.log("  📊 Testing get_leads command...");
        const leads = await invoke("get_leads", {
          workspace_id: authResult.workspace_id || "adrata",
          user_id: authResult.id,
        });
        console.log("  ✅ Leads result:", {
          type: typeof leads,
          isArray: Array.isArray(leads),
          length: Array.isArray(leads) ? leads.length : "N/A",
          sample: Array.isArray(leads) && leads.length > 0 ? leads[0] : "none",
        });

        console.log("  📅 Testing get_calendar_events command...");
        const calendar = await invoke("get_calendar_events", {
          user_id: authResult.id,
        });
        console.log("  ✅ Calendar result:", {
          type: typeof calendar,
          isArray: Array.isArray(calendar),
          length: Array.isArray(calendar) ? calendar.length : "N/A",
        });

        console.log("  💼 Testing get_opportunities command...");
        const opportunities = await invoke("get_opportunities", {
          workspace_id: authResult.workspace_id || "adrata",
          user_id: authResult.id,
        });
        console.log("  ✅ Opportunities result:", {
          type: typeof opportunities,
          isArray: Array.isArray(opportunities),
          length: Array.isArray(opportunities) ? opportunities.length : "N/A",
        });

        console.log("  👥 Testing get_contacts command...");
        const contacts = await invoke("get_contacts", {
          workspace_id: authResult.workspace_id || "adrata",
          user_id: authResult.id,
        });
        console.log("  ✅ Contacts result:", {
          type: typeof contacts,
          isArray: Array.isArray(contacts),
          length: Array.isArray(contacts) ? contacts.length : "N/A",
        });
      } else {
        console.log("  ❌ Authentication failed, skipping data commands");
      }
    } catch (error) {
      console.log("  ❌ Tauri command error:", error);
    }
  } else {
    console.log("  ⚠️ Not in Tauri environment (this is expected in Node.js)");
  }
}

// Run all tests
async function runAllTests() {
  await testDirectDatabase();
  await testTauriCommands();

  console.log("\n🎯 ===== DEBUG COMPLETE =====");
  console.log("🕐 Finished at:", new Date().toISOString());

  console.log("\n📋 NEXT STEPS:");
  console.log(
    "1. Run this in desktop app console: Open DevTools > Console > Copy this script",
  );
  console.log("2. Check authentication state in app");
  console.log("3. Verify data loading triggers");
  console.log("4. Test each component individually");
}

runAllTests().catch(console.error);
