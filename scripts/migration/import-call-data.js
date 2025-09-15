const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function importCallData() {
  console.log('📞 IMPORTING CALL DATA FOR DANO');
  console.log('================================');
  
  try {
    const csvPath = path.join(process.cwd(), 'Calls_2025_09_14 2.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found:', csvPath);
      return;
    }
    
    console.log('📁 Reading CSV file:', csvPath);
    
    const calls = [];
    const companies = new Map();
    const people = new Map();
    
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          calls.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Found ${calls.length} calls to import`);
    
    // Process calls in batches
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const call of calls) {
      try {
        // Extract call data
        const callData = {
          recordId: call['Record Id'],
          subject: call['Subject'] || 'Call',
          callType: call['Call Type'] || 'Outbound',
          callPurpose: call['Call Purpose'] || '',
          contactName: call['Contact Name'] || '',
          contactId: call['Contact Name.id'] || '',
          relatedTo: call['Related To'] || '',
          relatedToId: call['Related To.id'] || '',
          callStartTime: call['Call Start Time'] ? new Date(call['Call Start Time']) : new Date(),
          callDuration: call['Call Duration'] || '00:00',
          description: call['Description'] || '',
          callResult: call['Call Result'] || '',
          callStatus: call['Call Status'] || 'Completed',
          createdBy: call['Created By'] || 'JUST DANO',
          createdTime: call['Created Time'] ? new Date(call['Created Time']) : new Date(),
          modifiedTime: call['Modified Time'] ? new Date(call['Modified Time']) : new Date()
        };
        
        // Find or create company
        let companyId = null;
        if (callData.relatedTo && callData.relatedToId) {
          // Try to find existing company by name
          let company = await prisma.companies.findFirst({
            where: {
              name: {
                contains: callData.relatedTo,
                mode: 'insensitive'
              },
              workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' // Dano's workspace
            }
          });
          
          if (!company) {
            // Create new company
            company = await prisma.companies.create({
              data: {
                id: callData.relatedToId,
                name: callData.relatedTo,
                workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            console.log(`  ✅ Created company: ${callData.relatedTo}`);
          }
          companyId = company.id;
        }
        
        // Find or create person
        let personId = null;
        if (callData.contactName && callData.contactId) {
          // Try to find existing person by fullName
          let person = await prisma.people.findFirst({
            where: {
              fullName: {
                contains: callData.contactName,
                mode: 'insensitive'
              },
              workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' // Dano's workspace
            }
          });
          
          if (!person) {
            // Parse name into firstName and lastName
            const nameParts = callData.contactName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Create new person with proper data structure
            person = await prisma.people.create({
              data: {
                id: callData.contactId,
                firstName: firstName,
                lastName: lastName,
                fullName: callData.contactName,
                workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
                companyId: companyId,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            console.log(`  ✅ Created person: ${callData.contactName}`);
            
            // Create corresponding lead for this person
            try {
              await prisma.leads.create({
                data: {
                  id: `lead_${callData.contactId}`,
                  personId: person.id,
                  companyId: companyId,
                  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
                  status: 'new',
                  source: 'call_import',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
              console.log(`  ✅ Created lead for: ${callData.contactName}`);
            } catch (leadError) {
              console.log(`  ⚠️  Lead already exists for: ${callData.contactName}`);
            }
          }
          personId = person.id;
        }
        
        // Create action record
        const actionData = {
          id: callData.recordId,
          type: 'call',
          subject: callData.subject,
          description: callData.description,
          status: callData.callStatus.toLowerCase(),
          scheduledDate: callData.callStartTime,
          completedAt: callData.callStatus === 'Completed' ? callData.callStartTime : null,
          companyId: companyId,
          personId: personId,
          userId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's user ID (using workspace ID as fallback)
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
          createdAt: callData.createdTime,
          updatedAt: callData.modifiedTime,
          metadata: {
            callType: callData.callType,
            callPurpose: callData.callPurpose,
            callDuration: callData.callDuration,
            callResult: callData.callResult,
            createdBy: callData.createdBy
          }
        };
        
        // Check if action already exists
        const existingAction = await prisma.actions.findUnique({
          where: { id: callData.recordId }
        });
        
        if (!existingAction) {
          await prisma.actions.create({
            data: actionData
          });
          imported++;
          
          if (imported % 50 === 0) {
            console.log(`  📞 Imported ${imported} calls...`);
          }
        } else {
          skipped++;
        }
        
      } catch (error) {
        console.error(`  ❌ Error importing call ${call['Record Id']}:`, error.message);
        errors++;
      }
    }
    
    console.log('\\n📊 IMPORT SUMMARY:');
    console.log(`  ✅ Imported: ${imported} calls`);
    console.log(`  ⏭️  Skipped: ${skipped} calls (already exist)`);
    console.log(`  ❌ Errors: ${errors} calls`);
    
    // Verify linking
    console.log('\\n🔗 VERIFYING RELATIONSHIPS:');
    const linkedActions = await prisma.actions.count({
      where: {
        type: 'call',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        OR: [
          { personId: { not: null } },
          { companyId: { not: null } }
        ]
      }
    });
    console.log(`  📞 Call actions with relationships: ${linkedActions}`);
    
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      }
    });
    console.log(`  👥 Total people in Dano's workspace: ${totalPeople}`);
    
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      }
    });
    console.log(`  🏢 Total companies in Dano's workspace: ${totalCompanies}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importCallData();
