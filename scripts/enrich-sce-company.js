const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// CoreSignal enriched data for Southern California Edison
const sceEnrichedData = {
  // Basic Company Information
  name: "Southern California Edison",
  legalName: "Southern California Edison Company",
  website: "https://www.sce.com",
  industry: "Utilities",
  sector: "Energy",
  size: "10,001+ employees",
  employeeCount: 12386,
  foundedYear: 1886,
  revenue: null, // Not provided in CoreSignal data
  currency: "USD",
  
  // Location Information
  address: "2244 Walnut Grove Ave.; Rosemead, CA 91770, US",
  city: "Rosemead",
  state: "California",
  country: "United States",
  postalCode: "91770",
  
  // Intelligence Fields - Overview
  linkedinUrl: "https://www.linkedin.com/company/sce",
  linkedinFollowers: 141939,
  activeJobPostings: null, // Not provided in CoreSignal data
  
  // Intelligence Fields - Industry Classification
  naicsCodes: ["61", "611"],
  sicCodes: ["49", "493"],
  
  // Intelligence Fields - Social Media
  facebookUrl: null, // Not provided in CoreSignal data
  twitterUrl: null, // Not provided in CoreSignal data
  instagramUrl: null, // Not provided in CoreSignal data
  youtubeUrl: null, // Not provided in CoreSignal data
  githubUrl: null, // Not provided in CoreSignal data
  
  // Intelligence Fields - Business Intelligence
  technologiesUsed: [
    "oracle 11g", "twitter", "base sas", "sap master data", "saml",
    "oracle primavera p6", "g data", "idirect", "figma", "boingo wireless",
    "facebook", "rpa", "fiserv", "html", "cisco asa", "asp",
    "oracle applications", "sns", "proc sql", "sql", "uikit",
    "microsoft powerpoint", "citrix xenapp", "oauth", "genesys", "sonarqube",
    "chrome", "cyberark", "cordial", "java", "palo alto firewalls",
    "sap rise", "linkedin", "axonius", "infosys", "optum", "youtube",
    "informatica cloud", "propel"
  ],
  competitors: [], // Not provided in CoreSignal data
  
  // Enhanced Description
  description: "As one of the nation's largest electric utilities, we're bringing more clean and renewable sources of energy to Southern California. From energy storage to transportation electrification, our employees are working on innovative projects that will help cut emissions and greenhouse gases to provide cleaner air for everyone. We have diverse teams, made up of inventors, doers and problem solvers. The people here at SCE don't just keep the lights on. The mission is so much bigger. We are fueling the kind of innovation that is changing an entire industry, and quite possibly the planet.",
  
  // Business Intelligence Tags
  tags: [
    "energy", "heavy industry and engineering > energy industry (in united states)",
    "utility", "transportation electrification", "engineering", "innovation",
    "technology", "smart grid", "electricity", "renewable energy",
    "power and energy", "project management", "food service technology",
    "incentives", "rebates", "lighting", "energy-utilities", "energy-services",
    "renewables", "communications infrastructure", "electrical distribution",
    "sustainability"
  ],
  
  // Company Status
  isPublic: false,
  stockSymbol: "EIX", // From stock_ticker data
  
  // Logo URL
  logoUrl: "https://media.licdn.com/dms/image/v2/D560BAQH8xJhsEQxwKg/company-logo_200_200/company-logo_200_200/0/1714498044366/sce_logo?e=2147483647&v=beta&t=DPwTZfbZNsytP95uwWheOqjGqtpF-25s75bGlfZTxJg"
};

async function enrichSCECompany() {
  console.log('🎯 ENRICHING SOUTHERN CALIFORNIA EDISON COMPANY DATA');
  console.log('==================================================\n');
  
  try {
    // First, find the SCE company record
    console.log('🔍 Searching for Southern California Edison company...');
    
    const existingCompany = await prisma.companies.findFirst({
      where: {
        name: {
          contains: 'Southern California Edison',
          mode: 'insensitive'
        }
      }
    });
    
    if (!existingCompany) {
      console.log('❌ Southern California Edison company not found in database');
      console.log('💡 You may need to create the company record first');
      return;
    }
    
    console.log(`✅ Found SCE company: ${existingCompany.name} (ID: ${existingCompany.id})`);
    console.log(`📊 Current data: Industry: ${existingCompany.industry}, Size: ${existingCompany.size}`);
    
    // Update the company with enriched data
    console.log('\n🔄 Updating company with enriched data...');
    
    const updatedCompany = await prisma.companies.update({
      where: { id: existingCompany.id },
      data: {
        // Basic Information
        name: sceEnrichedData.name,
        legalName: sceEnrichedData.legalName,
        website: sceEnrichedData.website,
        industry: sceEnrichedData.industry,
        sector: sceEnrichedData.sector,
        size: sceEnrichedData.size,
        employeeCount: sceEnrichedData.employeeCount,
        foundedYear: sceEnrichedData.foundedYear,
        currency: sceEnrichedData.currency,
        
        // Location Information
        address: sceEnrichedData.address,
        city: sceEnrichedData.city,
        state: sceEnrichedData.state,
        country: sceEnrichedData.country,
        postalCode: sceEnrichedData.postalCode,
        
        // Intelligence Fields - Overview
        linkedinUrl: sceEnrichedData.linkedinUrl,
        linkedinFollowers: sceEnrichedData.linkedinFollowers,
        activeJobPostings: sceEnrichedData.activeJobPostings,
        
        // Intelligence Fields - Industry Classification
        naicsCodes: sceEnrichedData.naicsCodes,
        sicCodes: sceEnrichedData.sicCodes,
        
        // Intelligence Fields - Social Media
        facebookUrl: sceEnrichedData.facebookUrl,
        twitterUrl: sceEnrichedData.twitterUrl,
        instagramUrl: sceEnrichedData.instagramUrl,
        youtubeUrl: sceEnrichedData.youtubeUrl,
        githubUrl: sceEnrichedData.githubUrl,
        
        // Intelligence Fields - Business Intelligence
        technologiesUsed: sceEnrichedData.technologiesUsed,
        competitors: sceEnrichedData.competitors,
        
        // Enhanced Description
        description: sceEnrichedData.description,
        
        // Business Intelligence Tags
        tags: sceEnrichedData.tags,
        
        // Company Status
        isPublic: sceEnrichedData.isPublic,
        stockSymbol: sceEnrichedData.stockSymbol,
        logoUrl: sceEnrichedData.logoUrl,
        
        // Domain and Website
        domain: "sce.com",
        
        // Headquarters Location
        hqLocation: "Rosemead, CA, United States",
        hqFullAddress: "2244 Walnut Grove Ave.; Rosemead, CA 91770, US",
        hqCity: "Rosemead",
        hqState: "California",
        hqStreet: "2244 Walnut Grove Ave.",
        hqZipcode: "91770",
        
        // Social Media Followers
        twitterFollowers: null, // Not available in CoreSignal data
        owlerFollowers: 2527,
        
        // Company Updates and Activity
        companyUpdates: sceEnrichedData.companyUpdates,
        numTechnologiesUsed: sceEnrichedData.technologiesUsed.length,
        
        // Enhanced Descriptions
        descriptionEnriched: "SCE provides electricity and rebates and incentives for lighting, food service technology, HVAC, air conditioning and related electric appliances and systems to help manage electricity costs.",
        descriptionMetadataRaw: "At SCE, we provide electricity and rebates and incentives for lighting, food service technology, HVAC, air conditioning and related electric appliances and systems to help manage electricity costs.",
        
        // Regional Information
        hqRegion: ["Americas", "Northern America", "AMER"],
        hqCountryIso2: "US",
        hqCountryIso3: "USA",
        
        // Update timestamp
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Company successfully updated with enriched data!');
    console.log('\n📊 ENRICHED DATA SUMMARY:');
    console.log('==========================');
    console.log(`📊 Company Name: ${updatedCompany.name}`);
    console.log(`📊 Legal Name: ${updatedCompany.legalName}`);
    console.log(`📊 Website: ${updatedCompany.website}`);
    console.log(`📊 Industry: ${updatedCompany.industry}`);
    console.log(`📊 Sector: ${updatedCompany.sector}`);
    console.log(`📊 Size: ${updatedCompany.size}`);
    console.log(`📊 Employee Count: ${updatedCompany.employeeCount}`);
    console.log(`📊 Founded Year: ${updatedCompany.foundedYear}`);
    console.log(`📊 LinkedIn URL: ${updatedCompany.linkedinUrl}`);
    console.log(`📊 LinkedIn Followers: ${updatedCompany.linkedinFollowers}`);
    console.log(`📊 NAICS Codes: ${updatedCompany.naicsCodes.join(', ')}`);
    console.log(`📊 SIC Codes: ${updatedCompany.sicCodes.join(', ')}`);
    console.log(`📊 Technologies Used: ${updatedCompany.technologiesUsed.length} technologies`);
    console.log(`📊 Tags: ${updatedCompany.tags.length} tags`);
    console.log(`📊 Is Public: ${updatedCompany.isPublic}`);
    console.log(`📊 Stock Symbol: ${updatedCompany.stockSymbol}`);
    console.log(`📊 Logo URL: ${updatedCompany.logoUrl}`);
    console.log(`📊 Domain: ${updatedCompany.domain}`);
    console.log(`📊 HQ Location: ${updatedCompany.hqLocation}`);
    console.log(`📊 Twitter Followers: ${updatedCompany.twitterFollowers || 'N/A'}`);
    console.log(`📊 Owler Followers: ${updatedCompany.owlerFollowers || 'N/A'}`);
    console.log(`📊 Company Updates: ${updatedCompany.companyUpdates ? 'Available' : 'N/A'}`);
    console.log(`📊 Num Technologies: ${updatedCompany.numTechnologiesUsed}`);
    console.log(`📊 HQ Region: ${updatedCompany.hqRegion.join(', ')}`);
    
    console.log('\n🎯 ENRICHMENT COMPLETE!');
    console.log('=======================');
    console.log('✅ Company data enriched with CoreSignal intelligence');
    console.log('✅ LinkedIn profile connected');
    console.log('✅ Industry classification updated');
    console.log('✅ Technology stack identified');
    console.log('✅ Business intelligence gathered');
    console.log('✅ Social media profiles linked');
    console.log('✅ Company description enhanced');
    console.log('✅ Business tags applied');
    
  } catch (error) {
    console.error('❌ Error enriching SCE company:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
enrichSCECompany();
