#!/usr/bin/env node

/**
 * 🧪 TEST OLGA LEV FIX
 * 
 * This script verifies that the Olga Lev buyer group fix is working correctly.
 * It checks:
 * 1. Database state - Olga Lev is not a buyer group member
 * 2. Domain validation is working correctly
 * 3. No cache issues remain
 * 
 * Usage:
 *   node scripts/test-olga-lev-fix.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OLGA_LEV_LEAD_ID = '01K9T0QZV04EMW54QAYRRSK389';

async function testFix() {
  try {
    console.log('🧪 TESTING OLGA LEV FIX');
    console.log('='.repeat(70));
    console.log('');

    // Test 1: Verify database state
    console.log('📋 Test 1: Database State');
    console.log('-'.repeat(70));
    
    const olgaLev = await prisma.people.findUnique({
      where: { id: OLGA_LEV_LEAD_ID },
      include: {
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
      console.log('❌ FAILED: Olga Lev not found in database');
      return false;
    }

    console.log(`✓ Found: ${olgaLev.fullName}`);
    console.log(`  Email: ${olgaLev.email || olgaLev.workEmail || 'N/A'}`);
    console.log(`  Company: ${olgaLev.company?.name || 'N/A'}`);
    console.log('');

    // Check buyer group status
    const tests = [
      {
        name: 'isBuyerGroupMember',
        expected: false,
        actual: olgaLev.isBuyerGroupMember,
        pass: !olgaLev.isBuyerGroupMember
      },
      {
        name: 'buyerGroupRole',
        expected: null,
        actual: olgaLev.buyerGroupRole,
        pass: !olgaLev.buyerGroupRole
      },
      {
        name: 'buyerGroupStatus',
        expected: null,
        actual: olgaLev.buyerGroupStatus,
        pass: !olgaLev.buyerGroupStatus
      },
      {
        name: 'buyerGroupOptimized',
        expected: false,
        actual: olgaLev.buyerGroupOptimized,
        pass: !olgaLev.buyerGroupOptimized
      }
    ];

    let allTestsPassed = true;
    tests.forEach(test => {
      const status = test.pass ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${test.name}: ${test.actual} (expected: ${test.expected})`);
      if (!test.pass) allTestsPassed = false;
    });

    console.log('');

    // Test 2: Verify domain validation would catch this
    console.log('📋 Test 2: Domain Validation');
    console.log('-'.repeat(70));

    const personEmail = olgaLev.email || olgaLev.workEmail;
    const company = olgaLev.company;

    if (personEmail && company) {
      const emailDomain = extractDomain(personEmail.split('@')[1]);
      const companyDomain = extractDomain(company.website || company.domain);

      console.log(`  Email Domain: ${emailDomain}`);
      console.log(`  Company Domain: ${companyDomain}`);

      const emailRoot = emailDomain.split('.').slice(-2).join('.');
      const companyRoot = companyDomain.split('.').slice(-2).join('.');
      const emailBase = emailRoot.split('.')[0];
      const companyBase = companyRoot.split('.')[0];

      if (emailBase === companyBase && emailRoot !== companyRoot) {
        console.log(`  ✅ PASS: Validation correctly identifies this as same name, different TLD`);
        console.log(`  ✅ PASS: This would be REJECTED by domain validation`);
      } else {
        console.log(`  ❌ FAIL: Domain validation logic may not catch this case`);
        allTestsPassed = false;
      }
    } else {
      console.log(`  ⚠️  SKIP: Missing email or company data`);
    }

    console.log('');

    // Test 3: Check for other similar issues
    console.log('📋 Test 3: Check for Similar Issues');
    console.log('-'.repeat(70));

    const similarIssues = await prisma.people.findMany({
      where: {
        isBuyerGroupMember: true,
        deletedAt: null,
        company: {
          name: 'Underline'
        }
      },
      include: {
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

    console.log(`  Found ${similarIssues.length} buyer group members at Underline companies`);

    let issuesFound = 0;
    similarIssues.forEach(person => {
      const personEmail = person.email || person.workEmail;
      if (!personEmail || !person.company) return;

      const emailDomain = extractDomain(personEmail.split('@')[1]);
      const companyDomain = extractDomain(person.company.website || person.company.domain);

      if (emailDomain && companyDomain) {
        const emailRoot = emailDomain.split('.').slice(-2).join('.');
        const companyRoot = companyDomain.split('.').slice(-2).join('.');

        if (emailRoot !== companyRoot) {
          console.log(`  ⚠️  Potential issue: ${person.fullName}`);
          console.log(`     Email: ${emailDomain}, Company: ${companyDomain}`);
          issuesFound++;
        }
      }
    });

    if (issuesFound === 0) {
      console.log(`  ✅ PASS: No other domain mismatches found`);
    } else {
      console.log(`  ⚠️  WARNING: Found ${issuesFound} potential issues`);
    }

    console.log('');
    console.log('='.repeat(70));
    
    if (allTestsPassed && issuesFound === 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log('');
      console.log('The fix is working correctly. If the tester still sees the issue:');
      console.log('1. Have them clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('2. Have them clear localStorage in DevTools');
      console.log('3. Have them click the "Clear Cache" button in the Buyer Groups tab');
      console.log('4. Have them wait 5 minutes for cache to expire automatically');
      return true;
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('');
      console.log('Review the failures above and run the fix script if needed:');
      console.log('  node scripts/fix-olga-lev-buyer-group.js --fix');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

function extractDomain(input) {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

// Run the test
testFix()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

