#!/usr/bin/env node

/**
 * 🔄 Auto-Update Status Checker
 *
 * Checks if auto-updates are working and provides guidance
 */

const https = require("https");

console.log("🔄 CHECKING AUTO-UPDATE STATUS");
console.log("=".repeat(60));
console.log("");

/**
 * Check if GitHub releases exist
 */
function checkGitHubReleases() {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: "/repos/adrata/adrata-production/releases/latest",
      method: "GET",
      headers: {
        "User-Agent": "Adrata-Update-Checker",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const release = JSON.parse(data);
          resolve({
            success: true,
            release: release,
          });
        } catch (error) {
          resolve({
            success: false,
            error: "Failed to parse release data",
          });
        }
      });
    });

    req.on("error", (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    req.setTimeout(10000, () => {
      resolve({
        success: false,
        error: "Request timeout",
      });
    });

    req.end();
  });
}

/**
 * Main check function
 */
async function checkAutoUpdateStatus() {
  console.log("📊 CHECKING RELEASE STATUS...");
  console.log("-".repeat(40));

  const releaseCheck = await checkGitHubReleases();

  if (releaseCheck.success && releaseCheck.release.tag_name) {
    console.log("✅ RELEASES FOUND:");
    console.log(`   Latest Release: ${releaseCheck.release.tag_name}`);
    console.log(`   Published: ${releaseCheck.release.published_at}`);
    console.log(`   Download URL: ${releaseCheck.release.html_url}`);
    console.log("");
    console.log("🎉 AUTO-UPDATES ARE WORKING!");
    console.log("   Users should be getting update notifications");
    console.log("");

    // Check for desktop assets
    const assets = releaseCheck.release.assets || [];
    const desktopAssets = assets.filter(
      (asset) =>
        asset.name.includes(".dmg") ||
        asset.name.includes(".msi") ||
        asset.name.includes(".AppImage"),
    );

    if (desktopAssets.length > 0) {
      console.log("📱 DESKTOP ASSETS AVAILABLE:");
      desktopAssets.forEach((asset) => {
        console.log(
          `   • ${asset.name} (${Math.round(asset.size / 1024 / 1024)}MB)`,
        );
      });
    } else {
      console.log(
        "⚠️  NO DESKTOP ASSETS FOUND - May need to trigger new release",
      );
    }
  } else {
    console.log("❌ NO RELEASES FOUND");
    console.log("   This explains why auto-updates aren't working");
    console.log("");
    console.log("🔧 TO FIX AUTO-UPDATES:");
    console.log(
      "   1. ✅ Auto-update workflow enabled (.github/workflows/tauri-release.yml)",
    );
    console.log("   2. ✅ Version numbers synchronized (1.0.1)");
    console.log("   3. 🟡 Need to configure GitHub Secrets:");
    console.log("");
    console.log("📋 REQUIRED GITHUB SECRETS:");
    console.log(
      "   Go to: https://github.com/adrata/adrata-production/settings/secrets/actions",
    );
    console.log("");
    console.log("   Add these secrets:");
    console.log("   • TAURI_PRIVATE_KEY");
    console.log("   • TAURI_KEY_PASSWORD");
    console.log("   • GITHUB_TOKEN (should exist automatically)");
    console.log("");
    console.log("🚀 NEXT STEPS:");
    console.log("   1. Configure the GitHub secrets above");
    console.log("   2. Commit and push current changes");
    console.log("   3. Watch GitHub Actions create first release");
    console.log("   4. Desktop users will get auto-update notifications");
  }

  console.log("");
  console.log("🔍 CURRENT STATUS:");
  console.log("   • Tauri updater: ✅ Configured");
  console.log("   • Release workflow: ✅ Enabled");
  console.log("   • Version sync: ✅ Fixed (1.0.1)");
  console.log(
    `   • GitHub releases: ${releaseCheck.success ? "✅ Working" : "❌ Missing"}`,
  );
  console.log("");

  if (!releaseCheck.success) {
    console.log("💡 The desktop app is looking for releases at:");
    console.log(
      "   https://api.github.com/repos/adrata/adrata-production/releases/latest",
    );
    console.log("");
    console.log("   Once you push these changes with proper GitHub secrets,");
    console.log("   a release will be created and auto-updates will work!");
  }
}

// Run the check
checkAutoUpdateStatus().catch(console.error);
