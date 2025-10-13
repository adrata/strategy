/**
 * 🏢 SIMPLE WORKSPACE ENRICHMENT
 * 
 * Simple script to enrich workspaces with business context data
 * Updates fields one by one to avoid database issues
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// TOP Engineers Plus data
const TOP_ENGINEERS_DATA = {
  businessModel: "Engineering Consulting",
  industry: "Communications Engineering",
  serviceOfferings: ["Communications Engineering", "Critical Infrastructure Engineering", "Broadband Deployment", "Process Optimization", "Change Management"],
  productPortfolio: ["Strategic Plan Review", "Gap Analysis", "Process Mapping", "Technology Deployment", "Infrastructure Modernization"],
  valuePropositions: ["Technology, Operations, and People integration", "Turning complex challenges into simple solutions", "Decades of experience in critical infrastructure"],
  targetIndustries: ["Electric Utilities", "Municipalities", "Infrastructure Organizations", "Broadband Providers"],
  targetCompanySize: ["Mid-size (100-1000 employees)", "Large (1000+ employees)", "Enterprise (5000+ employees)"],
  idealCustomerProfile: "Electric utilities, municipalities, and infrastructure organizations needing communications engineering expertise and process optimization.",
  competitiveAdvantages: ["Decades of utility communications experience", "Technology + Operations + People focus", "Proven complex-to-simple methodology"],
  salesMethodology: "Strategic consultation with gap analysis, stakeholder engagement, and process alignment focus."
};

// CloudCaddie data
const CLOUDCADDIE_DATA = {
  businessModel: "IT Staffing & Talent Acquisition",
  industry: "Information Technology",
  serviceOfferings: ["IT Staffing Solutions", "Talent Acquisition Strategy", "Direct Hire Placement", "Contract Staffing", "Contract-to-Hire"],
  productPortfolio: ["Direct Hire Services", "Contract Staffing", "Contract-to-Hire Solutions", "Talent Acquisition Strategy"],
  valuePropositions: ["Proactive recruiting model", "High-performing technology teams", "Tailored solutions for unique hiring needs"],
  targetIndustries: ["Technology Companies", "Software Development", "IT Services", "Fintech", "Healthcare Technology"],
  targetCompanySize: ["Small (10-50 employees)", "Mid-size (50-500 employees)", "Large (500-2000 employees)", "Enterprise (2000+ employees)"],
  idealCustomerProfile: "Technology companies and organizations that need to build high-performing IT teams with urgent hiring needs for technical roles.",
  competitiveAdvantages: ["Proactive recruiting model", "Deep technology knowledge", "Tailored solutions", "Consistent top talent delivery"],
  salesMethodology: "Consultative approach focusing on understanding unique hiring needs and building tailored solutions with proactive recruiting."
};

// Notary Everyday data
const NOTARY_DATA = {
  businessModel: "Notary Services",
  industry: "Professional Services",
  serviceOfferings: ["Mobile Notary Services", "Document Notarization", "Real Estate Notarization", "Legal Document Services", "Business Document Services"],
  productPortfolio: ["Mobile Notary Services", "Document Notarization", "Real Estate Closing Services", "Legal Document Notarization", "Emergency Notary Services"],
  valuePropositions: ["Convenient everyday notary services", "Mobile notary services for flexibility", "Professional and reliable notarization"],
  targetIndustries: ["Real Estate", "Legal Services", "Financial Services", "Healthcare", "Business Services"],
  targetCompanySize: ["Individual (1 person)", "Small (2-10 employees)", "Mid-size (10-100 employees)", "Large (100+ employees)"],
  idealCustomerProfile: "Individuals and businesses that need reliable, convenient notary services with flexible scheduling and professional expertise.",
  competitiveAdvantages: ["Convenient everyday availability", "Mobile notary services", "Professional certification", "Quick and efficient processing"],
  salesMethodology: "Service-focused approach emphasizing convenience, reliability, and professional expertise with flexible scheduling."
};

async function enrichWorkspace(workspaceId, data, workspaceName) {
  try {
    console.log(`🏢 Enriching ${workspaceName} workspace...`);
    
    // Update each field individually to avoid issues
    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { businessModel: data.businessModel }
    });
    console.log(`   ✅ Updated businessModel: ${data.businessModel}`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { industry: data.industry }
    });
    console.log(`   ✅ Updated industry: ${data.industry}`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { serviceOfferings: data.serviceOfferings }
    });
    console.log(`   ✅ Updated serviceOfferings: ${data.serviceOfferings.length} items`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { productPortfolio: data.productPortfolio }
    });
    console.log(`   ✅ Updated productPortfolio: ${data.productPortfolio.length} items`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { valuePropositions: data.valuePropositions }
    });
    console.log(`   ✅ Updated valuePropositions: ${data.valuePropositions.length} items`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { targetIndustries: data.targetIndustries }
    });
    console.log(`   ✅ Updated targetIndustries: ${data.targetIndustries.length} items`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { targetCompanySize: data.targetCompanySize }
    });
    console.log(`   ✅ Updated targetCompanySize: ${data.targetCompanySize.length} items`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { idealCustomerProfile: data.idealCustomerProfile }
    });
    console.log(`   ✅ Updated idealCustomerProfile`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { competitiveAdvantages: data.competitiveAdvantages }
    });
    console.log(`   ✅ Updated competitiveAdvantages: ${data.competitiveAdvantages.length} items`);

    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { salesMethodology: data.salesMethodology }
    });
    console.log(`   ✅ Updated salesMethodology`);

    console.log(`🎉 ${workspaceName} workspace enriched successfully!\n`);

  } catch (error) {
    console.error(`❌ Error enriching ${workspaceName} workspace:`, error.message);
  }
}

async function enrichAllWorkspaces() {
  try {
    console.log('🚀 Starting workspace enrichment...\n');

    // Find workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: { id: true, name: true, slug: true }
    });

    console.log(`Found ${workspaces.length} workspaces:`);
    workspaces.forEach(w => console.log(`   - ${w.name} (${w.id})`));
    console.log('');

    // Enrich TOP Engineers Plus
    const topWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('top') || 
      w.slug.toLowerCase().includes('top')
    );
    if (topWorkspace) {
      await enrichWorkspace(topWorkspace.id, TOP_ENGINEERS_DATA, 'TOP Engineers Plus');
    } else {
      console.log('⚠️ TOP Engineers Plus workspace not found');
    }

    // Enrich CloudCaddie
    const cloudcaddieWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('cloudcaddie') || 
      w.slug.toLowerCase().includes('cloudcaddie')
    );
    if (cloudcaddieWorkspace) {
      await enrichWorkspace(cloudcaddieWorkspace.id, CLOUDCADDIE_DATA, 'CloudCaddie Consulting');
    } else {
      console.log('⚠️ CloudCaddie Consulting workspace not found');
    }

    // Enrich Notary Everyday
    const notaryWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('notary') || 
      w.slug.toLowerCase().includes('notary')
    );
    if (notaryWorkspace) {
      await enrichWorkspace(notaryWorkspace.id, NOTARY_DATA, 'Notary Everyday');
    } else {
      console.log('⚠️ Notary Everyday workspace not found');
    }

    console.log('🎉 All workspace enrichment complete!');

  } catch (error) {
    console.error('❌ Error during workspace enrichment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
if (require.main === module) {
  enrichAllWorkspaces();
}

module.exports = { enrichAllWorkspaces };
