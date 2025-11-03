/**
 * Script to replace common hardcoded color patterns with theme utilities
 * Focuses on bg-white, bg-gray-*, text-gray-*, border-gray-* patterns
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Color mappings - common patterns to theme utilities
const colorMappings = {
  // Backgrounds
  'bg-white': 'bg-background',
  'bg-gray-50': 'bg-hover',
  'bg-gray-100': 'bg-hover',
  'bg-gray-200': 'bg-muted-light',
  'bg-gray-300': 'bg-muted-light',
  
  // Text colors
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-foreground',
  'text-gray-600': 'text-muted',
  'text-gray-500': 'text-muted',
  'text-gray-400': 'text-muted',
  
  // Border colors
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-400': 'border-border',
  
  // Status colors
  'bg-green-50': 'bg-success/10',
  'bg-green-100': 'bg-success/10',
  'bg-green-200': 'bg-success/20',
  'bg-green-400': 'bg-success',
  'bg-green-500': 'bg-success',
  'bg-green-600': 'bg-success',
  'bg-green-700': 'bg-success',
  'text-green-600': 'text-success',
  'text-green-700': 'text-success',
  'text-green-800': 'text-success',
  'border-green-200': 'border-success',
  
  'bg-yellow-50': 'bg-warning/10',
  'bg-yellow-100': 'bg-warning/10',
  'bg-yellow-200': 'bg-warning/20',
  'bg-yellow-400': 'bg-warning',
  'text-yellow-400': 'text-warning',
  'text-yellow-700': 'text-warning',
  'text-yellow-800': 'text-warning',
  'border-yellow-200': 'border-warning',
  
  'bg-red-50': 'bg-error/10',
  'bg-red-100': 'bg-error/10',
  'bg-red-200': 'bg-error/20',
  'bg-red-400': 'bg-error',
  'bg-red-600': 'bg-error',
  'text-red-600': 'text-error',
  'text-red-700': 'text-error',
  'border-red-200': 'border-error',
  
  'bg-blue-50': 'bg-primary/10',
  'bg-blue-100': 'bg-primary/10',
  'bg-blue-200': 'bg-primary/20',
  'bg-blue-400': 'bg-primary',
  'bg-blue-500': 'bg-primary',
  'bg-blue-600': 'bg-primary',
  'bg-blue-700': 'bg-primary',
  'text-blue-600': 'text-primary',
  'text-blue-700': 'text-primary',
  'text-blue-800': 'text-primary',
  'border-blue-200': 'border-primary',
  'border-blue-300': 'border-primary',
  'border-blue-500': 'border-primary',
  'border-blue-600': 'border-primary',
  
  // Hover states
  'hover:bg-gray-50': 'hover:bg-hover',
  'hover:bg-gray-100': 'hover:bg-hover',
  'hover:text-gray-600': 'hover:text-foreground',
  'hover:text-gray-700': 'hover:text-foreground',
  'hover:text-blue-600': 'hover:text-primary',
  'hover:text-blue-700': 'hover:text-primary',
  'hover:text-blue-800': 'hover:text-primary/80',
  
  // Focus states
  'focus:ring-blue-500': 'focus:ring-primary',
  'focus:border-blue-500': 'focus:border-primary',
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let replacements = 0;
    
    // Apply each mapping
    for (const [pattern, replacement] of Object.entries(colorMappings)) {
      // Match whole class names to avoid partial replacements
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, replacement);
        replacements += matches.length;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ${filePath} (${replacements} replacements)`);
      return replacements;
    }
    
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const targetDirs = args.length > 0 ? args : [
    'src/products/speedrun/components',
    'src/products/pipeline/components',
    'src/products/monaco/components',
    'src/frontend',
    'src/platform/ui/components',
  ];
  
  console.log('Starting hardcoded color replacement...\n');
  
  let totalReplacements = 0;
  let filesProcessed = 0;
  
  for (const dir of targetDirs) {
    const files = await glob(`${dir}/**/*.{tsx,ts}`, {
      ignore: ['**/node_modules/**', '**/.next/**'],
    });
    
    // Ensure files is an array
    const fileArray = Array.isArray(files) ? files : [];
    
    for (const file of fileArray) {
      const replacements = processFile(file);
      if (replacements > 0) {
        totalReplacements += replacements;
        filesProcessed++;
      }
    }
  }
  
  console.log(`\n✅ Complete: ${filesProcessed} files processed, ${totalReplacements} replacements made`);
}

main().catch(console.error);

