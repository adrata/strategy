import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/platform/services/notification-service';

/**
 * Vercel Cron Job: Check and Trigger Reminders
 * 
 * This endpoint runs periodically (via Vercel Cron) to check for reminders
 * that are due and trigger notifications for users.
 * 
 * Configure in vercel.json with a cron schedule that runs every minute.
 * Example configuration:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-reminders",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    // Check for reminders due in the next 5 minutes (to account for cron timing)
    const checkWindow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find all reminders that are due and not completed
    const dueReminders = await prisma.reminders.findMany({
      where: {
        reminderAt: {
          lte: checkWindow,
        },
        isCompleted: false,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        reminderAt: 'asc',
      },
    });

    const notificationService = NotificationService.getInstance();
    let processedCount = 0;
    let errorCount = 0;

    // Process each reminder
    for (const reminder of dueReminders) {
      try {
        // Get entity name
        let entityName = 'Unknown';
        if (reminder.entityType === 'people') {
          const person = await prisma.people.findUnique({
            where: { id: reminder.entityId },
            select: { fullName: true, name: true },
          });
          entityName = person?.fullName || person?.name || 'Unknown Person';
        } else {
          const company = await prisma.companies.findUnique({
            where: { id: reminder.entityId },
            select: { name: true },
          });
          entityName = company?.name || 'Unknown Company';
        }

        // Create notification title and body
        const title = `Reminder: ${entityName}`;
        const body = reminder.note || `Reminder for ${reminder.entityType === 'people' ? 'person' : 'company'}`;

        // Show notification
        await notificationService.showNotification(title, body, {
          icon: '/favicon.ico',
        });

        // Mark reminder as completed
        await prisma.reminders.update({
          where: { id: reminder.id },
          data: {
            isCompleted: true,
            completedAt: now,
          },
        });

        processedCount++;
      } catch (error) {
        console.error(`❌ [REMINDERS CRON] Error processing reminder ${reminder.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: dueReminders.length,
    });
  } catch (error) {
    console.error('❌ [REMINDERS CRON] Error checking reminders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check reminders' 
      },
      { status: 500 }
    );
  }
}

