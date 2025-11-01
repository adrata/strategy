require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class DataQualityPrioritizerAndFixer {
  constructor() {
    this.prisma = prisma;
    this.fixedIssues = [];
    this.manualReviewQueue = [];
    this.errors = [];
  }

  async processAuditResults() {
    console.log('🔧 PROCESSING DATA QUALITY ISSUES');
    console.log('==================================\n');
    
    try {
      // Find the most recent audit report
      const reportsDir = 'scripts/reports';
      const auditFiles = fs.readdirSync(reportsDir)
        .filter(f => f.startsWith('comprehensive-audit-') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (auditFiles.length === 0) {
        console.log('❌ No audit report found. Run comprehensive audit first.');
        return;
      }
      
      const latestAudit = JSON.parse(fs.readFileSync(path.join(reportsDir, auditFiles[0]), 'utf8'));
      console.log(`📊 Processing ${latestAudit.issues.length} records with issues\n`);
      
      // Separate by severity
      const critical = [];
      const high = [];
      const medium = [];
      const low = [];
      
      latestAudit.issues.forEach(issueGroup => {
        const criticalIssues = issueGroup.issues.filter(i => i.severity === 'critical');
        const highIssues = issueGroup.issues.filter(i => i.severity === 'high');
        const mediumIssues = issueGroup.issues.filter(i => i.severity === 'medium');
        const lowIssues = issueGroup.issues.filter(i => i.severity === 'low');
        
        if (criticalIssues.length > 0) critical.push({ ...issueGroup, issues: criticalIssues });
        else if (highIssues.length > 0) high.push({ ...issueGroup, issues: highIssues });
        else if (mediumIssues.length > 0) medium.push({ ...issueGroup, issues: mediumIssues });
        else if (lowIssues.length > 0) low.push({ ...issueGroup, issues: lowIssues });
      });
      
      console.log(`📋 Prioritized Issues:`);
      console.log(`  Critical: ${critical.length}`);
      console.log(`  High: ${high.length}`);
      console.log(`  Medium: ${medium.length}`);
      console.log(`  Low: ${low.length}\n`);
      
      // Apply automated fixes
      await this.applyAutomatedFixes(medium, low);
      
      // Create manual review queue
      this.createManualReviewQueue(critical, high);
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Processing failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async applyAutomatedFixes(mediumIssues, lowIssues) {
    console.log('🤖 APPLYING AUTOMATED FIXES\n');
    
    const allAutoFixable = [...mediumIssues, ...lowIssues];
    
    for (const issueGroup of allAutoFixable) {
      for (const issue of issueGroup.issues) {
        if (this.canAutoFix(issue)) {
          await this.autoFixIssue(issueGroup.personId, issue);
        }
      }
    }
  }

  canAutoFix(issue) {
    // Safe to auto-fix:
    // - Invalid LinkedIn URL formats (set to null)
    // - Invalid email formats (set to null)
    // - Invalid phone formats (set to null)
    const autoFixableTypes = [
      'linkedin_invalid_format',
      'invalid_email',
      'invalid_phone'
    ];
    
    return autoFixableTypes.includes(issue.type);
  }

  async autoFixIssue(personId, issue) {
    try {
      const person = await prisma.people.findUnique({ where: { id: personId } });
      if (!person) return;
      
      const updateData = {};
      
      if (issue.type === 'linkedin_invalid_format') {
        updateData.linkedinUrl = null;
      } else if (issue.type === 'invalid_email') {
        if (person.email === issue.message.split(': ')[1]) {
          updateData.email = null;
        }
        if (person.workEmail === issue.message.split(': ')[1]) {
          updateData.workEmail = null;
        }
      } else if (issue.type === 'invalid_phone') {
        const phoneValue = issue.message.split(': ')[1];
        if (person.phone === phoneValue) updateData.phone = null;
        if (person.mobilePhone === phoneValue) updateData.mobilePhone = null;
        if (person.workPhone === phoneValue) updateData.workPhone = null;
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.customFields = {
          ...person.customFields,
          autoFixed: {
            issue: issue.type,
            fixedAt: new Date().toISOString(),
            originalValue: issue.message.split(': ')[1]
          }
        };
        
        await prisma.people.update({
          where: { id: personId },
          data: updateData
        });
        
        this.fixedIssues.push({
          personId,
          personName: person.fullName,
          issueType: issue.type,
          fix: updateData
        });
        
        console.log(`  ✅ Fixed: ${person.fullName} - ${issue.type}`);
      }
      
    } catch (error) {
      this.errors.push({ personId, error: error.message });
    }
  }

  createManualReviewQueue(criticalIssues, highIssues) {
    console.log('\n📋 CREATING MANUAL REVIEW QUEUE\n');
    
    const allCritical = [...criticalIssues, ...highIssues];
    
    allCritical.forEach(issueGroup => {
      this.manualReviewQueue.push({
        personId: issueGroup.personId,
        personName: issueGroup.personName,
        issues: issueGroup.issues,
        priority: issueGroup.issues[0].severity === 'critical' ? 'P1' : 'P2',
        recommendedAction: this.getRecommendedAction(issueGroup.issues)
      });
    });
    
    // Save queue to file
    const queueData = {
      timestamp: new Date().toISOString(),
      total: this.manualReviewQueue.length,
      critical: this.manualReviewQueue.filter(q => q.priority === 'P1').length,
      high: this.manualReviewQueue.filter(q => q.priority === 'P2').length,
      queue: this.manualReviewQueue
    };
    
    const reportsDir = 'scripts/reports';
    const queuePath = path.join(reportsDir, `manual-review-queue-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    
    fs.writeFileSync(queuePath, JSON.stringify(queueData, null, 2));
    
    console.log(`  ✅ Created manual review queue: ${this.manualReviewQueue.length} records`);
    console.log(`  📄 Saved to: ${queuePath}`);
  }

  getRecommendedAction(issues) {
    const issueTypes = issues.map(i => i.type);
    
    if (issueTypes.includes('linkedin_name_mismatch')) {
      return 'Verify LinkedIn URL manually, clear if wrong person';
    }
    if (issueTypes.includes('company_email_mismatch')) {
      return 'Verify company association, may need to update company';
    }
    if (issueTypes.includes('title_suspicious')) {
      return 'Verify job title against company website or LinkedIn';
    }
    if (issueTypes.includes('company_missing')) {
      return 'Research and add correct company association';
    }
    
    return 'Review all issues and correct as needed';
  }

  generateSummary() {
    console.log('\n📊 SUMMARY\n');
    console.log(`✅ Auto-fixed Issues: ${this.fixedIssues.length}`);
    console.log(`📋 Manual Review Queue: ${this.manualReviewQueue.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
  }
}

const processor = new DataQualityPrioritizerAndFixer();
processor.processAuditResults().catch(console.error);
