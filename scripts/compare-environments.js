#!/usr/bin/env node

/**
 * 🔍 ENVIRONMENT COMPARISON SCRIPT
 * 
 * This script helps compare environment configurations between
 * working and non-working environments to identify differences.
 */

console.log('🔍 [ENVIRONMENT COMPARISON] Comparing environment configurations...\n');

// Environment variable comparison
function compareEnvironmentVariables() {
  console.log('📋 Environment Variables Comparison');
  console.log('===================================');
  
  const criticalVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'POSTGRES_URL', 
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_WORKSPACE_ID'
  ];
  
  console.log('Critical environment variables:');
  criticalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('SECRET') || varName.includes('URL')) {
        if (value.length > 20) {
          displayValue = `${value.substring(0, 20)}...`;
        }
      }
      console.log(`✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
    }
  });
}

// Database URL analysis
function analyzeDatabaseConfiguration() {
  console.log('\n🗄️ Database Configuration Analysis');
  console.log('===================================');
  
  const dbUrl = process.env.DATABASE_URL;
  const postgresUrl = process.env.POSTGRES_URL;
  
  if (dbUrl) {
    console.log('DATABASE_URL analysis:');
    console.log(`  - Length: ${dbUrl.length} characters`);
    console.log(`  - Contains 'neon': ${dbUrl.includes('neon')}`);
    console.log(`  - Contains 'localhost': ${dbUrl.includes('localhost')}`);
    console.log(`  - Contains 'sslmode': ${dbUrl.includes('sslmode')}`);
    console.log(`  - Contains 'pgbouncer': ${dbUrl.includes('pgbouncer')}`);
  } else {
    console.log('❌ DATABASE_URL not set');
  }
  
  if (postgresUrl) {
    console.log('\nPOSTGRES_URL analysis:');
    console.log(`  - Length: ${postgresUrl.length} characters`);
    console.log(`  - Same as DATABASE_URL: ${dbUrl === postgresUrl}`);
  } else {
    console.log('⚠️  POSTGRES_URL not set');
  }
}

// Authentication configuration analysis
function analyzeAuthConfiguration() {
  console.log('\n🔐 Authentication Configuration Analysis');
  console.log('=======================================');
  
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  console.log('NextAuth Configuration:');
  console.log(`  - NEXTAUTH_SECRET: ${nextAuthSecret ? 'SET' : 'NOT SET'}`);
  console.log(`  - NEXTAUTH_URL: ${nextAuthUrl || 'NOT SET'}`);
  console.log(`  - JWT_SECRET: ${jwtSecret ? 'SET' : 'NOT SET'}`);
  
  if (nextAuthSecret && jwtSecret) {
    console.log(`  - Secrets match: ${nextAuthSecret === jwtSecret}`);
  }
  
  // Check for development vs production secrets
  if (nextAuthSecret) {
    const isDevSecret = nextAuthSecret.includes('dev') || nextAuthSecret.includes('development');
    const isDesktopSecret = nextAuthSecret.includes('desktop');
    console.log(`  - Development secret: ${isDevSecret}`);
    console.log(`  - Desktop secret: ${isDesktopSecret}`);
  }
}

// Platform detection
function analyzePlatformConfiguration() {
  console.log('\n🖥️ Platform Configuration Analysis');
  console.log('==================================');
  
  const nodeEnv = process.env.NODE_ENV;
  const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP === 'true';
  const isTauri = process.env.TAURI_BUILD === 'true';
  const useStaticExport = process.env.NEXT_PUBLIC_USE_STATIC_EXPORT === 'true';
  
  console.log('Platform settings:');
  console.log(`  - NODE_ENV: ${nodeEnv}`);
  console.log(`  - Is Desktop: ${isDesktop}`);
  console.log(`  - Is Tauri: ${isTauri}`);
  console.log(`  - Static Export: ${useStaticExport}`);
  
  // Determine platform type
  if (isTauri || isDesktop) {
    console.log('  - Platform: Desktop (Tauri)');
  } else {
    console.log('  - Platform: Web (Next.js)');
  }
}

// URL configuration analysis
function analyzeUrlConfiguration() {
  console.log('\n🌐 URL Configuration Analysis');
  console.log('=============================');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  console.log('URL settings:');
  console.log(`  - API Base URL: ${apiBaseUrl || 'NOT SET'}`);
  console.log(`  - App URL: ${appUrl || 'NOT SET'}`);
  console.log(`  - NextAuth URL: ${nextAuthUrl || 'NOT SET'}`);
  
  // Check for URL consistency
  if (apiBaseUrl && appUrl) {
    const apiHost = new URL(apiBaseUrl).hostname;
    const appHost = new URL(appUrl).hostname;
    console.log(`  - API and App hosts match: ${apiHost === appHost}`);
  }
  
  // Check for localhost vs production URLs
  const hasLocalhost = [apiBaseUrl, appUrl, nextAuthUrl].some(url => 
    url && url.includes('localhost')
  );
  const hasProduction = [apiBaseUrl, appUrl, nextAuthUrl].some(url => 
    url && (url.includes('adrata.com') || url.includes('vercel.app'))
  );
  
  console.log(`  - Contains localhost: ${hasLocalhost}`);
  console.log(`  - Contains production domain: ${hasProduction}`);
}

// Workspace configuration analysis
function analyzeWorkspaceConfiguration() {
  console.log('\n🏢 Workspace Configuration Analysis');
  console.log('===================================');
  
  const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID;
  
  console.log('Workspace settings:');
  console.log(`  - Workspace ID: ${workspaceId || 'NOT SET'}`);
  
  if (workspaceId) {
    console.log(`  - Length: ${workspaceId.length} characters`);
    console.log(`  - Is UUID format: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)}`);
    console.log(`  - Is simple string: ${workspaceId === 'adrata'}`);
  }
}

// Generate comparison report
function generateComparisonReport() {
  console.log('\n📊 [COMPARISON REPORT]');
  console.log('======================');
  
  const issues = [];
  
  // Check for missing critical variables
  const criticalVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  criticalVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`Missing critical variable: ${varName}`);
    }
  });
  
  // Check for development secrets in production
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret && (nextAuthSecret.includes('dev') || nextAuthSecret.includes('desktop'))) {
    issues.push('Using development/desktop secret in production environment');
  }
  
  // Check for localhost URLs in production
  const urls = [
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL
  ];
  
  const hasLocalhost = urls.some(url => url && url.includes('localhost'));
  if (hasLocalhost && process.env.NODE_ENV === 'production') {
    issues.push('Using localhost URLs in production environment');
  }
  
  // Check for database URL issues
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      issues.push('Using localhost database in production');
    }
    if (!dbUrl.includes('sslmode=require') && dbUrl.includes('neon')) {
      issues.push('Neon database URL missing SSL requirement');
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious configuration issues found');
  } else {
    console.log('⚠️  Potential configuration issues:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('\n🔧 [RECOMMENDATIONS]');
  console.log('====================');
  console.log('1. Ensure all critical environment variables are set');
  console.log('2. Use production secrets in production environments');
  console.log('3. Use production URLs in production environments');
  console.log('4. Verify database connectivity and permissions');
  console.log('5. Check that authentication secrets match between environments');
}

// Main function
function main() {
  compareEnvironmentVariables();
  analyzeDatabaseConfiguration();
  analyzeAuthConfiguration();
  analyzePlatformConfiguration();
  analyzeUrlConfiguration();
  analyzeWorkspaceConfiguration();
  generateComparisonReport();
}

main();
