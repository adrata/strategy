#!/usr/bin/env node

/**
 * 🔍 DIAGNOSE AND FIX OLGA LEV BUYER GROUP ISSUE
 * 
 * Problem: Olga Lev (olga.lev@underline.cz) from Czech Underline company
 * is incorrectly listed as a buyer group member for US Underline (underline.com)
 * 
 * This script will:
 * 1. Find Olga Lev in the database
 * 2. Check her buyer group membership status
 * 3. Validate email domain matches company domain
 * 4. Remove her from buyer groups if domain mismatch
 * 5. Document the root cause
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lead ID from the URL
const OLGA_LEV_LEAD_ID = '01K9T0QZV04EMW54QAYRRSK389';
const OLGA_LEV_EMAIL = 'olga.lev@underline.cz';
const OLGA_LEV_NAME = 'Olga Lev';

/**
 * Extract domain from email or URL
 */
function extractDomain(input) {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

/**
 * Strict domain matching - TLD must match exactly
 */
function domainsMatchStrict(emailDomain, companyDomain) {
  if (!emailDomain || !companyDomain) return false;
  
  // Extract root domains (handle subdomains)
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  return emailRoot === companyRoot;
}

async function diagnoseAndFix() {
  try {
    console.log('🔍 DIAGNOSING OLGA LEV BUYER GROUP ISSUE');
    console.log('='.repeat(60));
    console.log('');

    // Find Olga Lev by ID, email, or name
    const olgaLev = await prisma.people.findFirst({
      where: {
        OR: [
          { id: OLGA_LEV_LEAD_ID },
          { email: { contains: OLGA_LEV_EMAIL, mode: 'insensitive' } },
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
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!olgaLev) {
      console.log('❌ Olga Lev not found in database');
      console.log('   Searched for:');
      console.log(`   - ID: ${OLGA_LEV_LEAD_ID}`);
      console.log(`   - Email: ${OLGA_LEV_EMAIL}`);
      console.log(`   - Name: ${OLGA_LEV_NAME}`);
      return;
    }

    console.log('✅ Found Olga Lev:');
    console.log(`   ID: ${olgaLev.id}`);
    console.log(`   Name: ${olgaLev.fullName}`);
    console.log(`   Email: ${olgaLev.email || olgaLev.workEmail || 'N/A'}`);
    console.log(`   Workspace: ${olgaLev.workspace.name} (${olgaLev.workspace.slug})`);
    console.log('');

    // Check buyer group status
    console.log('📊 BUYER GROUP STATUS:');
    console.log(`   isBuyerGroupMember: ${olgaLev.isBuyerGroupMember || false}`);
    console.log(`   buyerGroupRole: ${olgaLev.buyerGroupRole || 'N/A'}`);
    console.log(`   buyerGroupStatus: ${olgaLev.buyerGroupStatus || 'N/A'}`);
    console.log(`   buyerGroupOptimized: ${olgaLev.buyerGroupOptimized || false}`);
    console.log('');

    // Check company assignment
    if (olgaLev.company) {
      console.log('🏢 COMPANY ASSIGNMENT:');
      console.log(`   Company ID: ${olgaLev.company.id}`);
      console.log(`   Company Name: ${olgaLev.company.name}`);
      console.log(`   Company Website: ${olgaLev.company.website || 'N/A'}`);
      console.log(`   Company Domain: ${olgaLev.company.domain || 'N/A'}`);
      console.log('');

      // Validate email domain vs company domain
      const personEmail = olgaLev.email || olgaLev.workEmail;
      if (personEmail) {
        const emailDomain = extractDomain(personEmail.split('@')[1]);
        const companyDomain = extractDomain(olgaLev.company.website || olgaLev.company.domain);
        
        console.log('🔍 DOMAIN VALIDATION:');
        console.log(`   Email Domain: ${emailDomain}`);
        console.log(`   Company Domain: ${companyDomain}`);
        
        if (emailDomain && companyDomain) {
          const domainsMatch = domainsMatchStrict(emailDomain, companyDomain);
          console.log(`   Domains Match: ${domainsMatch ? '✅ YES' : '❌ NO'}`);
          console.log('');

          if (!domainsMatch) {
            console.log('⚠️  ISSUE DETECTED:');
            console.log(`   Olga Lev has email domain ${emailDomain} but is assigned to company with domain ${companyDomain}`);
            console.log(`   These are different companies (underline.cz vs underline.com)!`);
            console.log('');

            // Check BuyerGroupMembers table for records
            const buyerGroupMemberRecords = await prisma.buyerGroupMembers.findMany({
              where: {
                OR: [
                  { email: { contains: OLGA_LEV_EMAIL, mode: 'insensitive' } },
                  { name: { contains: OLGA_LEV_NAME, mode: 'insensitive' } }
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

            if (buyerGroupMemberRecords.length > 0) {
              console.log(`   Found ${buyerGroupMemberRecords.length} BuyerGroupMembers record(s):`);
              buyerGroupMemberRecords.forEach(bgm => {
                console.log(`     - Buyer Group: ${bgm.BuyerGroups.companyName} (${bgm.BuyerGroups.website || 'N/A'})`);
                console.log(`       Role: ${bgm.role}, Email: ${bgm.email || 'N/A'}`);
              });
              console.log('');
            }

            // Check if there are other people from the same company in buyer groups
            const otherBuyerGroupMembers = await prisma.people.findMany({
              where: {
                companyId: olgaLev.company.id,
                isBuyerGroupMember: true,
                id: { not: olgaLev.id },
                deletedAt: null
              },
              select: {
                id: true,
                fullName: true,
                email: true,
                buyerGroupRole: true
              }
            });

            console.log(`   Other buyer group members from ${olgaLev.company.name}: ${otherBuyerGroupMembers.length}`);
            if (otherBuyerGroupMembers.length > 0) {
              console.log('   These people should be in the buyer group:');
              otherBuyerGroupMembers.forEach(p => {
                const pEmail = p.email || p.workEmail;
                const pDomain = pEmail ? extractDomain(pEmail.split('@')[1]) : 'N/A';
                console.log(`     - ${p.fullName} (${pEmail}) - Domain: ${pDomain} - Role: ${p.buyerGroupRole || 'N/A'}`);
              });
            }
            console.log('');

            // Ask for confirmation before fixing
            console.log('🔧 PROPOSED FIX:');
            console.log('   1. Remove Olga Lev from buyer group (set isBuyerGroupMember = false)');
            console.log('   2. Clear buyerGroupRole');
            console.log('   3. Clear buyerGroupStatus');
            if (buyerGroupMemberRecords.length > 0) {
              console.log(`   4. Remove ${buyerGroupMemberRecords.length} BuyerGroupMembers record(s)`);
            }
            console.log('   5. Keep companyId (she may still be at this company, just not in buyer group)');
            console.log('');

            // Auto-fix when domain mismatch is detected
            // Use --dry-run flag to skip the fix
            const isDryRun = process.argv.includes('--dry-run');
            
            if (!isDryRun) {
              console.log('🔧 APPLYING FIX...');
              
              const notes = olgaLev.notes || '';
              const fixNote = `\n[${new Date().toISOString()}] Removed from buyer group due to domain mismatch: email domain (${emailDomain}) does not match company domain (${companyDomain})`;
              
              // Update people table
              await prisma.people.update({
                where: { id: olgaLev.id },
                data: {
                  isBuyerGroupMember: false,
                  buyerGroupRole: null,
                  buyerGroupStatus: null,
                  buyerGroupOptimized: false,
                  notes: notes + fixNote,
                  updatedAt: new Date()
                }
              });

              console.log('   ✅ Updated people table');

              // Remove from BuyerGroupMembers table if records exist
              if (buyerGroupMemberRecords.length > 0) {
                for (const bgm of buyerGroupMemberRecords) {
                  await prisma.buyerGroupMembers.delete({
                    where: { id: bgm.id }
                  });
                  console.log(`   ✅ Removed BuyerGroupMembers record: ${bgm.id}`);
                }
              }

              console.log('');
              console.log('✅ FIX APPLIED:');
              console.log('   - Removed from buyer group');
              console.log('   - Cleared buyer group role');
              console.log('   - Cleared buyer group status');
              if (buyerGroupMemberRecords.length > 0) {
                console.log(`   - Removed ${buyerGroupMemberRecords.length} BuyerGroupMembers record(s)`);
              }
              console.log('   - Added note documenting the fix');
            } else {
              console.log('🔍 DRY RUN MODE - No changes applied');
              console.log('💡 To apply the fix, run without --dry-run flag:');
              console.log(`   node scripts/fix-olga-lev-buyer-group.js`);
            }
          } else if (domainsMatch) {
            console.log('✅ Domain validation passed - no action needed');
          }
        } else {
          console.log('⚠️  Cannot validate - missing domain information');
        }
      } else {
        console.log('⚠️  Cannot validate - no email found for Olga Lev');
      }
    } else {
      console.log('⚠️  No company assigned to Olga Lev');
    }

    // Check for root cause - when was she added?
    console.log('');
    console.log('📅 TIMELINE:');
    console.log(`   Created: ${olgaLev.createdAt}`);
    console.log(`   Last Updated: ${olgaLev.updatedAt}`);
    
    // Check custom fields for source information
    if (olgaLev.customFields) {
      const customFields = typeof olgaLev.customFields === 'string' 
        ? JSON.parse(olgaLev.customFields) 
        : olgaLev.customFields;
      
      if (customFields.source || customFields.buyerGroupRole) {
        console.log(`   Source: ${customFields.source || 'N/A'}`);
        console.log(`   Buyer Group Source: ${customFields.buyerGroupRole || 'N/A'}`);
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ DIAGNOSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
diagnoseAndFix().catch(console.error);

