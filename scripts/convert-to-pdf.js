#!/usr/bin/env node

/**
 * PDF CONVERTER
 * 
 * Converts markdown audit documents to PDF and saves to desktop
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function convertToPDF() {
  console.log('PDF CONVERTER');
  console.log('=' .repeat(50));
  console.log('Converting audit documents to PDF');
  console.log('');

  // Desktop path (macOS)
  const desktopPath = path.join(process.env.HOME, 'Desktop');
  const outputFolder = path.join(desktopPath, 'Adrata-System-Audit');
  
  // Create output folder
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log(`Created folder: ${outputFolder}`);
  }

  const documents = [
    {
      input: 'docs/new-system-audit-printable.md',
      output: path.join(outputFolder, '1-New-System-Complete-Audit.pdf'),
      title: 'New System Complete Audit'
    },
    {
      input: 'docs/old-system-audit-printable.md', 
      output: path.join(outputFolder, '2-Old-System-Detailed-Audit.pdf'),
      title: 'Old System Detailed Audit'
    },
    {
      input: 'docs/system-comparison-printable.md',
      output: path.join(outputFolder, '3-System-Comparison-Analysis.pdf'),
      title: 'System Comparison Analysis'
    }
  ];

  let successCount = 0;
  let totalSize = 0;

  for (const doc of documents) {
    try {
      console.log(`Converting: ${doc.title}`);
      
      // Check if input file exists
      if (!fs.existsSync(doc.input)) {
        console.log(`  Error: Input file not found: ${doc.input}`);
        continue;
      }

      // Try multiple PDF conversion methods
      let converted = false;

      // Method 1: Try pandoc (most common)
      try {
        execSync(`pandoc "${doc.input}" -o "${doc.output}" --pdf-engine=wkhtmltopdf --margin-top=1in --margin-bottom=1in --margin-left=1in --margin-right=1in`, { stdio: 'pipe' });
        converted = true;
        console.log(`  Success: Pandoc conversion`);
      } catch (pandocError) {
        console.log(`  Pandoc not available or failed`);
      }

      // Method 2: Try markdown-pdf
      if (!converted) {
        try {
          execSync(`npx markdown-pdf "${doc.input}" -o "${doc.output}"`, { stdio: 'pipe' });
          converted = true;
          console.log(`  Success: markdown-pdf conversion`);
        } catch (mdPdfError) {
          console.log(`  markdown-pdf not available or failed`);
        }
      }

      // Method 3: Try md-to-pdf
      if (!converted) {
        try {
          execSync(`npx md-to-pdf "${doc.input}" --dest "${doc.output}"`, { stdio: 'pipe' });
          converted = true;
          console.log(`  Success: md-to-pdf conversion`);
        } catch (mdToPdfError) {
          console.log(`  md-to-pdf not available or failed`);
        }
      }

      // Method 4: Create HTML and print instructions
      if (!converted) {
        const htmlOutput = doc.output.replace('.pdf', '.html');
        const markdownContent = fs.readFileSync(doc.input, 'utf8');
        
        // Simple markdown to HTML conversion
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px;
      line-height: 1.6;
      color: #000;
    }
    h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #666; padding-bottom: 5px; margin-top: 30px; }
    h3 { margin-top: 25px; }
    pre, code { 
      background: #f5f5f5; 
      padding: 10px; 
      border: 1px solid #ddd;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    blockquote { 
      border-left: 4px solid #666; 
      margin-left: 0; 
      padding-left: 20px; 
      color: #666;
    }
  </style>
</head>
<body>
${markdownContent
  .replace(/^# /gm, '<h1>')
  .replace(/^## /gm, '</h1><h2>')
  .replace(/^### /gm, '</h2><h3>')
  .replace(/^#### /gm, '</h3><h4>')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/`(.*?)`/g, '<code>$1</code>')
  .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
  .replace(/\n\n/g, '</p><p>')
  .replace(/^(?!<[h|p])/gm, '<p>')
  + '</h4></h3></h2></h1>'
}
</body>
</html>`;
        
        fs.writeFileSync(htmlOutput, htmlContent);
        console.log(`  Created HTML: ${htmlOutput}`);
        console.log(`  To convert to PDF: Open in browser and Print to PDF`);
      }

      // Check if PDF was created
      if (fs.existsSync(doc.output)) {
        const stats = fs.statSync(doc.output);
        totalSize += stats.size;
        successCount++;
        console.log(`  File size: ${(stats.size / 1024).toFixed(1)} KB`);
      }

    } catch (error) {
      console.log(`  Error converting ${doc.title}: ${error.message}`);
    }
    
    console.log('');
  }

  // Summary
  console.log('CONVERSION SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Documents converted: ${successCount}/${documents.length}`);
  console.log(`Output folder: ${outputFolder}`);
  console.log(`Total size: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log('');

  // List created files
  console.log('CREATED FILES:');
  try {
    const files = fs.readdirSync(outputFolder);
    files.forEach(file => {
      const filePath = path.join(outputFolder, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
  } catch (error) {
    console.log('  Error listing files:', error.message);
  }

  console.log('');
  console.log('MANUAL CONVERSION INSTRUCTIONS:');
  console.log('If automatic PDF conversion failed:');
  console.log('1. Open the HTML files in your browser');
  console.log('2. Use browser Print function');
  console.log('3. Select "Save as PDF" as destination');
  console.log('4. Choose appropriate margins and formatting');
}

// Run the converter
if (require.main === module) {
  convertToPDF().catch(console.error);
}

module.exports = { convertToPDF };
