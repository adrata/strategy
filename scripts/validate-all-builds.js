#!/usr/bin/env node

/**
 * 🔍 VALIDATE ALL BUILDS
 * This script validates all build configurations and outputs by:
 * 1. Checking web build integrity
 * 2. Validating desktop build configuration
 * 3. Testing mobile build setup
 * 4. Ensuring cross-platform compatibility
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Validating All Builds");
console.log("========================");

function validateWebBuild() {
  console.log("\n🌐 Web Build Validation");
  console.log("-----------------------");
  
  let issues = [];
  
  // Check if .next directory exists
  if (fs.existsSync('.next')) {
    console.log("✅ Next.js build directory found");
    
    // Check for essential build files
    const buildFiles = [
      '.next/BUILD_ID',
      '.next/package.json',
      '.next/static'
    ];
    
    buildFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}: Found`);
      } else {
        issues.push(`Missing build file: ${file}`);
        console.log(`❌ ${file}: Missing`);
      }
    });
    
    // Check build size
    try {
      const buildSize = execSync('du -sh .next', { encoding: 'utf8' }).split('\t')[0];
      console.log(`📦 Build size: ${buildSize}`);
      
      // Warn if build is unusually large
      const sizeNum = parseFloat(buildSize);
      const sizeUnit = buildSize.replace(/[0-9.]/g, '').trim();
      
      if (sizeUnit === 'G' || (sizeUnit === 'M' && sizeNum > 500)) {
        issues.push(`Build size is unusually large: ${buildSize}`);
        console.log(`⚠️  Large build size: ${buildSize}`);
      }
    } catch (error) {
      console.log("⚠️  Could not determine build size");
    }
  } else {
    issues.push("Next.js build not found - run 'npm run build' first");
    console.log("❌ No Next.js build found");
  }
  
  return issues;
}

function validateDesktopBuild() {
  console.log("\n🖥️ Desktop Build Validation");
  console.log("---------------------------");
  
  let issues = [];
  
  // Check Tauri configuration
  const tauriConfigPath = './src-tauri/tauri.conf.json';
  if (fs.existsSync(tauriConfigPath)) {
    console.log("✅ Tauri config found");
    
    try {
      const config = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
      
      // Check essential config
      if (config.package && config.package.productName) {
        console.log(`✅ Product name: ${config.package.productName}`);
      } else {
        issues.push("Missing product name in Tauri config");
        console.log("❌ Product name missing");
      }
      
      if (config.tauri && config.tauri.bundle) {
        console.log("✅ Bundle configuration found");
        
        // Check bundle identifier
        if (config.tauri.bundle.identifier) {
          console.log(`✅ Bundle ID: ${config.tauri.bundle.identifier}`);
        } else {
          issues.push("Missing bundle identifier");
          console.log("❌ Bundle identifier missing");
        }
      } else {
        issues.push("Missing bundle configuration");
        console.log("❌ Bundle config missing");
      }
    } catch (error) {
      issues.push("Invalid Tauri configuration JSON");
      console.log("❌ Invalid Tauri config");
    }
  } else {
    issues.push("Tauri configuration not found");
    console.log("❌ Tauri config missing");
  }
  
  // Check for Rust source
  const rustMainPath = './src-tauri/src/main.rs';
  if (fs.existsSync(rustMainPath)) {
    console.log("✅ Rust main.rs found");
  } else {
    issues.push("Rust main.rs not found");
    console.log("❌ Rust main.rs missing");
  }
  
  // Check for Cargo.toml
  const cargoPath = './src-tauri/Cargo.toml';
  if (fs.existsSync(cargoPath)) {
    console.log("✅ Cargo.toml found");
  } else {
    issues.push("Cargo.toml not found");
    console.log("❌ Cargo.toml missing");
  }
  
  // Check for built artifacts
  const targetDir = './src-tauri/target';
  if (fs.existsSync(targetDir)) {
    console.log("✅ Rust target directory found");
    
    // Look for release builds
    const releaseDir = path.join(targetDir, 'release');
    if (fs.existsSync(releaseDir)) {
      console.log("✅ Release build artifacts found");
    } else {
      console.log("⚠️  No release build artifacts found");
    }
  } else {
    console.log("⚠️  No Rust build artifacts found");
  }
  
  return issues;
}

function validateMobileBuild() {
  console.log("\n📱 Mobile Build Validation");
  console.log("--------------------------");
  
  let issues = [];
  
  // Check Capacitor configuration
  const capacitorConfigPath = './capacitor.config.ts';
  if (fs.existsSync(capacitorConfigPath)) {
    console.log("✅ Capacitor config found");
    
    // Check for iOS and Android directories
    if (fs.existsSync('./ios')) {
      console.log("✅ iOS project found");
    } else {
      console.log("⚠️  iOS project not found (run 'npx cap add ios')");
    }
    
    if (fs.existsSync('./android')) {
      console.log("✅ Android project found");
    } else {
      console.log("⚠️  Android project not found (run 'npx cap add android')");
    }
  } else {
    issues.push("Capacitor configuration not found");
    console.log("❌ Capacitor config missing");
  }
  
  return issues;
}

function validateCrossPlatformCompatibility() {
  console.log("\n🌍 Cross-Platform Compatibility");
  console.log("-------------------------------");
  
  let issues = [];
  
  // Check for platform-specific code
  const platformChecks = [
    {
      pattern: /process\.platform/g,
      file: 'Platform detection code found',
      severity: 'info'
    },
    {
      pattern: /window\./g,
      file: 'Browser-specific code found',
      severity: 'warning'
    },
    {
      pattern: /__dirname|__filename/g,
      file: 'Node.js-specific paths found',
      severity: 'warning'
    }
  ];
  
  // Scan key files for compatibility issues
  const filesToCheck = [
    './src/platform/desktop/desktop-manager.ts',
    './src/platform/web/web-manager.ts',
    './src/platform/mobile/mobile-manager.ts'
  ];
  
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${path.basename(filePath)}: Found`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      platformChecks.forEach(check => {
        const matches = content.match(check.pattern);
        if (matches) {
          const message = `${check.file} in ${path.basename(filePath)} (${matches.length} occurrences)`;
          if (check.severity === 'warning') {
            console.log(`⚠️  ${message}`);
          } else {
            console.log(`ℹ️  ${message}`);
          }
        }
      });
    } else {
      console.log(`⚠️  ${path.basename(filePath)}: Not found`);
    }
  });
  
  return issues;
}

function validateBuildScripts() {
  console.log("\n📜 Build Scripts Validation");
  console.log("---------------------------");
  
  let issues = [];
  
  const packagePath = './package.json';
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = [
      'build',
      'desktop:build',
      'mobile:build:ios',
      'mobile:build:android'
    ];
    
    const optionalScripts = [
      'build:fast',
      'desktop:build:demo',
      'desktop:build:notarized'
    ];
    
    console.log("Required scripts:");
    requiredScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        console.log(`✅ ${script}: Found`);
      } else {
        issues.push(`Missing required script: ${script}`);
        console.log(`❌ ${script}: Missing`);
      }
    });
    
    console.log("\nOptional scripts:");
    optionalScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        console.log(`✅ ${script}: Found`);
      } else {
        console.log(`⚠️  ${script}: Not found`);
      }
    });
  } else {
    issues.push("package.json not found");
    console.log("❌ package.json missing");
  }
  
  return issues;
}

function validateEnvironmentConfiguration() {
  console.log("\n🌍 Environment Configuration");
  console.log("----------------------------");
  
  let issues = [];
  
  // Check for environment files
  const envFiles = [
    '.env.example',
    '.env.local',
    '.env'
  ];
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      console.log(`✅ ${envFile}: Found`);
    } else {
      if (envFile === '.env.example') {
        issues.push("Missing .env.example file");
        console.log(`❌ ${envFile}: Missing`);
      } else {
        console.log(`⚠️  ${envFile}: Not found`);
      }
    }
  });
  
  // Check critical environment variables
  const criticalVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET'
  ];
  
  criticalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚠️  ${varName}: Not set`);
    }
  });
  
  return issues;
}

function generateValidationReport(allIssues) {
  console.log("\n📋 Build Validation Report");
  console.log("==========================");
  
  const totalIssues = allIssues.reduce((sum, issues) => sum + issues.length, 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`  • Total issues found: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log("\n🎉 All build validations passed!");
    console.log("Your application is ready for multi-platform deployment.");
  } else {
    console.log("\n⚠️  Build validation issues found:");
    allIssues.flat().forEach(issue => {
      console.log(`  • ${issue}`);
    });
    
    console.log("\n💡 Recommendations:");
    console.log("  • Fix critical issues before deployment");
    console.log("  • Test builds on target platforms");
    console.log("  • Verify all environment variables are set");
  }
  
  return totalIssues === 0;
}

// Main execution
async function main() {
  try {
    const webIssues = validateWebBuild();
    const desktopIssues = validateDesktopBuild();
    const mobileIssues = validateMobileBuild();
    const compatibilityIssues = validateCrossPlatformCompatibility();
    const scriptIssues = validateBuildScripts();
    const envIssues = validateEnvironmentConfiguration();
    
    const allIssues = [
      webIssues,
      desktopIssues,
      mobileIssues,
      compatibilityIssues,
      scriptIssues,
      envIssues
    ];
    
    const allValid = generateValidationReport(allIssues);
    
    if (allValid) {
      console.log("\n✅ Build validation completed successfully!");
      process.exit(0);
    } else {
      console.log("\n⚠️  Build validation found issues.");
      console.log("Please address the issues listed above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Build validation failed:", error.message);
    process.exit(1);
  }
}

main();