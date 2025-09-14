#!/usr/bin/env node

/**
 * 🛡️ ENSURE API STATIC SAFEGUARDS
 * This script ensures all API routes have proper static export safeguards
 * to prevent build failures in Tauri static export mode
 */

const fs = require("fs");
const path = require("path");

console.log("🛡️ Ensuring API static safeguards...");

const API_DIR = "./src/app/api";

function findApiRoutes() {
  const apiRoutes = [];
  
  if (!fs.existsSync(API_DIR)) {
    console.log("ℹ️  No API directory found");
    return apiRoutes;
  }

  function walkDir(dir, relativePath = "") {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath, path.join(relativePath, file));
      } else if (file === "route.ts" || file === "route.js") {
        apiRoutes.push({
          fullPath: filePath,
          relativePath: path.join(relativePath, file),
          directory: relativePath || "root"
        });
      }
    });
  }

  walkDir(API_DIR);
  return apiRoutes;
}

function hasStaticSafeguard(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for existing safeguards
  return content.includes('export const dynamic') || 
         content.includes('TAURI_BUILD') || 
         content.includes('force-static');
}

function addStaticSafeguard(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add safeguard at the top of the file (after imports)
  const safeguardCode = `
// 🛡️ Static Export Safeguard for Tauri Builds
export const dynamic = process.env.TAURI_BUILD === "true" ? "force-static" : "force-dynamic";
`;

  // Find the best place to insert the safeguard
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Skip imports and comments at the top
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//') || line.startsWith('/*') || 
        line.startsWith('import') || line.startsWith('*') || line.endsWith('*/')) {
      insertIndex = i + 1;
    } else {
      break;
    }
  }
  
  // Insert the safeguard
  lines.splice(insertIndex, 0, safeguardCode);
  content = lines.join('\n');
  
  fs.writeFileSync(filePath, content);
  return true;
}

function validateApiRoute(filePath) {
  if (!fs.existsSync(filePath)) return { valid: false, reason: "File not found" };
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for common issues that break static export
  const issues = [];
  
  if (content.includes('prisma') && !content.includes('TAURI_BUILD')) {
    issues.push("Uses Prisma without Tauri build check");
  }
  
  if (content.includes('process.env') && !content.includes('NEXT_PUBLIC_')) {
    issues.push("Uses server-side environment variables");
  }
  
  if (content.includes('cookies()') || content.includes('headers()')) {
    issues.push("Uses Next.js server functions incompatible with static export");
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}

function createFallbackApiRoute() {
  if (!fs.existsSync(API_DIR)) {
    fs.mkdirSync(API_DIR, { recursive: true });
  }
  
  const fallbackContent = `// 🛡️ Fallback API Route for Static Export
export const dynamic = "force-static";

export async function GET() {
  return new Response(
    JSON.stringify({ 
      message: "API routes disabled in desktop mode",
      timestamp: new Date().toISOString()
    }),
    { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function POST() {
  return new Response(
    JSON.stringify({ 
      message: "API routes disabled in desktop mode" 
    }),
    { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
`;

  fs.writeFileSync(path.join(API_DIR, "route.ts"), fallbackContent);
  console.log("✅ Created fallback API route");
}

// Main execution
function main() {
  try {
    console.log("🛡️ API Static Safeguards Check");
    console.log("==============================");
    
    const apiRoutes = findApiRoutes();
    
    if (apiRoutes.length === 0) {
      console.log("ℹ️  No API routes found - creating fallback");
      createFallbackApiRoute();
      console.log("✅ API static safeguards completed successfully!");
      return;
    }
    
    console.log(`🔍 Found ${apiRoutes.length} API routes to check`);
    
    let safeguardsAdded = 0;
    let issuesFound = 0;
    
    apiRoutes.forEach(route => {
      console.log(`\n📁 Checking ${route.relativePath}...`);
      
      if (!hasStaticSafeguard(route.fullPath)) {
        console.log("  ⚠️  Missing static safeguard - adding...");
        if (addStaticSafeguard(route.fullPath)) {
          safeguardsAdded++;
          console.log("  ✅ Safeguard added");
        } else {
          console.log("  ❌ Failed to add safeguard");
        }
      } else {
        console.log("  ✅ Safeguard already present");
      }
      
      const validation = validateApiRoute(route.fullPath);
      if (!validation.valid) {
        issuesFound++;
        console.log(`  ⚠️  Issues found: ${validation.issues.join(", ")}`);
      }
    });
    
    console.log("\n📊 Summary:");
    console.log(`  • API routes checked: ${apiRoutes.length}`);
    console.log(`  • Safeguards added: ${safeguardsAdded}`);
    console.log(`  • Issues found: ${issuesFound}`);
    
    if (issuesFound > 0) {
      console.log("\n⚠️  Some API routes may still have compatibility issues with static export");
      console.log("   Consider reviewing them manually for Tauri compatibility");
    }
    
    console.log("✅ API static safeguards completed successfully!");
  } catch (error) {
    console.error("❌ API static safeguards failed:", error.message);
    process.exit(1);
  }
}

main();
