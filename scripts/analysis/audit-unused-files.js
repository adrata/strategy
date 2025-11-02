#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * COMPREHENSIVE CODEBASE AUDIT TOOL
 * Finds unused files and verifies file organization
 */

// Files that should be ignored in the audit
const IGNORE_PATTERNS = [
  'node_modules/',
  '.next/',
  'out/',
  'dist/',
  '.git/',
  'scripts/',
  'test-results',
  '__tests__',
  '.spec.',
  '.test.',
  'README.md',
  'LICENSE',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.mjs',
  'tailwind.config.ts',
  'eslint.config.mjs',
  'jest.config.js',
  'prisma/',
  'public/',
  'capacitor.config.ts',
  'src-desktop/',
  '.cursorrules',
  '.gitignore',
  '.nvmrc',
  'vercel.json'
];

// Entry points that start the dependency chain
const ENTRY_POINTS = [
  'src/app',           // Next.js app directory
  'src/middleware.ts', // Next.js middleware
  'src/lib/cli',      // CLI entry points
];

class CodebaseAuditor {
  constructor() {
    this.allFiles = new Set();
    this.usedFiles = new Set();
    this.imports = new Map(); // file -> [imported files]
    this.importedBy = new Map(); // file -> [files that import it]
    this.unusedFiles = new Set();
    this.misplacedFiles = [];
    this.rootDir = process.cwd();
  }

  // Scan all files in the codebase
  scanAllFiles() {
    console.log('🔍 Scanning all files...');
    
    const scan = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.rootDir, fullPath);
        
        // Skip ignored patterns
        if (IGNORE_PATTERNS.some(pattern => relativePath.includes(pattern))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (this.isSourceFile(entry.name)) {
          this.allFiles.add(relativePath);
        }
      }
    };
    
    scan(this.rootDir);
    console.log(`📄 Found ${this.allFiles.size} source files`);
  }

  // Check if file is a source file
  isSourceFile(filename) {
    return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filename);
  }

  // Parse imports from a file
  parseImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = [];
      
      // Match various import patterns
      const patterns = [
        // ES6 imports: import ... from "..."
        /import.*?from\s+['"`]([^'"`]+)['"`]/g,
        // Dynamic imports: import("...")
        /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        // Require statements: require("...")
        /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
        // Next.js dynamic imports: next/dynamic
        /dynamic\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          let importPath = match[1];
          
          // Resolve relative imports
          if (importPath.startsWith('.')) {
            const dir = path.dirname(filePath);
            importPath = path.resolve(dir, importPath);
            importPath = path.relative(this.rootDir, importPath);
          }
          // Handle @ alias imports
          else if (importPath.startsWith('@/')) {
            importPath = importPath.replace('@/', 'src/');
          }
          // Skip external packages
          else if (!importPath.startsWith('src/')) {
            continue;
          }
          
          // Add file extensions if missing
          const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
          let resolvedPath = importPath;
          
          if (!this.isSourceFile(importPath)) {
            for (const ext of possibleExtensions) {
              const withExt = importPath + ext;
              if (fs.existsSync(withExt)) {
                resolvedPath = withExt;
                break;
              }
              
              // Check for index files
              const indexPath = path.join(importPath, 'index' + ext);
              if (fs.existsSync(indexPath)) {
                resolvedPath = indexPath;
                break;
              }
            }
          }
          
          imports.push(resolvedPath);
        }
      }
      
      return imports;
    } catch (error) {
      console.warn(`⚠️ Could not parse ${filePath}: ${error.message}`);
      return [];
    }
  }

  // Build dependency graph
  buildDependencyGraph() {
    console.log('🕸️ Building dependency graph...');
    
    for (const file of this.allFiles) {
      const fullPath = path.join(this.rootDir, file);
      const imports = this.parseImports(fullPath);
      
      this.imports.set(file, imports);
      
      // Build reverse mapping
      for (const importedFile of imports) {
        if (!this.importedBy.has(importedFile)) {
          this.importedBy.set(importedFile, []);
        }
        this.importedBy.get(importedFile).push(file);
      }
    }
  }

  // Mark files as used starting from entry points
  markUsedFiles() {
    console.log('✅ Marking used files...');
    
    const visited = new Set();
    
    const markAsUsed = (file) => {
      if (visited.has(file) || !this.allFiles.has(file)) {
        return;
      }
      
      visited.add(file);
      this.usedFiles.add(file);
      
      const imports = this.imports.get(file) || [];
      for (const importedFile of imports) {
        markAsUsed(importedFile);
      }
    };
    
    // Start from entry points
    for (const entryPoint of ENTRY_POINTS) {
      const scan = (dir) => {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(this.rootDir, fullPath);
            
            if (entry.isDirectory()) {
              scan(fullPath);
            } else if (this.isSourceFile(entry.name)) {
              markAsUsed(relativePath);
            }
          }
        } catch (error) {
          // Directory might not exist
        }
      };
      
      scan(entryPoint);
    }
    
    console.log(`✅ Marked ${this.usedFiles.size} files as used`);
  }

  // Find unused files
  findUnusedFiles() {
    console.log('🗑️ Finding unused files...');
    
    for (const file of this.allFiles) {
      if (!this.usedFiles.has(file)) {
        this.unusedFiles.add(file);
      }
    }
    
    console.log(`🗑️ Found ${this.unusedFiles.size} unused files`);
  }

  // Check file organization
  checkFileOrganization() {
    console.log('📁 Checking file organization...');
    
    const organizationRules = [
      {
        pattern: /^src\/app\//,
        description: 'Next.js app routes',
        allowed: true
      },
      {
        pattern: /^src\/platform\//,
        description: 'Universal platform components',
        allowed: true
      },
      {
        pattern: /^src\/products\//,
        description: 'Product-specific components',
        allowed: true
      },
      {
        pattern: /^src\/lib\//,
        description: 'Legacy lib directory (should be moved to platform)',
        allowed: false,
        suggestion: 'Move to src/platform/'
      },
      {
        pattern: /^src\/components\//,
        description: 'Legacy components directory (should be moved)',
        allowed: false,
        suggestion: 'Move to src/platform/ui/components/ or product-specific folder'
      },
      {
        pattern: /^src\/hooks\//,
        description: 'Legacy hooks directory (should be moved)',
        allowed: false,
        suggestion: 'Move to src/platform/hooks/ or product-specific folder'
      },
      {
        pattern: /^src\/utils\//,
        description: 'Legacy utils directory (should be moved)',
        allowed: false,
        suggestion: 'Move to src/platform/utils/ or product-specific folder'
      }
    ];
    
    for (const file of this.allFiles) {
      for (const rule of organizationRules) {
        if (rule.pattern.test(file) && !rule.allowed) {
          this.misplacedFiles.push({
            file,
            issue: rule.description,
            suggestion: rule.suggestion
          });
        }
      }
    }
    
    console.log(`📁 Found ${this.misplacedFiles.length} misplaced files`);
  }

  // Generate report
  generateReport() {
    console.log('\n📊 CODEBASE AUDIT REPORT');
    console.log('========================\n');
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Total files: ${this.allFiles.size}`);
    console.log(`   Used files: ${this.usedFiles.size}`);
    console.log(`   Unused files: ${this.unusedFiles.size}`);
    console.log(`   Misplaced files: ${this.misplacedFiles.length}`);
    console.log('');
    
    // Unused files
    if (this.unusedFiles.size > 0) {
      console.log('🗑️ UNUSED FILES (candidates for deletion):');
      const sortedUnused = Array.from(this.unusedFiles).sort();
      for (const file of sortedUnused) {
        console.log(`   - ${file}`);
      }
      console.log('');
    }
    
    // Misplaced files
    if (this.misplacedFiles.length > 0) {
      console.log('📁 MISPLACED FILES (need reorganization):');
      for (const item of this.misplacedFiles) {
        console.log(`   - ${item.file}`);
        console.log(`     Issue: ${item.issue}`);
        console.log(`     Suggestion: ${item.suggestion}`);
        console.log('');
      }
    }
    
    // Most imported files
    console.log('🌟 MOST IMPORTED FILES:');
    const importCounts = Array.from(this.importedBy.entries())
      .map(([file, importers]) => ({ file, count: importers.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
      
    for (const { file, count } of importCounts) {
      console.log(`   - ${file} (${count} imports)`);
    }
    console.log('');
    
    // Cleanup recommendations
    console.log('🎯 CLEANUP RECOMMENDATIONS:');
    if (this.unusedFiles.size > 0) {
      console.log(`   1. Delete ${this.unusedFiles.size} unused files`);
    }
    if (this.misplacedFiles.length > 0) {
      console.log(`   2. Reorganize ${this.misplacedFiles.length} misplaced files`);
    }
    if (this.unusedFiles.size === 0 && this.misplacedFiles.length === 0) {
      console.log('   ✅ Codebase is well organized!');
    }
  }

  // Save detailed report to file
  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.allFiles.size,
        usedFiles: this.usedFiles.size,
        unusedFiles: this.unusedFiles.size,
        misplacedFiles: this.misplacedFiles.length
      },
      unusedFiles: Array.from(this.unusedFiles).sort(),
      misplacedFiles: this.misplacedFiles,
      dependencyGraph: Object.fromEntries(this.imports),
      mostImported: Array.from(this.importedBy.entries())
        .map(([file, importers]) => ({ file, importers, count: importers.length }))
        .sort((a, b) => b.count - a.count)
    };
    
    fs.writeFileSync('codebase-audit-report.json', JSON.stringify(report, null, 2));
    console.log('💾 Detailed report saved to codebase-audit-report.json');
  }

  // Main audit function
  async audit() {
    console.log('🚀 Starting comprehensive codebase audit...\n');
    
    this.scanAllFiles();
    this.buildDependencyGraph();
    this.markUsedFiles();
    this.findUnusedFiles();
    this.checkFileOrganization();
    this.generateReport();
    this.saveDetailedReport();
    
    console.log('✅ Audit complete!');
  }
}

// Run the audit
const auditor = new CodebaseAuditor();
auditor.audit().catch(console.error);
