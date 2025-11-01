require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DataQualityScorer {
  constructor() {
    this.prisma = prisma;
    this.scoredCount = 0;
    this.updatedCount = 0;
  }

  async calculateScores() {
    console.log('📊 CALCULATING DATA QUALITY SCORES');
    console.log('==================================\n');
    
    try {
      const topWorkspace = await prisma.workspaces.findFirst({
        where: { name: { contains: 'TOP', mode: 'insensitive' } }
      });
      
      if (!topWorkspace) {
        console.log('❌ TOP workspace not found');
        return;
      }
      
      // Get unique people (deduplicate)
      const allPeople = await prisma.people.findMany({
        where: { workspaceId: topWorkspace.id }
      });
      
      const seenKeys = new Set();
      const uniquePeople = [];
      
      for (const person of allPeople) {
        const key = person.email 
          ? `${person.email.toLowerCase()}_${person.fullName.toLowerCase()}`
          : person.fullName.toLowerCase();
        
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniquePeople.push(person);
        }
      }
      
      console.log(`📊 Scoring ${uniquePeople.length} unique records...\n`);
      
      for (const person of uniquePeople) {
        const score = this.calculatePersonScore(person);
        
        // Update person with quality score
        await prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: {
              ...person.customFields,
              dataQualityScore: score
            }
          }
        });
        
        this.scoredCount++;
        if (this.scoredCount % 100 === 0) {
          console.log(`  Processed ${this.scoredCount} records...`);
        }
      }
      
      console.log(`\n✅ Scored ${this.scoredCount} records`);
      this.generateScoreDistribution(uniquePeople);
      
    } catch (error) {
      console.error('❌ Scoring failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  calculatePersonScore(person) {
    let score = 0;
    const maxScore = 100;
    
    // Completeness (30%)
    const completenessScore = this.calculateCompleteness(person);
    score += completenessScore * 0.30;
    
    // Accuracy (40%)
    const accuracyScore = this.calculateAccuracy(person);
    score += accuracyScore * 0.40;
    
    // Recency (15%)
    const recencyScore = this.calculateRecency(person);
    score += recencyScore * 0.15;
    
    // Verification status (15%)
    const verificationScore = this.calculateVerificationStatus(person);
    score += verificationScore * 0.15;
    
    return Math.round(Math.min(100, score));
  }

  calculateCompleteness(person) {
    const requiredFields = ['fullName', 'jobTitle', 'email', 'company'];
    const optionalFields = ['phone', 'linkedinUrl'];
    
    let filled = 0;
    
    requiredFields.forEach(field => {
      if (field === 'company') {
        if (person.company) filled++;
      } else if (person[field]) {
        filled++;
      }
    });
    
    optionalFields.forEach(field => {
      if (person[field]) filled += 0.5;
    });
    
    return (filled / (requiredFields.length + optionalFields.length * 0.5)) * 100;
  }

  calculateAccuracy(person) {
    let accuracy = 100;
    
    // Deduct for LinkedIn mismatches
    if (person.linkedinUrl && person.fullName) {
      const urlName = this.extractNameFromLinkedInUrl(person.linkedinUrl);
      if (urlName) {
        const similarity = this.calculateNameSimilarity(urlName, person.fullName);
        if (similarity < 0.6) accuracy -= 30;
      }
    }
    
    // Deduct for email/company mismatches
    if (person.email && person.company) {
      const domain = person.email.split('@')[1];
      const companyName = typeof person.company === 'string' ? person.company : person.company.name;
      if (domain && !this.emailDomainMatchesCompany(domain, companyName)) {
        accuracy -= 20;
      }
    }
    
    // Deduct for invalid data
    if (person.email && !this.isValidEmail(person.email)) accuracy -= 15;
    if (person.linkedinUrl && !person.linkedinUrl.includes('linkedin.com/in/')) accuracy -= 15;
    
    return Math.max(0, accuracy);
  }

  calculateRecency(person) {
    if (!person.updatedAt) return 0;
    
    const daysSinceUpdate = (Date.now() - new Date(person.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 30) return 100;
    if (daysSinceUpdate < 90) return 75;
    if (daysSinceUpdate < 180) return 50;
    if (daysSinceUpdate < 365) return 25;
    return 0;
  }

  calculateVerificationStatus(person) {
    const verification = person.customFields?.companyVerification;
    
    if (verification?.verified && verification.confidence >= 70) return 100;
    if (verification?.verified && verification.confidence >= 50) return 75;
    if (verification && !verification.verified) return 25;
    
    return 50; // Unknown/default
  }

  extractNameFromLinkedInUrl(url) {
    try {
      const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (error) {}
    return null;
  }

  calculateNameSimilarity(name1, name2) {
    const words1 = name1.toLowerCase().split(/\s+/);
    const words2 = name2.toLowerCase().split(/\s+/);
    let common = 0;
    for (const w1 of words1) {
      if (words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))) common++;
    }
    return common / Math.max(words1.length, words2.length);
  }

  emailDomainMatchesCompany(domain, companyName) {
    const normalized = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');
    const expectedDomains = [normalized, normalized.replace(/\s+/g, ''), normalized.split(' ')[0]];
    return expectedDomains.some(exp => domain.toLowerCase().includes(exp) || exp.includes(domain.toLowerCase()));
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  generateScoreDistribution(people) {
    const distribution = {
      excellent: 0, // 90-100
      good: 0,      // 70-89
      fair: 0,      // 50-69
      poor: 0       // 0-49
    };
    
    // Would need to fetch scores from database, but for now just log
    console.log('\n📊 Score Distribution:');
    console.log('  (Scores saved to person records)');
  }
}

const scorer = new DataQualityScorer();
scorer.calculateScores().catch(console.error);
