#!/usr/bin/env node

/**
 * Audit and Enhance Demo Data Script
 * 
 * This script audits all demo data and enhances it for a go-to-market strategy company demo.
 * It ensures all data is realistic, comprehensive, and professional.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ZEROPOINT_WORKSPACE_ID = 'zeropoint-demo-2025';

async function auditAndEnhanceDemoData() {
  console.log('🔍 Starting comprehensive demo data audit and enhancement...');

  try {
    // 1. Audit and enhance sellers data
    console.log('👥 Auditing and enhancing sellers data...');
    
    const sellers = await prisma.people.findMany({
      where: {
        workspaceId: ZEROPOINT_WORKSPACE_ID,
        role: {
          contains: 'seller'
        }
      }
    });

    console.log(`Found ${sellers.length} sellers`);

    // Enhanced seller data for go-to-market strategy company
    const enhancedSellers = [
      {
        name: 'Kirk Harbaugh',
        title: 'Senior Account Executive',
        region: 'Enterprise West',
        activeBuyerGroups: 40,
        maxBuyerGroups: 50,
        dmEngagement: 89,
        stakeholders: 213,
        pacing: 'Ahead',
        percentToGoal: 105,
        email: 'kirk.harbaugh@adrata.com',
        phone: '+1 (555) 123-4567',
        department: 'Enterprise Sales',
        seniority: 'Senior',
        linkedinUrl: 'https://linkedin.com/in/kirkharbaugh',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States'
      },
      {
        name: 'Sarah Chen',
        title: 'Strategic Account Manager',
        region: 'Fortune 500',
        activeBuyerGroups: 42,
        maxBuyerGroups: 60,
        dmEngagement: 92,
        stakeholders: 341,
        pacing: 'On Track',
        percentToGoal: 95,
        email: 'sarah.chen@adrata.com',
        phone: '+1 (555) 234-5678',
        department: 'Strategic Accounts',
        seniority: 'Senior',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        city: 'New York',
        state: 'NY',
        country: 'United States'
      },
      {
        name: 'Marcus Rodriguez',
        title: 'Enterprise Sales Director',
        region: 'Financial Services',
        activeBuyerGroups: 38,
        maxBuyerGroups: 45,
        dmEngagement: 85,
        stakeholders: 187,
        pacing: 'Ahead',
        percentToGoal: 115,
        email: 'marcus.rodriguez@adrata.com',
        phone: '+1 (555) 345-6789',
        department: 'Enterprise Sales',
        seniority: 'Director',
        linkedinUrl: 'https://linkedin.com/in/marcusrodriguez',
        city: 'Chicago',
        state: 'IL',
        country: 'United States'
      },
      {
        name: 'Amanda Thompson',
        title: 'Account Executive',
        region: 'Technology Sector',
        activeBuyerGroups: 29,
        maxBuyerGroups: 40,
        dmEngagement: 78,
        stakeholders: 134,
        pacing: 'On Track',
        percentToGoal: 88,
        email: 'amanda.thompson@adrata.com',
        phone: '+1 (555) 456-7890',
        department: 'Technology Sales',
        seniority: 'Mid-Level',
        linkedinUrl: 'https://linkedin.com/in/amandathompson',
        city: 'Austin',
        state: 'TX',
        country: 'United States'
      }
    ];

    for (let i = 0; i < sellers.length && i < enhancedSellers.length; i++) {
      const seller = sellers[i];
      const enhanced = enhancedSellers[i];
      
      await prisma.people.update({
        where: { id: seller.id },
        data: {
          fullName: enhanced.name,
          firstName: enhanced.name.split(' ')[0],
          lastName: enhanced.name.split(' ')[1],
          jobTitle: enhanced.title,
          email: enhanced.email,
          phone: enhanced.phone,
          department: enhanced.department,
          seniority: enhanced.seniority,
          linkedinUrl: enhanced.linkedinUrl,
          city: enhanced.city,
          state: enhanced.state,
          country: enhanced.country,
          notes: JSON.stringify({
            region: enhanced.region,
            activeBuyerGroups: enhanced.activeBuyerGroups,
            maxBuyerGroups: enhanced.maxBuyerGroups,
            dmEngagement: enhanced.dmEngagement,
            stakeholders: enhanced.stakeholders,
            pacing: enhanced.pacing,
            percentToGoal: enhanced.percentToGoal,
            isOnline: Math.random() > 0.3 // 70% chance of being online
          })
        }
      });
    }

    // 2. Audit and enhance buyer group members
    console.log('👥 Auditing and enhancing buyer group members...');
    
    const buyerGroupMembers = [
      {
        name: 'James Wilson',
        title: 'Director Platform Architecture',
        email: 'james.wilson@adp.com',
        phone: '+1 (973) 974-5101',
        department: 'Engineering',
        role: 'Decision Maker',
        engagement: 'Interested 3/5',
        riskStatus: '',
        fallbackRole: '',
        influence: 85,
        decisionPower: 90,
        linkedinUrl: 'https://linkedin.com/in/jameswilson-adp',
        city: 'Roseland',
        state: 'NJ',
        country: 'United States',
        seniority: 'Director',
        company: 'ADP'
      },
      {
        name: 'Sarah Rodriguez',
        title: 'VP of Engineering',
        email: 'sarah.rodriguez@adp.com',
        phone: '+1 (973) 974-5102',
        department: 'Engineering',
        role: 'Champion',
        engagement: 'Warming',
        riskStatus: 'At Risk of Leaving 3/5',
        fallbackRole: '',
        influence: 75,
        decisionPower: 80,
        linkedinUrl: 'https://linkedin.com/in/sarahrodriguez-adp',
        city: 'Roseland',
        state: 'NJ',
        country: 'United States',
        seniority: 'VP',
        company: 'ADP'
      },
      {
        name: 'Kevin Zhang',
        title: 'Sr. Manager Cloud Infrastructure',
        email: 'kevin.zhang@adp.com',
        phone: '+1 (973) 974-5103',
        department: 'Engineering',
        role: 'Champion',
        engagement: 'Interested 4/5',
        riskStatus: '',
        fallbackRole: 'Fallback',
        influence: 70,
        decisionPower: 65,
        linkedinUrl: 'https://linkedin.com/in/kevinzhang-adp',
        city: 'Roseland',
        state: 'NJ',
        country: 'United States',
        seniority: 'Senior Manager',
        company: 'ADP'
      },
      {
        name: 'Patricia Kim',
        title: 'Sr. Director Tech Procurement',
        email: 'patricia.kim@adp.com',
        phone: '+1 (973) 974-5104',
        department: 'Procurement',
        role: 'Stakeholder',
        engagement: 'Interested 4/5',
        riskStatus: '',
        fallbackRole: '',
        influence: 60,
        decisionPower: 70,
        linkedinUrl: 'https://linkedin.com/in/patriciakim-adp',
        city: 'Roseland',
        state: 'NJ',
        country: 'United States',
        seniority: 'Senior Director',
        company: 'ADP'
      },
      {
        name: 'Michael Chen',
        title: 'CTO',
        email: 'michael.chen@adp.com',
        phone: '+1 (973) 974-5105',
        department: 'Engineering',
        role: 'Decision Maker',
        engagement: 'Neutral 1/5',
        riskStatus: '',
        fallbackRole: '',
        influence: 95,
        decisionPower: 95,
        linkedinUrl: 'https://linkedin.com/in/michaelchen-adp',
        city: 'Roseland',
        state: 'NJ',
        country: 'United States',
        seniority: 'C-Level',
        company: 'ADP'
      }
    ];

    // Find or create ADP company
    let adpCompany = await prisma.companies.findFirst({
      where: {
        name: 'ADP',
        workspaceId: ZEROPOINT_WORKSPACE_ID
      }
    });

    if (!adpCompany) {
      adpCompany = await prisma.companies.create({
        data: {
          id: `01${Math.random().toString(36).substr(2, 24)}`,
          name: 'ADP',
          workspaceId: ZEROPOINT_WORKSPACE_ID,
          sector: 'Human Resources & Payroll',
          website: 'adp.com',
          size: '5000+',
          city: 'Roseland',
          state: 'NJ',
          country: 'United States',
          notes: 'Automatic Data Processing, Inc. is a global provider of cloud-based human capital management solutions.'
        }
      });
    }

    // Update or create buyer group members
    for (const member of buyerGroupMembers) {
      const existingPerson = await prisma.people.findFirst({
        where: {
          email: member.email,
          workspaceId: ZEROPOINT_WORKSPACE_ID
        }
      });

      if (existingPerson) {
        await prisma.people.update({
          where: { id: existingPerson.id },
          data: {
            fullName: member.name,
            firstName: member.name.split(' ')[0],
            lastName: member.name.split(' ')[1],
            jobTitle: member.title,
            email: member.email,
            phone: member.phone,
            department: member.department,
            seniority: member.seniority,
            linkedinUrl: member.linkedinUrl,
            city: member.city,
            state: member.state,
            country: member.country,
            companyId: adpCompany.id,
            notes: JSON.stringify({
              buyerRole: member.role,
              engagement: member.engagement,
              riskStatus: member.riskStatus,
              fallbackRole: member.fallbackRole,
              influence: member.influence,
              decisionPower: member.decisionPower,
              company: member.company
            })
          }
        });
      } else {
        await prisma.people.create({
          data: {
            id: `01${Math.random().toString(36).substr(2, 24)}`,
            fullName: member.name,
            firstName: member.name.split(' ')[0],
            lastName: member.name.split(' ')[1],
            jobTitle: member.title,
            email: member.email,
            phone: member.phone,
            department: member.department,
            seniority: member.seniority,
            linkedinUrl: member.linkedinUrl,
            city: member.city,
            state: member.state,
            country: member.country,
            companyId: adpCompany.id,
            workspaceId: ZEROPOINT_WORKSPACE_ID,
            notes: JSON.stringify({
              buyerRole: member.role,
              engagement: member.engagement,
              riskStatus: member.riskStatus,
              fallbackRole: member.fallbackRole,
              influence: member.influence,
              decisionPower: member.decisionPower,
              company: member.company
            })
          }
        });
      }
    }

    // 3. Audit and enhance company data
    console.log('🏢 Auditing and enhancing company data...');
    
    const enhancedCompanies = [
      {
        name: 'ADP',
        industry: 'Human Resources & Payroll',
        employeeCount: '5000+',
        revenue: '$15.4B',
        location: 'Roseland, NJ',
        domain: 'adp.com',
        description: 'Automatic Data Processing, Inc. is a global provider of cloud-based human capital management solutions.',
        status: 'Buyer Group Engaged',
        priority: 'Priority',
        dealSize: '$2.5M',
        nextAction: 'Technical Demo',
        timeline: 'Q2 2025'
      },
      {
        name: 'Adobe',
        industry: 'Creative Software',
        employeeCount: '1000-5000',
        revenue: '$17.9B',
        location: 'San Jose, CA',
        domain: 'adobe.com',
        description: 'Adobe Inc. is a multinational computer software company known for its creative, marketing and document management software.',
        status: 'Buyer Group Engaged',
        priority: 'Priority',
        dealSize: '$1.8M',
        nextAction: 'Executive Meeting',
        timeline: 'Q1 2025'
      },
      {
        name: 'Amazon Web Services',
        industry: 'Cloud Services',
        employeeCount: '5000+',
        revenue: '$80.1B',
        location: 'Seattle, WA',
        domain: 'aws.amazon.com',
        description: 'Amazon Web Services (AWS) is a comprehensive, evolving cloud computing platform provided by Amazon.',
        status: 'Buyer Group Engaged',
        priority: 'Priority',
        dealSize: '$5.2M',
        nextAction: 'Pilot Program',
        timeline: 'Q2 2025'
      },
      {
        name: 'Anthem',
        industry: 'Healthcare Insurance',
        employeeCount: '5000+',
        revenue: '$138.6B',
        location: 'Indianapolis, IN',
        domain: 'anthem.com',
        description: 'Anthem, Inc. is a health insurance company and the largest for-profit managed health care company in the Blue Cross Blue Shield Association.',
        status: 'Buyer Group Engaged',
        priority: 'Priority',
        dealSize: '$3.1M',
        nextAction: 'Compliance Review',
        timeline: 'Q3 2025'
      }
    ];

    for (const companyData of enhancedCompanies) {
      // Update leads that represent companies
      await prisma.leads.updateMany({
        where: {
          company: companyData.name,
          workspaceId: ZEROPOINT_WORKSPACE_ID
        },
        data: {
          companySize: companyData.employeeCount,
          companyDomain: companyData.domain,
          city: companyData.location.split(',')[0],
          state: companyData.location.split(',')[1]?.trim(),
          country: 'United States',
          description: JSON.stringify({
            industry: companyData.industry,
            revenue: companyData.revenue,
            location: companyData.location,
            domain: companyData.domain,
            fullDescription: companyData.description,
            buyerGroupIdentified: true,
            dealSize: companyData.dealSize,
            status: companyData.status,
            priority: companyData.priority,
            nextAction: companyData.nextAction,
            timeline: companyData.timeline
          })
        }
      });

      // Update companies table
      await prisma.companies.updateMany({
        where: {
          name: companyData.name,
          workspaceId: ZEROPOINT_WORKSPACE_ID
        },
        data: {
          sector: companyData.industry,
          website: companyData.domain,
          size: companyData.employeeCount,
          city: companyData.location.split(',')[0],
          state: companyData.location.split(',')[1]?.trim(),
          country: 'United States',
          notes: companyData.description
        }
      });
    }

    // 4. Create comprehensive Sarah Johnson record
    console.log('👤 Creating comprehensive Sarah Johnson record...');
    
    const sarahJohnson = {
      name: 'Sarah Johnson',
      title: 'VP of Sales Operations',
      email: 'sarah.johnson@adp.com',
      phone: '+1 (973) 974-5200',
      department: 'Sales Operations',
      role: 'Decision Maker',
      engagement: 'Interested 4/5',
      influence: 88,
      decisionPower: 85,
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson-adp',
      city: 'Roseland',
      state: 'NJ',
      country: 'United States',
      seniority: 'VP',
      company: 'ADP'
    };

    // Find or update Sarah Johnson
    let sarah = await prisma.people.findFirst({
      where: {
        email: sarahJohnson.email,
        workspaceId: ZEROPOINT_WORKSPACE_ID
      }
    });

    if (sarah) {
      await prisma.people.update({
        where: { id: sarah.id },
        data: {
          fullName: sarahJohnson.name,
          firstName: sarahJohnson.name.split(' ')[0],
          lastName: sarahJohnson.name.split(' ')[1],
          jobTitle: sarahJohnson.title,
          email: sarahJohnson.email,
          phone: sarahJohnson.phone,
          department: sarahJohnson.department,
          seniority: sarahJohnson.seniority,
          linkedinUrl: sarahJohnson.linkedinUrl,
          city: sarahJohnson.city,
          state: sarahJohnson.state,
          country: sarahJohnson.country,
          companyId: adpCompany.id,
          notes: JSON.stringify({
            buyerRole: sarahJohnson.role,
            engagement: sarahJohnson.engagement,
            influence: sarahJohnson.influence,
            decisionPower: sarahJohnson.decisionPower,
            company: sarahJohnson.company,
            lastContactDate: new Date().toISOString(),
            nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            communicationStyle: 'Direct',
            decisionMakingStyle: 'Data-driven',
            painPoints: ['Manual reporting processes', 'Lack of real-time insights', 'Integration challenges'],
            interests: ['Sales automation', 'Data analytics', 'Process optimization'],
            personalGoals: ['Improve team efficiency', 'Reduce manual work', 'Increase revenue'],
            professionalGoals: ['VP promotion', 'Build high-performing team', 'Implement new systems']
          })
        }
      });
    } else {
      // Check if the specific ID already exists
      const existingWithId = await prisma.people.findUnique({
        where: { id: '01HZ8K9M2N3P4Q5R6S7T8U9V0W' }
      });

      if (existingWithId) {
        // Update the existing record
        await prisma.people.update({
          where: { id: '01HZ8K9M2N3P4Q5R6S7T8U9V0W' },
          data: {
            fullName: sarahJohnson.name,
            firstName: sarahJohnson.name.split(' ')[0],
            lastName: sarahJohnson.name.split(' ')[1],
            jobTitle: sarahJohnson.title,
            email: sarahJohnson.email,
            phone: sarahJohnson.phone,
            department: sarahJohnson.department,
            seniority: sarahJohnson.seniority,
            linkedinUrl: sarahJohnson.linkedinUrl,
            city: sarahJohnson.city,
            state: sarahJohnson.state,
            country: sarahJohnson.country,
            companyId: adpCompany.id,
            workspaceId: ZEROPOINT_WORKSPACE_ID,
            notes: JSON.stringify({
              buyerRole: sarahJohnson.role,
              engagement: sarahJohnson.engagement,
              influence: sarahJohnson.influence,
              decisionPower: sarahJohnson.decisionPower,
              company: sarahJohnson.company,
              lastContactDate: new Date().toISOString(),
              nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              communicationStyle: 'Direct',
              decisionMakingStyle: 'Data-driven',
              painPoints: ['Manual reporting processes', 'Lack of real-time insights', 'Integration challenges'],
              interests: ['Sales automation', 'Data analytics', 'Process optimization'],
              personalGoals: ['Improve team efficiency', 'Reduce manual work', 'Increase revenue'],
              professionalGoals: ['VP promotion', 'Build high-performing team', 'Implement new systems']
            })
          }
        });
      } else {
        await prisma.people.create({
          data: {
            id: '01HZ8K9M2N3P4Q5R6S7T8U9V0W', // Specific ID for Sarah Johnson
          fullName: sarahJohnson.name,
          firstName: sarahJohnson.name.split(' ')[0],
          lastName: sarahJohnson.name.split(' ')[1],
          jobTitle: sarahJohnson.title,
          email: sarahJohnson.email,
          phone: sarahJohnson.phone,
          department: sarahJohnson.department,
          seniority: sarahJohnson.seniority,
          linkedinUrl: sarahJohnson.linkedinUrl,
          city: sarahJohnson.city,
          state: sarahJohnson.state,
          country: sarahJohnson.country,
          companyId: adpCompany.id,
          workspaceId: ZEROPOINT_WORKSPACE_ID,
          notes: JSON.stringify({
            buyerRole: sarahJohnson.role,
            engagement: sarahJohnson.engagement,
            influence: sarahJohnson.influence,
            decisionPower: sarahJohnson.decisionPower,
            company: sarahJohnson.company,
            lastContactDate: new Date().toISOString(),
            nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            communicationStyle: 'Direct',
            decisionMakingStyle: 'Data-driven',
            painPoints: ['Manual reporting processes', 'Lack of real-time insights', 'Integration challenges'],
            interests: ['Sales automation', 'Data analytics', 'Process optimization'],
            personalGoals: ['Improve team efficiency', 'Reduce manual work', 'Increase revenue'],
            professionalGoals: ['VP promotion', 'Build high-performing team', 'Implement new systems']
          })
        }
      });
    }

    // 5. Create comprehensive report data
    console.log('📄 Creating comprehensive report data...');
    
    const reports = [
      {
        id: '01K4VM894JE1BWD2TA3FZCNKCK',
        title: 'ADP Competitive Deep Value Report',
        description: '52-page competitive intelligence analysis',
        content: `
# ADP Competitive Deep Value Report

## Executive Summary
This comprehensive analysis examines ADP's competitive landscape, market positioning, and strategic opportunities for go-to-market success.

## Market Analysis
- **Market Size**: $15.4B HR technology market
- **Growth Rate**: 12% CAGR
- **Key Segments**: Payroll, Benefits, Talent Management

## Competitive Landscape
### Primary Competitors
1. **Workday** - Strong in talent management
2. **Oracle HCM** - Enterprise focus
3. **SAP SuccessFactors** - Global presence
4. **BambooHR** - SMB market leader

### Competitive Advantages
- **Market Leadership**: #1 in payroll processing
- **Customer Base**: 900,000+ clients
- **Global Reach**: 140+ countries
- **Technology Stack**: Modern cloud architecture

## Strategic Recommendations
1. **Focus on Mid-Market**: Target 500-5000 employee companies
2. **Leverage AI/ML**: Enhance predictive analytics capabilities
3. **Expand Internationally**: Strengthen European and Asian presence
4. **Partnership Strategy**: Build ecosystem of complementary solutions

## Revenue Opportunities
- **Upsell Existing Customers**: $2.5M average deal size
- **New Market Penetration**: 15% market share potential
- **Product Expansion**: Adjacent markets worth $8B

## Risk Assessment
- **Market Saturation**: Mature market with slow growth
- **Technology Disruption**: AI and automation threats
- **Regulatory Changes**: Data privacy and compliance requirements

## Conclusion
ADP remains a strong market leader with significant opportunities for growth through strategic partnerships, technology innovation, and market expansion.
        `,
        category: 'Competitive Intelligence',
        pages: 52,
        lastUpdated: new Date().toISOString()
      }
    ];

    // Store reports in notes or create a reports table (using notes for now)
    for (const report of reports) {
      // We'll store this in the workspace description for now
      const workspace = await prisma.workspaces.findFirst({
        where: { id: ZEROPOINT_WORKSPACE_ID }
      });

      if (workspace) {
        const existingData = workspace.description ? JSON.parse(workspace.description) : {};
        existingData.reports = existingData.reports || {};
        existingData.reports[report.id] = report;
        
        await prisma.workspaces.update({
          where: { id: ZEROPOINT_WORKSPACE_ID },
          data: {
            description: JSON.stringify(existingData)
          }
        });
      }
    }

    console.log('✅ Comprehensive demo data audit and enhancement completed successfully!');
    console.log('📊 Enhanced:');
    console.log('  - 4 sellers with complete professional profiles');
    console.log('  - 5 buyer group members with detailed engagement data');
    console.log('  - 4 companies with comprehensive business information');
    console.log('  - Sarah Johnson with complete professional profile');
    console.log('  - Competitive intelligence reports');
    console.log('  - All data fields populated for go-to-market strategy demo');

  } catch (error) {
    console.error('❌ Error in demo data audit and enhancement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  auditAndEnhanceDemoData()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { auditAndEnhanceDemoData };
