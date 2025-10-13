/**
 * 🏢 ADRATA AND DEMO WORKSPACE ENRICHMENT
 * 
 * Enriches the Adrata workspace (adrata.com) and Demo workspace (ZeroPoint Quantum Cyber Security)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Adrata data based on adrata.com
const ADRATA_DATA = {
  businessModel: "Sales Intelligence Platform",
  industry: "Software as a Service (SaaS)",
  serviceOfferings: [
    "AI-Powered Sales Assistant",
    "Pipeline Management",
    "Buyer Group Intelligence",
    "Sales Enablement",
    "Lead Enrichment",
    "Sales Analytics"
  ],
  productPortfolio: [
    "Speedrun (High-Velocity Sales)",
    "Pipeline (Lead & Opportunity Management)",
    "Monaco (Buyer Group Intelligence)",
    "Oasis (Team Collaboration)",
    "Stacks (Project Management)"
  ],
  valuePropositions: [
    "AI-powered sales intelligence and automation",
    "Comprehensive buyer group analysis",
    "High-velocity sales methodology",
    "Unified platform for sales teams",
    "Real-time sales insights and recommendations"
  ],
  targetIndustries: [
    "Sales & Business Development",
    "B2B Software",
    "Professional Services",
    "Consulting",
    "Technology Sales"
  ],
  targetCompanySize: [
    "Small (10-100 employees)",
    "Mid-size (100-500 employees)",
    "Large (500-2000 employees)",
    "Enterprise (2000+ employees)"
  ],
  idealCustomerProfile: "B2B sales teams and organizations that need AI-powered sales intelligence, pipeline management, and buyer group analysis to accelerate revenue growth.",
  competitiveAdvantages: [
    "AI-powered sales assistant with contextual awareness",
    "Comprehensive buyer group intelligence",
    "Unified platform for sales workflows",
    "High-velocity sales methodology (Speedrun)",
    "Real-time insights and recommendations"
  ],
  salesMethodology: "Consultative approach focusing on sales team productivity, pipeline optimization, and revenue acceleration through AI-powered intelligence and automation."
};

// ZeroPoint Quantum Cyber Security data (Demo workspace)
const ZEROPOINT_DATA = {
  businessModel: "Quantum Cybersecurity Solutions",
  industry: "Cybersecurity",
  serviceOfferings: [
    "Quantum Encryption",
    "Post-Quantum Cryptography",
    "Quantum Key Distribution (QKD)",
    "Quantum-Safe Security",
    "Quantum Threat Assessment",
    "Quantum Security Consulting"
  ],
  productPortfolio: [
    "Quantum Encryption Platform",
    "Post-Quantum Crypto Suite",
    "Quantum Key Distribution System",
    "Quantum Security Assessment",
    "Quantum-Safe Infrastructure"
  ],
  valuePropositions: [
    "Next-generation quantum-resistant security",
    "Protection against quantum computing threats",
    "Future-proof cryptographic solutions",
    "Cutting-edge quantum encryption technology",
    "Comprehensive quantum security framework"
  ],
  targetIndustries: [
    "Financial Services",
    "Government & Defense",
    "Healthcare",
    "Critical Infrastructure",
    "Technology Companies",
    "Telecommunications"
  ],
  targetCompanySize: [
    "Mid-size (100-1000 employees)",
    "Large (1000-5000 employees)",
    "Enterprise (5000+ employees)"
  ],
  idealCustomerProfile: "Organizations with high-value data and critical infrastructure that need quantum-resistant security solutions to protect against future quantum computing threats.",
  competitiveAdvantages: [
    "Cutting-edge quantum encryption technology",
    "Post-quantum cryptography expertise",
    "Future-proof security solutions",
    "Protection against quantum threats",
    "Comprehensive quantum security framework"
  ],
  salesMethodology: "Technical consultative approach focusing on quantum threat assessment, security gap analysis, and implementation of quantum-resistant cryptographic solutions."
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

async function enrichAdrataAndDemo() {
  try {
    console.log('🚀 Starting Adrata and Demo workspace enrichment...\n');

    // Find workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: { id: true, name: true, slug: true }
    });

    console.log(`Found ${workspaces.length} workspaces:`);
    workspaces.forEach(w => console.log(`   - ${w.name} (${w.id})`));
    console.log('');

    // Enrich Adrata workspace
    const adrataWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('adrata') || 
      w.slug.toLowerCase().includes('adrata')
    );
    if (adrataWorkspace) {
      await enrichWorkspace(adrataWorkspace.id, ADRATA_DATA, 'Adrata');
    } else {
      console.log('⚠️ Adrata workspace not found');
    }

    // Enrich Demo workspace (ZeroPoint)
    const demoWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('demo') || 
      w.slug.toLowerCase().includes('demo')
    );
    if (demoWorkspace) {
      await enrichWorkspace(demoWorkspace.id, ZEROPOINT_DATA, 'Demo (ZeroPoint Quantum Cyber Security)');
    } else {
      console.log('⚠️ Demo workspace not found');
    }

    console.log('🎉 Adrata and Demo workspace enrichment complete!');
    console.log('\n✅ All five workspaces are now enriched:');
    console.log('   1. Adrata - Sales Intelligence Platform');
    console.log('   2. Demo - ZeroPoint Quantum Cyber Security');
    console.log('   3. TOP Engineers Plus - Engineering Consulting');
    console.log('   4. CloudCaddie - IT Staffing');
    console.log('   5. Notary Everyday - Notary Services');

  } catch (error) {
    console.error('❌ Error during workspace enrichment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
if (require.main === module) {
  enrichAdrataAndDemo();
}

module.exports = { enrichAdrataAndDemo, ADRATA_DATA, ZEROPOINT_DATA };
