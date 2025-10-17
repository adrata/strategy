export interface ChronicleReportData {
  id: string;
  workspaceId: string;
  title: string;
  reportDate: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PITCH';
  content: {
    purpose: string;
    summary: {
      weekProgress: string;
      executiveSummary: string;
    };
    performanceVsTargets: {
      leadsToProspects: { actual: number; target: number; percentage: number };
      prospectsToOpportunities: { actual: number; target: number; percentage: number };
      opportunitiesToClients: { actual: number; target: number; percentage: number };
    };
    thisMonth: string;
    thisQuarter: string;
    keyWins: string[];
    lowlights: string[];
    activityMetrics: {
      callsCompleted: number;
      emailsCompleted: number;
      meetingsCompleted: number;
      newLeads: number;
      newProspects: number;
      newOpportunities: number;
    };
    conversionFunnel: {
      leads: number;
      prospects: number;
      opportunities: number;
      clients: number;
    };
  };
  createdAt: string;
  createdBy: string;
}

export const notaryEverydayReport: ChronicleReportData = {
  id: 'sample-report-001',
  workspaceId: 'notary-everyday-workspace',
  title: 'Notary Everyday - Weekly Chronicle',
  reportDate: '2025-10-17',
  reportType: 'WEEKLY',
  content: {
    purpose: 'Notary Everyday provides comprehensive notary services to businesses and individuals, streamlining document authentication and legal processes through technology-enabled solutions.',
    summary: {
      weekProgress: 'Strong week with significant progress in client acquisition and service delivery. Team exceeded targets in key metrics while maintaining high service quality standards.',
      executiveSummary: 'This week demonstrated strong execution across all business units. Client satisfaction remains high at 94%, while we successfully onboarded 12 new enterprise clients. Revenue targets were exceeded by 15%, driven primarily by increased demand for remote notary services.'
    },
    performanceVsTargets: {
      leadsToProspects: { actual: 45, target: 50, percentage: 90 },
      prospectsToOpportunities: { actual: 12, target: 15, percentage: 80 },
      opportunitiesToClients: { actual: 8, target: 10, percentage: 80 }
    },
    thisMonth: 'October has been our strongest month to date, with 47 new client acquisitions and $2.3M in revenue. The remote notary service expansion has been particularly successful, accounting for 60% of new business.',
    thisQuarter: 'Q4 2025 is on track to exceed all targets. We have successfully expanded into three new markets and launched our enterprise API platform. Client retention rate has improved to 89%, up from 82% last quarter.',
    keyWins: [
      'Closed 8 major enterprise deals worth $1.2M in annual recurring revenue',
      'Launched remote notary API platform with 15 integration partners',
      'Achieved 94% client satisfaction score, highest in company history',
      'Expanded into Texas and Florida markets with immediate traction',
      'Reduced average document processing time by 35% through automation'
    ],
    lowlights: [
      'Conversion rate from prospects to opportunities slightly below target (80% vs 85%)',
      'Customer acquisition cost increased by 12% due to competitive market conditions',
      'Two key team members departed, requiring immediate hiring and training',
      'Technical issues with mobile app caused 2% client churn this week'
    ],
    activityMetrics: {
      callsCompleted: 127,
      emailsCompleted: 342,
      meetingsCompleted: 23,
      newLeads: 67,
      newProspects: 45,
      newOpportunities: 12
    },
    conversionFunnel: {
      leads: 67,
      prospects: 45,
      opportunities: 12,
      clients: 8
    }
  },
  createdAt: '2025-10-17T09:00:00Z',
  createdBy: 'system'
};

export const sampleChronicleReports: ChronicleReportData[] = [
  notaryEverydayReport,
  {
    id: 'sample-report-002',
    workspaceId: 'notary-everyday-workspace',
    title: 'Notary Everyday - Daily Chronicle',
    reportDate: '2025-10-16',
    reportType: 'DAILY',
    content: {
      purpose: 'Notary Everyday provides comprehensive notary services to businesses and individuals, streamlining document authentication and legal processes through technology-enabled solutions.',
      summary: {
        weekProgress: 'Solid day with steady progress on key initiatives. Team focused on client onboarding and service delivery improvements.',
        executiveSummary: 'Daily operations ran smoothly with 15 new client signups and 89 document authentications completed. Customer support response time improved to under 2 minutes average.'
      },
      performanceVsTargets: {
        leadsToProspects: { actual: 8, target: 10, percentage: 80 },
        prospectsToOpportunities: { actual: 2, target: 3, percentage: 67 },
        opportunitiesToClients: { actual: 1, target: 2, percentage: 50 }
      },
      thisMonth: 'October continues to show strong momentum with consistent daily performance across all metrics.',
      thisQuarter: 'Q4 2025 remains on track with daily execution supporting quarterly objectives.',
      keyWins: [
        'Successfully onboarded 15 new clients with zero technical issues',
        'Completed 89 document authentications with 100% accuracy rate',
        'Launched new client portal with positive initial feedback'
      ],
      lowlights: [
        'Conversion rate slightly below daily target',
        'One client reported minor confusion with new portal interface'
      ],
      activityMetrics: {
        callsCompleted: 23,
        emailsCompleted: 67,
        meetingsCompleted: 4,
        newLeads: 12,
        newProspects: 8,
        newOpportunities: 2
      },
      conversionFunnel: {
        leads: 12,
        prospects: 8,
        opportunities: 2,
        clients: 1
      }
    },
    createdAt: '2025-10-16T17:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'pitch-report-001',
    workspaceId: 'notary-everyday-workspace',
    title: 'Notary Everyday - October 2025 Progress Report',
    reportDate: '2025-10-31', // October 2025 Progress Report
    reportType: 'PITCH',
    content: {
      purpose: 'We help notaries scale their business with technology',
      summary: {
        weekProgress: 'Executive presentation for October 2025 progress review and strategic updates',
        executiveSummary: 'Comprehensive pitch covering company purpose, mission, values, progress, stories, understanding, frameworks, direction, and inspiration for the Notary Everyday team.'
      },
      performanceVsTargets: {
        leadsToProspects: { actual: 0, target: 0, percentage: 0 },
        prospectsToOpportunities: { actual: 0, target: 0, percentage: 0 },
        opportunitiesToClients: { actual: 0, target: 0, percentage: 0 }
      },
      thisMonth: 'January 2025 - Strategic planning and team alignment',
      thisQuarter: 'Q1 2025 - Focus on growth, innovation, and market expansion',
      keyWins: [
        'Strong Q4 2024 performance with 47 new client acquisitions',
        'Remote notary API platform launch with 15 integration partners',
        '94% client satisfaction score achieved',
        'Expansion into Texas and Florida markets',
        '35% reduction in document processing time through automation'
      ],
      lowlights: [],
      activityMetrics: {
        callsCompleted: 0,
        emailsCompleted: 0,
        meetingsCompleted: 0,
        newLeads: 0,
        newProspects: 0,
        newOpportunities: 0
      },
      conversionFunnel: {
        leads: 0,
        prospects: 0,
        opportunities: 0,
        clients: 0
      },
      // Pitch-specific content
      slides: {
        cover: {
          title: 'Notary Everyday',
          subtitle: 'October 2025 Progress Report',
          date: 'October 31, 2025',
          presenter: 'Executive Presentation'
        },
        purpose: {
          title: 'Our Purpose',
          content: 'We help notaries scale their business with technology',
          description: 'Empowering notaries nationwide with innovative tools and services that streamline document authentication and expand their reach beyond traditional limitations.'
        },
        mission: {
          title: 'Our Mission',
          targets: [
            { label: 'Financial Target', value: '$5M ARR', progress: 85 },
            { label: 'Monthly Orders', value: '2,500/month', progress: 78 },
            { label: 'Market Share', value: '15%', progress: 60 }
          ]
        },
        values: {
          title: 'Our Core Values',
          values: [
            { name: 'Customer-First', description: 'Every decision prioritizes client success' },
            { name: 'Innovation', description: 'Continuously improving through technology' },
            { name: 'Transparency', description: 'Open communication and honest feedback' },
            { name: 'Excellence', description: 'Delivering the highest quality service' },
            { name: 'Collaboration', description: 'Working together for shared success' }
          ]
        },
        progress: {
          title: 'Progress Against Mission',
          metrics: [
            { label: 'Q4 2024 Revenue', value: '$2.3M', change: '+15%' },
            { label: 'Client Acquisition', value: '47 new clients', change: '+23%' },
            { label: 'Satisfaction Score', value: '94%', change: '+8%' },
            { label: 'Processing Time', value: '35% faster', change: 'Improved' }
          ]
        },
        stories: {
          title: 'Key Stories This Week',
          stories: [
            'Closed 8 major enterprise deals worth $1.2M in ARR',
            'Launched remote notary API with 15 integration partners',
            'Achieved highest client satisfaction score in company history',
            'Successfully expanded into Texas and Florida markets',
            'Reduced document processing time by 35% through automation'
          ]
        },
        understanding: {
          title: 'Key Learnings',
          insights: [
            'Remote notary services are driving 60% of new business growth',
            'Enterprise clients value API integration and automation features',
            'Client retention improves significantly with proactive support',
            'Market expansion requires localized compliance expertise',
            'Technology adoption varies by notary experience level'
          ]
        },
        frameworks: {
          title: 'Department Frameworks',
          departments: [
            { name: 'Sales', framework: 'SPIN Selling Methodology' },
            { name: 'Marketing', framework: 'Content-Driven Lead Generation' },
            { name: 'Product', framework: 'User-Centered Design Process' },
            { name: 'Engineering', framework: 'Agile Development with CI/CD' },
            { name: 'Support', framework: 'Proactive Customer Success' },
            { name: 'Finance', framework: 'Data-Driven Financial Planning' },
            { name: 'Operations', framework: 'Lean Process Optimization' },
            { name: 'HR', framework: 'Culture-First Hiring' },
            { name: 'Legal', framework: 'Compliance-First Approach' }
          ]
        },
        direction: {
          title: 'Next 10 Days',
          priorities: [
            'Complete Q1 hiring for 3 key positions',
            'Launch mobile app beta with 50 select clients',
            'Finalize partnership agreements with 2 major integrators',
            'Implement new customer onboarding automation',
            'Prepare for Series A investor meetings',
            'Roll out enhanced security features',
            'Expand customer success team training',
            'Optimize API performance and documentation',
            'Launch referral program for existing clients',
            'Prepare compliance documentation for new markets'
          ]
        },
        outro: {
          title: 'Together We Build the Future',
          quote: '"The best way to predict the future is to create it."',
          author: 'Peter Drucker',
          message: 'Thank you for your dedication, innovation, and commitment to excellence. Together, we are transforming the notary industry.'
        }
      }
    },
    createdAt: '2025-01-17T09:00:00Z',
    createdBy: 'system'
  }
];
