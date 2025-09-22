const { PrismaClient } = require('@prisma/client');

class Add5BarsPeople {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
  }

  async execute() {
    console.log('👥 ADDING 5BARS SERVICES PEOPLE TO DATABASE');
    console.log('==========================================');

    try {
      // Get the company data
      const company = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        select: { name: true, customFields: true }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      console.log(`📋 Found company: ${company.name}`);

      // CoreSignal people data
      const coresignalPeople = [
        {
          firstName: 'John',
          lastName: 'Delisi',
          fullName: 'John Delisi',
          title: 'Chief Executive Officer',
          email: 'john.delisi@5bars.net', // Estimated email
          department: 'Executive',
          companyId: this.companyId,
          tags: ['CoreSignal', 'Executive', 'Decision Maker'],
          customFields: {
            coresignalId: 770302196,
            buyerGroupRole: 'Decision Maker',
            influenceLevel: 'High',
            engagementPriority: 'High'
          }
        },
        {
          firstName: 'Dustin',
          lastName: 'Stephens',
          fullName: 'Dustin Stephens',
          title: 'Project Director',
          email: 'dustin.stephens@5bars.net', // Estimated email
          department: 'Operations',
          companyId: this.companyId,
          tags: ['CoreSignal', 'Operations', 'Champion'],
          customFields: {
            coresignalId: 447442560,
            buyerGroupRole: 'Champion',
            influenceLevel: 'High',
            engagementPriority: 'High'
          }
        }
      ];

      console.log(`👥 Adding ${coresignalPeople.length} people from CoreSignal data...`);

      // Add each person to the database
      for (const personData of coresignalPeople) {
        try {
          const person = await this.prisma.people.create({
            data: personData
          });
          console.log(`   ✅ Added: ${person.fullName} (${person.title})`);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`   ⚠️ Person already exists: ${personData.fullName}`);
          } else {
            console.error(`   ❌ Error adding ${personData.fullName}:`, error.message);
          }
        }
      }

      // Update company with buyer group analysis
      const buyerGroupAnalysis = {
        totalMembers: coresignalPeople.length,
        decisionMakers: coresignalPeople.filter(p => p.customFields.buyerGroupRole === 'Decision Maker').length,
        champions: coresignalPeople.filter(p => p.customFields.buyerGroupRole === 'Champion').length,
        influencers: coresignalPeople.filter(p => p.customFields.buyerGroupRole === 'Influencer').length,
        primaryContact: {
          name: 'John Delisi',
          role: 'Decision Maker',
          reason: 'CEO with highest influence',
          engagementApproach: 'Executive-level strategic discussions'
        },
        engagementStrategy: {
          sequence: [
            {
              step: 1,
              person: 'John Delisi',
              role: 'Decision Maker',
              approach: 'Executive-level strategic discussions',
              timeline: '1-2 weeks'
            },
            {
              step: 2,
              person: 'Dustin Stephens',
              role: 'Champion',
              approach: 'Technical solution discussions',
              timeline: '2-3 weeks'
            }
          ]
        },
        analysisDate: new Date().toISOString()
      };

      const updatedCustomFields = {
        ...company.customFields,
        buyerGroupAnalysis: buyerGroupAnalysis
      };

      await this.prisma.companies.update({
        where: { id: this.companyId },
        data: {
          customFields: updatedCustomFields,
          updatedAt: new Date()
        }
      });

      console.log('   ✅ Updated company with buyer group analysis');

      // Get final count
      const peopleCount = await this.prisma.people.count({
        where: { companyId: this.companyId }
      });

      console.log(`\n📊 SUMMARY`);
      console.log(`===========`);
      console.log(`👥 Total people in database for ${company.name}: ${peopleCount}`);
      console.log(`🎯 Decision Makers: ${buyerGroupAnalysis.decisionMakers}`);
      console.log(`🏆 Champions: ${buyerGroupAnalysis.champions}`);
      console.log(`💡 Influencers: ${buyerGroupAnalysis.influencers}`);
      console.log(`🎯 Primary Contact: ${buyerGroupAnalysis.primaryContact.name} (${buyerGroupAnalysis.primaryContact.role})`);

    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Execute the script
new Add5BarsPeople().execute();
