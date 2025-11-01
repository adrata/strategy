require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ComprehensiveDataQualityAudit {
  constructor() {
    this.prisma = prisma;
    this.issues = [];
    this.stats = {
      totalRecords: 0,
      duplicateRecords: 0,
      uniqueRecords: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    };
  }

  async runComprehensiveAudit() {
    console.log('🔍 COMPREHENSIVE DATA QUALITY AUDIT - TOP WORKSPACE');
    console.log('====================================================\n');
    
    try {
      const topWorkspace = await prisma.workspaces.findFirst({
        where: { name: { contains: 'TOP', mode: 'insensitive' } }
      });
      
      if (!topWorkspace) {
        console.log('❌ TOP workspace not found');
        return;
      }
      
      // Get all people and filter duplicates
      const allPeople = await prisma.people.findMany({
        where: { workspaceId: topWorkspace.id },
        include: { company: true },
        orderBy: { createdAt: 'asc' }
      });
      
      // Deduplicate
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
      
      this.stats.totalRecords = allPeople.length;
      this.stats.duplicateRecords = allPeople.length - uniquePeople.length;
      this.stats.uniqueRecords = uniquePeople.length;
      
      console.log(`📊 Total Records: ${this.stats.totalRecords}`);
      console.log(`🔍 Unique Records: ${this.stats.uniqueRecords}`);
      console.log(`📋 Duplicates Filtered: ${this.stats.duplicateRecords}\n`);
      
      // Audit each unique record
      for (const person of uniquePeople) {
        await this.auditPerson(person);
      }
      
      // Prioritize issues
      this.prioritizeIssues();
      
      // Generate comprehensive report
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async auditPerson(person) {
    const personIssues = {
      personId: person.id,
      personName: person.fullName,
      issues: []
    };
    
    // 1. Critical: LinkedIn URL mismatches
    const linkedinIssue = this.checkLinkedInMismatch(person);
    if (linkedinIssue) {
      personIssues.issues.push(linkedinIssue);
      this.stats.criticalIssues++;
    }
    
    // 2. Critical: Company association issues
    const companyIssue = this.checkCompanyAssociation(person);
    if (companyIssue) {
      personIssues.issues.push(companyIssue);
      if (companyIssue.severity === 'critical') this.stats.criticalIssues++;
      else this.stats.highIssues++;
    }
    
    // 3. High: Suspicious titles
    const titleIssue = this.checkSuspiciousTitle(person);
    if (titleIssue) {
      personIssues.issues.push(titleIssue);
      this.stats.highIssues++;
    }
    
    // 4. Medium: Missing critical data
    const missingDataIssue = this.checkMissingData(person);
    if (missingDataIssue) {
      personIssues.issues.push(missingDataIssue);
      this.stats.mediumIssues++;
    }
    
    // 5. Medium: Invalid contact information
    const contactIssue = this.checkContactInfo(person);
    if (contactIssue) {
      personIssues.issues.push(contactIssue);
      this.stats.mediumIssues++;
    }
    
    // 6. Low: Data completeness
    const completenessIssue = this.checkDataCompleteness(person);
    if (completenessIssue) {
      personIssues.issues.push(completenessIssue);
      this.stats.lowIssues++;
    }
    
    if (personIssues.issues.length > 0) {
      this.issues.push(personIssues);
    }
  }

  checkLinkedInMismatch(person) {
    if (!person.linkedinUrl || person.linkedinUrl === 'N/A') return null;
    
    if (!person.linkedinUrl.includes('linkedin.com/in/')) {
      return {
        type: 'linkedin_invalid_format',
        severity: 'critical',
        message: `Invalid LinkedIn URL format: ${person.linkedinUrl}`
      };
    }
    
    const urlName = this.extractNameFromLinkedInUrl(person.linkedinUrl);
    if (urlName && person.fullName) {
      const similarity = this.calculateNameSimilarity(urlName, person.fullName);
      if (similarity < 0.6) {
        return {
          type: 'linkedin_name_mismatch',
          severity: 'critical',
          message: `LinkedIn URL name doesn't match person name. URL: ${urlName}, Person: ${person.fullName}`
        };
      }
    }
    
    return null;
  }

  checkCompanyAssociation(person) {
    const company = person.company;
    const companyName = company ? (typeof company === 'string' ? company : company.name) : null;
    
    if (!companyName || companyName === 'Unknown Company' || companyName === '-') {
      return {
        type: 'company_missing',
        severity: 'high',
        message: 'No company association or unknown company'
      };
    }
    
    // Check email domain mismatch
    const email = person.email || person.workEmail;
    if (email) {
      const domain = email.split('@')[1];
      if (domain && !this.emailDomainMatchesCompany(domain, companyName)) {
        return {
          type: 'company_email_mismatch',
          severity: 'high',
          message: `Email domain "${domain}" doesn't match company "${companyName}"`
        };
      }
    }
    
    return null;
  }

  checkSuspiciousTitle(person) {
    const title = person.jobTitle || person.title;
    
    if (!title) return null;
    
    const suspiciousTitles = ['CEO', 'Founder', 'Founder & CEO', 'Founder CEO', 'President', 'Co-Founder'];
    const isSuspicious = suspiciousTitles.some(susp => 
      title.toLowerCase().includes(susp.toLowerCase())
    );
    
    if (isSuspicious) {
      return {
        type: 'title_suspicious',
        severity: 'high',
        message: `Suspicious high-level title: ${title}. Needs verification.`
      };
    }
    
    return null;
  }

  checkMissingData(person) {
    const missing = [];
    
    if (!person.jobTitle && !person.title) missing.push('job title');
    if (!person.email && !person.workEmail) missing.push('email');
    if (!person.phone && !person.mobilePhone && !person.workPhone) missing.push('phone');
    
    if (missing.length > 0) {
      return {
        type: 'missing_critical_data',
        severity: 'medium',
        message: `Missing: ${missing.join(', ')}`
      };
    }
    
    return null;
  }

  checkContactInfo(person) {
    const email = person.email || person.workEmail;
    if (email && !this.isValidEmail(email)) {
      return {
        type: 'invalid_email',
        severity: 'medium',
        message: `Invalid email format: ${email}`
      };
    }
    
    const phone = person.phone || person.mobilePhone || person.workPhone;
    if (phone && phone.length < 10) {
      return {
        type: 'invalid_phone',
        severity: 'medium',
        message: `Invalid phone format: ${phone}`
      };
    }
    
    return null;
  }

  checkDataCompleteness(person) {
    let completeness = 0;
    const fields = ['fullName', 'jobTitle', 'email', 'phone', 'company', 'linkedinUrl'];
    let filled = 0;
    
    fields.forEach(field => {
      if (field === 'company') {
        if (person.company) filled++;
      } else if (person[field]) {
        filled++;
      }
      completeness++;
    });
    
    const score = (filled / fields.length) * 100;
    
    if (score < 50) {
      return {
        type: 'low_completeness',
        severity: 'low',
        message: `Data completeness: ${Math.round(score)}%`
      };
    }
    
    return null;
  }

  prioritizeIssues() {
    this.issues.forEach(issueGroup => {
      issueGroup.issues.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    });
    
    this.issues.sort((a, b) => {
      const aCritical = a.issues.filter(i => i.severity === 'critical').length;
      const bCritical = b.issues.filter(i => i.severity === 'critical').length;
      if (aCritical !== bCritical) return bCritical - aCritical;
      
      const aHigh = a.issues.filter(i => i.severity === 'high').length;
      const bHigh = b.issues.filter(i => i.severity === 'high').length;
      return bHigh - aHigh;
    });
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
    const expectedDomains = [
      normalized,
      normalized.replace(/\s+/g, ''),
      normalized.split(' ')[0]
    ];
    return expectedDomains.some(exp => domain.toLowerCase().includes(exp) || exp.includes(domain.toLowerCase()));
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  generateComprehensiveReport() {
    console.log('\n📋 COMPREHENSIVE AUDIT REPORT');
    console.log('=============================\n');
    
    console.log('📊 SUMMARY:');
    console.log(`Total Records: ${this.stats.totalRecords}`);
    console.log(`Unique Records: ${this.stats.uniqueRecords}`);
    console.log(`Duplicates: ${this.stats.duplicateRecords}`);
    console.log(`\nIssues by Severity:`);
    console.log(`  Critical: ${this.stats.criticalIssues}`);
    console.log(`  High: ${this.stats.highIssues}`);
    console.log(`  Medium: ${this.stats.mediumIssues}`);
    console.log(`  Low: ${this.stats.lowIssues}`);
    console.log(`\nRecords with Issues: ${this.issues.length}`);
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: this.issues
    };
    
    const fs = require('fs');
    const reportPath = `scripts/reports/comprehensive-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const reportsDir = 'scripts/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }
}

const audit = new ComprehensiveDataQualityAudit();
audit.runComprehensiveAudit().catch(console.error);
