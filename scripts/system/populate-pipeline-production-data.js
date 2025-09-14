/**
 * 🚀 POPULATE PIPELINE PRODUCTION DATA
 * 
 * This script populates the database with realistic pipeline data
 * to replace hard-coded data in components with dynamic database records.
 * 
 * Usage: node scripts/system/populate-pipeline-production-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting pipeline production data population...');
  
  // Get workspace ID
  const workspace = await prisma.workspace.findFirst({
    where: { 
      OR: [
        { name: 'Adrata' },
        { name: 'adrata' },
        { slug: 'adrata' }
      ]
    }
  });
  
  if (!workspace) {
    console.error('❌ Workspace "adrata" not found');
    return;
  }
  
  const workspaceId = workspace.id;
  console.log(`✅ Using workspace: ${workspace.name} (${workspaceId})`);
  
  // 1. Create accounts (customers) with new fields
  console.log('\n📊 Creating accounts...');
  
  const accountsData = [
    {
      name: 'TechCorp Solutions',
      industry: 'Technology',
      size: 'Large (1000-5000 employees)', // Now supports longer descriptions
      revenue: 150000000,
      website: 'https://techcorp.com',
      description: 'Leading enterprise software company',
      primaryContact: 'Sarah Chen',
      accountType: 'Customer',
      tier: 'Enterprise',
      city: 'San Francisco',
      state: 'California',
      country: 'USA'
    },
    {
      name: 'DataFlow Industries',
      industry: 'Data Analytics',
      size: 'Medium (250-1000 employees)',
      revenue: 25000000,
      website: 'https://dataflow.com',
      description: 'Data analytics and visualization platform',
      primaryContact: 'Michael Rodriguez',
      accountType: 'Prospect',
      tier: 'SMB',
      city: 'Austin',
      state: 'Texas',
      country: 'USA'
    },
    {
      name: 'CloudFirst Systems',
      industry: 'Cloud Infrastructure',
      size: 'Medium (500-1000 employees)',
      revenue: 45000000,
      website: 'https://cloudfirst.com',
      description: 'Cloud-native infrastructure solutions',
      primaryContact: 'Jennifer Wang',
      accountType: 'Customer',
      tier: 'SMB',
      city: 'Seattle',
      state: 'Washington',
      country: 'USA'
    },
    {
      name: 'SecureNet Corp',
      industry: 'Cybersecurity',
      size: 'Large (2000+ employees)',
      revenue: 200000000,
      website: 'https://securenet.com',
      description: 'Enterprise cybersecurity solutions',
      primaryContact: 'David Kim',
      accountType: 'Prospect',
      tier: 'Enterprise',
      city: 'Boston',
      state: 'Massachusetts',
      country: 'USA'
    },
    {
      name: 'FinTech Innovations',
      industry: 'Financial Technology',
      size: 'Small (50-250 employees)',
      revenue: 35000000,
      website: 'https://fintech-innovations.com',
      description: 'Innovative financial technology solutions',
      primaryContact: 'Emily Davis',
      accountType: 'Customer',
      tier: 'Startup',
      city: 'New York',
      state: 'New York',
      country: 'USA'
    }
  ];

  const accounts = [];
  for (const accountData of accountsData) {
    let account = await prisma.account.findFirst({
      where: { name: accountData.name, workspaceId }
    });
    
    if (!account) {
      account = await prisma.account.create({
        data: { ...accountData, workspaceId }
      });
      console.log(`  ✅ Created account: ${account.name}`);
    } else {
      console.log(`  📝 Account exists: ${account.name}`);
    }
    accounts.push(account);
  }

  console.log(`✅ Created ${accounts.length} accounts`);
  
  // 2. Create contacts with better field structure
  console.log('\n👥 Creating contacts...');
  
  const contactsData = [
    {
      firstName: 'Sarah',
      lastName: 'Chen',
      fullName: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      workEmail: 'sarah.chen@techcorp.com',
      jobTitle: 'VP of Engineering',
      department: 'Engineering',
      seniority: 'Senior',
      accountIndex: 0, // TechCorp
      phone: '+1-555-0101',
      mobilePhone: '+1-555-0101',
      linkedinUrl: 'https://linkedin.com/in/sarah-chen-vp',
      city: 'San Francisco',
      state: 'California',
      country: 'USA'
    },
    {
      firstName: 'Michael',
      lastName: 'Rodriguez',
      fullName: 'Michael Rodriguez',
      email: 'michael.rodriguez@dataflow.com',
      workEmail: 'michael.rodriguez@dataflow.com',
      jobTitle: 'CTO',
      department: 'Technology',
      seniority: 'Executive',
      accountIndex: 1, // DataFlow
      phone: '+1-555-0102',
      mobilePhone: '+1-555-0102',
      linkedinUrl: 'https://linkedin.com/in/michael-rodriguez-cto',
      city: 'Austin',
      state: 'Texas',
      country: 'USA'
    },
    {
      firstName: 'Jennifer',
      lastName: 'Wang',
      fullName: 'Jennifer Wang',
      email: 'jennifer.wang@cloudfirst.com',
      workEmail: 'jennifer.wang@cloudfirst.com',
      jobTitle: 'Head of Product',
      department: 'Product',
      seniority: 'Senior',
      accountIndex: 2, // CloudFirst
      phone: '+1-555-0103',
      mobilePhone: '+1-555-0103',
      linkedinUrl: 'https://linkedin.com/in/jennifer-wang-product',
      city: 'Seattle',
      state: 'Washington',
      country: 'USA'
    },
    {
      firstName: 'David',
      lastName: 'Kim',
      fullName: 'David Kim',
      email: 'david.kim@securenet.com',
      workEmail: 'david.kim@securenet.com',
      jobTitle: 'CISO',
      department: 'Security',
      seniority: 'Executive',
      accountIndex: 3, // SecureNet
      phone: '+1-555-0104',
      mobilePhone: '+1-555-0104',
      linkedinUrl: 'https://linkedin.com/in/david-kim-ciso',
      city: 'Boston',
      state: 'Massachusetts',
      country: 'USA'
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      fullName: 'Emily Davis',
      email: 'emily.davis@fintech-innovations.com',
      workEmail: 'emily.davis@fintech-innovations.com',
      jobTitle: 'CEO',
      department: 'Executive',
      seniority: 'Executive',
      accountIndex: 4, // FinTech
      phone: '+1-555-0105',
      mobilePhone: '+1-555-0105',
      linkedinUrl: 'https://linkedin.com/in/emily-davis-ceo',
      city: 'New York',
      state: 'New York',
      country: 'USA'
    },
    {
      firstName: 'James',
      lastName: 'Wilson',
      fullName: 'James Wilson',
      email: 'james.wilson@techcorp.com',
      workEmail: 'james.wilson@techcorp.com',
      jobTitle: 'Director of IT',
      department: 'IT',
      seniority: 'Senior',
      accountIndex: 0, // TechCorp
      phone: '+1-555-0106',
      mobilePhone: '+1-555-0106',
      linkedinUrl: 'https://linkedin.com/in/james-wilson-it',
      city: 'San Francisco',
      state: 'California',
      country: 'USA'
    }
  ];

  const contacts = [];
  for (const contactData of contactsData) {
    const { accountIndex, ...contactCreateData } = contactData;
    
    let contact = await prisma.contact.findFirst({
      where: { email: contactData.email, workspaceId }
    });
    
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          ...contactCreateData,
          accountId: accounts[accountIndex].id,
          workspaceId
        }
      });
      console.log(`  ✅ Created contact: ${contact.fullName}`);
    } else {
      console.log(`  📝 Contact exists: ${contact.fullName}`);
    }
    contacts.push(contact);
  }

  console.log(`✅ Created ${contacts.length} contacts`);
  
  // 3. Create leads with enhanced fields
  console.log('\n👤 Creating leads...');
  
  const leadsData = [
    {
      firstName: 'Alex',
      lastName: 'Johnson',
      fullName: 'Alex Johnson',
      email: 'alex.johnson@techstartup.com',
      workEmail: 'alex.johnson@techstartup.com',
      company: 'TechStartup Inc',
      jobTitle: 'CEO',
      department: 'Executive',
      status: 'qualified',
      priority: 'high',
      source: 'LinkedIn',
      estimatedValue: 75000,
      // New pipeline fields
      buyerGroupRole: 'Decision Maker',
      relationship: 'Warm',
      currentStage: 'Build Interest',
      completedStages: ['Build Rapport'],
      lastActionDate: new Date('2024-01-10'),
      nextAction: 'Schedule product demo',
      nextActionDate: new Date('2024-01-15'),
      phone: '+1-555-0201',
      mobilePhone: '+1-555-0201',
      linkedinUrl: 'https://linkedin.com/in/alex-johnson-ceo',
      city: 'Palo Alto',
      state: 'California',
      country: 'USA'
    },
    {
      firstName: 'Maria',
      lastName: 'Garcia',
      fullName: 'Maria Garcia',
      email: 'maria.garcia@growthco.com',
      workEmail: 'maria.garcia@growthco.com',
      company: 'GrowthCo',
      jobTitle: 'VP of Sales',
      department: 'Sales',
      status: 'nurturing',
      priority: 'medium',
      source: 'Website',
      estimatedValue: 50000,
      // New pipeline fields
      buyerGroupRole: 'Champion',
      relationship: 'Building',
      currentStage: 'Build Rapport',
      completedStages: [],
      lastActionDate: new Date('2024-01-08'),
      nextAction: 'Send case study',
      nextActionDate: new Date('2024-01-12'),
      phone: '+1-555-0202',
      mobilePhone: '+1-555-0202',
      linkedinUrl: 'https://linkedin.com/in/maria-garcia-vp',
      city: 'Denver',
      state: 'Colorado',
      country: 'USA'
    },
    {
      firstName: 'Robert',
      lastName: 'Kim',
      fullName: 'Robert Kim',
      email: 'robert.kim@scaleup.com',
      workEmail: 'robert.kim@scaleup.com',
      company: 'ScaleUp Solutions',
      jobTitle: 'CTO',
      department: 'Technology',
      status: 'contacted',
      priority: 'high',
      source: 'Referral',
      estimatedValue: 120000,
      // New pipeline fields
      buyerGroupRole: 'Stakeholder',
      relationship: 'Cold',
      currentStage: 'Build Rapport',
      completedStages: [],
      lastActionDate: new Date('2024-01-05'),
      nextAction: 'Follow up call',
      nextActionDate: new Date('2024-01-11'),
      phone: '+1-555-0203',
      mobilePhone: '+1-555-0203',
      linkedinUrl: 'https://linkedin.com/in/robert-kim-cto',
      city: 'Portland',
      state: 'Oregon',
      country: 'USA'
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      fullName: 'Emily Davis',
      email: 'emily.davis@innovatecorp.com',
      workEmail: 'emily.davis@innovatecorp.com',
      company: 'InnovateCorp',
      jobTitle: 'Head of Operations',
      department: 'Operations',
      status: 'qualified',
      priority: 'medium',
      source: 'Event',
      estimatedValue: 90000,
      // New pipeline fields
      buyerGroupRole: 'Influencer',
      relationship: 'Hot',
      currentStage: 'Build Consensus',
      completedStages: ['Build Rapport', 'Build Interest'],
      lastActionDate: new Date('2024-01-12'),
      nextAction: 'Present proposal',
      nextActionDate: new Date('2024-01-18'),
      phone: '+1-555-0204',
      mobilePhone: '+1-555-0204',
      linkedinUrl: 'https://linkedin.com/in/emily-davis-ops',
      city: 'Chicago',
      state: 'Illinois',
      country: 'USA'
    },
    {
      firstName: 'John',
      lastName: 'Wilson',
      fullName: 'John Wilson',
      email: 'john.wilson@futuretech.com',
      workEmail: 'john.wilson@futuretech.com',
      company: 'FutureTech Labs',
      jobTitle: 'Research Director',
      department: 'Research',
      status: 'new',
      priority: 'low',
      source: 'Cold Outreach',
      estimatedValue: 30000,
      // New pipeline fields
      buyerGroupRole: 'Stakeholder',
      relationship: 'Cold',
      currentStage: 'Build Rapport',
      completedStages: [],
      lastActionDate: new Date('2024-01-02'),
      nextAction: 'Initial outreach',
      nextActionDate: new Date('2024-01-09'),
      phone: '+1-555-0205',
      mobilePhone: '+1-555-0205',
      linkedinUrl: 'https://linkedin.com/in/john-wilson-research',
      city: 'Miami',
      state: 'Florida',
      country: 'USA'
    }
  ];

  const leads = [];
  for (const leadData of leadsData) {
    let lead = await prisma.lead.findFirst({
      where: { email: leadData.email, workspaceId }
    });
    
    if (!lead) {
      lead = await prisma.lead.create({
        data: { ...leadData, workspaceId }
      });
      console.log(`  ✅ Created lead: ${lead.fullName}`);
    } else {
      console.log(`  📝 Lead exists: ${lead.fullName}`);
    }
    leads.push(lead);
  }

  console.log(`✅ Created ${leads.length} leads`);
  
  // 4. Create opportunities with enhanced pipeline stages and new fields
  console.log('\n💼 Creating opportunities...');
  
  const opportunitiesData = [
    {
      name: 'TechCorp Platform Integration',
      description: 'Enterprise platform integration and data migration',
      amount: 450000,
      probability: 0.75,
      stage: 'Build Consensus',
      priority: 'high',
      expectedCloseDate: new Date('2024-02-15'),
      accountIndex: 0, // TechCorp
      // New pipeline fields
      stageEntryDate: new Date('2024-01-08'),
      dealAnalysis: 'Strong fit, technical evaluation complete, pricing approved',
      buyingCommittee: {
        decisionMaker: 'Sarah Chen (VP Engineering)',
        champion: 'James Wilson (Director IT)',
        stakeholders: ['Mike Thompson (Security)', 'Lisa Park (Operations)']
      },
      competitionData: {
        competitors: ['Microsoft', 'Salesforce'],
        ourAdvantages: ['Better integration', 'Lower TCO', 'Faster deployment']
      },
      lastActivityDate: new Date('2024-01-10'),
      nextActivityDate: new Date('2024-01-15'),
      source: 'Inbound',
      nextSteps: 'Final proposal presentation to executive committee'
    },
    {
      name: 'DataFlow Analytics Upgrade',
      description: 'Upgrade to enterprise analytics platform',
      amount: 180000,
      probability: 0.45,
      stage: 'Build Interest',
      priority: 'medium',
      expectedCloseDate: new Date('2024-03-01'),
      accountIndex: 1, // DataFlow
      // New pipeline fields
      stageEntryDate: new Date('2024-01-05'),
      dealAnalysis: 'Budget approved, evaluating multiple vendors',
      buyingCommittee: {
        decisionMaker: 'Michael Rodriguez (CTO)',
        champion: 'Unknown',
        stakeholders: ['Data team leads', 'Finance team']
      },
      competitionData: {
        competitors: ['Tableau', 'Power BI'],
        ourAdvantages: ['Real-time processing', 'Custom dashboards']
      },
      lastActivityDate: new Date('2024-01-09'),
      nextActivityDate: new Date('2024-01-16'),
      source: 'Partner Referral',
      nextSteps: 'Product demo scheduled for next week'
    },
    {
      name: 'CloudFirst Infrastructure Modernization',
      description: 'Cloud infrastructure modernization project',
      amount: 320000,
      probability: 0.60,
      stage: 'Build Decision',
      priority: 'high',
      expectedCloseDate: new Date('2024-01-30'),
      accountIndex: 2, // CloudFirst
      // New pipeline fields
      stageEntryDate: new Date('2024-01-01'),
      dealAnalysis: 'Technical fit confirmed, contract negotiation in progress',
      buyingCommittee: {
        decisionMaker: 'Jennifer Wang (Head of Product)',
        champion: 'Jennifer Wang (Head of Product)',
        stakeholders: ['DevOps team', 'Security team', 'Finance']
      },
      competitionData: {
        competitors: ['AWS', 'Google Cloud'],
        ourAdvantages: ['Multi-cloud support', 'Better pricing', 'Local support']
      },
      lastActivityDate: new Date('2024-01-11'),
      nextActivityDate: new Date('2024-01-17'),
      source: 'Direct Sales',
      nextSteps: 'Contract review and final pricing negotiation'
    },
    {
      name: 'SecureNet Security Assessment',
      description: 'Comprehensive security audit and implementation',
      amount: 275000,
      probability: 0.35,
      stage: 'Build Rapport',
      priority: 'medium',
      expectedCloseDate: new Date('2024-04-15'),
      accountIndex: 3, // SecureNet
      // New pipeline fields
      stageEntryDate: new Date('2024-01-12'),
      dealAnalysis: 'Early stage, building relationships with security team',
      buyingCommittee: {
        decisionMaker: 'David Kim (CISO)',
        champion: 'Unknown',
        stakeholders: ['Security team', 'Compliance team']
      },
      competitionData: {
        competitors: ['Deloitte', 'PwC'],
        ourAdvantages: ['Specialized expertise', 'Faster turnaround']
      },
      lastActivityDate: new Date('2024-01-12'),
      nextActivityDate: new Date('2024-01-19'),
      source: 'Cold Outreach',
      nextSteps: 'Initial discovery meeting scheduled'
    },
    {
      name: 'FinTech Digital Transformation',
      description: 'Digital transformation and process automation',
      amount: 150000,
      probability: 0.80,
      stage: 'Legal/Procurement',
      priority: 'high',
      expectedCloseDate: new Date('2024-01-25'),
      accountIndex: 4, // FinTech
      // New pipeline fields
      stageEntryDate: new Date('2024-01-10'),
      dealAnalysis: 'Deal approved, legal review in progress',
      buyingCommittee: {
        decisionMaker: 'Emily Davis (CEO)',
        champion: 'Emily Davis (CEO)',
        stakeholders: ['CTO', 'Legal team', 'Finance']
      },
      competitionData: {
        competitors: ['None identified'],
        ourAdvantages: ['Incumbent relationship', 'Proven track record']
      },
      lastActivityDate: new Date('2024-01-11'),
      nextActivityDate: new Date('2024-01-18'),
      source: 'Existing Customer',
      nextSteps: 'Contract execution and project kickoff'
    }
  ];

  const opportunities = [];
  for (const oppData of opportunitiesData) {
    const { accountIndex, ...opportunityCreateData } = oppData;
    
    let opportunity = await prisma.opportunity.findFirst({
      where: { name: oppData.name, workspaceId }
    });
    
    if (!opportunity) {
      opportunity = await prisma.opportunity.create({
        data: {
          ...opportunityCreateData,
          accountId: accounts[accountIndex].id,
          workspaceId
        }
      });
      console.log(`  ✅ Created opportunity: ${opportunity.name}`);
    } else {
      console.log(`  📝 Opportunity exists: ${opportunity.name}`);
    }
    opportunities.push(opportunity);
  }

  console.log(`✅ Created ${opportunities.length} opportunities`);
  
  // 5. Create opportunity activities with realistic data
  console.log('\n📅 Creating opportunity activities...');
  const activities = await Promise.all([
    // TechCorp activities
    prisma.opportunityActivity.create({
      data: {
        opportunityId: opportunities[0].id,
        type: 'Discovery Call',
        subject: 'Initial Requirements Discussion',
        description: 'Discussed technical requirements and integration needs',
        outcome: 'Positive - strong technical fit identified',
        duration: 60,
        attendeeCount: 4,
        qualityScore: 8.5,
        scheduledDate: new Date('2024-01-03'),
        completedDate: new Date('2024-01-03'),
        isCompleted: true,
        participantIds: [contacts[0].id, contacts[5].id],
        nextSteps: 'Prepare technical proposal'
      }
    }),
    prisma.opportunityActivity.create({
      data: {
        opportunityId: opportunities[0].id,
        type: 'Technical Demo',
        subject: 'Platform Integration Demo',
        description: 'Demonstrated platform integration capabilities',
        outcome: 'Excellent - technical team impressed',
        duration: 90,
        attendeeCount: 6,
        qualityScore: 9.0,
        scheduledDate: new Date('2024-01-08'),
        completedDate: new Date('2024-01-08'),
        isCompleted: true,
        participantIds: [contacts[0].id, contacts[5].id],
        nextSteps: 'Executive presentation scheduled'
      }
    }),
    // DataFlow activities
    prisma.opportunityActivity.create({
      data: {
        opportunityId: opportunities[1].id,
        type: 'Needs Analysis',
        subject: 'Analytics Requirements Review',
        description: 'Reviewed current analytics setup and future needs',
        outcome: 'Good - identified key pain points',
        duration: 45,
        attendeeCount: 3,
        qualityScore: 7.5,
        scheduledDate: new Date('2024-01-05'),
        completedDate: new Date('2024-01-05'),
        isCompleted: true,
        participantIds: [contacts[1].id],
        nextSteps: 'Schedule product demo'
      }
    }),
    prisma.opportunityActivity.create({
      data: {
        opportunityId: opportunities[1].id,
        type: 'Product Demo',
        subject: 'Analytics Platform Demo',
        description: 'Comprehensive platform demonstration',
        outcome: 'Pending',
        duration: 60,
        attendeeCount: 5,
        qualityScore: null,
        scheduledDate: new Date('2024-01-16'),
        completedDate: null,
        isCompleted: false,
        participantIds: [contacts[1].id],
        nextSteps: 'Follow up on demo feedback'
      }
    }),
    // CloudFirst activities
    prisma.opportunityActivity.create({
      data: {
        opportunityId: opportunities[2].id,
        type: 'Contract Negotiation',
        subject: 'Pricing and Terms Discussion',
        description: 'Negotiated contract terms and pricing structure',
        outcome: 'Positive - terms agreed upon',
        duration: 120,
        attendeeCount: 4,
        qualityScore: 8.0,
        scheduledDate: new Date('2024-01-11'),
        completedDate: new Date('2024-01-11'),
        isCompleted: true,
        participantIds: [contacts[2].id],
        nextSteps: 'Contract review and legal approval'
      }
    }),
    // SecureNet activities
    prisma.opportunityActivity.create({
      data: {
        opportunityId: opportunities[3].id,
        type: 'Initial Meeting',
        subject: 'Security Assessment Discussion',
        description: 'Initial conversation about security needs',
        outcome: 'Good - interest confirmed',
        duration: 30,
        attendeeCount: 2,
        qualityScore: 7.0,
        scheduledDate: new Date('2024-01-12'),
        completedDate: new Date('2024-01-12'),
        isCompleted: true,
        participantIds: [contacts[3].id],
        nextSteps: 'Schedule discovery meeting'
      }
    }),
    // FinTech activities
    prisma.opportunityActivity.create({
      data: {
        opportunityId: opportunities[4].id,
        type: 'Executive Approval',
        subject: 'CEO Approval Meeting',
        description: 'Final approval from executive team',
        outcome: 'Approved - moving to legal',
        duration: 30,
        attendeeCount: 3,
        qualityScore: 9.5,
        scheduledDate: new Date('2024-01-10'),
        completedDate: new Date('2024-01-10'),
        isCompleted: true,
        participantIds: [contacts[4].id],
        nextSteps: 'Legal contract review'
      }
    })
  ]);

  console.log(`✅ Created ${activities.length} opportunity activities`);
  
  console.log('\n🎉 Pipeline production data population completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- ${accounts.length} accounts created`);
  console.log(`- ${contacts.length} contacts created`);
  console.log(`- ${leads.length} leads created`);
  console.log(`- ${opportunities.length} opportunities created`);
  console.log(`- ${activities.length} activities created`);
  
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  console.log(`- Total pipeline value: $${totalValue.toLocaleString()}`);
  
  console.log('\n✨ Your pipeline is now ready with realistic production data!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 