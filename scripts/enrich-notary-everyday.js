/**
 * 📝 NOTARY EVERYDAY WORKSPACE ENRICHMENT
 * 
 * Enriches the Notary Everyday workspace with business context data
 * extracted from their website and business model analysis
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Notary Everyday business data extracted from https://www.notaryeveryday.com/
const NOTARY_EVERYDAY_DATA = {
  businessModel: "Notary Services",
  industry: "Professional Services",
  serviceOfferings: [
    "Mobile Notary Services",
    "Document Notarization",
    "Real Estate Notarization",
    "Legal Document Services",
    "Business Document Services",
    "Personal Document Services",
    "Remote Online Notarization",
    "Notary Public Services"
  ],
  productPortfolio: [
    "Mobile Notary Services",
    "Document Notarization",
    "Real Estate Closing Services",
    "Legal Document Notarization",
    "Business Document Notarization",
    "Personal Document Notarization",
    "Remote Online Notarization",
    "Emergency Notary Services",
    "Weekend Notary Services",
    "After-Hours Notary Services"
  ],
  valuePropositions: [
    "Convenient everyday notary services",
    "Mobile notary services for your convenience",
    "Professional and reliable notarization",
    "Flexible scheduling and availability",
    "Experienced and certified notary public",
    "Quick and efficient document processing",
    "Personalized service for all document needs"
  ],
  targetIndustries: [
    "Real Estate",
    "Legal Services",
    "Financial Services",
    "Healthcare",
    "Business Services",
    "Government",
    "Insurance",
    "Education",
    "Personal Services",
    "Estate Planning"
  ],
  targetCompanySize: [
    "Individual (1 person)",
    "Small (2-10 employees)",
    "Mid-size (10-100 employees)",
    "Large (100+ employees)"
  ],
  idealCustomerProfile: `Notary Everyday serves individuals and businesses that need reliable, convenient notary services. Their ideal customers are:

- Individuals needing personal document notarization
- Real estate professionals requiring closing services
- Legal professionals needing document authentication
- Business owners requiring contract notarization
- Healthcare professionals needing medical document services
- Financial services requiring loan document notarization
- Government agencies needing official document services
- Insurance companies requiring claim document services
- Educational institutions needing academic document services
- Estate planning professionals requiring will notarization

Key characteristics:
- People who value convenience and flexibility
- Businesses needing reliable document services
- Professionals requiring quick turnaround times
- Individuals with urgent notarization needs
- Organizations that appreciate personalized service
- Clients who need mobile or remote services
- Customers requiring professional and certified services`,
  competitiveAdvantages: [
    "Convenient everyday availability",
    "Mobile notary services for flexibility",
    "Professional and certified notary public",
    "Quick and efficient processing",
    "Personalized service approach",
    "Flexible scheduling options",
    "Reliable and trustworthy service"
  ],
  salesMethodology: "Service-focused approach emphasizing convenience, reliability, and professional expertise. Highlights mobile services, flexible scheduling, and personalized attention. Focuses on building trust through certified professionalism and efficient document processing."
};

async function enrichNotaryEverydayWorkspace() {
  try {
    console.log('📝 Starting Notary Everyday workspace enrichment...');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found. Available workspaces:');
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
        businessModel: NOTARY_EVERYDAY_DATA.businessModel,
        industry: NOTARY_EVERYDAY_DATA.industry,
        serviceOfferings: NOTARY_EVERYDAY_DATA.serviceOfferings,
        productPortfolio: NOTARY_EVERYDAY_DATA.productPortfolio,
        valuePropositions: NOTARY_EVERYDAY_DATA.valuePropositions,
        targetIndustries: NOTARY_EVERYDAY_DATA.targetIndustries,
        targetCompanySize: NOTARY_EVERYDAY_DATA.targetCompanySize,
        idealCustomerProfile: NOTARY_EVERYDAY_DATA.idealCustomerProfile,
        competitiveAdvantages: NOTARY_EVERYDAY_DATA.competitiveAdvantages,
        salesMethodology: NOTARY_EVERYDAY_DATA.salesMethodology,
        updatedAt: new Date()
      }
    });

    console.log('✅ Notary Everyday workspace enriched successfully!');
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
        name: { contains: 'Notary Everyday', mode: 'insensitive' }
      }
    });

    if (mainCompany) {
      await prisma.companies.update({
        where: { id: mainCompany.id },
        data: {
          businessChallenges: [
            "Finding convenient notary services",
            "Document authentication delays",
            "Scheduling flexibility needs",
            "Professional service reliability",
            "Mobile service requirements"
          ],
          businessPriorities: [
            "Convenient service delivery",
            "Professional reliability",
            "Flexible scheduling",
            "Quick turnaround times",
            "Personalized attention"
          ],
          competitiveAdvantages: NOTARY_EVERYDAY_DATA.competitiveAdvantages,
          growthOpportunities: [
            "Mobile notary expansion",
            "Remote online notarization",
            "Business document services",
            "Real estate closing services",
            "Emergency notary services"
          ],
          strategicInitiatives: [
            "Convenient everyday availability",
            "Mobile service expansion",
            "Professional certification",
            "Personalized service approach",
            "Flexible scheduling options"
          ],
          successMetrics: [
            "Service completion rate",
            "Client satisfaction scores",
            "Response time metrics",
            "Service reliability",
            "Customer retention rates"
          ],
          marketPosition: "Leading notary services provider specializing in convenient, mobile, and professional document notarization",
          updatedAt: new Date()
        }
      });
      console.log('✅ Main company record also updated with business intelligence');
    }

  } catch (error) {
    console.error('❌ Error enriching Notary Everyday workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
if (require.main === module) {
  enrichNotaryEverydayWorkspace();
}

module.exports = { enrichNotaryEverydayWorkspace, NOTARY_EVERYDAY_DATA };
