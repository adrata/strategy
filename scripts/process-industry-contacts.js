const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// Load people data from user
const rawPeopleData = JSON.parse(fs.readFileSync('industry-contacts-raw.json', 'utf8'));

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

function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|pllc|pc)\b\.?/gi, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function parseCompanyField(companyField, personTitle, personEmail) {
  // Check if this is a badge-only field (BOARDGOVERNOR, etc)
  if (companyField === 'BOARDGOVERNOR' || !companyField || companyField.trim() === '') {
    return null;
  }

  // The company field often contains: "Title Company Location Phone Email"
  // We need to extract just the company name
  
  // Remove the person's title from the beginning if it's there
  let cleaned = companyField;
  if (personTitle && companyField.startsWith(personTitle)) {
    cleaned = companyField.substring(personTitle.length).trim();
  }

  // Remove email if present
  if (personEmail && cleaned.includes(personEmail)) {
    cleaned = cleaned.replace(personEmail, '').trim();
  }

  // Remove phone numbers (patterns like 123-456-7890 or (123) 456-7890)
  cleaned = cleaned.replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '').trim();

  // Remove common US state abbreviations and cities at the end
  const locationPattern = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|VI)\s*$/i;
  cleaned = cleaned.replace(locationPattern, '').trim();

  // Remove trailing commas
  cleaned = cleaned.replace(/,\s*$/, '').trim();

  // Take only the first part before any remaining location indicators
  const parts = cleaned.split(/\s{2,}|,\s+[A-Z]{2}(?:\s|$)/);
  const companyName = parts[0].trim();

  if (!companyName || companyName.length < 2) {
    return null;
  }

  return companyName;
}

function shouldExcludePerson(companyName) {
  if (!companyName) return true;

  // Exclude Notary Everyday employees (they're the client/user)
  if (companyName.toLowerCase().includes('notary everyday')) {
    return true;
  }

  // These are vendors/service providers, not title companies
  const excludedKeywords = [
    // Already captured - these are our users
    'notary everyday',
  ];

  const normalized = companyName.toLowerCase();
  return excludedKeywords.some(keyword => normalized.includes(keyword));
}

class IndustryContactsProcessor {
  constructor() {
    this.results = {
      totalProvided: rawPeopleData.length,
      excluded: 0,
      alreadyExisted: 0,
      newlyCreated: 0,
      linked: 0,
      enriched: 0,
      companiesFound: 0,
      companiesCreated: 0,
      errors: [],
      excludedPeople: []
    };
  }

  async findOrCreateCompany(companyName, personData) {
    const normalizedName = normalizeCompanyName(companyName);
    
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
        normalizeCompanyName(existingCompany.name)
      );
      
      if (similarity >= 0.85) {
        console.log(`   🔗 Fuzzy matched "${companyName}" to existing "${existingCompany.name}" (${(similarity * 100).toFixed(1)}%)`);
        this.results.companiesFound++;
        return existingCompany;
      }
    }

    // Create new company
    console.log(`   🏢 Creating new company: "${companyName}"`);
    
    const newCompany = await prisma.companies.create({
      data: {
        workspaceId: WORKSPACE_ID,
        name: companyName,
        status: 'ACTIVE',
        priority: 'MEDIUM',
        industry: 'Title Insurance',
        country: 'United States',
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {
          createdFrom: 'industry_contacts_import',
          sourceData: 'ALTA_directory',
          createdAt: new Date().toISOString()
        }
      }
    });

    this.results.companiesCreated++;
    return newCompany;
  }

  async processPerson(personData) {
    try {
      // Parse company name from the mixed field
      const companyName = parseCompanyField(
        personData.company,
        personData.title,
        personData.email
      );

      // Check if we should exclude this person
      if (shouldExcludePerson(companyName)) {
        console.log(`   ⏭️  Excluding: ${personData.name} (works for ${companyName || 'excluded company'})`);
        this.results.excluded++;
        this.results.excludedPeople.push({
          name: personData.name,
          reason: 'Client company (Notary Everyday) - should not be in vendor database',
          company: companyName
        });
        return null;
      }

      if (!companyName) {
        console.log(`   ⚠️  Skipping ${personData.name} - could not parse company name from: "${personData.company}"`);
        this.results.errors.push({
          person: personData.name,
          error: 'Could not parse company name',
          rawCompany: personData.company
        });
        return null;
      }

      console.log(`\n👤 Processing: ${personData.name} (${companyName})`);

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
        if (!existingPerson.companyId && companyName) {
          const company = await this.findOrCreateCompany(companyName, personData);
          
          await prisma.people.update({
            where: { id: existingPerson.id },
            data: { 
              companyId: company.id,
              updatedAt: new Date()
            }
          });
          
          console.log(`   🔗 Linked to company: ${company.name}`);
          this.results.linked++;
        }

        return existingPerson;
      }

      // Create new person
      console.log(`   ➕ Creating new person`);
      
      // Find or create company
      const company = await this.findOrCreateCompany(companyName, personData);
      
      // Parse name
      const nameParts = personData.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const newPerson = await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          companyId: company.id,
          fullName: personData.name,
          firstName: firstName,
          lastName: lastName,
          email: personData.email,
          phone: personData.phone,
          jobTitle: personData.title,
          city: personData.city,
          state: personData.state,
          country: 'United States',
          status: 'PROSPECT',
          priority: 'MEDIUM',
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            importSource: 'industry_contacts_import',
            sourceDirectory: 'ALTA',
            imageUrl: personData.image_url,
            badges: personData.badges || [],
            originalData: personData,
            importedAt: new Date().toISOString()
          }
        }
      });

      console.log(`   ✅ Created and linked to ${company.name}`);
      this.results.newlyCreated++;
      this.results.linked++;

      // Enrich the person
      await this.enrichPerson(newPerson.id, personData, companyName);

      return newPerson;
    } catch (error) {
      console.error(`   ❌ Error processing ${personData.name}: ${error.message}`);
      this.results.errors.push({
        person: personData.name,
        error: error.message,
        email: personData.email
      });
      return null;
    }
  }

  async enrichPerson(personId, personData, companyName) {
    try {
      const enrichedData = {
        overview: {
          fullName: personData.name,
          title: personData.title,
          company: companyName,
          email: personData.email,
          phone: personData.phone,
          imageUrl: personData.image_url,
          badges: personData.badges || []
        },
        contact: {
          email: personData.email,
          phone: personData.phone
        },
        professional: {
          currentTitle: personData.title,
          currentCompany: companyName
        },
        enrichedAt: new Date().toISOString(),
        source: 'ALTA_directory_import'
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
    console.log('🚀 INDUSTRY CONTACTS BATCH PROCESSING');
    console.log('=' .repeat(60));
    console.log(`Processing ${rawPeopleData.length} people from ALTA directory`);
    console.log(`Target workspace: Notary Everyday\n`);

    for (const personData of rawPeopleData) {
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
    console.log(`   Excluded (Notary Everyday employees): ${this.results.excluded}`);
    console.log(`   Already existed: ${this.results.alreadyExisted}`);
    console.log(`   Newly created: ${this.results.newlyCreated}`);
    console.log(`   Total linked: ${this.results.linked}`);
    console.log(`   Total enriched: ${this.results.enriched}`);
    
    console.log(`\n🏢 COMPANY RESULTS:`);
    console.log(`   Companies found: ${this.results.companiesFound}`);
    console.log(`   Companies created: ${this.results.companiesCreated}`);

    if (this.results.excludedPeople.length > 0) {
      console.log(`\n⏭️  EXCLUDED PEOPLE (${this.results.excludedPeople.length}):`);
      this.results.excludedPeople.forEach(person => {
        console.log(`   - ${person.name}: ${person.reason}`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.results.errors.length}):`);
      this.results.errors.slice(0, 10).forEach(err => {
        console.log(`   - ${err.person}: ${err.error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }

    // Get final stats
    const finalStats = await this.getFinalStats();
    console.log(`\n📈 WORKSPACE FINAL STATS:`);
    console.log(`   Total people: ${finalStats.totalPeople}`);
    console.log(`   Linked people: ${finalStats.linkedPeople}`);
    console.log(`   Linkage rate: ${finalStats.linkageRate}%`);
    console.log(`   Total companies: ${finalStats.totalCompanies}`);

    // Save detailed results
    fs.writeFileSync(
      'industry-contacts-import-report.json',
      JSON.stringify(this.results, null, 2)
    );
    console.log(`\n💾 Detailed results saved to industry-contacts-import-report.json`);

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
  const processor = new IndustryContactsProcessor();
  await processor.processAll();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

