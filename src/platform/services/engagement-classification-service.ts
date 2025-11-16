/**
 * Engagement Classification Service
 * 
 * Automatically classifies people and companies based on engagement:
 * - PROSPECT: People/companies who have replied to emails (engaged)
 * - OPPORTUNITY: Situations where real business was discussed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EngagementClassificationService {
  /**
   * Check if an email is a reply
   */
  private static isEmailReply(email: {
    subject?: string | null;
    threadId?: string | null;
    inReplyTo?: string | null;
  }): boolean {
    // Check if subject starts with "Re:" or "RE:" or "Fwd:" (common reply indicators)
    const subject = (email.subject || '').trim();
    if (subject.match(/^(Re|RE|Fwd|FWD|Fw|FW):\s*/i)) {
      return true;
    }

    // Check if email is part of a thread (has threadId and inReplyTo)
    if (email.threadId && email.inReplyTo) {
      return true;
    }

    return false;
  }

  /**
   * Check if content suggests business discussion (for opportunity detection)
   */
  private static suggestsBusinessDiscussion(
    subject: string | null | undefined,
    body: string | null | undefined,
    title?: string | null | undefined
  ): boolean {
    const text = `${subject || ''} ${body || ''} ${title || ''}`.toLowerCase();

    // Business discussion keywords
    const businessKeywords = [
      'proposal', 'quote', 'pricing', 'contract', 'agreement', 'deal',
      'project', 'scope', 'sow', 'statement of work', 'rfp', 'rfq',
      'budget', 'investment', 'purchase', 'buy', 'buying', 'procurement',
      'implementation', 'deployment', 'integration', 'onboarding',
      'timeline', 'deadline', 'deliverable', 'milestone',
      'demo', 'demonstration', 'trial', 'pilot', 'proof of concept',
      'meeting', 'call', 'discussion', 'consultation',
      'requirements', 'needs', 'solution', 'service', 'product',
      'opportunity', 'partnership', 'collaboration'
    ];

    // Check for multiple business keywords (more reliable than single keyword)
    const keywordMatches = businessKeywords.filter(keyword => text.includes(keyword)).length;
    
    // If 2+ business keywords found, likely business discussion
    return keywordMatches >= 2;
  }

  /**
   * Check if email is FROM a person (they initiated contact)
   * This includes both replies AND first-contact emails
   */
  private static isEmailFromPerson(email: {
    from: string;
    personId?: string | null;
    to?: string[] | null;
  }): boolean {
    // Email must be linked to a person (FROM field matched to a person in our system)
    return !!email.personId;
  }

  /**
   * Cascade company prospect status to all people at the company
   * When one person becomes a prospect, all other people at their company should also become prospects
   * 
   * @param directEngagerId - The person who directly engaged (replied/contacted)
   * @param companyId - The company ID
   * @param workspaceId - The workspace ID
   * @returns Object with counts of people and company updated
   */
  static async cascadeCompanyProspectStatus(
    directEngagerId: string,
    companyId: string | null,
    workspaceId: string
  ): Promise<{ peopleUpdated: number; companyUpdated: boolean }> {
    if (!companyId) {
      return { peopleUpdated: 0, companyUpdated: false };
    }

    let peopleUpdated = 0;
    let companyUpdated = false;

    try {
      // Get the direct engager's name for statusReason
      const directEngager = await prisma.people.findUnique({
        where: { id: directEngagerId },
        select: { fullName: true, firstName: true, lastName: true }
      });

      const engagerName = directEngager?.fullName || 
                         `${directEngager?.firstName || ''} ${directEngager?.lastName || ''}`.trim() || 
                         'a colleague';

      // Update company status to PROSPECT if not already higher
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
        select: { id: true, status: true }
      });

      if (company && company.status !== 'PROSPECT' && company.status !== 'OPPORTUNITY' && 
          company.status !== 'CLIENT' && company.status !== 'SUPERFAN') {
        await prisma.companies.update({
          where: { id: companyId },
          data: {
            status: 'PROSPECT'
          }
        });
        companyUpdated = true;
        console.log(`✅ [CASCADE] Updated company ${companyId} to PROSPECT`);
      }

      // Find all other people at the same company
      const companyPeople = await prisma.people.findMany({
        where: {
          workspaceId,
          companyId,
          id: { not: directEngagerId }, // Exclude the direct engager
          deletedAt: null
        },
        select: {
          id: true,
          status: true,
          fullName: true
        }
      });

      // Update each person to PROSPECT if they're LEAD or lower
      for (const person of companyPeople) {
        // Only update if status is LEAD or lower (not already PROSPECT/OPPORTUNITY/CLIENT)
        if (person.status === 'LEAD' || !person.status || 
            (person.status !== 'PROSPECT' && person.status !== 'OPPORTUNITY' && 
             person.status !== 'CLIENT' && person.status !== 'SUPERFAN' && person.status !== 'PARTNER')) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              status: 'PROSPECT',
              statusUpdateDate: new Date(),
              statusReason: `Company became prospect via ${engagerName}`
            }
          });
          peopleUpdated++;
          console.log(`✅ [CASCADE] Updated person ${person.id} (${person.fullName}) to PROSPECT - company cascade`);
        }
      }

      if (peopleUpdated > 0) {
        console.log(`✅ [CASCADE] Updated ${peopleUpdated} people at company ${companyId} to PROSPECT`);
      }

    } catch (error) {
      console.error(`❌ [CASCADE] Error cascading prospect status for company ${companyId}:`, error);
    }

    return { peopleUpdated, companyUpdated };
  }

  /**
   * Classify person/company based on email engagement
   * Handles both:
   * 1. Replies (they replied to us) - indicates engagement
   * 2. First contact (they emailed us first) - also indicates engagement
   */
  static async classifyFromEmail(
    email: {
      id: string;
      subject?: string | null;
      body?: string | null;
      threadId?: string | null;
      inReplyTo?: string | null;
      from: string;
      to?: string[] | null;
      personId?: string | null;
      companyId?: string | null;
      workspaceId: string;
    }
  ): Promise<{ personUpdated: boolean; companyUpdated: boolean }> {
    let personUpdated = false;
    let companyUpdated = false;

    try {
      // Only classify if email is FROM a person in our system (they contacted us)
      if (!email.personId) {
        return { personUpdated: false, companyUpdated: false };
      }

      // Check if this is a reply OR first contact
      const isReply = this.isEmailReply(email);
      const isFirstContact = !isReply && this.isEmailFromPerson(email);

      // Both replies and first contacts indicate engagement
      if (!isReply && !isFirstContact) {
        return { personUpdated: false, companyUpdated: false };
      }

      const contactType = isReply ? 'reply' : 'first contact';
      console.log(`🎯 [ENGAGEMENT] Email ${email.id} is a ${contactType} FROM person ${email.personId} - classifying as PROSPECT`);

      // Update person status to PROSPECT if they replied
      if (email.personId) {
        const person = await prisma.people.findUnique({
          where: { id: email.personId },
          select: { id: true, status: true }
        });

        if (person && person.status !== 'PROSPECT' && person.status !== 'OPPORTUNITY' && person.status !== 'CLIENT') {
          await prisma.people.update({
            where: { id: email.personId },
            data: {
              status: 'PROSPECT',
              statusUpdateDate: new Date(),
              statusReason: isReply ? 'Replied to email' : 'Initiated contact via email'
            }
          });
          personUpdated = true;
          console.log(`✅ [ENGAGEMENT] Updated person ${email.personId} to PROSPECT`);

          // Cascade: Update company and all other people at company to PROSPECT
          if (email.companyId) {
            const cascadeResult = await this.cascadeCompanyProspectStatus(
              email.personId,
              email.companyId,
              email.workspaceId
            );
            if (cascadeResult.peopleUpdated > 0 || cascadeResult.companyUpdated) {
              companyUpdated = cascadeResult.companyUpdated;
            }
          }
        }
      }

      // Company status is now updated via cascade method above

      // Check for business discussion keywords (for opportunity detection)
      const suggestsBusiness = this.suggestsBusinessDiscussion(email.subject, email.body);

      if (suggestsBusiness) {
        console.log(`💼 [ENGAGEMENT] Email ${email.id} suggests business discussion - classifying as OPPORTUNITY`);

        // Update person to OPPORTUNITY if business discussion detected
        if (email.personId) {
          const person = await prisma.people.findUnique({
            where: { id: email.personId },
            select: { id: true, status: true }
          });

          if (person && person.status !== 'OPPORTUNITY' && person.status !== 'CLIENT') {
            await prisma.people.update({
              where: { id: email.personId },
              data: {
                status: 'OPPORTUNITY',
                statusUpdateDate: new Date(),
                statusReason: 'Business discussion detected in email'
              }
            });
            personUpdated = true;
            console.log(`✅ [ENGAGEMENT] Updated person ${email.personId} to OPPORTUNITY`);
          }
        }

        // Update company to OPPORTUNITY
        if (email.companyId) {
          const company = await prisma.companies.findUnique({
            where: { id: email.companyId },
            select: { id: true, status: true }
          });

          if (company && company.status !== 'OPPORTUNITY' && company.status !== 'CLIENT' && company.status !== 'SUPERFAN') {
            await prisma.companies.update({
              where: { id: email.companyId },
              data: {
                status: 'OPPORTUNITY'
              }
            });
            companyUpdated = true;
            console.log(`✅ [ENGAGEMENT] Updated company ${email.companyId} to OPPORTUNITY`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ [ENGAGEMENT] Error classifying from email ${email.id}:`, error);
    }

    return { personUpdated, companyUpdated };
  }

  /**
   * Classify person/company based on meeting
   */
  static async classifyFromMeeting(
    meeting: {
      id: string;
      title: string;
      description?: string | null;
      personId?: string | null;
      companyId?: string | null;
      workspaceId: string;
    }
  ): Promise<{ personUpdated: boolean; companyUpdated: boolean }> {
    let personUpdated = false;
    let companyUpdated = false;

    try {
      // Check if meeting suggests business discussion
      const suggestsBusiness = this.suggestsBusinessDiscussion(meeting.title, meeting.description, meeting.title);

      if (!suggestsBusiness) {
        return { personUpdated: false, companyUpdated: false };
      }

      console.log(`💼 [ENGAGEMENT] Meeting ${meeting.id} suggests business discussion - classifying as OPPORTUNITY`);

      // Update person to OPPORTUNITY
      if (meeting.personId) {
        const person = await prisma.people.findUnique({
          where: { id: meeting.personId },
          select: { id: true, status: true }
        });

        if (person) {
          const currentStatus = person.status;
          
          // Skip if already OPPORTUNITY or CLIENT
          if (currentStatus === 'OPPORTUNITY' || currentStatus === 'CLIENT') {
            return { personUpdated: false, companyUpdated: false };
          }

          // First ensure they're at least PROSPECT (if they're LEAD or lower)
          const needsProspectUpgrade = currentStatus === 'LEAD' || 
                                       currentStatus === null || 
                                       currentStatus === 'PARTNER' ||
                                       currentStatus === 'SUPERFAN' ||
                                       (currentStatus !== 'PROSPECT' && currentStatus !== 'OPPORTUNITY' && currentStatus !== 'CLIENT');
          
          if (needsProspectUpgrade) {
            await prisma.people.update({
              where: { id: meeting.personId },
              data: {
                status: 'PROSPECT',
                statusUpdateDate: new Date(),
                statusReason: 'Attended meeting'
              }
            });
            personUpdated = true;

            // Cascade: Update company and all other people at company to PROSPECT
            if (meeting.companyId) {
              await this.cascadeCompanyProspectStatus(
                meeting.personId,
                meeting.companyId,
                meeting.workspaceId
              );
            }
          }

          // Then upgrade to OPPORTUNITY (if not already)
          const updatedPerson = await prisma.people.findUnique({
            where: { id: meeting.personId },
            select: { status: true }
          });

          if (updatedPerson && updatedPerson.status !== 'OPPORTUNITY' && updatedPerson.status !== 'CLIENT') {
            await prisma.people.update({
              where: { id: meeting.personId },
              data: {
                status: 'OPPORTUNITY',
                statusUpdateDate: new Date(),
                statusReason: 'Business discussion detected in meeting'
              }
            });
            personUpdated = true;
            console.log(`✅ [ENGAGEMENT] Updated person ${meeting.personId} to OPPORTUNITY`);
          }
        }
      }

      // Update company to OPPORTUNITY
      if (meeting.companyId) {
        const company = await prisma.companies.findUnique({
          where: { id: meeting.companyId },
          select: { id: true, status: true }
        });

        if (company && company.status !== 'OPPORTUNITY' && company.status !== 'CLIENT' && company.status !== 'SUPERFAN') {
          await prisma.companies.update({
            where: { id: meeting.companyId },
            data: {
              status: 'OPPORTUNITY'
            }
          });
          companyUpdated = true;
          console.log(`✅ [ENGAGEMENT] Updated company ${meeting.companyId} to OPPORTUNITY`);
        }
      }

    } catch (error) {
      console.error(`❌ [ENGAGEMENT] Error classifying from meeting ${meeting.id}:`, error);
    }

    return { personUpdated, companyUpdated };
  }

  /**
   * Backfill classification for existing emails
   */
  static async backfillFromEmails(workspaceId: string): Promise<{ processed: number; updated: number }> {
    console.log(`🔄 [ENGAGEMENT] Starting backfill classification for workspace ${workspaceId}`);

    let processed = 0;
    let updated = 0;
    let skip = 0;
    const batchSize = 100;

    while (true) {
      const emails = await prisma.email_messages.findMany({
        where: {
          workspaceId,
          OR: [
            { personId: { not: null } },
            { companyId: { not: null } }
          ]
        },
        select: {
          id: true,
          subject: true,
          body: true,
          threadId: true,
          from: true,
          personId: true,
          companyId: true,
          workspaceId: true
        },
        take: batchSize,
        skip
      });

      if (emails.length === 0) {
          break;
      }

      for (const email of emails) {
        processed++;
        const result = await this.classifyFromEmail(email);
        if (result.personUpdated || result.companyUpdated) {
          updated++;
        }
      }

      skip += batchSize;
      console.log(`🔄 [ENGAGEMENT] Processed ${processed} emails, updated ${updated} records`);
    }

    console.log(`✅ [ENGAGEMENT] Backfill complete: ${processed} emails processed, ${updated} records updated`);
    return { processed, updated };
  }
}
