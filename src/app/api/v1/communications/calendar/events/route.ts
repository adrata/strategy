import { NextRequest, NextResponse } from 'next/server';
import { CalendarSyncService } from '@/platform/services/calendar-sync-service';

/**
 * 📅 CALENDAR EVENTS API ENDPOINT
 * GET /api/calendar/events
 * Retrieves calendar events for a specific date range
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: 'userId and workspaceId are required' },
        { status: 400 }
      );
    }

    // Default to current month if no date range provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    console.log(`📅 [API] Getting calendar events for user ${userId} from ${start.toISOString()} to ${end.toISOString()}`);

    const calendarSyncService = CalendarSyncService.getInstance();
    const events = await calendarSyncService.getCalendarEvents(userId, workspaceId, start, end);

    // Transform events for frontend consumption
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      isRecurring: event.isRecurring,
      status: event.status,
      visibility: event.visibility,
      platform: event.platform,
      meetingUrl: event.meetingUrl,
      attendees: event.attendees,
      organizer: event.organizer,
      reminders: event.reminders,
      createdAt: event.createdAt,
      syncedAt: event.syncedAt,
      // Linked entities with safe access (commented out due to missing relations)
      linkedContacts: [], // (event.EventToContact || []).map((link: any) => ({
      //   id: link.contacts?.id || '',
      //   name: link.contacts?.fullName || '',
      //   email: link.contacts?.email || ''
      // })),
      linkedAccounts: [], // (event.EventToAccount || []).map((link: any) => ({
      //   id: link.accounts?.id || '',
      //   name: link.accounts?.name || '',
      //   email: link.accounts?.email || ''
      // })),
      linkedLeads: [], // (event.EventToLead || []).map((link: any) => ({
      //   id: link.leads?.id || '',
      //   name: link.leads?.fullName || '',
      //   email: link.leads?.email || ''
      // })),
      linkedOpportunities: [], // (event.EventToOpportunity || []).map((link: any) => ({
      //   id: link.opportunities?.id || '',
      //   name: link.opportunities?.name || '',
      //   amount: link.opportunities?.amount || 0
      // })),
      linkedProspects: [], // (event.EventToProspect || []).map((link: any) => ({
      //   id: link.prospects?.id || '',
      //   name: link.prospects?.fullName || '',
      //   email: link.prospects?.email || ''
      // })),
      linkedPersons: [], // (event.EventToPerson || []).map((link: any) => ({
      //   id: link.person?.id || '',
      //   name: link.person?.fullName || '',
      //   email: link.person?.email || ''
      // })),
      linkedCompanies: [] // (event.EventToCompany || []).map((link: any) => ({
      //   id: link.company?.id || '',
      //   name: link.company?.name || '',
      //   website: link.company?.website || ''
      // }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        events: transformedEvents,
        totalEvents: transformedEvents.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ [API] Calendar events error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
