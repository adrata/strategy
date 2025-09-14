#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 COMPREHENSIVE TAURI APPLICATION DIAGNOSTIC");
console.log("=".repeat(60));

const issues = [];
const warnings = [];

// 1. CHECK TAURI CONFIGURATION COMPATIBILITY
function checkTauriConfig() {
  console.log("\n📋 1. Analyzing Tauri Configuration...");

  try {
    const configPath = "src-tauri/tauri.conf.json";
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    console.log(`   ✓ Tauri config found: ${configPath}`);
    console.log(`   ✓ Product Name: ${config.productName}`);
    console.log(`   ✓ Version: ${config.version}`);
    console.log(`   ✓ Identifier: ${config.identifier}`);

    // Check plugin configurations for v2 compatibility
    if (config.plugins) {
      console.log("\n   🔌 Plugin Configuration Analysis:");

      // Check shell plugin
      if (config.plugins.shell) {
        if (
          typeof config.plugins.shell === "object" &&
          config.plugins.shell.open
        ) {
          issues.push(
            "Shell plugin using v1 format - should be boolean or specific v2 format",
          );
        }
        console.log(
          `   ⚠️  Shell plugin: ${JSON.stringify(config.plugins.shell)}`,
        );
      }

      // Check dialog plugin
      if (config.plugins.dialog) {
        if (typeof config.plugins.dialog === "object") {
          issues.push(
            "Dialog plugin using v1 format - Tauri v2 expects different format",
          );
        }
        console.log(
          `   ❌ Dialog plugin: ${JSON.stringify(config.plugins.dialog)}`,
        );
      }

      // Check fs plugin
      if (config.plugins.fs) {
        if (config.plugins.fs.all !== undefined) {
          issues.push('FS plugin using v1 "all" field - should use v2 format');
        }
        console.log(`   ✓ FS plugin: ${JSON.stringify(config.plugins.fs)}`);
      }
    }

    // Check build configuration
    if (config.build) {
      console.log(`   ✓ Frontend dist: ${config.build.frontendDist}`);
      console.log(`   ✓ Dev URL: ${config.build.devUrl}`);
    }
  } catch (error) {
    issues.push(`Failed to read/parse Tauri config: ${error.message}`);
  }
}

// 2. CHECK CARGO DEPENDENCIES
function checkCargoDependencies() {
  console.log("\n📦 2. Analyzing Rust Dependencies...");

  try {
    const cargoTomlPath = "src-tauri/Cargo.toml";
    const cargoContent = fs.readFileSync(cargoTomlPath, "utf8");

    // Extract version numbers
    const tauriVersionMatch = cargoContent.match(
      /tauri\s*=\s*{[^}]*version\s*=\s*"([^"]+)"/,
    );
    const tauriVersion = tauriVersionMatch ? tauriVersionMatch[1] : "unknown";

    console.log(`   ✓ Tauri version: ${tauriVersion}`);

    // Check for plugin dependencies
    const plugins = [];
    const pluginMatches = cargoContent.matchAll(
      /tauri-plugin-(\w+)\s*=\s*{[^}]*version\s*=\s*"([^"]+)"/g,
    );
    for (const match of pluginMatches) {
      plugins.push({ name: match[1], version: match[2] });
    }

    console.log(`   ✓ Found ${plugins.length} Tauri plugins:`);
    plugins.forEach((plugin) => {
      console.log(`     - tauri-plugin-${plugin.name}: ${plugin.version}`);
    });

    // Check for version compatibility
    if (
      tauriVersion.startsWith("2.") &&
      plugins.some((p) => p.version.startsWith("1."))
    ) {
      issues.push("Version mismatch: Tauri v2 with v1 plugins detected");
    }
  } catch (error) {
    issues.push(`Failed to analyze Cargo.toml: ${error.message}`);
  }
}

// 3. CHECK FRONTEND BUILD OUTPUT
function checkFrontendOutput() {
  console.log("\n🌐 3. Analyzing Frontend Output...");

  try {
    const outDir = "out";
    if (!fs.existsSync(outDir)) {
      issues.push('Frontend output directory "out" does not exist');
      return;
    }

    const indexHtml = path.join(outDir, "index.html");
    if (!fs.existsSync(indexHtml)) {
      issues.push("index.html not found in output directory");
      return;
    }

    const indexContent = fs.readFileSync(indexHtml, "utf8");
    console.log(`   ✓ index.html found (${indexContent.length} bytes)`);

    // Check for problematic patterns
    if (indexContent.includes("/_next/")) {
      warnings.push(
        "Absolute paths found in index.html - may cause issues in Tauri",
      );
    }

    if (indexContent.includes("api/")) {
      warnings.push(
        "API routes referenced in static build - may cause runtime errors",
      );
    }

    // Check critical files
    const nextDir = path.join(outDir, "_next");
    if (fs.existsSync(nextDir)) {
      const stats = fs.readdirSync(nextDir, { recursive: true }).length;
      console.log(`   ✓ _next directory: ${stats} files`);
    }
  } catch (error) {
    issues.push(`Failed to analyze frontend output: ${error.message}`);
  }
}

// 4. CHECK JAVASCRIPT ERRORS IN STATIC BUILD
function checkJavaScriptErrors() {
  console.log("\n🔧 4. Analyzing JavaScript Bundle...");

  try {
    const mainAppChunk = fs
      .readdirSync("out/_next/static/chunks")
      .find((file) => file.startsWith("main-app-"));

    if (mainAppChunk) {
      const chunkPath = path.join("out/_next/static/chunks", mainAppChunk);
      const chunkContent = fs.readFileSync(chunkPath, "utf8");

      // Check for runtime errors
      if (
        chunkContent.includes("localStorage") &&
        !chunkContent.includes("typeof window")
      ) {
        warnings.push("Unsafe localStorage usage detected in bundle");
      }

      if (chunkContent.includes("process.env.NODE_ENV")) {
        console.log("   ✓ Environment variable handling found");
      }

      console.log(
        `   ✓ Main app chunk: ${mainAppChunk} (${chunkContent.length} bytes)`,
      );
    }
  } catch (error) {
    warnings.push(`Could not analyze JavaScript bundle: ${error.message}`);
  }
}

// 5. CHECK TAURI RUST CODE
function checkTauriRustCode() {
  console.log("\n🦀 5. Analyzing Rust Source Code...");

  try {
    const mainRsPath = "src-tauri/src/main.rs";
    const mainRsContent = fs.readFileSync(mainRsPath, "utf8");

    // Check for common issues
    if (mainRsContent.includes(".plugin(")) {
      const pluginMatches = mainRsContent.match(/\.plugin\([^)]+\)/g);
      console.log(
        `   ✓ Found ${pluginMatches ? pluginMatches.length : 0} plugin initializations`,
      );

      if (pluginMatches) {
        pluginMatches.forEach((plugin) => {
          console.log(`     - ${plugin}`);
        });
      }
    }

    // Check for deprecated APIs
    if (mainRsContent.includes("tauri::api::")) {
      issues.push(
        "Deprecated tauri::api usage found - should use tauri-plugin-* instead",
      );
    }

    if (mainRsContent.includes("custom_protocol")) {
      console.log("   ✓ Custom protocol configuration found");
    }
  } catch (error) {
    issues.push(`Failed to analyze Rust source: ${error.message}`);
  }
}

// 6. RUN ACTUAL APP TEST
function runAppTest() {
  console.log("\n🚀 6. Testing Application Launch...");

  try {
    const appPath =
      "/Users/rosssylvester/Desktop/Adrata - Global Sales Intelligence.app/Contents/MacOS/adrata";

    if (!fs.existsSync(appPath)) {
      issues.push("Built application not found on Desktop");
      return;
    }

    console.log("   ✓ App binary found on Desktop");

    // Try to run the app and capture output
    try {
      const result = execSync(`"${appPath}" 2>&1`, {
        timeout: 5000,
        encoding: "utf8",
      });
      console.log("   ✓ App launched successfully");
      console.log(`   📤 Output: ${result.substring(0, 200)}...`);
    } catch (error) {
      console.log(`   ❌ App failed to launch: ${error.message}`);
      if (error.stdout) {
        console.log(`   📤 Stdout: ${error.stdout}`);
      }
      if (error.stderr) {
        console.log(`   📤 Stderr: ${error.stderr}`);
      }
      issues.push(`App launch failed: ${error.message}`);
    }
  } catch (error) {
    issues.push(`Failed to test app launch: ${error.message}`);
  }
}

// 7. GENERATE TAURI V2 COMPATIBLE CONFIG
function generateV2Config() {
  console.log("\n⚙️  7. Generating Tauri v2 Compatible Configuration...");

  const v2Config = {
    $schema: "https://tauri.app/schemas/2/tauri.conf.json",
    productName: "Adrata - Global Sales Intelligence",
    version: "1.0.0",
    identifier: "com.adrata.app",
    build: {
      beforeDevCommand: "npm run dev",
      beforeBuildCommand: "npm run build",
      frontendDist: "../out",
      devUrl: "http://localhost:3000",
    },
    app: {
      windows: [
        {
          title: "Adrata - Global Sales Intelligence",
          width: 1200,
          height: 800,
          resizable: true,
          fullscreen: false,
          center: true,
          decorations: true,
          alwaysOnTop: false,
          skipTaskbar: false,
        },
      ],
      security: {
        csp: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self';",
      },
    },
    bundle: {
      active: true,
      targets: "all",
      icon: ["icons/adrata-icon.png", "icons/adrata-icon.icns"],
      category: "Business",
      shortDescription: "AI-Powered Sales Intelligence",
      longDescription:
        "Global sales intelligence platform with AI capabilities",
    },
    plugins: {},
  };

  console.log("   ✓ Generated v2 compatible config structure");

  // Write suggested config
  fs.writeFileSync(
    "src-tauri/tauri.conf.v2.json",
    JSON.stringify(v2Config, null, 2),
  );
  console.log("   ✓ Saved suggested config to tauri.conf.v2.json");
}

// RUN ALL DIAGNOSTICS
checkTauriConfig();
checkCargoDependencies();
checkFrontendOutput();
checkJavaScriptErrors();
checkTauriRustCode();
runAppTest();
generateV2Config();

// FINAL REPORT
console.log("\n" + "=".repeat(60));
console.log("📊 DIAGNOSTIC SUMMARY");
console.log("=".repeat(60));

if (issues.length === 0) {
  console.log("✅ No critical issues found!");
} else {
  console.log(`❌ Found ${issues.length} critical issue(s):`);
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log(`\n⚠️  Found ${warnings.length} warning(s):`);
  warnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
}

console.log("\n🔧 RECOMMENDED ACTIONS:");
console.log("1. Update plugin configurations to Tauri v2 format");
console.log("2. Remove all object-based plugin configs");
console.log("3. Test with minimal plugin configuration first");
console.log("4. Check for frontend SSR issues");

process.exit(issues.length > 0 ? 1 : 0);
