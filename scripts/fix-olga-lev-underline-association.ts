/**
 * Fix Olga Lev Underline Association
 * 
 * This script removes Olga Lev (olga.lev@underline.cz) from the Underline (underline.com) company
 * association, ensuring only Ryan Plum (rplum@underline.com) is associated with Underline.
 * 
 * Usage:
 *   npm run tsx scripts/fix-olga-lev-underline-association.ts [workspaceId] [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import { extractDomain, isLikelySameCompany } from '../src/platform/utils/domain-validation';

const prisma = new PrismaClient();

const OLGA_LEV_EMAIL = 'olga.lev@underline.cz';
const OLGA_LEV_NAME = 'Olga Lev';
const RYAN_PLUM_EMAIL = 'rplum@underline.com';
const RYAN_PLUM_NAME = 'Ryan Plum';
const UNDERLINE_DOMAIN = 'underline.com';

interface FixReport {
  olgaLevFound: boolean;
  olgaLevId: string | null;
  olgaLevCompanyId: string | null;
  olgaLevCompanyName: string | null;
  olgaLevRemoved: boolean;
  underlineCompanyFound: boolean;
  underlineCompanyId: string | null;
  underlineCompanyName: string | null;
  ryanPlumFound: boolean;
  ryanPlumId: string | null;
  ryanPlumCompanyId: string | null;
  ryanPlumCorrectlyLinked: boolean;
  changes: string[];
  errors: string[];
}

async function main() {
  const args = process.argv.slice(2);
  const workspaceSlugOrId = args.find(arg => !arg.startsWith('--')) || 'top-temp';
  const isDryRun = args.includes('--dry-run');

  console.log('🔍 FIXING OLGA LEV UNDERLINE ASSOCIATION');
  console.log('='.repeat(60));
  console.log(`Workspace: ${workspaceSlugOrId}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
  console.log('');

  // Find workspace by slug or ID
  let workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { slug: workspaceSlugOrId },
        { id: workspaceSlugOrId }
      ],
      deletedAt: null
    }
  });

  if (!workspace) {
    console.error(`❌ Workspace not found: ${workspaceSlugOrId}`);
    console.log('\nAvailable workspaces:');
    const allWorkspaces = await prisma.workspaces.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
      take: 20
    });
    allWorkspaces.forEach(ws => {
      console.log(`  - ${ws.name} (slug: ${ws.slug || 'N/A'}) - ID: ${ws.id}`);
    });
    await prisma.$disconnect();
    process.exit(1);
  }

  const workspaceId = workspace.id;
  console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspaceId})\n`);

  const report: FixReport = {
    olgaLevFound: false,
    olgaLevId: null,
    olgaLevCompanyId: null,
    olgaLevCompanyName: null,
    olgaLevRemoved: false,
    underlineCompanyFound: false,
    underlineCompanyId: null,
    underlineCompanyName: null,
    ryanPlumFound: false,
    ryanPlumId: null,
    ryanPlumCompanyId: null,
    ryanPlumCorrectlyLinked: false,
    changes: [],
    errors: []
  };

  try {
    // Step 1: Find Olga Lev
    console.log('📋 STEP 1: Finding Olga Lev...');
    const olgaLev = await prisma.people.findFirst({
      where: {
        workspaceId,
        OR: [
          { email: { equals: OLGA_LEV_EMAIL, mode: 'insensitive' } },
          { workEmail: { equals: OLGA_LEV_EMAIL, mode: 'insensitive' } },
          { personalEmail: { equals: OLGA_LEV_EMAIL, mode: 'insensitive' } },
          { fullName: { contains: OLGA_LEV_NAME, mode: 'insensitive' } }
        ],
        deletedAt: null
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

    if (!olgaLev) {
      console.log('⚠️  Olga Lev not found in database');
      report.errors.push('Olga Lev not found');
    } else {
      report.olgaLevFound = true;
      report.olgaLevId = olgaLev.id;
      report.olgaLevCompanyId = olgaLev.companyId;
      report.olgaLevCompanyName = olgaLev.company?.name || null;

      console.log(`✅ Found Olga Lev:`);
      console.log(`   ID: ${olgaLev.id}`);
      console.log(`   Name: ${olgaLev.fullName}`);
      console.log(`   Email: ${olgaLev.email || olgaLev.workEmail || olgaLev.personalEmail}`);
      console.log(`   Current Company ID: ${olgaLev.companyId || 'None'}`);
      console.log(`   Current Company Name: ${olgaLev.company?.name || 'None'}`);
    }

    // Step 2: Find Underline company
    console.log('');
    console.log('📋 STEP 2: Finding Underline company...');
    const underlineCompany = await prisma.companies.findFirst({
      where: {
        workspaceId,
        OR: [
          { domain: { equals: UNDERLINE_DOMAIN, mode: 'insensitive' } },
          { website: { contains: UNDERLINE_DOMAIN, mode: 'insensitive' } },
          { name: { equals: 'Underline', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true
      }
    });

    if (!underlineCompany) {
      console.log('❌ Underline company not found');
      report.errors.push('Underline company not found');
    } else {
      report.underlineCompanyFound = true;
      report.underlineCompanyId = underlineCompany.id;
      report.underlineCompanyName = underlineCompany.name;

      const companyDomain = extractDomain(underlineCompany.website || underlineCompany.domain);
      console.log(`✅ Found Underline company:`);
      console.log(`   ID: ${underlineCompany.id}`);
      console.log(`   Name: ${underlineCompany.name}`);
      console.log(`   Domain: ${companyDomain || 'Not set'}`);
    }

    // Step 3: Check if Olga Lev is incorrectly linked to Underline
    console.log('');
    console.log('📋 STEP 3: Checking Olga Lev association...');
    if (olgaLev && underlineCompany) {
      const olgaEmail = olgaLev.email || olgaLev.workEmail || olgaLev.personalEmail;
      if (olgaEmail && olgaEmail.includes('@')) {
        const olgaDomain = extractDomain(olgaEmail.split('@')[1]);
        const companyDomain = extractDomain(underlineCompany.website || underlineCompany.domain);

        if (olgaLev.companyId === underlineCompany.id) {
          console.log(`⚠️  Olga Lev is currently linked to Underline company`);
          console.log(`   Email domain: ${olgaDomain}`);
          console.log(`   Company domain: ${companyDomain}`);

          if (companyDomain && olgaDomain && !isLikelySameCompany(olgaDomain, companyDomain)) {
            console.log(`   ❌ Domain mismatch detected: ${olgaDomain} vs ${companyDomain}`);
            console.log(`   This is a cross-company contamination - should be fixed`);

            if (!isDryRun) {
              // Remove the association
              await prisma.people.update({
                where: { id: olgaLev.id },
                data: { companyId: null }
              });
              report.olgaLevRemoved = true;
              report.changes.push(`Removed Olga Lev (${olgaLev.id}) from Underline company (${underlineCompany.id})`);
              console.log(`   ✅ Removed Olga Lev from Underline company association`);
            } else {
              console.log(`   [DRY RUN] Would remove Olga Lev from Underline company association`);
              report.changes.push(`[DRY RUN] Would remove Olga Lev from Underline company`);
            }
          } else {
            console.log(`   ✅ Domains match or validation passed - no action needed`);
          }
        } else {
          console.log(`   ✅ Olga Lev is not linked to Underline company`);
        }
      } else {
        console.log(`   ⚠️  Olga Lev has no email address - cannot validate domain`);
      }
    }

    // Step 4: Verify Ryan Plum is correctly associated
    console.log('');
    console.log('📋 STEP 4: Verifying Ryan Plum association...');
    const ryanPlum = await prisma.people.findFirst({
      where: {
        workspaceId,
        OR: [
          { email: { equals: RYAN_PLUM_EMAIL, mode: 'insensitive' } },
          { workEmail: { equals: RYAN_PLUM_EMAIL, mode: 'insensitive' } },
          { fullName: { contains: RYAN_PLUM_NAME, mode: 'insensitive' } }
        ],
        deletedAt: null
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

    if (!ryanPlum) {
      console.log('⚠️  Ryan Plum not found in database');
      report.errors.push('Ryan Plum not found');
    } else {
      report.ryanPlumFound = true;
      report.ryanPlumId = ryanPlum.id;
      report.ryanPlumCompanyId = ryanPlum.companyId;

      console.log(`✅ Found Ryan Plum:`);
      console.log(`   ID: ${ryanPlum.id}`);
      console.log(`   Name: ${ryanPlum.fullName}`);
      console.log(`   Email: ${ryanPlum.email || ryanPlum.workEmail}`);
      console.log(`   Current Company ID: ${ryanPlum.companyId || 'None'}`);
      console.log(`   Current Company Name: ${ryanPlum.company?.name || 'None'}`);

      if (underlineCompany && ryanPlum.companyId === underlineCompany.id) {
        report.ryanPlumCorrectlyLinked = true;
        console.log(`   ✅ Ryan Plum is correctly linked to Underline company`);
      } else {
        console.log(`   ⚠️  Ryan Plum is not linked to Underline company`);
        if (underlineCompany && !isDryRun) {
          // Try to link Ryan Plum to Underline
          const ryanEmail = ryanPlum.email || ryanPlum.workEmail;
          if (ryanEmail && ryanEmail.includes('@')) {
            const ryanDomain = extractDomain(ryanEmail.split('@')[1]);
            const companyDomain = extractDomain(underlineCompany.website || underlineCompany.domain);
            
            if (companyDomain && ryanDomain && isLikelySameCompany(ryanDomain, companyDomain)) {
              await prisma.people.update({
                where: { id: ryanPlum.id },
                data: { companyId: underlineCompany.id }
              });
              report.changes.push(`Linked Ryan Plum (${ryanPlum.id}) to Underline company (${underlineCompany.id})`);
              console.log(`   ✅ Linked Ryan Plum to Underline company`);
              report.ryanPlumCorrectlyLinked = true;
            }
          }
        }
      }
    }

    // Step 5: Final verification
    console.log('');
    console.log('📋 STEP 5: Final verification...');
    if (underlineCompany) {
      const peopleLinkedToUnderline = await prisma.people.findMany({
        where: {
          workspaceId,
          companyId: underlineCompany.id,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true
        }
      });

      console.log(`\nPeople currently linked to Underline (${underlineCompany.name}):`);
      peopleLinkedToUnderline.forEach((person, idx) => {
        const email = person.email || person.workEmail || person.personalEmail;
        const emailDomain = email ? extractDomain(email.split('@')[1]) : 'No email';
        const isCorrect = email && email.includes('@underline.com');
        console.log(`   ${idx + 1}. ${person.fullName} (${email || 'No email'}) - ${isCorrect ? '✅' : '⚠️'}`);
      });

      const incorrectLinks = peopleLinkedToUnderline.filter(person => {
        const email = person.email || person.workEmail || person.personalEmail;
        if (!email || !email.includes('@')) return false;
        const emailDomain = extractDomain(email.split('@')[1]);
        const companyDomain = extractDomain(underlineCompany.website || underlineCompany.domain);
        return companyDomain && emailDomain && !isLikelySameCompany(emailDomain, companyDomain);
      });

      if (incorrectLinks.length > 0) {
        console.log(`\n⚠️  Found ${incorrectLinks.length} people with domain mismatches:`);
        incorrectLinks.forEach(person => {
          const email = person.email || person.workEmail || person.personalEmail;
          const emailDomain = email ? extractDomain(email.split('@')[1]) : 'No email';
          console.log(`   - ${person.fullName} (${emailDomain})`);
        });
      } else {
        console.log(`\n✅ All people linked to Underline have matching domains`);
      }
    }

    // Summary
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Olga Lev found: ${report.olgaLevFound ? '✅' : '❌'}`);
    console.log(`Olga Lev removed from Underline: ${report.olgaLevRemoved ? '✅' : '❌'}`);
    console.log(`Underline company found: ${report.underlineCompanyFound ? '✅' : '❌'}`);
    console.log(`Ryan Plum found: ${report.ryanPlumFound ? '✅' : '❌'}`);
    console.log(`Ryan Plum correctly linked: ${report.ryanPlumCorrectlyLinked ? '✅' : '❌'}`);
    
    if (report.changes.length > 0) {
      console.log(`\nChanges made:`);
      report.changes.forEach((change, idx) => {
        console.log(`   ${idx + 1}. ${change}`);
      });
    }

    if (report.errors.length > 0) {
      console.log(`\nErrors:`);
      report.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error}`);
      });
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    report.errors.push(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

