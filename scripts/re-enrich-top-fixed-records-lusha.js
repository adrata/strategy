require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LUSHA_CONFIG = {
  apiKey: process.env.LUSHA_API_KEY,
  baseUrl: 'https://api.lusha.com/v2'
};

class ReEnrichTopFixedRecords {
  constructor() {
    this.prisma = prisma;
    this.lushaApiKey = LUSHA_CONFIG.apiKey;
    this.baseUrl = LUSHA_CONFIG.baseUrl;
    this.reEnrichedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;
  }

  async reEnrichFixedRecords() {
    console.log('🔄 RE-ENRICHING TOP FIXED RECORDS WITH LUSHA');
    console.log('==============================================');
    
    if (!this.lushaApiKey) {
      console.log('❌ LUSHA_API_KEY not found in environment variables');
      return;
    }
    
    try {
      // Get TOP workspace ID
      const topWorkspace = await prisma.workspaces.findFirst({
        where: { name: { contains: 'TOP', mode: 'insensitive' } }
      });
      
      if (!topWorkspace) {
        console.log('❌ TOP workspace not found');
        return;
      }
      
      console.log(`📊 Found TOP workspace: ${topWorkspace.name} (ID: ${topWorkspace.id})`);
      
      // The 4 fixed records from the fix report
      const fixedRecordIds = [
        '01K7DWFN3H9NWWXDMJ505VFX4H', // Carl Darnell
        '01K7DWGCMPBR4XNCJR4X4RSC15', // Scott Crawford
        '01K7DWGYA4D1TJ71MVE4QXYC2X', // Michael Morgan
        '01K7DWJ9WRC28KFCN3XZ9YBD6K'  // Miles Brusherd
      ];
      
      // Get the fixed records
      const fixedRecords = await prisma.people.findMany({
        where: {
          id: { in: fixedRecordIds },
          workspaceId: topWorkspace.id
        },
        include: {
          company: true
        }
      });
      
      console.log(`\n📋 Found ${fixedRecords.length} fixed records to re-enrich\n`);
      
      // Re-enrich each record with Lusha
      for (const person of fixedRecords) {
        await this.reEnrichPerson(person);
        // Rate limiting - wait 2 seconds between requests
        await this.delay(2000);
      }
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Re-enrichment failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async reEnrichPerson(person) {
    console.log(`\n👤 Re-enriching: ${person.fullName}`);
    console.log(`   ID: ${person.id}`);
    
    // Skip if we don't have enough data to search
    if (!person.firstName || !person.lastName) {
      console.log('   ⚠️  Skipping: Missing first/last name');
      this.skippedCount++;
      return;
    }
    
    // Get company name for better matching
    const companyName = person.company ? (typeof person.company === 'string' ? person.company : person.company.name) : null;
    
    try {
      // Build Lusha API request
      const params = new URLSearchParams();
      if (person.firstName) params.append('firstName', person.firstName);
      if (person.lastName) params.append('lastName', person.lastName);
      if (person.email || person.workEmail) {
        params.append('email', person.email || person.workEmail);
      }
      if (companyName) {
        params.append('companyName', companyName);
      }
      if (person.linkedinUrl) {
        params.append('linkedinUrl', person.linkedinUrl);
      }
      params.append('refreshJobInfo', 'true');
      params.append('revealEmails', 'true');
      params.append('revealPhones', 'true');
      
      const url = `${this.baseUrl}/person?${params.toString()}`;
      
      console.log(`   🔍 Searching Lusha for: ${person.firstName} ${person.lastName}${companyName ? ` at ${companyName}` : ''}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'api_key': this.lushaApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.log('   ⚠️  Rate limit exceeded, waiting...');
          await this.delay(10000); // Wait 10 seconds
          return;
        }
        console.log(`   ❌ Lusha API error: ${response.status} ${response.statusText}`);
        this.failedCount++;
        return;
      }
      
      const lushaData = await response.json();
      
      if (!lushaData || Object.keys(lushaData).length === 0) {
        console.log('   ⚠️  No data returned from Lusha');
        this.skippedCount++;
        return;
      }
      
      // Validate Lusha data matches the person
      const validation = this.validateLushaData(person, lushaData);
      if (!validation.isValid) {
        console.log(`   ❌ Validation failed: ${validation.reason}`);
        console.log('   🚫 Skipping update to prevent wrong data');
        this.failedCount++;
        return;
      }
      
      // Update person record with validated Lusha data
      await this.updatePersonWithLushaData(person, lushaData);
      
      console.log('   ✅ Successfully re-enriched with Lusha');
      this.reEnrichedCount++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.failedCount++;
    }
  }

  validateLushaData(person, lushaData) {
    const validation = {
      isValid: true,
      reason: null
    };
    
    // Check if name matches
    if (lushaData.firstName && lushaData.lastName) {
      const lushaFullName = `${lushaData.firstName} ${lushaData.lastName}`.toLowerCase();
      const personFullName = person.fullName.toLowerCase();
      
      // Calculate similarity
      const similarity = this.calculateNameSimilarity(lushaFullName, personFullName);
      if (similarity < 0.7) {
        validation.isValid = false;
        validation.reason = `Name mismatch: Lusha="${lushaFullName}" vs Person="${personFullName}" (similarity: ${Math.round(similarity * 100)}%)`;
        return validation;
      }
    }
    
    // Check if company matches (if we have company context)
    if (lushaData.company && person.company) {
      const lushaCompany = lushaData.company.toLowerCase();
      const personCompany = (typeof person.company === 'string' ? person.company : person.company.name).toLowerCase();
      
      const similarity = this.calculateCompanySimilarity(lushaCompany, personCompany);
      if (similarity < 0.5) {
        validation.isValid = false;
        validation.reason = `Company mismatch: Lusha="${lushaCompany}" vs Person="${personCompany}" (similarity: ${Math.round(similarity * 100)}%)`;
        return validation;
      }
    }
    
    return validation;
  }

  async updatePersonWithLushaData(person, lushaData) {
    const updateData = {
      // Update contact information
      email: lushaData.emails?.[0]?.address || person.email,
      workEmail: lushaData.emails?.[0]?.address || person.workEmail,
      phone: lushaData.phones?.[0]?.number || person.phone,
      mobilePhone: lushaData.phones?.[0]?.number || person.mobilePhone,
      
      // Update professional data
      jobTitle: lushaData.currentTitle || person.jobTitle,
      title: lushaData.currentTitle || person.title,
      
      // Update LinkedIn if we have it
      linkedinUrl: lushaData.linkedIn || person.linkedinUrl,
      
      // Store Lusha metadata
      customFields: {
        ...person.customFields,
        lusha: {
          enrichedAt: new Date().toISOString(),
          data: lushaData,
          validated: true
        },
        dataQualityIssues: {
          ...person.customFields?.dataQualityIssues,
          reEnrichedWithLusha: true,
          reEnrichedDate: new Date().toISOString()
        }
      },
      updatedAt: new Date()
    };
    
    await prisma.people.update({
      where: { id: person.id },
      data: updateData
    });
  }

  calculateNameSimilarity(name1, name2) {
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  calculateCompanySimilarity(company1, company2) {
    const words1 = company1.split(/\s+/);
    const words2 = company2.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateSummary() {
    console.log('\n📋 RE-ENRICHMENT SUMMARY');
    console.log('========================');
    console.log(`✅ Successfully re-enriched: ${this.reEnrichedCount}`);
    console.log(`❌ Failed: ${this.failedCount}`);
    console.log(`⚠️  Skipped: ${this.skippedCount}`);
    console.log(`📊 Total: ${this.reEnrichedCount + this.failedCount + this.skippedCount}`);
  }
}

// Run the re-enrichment
const reEnricher = new ReEnrichTopFixedRecords();
reEnricher.reEnrichFixedRecords().catch(console.error);
