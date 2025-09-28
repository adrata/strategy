require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class AnalyzeTOPWorkspaceData {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async analyzeWorkspace() {
    try {
      console.log('🔍 ANALYZING TOP ENGINEERING PLUS WORKSPACE DATA');
      console.log('================================================');
      
      // Get workspace
      const workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'top-engineers-plus' },
            { name: { contains: 'TOP' } }
          ]
        }
      });
      
      if (!workspace) {
        console.log('❌ TOP Engineering Plus workspace not found');
        return;
      }
      
      console.log('📊 WORKSPACE FOUND:');
      console.log('==================');
      console.log('   ID:', workspace.id);
      console.log('   Name:', workspace.name);
      console.log('   Slug:', workspace.slug);
      console.log('');
      
      // Get all people in this workspace
      const people = await this.prisma.people.findMany({
        where: {
          workspaceId: workspace.id
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          linkedinUrl: true,
          jobTitle: true,
          company: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log('📋 PEOPLE ANALYSIS:');
      console.log('==================');
      console.log('   Total People:', people.length);
      console.log('');
      
      // Email analysis
      const withEmail = people.filter(p => p.email || p.workEmail || p.personalEmail);
      const withWorkEmail = people.filter(p => p.workEmail);
      const withPersonalEmail = people.filter(p => p.personalEmail);
      const withPrimaryEmail = people.filter(p => p.email);
      
      console.log('📧 EMAIL BREAKDOWN:');
      console.log('   With Any Email:', withEmail.length, '(' + Math.round(withEmail.length/people.length*100) + '%)');
      console.log('   With Work Email:', withWorkEmail.length, '(' + Math.round(withWorkEmail.length/people.length*100) + '%)');
      console.log('   With Personal Email:', withPersonalEmail.length, '(' + Math.round(withPersonalEmail.length/people.length*100) + '%)');
      console.log('   With Primary Email:', withPrimaryEmail.length, '(' + Math.round(withPrimaryEmail.length/people.length*100) + '%)');
      console.log('');
      
      // LinkedIn analysis
      const withLinkedIn = people.filter(p => p.linkedinUrl);
      console.log('🔗 LINKEDIN BREAKDOWN:');
      console.log('   With LinkedIn URL:', withLinkedIn.length, '(' + Math.round(withLinkedIn.length/people.length*100) + '%)');
      console.log('');
      
      // Combined analysis
      const withBoth = people.filter(p => (p.email || p.workEmail || p.personalEmail) && p.linkedinUrl);
      const withEmailOnly = people.filter(p => (p.email || p.workEmail || p.personalEmail) && !p.linkedinUrl);
      const withLinkedInOnly = people.filter(p => !(p.email || p.workEmail || p.personalEmail) && p.linkedinUrl);
      const withNeither = people.filter(p => !(p.email || p.workEmail || p.personalEmail) && !p.linkedinUrl);
      
      console.log('📊 COMBINED ANALYSIS:');
      console.log('   Email + LinkedIn:', withBoth.length, '(' + Math.round(withBoth.length/people.length*100) + '%)');
      console.log('   Email Only:', withEmailOnly.length, '(' + Math.round(withEmailOnly.length/people.length*100) + '%)');
      console.log('   LinkedIn Only:', withLinkedInOnly.length, '(' + Math.round(withLinkedInOnly.length/people.length*100) + '%)');
      console.log('   Neither:', withNeither.length, '(' + Math.round(withNeither.length/people.length*100) + '%)');
      console.log('');
      
      // Show sample records
      console.log('📝 SAMPLE RECORDS:');
      console.log('==================');
      
      console.log('\n🔗 WITH LINKEDIN:');
      withLinkedIn.slice(0, 3).forEach((person, i) => {
        console.log('   ' + (i+1) + '. ' + person.fullName);
        console.log('      LinkedIn: ' + person.linkedinUrl);
        console.log('      Email: ' + (person.email || person.workEmail || person.personalEmail || 'None'));
        console.log('      Company: ' + (person.company?.name || 'None'));
        console.log('');
      });
      
      console.log('\n📧 EMAIL ONLY:');
      withEmailOnly.slice(0, 3).forEach((person, i) => {
        console.log('   ' + (i+1) + '. ' + person.fullName);
        console.log('      Email: ' + (person.email || person.workEmail || person.personalEmail || 'None'));
        console.log('      LinkedIn: ' + (person.linkedinUrl || 'None'));
        console.log('      Company: ' + (person.company?.name || 'None'));
        console.log('');
      });
      
      return {
        workspace,
        people,
        analysis: {
          total: people.length,
          withEmail: withEmail.length,
          withLinkedIn: withLinkedIn.length,
          withBoth: withBoth.length,
          withEmailOnly: withEmailOnly.length,
          withLinkedInOnly: withLinkedInOnly.length,
          withNeither: withNeither.length
        }
      };
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the analysis
async function main() {
  const analyzer = new AnalyzeTOPWorkspaceData();
  await analyzer.analyzeWorkspace();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AnalyzeTOPWorkspaceData;
