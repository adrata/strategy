const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTOPEngineersPlus() {
  try {
    console.log('Adding TOP Engineers Plus to workspace...');
    
    // TOP Engineers Plus CoreSignal data
    const topData = {
      name: 'TOP Engineers Plus, PLLC',
      industry: 'Telecommunications',
      employeeCount: 22,
      foundedYear: 2018,
      isPublic: false,
      stockSymbol: null,
      website: 'https://www.topengineersplus.com',
      linkedinUrl: 'https://www.linkedin.com/company/top-engineers-plus-pllc',
      linkedinFollowers: 156,
      hqLocation: 'San Antonio, Texas, United States',
      hqCity: 'San Antonio',
      hqState: 'Texas',
      hqZipcode: '78101',
      hqCountryIso2: 'US',
      hqCountryIso3: 'USA',
      description: 'TOP Engineers Plus offers a full spectrum of Engineering services in the Telecommunications Industry. What makes TOP stand out in the industry is the unique connection between Technology, Operations and People. The team behind the scenes has decades of experience in the critical infrastructure sector. We are fortunate to have a deep resource pool that brings a wide diversity of business and life experience that plays a direct role in how client needs are met. This brings a compelling portfolio of service capability and organizational maturity.',
      technologiesUsed: [
        'communications engineering',
        'fiber optic technology',
        'strategic planning',
        'team building',
        'microwave engineering',
        'telecommunications',
        'ftth',
        'operational challenges',
        'critical infrastructure',
        'operational excellence',
        'strategic plan review'
      ],
      competitors: [],
      companyUpdates: [
        {
          date: '2025-06-06',
          description: '🚨 10 Days to Go! 🚨 We\'re counting down to UTC Telecom & Technology 2025 in Long Beach, CA — and we hope to see you there! 📍 Booth #1259 | 🗓️ June 16–19 | 📌 Long Beach Convention Center Join utility professionals from across the country for this impactful event focused on communications, infrastructure, and innovation. At TOP Engineers Plus, we specialize in Communications Engineering that helps utilities modernize networks, improve resilience, and reduce long-term costs.',
          reactionsCount: 1,
          commentsCount: 0
        },
        {
          date: '2024-06-17',
          description: 'As part of our ongoing commitment to excellence and innovation, we have rebranded with a fresh, new logo that reflects our dedication to providing top-notch services and solutions. Our new logo represents our evolution and growth as a company. It embodies our core values, modern approach, and forward-thinking vision.',
          reactionsCount: 5,
          commentsCount: 0
        },
        {
          date: '2024-05-17',
          description: 'We\'re proud and excited to be vendors at the UTC Telecom & Technology conference next week! Check out our exhibit booth #921!',
          reactionsCount: 1,
          commentsCount: 1
        }
      ],
      naicsCodes: ['54', '541'],
      sicCodes: ['87', '871']
    };

    // Add to workspace 01K1VBYXHD0J895XAN0HGFBKJP (Dan's workspace)
    const company = await prisma.companies.create({
      data: {
        ...topData,
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          coresignalData: topData,
          intelligence: {
            strategicWants: [
              'Expand telecommunications engineering services',
              'Strengthen critical infrastructure and broadband deployment capabilities',
              'Enhance strategic planning and operational excellence offerings',
              'Build stronger relationships with utility industry professionals'
            ],
            criticalNeeds: [
              'Technology integration for communications engineering projects',
              'Process optimization for utility infrastructure projects',
              'Team building and organizational development capabilities',
              'Strategic planning expertise for complex engineering challenges'
            ],
            businessUnits: [
              {
                name: 'Communications Engineering',
                functions: ['Fiber optic design', 'Microwave engineering', 'Strategic planning', 'Project management'],
                color: 'bg-blue-100 border-blue-200'
              },
              {
                name: 'Critical Infrastructure',
                functions: ['Utility communications', 'Broadband deployment', 'Infrastructure modernization', 'Resilience planning'],
                color: 'bg-green-100 border-green-200'
              },
              {
                name: 'Operations & Process',
                functions: ['Operational excellence', 'Process improvement', 'Change management', 'Quality control'],
                color: 'bg-purple-100 border-purple-200'
              },
              {
                name: 'Strategic Consulting',
                functions: ['Strategic plan reviews', 'Technology assessment', 'Organizational alignment', 'Client engagement'],
                color: 'bg-orange-100 border-orange-200'
              }
            ],
            strategicIntelligence: 'TOP Engineers Plus, PLLC is a specialized telecommunications engineering firm with 22 employees, founded in 2018 and headquartered in San Antonio, Texas. The company focuses on communications engineering services for critical infrastructure and operations, with expertise in fiber optic technology, microwave engineering, and strategic planning. Their unique value proposition centers on the connection between Technology, Operations, and People, bringing decades of experience in the critical infrastructure sector. The company has been actively growing, with recent rebranding initiatives and strong presence at industry conferences like UTC Telecom & Technology. Their LinkedIn following of 156 professionals indicates strong industry engagement and networking capabilities.',
            adrataStrategy: 'Adrata should position as a strategic technology partner for TOP Engineers Plus by focusing on solutions that enhance their communications engineering capabilities and operational efficiency. Key positioning opportunities include: (1) Technology integration - help streamline their engineering processes and project management, (2) Client relationship management - leverage their 156 LinkedIn followers for enhanced client engagement and business development, (3) Strategic planning tools - provide technology solutions that support their strategic plan review services, (4) Operational excellence - offer tools that support their operational improvement initiatives. Emphasize how our solutions directly support their core mission of connecting Technology, Operations, and People while enhancing their service delivery to utility clients.',
            generatedAt: new Date().toISOString()
          }
        }
      }
    });

    console.log('✅ TOP Engineers Plus added successfully!');
    console.log('Company ID:', company.id);
    console.log('Name:', company.name);
    console.log('Industry:', company.industry);
    console.log('Employees:', company.employeeCount);
    console.log('LinkedIn Followers:', company.linkedinFollowers);
    console.log('Location:', company.hqLocation);
    console.log('Technologies:', company.technologiesUsed?.length || 0, 'technologies');
    console.log('Company Updates:', company.companyUpdates?.length || 0, 'updates');

  } catch (error) {
    console.error('Error adding TOP Engineers Plus:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTOPEngineersPlus();
