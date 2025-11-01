require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class TopSpeedrunDataQualityAudit {
  constructor() {
    this.prisma = prisma;
    this.issues = [];
    this.stats = {
      totalRecords: 0,
      duplicateRecords: 0,
      linkedinIssues: 0,
      titleIssues: 0,
      companyIssues: 0,
      validationFailures: 0
    };
  }

  async runAudit() {
    console.log('🔍 TOP SPEEDRUN DATA QUALITY AUDIT');
    console.log('=====================================');
    
    try {
      console.log('🔧 Debug: prisma instance:', typeof prisma);
      console.log('🔧 Debug: prisma.workspaces:', typeof prisma.workspaces);
      
      // Get TOP workspace ID
      const topWorkspace = await prisma.workspaces.findFirst({
        where: { name: { contains: 'TOP', mode: 'insensitive' } }
      });
      
      if (!topWorkspace) {
        console.log('❌ TOP workspace not found');
        return;
      }
      
      console.log(`📊 Found TOP workspace: ${topWorkspace.name} (ID: ${topWorkspace.id})`);
      
      // Get all people in TOP workspace - filter out duplicates
      // First, identify unique records by email+name or name only
      const allPeople = await prisma.people.findMany({
        where: { workspaceId: topWorkspace.id },
        include: {
          company: true
        },
        orderBy: { createdAt: 'asc' } // Prefer older records
      });
      
      // Filter duplicates - keep the first occurrence of each unique person
      const seenKeys = new Set();
      const uniquePeople = [];
      
      for (const person of allPeople) {
        // Create a unique key: email+name if email exists, otherwise just name
        const key = person.email 
          ? `${person.email.toLowerCase()}_${person.fullName.toLowerCase()}`
          : person.fullName.toLowerCase();
        
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniquePeople.push(person);
        }
      }
      
      console.log(`📈 Found ${allPeople.length} total records, ${uniquePeople.length} unique records`);
      console.log(`📊 Filtered out ${allPeople.length - uniquePeople.length} duplicate records`);
      console.log(`📈 Auditing ${uniquePeople.length} unique people records...`);
      this.stats.totalRecords = uniquePeople.length;
      this.stats.duplicateRecords = allPeople.length - uniquePeople.length;
      
      // Audit each unique person
      for (const person of uniquePeople) {
        await this.auditPerson(person);
      }
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async auditPerson(person) {
    console.log(`\n👤 Auditing: ${person.fullName || person.name}`);
    
    const personIssues = {
      personId: person.id,
      personName: person.fullName || person.name,
      issues: []
    };
    
    // 1. Check LinkedIn URL validity and matching
    if (person.linkedinUrl) {
      const linkedinIssue = this.validateLinkedInUrl(person);
      if (linkedinIssue) {
        personIssues.issues.push(linkedinIssue);
        this.stats.linkedinIssues++;
      }
    }
    
    // 2. Check title accuracy
    const titleIssue = this.validateJobTitle(person);
    if (titleIssue) {
      personIssues.issues.push(titleIssue);
      this.stats.titleIssues++;
    }
    
    // 3. Check company association
    const companyIssue = this.validateCompanyAssociation(person);
    if (companyIssue) {
      personIssues.issues.push(companyIssue);
      this.stats.companyIssues++;
    }
    
    // 4. Check Coresignal data quality
    const coresignalIssue = this.validateCoresignalData(person);
    if (coresignalIssue) {
      personIssues.issues.push(coresignalIssue);
      this.stats.validationFailures++;
    }
    
    // 5. Check for the specific reported issues
    const reportedIssue = this.checkReportedIssues(person);
    if (reportedIssue) {
      personIssues.issues.push(reportedIssue);
    }
    
    if (personIssues.issues.length > 0) {
      this.issues.push(personIssues);
    }
  }

  validateLinkedInUrl(person) {
    const linkedinUrl = person.linkedinUrl;
    
    // Check if URL is valid
    if (!linkedinUrl.includes('linkedin.com/in/')) {
      return {
        type: 'linkedin_invalid',
        severity: 'high',
        message: `Invalid LinkedIn URL format: ${linkedinUrl}`,
        currentValue: linkedinUrl
      };
    }
    
    // Check if URL is complete (not truncated)
    if (linkedinUrl.length < 30) {
      return {
        type: 'linkedin_incomplete',
        severity: 'medium',
        message: `LinkedIn URL appears incomplete: ${linkedinUrl}`,
        currentValue: linkedinUrl
      };
    }
    
    // Check if URL matches person name (basic check)
    const urlName = this.extractNameFromLinkedInUrl(linkedinUrl);
    const personName = person.fullName || person.name;
    
    if (urlName && personName) {
      const similarity = this.calculateNameSimilarity(urlName, personName);
      if (similarity < 0.6) {
        return {
          type: 'linkedin_name_mismatch',
          severity: 'high',
          message: `LinkedIn URL name doesn't match person name. URL: ${urlName}, Person: ${personName}`,
          currentValue: linkedinUrl,
          expectedValue: personName
        };
      }
    }
    
    return null;
  }

  validateJobTitle(person) {
    const title = person.jobTitle || person.title;
    
    if (!title || title === 'Unknown Title' || title === '-') {
      return {
        type: 'title_missing',
        severity: 'medium',
        message: 'Job title is missing or unknown',
        currentValue: title
      };
    }
    
    // Check for suspicious CEO/Founder titles
    const suspiciousTitles = ['CEO', 'Founder', 'Founder & CEO', 'Founder CEO'];
    const isSuspicious = suspiciousTitles.some(suspicious => 
      title.toLowerCase().includes(suspicious.toLowerCase())
    );
    
    if (isSuspicious) {
      return {
        type: 'title_suspicious',
        severity: 'high',
        message: `Suspicious high-level title: ${title}. Needs verification.`,
        currentValue: title
      };
    }
    
    return null;
  }

  validateCompanyAssociation(person) {
    const company = person.company;
    
    if (!company) {
      return {
        type: 'company_missing',
        severity: 'medium',
        message: 'No company association found',
        currentValue: null
      };
    }
    
    const companyName = typeof company === 'string' ? company : company.name;
    
    if (!companyName || companyName === 'Unknown Company' || companyName === '-') {
      return {
        type: 'company_unknown',
        severity: 'medium',
        message: 'Company name is unknown or missing',
        currentValue: companyName
      };
    }
    
    return null;
  }

  validateCoresignalData(person) {
    const coresignalData = person.customFields?.coresignal;
    
    if (!coresignalData) {
      return null; // No Coresignal data to validate
    }
    
    const issues = [];
    
    // Check if Coresignal LinkedIn URL matches person LinkedIn URL
    if (coresignalData.linkedin_url && person.linkedinUrl) {
      if (coresignalData.linkedin_url !== person.linkedinUrl) {
        issues.push({
          type: 'coresignal_linkedin_mismatch',
          severity: 'high',
          message: 'Coresignal LinkedIn URL differs from person LinkedIn URL',
          coresignalValue: coresignalData.linkedin_url,
          personValue: person.linkedinUrl
        });
      }
    }
    
    // Check if Coresignal title matches person title
    if (coresignalData.active_experience_title && person.jobTitle) {
      const coresignalTitle = coresignalData.active_experience_title;
      const personTitle = person.jobTitle;
      
      if (coresignalTitle !== personTitle) {
        issues.push({
          type: 'coresignal_title_mismatch',
          severity: 'medium',
          message: 'Coresignal title differs from person title',
          coresignalValue: coresignalTitle,
          personValue: personTitle
        });
      }
    }
    
    // Check if Coresignal company matches person company
    if (coresignalData.active_experience_company && person.company) {
      const coresignalCompany = coresignalData.active_experience_company;
      const personCompany = typeof person.company === 'string' ? person.company : person.company.name;
      
      if (coresignalCompany !== personCompany) {
        issues.push({
          type: 'coresignal_company_mismatch',
          severity: 'medium',
          message: 'Coresignal company differs from person company',
          coresignalValue: coresignalCompany,
          personValue: personCompany
        });
      }
    }
    
    return issues.length > 0 ? issues : null;
  }

  checkReportedIssues(person) {
    const name = person.fullName || person.name;
    
    // Check for the specific reported issues
    const reportedNames = [
      'Carl Darnell',
      'Scott Crawford', 
      'Michael Morgan',
      'Miles Brusherd'
    ];
    
    const isReportedIssue = reportedNames.some(reportedName => 
      name.toLowerCase().includes(reportedName.toLowerCase())
    );
    
    if (isReportedIssue) {
      return {
        type: 'reported_issue',
        severity: 'critical',
        message: `This person was specifically reported by Victoria as having incorrect data`,
        personName: name,
        currentTitle: person.jobTitle || person.title,
        currentLinkedIn: person.linkedinUrl,
        currentCompany: typeof person.company === 'string' ? person.company : person.company?.name
      };
    }
    
    return null;
  }

  extractNameFromLinkedInUrl(url) {
    try {
      const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  calculateNameSimilarity(name1, name2) {
    const normalize = (name) => name.toLowerCase().replace(/[^a-z\s]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Simple similarity based on common words
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  generateReport() {
    console.log('\n📋 AUDIT REPORT');
    console.log('================');
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Records (before dedup): ${this.stats.totalRecords + this.stats.duplicateRecords}`);
    console.log(`Unique Records: ${this.stats.totalRecords}`);
    console.log(`Duplicate Records Filtered: ${this.stats.duplicateRecords}`);
    console.log(`LinkedIn Issues: ${this.stats.linkedinIssues}`);
    console.log(`Title Issues: ${this.stats.titleIssues}`);
    console.log(`Company Issues: ${this.stats.companyIssues}`);
    console.log(`Validation Failures: ${this.stats.validationFailures}`);
    console.log(`Records with Issues: ${this.issues.length}`);
    
    console.log(`\n🚨 CRITICAL ISSUES (Reported by Victoria):`);
    const criticalIssues = this.issues.filter(issue => 
      issue.issues.some(i => i.type === 'reported_issue')
    );
    
    criticalIssues.forEach(issue => {
      console.log(`\n👤 ${issue.personName}:`);
      issue.issues.forEach(i => {
        if (i.type === 'reported_issue') {
          console.log(`   ❌ ${i.message}`);
          console.log(`      Current Title: ${i.currentTitle}`);
          console.log(`      Current LinkedIn: ${i.currentLinkedIn}`);
          console.log(`      Current Company: ${i.currentCompany}`);
        }
      });
    });
    
    console.log(`\n⚠️ HIGH SEVERITY ISSUES:`);
    const highIssues = this.issues.filter(issue => 
      issue.issues.some(i => i.severity === 'high')
    );
    
    highIssues.forEach(issue => {
      console.log(`\n👤 ${issue.personName}:`);
      issue.issues.forEach(i => {
        if (i.severity === 'high') {
          console.log(`   🔴 ${i.type}: ${i.message}`);
          if (i.currentValue) console.log(`      Current: ${i.currentValue}`);
          if (i.expectedValue) console.log(`      Expected: ${i.expectedValue}`);
        }
      });
    });
    
    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: this.issues
    };
    
    const fs = require('fs');
    const reportPath = `scripts/reports/top-speedrun-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    // Ensure reports directory exists
    const reportsDir = 'scripts/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }
}

// Run the audit
const audit = new TopSpeedrunDataQualityAudit();
audit.runAudit().catch(console.error);
