#!/usr/bin/env node

/**
 * Verify paper.adrata.com subdomain configuration
 * Checks DNS resolution and provides setup instructions
 */

const { execSync } = require("child_process");
const dns = require("dns").promises;

async function verifyDNS() {
  console.log("🔍 Verifying paper.adrata.com DNS configuration...\n");

  try {
    // Check if paper.adrata.com resolves
    console.log("Testing DNS resolution...");
    const addresses = await dns.resolve4("paper.adrata.com");
    console.log("✅ paper.adrata.com resolves to:", addresses);

    // Check CNAME record
    try {
      const cname = await dns.resolveCname("paper.adrata.com");
      console.log("✅ CNAME record found:", cname);
    } catch (err) {
      console.log("ℹ️  No CNAME record (this is okay if using A record)");
    }

    return true;
  } catch (error) {
    console.log("❌ DNS resolution failed:", error.message);
    return false;
  }
}

async function testHTTPSAccess() {
  console.log("\n🌐 Testing HTTPS access...");

  try {
    // Use curl to test HTTPS access
    const result = execSync(
      'curl -I https://paper.adrata.com/test123 2>/dev/null || echo "FAILED"',
      {
        encoding: "utf8",
        timeout: 10000,
      },
    );

    if (result.includes("HTTP/")) {
      console.log("✅ HTTPS access working");
      console.log("Response headers:", result.split("\n")[0]);
      return true;
    } else {
      console.log("❌ HTTPS access failed");
      return false;
    }
  } catch (error) {
    console.log("❌ HTTPS test failed:", error.message);
    return false;
  }
}

function provideDNSInstructions() {
  console.log("\n" + "=".repeat(80));
  console.log("📋 DNS CONFIGURATION INSTRUCTIONS");
  console.log("=".repeat(80));

  console.log("\n🔧 Cloudflare DNS Setup:");
  console.log("1. Go to https://dash.cloudflare.com");
  console.log("2. Select the adrata.com domain");
  console.log("3. Go to DNS > Records");
  console.log("4. Add a new CNAME record:");
  console.log("   - Type: CNAME");
  console.log("   - Name: paper");
  console.log("   - Target: cname.vercel-dns.com");
  console.log("   - Proxy status: DNS only (gray cloud)");
  console.log("   - TTL: Auto");

  console.log("\n⚡ Vercel Configuration:");
  console.log("1. Go to https://vercel.com/dashboard");
  console.log("2. Select your adrata project");
  console.log("3. Go to Settings > Domains");
  console.log("4. Add domain: paper.adrata.com");
  console.log("5. Configure to serve the same content as main domain");

  console.log("\n🔍 Verification Commands:");
  console.log("After DNS propagation (5-10 minutes):");
  console.log("- dig paper.adrata.com");
  console.log("- nslookup paper.adrata.com");
  console.log("- curl -I https://paper.adrata.com");
}

function provideShareLinkInstructions() {
  console.log("\n" + "=".repeat(80));
  console.log("🔗 SHARE LINK FUNCTIONALITY");
  console.log("=".repeat(80));

  console.log("\n✅ Current Implementation:");
  console.log(
    "- Share links generate unique URLs like: https://paper.adrata.com/abc123def4",
  );
  console.log("- Copy button copies the URL to clipboard");
  console.log("- Launch button opens the URL in a new browser tab");
  console.log('- "Back to Profile" only shows when inside the main platform');
  console.log("- Share controls hidden when viewing on paper.adrata.com");

  console.log("\n🎯 User Experience:");
  console.log(
    '1. Inside platform: User sees "Back to Profile" + Share controls',
  );
  console.log("2. External sharing: Clean report view without platform UI");
  console.log("3. Copy button: Turns to black checkmark when copied");
  console.log("4. Launch button: Opens shared report in browser");

  console.log("\n🔧 Next Steps:");
  console.log("1. Fix DNS configuration (see instructions above)");
  console.log("2. Test share link generation");
  console.log("3. Verify external viewing experience");
  console.log("4. Test copy/launch button functionality");
}

async function main() {
  console.log("🚀 Paper Subdomain Verification Tool\n");

  // Test DNS resolution
  const dnsWorking = await verifyDNS();

  // Test HTTPS access
  const httpsWorking = await testHTTPSAccess();

  // Overall status
  console.log("\n" + "=".repeat(80));
  console.log("📊 VERIFICATION RESULTS");
  console.log("=".repeat(80));

  console.log(`DNS Resolution: ${dnsWorking ? "✅ WORKING" : "❌ FAILED"}`);
  console.log(`HTTPS Access: ${httpsWorking ? "✅ WORKING" : "❌ FAILED"}`);

  if (dnsWorking && httpsWorking) {
    console.log("\n🎉 paper.adrata.com is properly configured!");
    console.log("✅ Share links should work correctly");
  } else {
    console.log("\n⚠️  paper.adrata.com needs configuration");
    console.log("❌ Share links will not work until DNS is fixed");
  }

  // Provide setup instructions
  provideDNSInstructions();
  provideShareLinkInstructions();

  console.log("\n✅ Verification complete!");
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifyDNS, testHTTPSAccess };
