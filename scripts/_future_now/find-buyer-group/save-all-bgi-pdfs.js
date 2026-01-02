#!/usr/bin/env node

/**
 * Generate PDFs for all BGI reports on the Desktop
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DESKTOP_PATH = '/Users/rosssylvester/Desktop';

// Reports to convert
const reports = [
  {
    html: 'Ramp-PayEntry-BGI-Report.html',
    pdf: 'Ramp-PayEntry-BGI-Report.pdf'
  },
  {
    html: 'Valence-Freshworks-BGI-Report.html',
    pdf: 'Valence-Freshworks-BGI-Report.pdf'
  },
  {
    html: 'ScientificBio-IFF-BGI-Report.html',
    pdf: 'ScientificBio-IFF-BGI-Report.pdf'
  }
];

async function generatePDFs() {
  console.log('Launching browser...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const report of reports) {
    const htmlPath = path.join(DESKTOP_PATH, report.html);
    const pdfPath = path.join(DESKTOP_PATH, report.pdf);

    // Check if HTML exists
    if (!fs.existsSync(htmlPath)) {
      console.log(`⚠️  Skipping ${report.html} - file not found`);
      continue;
    }

    try {
      console.log(`📄 Processing: ${report.html}`);
      
      const page = await browser.newPage();
      
      // Load HTML file
      await page.goto(`file://${htmlPath}`, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate PDF
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '24px',
          right: '24px',
          bottom: '24px',
          left: '24px'
        }
      });
      
      await page.close();
      
      const fileSize = (fs.statSync(pdfPath).size / 1024).toFixed(1);
      console.log(`   ✅ Saved: ${report.pdf} (${fileSize} KB)\n`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  await browser.close();
  
  console.log('='.repeat(50));
  console.log('PDF Generation Complete!');
  console.log('='.repeat(50));
  console.log(`\nFiles saved to: ${DESKTOP_PATH}`);
}

generatePDFs().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

