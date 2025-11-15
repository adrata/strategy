import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'default' | 'public' | 'private';
  platform: 'microsoft' | 'google';
  externalId: string;
  meetingUrl?: string;
  attendees?: any[];
  organizer?: any;
  reminders?: any[];
  attachments?: any[];
}

export interface CalendarSyncResult {
  success: boolean;
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}

/**
 * 📅 CALENDAR SYNCHRONIZATION SERVICE
 * Handles syncing calendar events from Microsoft Graph API and Google Calendar API
 * Links events to people, companies, leads, opportunities, prospects, persons, and companies
 */
export class CalendarSyncService {
  private static instance: CalendarSyncService;

  public static getInstance(): CalendarSyncService {
    if (!CalendarSyncService.instance) {
      CalendarSyncService['instance'] = new CalendarSyncService();
    }
    return CalendarSyncService.instance;
  }

  /**
   * Sync historical calendar events from a start date
   */
  async syncHistoricalCalendarEvents(
    userId: string,
    workspaceId: string,
    startDate: Date,
    platform: 'microsoft' | 'google' = 'microsoft'
  ): Promise<CalendarSyncResult> {
    console.log(`📅 [HISTORICAL CALENDAR SYNC] ========================================`);
    console.log(`📅 [HISTORICAL CALENDAR SYNC] Starting historical calendar sync`);
    console.log(`📅 [HISTORICAL CALENDAR SYNC] User: ${userId}`);
    console.log(`📅 [HISTORICAL CALENDAR SYNC] Workspace: ${workspaceId}`);
    console.log(`📅 [HISTORICAL CALENDAR SYNC] Start Date: ${startDate.toISOString()}`);
    console.log(`📅 [HISTORICAL CALENDAR SYNC] Platform: ${platform}`);
    console.log(`📅 [HISTORICAL CALENDAR SYNC] ========================================`);

    const result: CalendarSyncResult = {
      success: true,
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: []
    };

    try {
      // Get or create primary calendar
      const calendar = await this.getOrCreatePrimaryCalendar(userId, workspaceId, platform);
      
      // Fetch historical events using Nango
      const now = new Date();
      const platformEvents = await this.fetchHistoricalEventsFromNango(
        userId,
        workspaceId,
        platform,
        startDate,
        now
      );
      
      result['eventsProcessed'] = platformEvents.length;

      // Process each event
      for (const platformEvent of platformEvents) {
        try {
          await this.processCalendarEvent(platformEvent, calendar.id, userId, workspaceId, result);
        } catch (error) {
          console.error(`❌ [HISTORICAL CALENDAR SYNC] Error processing event ${platformEvent.id}:`, error);
          result.errors.push(`Event ${platformEvent.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update calendar sync timestamp
      await prisma.calendar.update({
        where: { id: calendar.id },
        data: { lastSyncAt: new Date() }
      });

      console.log(`✅ [HISTORICAL CALENDAR SYNC] Completed: ${result.eventsCreated} created, ${result.eventsUpdated} updated`);
      
    } catch (error) {
      console.error('❌ [HISTORICAL CALENDAR SYNC] Sync failed:', error);
      result['success'] = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Sync calendar events for a specific user and workspace
   */
  async syncCalendarEvents(
    userId: string,
    workspaceId: string,
    platform: 'microsoft' | 'google' = 'microsoft'
  ): Promise<CalendarSyncResult> {
    console.log(`📅 [CALENDAR SYNC] Starting sync for user ${userId} on platform ${platform}`);

    const result: CalendarSyncResult = {
      success: true,
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: []
    };

    try {
      // Get or create primary calendar
      const calendar = await this.getOrCreatePrimaryCalendar(userId, workspaceId, platform);
      
      // Try to use Nango connection first (preferred method)
      let platformEvents: CalendarEvent[] = [];
      const nangoEvents = await this.fetchEventsFromNango(userId, workspaceId, platform);
      
      if (nangoEvents.length > 0) {
        console.log(`✅ [CALENDAR SYNC] Fetched ${nangoEvents.length} events from Nango`);
        platformEvents = nangoEvents;
      } else {
        // Fall back to direct token-based method
        console.log(`⚠️ [CALENDAR SYNC] No Nango connection found, falling back to token-based method`);
        const accessToken = await this.getAccessToken(userId, platform);
        if (!accessToken) {
          throw new Error(`No access token available for ${platform}`);
        }
        platformEvents = await this.fetchPlatformEvents(accessToken, platform);
      }
      
      result['eventsProcessed'] = platformEvents.length;

      // Process each event
      for (const platformEvent of platformEvents) {
        try {
          await this.processCalendarEvent(platformEvent, calendar.id, userId, workspaceId, result);
        } catch (error) {
          console.error(`❌ [CALENDAR SYNC] Error processing event ${platformEvent.id}:`, error);
          result.errors.push(`Event ${platformEvent.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update calendar sync timestamp
      await prisma.calendar.update({
        where: { id: calendar.id },
        data: { lastSyncAt: new Date() }
      });

      console.log(`✅ [CALENDAR SYNC] Completed: ${result.eventsCreated} created, ${result.eventsUpdated} updated, ${result.eventsDeleted} deleted`);
      
    } catch (error) {
      console.error('❌ [CALENDAR SYNC] Sync failed:', error);
      result['success'] = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Get or create primary calendar for user
   */
  private async getOrCreatePrimaryCalendar(
    userId: string,
    workspaceId: string,
    platform: 'microsoft' | 'google'
  ) {
    let calendar = await prisma.calendar.findFirst({
      where: {
        userId,
        workspaceId,
        platform,
        isPrimary: true
      }
    });

    if (!calendar) {
      calendar = await prisma.calendar.create({
        data: {
          workspaceId,
          userId,
          name: `${platform === 'microsoft' ? 'Outlook' : 'Google'} Calendar`,
          description: `Primary ${platform} calendar`,
          platform,
          isPrimary: true,
          isActive: true,
          externalId: 'primary'
        }
      });
      console.log(`📅 [CALENDAR SYNC] Created primary calendar: ${calendar.id}`);
    }

    return calendar;
  }

  /**
   * Fetch calendar events from Nango connection
   */
  private async fetchEventsFromNango(
    userId: string,
    workspaceId: string,
    platform: 'microsoft' | 'google'
  ): Promise<CalendarEvent[]> {
    try {
      // Map platform to Nango provider
      // For Google, look for google-calendar connection (separate from gmail)
      const nangoProvider = platform === 'microsoft' ? 'outlook' : 'google-calendar';
      
      // Find active Nango connection
      const connection = await prisma.grand_central_connections.findFirst({
        where: {
          workspaceId,
          userId,
          OR: platform === 'microsoft' 
            ? [{ provider: 'outlook' }, { providerConfigKey: 'outlook' }]
            : [
                { provider: 'google-calendar' },
                { providerConfigKey: 'google-calendar' },
                // Fallback: try gmail connection if google-calendar not found (for backward compatibility)
                { provider: 'gmail', providerConfigKey: 'gmail' }
              ],
          status: 'active'
        }
      });

      if (!connection || !connection.nangoConnectionId) {
        console.log(`📅 [CALENDAR SYNC] No active Nango connection found for ${nangoProvider}`);
        return [];
      }

      console.log(`📅 [CALENDAR SYNC] Found Nango connection: ${connection.nangoConnectionId}`);

      // Import Nango SDK directly
      const { Nango } = await import('@nangohq/node');
      
      // Initialize Nango client
      // Priority: Use NANGO_SECRET_KEY for production, NANGO_SECRET_KEY_DEV for development
      const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
      if (!secretKey) {
        console.warn(`⚠️ [CALENDAR SYNC] NANGO_SECRET_KEY not configured`);
        return [];
      }

      const nango = new Nango({
        secretKey,
        host: process.env.NANGO_HOST || 'https://api.nango.dev'
      });

      // Calculate date range (today to 1 year from now for future meetings)
      const now = new Date();
      const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year ahead
      
      // Use historical fetch method which supports pagination
      return this.fetchHistoricalEventsFromNango(userId, workspaceId, platform, now, endDate);
    } catch (error) {
      console.error(`❌ [CALENDAR SYNC] Error fetching events from Nango:`, error);
      return [];
    }
  }

  /**
   * Fetch historical events from Nango with pagination
   */
  private async fetchHistoricalEventsFromNango(
    userId: string,
    workspaceId: string,
    platform: 'microsoft' | 'google',
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const nangoProvider = platform === 'microsoft' ? 'outlook' : 'google-calendar';
      
      // Find active Nango connection
      const connection = await prisma.grand_central_connections.findFirst({
        where: {
          workspaceId,
          userId,
          OR: platform === 'microsoft' 
            ? [{ provider: 'outlook' }, { providerConfigKey: 'outlook' }]
            : [
                { provider: 'google-calendar' },
                { providerConfigKey: 'google-calendar' },
                { provider: 'gmail', providerConfigKey: 'gmail' }
              ],
          status: 'active'
        }
      });

      if (!connection || !connection.nangoConnectionId) {
        console.log(`📅 [HISTORICAL CALENDAR SYNC] No active Nango connection found for ${nangoProvider}`);
        return [];
      }

      // Import Nango SDK
      const { Nango } = await import('@nangohq/node');
      const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
      if (!secretKey) {
        console.warn(`⚠️ [HISTORICAL CALENDAR SYNC] NANGO_SECRET_KEY not configured`);
        return [];
      }

      const nango = new Nango({
        secretKey,
        host: process.env.NANGO_HOST || 'https://api.nango.dev'
      });

      const allEvents: CalendarEvent[] = [];
      let hasMore = true;
      let skipToken: string | null = null;
      let pageToken: string | null = null;
      let page = 0;

      while (hasMore) {
        page++;
        console.log(`📅 [HISTORICAL CALENDAR SYNC] Fetching page ${page}...`);

        let endpoint: string;
        
        if (platform === 'microsoft') {
          // Microsoft Graph API with pagination
          let filter = encodeURIComponent(`start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'`);
          endpoint = `/v1.0/me/events?$filter=${filter}&$orderby=start/dateTime&$top=100`;
          if (skipToken) {
            endpoint += `&$skiptoken=${encodeURIComponent(skipToken)}`;
          }
        } else {
          // Google Calendar API with pagination
          const params = new URLSearchParams({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '100'
          });
          if (pageToken) {
            params.set('pageToken', pageToken);
          }
          endpoint = `/calendar/v3/calendars/primary/events?${params.toString()}`;
        }

        const response = await nango.proxy({
          endpoint,
          providerConfigKey: connection.providerConfigKey || nangoProvider,
          connectionId: connection.nangoConnectionId,
          method: 'GET',
          retries: 3
        });

        const data = response.data || response;
        const events = this.transformNangoEventsToCalendarEvents(data, platform);
        allEvents.push(...events);

        // Check for pagination tokens
        if (platform === 'microsoft') {
          const nextLink = data['@odata.nextLink'];
          skipToken = nextLink ? this.extractSkipToken(nextLink) : null;
          hasMore = !!skipToken && events.length === 100;
        } else {
          pageToken = data.nextPageToken || null;
          hasMore = !!pageToken && events.length === 100;
        }

        console.log(`📅 [HISTORICAL CALENDAR SYNC] Page ${page}: ${events.length} events (total: ${allEvents.length})`);

        // Safety limit
        if (page > 1000) {
          console.warn(`⚠️ [HISTORICAL CALENDAR SYNC] Reached safety limit of 1000 pages`);
          break;
        }
      }

      console.log(`✅ [HISTORICAL CALENDAR SYNC] Fetched ${allEvents.length} total events`);
      return allEvents;

    } catch (error) {
      console.error(`❌ [HISTORICAL CALENDAR SYNC] Error fetching events:`, error);
      return [];
    }
  }

  /**
   * Extract skip token from Microsoft Graph nextLink
   */
  private extractSkipToken(nextLink: string): string | null {
    try {
      const url = new URL(nextLink);
      return url.searchParams.get('$skiptoken');
    } catch {
      return null;
    }
  }

  /**
   * Fetch events with custom date range (for regular sync)
   */
  private async fetchEventsWithDateRange(
    nango: any,
    connection: any,
    platform: 'microsoft' | 'google',
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const nangoProvider = platform === 'microsoft' ? 'outlook' : 'google-calendar';
    
    // Determine endpoint with query params based on platform
    let endpoint: string;

    if (platform === 'microsoft') {
      // Microsoft Graph API endpoint with query parameters
      const filter = encodeURIComponent(`start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'`);
      endpoint = `/v1.0/me/events?$filter=${filter}&$orderby=start/dateTime&$top=100`;
    } else {
      // Google Calendar API endpoint with query parameters
      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100'
      });
      endpoint = `/calendar/v3/calendars/primary/events?${params.toString()}`;
    }

    // Use Nango's proxy method to fetch calendar events (GET request)
    const response = await nango.proxy({
      endpoint,
      providerConfigKey: connection.providerConfigKey || nangoProvider,
      connectionId: connection.nangoConnectionId,
      method: 'GET',
      retries: 3
    });

    // Transform Nango response to CalendarEvent format
    // Nango proxy returns { data: {...} }, so we need to extract the data
    const events = this.transformNangoEventsToCalendarEvents(response.data || response, platform);
    
    console.log(`✅ [CALENDAR SYNC] Transformed ${events.length} events from Nango`);
    return events;
  }

  /**
   * Transform Nango API response to CalendarEvent format
   */
  private transformNangoEventsToCalendarEvents(
    data: any,
    platform: 'microsoft' | 'google'
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    try {
      if (platform === 'microsoft') {
        // Microsoft Graph API format: { value: [...] }
        const rawEvents = data.value || data || [];
        
        for (const event of rawEvents) {
          events.push({
            id: event.id,
            title: event.subject || 'Untitled Event',
            description: event.body?.content || '',
            location: event.location?.displayName || '',
            startTime: new Date(event.start.dateTime || event.start.date),
            endTime: new Date(event.end.dateTime || event.end.date),
            isAllDay: !event.start.dateTime,
            isRecurring: !!event.recurrence,
            recurrenceRule: event.recurrence?.pattern?.type,
            status: event.isCancelled ? 'cancelled' : (event.responseStatus === 'tentativelyAccepted' ? 'tentative' : 'confirmed'),
            visibility: event.sensitivity === 'private' ? 'private' : (event.sensitivity === 'public' ? 'public' : 'default'),
            platform: 'microsoft',
            externalId: event.id,
            meetingUrl: event.onlineMeeting?.joinUrl || event.webLink,
            attendees: event.attendees?.map((a: any) => ({
              email: a.emailAddress?.address,
              name: a.emailAddress?.name,
              status: a.status?.response
            })) || [],
            organizer: event.organizer ? {
              email: event.organizer.emailAddress?.address,
              name: event.organizer.emailAddress?.name
            } : undefined,
            reminders: event.reminders?.map((r: any) => ({
              method: r.method,
              minutes: r.minutesBeforeStart
            })) || []
          });
        }
      } else {
        // Google Calendar API format: { items: [...] }
        const rawEvents = data.items || data || [];
        
        for (const event of rawEvents) {
          events.push({
            id: event.id,
            title: event.summary || 'Untitled Event',
            description: event.description || '',
            location: event.location || '',
            startTime: new Date(event.start.dateTime || event.start.date),
            endTime: new Date(event.end.dateTime || event.end.date),
            isAllDay: !event.start.dateTime,
            isRecurring: !!event.recurrence,
            recurrenceRule: event.recurrence?.[0],
            status: event.status === 'cancelled' ? 'cancelled' : (event.status === 'tentative' ? 'tentative' : 'confirmed'),
            visibility: event.visibility || 'default',
            platform: 'google',
            externalId: event.id,
            meetingUrl: event.hangoutLink || event.htmlLink,
            attendees: event.attendees?.map((a: any) => ({
              email: a.email,
              name: a.displayName,
              status: a.responseStatus
            })) || [],
            organizer: event.organizer ? {
              email: event.organizer.email,
              name: event.organizer.displayName
            } : undefined,
            reminders: event.reminders?.overrides?.map((r: any) => ({
              method: r.method,
              minutes: r.minutes
            })) || []
          });
        }
      }
    } catch (error) {
      console.error(`❌ [CALENDAR SYNC] Error transforming events:`, error);
    }

    return events;
  }

  /**
   * Get access token for the platform
   */
  private async getAccessToken(userId: string, platform: 'microsoft' | 'google'): Promise<string | null> {
    try {
      const token = await prisma.providerToken.findFirst({
        where: {
          userId,
          provider: platform
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!token || !token.accessToken) {
        console.log(`⚠️ [CALENDAR SYNC] No access token found for ${platform}`);
        return null;
      }

      // Check if token is expired
      if (token['expiresAt'] && token.expiresAt < new Date()) {
        console.log(`⚠️ [CALENDAR SYNC] Access token expired for ${platform}`);
        return null;
      }

      return token.accessToken;
    } catch (error) {
      console.error(`❌ [CALENDAR SYNC] Error getting access token:`, error);
      return null;
    }
  }

  /**
   * Fetch events from platform API
   */
  private async fetchPlatformEvents(
    accessToken: string,
    platform: 'microsoft' | 'google'
  ): Promise<CalendarEvent[]> {
    if (platform === 'microsoft') {
      return this.fetchMicrosoftEvents(accessToken);
    } else {
      return this.fetchGoogleEvents(accessToken);
    }
  }

  /**
   * Fetch events from Microsoft Graph API
   */
  private async fetchMicrosoftEvents(accessToken: string): Promise<CalendarEvent[]> {
    console.log('📅 [CALENDAR SYNC] Fetching events from Microsoft Graph API');
    
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${now.toISOString()}' and start/dateTime le '${nextMonth.toISOString()}'&$orderby=start/dateTime&$top=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const events: CalendarEvent[] = [];

    for (const event of data.value || []) {
      events.push({
        id: event.id,
        title: event.subject || 'Untitled Event',
        description: event.body?.content || '',
        location: event.location?.displayName || '',
        startTime: new Date(event.start.dateTime || event.start.date),
        endTime: new Date(event.end.dateTime || event.end.date),
        isAllDay: !event.start.dateTime,
        isRecurring: !!event.recurrence,
        recurrenceRule: event.recurrence?.pattern ? this.convertRecurrenceRule(event.recurrence) : undefined,
        status: event.isCancelled ? 'cancelled' : event['showAs'] === 'tentative' ? 'tentative' : 'confirmed',
        visibility: event['sensitivity'] === 'private' ? 'private' : 'default',
        platform: 'microsoft',
        externalId: event.id,
        meetingUrl: event.onlineMeeting?.joinUrl || event.location?.locationUri,
        attendees: event.attendees?.map((attendee: any) => ({
          email: attendee.emailAddress?.address,
          name: attendee.emailAddress?.name,
          status: attendee.status?.response
        })) || [],
        organizer: event.organizer ? {
          email: event.organizer.emailAddress?.address,
          name: event.organizer.emailAddress?.name
        } : undefined,
        reminders: event.reminderMinutesBeforeStart ? [{
          minutes: event.reminderMinutesBeforeStart
        }] : undefined
      });
    }

    console.log(`📅 [CALENDAR SYNC] Fetched ${events.length} events from Microsoft Graph API`);
    return events;
  }

  /**
   * Fetch events from Google Calendar API
   */
  private async fetchGoogleEvents(accessToken: string): Promise<CalendarEvent[]> {
    console.log('📅 [CALENDAR SYNC] Fetching events from Google Calendar API');
    
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${nextMonth.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const events: CalendarEvent[] = [];

    for (const event of data.items || []) {
      events.push({
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        location: event.location || '',
        startTime: new Date(event.start.dateTime || event.start.date),
        endTime: new Date(event.end.dateTime || event.end.date),
        isAllDay: !event.start.dateTime,
        isRecurring: !!event.recurringEventId,
        recurrenceRule: event.recurrence ? event.recurrence.join(';') : undefined,
        status: event['status'] === 'cancelled' ? 'cancelled' : event['status'] === 'tentative' ? 'tentative' : 'confirmed',
        visibility: event['visibility'] === 'private' ? 'private' : 'default',
        platform: 'google',
        externalId: event.id,
        meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
        attendees: event.attendees?.map((attendee: any) => ({
          email: attendee.email,
          name: attendee.displayName,
          status: attendee.responseStatus
        })) || [],
        organizer: event.organizer ? {
          email: event.organizer.email,
          name: event.organizer.displayName
        } : undefined,
        reminders: event.reminders?.overrides?.map((reminder: any) => ({
          minutes: reminder.minutes
        })) || undefined
      });
    }

    console.log(`📅 [CALENDAR SYNC] Fetched ${events.length} events from Google Calendar API`);
    return events;
  }

  /**
   * Process a single calendar event
   */
  private async processCalendarEvent(
    platformEvent: CalendarEvent,
    calendarId: string,
    userId: string,
    workspaceId: string,
    result: CalendarSyncResult
  ) {
    // Check if event already exists
    const existingEvent = await prisma.events.findFirst({
      where: {
        externalId: platformEvent.externalId,
        platform: platformEvent.platform
      }
    });

    if (existingEvent) {
      // Update existing event
      await prisma.events.update({
        where: { id: existingEvent.id },
        data: {
          title: platformEvent.title,
          description: platformEvent.description,
          location: platformEvent.location,
          startTime: platformEvent.startTime,
          endTime: platformEvent.endTime,
          isAllDay: platformEvent.isAllDay,
          isRecurring: platformEvent.isRecurring,
          recurrenceRule: platformEvent.recurrenceRule,
          status: platformEvent.status,
          visibility: platformEvent.visibility,
          meetingUrl: platformEvent.meetingUrl,
          attendees: platformEvent.attendees,
          organizer: platformEvent.organizer,
          reminders: platformEvent.reminders,
          attachments: platformEvent.attachments,
          syncedAt: new Date()
        }
      });
      
      // Link event to entities if not already linked
      if (!existingEvent.personId && !existingEvent.companyId) {
        const linkedEntities = await this.linkEventToEntities(existingEvent.id, platformEvent, workspaceId, userId);
        
        // Create action record if linked
        if (linkedEntities.personId || linkedEntities.companyId) {
          await this.createMeetingAction(existingEvent, linkedEntities, workspaceId, userId);
        }
      }
      
      result.eventsUpdated++;
    } else {
      // Create new event
      const newEvent = await prisma.events.create({
        data: {
          workspaceId,
          userId,
          calendarId,
          title: platformEvent.title,
          description: platformEvent.description,
          location: platformEvent.location,
          startTime: platformEvent.startTime,
          endTime: platformEvent.endTime,
          isAllDay: platformEvent.isAllDay,
          isRecurring: platformEvent.isRecurring,
          recurrenceRule: platformEvent.recurrenceRule,
          status: platformEvent.status,
          visibility: platformEvent.visibility,
          platform: platformEvent.platform,
          externalId: platformEvent.externalId,
          meetingUrl: platformEvent.meetingUrl,
          attendees: platformEvent.attendees,
          organizer: platformEvent.organizer,
          reminders: platformEvent.reminders,
          attachments: platformEvent.attachments,
          syncedAt: new Date()
        }
      });

      // Link event to entities based on attendees and content
      const linkedEntities = await this.linkEventToEntities(newEvent.id, platformEvent, workspaceId, userId);
      
      // Create action record for the meeting
      if (linkedEntities.personId || linkedEntities.companyId) {
        await this.createMeetingAction(newEvent, linkedEntities, workspaceId, userId);
      }
      
      result.eventsCreated++;
    }
  }

  /**
   * Link calendar event to people and companies (using direct fields on events table)
   */
  private async linkEventToEntities(
    eventId: string,
    platformEvent: CalendarEvent,
    workspaceId: string,
    userId: string
  ): Promise<{ personId: string | null; companyId: string | null }> {
    console.log(`🔗 [CALENDAR SYNC] Linking event ${eventId} to entities`);

    // Extract email addresses from attendees and organizer
    const emailAddresses = new Set<string>();
    
    if (platformEvent.attendees) {
      platformEvent.attendees.forEach(attendee => {
        if (attendee.email) {
          emailAddresses.add(attendee.email.toLowerCase());
        }
      });
    }
    
    if (platformEvent.organizer?.email) {
      emailAddresses.add(platformEvent.organizer.email.toLowerCase());
    }

    let personId: string | null = null;
    let companyId: string | null = null;

    // Link to people by email addresses
    if (emailAddresses.size > 0) {
      const person = await prisma.people.findFirst({
        where: {
          workspaceId,
          OR: [
            { email: { in: Array.from(emailAddresses) } },
            { workEmail: { in: Array.from(emailAddresses) } },
            { personalEmail: { in: Array.from(emailAddresses) } }
          ]
        },
        select: {
          id: true,
          companyId: true
        }
      });

      if (person) {
        personId = person.id;
        companyId = person.companyId || null;
        console.log(`🔗 [CALENDAR SYNC] Linked event to person: ${personId}`);
      }
    }

    // If no person found, try to link to company by keywords in title/description
    if (!companyId) {
      const companyKeywords = this.extractCompanyKeywords(platformEvent.title, platformEvent.description);
      if (companyKeywords.length > 0) {
        const company = await prisma.companies.findFirst({
          where: {
            workspaceId,
            OR: companyKeywords.map(keyword => ({
              name: { contains: keyword, mode: 'insensitive' }
            }))
          },
          select: {
            id: true
          }
        });

        if (company) {
          companyId = company.id;
          console.log(`🔗 [CALENDAR SYNC] Linked event to company: ${companyId}`);
        }
      }
    }

    // Update the event with linked entities
    if (personId || companyId) {
      await prisma.events.update({
        where: { id: eventId },
        data: {
          personId: personId || undefined,
          companyId: companyId || undefined
        }
      });

      // Classify engagement based on meeting
      const { EngagementClassificationService } = await import('./engagement-classification-service');
      await EngagementClassificationService.classifyFromMeeting({
        id: eventId,
        title: platformEvent.title,
        description: platformEvent.description,
        personId: personId || null,
        companyId: companyId || null,
        workspaceId
      });
    }

    console.log(`✅ [CALENDAR SYNC] Linked event ${eventId} to entities (person: ${personId || 'none'}, company: ${companyId || 'none'})`);
    
    return { personId, companyId };
  }

  /**
   * Create action record for a meeting
   */
  private async createMeetingAction(
    event: { id: string; title: string; description?: string | null; startTime: Date; endTime: Date; location?: string | null },
    linkedEntities: { personId: string | null; companyId: string | null },
    workspaceId: string,
    userId: string
  ): Promise<void> {
    try {
      // Check if action already exists for this event
      const existingAction = await prisma.actions.findFirst({
        where: {
          workspaceId,
          personId: linkedEntities.personId || undefined,
          companyId: linkedEntities.companyId || undefined,
          type: 'MEETING',
          subject: event.title,
          completedAt: event.startTime
        }
      });

      if (existingAction) {
        console.log(`📅 [CALENDAR SYNC] Action already exists for meeting: ${event.title}`);
        return;
      }

      // Determine if meeting is completed (past) or scheduled (future)
      const now = new Date();
      const isCompleted = event.startTime < now;
      const status = isCompleted ? 'COMPLETED' : 'PENDING';

      // Create action record
      await prisma.actions.create({
        data: {
          workspaceId,
          userId,
          companyId: linkedEntities.companyId || undefined,
          personId: linkedEntities.personId || undefined,
          type: 'MEETING',
          subject: event.title,
          description: event.description ? event.description.substring(0, 500) : undefined,
          status,
          completedAt: isCompleted ? event.startTime : undefined,
          scheduledAt: !isCompleted ? event.startTime : undefined,
          createdAt: event.startTime,
          updatedAt: new Date()
        }
      });

      console.log(`✅ [CALENDAR SYNC] Created ${status} action for meeting: ${event.title}`);
    } catch (error) {
      console.error(`❌ [CALENDAR SYNC] Failed to create action for meeting ${event.id}:`, error);
    }
  }

  /**
   * Extract company keywords from event title and description
   */
  private extractCompanyKeywords(title: string, description?: string): string[] {
    const text = `${title} ${description || ''}`.toLowerCase();
    const keywords: string[] = [];

    // Common company indicators
    const companyIndicators = [
      'meeting with', 'call with', 'demo with', 'presentation to',
      'discussion with', 'interview with', 'sales call', 'client meeting'
    ];

    for (const indicator of companyIndicators) {
      const index = text.indexOf(indicator);
      if (index !== -1) {
        const afterIndicator = text.substring(index + indicator.length).trim();
        const words = afterIndicator.split(/\s+/).slice(0, 3); // Take up to 3 words after indicator
        keywords.push(...words.filter(word => word.length > 2));
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Convert Microsoft recurrence pattern to RRULE format
   */
  private convertRecurrenceRule(recurrence: any): string {
    // This is a simplified conversion - in production, you'd want a more robust implementation
    const pattern = recurrence.pattern;
    const range = recurrence.range;

    let rrule = 'RRULE:';
    
    if (pattern['type'] === 'daily') {
      rrule += 'FREQ=DAILY';
    } else if (pattern['type'] === 'weekly') {
      rrule += 'FREQ=WEEKLY';
    } else if (pattern['type'] === 'monthly') {
      rrule += 'FREQ=MONTHLY';
    } else if (pattern['type'] === 'yearly') {
      rrule += 'FREQ=YEARLY';
    }

    if (pattern.interval) {
      rrule += `;INTERVAL=${pattern.interval}`;
    }

    if (range?.endDate) {
      rrule += `;UNTIL=${new Date(range.endDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    } else if (range?.numberOfOccurrences) {
      rrule += `;COUNT=${range.numberOfOccurrences}`;
    }

    return rrule;
  }

  /**
   * Get calendar events for a specific date range
   */
  async getCalendarEvents(
    userId: string,
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.events.findMany({
      where: {
        userId,
        workspaceId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      // include: {
      //   calendar: true,
      //   EventToContact: {
      //     include: {
      //       contacts: true
      //     }
      //   },
      //   EventToAccount: {
      //     include: {
      //       accounts: true
      //     }
      //   },
      //   EventToLead: {
      //     include: {
      //       leads: true
      //     }
      //   },
      //   EventToOpportunity: {
      //     include: {
      //       opportunities: true
      //     }
      //   },
      //   EventToProspect: {
      //     include: {
      //       prospects: true
      //     }
      //   },
      //   EventToPerson: {
      //     include: {
      //       person: true
      //     }
      //   },
      //   EventToCompany: {
      //     include: {
      //       company: true
      //     }
      //   }
      // } // Commented out due to missing relations in schema,
      orderBy: {
        startTime: 'asc'
      }
    });
  }
}

export default CalendarSyncService;
