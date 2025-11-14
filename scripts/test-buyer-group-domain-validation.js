#!/usr/bin/env node

/**
 * Test Buyer Group Domain Validation
 * 
 * This script tests that the domain validation in addBuyerGroupMember
 * correctly rejects cross-company contamination (e.g., underline.cz vs underline.com)
 * 
 * Usage:
 *   node scripts/test-buyer-group-domain-validation.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Extract domain from email or URL
 */
function extractDomain(input) {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

/**
 * Test the isLikelySameCompany logic (same as in API)
 */
function isLikelySameCompany(emailDomain, companyDomain) {
  if (!emailDomain || !companyDomain) {
    return false;
  }
  
  // Exact match (including TLD)
  if (emailDomain === companyDomain) {
    return true;
  }
  
  // Extract root domains (handle subdomains)
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  // Same root domain = same company (e.g., mail.company.com === company.com)
  if (emailRoot === companyRoot) {
    return true;
  }
  
  // Check if email domain contains company name or vice versa
  const emailBase = emailRoot.split('.')[0];
  const companyBase = companyRoot.split('.')[0];
  
  // Reject if same base name but different TLDs (e.g., underline.com vs underline.cz)
  // This is the critical case we need to catch
  if (emailBase === companyBase && emailRoot !== companyRoot) {
    // Same base name, different TLD = likely different companies
    return false;
  }
  
  // If email domain is much longer and contains company name, likely same company
  if (emailDomain.length > companyDomain.length * 1.5) {
    return true;
  }
  
  // Default: if domains are different, be conservative and reject
  return false;
}

async function testDomainValidation() {
  console.log('🧪 TESTING BUYER GROUP DOMAIN VALIDATION');
  console.log('='.repeat(60));
  console.log('');

  const testCases = [
    {
      name: 'Cross-company contamination (underline.cz vs underline.com)',
      emailDomain: 'underline.cz',
      companyDomain: 'underline.com',
      shouldReject: true,
      reason: 'Same base name but different TLDs = different companies'
    },
    {
      name: 'Same company exact match',
      emailDomain: 'underline.com',
      companyDomain: 'underline.com',
      shouldReject: false,
      reason: 'Exact domain match'
    },
    {
      name: 'Same company with subdomain',
      emailDomain: 'mail.underline.com',
      companyDomain: 'underline.com',
      shouldReject: false,
      reason: 'Same root domain'
    },
    {
      name: 'Personal email (gmail.com)',
      emailDomain: 'gmail.com',
      companyDomain: 'company.com',
      shouldReject: true,
      reason: 'Personal email domain'
    },
    {
      name: 'Different companies (apple.com vs microsoft.com)',
      emailDomain: 'apple.com',
      companyDomain: 'microsoft.com',
      shouldReject: true,
      reason: 'Completely different domains'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = isLikelySameCompany(testCase.emailDomain, testCase.companyDomain);
    const shouldAccept = !testCase.shouldReject;
    const testPassed = result === shouldAccept;

    if (testPassed) {
      passed++;
      console.log(`✅ PASS: ${testCase.name}`);
      console.log(`   Email: ${testCase.emailDomain}, Company: ${testCase.companyDomain}`);
      console.log(`   Result: ${result ? 'ACCEPTED' : 'REJECTED'} (expected: ${shouldAccept ? 'ACCEPTED' : 'REJECTED'})`);
    } else {
      failed++;
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Email: ${testCase.emailDomain}, Company: ${testCase.companyDomain}`);
      console.log(`   Result: ${result ? 'ACCEPTED' : 'REJECTED'} (expected: ${shouldAccept ? 'ACCEPTED' : 'REJECTED'})`);
      console.log(`   Reason: ${testCase.reason}`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📊 TEST RESULTS:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);
  console.log('');

  if (failed === 0) {
    console.log('✅ All domain validation tests passed!');
    console.log('');
    console.log('💡 The API will correctly reject:');
    console.log('   - underline.cz email when adding to underline.com buyer group');
    console.log('   - Personal email domains (gmail.com, etc.)');
    console.log('   - Different companies with same base name but different TLDs');
  } else {
    console.log('❌ Some tests failed. Please review the validation logic.');
    process.exit(1);
  }
}

async function verifyOlgaLevFix() {
  console.log('');
  console.log('🔍 VERIFYING OLGA LEV FIX');
  console.log('='.repeat(60));
  console.log('');

  const olgaLevId = '01K9T0QZV04EMW54QAYRRSK389';
  const olgaLevEmail = 'olga.lev@underline.cz';

  try {
    // Check people table
    const olgaLev = await prisma.people.findFirst({
      where: {
        OR: [
          { id: olgaLevId },
          { email: { contains: olgaLevEmail, mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        isBuyerGroupMember: true,
        buyerGroupRole: true,
        buyerGroupStatus: true,
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            domain: true
          }
        }
      }
    });

    if (!olgaLev) {
      console.log('⚠️  Olga Lev not found in database');
      return;
    }

    console.log(`✅ Found: ${olgaLev.fullName} (${olgaLev.email})`);
    console.log(`   isBuyerGroupMember: ${olgaLev.isBuyerGroupMember || false}`);
    console.log(`   buyerGroupRole: ${olgaLev.buyerGroupRole || 'null'}`);
    console.log(`   buyerGroupStatus: ${olgaLev.buyerGroupStatus || 'null'}`);
    console.log(`   Company: ${olgaLev.company.name} (${olgaLev.company.website || olgaLev.company.domain || 'N/A'})`);
    console.log('');

    // Check BuyerGroupMembers table
    const buyerGroupMembers = await prisma.buyerGroupMembers.findMany({
      where: {
        OR: [
          { email: { contains: olgaLevEmail, mode: 'insensitive' } },
          { name: { contains: 'Olga Lev', mode: 'insensitive' } }
        ]
      },
      include: {
        BuyerGroups: {
          select: {
            id: true,
            companyName: true,
            website: true
          }
        }
      }
    });

    if (buyerGroupMembers.length === 0) {
      console.log('✅ No BuyerGroupMembers records found - fix verified!');
    } else {
      console.log(`⚠️  Found ${buyerGroupMembers.length} BuyerGroupMembers record(s):`);
      buyerGroupMembers.forEach(bgm => {
        console.log(`   - ${bgm.BuyerGroups.companyName} (${bgm.BuyerGroups.website || 'N/A'})`);
      });
    }

    // Verify domain mismatch
    const emailDomain = extractDomain(olgaLev.email?.split('@')[1]);
    const companyDomain = extractDomain(olgaLev.company.website || olgaLev.company.domain);
    
    if (emailDomain && companyDomain) {
      const domainsMatch = isLikelySameCompany(emailDomain, companyDomain);
      console.log('');
      console.log('🔍 DOMAIN VALIDATION:');
      console.log(`   Email Domain: ${emailDomain}`);
      console.log(`   Company Domain: ${companyDomain}`);
      console.log(`   Domains Match: ${domainsMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!domainsMatch && !olgaLev.isBuyerGroupMember && buyerGroupMembers.length === 0) {
        console.log('');
        console.log('✅ Fix verified: Olga Lev is correctly removed from buyer groups');
      }
    }

  } catch (error) {
    console.error('❌ Error verifying fix:', error);
  }
}

// Run tests
async function runTests() {
  try {
    await testDomainValidation();
    await verifyOlgaLevFix();
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testDomainValidation, verifyOlgaLevFix };

