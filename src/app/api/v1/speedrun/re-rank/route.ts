import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rankContacts } from '@/products/speedrun/ranking';
import { getDefaultUserSettings } from '@/products/speedrun/state';
import { StateRankingService } from '@/products/speedrun/state-ranking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { completedCount, triggerAutoFetch, isDailyReset, manualRankUpdate, trigger, personId, actionType, timestamp } = body;

    // Handle manual rank update
    if (manualRankUpdate) {
      console.log(`🔄 Manual rank update: Person ${manualRankUpdate.personId} to rank ${manualRankUpdate.newRank}`);
      return await handleManualRankUpdate(request, manualRankUpdate);
    }

    // 🎯 AUTO RE-RANKING: Log trigger information for debugging
    if (trigger) {
      console.log(`🎯 [AUTO RE-RANKING] Triggered by: ${trigger}`, {
        personId,
        actionType,
        timestamp,
        completedCount
      });
    }

    console.log(`🔄 Re-ranking speedrun data for user. Completed: ${completedCount}`);

    // Get workspace and user context
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace or user context' },
        { status: 400 }
      );
    }

    // Get user settings for ranking
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        timezone: true,
        name: true,
        email: true,
        // Note: These fields will be available after schema migration
        // speedrunRankingMode: true,
        // stateRankingOrder: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get ranking mode and state ordering
    const rankingMode = 'global'; // (user.speedrunRankingMode as 'global' | 'state-based') || 'global';
    const stateOrder: string[] = []; // (user.stateRankingOrder as string[]) || [];

    console.log(`🔄 [RE-RANK] Using ranking mode: ${rankingMode}`, {
      stateOrderLength: stateOrder.length,
      userId
    });

    // Get all people in the workspace that haven't been completed today
    const today = new Date().toDateString();
    const completedToday = await prisma.actions.findMany({
      where: {
        workspaceId,
        userId,
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      select: { personId: true }
    });

    const completedPersonIds = completedToday.map(action => action.personId);

    // Get all people excluding those completed today
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        id: {
          notIn: completedPersonIds
        },
        isActive: true
      },
      include: {
        company: true,
        actions: {
          where: {
            workspaceId,
            userId
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      take: 1000 // Get more than 50 to ensure we have enough for ranking
    });

    if (allPeople.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No available people to rank' },
        { status: 404 }
      );
    }

    // Transform data for ranking algorithm
    const crmRecords = allPeople.map(person => ({
      id: person.id,
      name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
      company: person.company?.name || 'Unknown Company',
      title: person.jobTitle || person.title || 'No Title',
      email: person.email,
      phone: person.phone,
      mobilePhone: person.mobilePhone,
      linkedin: person.linkedinUrl,
      photo: person.photoUrl,
      priority: person.priority || 'Medium',
      status: person.status || 'New',
      lastContact: person.lastContactAt?.toISOString() || new Date().toISOString(),
      nextAction: person.nextAction || 'No action planned',
      relationship: person.relationship || 'New',
      bio: person.bio || '',
      interests: person.interests || [],
      recentActivity: person.recentActivity || '',
      commission: person.commission || '0',
      // Add ranking-specific fields
      companySize: person.company?.size || 'Unknown',
      industry: person.company?.industry || 'Unknown',
      location: person.company?.location || 'Unknown',
      // Add any existing ranking data
      globalRank: person.globalRank || 999999,
      rank: person.rank || 999999
    }));

    // Get user settings for ranking
    const userSettings = getDefaultUserSettings('AE'); // Default to AE role

    // Apply ranking algorithm with user's preferred mode
    const rankedContacts = rankContacts(crmRecords, userSettings, rankingMode, stateOrder);

    // Take the top 50 for the new batch
    const newBatch = rankedContacts.slice(0, 50);

    // Update database with new rankings
    const updatePromises = newBatch.map((contact, index) => 
      prisma.people.update({
        where: { id: contact.id },
        data: {
          globalRank: index + 1,
          rank: index + 1,
          // Add state-based ranking fields if available
          ...(contact.stateRank && { 
            customFields: {
              ...(contact.customFields || {}),
              stateRank: contact.stateRank,
              companyRankInState: contact.companyRankInState,
              personRankInCompany: contact.personRankInCompany,
              rankingMode: rankingMode
            }
          }),
          updatedAt: new Date()
        }
      })
    );

    await Promise.all(updatePromises);

    console.log(`✅ Successfully re-ranked and updated ${newBatch.length} records`);

    // 🎯 AUTO RE-RANKING: Log completion for debugging
    if (trigger) {
      console.log(`🎯 [AUTO RE-RANKING] Completed successfully`, {
        trigger,
        personId,
        actionType,
        recordsUpdated: newBatch.length,
        timestamp: new Date().toISOString()
      });
    }

    // Return the new batch data
    return NextResponse.json({
      success: true,
      data: {
        newBatch: newBatch.map(contact => ({
          id: contact.id,
          name: contact.name,
          company: contact.company,
          title: contact.title,
          email: contact.email,
          phone: contact.phone,
          mobilePhone: contact.mobilePhone,
          linkedin: contact.linkedin,
          photo: contact.photo,
          priority: contact.priority,
          status: contact.status,
          lastContact: contact.lastContact,
          nextAction: contact.nextAction,
          relationship: contact.relationship,
          bio: contact.bio,
          interests: contact.interests,
          recentActivity: contact.recentActivity,
          commission: contact.commission,
          globalRank: contact.globalRank,
          rank: contact.rank,
          rankingScore: contact.rankingScore,
          // State-based ranking fields
          stateRank: contact.stateRank,
          companyRankInState: contact.companyRankInState,
          personRankInCompany: contact.personRankInCompany,
          rankingMode: rankingMode
        })),
        batchNumber: Math.floor(completedCount / 50) + 1,
        totalCompleted: completedCount,
        message: `Successfully fetched batch ${Math.floor(completedCount / 50) + 1} with ${newBatch.length} new records`
      }
    });

  } catch (error) {
    console.error('❌ Error in re-ranking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle manual rank updates with automatic re-ranking of other prospects
 */
async function handleManualRankUpdate(request: NextRequest, manualRankUpdate: { personId: string, oldRank?: number, newRank: number }) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace or user context' },
        { status: 400 }
      );
    }

    const { personId, oldRank, newRank } = manualRankUpdate;

    // Get the person being updated
    const person = await prisma.people.findUnique({
      where: { 
        id: personId,
        workspaceId,
        deletedAt: null
      }
    });

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    const currentRank = person.globalRank || 0;
    const actualOldRank = oldRank || currentRank;

    console.log(`🔄 Manual rank update: ${person.fullName} from rank ${actualOldRank} to ${newRank}`);

    // Get all people in the workspace that need rank adjustment
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        globalRank: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true
      },
      orderBy: { globalRank: 'asc' }
    });

    // Calculate rank adjustments
    const rankAdjustments: Array<{ id: string, newRank: number }> = [];
    
    if (newRank < actualOldRank) {
      // Moving up: shift people at positions [newRank..oldRank-1] down by 1
      allPeople.forEach(p => {
        if (p.globalRank && p.globalRank >= newRank && p.globalRank < actualOldRank) {
          rankAdjustments.push({ id: p.id, newRank: p.globalRank + 1 });
        }
      });
    } else if (newRank > actualOldRank) {
      // Moving down: shift people at positions [oldRank+1..newRank] up by 1
      allPeople.forEach(p => {
        if (p.globalRank && p.globalRank > actualOldRank && p.globalRank <= newRank) {
          rankAdjustments.push({ id: p.id, newRank: p.globalRank - 1 });
        }
      });
    }

    // Add the target person's new rank
    rankAdjustments.push({ id: personId, newRank });

    console.log(`🔄 Applying ${rankAdjustments.length} rank adjustments`);

    // Apply all rank updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const adjustment of rankAdjustments) {
        await tx.people.update({
          where: { id: adjustment.id },
          data: { 
            globalRank: adjustment.newRank,
            updatedAt: new Date()
          }
        });
      }
    });

    console.log(`✅ Successfully updated ranks for ${rankAdjustments.length} people`);

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully updated rank for ${person.fullName} and adjusted ${rankAdjustments.length - 1} other prospects`,
        personId,
        oldRank: actualOldRank,
        newRank,
        adjustmentsCount: rankAdjustments.length - 1
      }
    });

  } catch (error) {
    console.error('❌ Error in manual rank update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update rank' },
      { status: 500 }
    );
  }
}
