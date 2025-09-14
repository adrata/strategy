#!/usr/bin/env node

/**
 * 🚀 PRODUCTION READINESS FIX
 * This script fixes common production readiness issues by:
 * 1. Checking and fixing environment variables
 * 2. Validating database connections
 * 3. Ensuring proper build configuration
 * 4. Fixing common deployment issues
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Production Readiness Fix");
console.log("===========================");

function checkEnvironmentVariables() {
  console.log("\n🌍 Environment Variables Check");
  console.log("------------------------------");
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const productionVars = [
    'VERCEL_URL',
    'NODE_ENV'
  ];
  
  let issues = [];
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`Missing required environment variable: ${varName}`);
      console.log(`❌ ${varName}: Missing`);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });
  
  // Check production variables
  productionVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`⚠️  ${varName}: Not set`);
    }
  });
  
  // Fix NODE_ENV if not set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    console.log("🔧 Set NODE_ENV to production");
  }
  
  return issues;
}

function checkDatabaseConfiguration() {
  console.log("\n📊 Database Configuration Check");
  console.log("-------------------------------");
  
  let issues = [];
  
  // Check if DATABASE_URL is properly formatted
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      issues.push("DATABASE_URL points to localhost - not suitable for production");
      console.log("⚠️  DATABASE_URL uses localhost");
    } else {
      console.log("✅ DATABASE_URL appears to be production-ready");
    }
    
    // Check for SSL requirement
    if (!dbUrl.includes('sslmode=require') && !dbUrl.includes('ssl=true')) {
      console.log("⚠️  DATABASE_URL may not enforce SSL");
    } else {
      console.log("✅ DATABASE_URL enforces SSL");
    }
  }
  
  // Check Prisma schema
  const schemaPath = "./prisma/schema.prisma";
  if (fs.existsSync(schemaPath)) {
    console.log("✅ Prisma schema found");
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    if (schema.includes('provider = "postgresql"')) {
      console.log("✅ Using PostgreSQL provider");
    } else if (schema.includes('provider = "sqlite"')) {
      issues.push("Using SQLite provider - not recommended for production");
      console.log("⚠️  Using SQLite provider");
    }
  } else {
    issues.push("Prisma schema not found");
    console.log("❌ Prisma schema missing");
  }
  
  return issues;
}

function checkBuildConfiguration() {
  console.log("\n🏗️ Build Configuration Check");
  console.log("-----------------------------");
  
  let issues = [];
  
  // Check Next.js config
  const nextConfigPath = "./next.config.mjs";
  if (fs.existsSync(nextConfigPath)) {
    console.log("✅ Next.js config found");
    
    const config = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check for production optimizations
    if (config.includes('compress: true') || config.includes('compress:true')) {
      console.log("✅ Compression enabled");
    } else {
      console.log("⚠️  Compression not explicitly enabled");
    }
    
    // Check for proper image optimization
    if (config.includes('images:') || config.includes('images ')) {
      console.log("✅ Image optimization configured");
    } else {
      console.log("⚠️  Image optimization not configured");
    }
  } else {
    issues.push("Next.js config not found");
    console.log("❌ Next.js config missing");
  }
  
  // Check package.json scripts
  const packagePath = "./package.json";
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (pkg.scripts && pkg.scripts.build) {
      console.log("✅ Build script found");
    } else {
      issues.push("Build script not found in package.json");
      console.log("❌ Build script missing");
    }
    
    if (pkg.scripts && pkg.scripts.start) {
      console.log("✅ Start script found");
    } else {
      issues.push("Start script not found in package.json");
      console.log("❌ Start script missing");
    }
  }
  
  return issues;
}

function checkSecurityConfiguration() {
  console.log("\n🔒 Security Configuration Check");
  console.log("-------------------------------");
  
  let issues = [];
  
  // Check NEXTAUTH_SECRET
  const authSecret = process.env.NEXTAUTH_SECRET;
  if (authSecret) {
    if (authSecret.length < 32) {
      issues.push("NEXTAUTH_SECRET is too short (should be at least 32 characters)");
      console.log("⚠️  NEXTAUTH_SECRET is too short");
    } else {
      console.log("✅ NEXTAUTH_SECRET is properly configured");
    }
  }
  
  // Check NEXTAUTH_URL
  const authUrl = process.env.NEXTAUTH_URL;
  if (authUrl) {
    if (authUrl.startsWith('https://')) {
      console.log("✅ NEXTAUTH_URL uses HTTPS");
    } else if (authUrl.startsWith('http://localhost')) {
      console.log("⚠️  NEXTAUTH_URL uses HTTP (development only)");
    } else {
      issues.push("NEXTAUTH_URL should use HTTPS in production");
      console.log("❌ NEXTAUTH_URL doesn't use HTTPS");
    }
  }
  
  return issues;
}

function fixCommonIssues() {
  console.log("\n🔧 Fixing Common Issues");
  console.log("-----------------------");
  
  let fixed = [];
  
  // Create .env.example if it doesn't exist
  if (!fs.existsSync('.env.example')) {
    const envExample = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/adrata"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
`;
    
    fs.writeFileSync('.env.example', envExample);
    fixed.push("Created .env.example");
    console.log("✅ Created .env.example");
  }
  
  // Ensure .env is in .gitignore
  const gitignorePath = './.gitignore';
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('.env.local') || !gitignore.includes('.env')) {
      fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n.env.local\n.env.production\n');
      fixed.push("Added environment files to .gitignore");
      console.log("✅ Updated .gitignore");
    }
  }
  
  // Create basic health check API route if missing
  const healthApiPath = './src/app/api/health/route.ts';
  if (!fs.existsSync(healthApiPath)) {
    const healthApiDir = path.dirname(healthApiPath);
    if (!fs.existsSync(healthApiDir)) {
      fs.mkdirSync(healthApiDir, { recursive: true });
    }
    
    const healthApiContent = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
`;
    
    fs.writeFileSync(healthApiPath, healthApiContent);
    fixed.push("Created health check API route");
    console.log("✅ Created health check API route");
  }
  
  return fixed;
}

function generateProductionReport(allIssues, fixes) {
  console.log("\n📋 Production Readiness Report");
  console.log("==============================");
  
  const totalIssues = allIssues.reduce((sum, issues) => sum + issues.length, 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`  • Total issues found: ${totalIssues}`);
  console.log(`  • Fixes applied: ${fixes.length}`);
  
  if (totalIssues === 0) {
    console.log("\n🎉 Production readiness check passed!");
    console.log("Your application appears ready for production deployment.");
  } else {
    console.log("\n⚠️  Production readiness issues found:");
    allIssues.flat().forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }
  
  if (fixes.length > 0) {
    console.log("\n🔧 Fixes applied:");
    fixes.forEach(fix => {
      console.log(`  • ${fix}`);
    });
  }
  
  return totalIssues === 0;
}

// Main execution
async function main() {
  try {
    const envIssues = checkEnvironmentVariables();
    const dbIssues = checkDatabaseConfiguration();
    const buildIssues = checkBuildConfiguration();
    const securityIssues = checkSecurityConfiguration();
    const fixes = fixCommonIssues();
    
    const allIssues = [envIssues, dbIssues, buildIssues, securityIssues];
    const isReady = generateProductionReport(allIssues, fixes);
    
    if (isReady) {
      console.log("\n✅ Production readiness fix completed successfully!");
      process.exit(0);
    } else {
      console.log("\n⚠️  Production readiness issues remain.");
      console.log("Please address the issues listed above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Production readiness fix failed:", error.message);
    process.exit(1);
  }
}

main();
