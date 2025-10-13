/**
 * ☁️ CLOUDCADDIE CONSULTING WORKSPACE ENRICHMENT
 * 
 * Enriches the CloudCaddie Consulting workspace with business context data
 * extracted from their website and business model analysis
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CloudCaddie Consulting business data extracted from https://cloudcaddieconsulting.com/
const CLOUDCADDIE_DATA = {
  businessModel: "IT Staffing & Talent Acquisition",
  industry: "Information Technology",
  serviceOfferings: [
    "IT Staffing Solutions",
    "Talent Acquisition Strategy", 
    "Direct Hire Placement",
    "Contract Staffing",
    "Contract-to-Hire",
    "Proactive Recruiting",
    "Technology Team Building",
    "Hiring Strategy Consulting"
  ],
  productPortfolio: [
    "Direct Hire Services",
    "Contract Staffing",
    "Contract-to-Hire Solutions",
    "Talent Acquisition Strategy",
    "Structuring & Reorganization",
    "Testing & Evaluations",
    "Hiring Forecasting",
    "Technology Team Assessment"
  ],
  valuePropositions: [
    "Proactive recruiting model for high-performing technology teams",
    "Tailored solutions to meet unique hiring needs",
    "Expert recruiting team with deep technology knowledge",
    "Innovative IT staffing and talent acquisition strategies",
    "Focus on building teams that cater to specific requirements",
    "Always ready to assist with next hire",
    "Delivering top talent consistently"
  ],
  targetIndustries: [
    "Technology Companies",
    "Software Development",
    "IT Services",
    "Fintech",
    "Healthcare Technology",
    "E-commerce",
    "SaaS Companies",
    "Digital Agencies",
    "Startups",
    "Enterprise Technology"
  ],
  targetCompanySize: [
    "Small (10-50 employees)",
    "Mid-size (50-500 employees)", 
    "Large (500-2000 employees)",
    "Enterprise (2000+ employees)"
  ],
  idealCustomerProfile: `CloudCaddie Consulting serves technology companies and organizations that need to build high-performing IT teams. Their ideal customers are:

- Technology companies experiencing rapid growth
- Software development firms needing specialized talent
- IT services companies expanding their capabilities
- Fintech and healthcare technology companies
- SaaS companies scaling their engineering teams
- Digital agencies requiring diverse technical skills
- Startups building their initial technology teams
- Enterprise companies modernizing their IT infrastructure

Key characteristics:
- Companies with urgent hiring needs for technical roles
- Organizations valuing proactive recruiting approaches
- Teams that need tailored solutions for unique requirements
- Companies focused on building high-performing technology teams
- Organizations that appreciate expert recruiting knowledge
- Businesses that need consistent access to top talent`,
  competitiveAdvantages: [
    "Proactive recruiting model vs reactive approaches",
    "Deep technology knowledge and expertise",
    "Tailored solutions for unique hiring needs",
    "Focus on high-performing team building",
    "Innovative talent acquisition strategies",
    "Expert recruiting team with industry experience",
    "Consistent delivery of top talent"
  ],
  salesMethodology: "Consultative approach focusing on understanding unique hiring needs and building tailored solutions. Emphasizes proactive recruiting model and high-performing team outcomes. Provides strategic guidance on talent acquisition, team structuring, and hiring forecasting."
};

async function enrichCloudCaddieWorkspace() {
  try {
    console.log('☁️ Starting CloudCaddie Consulting workspace enrichment...');
    
    // Find the CloudCaddie Consulting workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { name: { contains: 'Cloud Caddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloud-caddie', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ CloudCaddie Consulting workspace not found. Available workspaces:');
      const allWorkspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true }
      });
      console.table(allWorkspaces);
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

    // Update the workspace with business context data
    const updatedWorkspace = await prisma.workspaces.update({
      where: { id: workspace.id },
      data: {
        businessModel: CLOUDCADDIE_DATA.businessModel,
        industry: CLOUDCADDIE_DATA.industry,
        serviceOfferings: CLOUDCADDIE_DATA.serviceOfferings,
        productPortfolio: CLOUDCADDIE_DATA.productPortfolio,
        valuePropositions: CLOUDCADDIE_DATA.valuePropositions,
        targetIndustries: CLOUDCADDIE_DATA.targetIndustries,
        targetCompanySize: CLOUDCADDIE_DATA.targetCompanySize,
        idealCustomerProfile: CLOUDCADDIE_DATA.idealCustomerProfile,
        competitiveAdvantages: CLOUDCADDIE_DATA.competitiveAdvantages,
        salesMethodology: CLOUDCADDIE_DATA.salesMethodology,
        updatedAt: new Date()
      }
    });

    console.log('✅ CloudCaddie Consulting workspace enriched successfully!');
    console.log(`📊 Business Model: ${updatedWorkspace.businessModel}`);
    console.log(`🏭 Industry: ${updatedWorkspace.industry}`);
    console.log(`🎯 Services: ${updatedWorkspace.serviceOfferings.length} offerings`);
    console.log(`📦 Products: ${updatedWorkspace.productPortfolio.length} products`);
    console.log(`💡 Value Props: ${updatedWorkspace.valuePropositions.length} propositions`);
    console.log(`🎯 Target Industries: ${updatedWorkspace.targetIndustries.length} industries`);
    console.log(`👥 Target Sizes: ${updatedWorkspace.targetCompanySize.length} size categories`);
    console.log(`🏆 Competitive Advantages: ${updatedWorkspace.competitiveAdvantages.length} advantages`);

    // Also update the main company record if it exists
    const mainCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: workspace.id,
        name: { contains: 'CloudCaddie', mode: 'insensitive' }
      }
    });

    if (mainCompany) {
      await prisma.companies.update({
        where: { id: mainCompany.id },
        data: {
          businessChallenges: [
            "Finding qualified IT talent",
            "Competitive hiring market",
            "Building high-performing teams",
            "Scaling technology capabilities",
            "Retaining top talent"
          ],
          businessPriorities: [
            "Proactive talent acquisition",
            "High-performing team building",
            "Tailored hiring solutions",
            "Technology expertise",
            "Consistent talent delivery"
          ],
          competitiveAdvantages: CLOUDCADDIE_DATA.competitiveAdvantages,
          growthOpportunities: [
            "Technology talent shortage solutions",
            "Proactive recruiting expansion",
            "Specialized IT staffing",
            "Talent acquisition consulting",
            "Team building services"
          ],
          strategicInitiatives: [
            "Proactive recruiting model",
            "Technology team building",
            "Innovative talent acquisition",
            "Hiring strategy consulting",
            "Top talent delivery"
          ],
          successMetrics: [
            "Placement success rate",
            "Client satisfaction scores",
            "Time to hire reduction",
            "Team performance metrics",
            "Talent retention rates"
          ],
          marketPosition: "Leading IT staffing and talent acquisition firm specializing in proactive recruiting for high-performing technology teams",
          updatedAt: new Date()
        }
      });
      console.log('✅ Main company record also updated with business intelligence');
    }

  } catch (error) {
    console.error('❌ Error enriching CloudCaddie Consulting workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
if (require.main === module) {
  enrichCloudCaddieWorkspace();
}

module.exports = { enrichCloudCaddieWorkspace, CLOUDCADDIE_DATA };
