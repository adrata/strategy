import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rankContacts } from '@/products/speedrun/ranking';
import { getDefaultUserSettings } from '@/products/speedrun/state';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { completedCount, triggerAutoFetch, isDailyReset } = body;

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
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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

    // Apply ranking algorithm
    const rankedContacts = rankContacts(crmRecords, userSettings);

    // Take the top 50 for the new batch
    const newBatch = rankedContacts.slice(0, 50);

    // Update database with new rankings
    const updatePromises = newBatch.map((contact, index) => 
      prisma.people.update({
        where: { id: contact.id },
        data: {
          globalRank: index + 1,
          rank: index + 1,
          updatedAt: new Date()
        }
      })
    );

    await Promise.all(updatePromises);

    console.log(`✅ Successfully re-ranked and updated ${newBatch.length} records`);

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
          rankingScore: contact.rankingScore
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
