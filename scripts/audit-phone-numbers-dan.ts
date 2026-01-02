#!/usr/bin/env ts-node

/**
 * 📞 AUDIT PHONE NUMBERS FOR DAN
 * 
 * Audits phone numbers for user "dan" in workspace "adrata"
 * Soft deletes anyone with a phone number that is NOT USA
 */

import { PrismaClient } from '@prisma/client';
import libphonenumber from 'google-libphonenumber';

const prisma = new PrismaClient();
const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

interface PhoneAuditResult {
  personId: string;
  fullName: string;
  phone: string | null;
  mobilePhone: string | null;
  workPhone: string | null;
  country: string | null;
  isUSA: boolean;
  reason: string;
}

/**
 * Check if a phone number is from USA
 */
function isUSAPhoneNumber(phone: string | null | undefined): { isUSA: boolean; country: string | null; reason: string } {
  if (!phone || phone.trim() === '') {
    return { isUSA: false, country: null, reason: 'No phone number' };
  }

  try {
    // Clean the phone number
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Skip if it looks like an email
    if (phone.includes('@')) {
      return { isUSA: false, country: null, reason: 'Invalid: contains @' };
    }

    // Skip if too short or too long
    if (cleaned.length < 7 || cleaned.length > 15) {
      return { isUSA: false, country: null, reason: `Invalid length: ${cleaned.length}` };
    }

    // Default to US if no country code and 10 digits
    if (!cleaned.startsWith('+') && cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      // If no + and not 10 digits, try adding +1
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }

    const phoneNumber = phoneUtil.parse(cleaned);

    if (!phoneUtil.isValidNumber(phoneNumber)) {
      return { isUSA: false, country: null, reason: 'Invalid phone number format' };
    }

    const country = phoneUtil.getRegionCodeForNumber(phoneNumber);
    const isUSA = country === 'US';

    return {
      isUSA,
      country: country || null,
      reason: isUSA ? 'USA number' : `Non-USA number (${country || 'unknown'})`
    };
  } catch (error) {
    return {
      isUSA: false,
      country: null,
      reason: `Error parsing: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check all phone fields for a person
 */
function checkPersonPhones(person: {
  phone: string | null;
  mobilePhone: string | null;
  workPhone: string | null;
}): PhoneAuditResult {
  const phones = [
    { field: 'phone', value: person.phone },
    { field: 'mobilePhone', value: person.mobilePhone },
    { field: 'workPhone', value: person.workPhone }
  ];

  // Filter out null/empty values and check them
  const validPhones = phones.filter(p => p.value && p.value.trim() !== '');
  
  // If no valid phone numbers, return early
  if (validPhones.length === 0) {
    return {
      personId: '',
      fullName: '',
      phone: person.phone,
      mobilePhone: person.mobilePhone,
      workPhone: person.workPhone,
      country: null,
      isUSA: true, // Don't delete people with no phone numbers
      reason: 'No phone numbers found'
    };
  }

  // Check all valid phone fields
  const results = validPhones.map(({ field, value }) => {
    if (!value) return null;
    const check = isUSAPhoneNumber(value);
    return { field, ...check };
  }).filter(Boolean) as Array<{ field: string; isUSA: boolean; country: string | null; reason: string }>;

  // Check if ANY phone is non-USA
  const nonUSAPhones = results.filter(r => !r.isUSA);
  const hasNonUSA = nonUSAPhones.length > 0;

  // Get the first non-USA country or first country found
  const firstNonUSA = nonUSAPhones[0];
  const firstResult = results[0];

  return {
    personId: '',
    fullName: '',
    phone: person.phone,
    mobilePhone: person.mobilePhone,
    workPhone: person.workPhone,
    country: firstNonUSA?.country || firstResult?.country || null,
    isUSA: !hasNonUSA,
    reason: hasNonUSA
      ? `Has non-USA phone: ${firstNonUSA?.field} (${firstNonUSA?.country || 'unknown'})`
      : 'All phones are USA'
  };
}

async function auditAndDelete() {
  try {
    console.log('📞 AUDITING PHONE NUMBERS FOR DAN');
    console.log('==================================\n');

    // Find user "dan"
    const danUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'dan', mode: 'insensitive' } },
          { username: { contains: 'dan', mode: 'insensitive' } },
          { name: { contains: 'dan', mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        activeWorkspaceId: true
      }
    });

    if (!danUser) {
      console.error('❌ User "dan" not found');
      process.exit(1);
    }

    console.log(`✅ Found user: ${danUser.name} (${danUser.email})`);
    console.log(`   ID: ${danUser.id}`);
    console.log(`   Active Workspace ID: ${danUser.activeWorkspaceId}\n`);

    // Get workspace ID (use activeWorkspaceId or find from workspace_users)
    let workspaceId = danUser.activeWorkspaceId;

    if (!workspaceId) {
      // Try to find workspace from workspace_users
      const workspaceUser = await prisma.workspace_users.findFirst({
        where: {
          userId: danUser.id,
          isActive: true
        },
        select: {
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      if (workspaceUser) {
        workspaceId = workspaceUser.workspaceId;
        console.log(`✅ Found workspace: ${workspaceUser.workspace.name} (${workspaceUser.workspace.slug})`);
        console.log(`   Workspace ID: ${workspaceId}\n`);
      } else {
        console.error('❌ No workspace found for user');
        process.exit(1);
      }
    } else {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { name: true, slug: true }
      });
      if (workspace) {
        console.log(`✅ Using workspace: ${workspace.name} (${workspace.slug})`);
        console.log(`   Workspace ID: ${workspaceId}\n`);
      }
    }

    // Find all people in the workspace with phone numbers (not soft deleted)
    console.log('🔍 Finding people with phone numbers...\n');
    
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null, // Only non-deleted people
        OR: [
          { phone: { not: null } },
          { mobilePhone: { not: null } },
          { workPhone: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        email: true
      }
    });

    // Filter out people with only empty/null phone numbers
    const people = allPeople.filter(p => 
      (p.phone && p.phone.trim() !== '') ||
      (p.mobilePhone && p.mobilePhone.trim() !== '') ||
      (p.workPhone && p.workPhone.trim() !== '')
    );

    console.log(`📊 Found ${people.length} people with phone numbers\n`);

    // Audit each person's phone numbers
    const auditResults: (PhoneAuditResult & { personId: string; fullName: string; email: string | null })[] = [];

    for (const person of people) {
      const audit = checkPersonPhones(person);
      auditResults.push({
        ...audit,
        personId: person.id,
        fullName: person.fullName,
        email: person.email
      });
    }

    // Separate USA and non-USA
    // Only include people who actually have phone numbers (not "No phone numbers found")
    const usaPeople = auditResults.filter(r => r.isUSA);
    const nonUSAPeople = auditResults.filter(r => !r.isUSA && r.reason !== 'No phone numbers found' && r.country !== null);

    console.log('📊 AUDIT RESULTS:');
    console.log('================');
    console.log(`✅ USA phone numbers: ${usaPeople.length}`);
    console.log(`❌ Non-USA phone numbers: ${nonUSAPeople.length}`);
    console.log(`📝 No phone numbers: ${auditResults.filter(r => r.reason === 'No phone numbers found').length}\n`);

    // Show non-USA people
    if (nonUSAPeople.length > 0) {
      console.log('❌ PEOPLE WITH NON-USA PHONE NUMBERS:');
      console.log('====================================');
      nonUSAPeople.forEach((person, index) => {
        console.log(`\n${index + 1}. ${person.fullName} (ID: ${person.personId})`);
        if (person.email) console.log(`   Email: ${person.email}`);
        console.log(`   Phone: ${person.phone || 'N/A'}`);
        console.log(`   Mobile: ${person.mobilePhone || 'N/A'}`);
        console.log(`   Work: ${person.workPhone || 'N/A'}`);
        console.log(`   Country: ${person.country || 'unknown'}`);
        console.log(`   Reason: ${person.reason}`);
      });
      console.log('');

      // Ask for confirmation before soft deleting
      console.log('⚠️  WARNING: This will soft delete the above people.');
      console.log('   They will be marked with deletedAt timestamp but not permanently removed.\n');

      // For script execution, we'll proceed (in production, you might want to add a confirmation prompt)
      console.log('🗑️  Soft deleting non-USA phone number people...\n');

      let deletedCount = 0;
      let errorCount = 0;

      for (const person of nonUSAPeople) {
        try {
          await prisma.people.update({
            where: { id: person.personId },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`✅ Soft deleted: ${person.fullName} (${person.country || 'unknown country'})`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Error deleting ${person.fullName}:`, error instanceof Error ? error.message : 'Unknown error');
          errorCount++;
        }
      }

      console.log('\n📊 DELETION SUMMARY:');
      console.log('===================');
      console.log(`✅ Successfully deleted: ${deletedCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      console.log(`📝 Total processed: ${nonUSAPeople.length}\n`);
    } else {
      console.log('✅ All phone numbers are USA numbers. No deletions needed.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditAndDelete();
