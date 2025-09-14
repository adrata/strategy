/**
 * Generate Buyer Group Methodology PDF from HTML
 * Usage: node scripts/generate-methodology-pdf.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const htmlPath = path.join(__dirname, '../docs/adrata-buyer-group-methodology.html');
  const outputPath = path.join(__dirname, '../docs/adrata-buyer-group-methodology.pdf');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ HTML file not found:', htmlPath);
    process.exit(1);
  }

  console.log('🚀 Generating PDF from HTML...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Load the HTML file
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  // More robust load for local HTML: set a basic HTML wrapper and inject content
  await page.goto('about:blank');
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
  // Small delay for fonts/styles without using waitForTimeout (compat)
  await new Promise(r => setTimeout(r, 1200));
  
  // Generate PDF with professional settings
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; font-size:8px; color:#666; width:100%; padding:6px 20px; display:flex; justify-content:space-between;">
        <span>Adrata Buyer Group Intelligence</span>
        <span>https://adrata.com</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; font-size:8px; color:#666; width:100%; padding:6px 20px; display:flex; justify-content:center;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
    // Scale to ensure header/footer visible
    scale: 0.98
  });
  
  await browser.close();
  
  console.log(`✅ PDF generated successfully: ${outputPath}`);
  console.log(`📄 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
}

generatePDF().catch(err => {
  console.error('❌ Error generating PDF:', err);
  process.exit(1);
});
