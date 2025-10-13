#!/usr/bin/env node

/**
 * 🔍 TOP WORKSPACE ENRICHMENT PREREQUISITES AUDIT
 * 
 * Analyzes what data TOP workspace already has that can be used for enrichment
 * and identifies gaps that need to be filled before enrichment can proceed.
 */

const { PrismaClient } = require('@prisma/client');

class TopEnrichmentPrerequisitesAudit {
  constructor() {
    this.prisma = new PrismaClient();
    this.auditResults = {
      workspace: null,
      companies: {
        total: 0,
        withWebsite: 0,
        withDomain: 0,
        withLinkedIn: 0,
        withName: 0,
        enrichmentReady: 0,
        missingPrerequisites: []
      },
      people: {
        total: 0,
        withEmail: 0,
        withWorkEmail: 0,
        withPersonalEmail: 0,
        withLinkedIn: 0,
        withPhone: 0,
        withCompany: 0,
        coresignalReady: 0,
        lushaReady: 0,
        enrichmentReady: 0,
        missingPrerequisites: []
      },
      enrichmentCapability: {
        companiesEnrichable: 0,
        peopleEnrichable: 0,
        totalEnrichmentPotential: 0
      }
    };
  }

  async runAudit() {
    try {
      console.log('🔍 TOP WORKSPACE ENRICHMENT PREREQUISITES AUDIT');
      console.log('===============================================\n');

      await this.prisma.$connect();
      console.log('✅ Connected to database\n');

      // Find TOP workspace
      const workspace = await this.findTopWorkspace();
      if (!workspace) {
        throw new Error('TOP Engineering Plus workspace not found!');
      }

      this.auditResults.workspace = workspace;
      console.log(`📊 Found workspace: ${workspace.name} (${workspace.id})\n`);

      // Audit company prerequisites
      await this.auditCompanyPrerequisites(workspace.id);
      
      // Audit people prerequisites
      await this.auditPeoplePrerequisites(workspace.id);
      
      // Calculate enrichment capability
      this.calculateEnrichmentCapability();
      
      // Generate comprehensive report
      this.generateReport();
      
      console.log('✅ Prerequisites audit completed successfully!');
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findTopWorkspace() {
    console.log('🔍 Finding TOP Engineering Plus workspace...');
    
    const workspace = await this.prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'TOP Engineering Plus', mode: 'insensitive' } },
          { name: { contains: 'TOP', mode: 'insensitive' } }
        ]
      }
    });

    return workspace;
  }

  async auditCompanyPrerequisites(workspaceId) {
    console.log('🏢 Auditing company prerequisites...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        linkedinUrl: true,
        email: true,
        phone: true
      }
    });

    this.auditResults.companies.total = companies.length;
    console.log(`   Total companies: ${companies.length}`);

    // Analyze prerequisites for Coresignal company enrichment
    companies.forEach(company => {
      const hasWebsite = this.isFieldPopulated(company.website);
      const hasDomain = this.isFieldPopulated(company.domain);
      const hasLinkedIn = this.isFieldPopulated(company.linkedinUrl);
      const hasName = this.isFieldPopulated(company.name);

      if (hasWebsite) this.auditResults.companies.withWebsite++;
      if (hasDomain) this.auditResults.companies.withDomain++;
      if (hasLinkedIn) this.auditResults.companies.withLinkedIn++;
      if (hasName) this.auditResults.companies.withName++;

      // Company can be enriched with Coresignal if it has (name + website) OR (name + domain)
      const canEnrich = hasName && (hasWebsite || hasDomain);
      if (canEnrich) {
        this.auditResults.companies.enrichmentReady++;
      } else {
        this.auditResults.companies.missingPrerequisites.push({
          id: company.id,
          name: company.name,
          missing: this.getMissingCompanyPrerequisites(company)
        });
      }
    });

    console.log(`   With website: ${this.auditResults.companies.withWebsite}`);
    console.log(`   With domain: ${this.auditResults.companies.withDomain}`);
    console.log(`   With LinkedIn: ${this.auditResults.companies.withLinkedIn}`);
    console.log(`   Enrichment ready: ${this.auditResults.companies.enrichmentReady}`);
    console.log(`   Missing prerequisites: ${this.auditResults.companies.missingPrerequisites.length}\n`);
  }

  async auditPeoplePrerequisites(workspaceId) {
    console.log('👥 Auditing people prerequisites...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        linkedinUrl: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        companyId: true,
        company: {
          select: {
            name: true,
            domain: true,
            website: true
          }
        }
      }
    });

    this.auditResults.people.total = people.length;
    console.log(`   Total people: ${people.length}`);

    people.forEach(person => {
      const hasEmail = this.isFieldPopulated(person.email);
      const hasWorkEmail = this.isFieldPopulated(person.workEmail);
      const hasPersonalEmail = this.isFieldPopulated(person.personalEmail);
      const hasLinkedIn = this.isFieldPopulated(person.linkedinUrl);
      const hasPhone = this.isFieldPopulated(person.phone) || this.isFieldPopulated(person.mobilePhone) || this.isFieldPopulated(person.workPhone);
      const hasCompany = person.companyId && person.company;

      if (hasEmail) this.auditResults.people.withEmail++;
      if (hasWorkEmail) this.auditResults.people.withWorkEmail++;
      if (hasPersonalEmail) this.auditResults.people.withPersonalEmail++;
      if (hasLinkedIn) this.auditResults.people.withLinkedIn++;
      if (hasPhone) this.auditResults.people.withPhone++;
      if (hasCompany) this.auditResults.people.withCompany++;

      // Coresignal person enrichment requires: email OR LinkedIn URL
      const coresignalReady = hasEmail || hasWorkEmail || hasPersonalEmail || hasLinkedIn;
      if (coresignalReady) this.auditResults.people.coresignalReady++;

      // Lusha person enrichment requires: firstName + lastName + (companyName OR companyDomain OR linkedinUrl)
      const hasFirstName = this.isFieldPopulated(person.firstName);
      const hasLastName = this.isFieldPopulated(person.lastName);
      const hasCompanyName = hasCompany && this.isFieldPopulated(person.company.name);
      const hasCompanyDomain = hasCompany && (this.isFieldPopulated(person.company.domain) || this.isFieldPopulated(person.company.website));
      
      const lushaReady = hasFirstName && hasLastName && (hasCompanyName || hasCompanyDomain || hasLinkedIn);
      if (lushaReady) this.auditResults.people.lushaReady++;

      // Person can be enriched if they can use Coresignal OR Lusha
      const canEnrich = coresignalReady || lushaReady;
      if (canEnrich) {
        this.auditResults.people.enrichmentReady++;
      } else {
        this.auditResults.people.missingPrerequisites.push({
          id: person.id,
          fullName: person.fullName,
          missing: this.getMissingPeoplePrerequisites(person)
        });
      }
    });

    console.log(`   With email: ${this.auditResults.people.withEmail}`);
    console.log(`   With work email: ${this.auditResults.people.withWorkEmail}`);
    console.log(`   With LinkedIn: ${this.auditResults.people.withLinkedIn}`);
    console.log(`   With company: ${this.auditResults.people.withCompany}`);
    console.log(`   Coresignal ready: ${this.auditResults.people.coresignalReady}`);
    console.log(`   Lusha ready: ${this.auditResults.people.lushaReady}`);
    console.log(`   Enrichment ready: ${this.auditResults.people.enrichmentReady}`);
    console.log(`   Missing prerequisites: ${this.auditResults.people.missingPrerequisites.length}\n`);
  }

  getMissingCompanyPrerequisites(company) {
    const missing = [];
    if (!this.isFieldPopulated(company.name)) missing.push('name');
    if (!this.isFieldPopulated(company.website) && !this.isFieldPopulated(company.domain)) {
      missing.push('website or domain');
    }
    return missing;
  }

  getMissingPeoplePrerequisites(person) {
    const missing = [];
    const hasEmail = this.isFieldPopulated(person.email) || this.isFieldPopulated(person.workEmail) || this.isFieldPopulated(person.personalEmail);
    const hasLinkedIn = this.isFieldPopulated(person.linkedinUrl);
    const hasFirstName = this.isFieldPopulated(person.firstName);
    const hasLastName = this.isFieldPopulated(person.lastName);
    const hasCompany = person.companyId && person.company;
    const hasCompanyName = hasCompany && this.isFieldPopulated(person.company.name);
    const hasCompanyDomain = hasCompany && (this.isFieldPopulated(person.company.domain) || this.isFieldPopulated(person.company.website));

    // Check Coresignal prerequisites
    if (!hasEmail && !hasLinkedIn) {
      missing.push('email or LinkedIn URL (for Coresignal)');
    }

    // Check Lusha prerequisites
    if (!hasFirstName) missing.push('firstName');
    if (!hasLastName) missing.push('lastName');
    if (!hasCompanyName && !hasCompanyDomain && !hasLinkedIn) {
      missing.push('company name/domain or LinkedIn URL (for Lusha)');
    }

    return missing;
  }

  calculateEnrichmentCapability() {
    console.log('📊 Calculating enrichment capability...');
    
    this.auditResults.enrichmentCapability.companiesEnrichable = this.auditResults.companies.enrichmentReady;
    this.auditResults.enrichmentCapability.peopleEnrichable = this.auditResults.people.enrichmentReady;
    this.auditResults.enrichmentCapability.totalEnrichmentPotential = 
      this.auditResults.enrichmentCapability.companiesEnrichable + 
      this.auditResults.enrichmentCapability.peopleEnrichable;

    console.log(`   Companies enrichable: ${this.auditResults.enrichmentCapability.companiesEnrichable}`);
    console.log(`   People enrichable: ${this.auditResults.enrichmentCapability.peopleEnrichable}`);
    console.log(`   Total enrichment potential: ${this.auditResults.enrichmentCapability.totalEnrichmentPotential}\n`);
  }

  isFieldPopulated(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'boolean') return true;
    return false;
  }

  generateReport() {
    console.log('\n📊 ENRICHMENT PREREQUISITES AUDIT REPORT');
    console.log('==========================================\n');

    // Workspace info
    console.log('🏢 WORKSPACE:');
    console.log(`   Name: ${this.auditResults.workspace.name}`);
    console.log(`   ID: ${this.auditResults.workspace.id}\n`);

    // Company analysis
    console.log('🏢 COMPANY ENRICHMENT READINESS:');
    const companies = this.auditResults.companies;
    console.log(`   Total Companies: ${companies.total}`);
    console.log(`   With Website: ${companies.withWebsite} (${(companies.withWebsite/companies.total*100).toFixed(1)}%)`);
    console.log(`   With Domain: ${companies.withDomain} (${(companies.withDomain/companies.total*100).toFixed(1)}%)`);
    console.log(`   With LinkedIn: ${companies.withLinkedIn} (${(companies.withLinkedIn/companies.total*100).toFixed(1)}%)`);
    console.log(`   ✅ Enrichment Ready: ${companies.enrichmentReady} (${(companies.enrichmentReady/companies.total*100).toFixed(1)}%)`);
    console.log(`   ❌ Missing Prerequisites: ${companies.missingPrerequisites.length} (${(companies.missingPrerequisites.length/companies.total*100).toFixed(1)}%)\n`);

    // People analysis
    console.log('👥 PEOPLE ENRICHMENT READINESS:');
    const people = this.auditResults.people;
    console.log(`   Total People: ${people.total}`);
    console.log(`   With Email: ${people.withEmail} (${(people.withEmail/people.total*100).toFixed(1)}%)`);
    console.log(`   With Work Email: ${people.withWorkEmail} (${(people.withWorkEmail/people.total*100).toFixed(1)}%)`);
    console.log(`   With LinkedIn: ${people.withLinkedIn} (${(people.withLinkedIn/people.total*100).toFixed(1)}%)`);
    console.log(`   With Company: ${people.withCompany} (${(people.withCompany/people.total*100).toFixed(1)}%)`);
    console.log(`   ✅ Coresignal Ready: ${people.coresignalReady} (${(people.coresignalReady/people.total*100).toFixed(1)}%)`);
    console.log(`   ✅ Lusha Ready: ${people.lushaReady} (${(people.lushaReady/people.total*100).toFixed(1)}%)`);
    console.log(`   ✅ Enrichment Ready: ${people.enrichmentReady} (${(people.enrichmentReady/people.total*100).toFixed(1)}%)`);
    console.log(`   ❌ Missing Prerequisites: ${people.missingPrerequisites.length} (${(people.missingPrerequisites.length/people.total*100).toFixed(1)}%)\n`);

    // Overall capability
    console.log('🎯 OVERALL ENRICHMENT CAPABILITY:');
    const capability = this.auditResults.enrichmentCapability;
    console.log(`   Companies Enrichable: ${capability.companiesEnrichable}`);
    console.log(`   People Enrichable: ${capability.peopleEnrichable}`);
    console.log(`   Total Enrichment Potential: ${capability.totalEnrichmentPotential}\n`);

    // Show sample missing prerequisites
    if (companies.missingPrerequisites.length > 0) {
      console.log('🚨 SAMPLE COMPANIES MISSING PREREQUISITES:');
      companies.missingPrerequisites.slice(0, 5).forEach(company => {
        console.log(`   ${company.name}: Missing ${company.missing.join(', ')}`);
      });
      console.log('');
    }

    if (people.missingPrerequisites.length > 0) {
      console.log('🚨 SAMPLE PEOPLE MISSING PREREQUISITES:');
      people.missingPrerequisites.slice(0, 5).forEach(person => {
        console.log(`   ${person.fullName}: Missing ${person.missing.join(', ')}`);
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (companies.enrichmentReady > 0) {
      console.log(`✅ ${companies.enrichmentReady} companies can be enriched with Coresignal immediately`);
    }
    
    if (people.coresignalReady > 0) {
      console.log(`✅ ${people.coresignalReady} people can be enriched with Coresignal immediately`);
    }
    
    if (people.lushaReady > 0) {
      console.log(`✅ ${people.lushaReady} people can be enriched with Lusha immediately`);
    }
    
    if (companies.missingPrerequisites.length > 0) {
      console.log(`🔍 ${companies.missingPrerequisites.length} companies need prerequisite data before enrichment`);
    }
    
    if (people.missingPrerequisites.length > 0) {
      console.log(`🔍 ${people.missingPrerequisites.length} people need prerequisite data before enrichment`);
    }

    // Save detailed report
    const fs = require('fs');
    const reportPath = 'top-enrichment-prerequisites-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the audit
async function main() {
  const audit = new TopEnrichmentPrerequisitesAudit();
  await audit.runAudit();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TopEnrichmentPrerequisitesAudit;
