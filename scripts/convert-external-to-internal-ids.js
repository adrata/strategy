#!/usr/bin/env node

/**
 * 🔄 CONVERT EXTERNAL TO INTERNAL IDS
 * 
 * Converts external Coresignal IDs to internal database UUIDs
 * This fixes the data access issue while preserving all data
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function convertExternalToInternalIds() {
  console.log('🔄 CONVERTING EXTERNAL TO INTERNAL IDS');
  console.log('======================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. FIND ALL EXTERNAL ID RECORDS
    console.log('🔍 Finding records with external Coresignal IDs...');
    
    const externalLeads = await prisma.leads.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        workspaceId: true,
        externalId: true
      }
    });
    
    const externalContacts = await prisma.contacts.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        workspaceId: true,
        externalId: true
      }
    });
    
    console.log(`📊 Found external IDs:`);
    console.log(`   Leads: ${externalLeads.length}`);
    console.log(`   Contacts: ${externalContacts.length}`);
    console.log(`   Total: ${externalLeads.length + externalContacts.length}`);
    
    if (externalLeads.length + externalContacts.length === 0) {
      console.log('✅ No external IDs found!');
      return;
    }
    
    // 2. CREATE ID MAPPING FOR LEADS
    console.log('\n🔄 Converting Leads...');
    const leadIdMapping = {};
    let leadsConverted = 0;
    let leadsErrors = 0;
    
    for (const lead of externalLeads) {
      try {
        const newId = uuidv4();
        leadIdMapping[lead.id] = newId;
        
        // Update the lead with new ID
        await prisma.leads.update({
          where: { id: lead.id },
          data: { id: newId }
        });
        
        leadsConverted++;
        if (leadsConverted % 50 === 0) {
          console.log(`   ✅ Converted ${leadsConverted}/${externalLeads.length} leads`);
        }
        
      } catch (error) {
        leadsErrors++;
        console.error(`   ❌ Error converting lead ${lead.fullName}: ${error.message}`);
      }
    }
    
    // 3. CREATE ID MAPPING FOR CONTACTS
    console.log('\n🔄 Converting Contacts...');
    const contactIdMapping = {};
    let contactsConverted = 0;
    let contactsErrors = 0;
    
    for (const contact of externalContacts) {
      try {
        const newId = uuidv4();
        contactIdMapping[contact.id] = newId;
        
        // Update the contact with new ID
        await prisma.contacts.update({
          where: { id: contact.id },
          data: { id: newId }
        });
        
        contactsConverted++;
        if (contactsConverted % 50 === 0) {
          console.log(`   ✅ Converted ${contactsConverted}/${externalContacts.length} contacts`);
        }
        
      } catch (error) {
        contactsErrors++;
        console.error(`   ❌ Error converting contact ${contact.fullName}: ${error.message}`);
      }
    }
    
    // 4. UPDATE RELATED RECORDS
    console.log('\n🔗 Updating related records...');
    
    // Update activities that reference leads
    const leadActivities = await prisma.activities.findMany({
      where: {
        leadId: { in: Object.keys(leadIdMapping) }
      },
      select: { id: true, leadId: true }
    });
    
    let activitiesUpdated = 0;
    for (const activity of leadActivities) {
      try {
        await prisma.activities.update({
          where: { id: activity.id },
          data: { leadId: leadIdMapping[activity.leadId] }
        });
        activitiesUpdated++;
      } catch (error) {
        console.error(`   ❌ Error updating activity ${activity.id}: ${error.message}`);
      }
    }
    
    // Update notes that reference leads
    const leadNotes = await prisma.notes.findMany({
      where: {
        leadId: { in: Object.keys(leadIdMapping) }
      },
      select: { id: true, leadId: true }
    });
    
    let notesUpdated = 0;
    for (const note of leadNotes) {
      try {
        await prisma.notes.update({
          where: { id: note.id },
          data: { leadId: leadIdMapping[note.leadId] }
        });
        notesUpdated++;
      } catch (error) {
        console.error(`   ❌ Error updating note ${note.id}: ${error.message}`);
      }
    }
    
    // Update opportunities that reference contacts
    const contactOpportunities = await prisma.opportunities.findMany({
      where: {
        contactId: { in: Object.keys(contactIdMapping) }
      },
      select: { id: true, contactId: true }
    });
    
    let opportunitiesUpdated = 0;
    for (const opportunity of contactOpportunities) {
      try {
        await prisma.opportunities.update({
          where: { id: opportunity.id },
          data: { contactId: contactIdMapping[opportunity.contactId] }
        });
        opportunitiesUpdated++;
      } catch (error) {
        console.error(`   ❌ Error updating opportunity ${opportunity.id}: ${error.message}`);
      }
    }
    
    // 5. VERIFY CONVERSION
    console.log('\n🔍 Verifying conversion...');
    
    const remainingExternalLeads = await prisma.leads.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } }
        ]
      }
    });
    
    const remainingExternalContacts = await prisma.contacts.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } }
        ]
      }
    });
    
    // 6. GENERATE REPORT
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONVERSION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Leads converted: ${leadsConverted}/${externalLeads.length}`);
    console.log(`✅ Contacts converted: ${contactsConverted}/${externalContacts.length}`);
    console.log(`✅ Activities updated: ${activitiesUpdated}`);
    console.log(`✅ Notes updated: ${notesUpdated}`);
    console.log(`✅ Opportunities updated: ${opportunitiesUpdated}`);
    console.log(`❌ Lead errors: ${leadsErrors}`);
    console.log(`❌ Contact errors: ${contactsErrors}`);
    
    if (remainingExternalLeads.length > 0 || remainingExternalContacts.length > 0) {
      console.log(`\n⚠️  ${remainingExternalLeads.length + remainingExternalContacts.length} external IDs still remain`);
      console.log('   Manual review may be needed');
    } else {
      console.log('\n🎉 All external IDs successfully converted!');
    }
    
    // Save conversion report
    const report = {
      timestamp: new Date().toISOString(),
      conversion: {
        leads: {
          total: externalLeads.length,
          converted: leadsConverted,
          errors: leadsErrors
        },
        contacts: {
          total: externalContacts.length,
          converted: contactsConverted,
          errors: contactsErrors
        }
      },
      relatedUpdates: {
        activities: activitiesUpdated,
        notes: notesUpdated,
        opportunities: opportunitiesUpdated
      },
      idMappings: {
        leads: leadIdMapping,
        contacts: contactIdMapping
      }
    };
    
    const fs = await import('fs');
    const reportPath = 'scripts/reports/id-conversion-report.json';
    
    // Ensure reports directory exists
    const reportsDir = 'scripts/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Conversion report saved to: ${reportPath}`);
    
    // 7. TEST DATA ACCESS
    console.log('\n🧪 Testing data access...');
    
    // Test if we can now access the converted data
    const testLeads = await prisma.leads.findMany({
      where: { workspaceId: 'cmezxb1ez0001pc94yry3ntjk' },
      take: 5
    });
    
    const testContacts = await prisma.contacts.findMany({
      where: { workspaceId: 'cmezxb1ez0001pc94yry3ntjk' },
      take: 5
    });
    
    console.log(`   Test leads found: ${testLeads.length}`);
    console.log(`   Test contacts found: ${testContacts.length}`);
    
    if (testLeads.length > 0 && testContacts.length > 0) {
      console.log('✅ Data access test successful!');
    } else {
      console.log('⚠️  Data access test failed - may need additional fixes');
    }
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
if (import.meta.url === `file://${process.argv[1]}`) {
  convertExternalToInternalIds();
}
