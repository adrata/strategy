const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class IntelligenceDataSaver {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
  }

  async execute() {
    console.log('💾 SAVING 5BARS SERVICES INTELLIGENCE DATA');
    console.log('==========================================');

    try {
      // Get current company data
      const currentCompany = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        select: {
          name: true,
          customFields: true,
        }
      });

      if (!currentCompany) {
        throw new Error('Company not found in database');
      }

      const coresignalData = currentCompany.customFields?.coresignalData;
      if (!coresignalData) {
        throw new Error('No CoreSignal data found');
      }

      // Generate intelligence data based on CoreSignal data
      const intelligenceData = this.generateIntelligenceData(coresignalData);

      // Update company with intelligence data
      const updatedCustomFields = {
        ...currentCompany.customFields,
        intelligenceData: intelligenceData,
        intelligenceGeneratedAt: new Date().toISOString()
      };

      const updatedCompany = await this.prisma.companies.update({
        where: { id: this.companyId },
        data: {
          customFields: updatedCustomFields,
          updatedAt: new Date()
        },
        select: {
          name: true,
          customFields: true,
        }
      });

      console.log('✅ Intelligence data saved successfully!');
      console.log('Company:', updatedCompany.name);
      console.log('Intelligence sections:', Object.keys(intelligenceData));
      
      return updatedCompany;

    } catch (error) {
      console.error('❌ Error saving intelligence data:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  generateIntelligenceData(coresignalData) {
    const employeeCount = coresignalData.employees_count;
    const foundedYear = coresignalData.founded_year;
    const companyType = coresignalData.type;
    const categories = coresignalData.categories_and_keywords || [];

    const currentYear = new Date().getFullYear();
    const age = foundedYear ? currentYear - parseInt(foundedYear) : null;

    // Situation (3 subsections)
    const situation = {
      businessContext: {
        content: employeeCount && foundedYear && companyType 
          ? `5 Bars Services operates as a lean, privately-held telecommunications infrastructure specialist with ${employeeCount} employees and ${age} years of market presence, enabling rapid decision-making and personalized service delivery as an agile alternative to larger telecom contractors.`
          : 'Business context analysis pending enrichment.'
      },
      marketPosition: {
        content: categories.length > 0 
          ? `5 Bars Services has strategically positioned itself as a comprehensive telecommunications infrastructure specialist, offering end-to-end solutions across ${categories.length} distinct service categories spanning underground infrastructure, fiber installation, small cell & DAS deployment, directional drilling, and structured cabling, enabling them to serve as a single-source provider for complex telecom projects while positioning advantageously in the evolving 5G and fiber expansion markets.`
          : 'Market position analysis pending enrichment.'
      },
      financialHealth: {
        content: employeeCount && foundedYear && companyType
          ? `As a privately-held entity with ${employeeCount} employees and ${age} years of operational history, 5 Bars Services demonstrates financial resilience through lean operations, strong cash flow management, and successful navigation of economic cycles, with private ownership providing operational flexibility and rapid decision-making capabilities critical in the capital-intensive telecommunications infrastructure sector.`
          : 'Financial health analysis pending enrichment.'
      }
    };

    // Complications (3 subsections)
    const complications = {
      businessChallenges: {
        content: employeeCount && categories.length > 0
          ? `5 Bars Services confronts significant operational challenges with a lean workforce of ${employeeCount} employees managing ${categories.length} distinct service categories, facing capacity constraints, skilled labor shortages in emerging technologies, equipment cost volatility, complex multi-state permitting requirements, and competition from larger contractors with deeper financial resources and economies of scale.`
          : 'Business challenges analysis pending enrichment.'
      },
      competitiveThreats: {
        content: employeeCount && companyType && categories.length > 0
          ? `The competitive landscape presents formidable challenges with large telecommunications contractors leveraging economies of scale, technology companies offering integrated infrastructure solutions, local competitors with lower overhead costs, and automation reducing demand for manual installation services, while the company's ${categories.length} service categories require significant expertise investment across multiple domains, creating vulnerability to more specialized competitors.`
          : 'Competitive threats analysis pending enrichment.'
      },
      operationalPainPoints: {
        content: employeeCount && categories.length > 0
          ? `Operational execution presents significant challenges with ${employeeCount} employees managing ${categories.length} distinct service categories, creating resource allocation complexities, skilled labor shortages, equipment cost volatility, weather-dependent project risks, complex multi-jurisdiction permitting, and quality control overhead that larger competitors can absorb more efficiently.`
          : 'Operational pain points analysis pending enrichment.'
      }
    };

    // Strategic Intelligence (3 subsections)
    const strategicIntelligence = {
      strategicInitiatives: {
        content: employeeCount && categories.length > 0
          ? `5 Bars Services' strategic roadmap centers on government contract portfolio expansion, technology modernization investments in ${categories.filter(cat => cat.includes('5g') || cat.includes('fiber') || cat.includes('wireless') || cat.includes('small cell') || cat.includes('das')).slice(0, 2).join(' and ')} infrastructure to capitalize on the 5G and fiber expansion wave, geographic expansion across Texas, Oklahoma, Louisiana, and Arkansas, safety program enhancement as a key differentiator, and strategic partnerships with leading network suppliers for cutting-edge technology access and preferred pricing.`
          : 'Strategic initiatives analysis pending enrichment.'
      },
      growthOpportunities: {
        content: categories.length > 0
          ? `Growth opportunities based on ${categories.length} service categories include ${categories.filter(cat => cat.includes('small cell') || cat.includes('das') || cat.includes('wireless') || cat.includes('fiber') || cat.includes('5g')).slice(0, 2).join(' and ')} deployment for urban areas, government infrastructure spending increases, technology consulting services expansion, partner channel development with telecom providers, and geographic expansion leveraging existing service capabilities.`
          : 'Growth opportunities analysis pending enrichment.'
      },
      topPartnershipPotential: {
        content: employeeCount && categories.length > 0
          ? `High partnership potential with ${employeeCount} employees managing ${categories.length} service categories includes engineering talent acquisition for specialized telecom roles, project management expertise for complex infrastructure projects, safety training and certification programs, technology consulting for modernization, and geographic expansion support across multi-state operations.`
          : 'TOP partnership potential analysis pending enrichment.'
      }
    };

    return {
      situation,
      complications,
      strategicIntelligence,
      generatedAt: new Date().toISOString(),
      dataPoints: {
        employeeCount,
        foundedYear,
        companyType,
        serviceCategories: categories.length,
        age
      }
    };
  }
}

// Execute the script
async function main() {
  const saver = new IntelligenceDataSaver();
  await saver.execute();
}

main().catch(console.error);
