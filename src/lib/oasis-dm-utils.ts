/**
 * Oasis DM Utilities
 * 
 * Utility functions for creating DMs between Ross and workspace users
 */

import { prisma } from '@/lib/prisma';

const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9'; // Ross Sylvester's ID

/**
 * Creates a DM between Ross and a specific user in a workspace
 * @param workspaceId - The workspace ID
 * @param userId - The user ID to create DM with
 * @returns Promise<{ success: boolean; dmId?: string; error?: string }>
 */
export async function createRossDM(workspaceId: string, userId: string): Promise<{ success: boolean; dmId?: string; error?: string }> {
  try {
    // Don't create DM with Ross himself
    if (userId === ROSS_USER_ID) {
      return { success: true, dmId: null };
    }

    const participantIds = [ROSS_USER_ID, userId];

    // Check if DM already exists
    const existingDm = await prisma.oasisDirectMessage.findFirst({
      where: {
        workspaceId,
        participants: {
          every: {
            userId: { in: participantIds }
          }
        }
      },
      include: {
        participants: true
      }
    });

    if (existingDm && existingDm.participants.length === participantIds.length) {
      console.log(`✅ [OASIS DM] DM already exists for user ${userId}`);
      return { success: true, dmId: existingDm.id };
    }

    // Create new DM conversation
    const dm = await prisma.oasisDirectMessage.create({
      data: {
        workspaceId,
        participants: {
          createMany: {
            data: participantIds.map(userId => ({ userId }))
          }
        }
      }
    });

    console.log(`✅ [OASIS DM] Created DM with user ${userId} (${dm.id})`);
    return { success: true, dmId: dm.id };

  } catch (error) {
    console.error(`❌ [OASIS DM] Failed to create DM with user ${userId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Creates DMs between Ross and all users in a workspace
 * @param workspaceId - The workspace ID
 * @returns Promise<{ success: boolean; created: number; errors: string[] }>
 */
export async function createRossDMsForWorkspace(workspaceId: string): Promise<{ success: boolean; created: number; errors: string[] }> {
  try {
    // Get all active users in the workspace (excluding Ross)
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId,
        isActive: true,
        userId: { not: ROSS_USER_ID }
      },
      select: { userId: true }
    });

    const userIds = workspaceUsers.map(wu => wu.userId);
    let created = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      const result = await createRossDM(workspaceId, userId);
      if (result.success) {
        created++;
      } else {
        errors.push(`User ${userId}: ${result.error}`);
      }
    }

    console.log(`✅ [OASIS DM] Created ${created} DMs for workspace ${workspaceId}`);
    return { success: true, created, errors };

  } catch (error) {
    console.error(`❌ [OASIS DM] Failed to create DMs for workspace ${workspaceId}:`, error);
    return { success: false, created: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}
