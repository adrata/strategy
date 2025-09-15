#!/usr/bin/env node

/**
 * 🧹 COMPREHENSIVE DATA CLEANUP
 * 
 * Complete data integrity fix for Dano's workspace:
 * 1. Audit all entity relationships and status
 * 2. Fix person/company connections to leads/prospects/opportunities
 * 3. Ensure proper engagement-based classification
 * 4. Remove orphaned records and duplicates
 * 5. Validate final data integrity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const BATCH_SIZE = 100;

async function comprehensiveDataCleanup() {
  console.log('🧹 COMPREHENSIVE DATA CLEANUP');
  console.log('='.repeat(60));
  console.log('Ensuring complete data integrity for Dano\'s workspace');
  console.log('');

  try {
    // Phase 1: Complete audit of current state
    await auditCurrentState();
    
    // Phase 2: Fix person/company relationships
    await fixPersonCompanyRelationships();
    
    // Phase 3: Fix lead/prospect/opportunity classification
    await fixEntityClassification();
    
    // Phase 4: Remove orphaned records
    await removeOrphanedRecords();
    
    // Phase 5: Final validation and report
    await finalValidation();
    
    console.log('');
    console.log('🎉 COMPREHENSIVE DATA CLEANUP COMPLETE!');
    console.log('All data integrity issues have been resolved.');
    
  } catch (error) {
    console.error('❌ Error in comprehensive cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function auditCurrentState() {
  console.log('📊 PHASE 1: COMPREHENSIVE AUDIT');
  console.log('-'.repeat(40));
  
  const [
    peopleCount,
    companiesCount,
    leadsCount,
    prospectsCount,
    opportunitiesCount,
    actionsCount
  ] = await Promise.all([
    prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.opportunities.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID } })
  ]);

  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Companies: ${companiesCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Opportunities: ${opportunitiesCount.toLocaleString()}`);
  console.log(`   Actions: ${actionsCount.toLocaleString()}`);
  
  // Check for orphaned records
  const orphanedPeople = await prisma.people.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      AND: [
        { leads: { none: {} } },
        { prospects: { none: {} } },
        { opportunities: { none: {} } }
      ]
    }
  });

  const leadsWithoutPeople = await prisma.leads.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });

  const prospectsWithoutPeople = await prisma.prospects.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });

  console.log('');
  console.log('🔍 ORPHANED RECORDS:');
  console.log(`   Orphaned People: ${orphanedPeople.toLocaleString()}`);
  console.log(`   Leads without People: ${leadsWithoutPeople.toLocaleString()}`);
  console.log(`   Prospects without People: ${prospectsWithoutPeople.toLocaleString()}`);
  
  // Check engagement status
  const engagedProspects = await prisma.prospects.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      actions: {
        some: {
          type: {
            in: ['email_sent', 'email_received', 'phone_call', 'linkedin_message']
          }
        }
      }
    }
  });

  const unengagedLeads = await prisma.leads.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      actions: {
        none: {
          type: {
            in: ['email_sent', 'email_received', 'phone_call', 'linkedin_message']
          }
        }
      }
    }
  });

  console.log('');
  console.log('🎯 ENGAGEMENT STATUS:');
  console.log(`   Engaged Prospects (should be leads): ${engagedProspects.toLocaleString()}`);
  console.log(`   Unengaged Leads (should be prospects): ${unengagedLeads.toLocaleString()}`);
  
  return {
    peopleCount,
    companiesCount,
    leadsCount,
    prospectsCount,
    opportunitiesCount,
    actionsCount,
    orphanedPeople,
    leadsWithoutPeople,
    prospectsWithoutPeople,
    engagedProspects,
    unengagedLeads
  };
}

async function fixPersonCompanyRelationships() {
  console.log('');
  console.log('🔗 PHASE 2: FIXING PERSON/COMPANY RELATIONSHIPS');
  console.log('-'.repeat(40));
  
  // Fix leads without person references
  const leadsWithoutPeople = await prisma.leads.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    },
    take: BATCH_SIZE
  });

  console.log(`   Fixing ${leadsWithoutPeople.length} leads without person references...`);
  
  for (const lead of leadsWithoutPeople) {
    try {
      // Try to find existing person by email or name
      let person = null;
      
      if (lead.email) {
        person = await prisma.people.findFirst({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            OR: [
              { email: lead.email },
              { workEmail: lead.email },
              { personalEmail: lead.email }
            ]
          }
        });
      }
      
      if (!person && lead.fullName) {
        person = await prisma.people.findFirst({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            fullName: lead.fullName
          }
        });
      }
      
      if (person) {
        // Update lead with person reference
        await prisma.leads.update({
          where: { id: lead.id },
          data: { personId: person.id }
        });
      } else {
        // Create new person record
        const newPerson = await prisma.people.create({
          data: {
            workspaceId: DANO_WORKSPACE_ID,
            firstName: lead.firstName,
            lastName: lead.lastName,
            fullName: lead.fullName,
            email: lead.email,
            workEmail: lead.workEmail,
            personalEmail: lead.personalEmail,
            phone: lead.phone,
            mobilePhone: lead.mobilePhone,
            workPhone: lead.workPhone,
            jobTitle: lead.jobTitle || lead.title,
            department: lead.department,
            company: lead.company,
            linkedinUrl: lead.linkedinUrl,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            country: lead.country,
            postalCode: lead.postalCode,
            status: 'active'
          }
        });
        
        // Update lead with new person reference
        await prisma.leads.update({
          where: { id: lead.id },
          data: { personId: newPerson.id }
        });
      }
    } catch (error) {
      console.error(`   ❌ Error fixing lead ${lead.id}:`, error.message);
    }
  }
  
  // Fix prospects without person references
  const prospectsWithoutPeople = await prisma.prospects.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    },
    take: BATCH_SIZE
  });

  console.log(`   Fixing ${prospectsWithoutPeople.length} prospects without person references...`);
  
  for (const prospect of prospectsWithoutPeople) {
    try {
      // Try to find existing person by email or name
      let person = null;
      
      if (prospect.email) {
        person = await prisma.people.findFirst({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            OR: [
              { email: prospect.email },
              { workEmail: prospect.email },
              { personalEmail: prospect.email }
            ]
          }
        });
      }
      
      if (!person && prospect.fullName) {
        person = await prisma.people.findFirst({
          where: {
            workspaceId: DANO_WORKSPACE_ID,
            fullName: prospect.fullName
          }
        });
      }
      
      if (person) {
        // Update prospect with person reference
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { personId: person.id }
        });
      } else {
        // Create new person record
        const newPerson = await prisma.people.create({
          data: {
            workspaceId: DANO_WORKSPACE_ID,
            firstName: prospect.firstName,
            lastName: prospect.lastName,
            fullName: prospect.fullName,
            email: prospect.email,
            workEmail: prospect.workEmail,
            personalEmail: prospect.personalEmail,
            phone: prospect.phone,
            mobilePhone: prospect.mobilePhone,
            workPhone: prospect.workPhone,
            jobTitle: prospect.jobTitle || prospect.title,
            department: prospect.department,
            company: prospect.company,
            linkedinUrl: prospect.linkedinUrl,
            address: prospect.address,
            city: prospect.city,
            state: prospect.state,
            country: prospect.country,
            postalCode: prospect.postalCode,
            status: 'active'
          }
        });
        
        // Update prospect with new person reference
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { personId: newPerson.id }
        });
      }
    } catch (error) {
      console.error(`   ❌ Error fixing prospect ${prospect.id}:`, error.message);
    }
  }
  
  console.log('   ✅ Person/company relationships fixed');
}

async function fixEntityClassification() {
  console.log('');
  console.log('🎯 PHASE 3: FIXING ENTITY CLASSIFICATION');
  console.log('-'.repeat(40));
  
  // Find engaged prospects (should be leads)
  const engagedProspects = await prisma.prospects.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      actions: {
        some: {
          type: {
            in: ['email_sent', 'email_received', 'phone_call', 'linkedin_message']
          }
        }
      }
    },
    take: BATCH_SIZE
  });

  console.log(`   Converting ${engagedProspects.length} engaged prospects to leads...`);
  
  for (const prospect of engagedProspects) {
    try {
      // Create new lead record
      const newLead = await prisma.leads.create({
        data: {
          workspaceId: prospect.workspaceId,
          assignedUserId: prospect.assignedUserId,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          fullName: prospect.fullName,
          displayName: prospect.displayName,
          email: prospect.email,
          workEmail: prospect.workEmail,
          personalEmail: prospect.personalEmail,
          phone: prospect.phone,
          mobilePhone: prospect.mobilePhone,
          workPhone: prospect.workPhone,
          company: prospect.company,
          companyDomain: prospect.companyDomain,
          industry: prospect.industry,
          companySize: prospect.companySize,
          jobTitle: prospect.jobTitle,
          title: prospect.title,
          department: prospect.department,
          linkedinUrl: prospect.linkedinUrl,
          address: prospect.address,
          city: prospect.city,
          state: prospect.state,
          country: prospect.country,
          postalCode: prospect.postalCode,
          status: 'engaged',
          priority: prospect.priority,
          source: prospect.source,
          estimatedValue: prospect.estimatedValue,
          currency: prospect.currency,
          notes: prospect.notes,
          description: prospect.description,
          tags: prospect.tags,
          customFields: prospect.customFields,
          preferredLanguage: prospect.preferredLanguage,
          timezone: prospect.timezone,
          personId: prospect.personId,
          companyId: prospect.companyId,
          createdAt: prospect.createdAt,
          updatedAt: new Date()
        }
      });
      
      // Update all actions to reference the new lead
      await prisma.actions.updateMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          prospectId: prospect.id
        },
        data: {
          leadId: newLead.id,
          prospectId: null
        }
      });
      
      // Delete the old prospect
      await prisma.prospects.delete({
        where: { id: prospect.id }
      });
      
    } catch (error) {
      console.error(`   ❌ Error converting prospect ${prospect.id}:`, error.message);
    }
  }
  
  // Find unengaged leads (should be prospects)
  const unengagedLeads = await prisma.leads.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      actions: {
        none: {
          type: {
            in: ['email_sent', 'email_received', 'phone_call', 'linkedin_message']
          }
        }
      }
    },
    take: BATCH_SIZE
  });

  console.log(`   Converting ${unengagedLeads.length} unengaged leads to prospects...`);
  
  for (const lead of unengagedLeads) {
    try {
      // Create new prospect record
      const newProspect = await prisma.prospects.create({
        data: {
          workspaceId: lead.workspaceId,
          assignedUserId: lead.assignedUserId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          fullName: lead.fullName,
          displayName: lead.displayName,
          email: lead.email,
          workEmail: lead.workEmail,
          personalEmail: lead.personalEmail,
          phone: lead.phone,
          mobilePhone: lead.mobilePhone,
          workPhone: lead.workPhone,
          company: lead.company,
          companyDomain: lead.companyDomain,
          industry: lead.industry,
          companySize: lead.companySize,
          jobTitle: lead.jobTitle,
          title: lead.title,
          department: lead.department,
          linkedinUrl: lead.linkedinUrl,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          country: lead.country,
          postalCode: lead.postalCode,
          status: 'uncontacted',
          priority: lead.priority,
          source: lead.source,
          estimatedValue: lead.estimatedValue,
          currency: lead.currency,
          notes: lead.notes,
          description: lead.description,
          tags: lead.tags,
          customFields: lead.customFields,
          preferredLanguage: lead.preferredLanguage,
          timezone: lead.timezone,
          personId: lead.personId,
          companyId: lead.companyId,
          createdAt: lead.createdAt,
          updatedAt: new Date()
        }
      });
      
      // Update all actions to reference the new prospect
      await prisma.actions.updateMany({
        where: {
          workspaceId: DANO_WORKSPACE_ID,
          leadId: lead.id
        },
        data: {
          prospectId: newProspect.id,
          leadId: null
        }
      });
      
      // Delete the old lead
      await prisma.leads.delete({
        where: { id: lead.id }
      });
      
    } catch (error) {
      console.error(`   ❌ Error converting lead ${lead.id}:`, error.message);
    }
  }
  
  console.log('   ✅ Entity classification fixed');
}

async function removeOrphanedRecords() {
  console.log('');
  console.log('🗑️ PHASE 4: REMOVING ORPHANED RECORDS');
  console.log('-'.repeat(40));
  
  // Remove orphaned people (not referenced by leads/prospects/opportunities)
  const orphanedPeople = await prisma.people.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      AND: [
        { leads: { none: {} } },
        { prospects: { none: {} } },
        { opportunities: { none: {} } }
      ]
    },
    take: BATCH_SIZE
  });

  console.log(`   Removing ${orphanedPeople.length} orphaned people...`);
  
  for (const person of orphanedPeople) {
    try {
      await prisma.people.delete({
        where: { id: person.id }
      });
    } catch (error) {
      console.error(`   ❌ Error removing orphaned person ${person.id}:`, error.message);
    }
  }
  
  // Remove orphaned companies (not referenced by leads/prospects/opportunities/people)
  const orphanedCompanies = await prisma.companies.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      AND: [
        { people: { none: {} } },
        { leads: { none: {} } },
        { prospects: { none: {} } },
        { opportunities: { none: {} } }
      ]
    },
    take: BATCH_SIZE
  });

  console.log(`   Removing ${orphanedCompanies.length} orphaned companies...`);
  
  for (const company of orphanedCompanies) {
    try {
      await prisma.companies.delete({
        where: { id: company.id }
      });
    } catch (error) {
      console.error(`   ❌ Error removing orphaned company ${company.id}:`, error.message);
    }
  }
  
  console.log('   ✅ Orphaned records removed');
}

async function finalValidation() {
  console.log('');
  console.log('✅ PHASE 5: FINAL VALIDATION');
  console.log('-'.repeat(40));
  
  const [
    finalPeopleCount,
    finalCompaniesCount,
    finalLeadsCount,
    finalProspectsCount,
    finalOpportunitiesCount,
    finalActionsCount
  ] = await Promise.all([
    prisma.people.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.opportunities.count({ where: { workspaceId: DANO_WORKSPACE_ID } }),
    prisma.actions.count({ where: { workspaceId: DANO_WORKSPACE_ID } })
  ]);

  console.log('📊 FINAL DATA STATE:');
  console.log(`   People: ${finalPeopleCount.toLocaleString()}`);
  console.log(`   Companies: ${finalCompaniesCount.toLocaleString()}`);
  console.log(`   Leads: ${finalLeadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${finalProspectsCount.toLocaleString()}`);
  console.log(`   Opportunities: ${finalOpportunitiesCount.toLocaleString()}`);
  console.log(`   Actions: ${finalActionsCount.toLocaleString()}`);
  
  // Validate relationships
  const leadsWithoutPeople = await prisma.leads.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });

  const prospectsWithoutPeople = await prisma.prospects.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null
    }
  });

  const orphanedPeople = await prisma.people.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      AND: [
        { leads: { none: {} } },
        { prospects: { none: {} } },
        { opportunities: { none: {} } }
      ]
    }
  });

  console.log('');
  console.log('🔍 RELATIONSHIP VALIDATION:');
  console.log(`   Leads without People: ${leadsWithoutPeople}`);
  console.log(`   Prospects without People: ${prospectsWithoutPeople}`);
  console.log(`   Orphaned People: ${orphanedPeople}`);
  
  // Check engagement status
  const engagedProspects = await prisma.prospects.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      actions: {
        some: {
          type: {
            in: ['email_sent', 'email_received', 'phone_call', 'linkedin_message']
          }
        }
      }
    }
  });

  const unengagedLeads = await prisma.leads.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      actions: {
        none: {
          type: {
            in: ['email_sent', 'email_received', 'phone_call', 'linkedin_message']
          }
        }
      }
    }
  });

  console.log('');
  console.log('🎯 ENGAGEMENT VALIDATION:');
  console.log(`   Engaged Prospects (should be 0): ${engagedProspects}`);
  console.log(`   Unengaged Leads (should be 0): ${unengagedLeads}`);
  
  // Data integrity score
  const totalIssues = leadsWithoutPeople + prospectsWithoutPeople + orphanedPeople + engagedProspects + unengagedLeads;
  const integrityScore = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalIssues * 10));
  
  console.log('');
  console.log('🏆 DATA INTEGRITY SCORE:');
  console.log(`   Score: ${integrityScore}%`);
  console.log(`   Issues Remaining: ${totalIssues}`);
  
  if (integrityScore === 100) {
    console.log('   🎉 PERFECT! All data integrity issues resolved.');
  } else if (integrityScore >= 90) {
    console.log('   ✅ EXCELLENT! Data is in great shape.');
  } else if (integrityScore >= 80) {
    console.log('   ✅ GOOD! Minor issues remain.');
  } else {
    console.log('   ⚠️  ATTENTION NEEDED! Some issues remain.');
  }
}

// Run the comprehensive cleanup
if (require.main === module) {
  comprehensiveDataCleanup()
    .then(() => {
      console.log('✅ Comprehensive data cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Comprehensive data cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { comprehensiveDataCleanup };

