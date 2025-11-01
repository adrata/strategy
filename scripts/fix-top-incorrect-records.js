require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class FixTopIncorrectRecords {
  constructor() {
    this.prisma = prisma;
    this.fixedRecords = [];
    this.errors = [];
  }

  async fixReportedIssues() {
    console.log('🔧 FIXING TOP WORKSPACE REPORTED DATA QUALITY ISSUES');
    console.log('====================================================');
    
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
      
      // Fix each reported issue
      await this.fixCarlDarnell(topWorkspace.id);
      await this.fixScottCrawford(topWorkspace.id);
      await this.fixMichaelMorgan(topWorkspace.id);
      await this.fixMilesBrusherd(topWorkspace.id);
      
      // Generate summary report
      this.generateSummaryReport();
      
    } catch (error) {
      console.error('❌ Fix failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async fixCarlDarnell(workspaceId) {
    console.log('\n👤 Fixing Carl Darnell...');
    
    try {
      // Find Carl Darnell
      const person = await prisma.people.findFirst({
        where: {
          workspaceId: workspaceId,
          fullName: { contains: 'Carl Darnell', mode: 'insensitive' }
        }
      });
      
      if (!person) {
        console.log('   ❌ Carl Darnell not found');
        return;
      }
      
      console.log(`   📍 Found: ${person.fullName} (ID: ${person.id})`);
      console.log(`   📧 Current title: ${person.jobTitle || person.title}`);
      console.log(`   🔗 Current LinkedIn: ${person.linkedinUrl}`);
      
      // Clear incorrect Coresignal data and reset to correct information
      const updateData = {
        jobTitle: 'Foreman', // Correct title per Victoria's report
        title: 'Foreman',
        linkedinUrl: null, // Clear incorrect LinkedIn URL
        customFields: {
          ...person.customFields,
          coresignal: null, // Clear incorrect Coresignal data
          dataQualityIssues: {
            reportedBy: 'Victoria',
            reportedDate: new Date().toISOString(),
            issues: [
              'LinkedIn URL pointed to wrong person (Carl-Herbert Rokitansky)',
              'Title incorrectly showed CEO instead of Foreman',
              'Correct CEO is Duane Highley per company website'
            ],
            fixed: true,
            fixedDate: new Date().toISOString()
          }
        },
        updatedAt: new Date()
      };
      
      await prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   ✅ Fixed Carl Darnell');
      console.log('      - Set correct title: Foreman');
      console.log('      - Cleared incorrect LinkedIn URL');
      console.log('      - Cleared incorrect Coresignal data');
      console.log('      - Added data quality issue documentation');
      
      this.fixedRecords.push({
        name: person.fullName,
        id: person.id,
        fixes: ['title', 'linkedin', 'coresignal_data']
      });
      
    } catch (error) {
      console.log(`   ❌ Error fixing Carl Darnell: ${error.message}`);
      this.errors.push({ person: 'Carl Darnell', error: error.message });
    }
  }

  async fixScottCrawford(workspaceId) {
    console.log('\n👤 Fixing Scott Crawford...');
    
    try {
      // Find Scott Crawford
      const person = await prisma.people.findFirst({
        where: {
          workspaceId: workspaceId,
          fullName: { contains: 'Scott Crawford', mode: 'insensitive' }
        }
      });
      
      if (!person) {
        console.log('   ❌ Scott Crawford not found');
        return;
      }
      
      console.log(`   📍 Found: ${person.fullName} (ID: ${person.id})`);
      console.log(`   📧 Current title: ${person.jobTitle || person.title}`);
      console.log(`   🔗 Current LinkedIn: ${person.linkedinUrl}`);
      
      // Clear incorrect data - person doesn't exist at company
      const updateData = {
        jobTitle: null, // Clear incorrect title
        title: null,
        linkedinUrl: null, // Clear incorrect LinkedIn URL
        customFields: {
          ...person.customFields,
          coresignal: null, // Clear incorrect Coresignal data
          dataQualityIssues: {
            reportedBy: 'Victoria',
            reportedDate: new Date().toISOString(),
            issues: [
              'LinkedIn URL pointed to wrong person (Stuart M. Crawford)',
              'Person does not exist at Western Area Power Administration',
              'Correct CEO is Tracey LeBeau per company website'
            ],
            fixed: true,
            fixedDate: new Date().toISOString(),
            action: 'Person does not exist at company - data cleared'
          }
        },
        updatedAt: new Date()
      };
      
      await prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   ✅ Fixed Scott Crawford');
      console.log('      - Cleared incorrect title (person doesn\'t exist at company)');
      console.log('      - Cleared incorrect LinkedIn URL');
      console.log('      - Cleared incorrect Coresignal data');
      console.log('      - Added data quality issue documentation');
      
      this.fixedRecords.push({
        name: person.fullName,
        id: person.id,
        fixes: ['title', 'linkedin', 'coresignal_data']
      });
      
    } catch (error) {
      console.log(`   ❌ Error fixing Scott Crawford: ${error.message}`);
      this.errors.push({ person: 'Scott Crawford', error: error.message });
    }
  }

  async fixMichaelMorgan(workspaceId) {
    console.log('\n👤 Fixing Michael Morgan...');
    
    try {
      // Find Michael Morgan
      const person = await prisma.people.findFirst({
        where: {
          workspaceId: workspaceId,
          fullName: { contains: 'Michael Morgan', mode: 'insensitive' }
        }
      });
      
      if (!person) {
        console.log('   ❌ Michael Morgan not found');
        return;
      }
      
      console.log(`   📍 Found: ${person.fullName} (ID: ${person.id})`);
      console.log(`   📧 Current title: ${person.jobTitle || person.title}`);
      console.log(`   🔗 Current LinkedIn: ${person.linkedinUrl}`);
      
      // Clear incorrect data - LinkedIn points to wrong person
      const updateData = {
        jobTitle: null, // Clear incorrect title
        title: null,
        linkedinUrl: null, // Clear incorrect LinkedIn URL
        customFields: {
          ...person.customFields,
          coresignal: null, // Clear incorrect Coresignal data
          dataQualityIssues: {
            reportedBy: 'Victoria',
            reportedDate: new Date().toISOString(),
            issues: [
              'LinkedIn URL pointed to wrong person (Michael Morgan at Midrange Dynamics)',
              'Title incorrectly showed Founder & CEO',
              'Correct CEO is Calvin Butler per company website'
            ],
            fixed: true,
            fixedDate: new Date().toISOString()
          }
        },
        updatedAt: new Date()
      };
      
      await prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   ✅ Fixed Michael Morgan');
      console.log('      - Cleared incorrect title');
      console.log('      - Cleared incorrect LinkedIn URL');
      console.log('      - Cleared incorrect Coresignal data');
      console.log('      - Added data quality issue documentation');
      
      this.fixedRecords.push({
        name: person.fullName,
        id: person.id,
        fixes: ['title', 'linkedin', 'coresignal_data']
      });
      
    } catch (error) {
      console.log(`   ❌ Error fixing Michael Morgan: ${error.message}`);
      this.errors.push({ person: 'Michael Morgan', error: error.message });
    }
  }

  async fixMilesBrusherd(workspaceId) {
    console.log('\n👤 Fixing Miles Brusherd...');
    
    try {
      // Find Miles Brusherd (might be "MBA Miles Brusherd")
      const person = await prisma.people.findFirst({
        where: {
          workspaceId: workspaceId,
          OR: [
            { fullName: { contains: 'Miles Brusherd', mode: 'insensitive' } },
            { fullName: { contains: 'MBA Miles Brusherd', mode: 'insensitive' } }
          ]
        }
      });
      
      if (!person) {
        console.log('   ❌ Miles Brusherd not found');
        return;
      }
      
      console.log(`   📍 Found: ${person.fullName} (ID: ${person.id})`);
      console.log(`   📧 Current title: ${person.jobTitle || person.title}`);
      console.log(`   🔗 Current LinkedIn: ${person.linkedinUrl}`);
      
      // Fix title - he's a Contract Administrator, not CEO & Founder
      const updateData = {
        jobTitle: 'Contract Administrator', // Correct title per Victoria's report
        title: 'Contract Administrator',
        customFields: {
          ...person.customFields,
          dataQualityIssues: {
            reportedBy: 'Victoria',
            reportedDate: new Date().toISOString(),
            issues: [
              'Title incorrectly showed CEO & Founder',
              'Correct title is Contract Administrator',
              'Correct CEO is Jason Marshall per company website'
            ],
            fixed: true,
            fixedDate: new Date().toISOString()
          }
        },
        updatedAt: new Date()
      };
      
      await prisma.people.update({
        where: { id: person.id },
        data: updateData
      });
      
      console.log('   ✅ Fixed Miles Brusherd');
      console.log('      - Set correct title: Contract Administrator');
      console.log('      - Added data quality issue documentation');
      
      this.fixedRecords.push({
        name: person.fullName,
        id: person.id,
        fixes: ['title']
      });
      
    } catch (error) {
      console.log(`   ❌ Error fixing Miles Brusherd: ${error.message}`);
      this.errors.push({ person: 'Miles Brusherd', error: error.message });
    }
  }

  generateSummaryReport() {
    console.log('\n📋 FIX SUMMARY REPORT');
    console.log('=====================');
    
    console.log(`\n✅ Successfully Fixed: ${this.fixedRecords.length} records`);
    this.fixedRecords.forEach(record => {
      console.log(`   👤 ${record.name} (ID: ${record.id})`);
      console.log(`      Fixed: ${record.fixes.join(', ')}`);
    });
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.errors.length}`);
      this.errors.forEach(error => {
        console.log(`   👤 ${error.person}: ${error.error}`);
      });
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      fixedRecords: this.fixedRecords,
      errors: this.errors,
      summary: {
        totalFixed: this.fixedRecords.length,
        totalErrors: this.errors.length
      }
    };
    
    const fs = require('fs');
    const reportPath = `scripts/reports/top-fix-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    // Ensure reports directory exists
    const reportsDir = 'scripts/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }
}

// Run the fix
const fixer = new FixTopIncorrectRecords();
fixer.fixReportedIssues().catch(console.error);
