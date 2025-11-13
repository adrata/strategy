import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { PusherServerService } from '@/platform/services/pusher-real-time-service';
import { storeSignal } from '@/platform/services/signal-storage';
import { createEntityRecord } from '@/platform/services/entity/entityService';
// import { zohoNotificationService } from '@/platform/services/zoho-notification-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 🔔 ZOHO CRM WEBHOOK ENDPOINT
 * 
 * Handles real-time notifications from Zoho CRM when records are created, updated, or deleted
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [ZOHO WEBHOOK] Received webhook notification');
    console.log('🔔 [ZOHO WEBHOOK] URL:', request.url);
    console.log('🔔 [ZOHO WEBHOOK] Method:', request.method);

    // Log headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📋 [ZOHO WEBHOOK] Headers:', JSON.stringify(headers, null, 2));
    
    // Log raw body for debugging
    const clonedRequest = request.clone();
    const rawBody = await clonedRequest.text();
    console.log('📍 [ZOHO WEBHOOK] Raw Body:', rawBody);
    console.log('📍 [ZOHO WEBHOOK] Raw Body Length:', rawBody.length);

    // Handle different content types from Zoho
    let body;
    const contentType = request.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData);
      } else {
        // Try JSON first, fallback to text
        const text = await request.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text };
        }
      }
    } catch (error) {
      console.error('❌ [ZOHO WEBHOOK] Failed to parse body:', error);
      body = { error: 'Failed to parse body' };
    }
    
    console.log('📍 [ZOHO WEBHOOK] Content-Type:', contentType);
    console.log('📍 [ZOHO WEBHOOK] Payload:', JSON.stringify(body, null, 2));

    // Process the webhook data - Zoho sends whatever JSON structure we define
    // Auto-detect module type and route to appropriate handler
    
    if (body && typeof body === 'object') {
      // Detect module type based on field patterns
      let moduleType = 'unknown';
      let operation = body.operation || body.Operation || 'create'; // Extract operation from body
      
      console.log(`🔍 [ZOHO WEBHOOK] Detected operation: ${operation}`);
      
      // LEADS: Has First_Name, Last_Name, Email, Company
      if (body.First_Name || body.Last_Name || body.Email || body.Company) {
        moduleType = 'leads';
        console.log('✅ [ZOHO WEBHOOK] Detected LEADS data');
        console.log('✅ [ZOHO WEBHOOK] First_Name:', body.First_Name);
        console.log('✅ [ZOHO WEBHOOK] Last_Name:', body.Last_Name);
        console.log('✅ [ZOHO WEBHOOK] Email:', body.Email);
        console.log('✅ [ZOHO WEBHOOK] Company:', body.Company);
        await processLeadData(body);
      }
      // CONTACTS: Has First_Name, Last_Name, Title, Department, Account_Name
      else if (body['Title'] && (body.Department || body.Account_Name)) {
        moduleType = 'people';
        console.log('✅ [ZOHO WEBHOOK] Detected CONTACTS data');
        console.log('✅ [ZOHO WEBHOOK] Title:', body.Title);
        console.log('✅ [ZOHO WEBHOOK] Department:', body.Department);
        console.log('✅ [ZOHO WEBHOOK] Account_Name:', body.Account_Name);
        await processContactWebhook(operation, [body]);
      }
      // ACCOUNTS: Has Account_Name, Website, Industry, Employees
      else if (body.Account_Name || (body['Website'] && body.Industry)) {
        moduleType = 'companies';
        console.log('✅ [ZOHO WEBHOOK] Detected ACCOUNTS data');
        await processAccountWebhook(operation, [body]);
      }
      // DEALS: Has Deal_Name, Amount, Stage, Probability
      else if (body.Deal_Name || (body['Amount'] && body.Stage)) {
        moduleType = 'deals';
        console.log('✅ [ZOHO WEBHOOK] Detected DEALS data');
        await processDealWebhook(operation, [body]);
      }
      // NOTES: Has Note_Content, Note_Title, Parent_Id
      else if (body.Note_Content || body.Note_Title || body.Parent_Id) {
        moduleType = 'notes';
        console.log('✅ [ZOHO WEBHOOK] Detected NOTES data');
        await processNotesWebhook(operation, [body]);
      }
      // TASKS: Has Task_Title, Task_Status, Due_Date
      else if (body.Task_Title || body.Task_Status || body.Due_Date) {
        moduleType = 'tasks';
        console.log('✅ [ZOHO WEBHOOK] Detected TASKS data');
        await processTasksWebhook(operation, [body]);
      }
      // MEETINGS: Has Subject, Start_DateTime, End_DateTime
      else if (body.Subject || body.Start_DateTime || body.End_DateTime) {
        moduleType = 'meetings';
        console.log('✅ [ZOHO WEBHOOK] Detected MEETINGS data');
        await processMeetingsWebhook(operation, [body]);
      }
      // FALLBACK: Try to detect from field names
      else {
        console.log('🔍 [ZOHO WEBHOOK] Auto-detecting module from fields...');
        const fields = Object.keys(body);
        
        if (fields.some(f => f.includes('Deal') || f.includes('Amount') || f.includes('Stage'))) {
          moduleType = 'deals';
          console.log('✅ [ZOHO WEBHOOK] Auto-detected DEALS from field names');
          await processDealWebhook(operation, [body]);
        }
        else if (fields.some(f => f.includes('Account') || f.includes('Website') || f.includes('Industry'))) {
          moduleType = 'companies';
          console.log('✅ [ZOHO WEBHOOK] Auto-detected ACCOUNTS from field names');
          await processAccountWebhook(operation, [body]);
        }
        else if (fields.some(f => f.includes('Title') || f.includes('Department'))) {
          moduleType = 'people';
          console.log('✅ [ZOHO WEBHOOK] Auto-detected CONTACTS from field names');
          await processContactWebhook(operation, [body]);
        }
        else if (fields.some(f => f.includes('Note') || f.includes('Parent'))) {
          moduleType = 'notes';
          console.log('✅ [ZOHO WEBHOOK] Auto-detected NOTES from field names');
          await processNotesWebhook(operation, [body]);
        }
        else if (fields.some(f => f.includes('Task') || f.includes('Due_Date') || f.includes('Subject'))) {
          moduleType = 'tasks';
          console.log('✅ [ZOHO WEBHOOK] Auto-detected TASKS from field names');
          await processTasksWebhook(operation, [body]);
        }
        else if (fields.some(f => f.includes('Subject') || f.includes('DateTime') || f.includes('Start') || f.includes('End'))) {
          moduleType = 'meetings';
          console.log('✅ [ZOHO WEBHOOK] Auto-detected MEETINGS from field names');
          await processMeetingsWebhook(operation, [body]);
        }
        else {
          // Default to leads for backward compatibility
          moduleType = 'leads';
          console.log('⚠️ [ZOHO WEBHOOK] Unknown structure, defaulting to LEADS processing');
          await processLeadData(body);
        }
        
        console.log('📊 [ZOHO WEBHOOK] Available fields:', fields);
      }
      
      console.log(`🎯 [ZOHO WEBHOOK] Processed as ${moduleType.toUpperCase()} module`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });

  } catch (error) {
    console.error('❌ [ZOHO WEBHOOK] Error:', error);
    console.error('❌ [ZOHO WEBHOOK] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [ZOHO WEBHOOK] Error details:', JSON.stringify(error, null, 2));
    
    // Always return success to Zoho to avoid "third party error"
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook processed (with error)',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    );
  }
}

async function processLeadData(leadData: any) {
  try {
    console.log('👥 [ZOHO WEBHOOK] Processing lead data');
    
    // 🆕 CRITICAL FIX: Determine workspace from webhook data, not hardcoded ID
    // Zoho webhooks should include workspace context or we need to determine it from the data
    let workspaceId = leadData.workspaceId || leadData.Workspace_ID || leadData.workspace_id;
    
    if (!workspaceId) {
      console.error('❌ [ZOHO WEBHOOK] No workspace ID found in webhook data');
      console.error('❌ [ZOHO WEBHOOK] Webhook data keys:', Object.keys(leadData));
      throw new Error('Workspace ID required for webhook processing');
    }
    
    console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from webhook: ${workspaceId}`);
    const firstName = leadData.First_Name || '';
    const lastName = leadData.Last_Name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Contact';
    const description = leadData.Description || '';
    
    console.log(`🔍 [ZOHO WEBHOOK] Lead: ${fullName}, Company: ${leadData.Company || 'Unknown'}`);
    
    // FIRST: Save the lead to our database
    try {
      
      // Create entity record first (2025 best practice)
      const entityRecord = await createEntityRecord({
        type: 'lead',
        workspaceId: workspaceId,
        metadata: {
          fullName: fullName,
          company: leadData.Company || '',
          source: 'Zoho CRM',
          zohoId: leadData.id
        }
      });

      // Use ULID for ID generation (Prisma will auto-generate via @default(ulid()))
      // Find existing record by email + workspaceId for upsert
      const email = leadData.Email || null;
      const existingPerson = email 
        ? await prisma.people.findFirst({
            where: {
              workspaceId: workspaceId,
              OR: [
                { email: email },
                { workEmail: email },
                { personalEmail: email }
              ]
            }
          })
        : null;

      const leadRecord = existingPerson
        ? await prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              firstName: firstName,
              lastName: lastName,
              fullName: fullName,
              email: email || existingPerson.email,
              phone: leadData.Phone || existingPerson.phone,
              company: leadData.Company || existingPerson.company,
              jobTitle: leadData.Title || leadData.Designation || existingPerson.jobTitle,
              source: 'Zoho CRM',
              status: 'LEAD',
              description: description,
              updatedAt: new Date()
            }
          })
        : await prisma.people.create({
            data: {
              // Let Prisma generate ULID via @default(ulid())
              entity_id: entityRecord.id, // Link to entity record
              workspaceId: workspaceId,
              firstName: firstName,
              lastName: lastName,
              fullName: fullName,
              email: leadData.Email || null,
              phone: leadData.Phone || null,
              title: leadData.Title || leadData.Designation || null,
              source: 'Zoho CRM',
              status: 'LEAD',
              description: description,
              mainSellerId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
              updatedAt: new Date()
            }
          });
      
      console.log(`✅ [ZOHO WEBHOOK] Lead saved to database: ${fullName} (ID: ${leadRecord.id})`);
    } catch (dbError) {
      console.error('❌ [ZOHO WEBHOOK] Database error:', dbError);
      console.log('⚠️ [ZOHO WEBHOOK] Continuing without database save...');
    }
    
    // SECOND: Check for buying signals and create Speedrun signal
    if (description && description.length > 10) {
      console.log(`🔍 [ZOHO WEBHOOK] Checking description for buying signals: "${description}"`);
      
      const buyingKeywords = ['budget', 'urgent', 'purchase', 'buy', 'decision', 'approved', 'ASAP', 'need', 'looking', 'implement'];
      const hasSignals = buyingKeywords.some(keyword => 
        description.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasSignals) {
        console.log('🚨 [ZOHO WEBHOOK] Buying signals detected! Creating Speedrun signal...');
        
        await storeSignal(workspaceId, {
          type: 'buying_intent',
          priority: 'high',
          contact: {
            name: fullName,
            company: leadData.Company || 'Unknown Company',
            email: leadData.Email || '',
            title: leadData.Title || leadData.Designation || '',
            id: leadData.id || `zoho-${Date.now()}`,
            type: 'lead'
          },
          note: {
            title: 'Buying Intent Detected',
            content: description.length > 100 ? description.substring(0, 100) + '...' : description,
            source: 'zoho_webhook'
          },
          action: 'add_to_speedrun',
          source: 'zoho_webhook'
        });
        
        console.log('✅ [ZOHO WEBHOOK] Speedrun signal created successfully!');
      } else {
        console.log('📊 [ZOHO WEBHOOK] No strong buying signals detected');
      }
    }
    
  } catch (error) {
    console.error('❌ [ZOHO WEBHOOK] Error processing lead:', error);
    // Don't throw - webhook should succeed even if processing fails
  }
}

async function processLeadWebhook(operation: string, data: any) {
  try {
    console.log(`👥 [ZOHO WEBHOOK] Processing lead ${operation}`);
    console.log(`📊 [ZOHO WEBHOOK] Lead data received:`, JSON.stringify(data, null, 2));

    // 🆕 CRITICAL FIX: Require workspace ID from webhook data, no hardcoded fallback
    const workspaceId = data.workspaceId || data.Workspace_ID || data.workspace_id;
    
    if (!workspaceId) {
      console.error('❌ [ZOHO WEBHOOK] No workspace ID found in webhook data');
      console.error('❌ [ZOHO WEBHOOK] Webhook data keys:', Object.keys(data));
      throw new Error('Workspace ID required for webhook processing');
    }
    
    console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from webhook: ${workspaceId}`);

    // Process all leads in the array
    for (const leadData of data) {
      if (!leadData) {
        console.warn(`⚠️ [ZOHO WEBHOOK] Empty lead data, skipping`);
        continue;
      }

      const firstName = leadData.First_Name || '';
      const lastName = leadData.Last_Name || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Contact';
      
      console.log(`🔍 [ZOHO WEBHOOK] Processing individual lead:`, {
        id: leadData.id || 'unknown',
        name: fullName,
        email: leadData.Email || '',
        company: leadData.Company || 'Unknown Company'
      });
    switch (operation.toLowerCase()) {
      case 'insert':
      case 'create':
        // Create new lead in our database
        const createFirstName = leadData.First_Name || '';
        const createLastName = leadData.Last_Name || '';
        const createFullName = `${createFirstName} ${createLastName}`.trim();
        
        // Check if lead exists by email + workspaceId
        const existingLead = await prisma.people.findFirst({
          where: { 
            workspaceId: workspaceId,
            OR: [
              { email: leadData.Email || undefined },
              { workEmail: leadData.Email || undefined },
              { personalEmail: leadData.Email || undefined }
            ],
            deletedAt: null
          }
        });

        if (existingLead) {
          // Update existing lead
          await prisma.people.update({
            where: { id: existingLead.id },
            data: {
              firstName: createFirstName,
              lastName: createLastName,
              fullName: createFullName,
              email: leadData.Email || existingLead.email,
              phone: leadData.Phone || existingLead.phone,
              jobTitle: leadData.Title || leadData.Designation || existingLead.jobTitle,
              status: 'LEAD',
              description: leadData.Description || existingLead.notes,
              updatedAt: new Date()
            }
          });
        } else {
          // Create new lead - let Prisma generate ULID via @default(ulid())
          await prisma.people.create({
            data: {
              workspaceId: workspaceId,
              firstName: createFirstName,
              lastName: createLastName,
              fullName: createFullName,
              email: leadData.Email || null,
              phone: leadData.Phone || null,
              title: leadData.Title || leadData.Designation || null,
              source: leadData.Lead_Source || 'Zoho CRM',
              status: 'LEAD',
              description: leadData.Description || null,
              mainSellerId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
              updatedAt: new Date()
            }
          });
        }
        console.log(`✅ [ZOHO WEBHOOK] Lead created/updated: ${createFullName}`);
        
        // Send Zoho update notification
        // await zohoNotificationService.sendZohoUpdateNotification(
        //   workspaceId,
        //   'leads',
        //   operation.toLowerCase(),
        //   {
        //     id: leadData.id || 'unknown',
        //     First_Name: leadData.First_Name || '',
        //     Last_Name: leadData.Last_Name || '',
        //     fullName: createFullName,
        //     Email: leadData.Email || '',
        //     Company: leadData.Company || '',
        //     Title: leadData.Title || leadData.Designation || '',
        //     Lead_Status: leadData.Lead_Status || 'New',
        //     Description: leadData.Description || ''
        //   }
        // );
        
        // Check for buying signals in description and trigger Monaco popup
        await checkForBuyingSignalsAndNotify(workspaceId, {
          id: leadData.id || 'unknown',
          fullName: createFullName || 'Unknown Contact',
          email: leadData.Email || '',
          company: leadData.Company || 'Unknown Company',
          title: leadData.Title || leadData.Designation || '',
          description: leadData.Description || ''
        });
        break;

      case 'update':
        // Update or create lead (upsert for flexibility)
        const firstName = leadData.First_Name || '';
        const lastName = leadData.Last_Name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Check if lead exists by zohoId
        const existingUpdateLead = await prisma.leads.findFirst({
          where: { zohoId: leadData.id , deletedAt: null}
        });

        if (existingUpdateLead) {
          // Update existing lead
          await prisma.leads.update({
            where: { id: existingUpdateLead.id },
            data: {
              firstName: firstName,
              lastName: lastName,
              fullName: fullName,
              email: leadData.Email || '',
              phone: leadData.Phone || '',
              company: leadData.Company || '',
              title: leadData.Title || leadData.Designation || '',
              status: leadData.Lead_Status || 'New',
              description: leadData.Description || ''
            }
          });
        } else {
          // Create new lead
          await prisma.leads.create({
            data: {
              id: `zoho_lead_${leadData.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workspaceId: workspaceId,
              firstName: firstName,
              lastName: lastName,
              fullName: fullName,
              email: leadData.Email || '',
              phone: leadData.Phone || '',
              company: leadData.Company || '',
              title: leadData.Title || leadData.Designation || '',
              source: leadData.Lead_Source || 'Zoho CRM',
              status: leadData.Lead_Status || 'New',
              zohoId: leadData.id,
              description: leadData.Description || '',
              ownerId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
              updatedAt: new Date()
            }
          });
        }
        console.log(`✅ [ZOHO WEBHOOK] Lead upserted: ${fullName}`);
        
        // Send Zoho update notification
        // await zohoNotificationService.sendZohoUpdateNotification(
        //   workspaceId,
        //   'leads',
        //   operation.toLowerCase(),
        //   {
        //     id: leadData.id || 'unknown',
        //     First_Name: leadData.First_Name || '',
        //     Last_Name: leadData.Last_Name || '',
        //     fullName: fullName,
        //     Email: leadData.Email || '',
        //     Company: leadData.Company || '',
        //     Title: leadData.Title || leadData.Designation || '',
        //     Lead_Status: leadData.Lead_Status || 'New',
        //     Description: leadData.Description || ''
        //   }
        // );
        
        // Check for buying signals in description and trigger Monaco popup
        console.log(`🔍 [ZOHO WEBHOOK] Checking for buying signals in description: "${leadData.Description || ''}"`);
        await checkForBuyingSignalsAndNotify(workspaceId, {
          id: leadData.id || 'unknown',
          fullName: fullName || 'Unknown Contact',
          email: leadData.Email || '',
          company: leadData.Company || 'Unknown Company',
          title: leadData.Title || leadData.Designation || '',
          description: leadData.Description || ''
        });
        break;

      case 'delete':
        // Soft delete lead
        await prisma.leads.updateMany({
          where: { zohoId: leadData.id },
          data: { deletedAt: new Date() }
        });
        console.log(`✅ [ZOHO WEBHOOK] Lead deleted: ${leadData.id}`);
        break;
      }
    }
  } catch (error) {
    console.error(`❌ [ZOHO WEBHOOK] Error processing lead webhook:`, error);
    console.error(`❌ [ZOHO WEBHOOK] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    throw error; // Re-throw to be caught by main handler
  }
}

async function processContactWebhook(operation: string, data: any) {
  console.log(`📞 [ZOHO WEBHOOK] Processing contact ${operation}`);
  console.log(`📞 [ZOHO WEBHOOK] Data received:`, JSON.stringify(data, null, 2));

  const contactData = data[0];
  if (!contactData) {
    console.log('❌ [ZOHO WEBHOOK] No contact data found in array');
    return;
  }
  
  console.log(`📞 [ZOHO WEBHOOK] Contact data:`, JSON.stringify(contactData, null, 2));

  // 🆕 CRITICAL FIX: Require workspace ID from webhook data, no hardcoded fallback
  const workspaceId = contactData.workspaceId || contactData.Workspace_ID || contactData.workspace_id;
  
  if (!workspaceId) {
    console.error('❌ [ZOHO WEBHOOK] No workspace ID found in contact webhook data');
    console.error('❌ [ZOHO WEBHOOK] Contact data keys:', Object.keys(contactData));
    throw new Error('Workspace ID required for contact webhook processing');
  }
  
  console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from contact webhook: ${workspaceId}`);

  try {
    switch (operation.toLowerCase()) {
      case 'insert':
      case 'create':
      case 'update':
        // Find existing contact by zohoId first
        console.log(`🔍 [ZOHO WEBHOOK] Looking for contact with zohoId: ${contactData.id} in workspace: ${workspaceId}`);
        const existingContact = await prisma.people.findFirst({
          where: {
            zohoId: contactData.id,
            workspaceId: workspaceId
          }
        });

        console.log(`🔍 [ZOHO WEBHOOK] Found existing contact:`, existingContact ? 'YES' : 'NO');
        if (existingContact) {
          console.log(`🔍 [ZOHO WEBHOOK] Existing contact ID: ${existingContact.id}`);
        }

        if (existingContact) {
          // Update existing contact
          await prisma.people.update({
            where: { id: existingContact.id },
            data: {
              firstName: contactData.First_Name || existingContact.firstName,
              lastName: contactData.Last_Name || existingContact.lastName,
              fullName: contactData.Full_Name || `${contactData.First_Name || existingContact.firstName} ${contactData.Last_Name || existingContact.lastName}`.trim(),
              email: contactData.Email || existingContact.email,
              phone: contactData.Phone || existingContact.phone,
              jobTitle: contactData.Title || existingContact.jobTitle,
              department: contactData.Department || existingContact.department,
              notes: contactData.Description || existingContact.notes,
              updatedAt: new Date()
            }
          });
          console.log(`✅ [ZOHO WEBHOOK] Updated existing contact: ${contactData.First_Name} ${contactData.Last_Name}`);
        } else {
          // Create entity record first (2025 best practice)
          const entityRecord = await createEntityRecord({
            type: 'person',
            workspaceId: workspaceId,
            metadata: {
              fullName: contactData.Full_Name || `${contactData.First_Name || ''} ${contactData.Last_Name || ''}`.trim() || 'Unknown',
              email: contactData.Email || '',
              source: 'Zoho CRM',
              zohoId: contactData.id
            }
          });

          // Create new contact
          await prisma.people.create({
            data: {
              id: `zoho_contact_${contactData.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              entity_id: entityRecord.id, // Link to entity record
              workspaceId: workspaceId,
              firstName: contactData.First_Name || '',
              lastName: contactData.Last_Name || '',
              fullName: contactData.Full_Name || `${contactData.First_Name || ''} ${contactData.Last_Name || ''}`.trim() || 'Unknown',
              email: contactData.Email || '',
              phone: contactData.Phone || '',
              jobTitle: contactData.Title || '',
              department: contactData.Department || '',
              status: 'active',
              zohoId: contactData.id,
              notes: contactData.Description || '',
              ownerId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
              updatedAt: new Date()
            }
          });
          console.log(`✅ [ZOHO WEBHOOK] Created new contact: ${contactData.First_Name} ${contactData.Last_Name}`);
        }
        
        // Send Zoho update notification
        // await zohoNotificationService.sendZohoUpdateNotification(
          workspaceId,
          'contacts',
          operation.toLowerCase(),
          {
            id: contactData.id || 'unknown',
            First_Name: contactData.First_Name || '',
            Last_Name: contactData.Last_Name || '',
            Full_Name: contactData.Full_Name || '',
            Email: contactData.Email || '',
            Title: contactData.Title || '',
            Department: contactData.Department || '',
            Phone: contactData.Phone || '',
            Description: contactData.Description || '',
            Account_Name: contactData.Account_Name || ''
          }
        // );
        
        // Check for buying signals in contact description/notes
        const fullName = `${contactData.First_Name || ''} ${contactData.Last_Name || ''}`.trim();
        console.log(`🔍 [ZOHO WEBHOOK] Checking for buying signals in contact: "${contactData.Description || ''}"`);
        await checkForBuyingSignalsAndNotify(workspaceId, {
          id: contactData.id || 'unknown',
          fullName: fullName || 'Unknown Contact',
          email: contactData.Email || '',
          company: contactData.Account_Name || 'Unknown Company',
          title: contactData.Title || '',
          description: contactData.Description || ''
        });
        break;

      case 'delete':
        await prisma.people.updateMany({
          where: { zohoId: contactData.id },
          data: { deletedAt: new Date() }
        });
        console.log(`✅ [ZOHO WEBHOOK] Contact deleted: ${contactData.id}`);
        break;
    }
  } catch (error) {
    console.error(`❌ [ZOHO WEBHOOK] Error processing contact webhook:`, error);
  }
}

async function processDealWebhook(operation: string, data: any) {
  console.log(`💼 [ZOHO WEBHOOK] Processing deal ${operation}`);

  const dealData = data[0];
  if (!dealData) return;

  // 🆕 CRITICAL FIX: Require workspace ID from webhook data, no hardcoded fallback
  const workspaceId = dealData.workspaceId || dealData.Workspace_ID || dealData.workspace_id;
  
  if (!workspaceId) {
    console.error('❌ [ZOHO WEBHOOK] No workspace ID found in deal webhook data');
    console.error('❌ [ZOHO WEBHOOK] Deal data keys:', Object.keys(dealData));
    throw new Error('Workspace ID required for deal webhook processing');
  }
  
  console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from deal webhook: ${workspaceId}`);

  try {
    switch (operation.toLowerCase()) {
      case 'insert':
      case 'create':
      case 'update':
        // Create or update opportunity
        await prisma.opportunities.upsert({
          where: { 
            id: `zoho_opportunity_${dealData.id || Date.now()}`
          },
          create: {
            id: `zoho_opportunity_${dealData.id || Date.now()}`,
            workspaceId: workspaceId,
            name: dealData.Deal_Name || '',
            amount: parseFloat(dealData.Amount) || 0,
            stage: dealData.Stage || '',
            probability: parseFloat(dealData.Probability) || 0,
            expectedCloseDate: dealData.Closing_Date ? new Date(dealData.Closing_Date) : null,
            source: 'Zoho CRM',
            zohoId: dealData.id,
            description: dealData.Description || '',
            ownerId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
            updatedAt: new Date()
          },
          update: {
            name: dealData.Deal_Name || '',
            amount: parseFloat(dealData.Amount) || 0,
            stage: dealData.Stage || '',
            probability: parseFloat(dealData.Probability) || 0,
            expectedCloseDate: dealData.Closing_Date ? new Date(dealData.Closing_Date) : null,
            description: dealData.Description || ''
          }
        });
        console.log(`✅ [ZOHO WEBHOOK] Deal created/updated: ${dealData.Deal_Name}`);
        
        // Send Zoho update notification
        // await zohoNotificationService.sendZohoUpdateNotification(
          workspaceId,
          'deals',
          operation.toLowerCase(),
          {
            id: dealData.id || 'unknown',
            Deal_Name: dealData.Deal_Name || '',
            Amount: dealData.Amount || '0',
            Stage: dealData.Stage || '',
            Probability: dealData.Probability || '0',
            Closing_Date: dealData.Closing_Date || '',
            Description: dealData.Description || '',
            Contact_Name: dealData.Contact_Name || '',
            Account_Name: dealData.Account_Name || ''
          }
        // );
        
        // Check for buying signals in deal description - HIGH PRIORITY for deals!
        console.log(`🔍 [ZOHO WEBHOOK] Checking for buying signals in deal: "${dealData.Description || ''}"`);
        await checkForBuyingSignalsAndNotify(workspaceId, {
          id: dealData.id || 'unknown',
          fullName: dealData.Contact_Name || 'Deal Contact',
          email: '', // Deals don't have direct email
          company: dealData.Account_Name || 'Unknown Company',
          title: 'Deal Stakeholder',
          description: `DEAL: ${dealData.Deal_Name} - ${dealData.Description || ''} - Stage: ${dealData.Stage} - Amount: $${dealData.Amount}`
        });
        break;

      case 'delete':
        await prisma.opportunities.updateMany({
          where: { zohoId: dealData.id },
          data: { deletedAt: new Date() }
        });
        console.log(`✅ [ZOHO WEBHOOK] Deal deleted: ${dealData.id}`);
        break;
    }
  } catch (error) {
    console.error(`❌ [ZOHO WEBHOOK] Error processing deal webhook:`, error);
  }
}

async function processAccountWebhook(operation: string, data: any) {
  console.log(`🏢 [ZOHO WEBHOOK] Processing account ${operation}`);

  const accountData = data[0];
  if (!accountData) return;

  // 🆕 CRITICAL FIX: Require workspace ID from webhook data, no hardcoded fallback
  const workspaceId = accountData.workspaceId || accountData.Workspace_ID || accountData.workspace_id;
  
  if (!workspaceId) {
    console.error('❌ [ZOHO WEBHOOK] No workspace ID found in account webhook data');
    console.error('❌ [ZOHO WEBHOOK] Account data keys:', Object.keys(accountData));
    throw new Error('Workspace ID required for account webhook processing');
  }
  
  console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from account webhook: ${workspaceId}`);

  try {
    switch (operation.toLowerCase()) {
      case 'insert':
      case 'create':
      case 'update':
        // Create or update account - find by zohoId first since it's not unique
        const existingAccount = await prisma.companies.findFirst({
          where: { zohoId: accountData.id, workspaceId: workspaceId , deletedAt: null}
        });

        if (existingAccount) {
          await prisma.companies.update({
            where: { id: existingAccount.id },
            data: {
              name: accountData.Account_Name || '',
              website: accountData.Website || '',
              phone: accountData.Phone || '',
              industry: accountData.Industry || '',
              accountType: accountData.Type || 'Customer',
              description: accountData.Description || '',
              size: accountData.Employees ? parseInt(accountData.Employees).toString() : null,
              revenue: accountData.Annual_Revenue ? parseFloat(accountData.Annual_Revenue) : null
            }
          });
        } else {
          await prisma.companies.create({
            data: {
              id: `zoho_account_${accountData.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workspaceId: workspaceId,
              name: accountData.Account_Name || '',
              website: accountData.Website || '',
              phone: accountData.Phone || '',
              industry: accountData.Industry || '',
              description: accountData.Description || '',
              employeeCount: accountData.Employees ? parseInt(accountData.Employees) : null, // Use employeeCount instead of size
              revenue: accountData.Annual_Revenue ? parseFloat(accountData.Annual_Revenue) : null,
              mainSellerId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Use mainSellerId instead of ownerId
              customFields: {
                zohoId: accountData.id,
                accountType: accountData.Type || 'Customer',
                importedFrom: 'zoho_webhook',
                importedAt: new Date().toISOString()
              },
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        console.log(`✅ [ZOHO WEBHOOK] Account created/updated: ${accountData.Account_Name}`);
        
        // Send Zoho update notification
        // await zohoNotificationService.sendZohoUpdateNotification(
          workspaceId,
          'accounts',
          operation.toLowerCase(),
          {
            id: accountData.id || 'unknown',
            Account_Name: accountData.Account_Name || '',
            Website: accountData.Website || '',
            Phone: accountData.Phone || '',
            Industry: accountData.Industry || '',
            Type: accountData.Type || '',
            Description: accountData.Description || '',
            Employees: accountData.Employees || '',
            Annual_Revenue: accountData.Annual_Revenue || ''
          }
        // );
        
        // Check for buying signals in account description
        console.log(`🔍 [ZOHO WEBHOOK] Checking for buying signals in account: "${accountData.Description || ''}"`);
        await checkForBuyingSignalsAndNotify(workspaceId, {
          id: accountData.id || 'unknown',
          fullName: 'Account Decision Maker',
          email: '', // Accounts don't have direct email
          company: accountData.Account_Name || 'Unknown Company',
          title: 'Key Stakeholder',
          description: `ACCOUNT: ${accountData.Account_Name} - ${accountData.Description || ''} - Industry: ${accountData.Industry} - Size: ${accountData.Employees} employees`
        });
        break;

      case 'delete':
        await prisma.companies.updateMany({
          where: { zohoId: accountData.id },
          data: { deletedAt: new Date() }
        });
        console.log(`✅ [ZOHO WEBHOOK] Account deleted: ${accountData.id}`);
        break;
    }
  } catch (error) {
    console.error(`❌ [ZOHO WEBHOOK] Error processing account webhook:`, error);
  }
}

/**
 * Check for buying signals in lead data and send Monaco notifications
 */
async function checkForBuyingSignalsAndNotify(workspaceId: string, leadData: {
  id: string;
  fullName: string;
  email: string;
  company: string;
  title: string;
  description: string;
}) {
  try {
    console.log(`🔍 [BUYING SIGNAL] Analyzing lead: ${leadData.fullName}`);
    
    // Define buying signal keywords (comprehensive list)
    const buyingSignalKeywords = [
      // Purchase Intent
      'purchase', 'buy', 'acquire', 'procurement', 'RFP', 'proposal', 'quote', 'pricing',
      'cost', 'budget', 'investment', 'spend', 'contract', 'vendor', 'supplier',
      
      // Timeline Urgency
      'urgent', 'ASAP', 'immediately', 'soon', 'next quarter', 'deadline', 'timeline',
      'Q1', 'Q2', 'Q3', 'Q4', 'by end of', 'need by', 'looking to move forward',
      
      // Decision-making
      'decision', 'approve', 'approved', 'sign off', 'stakeholder', 'team meeting',
      'evaluation', 'compare', 'demo', 'trial', 'pilot', 'implement',
      
      // Business Value
      'ROI', 'efficiency', 'streamline', 'optimize', 'improve', 'solution',
      'upgrade', 'replace', 'modernize', 'digital transformation'
    ];
    
    const description = (leadData.description || '').toLowerCase();
    let signalScore = 0;
    let detectedSignals = [];
    
    // Calculate signal score based on keyword matches
    for (const keyword of buyingSignalKeywords) {
      if (description.includes(keyword.toLowerCase())) {
        signalScore += 1;
        detectedSignals.push(keyword);
      }
    }
    
    console.log(`🔍 [BUYING SIGNAL] Description: "${description}"`);
    console.log(`🔍 [BUYING SIGNAL] Signal score: ${signalScore}, Detected signals: ${detectedSignals.join(', ')}`);
    
    // Boost score for high-value phrases
    const highValuePhrases = [
      'budget approved', 'ready to purchase', 'looking to buy', 'need quotes',
      'decision by', 'move forward', 'implement soon', 'urgent need'
    ];
    
    for (const phrase of highValuePhrases) {
      if (description.includes(phrase)) {
        signalScore += 3;
        detectedSignals.push(phrase);
      }
    }
    
    // If significant buying signals detected, store signal in database
    if (signalScore >= 2) {
      console.log(`🚨 [BUYING SIGNAL] Strong signals detected for ${leadData.fullName}, score: ${signalScore}`);
      
      const signalData = {
        type: 'BUYING_INTENT_DETECTED',
        priority: signalScore >= 5 ? 'URGENT' : 'HIGH',
        contact: {
          id: leadData.id,
          name: leadData.fullName,
          email: leadData.email,
          company: leadData.company,
          title: leadData.title,
          type: 'lead'
        },
        note: {
          title: 'Strong Buying Intent Detected',
          content: leadData.description.length > 100 
            ? leadData.description.substring(0, 100) + '...' 
            : leadData.description,
          source: 'zoho_webhook',
          score: signalScore,
          signals: detectedSignals.slice(0, 5) // Top 5 signals
        },
        action: 'ADD_TO_SPEEDRUN'
      };
      
      // Store signal directly using shared service
      try {
        console.log(`💾 [SIGNAL STORE] Storing signal for ${leadData.fullName}`);
        
        await storeSignal(workspaceId, {
          type: signalData.type || 'buying_intent',
          priority: signalData.priority || 'high',
          contact: {
            name: signalData.contact?.name || leadData.fullName || 'Unknown Contact',
            company: signalData.contact?.company || leadData.company || 'Unknown Company',
            email: signalData.contact?.email || leadData.email || '',
            title: signalData.contact?.jobTitle || leadData.jobTitle || '',
            id: signalData.contact?.id || leadData.id || '',
            type: 'lead'
          },
          note: {
            title: signalData.note?.title || 'Buying Intent Detected',
            content: signalData.note?.content || leadData.description || 'Strong buying signals detected',
            source: 'zoho_webhook',
            score: signalData.note?.score || signalScore,
            signals: signalData.note?.signals || detectedSignals.slice(0, 5)
          },
          action: signalData.action || 'add_to_speedrun',
          source: 'zoho_webhook'
        });
        
        console.log(`✅ [SIGNAL STORE] Successfully stored signal for ${leadData.fullName}`);
      } catch (storeError) {
        console.error('❌ [SIGNAL STORE] Failed to store signal:', storeError);
        // Don't throw - webhook should succeed even if signal storage fails
      }
    } else {
      console.log(`📊 [BUYING SIGNAL] Low signal score (${signalScore}) for ${leadData.fullName}, no signal stored`);
    }
    
  } catch (error) {
    console.error('❌ [BUYING SIGNAL] Error analyzing lead:', error);
  }
}

/**
 * 📝 Process Notes webhook data
 */
async function processNotesWebhook(operation: string, data: any) {
  console.log(`📝 [ZOHO WEBHOOK] Processing notes ${operation}`);

  const noteData = data[0];
  if (!noteData) return;

  // 🆕 CRITICAL FIX: Require workspace ID from webhook data, no hardcoded fallback
  const workspaceId = noteData.workspaceId || noteData.Workspace_ID || noteData.workspace_id;
  
  if (!workspaceId) {
    console.error('❌ [ZOHO WEBHOOK] No workspace ID found in notes webhook data');
    console.error('❌ [ZOHO WEBHOOK] Notes data keys:', Object.keys(noteData));
    throw new Error('Workspace ID required for notes webhook processing');
  }
  
  console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from notes webhook: ${workspaceId}`);

  try {
    switch (operation.toLowerCase()) {
      case 'insert':
      case 'create':
      case 'update':
        const noteContent = noteData.Note_Content || '';
        const noteTitle = noteData.Note_Title || '';
        const parentId = noteData.Parent_Id || '';
        const parentModule = noteData.Parent_Module || '';

        console.log(`📝 [ZOHO WEBHOOK] Note: "${noteTitle}" for ${parentModule} ${parentId}`);
        
        // Analyze note content for follow-up timing and urgency
        await analyzeNoteForFollowUpTiming(workspaceId, {
          noteId: noteData.id || 'unknown',
          title: noteTitle,
          content: noteContent,
          parentId: parentId,
          parentModule: parentModule,
          createdTime: noteData.Created_Time,
          modifiedTime: noteData.Modified_Time
        });
        break;

      case 'delete':
        console.log(`🗑️ [ZOHO WEBHOOK] Note deleted: ${noteData.id}`);
        // Handle note deletion if needed
        break;
    }

  } catch (error) {
    console.error(`❌ [ZOHO WEBHOOK] Error processing note:`, error);
  }
}

/**
 * ✅ Process Tasks webhook data
 */
async function processTasksWebhook(operation: string, data: any) {
  console.log(`✅ [ZOHO WEBHOOK] Processing task ${operation}`);

  const taskData = data[0];
  if (!taskData) return;

  // 🆕 CRITICAL FIX: Require workspace ID from webhook data, no hardcoded fallback
  const workspaceId = taskData.workspaceId || taskData.Workspace_ID || taskData.workspace_id;
  
  if (!workspaceId) {
    console.error('❌ [ZOHO WEBHOOK] No workspace ID found in tasks webhook data');
    console.error('❌ [ZOHO WEBHOOK] Tasks data keys:', Object.keys(taskData));
    throw new Error('Workspace ID required for tasks webhook processing');
  }
  
  console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from tasks webhook: ${workspaceId}`);

  try {
    switch (operation.toLowerCase()) {
      case 'insert':
      case 'create':
      case 'update':
        const taskTitle = taskData.Task_Title || '';
        const taskDescription = taskData.Task_Description || '';
        const taskStatus = taskData.Task_Status || '';
        const taskPriority = taskData.Task_Priority || '';
        const dueDate = taskData.Due_Date || '';
        const relatedToId = taskData.Related_To_Id || '';
        const relatedToModule = taskData.Related_To_Module || '';

        console.log(`✅ [ZOHO WEBHOOK] Task: "${taskTitle}" due ${dueDate} for ${relatedToModule} ${relatedToId}`);
        
        // Analyze task for follow-up timing and urgency
        await analyzeTaskForFollowUpTiming(workspaceId, {
          taskId: taskData.id || 'unknown',
          title: taskTitle,
          description: taskDescription,
          status: taskStatus,
          priority: taskPriority,
          dueDate: dueDate,
          relatedToId: relatedToId,
          relatedToModule: relatedToModule,
          createdTime: taskData.Created_Time,
          modifiedTime: taskData.Modified_Time
        });
        break;

      case 'delete':
        console.log(`🗑️ [ZOHO WEBHOOK] Task deleted: ${taskData.id}`);
        // Handle task deletion if needed
        break;
    }

  } catch (error) {
    console.error(`❌ [ZOHO WEBHOOK] Error processing task:`, error);
  }
}

/**
 * 📅 Process Meetings webhook data
 */
async function processMeetingsWebhook(operation: string, data: any) {
  console.log(`📅 [ZOHO WEBHOOK] Processing meeting ${operation}`);

  const eventData = data[0];
  if (!eventData) return;

  // 🆕 CRITICAL FIX: Require workspace ID from webhook data, no hardcoded fallback
  const workspaceId = eventData.workspaceId || eventData.Workspace_ID || eventData.workspace_id;
  
  if (!workspaceId) {
    console.error('❌ [ZOHO WEBHOOK] No workspace ID found in meetings webhook data');
    console.error('❌ [ZOHO WEBHOOK] Meetings data keys:', Object.keys(eventData));
    throw new Error('Workspace ID required for meetings webhook processing');
  }
  
  console.log(`🔍 [ZOHO WEBHOOK] Using workspace ID from meetings webhook: ${workspaceId}`);

  try {
    switch (operation.toLowerCase()) {
      case 'insert':
      case 'create':
      case 'update':
        const meetingSubject = eventData.Subject || '';
        const startDateTime = eventData.Start_DateTime || '';
        const endDateTime = eventData.End_DateTime || '';
        const description = eventData.Description || '';
        const whatId = eventData.What_Id || '';
        const whatModule = eventData.What_Module || '';

        console.log(`📅 [ZOHO WEBHOOK] Meeting: "${meetingSubject}" scheduled for ${startDateTime}`);
        
        // Analyze meeting for follow-up timing and priority
        await analyzeEventForFollowUpTiming(workspaceId, {
          eventId: eventData.id || 'unknown',
          title: meetingSubject,
          description: description,
          startDateTime: startDateTime,
          endDateTime: endDateTime,
          whatId: whatId,
          whatModule: whatModule,
          eventType: eventData.Event_Type || 'Meeting'
        });
        break;

      case 'delete':
        console.log(`🗑️ [ZOHO WEBHOOK] Event deleted: ${eventData.id}`);
        // Handle event deletion if needed
        break;
    }

  } catch (error) {
    console.error(`❌ [ZOHO WEBHOOK] Error processing event:`, error);
  }
}

/**
 * 🎯 Analyze note content for follow-up timing and urgency
 */
async function analyzeNoteForFollowUpTiming(workspaceId: string, noteData: {
  noteId: string;
  title: string;
  content: string;
  parentId: string;
  parentModule: string;
  createdTime?: string;
  modifiedTime?: string;
}) {
  try {
    console.log(`🔍 [NOTE ANALYSIS] Analyzing note: "${noteData.title}"`);
    
    const fullText = `${noteData.title} ${noteData.content}`.toLowerCase();
    
    // Urgency keywords that bump to top priority
    const urgentKeywords = [
      'follow up with', 'call today', 'urgent', 'asap', 'immediately',
      'hot lead', 'ready to buy', 'decision tomorrow', 'call back',
      'follow up tomorrow', 'reach out today'
    ];
    
    // Time-based keywords for scheduling
    const timeKeywords = [
      { pattern: /in (\d+) days?/, multiplier: 1 },
      { pattern: /in (\d+) weeks?/, multiplier: 7 },
      { pattern: /in (\d+) months?/, multiplier: 30 },
      { pattern: /next week/, days: 7 },
      { pattern: /next month/, days: 30 },
      { pattern: /end of week/, days: 5 },
      { pattern: /end of month/, days: 30 }
    ];
    
    let priority = 'medium';
    let followUpDays = null;
    let detectedSignals = [];
    
    // Check for urgency
    for (const keyword of urgentKeywords) {
      if (fullText.includes(keyword)) {
        priority = 'urgent';
        followUpDays = 0; // Today
        detectedSignals.push(keyword);
        break;
      }
    }
    
    // Check for time-based scheduling
    if (!followUpDays) {
      for (const timeKeyword of timeKeywords) {
        if (timeKeyword.pattern) {
          const match = fullText.match(timeKeyword.pattern);
          if (match) {
            if (timeKeyword['multiplier'] && match[1]) {
              followUpDays = parseInt(match[1]) * timeKeyword.multiplier;
            } else if (timeKeyword.days) {
              followUpDays = timeKeyword.days;
            }
            detectedSignals.push(match[0]);
            break;
          }
        }
      }
    }
    
    console.log(`🎯 [NOTE ANALYSIS] Priority: ${priority}, Follow-up in: ${followUpDays} days`);
    console.log(`🎯 [NOTE ANALYSIS] Detected signals: ${detectedSignals.join(', ')}`);
    
    // Store follow-up signal if priority detected
    if (priority === 'urgent' || followUpDays !== null) {
      await storeFollowUpSignal(workspaceId, {
        type: 'FOLLOW_UP_TIMING',
        priority: priority.toUpperCase(),
        parentId: noteData.parentId,
        parentModule: noteData.parentModule,
        followUpDays: followUpDays,
        note: {
          title: noteData.title || 'Follow-up Required',
          content: noteData.content,
          source: 'zoho_notes',
          signals: detectedSignals
        },
        action: 'UPDATE_PRIORITY'
      });
    }
    
  } catch (error) {
    console.error('❌ [NOTE ANALYSIS] Error analyzing note:', error);
  }
}

/**
 * ✅ Analyze task for follow-up timing and urgency
 */
async function analyzeTaskForFollowUpTiming(workspaceId: string, taskData: {
  taskId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  relatedToId: string;
  relatedToModule: string;
  createdTime?: string;
  modifiedTime?: string;
}) {
  try {
    console.log(`🔍 [TASK ANALYSIS] Analyzing task: "${taskData.title}"`);
    
    const fullText = `${taskData.title} ${taskData.description}`.toLowerCase();
    const taskPriority = taskData.priority?.toLowerCase() || '';
    const taskStatus = taskData.status?.toLowerCase() || '';
    
    // Calculate days until due date
    let daysUntilDue = null;
    let priority = 'medium';
    
    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const now = new Date();
      daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Set priority based on due date proximity
      if (daysUntilDue <= 0) {
        priority = 'urgent'; // Overdue or due today
      } else if (daysUntilDue <= 1) {
        priority = 'urgent'; // Due tomorrow
      } else if (daysUntilDue <= 3) {
        priority = 'high'; // Due within 3 days
      } else if (daysUntilDue <= 7) {
        priority = 'medium'; // Due within a week
      }
    }
    
    // Boost priority for high-priority tasks
    if (taskPriority === 'high' || taskPriority === 'urgent') {
      priority = 'urgent';
    }
    
    // Urgency keywords that bump to top priority
    const urgentKeywords = [
      'urgent', 'asap', 'immediately', 'critical', 'important',
      'follow up', 'call today', 'deadline', 'overdue'
    ];
    
    let detectedSignals = [];
    for (const keyword of urgentKeywords) {
      if (fullText.includes(keyword)) {
        priority = 'urgent';
        detectedSignals.push(keyword);
      }
    }
    
    console.log(`✅ [TASK ANALYSIS] Priority: ${priority}, Due in: ${daysUntilDue} days, Status: ${taskStatus}`);
    console.log(`✅ [TASK ANALYSIS] Detected signals: ${detectedSignals.join(', ')}`);
    
    // Store task-based follow-up signal if priority detected
    if (priority === 'urgent' || priority === 'high' || daysUntilDue !== null) {
      await storeFollowUpSignal(workspaceId, {
        type: 'TASK_DUE',
        priority: priority.toUpperCase(),
        parentId: taskData.relatedToId,
        parentModule: taskData.relatedToModule,
        followUpDays: daysUntilDue,
        note: {
          title: `Task: ${taskData.title}`,
          content: taskData.description,
          source: 'zoho_tasks',
          signals: detectedSignals
        },
        action: 'UPDATE_PRIORITY'
      });
    }
    
  } catch (error) {
    console.error('❌ [TASK ANALYSIS] Error analyzing task:', error);
  }
}

/**
 * 📅 Analyze event for follow-up timing and priority
 */
async function analyzeEventForFollowUpTiming(workspaceId: string, eventData: {
  eventId: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  whatId: string;
  whatModule: string;
  eventType: string;
}) {
  try {
    console.log(`🔍 [EVENT ANALYSIS] Analyzing event: "${eventData.title}"`);
    
    const eventDate = new Date(eventData.startDateTime);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let priority = 'medium';
    let followUpDays = null;
    
    // Events happening soon get higher priority
    if (daysUntilEvent <= 1) {
      priority = 'urgent';
      followUpDays = 0;
    } else if (daysUntilEvent <= 3) {
      priority = 'high';
      followUpDays = 1;
    } else if (daysUntilEvent <= 7) {
      priority = 'medium';
      followUpDays = 3;
    }
    
    // Check event description for buying signals
    const description = eventData.description.toLowerCase();
    const buyingSignals = [
      'demo', 'proposal', 'contract', 'decision', 'budget', 'purchase',
      'implementation', 'trial', 'evaluation', 'pricing'
    ];
    
    const detectedSignals = buyingSignals.filter(signal => 
      description.includes(signal) || eventData.title.toLowerCase().includes(signal)
    );
    
    if (detectedSignals.length > 0) {
      priority = 'high'; // Boost priority for buying signals
    }
    
    console.log(`📅 [EVENT ANALYSIS] Event in ${daysUntilEvent} days, Priority: ${priority}`);
    console.log(`📅 [EVENT ANALYSIS] Buying signals: ${detectedSignals.join(', ')}`);
    
    // Store event-based follow-up signal
    await storeFollowUpSignal(workspaceId, {
      type: 'MEETING_SCHEDULED',
      priority: priority.toUpperCase(),
      parentId: eventData.whatId,
      parentModule: eventData.whatModule,
      followUpDays: followUpDays,
      eventDate: eventData.startDateTime,
      note: {
        title: `${eventData.eventType}: ${eventData.title}`,
        content: eventData.description,
        source: 'zoho_events',
        signals: detectedSignals
      },
      action: 'UPDATE_PRIORITY'
    });
    
  } catch (error) {
    console.error('❌ [EVENT ANALYSIS] Error analyzing event:', error);
  }
}

/**
 * 💾 Store follow-up signal for priority ranking
 */
async function storeFollowUpSignal(workspaceId: string, signalData: {
  type: string;
  priority: string;
  parentId: string;
  parentModule: string;
  followUpDays: number | null;
  eventDate?: string;
  note: {
    title: string;
    content: string;
    source: string;
    signals: string[];
  };
  action: string;
}) {
  try {
    console.log(`💾 [FOLLOW-UP SIGNAL] Storing signal for ${signalData.parentModule} ${signalData.parentId}`);
    
    // Use the existing storeSignal function with follow-up specific data
    await storeSignal(workspaceId, {
      type: signalData.type,
      priority: signalData.priority.toLowerCase(),
      contact: {
        id: signalData.parentId,
        type: signalData.parentModule.toLowerCase(),
        name: 'Contact from Note/Event', // Will be resolved later
        company: 'Unknown Company',
        email: '',
        title: ''
      },
      note: {
        title: signalData.note.title,
        content: signalData.note.content,
        source: signalData.note.source,
        followUpDays: signalData.followUpDays,
        eventDate: signalData.eventDate,
        signals: signalData.note.signals
      },
      action: signalData.action.toLowerCase(),
      source: signalData.note.source
    });
    
    console.log(`✅ [FOLLOW-UP SIGNAL] Successfully stored signal`);
    
  } catch (error) {
    console.error('❌ [FOLLOW-UP SIGNAL] Error storing signal:', error);
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  console.log('🔍 [ZOHO WEBHOOK] Verification request received');
  
  // Zoho may send verification requests
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    console.log('✅ [ZOHO WEBHOOK] Responding to challenge:', challenge);
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return NextResponse.json({ 
    message: 'Zoho CRM webhook endpoint is active',
    endpoint: 'https://action.adrata.com/api/webhooks/zoho'
  });
}