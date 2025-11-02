/**
 * Migration Script: CSS Variables to Tailwind Utilities
 * 
 * This script migrates all bg-[var(--...)], text-[var(--...)], etc.
 * patterns to Tailwind utility classes across all files.
 */

const fs = require('fs');
const path = require('path');

// Recursive file finder
function findFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, .git, etc.
      if (!['node_modules', 'dist', 'build', '.git', '.next', 'target'].includes(file)) {
        findFiles(filePath, ext, fileList);
      }
    } else if (file.endsWith(ext)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// CSS Variable to Tailwind Utility Mapping
const mappings = {
  // Core colors
  'bg-[var(--background)]': 'bg-background',
  'text-[var(--background)]': 'text-background',
  'border-[var(--background)]': 'border-background',
  'bg-[var(--foreground)]': 'bg-foreground',
  'text-[var(--foreground)]': 'text-foreground',
  'border-[var(--foreground)]': 'border-foreground',
  'bg-[var(--border)]': 'bg-border',
  'text-[var(--border)]': 'text-border',
  'border-[var(--border)]': 'border-border',
  
  // Muted colors
  'bg-[var(--muted)]': 'bg-muted',
  'text-[var(--muted)]': 'text-muted',
  'border-[var(--muted)]': 'border-muted',
  'bg-[var(--muted-light)]': 'bg-muted-light',
  'text-[var(--muted-light)]': 'text-muted-light',
  'text-[var(--muted-foreground)]': 'text-muted', // Fallback - muted-foreground doesn't exist
  
  // Interactive
  'bg-[var(--hover)]': 'bg-hover',
  'text-[var(--hover)]': 'text-hover',
  'border-[var(--hover)]': 'border-hover',
  'hover:bg-[var(--hover)]': 'hover:bg-hover',
  'hover:text-[var(--hover)]': 'hover:text-hover',
  
  'bg-[var(--accent)]': 'bg-primary',
  'text-[var(--accent)]': 'text-primary',
  'border-[var(--accent)]': 'border-primary',
  'hover:bg-[var(--accent)]': 'hover:bg-primary',
  'hover:text-[var(--accent)]': 'hover:text-primary',
  
  // Panel and UI
  'bg-[var(--panel-background)]': 'bg-panel-background',
  'text-[var(--panel-background)]': 'text-panel-background',
  'border-[var(--panel-background)]': 'border-panel-background',
  'hover:bg-[var(--panel-background)]': 'hover:bg-panel-background',
  
  'bg-[var(--loading-bg)]': 'bg-loading-bg',
  'text-[var(--loading-bg)]': 'text-loading-bg',
  
  // Button colors
  'bg-[var(--button-text)]': 'bg-button-text',
  'text-[var(--button-text)]': 'text-button-text',
  'bg-[var(--button-background)]': 'bg-button-background',
  'text-[var(--button-background)]': 'text-button-background',
  'bg-[var(--button-hover)]': 'bg-button-hover',
  'hover:bg-[var(--button-hover)]': 'hover:bg-button-hover',
  'bg-[var(--button-active)]': 'bg-button-active',
  
  // Status colors
  'bg-[var(--success)]': 'bg-success',
  'text-[var(--success)]': 'text-success',
  'bg-[var(--success-bg)]': 'bg-success-bg',
  'text-[var(--success-text)]': 'text-success-text',
  'border-[var(--success-border)]': 'border-success-border',
  
  'bg-[var(--warning)]': 'bg-warning',
  'text-[var(--warning)]': 'text-warning',
  'bg-[var(--warning-bg)]': 'bg-warning-bg',
  'text-[var(--warning-text)]': 'text-warning-text',
  'border-[var(--warning-border)]': 'border-warning-border',
  
  'bg-[var(--error)]': 'bg-error',
  'text-[var(--error)]': 'text-error',
  'bg-[var(--error-bg)]': 'bg-error-bg',
  'text-[var(--error-text)]': 'text-error-text',
  'border-[var(--error-border)]': 'border-error-border',
  
  'bg-[var(--info)]': 'bg-info',
  'text-[var(--info)]': 'text-info',
  'bg-[var(--info-bg)]': 'bg-info-bg',
  'text-[var(--info-text)]': 'text-info-text',
  'border-[var(--info-border)]': 'border-info-border',
  
  // Status semantic
  'bg-[var(--status-new-bg)]': 'bg-status-new-bg',
  'text-[var(--status-new-text)]': 'text-status-new-text',
  'bg-[var(--status-contacted-bg)]': 'bg-status-contacted-bg',
  'text-[var(--status-contacted-text)]': 'text-status-contacted-text',
  'bg-[var(--status-qualified-bg)]': 'bg-status-qualified-bg',
  'text-[var(--status-qualified-text)]': 'text-status-qualified-text',
  'bg-[var(--status-won-bg)]': 'bg-status-won-bg',
  'text-[var(--status-won-text)]': 'text-status-won-text',
  'bg-[var(--status-lost-bg)]': 'bg-status-lost-bg',
  'text-[var(--status-lost-text)]': 'text-status-lost-text',
  
  // Priority
  'bg-[var(--priority-high-bg)]': 'bg-priority-high-bg',
  'text-[var(--priority-high-text)]': 'text-priority-high-text',
  'bg-[var(--priority-medium-bg)]': 'bg-priority-medium-bg',
  'text-[var(--priority-medium-text)]': 'text-priority-medium-text',
  'bg-[var(--priority-low-bg)]': 'bg-priority-low-bg',
  'text-[var(--priority-low-text)]': 'text-priority-low-text',
  
  // Special
  'bg-[var(--active-app-border)]': 'bg-active-app-border',
  'border-[var(--active-app-border)]': 'border-active-app-border',
  'bg-[var(--overlay-bg)]': 'bg-overlay-bg',
  'bg-[var(--scrollbar-thumb)]': 'bg-scrollbar-thumb',
  
  // Legacy (handle hover-bg as hover)
  'bg-[var(--hover-bg)]': 'bg-hover',
  'hover:bg-[var(--hover-bg)]': 'hover:bg-hover',
  
  // Legacy accent-hover (use accent hover variant if exists, otherwise primary)
  'bg-[var(--accent-hover)]': 'bg-accent-hover',
  'hover:bg-[var(--accent-hover)]': 'hover:bg-accent-hover',
  
  // Ring and outline
  'ring-[var(--accent)]': 'ring-primary',
  'ring-[var(--border)]': 'ring-border',
  'ring-[var(--foreground)]': 'ring-foreground',
  'outline-[var(--accent)]': 'outline-primary',
  'outline-[var(--border)]': 'outline-border',
  
  // Fill and stroke (for SVGs)
  'fill-[var(--foreground)]': 'fill-foreground',
  'fill-[var(--accent)]': 'fill-primary',
  'fill-[var(--muted)]': 'fill-muted',
  'stroke-[var(--foreground)]': 'stroke-foreground',
  'stroke-[var(--accent)]': 'stroke-primary',
  'stroke-[var(--border)]': 'stroke-border',
  
  // Additional border patterns
  'border-l-[var(--border)]': 'border-l-border',
  'border-r-[var(--border)]': 'border-r-border',
  'border-t-[var(--border)]': 'border-t-border',
  'border-b-[var(--border)]': 'border-b-border',
  'border-l-[var(--accent)]': 'border-l-primary',
  'border-r-[var(--accent)]': 'border-r-primary',
  'border-t-[var(--accent)]': 'border-t-primary',
  'border-b-[var(--accent)]': 'border-b-primary',
  
  // Additional hover patterns
  'hover:border-[var(--accent)]': 'hover:border-primary',
  'hover:border-[var(--hover)]': 'hover:border-hover',
  'hover:border-[var(--border)]': 'hover:border-border',
  'hover:text-[var(--accent)]': 'hover:text-primary',
  'hover:text-[var(--foreground)]': 'hover:text-foreground',
  
  // Focus patterns
  'focus:ring-[var(--accent)]': 'focus:ring-primary',
  'focus:border-[var(--accent)]': 'focus:border-primary',
  
  // Additional status color patterns
  'bg-[var(--success)]/10': 'bg-success/10',
  'bg-[var(--warning)]/10': 'bg-warning/10',
  'bg-[var(--error)]/10': 'bg-error/10',
  'bg-[var(--info)]/10': 'bg-info/10',
};

// Order matters - do longer patterns first to avoid partial replacements
const sortedMappings = Object.entries(mappings).sort((a, b) => b[0].length - a[0].length);

async function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply all mappings
    for (const [pattern, replacement] of sortedMappings) {
      if (content.includes(pattern)) {
        content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting CSS variable to Tailwind migration...\n');
  
  // Find all TypeScript/TSX files
  const tsFiles = findFiles('src', '.ts', []);
  const tsxFiles = findFiles('src', '.tsx', []);
  const files = [...tsFiles, ...tsxFiles];
  
  console.log(`Found ${files.length} files to check\n`);
  
  let migrated = 0;
  let totalReplacements = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file contains CSS variable patterns
      if (!content.includes('[var(--')) {
        continue;
      }
      
      // Count occurrences before
      let beforeCount = (content.match(/\[var\(--/g) || []).length;
      
      const wasModified = await migrateFile(file);
      
      if (wasModified) {
        migrated++;
        const afterContent = fs.readFileSync(file, 'utf8');
        let afterCount = (afterContent.match(/\[var\(--/g) || []).length;
        let replaced = beforeCount - afterCount;
        totalReplacements += replaced;
        console.log(`✓ ${file} (${replaced} replacements)`);
      }
    } catch (error) {
      console.error(`✗ ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Files migrated: ${migrated}`);
  console.log(`   Total replacements: ${totalReplacements}`);
}

// Run migration
main().catch(console.error);

