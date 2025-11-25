#!/usr/bin/env node

/**
 * Tauri Diagnostic Script
 * Identifies common Tauri integration issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Tauri Integration Diagnostic\n');
console.log('='.repeat(60));

const issues = [];
const warnings = [];
const info = [];

// 1. Check Tauri dependencies
console.log('\n1. Checking Tauri Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const tauriDeps = Object.keys(packageJson.dependencies || {})
    .filter(dep => dep.includes('tauri'));
  
  if (tauriDeps.length > 0) {
    info.push(`Found ${tauriDeps.length} Tauri dependencies: ${tauriDeps.join(', ')}`);
    
    // Check for version mismatches
    const versions = tauriDeps.map(dep => ({
      name: dep,
      version: packageJson.dependencies[dep]
    }));
    
    const majorVersions = versions.map(v => v.version.match(/^(\d+)/)?.[1]);
    const uniqueVersions = [...new Set(majorVersions)];
    
    if (uniqueVersions.length > 1) {
      issues.push(`Version mismatch detected: Multiple Tauri major versions found (${uniqueVersions.join(', ')})`);
    }
  } else {
    warnings.push('No Tauri dependencies found in package.json');
  }
} catch (error) {
  issues.push(`Failed to read package.json: ${error.message}`);
}

// 2. Check Rust/Cargo setup
console.log('2. Checking Rust/Cargo Setup...');
const cargoTomlPaths = [
  'src-desktop/Cargo.toml',
  'src-tauri/Cargo.toml'
];

let foundCargo = false;
for (const cargoPath of cargoTomlPaths) {
  if (fs.existsSync(cargoPath)) {
    foundCargo = true;
    info.push(`Found Cargo.toml at: ${cargoPath}`);
    
    try {
      const cargoContent = fs.readFileSync(cargoPath, 'utf8');
      const tauriVersion = cargoContent.match(/tauri\s*=\s*\{[^}]*version\s*=\s*"([^"]+)"/)?.[1];
      if (tauriVersion) {
        info.push(`Tauri Rust version: ${tauriVersion}`);
      }
    } catch (error) {
      warnings.push(`Could not parse ${cargoPath}: ${error.message}`);
    }
  }
}

if (!foundCargo) {
  issues.push('No Cargo.toml found - Rust backend may be missing');
}

// 3. Check Tauri config files
console.log('3. Checking Tauri Configuration...');
const tauriConfigPaths = [
  'src-desktop/tauri.conf.json',
  'src-tauri/tauri.conf.json'
];

let foundConfig = false;
for (const configPath of tauriConfigPaths) {
  if (fs.existsSync(configPath)) {
    foundConfig = true;
    info.push(`Found Tauri config at: ${configPath}`);
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.build?.frontendDist) {
        const distPath = config.build.frontendDist;
        if (!fs.existsSync(distPath)) {
          warnings.push(`Frontend dist path doesn't exist: ${distPath}`);
        } else {
          info.push(`Frontend dist path exists: ${distPath}`);
        }
      }
    } catch (error) {
      issues.push(`Invalid JSON in ${configPath}: ${error.message}`);
    }
  }
}

if (!foundConfig) {
  issues.push('No Tauri config file found');
}

// 4. Check Next.js config for Tauri
console.log('4. Checking Next.js Configuration...');
if (fs.existsSync('next.config.mjs')) {
  const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
  
  if (nextConfig.includes('TAURI_BUILD')) {
    info.push('next.config.mjs contains Tauri build logic');
    
    if (nextConfig.includes('output: isDesktop ? \'export\' : undefined')) {
      info.push('Static export is conditionally enabled for desktop');
    } else if (nextConfig.includes('output: \'export\'')) {
      warnings.push('Static export is always enabled - may break web builds');
    }
  } else {
    warnings.push('next.config.mjs does not contain Tauri build logic');
  }
} else {
  warnings.push('next.config.mjs not found');
}

// 5. Check platform detection
console.log('5. Checking Platform Detection...');
const platformDetectionPath = 'src/platform/platform-detection.ts';
if (fs.existsSync(platformDetectionPath)) {
  const platformCode = fs.readFileSync(platformDetectionPath, 'utf8');
  
  if (platformCode.includes('__TAURI__')) {
    info.push('Platform detection includes Tauri runtime checks');
  }
  
  if (platformCode.includes('Safari')) {
    warnings.push('Platform detection contains Safari compatibility hacks - may indicate issues');
  }
  
  if (platformCode.includes('tauri:')) {
    warnings.push('Platform detection checks for tauri: protocol');
  }
} else {
  warnings.push('Platform detection file not found');
}

// 6. Check build scripts
console.log('6. Checking Build Scripts...');
const buildScripts = fs.readdirSync('scripts').filter(f => 
  f.includes('tauri') || f.includes('desktop')
);

if (buildScripts.length > 0) {
  info.push(`Found ${buildScripts.length} Tauri/desktop build scripts`);
  
  if (buildScripts.length > 5) {
    warnings.push(`Many build scripts found (${buildScripts.length}) - may indicate complexity issues`);
  }
} else {
  warnings.push('No Tauri build scripts found');
}

// 7. Check for Tauri usage in code
console.log('7. Checking Code Usage...');
function findTauriUsage(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.next', 'out', 'dist', 'target'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

const srcFiles = findTauriUsage('src');
let tauriUsageCount = 0;
const tauriUsageFiles = [];

for (const file of srcFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('@tauri-apps') || 
        content.includes('__TAURI__') || 
        content.includes('invoke(') ||
        content.includes('TAURI_BUILD')) {
      tauriUsageCount++;
      tauriUsageFiles.push(file);
    }
  } catch (error) {
    // Skip files that can't be read
  }
}

info.push(`Found Tauri usage in ${tauriUsageCount} source files`);
if (tauriUsageCount > 50) {
  warnings.push(`High Tauri usage (${tauriUsageCount} files) - may be tightly integrated`);
}

// 8. Check package.json scripts
console.log('8. Checking Package.json Scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const tauriScripts = Object.keys(scripts).filter(s => 
    s.includes('tauri') || s.includes('desktop')
  );
  
  if (tauriScripts.length > 0) {
    info.push(`Found ${tauriScripts.length} Tauri/desktop scripts in package.json`);
  } else {
    warnings.push('No Tauri scripts found in package.json');
  }
} catch (error) {
  issues.push(`Failed to read package.json scripts: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 DIAGNOSTIC SUMMARY\n');

if (issues.length > 0) {
  console.log('❌ ISSUES FOUND:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log();
}

if (info.length > 0) {
  console.log('ℹ️  INFO:');
  info.forEach(item => console.log(`   - ${item}`));
  console.log();
}

// Recommendations
console.log('💡 RECOMMENDATIONS:\n');

if (issues.length > 0) {
  console.log('1. Fix critical issues first:');
  issues.slice(0, 3).forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  console.log();
}

if (warnings.length > 5) {
  console.log('2. High warning count suggests complexity - consider:');
  console.log('   - Simplifying build pipeline');
  console.log('   - Consolidating platform detection');
  console.log('   - Removing unnecessary workarounds');
  console.log();
}

if (tauriUsageCount > 50) {
  console.log('3. High integration level detected:');
  console.log('   - Consider if desktop is essential');
  console.log('   - If yes, invest in fixing Tauri');
  console.log('   - If no, consider removing desktop support');
  console.log();
}

console.log('📖 For detailed analysis, see: docs/tauri-integration-analysis.md\n');

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);

