/**
 * 🔍 AUDIT: Actions Storage and Prospect Classification for TOP Engineering Plus
 * 
 * This script audits:
 * 1. How actions are stored and linked to people/companies
 * 2. Whether people/companies with email engagement are properly classified as prospects
 * 3. Whether action counts are synced between people and companies
 * 
 * Usage:
 *   node scripts/audit-top-actions-and-prospects.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TopActionsAndProspectsAudit {
  constructor() {
    this.results = {
      actions: {
        total: 0,
        withPersonId: 0,
        withCompanyId: 0,
        withBoth: 0,
        withNeither: 0,
        emailActions: 0,
        emailSent: 0,
        emailReceived: 0,
        emailConversation: 0
      },
      people: {
        total: 0,
        withActions: 0,
        withEmailActions: 0,
        leadsWithEmailEngagement: 0,
        prospectsWithoutEmailEngagement: 0,
        actionCounts: {}
      },
      companies: {
        total: 0,
        withActions: 0,
        withEmailActions: 0,
        actionCounts: {}
      },
      syncIssues: {
        peopleWithActionsButNoCompanyLink: 0,
        companiesWithPeopleActionsButNoDirectActions: 0,
        actionCountMismatches: []
      }
    };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async run() {
    try {
      this.log('TOP ENGINEERING PLUS ACTIONS AND PROSPECTS AUDIT', 'info');
      this.log('='.repeat(60), 'info');
      
      await this.auditActions();
      await this.auditPeople();
      await this.auditCompanies();
      await this.auditSyncIssues();
      await this.auditProspectClassification();
      
      this.printSummary();
    } catch (error) {
      this.log(`Error during audit: ${error.message}`, 'error');
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async auditActions() {
    this.log('\n📋 PHASE 1: AUDITING ACTIONS', 'info');
    
    // Get all actions for TOP Engineering Plus
    const allActions = await prisma.actions.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        type: true,
        personId: true,
        companyId: true,
        status: true
      }
    });

    // Also check email_messages table
    const emailMessages = await prisma.email_messages.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
      },
      select: {
        id: true,
        personId: true,
        companyId: true
      }
    });

    this.log(`Total email_messages: ${emailMessages.length.toLocaleString()}`, 'info');
    const emailsWithPerson = emailMessages.filter(e => e.personId).length;
    const emailsWithCompany = emailMessages.filter(e => e.companyId).length;
    this.log(`  - Linked to people: ${emailsWithPerson.toLocaleString()}`, 'info');
    this.log(`  - Linked to companies: ${emailsWithCompany.toLocaleString()}`, 'info');

    this.results.actions.total = allActions.length;
    this.log(`Total actions: ${allActions.length.toLocaleString()}`, 'info');

    // Categorize actions
    for (const action of allActions) {
      const hasPersonId = !!action.personId;
      const hasCompanyId = !!action.companyId;
      
      if (hasPersonId && hasCompanyId) {
        this.results.actions.withBoth++;
      } else if (hasPersonId) {
        this.results.actions.withPersonId++;
      } else if (hasCompanyId) {
        this.results.actions.withCompanyId++;
      } else {
        this.results.actions.withNeither++;
      }

      // Check email actions (including EMAIL type)
      if (action.type === 'email_sent' || action.type === 'email_received' || action.type === 'email_conversation' || action.type === 'EMAIL') {
        this.results.actions.emailActions++;
        if (action.type === 'email_sent') this.results.actions.emailSent++;
        if (action.type === 'email_received') this.results.actions.emailReceived++;
        if (action.type === 'email_conversation') this.results.actions.emailConversation++;
      }
    }

    this.log(`  Actions with personId only: ${this.results.actions.withPersonId.toLocaleString()}`, 'info');
    this.log(`  Actions with companyId only: ${this.results.actions.withCompanyId.toLocaleString()}`, 'info');
    this.log(`  Actions with both: ${this.results.actions.withBoth.toLocaleString()}`, 'info');
    this.log(`  Actions with neither: ${this.results.actions.withNeither.toLocaleString()}`, 'warn');
    this.log(`  Email actions: ${this.results.actions.emailActions.toLocaleString()}`, 'info');
    this.log(`    - email_sent: ${this.results.actions.emailSent.toLocaleString()}`, 'info');
    this.log(`    - email_received: ${this.results.actions.emailReceived.toLocaleString()}`, 'info');
    this.log(`    - email_conversation: ${this.results.actions.emailConversation.toLocaleString()}`, 'info');
  }

  async auditPeople() {
    this.log('\n👥 PHASE 2: AUDITING PEOPLE', 'info');
    
    // Get all people with action counts
    const people = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        companyId: true,
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED'
              }
            },
            emails: {
              where: {
                workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID
              }
            }
          }
        }
      }
    });

    this.results.people.total = people.length;
    this.log(`Total people: ${people.length.toLocaleString()}`, 'info');

    // Get people with email actions (including EMAIL type)
    const peopleWithEmailActions = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
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
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        companyId: true,
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED',
                type: {
                  in: ['email_sent', 'email_received', 'email_conversation', 'EMAIL']
                }
              }
            },
            emails: true
          }
        }
      }
    });

    this.results.people.withEmailActions = peopleWithEmailActions.length;
    this.log(`People with email engagement: ${peopleWithEmailActions.length.toLocaleString()}`, 'info');
    
    // Show breakdown
    const withEmailActions = peopleWithEmailActions.filter(p => p._count.actions > 0).length;
    const withEmailMessages = peopleWithEmailActions.filter(p => p._count.emails > 0).length;
    this.log(`  - People with EMAIL actions: ${withEmailActions.toLocaleString()}`, 'info');
    this.log(`  - People with email_messages: ${withEmailMessages.toLocaleString()}`, 'info');

    // Check leads with email engagement (should be prospects)
    const leadsWithEmailEngagement = peopleWithEmailActions.filter(p => p.status === 'LEAD');
    this.results.people.leadsWithEmailEngagement = leadsWithEmailEngagement.length;
    
    if (leadsWithEmailEngagement.length > 0) {
      this.log(`⚠️  ISSUE: ${leadsWithEmailEngagement.length.toLocaleString()} LEADS have email engagement but are not prospects!`, 'warn');
      this.log(`   Sample leads with email engagement:`, 'warn');
      leadsWithEmailEngagement.slice(0, 10).forEach((lead, idx) => {
        this.log(`     ${idx + 1}. ${lead.fullName} (${lead.id})`, 'warn');
      });
    }

    // Check prospects without email engagement
    const prospects = people.filter(p => p.status === 'PROSPECT');
    const prospectsWithoutEmail = prospects.filter(p => 
      !peopleWithEmailActions.find(pe => pe.id === p.id)
    );
    this.results.people.prospectsWithoutEmailEngagement = prospectsWithoutEmail.length;
    
    if (prospectsWithoutEmail.length > 0) {
      this.log(`ℹ️  ${prospectsWithoutEmail.length.toLocaleString()} prospects don't have email engagement`, 'info');
    }

    // Count people by action count
    for (const person of people) {
      const count = person._count.actions;
      if (count > 0) {
        this.results.people.withActions++;
      }
      this.results.people.actionCounts[count] = (this.results.people.actionCounts[count] || 0) + 1;
    }

    this.log(`People with actions: ${this.results.people.withActions.toLocaleString()}`, 'info');
  }

  async auditCompanies() {
    this.log('\n🏢 PHASE 3: AUDITING COMPANIES', 'info');
    
    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED'
              }
            },
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    this.results.companies.total = companies.length;
    this.log(`Total companies: ${companies.length.toLocaleString()}`, 'info');

    // Get companies with email actions (direct or via people)
    const companyIds = companies.map(c => c.id);
    
    // Direct company actions
    const companiesWithDirectEmailActions = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
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
      },
      select: {
        id: true,
        name: true
      }
    });

    // Companies with email actions via people
    const companiesWithPeopleEmailActions = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
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
      },
      select: {
        id: true,
        name: true
      }
    });

    const allCompaniesWithEmailActions = new Set([
      ...companiesWithDirectEmailActions.map(c => c.id),
      ...companiesWithPeopleEmailActions.map(c => c.id)
    ]);

    this.results.companies.withEmailActions = allCompaniesWithEmailActions.size;
    this.log(`Companies with email engagement (direct or via people): ${allCompaniesWithEmailActions.size.toLocaleString()}`, 'info');
    this.log(`  - Direct company actions: ${companiesWithDirectEmailActions.length.toLocaleString()}`, 'info');
    this.log(`  - Via people actions: ${companiesWithPeopleEmailActions.length.toLocaleString()}`, 'info');

    // Count companies by action count
    for (const company of companies) {
      const count = company._count.actions;
      if (count > 0) {
        this.results.companies.withActions++;
      }
      this.results.companies.actionCounts[count] = (this.results.companies.actionCounts[count] || 0) + 1;
    }

    this.log(`Companies with direct actions: ${this.results.companies.withActions.toLocaleString()}`, 'info');
  }

  async auditSyncIssues() {
    this.log('\n🔄 PHASE 4: AUDITING SYNC ISSUES', 'info');
    
    // Find people with actions but no company link
    const peopleWithActionsNoCompany = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        companyId: null,
        actions: {
          some: {
            deletedAt: null
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      take: 10
    });

    this.results.syncIssues.peopleWithActionsButNoCompanyLink = peopleWithActionsNoCompany.length;
    
    if (peopleWithActionsNoCompany.length > 0) {
      this.log(`⚠️  ${peopleWithActionsNoCompany.length.toLocaleString()} people have actions but no company link`, 'warn');
    }

    // Find companies where people have actions but company doesn't have direct actions
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED'
              }
            },
            people: {
              where: {
                deletedAt: null,
                actions: {
                  some: {
                    deletedAt: null,
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        }
      }
    });

    const mismatches = [];
    for (const company of companies) {
      const directActionCount = company._count.actions;
      const peopleWithActions = company._count.people;
      
      if (peopleWithActions > 0 && directActionCount === 0) {
        mismatches.push({
          companyId: company.id,
          companyName: company.name,
          directActions: directActionCount,
          peopleWithActions: peopleWithActions
        });
      }
    }

    this.results.syncIssues.companiesWithPeopleActionsButNoDirectActions = mismatches.length;
    this.results.syncIssues.actionCountMismatches = mismatches.slice(0, 20);

    if (mismatches.length > 0) {
      this.log(`⚠️  ${mismatches.length.toLocaleString()} companies have people with actions but no direct company actions`, 'warn');
      this.log(`   Sample mismatches:`, 'warn');
      mismatches.slice(0, 10).forEach((m, idx) => {
        this.log(`     ${idx + 1}. ${m.companyName}: ${m.directActions} direct actions, ${m.peopleWithActions} people with actions`, 'warn');
      });
    }
  }

  async auditProspectClassification() {
    this.log('\n🎯 PHASE 5: AUDITING PROSPECT CLASSIFICATION', 'info');
    
    // Get all people with email engagement (actions or email_messages)
    const peopleWithEmailEngagement = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
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
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    const leadsWithEmail = peopleWithEmailEngagement.filter(p => p.status === 'LEAD');
    const prospectsWithEmail = peopleWithEmailEngagement.filter(p => p.status === 'PROSPECT');

    this.log(`People with email engagement: ${peopleWithEmailEngagement.length.toLocaleString()}`, 'info');
    this.log(`  - Leads: ${leadsWithEmail.length.toLocaleString()} ⚠️  (should be prospects)`, leadsWithEmail.length > 0 ? 'warn' : 'info');
    this.log(`  - Prospects: ${prospectsWithEmail.length.toLocaleString()} ✅`, 'success');

    // Check companies
    const companiesWithEmailEngagement = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
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

    const companiesLeadsWithEmail = companiesWithEmailEngagement.filter(c => c.status === 'LEAD');
    const companiesProspectsWithEmail = companiesWithEmailEngagement.filter(c => c.status === 'PROSPECT');

    this.log(`Companies with email engagement: ${companiesWithEmailEngagement.length.toLocaleString()}`, 'info');
    this.log(`  - Leads: ${companiesLeadsWithEmail.length.toLocaleString()} ⚠️  (should be prospects)`, companiesLeadsWithEmail.length > 0 ? 'warn' : 'info');
    this.log(`  - Prospects: ${companiesProspectsWithEmail.length.toLocaleString()} ✅`, 'success');
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('AUDIT SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log('\n📊 ACTIONS OVERVIEW:', 'info');
    this.log(`  Total actions: ${this.results.actions.total.toLocaleString()}`, 'info');
    this.log(`  Actions with personId only: ${this.results.actions.withPersonId.toLocaleString()}`, 'info');
    this.log(`  Actions with companyId only: ${this.results.actions.withCompanyId.toLocaleString()}`, 'info');
    this.log(`  Actions with both: ${this.results.actions.withBoth.toLocaleString()}`, 'info');
    this.log(`  Actions with neither: ${this.results.actions.withNeither.toLocaleString()}`, this.results.actions.withNeither > 0 ? 'warn' : 'info');
    this.log(`  Email actions: ${this.results.actions.emailActions.toLocaleString()}`, 'info');

    this.log('\n👥 PEOPLE OVERVIEW:', 'info');
    this.log(`  Total people: ${this.results.people.total.toLocaleString()}`, 'info');
    this.log(`  People with actions: ${this.results.people.withActions.toLocaleString()}`, 'info');
    this.log(`  People with email engagement: ${this.results.people.withEmailActions.toLocaleString()}`, 'info');
    this.log(`  Leads with email engagement: ${this.results.people.leadsWithEmailEngagement.toLocaleString()}`, this.results.people.leadsWithEmailEngagement > 0 ? 'warn' : 'info');

    this.log('\n🏢 COMPANIES OVERVIEW:', 'info');
    this.log(`  Total companies: ${this.results.companies.total.toLocaleString()}`, 'info');
    this.log(`  Companies with direct actions: ${this.results.companies.withActions.toLocaleString()}`, 'info');
    this.log(`  Companies with email engagement: ${this.results.companies.withEmailActions.toLocaleString()}`, 'info');

    this.log('\n⚠️  ISSUES FOUND:', 'warn');
    if (this.results.actions.withNeither > 0) {
      this.log(`  - ${this.results.actions.withNeither.toLocaleString()} actions have neither personId nor companyId`, 'warn');
    }
    if (this.results.people.leadsWithEmailEngagement > 0) {
      this.log(`  - ${this.results.people.leadsWithEmailEngagement.toLocaleString()} leads have email engagement but are not prospects`, 'warn');
    }
    if (this.results.syncIssues.companiesWithPeopleActionsButNoDirectActions > 0) {
      this.log(`  - ${this.results.syncIssues.companiesWithPeopleActionsButNoDirectActions.toLocaleString()} companies have people with actions but no direct company actions`, 'warn');
    }
    if (this.results.syncIssues.peopleWithActionsButNoCompanyLink > 0) {
      this.log(`  - ${this.results.syncIssues.peopleWithActionsButNoCompanyLink.toLocaleString()} people have actions but no company link`, 'warn');
    }

    this.log('\n✅ RECOMMENDATIONS:', 'success');
    this.log('  1. Convert leads with email engagement to prospects', 'info');
    this.log('  2. Ensure actions are linked to both personId and companyId when possible', 'info');
    this.log('  3. Sync action counts between people and companies', 'info');
    this.log('  4. Fix orphaned actions (no personId or companyId)', 'info');
  }
}

// Run the audit
if (require.main === module) {
  const audit = new TopActionsAndProspectsAudit();
  audit.run().catch(console.error);
}

module.exports = TopActionsAndProspectsAudit;

