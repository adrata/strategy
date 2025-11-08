#!/usr/bin/env node

/**
 * 🔍 CHECK COMPANY TRAILING SPACES
 * 
 * Audits company names in the database to check for trailing spaces
 * and other whitespace issues
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

/**
 * Normalize a name by trimming and normalizing spaces
 */
function normalizeName(name) {
  if (!name) return null;
  const normalized = name.trim().replace(/\s+/g, ' ');
  return normalized === '' ? null : normalized;
}

/**
 * Check if a name has trailing/leading spaces or multiple spaces
 */
function hasWhitespaceIssues(name) {
  if (!name) return false;
  return (
    name !== name.trim() || // Has leading/trailing spaces
    name.includes('  ') || // Has multiple consecutive spaces
    name !== normalizeName(name) // Doesn't match normalized version
  );
}

async function checkCompanyTrailingSpaces() {
  console.log("🔍 CHECKING COMPANY TRAILING SPACES");
  console.log("====================================");
  console.log("");

  try {
    // Step 1: Get all companies
    console.log("📊 Step 1: Loading all companies...");
    
    const allCompanies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
    });

    console.log(`✅ Found ${allCompanies.length} total companies`);

    // Step 2: Check for whitespace issues
    console.log("\n🔍 Step 2: Checking for whitespace issues...");
    
    const issues = {
      trailingSpaces: [],
      leadingSpaces: [],
      multipleSpaces: [],
      bothLeadingAndTrailing: [],
      allIssues: [],
    };

    for (const company of allCompanies) {
      if (!company.name) continue;
      
      const hasLeading = company.name !== company.name.trimStart();
      const hasTrailing = company.name !== company.name.trimEnd();
      const hasMultiple = company.name.includes('  ');
      const normalized = normalizeName(company.name);
      const needsCleaning = company.name !== normalized;

      if (needsCleaning) {
        const issue = {
          id: company.id,
          name: company.name,
          normalizedName: normalized,
          workspaceId: company.workspaceId,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          hasLeading,
          hasTrailing,
          hasMultiple,
        };

        issues.allIssues.push(issue);

        if (hasTrailing) {
          issues.trailingSpaces.push(issue);
        }
        if (hasLeading) {
          issues.leadingSpaces.push(issue);
        }
        if (hasMultiple) {
          issues.multipleSpaces.push(issue);
        }
        if (hasLeading && hasTrailing) {
          issues.bothLeadingAndTrailing.push(issue);
        }
      }
    }

    // Step 3: Show statistics
    console.log("\n📊 Step 3: Statistics");
    console.log("=".repeat(50));
    console.log(`Total companies: ${allCompanies.length}`);
    console.log(`Companies with issues: ${issues.allIssues.length}`);
    console.log(`  - Trailing spaces: ${issues.trailingSpaces.length}`);
    console.log(`  - Leading spaces: ${issues.leadingSpaces.length}`);
    console.log(`  - Multiple spaces: ${issues.multipleSpaces.length}`);
    console.log(`  - Both leading and trailing: ${issues.bothLeadingAndTrailing.length}`);

    if (issues.allIssues.length === 0) {
      console.log("\n✅ No whitespace issues found! All company names are clean.");
      return;
    }

    // Step 4: Show recent companies with issues (last 30 days)
    console.log("\n📅 Step 4: Recent companies with issues (last 30 days)...");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentIssues = issues.allIssues.filter(
      (issue) => new Date(issue.createdAt) > thirtyDaysAgo
    );

    console.log(`Found ${recentIssues.length} recent companies with issues:`);
    
    if (recentIssues.length > 0) {
      console.log("\nRecent issues (first 20):");
      recentIssues.slice(0, 20).forEach((issue, index) => {
        const flags = [];
        if (issue.hasLeading) flags.push('leading');
        if (issue.hasTrailing) flags.push('trailing');
        if (issue.hasMultiple) flags.push('multiple');
        
        console.log(`\n  ${index + 1}. "${issue.name}"`);
        console.log(`     → "${issue.normalizedName}"`);
        console.log(`     Issues: ${flags.join(', ')}`);
        console.log(`     Created: ${new Date(issue.createdAt).toLocaleDateString()}`);
        console.log(`     ID: ${issue.id}`);
      });

      if (recentIssues.length > 20) {
        console.log(`\n     ... and ${recentIssues.length - 20} more recent issues`);
      }
    }

    // Step 5: Show sample of all issues
    console.log("\n📋 Step 5: Sample of all issues (first 20):");
    issues.allIssues.slice(0, 20).forEach((issue, index) => {
      const flags = [];
      if (issue.hasLeading) flags.push('leading');
      if (issue.hasTrailing) flags.push('trailing');
      if (issue.hasMultiple) flags.push('multiple');
      
      console.log(`\n  ${index + 1}. "${issue.name}"`);
      console.log(`     → "${issue.normalizedName}"`);
      console.log(`     Issues: ${flags.join(', ')}`);
    });

    if (issues.allIssues.length > 20) {
      console.log(`\n     ... and ${issues.allIssues.length - 20} more issues`);
    }

    // Step 6: Group by workspace
    console.log("\n🏢 Step 6: Issues by workspace...");
    const issuesByWorkspace = {};
    
    for (const issue of issues.allIssues) {
      const workspaceId = issue.workspaceId || 'UNKNOWN';
      if (!issuesByWorkspace[workspaceId]) {
        issuesByWorkspace[workspaceId] = [];
      }
      issuesByWorkspace[workspaceId].push(issue);
    }

    // Get workspace names
    const workspaceIds = Object.keys(issuesByWorkspace);
    const workspaces = await prisma.workspaces.findMany({
      where: {
        id: { in: workspaceIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    const workspaceMap = new Map(workspaces.map(w => [w.id, w]));

    Object.entries(issuesByWorkspace)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([workspaceId, workspaceIssues]) => {
        const workspace = workspaceMap.get(workspaceId);
        const workspaceName = workspace 
          ? `${workspace.name} (${workspace.slug})`
          : workspaceId;
        console.log(`  ${workspaceName}: ${workspaceIssues.length} issues`);
      });

    // Step 7: Summary
    console.log("\n\n📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total companies: ${allCompanies.length}`);
    console.log(`Companies with whitespace issues: ${issues.allIssues.length}`);
    console.log(`Percentage affected: ${((issues.allIssues.length / allCompanies.length) * 100).toFixed(2)}%`);
    console.log(`Recent issues (last 30 days): ${recentIssues.length}`);
    
    if (issues.allIssues.length > 0) {
      console.log("\n⚠️  RECOMMENDATION:");
      console.log("   Run the migration script to clean company names:");
      console.log("   node scripts/migration/clean-company-trailing-spaces.js");
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkCompanyTrailingSpaces()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

