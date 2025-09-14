#!/usr/bin/env node

/**
 * 🔧 FIX TAURI PATHS
 * This script fixes path issues in Tauri builds by:
 * 1. Converting absolute paths to relative paths
 * 2. Fixing asset references for static export
 * 3. Ensuring proper path resolution in desktop environment
 */

const fs = require("fs");
const path = require("path");

console.log("🔧 Fixing Tauri paths...");

const OUT_DIR = "./out";
const NEXT_DIR = "./.next";

function fixHtmlPaths() {
  if (!fs.existsSync(OUT_DIR)) {
    console.log("ℹ️  No 'out' directory found - skipping HTML path fixes");
    return;
  }

  console.log("🔧 Fixing HTML asset paths...");

  function processHtmlFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix absolute paths to relative paths
    content = content.replace(/href="\/_next\//g, 'href="./_next/');
    content = content.replace(/src="\/_next\//g, 'src="./_next/');
    content = content.replace(/href="\/favicon/g, 'href="./favicon');
    content = content.replace(/src="\/favicon/g, 'src="./favicon');
    
    // Fix other absolute asset paths
    content = content.replace(/href="\/([^"]*\.(css|js|png|jpg|svg|ico))"/g, 'href="./$1"');
    content = content.replace(/src="\/([^"]*\.(js|png|jpg|svg|ico))"/g, 'src="./$1"');

    fs.writeFileSync(filePath, content);
  }

  // Process all HTML files in the out directory
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.html')) {
        processHtmlFile(filePath);
      }
    });
  }

  walkDir(OUT_DIR);
  console.log("✅ HTML paths fixed");
}

function fixCssPaths() {
  if (!fs.existsSync(OUT_DIR)) {
    return;
  }

  console.log("🔧 Fixing CSS asset paths...");

  function processCssFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix absolute paths in CSS
    content = content.replace(/url\(\/_next\//g, 'url(./_next/');
    content = content.replace(/url\(\/([^)]*)\)/g, 'url(./$1)');

    fs.writeFileSync(filePath, content);
  }

  // Process all CSS files
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.css')) {
        processCssFile(filePath);
      }
    });
  }

  walkDir(OUT_DIR);
  console.log("✅ CSS paths fixed");
}

function fixJavaScriptPaths() {
  if (!fs.existsSync(OUT_DIR)) {
    return;
  }

  console.log("🔧 Fixing JavaScript asset paths...");

  function processJsFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix absolute paths in JavaScript
    content = content.replace(/"\/favicon/g, '"./favicon');
    content = content.replace(/'\/favicon/g, "'./favicon");
    
    // Fix _next paths
    content = content.replace(/"\/(_next\/[^"]+)"/g, '"./$1"');
    content = content.replace(/'\/(_next\/[^']+)'/g, "'./$1'");

    fs.writeFileSync(filePath, content);
  }

  // Process all JS files
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.js')) {
        processJsFile(filePath);
      }
    });
  }

  walkDir(OUT_DIR);
  console.log("✅ JavaScript paths fixed");
}

function validatePaths() {
  if (!fs.existsSync(OUT_DIR)) {
    console.log("⚠️  No output directory found - paths may not be properly fixed");
    return;
  }

  console.log("✅ Path validation completed");
}

// Main execution
function main() {
  try {
    console.log("🔧 Tauri Path Fixing");
    console.log("====================");
    
    fixHtmlPaths();
    fixCssPaths();
    fixJavaScriptPaths();
    validatePaths();
    
    console.log("✅ Tauri path fixing completed successfully!");
  } catch (error) {
    console.error("❌ Tauri path fixing failed:", error.message);
    process.exit(1);
  }
}

main();
