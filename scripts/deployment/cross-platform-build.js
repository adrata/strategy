#!/usr/bin/env node

/**
 * CROSS-PLATFORM BUILD UTILITY
 * Handles platform-specific build requirements for Linux, macOS, and Windows
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const platform = os.platform();
const arch = os.arch();

console.log("🚀 Adrata Cross-Platform Build Utility");
console.log(`📊 Platform: ${platform} (${arch})`);
console.log("=====================================\n");

// Platform detection
const isWindows = platform === "win32";
const isMacOS = platform === "darwin";
const isLinux = platform === "linux";

// Build configuration
const BUILD_CONFIG = {
  windows: {
    targets: ["x86_64-pc-windows-msvc"],
    rustFlags: [],
    beforeBuild: () => {
      console.log("🪟 Windows build preparation...");
      // Ensure Windows-specific dependencies
      try {
        execSync("where rustc", { stdio: "ignore" });
        console.log("✅ Rust toolchain found");
      } catch (e) {
        console.error(
          "❌ Rust toolchain not found. Please install Rust from https://rustup.rs/",
        );
        process.exit(1);
      }
    },
    env: {
      // Windows-specific environment variables
      CARGO_TARGET_DIR: path.join(process.cwd(), "src-tauri", "target"),
    },
  },

  darwin: {
    targets: ["universal-apple-darwin"], // Universal binary (Intel + Apple Silicon)
    rustFlags: [],
    beforeBuild: () => {
      console.log("🍎 macOS build preparation...");
      // Ensure macOS targets are installed
      try {
        execSync("rustup target list --installed | grep apple-darwin", {
          stdio: "ignore",
        });
        console.log("✅ Apple Darwin targets found");
      } catch (e) {
        console.log("📦 Installing Apple Darwin targets...");
        execSync("rustup target add aarch64-apple-darwin x86_64-apple-darwin");
        console.log("✅ Apple Darwin targets installed");
      }

      // Check for Xcode
      try {
        execSync("xcode-select --version", { stdio: "ignore" });
        console.log("✅ Xcode command line tools found");
      } catch (e) {
        console.warn(
          "⚠️  Xcode command line tools not found. Install with: xcode-select --install",
        );
      }
    },
    env: {
      // macOS-specific environment variables
      MACOSX_DEPLOYMENT_TARGET: "10.15",
    },
  },

  linux: {
    targets: ["x86_64-unknown-linux-gnu"],
    rustFlags: [],
    beforeBuild: () => {
      console.log("🐧 Linux build preparation...");
      // Check for required system dependencies
      const requiredDeps = [
        "libwebkit2gtk-4.0-dev",
        "libwebkit2gtk-4.1-dev",
        "libappindicator3-dev",
        "librsvg2-dev",
        "patchelf",
        "libasound2-dev",
        "pkg-config",
      ];

      console.log("📦 Checking system dependencies...");
      // Note: This is informational - actual installation requires sudo
      console.log("ℹ️  Required packages:", requiredDeps.join(", "));
      console.log(
        "ℹ️  Install with: sudo apt-get install",
        requiredDeps.join(" "),
      );
    },
    env: {
      // Linux-specific environment variables
      PKG_CONFIG_ALLOW_CROSS: "1",
    },
  },
};

// Environment setup
function setupEnvironment() {
  console.log("🔧 Setting up build environment...");

  const baseEnv = {
    ...process.env,

    // Cross-platform build settings
    NODE_ENV: "production",
    NEXT_PUBLIC_IS_DESKTOP: "true",
    NEXT_PUBLIC_USE_STATIC_EXPORT: "true",
    TAURI_BUILD: "true",

    // Rust settings
    RUST_BACKTRACE: "1",
    CARGO_TERM_COLOR: "always",

    // Node.js memory settings (cross-platform)
    NODE_OPTIONS: "--max-old-space-size=8192",

    // Database (Production Neon for desktop)
    DATABASE_URL:
      "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",

    // Auth settings for desktop
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "desktop-secret-key-for-local-development",
    JWT_SECRET: "desktop-jwt-secret",

    // Workspace configuration
    NEXT_PUBLIC_WORKSPACE_ID: "adrata",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000",
  };

  // Add platform-specific environment variables
  const config = BUILD_CONFIG[platform];
  if (config && config.env) {
    Object.assign(baseEnv, config.env);
  }

  return baseEnv;
}

// Execute command with proper environment
function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Executing: ${command} ${args.join(" ")}`);

    const child = spawn(command, args, {
      stdio: "inherit",
      env: setupEnvironment(),
      shell: isWindows, // Use shell on Windows for npm commands
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

// Main build function
async function build() {
  try {
    console.log("🧹 Cleaning previous builds...");
    await executeCommand("npm", ["run", "clean:full"]);

    // Platform-specific preparation
    const config = BUILD_CONFIG[platform];
    if (config && config.beforeBuild) {
      config.beforeBuild();
    }

    console.log("\n📦 Preparing desktop build...");
    await executeCommand("npm", ["run", "tauri:prep"]);
    await executeCommand("node", ["scripts/prepare-desktop-build.js"]);

    console.log("\n🏗️ Building Next.js application...");
    await executeCommand("npm", ["run", "build"]);

    console.log("\n🔧 Fixing paths...");
    await executeCommand("npm", ["run", "tauri:fix-paths"]);
    await executeCommand("node", ["scripts/restore-desktop-build.js"]);

    console.log("\n🦀 Building Tauri application...");
    const tauriArgs = ["build"];

    // Add platform-specific targets
    if (config && config.targets && config.targets.length > 0) {
      for (const target of config.targets) {
        console.log(`🎯 Building for target: ${target}`);
        await executeCommand("tauri", ["build", "--target", target]);
      }
    } else {
      await executeCommand("tauri", tauriArgs);
    }

    console.log("\n🧹 Cleaning up...");
    await executeCommand("npm", ["run", "tauri:restore"]);
    await executeCommand("npm", ["run", "postdesktop:build"]);

    console.log("\n✅ Cross-platform build completed successfully!");

    // Show build artifacts
    console.log("\n📦 Build artifacts:");
    const targetDir = path.join("src-tauri", "target");
    if (fs.existsSync(targetDir)) {
      if (isWindows) {
        console.log("🪟 Windows: Check src-tauri/target/release/bundle/msi/");
      } else if (isMacOS) {
        console.log(
          "🍎 macOS: Check src-tauri/target/universal-apple-darwin/release/bundle/dmg/",
        );
      } else if (isLinux) {
        console.log(
          "🐧 Linux: Check src-tauri/target/release/bundle/appimage/",
        );
      }
    }
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);

    // Platform-specific troubleshooting
    console.log("\n🔍 Troubleshooting:");
    if (isWindows) {
      console.log("• Ensure Visual Studio Build Tools are installed");
      console.log(
        "• Check that Rust MSVC toolchain is installed: rustup toolchain install stable-msvc",
      );
    } else if (isMacOS) {
      console.log("• Ensure Xcode command line tools: xcode-select --install");
      console.log("• Check Apple Developer signing certificates");
    } else if (isLinux) {
      console.log(
        "• Install WebKit dependencies: sudo apt-get install webkit2gtk-4.0-dev",
      );
      console.log(
        "• Install ALSA audio dependencies: sudo apt-get install libasound2-dev",
      );
      console.log("• Ensure all system dependencies are installed");
    }

    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: node scripts/cross-platform-build.js [options]

Options:
  --help, -h    Show this help message
  --platform    Override platform detection
  --target      Specify custom build target

Examples:
  node scripts/cross-platform-build.js
  node scripts/cross-platform-build.js --platform windows
  node scripts/cross-platform-build.js --target x86_64-pc-windows-msvc

Supported Platforms:
  🪟 Windows (x86_64-pc-windows-msvc)
  🍎 macOS (universal-apple-darwin) 
  🐧 Linux (x86_64-unknown-linux-gnu)
`);
  process.exit(0);
}

// Start the build
build().catch(console.error);
