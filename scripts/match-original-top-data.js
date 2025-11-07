require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class MatchOriginalTopData {
  constructor() {
    this.prisma = prisma;
    this.workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus
    this.originalPeople = new Map(); // key -> person data
    this.databasePeople = [];
    this.matches = [];
    this.unmatched = [];
    this.stats = {
      originalCount: 0,
      databaseCount: 0,
      matchedCount: 0,
      unmatchedWithCoreSignal: 0,
      unmatchedWithoutCoreSignal: 0
    };
  }

  async run() {
    try {
      console.log('🔍 MATCHING ORIGINAL TOP DATA');
      console.log('================================\n');

      // Step 1: Parse CSV files
      await this.parseCSVFiles();

      // Step 2: Query database
      await this.queryDatabase();

      // Step 3: Match records
      await this.matchRecords();

      // Step 4: Categorize records
      await this.categorizeRecords();

      // Step 5: Generate report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async parseCSVFiles() {
    console.log('📂 Parsing CSV files...\n');

    // File 1: Exported Capsule Contacts
    await this.parseCapsuleContacts();
    
    // File 2: Physical Mailer Campaign
    await this.parsePhysicalMailer();
    
    // File 3: UTC All Regions 2023
    await this.parseUTCRegions();

    console.log(`✅ Parsed ${this.stats.originalCount} original people from CSV files\n`);
  }

  async parseCapsuleContacts() {
    const filePath = '__top/Exported Capsule Contacts 2025-08-29.xlsx - contacts.csv';
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    // Find column indices
    const typeIdx = headers.indexOf('Type');
    const firstNameIdx = headers.indexOf('First Name');
    const lastNameIdx = headers.indexOf('Last Name');
    const nameIdx = headers.indexOf('Name');
    const emailIdx = headers.indexOf('Email');
    const workEmailIdx = headers.indexOf('Work Email');
    const organizationIdx = headers.indexOf('Organization');
    const companyIdx = headers.indexOf('Company');
    const jobTitleIdx = headers.indexOf('Job Title');
    const linkedinIdx = headers.indexOf('LinkedIn');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle quoted fields)
      const fields = this.parseCSVLine(line);
      
      if (fields.length <= typeIdx) continue;
      
      const type = fields[typeIdx];
      if (type !== 'Person') continue; // Skip Organizations

      const firstName = fields[firstNameIdx] || '';
      const lastName = fields[lastNameIdx] || '';
      const fullName = fields[nameIdx] || `${firstName} ${lastName}`.trim();
      const email = fields[emailIdx] || fields[workEmailIdx] || '';
      const company = fields[organizationIdx] || fields[companyIdx] || '';
      const jobTitle = fields[jobTitleIdx] || '';
      const linkedin = fields[linkedinIdx] || '';

      if (!fullName && !email) continue; // Skip if no identifying info

      this.addOriginalPerson({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        linkedin: linkedin.trim(),
        source: 'Capsule Contacts'
      });
    }
  }

  async parsePhysicalMailer() {
    const filePath = '__top/Physical Mailer Campaign 2025-08-29.xlsx - contacts.csv';
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    const typeIdx = headers.indexOf('Type');
    const firstNameIdx = headers.indexOf('First Name');
    const lastNameIdx = headers.indexOf('Last Name');
    const nameIdx = headers.indexOf('Name');
    const emailIdx = headers.indexOf('Email');
    const workEmailIdx = headers.indexOf('Work Email');
    const organizationIdx = headers.indexOf('Organization');
    const companyIdx = headers.indexOf('Company');
    const jobTitleIdx = headers.indexOf('Job Title');
    const linkedinIdx = headers.indexOf('LinkedIn');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = this.parseCSVLine(line);
      if (fields.length <= typeIdx) continue;
      
      const type = fields[typeIdx];
      if (type !== 'Person') continue;

      const firstName = fields[firstNameIdx] || '';
      const lastName = fields[lastNameIdx] || '';
      const fullName = fields[nameIdx] || `${firstName} ${lastName}`.trim();
      const email = fields[emailIdx] || fields[workEmailIdx] || '';
      const company = fields[organizationIdx] || fields[companyIdx] || '';
      const jobTitle = fields[jobTitleIdx] || '';
      const linkedin = fields[linkedinIdx] || '';

      if (!fullName && !email) continue;

      this.addOriginalPerson({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        linkedin: linkedin.trim(),
        source: 'Physical Mailer'
      });
    }
  }

  async parseUTCRegions() {
    const filePath = '__top/UTC All Regions 2023.xlsx - Sheet1.csv';
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    const companyIdx = headers.indexOf('Company');
    const firstNameIdx = headers.indexOf('First Name');
    const lastNameIdx = headers.indexOf('Last Name');
    const titleIdx = headers.indexOf('Title');
    const emailIdx = headers.indexOf('Email');

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(',')) continue; // Skip empty or header-like lines

      const fields = this.parseCSVLine(line);
      if (fields.length <= companyIdx) continue;

      const company = fields[companyIdx] || '';
      const firstName = fields[firstNameIdx] || '';
      const lastName = fields[lastNameIdx] || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = fields[emailIdx] || '';
      const jobTitle = fields[titleIdx] || '';

      if (!fullName && !email) continue;

      this.addOriginalPerson({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        linkedin: '',
        source: 'UTC Regions'
      });
    }
  }

  parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current); // Add last field

    return fields;
  }

  addOriginalPerson(person) {
    if (!person.fullName && !person.email) return;

    // Create multiple keys for matching
    const keys = [];
    
    if (person.email) {
      keys.push(`email:${person.email}`);
      // Also store by email domain for domain-based matching
      const emailDomain = this.extractEmailDomain(person.email);
      if (emailDomain && person.company) {
        const normalizedCompany = this.normalizeCompany(person.company);
        keys.push(`domain_company:${emailDomain}_${normalizedCompany}`);
      }
    }
    
    if (person.fullName && person.company) {
      const normalizedName = this.normalizeName(person.fullName);
      const normalizedCompany = this.normalizeCompany(person.company);
      keys.push(`name_company:${normalizedName}_${normalizedCompany}`);
    }
    
    if (person.linkedin) {
      keys.push(`linkedin:${person.linkedin}`);
    }

    // Store person with all keys
    keys.forEach(key => {
      if (!this.originalPeople.has(key)) {
        this.originalPeople.set(key, person);
        this.stats.originalCount++;
      }
    });
  }

  extractEmailDomain(email) {
    if (!email || !email.includes('@')) return null;
    const parts = email.toLowerCase().split('@');
    return parts.length > 1 ? parts[1].trim() : null;
  }

  normalizeName(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  normalizeCompany(company) {
    return company
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/gi, '') // Remove common suffixes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  async queryDatabase() {
    console.log('📊 Querying database...\n');

    this.databasePeople = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        linkedinUrl: true,
        jobTitle: true,
        company: {
          select: {
            name: true,
            id: true
          }
        },
        customFields: true,
        tags: true,
        source: true,
        createdAt: true
      }
    });

    this.stats.databaseCount = this.databasePeople.length;
    console.log(`✅ Found ${this.stats.databaseCount} people in database\n`);
  }

  async matchRecords() {
    console.log('🔗 Matching records...\n');

    for (const dbPerson of this.databasePeople) {
      const matchKeys = [];
      
      // Try email match (exact)
      const emails = [
        dbPerson.email,
        dbPerson.workEmail,
        dbPerson.personalEmail
      ].filter(Boolean).map(e => e.toLowerCase());

      emails.forEach(email => {
        matchKeys.push(`email:${email}`);
      });

      // Try email domain + company match (for better matching)
      if (dbPerson.company?.name) {
        emails.forEach(email => {
          const emailDomain = this.extractEmailDomain(email);
          if (emailDomain) {
            const normalizedCompany = this.normalizeCompany(dbPerson.company.name);
            matchKeys.push(`domain_company:${emailDomain}_${normalizedCompany}`);
          }
        });
      }

      // Try name + company match
      if (dbPerson.fullName && dbPerson.company?.name) {
        const normalizedName = this.normalizeName(dbPerson.fullName);
        const normalizedCompany = this.normalizeCompany(dbPerson.company.name);
        matchKeys.push(`name_company:${normalizedName}_${normalizedCompany}`);
      }

      // Try LinkedIn match
      if (dbPerson.linkedinUrl) {
        matchKeys.push(`linkedin:${dbPerson.linkedinUrl}`);
      }

      // Check if any key matches
      let matched = false;
      let matchedKey = null;
      
      for (const key of matchKeys) {
        if (this.originalPeople.has(key)) {
          matched = true;
          matchedKey = key;
          break;
        }
      }

      if (matched) {
        this.matches.push({
          dbPerson,
          originalPerson: this.originalPeople.get(matchedKey),
          matchKey: matchedKey
        });
        this.stats.matchedCount++;
      } else {
        this.unmatched.push(dbPerson);
      }
    }

    console.log(`✅ Matched ${this.stats.matchedCount} records\n`);
  }

  async categorizeRecords() {
    console.log('📋 Categorizing unmatched records...\n');

    // Build a map of original companies and their email domains
    const originalCompanyDomains = new Map();
    for (const [key, person] of this.originalPeople.entries()) {
      if (person.email && person.company) {
        const domain = this.extractEmailDomain(person.email);
        if (domain) {
          const normalizedCompany = this.normalizeCompany(person.company);
          if (!originalCompanyDomains.has(normalizedCompany)) {
            originalCompanyDomains.set(normalizedCompany, new Set());
          }
          originalCompanyDomains.get(normalizedCompany).add(domain);
        }
      }
    }

    for (const person of this.unmatched) {
      const hasCoreSignalId = person.customFields?.coresignalId != null;
      
      if (hasCoreSignalId) {
        this.stats.unmatchedWithCoreSignal++;
      } else {
        // Check if email domain matches original company domains OR makes sense for the company
        const emails = [
          person.email,
          person.workEmail,
          person.personalEmail
        ].filter(Boolean).map(e => e.toLowerCase());

        let emailMatchesCompany = false;
        let emailDomainReasonable = false;

        if (person.company?.name && emails.length > 0) {
          const normalizedCompany = this.normalizeCompany(person.company.name);
          
          // Check against original company domains
          const companyDomains = originalCompanyDomains.get(normalizedCompany);
          if (companyDomains) {
            for (const email of emails) {
              const emailDomain = this.extractEmailDomain(email);
              if (emailDomain && companyDomains.has(emailDomain)) {
                emailMatchesCompany = true;
                break;
              }
            }
          }

          // Also check if email domain is reasonable for the company name
          // Extract key words from company name and check if they appear in email domain
          if (!emailMatchesCompany) {
            const companyWords = normalizedCompany.split(/\s+/).filter(w => w.length > 2);
            for (const email of emails) {
              const emailDomain = this.extractEmailDomain(email);
              if (emailDomain) {
                const domainWithoutTld = emailDomain.split('.')[0]; // e.g., "pge" from "pge.com"
                
                // Check if any significant company word appears in the domain
                for (const word of companyWords) {
                  if (word.length > 3 && emailDomain.includes(word)) {
                    emailDomainReasonable = true;
                    break;
                  }
                }
                
                // Check if first word of company appears in domain (e.g., "irby" in "irbyutilities.com")
                if (companyWords.length > 0) {
                  const firstWord = companyWords[0];
                  if (firstWord.length > 2 && emailDomain.includes(firstWord)) {
                    emailDomainReasonable = true;
                    break;
                  }
                }
                
                // Check for common abbreviations (e.g., "pge" for "Pacific Gas and Electric")
                // Skip common words: and, of, the, for, inc, llc, ltd, corp, company, co
                const skipWords = new Set(['and', 'of', 'the', 'for', 'inc', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co', 'associates', 'assoc']);
                const significantWords = companyWords.filter(w => w.length > 2 && !skipWords.has(w.toLowerCase()));
                
                if (significantWords.length >= 2) {
                  // Try first letters of all significant words
                  const abbreviation = significantWords.map(w => w[0]).join('').toLowerCase();
                  if (domainWithoutTld === abbreviation || domainWithoutTld.startsWith(abbreviation)) {
                    emailDomainReasonable = true;
                    break;
                  }
                  
                  // Also try first 2-3 letters of first significant word + first letter of others
                  if (significantWords.length >= 2) {
                    const firstWord = significantWords[0];
                    const firstWordPrefix = firstWord.substring(0, Math.min(3, firstWord.length)).toLowerCase();
                    const restAbbrev = significantWords.slice(1).map(w => w[0]).join('').toLowerCase();
                    const combinedAbbrev = firstWordPrefix + restAbbrev;
                    if (domainWithoutTld === combinedAbbrev || domainWithoutTld.startsWith(combinedAbbrev)) {
                      emailDomainReasonable = true;
                      break;
                    }
                  }
                }
                
                // Special case: check if domain starts with first word of company
                if (companyWords.length > 0) {
                  const firstWord = companyWords[0];
                  if (firstWord.length >= 3 && domainWithoutTld.startsWith(firstWord.toLowerCase())) {
                    emailDomainReasonable = true;
                    break;
                  }
                }
              }
            }
          }
        }

        // Categorize based on email validation
        if (emailMatchesCompany) {
          // Email domain matches original company - likely good
          this.stats.unmatchedWithoutCoreSignal++;
          person._emailReviewStatus = 'likely_good';
        } else if (emailDomainReasonable) {
          // Email domain seems reasonable for company - likely good
          this.stats.unmatchedWithoutCoreSignal++;
          person._emailReviewStatus = 'likely_good';
        } else if (emails.length > 0) {
          // Has email but domain doesn't match - check if it's clearly wrong
          const emailDomain = this.extractEmailDomain(emails[0]);
          const domainWords = emailDomain ? emailDomain.split('.')[0].toLowerCase() : '';
          
          let companyWords = [];
          if (person.company?.name) {
            const normalizedCompany = this.normalizeCompany(person.company.name);
            companyWords = normalizedCompany.split(/\s+/).filter(w => w.length > 2);
          }
          
          // Check if email domain contains ANY company word (even partial match)
          let hasAnyMatch = false;
          if (domainWords && companyWords.length > 0) {
            for (const word of companyWords) {
              if (word.length > 3 && domainWords.includes(word.toLowerCase())) {
                hasAnyMatch = true;
                break;
              }
            }
          }
          
          // If email domain has NO relation to company name, it's suspicious
          if (!hasAnyMatch && domainWords.length > 0) {
            // Check for common suspicious patterns
            const suspiciousDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
            const isPersonalEmail = suspiciousDomains.some(d => emailDomain?.includes(d));
            
            if (!isPersonalEmail) {
              // Email domain doesn't match company at all - likely bad data
              this.stats.unmatchedWithoutCoreSignal++;
              person._emailReviewStatus = 'likely_bad';
            } else {
              // Personal email - needs review
              this.stats.unmatchedWithoutCoreSignal++;
              person._emailReviewStatus = 'needs_review';
            }
          } else {
            // Some relation but not clear - needs review
            this.stats.unmatchedWithoutCoreSignal++;
            person._emailReviewStatus = 'needs_review';
          }
        } else {
          // No email - needs review
          this.stats.unmatchedWithoutCoreSignal++;
          person._emailReviewStatus = 'no_email';
        }
      }
    }
  }

  async generateReport() {
    console.log('\n📊 MATCHING REPORT');
    console.log('==================\n');

    console.log('📈 STATISTICS:');
    console.log(`   Original People (from CSV): ${this.stats.originalCount}`);
    console.log(`   Database People: ${this.stats.databaseCount}`);
    console.log(`   Matched (GOOD): ${this.stats.matchedCount}`);
    console.log(`   Unmatched with CoreSignal ID (BAD): ${this.stats.unmatchedWithCoreSignal}`);
    console.log(`   Unmatched without CoreSignal ID (NEEDS REVIEW): ${this.stats.unmatchedWithoutCoreSignal}\n`);

    // Bad records (unmatched with coresignalId)
    const badRecords = this.unmatched.filter(p => p.customFields?.coresignalId != null);
    
    console.log('🚨 BAD RECORDS (Unmatched + CoreSignal ID):');
    console.log(`   Total: ${badRecords.length}\n`);
    
    if (badRecords.length > 0) {
      console.log('   Sample Bad Records (first 10):');
      badRecords.slice(0, 10).forEach((person, i) => {
        console.log(`   ${i + 1}. ${person.fullName}`);
        console.log(`      Company: ${person.company?.name || 'None'}`);
        console.log(`      Email: ${person.email || person.workEmail || person.personalEmail || 'None'}`);
        console.log(`      CoreSignal ID: ${person.customFields?.coresignalId}`);
        console.log(`      Created: ${new Date(person.createdAt).toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    // Records needing review - categorize by email status
    const needsReview = this.unmatched.filter(p => !p.customFields?.coresignalId);
    const likelyGood = needsReview.filter(p => p._emailReviewStatus === 'likely_good');
    const likelyBad = needsReview.filter(p => p._emailReviewStatus === 'likely_bad');
    const needsReviewStrict = needsReview.filter(p => p._emailReviewStatus === 'needs_review');
    const noEmail = needsReview.filter(p => p._emailReviewStatus === 'no_email');
    
    console.log('\n⚠️  RECORDS NEEDING REVIEW (Unmatched without CoreSignal ID):');
    console.log(`   Total: ${needsReview.length}`);
    console.log(`   Likely Good (email domain matches company): ${likelyGood.length}`);
    console.log(`   Likely Bad (email domain clearly wrong): ${likelyBad.length}`);
    console.log(`   Needs Review (unclear): ${needsReviewStrict.length}`);
    console.log(`   No Email: ${noEmail.length}\n`);
    
    if (likelyGood.length > 0) {
      console.log('✅ LIKELY GOOD (Email domain matches original company):');
      console.log(`   Total: ${likelyGood.length}`);
      console.log('   Sample (first 5):');
      likelyGood.slice(0, 5).forEach((person, i) => {
        const email = person.email || person.workEmail || person.personalEmail || 'None';
        const domain = this.extractEmailDomain(email);
        console.log(`   ${i + 1}. ${person.fullName} (${person.company?.name || 'None'})`);
        console.log(`      Email: ${email} (domain: ${domain})`);
        console.log('');
      });
    }

    if (likelyBad.length > 0) {
      console.log('\n🚨 LIKELY BAD (Email domain clearly doesn\'t match company):');
      console.log(`   Total: ${likelyBad.length}`);
      console.log('   Sample (first 15):');
      likelyBad.slice(0, 15).forEach((person, i) => {
        const email = person.email || person.workEmail || person.personalEmail || 'None';
        const domain = this.extractEmailDomain(email);
        console.log(`   ${i + 1}. ${person.fullName}`);
        console.log(`      Company: ${person.company?.name || 'None'}`);
        console.log(`      Email: ${email} (domain: ${domain})`);
        console.log(`      Created: ${new Date(person.createdAt).toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    if (needsReviewStrict.length > 0) {
      console.log('\n⚠️  NEEDS REVIEW (Email domain unclear or personal email):');
      console.log(`   Total: ${needsReviewStrict.length}`);
      console.log('   Sample (first 10):');
      needsReviewStrict.slice(0, 10).forEach((person, i) => {
        const email = person.email || person.workEmail || person.personalEmail || 'None';
        const domain = this.extractEmailDomain(email);
        console.log(`   ${i + 1}. ${person.fullName}`);
        console.log(`      Company: ${person.company?.name || 'None'}`);
        console.log(`      Email: ${email} (domain: ${domain})`);
        console.log(`      Created: ${new Date(person.createdAt).toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    if (noEmail.length > 0) {
      console.log('\n❓ NO EMAIL (Cannot verify by email):');
      console.log(`   Total: ${noEmail.length}`);
      console.log('   Sample (first 5):');
      noEmail.slice(0, 5).forEach((person, i) => {
        console.log(`   ${i + 1}. ${person.fullName} (${person.company?.name || 'None'})`);
        console.log(`      Created: ${new Date(person.createdAt).toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    // Export bad records to JSON
    const exportData = {
      summary: {
        originalCount: this.stats.originalCount,
        databaseCount: this.stats.databaseCount,
        matchedCount: this.stats.matchedCount,
        unmatchedWithCoreSignal: this.stats.unmatchedWithCoreSignal,
        unmatchedWithoutCoreSignal: this.stats.unmatchedWithoutCoreSignal
      },
      badRecords: badRecords.map(p => ({
        id: p.id,
        fullName: p.fullName,
        company: p.company?.name,
        email: p.email || p.workEmail || p.personalEmail,
        linkedinUrl: p.linkedinUrl,
        jobTitle: p.jobTitle,
        coresignalId: p.customFields?.coresignalId,
        createdAt: p.createdAt
      })),
      likelyGood: likelyGood.map(p => ({
        id: p.id,
        fullName: p.fullName,
        company: p.company?.name,
        email: p.email || p.workEmail || p.personalEmail,
        emailDomain: this.extractEmailDomain(p.email || p.workEmail || p.personalEmail),
        linkedinUrl: p.linkedinUrl,
        jobTitle: p.jobTitle,
        createdAt: p.createdAt,
        reviewStatus: 'likely_good'
      })),
      likelyBad: likelyBad.map(p => ({
        id: p.id,
        fullName: p.fullName,
        company: p.company?.name,
        email: p.email || p.workEmail || p.personalEmail,
        emailDomain: this.extractEmailDomain(p.email || p.workEmail || p.personalEmail),
        linkedinUrl: p.linkedinUrl,
        jobTitle: p.jobTitle,
        createdAt: p.createdAt,
        reviewStatus: 'likely_bad'
      })),
      needsReview: needsReviewStrict.map(p => ({
        id: p.id,
        fullName: p.fullName,
        company: p.company?.name,
        email: p.email || p.workEmail || p.personalEmail,
        emailDomain: this.extractEmailDomain(p.email || p.workEmail || p.personalEmail),
        linkedinUrl: p.linkedinUrl,
        jobTitle: p.jobTitle,
        createdAt: p.createdAt,
        reviewStatus: 'needs_review'
      })),
      noEmail: noEmail.map(p => ({
        id: p.id,
        fullName: p.fullName,
        company: p.company?.name,
        email: null,
        linkedinUrl: p.linkedinUrl,
        jobTitle: p.jobTitle,
        createdAt: p.createdAt,
        reviewStatus: 'no_email'
      }))
    };

    const exportPath = 'scripts/top-data-matching-results.json';
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Results exported to: ${exportPath}`);

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log(`1. ${badRecords.length} records are definitely bad (unmatched + CoreSignal ID)`);
    console.log('   → These can be safely deleted');
    console.log(`2. ${likelyBad.length} records are likely bad (email domain clearly wrong)`);
    console.log('   → Review and likely delete these');
    console.log(`3. ${this.stats.matchedCount} records matched original CSV data (GOOD - keep these)`);
    console.log('   → These came from your original data files - definitely good');
    console.log(`4. ${likelyGood.length} records are likely good (email domain matches company)`);
    console.log('   → Keep these - email validation suggests they\'re legitimate');
    console.log(`5. ${needsReviewStrict.length} records need manual review (unclear)`);
    console.log('   → Review individually');
    console.log(`6. ${noEmail.length} records have no email`);
    console.log('   → Review individually');
    console.log('\n7. ASSUMPTION:');
    console.log('   → Data from original CSV files (matched records) is GOOD');
    console.log('   → Everything else should be validated or deleted');
    console.log('\n8. Next Steps:');
    console.log(`   - ✅ ${badRecords.length} definitely bad records deleted`);
    console.log(`   - ✅ ${likelyBad.length} likely bad records deleted`);
    console.log(`   - ✅ ${this.stats.matchedCount} matched records (GOOD - from original CSVs)`);
    console.log(`   - ✅ ${likelyGood.length} likely good records (keep)`);
    console.log(`   - ⚠️  Review ${needsReviewStrict.length + noEmail.length} unclear records manually`);
  }
}

// Run the matching
async function main() {
  const matcher = new MatchOriginalTopData();
  await matcher.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MatchOriginalTopData;

