/**
 * 🏗️ TOP ENGINEERS PLUS WORKSPACE ENRICHMENT
 * 
 * Enriches the TOP Engineers Plus workspace with business context data
 * extracted from their website and business model analysis
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// TOP Engineers Plus business data extracted from https://topengineersplus.com/
const TOP_ENGINEERS_PLUS_DATA = {
  businessModel: "Engineering Consulting",
  industry: "Communications Engineering",
  serviceOfferings: [
    "Communications Engineering",
    "Critical Infrastructure Engineering", 
    "Broadband Deployment",
    "Process Optimization",
    "Change Management",
    "Strategic Planning",
    "Project Management",
    "Technology Assessment",
    "Organizational Alignment",
    "Operational Excellence"
  ],
  productPortfolio: [
    "Strategic Plan Review",
    "Gap Analysis",
    "Process Mapping",
    "Technology Deployment",
    "Infrastructure Modernization",
    "Utility Communications Engineering",
    "Broadband Infrastructure Design",
    "Change Management Consulting",
    "Project Execution & Fulfillment"
  ],
  valuePropositions: [
    "Technology, Operations, and People - the unique connection between these three elements",
    "Turning complex challenges into simple, actionable solutions",
    "Decades of experience in critical infrastructure sector",
    "Deep resource pool with diverse business and life experience",
    "Focus on operational excellence and process improvement",
    "Strategic clarity through gap analysis and stakeholder engagement",
    "Transparent project execution with proven methodologies"
  ],
  targetIndustries: [
    "Electric Utilities",
    "Municipalities", 
    "Infrastructure Organizations",
    "Broadband Providers",
    "Critical Infrastructure",
    "Utility Communications",
    "Public Sector",
    "Infrastructure Development"
  ],
  targetCompanySize: [
    "Mid-size (100-1000 employees)",
    "Large (1000+ employees)",
    "Enterprise (5000+ employees)"
  ],
  idealCustomerProfile: `TOP Engineers Plus serves electric utilities, municipalities, and infrastructure organizations that need communications engineering expertise. Their ideal customers are electric utilities facing infrastructure modernization challenges, municipalities deploying broadband, and infrastructure organizations needing process optimization and change management. Key characteristics include decision-makers who value strategic planning, organizations with significant infrastructure investments, and teams needing to align technology, operations, and people.`,
  competitiveAdvantages: [
    "Decades of experience in utility communications engineering",
    "Unique focus on Technology + Operations + People integration",
    "Proven methodology of turning complex into simple solutions",
    "Deep understanding of utility environment and challenges",
    "Extensive experience in change management and process improvement",
    "Strategic approach with gap analysis and stakeholder engagement",
    "Transparent project execution with proven track record"
  ],
  salesMethodology: "Strategic consultation approach - begins with gap analysis, stakeholder engagement, and understanding project variabilities. Focuses on building resilience, strengthening technical resource utilization, and providing confidence in strategic direction. Emphasizes process alignment and organizational impact alongside technical solutions."
};

async function enrichTopEngineersPlusWorkspace() {
  try {
    console.log('🏗️ Starting TOP Engineers Plus workspace enrichment...');
    
    // Find the TOP Engineers Plus workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'TOP Engineers Plus', mode: 'insensitive' } },
          { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
          { slug: { contains: 'top-engineers', mode: 'insensitive' } },
          { slug: { contains: 'top-engineering', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ TOP Engineers Plus workspace not found. Available workspaces:');
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
        businessModel: TOP_ENGINEERS_PLUS_DATA.businessModel,
        industry: TOP_ENGINEERS_PLUS_DATA.industry,
        serviceOfferings: TOP_ENGINEERS_PLUS_DATA.serviceOfferings,
        productPortfolio: TOP_ENGINEERS_PLUS_DATA.productPortfolio,
        valuePropositions: TOP_ENGINEERS_PLUS_DATA.valuePropositions,
        targetIndustries: TOP_ENGINEERS_PLUS_DATA.targetIndustries,
        targetCompanySize: TOP_ENGINEERS_PLUS_DATA.targetCompanySize,
        idealCustomerProfile: TOP_ENGINEERS_PLUS_DATA.idealCustomerProfile,
        competitiveAdvantages: TOP_ENGINEERS_PLUS_DATA.competitiveAdvantages,
        salesMethodology: TOP_ENGINEERS_PLUS_DATA.salesMethodology,
        updatedAt: new Date()
      }
    });

    console.log('✅ TOP Engineers Plus workspace enriched successfully!');
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
        name: { contains: 'TOP Engineers Plus', mode: 'insensitive' }
      }
    });

    if (mainCompany) {
      await prisma.companies.update({
        where: { id: mainCompany.id },
        data: {
          businessChallenges: [
            "Infrastructure modernization complexity",
            "Technology deployment challenges", 
            "Process inefficiencies",
            "Organizational alignment issues",
            "Change management resistance"
          ],
          businessPriorities: [
            "Operational excellence",
            "Process improvement", 
            "Technology optimization",
            "Strategic clarity",
            "Cost reduction"
          ],
          competitiveAdvantages: TOP_ENGINEERS_PLUS_DATA.competitiveAdvantages,
          growthOpportunities: [
            "Broadband deployment expansion",
            "Utility infrastructure modernization",
            "Process optimization consulting",
            "Change management services",
            "Strategic planning consulting"
          ],
          strategicInitiatives: [
            "Technology, Operations, and People integration",
            "Complex challenge simplification",
            "Strategic plan review services",
            "Gap analysis methodology",
            "Transparent project execution"
          ],
          successMetrics: [
            "Project completion rate",
            "Client satisfaction scores",
            "Process efficiency improvements",
            "Cost savings delivered",
            "Strategic clarity achieved"
          ],
          marketPosition: "Leading communications engineering firm specializing in critical infrastructure and utility communications",
          updatedAt: new Date()
        }
      });
      console.log('✅ Main company record also updated with business intelligence');
    }

  } catch (error) {
    console.error('❌ Error enriching TOP Engineers Plus workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
if (require.main === module) {
  enrichTopEngineersPlusWorkspace();
}

module.exports = { enrichTopEngineersPlusWorkspace, TOP_ENGINEERS_PLUS_DATA };
