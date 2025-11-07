#!/usr/bin/env node

/**
 * Clean and Standardize TOP Data
 * 
 * Cleans and standardizes:
 * - Company names (remove extra spaces, standardize capitalization)
 * - People names (proper capitalization, remove extra spaces)
 * - Job titles (standardize format, remove extra spaces)
 * - Email addresses (lowercase, trim)
 * - LinkedIn URLs (standardize format)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TOPDataCleaner {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
    this.stats = {
      companiesCleaned: 0,
      peopleCleaned: 0,
      titlesCleaned: 0,
      emailsCleaned: 0,
      linkedinCleaned: 0
    };
  }

  async run() {
    console.log('🧹 TOP Data Cleaning & Standardization');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Clean companies
      await this.cleanCompanies();
      
      // Clean people
      await this.cleanPeople();

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Clean company names and data
   */
  async cleanCompanies() {
    console.log('🏢 Cleaning companies...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        email: true,
        phone: true
      }
    });

    console.log(`   Found ${companies.length} companies to clean\n`);

    for (const company of companies) {
      const updates = {};
      let needsUpdate = false;

      // Clean name
      const cleanedName = this.cleanName(company.name);
      if (cleanedName !== company.name) {
        updates.name = cleanedName;
        needsUpdate = true;
        this.stats.companiesCleaned++;
      }

      // Clean website
      if (company.website) {
        const cleanedWebsite = this.cleanWebsite(company.website);
        if (cleanedWebsite !== company.website) {
          updates.website = cleanedWebsite;
          needsUpdate = true;
        }
      }

      // Clean LinkedIn URL
      if (company.linkedinUrl) {
        const cleanedLinkedIn = this.cleanLinkedInUrl(company.linkedinUrl);
        if (cleanedLinkedIn !== company.linkedinUrl) {
          updates.linkedinUrl = cleanedLinkedIn;
          needsUpdate = true;
        }
      }

      // Clean email
      if (company.email) {
        const cleanedEmail = this.cleanEmail(company.email);
        if (cleanedEmail !== company.email) {
          updates.email = cleanedEmail;
          needsUpdate = true;
        }
      }

      // Clean industry
      if (company.industry) {
        const cleanedIndustry = this.cleanIndustry(company.industry);
        if (cleanedIndustry !== company.industry) {
          updates.industry = cleanedIndustry;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await this.prisma.companies.update({
          where: { id: company.id },
          data: updates
        });
      }
    }

    console.log(`✅ Cleaned ${this.stats.companiesCleaned} companies\n`);
  }

  /**
   * Clean people names, titles, emails
   */
  async cleanPeople() {
    console.log('👥 Cleaning people...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        linkedinUrl: true
      }
    });

    console.log(`   Found ${people.length} people to clean\n`);

    for (const person of people) {
      const updates = {};
      let needsUpdate = false;

      // Clean first name
      if (person.firstName) {
        const cleaned = this.cleanName(person.firstName);
        if (cleaned !== person.firstName) {
          updates.firstName = cleaned;
          needsUpdate = true;
        }
      }

      // Clean last name
      if (person.lastName) {
        const cleaned = this.cleanName(person.lastName);
        if (cleaned !== person.lastName) {
          updates.lastName = cleaned;
          needsUpdate = true;
        }
      }

      // Clean full name
      if (person.fullName) {
        const cleaned = this.cleanName(person.fullName);
        if (cleaned !== person.fullName) {
          updates.fullName = cleaned;
          needsUpdate = true;
          this.stats.peopleCleaned++;
        }
      }

      // Clean job title
      if (person.jobTitle) {
        const cleaned = this.cleanJobTitle(person.jobTitle);
        if (cleaned !== person.jobTitle) {
          updates.jobTitle = cleaned;
          needsUpdate = true;
          this.stats.titlesCleaned++;
        }
      }

      // Clean emails
      if (person.email) {
        const cleaned = this.cleanEmail(person.email);
        if (cleaned !== person.email) {
          updates.email = cleaned;
          needsUpdate = true;
          this.stats.emailsCleaned++;
        }
      }

      if (person.workEmail) {
        const cleaned = this.cleanEmail(person.workEmail);
        if (cleaned !== person.workEmail) {
          updates.workEmail = cleaned;
          needsUpdate = true;
          this.stats.emailsCleaned++;
        }
      }

      if (person.personalEmail) {
        const cleaned = this.cleanEmail(person.personalEmail);
        if (cleaned !== person.personalEmail) {
          updates.personalEmail = cleaned;
          needsUpdate = true;
          this.stats.emailsCleaned++;
        }
      }

      // Clean LinkedIn URL
      if (person.linkedinUrl) {
        const cleaned = this.cleanLinkedInUrl(person.linkedinUrl);
        if (cleaned !== person.linkedinUrl) {
          updates.linkedinUrl = cleaned;
          needsUpdate = true;
          this.stats.linkedinCleaned++;
        }
      }

      if (needsUpdate) {
        await this.prisma.people.update({
          where: { id: person.id },
          data: updates
        });
      }
    }

    console.log(`✅ Cleaned ${this.stats.peopleCleaned} people\n`);
  }

  /**
   * Clean name (proper capitalization, remove extra spaces)
   */
  cleanName(name) {
    if (!name) return name;
    
    // Remove extra spaces
    let cleaned = name.trim().replace(/\s+/g, ' ');
    
    // Proper capitalization (handle special cases)
    const specialCases = {
      'llc': 'LLC',
      'inc': 'Inc',
      'corp': 'Corp',
      'ltd': 'Ltd',
      'co': 'Co',
      'jr': 'Jr',
      'sr': 'Sr',
      'ii': 'II',
      'iii': 'III',
      'iv': 'IV',
      'v': 'V'
    };

    // Split into words and capitalize properly
    const words = cleaned.split(' ');
    const cleanedWords = words.map((word, index) => {
      const lowerWord = word.toLowerCase();
      
      // Handle special cases
      if (specialCases[lowerWord]) {
        return specialCases[lowerWord];
      }
      
      // Handle hyphenated names
      if (word.includes('-')) {
        return word.split('-').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join('-');
      }
      
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return cleanedWords.join(' ');
  }

  /**
   * Clean job title
   */
  cleanJobTitle(title) {
    if (!title) return title;
    
    // Remove extra spaces
    let cleaned = title.trim().replace(/\s+/g, ' ');
    
    // Standardize common abbreviations
    const abbreviations = {
      'vp': 'VP',
      'ceo': 'CEO',
      'cto': 'CTO',
      'cfo': 'CFO',
      'coo': 'COO',
      'cmo': 'CMO',
      'cio': 'CIO',
      'svp': 'SVP',
      'evp': 'EVP',
      'dir': 'Director',
      'mgr': 'Manager',
      'mngr': 'Manager',
      'eng': 'Engineer',
      'engr': 'Engineer',
      'sr': 'Senior',
      'jr': 'Junior',
      'st': 'St',
      'nd': 'nd',
      'rd': 'rd',
      'th': 'th'
    };

    // Split and clean
    const words = cleaned.split(' ');
    const cleanedWords = words.map(word => {
      const lowerWord = word.toLowerCase().replace(/[.,]/g, '');
      if (abbreviations[lowerWord]) {
        return abbreviations[lowerWord];
      }
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return cleanedWords.join(' ');
  }

  /**
   * Clean email (lowercase, trim)
   */
  cleanEmail(email) {
    if (!email) return email;
    return email.trim().toLowerCase();
  }

  /**
   * Clean website URL
   */
  cleanWebsite(url) {
    if (!url) return url;
    let cleaned = url.trim().toLowerCase();
    
    // Ensure it starts with http:// or https://
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    
    // Remove trailing slash
    cleaned = cleaned.replace(/\/$/, '');
    
    return cleaned;
  }

  /**
   * Clean LinkedIn URL
   */
  cleanLinkedInUrl(url) {
    if (!url) return url;
    let cleaned = url.trim();
    
    // Standardize format
    if (cleaned.includes('linkedin.com/company/')) {
      // Company URL - keep as is but ensure https
      if (!cleaned.startsWith('http')) {
        cleaned = 'https://' + cleaned;
      }
    } else if (cleaned.includes('linkedin.com/in/')) {
      // Person URL - keep as is but ensure https
      if (!cleaned.startsWith('http')) {
        cleaned = 'https://' + cleaned;
      }
    } else if (cleaned.startsWith('www.linkedin.com')) {
      cleaned = 'https://' + cleaned;
    }
    
    // Remove query parameters and fragments
    cleaned = cleaned.split('?')[0].split('#')[0];
    
    return cleaned;
  }

  /**
   * Clean industry name
   */
  cleanIndustry(industry) {
    if (!industry) return industry;
    
    // Standardize common industry names
    const industryMap = {
      'electric utility': 'Electric Utilities',
      'electric utilities': 'Electric Utilities',
      'utilities': 'Utilities',
      'utility': 'Utilities',
      'energy': 'Energy',
      'telecommunications': 'Telecommunications',
      'telecom': 'Telecommunications',
      'engineering': 'Engineering',
      'engineering services': 'Engineering Services',
      'technology': 'Technology',
      'tech': 'Technology',
      'software': 'Software',
      'saas': 'Software',
      'consulting': 'Consulting',
      'professional services': 'Professional Services'
    };

    const lower = industry.toLowerCase().trim();
    if (industryMap[lower]) {
      return industryMap[lower];
    }

    // Capitalize properly
    return industry.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 CLEANING SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Companies cleaned: ${this.stats.companiesCleaned}`);
    console.log(`✅ People cleaned: ${this.stats.peopleCleaned}`);
    console.log(`✅ Titles cleaned: ${this.stats.titlesCleaned}`);
    console.log(`✅ Emails cleaned: ${this.stats.emailsCleaned}`);
    console.log(`✅ LinkedIn URLs cleaned: ${this.stats.linkedinCleaned}`);
    console.log('\n✅ Data cleaning complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const cleaner = new TOPDataCleaner();
  cleaner.run().catch(console.error);
}

module.exports = { TOPDataCleaner };

