/**
 * Script to add breadcrumbs and copy-menu.js to all HTML documents
 */

const fs = require('fs');
const path = require('path');

// Files to process
const docsDir = path.join(__dirname, '..', 'docs');

// Category mappings based on folder
const categoryMap = {
    'foundations': 'Foundations',
    'strategy': 'Strategy',
    'playbooks': 'Playbooks',
    'standards': 'Standards',
    'internal-docs': 'Internal',
    'talks': 'Talks',
    'internal': 'Internal',
    'external': 'External'
};

// Breadcrumb CSS (only add if not already present)
const breadcrumbCSS = `
        .breadcrumb { font-size: 13px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .breadcrumb a { color: var(--accent); text-decoration: none; font-weight: 600; }
        .breadcrumb .separator { color: var(--text-muted); }
        .breadcrumb .current { color: var(--text-muted); }`;

// Process a single file
function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Calculate relative path to search.html and js/copy-menu.js
    const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '..'));
    const searchPath = relativePath ? `${relativePath}/search.html` : 'search.html';
    const copyMenuPath = relativePath ? `${relativePath}/js/copy-menu.js` : 'js/copy-menu.js';
    
    // Get category from path
    const parts = filePath.split(path.sep);
    const docsIndex = parts.indexOf('docs');
    let category = 'Docs';
    if (docsIndex !== -1 && parts[docsIndex + 1]) {
        const folder = parts[docsIndex + 1];
        if (folder === 'articles' && parts[docsIndex + 2]) {
            category = categoryMap[parts[docsIndex + 2]] || 'Article';
        } else {
            category = categoryMap[folder] || folder.charAt(0).toUpperCase() + folder.slice(1);
        }
    }
    
    // Get page name from title
    const titleMatch = content.match(/<title>([^|<]+)/);
    const pageName = titleMatch ? titleMatch[1].trim() : 'Document';
    
    // 1. Add breadcrumb CSS if missing
    if (!content.includes('.breadcrumb')) {
        // Find the closing </style> tag and add CSS before it
        const styleEndIndex = content.lastIndexOf('</style>');
        if (styleEndIndex !== -1) {
            content = content.slice(0, styleEndIndex) + breadcrumbCSS + '\n    ' + content.slice(styleEndIndex);
            modified = true;
            console.log(`  + Added breadcrumb CSS`);
        }
    }
    
    // 2. Add breadcrumb HTML if missing
    if (!content.includes('class="breadcrumb"')) {
        // Find the <body> tag and the first major content after theme-toggle
        const bodyMatch = content.match(/<body[^>]*>/);
        if (bodyMatch) {
            const bodyIndex = content.indexOf(bodyMatch[0]) + bodyMatch[0].length;
            
            // Check if there's already a theme-toggle
            const themeToggleEnd = content.indexOf('</button>', bodyIndex);
            if (themeToggleEnd !== -1 && content.slice(bodyIndex, themeToggleEnd + 10).includes('theme-toggle')) {
                // Insert after the theme toggle button
                const insertIndex = themeToggleEnd + '</button>'.length;
                const breadcrumbHTML = `
    
    <div class="breadcrumb">
        <a href="${searchPath}">Strategy</a>
        <span class="separator">/</span>
        <span class="current">${category}</span>
    </div>`;
                content = content.slice(0, insertIndex) + breadcrumbHTML + content.slice(insertIndex);
                modified = true;
                console.log(`  + Added breadcrumb HTML`);
            }
        }
    }
    
    // 3. Add copy-menu.js if missing
    if (!content.includes('copy-menu.js')) {
        // Add before </body>
        const bodyEndIndex = content.lastIndexOf('</body>');
        if (bodyEndIndex !== -1) {
            const scriptTag = `<script src="${copyMenuPath}"></script>\n`;
            content = content.slice(0, bodyEndIndex) + scriptTag + content.slice(bodyEndIndex);
            modified = true;
            console.log(`  + Added copy-menu.js`);
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

// Recursively find all HTML files
function findHtmlFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findHtmlFiles(fullPath, files);
        } else if (entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Main
console.log('Adding breadcrumbs and copy-menu.js to all docs...\n');

const htmlFiles = findHtmlFiles(docsDir);
let modifiedCount = 0;

for (const file of htmlFiles) {
    const relativeName = path.relative(path.join(__dirname, '..'), file);
    console.log(`Processing: ${relativeName}`);
    
    if (processFile(file)) {
        modifiedCount++;
    } else {
        console.log('  (no changes needed)');
    }
}

console.log(`\nDone! Modified ${modifiedCount} of ${htmlFiles.length} files.`);

