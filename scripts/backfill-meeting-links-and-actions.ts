#!/usr/bin/env tsx

/**
 * Backfill Meeting Links and Actions
 * 
 * This script links existing calendar events to people/companies and creates action records
 * for meetings that don't have them yet.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('📅 Backfilling Meeting Links and Actions');
  console.log('='.repeat(70));
  console.log('');

  // Find all events without links
  const unlinkedEvents = await prisma.events.findMany({
    where: {
      OR: [
        { personId: null },
        { companyId: null }
      ]
    },
    select: {
      id: true,
      workspaceId: true,
      userId: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      location: true,
      attendees: true,
      organizer: true
    }
  });

  console.log(`📊 Found ${unlinkedEvents.length} events without links\n`);

  let linkedCount = 0;
  let actionCount = 0;

  for (const event of unlinkedEvents) {
    try {
      // Extract email addresses from attendees and organizer
      const emailAddresses = new Set<string>();
      
      if (event.attendees && Array.isArray(event.attendees)) {
        event.attendees.forEach((attendee: any) => {
          if (attendee.email) {
            emailAddresses.add(attendee.email.toLowerCase());
          }
        });
      }
      
      if (event.organizer && typeof event.organizer === 'object' && 'email' in event.organizer) {
        const organizerEmail = (event.organizer as any).email;
        if (organizerEmail) {
          emailAddresses.add(organizerEmail.toLowerCase());
        }
      }

      let personId: string | null = null;
      let companyId: string | null = null;

      // Link to people by email addresses
      if (emailAddresses.size > 0) {
        const person = await prisma.people.findFirst({
          where: {
            workspaceId: event.workspaceId,
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
        }
      }

      // If no person found, try to link to company by keywords in title/description
      if (!companyId && event.title) {
        const companyKeywords = extractCompanyKeywords(event.title, event.description || '');
        if (companyKeywords.length > 0) {
          const company = await prisma.companies.findFirst({
            where: {
              workspaceId: event.workspaceId,
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
          }
        }
      }

      // Update the event with linked entities
      if (personId || companyId) {
        await prisma.events.update({
          where: { id: event.id },
          data: {
            personId: personId || undefined,
            companyId: companyId || undefined
          }
        });
        linkedCount++;
        console.log(`✅ Linked event "${event.title}" (person: ${personId || 'none'}, company: ${companyId || 'none'})`);
      }

      // Create action record if linked
      if (personId || companyId) {
        // Check if action already exists
        const existingAction = await prisma.actions.findFirst({
          where: {
            workspaceId: event.workspaceId,
            personId: personId || undefined,
            companyId: companyId || undefined,
            type: 'MEETING',
            subject: event.title,
            completedAt: event.startTime
          }
        });

        if (!existingAction) {
      const now = new Date();
      const isCompleted = event.startTime < now;
      const status = isCompleted ? 'COMPLETED' : 'PENDING';

          await prisma.actions.create({
            data: {
              workspaceId: event.workspaceId,
              userId: event.userId,
              companyId: companyId || undefined,
              personId: personId || undefined,
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
          actionCount++;
          console.log(`   📅 Created ${status} action`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing event ${event.id}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Events linked: ${linkedCount}`);
  console.log(`   Actions created: ${actionCount}`);
  console.log(`\n✅ Backfill completed!`);

  await prisma.$disconnect();
}

function extractCompanyKeywords(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const keywords: string[] = [];

  // Common company indicators
  const companyIndicators = [
    'meeting with', 'call with', 'demo with', 'presentation to',
    'discussion with', 'interview with', 'sales call', 'client meeting'
  ];

  for (const indicator of companyIndicators) {
    const index = text.indexOf(indicator);
    if (index !== -1) {
      // Extract text after the indicator
      const afterIndicator = text.substring(index + indicator.length).trim();
      // Take first few words as potential company name
      const words = afterIndicator.split(/\s+/).slice(0, 3);
      if (words.length > 0) {
        keywords.push(words.join(' '));
      }
    }
  }

  return keywords;
}

main().catch(console.error);

