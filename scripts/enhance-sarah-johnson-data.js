const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceSarahJohnsonData() {
  try {
    console.log('🔍 Enhancing Sarah Johnson data with comprehensive information...');
    
    const sarahJohnsonId = '01HZ8K9M2N3P4Q5R6S7T8U9V0W';
    
    // Check if person exists
    const existingPerson = await prisma.people.findFirst({
      where: { id: sarahJohnsonId }
    });
    
    if (!existingPerson) {
      console.log('❌ Sarah Johnson not found. Please run create-sarah-johnson.js first.');
      return;
    }
    
    console.log('✅ Found Sarah Johnson, updating with comprehensive data...');
    
    // Update Sarah Johnson with comprehensive data for all tabs
    const updatedPerson = await prisma.people.update({
      where: { id: sarahJohnsonId },
      data: {
        // Basic Information (Overview tab)
        fullName: 'Sarah Johnson',
        firstName: 'Sarah',
        lastName: 'Johnson',
        workEmail: 'sarah.johnson@adp.com',
        personalEmail: 'sarah.johnson.personal@gmail.com',
        jobTitle: 'VP of Human Resources',
        department: 'Human Resources',
        phone: '+1-555-0124',
        workPhone: '+1-555-0124',
        mobilePhone: '+1-555-0125',
        linkedinUrl: 'https://linkedin.com/in/sarahjohnson-adp',
        address: '1 ADP Boulevard, Roseland, NJ 07068',
        city: 'Roseland',
        state: 'New Jersey',
        country: 'United States',
        postalCode: '07068',
        
        // Profile tab data
        bio: 'Experienced HR executive with 15+ years in talent management, organizational development, and strategic workforce planning. Passionate about creating inclusive workplace cultures and driving employee engagement.',
        seniority: 'VP',
        status: 'active',
        
        // Store additional data in customFields JSON
        customFields: {
          // Profile tab data
          influenceScore: 85,
          isDecisionMaker: true,
          buyerGroupRole: 'Decision Maker',
          lastContact: '2024-01-15',
          nextAction: 'Schedule follow-up call',
          priority: 'high',
          
          // Career tab data
          experience: [
            {
              company: 'ADP',
              title: 'VP of Human Resources',
              startDate: '2020-01-01',
              endDate: null,
              description: 'Leading HR strategy for 15,000+ employees across North America'
            },
            {
              company: 'IBM',
              title: 'Director of Talent Acquisition',
              startDate: '2018-01-01',
              endDate: '2019-12-31',
              description: 'Managed global talent acquisition for technology division'
            },
            {
              company: 'Deloitte',
              title: 'Senior Manager, Human Capital',
              startDate: '2015-01-01',
              endDate: '2017-12-31',
              description: 'Consulted on HR transformation projects for Fortune 500 clients'
            }
          ],
          education: [
            {
              institution: 'Cornell University',
              degree: 'Master of Industrial and Labor Relations',
              year: '2010'
            },
            {
              institution: 'University of Pennsylvania',
              degree: 'Bachelor of Arts in Psychology',
              year: '2008'
            }
          ],
          skills: [
            'Strategic HR Planning',
            'Talent Management',
            'Organizational Development',
            'Employee Engagement',
            'Diversity & Inclusion',
            'Change Management',
            'Leadership Development'
          ],
          certifications: [
            'SHRM-SCP (Senior Certified Professional)',
            'PHR (Professional in Human Resources)',
            'Certified Change Management Professional'
          ],
          
          // Company tab data
          companySize: 'Large (10,000+ employees)',
          industry: 'Human Resources & Payroll Services',
          revenue: '$18.0B',
          employeeCount: 15000,
          founded: '1949',
          headquarters: 'Roseland, New Jersey, USA',
          stockSymbol: 'NASDAQ: ADP',
          marketCap: '$108.5B',
          
          // History tab data
          interactionHistory: [
            {
              date: '2024-01-15',
              type: 'Email',
              description: 'Initial outreach about HR technology solutions',
              outcome: 'Positive response, interested in learning more'
            },
            {
              date: '2024-01-10',
              type: 'LinkedIn',
              description: 'Connected on LinkedIn after conference',
              outcome: 'Accepted connection request'
            },
            {
              date: '2024-01-05',
              type: 'Event',
              description: 'Met at HR Technology Conference',
              outcome: 'Discussed current HR challenges'
            }
          ],
          
          // Additional fields for Insights tab
          painPoints: [
            'Manual HR processes causing inefficiencies',
            'Lack of real-time workforce analytics',
            'Difficulty in talent retention and engagement',
            'Compliance challenges with remote work policies'
          ],
          goals: [
            'Streamline HR operations with technology',
            'Improve employee experience and engagement',
            'Reduce time-to-hire by 30%',
            'Enhance workforce analytics and reporting'
          ],
          budget: '$2M+',
          timeline: 'Q2 2024',
          decisionFactors: [
            'ROI and cost-effectiveness',
            'Implementation timeline and support',
            'Data security and compliance',
            'User experience and adoption'
          ]
        },
        
        // Notes tab data - store as string
        notes: 'Very interested in AI-powered HR solutions. Currently evaluating 3 vendors for HR technology upgrade. Decision timeline: Q2 2024. Budget: $2M+ for comprehensive HR platform. Key concern: Data security and compliance. Prefers vendor with strong implementation support.',
        
        // Tags for categorization
        tags: ['VP', 'Decision Maker', 'HR', 'ADP', 'High Priority', 'Q2 2024'],
        
        // Demo scenario data
        workspaceId: 'zeropoint-demo-2025',
        
        // Timestamps
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully enhanced Sarah Johnson data:', {
      id: updatedPerson.id,
      fullName: updatedPerson.fullName,
      email: updatedPerson.workEmail,
      title: updatedPerson.jobTitle,
      company: updatedPerson.company,
      buyerGroupRole: updatedPerson.buyerGroupRole,
      influenceScore: updatedPerson.influenceScore
    });
    
    console.log('🔗 URL: http://localhost:3000/demo/zeropoint/pipeline/people/sarah-johnson-' + sarahJohnsonId);
    console.log('📊 All tabs should now display comprehensive data!');
    
  } catch (error) {
    console.error('❌ Error enhancing Sarah Johnson data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enhanceSarahJohnsonData();
