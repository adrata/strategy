const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importTopsConferenceData() {
  try {
    console.log('🔄 IMPORTING TOPS CONFERENCE DATA - FINAL VERSION\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // TOPS workspace ID
    
    // Import UTC All Regionals data
    console.log('📊 IMPORTING UTC ALL REGIONALS DATA...\n');
    await importUtcRegionals(topsWorkspaceId);
    
    // Import TOPS Mailer Campaign data
    console.log('\n📧 IMPORTING TOPS MAILER CAMPAIGN DATA...\n');
    await importMailerCampaign(topsWorkspaceId);
    
    console.log('\n🎉 ALL TOPS CONFERENCE DATA IMPORTED SUCCESSFULLY!');
    console.log('   Conference attendees, campaign tracking, and activities created');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importUtcRegionals(workspaceId) {
  try {
    console.log('   📁 Reading UTC All Regionals CSV...');
    const csvFilePath = 'utc_all_regionals.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.log(`   ❌ File not found: ${csvFilePath}`);
      return;
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Parse header - this file has comma-separated values
    const header = lines[0].split(',').map(h => h.trim());
    console.log(`   📋 Found ${header.length} columns: ${header.join(', ')}`);
    
    let importedAccounts = 0;
    let importedContacts = 0;
    let importedLeads = 0;
    let importedActivities = 0;
    let errors = 0;
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const record = {};
      
      // Map values to headers
      header.forEach((col, index) => {
        record[col] = values[index] || '';
      });
      
      try {
        // Create or find account
        let account = null;
        if (record.Company) {
          account = await prisma.accounts.findFirst({
            where: {
              name: { equals: record.Company, mode: 'insensitive' },
              workspaceId: workspaceId
            }
          });
          
          if (!account) {
            account = await prisma.accounts.create({
              data: {
                id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                workspaceId: workspaceId,
                assignedUserId: null,
                name: record.Company,
                industry: 'Utilities',
                accountType: 'Prospect',
                tier: 'Tier 2',
                website: null,
                notes: `UTC Regional: ${record.Region || 'Unknown'} - ${record.Notes || ''}`,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            importedAccounts++;
          }
        }
        
        // Create contact if we have name and email
        if (record['First Name'] && record['Last Name'] && record.Email) {
          const existingContact = await prisma.contacts.findFirst({
            where: {
              email: record.Email,
              workspaceId: workspaceId
            }
          });
          
          if (!existingContact) {
            const contactData = {
              id: `con_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workspaceId: workspaceId,
              assignedUserId: null,
              firstName: record['First Name'],
              lastName: record['Last Name'],
              fullName: `${record['First Name']} ${record['Last Name']}`,
              email: record.Email,
              phone: record['Work Phone'] || null,
              jobTitle: record.Title || null,
              department: null,
              notes: `UTC Regional Conference: ${record.Region || 'Unknown'}\n${record.Notes || ''}`,
              source: 'UTC All Regionals',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            const newContact = await prisma.contacts.create({
              data: contactData
            });
            
            importedContacts++;
            
            // Create lead
            const leadData = {
              id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workspaceId: workspaceId,
              assignedUserId: null,
              firstName: record['First Name'],
              lastName: record['Last Name'],
              fullName: `${record['First Name']} ${record['Last Name']}`,
              contactId: newContact.id,
              accountId: account?.id || null,
              status: 'New',
              source: 'UTC All Regionals',
              notes: `UTC Regional Conference attendee from ${record.Region || 'Unknown'}`,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await prisma.leads.create({
              data: leadData
            });
            
            importedLeads++;
            
            // Create UTC conference activity
            try {
              const activityData = {
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                workspaceId: workspaceId,
                userId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Use a valid user ID from TOPS workspace
                assignedUserId: null,
                accountId: account?.id || null,
                contactId: newContact.id,
                leadId: leadData.id,
                type: 'Conference',
                campaignType: 'UTC Regional',
                status: 'completed',
                priority: 'normal',
                subject: `UTC Conference: ${record.Region || 'Unknown'} Region`,
                description: `UTC conference attendee from ${record.Region || 'Unknown'} region. Company: ${record.Company || 'Unknown'}. Notes: ${record.Notes || 'No additional notes'}`,
                completedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              await prisma.activities.create({
                data: activityData
              });
              
              importedActivities++;
            } catch (activityError) {
              console.log(`   ⚠️  Could not create activity for ${record['First Name']} ${record['Last Name']}: ${activityError.message}`);
            }
          }
        }
        
        if (i % 50 === 0) {
          console.log(`   ✅ Processed ${i} records...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error importing record: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n✅ UTC ALL REGIONALS IMPORTED:`);
    console.log(`   🏢 New Accounts: ${importedAccounts}`);
    console.log(`   👥 New Contacts: ${importedContacts}`);
    console.log(`   🎯 New Leads: ${importedLeads}`);
    console.log(`   📅 New Activities: ${importedActivities}`);
    console.log(`   ❌ Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Error importing UTC All Regionals:', error);
  }
}

async function importMailerCampaign(workspaceId) {
  try {
    console.log('   📁 Reading TOPS Mailer Campaign CSV...');
    const csvFilePath = 'tops_mailer_campagin.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.log(`   ❌ File not found: ${csvFilePath}`);
      return;
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Parse header - this file has tab-separated values
    const header = lines[0].split('\t');
    console.log(`   📋 Found ${header.length} columns`);
    console.log(`   📋 Sample headers: ${header.slice(0, 5).join(', ')}...`);
    
    let importedContacts = 0;
    let updatedContacts = 0;
    let importedLeads = 0;
    let importedActivities = 0;
    let errors = 0;
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split('\t');
      const record = {};
      
      // Map values to headers
      header.forEach((col, index) => {
        record[col] = values[index] || '';
      });
      
      try {
        if (record.Type === 'Person') {
          // Check if contact already exists
          const existingContact = await prisma.contacts.findFirst({
            where: {
              OR: [
                { email: record.Email || record['Email Address'] },
                {
                  AND: [
                    { firstName: record['First Name'] },
                    { lastName: record['Last Name'] }
                  ]
                }
              ],
              workspaceId: workspaceId
            }
          });
          
          if (existingContact) {
            // Update existing contact with campaign data
            await prisma.contacts.update({
              where: { id: existingContact.id },
              data: {
                notes: `${existingContact.notes || ''}\n\nCAMPAIGN UPDATE: ${record.Tags || ''} - ${record.Notes || ''}`,
                updatedAt: new Date()
              }
            });
            updatedContacts++;
          } else {
            // Create new contact
            const contactData = {
              id: `con_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workspaceId: workspaceId,
              assignedUserId: null,
              firstName: record['First Name'] || '',
              lastName: record['Last Name'] || '',
              fullName: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim(),
              email: record.Email || record['Email Address'] || null,
              phone: record['Phone Number'] || null,
              jobTitle: record['Job Title'] || record.Title || null,
              department: null,
              notes: `CAMPAIGN: ${record.Tags || ''}\n${record.Notes || ''}`,
              source: 'TOPS Mailer Campaign',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Try to find account by organization
            let accountId = null;
            if (record.Organization) {
              const account = await prisma.accounts.findFirst({
                where: {
                  name: { contains: record.Organization, mode: 'insensitive' },
                  workspaceId: workspaceId
                }
              });
              if (account) {
                accountId = account.id;
              }
            }
            
            const newContact = await prisma.contacts.create({
              data: contactData
            });
            
            importedContacts++;
            
            // Create lead for qualified prospects
            if (record['Job Title'] && record.Organization) {
              try {
                const leadData = {
                  id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  workspaceId: workspaceId,
                  assignedUserId: null,
                  firstName: record['First Name'] || '',
                  lastName: record['Last Name'] || '',
                  fullName: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim(),
                  contactId: newContact.id,
                  accountId: contactData.accountId,
                  status: 'New',
                  source: 'TOPS Mailer Campaign',
                  notes: `Campaign: ${record.Tags || ''}\n${record.Notes || ''}`,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                await prisma.leads.create({
                  data: leadData
                });
                
                importedLeads++;
              } catch (leadError) {
                console.log(`   ⚠️  Could not create lead for ${record['First Name']} ${record['Last Name']}: ${leadError.message}`);
              }
            }
            
            // Create campaign activity for ALL contacts (not just those with leads)
            try {
              const activityData = {
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                workspaceId: workspaceId,
                userId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Use a valid user ID from TOPS workspace
                assignedUserId: null,
                accountId: contactData.accountId,
                contactId: newContact.id,
                leadId: null, // May not have a lead
                type: 'Campaign',
                campaignType: 'TOPS Mailer Campaign',
                status: 'completed',
                priority: 'normal',
                subject: `Mailer Campaign: ${record.Tags || 'Gift Campaign'}`,
                description: `Mailer campaign activity for ${record['First Name']} ${record['Last Name']} at ${record.Organization || 'Unknown Company'}. Gift Level: ${record.Tags || 'Unknown'}. Notes: ${record.Notes || 'No additional notes'}`,
                completedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              await prisma.activities.create({
                data: activityData
              });
              
              importedActivities++;
            } catch (activityError) {
              console.log(`   ⚠️  Could not create activity for ${record['First Name']} ${record['Last Name']}: ${activityError.message}`);
            }
          }
        }
        
        if (importedContacts % 10 === 0) {
          console.log(`   ✅ Imported ${importedContacts} contacts, ${importedLeads} leads, ${importedActivities} activities...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error importing record: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n✅ MAILER CAMPAIGN IMPORTED:`);
    console.log(`   👥 New Contacts: ${importedContacts}`);
    console.log(`   🔄 Updated Contacts: ${updatedContacts}`);
    console.log(`   🎯 New Leads: ${importedLeads}`);
    console.log(`   📅 New Activities: ${importedActivities}`);
    console.log(`   ❌ Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Error importing Mailer Campaign:', error);
  }
}

// Run the import
if (require.main === module) {
  importTopsConferenceData();
}

module.exports = { importTopsConferenceData };
