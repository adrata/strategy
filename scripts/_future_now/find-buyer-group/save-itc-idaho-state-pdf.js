#!/usr/bin/env node

/**
 * Save ITC Systems → Idaho State University Report as PDF to Desktop
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function savePDF() {
  console.log('🚀 Generating PDF...\n');
  
  const htmlPath = path.join(__dirname, 'output', 'itc-idaho-state-buyer-group-2025-12-10.html');
  const pdfPath = '/Users/rosssylvester/Desktop/ITC-IdahoState-BuyerGroup-Report.pdf';
  
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ HTML file not found:', htmlPath);
    process.exit(1);
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Load the HTML file
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Wait for fonts to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate PDF
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    }
  });
  
  await browser.close();
  
  console.log('✅ PDF saved to:', pdfPath);
  console.log('\n📄 File size:', (fs.statSync(pdfPath).size / 1024).toFixed(1), 'KB');
}

savePDF().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
