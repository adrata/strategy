const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importTopsCapsuleCRM() {
  try {
    console.log('🔄 IMPORTING TOPS CAPSULE CRM DATA\n');
    
    const csvFilePath = 'tops.csv';
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // TOPS workspace ID
    
    if (!fs.existsSync(csvFilePath)) {
      console.log(`❌ CSV file not found: ${csvFilePath}`);
      return;
    }

    console.log('📊 ANALYZING CAPSULE CRM STRUCTURE...\n');
    
    // Read the file content
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Parse header
    const header = lines[0].split('\t');
    console.log('📋 CSV HEADERS:');
    header.forEach((col, index) => {
      console.log(`   ${index}: ${col}`);
    });
    console.log('');

    // First pass: analyze the data structure
    const dataStructure = {
      totalRecords: 0,
      personRecords: 0,
      organizationRecords: 0,
      uniqueOrganizations: new Set(),
      uniquePeople: new Set(),
      owners: new Set(),
      sources: new Set(),
      tags: new Set(),
      regions: new Set()
    };

    const records = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split('\t');
      const record = {};
      
      // Map values to headers
      header.forEach((col, index) => {
        record[col] = values[index] || '';
      });
      
      records.push(record);
      dataStructure.totalRecords++;
      
      if (record.Type === 'Person') {
        dataStructure.personRecords++;
        if (record['First Name'] && record['Last Name']) {
          dataStructure.uniquePeople.add(`${record['First Name']} ${record['Last Name']}`);
        }
      } else if (record.Type === 'Organization') {
        dataStructure.organizationRecords++;
        if (record.Name) {
          dataStructure.uniqueOrganizations.add(record.Name);
        }
      }
      
      if (record.Owner) dataStructure.owners.add(record.Owner);
      if (record.Source) dataStructure.sources.add(record.Source);
      if (record.Tags) dataStructure.tags.add(record.Tags);
      if (record.Region) dataStructure.regions.add(record.Region);
    }

    console.log('📋 DATA STRUCTURE ANALYSIS:');
    console.log(`   📊 Total Records: ${dataStructure.totalRecords}`);
    console.log(`   👥 Person Records: ${dataStructure.personRecords}`);
    console.log(`   🏢 Organization Records: ${dataStructure.organizationRecords}`);
    console.log(`   🏢 Unique Organizations: ${dataStructure.uniqueOrganizations.size}`);
    console.log(`   👤 Unique People: ${dataStructure.uniquePeople.size}`);
    console.log(`   👑 Owners: ${Array.from(dataStructure.owners).join(', ')}`);
    console.log(`   🏷️  Sources: ${Array.from(dataStructure.sources).slice(0, 5).join(', ')}...`);
    console.log(`   🏷️  Tags: ${Array.from(dataStructure.tags).slice(0, 5).join(', ')}...`);
    console.log(`   🌍 Regions: ${Array.from(dataStructure.regions).slice(0, 5).join(', ')}...`);
    console.log('');

    // Second pass: process and import data
    console.log('🔄 PROCESSING AND IMPORTING DATA...\n');
    
    let importedAccounts = 0;
    let importedContacts = 0;
    let importedLeads = 0;
    let skippedRecords = 0;
    let errors = 0;

    // Process organizations first (they become accounts)
    const organizationMap = new Map(); // Map Capsule ID to Adrata ID
    
    for (const record of records) {
      try {
        if (record.Type === 'Organization') {
          // Import organization as account
          const accountData = {
            id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: topsWorkspaceId,
            assignedUserId: null, // Will be assigned based on Owner
            name: record.Name || record.Organization || 'Unknown Organization',
            website: record.Website || null,
            industry: 'Utilities/Energy', // Default for TOPS
            accountType: 'Prospect',
            tier: 'Tier 2',
            notes: record.Notes || null,
            createdAt: new Date(record.Created || Date.now()),
            updatedAt: new Date(record.Updated || Date.now())
          };

          // Try to find owner user
          if (record.Owner) {
            const ownerUser = await prisma.users.findFirst({
              where: {
                OR: [
                  { name: { contains: record.Owner, mode: 'insensitive' } },
                  { email: { contains: record.Owner.toLowerCase(), mode: 'insensitive' } }
                ]
              }
            });
            if (ownerUser) {
              accountData.assignedUserId = ownerUser.id;
            }
          }

          const newAccount = await prisma.accounts.create({
            data: accountData
          });

          organizationMap.set(record.ID, newAccount.id);
          importedAccounts++;
          
          if (importedAccounts % 50 === 0) {
            console.log(`   ✅ Imported ${importedAccounts} accounts...`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error importing organization ${record.Name}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n✅ ORGANIZATIONS IMPORTED: ${importedAccounts}`);
    console.log('');

    // Now process people (they become contacts and potentially leads)
    for (const record of records) {
      try {
        if (record.Type === 'Person') {
          // Import person as contact
          const contactData = {
            id: `con_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: topsWorkspaceId,
            assignedUserId: null,
            accountId: null,
            firstName: record['First Name'] || '',
            lastName: record['Last Name'] || '',
            email: record.Email || record['Email Address'] || null,
            phone: record['Phone Number'] || record['Direct Phone'] || record['Mobile Phone'] || null,
            title: record['Job Title'] || record.Title || null,
            department: null,
            notes: record.Notes || null,
            createdAt: new Date(record.Created || Date.now()),
            updatedAt: new Date(record.Updated || Date.now())
          };

          // Try to find owner user
          if (record.Owner) {
            const ownerUser = await prisma.users.findFirst({
              where: {
                OR: [
                  { name: { contains: record.Owner, mode: 'insensitive' } },
                  { email: { contains: record.Owner.toLowerCase(), mode: 'insensitive' } }
                ]
              }
            });
            if (ownerUser) {
              contactData.assignedUserId = ownerUser.id;
            }
          }

          // Link to organization if exists
          if (record.Organization) {
            const organization = await prisma.accounts.findFirst({
              where: {
                name: { contains: record.Organization, mode: 'insensitive' },
                workspaceId: topsWorkspaceId
              }
            });
            if (organization) {
              contactData.accountId = organization.id;
            }
          }

          const newContact = await prisma.contacts.create({
            data: contactData
          });

          importedContacts++;

          // If this person has a job title and organization, they might be a lead
          if (record['Job Title'] && record.Organization) {
            try {
              const leadData = {
                id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                workspaceId: topsWorkspaceId,
                assignedUserId: contactData.assignedUserId,
                contactId: newContact.id,
                accountId: contactData.accountId,
                status: 'New',
                source: record.Source || 'Capsule CRM Import',
                notes: `Imported from Capsule CRM. Job Title: ${record['Job Title']}. Organization: ${record.Organization}`,
                createdAt: new Date(record.Created || Date.now()),
                updatedAt: new Date(record.Updated || Date.now())
              };

              await prisma.leads.create({
                data: leadData
              });

              importedLeads++;
            } catch (leadError) {
              console.log(`   ⚠️  Could not create lead for ${record['First Name']} ${record['Last Name']}: ${leadError.message}`);
            }
          }

          if (importedContacts % 100 === 0) {
            console.log(`   ✅ Imported ${importedContacts} contacts...`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error importing person ${record['First Name']} ${record['Last Name']}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n✅ CONTACTS IMPORTED: ${importedContacts}`);
    console.log(`✅ LEADS CREATED: ${importedLeads}`);
    console.log(`❌ ERRORS: ${errors}`);
    console.log('');

    // Final verification
    console.log('🔍 FINAL VERIFICATION:');
    const finalAccounts = await prisma.accounts.count({
      where: { workspaceId: topsWorkspaceId }
    });
    const finalContacts = await prisma.contacts.count({
      where: { workspaceId: topsWorkspaceId }
    });
    const finalLeads = await prisma.leads.count({
      where: { workspaceId: topsWorkspaceId }
    });

    console.log(`   📊 Total accounts in TOPS workspace: ${finalAccounts}`);
    console.log(`   👥 Total contacts in TOPS workspace: ${finalContacts}`);
    console.log(`   🎯 Total leads in TOPS workspace: ${finalLeads}`);
    console.log('');

    console.log('🎉 IMPORT COMPLETE!');
    console.log('   TOPS Capsule CRM data has been successfully imported');
    console.log('   All organizations are now accounts');
    console.log('   All people are now contacts');
    console.log('   Qualified prospects are now leads');
    console.log('   Data is ready for buyer group intelligence analysis');

  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importTopsCapsuleCRM();
}

module.exports = { importTopsCapsuleCRM };
