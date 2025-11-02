#!/usr/bin/env node

/**
 * Generate DMG Background Image
 *
 * This script converts the HTML template to a high-quality PNG image
 * for use as the DMG background in Tauri macOS builds.
 *
 * Usage:
 *   npm install puppeteer
 *   node generate-dmg-background.js
 */

const path = require("path");
const fs = require("fs");

async function generateDMGBackground() {
  console.log("🎨 Generating world-class DMG background...");

  try {
    // Try to load puppeteer
    const puppeteer = require("puppeteer");

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set viewport for Retina @2x rendering
    await page.setViewport({
      width: 1320,
      height: 840,
      deviceScaleFactor: 1,
    });

    // Load the HTML template
    const htmlPath = path.resolve(__dirname, "dmg-background-template.html");
    const htmlContent = fs.readFileSync(htmlPath, "utf-8");

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    // Generate the screenshot
    const outputPath = path.resolve(__dirname, "dmg-background@2x.png");
    await page.screenshot({
      path: outputPath,
      type: "png",
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1320,
        height: 840,
      },
    });

    await browser.close();

    console.log("✅ DMG background generated successfully!");
    console.log(`📁 Saved to: ${outputPath}`);
    console.log("🚀 Ready for world-class Tauri build!");
  } catch (error) {
    console.error("❌ Error generating DMG background:", error);
    process.exit(1);
  }
}

// Alternative method using HTML to Canvas (no puppeteer dependency)
function generateAlternativeInstructions() {
  console.log("\n📋 Alternative Generation Methods:");
  console.log("");
  console.log("Method 1 - Using Browser Dev Tools:");
  console.log("1. Open dmg-background-template.html in Chrome/Safari");
  console.log("2. Press F12 → Console");
  console.log(
    '3. Run: document.querySelector(".dmg-container").style.transform = "scale(1)"',
  );
  console.log('4. Right-click → "Inspect Element" → Select .dmg-container');
  console.log('5. Right-click in Elements → "Capture node screenshot"');
  console.log("6. Save as dmg-background@2x.png");
  console.log("");
  console.log("Method 2 - Using Online Tools:");
  console.log("1. Upload dmg-background-template.html to htmlcsstoimage.com");
  console.log("2. Set width: 1320px, height: 840px");
  console.log("3. Download as PNG and rename to dmg-background@2x.png");
  console.log("");
  console.log("Method 3 - Using Figma/Sketch:");
  console.log("1. Create artboard 1320x840px");
  console.log("2. Copy the design from the HTML preview");
  console.log("3. Export as PNG @2x");
  console.log("");
  console.log("Method 4 - Skip Background (Use Default):");
  console.log('1. Comment out the "background" line in tauri.conf.json');
  console.log("2. Build will use clean default DMG appearance");
}

// Check if puppeteer is available
async function main() {
  try {
    require.resolve("puppeteer");
    await generateDMGBackground();
  } catch (error) {
    console.log("📦 Puppeteer not found. Install with: npm install puppeteer");
    generateAlternativeInstructions();
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateDMGBackground };
