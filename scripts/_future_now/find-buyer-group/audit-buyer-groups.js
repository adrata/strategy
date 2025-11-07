#!/usr/bin/env node

/**
 * Audit Buyer Groups - Quality Assurance
 * 
 * Validates that all buyer group members are from the correct companies
 * and flags any mismatches for review
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

class BuyerGroupAuditor {
  constructor(workspaceId, workspaceName) {
    this.prisma = new PrismaClient();
    this.workspaceId = workspaceId;
    this.workspaceName = workspaceName;
    this.issues = [];
  }

  async audit() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Auditing Buyer Groups - ${this.workspaceName}`);
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
      console.log(`\n🔍 Auditing: ${company.name}`);
      console.log(`   Buyer group size: ${company.people.length}`);

      for (const person of company.people) {
        const validation = await this.validatePersonCompany(person, company);
        if (!validation.isValid) {
          this.issues.push({
            company: company.name,
            companyId: company.id,
            person: person.fullName || `${person.firstName} ${person.lastName}`,
            personId: person.id,
            issue: validation.reason,
            severity: validation.severity
          });
          console.log(`   ❌ ${person.fullName || person.firstName}: ${validation.reason}`);
        } else {
          console.log(`   ✅ ${person.fullName || person.firstName}: Valid`);
        }
      }
    }

    this.printReport();
    await this.prisma.$disconnect();
  }

  async validatePersonCompany(person, company) {
    // Check 1: Company ID match (strongest signal)
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
          // No LinkedIn to verify - flag for review
          return {
            isValid: false,
            reason: `Company name mismatch (no LinkedIn to verify): Employee at "${currentExperience.company_name}" but assigned to "${company.name}"`,
            severity: 'MEDIUM'
          };
        }
      }
    }

    // Check 3: Email domain validation
    if (person.email && company.website) {
      const emailDomain = person.email.split('@')[1]?.toLowerCase();
      const companyDomain = company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
      
      if (emailDomain && companyDomain && emailDomain !== companyDomain) {
        // Check if it's a parent domain (e.g., email@subdomain.company.com vs company.com)
        const emailParts = emailDomain.split('.');
        const companyParts = companyDomain.split('.');
        
        if (emailParts.length >= 2 && companyParts.length >= 2) {
          const emailRoot = emailParts.slice(-2).join('.');
          const companyRoot = companyParts.slice(-2).join('.');
          
          if (emailRoot !== companyRoot) {
            return {
              isValid: false,
              reason: `Email domain mismatch: ${emailDomain} vs ${companyDomain}`,
              severity: 'MEDIUM'
            };
          }
        }
      }
    }

    return { isValid: true, reason: 'All validations passed' };
  }

  printReport() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 AUDIT REPORT`);
    console.log('='.repeat(70));

    if (this.issues.length === 0) {
      console.log(`\n✅ All buyer group members validated successfully!`);
      return;
    }

    console.log(`\n⚠️ Found ${this.issues.length} issues:`);

    const bySeverity = {
      HIGH: this.issues.filter(i => i.severity === 'HIGH'),
      MEDIUM: this.issues.filter(i => i.severity === 'MEDIUM'),
      LOW: this.issues.filter(i => i.severity === 'LOW')
    };

    if (bySeverity.HIGH.length > 0) {
      console.log(`\n🔴 HIGH SEVERITY (${bySeverity.HIGH.length}):`);
      bySeverity.HIGH.forEach(issue => {
        console.log(`   - ${issue.company} → ${issue.person}`);
        console.log(`     ${issue.issue}`);
      });
    }

    if (bySeverity.MEDIUM.length > 0) {
      console.log(`\n🟡 MEDIUM SEVERITY (${bySeverity.MEDIUM.length}):`);
      bySeverity.MEDIUM.slice(0, 10).forEach(issue => {
        console.log(`   - ${issue.company} → ${issue.person}`);
        console.log(`     ${issue.issue}`);
      });
      if (bySeverity.MEDIUM.length > 10) {
        console.log(`   ... and ${bySeverity.MEDIUM.length - 10} more`);
      }
    }

    // Save issues to file
    const fs = require('fs');
    const reportPath = `/tmp/buyer-group-audit-${this.workspaceId}-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.issues, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    console.log(`\n✅ Audit complete!\n`);
  }
}

// Run audit
if (require.main === module) {
  const workspaceId = process.argv[2] || ADRATA_WORKSPACE_ID;
  const workspaceName = process.argv[3] || 'Adrata';
  
  const auditor = new BuyerGroupAuditor(workspaceId, workspaceName);
  auditor.audit().catch(console.error);
}

module.exports = { BuyerGroupAuditor };

