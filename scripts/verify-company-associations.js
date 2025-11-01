require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CompanyAssociationVerifier {
  constructor() {
    this.prisma = prisma;
    this.lushaApiKey = process.env.LUSHA_API_KEY;
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.verificationResults = [];
  }

  async verifyFixedRecords() {
    console.log('🔍 VERIFYING COMPANY ASSOCIATIONS FOR FIXED RECORDS');
    console.log('===================================================\n');
    
    try {
      const topWorkspace = await prisma.workspaces.findFirst({
        where: { name: { contains: 'TOP', mode: 'insensitive' } }
      });
      
      if (!topWorkspace) {
        console.log('❌ TOP workspace not found');
        return;
      }
      
      const fixedRecordIds = [
        '01K7DWFN3H9NWWXDMJ505VFX4H',
        '01K7DWGCMPBR4XNCJR4X4RSC15',
        '01K7DWGYA4D1TJ71MVE4QXYC2X',
        '01K7DWJ9WRC28KFCN3XZ9YBD6K'
      ];
      
      const fixedRecords = await prisma.people.findMany({
        where: { id: { in: fixedRecordIds }, workspaceId: topWorkspace.id },
        include: { company: true }
      });
      
      console.log(`📊 Found ${fixedRecords.length} fixed records to verify\n`);
      
      for (const person of fixedRecords) {
        await this.verifyPerson(person);
        await this.delay(2000);
      }
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async verifyPerson(person) {
    console.log(`\n👤 Verifying: ${person.fullName}`);
    
    const companyName = person.company ? (typeof person.company === 'string' ? person.company : person.company.name) : null;
    
    if (!companyName) {
      console.log('   ⚠️  No company association');
      this.verificationResults.push({
        personId: person.id,
        personName: person.fullName,
        companyName: null,
        verified: false,
        confidence: 0,
        action: 'NO_COMPANY'
      });
      return;
    }
    
    console.log(`   🏢 Company: ${companyName}`);
    
    const verification = {
      personId: person.id,
      personName: person.fullName,
      companyName: companyName,
      sources: [],
      verified: false,
      confidence: 0,
      action: null
    };
    
    // Verify with Lusha
    if (this.lushaApiKey) {
      const lushaResult = await this.verifyWithLusha(person, companyName);
      if (lushaResult) {
        verification.sources.push('Lusha');
        verification.confidence += lushaResult.confidence;
        if (lushaResult.verified) verification.verified = true;
      }
    }
    
    // Verify email domain
    const emailResult = this.verifyEmailDomain(person, companyName);
    if (emailResult.verified) {
      verification.sources.push('EmailDomain');
      verification.confidence += 20;
      verification.verified = true;
    }
    
    if (verification.sources.length > 0) {
      verification.confidence = Math.min(100, verification.confidence / verification.sources.length);
    }
    
    if (verification.verified && verification.confidence >= 70) {
      verification.action = 'VERIFIED';
    } else if (verification.confidence < 30) {
      verification.action = 'CLEAR_COMPANY';
    } else {
      verification.action = 'MANUAL_REVIEW';
    }
    
    this.verificationResults.push(verification);
    
    await prisma.people.update({
      where: { id: person.id },
      data: {
        customFields: {
          ...person.customFields,
          companyVerification: verification
        }
      }
    });
    
    console.log(`   Result: ${verification.action} (${Math.round(verification.confidence)}% confidence)`);
  }

  async verifyWithLusha(person, companyName) {
    try {
      const params = new URLSearchParams();
      if (person.firstName) params.append('firstName', person.firstName);
      if (person.lastName) params.append('lastName', person.lastName);
      if (companyName) params.append('companyName', companyName);
      
      const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
        headers: { 'api_key': this.lushaApiKey }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (!data || !data.company) return null;
      
      const similarity = this.calculateSimilarity(data.company.toLowerCase(), companyName.toLowerCase());
      
      return {
        verified: similarity >= 0.8,
        confidence: similarity * 100
      };
    } catch (error) {
      return null;
    }
  }

  verifyEmailDomain(person, companyName) {
    const email = person.email || person.workEmail;
    if (!email) return { verified: false };
    
    const domain = email.split('@')[1];
    if (!domain) return { verified: false };
    
    const expectedDomains = this.generateExpectedDomains(companyName);
    const matches = expectedDomains.some(d => 
      domain.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(domain.toLowerCase())
    );
    
    return { verified: matches };
  }

  generateExpectedDomains(companyName) {
    const normalized = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    return [
      normalized.replace(/\s+/g, ''),
      normalized.replace(/\s+/g, '-'),
      normalized.split(' ')[0]
    ];
  }

  calculateSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    let common = 0;
    for (const w1 of words1) {
      if (words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))) common++;
    }
    return common / Math.max(words1.length, words2.length);
  }

  generateReport() {
    console.log('\n📋 VERIFICATION REPORT\n');
    const verified = this.verificationResults.filter(r => r.action === 'VERIFIED');
    const notVerified = this.verificationResults.filter(r => r.action === 'CLEAR_COMPANY');
    const needsReview = this.verificationResults.filter(r => r.action === 'MANUAL_REVIEW');
    
    console.log(`✅ Verified: ${verified.length}`);
    console.log(`❌ Not Verified: ${notVerified.length}`);
    console.log(`⚠️  Needs Review: ${needsReview.length}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const verifier = new CompanyAssociationVerifier();
verifier.verifyFixedRecords().catch(console.error);
