#!/usr/bin/env node

/**
 * Get REAL Paradise Valley addresses from Maricopa County Assessor
 * These are actual property records that will match in skip-trace databases
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeMaricopaCounty() {
  console.log('\n🏛️  Scraping Maricopa County Assessor for REAL addresses...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const properties = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // Try Maricopa County Assessor
    console.log('📍 Trying Maricopa County Assessor...');
    await page.goto('https://mcassessor.maricopa.gov/mcs/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    }).catch(() => console.log('   Could not load page'));

    await new Promise(r => setTimeout(r, 3000));

    // Look for search functionality
    const hasSearch = await page.$('input[type="text"], input[type="search"]');
    if (hasSearch) {
      console.log('   Found search box, searching Paradise Valley...');
      await page.type('input[type="text"], input[type="search"]', 'Paradise Valley', { delay: 50 });
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 5000));
    }

    // Extract any addresses found
    const pageData = await page.evaluate(() => {
      const text = document.body.innerText;
      const addresses = [];
      
      // Look for Paradise Valley addresses
      const regex = /(\d{3,5}\s+[NSEW]?\s*[\w\s]+(?:St|Street|Ave|Avenue|Dr|Drive|Rd|Road|Ln|Lane|Blvd|Way|Ct|Pl))[,\s]+Paradise Valley/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        addresses.push(match[1].trim());
      }
      
      return addresses;
    });

    if (pageData.length > 0) {
      console.log(`   ✅ Found ${pageData.length} addresses from Maricopa County`);
      pageData.forEach(addr => properties.push({
        address: addr,
        city: 'Paradise Valley',
        state: 'AZ',
        zip: '85253'
      }));
    }

  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Try Zillow as backup for real addresses
  if (properties.length < 50) {
    console.log('\n📍 Trying Zillow for real addresses...');
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      
      await page.goto('https://www.zillow.com/paradise-valley-az/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await new Promise(r => setTimeout(r, 5000));

      const zillowData = await page.evaluate(() => {
        const addresses = [];
        
        // Look for property cards
        const cards = document.querySelectorAll('[data-test="property-card"], article, .list-card');
        cards.forEach(card => {
          const text = card.textContent;
          const match = text.match(/(\d{3,5}\s+[NSEW]?\s*[\w\s]+(?:St|Ave|Dr|Rd|Ln|Blvd|Way|Ct|Pl))/i);
          if (match) {
            addresses.push(match[1].trim());
          }
        });

        // Also try address elements
        const addrElements = document.querySelectorAll('address, [data-test="property-card-addr"]');
        addrElements.forEach(el => {
          const text = el.textContent;
          if (text.includes('Paradise Valley') || text.includes('85253') || text.includes('85254') || text.includes('85255')) {
            const match = text.match(/(\d{3,5}\s+[\w\s]+)/);
            if (match) addresses.push(match[1].trim());
          }
        });

        return addresses;
      });

      if (zillowData.length > 0) {
        console.log(`   ✅ Found ${zillowData.length} addresses from Zillow`);
        zillowData.forEach(addr => properties.push({
          address: addr,
          city: 'Paradise Valley',
          state: 'AZ',
          zip: '85253'
        }));
      }
    } catch (error) {
      console.log(`   Zillow error: ${error.message}`);
    }
  }

  // Try Redfin
  if (properties.length < 50) {
    console.log('\n📍 Trying Redfin for real addresses...');
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      
      await page.goto('https://www.redfin.com/city/14407/AZ/Paradise-Valley', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await new Promise(r => setTimeout(r, 5000));

      const redfinData = await page.evaluate(() => {
        const addresses = [];
        
        // Look for home cards
        const cards = document.querySelectorAll('.HomeCard, .homecard, [class*="HomeCard"]');
        cards.forEach(card => {
          const addrEl = card.querySelector('.homeAddressV2, .address, [class*="address"]');
          if (addrEl) {
            const text = addrEl.textContent.trim();
            const match = text.match(/(\d{3,5}\s+[\w\s]+(?:St|Ave|Dr|Rd|Ln|Blvd|Way|Ct|Pl))/i);
            if (match) addresses.push(match[1].trim());
          }
        });

        // Fallback: look for any address patterns
        const allText = document.body.innerText;
        const regex = /(\d{4,5}\s+[NSEW]?\s*[\w\s]+(?:St|Ave|Dr|Rd|Ln|Blvd|Way|Ct|Pl))[,\s]*(Paradise Valley|85253|85254|85255)/gi;
        let match;
        while ((match = regex.exec(allText)) !== null) {
          addresses.push(match[1].trim());
        }

        return [...new Set(addresses)];
      });

      if (redfinData.length > 0) {
        console.log(`   ✅ Found ${redfinData.length} addresses from Redfin`);
        redfinData.forEach(addr => properties.push({
          address: addr,
          city: 'Paradise Valley',
          state: 'AZ',
          zip: '85253'
        }));
      }
    } catch (error) {
      console.log(`   Redfin error: ${error.message}`);
    }
  }

  await browser.close();

  // Deduplicate
  const unique = [...new Map(properties.map(p => [p.address.toLowerCase(), p])).values()];
  
  console.log(`\n📊 Total unique REAL addresses found: ${unique.length}`);
  
  // Save to file
  if (unique.length > 0) {
    const csvPath = path.join(__dirname, 'real-paradise-valley-addresses.csv');
    const csv = ['address,city,state,zip', ...unique.map(p => `"${p.address}","${p.city}","${p.state}","${p.zip}"`)].join('\n');
    fs.writeFileSync(csvPath, csv);
    console.log(`💾 Saved to: ${csvPath}`);
  }

  return unique;
}

scrapeMaricopaCounty().then(properties => {
  console.log('\n✅ Done!');
  if (properties.length > 0) {
    console.log('\nSample addresses:');
    properties.slice(0, 10).forEach(p => console.log(`  - ${p.address}`));
  }
}).catch(console.error);












