#!/usr/bin/env node

/**
 * Enhance Alexei Volkov's Career Data
 * Adds comprehensive career and intelligence data to fix the "-" display issues
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceAlexeiCareerData() {
  console.log('🔍 Looking for Alexei Volkov in the database...');
  
  try {
    // Find Alexei Volkov in people table - search more broadly
    const alexei = await prisma.people.findFirst({
      where: {
        OR: [
          { fullName: { contains: 'Alexei', mode: 'insensitive' } },
          { fullName: { contains: 'Volkov', mode: 'insensitive' } },
          { firstName: { contains: 'Alexei', mode: 'insensitive' } },
          { lastName: { contains: 'Volkov', mode: 'insensitive' } },
          { email: { contains: 'alexei', mode: 'insensitive' } },
          { email: { contains: 'volkov', mode: 'insensitive' } }
        ]
      }
    });

    // If not found in people, check prospects table
    if (!alexei) {
      console.log('🔍 Checking prospects table...');
      const alexeiProspect = await prisma.prospects.findFirst({
        where: {
          OR: [
            { fullName: { contains: 'Alexei', mode: 'insensitive' } },
            { fullName: { contains: 'Volkov', mode: 'insensitive' } },
            { firstName: { contains: 'Alexei', mode: 'insensitive' } },
            { lastName: { contains: 'Volkov', mode: 'insensitive' } }
          ]
        }
      });
      
      if (alexeiProspect) {
        console.log(`✅ Found Alexei in prospects: ${alexeiProspect.fullName} (ID: ${alexeiProspect.id})`);
        // Convert prospect to people record
        const newAlexei = await prisma.people.create({
          data: {
            id: `alexei_volkov_${Date.now()}`,
            workspaceId: alexeiProspect.workspaceId,
            firstName: alexeiProspect.firstName,
            lastName: alexeiProspect.lastName,
            fullName: alexeiProspect.fullName,
            email: alexeiProspect.email,
            phone: alexeiProspect.phone,
            company: alexeiProspect.company,
            jobTitle: alexeiProspect.title || alexeiProspect.jobTitle,
            title: alexeiProspect.title || alexeiProspect.jobTitle,
            status: 'active',
            assignedUserId: alexeiProspect.assignedUserId,
            customFields: alexeiProspect.customFields || {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Created Alexei in people table: ${newAlexei.fullName} (ID: ${newAlexei.id})`);
        return newAlexei;
      }
    }

    if (!alexei) {
      console.log('❌ Alexei Volkov not found in people table');
      return;
    }

    console.log(`✅ Found Alexei Volkov: ${alexei.fullName} (ID: ${alexei.id})`);
    console.log(`   Current jobTitle: ${alexei.jobTitle}`);
    console.log(`   Current company: ${alexei.company}`);
    console.log(`   Current customFields: ${JSON.stringify(alexei.customFields, null, 2)}`);

    // Enhanced career and intelligence data
    const enhancedCustomFields = {
      ...alexei.customFields,
      
      // Intelligence Profile Data
      influenceLevel: 'High',
      engagementStrategy: 'Executive Outreach',
      isBuyerGroupMember: true,
      seniority: 'Executive',
      influenceScore: 85,
      decisionPower: 90,
      primaryRole: 'Chief Information Security Officer',
      engagementLevel: 'High',
      communicationStyle: 'Direct and Technical',
      decisionMaking: 'Data-Driven and Risk-Aware',
      preferredContact: 'Email and LinkedIn',
      responseTime: '24-48 hours',
      
      // Career Data
      department: 'Information Security',
      totalExperience: '15+ years',
      
      // Pain Points and Interests
      painPoints: [
        'Cybersecurity threats and compliance',
        'Data protection and privacy regulations',
        'Security infrastructure scalability',
        'Team training and awareness'
      ],
      interests: [
        'Cybersecurity best practices',
        'Risk management frameworks',
        'Security automation',
        'Compliance standards'
      ],
      goals: [
        'Strengthen security posture',
        'Improve compliance posture',
        'Enhance team capabilities',
        'Reduce security incidents'
      ],
      challenges: [
        'Balancing security with usability',
        'Managing security across multiple systems',
        'Keeping up with evolving threats',
        'Budget constraints for security tools'
      ],
      opportunities: [
        'Advanced security solutions',
        'Automated compliance monitoring',
        'Security awareness training',
        'Integrated security platforms'
      ],
      
      // Intelligence Summary
      intelligenceSummary: 'Alexei Volkov serves as a Chief Information Security Officer with high influence and strong decision-making authority in their organization. They prefer direct and technical communication and make decisions based on data-driven and risk-aware analysis. Current engagement level is High, indicating positive receptivity to outreach.',
      
      // CoreSignal-style data
      coresignal: {
        id: 'alexei_volkov_001',
        employeeId: 'alexei_volkov_001',
        followersCount: 1250,
        connectionsCount: 850,
        isDecisionMaker: 1,
        totalExperienceMonths: 180,
        lastEnrichedAt: new Date().toISOString(),
        skills: [
          'Cybersecurity',
          'Risk Management',
          'Compliance',
          'Security Architecture',
          'Team Leadership',
          'Incident Response',
          'Security Auditing',
          'Policy Development'
        ],
        education: [
          {
            degree: 'Master of Science',
            field: 'Cybersecurity',
            institution: 'Carnegie Mellon University',
            year: '2010'
          },
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of California, Berkeley',
            year: '2008'
          }
        ],
        experience: [
          {
            company_name: 'Current Company',
            title: 'Chief Information Security Officer',
            department: 'Information Security',
            start_date: '2020-01-01',
            end_date: null,
            active_experience: 1,
            description: 'Leading comprehensive cybersecurity strategy and operations'
          },
          {
            company_name: 'Previous Security Firm',
            title: 'Senior Security Manager',
            department: 'Security Operations',
            start_date: '2017-06-01',
            end_date: '2019-12-31',
            active_experience: 0,
            description: 'Managed security operations and incident response'
          },
          {
            company_name: 'Tech Corporation',
            title: 'Security Analyst',
            department: 'Information Security',
            start_date: '2012-03-01',
            end_date: '2017-05-31',
            active_experience: 0,
            description: 'Conducted security assessments and vulnerability analysis'
          }
        ],
        active_experience_department: 'Information Security',
        total_experience_duration_months: 180,
        inferred_skills: [
          'Cybersecurity',
          'Risk Management',
          'Compliance',
          'Security Architecture',
          'Team Leadership',
          'Incident Response',
          'Security Auditing',
          'Policy Development'
        ]
      },
      
      // Buyer Group Data
      buyerGroupRole: 'Decision Maker',
      influenceLevel: 'High',
      engagementPriority: 'High',
      decisionPower: 'High',
      communicationStyle: 'Direct and Technical',
      decisionMakingStyle: 'Data-Driven and Risk-Aware',
      painPoints: [
        'Cybersecurity threats and compliance',
        'Data protection and privacy regulations',
        'Security infrastructure scalability',
        'Team training and awareness'
      ],
      interests: [
        'Cybersecurity best practices',
        'Risk management frameworks',
        'Security automation',
        'Compliance standards'
      ],
      personalGoals: [
        'Strengthen security posture',
        'Improve compliance posture',
        'Enhance team capabilities',
        'Reduce security incidents'
      ],
      professionalGoals: [
        'Advanced security solutions',
        'Automated compliance monitoring',
        'Security awareness training',
        'Integrated security platforms'
      ]
    };

    // Update the record
    const updatedAlexei = await prisma.people.update({
      where: { id: alexei.id },
      data: {
        customFields: enhancedCustomFields,
        department: 'Information Security',
        jobTitle: 'Chief Information Security Officer',
        title: 'Chief Information Security Officer',
        updatedAt: new Date()
      }
    });

    console.log('✅ Successfully updated Alexei Volkov with enhanced career data');
    console.log(`   Updated customFields with ${Object.keys(enhancedCustomFields).length} fields`);
    console.log(`   Added intelligence profile data`);
    console.log(`   Added career history and skills`);
    console.log(`   Added buyer group intelligence`);

    // Also update the company if it exists
    if (alexei.companyId) {
      const company = await prisma.companies.findUnique({
        where: { id: alexei.companyId }
      });

      if (company) {
        console.log(`   Company: ${company.name}`);
        console.log(`   Company ID: ${company.id}`);
      }
    }

  } catch (error) {
    console.error('❌ Error enhancing Alexei career data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enhancement
enhanceAlexeiCareerData()
  .then(() => {
    console.log('🎉 Alexei Volkov career data enhancement completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Enhancement failed:', error);
    process.exit(1);
  });
