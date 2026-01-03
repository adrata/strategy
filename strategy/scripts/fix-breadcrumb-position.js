#!/usr/bin/env node

/**
 * Script to fix breadcrumb positioning in HTML files
 * Moves breadcrumb to be at the very top, before page-header
 * Changes first breadcrumb link text from "Strategy" to "Search"
 * Removes doc-type elements
 */

const fs = require('fs');
const path = require('path');

const folders = ['docs', 'book', 'reports'];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Pattern 1: Breadcrumb inside page-header after theme-toggle
    // Need to move it to before page-header
    
    // First, change "Strategy" link text to "Search" in breadcrumbs
    if (content.includes('>Strategy</a>') && content.includes('class="breadcrumb"')) {
        content = content.replace(/(<div class="breadcrumb">\s*<a [^>]*>)Strategy(<\/a>)/g, '$1Search$2');
        modified = true;
    }
    
    // Remove doc-type elements
    if (content.includes('class="doc-type"')) {
        content = content.replace(/<div class="doc-type">[^<]*<\/div>\s*/g, '');
        modified = true;
    }
    
    // Check if breadcrumb is inside page-header (bad) and needs to be moved outside
    const breadcrumbInsideHeader = /<div class="page-header">[\s\S]*?<div class="breadcrumb">/;
    if (breadcrumbInsideHeader.test(content)) {
        // Extract breadcrumb
        const breadcrumbMatch = content.match(/<div class="breadcrumb">[\s\S]*?<\/div>\s*(?=<\/div>)/);
        if (breadcrumbMatch) {
            const breadcrumbHtml = breadcrumbMatch[0];
            
            // Remove breadcrumb from its current position
            content = content.replace(/<div class="breadcrumb">[\s\S]*?<\/div>\s*(?=<\/div>\s*<div class="subtitle">|<\/div>\s*<div class="audio-player">)/g, '');
            
            // Add breadcrumb before page-header
            content = content.replace(
                /<div class="page-header">/,
                breadcrumbHtml + '\n<div class="page-header">'
            );
            modified = true;
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
    
    return modified;
}

function processDirectory(dir) {
    const basePath = path.join(__dirname, '..', dir);
    
    function walkDir(currentPath) {
        if (!fs.existsSync(currentPath)) return;
        
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            
            if (entry.isDirectory()) {
                walkDir(fullPath);
            } else if (entry.name.endsWith('.html')) {
                processFile(fullPath);
            }
        }
    }
    
    walkDir(basePath);
}

console.log('Fixing breadcrumb positions...\n');

folders.forEach(folder => {
    console.log(`Processing ${folder}/`);
    processDirectory(folder);
});

console.log('\nDone!');

