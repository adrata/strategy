const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class LeadProspectAlignment {
  constructor() {
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.results = {
      group1Leads: [],
      group1Prospects: [],
      group2Leads: [],
      group2Prospects: [],
      group3People: [],
      newLeadsCreated: [],
      archivedRecords: null,
      summary: {}
    };
  }

  async analyzeCurrentData() {
    console.log('🔍 ANALYZING CURRENT LEAD/PROSPECT DATA');
    console.log('======================================');

    // Get all current leads
    const allLeads = await prisma.leads.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        personId: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get all current prospects
    const allProspects = await prisma.prospects.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        personId: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`📊 CURRENT DATA:`);
    console.log(`   Total Leads: ${allLeads.length}`);
    console.log(`   Total Prospects: ${allProspects.length}`);
    console.log('');

    // Get people data for leads
    const leadPersonIds = allLeads.map(lead => lead.personId).filter(id => id);
    const leadPeople = await prisma.people.findMany({
      where: {
        id: { in: leadPersonIds },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        buyerGroupRole: true,
        customFields: true
      }
    });

    // Get people data for prospects
    const prospectPersonIds = allProspects.map(prospect => prospect.personId).filter(id => id);
    const prospectPeople = await prisma.people.findMany({
      where: {
        id: { in: prospectPersonIds },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        buyerGroupRole: true,
        customFields: true
      }
    });

    // Categorize by creation date
    const group1Leads = leadPeople.filter(p => 
      p.createdAt.toISOString().split('T')[0] === '2025-09-18'
    );
    const group2Leads = leadPeople.filter(p => 
      p.createdAt.toISOString().split('T')[0] === '2025-09-22'
    );
    const group1Prospects = prospectPeople.filter(p => 
      p.createdAt.toISOString().split('T')[0] === '2025-09-18'
    );
    const group2Prospects = prospectPeople.filter(p => 
      p.createdAt.toISOString().split('T')[0] === '2025-09-22'
    );

    this.results.group1Leads = group1Leads;
    this.results.group1Prospects = group1Prospects;
    this.results.group2Leads = group2Leads;
    this.results.group2Prospects = group2Prospects;

    console.log(`📊 LEAD/PROSPECT PEOPLE ANALYSIS:`);
    console.log(`   Group 1 Leads: ${group1Leads.length} people`);
    console.log(`   Group 1 Prospects: ${group1Prospects.length} people`);
    console.log(`   Group 2 Leads: ${group2Leads.length} people`);
    console.log(`   Group 2 Prospects: ${group2Prospects.length} people`);
    console.log('');

    return {
      allLeads,
      allProspects,
      group1Leads,
      group1Prospects,
      group2Leads,
      group2Prospects
    };
  }

  async getGroup3People() {
    console.log('👥 GETTING GROUP 3 PEOPLE');
    console.log('==========================');

    const group3People = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        createdAt: {
          gte: new Date('2025-09-30T00:00:00.000Z')
        }
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        department: true,
        companyId: true,
        buyerGroupRole: true,
        customFields: true,
        createdAt: true
      }
    });

    this.results.group3People = group3People;

    console.log(`✅ Found ${group3People.length} Group 3 people`);
    console.log('');

    return group3People;
  }

  async createGroup3LeadRecords() {
    console.log('📝 CREATING GROUP 3 LEAD RECORDS');
    console.log('================================');

    const group3People = this.results.group3People;
    const newLeadsCreated = [];

    console.log(`Creating ${group3People.length} lead records for Group 3 people...`);

    for (const person of group3People) {
      try {
        const leadId = ulid();
        
        const leadData = {
          id: leadId,
          workspaceId: this.workspaceId,
          personId: person.id,
          email: person.email,
          fullName: person.fullName,
          firstName: person.firstName,
          lastName: person.lastName,
          status: 'new',
          source: 'AI Buyer Group Discovery v2.0',
          priority: person.buyerGroupRole === 'Decision Maker' ? 'high' : 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            buyerGroupRole: person.buyerGroupRole,
            enrichmentDate: new Date().toISOString(),
            source: 'Group 3 - Today\'s Buyer Group Discovery',
            companyId: person.companyId,
            jobTitle: person.jobTitle,
            department: person.department
          }
        };

        const newLead = await prisma.leads.create({
          data: leadData
        });

        newLeadsCreated.push({
          leadId: newLead.id,
          personId: person.id,
          fullName: person.fullName,
          email: person.email,
          buyerGroupRole: person.buyerGroupRole
        });

        if (newLeadsCreated.length % 100 === 0) {
          console.log(`   Created ${newLeadsCreated.length}/${group3People.length} lead records...`);
        }

      } catch (error) {
        console.log(`   ⚠️ Failed to create lead for ${person.fullName}: ${error.message}`);
      }
    }

    this.results.newLeadsCreated = newLeadsCreated;

    console.log(`✅ Created ${newLeadsCreated.length} lead records for Group 3 people`);
    console.log('');

    return newLeadsCreated;
  }

  async addBuyerGroupStatusToGroup1Records() {
    console.log('🏷️ ADDING BUYER GROUP STATUS TO GROUP 1 RECORDS');
    console.log('===============================================');

    let leadsUpdated = 0;
    let prospectsUpdated = 0;

    // Update leads
    for (const person of this.results.group1Leads) {
      try {
        const buyerGroupStatus = person.customFields?.buyerGroupStatus || 'unknown';
        
        await prisma.leads.updateMany({
          where: { personId: person.id },
          data: {
            customFields: {
              buyerGroupStatus: buyerGroupStatus,
              buyerGroupRole: person.buyerGroupRole,
              statusUpdateDate: new Date().toISOString()
            },
            updatedAt: new Date()
          }
        });

        leadsUpdated++;

      } catch (error) {
        console.log(`   ⚠️ Failed to update lead for ${person.fullName}: ${error.message}`);
      }
    }

    // Update prospects
    for (const person of this.results.group1Prospects) {
      try {
        const buyerGroupStatus = person.customFields?.buyerGroupStatus || 'unknown';
        
        await prisma.prospects.updateMany({
          where: { personId: person.id },
          data: {
            customFields: {
              buyerGroupStatus: buyerGroupStatus,
              buyerGroupRole: person.buyerGroupRole,
              statusUpdateDate: new Date().toISOString()
            },
            updatedAt: new Date()
          }
        });

        prospectsUpdated++;

      } catch (error) {
        console.log(`   ⚠️ Failed to update prospect for ${person.fullName}: ${error.message}`);
      }
    }

    console.log(`✅ Updated ${leadsUpdated} lead records with buyer group status`);
    console.log(`✅ Updated ${prospectsUpdated} prospect records with buyer group status`);
    console.log('');

    return { leadsUpdated, prospectsUpdated };
  }

  async archiveGroup2Records() {
    console.log('🗄️ ARCHIVING GROUP 2 RECORDS');
    console.log('=============================');

    // Get Group 2 lead/prospect records
    const group2LeadRecords = await prisma.leads.findMany({
      where: {
        workspaceId: this.workspaceId,
        personId: { in: this.results.group2Leads.map(p => p.id) }
      }
    });

    const group2ProspectRecords = await prisma.prospects.findMany({
      where: {
        workspaceId: this.workspaceId,
        personId: { in: this.results.group2Prospects.map(p => p.id) }
      }
    });

    // Archive to JSON
    const archiveData = {
      timestamp: new Date().toISOString(),
      totalLeads: group2LeadRecords.length,
      totalProspects: group2ProspectRecords.length,
      description: 'Group 2 (Wave 1) lead/prospect records - archived before cleanup',
      leads: group2LeadRecords,
      prospects: group2ProspectRecords
    };

    const archiveFile = `archived-group2-lead-prospect-records-${new Date().toISOString().split('T')[0]}.json`;
    const archivePath = path.join(__dirname, '..', 'data', 'archive', archiveFile);
    
    // Ensure archive directory exists
    const archiveDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    fs.writeFileSync(archivePath, JSON.stringify(archiveData, null, 2));
    
    this.results.archivedRecords = {
      file: archiveFile,
      path: archivePath,
      leadCount: group2LeadRecords.length,
      prospectCount: group2ProspectRecords.length
    };

    console.log(`✅ Archived ${group2LeadRecords.length} lead records`);
    console.log(`✅ Archived ${group2ProspectRecords.length} prospect records`);
    console.log(`📁 Archive file: ${archiveFile}`);
    console.log('');

    return archiveData;
  }

  async generateSummary() {
    console.log('📊 GENERATING ALIGNMENT SUMMARY');
    console.log('===============================');

    // Get final counts
    const totalLeads = await prisma.leads.count({
      where: { workspaceId: this.workspaceId }
    });

    const totalProspects = await prisma.prospects.count({
      where: { workspaceId: this.workspaceId }
    });

    const leadsWithStatus = await prisma.leads.count({
      where: {
        workspaceId: this.workspaceId,
        customFields: {
          path: ['buyerGroupStatus'],
          not: null
        }
      }
    });

    const prospectsWithStatus = await prisma.prospects.count({
      where: {
        workspaceId: this.workspaceId,
        customFields: {
          path: ['buyerGroupStatus'],
          not: null
        }
      }
    });

    this.results.summary = {
      totalLeads: totalLeads,
      totalProspects: totalProspects,
      leadsWithStatus: leadsWithStatus,
      prospectsWithStatus: prospectsWithStatus,
      group3LeadsCreated: this.results.newLeadsCreated.length,
      archivedLeads: this.results.archivedRecords?.leadCount || 0,
      archivedProspects: this.results.archivedRecords?.prospectCount || 0
    };

    console.log('📊 ALIGNMENT SUMMARY:');
    console.log('====================');
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`Total Prospects: ${totalProspects}`);
    console.log(`Leads with Buyer Group Status: ${leadsWithStatus}`);
    console.log(`Prospects with Buyer Group Status: ${prospectsWithStatus}`);
    console.log('');
    console.log('🎯 ALIGNMENT RESULTS:');
    console.log('=====================');
    console.log(`✅ Group 3 Lead Records Created: ${this.results.newLeadsCreated.length}`);
    console.log(`✅ Group 1 Records Updated with Status: ${leadsWithStatus + prospectsWithStatus}`);
    console.log(`🗄️ Group 2 Records Archived: ${this.results.archivedRecords?.leadCount + this.results.archivedRecords?.prospectCount || 0}`);
    console.log('');
    console.log('📁 ARCHIVE:');
    console.log(`   Archive File: ${this.results.archivedRecords?.file || 'None'}`);
    console.log(`   Archive Path: ${this.results.archivedRecords?.path || 'None'}`);
    console.log('');

    return this.results.summary;
  }

  async executeAlignment() {
    console.log('🚀 EXECUTING LEAD/PROSPECT ALIGNMENT');
    console.log('====================================');
    console.log('This will:');
    console.log('1. Analyze current lead/prospect data');
    console.log('2. Create lead records for Group 3 people');
    console.log('3. Add buyer group status to Group 1 records');
    console.log('4. Archive Group 2 records');
    console.log('5. Generate summary report');
    console.log('');

    try {
      // Step 1: Analyze current data
      await this.analyzeCurrentData();

      // Step 2: Get Group 3 people
      await this.getGroup3People();

      // Step 3: Create Group 3 lead records
      await this.createGroup3LeadRecords();

      // Step 4: Add buyer group status to Group 1 records
      await this.addBuyerGroupStatusToGroup1Records();

      // Step 5: Archive Group 2 records
      await this.archiveGroup2Records();

      // Step 6: Generate summary
      await this.generateSummary();

      console.log('✅ LEAD/PROSPECT ALIGNMENT COMPLETE!');
      console.log('====================================');
      console.log('✅ Group 3 people now have lead records');
      console.log('✅ Group 1 records updated with buyer group status');
      console.log('🗄️ Group 2 records archived');
      console.log('📊 All data aligned with people groups');

    } catch (error) {
      console.error('❌ Alignment failed:', error.message);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const analyzeOnly = args.includes('--analyze-only');

  if (analyzeOnly) {
    console.log('🔍 ANALYZE ONLY MODE');
    console.log('====================');
    const alignment = new LeadProspectAlignment();
    await alignment.analyzeCurrentData();
    await alignment.getGroup3People();
    await alignment.generateSummary();
  } else if (dryRun) {
    console.log('🧪 DRY RUN MODE - NO CHANGES WILL BE MADE');
    console.log('==========================================');
    const alignment = new LeadProspectAlignment();
    await alignment.analyzeCurrentData();
    await alignment.getGroup3People();
    console.log('✅ Analysis complete. Run without --dry-run to execute alignment.');
  } else {
    console.log('⚠️ EXECUTING REAL ALIGNMENT - THIS WILL MODIFY THE DATABASE');
    console.log('==========================================================');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const alignment = new LeadProspectAlignment();
    await alignment.executeAlignment();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LeadProspectAlignment;
