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
      
      // Get access token for the platform
      const accessToken = await this.getAccessToken(userId, platform);
      if (!accessToken) {
        throw new Error(`No access token available for ${platform}`);
      }

      // Fetch events from the platform API
      const platformEvents = await this.fetchPlatformEvents(accessToken, platform);
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
      await this.linkEventToEntities(newEvent.id, platformEvent, workspaceId);
      result.eventsCreated++;
    }
  }

  /**
   * Link calendar event to people, companies, leads, opportunities, prospects, persons, and companies
   */
  private async linkEventToEntities(
    eventId: string,
    platformEvent: CalendarEvent,
    workspaceId: string
  ) {
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

    // Link to people
    if (emailAddresses.size > 0) {
      const contacts = await prisma.people.findMany({
        where: {
          workspaceId,
          OR: [
            { email: { in: Array.from(emailAddresses) } },
            { workEmail: { in: Array.from(emailAddresses) } },
            { personalEmail: { in: Array.from(emailAddresses) } },
            { secondaryEmail: { in: Array.from(emailAddresses) } }
          ]
        }
      });

      for (const contact of contacts) {
        await prisma.eventToContact.create({
          data: {
            A: eventId,
            B: contact.id
          }
        });
      }
    }

    // Link to accounts (by company name in title/description)
    const companyKeywords = this.extractCompanyKeywords(platformEvent.title, platformEvent.description);
    if (companyKeywords.length > 0) {
      const accounts = await prisma.accounts.findMany({
        where: {
          workspaceId,
          OR: companyKeywords.map(keyword => ({
            OR: [
              { name: { contains: keyword, mode: 'insensitive' } },
              { legalName: { contains: keyword, mode: 'insensitive' } },
              { tradingName: { contains: keyword, mode: 'insensitive' } }
            ]
          }))
        }
      });

      for (const account of accounts) {
        await prisma.eventToAccount.create({
          data: {
            A: eventId,
            B: account.id
          }
        });
      }
    }

    // Link to leads (by email addresses)
    if (emailAddresses.size > 0) {
      const leads = await prisma.leads.findMany({
        where: {
          workspaceId,
          OR: [
            { email: { in: Array.from(emailAddresses) } },
            { workEmail: { in: Array.from(emailAddresses) } },
            { personalEmail: { in: Array.from(emailAddresses) } }
          ]
        }
      });

      for (const lead of leads) {
        await prisma.eventToLead.create({
          data: {
            A: eventId,
            B: lead.id
          }
        });
      }
    }

    // Link to opportunities (by company keywords)
    if (companyKeywords.length > 0) {
      const opportunities = await prisma.opportunities.findMany({
        where: {
          workspaceId,
          OR: companyKeywords.map(keyword => ({
            name: { contains: keyword, mode: 'insensitive' }
          }))
        }
      });

      for (const opportunity of opportunities) {
        await prisma.eventToOpportunity.create({
          data: {
            A: eventId,
            B: opportunity.id
          }
        });
      }
    }

    // Link to prospects (by email addresses)
    if (emailAddresses.size > 0) {
      const prospects = await prisma.prospects.findMany({
        where: {
          workspaceId,
          OR: [
            { email: { in: Array.from(emailAddresses) } },
            { workEmail: { in: Array.from(emailAddresses) } },
            { personalEmail: { in: Array.from(emailAddresses) } }
          ]
        }
      });

      for (const prospect of prospects) {
        await prisma.eventToProspect.create({
          data: {
            A: eventId,
            B: prospect.id
          }
        });
      }
    }

    // Link to persons (by email addresses)
    if (emailAddresses.size > 0) {
      const persons = await prisma.people.findMany({
        where: {
          email: { in: Array.from(emailAddresses) }
        }
      });

      for (const person of persons) {
        await prisma.eventToPerson.create({
          data: {
            A: eventId,
            B: person.id
          }
        });
      }
    }

    // Link to companies (by company keywords)
    if (companyKeywords.length > 0) {
      const companies = await prisma.companies.findMany({
        where: {
          OR: companyKeywords.map(keyword => ({
            name: { contains: keyword, mode: 'insensitive' }
          }))
        }
      });

      for (const company of companies) {
        await prisma.eventToCompany.create({
          data: {
            A: eventId,
            B: company.id
          }
        });
      }
    }

    console.log(`✅ [CALENDAR SYNC] Linked event ${eventId} to entities`);
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
