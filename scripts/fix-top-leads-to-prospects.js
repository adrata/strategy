/**
 * 🔧 FIX: Convert TOP Engineering Plus Leads with Email Engagement to Prospects
 * 
 * This script converts all leads (people and companies) that have email engagement
 * to prospects, as per the rule: "Any person or company with email engagement should be a prospect."
 * 
 * Usage:
 *   node scripts/fix-top-leads-to-prospects.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class FixLeadsToProspects {
  constructor() {
    this.stats = {
      peopleConverted: 0,
      companiesConverted: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async run() {
    try {
      this.log('CONVERTING LEADS WITH EMAIL ENGAGEMENT TO PROSPECTS', 'info');
      this.log('='.repeat(60), 'info');
      
      await this.convertPeopleLeads();
      await this.convertCompanyLeads();
      
      this.printSummary();
    } catch (error) {
      this.log(`Error during conversion: ${error.message}`, 'error');
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async convertPeopleLeads() {
    this.log('\n👥 Converting People Leads to Prospects', 'info');
    
    // Find all leads with email engagement
    const leadsWithEmailEngagement = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        status: 'LEAD',
        OR: [
          {
            actions: {
              some: {
                deletedAt: null,
                status: 'COMPLETED',
                type: {
                  in: ['email_sent', 'email_received', 'email_conversation', 'EMAIL']
                }
              }
            }
          },
          {
            emails: {
              some: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
              }
            }
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        status: true
      }
    });

    this.log(`Found ${leadsWithEmailEngagement.length} leads with email engagement`, 'info');

    // Convert each lead to prospect
    for (const lead of leadsWithEmailEngagement) {
      try {
        await prisma.people.update({
          where: { id: lead.id },
          data: {
            status: 'PROSPECT',
            updatedAt: new Date()
          }
        });
        
        this.stats.peopleConverted++;
        this.log(`  Converted: ${lead.fullName} (${lead.id})`, 'success');
      } catch (error) {
        this.stats.errors.push({
          type: 'person',
          id: lead.id,
          name: lead.fullName,
          error: error.message
        });
        this.log(`  Failed to convert ${lead.fullName}: ${error.message}`, 'error');
      }
    }

    this.log(`✅ Converted ${this.stats.peopleConverted} people leads to prospects`, 'success');
  }

  async convertCompanyLeads() {
    this.log('\n🏢 Converting Company Leads to Prospects', 'info');
    
    // Find all company leads with email engagement (direct or via people)
    const leadsWithEmailEngagement = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        status: 'LEAD',
        OR: [
          {
            actions: {
              some: {
                deletedAt: null,
                status: 'COMPLETED',
                type: {
                  in: ['email_sent', 'email_received', 'email_conversation', 'EMAIL']
                }
              }
            }
          },
          {
            emails: {
              some: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
              }
            }
          },
          {
            people: {
              some: {
                deletedAt: null,
                OR: [
                  {
                    actions: {
                      some: {
                        deletedAt: null,
                        status: 'COMPLETED',
                        type: {
                          in: ['email_sent', 'email_received', 'email_conversation', 'EMAIL']
                        }
                      }
                    }
                  },
                  {
                    emails: {
                      some: {
                        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    this.log(`Found ${leadsWithEmailEngagement.length} company leads with email engagement`, 'info');

    // Convert each lead to prospect
    for (const lead of leadsWithEmailEngagement) {
      try {
        await prisma.companies.update({
          where: { id: lead.id },
          data: {
            status: 'PROSPECT',
            updatedAt: new Date()
          }
        });
        
        this.stats.companiesConverted++;
        this.log(`  Converted: ${lead.name} (${lead.id})`, 'success');
      } catch (error) {
        this.stats.errors.push({
          type: 'company',
          id: lead.id,
          name: lead.name,
          error: error.message
        });
        this.log(`  Failed to convert ${lead.name}: ${error.message}`, 'error');
      }
    }

    this.log(`✅ Converted ${this.stats.companiesConverted} company leads to prospects`, 'success');
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('CONVERSION SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log(`\n✅ People converted: ${this.stats.peopleConverted}`, 'success');
    this.log(`✅ Companies converted: ${this.stats.companiesConverted}`, 'success');
    
    if (this.stats.errors.length > 0) {
      this.log(`\n⚠️  Errors: ${this.stats.errors.length}`, 'warn');
      this.stats.errors.forEach((error, idx) => {
        this.log(`  ${idx + 1}. ${error.type} ${error.name}: ${error.error}`, 'warn');
      });
    }
  }
}

// Run the fix
if (require.main === module) {
  const fix = new FixLeadsToProspects();
  fix.run().catch(console.error);
}

module.exports = FixLeadsToProspects;

