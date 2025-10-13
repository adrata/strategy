const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple string similarity function
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = (s1, s2) => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };
  
  return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday

// People data from user
const peopleData = [
  {
    "name": "Lauren Burge",
    "title": "Senior Escrow Officer",
    "email": "lburge@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Eric Miller",
    "title": "Senior Escrow Officer",
    "email": "emiller@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Brittany Dunham",
    "title": "Escrow Officer",
    "email": "bdunham@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Theresa Whitehead",
    "title": "Escrow Officer",
    "email": "twhitehead@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Anna Montoya",
    "title": "Escrow Officer",
    "email": "amontoya@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Samantha Bravo",
    "title": "Escrow Officer",
    "email": "sbravo@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Ashley Canales",
    "title": "Escrow Assistant",
    "email": "acanales@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Stephanie Rodriguez",
    "title": "Escrow Assistant",
    "email": "srodriguez@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Susan Siqueiros",
    "title": "Manager",
    "email": "ssiqueiros@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Jose Covarrubias",
    "title": "Owner",
    "email": "jcovarrubias@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  },
  {
    "name": "Adrienne Covarrubias",
    "title": "Owner",
    "email": "acovarrubias@notaryeveryday.com",
    "phone": "+1 702-487-2200",
    "company": "Notary Everyday",
    "location": "Las Vegas, Nevada"
  }
];

class PeopleBatchProcessor {
  constructor() {
    this.results = {
      totalProvided: peopleData.length,
      alreadyExisted: 0,
      newlyCreated: 0,
      linked: 0,
      enriched: 0,
      companiesFound: 0,
      companiesCreated: 0,
      companiesForBuyerGroup: new Set(),
      errors: []
    };
  }

  normalizeCompanyName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  async findOrCreateCompany(companyName, locationInfo) {
    const normalizedName = this.normalizeCompanyName(companyName);
    
    // First, try exact match
    let company = await prisma.companies.findFirst({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { name: { equals: companyName, mode: 'insensitive' } },
          { name: { contains: companyName, mode: 'insensitive' } }
        ]
      }
    });

    if (company) {
      this.results.companiesFound++;
      return company;
    }

    // Try fuzzy matching
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null
      },
      select: { id: true, name: true }
    });

    for (const existingCompany of allCompanies) {
      const similarity = calculateSimilarity(
        normalizedName,
        this.normalizeCompanyName(existingCompany.name)
      );
      
      if (similarity >= 0.85) {
        console.log(`   🔗 Fuzzy matched "${companyName}" to existing company "${existingCompany.name}" (${(similarity * 100).toFixed(1)}%)`);
        this.results.companiesFound++;
        return existingCompany;
      }
    }

    // Create new company
    console.log(`   🏢 Creating new company: "${companyName}"`);
    
    // Parse location
    let city = null;
    let state = null;
    let country = 'United States';
    
    if (locationInfo) {
      const parts = locationInfo.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        city = parts[0];
        state = parts[1];
      } else if (parts.length === 1) {
        city = parts[0];
      }
    }

    const newCompany = await prisma.companies.create({
      data: {
        workspaceId: WORKSPACE_ID,
        name: companyName,
        city: city,
        state: state,
        country: country,
        status: 'ACTIVE',
        priority: 'MEDIUM',
        industry: 'Title Insurance',
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {
          createdFrom: 'batch_people_import',
          sourceLocation: locationInfo,
          createdAt: new Date().toISOString()
        }
      }
    });

    this.results.companiesCreated++;
    return newCompany;
  }

  async processPerson(personData) {
    try {
      console.log(`\n👤 Processing: ${personData.name}`);

      // Check if person already exists by email
      let existingPerson = await prisma.people.findFirst({
        where: {
          workspaceId: WORKSPACE_ID,
          email: personData.email,
          deletedAt: null
        }
      });

      if (existingPerson) {
        console.log(`   ✅ Person already exists (ID: ${existingPerson.id})`);
        this.results.alreadyExisted++;

        // Check if they need to be linked to a company
        if (!existingPerson.companyId && personData.company) {
          const company = await this.findOrCreateCompany(personData.company, personData.location);
          
          await prisma.people.update({
            where: { id: existingPerson.id },
            data: { 
              companyId: company.id,
              updatedAt: new Date()
            }
          });
          
          console.log(`   🔗 Linked to company: ${company.name}`);
          this.results.linked++;
          this.results.companiesForBuyerGroup.add(company.id);
        } else if (existingPerson.companyId) {
          console.log(`   ℹ️  Already linked to company`);
          this.results.companiesForBuyerGroup.add(existingPerson.companyId);
        }

        // Update enrichment data if missing
        if (!existingPerson.enrichedData || Object.keys(existingPerson.enrichedData).length === 0) {
          await this.enrichPerson(existingPerson.id, personData);
        }

        return existingPerson;
      }

      // Create new person
      console.log(`   ➕ Creating new person`);
      
      // Find or create company
      const company = await this.findOrCreateCompany(personData.company, personData.location);
      
      // Parse location for person
      let personCity = null;
      let personState = null;
      let personCountry = 'United States';
      
      if (personData.location) {
        const parts = personData.location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          personCity = parts[0];
          personState = parts[1];
        } else if (parts.length === 1) {
          personCity = parts[0];
        }
      }

      const newPerson = await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          companyId: company.id,
          fullName: personData.name,
          firstName: personData.name.split(' ')[0],
          lastName: personData.name.split(' ').slice(1).join(' '),
          email: personData.email,
          phone: personData.phone,
          jobTitle: personData.title,
          city: personCity,
          state: personState,
          country: personCountry,
          status: 'PROSPECT',
          priority: 'MEDIUM',
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            importSource: 'batch_people_import',
            originalData: personData,
            importedAt: new Date().toISOString()
          }
        }
      });

      console.log(`   ✅ Created new person (ID: ${newPerson.id}) and linked to ${company.name}`);
      this.results.newlyCreated++;
      this.results.linked++;
      this.results.companiesForBuyerGroup.add(company.id);

      // Enrich the new person
      await this.enrichPerson(newPerson.id, personData);

      return newPerson;
    } catch (error) {
      console.error(`   ❌ Error processing ${personData.name}: ${error.message}`);
      this.results.errors.push({
        person: personData.name,
        error: error.message
      });
      return null;
    }
  }

  async enrichPerson(personId, personData) {
    try {
      const enrichedData = {
        overview: {
          fullName: personData.name,
          title: personData.title,
          company: personData.company,
          location: personData.location,
          email: personData.email,
          phone: personData.phone
        },
        contact: {
          email: personData.email,
          phone: personData.phone
        },
        professional: {
          currentTitle: personData.title,
          currentCompany: personData.company
        },
        enrichedAt: new Date().toISOString(),
        source: 'batch_import'
      };

      await prisma.people.update({
        where: { id: personId },
        data: {
          enrichedData: enrichedData,
          updatedAt: new Date()
        }
      });

      console.log(`   📊 Enriched person data`);
      this.results.enriched++;
    } catch (error) {
      console.error(`   ⚠️  Error enriching person: ${error.message}`);
    }
  }

  async processAll() {
    console.log('🚀 BATCH PEOPLE PROCESSING');
    console.log('=' .repeat(60));
    console.log(`Processing ${peopleData.length} people for Notary Everyday workspace`);

    for (const personData of peopleData) {
      await this.processPerson(personData);
    }

    await this.generateReport();
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH PROCESSING COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📥 INPUT:`);
    console.log(`   Total people provided: ${this.results.totalProvided}`);
    
    console.log(`\n👥 PEOPLE RESULTS:`);
    console.log(`   Already existed: ${this.results.alreadyExisted}`);
    console.log(`   Newly created: ${this.results.newlyCreated}`);
    console.log(`   Total linked: ${this.results.linked}`);
    console.log(`   Total enriched: ${this.results.enriched}`);
    
    console.log(`\n🏢 COMPANY RESULTS:`);
    console.log(`   Companies found: ${this.results.companiesFound}`);
    console.log(`   Companies created: ${this.results.companiesCreated}`);
    console.log(`   Companies needing buyer group intelligence: ${this.results.companiesForBuyerGroup.size}`);

    if (this.results.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.results.errors.length}):`);
      this.results.errors.forEach(err => {
        console.log(`   - ${err.person}: ${err.error}`);
      });
    }

    // Get final stats
    const finalStats = await this.getFinalStats();
    console.log(`\n📈 WORKSPACE FINAL STATS:`);
    console.log(`   Total people: ${finalStats.totalPeople}`);
    console.log(`   Linked people: ${finalStats.linkedPeople}`);
    console.log(`   Linkage rate: ${finalStats.linkageRate}%`);
    console.log(`   Total companies: ${finalStats.totalCompanies}`);

    // Save companies that need buyer group intelligence
    const companiesForBuyerGroup = Array.from(this.results.companiesForBuyerGroup);
    const fs = require('fs');
    fs.writeFileSync(
      'companies-for-buyer-group.json',
      JSON.stringify(companiesForBuyerGroup, null, 2)
    );
    console.log(`\n💾 Saved ${companiesForBuyerGroup.length} company IDs for buyer group intelligence to companies-for-buyer-group.json`);

    return this.results;
  }

  async getFinalStats() {
    const totalPeople = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, deletedAt: null }
    });

    const linkedPeople = await prisma.people.count({
      where: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null }
      }
    });

    const totalCompanies = await prisma.companies.count({
      where: { workspaceId: WORKSPACE_ID, deletedAt: null }
    });

    const linkageRate = ((linkedPeople / totalPeople) * 100).toFixed(1);

    return {
      totalPeople,
      linkedPeople,
      totalCompanies,
      linkageRate
    };
  }
}

async function main() {
  const processor = new PeopleBatchProcessor();
  await processor.processAll();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

