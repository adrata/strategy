#!/usr/bin/env node

/**
 * 🔍 FIND REAL WORKSPACE & USER IDs
 *
 * Find the actual workspace and user IDs in production database
 */

const { Pool } = require("pg");

const DATABASE_URL =
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

async function findRealIds() {
  console.log("🔍 FINDING REAL WORKSPACE & USER IDs");
  console.log("====================================");
  console.log("");

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    // Find all workspaces with leads
    console.log("🏢 WORKSPACES WITH LEADS:");
    const workspaceQuery = `
      SELECT "workspaceId", COUNT(*) as lead_count 
      FROM leads 
      WHERE "workspaceId" IS NOT NULL 
      GROUP BY "workspaceId" 
      ORDER BY lead_count DESC
    `;
    const workspaceResult = await pool.query(workspaceQuery);
    workspaceResult.rows.forEach((row) => {
      console.log(`   ${row.workspaceId}: ${row.lead_count} leads`);
    });

    // Find all users with leads
    console.log("");
    console.log("👤 USERS WITH LEADS:");
    const userQuery = `
      SELECT "assignedUserId", COUNT(*) as lead_count 
      FROM leads 
      WHERE "assignedUserId" IS NOT NULL 
      GROUP BY "assignedUserId" 
      ORDER BY lead_count DESC
    `;
    const userResult = await pool.query(userQuery);
    userResult.rows.forEach((row) => {
      console.log(`   ${row.assignedUserId}: ${row.lead_count} leads`);
    });

    // Find workspace table
    console.log("");
    console.log("🏢 WORKSPACE TABLE DATA:");
    const workspaceTableQuery = `
      SELECT id, name, slug FROM workspaces 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `;
    const workspaceTableResult = await pool.query(workspaceTableQuery);
    workspaceTableResult.rows.forEach((row) => {
      console.log(`   ID: ${row.id}, Name: ${row.name}, Slug: ${row.slug}`);
    });

    // Find users table
    console.log("");
    console.log("👤 USERS TABLE DATA:");
    const usersTableQuery = `
      SELECT id, name, email FROM users 
      WHERE name LIKE '%dan%' OR email LIKE '%dan%' OR name LIKE '%ross%' OR email LIKE '%ross%'
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `;
    const usersTableResult = await pool.query(usersTableQuery);
    usersTableResult.rows.forEach((row) => {
      console.log(`   ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
    });

    // Get workspace membership info
    console.log("");
    console.log("🤝 WORKSPACE MEMBERSHIPS:");
    const membershipQuery = `
      SELECT wm."workspaceId", wm."userId", u.name as user_name, u.email, w.name as workspace_name
      FROM "WorkspaceMembership" wm
      JOIN users u ON wm."userId" = u.id
      JOIN workspaces w ON wm."workspaceId" = w.id
      ORDER BY wm."createdAt" DESC
      LIMIT 10
    `;
    const membershipResult = await pool.query(membershipQuery);
    membershipResult.rows.forEach((row) => {
      console.log(`   Workspace: ${row.workspace_name} (${row.workspaceId})`);
      console.log(`   User: ${row.user_name} (${row.userId}) - ${row.email}`);
      console.log("   ---");
    });

    console.log("");
    console.log("🎯 PRODUCTION DATABASE ANALYSIS:");
    console.log("=================================");
    console.log("");

    if (workspaceResult.rows.length > 0) {
      const topWorkspace = workspaceResult.rows[0];
      console.log(
        `✅ Main workspace with leads: "${topWorkspace.workspaceId}" (${topWorkspace.lead_count} leads)`,
      );
    }

    if (userResult.rows.length > 0) {
      const topUser = userResult.rows[0];
      console.log(
        `✅ Main user with leads: "${topUser.assignedUserId}" (${topUser.lead_count} leads)`,
      );
    }

    console.log("");
    console.log("🛠️  NEXT STEPS:");
    console.log("   1. Update Tauri app to use the correct workspace ID");
    console.log("   2. Update Tauri app to use the correct user ID");
    console.log("   3. Test the desktop app again");
  } catch (error) {
    console.error("❌ Query failed:", error.message);
  } finally {
    await pool.end();
  }
}

findRealIds();
