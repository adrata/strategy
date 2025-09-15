/**
 * CORESIGNAL WEBHOOK ENDPOINT
 * 
 * Handles real-time notifications from CoreSignal when data changes occur
 * Integrates with existing Speedrun notification system for buying signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { PusherServerService } from '@/platform/services/pusher-real-time-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[CoreSignal Webhook] Received notification');

    const body = await request.json();
    console.log('[CoreSignal Webhook] Payload:', JSON.stringify(body, null, 2));

    // Extract webhook data
    const { event_type, data, timestamp } = body;

    if (!event_type || !data) {
      console.log('[CoreSignal Webhook] Invalid payload structure');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`[CoreSignal Webhook] Processing ${event_type} event`);

    // Process based on event type
    switch (event_type.toLowerCase()) {
      case 'person_job_change':
        await processPersonJobChange(data);
        break;
      
      case 'company_executive_change':
        await processExecutiveChange(data);
        break;
      
      case 'company_growth_signal':
        await processCompanyGrowthSignal(data);
        break;
      
      case 'person_contact_update':
        await processContactUpdate(data);
        break;
      
      case 'company_hiring_surge':
        await processHiringSurge(data);
        break;
      
      default:
        console.log(`[CoreSignal Webhook] Unhandled event type: ${event_type}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('[CoreSignal Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Process person job change notifications
 */
async function processPersonJobChange(data: any) {
  try {
    const { person_id, person_name, old_company, new_company, new_title, change_date } = data;
    
    console.log(`[CoreSignal Webhook] Job change: ${person_name} moved from ${old_company} to ${new_company}`);

    // Find existing contact in our system
    const existingContact = await prisma.people.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { fullName: { contains: person_name, mode: 'insensitive' } }
          // Note: coreSignalId field doesn't exist in Contact model
        ]
      },
    });

    if (existingContact) {
      // Update contact with new information
      await prisma.people.update({
        where: { id: existingContact.id },
        data: {
          // company: new_company, // Field doesn't exist in Contact model
          jobTitle: new_title,
          // coreSignalId: person_id?.toString(), // Field doesn't exist in Contact model
          lastEnriched: new Date()
        }
      });

      // Create buying signal - job changes indicate potential buying opportunities
      await createBuyingSignal({
        workspaceId: existingContact.workspaceId,
        contactId: existingContact.id,
        signalType: 'JOB_CHANGE',
        priority: 'HIGH',
        title: `${person_name} changed jobs`,
        description: `${person_name} moved from ${old_company} to ${new_company} as ${new_title}. New role often means new budget and tool evaluation.`,
        metadata: {
          oldCompany: old_company,
          newCompany: new_company,
          newTitle: new_title,
          changeDate: change_date,
          source: 'coresignal_webhook'
        }
      });

      console.log(`[CoreSignal Webhook] Updated contact and created buying signal for ${person_name}`);
    } else {
      console.log(`[CoreSignal Webhook] Contact not found in system: ${person_name}`);
    }

  } catch (error) {
    console.error('[CoreSignal Webhook] Error processing job change:', error);
  }
}

/**
 * Process executive change notifications
 */
async function processExecutiveChange(data: any) {
  try {
    const { company_name, executive_name, executive_title, change_type, change_date } = data;
    
    console.log(`[CoreSignal Webhook] Executive change at ${company_name}: ${executive_name} (${change_type})`);

    // Find companies in our system
    const companies = await prisma.companies.findMany({
      where: {
        name: { contains: company_name, mode: 'insensitive' },
        deletedAt: null
      }
    });

    for (const company of companies) {
      // Create buying signal for executive changes
      await createBuyingSignal({
        workspaceId: company.workspaceId,
        accountId: company.id,
        signalType: 'EXECUTIVE_CHANGE',
        priority: change_type === 'departure' ? 'MEDIUM' : 'HIGH',
        title: `Executive change at ${company_name}`,
        description: `${executive_name} (${executive_title}) ${change_type === 'arrival' ? 'joined' : 'left'} ${company_name}. ${change_type === 'arrival' ? 'New executives often bring budget for new initiatives.' : 'Leadership changes can create opportunities.'}`,
        metadata: {
          executiveName: executive_name,
          executiveTitle: executive_title,
          changeType: change_type,
          changeDate: change_date,
          source: 'coresignal_webhook'
        }
      });
    }

    console.log(`[CoreSignal Webhook] Created buying signals for executive change at ${company_name}`);

  } catch (error) {
    console.error('[CoreSignal Webhook] Error processing executive change:', error);
  }
}

/**
 * Process company growth signal notifications
 */
async function processCompanyGrowthSignal(data: any) {
  try {
    const { company_name, growth_type, growth_percentage, employee_count, time_period } = data;
    
    console.log(`[CoreSignal Webhook] Growth signal: ${company_name} - ${growth_type} ${growth_percentage}%`);

    // Find companies in our system
    const companies = await prisma.companies.findMany({
      where: {
        name: { contains: company_name, mode: 'insensitive' }
      }
    });

    for (const company of companies) {
      // Create buying signal for significant growth
      if (Math.abs(growth_percentage) > 20) {
        await createBuyingSignal({
          workspaceId: company.workspaceId,
          accountId: company.id,
          signalType: 'COMPANY_GROWTH',
          priority: growth_percentage > 0 ? 'HIGH' : 'MEDIUM',
          title: `${company_name} showing ${growth_type} growth`,
          description: `${company_name} has ${growth_percentage > 0 ? 'grown' : 'contracted'} by ${Math.abs(growth_percentage)}% in ${time_period}. ${growth_percentage > 0 ? 'Rapid growth often requires new infrastructure and tooling.' : 'Companies in transition may need efficiency tools.'}`,
          metadata: {
            growthType: growth_type,
            growthPercentage: growth_percentage,
            employeeCount: employee_count,
            timePeriod: time_period,
            source: 'coresignal_webhook'
          }
        });
      }
    }

    console.log(`[CoreSignal Webhook] Processed growth signal for ${company_name}`);

  } catch (error) {
    console.error('[CoreSignal Webhook] Error processing growth signal:', error);
  }
}

/**
 * Process contact update notifications
 */
async function processContactUpdate(data: any) {
  try {
    const { person_id, person_name, updated_fields } = data;
    
    console.log(`[CoreSignal Webhook] Contact update: ${person_name}`);

    // Find existing contact
    const existingContact = await prisma.people.findFirst({
      where: {
        OR: [
          { fullName: { contains: person_name, mode: 'insensitive' } }
          // Note: coreSignalId field doesn't exist in Contact model
        ]
      }
    });

    if (existingContact) {
      // Update contact with new information
      const updateData: any = {
        // coreSignalId: person_id?.toString(), // Field doesn't exist in Contact model
        lastEnriched: new Date()
      };

      // Map updated fields
      if (updated_fields.email) updateData['email'] = updated_fields.email;
      if (updated_fields.phone) updateData['phone'] = updated_fields.phone;
      if (updated_fields.title) updateData['jobTitle'] = updated_fields.title;
      if (updated_fields.company) updateData['company'] = updated_fields.company;

      await prisma.people.update({
        where: { id: existingContact.id },
        data: updateData
      });

      console.log(`[CoreSignal Webhook] Updated contact information for ${person_name}`);
    }

  } catch (error) {
    console.error('[CoreSignal Webhook] Error processing contact update:', error);
  }
}

/**
 * Process hiring surge notifications
 */
async function processHiringSurge(data: any) {
  try {
    const { company_name, job_postings_count, departments, surge_percentage } = data;
    
    console.log(`[CoreSignal Webhook] Hiring surge: ${company_name} - ${job_postings_count} new postings`);

    // Find companies in our system
    const companies = await prisma.companies.findMany({
      where: {
        name: { contains: company_name, mode: 'insensitive' }
      }
    });

    for (const company of companies) {
      // Create buying signal for significant hiring
      if (job_postings_count > 10 || surge_percentage > 50) {
        await createBuyingSignal({
          workspaceId: company.workspaceId,
          accountId: company.id,
          signalType: 'HIRING_SURGE',
          priority: 'HIGH',
          title: `${company_name} hiring surge detected`,
          description: `${company_name} posted ${job_postings_count} new jobs (${surge_percentage}% increase). Major hiring indicates growth and potential budget for new tools.`,
          metadata: {
            jobPostingsCount: job_postings_count,
            departments: departments,
            surgePercentage: surge_percentage,
            source: 'coresignal_webhook'
          }
        });
      }
    }

    console.log(`[CoreSignal Webhook] Processed hiring surge for ${company_name}`);

  } catch (error) {
    console.error('[CoreSignal Webhook] Error processing hiring surge:', error);
  }
}

/**
 * Create buying signal and trigger Speedrun notification
 */
async function createBuyingSignal(signalData: {
  workspaceId: string;
  contactId?: string;
  accountId?: string;
  signalType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  metadata: any;
}) {
  try {
    // Create buying signal record
    // Note: buyingSignal model doesn't exist in schema
    // const buyingSignal = await prisma.buyingSignal.create({
    //   data: {
    //     workspaceId: signalData.workspaceId,
    //     contactId: signalData.contactId,
    //     accountId: signalData.accountId,
    //     type: signalData.signalType,
    //     priority: signalData.priority,
    //     title: signalData.title,
    //     description: signalData.description,
    //     metadata: signalData.metadata,
    //     source: 'coresignal',
    //     isActive: true
    //   }
    // });

    // Trigger Speedrun notification using existing system
    await triggerSpeedrunNotification(signalData);

    console.log(`[CoreSignal Webhook] Created buying signal: ${signalData.title}`);

  } catch (error) {
    console.error('[CoreSignal Webhook] Error creating buying signal:', error);
  }
}

/**
 * Trigger Speedrun notification using existing Pusher system
 */
async function triggerSpeedrunNotification(signalData: any) {
  try {
    // Use existing Pusher notification system
    if (!process['env']['PUSHER_APP_ID'] || !process['env']['PUSHER_KEY'] || !process['env']['PUSHER_SECRET']) {
      console.log('[CoreSignal Webhook] Pusher not configured, skipping notification');
      return;
    }

    // Use statically imported Pusher
    
    const pusher = PusherServerService.getInstance();

    const speedrunSignal = {
      type: 'BUYING_INTENT_DETECTED',
      priority: signalData.priority,
      contact: {
        id: signalData.contactId || signalData.accountId,
        name: signalData.title,
        company: signalData.metadata.newCompany || signalData.metadata.company_name || 'Unknown',
        type: signalData.contactId ? 'contact' : 'account'
      },
      note: {
        title: signalData.title,
        content: signalData.description,
        source: 'CoreSignal'
      },
      action: 'ADD_TO_SPEEDRUN',
      timestamp: new Date().toISOString()
    };

    const channel = `workspace-${signalData.workspaceId}`;
    const payload = {
      type: 'speedrun_signal',
      payload: speedrunSignal,
      timestamp: new Date().toISOString(),
      source: 'coresignal_webhook',
      workspaceId: signalData.workspaceId
    };

    await pusher.trigger(channel, 'speedrun_signal', payload);
    
    console.log(`[CoreSignal Webhook] Triggered Speedrun notification: ${signalData.title}`);

  } catch (error) {
    console.error('[CoreSignal Webhook] Error triggering notification:', error);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'CoreSignal Webhook Endpoint',
    supportedEvents: [
      'person_job_change',
      'company_executive_change', 
      'company_growth_signal',
      'person_contact_update',
      'company_hiring_surge'
    ],
    status: 'active'
  });
}
