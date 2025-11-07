#!/usr/bin/env node

/**
 * Fix Buyer Group Mismatches
 * 
 * Removes or reassigns people who are assigned to wrong companies
 * based on audit results
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

class BuyerGroupFixer {
  constructor(workspaceId, workspaceName) {
    this.prisma = new PrismaClient();
    this.workspaceId = workspaceId;
    this.workspaceName = workspaceName;
    this.fixed = [];
    this.removed = [];
    this.reassigned = [];
    this.errors = [];
  }

  async fix() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔧 Fixing Buyer Group Mismatches - ${this.workspaceName}`);
    console.log('='.repeat(70));

    // Get all companies with buyer groups
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        people: {
          some: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      },
      include: {
        people: {
          where: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      }
    });

    console.log(`\n📊 Found ${companies.length} companies with buyer groups`);

    for (const company of companies) {
      console.log(`\n🔍 Checking: ${company.name}`);
      
      for (const person of company.people) {
        const validation = await this.validatePersonCompany(person, company);
        if (!validation.isValid) {
          console.log(`   ❌ ${person.fullName || person.firstName}: ${validation.reason}`);
          
          // Try to find correct company
          const correctCompany = await this.findCorrectCompany(person, company);
          
          if (correctCompany) {
            // Reassign to correct company
            await this.reassignPerson(person, company, correctCompany, validation.reason);
          } else {
            // Remove from buyer group (can't find correct company)
            await this.removeFromBuyerGroup(person, company, validation.reason);
          }
        } else {
          console.log(`   ✅ ${person.fullName || person.firstName}: Valid`);
        }
      }
    }

    this.printReport();
    await this.prisma.$disconnect();
  }

  async validatePersonCompany(person, company) {
    // Check 1: Company ID match
    if (person.companyId !== company.id) {
      return {
        isValid: false,
        reason: `Company ID mismatch: person.companyId=${person.companyId}, company.id=${company.id}`,
        severity: 'HIGH'
      };
    }

    // Check 2: Coresignal data validation
    const coresignalData = person.coresignalData || {};
    const experience = coresignalData.experience || [];
    const currentExperience = experience.find(exp => exp.active_experience === 1) || experience[0] || {};

    if (currentExperience && currentExperience.company_name) {
      const employeeCompanyName = (currentExperience.company_name || '').toLowerCase();
      const targetCompanyName = (company.name || '').toLowerCase();

      // Normalize for comparison
      const normalize = (name) => {
        return name
          .toLowerCase()
          .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();
      };

      const normalizedEmployee = normalize(employeeCompanyName);
      const normalizedTarget = normalize(targetCompanyName);

      // Check name match
      if (normalizedEmployee !== normalizedTarget && 
          !normalizedEmployee.includes(normalizedTarget) && 
          !normalizedTarget.includes(normalizedEmployee)) {
        
        // Check LinkedIn URL match
        const employeeLinkedIn = (currentExperience.company_linkedin_url || '').toLowerCase();
        const companyLinkedIn = (company.linkedinUrl || '').toLowerCase();
        
        if (employeeLinkedIn && companyLinkedIn) {
          const normalizeLinkedIn = (url) => {
            const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
            return match ? match[1].replace(/-(com|inc|llc|ltd|corp)$/i, '').toLowerCase() : url.toLowerCase();
          };
          
          if (normalizeLinkedIn(employeeLinkedIn) !== normalizeLinkedIn(companyLinkedIn)) {
            return {
              isValid: false,
              reason: `Company name mismatch: Employee at "${currentExperience.company_name}" but assigned to "${company.name}"`,
              severity: 'HIGH'
            };
          }
        } else {
          return {
            isValid: false,
            reason: `Company name mismatch (no LinkedIn to verify): Employee at "${currentExperience.company_name}" but assigned to "${company.name}"`,
            severity: 'MEDIUM'
          };
        }
      }
    }

    return { isValid: true, reason: 'All validations passed' };
  }

  async findCorrectCompany(person, currentCompany) {
    const coresignalData = person.coresignalData || {};
    const experience = coresignalData.experience || [];
    const currentExperience = experience.find(exp => exp.active_experience === 1) || experience[0] || {};

    if (!currentExperience || !currentExperience.company_name) {
      return null;
    }

    const employeeCompanyName = currentExperience.company_name;
    const employeeLinkedIn = currentExperience.company_linkedin_url;
    const employeeWebsite = currentExperience.company_website;

    // Normalize company name for better matching
    const normalize = (name) => {
      return name
        .toLowerCase()
        .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };

    const normalizedEmployeeName = normalize(employeeCompanyName);

    // Try to find company by name (exact match first, then contains)
    let correctCompany = await this.prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        name: {
          equals: employeeCompanyName,
          mode: 'insensitive'
        }
      }
    });

    // Try contains match
    if (!correctCompany) {
      correctCompany = await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          name: {
            contains: employeeCompanyName,
            mode: 'insensitive'
          }
        }
      });
    }

    // Try normalized name match (fuzzy)
    if (!correctCompany) {
      const allCompanies = await this.prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          name: true
        }
      });

      for (const comp of allCompanies) {
        const normalizedCompName = normalize(comp.name);
        if (normalizedCompName === normalizedEmployeeName || 
            normalizedCompName.includes(normalizedEmployeeName) ||
            normalizedEmployeeName.includes(normalizedCompName)) {
          correctCompany = comp;
          break;
        }
      }
    }

    // Try by LinkedIn URL
    if (!correctCompany && employeeLinkedIn) {
      const linkedinId = employeeLinkedIn.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
      if (linkedinId) {
        const normalizedLinkedInId = linkedinId.replace(/-(com|inc|llc|ltd|corp)$/i, '');
        
        const companies = await this.prisma.companies.findMany({
          where: {
            workspaceId: this.workspaceId,
            deletedAt: null,
            linkedinUrl: { not: null }
          },
          select: {
            id: true,
            name: true,
            linkedinUrl: true
          }
        });

        for (const comp of companies) {
          if (comp.linkedinUrl) {
            const compLinkedInId = comp.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
            if (compLinkedInId) {
              const normalizedCompLinkedInId = compLinkedInId.replace(/-(com|inc|llc|ltd|corp)$/i, '');
              if (normalizedCompLinkedInId === normalizedLinkedInId) {
                correctCompany = comp;
                break;
              }
            }
          }
        }
      }
    }

    // Try by website domain
    if (!correctCompany && employeeWebsite) {
      const domain = employeeWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      correctCompany = await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          OR: [
            { website: { contains: domain } },
            { domain: domain }
          ]
        }
      });
    }

    // Don't return the same company
    if (correctCompany && correctCompany.id === currentCompany.id) {
      return null; // Can't reassign to same company
    }

    return correctCompany;
  }

  async reassignPerson(person, oldCompany, newCompany, reason) {
    try {
      console.log(`   🔄 Reassigning ${person.fullName || person.firstName} from "${oldCompany.name}" to "${newCompany.name}"`);
      
      await this.prisma.people.update({
        where: { id: person.id },
        data: {
          companyId: newCompany.id,
          // Keep buyer group status - they're still in a buyer group, just different company
        }
      });

      this.reassigned.push({
        person: person.fullName || `${person.firstName} ${person.lastName}`,
        personId: person.id,
        oldCompany: oldCompany.name,
        oldCompanyId: oldCompany.id,
        newCompany: newCompany.name,
        newCompanyId: newCompany.id,
        reason: reason
      });

      this.fixed.push({
        type: 'reassigned',
        person: person.fullName || `${person.firstName} ${person.lastName}`,
        from: oldCompany.name,
        to: newCompany.name
      });

    } catch (error) {
      console.error(`   ❌ Failed to reassign ${person.fullName}: ${error.message}`);
      this.errors.push({
        person: person.fullName || `${person.firstName} ${person.lastName}`,
        personId: person.id,
        error: error.message
      });
    }
  }

  async removeFromBuyerGroup(person, company, reason) {
    try {
      console.log(`   🗑️  Removing ${person.fullName || person.firstName} from buyer group (can't find correct company)`);
      
      await this.prisma.people.update({
        where: { id: person.id },
        data: {
          isBuyerGroupMember: false,
          buyerGroupRole: null,
          buyerGroupOptimized: false,
          // Keep companyId - they might still be at this company, just not in buyer group
        }
      });

      this.removed.push({
        person: person.fullName || `${person.firstName} ${person.lastName}`,
        personId: person.id,
        company: company.name,
        companyId: company.id,
        reason: reason
      });

      this.fixed.push({
        type: 'removed',
        person: person.fullName || `${person.firstName} ${person.lastName}`,
        from: company.name
      });

    } catch (error) {
      console.error(`   ❌ Failed to remove ${person.fullName}: ${error.message}`);
      this.errors.push({
        person: person.fullName || `${person.firstName} ${person.lastName}`,
        personId: person.id,
        error: error.message
      });
    }
  }

  printReport() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 FIX REPORT`);
    console.log('='.repeat(70));

    console.log(`\n✅ Fixed: ${this.fixed.length} issues`);
    
    if (this.reassigned.length > 0) {
      console.log(`\n🔄 Reassigned (${this.reassigned.length}):`);
      this.reassigned.forEach(item => {
        console.log(`   - ${item.person}`);
        console.log(`     From: ${item.oldCompany}`);
        console.log(`     To: ${item.newCompany}`);
        console.log(`     Reason: ${item.reason}`);
      });
    }

    if (this.removed.length > 0) {
      console.log(`\n🗑️  Removed from buyer group (${this.removed.length}):`);
      this.removed.forEach(item => {
        console.log(`   - ${item.person} (from ${item.company})`);
        console.log(`     Reason: ${item.reason}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach(item => {
        console.log(`   - ${item.person}: ${item.error}`);
      });
    }

    // Save report to file
    const fs = require('fs');
    const report = {
      workspace: this.workspaceName,
      timestamp: new Date().toISOString(),
      fixed: this.fixed,
      reassigned: this.reassigned,
      removed: this.removed,
      errors: this.errors
    };
    
    const reportPath = `/tmp/buyer-group-fix-${this.workspaceId}-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    console.log(`\n✅ Fix complete!\n`);
  }
}

// Run fix
if (require.main === module) {
  const workspaceId = process.argv[2] || ADRATA_WORKSPACE_ID;
  const workspaceName = process.argv[3] || 'Adrata';
  
  // Confirm before running
  console.log(`\n⚠️  This will fix buyer group mismatches in ${workspaceName} workspace.`);
  console.log(`   - People will be reassigned to correct companies if found`);
  console.log(`   - People will be removed from buyer groups if correct company not found`);
  console.log(`\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...`);
  
  setTimeout(async () => {
    const fixer = new BuyerGroupFixer(workspaceId, workspaceName);
    fixer.fix().catch(console.error);
  }, 5000);
}

module.exports = { BuyerGroupFixer };

