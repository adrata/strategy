"use client";

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'call' | 'demo' | 'internal' | 'break' | 'focus';
  isSpeedrunRelated?: boolean;
  relatedContact?: any;
  relatedCompany?: string;
}

export interface TimeBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  type: 'work' | 'break' | 'lunch' | 'focus' | 'buffer';
  title: string;
  isAvailable: boolean;
}

export interface DailySchedule {
  date: Date;
  events: CalendarEvent[];
  timeBlocks: TimeBlock[];
  workingHours: {
    start: Date;
    end: Date;
  };
  totalMeetingTime: number; // in minutes
  availableTime: number; // in minutes for prospecting
  focusBlocks: TimeBlock[];
}

export class SpeedrunCalendarService {
  private static instance: SpeedrunCalendarService;
  
  static getInstance(): SpeedrunCalendarService {
    if (!this.instance) {
      this['instance'] = new SpeedrunCalendarService();
    }
    return this.instance;
  }

  /**
   * Get Dano's daily schedule with real calendar data
   */
  async getDailySchedule(date: Date = new Date(), workspaceId?: string): Promise<DailySchedule> {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0); // 8 AM start
    
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // 6 PM end

    try {
      // Try to get real calendar data from AOS context or API
      const calendarEvents = await this.fetchCalendarEvents(date, workspaceId);
      const events = this.parseCalendarEvents(calendarEvents);
      
      // Generate time blocks around meetings
      const timeBlocks = this.generateTimeBlocks(startOfDay, endOfDay, events);
      
      // Calculate metrics
      const totalMeetingTime = events.reduce((total, event) => {
        return total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
      }, 0);
      
      const totalWorkingMinutes = (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60);
      const availableTime = totalWorkingMinutes - totalMeetingTime;
      
      const focusBlocks = timeBlocks.filter(block => block['type'] === 'focus' && block.isAvailable);

      return {
        date,
        events,
        timeBlocks,
        workingHours: { start: startOfDay, end: endOfDay },
        totalMeetingTime,
        availableTime,
        focusBlocks
      };
    } catch (error) {
      console.warn('Failed to fetch real calendar data, using demo schedule:', error);
      return this.getDemoSchedule(date);
    }
  }

  /**
   * Fetch calendar events from various sources
   */
  private async fetchCalendarEvents(date: Date, workspaceId?: string): Promise<any[]> {
    // Try multiple data sources in order of preference
    
    // 1. Try AOS context calendar data
    if (typeof window !== 'undefined' && (window as any).__ADRATA_AOS_DATA__) {
      const aosData = (window as any).__ADRATA_AOS_DATA__;
      if (aosData['calendar'] && aosData.calendar.length > 0) {
        console.log('📅 Using AOS calendar data:', aosData.calendar.length, 'events');
        return aosData.calendar;
      }
    }

    // 2. Try API route
    if (workspaceId) {
      try {
        const response = await fetch(`/api/v1/communications/calendar/events?date=${date.toISOString()}&workspaceId=${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📅 Using API calendar data:', data.events?.length || 0, 'events');
          return data.events || [];
        }
      } catch (error) {
        console.warn('Calendar API failed:', error);
      }
    }

    // 3. Try Tauri command (desktop only)
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const events = await invoke('get_calendar_events', { 
          userId: 'dano',
          date: date.toISOString() 
        });
        console.log('📅 Using Tauri calendar data:', (events as any[]).length, 'events');
        return events as any[];
      } catch (error) {
        console.warn('Tauri calendar command failed:', error);
      }
    }

    // 4. Fallback to empty array
    return [];
  }

  /**
   * Parse calendar events into our format
   */
  private parseCalendarEvents(rawEvents: any[]): CalendarEvent[] {
    return rawEvents.map(event => ({
      id: event.id || `event-${Date.now()}-${Math.random()}`,
      title: event.title || event.summary || 'Untitled Event',
      startTime: new Date(event.startTime || event.start?.dateTime || event.start),
      endTime: new Date(event.endTime || event.end?.dateTime || event.end),
      location: event.location,
      attendees: event.attendees?.map((a: any) => a.email || a.name || a) || [],
      type: this.categorizeEventType(event.title || event.summary || ''),
      isSpeedrunRelated: this.isSpeedrunRelated(event.title || event.summary || ''),
      relatedContact: event.relatedContact,
      relatedCompany: event.relatedCompany || this.extractCompanyFromTitle(event.title || '')
    }));
  }

  /**
   * Generate time blocks for the day
   */
  private generateTimeBlocks(startOfDay: Date, endOfDay: Date, events: CalendarEvent[]): TimeBlock[] {
    const blocks: TimeBlock[] = [];
    const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    let currentTime = new Date(startOfDay);
    
    // Add morning focus block if no early meetings
    const firstEvent = sortedEvents[0];
    if (!firstEvent || firstEvent.startTime.getTime() > currentTime.getTime() + 30 * 60 * 1000) {
      const focusEnd = firstEvent ? 
        new Date(firstEvent.startTime.getTime() - 15 * 60 * 1000) : // 15 min buffer before meeting
        new Date(currentTime.getTime() + 90 * 60 * 1000); // 90 min focus block
      
      blocks.push({
        id: 'morning-focus',
        startTime: new Date(currentTime),
        endTime: focusEnd,
        type: 'focus',
        title: 'Morning Focus - Speedrun',
        isAvailable: true
      });
      currentTime = focusEnd;
    }

    // Process each event and create blocks around them
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      // Add buffer before meeting if needed
      if (event.startTime.getTime() > currentTime.getTime() + 15 * 60 * 1000) {
        blocks.push({
          id: `buffer-before-${event.id}`,
          startTime: new Date(currentTime),
          endTime: new Date(event.startTime.getTime() - 5 * 60 * 1000),
          type: 'buffer',
          title: 'Prep Time',
          isAvailable: true
        });
      }

      // Add the meeting block
      blocks.push({
        id: `meeting-${event.id}`,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event['type'] === 'meeting' ? 'work' : 'work',
        title: event.title,
        isAvailable: false
      });

      currentTime = event.endTime;

      // Add break/focus time between meetings
      if (nextEvent) {
        const timeBetween = nextEvent.startTime.getTime() - event.endTime.getTime();
        if (timeBetween > 30 * 60 * 1000) { // More than 30 minutes
          const blockEnd = new Date(nextEvent.startTime.getTime() - 5 * 60 * 1000);
          blocks.push({
            id: `focus-${i}`,
            startTime: new Date(currentTime),
            endTime: blockEnd,
            type: timeBetween > 60 * 60 * 1000 ? 'focus' : 'break', // Focus if > 1 hour
            title: timeBetween > 60 * 60 * 1000 ? 'Focus Block - Speedrun' : 'Quick Break',
            isAvailable: true
          });
        }
      }
    }

    // Add end-of-day focus block if time remains
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    if (!lastEvent || lastEvent.endTime.getTime() < endOfDay.getTime() - 30 * 60 * 1000) {
      const focusStart = lastEvent ? lastEvent.endTime : currentTime;
      blocks.push({
        id: 'afternoon-focus',
        startTime: new Date(focusStart),
        endTime: endOfDay,
        type: 'focus',
        title: 'Afternoon Focus - Follow-ups',
        isAvailable: true
      });
    }

    return blocks;
  }

  /**
   * Get demo schedule for Dano (fallback)
   */
  private getDemoSchedule(date: Date): DailySchedule {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    // Demo events for Dano
    const events: CalendarEvent[] = [
      {
        id: 'standup-1',
        title: 'Daily Standup',
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 30),
        type: 'internal',
        isSpeedrunRelated: false
      },
      {
        id: 'demo-zeropoint',
        title: 'Product Demo - ZeroPoint Security',
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 11, 0),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0),
        type: 'demo',
        isSpeedrunRelated: true,
        relatedCompany: 'ZeroPoint Security',
        attendees: ['john@zeropoint.com', 'sarah@zeropoint.com']
      },
      {
        id: 'lunch-break',
        title: 'Lunch',
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 30),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13, 30),
        type: 'break'
      },
      {
        id: 'discovery-call',
        title: 'Discovery Call - TechCorp',
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 45),
        type: 'call',
        isSpeedrunRelated: true,
        relatedCompany: 'TechCorp',
        attendees: ['cto@techcorp.com']
      },
      {
        id: 'team-sync',
        title: 'Sales Team Sync',
        startTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 16, 0),
        endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 16, 30),
        type: 'internal'
      }
    ];

    const timeBlocks = this.generateTimeBlocks(startOfDay, endOfDay, events);
    
    const totalMeetingTime = events.reduce((total, event) => {
      return total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
    }, 0);
    
    const totalWorkingMinutes = (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60);
    const availableTime = totalWorkingMinutes - totalMeetingTime;
    const focusBlocks = timeBlocks.filter(block => block['type'] === 'focus' && block.isAvailable);

    return {
      date,
      events,
      timeBlocks,
      workingHours: { start: startOfDay, end: endOfDay },
      totalMeetingTime,
      availableTime,
      focusBlocks
    };
  }

  /**
   * Categorize event type from title
   */
  private categorizeEventType(title: string): CalendarEvent['type'] {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('demo') || lowerTitle.includes('presentation')) return 'demo';
    if (lowerTitle.includes('call') || lowerTitle.includes('phone')) return 'call';
    if (lowerTitle.includes('lunch') || lowerTitle.includes('break')) return 'break';
    if (lowerTitle.includes('focus') || lowerTitle.includes('deep work')) return 'focus';
    if (lowerTitle.includes('standup') || lowerTitle.includes('sync') || lowerTitle.includes('team')) return 'internal';
    
    return 'meeting';
  }

  /**
   * Check if event is speedrun related
   */
  private isSpeedrunRelated(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('demo') || 
           lowerTitle.includes('discovery') || 
           lowerTitle.includes('prospect') ||
           lowerTitle.includes('sales') ||
           (!lowerTitle.includes('standup') && !lowerTitle.includes('sync') && !lowerTitle.includes('team'));
  }

  /**
   * Extract company name from event title
   */
  private extractCompanyFromTitle(title: string): string {
    // Simple extraction - look for patterns like "Demo - Company Name" or "Call with Company"
    const patterns = [
      /(?:demo|call|meeting)\s*[-–]\s*([^-–\n]+)/i,
      /(?:with|@)\s+([A-Za-z][A-Za-z0-9\s&.]+?)(?:\s|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }
}
