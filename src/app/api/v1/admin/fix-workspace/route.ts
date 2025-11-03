import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * Admin API Endpoint to Fix Workspace Data
 * 
 * This endpoint fixes:
 * 1. Ross's speedrun ranking (re-rank to 1-N)
 * 2. Assign Dan as main seller for all Adrata companies
 * 3. Assign Dan as main seller for all Adrata people
 * 4. Add Ross as co-seller for all Adrata people
 */

// User IDs
const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    console.log('🔧 [ADMIN FIX] Starting workspace fix for:', {
      workspaceId: context.workspaceId,
      userId: context.userId
    });

    const results = {
      rossRanking: { fixed: 0, people: [] as any[] },
      companies: { updated: 0 },
      people: { updated: 0 },
      coSellers: { added: 0, errors: [] as string[] }
    };

    // Step 1: Fix Ross's speedrun ranking
    console.log('🔧 [ADMIN FIX] Step 1: Fixing Ross\'s speedrun ranking...');
    
    const rossPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ROSS_USER_ID
      },
      orderBy: { globalRank: 'asc' },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: { select: { name: true } }
      }
    });

    console.log(`Found ${rossPeople.length} people assigned to Ross`);

    if (rossPeople.length > 0) {
      const needsFixing = rossPeople.some(p => (p.globalRank || 0) > 50);
      
      if (needsFixing) {
        for (let i = 0; i < rossPeople.length; i++) {
          const person = rossPeople[i];
          await prisma.people.update({
            where: { id: person.id },
            data: {
              globalRank: i + 1,
              customFields: {
                userRank: i + 1,
                userId: ROSS_USER_ID,
                rankingMode: 'global'
              }
            }
          });
          
          results.rossRanking.fixed++;
          results.rossRanking.people.push({
            name: person.fullName,
            company: person.company?.name,
            oldRank: person.globalRank,
            newRank: i + 1
          });
        }
        console.log(`✅ Fixed ranking for ${results.rossRanking.fixed} people`);
      } else {
        console.log('✅ Ross\'s ranking is already correct');
        results.rossRanking.people = rossPeople.map(p => ({
          name: p.fullName,
          company: p.company?.name,
          rank: p.globalRank
        }));
      }
    } else {
      console.log('⚠️ No people assigned to Ross');
    }

    // Step 2: Fix company assignments
    console.log('🔧 [ADMIN FIX] Step 2: Fixing company assignments...');
    
    const companiesResult = await prisma.companies.updateMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: { not: DAN_USER_ID }
      },
      data: {
        mainSellerId: DAN_USER_ID
      }
    });

    results.companies.updated = companiesResult.count;
    console.log(`✅ Updated ${results.companies.updated} companies`);

    // Step 3: Fix people assignments
    console.log('🔧 [ADMIN FIX] Step 3: Fixing people assignments...');
    
    const peopleResult = await prisma.people.updateMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: { not: DAN_USER_ID }
      },
      data: {
        mainSellerId: DAN_USER_ID
      }
    });

    results.people.updated = peopleResult.count;
    console.log(`✅ Updated ${results.people.updated} people`);

    // Step 4: Fix co-seller assignments
    console.log('🔧 [ADMIN FIX] Step 4: Fixing co-seller assignments...');
    
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, fullName: true }
    });

    for (const person of allPeople) {
      try {
        const existingCoSeller = await prisma.person_co_sellers.findFirst({
          where: {
            personId: person.id,
            userId: ROSS_USER_ID
          }
        });

        if (!existingCoSeller) {
          await prisma.person_co_sellers.create({
            data: {
              personId: person.id,
              userId: ROSS_USER_ID
            }
          });
          results.coSellers.added++;
        }
      } catch (error) {
        const errorMsg = `Could not add Ross as co-seller for ${person.fullName}: ${error}`;
        results.coSellers.errors.push(errorMsg);
        console.warn('⚠️', errorMsg);
      }
    }

    console.log(`✅ Added Ross as co-seller for ${results.coSellers.added} people`);

    // Step 5: Final verification
    console.log('🔧 [ADMIN FIX] Step 5: Final verification...');
    
    const finalRossPeople = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ROSS_USER_ID
      },
      orderBy: { globalRank: 'asc' },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: { select: { name: true } }
      }
    });

    const companiesWithDan = await prisma.companies.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: DAN_USER_ID
      }
    });

    const peopleWithDan = await prisma.people.count({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        deletedAt: null,
        mainSellerId: DAN_USER_ID
      }
    });

    const peopleWithRossCoSeller = await prisma.person_co_sellers.count({
      where: {
        person: {
          workspaceId: ADRATA_WORKSPACE_ID,
          deletedAt: null
        },
        userId: ROSS_USER_ID
      }
    });

    const finalResults = {
      success: true,
      message: 'Workspace fix completed successfully',
      executionTime: Date.now() - startTime,
      results: {
        ...results,
        verification: {
          rossPeopleCount: finalRossPeople.length,
          rossPeople: finalRossPeople.map(p => ({
            name: p.fullName,
            company: p.company?.name,
            rank: p.globalRank
          })),
          companiesWithDan,
          peopleWithDan,
          peopleWithRossCoSeller
        }
      }
    };

    console.log('🎉 [ADMIN FIX] Workspace fix completed successfully!');
    console.log('Final verification:', finalResults.verification);

    return NextResponse.json(finalResults);

  } catch (error) {
    console.error('❌ [ADMIN FIX] Error during workspace fix:', error);
    return createErrorResponse(
      `Workspace fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FIX_FAILED',
      500
    );
  }
}

// GET endpoint for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request);
}

