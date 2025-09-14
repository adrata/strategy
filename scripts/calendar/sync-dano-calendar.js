const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncDanoCalendar() {
  try {
    console.log('📅 SYNCING DANO\'S CALENDAR EVENTS');
    console.log('='.repeat(50));
    console.log('');
    
    // Dano's user and workspace information (from debug output)
    const danoUserId = '01K1VBYV7TRPY04NW4TW4XWRB';
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // 1. Get Dano's Microsoft access token
    console.log('🔐 GETTING ACCESS TOKEN:');
    console.log('-'.repeat(30));
    
    // Get Dano's Outlook account directly by ID (from debug output)
    const emailAccount = await prisma.email_accounts.findUnique({
      where: {
        id: 'account_1754030982627_cmdse3ror0000pc2wpuwlowp9'
      }
    });
    
    if (!emailAccount) {
      console.log('❌ No email account found for Dano');
      return;
    }
    
    console.log(`✅ Found email account: ${emailAccount.email}`);
    console.log(`   Platform: ${emailAccount.platform}`);
    console.log(`   Sync Status: ${emailAccount.syncStatus}`);
    console.log(`   Has Access Token: ${emailAccount.accessToken ? 'Yes' : 'No'}`);
    console.log(`   Token Expires: ${emailAccount.expiresAt ? emailAccount.expiresAt.toLocaleString() : 'N/A'}`);
    
    if (!emailAccount.accessToken) {
      console.log('❌ No access token found in email account');
      return;
    }
    
    // Check if token is expired
    if (emailAccount.expiresAt && emailAccount.expiresAt < new Date()) {
      console.log('❌ Microsoft access token is expired');
      return;
    }
    
    console.log('✅ Found valid Microsoft access token');
    console.log('');
    
    // 2. Get or create Dano's primary calendar
    console.log('📅 SETTING UP CALENDAR:');
    console.log('-'.repeat(30));
    
    let calendar = await prisma.calendar.findFirst({
      where: {
        userId: danoUserId,
        workspaceId: danoWorkspaceId,
        platform: 'microsoft',
        isPrimary: true
      }
    });
    
    if (!calendar) {
      calendar = await prisma.calendar.create({
        data: {
          workspaceId: danoWorkspaceId,
          userId: danoUserId,
          name: 'Dano\'s Outlook Calendar',
          description: 'Primary Microsoft Outlook calendar for Dano',
          platform: 'microsoft',
          isPrimary: true,
          isActive: true,
          externalId: 'primary',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created primary calendar: ${calendar.id}`);
    } else {
      console.log(`✅ Found existing calendar: ${calendar.id}`);
    }
    
    console.log('');
    
    // 3. Fetch calendar events from Microsoft Graph API
    console.log('📅 FETCHING CALENDAR EVENTS:');
    console.log('-'.repeat(30));
    
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const threeMonthsFromNow = new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000);
    
    console.log(`   Fetching events from ${sixMonthsAgo.toLocaleDateString()} to ${threeMonthsFromNow.toLocaleDateString()}`);
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${sixMonthsAgo.toISOString()}' and start/dateTime le '${threeMonthsFromNow.toISOString()}'&$orderby=start/dateTime&$top=1000`,
      {
        headers: {
          'Authorization': `Bearer ${emailAccount.accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Microsoft Graph API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const events = data.value || [];
    
    console.log(`✅ Fetched ${events.length} events from Microsoft Graph API`);
    console.log('');
    
    // 4. Process and store events
    console.log('💾 PROCESSING EVENTS:');
    console.log('-'.repeat(30));
    
    let eventsCreated = 0;
    let eventsUpdated = 0;
    let eventsLinked = 0;
    
    for (const [index, event] of events.entries()) {
      try {
        // Check if event already exists
        const existingEvent = await prisma.events.findFirst({
          where: {
            externalId: event.id,
            platform: 'microsoft'
          }
        });
        
        const eventData = {
          workspaceId: danoWorkspaceId,
          userId: danoUserId,
          calendarId: calendar.id,
          title: event.subject || 'Untitled Event',
          description: event.body?.content || '',
          location: event.location?.displayName || '',
          startTime: new Date(event.start.dateTime || event.start.date),
          endTime: new Date(event.end.dateTime || event.end.date),
          isAllDay: !event.start.dateTime,
          isRecurring: !!event.recurrence,
          recurrenceRule: event.recurrence?.pattern ? convertRecurrenceRule(event.recurrence) : undefined,
          status: event.isCancelled ? 'cancelled' : event.showAs === 'tentative' ? 'tentative' : 'confirmed',
          visibility: event.sensitivity === 'private' ? 'private' : 'default',
          platform: 'microsoft',
          externalId: event.id,
          meetingUrl: event.onlineMeeting?.joinUrl || event.location?.locationUri,
          attendees: event.attendees?.map((attendee) => ({
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
          }] : undefined,
          updatedAt: new Date(),
          syncedAt: new Date()
        };
        
        if (existingEvent) {
          // Update existing event
          await prisma.events.update({
            where: { id: existingEvent.id },
            data: eventData
          });
          eventsUpdated++;
        } else {
          // Create new event
          const newEvent = await prisma.events.create({
            data: eventData
          });
          
          // Link event to entities
          const linkedCount = await linkEventToEntities(newEvent.id, event, danoWorkspaceId);
          eventsLinked += linkedCount;
          eventsCreated++;
        }
        
        if ((index + 1) % 50 === 0) {
          console.log(`   Processed ${index + 1}/${events.length} events...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error.message);
      }
    }
    
    // 5. Update calendar sync timestamp
    await prisma.calendar.update({
      where: { id: calendar.id },
      data: { 
        lastSyncAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('');
    console.log('📊 SYNC SUMMARY:');
    console.log('='.repeat(50));
    console.log(`   Events fetched: ${events.length}`);
    console.log(`   Events created: ${eventsCreated}`);
    console.log(`   Events updated: ${eventsUpdated}`);
    console.log(`   Entity links created: ${eventsLinked}`);
    console.log(`   Calendar: ${calendar.name}`);
    console.log('');
    
    // 6. Show sample of events
    console.log('🔗 SAMPLE EVENTS:');
    console.log('-'.repeat(30));
    
    const sampleEvents = await prisma.events.findMany({
      where: {
        userId: danoUserId,
        workspaceId: danoWorkspaceId
      },
      orderBy: { startTime: 'desc' },
      take: 5
    });
    
    sampleEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. "${event.title}"`);
      console.log(`      Date: ${event.startTime.toLocaleDateString()}`);
      console.log(`      Location: ${event.location || 'No location'}`);
      console.log(`      Status: ${event.status}`);
      console.log(`      Platform: ${event.platform}`);
      console.log('');
    });
    
    console.log('🎉 DANO\'S CALENDAR SYNC COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Calendar events are now linked to:');
    console.log('   - Contacts (by email addresses)');
    console.log('   - Accounts (by company names)');
    console.log('   - Leads, Opportunities, Prospects');
    console.log('   - Persons and Companies');
    console.log('');
    console.log('📅 Events will appear in timeline views for all linked entities!');
    
  } catch (error) {
    console.error('❌ Calendar sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Link calendar event to entities based on attendees and content
 */
async function linkEventToEntities(eventId, platformEvent, workspaceId) {
  let linkCount = 0;
  
  // Extract email addresses from attendees and organizer
  const emailAddresses = new Set();
  
  if (platformEvent.attendees) {
    platformEvent.attendees.forEach(attendee => {
      if (attendee.emailAddress?.address) {
        emailAddresses.add(attendee.emailAddress.address.toLowerCase());
      }
    });
  }
  
  if (platformEvent.organizer?.emailAddress?.address) {
    emailAddresses.add(platformEvent.organizer.emailAddress.address.toLowerCase());
  }
  
  // Link to contacts
  if (emailAddresses.size > 0) {
    const contacts = await prisma.contacts.findMany({
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
      try {
        await prisma.eventToContact.create({
          data: {
            A: eventId,
            B: contact.id
          }
        });
        linkCount++;
      } catch (error) {
        // Ignore duplicate link errors
      }
    }
  }
  
  // Link to accounts (by company name in title/description)
  const companyKeywords = extractCompanyKeywords(platformEvent.subject, platformEvent.body?.content);
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
      try {
        await prisma.eventToAccount.create({
          data: {
            A: eventId,
            B: account.id
          }
        });
        linkCount++;
      } catch (error) {
        // Ignore duplicate link errors
      }
    }
  }
  
  // Link to leads
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
      try {
        await prisma.eventToLead.create({
          data: {
            A: eventId,
            B: lead.id
          }
        });
        linkCount++;
      } catch (error) {
        // Ignore duplicate link errors
      }
    }
  }
  
  // Link to opportunities
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
      try {
        await prisma.eventToOpportunity.create({
          data: {
            A: eventId,
            B: opportunity.id
          }
        });
        linkCount++;
      } catch (error) {
        // Ignore duplicate link errors
      }
    }
  }
  
  // Link to prospects
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
      try {
        await prisma.eventToProspect.create({
          data: {
            A: eventId,
            B: prospect.id
          }
        });
        linkCount++;
      } catch (error) {
        // Ignore duplicate link errors
      }
    }
  }
  
  // Link to persons
  if (emailAddresses.size > 0) {
    const persons = await prisma.person.findMany({
      where: {
        email: { in: Array.from(emailAddresses) }
      }
    });
    
    for (const person of persons) {
      try {
        await prisma.eventToPerson.create({
          data: {
            A: eventId,
            B: person.id
          }
        });
        linkCount++;
      } catch (error) {
        // Ignore duplicate link errors
      }
    }
  }
  
  // Link to companies
  if (companyKeywords.length > 0) {
    const companies = await prisma.company.findMany({
      where: {
        OR: companyKeywords.map(keyword => ({
          name: { contains: keyword, mode: 'insensitive' }
        }))
      }
    });
    
    for (const company of companies) {
      try {
        await prisma.eventToCompany.create({
          data: {
            A: eventId,
            B: company.id
          }
        });
        linkCount++;
      } catch (error) {
        // Ignore duplicate link errors
      }
    }
  }
  
  return linkCount;
}

/**
 * Extract company keywords from event title and description
 */
function extractCompanyKeywords(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const keywords = [];
  
  // Common company indicators
  const companyIndicators = [
    'meeting with', 'call with', 'demo with', 'presentation to',
    'discussion with', 'interview with', 'sales call', 'client meeting',
    'with', 'at', 'for'
  ];
  
  for (const indicator of companyIndicators) {
    const index = text.indexOf(indicator);
    if (index !== -1) {
      const afterIndicator = text.substring(index + indicator.length).trim();
      const words = afterIndicator.split(/\s+/).slice(0, 3); // Take up to 3 words after indicator
      keywords.push(...words.filter(word => word.length > 2 && !word.match(/^(the|and|or|but|in|on|at|to|for|of|with|by)$/)));
    }
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Convert Microsoft recurrence pattern to RRULE format
 */
function convertRecurrenceRule(recurrence) {
  const pattern = recurrence.pattern;
  const range = recurrence.range;
  
  let rrule = 'RRULE:';
  
  if (pattern.type === 'daily') {
    rrule += 'FREQ=DAILY';
  } else if (pattern.type === 'weekly') {
    rrule += 'FREQ=WEEKLY';
  } else if (pattern.type === 'monthly') {
    rrule += 'FREQ=MONTHLY';
  } else if (pattern.type === 'yearly') {
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

syncDanoCalendar();
