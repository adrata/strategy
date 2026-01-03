#!/usr/bin/env node

/**
 * Audit Phone Numbers in Notary Everyday Workspace
 * 
 * Check for issues with phone number processing, especially:
 * - +61 (Australia) numbers that might be incorrectly flagged
 * - Numbers that look incomplete
 * - Foreign numbers that were deleted
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');

const prisma = new PrismaClient();
const phoneUtil = PhoneNumberUtil.getInstance();

const WORKSPACE_SLUG = 'notary-everyday';
const TARGET_NUMBER = '+61 466 498 700'; // The number Noel mentioned

async function auditNotaryPhoneNumbers() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find Notary Everyday workspace
    console.log('🔍 Finding Notary Everyday workspace...');
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Check the specific number Noel mentioned
    console.log('='.repeat(80));
    console.log('CHECKING NOEL\'S NUMBER: +61 466 498 700');
    console.log('='.repeat(80));
    
    const cleanedTarget = TARGET_NUMBER.replace(/\s/g, '');
    console.log(`Searching for: ${cleanedTarget}\n`);

    // Search for this number in people
    const peopleWithTargetNumber = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { phone: { contains: '466498700', mode: 'insensitive' } },
          { phone: { contains: '466 498 700', mode: 'insensitive' } },
          { phone: { contains: '+61466498700', mode: 'insensitive' } },
          { mobilePhone: { contains: '466498700', mode: 'insensitive' } },
          { workPhone: { contains: '466498700', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        email: true,
        updatedAt: true
      }
    });

    console.log(`Found ${peopleWithTargetNumber.length} people with this number:\n`);
    peopleWithTargetNumber.forEach((person, i) => {
      console.log(`${i + 1}. ${person.fullName || 'N/A'}`);
      console.log(`   Phone: ${person.phone || 'N/A'}`);
      console.log(`   Mobile: ${person.mobilePhone || 'N/A'}`);
      console.log(`   Work: ${person.workPhone || 'N/A'}`);
      console.log(`   Updated: ${person.updatedAt}`);
      console.log('');
    });

    // Validate the number format
    try {
      const parsed = phoneUtil.parse(cleanedTarget, 'AU');
      const isValid = phoneUtil.isValidNumber(parsed);
      const country = phoneUtil.getRegionCodeForNumber(parsed);
      const formatted = phoneUtil.format(parsed, PhoneNumberFormat.E164);
      const national = phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL);
      
      console.log('Phone Number Validation:');
      console.log(`   Valid: ${isValid ? '✅' : '❌'}`);
      console.log(`   Country: ${country || 'Unknown'}`);
      console.log(`   E164 Format: ${formatted}`);
      console.log(`   National Format: ${national}`);
      console.log(`   Number Type: ${phoneUtil.getNumberType(parsed)}`);
      console.log('');
    } catch (error) {
      console.log(`   ⚠️  Validation error: ${error.message}`);
      console.log('');
    }

    // Check all +61 numbers in the workspace
    console.log('='.repeat(80));
    console.log('CHECKING ALL +61 (AUSTRALIA) NUMBERS');
    console.log('='.repeat(80));
    
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        OR: [
          { phone: { contains: '+61', mode: 'insensitive' } },
          { phone: { contains: '61', mode: 'insensitive' } },
          { mobilePhone: { contains: '+61', mode: 'insensitive' } },
          { mobilePhone: { contains: '61', mode: 'insensitive' } },
          { workPhone: { contains: '+61', mode: 'insensitive' } },
          { workPhone: { contains: '61', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        email: true,
        updatedAt: true
      }
    });

    console.log(`Found ${allPeople.length} people with +61 numbers\n`);

    // Analyze each +61 number
    const analysis = {
      valid: [],
      invalid: [],
      incomplete: [],
      otherIssues: []
    };

    for (const person of allPeople) {
      const phones = [
        { field: 'phone', value: person.phone },
        { field: 'mobilePhone', value: person.mobilePhone },
        { field: 'workPhone', value: person.workPhone }
      ].filter(p => p.value && (p.value.includes('+61') || p.value.includes('61')));

      for (const { field, value } of phones) {
        try {
          // Clean the number
          let cleaned = value.replace(/\s/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
          
          // Ensure it starts with +
          if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('61')) {
              cleaned = '+' + cleaned;
            } else if (cleaned.startsWith('0') && cleaned.length > 10) {
              // Australian format starting with 0
              cleaned = '+61' + cleaned.substring(1);
            }
          }

          const parsed = phoneUtil.parse(cleaned, 'AU');
          const isValid = phoneUtil.isValidNumber(parsed);
          const country = phoneUtil.getRegionCodeForNumber(parsed);
          const formatted = phoneUtil.format(parsed, PhoneNumberFormat.E164);
          
          // Check if number looks incomplete (less than expected digits)
          const digitsOnly = cleaned.replace(/\D/g, '');
          const isIncomplete = digitsOnly.length < 10 || digitsOnly.length > 15;

          const result = {
            personId: person.id,
            personName: person.fullName,
            field,
            original: value,
            cleaned,
            formatted,
            isValid,
            country,
            isIncomplete,
            digitsOnly: digitsOnly.length
          };

          if (isIncomplete) {
            analysis.incomplete.push(result);
          } else if (!isValid) {
            analysis.invalid.push(result);
          } else {
            analysis.valid.push(result);
          }
        } catch (error) {
          analysis.otherIssues.push({
            personId: person.id,
            personName: person.fullName,
            field,
            original: value,
            error: error.message
          });
        }
      }
    }

    console.log('Analysis Results:');
    console.log(`   ✅ Valid +61 numbers: ${analysis.valid.length}`);
    console.log(`   ❌ Invalid +61 numbers: ${analysis.invalid.length}`);
    console.log(`   ⚠️  Incomplete +61 numbers: ${analysis.incomplete.length}`);
    console.log(`   🔍 Other issues: ${analysis.otherIssues.length}`);
    console.log('');

    // Show incomplete numbers (potential bug)
    if (analysis.incomplete.length > 0) {
      console.log('='.repeat(80));
      console.log('INCOMPLETE +61 NUMBERS (POTENTIAL BUG)');
      console.log('='.repeat(80));
      analysis.incomplete.slice(0, 20).forEach((item, i) => {
        console.log(`${i + 1}. ${item.personName || 'N/A'}`);
        console.log(`   Field: ${item.field}`);
        console.log(`   Original: ${item.original}`);
        console.log(`   Digits: ${item.digitsOnly} (expected 10-15)`);
        console.log(`   Formatted: ${item.formatted || 'N/A'}`);
        console.log('');
      });
      if (analysis.incomplete.length > 20) {
        console.log(`   ... and ${analysis.incomplete.length - 20} more\n`);
      }
    }

    // Check deleted people with +61 numbers
    console.log('='.repeat(80));
    console.log('CHECKING DELETED PEOPLE WITH +61 NUMBERS');
    console.log('='.repeat(80));
    
    const deletedPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: { not: null },
        OR: [
          { phone: { contains: '+61', mode: 'insensitive' } },
          { phone: { contains: '61', mode: 'insensitive' } },
          { mobilePhone: { contains: '+61', mode: 'insensitive' } },
          { mobilePhone: { contains: '61', mode: 'insensitive' } },
          { workPhone: { contains: '+61', mode: 'insensitive' } },
          { workPhone: { contains: '61', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        deletedAt: true
      },
      take: 50
    });

    console.log(`Found ${deletedPeople.length} deleted people with +61 numbers (showing first 50)\n`);
    
    if (deletedPeople.length > 0) {
      console.log('Sample deleted people:');
      deletedPeople.slice(0, 10).forEach((person, i) => {
        console.log(`${i + 1}. ${person.fullName || 'N/A'}`);
        console.log(`   Phone: ${person.phone || 'N/A'}`);
        console.log(`   Mobile: ${person.mobilePhone || 'N/A'}`);
        console.log(`   Work: ${person.workPhone || 'N/A'}`);
        console.log(`   Deleted: ${person.deletedAt}`);
        console.log('');
      });
      if (deletedPeople.length > 10) {
        console.log(`   ... and ${deletedPeople.length - 10} more\n`);
      }
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total people with +61 numbers (active): ${allPeople.length}`);
    console.log(`   Valid: ${analysis.valid.length}`);
    console.log(`   Invalid: ${analysis.invalid.length}`);
    console.log(`   Incomplete: ${analysis.incomplete.length}`);
    console.log(`   Other issues: ${analysis.otherIssues.length}`);
    console.log(`Deleted people with +61 numbers: ${deletedPeople.length}`);
    console.log('');
    
    if (analysis.incomplete.length > 0) {
      console.log('⚠️  POTENTIAL BUG DETECTED:');
      console.log(`   ${analysis.incomplete.length} +61 numbers appear incomplete`);
      console.log('   This could indicate a problem in the phone number processing pipeline');
      console.log('   Numbers may be getting truncated or incorrectly formatted');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

auditNotaryPhoneNumbers();













