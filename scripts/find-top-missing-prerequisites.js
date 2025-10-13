#!/usr/bin/env node

/**
 * 🔍 TOP WORKSPACE MISSING PREREQUISITES FINDER
 * 
 * Identifies companies and people missing prerequisite data for enrichment
 * and attempts to find missing data via various methods.
 */

const { PrismaClient } = require('@prisma/client');

class TopMissingPrerequisitesFinder {
  constructor() {
    this.prisma = new PrismaClient();
    this.results = {
      workspace: null,
      companies: {
        missingWebsite: [],
        foundWebsite: [],
        stillMissing: []
      },
      people: {
        missingEmail: [],
        missingLinkedIn: [],
        missingName: [],
        foundEmail: [],
        foundLinkedIn: [],
        stillMissing: []
      },
      summary: {
        companiesFixed: 0,
        peopleFixed: 0,
        totalFixed: 0
      }
    };
  }

  async runFinder() {
    try {
      console.log('🔍 TOP WORKSPACE MISSING PREREQUISITES FINDER');
      console.log('==============================================\n');

      await this.prisma.$connect();
      console.log('✅ Connected to database\n');

      // Find TOP workspace
      const workspace = await this.findTopWorkspace();
      if (!workspace) {
        throw new Error('TOP Engineering Plus workspace not found!');
      }

      this.results.workspace = workspace;
      console.log(`📊 Found workspace: ${workspace.name} (${workspace.id})\n`);

      // Find missing company prerequisites
      await this.findMissingCompanyPrerequisites(workspace.id);
      
      // Find missing people prerequisites
      await this.findMissingPeoplePrerequisites(workspace.id);
      
      // Attempt to fill missing data
      await this.attemptToFillMissingData();
      
      // Generate report
      this.generateReport();
      
      console.log('✅ Missing prerequisites finder completed successfully!');
      
    } catch (error) {
      console.error('❌ Finder failed:', error);
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

  async findMissingCompanyPrerequisites(workspaceId) {
    console.log('🏢 Finding companies missing prerequisites...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        OR: [
          { website: null },
          { website: '' },
          { domain: null },
          { domain: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        linkedinUrl: true,
        email: true
      }
    });

    console.log(`   Found ${companies.length} companies missing website/domain`);

    companies.forEach(company => {
      const hasWebsite = this.isFieldPopulated(company.website);
      const hasDomain = this.isFieldPopulated(company.domain);
      
      if (!hasWebsite && !hasDomain) {
        this.results.companies.missingWebsite.push({
          id: company.id,
          name: company.name,
          currentWebsite: company.website,
          currentDomain: company.domain,
          linkedinUrl: company.linkedinUrl,
          email: company.email
        });
      }
    });

    console.log(`   Companies missing website/domain: ${this.results.companies.missingWebsite.length}\n`);
  }

  async findMissingPeoplePrerequisites(workspaceId) {
    console.log('👥 Finding people missing prerequisites...');
    
    // Find people missing email
    const peopleMissingEmail = await this.prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        AND: [
          { OR: [{ email: null }, { email: '' }] },
          { OR: [{ workEmail: null }, { workEmail: '' }] },
          { OR: [{ personalEmail: null }, { personalEmail: '' }] },
          { OR: [{ linkedinUrl: null }, { linkedinUrl: '' }] }
        ]
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
        company: {
          select: {
            name: true,
            domain: true,
            website: true
          }
        }
      }
    });

    // Find people missing LinkedIn
    const peopleMissingLinkedIn = await this.prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        AND: [
          { OR: [{ linkedinUrl: null }, { linkedinUrl: '' }] },
          { OR: [{ email: null }, { email: '' }] },
          { OR: [{ workEmail: null }, { workEmail: '' }] },
          { OR: [{ personalEmail: null }, { personalEmail: '' }] }
        ]
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
        company: {
          select: {
            name: true,
            domain: true,
            website: true
          }
        }
      }
    });

    // Find people missing name components (firstName and lastName are required, so check for empty strings)
    const peopleMissingName = await this.prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        OR: [
          { firstName: '' },
          { lastName: '' }
        ]
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
        company: {
          select: {
            name: true,
            domain: true,
            website: true
          }
        }
      }
    });

    console.log(`   People missing email: ${peopleMissingEmail.length}`);
    console.log(`   People missing LinkedIn: ${peopleMissingLinkedIn.length}`);
    console.log(`   People missing name: ${peopleMissingName.length}`);

    this.results.people.missingEmail = peopleMissingEmail;
    this.results.people.missingLinkedIn = peopleMissingLinkedIn;
    this.results.people.missingName = peopleMissingName;

    console.log('');
  }

  async attemptToFillMissingData() {
    console.log('🔧 Attempting to fill missing data...\n');

    // Try to find missing company websites
    await this.findMissingCompanyWebsites();
    
    // Try to find missing people emails
    await this.findMissingPeopleEmails();
    
    // Try to find missing people LinkedIn URLs
    await this.findMissingPeopleLinkedIn();
    
    // Try to fix missing names
    await this.fixMissingNames();
  }

  async findMissingCompanyWebsites() {
    console.log('🌐 Attempting to find missing company websites...');
    
    for (const company of this.results.companies.missingWebsite) {
      try {
        // Try to extract domain from LinkedIn URL
        if (company.linkedinUrl) {
          const domain = this.extractDomainFromLinkedIn(company.linkedinUrl);
          if (domain) {
            const website = `https://${domain}`;
            await this.updateCompanyWebsite(company.id, website, domain);
            this.results.companies.foundWebsite.push({
              id: company.id,
              name: company.name,
              foundWebsite: website,
              foundDomain: domain,
              source: 'linkedin_url'
            });
            this.results.summary.companiesFixed++;
            console.log(`   ✅ ${company.name}: Found website ${website} from LinkedIn`);
            continue;
          }
        }

        // Try to generate website from company name
        const generatedWebsite = this.generateWebsiteFromName(company.name);
        if (generatedWebsite) {
          await this.updateCompanyWebsite(company.id, generatedWebsite, this.extractDomainFromUrl(generatedWebsite));
          this.results.companies.foundWebsite.push({
            id: company.id,
            name: company.name,
            foundWebsite: generatedWebsite,
            foundDomain: this.extractDomainFromUrl(generatedWebsite),
            source: 'name_generation'
          });
          this.results.summary.companiesFixed++;
          console.log(`   ✅ ${company.name}: Generated website ${generatedWebsite}`);
          continue;
        }

        // Still missing
        this.results.companies.stillMissing.push(company);
        console.log(`   ❌ ${company.name}: Could not find website`);

      } catch (error) {
        console.error(`   ⚠️ Error processing ${company.name}:`, error.message);
        this.results.companies.stillMissing.push(company);
      }
    }

    console.log(`   Companies fixed: ${this.results.summary.companiesFixed}`);
    console.log(`   Companies still missing: ${this.results.companies.stillMissing.length}\n`);
  }

  async findMissingPeopleEmails() {
    console.log('📧 Attempting to find missing people emails...');
    
    for (const person of this.results.people.missingEmail) {
      try {
        // Try to generate email from name and company domain
        if (person.firstName && person.lastName && person.company?.domain) {
          const email = this.generateEmailFromName(person.firstName, person.lastName, person.company.domain);
          if (email) {
            await this.updatePersonEmail(person.id, email);
            this.results.people.foundEmail.push({
              id: person.id,
              fullName: person.fullName,
              foundEmail: email,
              source: 'name_company_generation'
            });
            this.results.summary.peopleFixed++;
            console.log(`   ✅ ${person.fullName}: Generated email ${email}`);
            continue;
          }
        }

        // Still missing
        this.results.people.stillMissing.push({
          ...person,
          missingType: 'email'
        });
        console.log(`   ❌ ${person.fullName}: Could not find email`);

      } catch (error) {
        console.error(`   ⚠️ Error processing ${person.fullName}:`, error.message);
        this.results.people.stillMissing.push({
          ...person,
          missingType: 'email'
        });
      }
    }

    console.log(`   People emails fixed: ${this.results.people.foundEmail.length}\n`);
  }

  async findMissingPeopleLinkedIn() {
    console.log('💼 Attempting to find missing people LinkedIn URLs...');
    
    for (const person of this.results.people.missingLinkedIn) {
      try {
        // Try to generate LinkedIn URL from name
        if (person.firstName && person.lastName) {
          const linkedinUrl = this.generateLinkedInFromName(person.firstName, person.lastName);
          if (linkedinUrl) {
            await this.updatePersonLinkedIn(person.id, linkedinUrl);
            this.results.people.foundLinkedIn.push({
              id: person.id,
              fullName: person.fullName,
              foundLinkedIn: linkedinUrl,
              source: 'name_generation'
            });
            this.results.summary.peopleFixed++;
            console.log(`   ✅ ${person.fullName}: Generated LinkedIn ${linkedinUrl}`);
            continue;
          }
        }

        // Still missing
        this.results.people.stillMissing.push({
          ...person,
          missingType: 'linkedin'
        });
        console.log(`   ❌ ${person.fullName}: Could not find LinkedIn`);

      } catch (error) {
        console.error(`   ⚠️ Error processing ${person.fullName}:`, error.message);
        this.results.people.stillMissing.push({
          ...person,
          missingType: 'linkedin'
        });
      }
    }

    console.log(`   People LinkedIn fixed: ${this.results.people.foundLinkedIn.length}\n`);
  }

  async fixMissingNames() {
    console.log('👤 Attempting to fix missing names...');
    
    for (const person of this.results.people.missingName) {
      try {
        let updated = false;

        // Try to extract first/last name from fullName
        if (person.fullName && (!person.firstName || !person.lastName)) {
          const nameParts = this.parseFullName(person.fullName);
          if (nameParts.firstName && nameParts.lastName) {
            await this.updatePersonNames(person.id, nameParts.firstName, nameParts.lastName);
            updated = true;
            console.log(`   ✅ ${person.fullName}: Fixed names from fullName`);
          }
        }

        if (!updated) {
          console.log(`   ❌ ${person.fullName}: Could not fix names`);
        }

      } catch (error) {
        console.error(`   ⚠️ Error processing ${person.fullName}:`, error.message);
      }
    }

    console.log('');
  }

  // Helper methods for data generation and extraction
  extractDomainFromLinkedIn(linkedinUrl) {
    try {
      // Extract company name from LinkedIn URL like https://linkedin.com/company/company-name
      const match = linkedinUrl.match(/linkedin\.com\/company\/([^\/]+)/);
      if (match) {
        const companyName = match[1].replace(/-/g, '');
        return `${companyName}.com`;
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }

  generateWebsiteFromName(companyName) {
    try {
      // Clean company name and generate likely website
      const cleanName = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .replace(/^(the|a|an)\s*/, '');
      
      if (cleanName.length > 2) {
        return `https://${cleanName}.com`;
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }

  generateEmailFromName(firstName, lastName, domain) {
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanDomain}`;
      return email;
    } catch (error) {
      return null;
    }
  }

  generateLinkedInFromName(firstName, lastName) {
    try {
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
      return `https://linkedin.com/in/${cleanFirst}${cleanLast}`;
    } catch (error) {
      return null;
    }
  }

  parseFullName(fullName) {
    try {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return {
          firstName: parts[0],
          lastName: parts.slice(1).join(' ')
        };
      }
    } catch (error) {
      // Ignore errors
    }
    return { firstName: null, lastName: null };
  }

  extractDomainFromUrl(url) {
    try {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    } catch (error) {
      return null;
    }
  }

  // Database update methods
  async updateCompanyWebsite(companyId, website, domain) {
    await this.prisma.companies.update({
      where: { id: companyId },
      data: {
        website: website,
        domain: domain,
        updatedAt: new Date()
      }
    });
  }

  async updatePersonEmail(personId, email) {
    await this.prisma.people.update({
      where: { id: personId },
      data: {
        email: email,
        updatedAt: new Date()
      }
    });
  }

  async updatePersonLinkedIn(personId, linkedinUrl) {
    await this.prisma.people.update({
      where: { id: personId },
      data: {
        linkedinUrl: linkedinUrl,
        updatedAt: new Date()
      }
    });
  }

  async updatePersonNames(personId, firstName, lastName) {
    await this.prisma.people.update({
      where: { id: personId },
      data: {
        firstName: firstName,
        lastName: lastName,
        updatedAt: new Date()
      }
    });
  }

  isFieldPopulated(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  generateReport() {
    console.log('\n📊 MISSING PREREQUISITES FINDER REPORT');
    console.log('=======================================\n');

    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Companies fixed: ${this.results.summary.companiesFixed}`);
    console.log(`   People fixed: ${this.results.summary.peopleFixed}`);
    console.log(`   Total fixed: ${this.results.summary.companiesFixed + this.results.summary.peopleFixed}\n`);

    // Companies
    console.log('🏢 COMPANIES:');
    console.log(`   Missing website initially: ${this.results.companies.missingWebsite.length}`);
    console.log(`   Found website: ${this.results.companies.foundWebsite.length}`);
    console.log(`   Still missing: ${this.results.companies.stillMissing.length}\n`);

    // People
    console.log('👥 PEOPLE:');
    console.log(`   Missing email initially: ${this.results.people.missingEmail.length}`);
    console.log(`   Missing LinkedIn initially: ${this.results.people.missingLinkedIn.length}`);
    console.log(`   Missing name initially: ${this.results.people.missingName.length}`);
    console.log(`   Found email: ${this.results.people.foundEmail.length}`);
    console.log(`   Found LinkedIn: ${this.results.people.foundLinkedIn.length}`);
    console.log(`   Still missing: ${this.results.people.stillMissing.length}\n`);

    // Show sample fixes
    if (this.results.companies.foundWebsite.length > 0) {
      console.log('✅ SAMPLE COMPANY FIXES:');
      this.results.companies.foundWebsite.slice(0, 5).forEach(company => {
        console.log(`   ${company.name}: ${company.foundWebsite} (${company.source})`);
      });
      console.log('');
    }

    if (this.results.people.foundEmail.length > 0) {
      console.log('✅ SAMPLE PEOPLE EMAIL FIXES:');
      this.results.people.foundEmail.slice(0, 5).forEach(person => {
        console.log(`   ${person.fullName}: ${person.foundEmail} (${person.source})`);
      });
      console.log('');
    }

    if (this.results.people.foundLinkedIn.length > 0) {
      console.log('✅ SAMPLE PEOPLE LINKEDIN FIXES:');
      this.results.people.foundLinkedIn.slice(0, 5).forEach(person => {
        console.log(`   ${person.fullName}: ${person.foundLinkedIn} (${person.source})`);
      });
      console.log('');
    }

    // Save detailed report
    const fs = require('fs');
    const reportPath = 'top-missing-prerequisites-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the finder
async function main() {
  const finder = new TopMissingPrerequisitesFinder();
  await finder.runFinder();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TopMissingPrerequisitesFinder;
