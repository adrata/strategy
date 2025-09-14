const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importTopsConferenceData() {
  try {
    console.log('🔄 IMPORTING TOPS CONFERENCE DATA WITH CORRECTED FIELD MAPPING\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // TOPS workspace ID
    
    // Import UTC All Regionals data
    console.log('📊 IMPORTING UTC ALL REGIONALS DATA...\n');
    await importUtcRegionals(topsWorkspaceId);
    
    // Import TOPS Mailer Campaign data
    console.log('\n📧 IMPORTING TOPS MAILER CAMPAIGN DATA...\n');
    await importMailerCampaign(topsWorkspaceId);
    
    console.log('\n🎉 ALL TOPS CONFERENCE DATA IMPORTED SUCCESSFULLY!');
    console.log('   Conference attendees, companies, and campaign tracking added');
    
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
    
    // Parse header - this file has tab-separated values
    const header = lines[0].split('\t');
    console.log(`   📋 Found ${header.length} columns: ${header.join(', ')}`);
    
    let importedAccounts = 0;
    let importedContacts = 0;
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
        // Normalize company name
        const companyName = record['Company']?.trim();
        if (!companyName) continue;
        
        // Create or find account
        let account = await prisma.accounts.findFirst({
          where: {
            name: { contains: companyName, mode: 'insensitive' },
            workspaceId: workspaceId
          }
        });
        
        if (!account) {
          // Create new account
          const accountData = {
            id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: workspaceId,
            assignedUserId: null,
            name: companyName,
            industry: 'Utilities',
            accountType: 'Prospect',
            tier: 'Tier 2',
            source: 'UTC All Regionals',
            website: null,
            notes: `UTC Region: ${record['Region '] || 'Unknown'}\n${record['Notes'] || ''}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          account = await prisma.accounts.create({
            data: accountData
          });
          
          importedAccounts++;
        }
        
        // Create contact if we have name and email
        if (record['First Name']?.trim() && record['Last Name']?.trim() && record['Email']?.trim()) {
          const contactData = {
            id: `con_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: workspaceId,
            assignedUserId: null,
            accountId: account.id,
            firstName: record['First Name'].trim(),
            lastName: record['Last Name'].trim(),
            fullName: `${record['First Name'].trim()} ${record['Last Name'].trim()}`,
            email: record['Email'].trim(),
            phone: record['Work Phone'] || null,
            title: record['Title'] || null,
            department: null,
            notes: `UTC Region: ${record['Region '] || 'Unknown'}\n${record['Notes'] || ''}`,
            source: 'UTC All Regionals',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const newContact = await prisma.contacts.create({
            data: contactData
          });
          
          importedContacts++;
          
          // Create lead for qualified prospects
          if (record['Title']?.trim()) {
            try {
              const leadData = {
                id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                workspaceId: workspaceId,
                assignedUserId: null,
                contactId: newContact.id,
                accountId: account.id,
                status: 'New',
                source: 'UTC All Regionals',
                notes: `UTC Region: ${record['Region '] || 'Unknown'}\n${record['Notes'] || ''}`,
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
                  accountId: account.id,
                  contactId: newContact.id,
                  leadId: leadData.id,
                  type: 'Conference',
                  status: 'completed',
                  priority: 'normal',
                  subject: `UTC Conference: ${record['Region '] || 'Unknown'} Region`,
                  description: `UTC conference attendee from ${record['Region '] || 'Unknown'} region. Company: ${companyName}. Notes: ${record['Notes'] || 'No additional notes'}`,
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
            } catch (leadError) {
              console.log(`   ⚠️  Could not create lead for ${record['First Name']} ${record['Last Name']}: ${leadError.message}`);
            }
          }
        }
        
        if (importedContacts % 50 === 0) {
          console.log(`   ✅ Imported ${importedContacts} contacts, ${importedLeads} leads, ${importedActivities} activities...`);
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
    console.log(`   📋 Found ${header.length} columns: ${header.join(', ')}`);
    
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
              accountId: null,
              firstName: record['First Name'] || '',
              lastName: record['Last Name'] || '',
              fullName: `${record['First Name'] || ''} ${record['Last Name'] || ''}`.trim(),
              email: record.Email || record['Email Address'] || null,
              phone: record['Phone Number'] || null,
              title: record['Job Title'] || record.Title || null,
              department: null,
              notes: `CAMPAIGN: ${record.Tags || ''}\n${record.Notes || ''}`,
              source: 'TOPS Mailer Campaign',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Try to find account by organization
            if (record.Organization) {
              const account = await prisma.accounts.findFirst({
                where: {
                  name: { contains: record.Organization, mode: 'insensitive' },
                  workspaceId: workspaceId
                }
              });
              if (account) {
                contactData.accountId = account.id;
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
                
                // Create campaign activity for tracking
                try {
                  const activityData = {
                    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    workspaceId: workspaceId,
                    userId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Use a valid user ID from TOPS workspace
                    accountId: contactData.accountId,
                    contactId: newContact.id,
                    leadId: leadData.id,
                    type: 'Campaign',
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
              } catch (leadError) {
                console.log(`   ⚠️  Could not create lead for ${record['First Name']} ${record['Last Name']}: ${leadError.message}`);
              }
            }
          }
        }
        
        if (importedContacts % 100 === 0) {
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
