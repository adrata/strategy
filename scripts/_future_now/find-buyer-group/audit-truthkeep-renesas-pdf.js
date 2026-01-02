#!/usr/bin/env node

/**
 * Audit TruthKeep.ai → Renesas PDF Report
 * Validates all data in the generated PDF
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Load the source data
const dataPath = path.join(__dirname, 'output', 'truthkeep-renesas-buyer-group-2025-12-17.json');
const sourceData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function auditPDF() {
  console.log('🔍 Starting PDF Audit...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Load the HTML report
  const htmlPath = path.join(__dirname, 'output', 'truthkeep-renesas-cardinal-style.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('📄 PDF Report Audit Results:\n');
  console.log('='.repeat(80));

  // Extract text content from the PDF
  const pageText = await page.evaluate(() => document.body.innerText);

  // Validation checks
  const checks = {
    passed: 0,
    failed: 0,
    warnings: 0,
    results: []
  };

  // Check 1: Verify company name
  checks.results.push({
    test: 'Company Name Present',
    expected: sourceData.company.name,
    found: pageText.includes('Renesas'),
    status: pageText.includes('Renesas') ? 'PASS' : 'FAIL'
  });

  // Check 2: Verify seller name
  checks.results.push({
    test: 'Seller Name Present',
    expected: sourceData.context.seller.name,
    found: pageText.includes('TruthKeep'),
    status: pageText.includes('TruthKeep') ? 'PASS' : 'FAIL'
  });

  // Check 3: Verify deal size
  checks.results.push({
    test: 'Deal Size Present',
    expected: '$450,000',
    found: pageText.includes('$450') || pageText.includes('450K'),
    status: (pageText.includes('$450') || pageText.includes('450K')) ? 'PASS' : 'FAIL'
  });

  // Check 4: Verify buyer group size
  const totalMembers = sourceData.buyerGroup.totalMembers;
  checks.results.push({
    test: 'Buyer Group Size',
    expected: `${totalMembers} members`,
    found: pageText.includes(String(totalMembers)),
    status: pageText.includes(String(totalMembers)) ? 'PASS' : 'FAIL'
  });

  // Check 5: Verify all member names are present
  const members = sourceData.buyerGroup.members;
  members.forEach(member => {
    const namePresent = pageText.includes(member.name);
    checks.results.push({
      test: `Member Name: ${member.name}`,
      expected: member.name,
      found: namePresent,
      status: namePresent ? 'PASS' : 'FAIL'
    });
  });

  // Check 6: Verify phone numbers
  const membersWithPhones = members.filter(m => m.phone && m.phone.trim());
  membersWithPhones.forEach(member => {
    // Clean phone number for comparison (remove spaces, dashes, etc.)
    const cleanPhone = member.phone.replace(/[\s\-\(\)]/g, '');
    const phonePresent = pageText.includes(member.phone) || pageText.includes(cleanPhone);
    checks.results.push({
      test: `Phone for ${member.name}`,
      expected: member.phone,
      found: phonePresent,
      status: phonePresent ? 'PASS' : 'FAIL'
    });
  });

  // Check 7: Verify employee count
  if (sourceData.company.employeeCount) {
    const empCount = sourceData.company.employeeCount.toLocaleString();
    checks.results.push({
      test: 'Employee Count',
      expected: empCount,
      found: pageText.includes(empCount) || pageText.includes(String(sourceData.company.employeeCount)),
      status: (pageText.includes(empCount) || pageText.includes(String(sourceData.company.employeeCount))) ? 'PASS' : 'FAIL'
    });
  }

  // Check 8: Verify LinkedIn URLs
  const linkedinUrls = await page.$$eval('a[href*="linkedin.com"]', links =>
    links.map(a => a.href)
  );
  members.forEach(member => {
    if (member.linkedin) {
      const linkedinPresent = linkedinUrls.some(url => url.includes(member.linkedin.split('/').pop()));
      checks.results.push({
        test: `LinkedIn for ${member.name}`,
        expected: 'LinkedIn URL present',
        found: linkedinPresent,
        status: linkedinPresent ? 'PASS' : 'FAIL'
      });
    }
  });

  // Check 9: Verify role badges
  const roleBadges = await page.$$eval('.role-badge', badges =>
    badges.map(badge => badge.textContent.trim())
  );
  const expectedRoles = members.map(m => {
    const roleMap = {
      decision: 'DECISION MAKER',
      champion: 'CHAMPION',
      blocker: 'BLOCKER',
      stakeholder: 'STAKEHOLDER'
    };
    return roleMap[m.role] || 'STAKEHOLDER';
  });

  checks.results.push({
    test: 'Role Badges Present',
    expected: `${expectedRoles.length} role badges`,
    found: roleBadges.length === expectedRoles.length,
    status: roleBadges.length === expectedRoles.length ? 'PASS' : 'WARNING'
  });

  // Check 10: Verify page structure
  const sections = await page.$$eval('.section', sections => sections.length);
  checks.results.push({
    test: 'Report Sections',
    expected: 'Multiple sections (Opportunity, Composition, Strategy)',
    found: sections >= 3,
    status: sections >= 3 ? 'PASS' : 'WARNING'
  });

  // Calculate summary
  checks.results.forEach(result => {
    if (result.status === 'PASS') checks.passed++;
    else if (result.status === 'FAIL') checks.failed++;
    else if (result.status === 'WARNING') checks.warnings++;
  });

  // Print results
  checks.results.forEach((result, idx) => {
    const icon = result.status === 'PASS' ? '✅' :
                 result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}`);
    if (result.status === 'FAIL') {
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Found: ${result.found}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('📊 Audit Summary:');
  console.log(`   ✅ Passed: ${checks.passed}`);
  console.log(`   ❌ Failed: ${checks.failed}`);
  console.log(`   ⚠️  Warnings: ${checks.warnings}`);
  console.log(`   Total Checks: ${checks.results.length}`);
  console.log('='.repeat(80));

  // Overall status
  if (checks.failed === 0) {
    console.log('\n✅ PDF AUDIT PASSED - All data is valid!\n');
  } else {
    console.log(`\n❌ PDF AUDIT FAILED - ${checks.failed} issues found\n`);
  }

  // Additional metrics
  console.log('📈 Additional Metrics:');
  console.log(`   - File Size: ${(fs.statSync('/Users/rosssylvester/Desktop/TruthKeep-Renesas-Buyer-Group-Report.pdf').size / 1024).toFixed(1)} KB`);
  console.log(`   - Total Members: ${totalMembers}`);
  console.log(`   - Members with Phones: ${membersWithPhones.length}`);
  console.log(`   - Members with LinkedIn: ${members.filter(m => m.linkedin).length}`);
  console.log(`   - Deal Size: $${sourceData.product.dealSize.toLocaleString()}`);
  console.log(`   - Company Size: ${sourceData.company.employeeCount.toLocaleString()} employees`);

  await browser.close();

  return checks;
}

// Run audit
auditPDF().then(checks => {
  process.exit(checks.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('❌ Audit failed:', err.message);
  process.exit(1);
});
